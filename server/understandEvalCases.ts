/** 30 aphasia-style utterances. A candidate "hits" if every `must` group has a match (regex, case-insensitive). */
export interface EvalCase {
  transcript: string; meaning: string; must: string[];
  now?: string; seen?: { label: string; pointedAt: boolean }[]; recent?: { who: 'person' | 'other'; text: string }[];
}
const D = '2026-11-15';
export const CASES: EvalCase[] = [
  { transcript: 'water… no… Ellie… phone… birthday', meaning: 'Call Ellie for her birthday', must: ['ellie', 'call|phone|ring', 'birthday'], seen: [{ label: 'cell phone', pointedAt: true }] },
  { transcript: 'the… the hot… black… cup', meaning: 'I want coffee', must: ['coffee'] },
  { transcript: 'pills… pills… um… eight', meaning: 'Time for / did I take my morning pills', must: ['pill|medic'], now: `${D}T08:05:00-08:00` },
  { transcript: 'bathroom… need… now', meaning: 'I need the bathroom', must: ['bathroom|toilet|restroom'] },
  { transcript: 'Giants… tonight… on… the box', meaning: 'Turn on the Giants game on TV', must: ['giants|game', 'tv|television|turn on|watch'], now: `${D}T18:50:00-08:00` },
  { transcript: 'cold… blanket… no… the… window', meaning: 'Close the window, it is cold', must: ['window', 'close|shut'] },
  { transcript: 'Maria… where… Maria', meaning: 'Where is Maria?', must: ['maria', 'where'] },
  { transcript: 'David… text… late', meaning: 'Text David / I will be late', must: ['david', 'text|message|late'] },
  { transcript: 'hurts… here… arm… right', meaning: 'My right arm hurts', must: ['arm', 'hurt|pain|sore|ache'] },
  { transcript: 'Biscuit… out… walk', meaning: 'Take Biscuit out for a walk', must: ['biscuit|dog', 'walk|out'] },
  { transcript: 'yes… no… no… yes', meaning: 'Yes', must: ['yes'], recent: [{ who: 'other', text: 'Do you want lunch now?' }], now: `${D}T12:30:00-08:00` },
  { transcript: 'fork… the… fork… write', meaning: 'I need a pen to write', must: ['pen|pencil|write'], seen: [{ label: 'pen', pointedAt: true }] },
  { transcript: 'tephone… tephone', meaning: 'Give me the telephone', must: ['phone'] },
  { transcript: 'tired… bed… sleep', meaning: 'I am tired, I want to go to bed', must: ['tired|bed|sleep|rest'] },
  { transcript: 'thank… thank… you… good', meaning: 'Thank you', must: ['thank'] },
  { transcript: 'love… Ellie… tell', meaning: 'Tell Ellie I love her', must: ['ellie', 'love'] },
  { transcript: 'garden… three… outside', meaning: 'Go for my walk in the garden', must: ['garden|outside|walk'], now: `${D}T15:00:00-08:00` },
  { transcript: 'eat… hungry… sandwich… no… soup', meaning: 'I am hungry, I want soup', must: ['soup'] },
  { transcript: 'glasses… where… can\'t… see', meaning: 'Where are my glasses?', must: ['glasses'] },
  { transcript: 'doctor… Patel… tomorrow… no', meaning: 'Is Dr. Patel coming / call Dr. Patel', must: ['patel|doctor|therap'] },
  { transcript: 'hot… too… hot… the… the… wind thing', meaning: 'It is too hot, turn on the fan', must: ['fan|air|cool'] },
  { transcript: 'remote… no… the… the… book', meaning: 'Hand me my book', must: ['book'], seen: [{ label: 'book', pointedAt: true }] },
  { transcript: 'water', meaning: 'I would like some water', must: ['water|drink'], seen: [{ label: 'cup', pointedAt: true }] },
  { transcript: 'that… that one… give', meaning: 'Hand me the remote', must: ['remote'], seen: [{ label: 'remote', pointedAt: true }] },
  { transcript: 'slow… slow… down… please', meaning: 'Please speak more slowly', must: ['slow'] },
  { transcript: 'car… keys… no… David… drive', meaning: 'David, can you drive me?', must: ['david', 'drive|ride|take me'] },
  { transcript: 'scared… head… again', meaning: 'I am scared it is happening again (stroke)', must: ['scared|afraid|worried|frighten'] },
  { transcript: 'happy… birthday… song… Ellie', meaning: 'Let\'s sing happy birthday to Ellie', must: ['ellie', 'birthday'] },
  { transcript: 'game… who… win… score', meaning: 'Who won the game / what is the score?', must: ['won|win|score'], recent: [{ who: 'other', text: 'The Giants played last night.' }] },
  { transcript: 'no… not… that… the… other… blue', meaning: 'Not that one, the blue one', must: ['blue'], recent: [{ who: 'other', text: 'Do you want the red sweater?' }] },
];
