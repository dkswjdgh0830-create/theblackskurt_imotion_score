(()=>{
// 부클릿 면 그리기. 면 하나 = 정사각 캔버스 하나. index.html의 3D 부클릿에도 그대로 텍스처로 쓸 수 있게 분리했다
// makeBook(DATA, S) → { pages: [(ctx, w)=>void, ...16], spreads: 8 }

const HUE={L:22,F:150,S:255,H:55,W:305}, CH={L:.20,F:.15,S:.16,H:.14,W:.15};
const TOPIC={L:'사랑',F:'사람들',S:'나 자신',H:'가족, 고향',W:'세상, 일상'};
const PAPER='#fbfaf6', INK='#2a2723', MUTE='#a39d93', VINYL='#ece6d8', LABEL='#f6f2ea';
const SERIF='"Gowun Batang",serif', SANS='"IBM Plex Sans KR","Malgun Gothic",sans-serif';
// 곡끼리 이어지는 말 (CLAUDE.md 1장)
const LINKS=[['Love Is All','피와 갈증 (King of Hurts)'],['난 아니에요','피와 갈증 (King of Hurts)'],['폭죽과 풍선들','Bollywood']];

function oklch(L,C,h,a=1){const A=C*Math.cos(h*Math.PI/180),B=C*Math.sin(h*Math.PI/180);
  const l=(L+.3963377774*A+.2158037573*B)**3,m=(L-.1055613458*A-.0638541728*B)**3,s=(L-.0894841775*A-1.291485548*B)**3;
  const c=[4.0767416621*l-3.3077115913*m+.2309699292*s,-1.2684380046*l+2.6097574011*m-.3413193965*s,-.0041960863*l-.7034186147*m+1.707614701*s]
   .map(x=>{x=Math.max(0,Math.min(1,x));return Math.round(255*(x<=.0031308?12.92*x:1.055*x**(1/2.4)-.055))});
  return `rgba(${c[0]},${c[1]},${c[2]},${a})`;}
const rnd=s=>{const x=Math.sin(s*12.9898)*43758.5453;return x-Math.floor(x)};

const ALBUMS=['TEAM BABY','THIRSTY','TEEN TROUBLES'];
// 예시 문장: 따로 고르지 않았으면 말하는 방식이 있는 첫 문장
function exampleIndex(song,S){if(S.sent>=0&&S.sent<song.n.length&&song.m[S.sent]!=='-')return S.sent;
  const i=song.m.findIndex(m=>m==='약속'||m==='몸'||m==='기억');return i>=0?i:song.m.findIndex(m=>m!=='-');}

function makeBook(DATA,S){
  const MAXN=Math.max(...DATA.flatMap(s=>s.n));
  const song=DATA.find(s=>s.t===S.song)||DATA[0], ei=exampleIndex(song,S);
  const ex={n:song.n[ei],tag:song.tag[ei],m:song.m[ei]};
  const byTitle=t=>DATA.find(s=>s.t===t);
  const album=a=>DATA.filter(s=>s.a===a).sort((x,y)=>x.tr-y.tr);

  // 색상=주제, 명도=태도, 채도=세기
  const col=(tag,a=1,dL=0)=>{const att=(+tag[1]-1)/4,it=(+tag[2]-1)/2;
    return oklch(S.lmin+(S.lmax-S.lmin)*att+dL,(.02+(CH[tag[0]]-.02)*(.35+.65*it))*S.chroma,HUE[tag[0]],a);};

  // 줄기 하나: 원점에서 +x로 len만큼. 결 = 말하는 방식
  function streak(c,len,thick,g,seed){const N=Math.max(24,len/3|0),top=[],bot=[];
    for(let i=0;i<=N;i++){const t=i/N;let h=thick/2*Math.sin(Math.PI*t)**S.taper;
      if(g.m==='몸')h*=Math.max(0,1+S.rough*(rnd(seed*131+i)-.5)*2);top.push([len*t,-h]);bot.push([len*t,h]);}
    c.beginPath();top.concat(bot.reverse()).forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();
    if(g.m==='기억'){c.save();c.shadowBlur=S.blur*thick/20;c.shadowColor=col(g.tag,.9);c.fillStyle=col(g.tag,.5);c.fill();c.restore();return;}
    c.fillStyle=col(g.tag);c.fill();
    if(g.m==='약속'&&S.gloss){c.beginPath();c.moveTo(len*.08,0);c.lineTo(len*.92,0);c.lineWidth=Math.max(1,thick*.12);c.lineCap='round';c.strokeStyle=col(g.tag,S.gloss,.18);c.stroke();}}

  // 판: 곡들을 12시부터 시계 방향으로. upto면 앞 문장 몇 개만
  function disc(c,cx,cy,R,songs,{upto=Infinity,marks=false}={}){
    c.save();c.translate(cx,cy);c.beginPath();c.arc(0,0,R,0,7);c.fillStyle=VINYL;c.fill();
    const sl=[],starts=[];songs.forEach((s,k)=>{if(k)for(let i=0;i<S.gap;i++)sl.push(null);starts.push([sl.length,s.tr]);
      s.n.forEach((n,i)=>sl.push(s.m[i]==='-'?null:{n,m:s.m[i],tag:s.tag[i]}));});
    const step=Math.PI*2/sl.length,r0=R*.36,rr=R*.95-r0;let k=0;
    sl.forEach((g,i)=>{if(!g||k++>=upto)return;c.save();c.rotate(-Math.PI/2+(i+.5)*step);c.translate(r0,0);
      streak(c,rr*(g.n/MAXN)**S.lenPow,Math.min(step*(r0+rr*.4)*S.width,R*.09),g,i);c.restore();});
    c.beginPath();c.arc(0,0,R*.3,0,7);c.fillStyle=LABEL;c.fill();
    if(marks)starts.forEach(([i,tr])=>{const th=-Math.PI/2+i*step;
      c.strokeStyle=INK;c.lineWidth=2;c.beginPath();c.moveTo(Math.cos(th)*R*1.02,Math.sin(th)*R*1.02);c.lineTo(Math.cos(th)*R*1.1,Math.sin(th)*R*1.1);c.stroke();
      text(c,String(tr),Math.cos(th)*R*1.18,Math.sin(th)*R*1.18+9,{size:26,align:'center'});});
    c.restore();}

  function text(c,s,x,y,{size=26,font=SANS,color=INK,align='left',weight=400,maxW}={}){
    c.font=`${weight} ${size}px ${font}`;if(maxW){const w=c.measureText(s).width;if(w>maxW)c.font=`${weight} ${size*maxW/w}px ${font}`;}
    c.fillStyle=color;c.textAlign=align;c.fillText(s,x,y);}
  // 글자 수만큼 빈 칸. 원문 대신
  function cells(c,x,y,n,cs,{fill=null}={}){for(let i=0;i<n;i++){c.strokeStyle=MUTE;c.lineWidth=1.5;
    if(fill){c.fillStyle=fill;c.fillRect(x+i*cs,y,cs,cs);}else c.strokeRect(x+i*cs+3,y+3,cs-6,cs-6);}}
  const arrow=(c,x,y,dir='down')=>text(c,dir==='down'?'↓':'→',x,y,{size:40,color:MUTE,align:'center'});
  // 줄 세운 줄기 + 왼쪽 이름
  function rows(c,w,items){const M=90,top=w/2-(items.length-1)*80;
    items.forEach(([label,g,on],i)=>{const y=top+i*160;text(c,label,M,y+9,{size:28,color:on?INK:MUTE,weight:on?500:400});
      c.save();c.translate(M+220,y);streak(c,w-M*2-220,64,g,i+7);c.restore();});}
  function grid(c,w,list,cols,name){const M=90,cw=(w-M*2)/cols,rowsN=Math.ceil(list.length/cols),ch=(w-M*2-60)/rowsN,R=Math.min(cw,ch-40)*.4;
    text(c,name,M,M+20,{size:34,font:SERIF,weight:700});
    list.forEach((s,i)=>{const cx=M+cw*(i%cols+.5),cy=M+80+ch*((i/cols|0)+.5)-16;disc(c,cx,cy,R,[s]);
      text(c,s.t,cx,cy+R+30,{size:19,color:INK,align:'center',maxW:cw-10});});}

  const P=[
    // 1 왼쪽: 예시 곡
    (c,w)=>{text(c,song.t,90,w*.45,{size:76,font:SERIF,weight:700,maxW:w-180});
      text(c,`${song.a}  ${song.tr}번 트랙`,90,w*.45+64,{size:28,color:MUTE});},
    // 1 오른쪽: 예시 문장 하나 = 글자 수 칸 + 태그
    (c,w)=>{const cs=Math.min(64,(w-180)/ex.n);cells(c,90,w*.3,ex.n,cs);text(c,`${ex.n}자`,90,w*.3+cs+50,{size:26,color:MUTE});
      const keys=[[ex.tag[0],'주제'],[ex.tag[1],'태도'],[ex.tag[2],'세기'],[ex.m,'말하는 방식']];
      keys.forEach(([v,l],i)=>{const x=90+i*190;text(c,v,x,w*.62,{size:i<3?84:50,font:SERIF,weight:700});text(c,l,x,w*.62+50,{size:24,color:MUTE});});},
    // 2 왼쪽: 칸 → 막대 → 줄기. 길이는 그대로
    (c,w)=>{const cs=Math.min(64,(w-180)/ex.n),L=ex.n*cs,y=[w*.22,w*.5,w*.78];
      cells(c,90,y[0]-cs/2,ex.n,cs);arrow(c,90+L/2,y[0]+cs+70);
      c.fillStyle='#cfc9bf';c.fillRect(90,y[1]-cs/4,L,cs/2);arrow(c,90+L/2,y[1]+cs+60);
      c.save();c.translate(90,y[2]);streak(c,L,70,ex,1);c.restore();},
    // 2 오른쪽: 색상 = 주제
    (c,w)=>rows(c,w,Object.keys(TOPIC).map(k=>[TOPIC[k],{m:'그외',tag:k+'43'},k===ex.tag[0]])),
    // 3 왼쪽: 명도 = 태도
    (c,w)=>rows(c,w,[1,2,3,4,5].map(a=>[a===1?'1 어두움':a===5?'5 밝음':String(a),{m:'그외',tag:ex.tag[0]+a+ex.tag[2]},String(a)===ex.tag[1]])),
    // 3 오른쪽: 채도 = 세기
    (c,w)=>rows(c,w,[1,2,3].map(i=>[i===1?'1 약함':i===3?'3 강함':'2',{m:'그외',tag:ex.tag[0]+ex.tag[1]+i},String(i)===ex.tag[2]])),
    // 4 왼쪽: 결 = 말하는 방식
    (c,w)=>rows(c,w,['약속','몸','기억','그외'].map(m=>[m,{m,tag:ex.tag},m===ex.m])),
    // 4 오른쪽: 문장이 하나씩 모여 한 바퀴
    (c,w)=>{const N=song.m.filter(m=>m!=='-').length,R=w*.13;[1,Math.ceil(N/2),N].forEach((k,i)=>{disc(c,w*(.2+i*.3),w/2,R,[song],{upto:k});if(i<2)arrow(c,w*(.35+i*.3),w/2+14,'right');});},
    // 5 왼쪽: 곡 사이 빈자리, 1번 트랙이 12시
    (c,w)=>{const L=album(song.a);disc(c,w/2,w/2,w*.32,L.slice(0,3),{marks:true});},
    // 5 오른쪽: 예시 곡 한 장
    (c,w)=>{disc(c,w/2,w*.46,w*.34,[song]);text(c,song.t,w/2,w*.9,{size:34,font:SERIF,weight:700,align:'center'});},
    // 6, 7 왼쪽: 곡별 데이터
    (c,w)=>grid(c,w,album('TEAM BABY'),4,'TEAM BABY'),
    (c,w)=>grid(c,w,album('THIRSTY'),4,'THIRSTY'),
    (c,w)=>grid(c,w,album('TEEN TROUBLES'),5,'TEEN TROUBLES'),
    // 7 오른쪽: 곡끼리 이어지는 말
    (c,w)=>{const R=w*.1;LINKS.forEach(([a,b],i)=>{const y=w*(.2+i*.3),A=byTitle(a),B=byTitle(b);
      disc(c,w*.27,y,R,[A]);arrow(c,w/2,y+14,'right');disc(c,w*.73,y,R,[B]);
      text(c,a,w*.27,y+R+36,{size:20,align:'center',maxW:w*.4});text(c,b,w*.73,y+R+36,{size:20,align:'center',maxW:w*.4});});},
    // 8 왼쪽: 해석 기준
    (c,w)=>{text(c,'가사 해석 기준',90,w*.7,{size:24,color:MUTE});
      text(c,'블로그 「진희의 서재」 검정치마 가사 분석',90,w*.7+44,{size:28});
      text(c,'가사 원문은 싣지 않았다',90,w*.7+88,{size:24,color:MUTE});},
    // 8 오른쪽: 뒤표지 안쪽
    ()=>{}];
  return {pages:P.map(fn=>(c,w)=>{c.fillStyle=PAPER;c.fillRect(0,0,w,w);fn(c,w);}),spreads:P.length/2};
}
window.Booklet={makeBook,ALBUMS,exampleIndex};
})();
