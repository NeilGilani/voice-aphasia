import json,subprocess,os
log=json.load(open('raw/aligned.json'))
def interp(key):
    pts=sorted({(e['t'],e[key]) for e in log if e[key] is not None})
    def f(t):
        for (a,va),(b,vb) in zip(pts,pts[1:]):
            if t<=b: return va+(t-a)*(vb-va)/(b-a)
        (a,va),(b,vb)=pts[-2],pts[-1]; return va+(t-a)*(vb-va)/(b-a)
    return f
VF,VE=interp('vf'),interp('ve')
T={ (e['ev'],k):e['t'] for k,e in enumerate(log)}
ev=lambda name,n=0:[e['t'] for e in log if e['ev']==name][n]
mont=[e['t'] for e in log if e['ev']=='montage']
S=[ # (label, t0, t1, speed, layout)
 ('home',2.6,12.7,1,'single'),
 ('read_open',12.9,ev('read_shoot'),1,'single'),
 ('read_think',ev('read_shoot'),ev('read_result'),3,'single'),
 ('read_result',ev('read_result'),37.5,1,'single'),
 ('call_connect',40.9,ev('frags_typed')-0.2,1,'call'),
 ('frags1',ev('frags_typed')-0.2,ev('thinking'),1,'call'),
 ('think1',ev('thinking'),ev('cards'),2,'call'),
 ('cards1_speak',ev('cards'),ev('spoken_done')+1.9,1,'call'),
 ('ellie_typing',ev('spoken_done')+1.9,ev('ellie_said',1),1.5,'call'),
 ('ellie_reply',ev('ellie_said',1),ev('frags_typed',1)-0.1,1,'call'),
 ('frags2',ev('frags_typed',1)-0.1,ev('thinking',1),1,'call'),
 ('think2',ev('thinking',1),ev('cards',1),2,'call'),
 ('cards2_speak_reply',ev('cards',1),ev('ellie_said',2)+2.6,1,'call'),
]+[(f'montage{k}',m+0.9,m+4.1,1,'single') for k,m in enumerate(mont)]
os.makedirs('clips',exist_ok=True)
X='-c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -r 30 -an'.split()
def run(a): subprocess.run(['ffmpeg','-loglevel','error','-y',*a],check=True)
def title(name,src,dur):
    run(['-loop','1','-t',str(dur),'-i',f'assets/{src}.png','-vf',f'fade=in:0:12,fade=out:st={dur-0.5}:d=0.5,format=yuv420p',*X,f'clips/{name}.mp4'])
plan=[('t1','t1',7.0),('t2','t2',7.0),('t3','t3',5.0)]
out=[]; cur=0.0; cues=[]
for n,s,d in plan: title(n,s,d); out.append(n); cues.append((n,cur,cur+d)); cur+=d
taps=[e for e in log if e['ev']=='tap']; audio=[]
for (lab,t0,t1,sp,lay) in S:
    od=(t1-t0)/sp; f0,f1=VF(t0),VF(t1); ff=od/(f1-f0)
    ph=f"[0:v]trim=start={f0:.3f}:end={f1:.3f},setpts=(PTS-STARTPTS)*{ff:.5f},fps=30,crop=390:836:0:8,scale=444:956:flags=lanczos[ph];[2:v]format=gray,scale=444:956[m];[ph][m]alphamerge[p]"
    if lay=='single':
        fc=ph+";[1:v][p]overlay=738:62:shortest=1,format=yuv420p"
        ins=['-i','raw/frank.webm','-loop','1','-i','assets/bg1.png','-loop','1','-i','assets/mask.png']
    else:
        e0,e1=VE(t0),VE(t1); fe=od/(e1-e0)
        fc=ph+f";[3:v]trim=start={e0:.3f}:end={e1:.3f},setpts=(PTS-STARTPTS)*{fe:.5f},fps=30,crop=860:532:210:8,scale=1150:712:flags=lanczos[el];[1:v][p]overlay=150:62:shortest=1[a];[a][el]overlay=680:182,format=yuv420p"
        ins=['-i','raw/frank.webm','-loop','1','-i','assets/bg2.png','-loop','1','-i','assets/mask.png','-i','raw/ellie.webm']
    run([*ins,'-filter_complex',fc,'-t',f'{od:.3f}',*X,f'clips/{lab}.mp4'])
    for k,tp in enumerate(taps):
        if t0<=tp['t']<t1 and sp==1: audio.append((k,cur+(tp['t']-t0)+0.4))
    out.append(lab); cues.append((lab,cur,cur+od)); cur+=od
title('t4','t4',8.0); out.append('t4'); cues.append(('t4',cur,cur+8)); cur+=8
open('clips/list.txt','w').write(''.join(f"file '{o}.mp4'\n" for o in out))
run(['-f','concat','-safe','0','-i','clips/list.txt','-c','copy','clips/video.mp4'])
# audio: silence + voice lines
ins=['-f','lavfi','-t',f'{cur:.3f}','-i','anullsrc=r=48000:cl=stereo']; fl=[]
for j,(k,at) in enumerate(audio):
    ins+=['-i',f'assets/voice{k}.audio']; fl.append(f"[{j+1}:a]aresample=48000,pan=stereo|c0=c0|c1=c0,adelay={int(at*1000)}|{int(at*1000)},volume=1.6[a{j}]")
mix=';'.join(fl)+';[0:a]'+''.join(f'[a{j}]' for j in range(len(audio)))+f'amix=inputs={len(audio)+1}:normalize=0:duration=first[out]'
run([*ins,'-filter_complex',mix,'-map','[out]','-c:a','aac','-b:a','192k','clips/audio.m4a'])
run(['-i','clips/video.mp4','-i','clips/audio.m4a','-c:v','copy','-c:a','copy','-shortest','-movflags','+faststart','voiceos-demo.mp4'])
json.dump({'cues':cues,'audio':[(taps[k]['text'],at,float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f'assets/voice{k}.audio'],capture_output=True,text=True).stdout)) for k,at in audio],'total':cur},open('cues.json','w'),indent=1)
print(cur)
