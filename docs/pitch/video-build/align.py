import json,sys
log=json.load(open('log.json'))
def first_times(fn):
    b=open(fn,'rb').read(); out={}
    for k,v in enumerate(b):
        i=round((v-16)/6)
        if 0<=i<len(log) and abs(v-(16+6*i))<=2 and i not in out:
            # require stable 2 frames
            if k+1<len(b) and abs(b[k+1]-v)<=2: out[i]=k/25
    return out
F=first_times('frank.mk'); E=first_times('ellie.mk')
for e in log: e['vf']=F.get(e['i']); e['ve']=E.get(e['i'])
json.dump(log,open('aligned.json','w'),indent=1)
for e in log: print(e['i'],e['ev'],e['t'],e['vf'],e['ve'])
