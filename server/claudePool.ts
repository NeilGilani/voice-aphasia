/**
 * Warm pool of headless `claude -p` processes (Claude subscription, no API key).
 * Each process is spawned ahead of time with stream-json input, so the ~3 s CLI startup
 * is paid before the request arrives. One process = one request (no context bleed).
 */
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { tmpdir } from 'node:os';

interface Warm { child: ChildProcessWithoutNullStreams; out: string; dead: boolean; born: number }
const pools = new Map<string, Warm[]>();
const SIZE = Number(process.env.CLAUDE_POOL ?? 4);
/** Send each request to this many warm processes and take the first to finish (cuts tail latency). */
const HEDGE = Number(process.env.CLAUDE_HEDGE ?? 2);
const MAX_AGE = 10 * 60_000;

function spawnWarm(model: string, system: string): Warm {
  const args = ['-p', '--input-format', 'stream-json', '--output-format', 'stream-json', '--verbose',
    '--include-partial-messages', '--model', model, '--effort', 'low', '--system-prompt', system, '--tools', '',
    '--strict-mcp-config', '--no-session-persistence', '--setting-sources', '', '--exclude-dynamic-system-prompt-sections'];
  const child = spawn('claude', args, { cwd: tmpdir(), env: { ...process.env, ANTHROPIC_API_KEY: '', MAX_THINKING_TOKENS: '0' } });
  const w: Warm = { child, out: '', dead: false, born: Date.now() };
  child.on('exit', () => { w.dead = true; });
  child.on('error', () => { w.dead = true; });
  child.stderr.on('data', () => {});
  return w;
}

function key(model: string, system: string) { return `${model}\u0000${system}`; }

function refill(model: string, system: string) {
  const k = key(model, system);
  const p = (pools.get(k) ?? []).filter((w) => !w.dead && Date.now() - w.born < MAX_AGE);
  while (p.length < SIZE) p.push(spawnWarm(model, system));
  pools.set(k, p);
}

/** Pre-spawn processes for a (model, system) pair. */
export function prewarm(model: string, system: string) { refill(model, system); }

/**
 * Run one prompt. `onText` receives the accumulated text as it streams.
 * Resolves with the full text.
 */
function askOne(model: string, system: string, prompt: string, onText?: (acc: string) => void, timeoutMs = 25_000): { done: Promise<string>; kill: () => void } {
  const k = key(model, system);
  refill(model, system);
  const p = pools.get(k)!;
  const w = p.shift()!;
  refill(model, system); // replace the one we took, in the background
  const done = new Promise<string>((resolve, reject) => {
    let buf = '', acc = '';
    const t = setTimeout(() => { w.child.kill(); reject(new Error('claude timeout')); }, timeoutMs);
    w.child.stdout.on('data', (d) => {
      buf += d;
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i); buf = buf.slice(i + 1);
        if (!line.trim()) continue;
        let ev: any; try { ev = JSON.parse(line); } catch { continue; }
        if (ev.type === 'stream_event' && ev.event?.type === 'content_block_delta' && ev.event.delta?.type === 'text_delta') {
          acc += ev.event.delta.text; onText?.(acc);
        } else if (ev.type === 'stream_event' && ev.event?.type === 'message_stop') {
          // Resolve as soon as the model stops; the CLI's own 'result' arrives ~2 s later.
          clearTimeout(t); w.child.stdin.end(); resolve(acc);
        } else if (ev.type === 'result') {
          clearTimeout(t); w.child.stdin.end();
          if (ev.is_error) reject(new Error(String(ev.result))); else resolve(String(ev.result ?? acc));
        }
      }
    });
    w.child.on('exit', (code) => { clearTimeout(t); if (!acc) reject(new Error(`claude exited ${code}`)); else resolve(acc); });
    w.child.stdin.write(JSON.stringify({ type: 'user', message: { role: 'user', content: prompt } }) + '\n');
  });
  return { done, kill: () => w.child.kill() };
}

/** Run one prompt (hedged). `onText` receives accumulated text from whichever process streams first. */
export async function ask(model: string, system: string, prompt: string, onText?: (acc: string) => void): Promise<string> {
  let leader = -1;
  const runs = Array.from({ length: Math.max(1, HEDGE) }, (_, i) =>
    askOne(model, system, prompt, (acc) => { if (leader < 0) leader = i; if (leader === i) onText?.(acc); }));
  try { return await Promise.any(runs.map((r) => r.done)); }
  finally { runs.forEach((r) => r.kill()); }
}

export function shutdown() { for (const p of pools.values()) for (const w of p) w.child.kill(); pools.clear(); }
