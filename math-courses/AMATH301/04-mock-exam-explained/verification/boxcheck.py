import re,sys,subprocess
texdir,pdf=sys.argv[1],sys.argv[2]
files=sys.argv[3:]
txt=subprocess.run(['pdftotext',pdf,'-'],capture_output=True,text=True).stdout
norm=lambda s: ' '.join(w for w in re.sub(r'[^a-z]+',' ',s.lower().replace('-\n','')).split() if len(w)>=3)
T=' '+norm(txt)+' '
envs='intuition|trap|reallife|howto|lesson|answer|remember|method|examnote|hint|problem|question|proofbox'
miss=0;tot=0
for f in files:
    s=open(f'{texdir}/{f}').read()
    for m in re.finditer(r'\\begin\{('+envs+r')\}(.*?)\\end\{\1\}',s,re.S):
        body=m.group(2)
        body=re.sub(r'\$[^$]*\$|\\\[.*?\\\]|\\begin\{(center|tikzpicture|enumerate|itemize|tabular)\}|\\end\{\w+\}','  ',body,flags=re.S)
        body=re.sub(r'\\[a-zA-Z]+\*?(\[[^\]]*\])?','  ',body)
        runs=re.findall(r'((?:[A-Za-z]{2,}[ ,.;:]+){4,}[A-Za-z]{2,})',body)
        if not runs: continue
        frag=' '.join(norm(runs[-1]).split()[-4:])
        tot+=1
        if ' '+frag+' ' not in T:
            miss+=1; print('MISSING?',f,m.group(1),'|',frag)
print('checked',tot,'missing',miss)
