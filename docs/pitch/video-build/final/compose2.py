import json,subprocess,os,glob
log=json.load(open('raw/aligned.json')); D=json.load(open('n/dur.json'))
FR=float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0','n/frank.wav'],capture_output=True,text=True).stdout)
pts=sorted({(e['t'],e['vf']) for e in log if e['vf'] is not None})
def VF(t):
    for (a,va),(b,vb) in zip(pts,pts[1:]):
        if t<=b: return va+(t-a)*(vb-va)/(b-a)
    (a,va),(b,vb)=pts[-2],pts[-1]; return va+(t-a)*(vb-va)/(b-a)
E=lambda ev,n=0:[e['t'] for e in log if e['ev']==ev][n]
os.makedirs('c',exist_ok=True)
X='-c:v libx264 -preset medium -crf 17 -pix_fmt yuv420p -r 30 -an'.split()
def run(a): subprocess.run(['ffmpeg','-loglevel','error','-y',*a],check=True)
clips=[]; cur=0.0; aud=[]; cues=[]
def still(name,png,dur,fade_in=True,fade_out=True):
    global cur
    vf='format=yuv420p'+(',fade=in:0:15' if fade_in else '')+(f',fade=out:st={dur-0.5}:d=0.5' if fade_out else '')
    run(['-loop','1','-t',f'{dur:.3f}','-i',png,'-vf',vf,*X,f'c/{name}.mp4']); clips.append(name); cues.append((name,cur,cur+dur)); cur+=dur
def app(name,bg,t0,t1,sp=1):
    global cur
    od=(t1-t0)/sp; f0,f1=VF(t0),VF(t1); ff=od/(f1-f0)
    fc=f"[0:v]trim=start={f0:.3f}:end={f1:.3f},setpts=(PTS-STARTPTS)*{ff:.5f},fps=30,crop=584:1254:0:12,scale=461:1000:flags=lanczos[ph];[2:v]format=gray[m];[ph][m]alphamerge[p];[1:v][p]overlay=380:40:shortest=1,format=yuv420p"
    run(['-i','raw/frank.webm','-loop','1','-i',f's/{bg}.png','-loop','1','-i','s/mask.png','-filter_complex',fc,'-t',f'{od:.3f}',*X,f'c/{name}.mp4'])
    clips.append(name); cues.append((name,cur,cur+od)); s=cur; cur+=od; return s
# 1 title
aud.append(('n1',cur+0.8)); still('s1','s/s1.png',0.8+D['n1']+1.6)
aud.append(('n2',cur+0.7)); still('s2','s/s2.png',0.7+D['n2']+1.6)
# 3 dictation typing: 27 frames over 4.2s then hold
frames=sorted(glob.glob('s/d*.png')); step=4.2/len(frames)
open('c/dict.txt','w').write(''.join(f"file '../{f}'\nduration {step:.4f}\n" for f in frames)+f"file '../{frames[-1]}'\n")
n3=cur+1.6; dd=max(4.2+0.3, 1.6+D['n3']+1.4)
run(['-f','concat','-safe','0','-i','c/dict.txt','-vf',f'fps=30,tpad=stop_mode=clone:stop_duration=30,fade=in:0:12,fade=out:st={dd-0.5}:d=0.5,format=yuv420p','-t',f'{dd:.3f}',*X,'c/dict.mp4'])
clips.append('dict'); cues.append(('dict',cur,cur+dd)); aud.append(('n3',n3)); cur+=dd
# 4 app
app('a1','p1',E('phone')+0.2,E('dial')-0.4)
app('a2','p1',E('dial'),E('ellie_said'))
app('a3','p1',E('ellie_said'),E('ellie_read'))
app('b1','p2',E('thinking',1)-0.1,E('cards',1),3)
s=app('b2','p3',E('cards',1),E('tap')); aud.append(('n4',s+(E('highlight')-E('cards',1))+0.4))
s=app('c1','p4',E('tap'),E('tap')+0.35+FR+2.2); aud.append(('frank',s+0.35))
aud.append(('n5',cur+0.9)); still('end','s/end.png',0.9+D['n5']+2.5,fade_out=True)
open('c/list.txt','w').write(''.join(f"file '{c}.mp4'\n" for c in clips))
run(['-f','concat','-safe','0','-i','c/list.txt','-c','copy','c/video.mp4'])
ins=['-f','lavfi','-t',f'{cur:.3f}','-i','anullsrc=r=48000:cl=stereo']; fl=[]
for j,(k,at) in enumerate(aud):
    ins+=['-i',f'n/{k}.wav']; vol=1.7 if k=='frank' else 1.25
    fl.append(f"[{j+1}:a]aresample=48000,pan=stereo|c0=c0|c1=c0,volume={vol},adelay={int(at*1000)}|{int(at*1000)}[a{j}]")
mix=';'.join(fl)+';[0:a]'+''.join(f'[a{j}]' for j in range(len(aud)))+f'amix=inputs={len(aud)+1}:normalize=0:duration=first,alimiter=limit=0.95[out]'
run([*ins,'-filter_complex',mix,'-map','[out]','-c:a','aac','-b:a','192k','c/audio.m4a'])
run(['-i','c/video.mp4','-i','c/audio.m4a','-c','copy','-shortest','-movflags','+faststart','voiceos-final.mp4'])
dur={'frank':FR,**D}
json.dump({'cues':cues,'audio':[(k,at,at+dur[k]) for k,at in aud],'total':cur},open('cues.json','w'),indent=1)
f=lambda s:'%d:%04.1f'%(s//60,s%60)
for n,a,b in cues: print('V',n,f(a),f(b))
for k,a in aud: print('A',k,f(a),f(a+dur[k]))
