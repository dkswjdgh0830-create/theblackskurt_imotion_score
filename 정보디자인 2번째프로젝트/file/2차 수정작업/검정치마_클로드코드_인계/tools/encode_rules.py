# 3집 40곡 자동 인코딩. 결과에는 가사를 넣지 않음 (줄 수, 어절 번호, 태그만)
import json,re
SP='/tmp/claude-0/-home-claude/2bee9341-143c-5474-a5f2-dee98faf84e9/scratchpad/'
U={x['t']:x for x in json.load(open(SP+'units.json'))}
T=json.load(open('/mnt/user-data/outputs/검정치마_클로드코드_인계/data/3집_문장태그.json'))
EMPH=[r'한\s*번도',r'절대로?',r'항상',r'언제나',r'영원히',r'너무',r'훨씬',r'정말',r'진짜',r'제일',r'가장',r'완전',r'끝까지',r'평생',r'so much',r'so many',r'too much',r'forever',r'always',r'never',r'\bever\b',r'really',r'so bad']
EMO=['사랑','좋아','좋은','싫','미워','미운','그리','보고 싶','보고싶','외로','쓸쓸','슬프','슬퍼','슬픈','슬픔','아파','아프','아픈','아픔','울어','울고','울지','우는','울던','눈물','웃어','웃는','웃음','웃던','미안','고마','무서','두려','겁','화나','행복','설레','질투','원해','미쳐','미친','상처','아름다','예뻐','예쁜','이뻐','이쁜','귀여','반가','기뻐','기쁜','지겨','괴로','힘들','아쉬','후회','그립','떨려','두근','외롭','갈증','목말','애타','간절','혼자']
EMO_EN=['love','loving','loved','hate','miss','want','need','cry','crying','hurt','hurts','happy','sad','lonely','sorry','afraid','scared','care','beautiful','pretty','crazy','adore','feel','feeling','thirsty','lonesome','fear']
AUX={'않아','않을','않은','않고','않게','없어','없는','없이','못해','못할','말아','말자','버려','줘','봐','있어','있는','않았어','없었어'}
VOL=re.compile(r'(ㄹ게|할게|을게|줘|주세요|자$|래$|겠어|겠지|거야$|할래|갈래|볼래|올래)$')
FIN=re.compile(r'(어|아|해|야|지|다|요|네|래|자|줘|까|니|나|라|죠|와|워|돼|봐|여|오|군|구나|걸|데|어요|에요|예요|거야|잖아|겠지|할래|던가)$')
CONN=re.compile(r'(고|서|면|도|며|니까|는데|지만|려고|도록|듯이|처럼|보다|에게|한테|에서|으로|로|를|을|이|가|은|는|의|와|과|엔|에)$')
def isemo(w):
    lw=w.lower().strip(',.!?\'"')
    if re.fullmatch(r'[a-z\']+',lw): return lw in EMO_EN
    return any(s in w for s in EMO)
def enc_line(line,has_emph):
    ws=line.split()
    box=[False]*len(ws)
    for i,w in enumerate(ws):
        if isemo(w): box[i]=True
    PR={'i','you','we','they','he','she','it',"i'm","you're","we're","they're","i'll","you'll","i've","i'd","she's","he's",'u','ya'}
    AX={"don't","can't","won't","didn't","do","did","will","can","could","would","should","gotta","gonna","wanna","just","never","always","still","really","must","might","ain't","never","'ll"}
    for i,w in enumerate(ws[:-1]):
        if w.lower().strip(',.!?') in PR:
            j=i+1
            while j<len(ws)-1 and ws[j].lower().strip(',.!?') in AX: box[j]=True; j+=1
            if re.fullmatch(r"[A-Za-z']+",ws[j].strip(',.!?')) and ws[j].lower().strip(',.!?') not in PR: box[j]=True
            break
    last=len(ws)-1
    while last>0 and ws[last].lower().strip(',.!?~') in {'oh','yeah','ooh','baby','woo','oh-oh','la','na','hey','ah'}: last-=1
    if ws and last>=0 and not re.fullmatch(r'[A-Za-z\'",.!?]+',ws[last]):
        st=last
        if re.sub(r'요$','',ws[last].strip(',.!?')) in AUX and last>0: st=last-1
        if st>0 and ws[st-1] in {'못','안','잘','다','더'}: st-=1
        lw=ws[last].strip(',.!?~…"\'')
        if has_emph or VOL.search(lw) or FIN.search(lw):
            for i in range(st,last+1): box[i]=True
    r=[];i=0
    while i<len(ws):
        if box[i]:
            j=i
            while j+1<len(ws) and box[j+1]: j+=1
            r.append([i,j]);i=j+1
        else: i+=1
    return r
out=[]
for s in T:
    u=U[s['t']];units=[]
    for k,lines in enumerate(u['U']):
        txt=' '.join(lines)
        e=sum(len(re.findall(p,txt,flags=re.I)) for p in EMPH)
        tg=s['tag'][k]
        units.append({'k':tg[0],'a':int(tg[1]),'e':min(e,2),'n':len(lines),'b':[enc_line(l,bool(sum(len(re.findall(p,l,flags=re.I)) for p in EMPH))) for l in lines]})
    out.append({'t':s['t'],'al':s['a'],'tr':s['tr'],'u':units})
json.dump(out,open('enc.json','w'),ensure_ascii=False)
# 통계
import collections
for al in ['TEAM BABY','THIRSTY','TEEN TROUBLES']:
    S=[x for x in out if x['al']==al];uu=[v for x in S for v in x['u']]
    nb=sum(len(r) for v in uu for l in v['b'] for r in [l]); 
    print(al,len(S),'units',len(uu),'boxes',sum(len(l) for v in uu for l in v['b']),'avg a',round(sum(v['a'] for v in uu)/len(uu),2),'e dist',collections.Counter(v['e'] for v in uu),'topics',collections.Counter(v['k'] for v in uu))
