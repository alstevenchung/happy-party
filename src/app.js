'use strict';
(function(){
const $=s=>document.querySelector(s);
/* 平板：擋掉連點兩下放大、雙指縮放頁面、長按選單 */
['gesturestart','gesturechange','gestureend','dblclick','contextmenu'].forEach(ev=>document.addEventListener(ev,e=>e.preventDefault(),{passive:false}));
let lastTE=0;document.addEventListener('touchend',e=>{const n=Date.now();if(n-lastTE<350&&!(e.target&&e.target.closest&&e.target.closest('#bPunch,#bCharge,#joy')))e.preventDefault();lastTE=n;},{passive:false});
document.addEventListener('touchmove',e=>{if(e.touches.length>1)e.preventDefault();},{passive:false});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const canvas=$('#c');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
const PHONE=Math.min(screen.width||9999,screen.height||9999)<=480||Math.min(innerWidth,innerHeight)<=480;
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,PHONE?1.8:2));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMapping=THREE.NoToneMapping;renderer.toneMappingExposure=1.0;
const scene=new THREE.Scene();scene.background=new THREE.Color('#bfe3ef');
function addLights(sc,k){k=k||1;sc.add(new THREE.HemisphereLight(0xfff6ea,0xb09a86,0.62*k));const d=new THREE.DirectionalLight(0xfff0dc,0.55*k);d.position.set(3,6,5);sc.add(d);return d;}
const sun=addLights(scene);
sun.castShadow=true;sun.shadow.mapSize.set(PHONE?512:1024,PHONE?512:1024);{const sc2=sun.shadow.camera;sc2.left=-9;sc2.right=9;sc2.top=9;sc2.bottom=-9;sc2.near=1;sc2.far=40;}
sun.shadow.bias=-0.0006;sun.shadow.normalBias=0.04;scene.add(sun.target);
const camera=new THREE.PerspectiveCamera(40,1,0.1,100);

/* ---------- 狀態 ---------- */
const SAVE='acdress_v1';
const EMPTY_OUT=()=>({top:null,bottom:null,dress:null,socks:null,shoes:null,hat:null,face:null,back:null});
function mkItem(slot,id,c1,c2){const it=findItem(slot,id);return {id,c1:c1||it.c1,c2:c2||it.c2};}
let cfg=Object.assign({},DEFAULT_CFG),outfit=EMPTY_OUT(),mode='create',seenHint=false;
outfit.top=mkItem('top','tee');outfit.bottom=mkItem('bottom','shorts');outfit.shoes=mkItem('shoes','sneaker');
let savedFight=null,hasSave=false;
try{
  const s=JSON.parse(localStorage.getItem(SAVE));
  if(s&&s.cfg){cfg=Object.assign(cfg,s.cfg);outfit=Object.assign(EMPTY_OUT(),s.outfit);mode=s.mode||'room';seenHint=!!s.seen;savedFight=s.fight||null;hasSave=true;}
}catch(e){}
function save(){try{localStorage.setItem(SAVE,JSON.stringify({cfg,outfit,mode,seen:seenHint,
  fight:{wave:F.wave,upN:F.upN,xp:F.xp,xpNeed:F.xpNeed,sk:F.sk,bossN:F.bossN,bossWave:F.bossWave,kills:F.kills,score:F.score,best:F.best}}));hasSave=true;}catch(e){}}

/* ---------- 場景 ---------- */
const room=buildHouse(),stage=buildStage();scene.add(room.group,stage.group);
room.group.traverse(o=>{if(o.isMesh&&!(o.material&&o.material.transparent)){if(o.geometry.type!=='PlaneGeometry')o.castShadow=true;o.receiveShadow=true;}});
const me=new Character();scene.add(me.root);
const shadow=new THREE.Mesh(new THREE.PlaneGeometry(1.2,1.2),new THREE.MeshBasicMaterial({transparent:true,depthWrite:false,map:canvasTex(64,64,(g,w,h)=>{const r=g.createRadialGradient(32,32,2,32,32,30);r.addColorStop(0,'rgba(0,0,0,.35)');r.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=r;g.fillRect(0,0,w,h);})}));
shadow.rotation.x=-PI/2;shadow.position.y=0.02;scene.add(shadow);
const marker=new THREE.Mesh(new THREE.RingGeometry(0.22,0.3,24),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.9,side:2}));
marker.rotation.x=-PI/2;marker.position.y=0.03;marker.visible=false;scene.add(marker);

const ptex=[0,1,2,3,4,5,6,7,8,9].map(i=>canvasTex(64,64,g=>{g.fillStyle='#fff';
  if(i===0)starPath(g,32,34,28);else if(i===1)heartPath(g,32,30,15);
  else if(i===3){g.font='bold 54px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('Z',32,36);}
  else if(i===4){g.strokeStyle='#fff';g.lineWidth=4;g.beginPath();g.arc(32,32,24,0,7);g.stroke();g.globalAlpha=0.25;g.fill();}
  else if(i===8){const gr=g.createLinearGradient(0,64,0,0);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(0.45,'rgba(255,255,255,0.95)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(25,0,14,64);}
  else if(i===9){g.beginPath();g.moveTo(32,2);g.quadraticCurveTo(41,30,37,58);g.lineTo(27,58);g.quadraticCurveTo(23,30,32,2);g.fill();}
  else if(i===7){const gr=g.createRadialGradient(32,40,2,32,36,30);gr.addColorStop(0,'#fff6b0');gr.addColorStop(0.4,'#ffb030');gr.addColorStop(1,'rgba(255,60,10,0)');g.fillStyle=gr;g.beginPath();g.moveTo(32,2);g.bezierCurveTo(52,24,56,44,32,60);g.bezierCurveTo(8,44,12,24,32,2);g.fill();}
  else if(i===6){g.strokeStyle='#fff';g.lineWidth=5;g.lineCap='round';for(let k=0;k<3;k++){const an=k*PI/3;g.beginPath();g.moveTo(32-Math.cos(an)*26,32-Math.sin(an)*26);g.lineTo(32+Math.cos(an)*26,32+Math.sin(an)*26);g.stroke();}}
  else if(i===5){g.beginPath();g.arc(32,36,16,0,7);g.fill();g.beginPath();g.moveTo(32,6);g.lineTo(20,32);g.lineTo(44,32);g.fill();}
  else{g.beginPath();g.moveTo(32,2);g.quadraticCurveTo(32,32,62,32);g.quadraticCurveTo(32,32,32,62);g.quadraticCurveTo(32,32,2,32);g.quadraticCurveTo(32,32,32,2);g.fill();}}));
const parts=[];
for(let i=0;i<200;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:ptex[0],transparent:true,depthWrite:false}));s.visible=false;scene.add(s);parts.push({s,v:new THREE.Vector3(),life:9,max:1,size:0.2});}
const FXPOS={hat:[0,1.95,0],face:[0,1.38,0.45],top:[0,0.75,0.25],bottom:[0,0.45,0.2],dress:[0,0.65,0.2],shoes:[0,0.1,0.1],socks:[0,0.25,0.1],back:[0,0.8,-0.35],hair:[0,1.85,0],body:[0,0.9,0.1]};
function burst(key,cols,n){
  const p=FXPOS[key]||FXPOS.body,wp=me.root.localToWorld(new THREE.Vector3(p[0],p[1],p[2]));let c=0;
  for(const q of parts){
    if(q.life<q.max)continue;if(c++>=n)break;
    q.s.position.copy(wp).add(new THREE.Vector3((Math.random()-0.5)*0.2,(Math.random()-0.5)*0.2,(Math.random()-0.5)*0.2));
    q.v.set((Math.random()-0.5)*2.6,1+Math.random()*2.4,(Math.random()-0.5)*2.6);
    q.life=0;q.g=3.2;q.grow=0.4;q.max=0.7+Math.random()*0.6;q.size=0.14+Math.random()*0.16;
    const m=q.s.material;m.map=ptex[(Math.random()*3)|0];m.color.set(cols[(Math.random()*cols.length)|0]);m.needsUpdate=true;q.s.visible=true;
  }
  popT=1;
}
function emit(x,y,z,vx,vy,vz,tex,col,life,size,g,grow){
  for(const q of parts){
    if(q.life<q.max)continue;
    q.s.position.set(x,y,z);q.v.set(vx,vy,vz);q.life=0;q.max=life;q.size=size;q.g=g;q.grow=grow===undefined?0.4:grow;
    const m=q.s.material;m.map=ptex[tex];m.color.set(col);m.needsUpdate=true;q.s.visible=true;return;
  }
}
function updParts(dt){
  for(const q of parts){
    if(q.life>=q.max){q.s.visible=false;continue;}
    q.life+=dt;q.v.y-=(q.g===undefined?3.2:q.g)*dt;q.s.position.addScaledVector(q.v,dt);
    const k=Math.min(1,q.life/q.max);q.s.scale.setScalar(q.size*(1+k*(q.grow===undefined?0.4:q.grow))*Math.max(0,1-k*k));q.s.material.opacity=1-k*k;q.s.material.rotation+=dt*3;
  }
}
const SPARK=['#ffffff','#ffd966','#ff9ec0','#9ee0ff'];
const FOCUS={sets:{y:0.95,d:6.6,p:0.45},top:{y:1.0,d:5.2,p:0.4},bottom:{y:0.5,d:5.2,p:0.4},dress:{y:0.9,d:6.2,p:0.4},shoes:{y:0.2,d:3.4,p:0.4},socks:{y:0.35,d:4.0,p:0.4},hat:{y:1.55,d:3.7,p:0.25},face:{y:1.38,d:3.3,p:0.2},back:{y:0.9,d:5.6,p:0.35,back:1}};
function roomFocus(){if(mode!=='room'||!panelOpen)return null;return FOCUS[ROOM_TABS[tabIdx].id]||null;}
const pos=new THREE.Vector3(0,0,1.6);
const AREAS=room.areas,DOORS=[-18,-6,6,18,28,38,58],RNAMES=['商店街','客廳','更衣室','房間','廁所','廚房','公園','沙灘'],RCENT=[[-30,1.5],[-12,1],[0,1.6],[12,1],[23,1],[33,1],[48,0.8],[66,0.8]];
function zoneOfX(x){return x<-18?0:x<-6?1:x<6?2:x<18?3:x<28?4:x<38?5:x<58?6:7;}
const zoneObjs=room.group.children.map(c=>{
  const x=c.position.x,nd=DOORS.find(d=>Math.abs(x-d)<1.3);
  return {c,zs:nd!==undefined?[zoneOfX(nd-1),zoneOfX(nd+1)]:[zoneOfX(x)]};
});
function zoneBGColor(z){return z===0?'#9fd4ec':(z>=1&&z<=5?'#0d0b12':'#bfe3ef');}
function applyZone(z){zoneObjs.forEach(o=>{o.c.visible=o.zs.indexOf(z)>=0;});scene.background.set(zoneBGColor(z));}
let wps=[],curRoom=-1,act=null,faceTo=null,actY=0,nearHot=null,nearNpc=null,actKey='';
const walkable=(x,z)=>AREAS.some(a=>x>=a.x0&&x<=a.x1&&z>=a.z0&&z<=a.z1);
(function(){
  const bx=new THREE.Box3();
  room.group.updateMatrixWorld(true);
  for(const ch of room.group.children){
    let hasL=false;
    try{
      ch.traverse(o2=>{if(o2.isLight)hasL=true;});
      if(!hasL){
      bx.setFromObject(ch);
      if(isFinite(bx.min.x)){
        const w=bx.max.x-bx.min.x,cx=(bx.min.x+bx.max.x)/2;
        ch.userData.zr=[bx.min.x,bx.max.x];
        const h2=bx.max.y-bx.min.y,dz2=bx.max.z-bx.min.z,r2=Math.hypot(w,h2,dz2)/2;
        if(w<30&&r2<4.5&&h2>0.55)ch.userData.oc={x:cx,y:(bx.min.y+bx.max.y)/2,z:(bx.min.z+bx.max.z)/2,r:r2};
      }
      }
    }catch(e){}
  }
  if(/zonedbg/.test(location.hash)){const h={};for(const ch of room.group.children){const z=ch.userData.zone;h[z]=(h[z]||0)+1;}document.title='ZB '+JSON.stringify(h)+' n='+room.group.children.length;}
})();
function fadeObj(o,fv){
  o.traverse(m2=>{
    if(m2.isMesh&&m2.material){
      if(!m2.userData.fm){
        m2.userData.fm=1;
        m2.material=Array.isArray(m2.material)?m2.material.map(x=>x.clone()):m2.material.clone();
        const ms=Array.isArray(m2.material)?m2.material:[m2.material];
        ms.forEach(x=>{x.userData.bOp=x.opacity;});
      }
      const ms=Array.isArray(m2.material)?m2.material:[m2.material];
      ms.forEach(x=>{x.transparent=fv<0.98||x.userData.bOp<1;x.opacity=x.userData.bOp*fv;x.depthWrite=fv>0.6;});
    }
  });
}
function propOcclude(dt){
  if(mode!=='room')return;
  for(const ch of room.group.children){
    const oc=ch.userData.oc;
    if(!oc||!ch.visible)continue;
    const occ=occludesLine(oc.x,oc.y,oc.z,Math.min(oc.r*0.7+0.4,2.4));
    if(ch.userData.fA===undefined)ch.userData.fA=1;
    if(!occ&&ch.userData.fA>0.985)continue;
    const tf=occ?0.22:1;
    ch.userData.fA+=(tf-ch.userData.fA)*Math.min(1,dt*10);
    fadeObj(ch,ch.userData.fA);
  }
}
let lastZV=-2;
const ZCLIP=[new THREE.Plane(new THREE.Vector3(1,0,0),0),new THREE.Plane(new THREE.Vector3(-1,0,0),0)];
function applyZoneVis(){
  const cr=(mode==='room')?curRoom:-99;
  if(cr===lastZV)return;lastZV=cr;
  const lo=(cr>0?DOORS[cr-1]:-1e9)-0.3,hi=(cr<7?DOORS[cr]:1e9)+0.3;
  if(cr===-99){renderer.clippingPlanes=[];}
  else{ZCLIP[0].constant=-(lo-0.9);ZCLIP[1].constant=hi+0.9;renderer.clippingPlanes=ZCLIP;}
  let nv=0;
  for(const ch of room.group.children){
    const zr=ch.userData.zr;
    if(!zr)continue;
    ch.visible=(cr===-99)||(zr[1]>lo&&zr[0]<hi);
    if(ch.visible)nv++;
  }
  if(/zonedbg/.test(HASH))document.title='ZV cr='+cr+' mode='+mode+' vis='+nv;
}
function roomOf(x,z){for(let i=0;i<8;i++){const a=AREAS[i];if(x>=a.x0&&x<=a.x1&&z>=a.z0&&z<=a.z1)return i;}
  return x<-18?0:x<-6?1:x<6?2:x<18?3:x<28?4:x<38?5:x<58?6:7;}
let camPitch=0.62,createPitch=0.08,popT=0,stepAcc=0;
let face=0,createYaw=0,camYaw=0,camZoom=1,target=null,emote=null,moveAmt=0,stuck=0;
let panelOpen=true;

/* ---------- 縮圖渲染 ---------- */
const TS=160;
const tr=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});tr.setPixelRatio(1);tr.setSize(TS,TS);
const tScene=new THREE.Scene();addLights(tScene,1.2);
const tCam=new THREE.PerspectiveCamera(30,1,0.1,50);
const tChar=new Character();tScene.add(tChar.root);
const PRE={face:[0,1.4,2.0,1.38],head:[0,1.43,2.4,1.38],headw:[0,1.34,3.2,1.34],body:[0,1.0,5.2,0.95],feet:[0,0.25,2.5,0.2],legs:[0,0.35,4.0,0.35]};
function renderThumb(kind,c,o,rotY){
  tChar.update(c,o);tChar.tick(0,0,0,null,0);tChar.root.rotation.y=rotY||0;
  const p=PRE[kind];tCam.position.set(p[0],p[1]+0.05,p[2]);tCam.lookAt(p[0],p[3],0);
  tr.render(tScene,tCam);return tr.domElement.toDataURL('image/png');
}
const thumbCache=new Map(),thumbIds=new Map();let thumbQ=[],pumping=false;
function thumbEl(key,job){
  let id=thumbIds.get(key);if(!id){id=thumbIds.size+1;thumbIds.set(key,id);}
  const img=document.createElement('img');img.dataset.t=id;img.alt='';img.draggable=false;
  if(thumbCache.has(key))img.src=thumbCache.get(key);else{thumbQ.push({key,id,job});pump();}
  return img;
}
function pump(){
  if(pumping)return;pumping=true;
  requestAnimationFrame(function run(){
    let n=0;
    while(thumbQ.length&&n<3){
      const q=thumbQ.shift();if(thumbCache.has(q.key))continue;
      const url=q.job();thumbCache.set(q.key,url);n++;
      document.querySelectorAll('img[data-t="'+q.id+'"]').forEach(im=>im.src=url);
    }
    if(thumbCache.size>700){const ks=[...thumbCache.keys()].slice(0,300);ks.forEach(k=>thumbCache.delete(k));}
    if(thumbQ.length)requestAnimationFrame(run);else pumping=false;
  });
}

/* ---------- 面板定義 ---------- */
const RG=(key,label,l,r,lo,hi,step)=>({type:'range',key,label,l,r,lo,hi,step:step||0.01,def:DEFAULT_CFG[key]});
const mkOpts=(key,names,thumb,title)=>({type:'opts',title,key,thumb,opts:names.map((n,i)=>({v:i,n}))});
const CREATE_TABS=[
  {id:'basic',ic:'🧑',t:'基本',cam:'body',secs:()=>[
    {type:'opts',title:'性別',key:'sex',opts:[{v:'f',n:'女生 ♀'},{v:'m',n:'男生 ♂'}]},
    {type:'pal',title:'膚色',key:'skin',pal:SKIN},
    {type:'sep',title:'身體'},
    RG('height','身高','矮','高',0.8,1.25),RG('chest','胸圍','小','大',0.8,1.3),RG('waist','腰圍','細','粗',0.75,1.3),RG('legs','腿長','短','長',0.8,1.3)]},
  {id:'face',ic:'🙂',t:'臉型',cam:'head',secs:()=>[mkOpts('face',FACE_N,'head'),{type:'sep',title:'微調臉型'},RG('faceW','臉寬','瘦','胖',0.85,1.22),RG('faceH','臉長','短','長',0.85,1.2),RG('headSize','頭大小','小','大',0.8,1.2),RG('featY','五官高低','高','低',-0.12,0.14,0.005),RG('featS','五官大小','小','大',0.8,1.3)]},
  {id:'hair',ic:'💇',t:'髮型',cam:'hair',secs:()=>[
    {type:'opts',key:'hair',thumb:'headw',opts:HAIR[cfg.sex].map((h,i)=>({v:i,n:h.n}))},
    {type:'pal',title:'髮色',key:'hairCol',pal:HAIRCOL}]},
  {id:'brow',ic:'🤨',t:'眉毛',cam:'head',secs:()=>[mkOpts('brow',BROW_N,'face'),{type:'pal',title:'眉毛顏色',key:'browCol',pal:HAIRCOL,extra:{v:-1,n:'同髮色'}}]},
  {id:'eye',ic:'👀',t:'眼睛',cam:'head',secs:()=>[mkOpts('eye',EYE_N,'face'),{type:'pal',title:'眼睛顏色',key:'eyeCol',pal:EYECOL}]},
  {id:'nose',ic:'👃',t:'鼻子',cam:'head',secs:()=>[mkOpts('nose',NOSE_N,'face')]},
  {id:'mouth',ic:'👄',t:'嘴巴',cam:'head',secs:()=>[mkOpts('mouth',MOUTH_N,'face'),{type:'pal',title:'嘴唇顏色',key:'lipCol',pal:LIPCOL}]},
  {id:'cheek',ic:'😊',t:'臉頰',cam:'head',secs:()=>[mkOpts('cheek',CHEEK_N,'face','腮紅'),mkOpts('freckle',FRECK_N,'face','雀斑')]}
];
const SLOT_TABS=[['sets','🎁','套裝'],['top','👕','上衣'],['bottom','👖','下身'],['dress','👗','洋裝'],['shoes','👟','鞋子'],['socks','🧦','襪子'],['hat','🎩','頭飾'],['face','👓','臉部'],['back','🎒','背飾']];
const ROOM_TABS=SLOT_TABS.map(s=>({id:s[0],ic:s[1],t:s[2],secs:()=>s[0]==='sets'?[{type:'sets'}]:[{type:'items',slot:s[0]},{type:'colors',slot:s[0]}]}));
const THUMB_KIND={top:'body',bottom:'body',dress:'body',shoes:'feet',socks:'legs',hat:'head',face:'face',back:'body'};
let tabIdx=0;
const curTabs=()=>mode==='create'?CREATE_TABS:ROOM_TABS;

const WHITE_OUT={top:{id:'tee',c1:'#fafafa',c2:undefined},bottom:{id:'shorts',c1:'#fafafa'},shoes:{id:'sneaker',c1:'#fafafa',c2:'#e4e4e4'}};
const BATH_OUT={dress:{id:'swim',c1:'#3bb3c9',c2:'#fafafa'}};
function shown(){return mode==='create'?WHITE_OUT:(act&&act.spec.type==='bath'&&act.phase>=1?BATH_OUT:outfit);}
function setCfg(k,v){
  cfg[k]=v;if(k==='sex')cfg.hair=0;refresh();
  const fk=(k==='hair'||k==='hairCol')?'hair':(k==='skin'||k==='sex')?'body':'face';
  burst(fk,k==='hairCol'?[HAIRCOL[v]||'#fff','#fff']:SPARK,12);
  if(typeof v==='number'&&/Col|skin/.test(k))SND.blip();else SND.pop();
}
function equip(slot,id){
  if(!id)outfit[slot]=null;
  else{
    outfit[slot]=mkItem(slot,id);
    if(slot==='top'||slot==='bottom')outfit.dress=null;
    if(slot==='dress'){outfit.top=null;outfit.bottom=null;}
  }
  refresh();
  if(!id){SND.remove();burst(slot,['#ffffff','#cfd8e0'],6);}
  else{const o=outfit[slot];burst(slot,[o.c1,o.c2||o.c1,'#ffffff','#ffe27a'],slot==='dress'?32:20);
    if(slot==='dress'){SND.big();startEmote('spin',0.9);}else SND.sparkle();}
}
function applySet(set){
  outfit=EMPTY_OUT();
  for(const slot in set.p){const a=set.p[slot];outfit[slot]=mkItem(slot,a[0],a[1],a[2]);}
  refresh();
  for(const slot in set.p){const o=outfit[slot];burst(slot,[o.c1,o.c2||o.c1,'#ffffff','#ffe27a'],10);}
  SND.big();startEmote('spin',0.9);
}
function refresh(){me.update(cfg,shown());renderPanel();save();if(NET.state()==='on')NET.send({t:'out',cfg,outfit});}

/* ---------- 面板繪製 ---------- */
const bodyEl=$('#pbody');
function h4(t){const h=document.createElement('h4');h.textContent=t;return h;}
function optBtn(label,on,fn,img){
  const b=document.createElement('button');b.className='opt'+(on?' on':'');
  if(img)b.appendChild(img);
  const s=document.createElement('span');s.textContent=label;b.appendChild(s);
  b.addEventListener('click',fn);return b;
}
function palEl(pal,cur,fn,extra){
  const d=document.createElement('div');d.className='pal';
  if(extra){const b=document.createElement('button');b.className='chip'+(cur===extra.v?' on':'');b.textContent=extra.n;b.onclick=()=>fn(extra.v);d.appendChild(b);}
  pal.forEach((c,i)=>{const b=document.createElement('button');b.className='sw'+(cur===(typeof cur==='string'?c:i)?' on':'');b.style.background=c;b.setAttribute('aria-label','color '+(i+1));b.onclick=()=>fn(typeof cur==='string'?c:i);d.appendChild(b);});
  return d;
}
function sectionEls(s,tab){
  const out=[];
  if(s.title)out.push(h4(s.title));
  if(s.type==='opts'){
    const g=document.createElement('div');g.className='grid'+(s.thumb?'':' wide');
    s.opts.forEach(o=>{
      let img=null;
      if(s.thumb){
        const c2=Object.assign({},cfg);c2[s.key]=o.v;
        const key='c|'+s.thumb+'|'+s.key+'|'+o.v+'|'+JSON.stringify(c2);
        img=thumbEl(key,()=>renderThumb(s.thumb,c2,{},0));
      }
      g.appendChild(optBtn(o.n,cfg[s.key]===o.v,()=>setCfg(s.key,o.v),img));
    });
    out.push(g);
  }else if(s.type==='range'){
    const w=document.createElement('div');w.className='rng';
    const lab=document.createElement('div');lab.className='rl';lab.innerHTML='<b>'+s.label+'</b><span>'+s.l+' ↔ '+s.r+'</span>';
    const row=document.createElement('div');row.className='rrow';
    const inp=document.createElement('input');inp.type='range';inp.min=s.lo;inp.max=s.hi;inp.step=s.step;inp.value=cfg[s.key];
    inp.oninput=()=>{cfg[s.key]=parseFloat(inp.value);me.update(cfg,shown());};
    inp.onchange=()=>{cfg[s.key]=parseFloat(inp.value);refresh();SND.blip();};
    const rs=document.createElement('button');rs.className='rrs';rs.textContent='↺';rs.title='還原';
    rs.onclick=()=>{cfg[s.key]=s.def;refresh();SND.click();};
    row.appendChild(inp);row.appendChild(rs);w.appendChild(lab);w.appendChild(row);out.push(w);
  }else if(s.type==='sep'){
  }else if(s.type==='pal'){
    out.push(palEl(s.pal,cfg[s.key],v=>setCfg(s.key,v),s.extra));
  }else if(s.type==='items'){
    const g=document.createElement('div');g.className='grid';const sl=s.slot,cur=outfit[sl];
    const none=document.createElement('div');none.className='nonei';none.textContent='✕';
    g.appendChild(optBtn('無',!cur,()=>equip(sl,null),none));
    const base=JSON.stringify(cfg);
    ITEMS[sl].forEach(it=>{
      const o2=EMPTY_OUT();o2[sl]={id:it.id,c1:it.c1,c2:it.c2};
      const img=thumbEl('i|'+sl+'|'+it.id+'|'+base,()=>renderThumb(THUMB_KIND[sl],cfg,o2,sl==='back'?PI-0.5:0.4));
      g.appendChild(optBtn(it.n,cur&&cur.id===it.id,()=>equip(sl,it.id),img));
    });
    out.push(g);
  }else if(s.type==='colors'){
    const cur=outfit[s.slot];if(!cur)return out;
    const it=findItem(s.slot,cur.id);
    out.push(h4('主色'));out.push(palEl(CLOTHCOL,cur.c1,v=>{cur.c1=v;refresh();burst(s.slot,[v,'#ffffff'],8);SND.blip();}));
    if(it.c2){out.push(h4('副色'));out.push(palEl(CLOTHCOL,cur.c2,v=>{cur.c2=v;refresh();burst(s.slot,[v,'#ffffff'],8);SND.blip();}));}
  }else if(s.type==='sets'){
    const g=document.createElement('div');g.className='grid';const base=JSON.stringify(cfg);
    SETS.forEach((st,i)=>{
      const o2=EMPTY_OUT();for(const sl in st.p){const a=st.p[sl];o2[sl]=mkItem(sl,a[0],a[1],a[2]);}
      const img=thumbEl('s|'+i+'|'+base,()=>renderThumb('body',cfg,o2,0.4));
      g.appendChild(optBtn(st.n,false,()=>applySet(st),img));
    });
    out.push(g);
  }
  return out;
}
function renderPanel(keepScroll){
  const sc=bodyEl.scrollTop;bodyEl.innerHTML='';thumbQ.length=0;
  const tab=curTabs()[tabIdx];
  tab.secs().forEach(s=>sectionEls(s,tab).forEach(e=>bodyEl.appendChild(e)));
  bodyEl.scrollTop=keepScroll===false?0:sc;
  document.querySelectorAll('#tabs .tab').forEach((b,i)=>b.classList.toggle('on',i===tabIdx));
}
function renderTabs(){
  const t=$('#tabs');t.innerHTML='';
  curTabs().forEach((tab,i)=>{
    const b=document.createElement('button');b.className='tab';b.innerHTML='<span>'+tab.ic+'</span>'+tab.t;
    b.onclick=()=>{tabIdx=i;renderPanel(false);SND.click();};t.appendChild(b);
  });
}

/* ---------- 模式 ---------- */
function setMode(m){
  if(act){me.setPose(null);me.setSleep(false);act=null;actY=0;}
  mode=m;document.body.dataset.mode=m;actKey='';
  room.group.visible=m==='room';stage.group.visible=m==='create';
  scene.background=new THREE.Color(m==='room'?zoneBGColor(curRoom<0?0:curRoom):'#cfeee6');
  tabIdx=0;target=null;marker.visible=false;emote=null;SND.setScene(m);SND.mode();
  if(m==='create')panelOpen=true;
  me.update(cfg,shown());
  applyPanelVis();renderTabs();renderPanel(false);save();
  $('#bCreate').classList.toggle('on',m==='create');$('#bRoom').classList.toggle('on',m==='room');
  if(m==='room'&&!seenHint){showHint();seenHint=true;save();}
}
function applyPanelVis(){
  $('#panel').style.display=panelOpen?'flex':'none';
  document.body.classList.toggle('popen',panelOpen);
}
function showHint(){const h=$('#hint');h.classList.add('show');setTimeout(()=>h.classList.remove('show'),7000);}
let toastT=0;
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>e.classList.remove('show'),1800);}

/* ---------- 按鈕 ---------- */
$('#bCreate').onclick=()=>setMode('create');
$('#bRoom').onclick=()=>setMode('room');
$('#bDone').onclick=()=>setMode('room');
const rmenu=$('#rmenu');
RNAMES.forEach((n,i)=>{const b=document.createElement('button');b.textContent=n;b.onclick=()=>{pos.set(RCENT[i][0],0,RCENT[i][1]);target=null;wps=[];marker.visible=false;rmenu.classList.remove('show');SND.pop();};rmenu.appendChild(b);});
$('#bRooms').onclick=()=>{rmenu.classList.toggle('show');SND.click();};
$('#bWard').onclick=()=>{panelOpen=!panelOpen;applyPanelVis();SND.click();};
function startEmote(type,dur){if(!emote||emote.type!==type){emote={type,t:0,dur};if(SND[type])SND[type]();}}
$('#bWave').onclick=()=>startEmote('wave',2.6);
$('#bDance').onclick=()=>startEmote('dance',5);
$('#bSpin').onclick=()=>startEmote('spin',0.9);
$('#bFull').onclick=()=>{const d=document.documentElement;try{if(document.fullscreenElement)document.exitFullscreen();else{(d.requestFullscreen||d.webkitRequestFullscreen).call(d);setTimeout(()=>{try{screen.orientation&&screen.orientation.lock&&screen.orientation.lock('landscape').catch(()=>{});}catch(e){}},300);}}catch(e){}};
$('#bPhoto').onclick=()=>{
  camera.clearViewOffset();renderer.render(scene,camera);
  const url=canvas.toDataURL('image/png'),a=document.createElement('a');a.href=url;a.download='歡樂派對_'+Date.now()+'.png';
  document.body.appendChild(a);a.click();a.remove();toast('📷 已儲存照片！');SND.photo();
};
const rnd=n=>Math.floor(Math.random()*n),pick=a=>a[rnd(a.length)];
$('#bRand').onclick=()=>{
  if(mode==='create'){
    cfg.skin=rnd(8);cfg.face=rnd(8);cfg.hair=rnd(12);cfg.hairCol=rnd(16);cfg.brow=rnd(8);cfg.browCol=Math.random()<0.5?-1:rnd(16);
    cfg.eye=rnd(8);cfg.eyeCol=rnd(8);cfg.nose=rnd(6);cfg.mouth=rnd(8);cfg.lipCol=rnd(8);cfg.cheek=rnd(4);cfg.freckle=Math.random()<0.7?0:1+rnd(2);
  }else{
    const o=EMPTY_OUT(),col=()=>pick(CLOTHCOL);
    const give=(sl,p)=>{if(Math.random()<p){const it=pick(ITEMS[sl]);o[sl]={id:it.id,c1:Math.random()<0.5?it.c1:col(),c2:it.c2?(Math.random()<0.5?it.c2:col()):undefined};}};
    if(Math.random()<0.3)give('dress',1);else{give('top',1);give('bottom',1);}
    give('shoes',1);give('socks',0.5);give('hat',0.55);give('face',0.25);give('back',0.3);
    outfit=o;
  }
  refresh();SND.dice();burst('body',SPARK,26);
};

['pointerdown','touchstart','touchend','click','keydown'].forEach(ev=>addEventListener(ev,()=>SND.resume(),true));
if(/sndtest/.test(location.hash)){SND.resume();SND.sparkle();setTimeout(()=>{document.title='SND '+JSON.stringify(SND.info());},1500);}
function sndUI(){$('#bMusic').style.opacity=SND.musicOn()?1:0.4;$('#bSfx').style.opacity=SND.sfxOn()?1:0.4;}
$('#bMusic').onclick=()=>{SND.resume();toast(SND.toggleMusic()?'🎵 音樂開':'🎵 音樂關');sndUI();};
$('#bSfx').onclick=()=>{SND.resume();toast(SND.toggleSfx()?'🔊 音效開':'🔊 音效關');SND.click();sndUI();};
sndUI();
/* ---------- 輸入 ---------- */
const keys={};
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});
const joy={x:0,y:0,id:null};
const joyEl=$('#joy'),knob=$('#knob');
function joyMove(e){
  const r=joyEl.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
  let dx=e.clientX-cx,dy=e.clientY-cy;const R=r.width/2-10,l=Math.hypot(dx,dy);
  if(l>R){dx*=R/l;dy*=R/l;}
  knob.style.transform='translate('+dx+'px,'+dy+'px)';joy.x=dx/R;joy.y=-dy/R;
}
joyEl.addEventListener('pointerdown',e=>{joy.id=e.pointerId;joyEl.setPointerCapture(e.pointerId);joyMove(e);e.preventDefault();});
joyEl.addEventListener('pointermove',e=>{if(e.pointerId===joy.id)joyMove(e);});
const joyHome=()=>{joyEl.style.left='';joyEl.style.top='';joyEl.style.bottom='';joyEl.classList.remove('float');};
const joyEnd=e=>{if(e.pointerId===joy.id){joy.id=null;joy.x=joy.y=0;knob.style.transform='';joyHome();}};
function joyZone(e){return mode==='room'&&!titleOn&&joy.id===null&&e.clientY>72&&e.clientY<H-8&&e.clientX<Math.min(W*0.45,480);}
joyEl.addEventListener('pointerup',joyEnd);joyEl.addEventListener('pointercancel',joyEnd);

const ptrs=new Map();let pinch=0,tapInfo=null;
canvas.addEventListener('pointerdown',e=>{
  if(joyZone(e)){
    canvas.setPointerCapture(e.pointerId);joy.id=e.pointerId;
    const r=joyEl.getBoundingClientRect();
    joyEl.classList.add('float');
    joyEl.style.left=(e.clientX-r.width/2)+'px';joyEl.style.top=(e.clientY-r.height/2)+'px';joyEl.style.bottom='auto';
    joyMove(e);
    tapInfo={x:e.clientX,y:e.clientY,t:performance.now(),moved:0};
    return;
  }
  canvas.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  tapInfo=ptrs.size===1?{x:e.clientX,y:e.clientY,t:performance.now(),moved:0}:null;
  if(ptrs.size===2){const [a,b]=[...ptrs.values()];pinch=Math.hypot(a.x-b.x,a.y-b.y);}
});
canvas.addEventListener('pointermove',e=>{
  if(e.pointerId===joy.id){joyMove(e);if(tapInfo)tapInfo.moved=Math.hypot(e.clientX-tapInfo.x,e.clientY-tapInfo.y);return;}
  const p=ptrs.get(e.pointerId);if(!p)return;
  const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
  if(ptrs.size===2){
    const [a,b]=[...ptrs.values()],d=Math.hypot(a.x-b.x,a.y-b.y);
    if(pinch)camZoom=clamp(camZoom*pinch/d,0.55,1.7);pinch=d;return;
  }
  if(tapInfo){tapInfo.moved+=Math.abs(dx)+Math.abs(e.movementY||0);}
  if(!tapInfo||tapInfo.moved>10){
    if(mode==='room'){if(!F.on){camYaw-=dx*0.006;camPitch=clamp(camPitch+dy*0.005,0.12,1.35);}}else{createYaw+=dx*0.012;createPitch=clamp(createPitch+dy*0.004,-0.2,0.6);}
  }
});
function pEnd(e){
  if(e.pointerId===joy.id){
    const quick=tapInfo&&tapInfo.moved<=10&&performance.now()-tapInfo.t<300;
    joy.id=null;joy.x=joy.y=0;knob.style.transform='';joyHome();
    if(quick&&mode==='room')tapWalk(e.clientX,e.clientY);
    tapInfo=null;return;
  }
  if(tapInfo&&ptrs.size===1&&tapInfo.moved<=10&&performance.now()-tapInfo.t<500&&mode==='room')tapWalk(e.clientX,e.clientY);
  ptrs.delete(e.pointerId);if(ptrs.size<2)pinch=0;tapInfo=null;
}
canvas.addEventListener('pointerup',pEnd);canvas.addEventListener('pointercancel',e=>{if(e.pointerId===joy.id){joy.id=null;joy.x=joy.y=0;knob.style.transform='';joyHome();}ptrs.delete(e.pointerId);tapInfo=null;pinch=0;});
canvas.addEventListener('wheel',e=>{camZoom=clamp(camZoom*(1+Math.sign(e.deltaY)*0.08),0.55,1.7);e.preventDefault();},{passive:false});
const ray=new THREE.Raycaster(),plane=new THREE.Plane(V(0,1,0),0),hit=new THREE.Vector3();
function tapWalk(x,y){
  if(act)standUp();
  ray.setFromCamera({x:x/innerWidth*2-1,y:-(y/innerHeight)*2+1},camera);
  if(ray.ray.intersectPlane(plane,hit)){
    let best=null,bd=1e9;
    for(const ar of AREAS){const cx=clamp(hit.x,ar.x0,ar.x1),cz=clamp(hit.z,ar.z0,ar.z1),dd=Math.hypot(cx-hit.x,cz-hit.z);if(dd<bd){bd=dd;best=[cx,cz];}}
    hit.x=best[0];hit.z=best[1];
    wps=[];const fi=roomOf(pos.x,pos.z),ti=roomOf(hit.x,hit.z);
    if(ti>fi){for(let i=fi;i<ti;i++)wps.push(new THREE.Vector3(DOORS[i]-1.1,0,2.95),new THREE.Vector3(DOORS[i]+1.1,0,2.95));}
    else if(ti<fi){for(let i=fi-1;i>=ti;i--)wps.push(new THREE.Vector3(DOORS[i]+1.1,0,2.95),new THREE.Vector3(DOORS[i]-1.1,0,2.95));}
    target=hit.clone();marker.position.set(hit.x,0.03,hit.z);marker.visible=true;stuck=0;
  }
}
function collide(p){
  const r=0.3;
  for(const b of room.boxes){
    if(b.front&&F.on)continue;
    const x0=b.x0-r,x1=b.x1+r,z0=b.z0-r,z1=b.z1+r;
    if(p.x>x0&&p.x<x1&&p.z>z0&&p.z<z1){
      const a=p.x-x0,c=x1-p.x,d=p.z-z0,f=z1-p.z,m=Math.min(a,c,d,f);
      if(m===a)p.x=x0;else if(m===c)p.x=x1;else if(m===d)p.z=z0;else p.z=z1;
    }
  }
  if(typeof RP!=='undefined'&&RP.on&&RP.room===curRoom){
    const dx=p.x-RP.x,dz=p.z-RP.z,d2=Math.hypot(dx,dz);
    if(d2<0.58&&d2>0.001){p.x=RP.x+dx/d2*0.58;p.z=RP.z+dz/d2*0.58;}
  }
}

/* ---------- 家具互動 ---------- */
const HOT=room.hot;
const actsEl=$('#acts'),flashEl=$('#flash');
function nearestHot(){let b=null,bd=1e9;for(const h of HOT){const d=Math.hypot(pos.x-h.x,pos.z-h.z);if(d<h.r&&d<bd){bd=d;b=h;}}return b;}
function renderActs(){
  let key='',btns=[];
  if(act&&act.phase>=1){key='A'+act.hot.id+act.spec.id;btns=(act.spec.extra||[]).map(e=>({label:e.label,fn:()=>doExtra(e)}));btns.push({label:'⬆ 起來',fn:standUp});}
  else if(!act&&nearHot){key='N'+nearHot.id;btns=nearHot.acts.map(a=>({label:a.label,fn:()=>startAct(nearHot,a)}));}
  else if(!act&&nearNpc){
    const n=nearNpc;key='P'+n.d.id+(held?held.kind:'');
    btns=[{label:'💬 聊天',fn:()=>npcTalk(n)},{label:'🤝 擊掌',fn:()=>npcHigh(n)},{label:'💃 一起跳舞',fn:()=>npcDance(n)}];
    if(n.d.shop)btns.push({label:n.d.shop.label,fn:()=>npcBuy(n)});
    if(held)btns.push({label:EAT[held.kind],fn:eatProp});
  }
  else if(!act&&held){key='H'+held.kind;btns=[{label:EAT[held.kind],fn:eatProp}];}
  if(key===actKey)return;actKey=key;actsEl.innerHTML='';
  btns.forEach(b=>{const e=document.createElement('button');e.textContent=b.label;e.onclick=b.fn;actsEl.appendChild(e);});
  actsEl.classList.toggle('show',btns.length>0);
}
function flash(){flashEl.style.transition='none';flashEl.style.opacity='0.9';requestAnimationFrame(()=>requestAnimationFrame(()=>{flashEl.style.transition='opacity .6s';flashEl.style.opacity='0';}));}
function doToggle(a){
  faceTo=a.face;
  if(a.fn==='mirror'){startEmote('peace',1.2);flash();SND.photo();burst('body',SPARK,26);toast('📸 好看！');return;}
  startEmote('poke',0.7);
  toast(room.toggle(a.fn,pos.x,pos.z));const on=room.state();
  if(a.fn==='smell')burst('face',['#ff9ec0','#ffd7e4','#ffffff'],12);
  else if(a.fn==='pat')for(let i=0;i<9;i++)emit(69.7+(Math.random()-0.5),0.6,1.6+(Math.random()-0.5),(Math.random()-0.5)*2,1+Math.random()*1.5,(Math.random()-0.5)*2,4,'#eed3a0',0.5,0.3,3);
  ({tv:()=>SND.tv(on.tv),duck:()=>SND.quack(),washer:()=>SND.washer(),wardL:()=>SND.creak(),wardR:()=>SND.creak(),curL:()=>SND.creak(),curB:()=>SND.creak(),fridge:()=>SND.creak(),stove:()=>SND.water(),shake:()=>SND.gust(),smell:()=>SND.sparkle(),kick:()=>SND.boing(),pat:()=>SND.pop()}[a.fn]||(()=>SND.click()))();
  if(a.fn==='wardL'||a.fn==='wardR'){panelOpen=true;applyPanelVis();tabIdx=0;renderTabs();renderPanel(false);}
}
function startAct(h,a){
  if(a.type==='toggle'){doToggle(a);actKey='';return;}
  act={hot:h,spec:a,t:0,phase:0,fx:pos.x,fz:pos.z,zt:0,bt:0,jp:0};
  target=null;wps=[];marker.visible=false;emote=null;actKey='';SND.pop();
}
function doExtra(e){
  if(e.fn==='flush'){SND.flush();toast('🚽 沖水～');for(let i=0;i<14;i++)emit(26.9+(Math.random()-0.5)*0.4,0.6,-5.0+(Math.random()-0.5)*0.4,(Math.random()-0.5)*0.8,1+Math.random(),(Math.random()-0.5)*0.8,5,'#8fd3f4',0.8,0.12,3);}
  else if(e.fn==='duck'){room.toggle('duck');SND.quack();toast('🦆 呱呱！');burst('body',['#f7d44a','#ffffff'],10);}
  else if(e.fn==='cake'){SND.sparkle();toast('🍰 草莓蛋糕，超好吃！');burst('face',['#f7d7a8','#e8505b','#ffffff'],16);}
}
function standUp(){
  if(!act)return;const h=act.hot,tp=act.spec.type;
  me.setPose(null);me.setSleep(false);pos.set(h.x,0,h.z);collide(pos);actY=0;act=null;actKey='';
  if(tp==='bath')me.update(cfg,shown());
  SND.pop();
}
function updateAct(dt){
  const sp=act.spec;act.t+=dt;
  if(Math.hypot(joy.x,joy.y)>0.25||keys.w||keys.a||keys.s||keys.d||keys.arrowup||keys.arrowdown||keys.arrowleft||keys.arrowright){standUp();return;}
  let d=sp.face-face;d=Math.atan2(Math.sin(d),Math.cos(d));face+=d*Math.min(1,dt*12);
  if(act.phase===0){
    const k=Math.min(1,act.t/0.4),e=k*k*(3-2*k);
    pos.x=act.fx+(sp.x-act.fx)*e;pos.z=act.fz+(sp.z-act.fz)*e;actY=sp.y*e+Math.sin(k*PI)*0.35;
    if(k>=1){
      act.phase=1;act.t=0;actKey='';
      me.setPose(sp.type==='jump'?'jump':sp.type==='bath'?'bath':sp.type==='wash'?'wash':sp.type==='lie'?'lie':sp.work?'work':'sit');
      if(sp.sleep)me.setSleep(true);
      if(sp.type==='bath'){me.update(cfg,shown());SND.water();toast('🛁 好舒服～');}
      else if(sp.type==='jump')SND.boing();else if(sp.type==='wash')SND.water();else SND.sit();
      if(sp.type!=='jump')burst('body',['#ffffff','#ffd966'],6);
    }
    return;
  }
  pos.x=sp.x;pos.z=sp.z;
  if(sp.type==='jump'){const ph=act.t*5.5;actY=sp.y+Math.abs(Math.sin(ph))*0.9;const n=Math.floor(ph/PI);if(n!==act.jp){act.jp=n;SND.boing();}}
  else actY=sp.y+(sp.type==='lie'?Math.sin(act.t*1.6)*0.01:0);
  if(sp.sleep){act.zt-=dt;if(act.zt<=0){act.zt=1.1;const hp=new THREE.Vector3();me.headPos.getWorldPosition(hp);emit(hp.x,hp.y+0.5,hp.z,0.15,0.5,0.05,3,'#8e5bc9',2.2,0.38,0);SND.snore();}}
  if(sp.type==='bath'){act.bt-=dt;if(act.bt<=0){act.bt=0.22;emit(23+(Math.random()-0.5)*1.6,1.1,-5.0+(Math.random()-0.5)*0.5,0,0.45+Math.random()*0.3,0,4,'#ffffff',1.8,0.16+Math.random()*0.14,0);}}
  if(sp.type==='wash'){act.bt-=dt;if(act.bt<=0){act.bt=sp.sea?0.1:0.06;
    if(sp.sea){const fx2=Math.sin(face),fz2=Math.cos(face);emit(pos.x+fx2*0.6+(Math.random()-0.5)*0.8,0.2,pos.z+fz2*0.6+(Math.random()-0.5)*0.4,(Math.random()-0.5)*1.6,1.6+Math.random()*1.3,(Math.random()-0.5)*1.6,2,Math.random()<0.5?'#7fd0ff':'#ffffff',0.6,0.26,4);}
    else emit(27.5,1.15,-1.5,-0.5-Math.random()*0.3,0,(Math.random()-0.5)*0.15,5,'#7fd0ff',0.5,0.1,3);
    if(Math.random()<0.2)SND.water();}}
}


/* ---------- 商店街角色與道具 ---------- */
const EAT={icecream:'🍦 吃掉',bread:'🥐 吃掉',flower:'💐 聞一聞',coffee:'☕ 喝掉'};
const outfitFrom=p=>{const o=EMPTY_OUT();for(const s in p){const q=p[s];o[s]=mkItem(s,q[0],q[1],q[2]);}return o;};
const NPCS=room.npcs.map(d=>{
  const ch=new Character();scene.add(ch.root);
  ch.update(Object.assign({},DEFAULT_CFG,d.cfg),outfitFrom(d.out));
  const w=d.wander,x=w?w.start:d.x,z=w?w.z:d.z,f=w?(w.dir>0?PI/2:-PI/2):d.face;
  ch.root.position.set(x,0,z);ch.root.rotation.y=f;
  return {d,ch,x,z,face:f,tf:f,dir:w?w.dir:0,emote:null,et:0,emT:0,li:0,mv:0,talk:0};
});
function updateNpcs(dt,t){
  for(const n of NPCS){
    n.ch.root.visible=curRoom===0&&!(F.on&&n.d.wander);
    if(curRoom!==0||Math.abs(n.x-pos.x)>45)continue;
    const w=n.d.wander;let mv=0;
    if(n.emote){n.et+=dt;if(n.et>n.emT)n.emote=null;}
    if(n.talk>0){n.talk-=dt;n.tf=Math.atan2(pos.x-n.x,pos.z-n.z);}
    else if(w&&!n.emote){n.x+=n.dir*w.speed*dt;if(n.x>w.x1){n.x=w.x1;n.dir=-1;}if(n.x<w.x0){n.x=w.x0;n.dir=1;}n.tf=n.dir>0?PI/2:-PI/2;mv=1;}
    else if(!w)n.tf=n.d.face;
    let d=n.tf-n.face;d=Math.atan2(Math.sin(d),Math.cos(d));n.face+=d*Math.min(1,dt*8);
    n.ch.root.position.set(n.x,0,n.z);n.ch.root.rotation.y=n.face;
    n.mv+=(mv-n.mv)*Math.min(1,dt*8);
    n.ch.tick(dt,t,n.mv,n.emote,n.et);
  }
}
function nearestNpc(){let b=null,bd=2.6;for(const n of NPCS){const d=Math.hypot(pos.x-n.x,pos.z-n.z);if(d<bd){bd=d;b=n;}}return b;}
const bubEl=$('#bubble');let bubN=null,bubT=0;
function say(n,text){bubN=n;bubT=3.8;bubEl.textContent=n.d.name+'：'+text;bubEl.classList.add('show');}
function updateBubble(dt){
  if(!bubN)return;
  bubT-=dt;if(bubT<=0){bubN=null;bubEl.classList.remove('show');return;}
  const v=new THREE.Vector3();bubN.ch.headPos.getWorldPosition(v);v.y+=0.95;v.project(camera);
  if(v.z>1){bubEl.classList.remove('show');return;}
  bubEl.style.left=((v.x+1)/2*W)+'px';bubEl.style.top=((1-v.y)/2*H)+'px';bubEl.classList.add('show');
}
function faceNpc(n){faceTo=Math.atan2(n.x-pos.x,n.z-pos.z);}
function npcTalk(n){n.talk=3.8;n.emote='wave';n.et=0;n.emT=1.4;faceNpc(n);say(n,n.d.lines[n.li++%n.d.lines.length]);SND.wave();}
function npcHigh(n){n.talk=2.2;n.emote='wave';n.et=0;n.emT=1.4;faceNpc(n);startEmote('wave',1.4);burst('hat',SPARK,16);SND.sparkle();say(n,'耶～擊掌！✋');}
function npcDance(n){n.talk=4.6;n.emote='dance';n.et=0;n.emT=4;faceNpc(n);startEmote('dance',4);burst('body',SPARK,22);SND.dance();say(n,'一起跳舞吧～🎵');}
function npcBuy(n){
  n.talk=3.2;n.emote='wave';n.et=0;n.emT=1.2;faceNpc(n);
  if(n.d.shop.item==='closet'){panelOpen=true;applyPanelVis();tabIdx=0;renderTabs();renderPanel(false);say(n,'慢慢挑，喜歡的都可以試穿喔！');}
  else{giveProp(n.d.shop.item);say(n,'謝謝惠顧～請慢用！');SND.sparkle();burst('face',SPARK,14);}
}
let held=null;
function makeProp(kind){
  const g=new THREE.Group(),mt=c=>LAMB({color:c});
  const add=(geo,m,x,y,z)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);g.add(o);return o;};
  if(kind==='icecream'){add(new THREE.ConeGeometry(0.075,0.24,12),mt('#d9a05b'),0,0.0,0).rotation.x=PI;[['#f48fb1',0.14],['#9be0c8',0.23]].forEach(p=>add(new THREE.SphereGeometry(0.085,12,10),mt(p[0]),0,p[1],0));}
  else if(kind==='bread'){add(new THREE.SphereGeometry(0.13,14,10),mt('#d9a05b'),0,0.08,0).scale.set(1.5,0.8,0.9);[-0.08,0,0.08].forEach(x=>add(new THREE.BoxGeometry(0.015,0.1,0.2),mt('#c98a4a'),x,0.13,0));}
  else if(kind==='flower'){[['#f48fb1',-0.07,0.28],['#f7d44a',0.07,0.3],['#e8505b',0,0.33]].forEach(p=>{add(new THREE.SphereGeometry(0.07,10,8),mt(p[0]),p[1],p[2],0);add(new THREE.CylinderGeometry(0.01,0.01,0.28,6),mt('#4aa86a'),p[1]/2,0.14,0);});add(new THREE.ConeGeometry(0.12,0.22,10,1,true),LAMB({color:'#ffffff',side:2}),0,0.1,0).rotation.x=PI;}
  else if(kind==='coffee'){add(new THREE.CylinderGeometry(0.075,0.06,0.16,14),mt('#ffffff'),0,0.08,0);add(new THREE.CylinderGeometry(0.08,0.08,0.03,14),mt('#8a5a3a'),0,0.17,0);add(new THREE.CylinderGeometry(0.085,0.085,0.05,14),mt('#8a5a3a'),0,0.08,0);}
  return g;
}
function dropProp(){if(held){me.arms[1].remove(held.mesh);held=null;actKey='';}}
function giveProp(kind){dropProp();const m=makeProp(kind);m.position.set(0,-0.4,0.1);me.arms[1].add(m);held={kind,mesh:m};actKey='';}
function eatProp(){
  if(!held)return;const k=held.kind;dropProp();burst('face',['#f48fb1','#ffd966','#ffffff'],16);SND.sparkle();
  toast({icecream:'🍦 好好吃！',bread:'🥐 酥脆香甜～',flower:'💐 好香～',coffee:'☕ 暖暖的～'}[k]||'好吃！');
}


/* ---------- 熱血格鬥（商店街擂台） ---------- */
const F={on:false,hp:100,max:100,gauge:0,score:0,kills:0,wave:1,combo:0,comboT:0,atk:null,buf:false,stun:0,inv:0,charging:false,maxed:false,dead:false,deadT:0,spawnT:2,packT:12,stop:0,slow:0,shake:0,zoomK:0,ult:null,hold:null,tc:null,torn:null,dizzy:0,dizzyT:0,spinA:0,tcS:0,chain:0,chainT:0,kx:0,kz:0,ct:0,sT:0,streak:0,streakT:0,best:0,boss:null,bossN:0,bossWave:0,xp:0,xpNeed:4,upN:0,pause:false,lvlQ:0,lvlPicks:null,sk:{},clone:null,cloneCd:3,star:0,starT:22};
try{F.best=+localStorage.getItem('acdress_best')||0;}catch(_){}
const CO={eid:0,en:new Map(),look:new Map(),boss:null,shots:[],apply:false};
const isCl=()=>NET.state()==='on'&&!NET.isHost();
const isHo=()=>NET.state()==='on'&&NET.isHost();
function saveBest(){if(F.kills>F.best){F.best=F.kills;try{localStorage.setItem('acdress_best',F.best);}catch(_){}}}
let enemies=[],packs=[],icefxs=[],shots=[];const epool=[];const tmpV=new THREE.Vector3(),_ov1=new THREE.Vector3(),_ov2=new THREE.Vector3();
function occludesLine(ex,ey,ez,rad){
  const cx=camera.position.x,cy=camera.position.y,cz=camera.position.z;
  const vx=pos.x-cx,vy=1-cy,vz=pos.z-cz,len2=vx*vx+vy*vy+vz*vz||1;
  let tq=((ex-cx)*vx+(ey-cy)*vy+(ez-cz)*vz)/len2;
  if(tq<0.08||tq>0.92)return false;
  const qx=cx+vx*tq-ex,qy=cy+vy*tq-ey,qz=cz+vz*tq-ez;
  return qx*qx+qy*qy+qz*qz<rad*rad;
}
function fadeChar(root,fv){root.traverse(o=>{if(!o.isMesh)return;if(o.userData.ol){o.visible=fv>0.9;return;}const m=o.material;if(!m)return;if(m.userData.bOp===undefined){m.userData.bOp=m.opacity;m.userData.bTr=m.transparent;}if(fv>0.985){m.opacity=m.userData.bOp;m.transparent=m.userData.bTr;}else{m.transparent=true;m.opacity=m.userData.bOp*fv;}});}
const $h=id=>document.getElementById(id);
function banner(text,cls){const b=$h('banner');b.className='';b.textContent=text;void b.offsetWidth;b.className='show '+(cls||'');}
function flashFx(id,ms){const e=$h(id);e.classList.add('on');setTimeout(()=>e.classList.remove('on'),ms);}
function hud(){
  $h('hpb').style.width=Math.max(0,F.hp/F.max*100)+'%';$h('hpb').style.background=F.hp<30?'#e8505b':F.hp<60?'#f7b84a':'#6bd47a';$h('hpt').textContent=Math.max(0,Math.ceil(F.hp));
  $h('gb').style.width=F.gauge+'%';$h('gb').parentNode.classList.toggle('full',F.gauge>=100);$h('bCharge').classList.toggle('full',F.gauge>=100);
  $h('kcount').textContent=F.kills;$h('hscore').textContent=F.score;$h('hkills').textContent=F.kills;$h('hwave').textContent=F.wave;
  const cb=$h('hcombo');cb.textContent=F.chain>=2?F.chain+' HIT!':'';cb.classList.toggle('show',F.chain>=2);
  $h('xpb').style.width=Math.min(100,F.xp/F.xpNeed*100)+'%';$h('xplv').textContent='Lv '+(F.upN+1);
  const bb=$h('bossbar');
  {const BB=F.boss||CO.boss;if(BB&&BB.state!=='dead'){bb.classList.add('show');$h('bbfill').style.width=Math.max(0,BB.hp/BB.max*100)+'%';$h('bbname').textContent='👾 魔王機器人 MK-'+(CO.boss?CO.boss.n:F.bossN);}else bb.classList.remove('show');}
}
const mmEl=document.getElementById('mmap'),mmg=mmEl.getContext('2d');
function drawMap(){
  const a=AREAS[0],W0=mmEl.width,H0=mmEl.height,X=x=>(x-a.x0)/(a.x1-a.x0)*W0,Z=z=>(z-a.z0)/(a.z1-a.z0)*(H0-30)+15;
  mmg.clearRect(0,0,W0,H0);
  mmg.fillStyle='rgba(28,24,44,0.64)';mmg.beginPath();if(mmg.roundRect)mmg.roundRect(0,0,W0,H0,22);else mmg.rect(0,0,W0,H0);mmg.fill();
  mmg.strokeStyle='rgba(255,255,255,0.85)';mmg.lineWidth=4;mmg.stroke();
  mmg.fillStyle='rgba(255,255,255,0.2)';[-25.7,-33.1,-40.5,-47.9,-55.3].forEach(cx=>mmg.fillRect(X(cx-3.4),5,6.8/(a.x1-a.x0)*W0,12));
  mmg.strokeStyle='rgba(255,255,255,0.35)';mmg.lineWidth=2;mmg.strokeRect(X(pos.x-9),4,18/(a.x1-a.x0)*W0,H0-8);
  packs.forEach(p=>{const x=X(p.x),y=Z(p.z);mmg.fillStyle='#fff';mmg.fillRect(x-8,y-3,16,6);mmg.fillRect(x-3,y-8,6,16);mmg.fillStyle='#e8505b';mmg.fillRect(x-5,y-1.5,10,3);mmg.fillRect(x-1.5,y-5,3,10);});
  if(starObj){mmg.fillStyle='#ffd24a';mmg.strokeStyle='#fff';mmg.lineWidth=2;starPath(mmg,X(starObj.x),Z(starObj.z),10);mmg.stroke();}
  orbs.forEach(o=>{const x=X(o.x),y=Z(o.z);mmg.fillStyle=ELEMS[o.type].hex;mmg.strokeStyle='#fff';mmg.lineWidth=2;mmg.beginPath();mmg.arc(x,y,6.5,0,7);mmg.fill();mmg.stroke();});
  enemies.forEach(e=>{if(e.state==='ko')return;mmg.fillStyle=e.state==='freeze'?'#7fd0ff':'#ff3b3b';mmg.strokeStyle='#fff';mmg.lineWidth=2.5;mmg.beginPath();mmg.arc(X(e.x),Z(e.z),e.type==='heavy'?11:8.5,0,7);mmg.fill();mmg.stroke();});
  {const BB=F.boss||CO.boss;if(BB&&BB.state!=='dead'){const x=X(BB.x),y=Z(BB.z);mmg.fillStyle='#ff1f3f';mmg.beginPath();mmg.arc(x,y,19,0,7);mmg.fill();mmg.strokeStyle='#fff';mmg.lineWidth=4;mmg.stroke();mmg.fillStyle='#fff';mmg.font='bold 22px sans-serif';mmg.textAlign='center';mmg.textBaseline='middle';mmg.fillText('魔',x,y+1);}}
  const px=X(pos.x),py=Z(pos.z);
  mmg.strokeStyle='#38e060';mmg.lineWidth=5;mmg.beginPath();mmg.moveTo(px,py);mmg.lineTo(px+Math.sin(face)*22,py+Math.cos(face)*22);mmg.stroke();
  mmg.fillStyle='#38e060';mmg.strokeStyle='#fff';mmg.lineWidth=4;mmg.beginPath();mmg.arc(px,py,11,0,7);mmg.fill();mmg.stroke();
}
function startFight(){
  F.on=true;F.dead=false;F.hp=Math.max(F.hp,60);F.gauge=0;F.combo=0;F.atk=null;F.stun=0;F.ult=null;F.spawnT=1.5;F.packT=10;F.chain=0;F.dizzy=0;F.elem=null;F.orbT=6;F.starT=22;clearStar();
  clearEnemies();clearShots();panelOpen=false;applyPanelVis();dropProp();
  NPCS.forEach(n=>{if(n.d.wander)n.ch.root.visible=false;});
  room.front.forEach(o=>o.visible=false);
  document.body.classList.add('fight');SND.setScene('fight');SND.round();
  banner(F.wave>1?'🔥 第 '+F.wave+' 波 繼續！':'👊 熱血亂鬥！','fight');SND.setIntensity(F.wave>1?F.wave:0);
  if(F.bossSave){const sv=F.bossSave;F.bossSave=null;setTimeout(()=>{if(F.on&&!F.dead&&!F.boss)spawnBoss(sv);},1200);}SND.say('熱血亂鬥，開始！',{pitch:0.85,rate:1.05,gap:0});
  toast('👊點擊出拳　按住👊 1 秒＝戰鬥龍捲風　⚡集滿放開＝蓋亞能量炮');
  dropPack(pos.x+3,pos.z-1);dropPack(pos.x-4,pos.z+0.5);
  skillHud();hud();
}
function stopFight(){
  F.on=false;F.charging=false;F.atk=null;F.ult=null;if(F.boss&&F.boss.state!=='dead')F.bossSave={hp:F.boss.hp,max:F.boss.max};clearEnemies();clearIce();clearShots();removeBoss();clearSkillObjs();clearOrbs();clearStar();F.pause=false;F.manual=false;$h('lvl').classList.remove('show');$h('pauseov').classList.remove('show');packs.forEach(p=>scene.remove(p.mesh));packs=[];
  NPCS.forEach(n=>{n.ch.root.visible=true;});
  room.front.forEach(o=>o.visible=true);
  if(isHo())NET.send({t:'fend'});
  document.body.classList.remove('fight');SND.setScene('room');me.setPose(null);actY=0;hud();save();
}
function clearEnemies(){enemies.forEach(e=>removeEnemy(e,true));enemies=[];}
function clearShots(){shots.forEach(s=>scene.remove(s.m));shots=[];}
function enemyChar(){
  for(const c of epool)if(!c.used){c.used=true;return c;}
  if(epool.length>=13)return null;
  const o={ch:new Character(),used:true};epool.push(o);return o;
}
function makeBar(){
  const g=new THREE.Group();
  const bg=new THREE.Mesh(new THREE.PlaneGeometry(1,0.13),new THREE.MeshBasicMaterial({color:0x222222,depthTest:false,transparent:true,opacity:0.85}));
  const fg=new THREE.Mesh(new THREE.PlaneGeometry(1,0.1),new THREE.MeshBasicMaterial({color:0xe8505b,depthTest:false,transparent:true}));
  bg.renderOrder=20;fg.renderOrder=21;fg.position.z=0.001;g.add(bg,fg);g.userData.fg=fg;scene.add(g);return g;
}
/* ----- 敵人種類 ----- */
const TYPES={
  norm:{n:'小混混',hp:32,sp:2.5,dmg:9,sc:1,w:5,wave:1,col:0xf7c84a},
  fast:{n:'飛毛腿',hp:22,sp:3.2,dmg:6,sc:0.92,w:3,wave:2,col:0xffe14a},
  thrower:{n:'投擲手',hp:26,sp:2.3,dmg:8,sc:1,w:2.5,wave:3,col:0x3bb3c9},
  charger:{n:'衝撞手',hp:46,sp:2.4,dmg:15,sc:1.1,w:2,wave:4,col:0xe8505b},
  heavy:{n:'大塊頭',hp:95,sp:2.0,dmg:14,sc:1.3,w:1.8,wave:5,col:0x9a6bd4},
  healer:{n:'護士',hp:28,sp:2.4,dmg:0,sc:1,w:1,wave:6,col:0x6bd47a}
};
function pickType(){
  const av=Object.keys(TYPES).filter(k=>TYPES[k].wave<=F.wave&&!(k==='healer'&&enemies.some(e=>e.type==='healer'&&e.state!=='ko')));
  let tot=0;av.forEach(k=>tot+=TYPES[k].w);let r=Math.random()*tot;
  for(const k of av){r-=TYPES[k].w;if(r<=0)return k;}return 'norm';
}
function enemyLook(type){
  const c=Object.assign({},DEFAULT_CFG,{sex:type==='healer'?'f':(Math.random()<0.6?'m':'f'),skin:rnd(8),face:rnd(8),hair:rnd(12),hairCol:rnd(16),brow:4,browCol:-1,eye:7,eyeCol:rnd(8),nose:rnd(6),mouth:Math.random()<0.5?3:7,cheek:0,freckle:0});
  const o=EMPTY_OUT(),dark=['#2b2b30','#e8505b','#3f6fd1','#2a3a78','#8a2b2b','#3fae6a'];
  if(type==='fast'){o.top=mkItem('top','tank','#ffe14a');o.bottom=mkItem('bottom','shorts','#2b2b30');o.shoes=mkItem('shoes','sneaker','#fafafa','#e8505b');o.hat=mkItem('hat','headband','#e8505b');if(Math.random()<0.5)o.face=mkItem('face','mask');}
  else if(type==='thrower'){o.top=mkItem('top','hoodie','#3bb3c9');o.bottom=mkItem('bottom','jeans','#2a3a78');o.shoes=mkItem('shoes','sneaker','#fafafa');o.hat=mkItem('hat','cap','#3bb3c9');o.back=mkItem('back','pack');}
  else if(type==='charger'){o.top=mkItem('top','track','#e8505b');o.bottom=mkItem('bottom','sport','#2b2b30');o.shoes=mkItem('shoes','boot','#8a2b2b');o.hat=mkItem('hat','horns','#e8505b');c.eye=7;}
  else if(type==='heavy'){o.top=mkItem('top','plaid','#8a2b2b');o.bottom=mkItem('bottom','wide','#2b2b30');o.shoes=mkItem('shoes','boot','#2b2b30');o.hat=mkItem('hat','helmet');o.face=mkItem('face','sun');}
  else if(type==='healer'){c.brow=1;c.mouth=0;c.eye=0;o.top=mkItem('top','tee','#fafafa');o.bottom=mkItem('bottom','mini','#fafafa');o.socks=mkItem('socks','knee','#fafafa');o.shoes=mkItem('shoes','mary','#fafafa','#fafafa');o.hat=mkItem('hat','bow','#6bd47a');o.face=mkItem('face','round');}
  else{
    o.top=mkItem('top',pick(['tee','longtee','tank','hoodie','track','plaid','stripe']),pick(dark));
    o.bottom=mkItem('bottom',pick(['jeans','wide','capri','shorts']),pick(['#2b2b30','#3f6fd1','#8a5a3a','#2a3a78']));
    o.shoes=mkItem('shoes',pick(['sneaker','boot','loafer']),pick(['#2b2b30','#fafafa','#e8505b']));
    if(Math.random()<0.35)o.hat=mkItem('hat',pick(['headband','bandana','cap']));
  }
  return {c,o};
}
function spawnEnemy(forceType){
  const slot=enemyChar();if(!slot)return;
  const type=forceType||pickType(),T=TYPES[type];
  const L=enemyLook(type);slot.ch.update(L.c,L.o);slot.ch.setPose(null);
  const side=Math.random()<0.5?-1:1,a=AREAS[0];
  const x=clamp(pos.x+side*(9+Math.random()*3),a.x0+1,a.x1-1),z=-3.6+Math.random()*9.6;
  const w0=F.wave-1,elite=F.wave>=5&&type!=='healer'&&Math.random()<Math.min(0.06+F.wave*0.02,0.35),hpK=(1+0.12*w0)*(elite?2.2:1),dmgK=(1+0.06*w0)*(elite?1.4:1),E={slot,ch:slot.ch,type,T,elite,hp:Math.round(T.hp*hpK),max:Math.round(T.hp*hpK),cdK:Math.max(0.5,1-0.035*w0),x,z,face:0,state:'walk',t:0,cd:0.6+Math.random()*0.8,kx:0,kz:0,vy:0,y:0,emote:null,et:0,mv:0,bar:makeBar(),sc:T.sc*(elite?1.12:1),speed:(T.sp+Math.min(F.wave,20)*0.06)*(elite?1.1:1),dmg:Math.round(T.dmg*dmgK),col:elite?0xffd24a:T.col,ice:null,spin:0,fade:1,pop:0,tel:null,dirx:0,dirz:1,tgt:null,hitDone:false};
  slot.ch.root.scale.setScalar(E.sc);slot.ch.root.visible=true;scene.add(slot.ch.root);
  if(elite)slot.ch.root.traverse(o=>{if(o.isMesh&&o.material&&o.material.emissive&&!o.material.transparent)o.material.emissive.setHex(0x3a2a00);});
  E.id=++CO.eid;
  if(isHo())NET.send({t:'esp',id:E.id,type,sc:E.sc,elite:E.elite,max:E.max,cfg:L.c,outfit:L.o});
  enemies.push(E);
}
function removeEnemy(e){
  scene.remove(e.ch.root);scene.remove(e.bar);if(e.ice){scene.remove(e.ice);e.ice=null;}if(e.tel){scene.remove(e.tel);e.tel=null;}
  e.ch.root.scale.setScalar(1);e.ch.root.rotation.set(0,0,0);e.ch.setPose(null);
  e.ch.root.traverse(o=>{if(!o.isMesh)return;if(o.userData.ol){o.visible=true;return;}const m=o.material;if(m){if(m.emissive)m.emissive.setHex(0);if(m.userData.bOp!==undefined){m.opacity=m.userData.bOp;m.transparent=m.userData.bTr;}}});
  e.wasFaded=false;e.fadeA=1;clearBurnFx(e);e.slot.used=false;
}
function getTel(e,kind){
  if(e.tel&&e.tel.userData.kind===kind)return e.tel;
  if(e.tel)scene.remove(e.tel);
  let m;
  if(kind==='line'){m=new THREE.Mesh(new THREE.PlaneGeometry(1.3,1),new THREE.MeshBasicMaterial({color:0xff3b3b,transparent:true,opacity:0.42,depthWrite:false,side:2}));m.geometry.translate(0,0.5,0);m.rotation.order='YXZ';m.rotation.x=-PI/2;}
  else{m=new THREE.Mesh(new THREE.CircleGeometry(1,40),new THREE.MeshBasicMaterial({color:0xff3b3b,transparent:true,opacity:0.36,depthWrite:false}));m.rotation.x=-PI/2;}
  m.position.y=0.07;m.userData.kind=kind;scene.add(m);e.tel=m;return m;
}
function hideTel(e){if(e.tel){scene.remove(e.tel);e.tel=null;}}
/* ----- 補血包 ----- */
function dropPack(x,z){
  const a=AREAS[0];x=clamp(x,a.x0+1,a.x1-1);z=clamp(z,a.z0+0.5,a.z1-0.5);
  const g=new THREE.Group(),mt=c=>LAMB({color:c});
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.62,0.42,0.26),mt('#ffffff')));
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.34,0.1,0.28),mt('#e8505b')),new THREE.Mesh(new THREE.BoxGeometry(0.1,0.3,0.28),mt('#e8505b')));
  const rg=new THREE.Mesh(new THREE.RingGeometry(0.5,0.62,24),new THREE.MeshBasicMaterial({color:0x9bf0b0,transparent:true,opacity:0.8,side:2}));rg.rotation.x=-PI/2;rg.position.y=-0.45;g.add(rg);
  addOutlines(g);g.position.set(x,0.8,z);g.traverse(o=>{if(o.isMesh&&!o.userData.ol&&o.geometry.type!=='RingGeometry')o.castShadow=true;});scene.add(g);
  packs.push({mesh:g,x,z,t:0,life:16});
}
function pickRandomSpot(){const a=AREAS[0];return [clamp(pos.x+(Math.random()-0.5)*14,a.x0+1,a.x1-1),-3.6+Math.random()*9.8];}
/* ----- 打擊特效 ----- */
const WORDS=['POW!','BAM!','WHAM!','BOOM!'];
function wordTex(txt,col){return canvasTex(256,128,g=>{g.font='900 78px Impact,Arial Black,sans-serif';g.textAlign='center';g.textBaseline='middle';g.lineJoin='round';g.lineWidth=16;g.strokeStyle='#3a1a1a';g.strokeText(txt,128,66);g.lineWidth=7;g.strokeStyle='#ffffff';g.strokeText(txt,128,66);g.fillStyle=col;g.fillText(txt,128,66);});}
const wordTexs=WORDS.map((w,i)=>wordTex(w,['#ffdf4a','#ff8a3c','#ff4a6a','#ffb020'][i]));
const wordPool=[];for(let i=0;i<8;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:wordTexs[0],transparent:true,depthTest:false}));s.renderOrder=30;s.visible=false;scene.add(s);wordPool.push({s,t:9,life:0.55,base:1});}
function popWord(x,y,z,big){const q=wordPool.find(w=>w.t>=w.life);if(!q)return;q.t=0;q.life=big?0.8:0.5;q.base=big?1.6:1.05;q.s.material.map=wordTexs[(Math.random()*WORDS.length)|0];q.s.material.needsUpdate=true;q.s.position.set(x,y,z);q.s.material.rotation=(Math.random()-0.5)*0.5;q.s.visible=true;}
function updWords(dt){for(const q of wordPool){if(q.t>=q.life){q.s.visible=false;continue;}q.t+=dt;const k=q.t/q.life,pop=k<0.18?k/0.18*1.3:1.3-0.3*Math.min(1,(k-0.18)/0.2);q.s.scale.set(q.base*pop,q.base*pop*0.5,1);q.s.position.y+=dt*0.7;q.s.material.opacity=k>0.7?1-(k-0.7)/0.3:1;}}
const streakTex=canvasTex(256,64,g=>{const gr=g.createLinearGradient(0,0,256,0);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(0.55,'rgba(255,255,255,0.9)');gr.addColorStop(1,'rgba(255,255,255,1)');g.fillStyle=gr;g.beginPath();g.moveTo(0,32);g.lineTo(256,8);g.lineTo(256,56);g.closePath();g.fill();});
const slashPool=[];for(let i=0;i<4;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:streakTex,transparent:true,depthTest:false}));s.renderOrder=29;s.visible=false;scene.add(s);slashPool.push({s,t:9,life:0.2,w:3,h:0.8});}
function slashFx(x,y,z,kind,dirx,col){
  const q=slashPool.find(p=>p.t>=p.life);if(!q)return;q.t=0;q.life=kind==='upper'?0.3:0.2;q.s.visible=true;q.s.material.color.set(col||'#ffffff');
  if(kind==='upper'){q.w=3.2;q.h=0.8;q.s.material.rotation=Math.PI/2;q.s.position.set(x,y-1.0,z);}
  else{q.w=3.0*(dirx>=0?1:-1);q.h=0.5;q.s.material.rotation=0;q.s.position.set(x-dirx*1.0,y,z);}
}
function updSlash(dt){for(const q of slashPool){if(q.t>=q.life){q.s.visible=false;continue;}q.t+=dt;const k=q.t/q.life;q.s.scale.set(q.w*(0.6+k*0.7),q.h*(1-k*0.5),1);q.s.material.opacity=1-k*k;}}
const numPool=[];for(let i=0;i<14;i++){const cv=document.createElement('canvas');cv.width=128;cv.height=64;const tx=new THREE.CanvasTexture(cv);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tx,transparent:true,depthTest:false}));s.renderOrder=31;s.visible=false;scene.add(s);numPool.push({s,cv,tx,t:9,life:0.85});}
function dmgNum(x,y,z,v,col){const q=numPool.find(n=>n.t>=n.life);if(!q)return;const g=q.cv.getContext('2d');g.clearRect(0,0,128,64);g.font='900 46px Impact,Arial Black,sans-serif';g.textAlign='center';g.textBaseline='middle';g.lineJoin='round';g.lineWidth=9;g.strokeStyle='#3a1a1a';g.strokeText(v,64,34);g.fillStyle=col||'#fff';g.fillText(v,64,34);q.tx.needsUpdate=true;q.t=0;q.s.position.set(x+(Math.random()-0.5)*0.5,y,z);q.s.visible=true;}
function updNums(dt){for(const q of numPool){if(q.t>=q.life){q.s.visible=false;continue;}q.t+=dt;q.s.position.y+=dt*1.7;const k=q.t/q.life,sc=k<0.15?0.6+k/0.15*0.75:1.35;q.s.material.opacity=k>0.6?1-(k-0.6)/0.4:1;q.s.scale.set(sc,sc*0.5,1);}}
function flashChar(root,ms){
  root.traverse(o=>{if(o.isMesh&&o.material&&o.material.emissive&&!o.material.transparent)o.material.emissive.setHex(0x3a3a3a);});
  setTimeout(()=>root.traverse(o=>{if(o.isMesh&&o.material&&o.material.emissive)o.material.emissive.setHex(0);}),ms*0.6);
}
function impact(x,y,z,n,col){for(let i=0;i<n;i++)emit(x,y,z,(Math.random()-0.5)*5,Math.random()*3.5+0.5,(Math.random()-0.5)*5,0,col||'#ffe27a',0.45,0.3+Math.random()*0.2,3);}
function hitFx(x,y,z,big,dmg,col){
  impact(x,y,z,big?8:5,big?'#ffc95e':'#ffe3b0');
  emit(x,y,z,0,0,0,0,'#ffd98a',big?0.18:0.12,big?0.42:0.26,0,big?1.2:0.8);
  emit(x,y,z,0,0,0,4,'#ffca70',0.22,0.26,0,big?2.5:1.5);
  if(big)popWord(x,y+0.8,z,true);dmgNum(x,y+0.3,z,Math.round(dmg),col||(big?'#ffdf4a':'#fff6d8'));
  F.zoomK=Math.max(F.zoomK,big?0.45:0.2);try{if(navigator.vibrate)navigator.vibrate(big?60:25);}catch(_){}
}
/* ----- 玩家攻擊 ----- */
function punch(){
  if(!F.on||F.dead||F.stun>0||F.charging||F.torn||F.ult||F.dizzy>0||F.pause)return;
  if(F.atk){F.buf=true;return;}
  F.combo=F.comboT>0?(F.combo+1)%3:0;F.comboT=0.8;const k=F.combo;
  let tgt=null,bd=3.4;for(const e of enemies){if(e.state==='ko')continue;const d=Math.hypot(e.x-pos.x,e.z-pos.z);if(d<bd){bd=d;tgt=e;}}
  {const BB=F.boss||CO.boss;if(BB&&BB.state!=='dead'&&BB.state!=='drop'){const d=Math.hypot(BB.x-pos.x,BB.z-pos.z)-1.2;if(d<bd){bd=d;tgt={x:BB.x,z:BB.z};}}}
  if(tgt)face=Math.atan2(tgt.x-pos.x,tgt.z-pos.z);
  F.kx+=Math.sin(face)*(k===2?6:3.6);F.kz+=Math.cos(face)*(k===2?6:3.6);
  F.atk={t:0,dur:k===2?0.45:0.3,hitAt:k===2?0.13:0.075,hit:false,dmg:[8,10,18][k],kb:[3.8,4.2,10.5][k],type:['punchR','punchL','upper'][k],big:k===2,k};
  if(lv('power')>=5&&Math.random()<0.2){F.atk.dmg*=2;F.atk.crit=true;}
  emote=null;
  if(k===2)SND.say(pick(['吃我這招！','喝啊！','上勾拳！']),{pitch:1.55,rate:1.15,gap:200});else if(Math.random()<0.4)SND.say(pick(['嘿！','哈！','喝！','呀！']),{pitch:1.6,rate:1.3,gap:500});
}
function startCharge(){if(!F.on||F.dead||F.stun>0||F.atk||F.torn||F.ult||F.tc||F.dizzy>0||F.pause)return;F.charging=true;F.ct=0;SND.say('嗚…嗚…',{pitch:1.1,rate:0.8,gap:1500});}
function endCharge(){if(!F.charging)return;F.charging=false;if(F.gauge>=100&&F.on&&!F.dead)ultimate();}
function resolveHit(){window._rh=(window._rh||0)+1;
  const fx=Math.sin(face),fz=Math.cos(face);let hits=0;const A=F.atk,SL=lv('shock'),RM=1+0.12*SL,pm=pmul(),done=new Set();
  for(const e of enemies){
    if(e.state==='ko')continue;
    const dx=e.x-pos.x,dz=e.z-pos.z,d=Math.hypot(dx,dz)||0.001;
    if(d<(1.9+(e.sc-1)*0.4)*RM&&(dx*fx+dz*fz)/d>0.25){hitEnemy(e,A.dmg*pm,A.kb,dx/d,dz/d,A.big||A.crit,A.k);hits++;done.add(e);}
  }
  const B=F.boss||CO.boss;
  if(B&&B.state!=='dead'&&B.state!=='drop'){
    const dx=B.x-pos.x,dz=B.z-pos.z,d=Math.hypot(dx,dz)||0.001;
    if(d<3.1*RM&&(dx*fx+dz*fz)/d>0.15){hitBoss(Math.round(A.dmg*pm),A.big||A.crit,dx/d,dz/d,A.k);hits++;}
  }
  for(const s of shots){
    if(!s.hostile)continue;
    const dx=s.x-pos.x,dz=s.z-pos.z,d=Math.hypot(dx,dz)||0.001;
    if(d<2.4&&(dx*fx+dz*fz)/d>0.05)reflectShot(s);
  }
  if(SL){
    const range=2.2+0.6*SL;
    for(let i=1;i<=Math.ceil(range/0.9);i++)emit(pos.x+fx*i*0.9,0.12,pos.z+fz*i*0.9,fx*1.5,0.2,fz*1.5,4,'#d8c0a0',0.45,0.45,0,2.2);
    for(const e of enemies){
      if(e.state==='ko'||done.has(e))continue;
      const dx=e.x-pos.x,dz=e.z-pos.z,d=Math.hypot(dx,dz)||0.001;
      if(d<range){
        const dm=Math.round(A.dmg*(SL>=5?0.75:0.5)*pm);e.hp-=dm;dmgNum(e.x,2*e.sc,e.z,dm,'#d8b890');impact(e.x,0.4,e.z,6,'#d8c0a0');flashChar(e.ch.root,70);
        if(e.hp<=0)koEnemy(e,dx/d,dz/d);else if(e.state!=='freeze'){hideTel(e);e.state='hit';e.t=0.35;e.kx=dx/d*5;e.kz=dz/d*5;e.emote='hurt';e.et=0;}
        hits++;if(SL>=5)F.gauge=Math.min(100,F.gauge+2);
      }
    }
  }
  if(hits){F.shake=Math.max(F.shake,A.big?0.3:0.12);F.gauge=Math.min(100,F.gauge+6*hits*(1+0.2*lv('charge')));F.chain+=hits;F.chainT=1.3;SND.hit(A.big||A.crit,A.k);
    if(A.crit){F.zoomK=Math.max(F.zoomK,0.8);F.shake=Math.max(F.shake,0.45);dmgNum(pos.x+fx*1.4,2.3,pos.z+fz*1.4,'爆擊!','#ffd24a');groundRing(pos.x+fx*1.4,pos.z+fz*1.4,0xffd24a,3.2,0.4,0.15);}}
}
function cDmg(e,dmg,kb,dx,dz,big,k){
  hitFx(e.x,1.3*e.sc,e.z,big,Math.round(dmg),F.elem?ELEMS[F.elem.type].hex:undefined);
  flashChar(e.ch.root,90);e.pop=1;
  NET.send({t:'dmg',id:e.id,dmg:Math.round(dmg),kb,dx,dz,big:big?1:0,k,el:F.elem?F.elem.type:0});
}
function hitEnemy(e,dmg,kb,dx,dz,big,k){
  if(isCl()){cDmg(e,dmg,kb,dx,dz,big,k);return;}
  if(e.state==='freeze')dmg*=1.8;
  dmg=Math.round(dmg);
  e.hp-=dmg;hitFx(e.x,1.3*e.sc,e.z,big,dmg);flashChar(e.ch.root,90);e.pop=1;lifeSteal(dmg);
  if(e.hp<=0){koEnemy(e,dx,dz);return;}
  if(e.state!=='freeze'){hideTel(e);e.state='hit';e.t=big?0.6:0.38;e.kx=dx*kb*1.15;e.kz=dz*kb*1.15;e.emote='hurt';e.et=0;if(big){e.vy=4.2;e.y=0.01;}}
  const D=lv('dual');
  if(D&&k!==undefined){
    if(k===0){freezeEnemy(e,0.8+0.3*D);}
    else if(k===1){e.burn={t:3,dps:3+2*D,acc:0};for(let i=0;i<8;i++)emit(e.x,1.2*e.sc,e.z,(Math.random()-0.5)*4,Math.random()*3,(Math.random()-0.5)*4,0,['#ff7a1c','#ffd24a'][i%2],0.5,0.3,0);}
    else if(k===2){
      hideTel(e);if(e.ice){scene.remove(e.ice);e.ice=null;}
      const m=(1+0.25*D)*1.4;e.state='hit';e.t=1.0;e.kx=dx*kb*m;e.kz=dz*kb*m;e.vy=9+D;e.y=0.02;e.emote='hurt';e.et=0;
    }
  }
}
function koEnemy(e,dx,dz){
  if(isCl())return;
  if(e.ice){scene.remove(e.ice);e.ice=null;}hideTel(e);clearBurnFx(e);e.burn=null;e.wdot=null;
  e.state='ko';e.t=0;e.kx=dx*10;e.kz=dz*10;e.vy=7;e.y=0.01;e.spin=(Math.random()<0.5?-1:1)*10;e.emote=null;
  F.kills++;F.score+=100*(1+Math.floor(F.chain/3));gainXP(e.elite?3:1);if(isHo())NET.send({t:'xp',n:e.elite?3:1});
  if(lv('vamp')>=5&&F.hp<F.max){F.hp=Math.min(F.max,F.hp+12);dmgNum(pos.x,2.5,pos.z,'+12','#ff5a7a');siphonFx(e.x,e.z);}
  if(F.kills%8===0&&!F.boss){F.wave++;banner('🔥 第 '+F.wave+' 波','fight');SND.round();SND.setIntensity(F.wave);SND.say('第'+F.wave+'波！',{pitch:0.8,rate:1.05,gap:0});toast('⚠ 敵人變強了！');save();
    if(F.wave%5===0&&F.bossWave!==F.wave){F.bossWave=F.wave;setTimeout(()=>{if(F.on&&!F.dead)spawnBoss();},1700);}}
  burst2(e.x,1.4,e.z);SND.ko();F.shake=Math.max(F.shake,0.4);
  F.streak=F.streakT>0?F.streak+1:1;F.streakT=4;
  if(Math.random()<0.3)SND.say(pick(['不可能！','啊啊——','我記住你了！']),{pitch:0.55,rate:1,gap:600});
  {const kc=$h('killc');kc.classList.remove('pop');void kc.offsetWidth;kc.classList.add('pop');}
  if(Math.random()<0.24||F.hp<35&&Math.random()<0.4)dropPack(e.x,e.z);
}
function burst2(x,y,z){for(let i=0;i<16;i++)emit(x,y,z,(Math.random()-0.5)*7,Math.random()*4.5+1,(Math.random()-0.5)*7,0,['#ffe27a','#ffffff','#ff9ec0'][i%3],0.75,0.38,4);}
function hurtPlayer(dmg,dx,dz,heavy){
  if(F.star>0||F.inv>0||F.dead||F.ult&&F.ult.t<1.6)return;
  if(lv('speed')>=5&&Math.random()<0.15){
    F.inv=0.45;dmgNum(pos.x,2.5,pos.z,'閃避!','#9fe0ff');SND.whoosh(0);
    {const nx=pos.x-dz*1.3,nz=pos.z+dx*1.3;if(walkable(nx,nz)){pos.x=nx;pos.z=nz;}}
    for(let i2=0;i2<6;i2++)emit(pos.x+(Math.random()-0.5),0.8,pos.z+(Math.random()-0.5),-dx*3,0.5,-dz*3,8,'#9fe0ff',0.4,0.4,0,0.5);
    return;
  }
  if(lv('defense')>=5&&Math.random()<0.25){
    F.inv=0.4;dmgNum(pos.x,2.5,pos.z,'格擋!','#ffd24a');SND.deflect();
    burst('body',['#ffd24a','#ffffff'],12);groundRing(pos.x,pos.z,0xffd24a,2.6,0.35,0.12);
    for(const e2 of enemies){
      if(e2.state==='ko'||e2.state==='freeze')continue;
      const bx=e2.x-pos.x,bz=e2.z-pos.z,bd2=Math.hypot(bx,bz)||0.01;
      if(bd2<2.1)hitEnemy(e2,8,5,bx/bd2,bz/bd2,false,undefined);
    }
    return;
  }
  const raw=dmg;dmg=Math.max(1,Math.round(dmg*(1-0.1*lv('defense'))));
  F.hp-=dmg;F.inv=0.6;F.stun=heavy?0.42:0.25;F.gauge=Math.min(100,F.gauge+9);F.charging=false;F.atk=null;F.combo=0;
  F.kx=dx*(heavy?6:3.2);F.kz=dz*(heavy?6:3.2);F.shake=heavy?0.5:0.32;F.chain=0;
  burst('body',['#ff6b6b','#ffffff'],8);SND.hurt();flashFx('hurtfx',250);flashChar(me.root,80);
  hitFx(pos.x,1.5,pos.z,heavy,dmg,'#ff6b6b');thornsReflect(raw);
  if(Math.random()<0.6)SND.say(pick(['哇！','好痛！','唔！','啊！']),{pitch:1.5,rate:1.2,gap:700});
  if(F.hp<=0){F.hp=0;playerDie();}
}
function playerDie(){
  F.dead=true;F.deadT=0;F.charging=false;F.atk=null;clearStar();me.setPose('lie');banner('KO！','ko');SND.ko();saveBest();SND.say('我…我還沒輸……',{pitch:1.2,rate:0.8,gap:0});F.shake=0.7;F.slow=0.6;
  $h('koov').innerHTML='';
}
function goHome(){
  const kills=F.kills;
  F.dead=false;F.hp=F.max;F.gauge=0;me.setPose(null);actY=0;
  pos.set(0,0,1.6);target=null;wps=[];
  $h('koov').classList.remove('show');
  saveBest();stopFight();toast('🏠 回到更衣室了～　本次擊倒 '+kills+' 人');SND.say('回家休息吧',{pitch:1.3,gap:0});
}
/* ----- 蓋亞能量炮 ----- */
function clearIce(){icefxs.forEach(o=>{scene.remove(o.mesh);});icefxs=[];if(F.ult&&F.ult.ball)scene.remove(F.ult.ball);if(F.torn&&F.torn.mesh)scene.remove(F.torn.mesh);F.torn=null;F.spinA=0;F.flyY=0;}
function ultimate(){
  F.gauge=lv('charge')>=5?30:0;F.maxed=false;F.inv=3.5;F.charging=false;F.tc=null;F.hold=null;bP.classList.remove('tc');
  const ball=new THREE.Group();
  [[0.7,0xffb030,1],[1.0,0xff5a1a,0.55],[1.45,0xffd24a,0.28]].forEach(p=>ball.add(new THREE.Mesh(new THREE.SphereGeometry(p[0],20,14),new THREE.MeshBasicMaterial({color:p[1],transparent:p[2]<1,opacity:p[2],depthWrite:false}))));
  ball.position.set(pos.x,2.6,pos.z);ball.scale.setScalar(0.1);scene.add(ball);
  F.ult={t:0,phase:0,ball,tx:0,tz:0,sx:0,sz:0,fl:0};
  banner('🔥 蓋亞能量炮 🔥','fire');SND.gaiaCharge();SND.say('蓋亞——能量炮！！',{pitch:0.9,rate:0.7,gap:0});F.stop=0.15;
}
function updateGaia(dt){
  const u=F.ult;u.t+=dt;
  if(u.phase===0){
    const k=Math.min(1,u.t/1.15);
    u.ball.position.set(pos.x,2.7+k*1.1,pos.z);u.ball.scale.setScalar(0.15+k*1.05+Math.sin(u.t*30)*0.03);u.ball.rotation.y+=dt*6;
    F.shake=Math.max(F.shake,0.12+k*0.3);
    u.fl-=dt;if(u.fl<=0){u.fl=0.03;
      for(let i=0;i<3;i++){const an=Math.random()*PI*2,r=(0.5+Math.random())*(0.6+k);emit(pos.x+Math.cos(an)*r,u.ball.position.y+(Math.random()-0.3)*r,pos.z+Math.sin(an)*r,Math.cos(an)*0.6,1.5+Math.random()*1.5,Math.sin(an)*0.6,Math.random()<0.5?0:4,['#ff9a3c','#ffd24a','#ff5a1a'][i],0.55,0.35+k*0.3,-1.2,0.2);}
      const an2=Math.random()*PI*2,r2=3.6;emit(pos.x+Math.cos(an2)*r2,0.15,pos.z+Math.sin(an2)*r2,-Math.cos(an2)*6,0.5,-Math.sin(an2)*6,0,'#ff9a3c',0.55,0.3,0);
    }
    if(u.t>=1.15){
      u.phase=1;u.t=0;
      let tg=null,bd=10;enemies.forEach(e=>{if(e.state==='ko')return;const d=Math.hypot(e.x-pos.x,e.z-pos.z);if(d<bd){bd=d;tg=e;}});
      if(F.boss&&F.boss.state!=='dead'&&F.boss.state!=='drop'){const d=Math.hypot(F.boss.x-pos.x,F.boss.z-pos.z);if(d<bd+2){bd=d;tg=F.boss;}}
      if(tg){u.tx=tg.x;u.tz=tg.z;face=Math.atan2(tg.x-pos.x,tg.z-pos.z);}else{u.tx=pos.x+Math.sin(face)*6;u.tz=pos.z+Math.cos(face)*6;}
      const A0=AREAS[0];u.tx=clamp(u.tx,A0.x0+2,A0.x1-1);u.tz=clamp(u.tz,-4.5,3);
      u.sx=u.ball.position.x;u.sz=u.ball.position.z;SND.gaiaFire();
    }
  }else if(u.phase===1){
    const k=Math.min(1,u.t/0.42),e2=k*k;
    u.ball.position.set(u.sx+(u.tx-u.sx)*k,3.7+(0.8-3.7)*e2,u.sz+(u.tz-u.sz)*k);u.ball.scale.setScalar(1.2);
    for(let i=0;i<4;i++)emit(u.ball.position.x+(Math.random()-0.5)*0.6,u.ball.position.y+(Math.random()-0.5)*0.6,u.ball.position.z+(Math.random()-0.5)*0.6,(Math.random()-0.5)*1.5,Math.random()*1.2,(Math.random()-0.5)*1.5,Math.random()<0.5?0:4,['#ffd24a','#ff7a1c','#ffffff'][i%3],0.45,0.45,0,0.1);
    if(k>=1){gaiaBoom(u.tx,u.tz);u.phase=2;u.t=0;}
  }else{
    if(u.t>1.0){F.ult=null;}
  }
}
function gaiaBoom(x,z){
  const u=F.ult;scene.remove(u.ball);
  SND.boom();F.shake=1.5;F.stop=0.3;F.slow=0.7;flashFx('firefx',1300);
  const add=(mesh,o)=>{scene.add(mesh);icefxs.push(Object.assign({mesh,t:0},o));};
  const ring=new THREE.Mesh(new THREE.RingGeometry(0.85,1,56),new THREE.MeshBasicMaterial({color:0xffc060,transparent:true,opacity:0.95,side:2,depthWrite:false}));ring.rotation.x=-PI/2;ring.position.set(x,0.1,z);add(ring,{type:'fring'});
  const dome=new THREE.Mesh(new THREE.SphereGeometry(1,28,18),new THREE.MeshBasicMaterial({color:0xff7a1c,transparent:true,opacity:0.7,depthWrite:false}));dome.position.set(x,0.2,z);add(dome,{type:'fdome'});
  const sc=new THREE.Mesh(new THREE.CircleGeometry(9,48),new THREE.MeshBasicMaterial({color:0x3a1f12,transparent:true,opacity:0.6,depthWrite:false}));sc.rotation.x=-PI/2;sc.position.set(x,0.05,z);add(sc,{type:'fscorch'});
  for(let i=0;i<12;i++){
    const r2=1+Math.random()*7.5,an=Math.random()*PI*2,dl=r2/9*0.3,fx2=x+Math.cos(an)*r2,fz2=z+Math.sin(an)*r2;
    const dum=new THREE.Object3D();dum.position.set(fx2,0,fz2);
    fxAdd(dum,0.8+dl,(k,tt)=>{if(tt>dl&&tt<dl+0.55){
      if(Math.random()<0.55)emit(fx2+(Math.random()-0.5)*0.5,0.12,fz2+(Math.random()-0.5)*0.5,(Math.random()-0.5)*0.8,4.5+Math.random()*3.5,(Math.random()-0.5)*0.8,7,'#ffffff',0.55,0.72,-2.5,0.15);
      if(Math.random()<0.25)emit(fx2,0.1,fz2,(Math.random()-0.5)*1.6,2+Math.random()*2,(Math.random()-0.5)*1.6,0,'#ffd24a',0.5,0.28,1);
    }});
  }
  {const cg=addGlowSprite(0xffb050);cg.position.set(x,1.3,z);fxAdd(cg,0.5,k=>{cg.scale.set(3+k*15,3+k*15,1);cg.material.opacity=0.8*(1-k);});}
  for(let i=0;i<70;i++){const an=Math.random()*PI*2,sp=3+Math.random()*10;emit(x,0.6,z,Math.cos(an)*sp,Math.random()*9+2,Math.sin(an)*sp,Math.random()<0.5?0:5,['#ffb030','#ff6a1c','#ffe27a','#ffffff'][i%4],1.0,0.4,6,0.2);}
  // 傷害：範圍內全部敵人
  const R=11;
  for(const e of enemies){
    if(e.state==='ko')continue;
    const dx=e.x-x,dz=e.z-z,d=Math.hypot(dx,dz)||0.01;
    if(d<R){
      const dmg=Math.round(130*pmul()*(1-d/(R+5)));
      if(isCl()){cDmg(e,dmg,9,dx/d,dz/d,true,undefined);continue;}
      e.hp-=dmg;hitFx(e.x,1.4*e.sc,e.z,true,dmg,'#ffb030');
      if(e.hp<=0)koEnemy(e,dx/d,dz/d);else{hideTel(e);e.state='hit';e.t=0.9;e.kx=dx/d*9;e.kz=dz/d*9;e.vy=8;e.y=0.02;e.emote='hurt';e.et=0;}
    }
  }
  const B=F.boss;
  if(B&&B.state!=='dead'&&B.state!=='drop'){const dx=B.x-x,dz=B.z-z,d=Math.hypot(dx,dz)||0.01;if(d<R+2){hitBoss(Math.round(170*pmul()*(1-d/(R+8))),true,dx/d,dz/d);}}
  shots.forEach(s=>scene.remove(s.m));shots=[];
}
/* ----- 戰鬥龍捲風 ----- */
const tornTex=canvasTex(128,128,g=>{g.clearRect(0,0,128,128);g.fillStyle='rgba(255,255,255,0.75)';for(let i=0;i<4;i++){g.beginPath();g.moveTo(i*32,0);g.lineTo(i*32+14,0);g.lineTo(i*32+44,128);g.lineTo(i*32+30,128);g.closePath();g.fill();}},[3,1]);
function makeTornado(){
  const g=new THREE.Group();
  [[0.4,1.45,3.6,0xffffff,0.2],[0.3,1.1,3.1,0xffe9a8,0.14]].forEach((p,i)=>{
    const m=new THREE.Mesh(new THREE.CylinderGeometry(p[0],p[1],p[2],28,1,true),new THREE.MeshBasicMaterial({map:tornTex,color:p[3],transparent:true,opacity:p[4],side:2,depthWrite:false}));
    g.add(m);
  });
  scene.add(g);return g;
}
const _qa=new THREE.Quaternion(),_qb=new THREE.Quaternion(),_qc=new THREE.Quaternion(),_AY=new THREE.Vector3(0,1,0),_AX=new THREE.Vector3(1,0,0);
function flyRamp(T){const k=T.t/T.dur;return Math.max(0,Math.min(1,k/0.14,(1-k)/0.14));}
function setTornQuat(){
  const T=F.torn,p=flyRamp(T);
  _qa.setFromAxisAngle(_AY,face);_qb.setFromAxisAngle(_AX,PI/2*p);_qc.setFromAxisAngle(_AY,F.spinA);
  me.root.quaternion.copy(_qa).multiply(_qb).multiply(_qc);
}
function tornado(){
  F.inv=1.4;F.hold=null;F.tc=null;bP.classList.remove('tc');bP.style.setProperty('--p',0);F.atk=null;
  let tg=null,bd=10;enemies.forEach(e=>{if(e.state==='ko')return;const d=Math.hypot(e.x-pos.x,e.z-pos.z);if(d<bd){bd=d;tg=e;}});
  if(F.boss&&F.boss.state!=='dead'&&F.boss.state!=='drop'){const d=Math.hypot(F.boss.x-pos.x,F.boss.z-pos.z);if(d<bd){bd=d;tg=F.boss;}}
  if(tg)face=Math.atan2(tg.x-pos.x,tg.z-pos.z);
  F.torn={t:0,dur:0.95,dx:Math.sin(face),dz:Math.cos(face),mesh:makeTornado(),hit:new Map(),bhit:0,bt:0};
  SND.tornado();banner('🌪 戰鬥龍捲風！','fight');SND.say('龍捲風——！',{pitch:1.3,rate:0.9,gap:0});
}
function updateTornado(dt,t){
  const T=F.torn;T.t+=dt;const k=T.t/T.dur;
  const sp=15*(1-k*0.55),nx=pos.x+T.dx*sp*dt,nz=pos.z+T.dz*sp*dt;
  if(walkable(nx,nz)){pos.x=nx;pos.z=nz;collide(pos);}
  const fp=flyRamp(T);F.flyY=1.15*fp;F.spinA+=dt*22;
  _qa.setFromAxisAngle(_AY,face);_qb.setFromAxisAngle(_AX,PI/2);T.mesh.quaternion.copy(_qa).multiply(_qb);
  T.mesh.position.set(pos.x+T.dx*0.2,F.flyY+0.1,pos.z+T.dz*0.2);T.mesh.visible=fp>0.2;
  T.mesh.children.forEach((m,i)=>{m.rotation.y+=dt*(i?-22:18);});T.mesh.scale.setScalar(0.6+0.5*Math.min(1,k*3));
  F.shake=Math.max(F.shake,0.2);
  for(let i=0;i<2;i++){const an=Math.random()*PI*2,r=0.6+Math.random()*1.3;emit(pos.x+Math.cos(an)*r,F.flyY+(Math.random()-0.5)*2.2,pos.z+Math.sin(an)*r,-Math.sin(an)*5,0.4,Math.cos(an)*5,Math.random()<0.4?6:4,Math.random()<0.5?'#ffffff':'#ffe9a8',0.5,0.25,0,0.1);}
  if(Math.random()<0.5)emit(pos.x-T.dx*0.6,0.12,pos.z-T.dz*0.6,-T.dx*2,0.5,-T.dz*2,4,'#e8dcc8',0.35,0.25,0,0.6);
  for(const e of enemies){
    if(e.state==='ko')continue;
    const dx=e.x-pos.x,dz=e.z-pos.z,d=Math.hypot(dx,dz)||0.01;
    if(d<2.5+(e.sc-1)*0.4){
      const h=T.hit.get(e)||{n:0,t:-1};
      if(h.n<2&&T.t-h.t>0.28){
        h.n++;h.t=T.t;T.hit.set(e,h);
        const dm=Math.round(22*pmul());
        if(isCl()){cDmg(e,dm,6,dx/d+T.dx*0.5,dz/d+T.dz*0.5,true,undefined);h.n++;h.t=T.t;T.hit.set(e,h);F.chain++;F.chainT=1.3;SND.hit(true,2);continue;}
        e.hp-=dm;hitFx(e.x,1.3*e.sc,e.z,true,dm,'#ffffff');flashChar(e.ch.root,80);e.pop=1;
        if(e.hp<=0)koEnemy(e,dx/d+T.dx*0.5,dz/d+T.dz*0.5);
        else{hideTel(e);e.state='hit';e.t=0.7;e.kx=(dx/d)*6+T.dx*5;e.kz=(dz/d)*6+T.dz*5;e.vy=5.5;e.y=0.02;e.emote='hurt';e.et=0;}
        F.chain++;F.chainT=1.3;SND.hit(true,2);
      }
    }
  }
  for(const s of shots)if(s.hostile&&Math.hypot(s.x-pos.x,s.z-pos.z)<2.6)reflectShot(s);
  const B=F.boss;
  if(B&&B.state!=='dead'&&B.state!=='drop'){
    const dx=B.x-pos.x,dz=B.z-pos.z,d=Math.hypot(dx,dz)||0.01;
    T.bt-=dt;if(d<3.6&&T.bhit<3&&T.bt<=0){T.bhit++;T.bt=0.3;hitBoss(Math.round(14*pmul()),true,dx/d,dz/d);SND.hit(true,2);}
  }
  if(T.t>=T.dur){scene.remove(T.mesh);F.torn=null;F.spinA=0;F.flyY=0;F.inv=0;F.atk=null;F.dizzy=0.5;F.dizzyT=0;SND.dizzy();}
}
/* ----- 投射物 ----- */
function fireShot(x,z,dx,dz,speed,dmg,kind){
  const missile=kind==='missile';
  const m=new THREE.Mesh(missile?new THREE.ConeGeometry(0.17,0.75,8):new THREE.SphereGeometry(0.24,10,8),LAMB({color:missile?0xff5a3c:0xf2f6ff,emissive:missile?0x661100:0x222233}));
  m.position.set(x,missile?1.6:1.2,z);if(missile)orient(m,V(dx,0,dz));m.castShadow=true;scene.add(m);
  shots.push({m,x,z,y:m.position.y,vx:dx*speed,vz:dz*speed,life:2.8,dmg,missile,hostile:true});
}
function updShots(dt){
  for(let i=shots.length-1;i>=0;i--){
    const s=shots[i];s.life-=dt;s.x+=s.vx*dt;s.z+=s.vz*dt;s.m.position.x=s.x;s.m.position.z=s.z;
    if(Math.random()<0.7)emit(s.x,s.y,s.z,0,0.2,0,0,s.hostile?(s.missile?'#ffb060':'#ffffff'):(s.missile?'#7fd8ff':'#ffe27a'),0.3,0.22,0,0.2);
    let kill=s.life<=0;
    const a=AREAS[0];if(s.x<a.x0-1||s.x>a.x1+1||s.z<-7||s.z>5)kill=true;
    if(!kill&&s.hostile&&Math.hypot(s.x-pos.x,s.z-pos.z)<0.8&&!F.dead){
      if(lv('thorns')>=5){reflectShot(s);dmgNum(pos.x,2.5,pos.z,'反彈!','#6bd47a');}
      else{
        const d=Math.hypot(s.vx,s.vz)||1;hurtPlayer(s.dmg,s.vx/d,s.vz/d,s.missile);
        if(s.missile){emit(s.x,1,s.z,0,0,0,4,'#ffb060',0.35,0.5,0,8);impact(s.x,1,s.z,12,'#ff9a3c');SND.slam();}
        kill=true;
      }
    }
    if(!kill&&s.hostile&&isHo()&&RP.on&&Math.hypot(s.x-RP.x,s.z-RP.z)<0.8){
      const d=Math.hypot(s.vx,s.vz)||1;NET.send({t:'phit',dmg:s.dmg,dx:s.vx/d,dz:s.vz/d,hv:s.missile?1:0});
      if(s.missile){emit(s.x,1,s.z,0,0,0,4,'#ffb060',0.35,0.5,0,8);impact(s.x,1,s.z,12,'#ff9a3c');SND.slam();}
      kill=true;
    }
    if(!kill&&!s.hostile){
      for(const e of enemies){
        if(e.state==='ko')continue;
        if(Math.hypot(s.x-e.x,s.z-e.z)<0.95){
          const d2=Math.hypot(s.vx,s.vz)||1,dm=s.dmg;
          e.hp-=dm;hitFx(e.x,1.2*e.sc,e.z,s.missile,dm,'#ffe27a');flashChar(e.ch.root,80);e.pop=1;
          if(e.hp<=0)koEnemy(e,s.vx/d2,s.vz/d2);
          else{hideTel(e);e.state='hit';e.t=0.4;e.kx=s.vx/d2*5;e.kz=s.vz/d2*5;e.emote='hurt';e.et=0;}
          if(s.missile){SND.slam();impact(s.x,1,s.z,10,'#ff9a3c');emit(s.x,1,s.z,0,0,0,4,'#ffb060',0.35,0.5,0,6);}else SND.hit(false,1);
          kill=true;break;
        }
      }
      const B2=F.boss;
      if(!kill&&B2&&B2.state!=='dead'&&B2.state!=='drop'&&Math.hypot(s.x-B2.x,s.z-B2.z)<1.8){
        const d2=Math.hypot(s.vx,s.vz)||1;
        hitBoss(s.dmg,s.missile,s.vx/d2,s.vz/d2);
        if(s.missile){SND.slam();impact(s.x,2,s.z,12,'#ff9a3c');emit(s.x,2,s.z,0,0,0,4,'#ffb060',0.4,0.6,0,7);}
        kill=true;
      }
    }
    if(kill){scene.remove(s.m);shots.splice(i,1);}
  }
}
function reflectShot(s){window._rf=(window._rf||0)+1;
  s.hostile=false;
  const sp=Math.hypot(s.vx,s.vz)*1.35+3,tg=nearestTarget(s.x,s.z,14);
  let dx,dz;
  if(tg){dx=tg.x-s.x;dz=tg.z-s.z;}else{dx=Math.sin(face);dz=Math.cos(face);}
  const d=Math.hypot(dx,dz)||1;s.vx=dx/d*sp;s.vz=dz/d*sp;s.life=2.6;
  s.dmg=Math.round((s.missile?22:14)*pmul());
  s.m.material.color.set(s.missile?0x7fd8ff:0xffd24a);if(s.m.material.emissive)s.m.material.emissive.setHex(s.missile?0x1a4a66:0x6a4a00);
  if(s.missile)orient(s.m,V(s.vx,0,s.vz));
  emit(s.x,s.y,s.z,0,0,0,4,'#ffffff',0.25,0.55,0,4);
  for(let i=0;i<8;i++)emit(s.x,s.y,s.z,(Math.random()-0.5)*5,Math.random()*3,(Math.random()-0.5)*5,0,'#ffe27a',0.4,0.25,3);
  slashFx(s.x,s.y,s.z,'jab',Math.sign(s.vx)||1,'#ffe27a');
  F.gauge=Math.min(100,F.gauge+5);F.chain++;F.chainT=1.3;F.zoomK=Math.max(F.zoomK,0.3);
  SND.deflect();
}
/* ----- 魔王機器人 ----- */
function makeBoss(){
  const g=new THREE.Group();
  const mt=c=>LAMB({color:c,emissive:0x1d1233});
  const bx=(w,h,d,c,x,y,z,P)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mt(c));o.position.set(x,y,z);(P||g).add(o);o.castShadow=true;return o;};
  const sp=(r,c,x,y,z,P,basic)=>{const o=new THREE.Mesh(new THREE.SphereGeometry(r,16,12),basic?new THREE.MeshBasicMaterial({color:c}):mt(c));o.position.set(x,y,z);(P||g).add(o);o.castShadow=true;return o;};
  const body=new THREE.Group();body.position.y=2.3;g.add(body);
  bx(2.1,2.3,1.5,'#7077b0',0,0,0,body);bx(1.5,1.2,0.2,'#2e3150',0,0.15,0.78,body);
  const core=sp(0.34,0xff3030,0,0.15,0.9,body,true);
  bx(1.25,0.95,1.1,'#8a91c4',0,1.6,0,body);bx(1.0,0.3,0.1,'#101018',0,1.62,0.56,body);
  const e1=bx(0.24,0.14,0.06,'#ff2a2a',-0.26,1.62,0.62,body),e2=bx(0.24,0.14,0.06,'#ff2a2a',0.26,1.62,0.62,body);
  e1.material=new THREE.MeshBasicMaterial({color:0xff2a2a});e2.material=new THREE.MeshBasicMaterial({color:0xff2a2a});
  [-0.4,0.4].forEach(x=>{const a=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.7,6),mt('#333333'));a.position.set(x,2.35,0);body.add(a);sp(0.1,0xff2a2a,x,2.75,0,body,true);});
  [-1,1].forEach(s=>{const hn=new THREE.Mesh(new THREE.ConeGeometry(0.17,0.75,8),mt('#ffcc33'));hn.position.set(s*0.58,2.3,0.05);hn.rotation.z=-s*0.5;body.add(hn);const sk=new THREE.Mesh(new THREE.ConeGeometry(0.22,0.8,8),mt('#ff4a4a'));sk.position.set(s*1.6,1.6,0);sk.rotation.z=-s*0.7;body.add(sk);});
  sp(0.55,'#4b5080',-1.4,0.9,0,body);sp(0.55,'#4b5080',1.4,0.9,0,body);
  const mkArm=s=>{const p=new THREE.Group();p.position.set(s*1.45,0.9,0);body.add(p);const u=new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.26,1.3,10),mt('#5d6394'));u.position.y=-0.65;u.castShadow=true;p.add(u);sp(0.62,'#d9435a',0,-1.5,0,p);return p;};
  const armL=mkArm(-1),armR=mkArm(1);
  const mkLeg=s=>{const p=new THREE.Group();p.position.set(s*0.6,1.45,0);g.add(p);bx(0.7,1.4,0.7,'#4b5080',0,-0.6,0,p);bx(0.9,0.35,1.2,'#2a2d48',0,-1.3,0.2,p);return p;};
  g.userData={body,armL,armR,legL:mkLeg(-1),legR:mkLeg(1),core};
  return g;
}
function spawnBoss(save){
  if(!save)F.bossN++;const g=makeBoss(),hp=save?save.hp:320+(F.bossN-1)*200,a=AREAS[0];
  const B={g,hp,max:save?save.max:hp,x:clamp(pos.x+7,a.x0+3,a.x1-3),z:-0.8,face:PI,state:'drop',t:0,cd:1.4,vy:0,y:22,age:0,tel:null,ft:0,ice:null,two:false,hitDone:false,walk:0};
  addOutlines(g);g.position.set(B.x,B.y,B.z);g.traverse(o=>{if(o.isMesh&&!o.userData.ol)o.castShadow=true;});scene.add(g);F.boss=B;
  banner(save?'⚠ 魔王回來了 ⚠':'⚠ 魔王機器人 ⚠','ice');SND.bossWarn();SND.say('魔王機器人出現了！',{pitch:0.6,rate:0.8,gap:0});SND.setIntensity(6);
  hud();
}
function removeBoss(){const B=F.boss;if(!B)return;scene.remove(B.g);if(B.tel)scene.remove(B.tel);if(B.ice)scene.remove(B.ice);F.boss=null;}
function bossTel(B,kind,r){
  if(!B.tel||B.tel.userData.kind!==kind){if(B.tel)scene.remove(B.tel);
    const m=kind==='disc'?new THREE.Mesh(new THREE.CircleGeometry(1,48),new THREE.MeshBasicMaterial({color:0xff3b3b,transparent:true,opacity:0.34,depthWrite:false})):null;
    if(!m)return null;m.rotation.x=-PI/2;m.position.y=0.07;m.userData.kind=kind;scene.add(m);B.tel=m;}
  B.tel.position.x=B.x;B.tel.position.z=B.z;B.tel.scale.setScalar(r);return B.tel;
}
function hitBoss(dmg,big,dx,dz,k){
  if(isCl()){const B2=CO.boss;if(B2){hitFx(B2.x-dx*1.2,2.6,B2.z-dz*1.2,big,Math.round(dmg));NET.send({t:'bdmg',dmg:Math.round(dmg),big:big?1:0,dx,dz,k,el:F.elem?F.elem.type:0});}return;}
  const B=F.boss;if(!B||B.state==='dead')return;
  if(B.state==='frozen')dmg*=1.4;
  B.hp-=dmg;hitFx(B.x-dx*1.2,2.6,B.z-dz*1.2,big,dmg,big?'#ffdf4a':'#ffffff');flashChar(B.g,80);if(k!==undefined)lifeSteal(dmg,B);if(k===1&&lv('dual'))B.burn={t:3,dps:3+2*lv('dual'),acc:0};
  B.x+=dx*(big?0.5:0.15);
  if(B.hp<=0){bossDie();return;}
  if(!B.two&&B.hp<B.max*0.5){B.two=true;banner('💢 魔王暴走！','ko');SND.bossWarn();SND.say('可惡的小鬼……',{pitch:0.55,rate:0.8,gap:0});for(let i=0;i<2;i++)spawnEnemy(Math.random()<0.5?'fast':'norm');}
}
function bossDie(){
  const B=F.boss;B.state='dead';B.t=0;hideBossTel(B);if(B.ice){scene.remove(B.ice);B.ice=null;}
  banner('🏆 魔王擊破！','fight');SND.say('魔王擊破！',{pitch:0.8,rate:0.9,gap:0});F.score+=2000;F.kills++;gainXP(8);if(isHo())NET.send({t:'xp',n:8,bko:1});F.slow=0.8;F.shake=1;
  {const kc=$h('killc');kc.classList.remove('pop');void kc.offsetWidth;kc.classList.add('pop');}
  for(const e of enemies){if(e.state!=='ko')koEnemy(e,Math.sign(e.x-B.x)||1,0);}
}
function hideBossTel(B){if(B.tel){scene.remove(B.tel);B.tel=null;}}
function updateBoss(dt,t){
  const B=F.boss;if(!B)return;const U=B.g.userData;B.age+=dt;
  const dx=pos.x-B.x,dz=pos.z-B.z,d=Math.hypot(dx,dz)||0.001,want=Math.atan2(dx,dz);
  let armR=0,armL=0,lean=0,walking=false;
  if(B.state==='drop'){
    B.vy-=28*dt;B.y+=B.vy*dt;
    if(B.y<=0){B.y=0;B.state='walk';B.cd=1.2;F.shake=1.0;F.stop=0.15;SND.slam();banner('👾 魔王降臨！','ice');
      for(let i=0;i<24;i++){const an=i/24*PI*2;emit(B.x+Math.cos(an)*1.5,0.3,B.z+Math.sin(an)*1.5,Math.cos(an)*6,1.5,Math.sin(an)*6,4,'#e8dcc8',0.7,0.5,0,1);}
      emit(B.x,0.2,B.z,0,0,0,4,'#ffffff',0.5,0.8,0,12);
      if(d<4.5)hurtPlayer(10,-dx/d,-dz/d,true);
      F.dizzy=Math.max(F.dizzy,1.0);F.dizzyT=0;F.charging=false;F.tc=null;F.hold=null;F.atk=null;bP.classList.remove('tc');SND.dizzy();
      enemies.forEach(e=>{if(e.state!=='ko'){hideTel(e);e.state='hit';e.t=1.1;e.kx=0;e.kz=0;e.emote='dizzy';e.et=0;}});}
  }else if(B.state==='dead'){
    B.t+=dt;if(Math.random()<0.6){emit(B.x+(Math.random()-0.5)*3,1+Math.random()*4,B.z+(Math.random()-0.5)*2,(Math.random()-0.5)*5,Math.random()*4,(Math.random()-0.5)*5,0,['#ffb060','#ffe27a','#ffffff'][(Math.random()*3)|0],0.8,0.6,3);}
    if(Math.random()<0.15){SND.hit(true,2);F.shake=Math.max(F.shake,0.4);}
    B.g.rotation.z=Math.sin(B.t*40)*0.04;B.g.position.y=-B.t*0.4;
    if(B.t>1.8){
      burst2(B.x,2,B.z);for(let i=0;i<40;i++)emit(B.x,2,B.z,(Math.random()-0.5)*14,Math.random()*9,(Math.random()-0.5)*14,0,['#ff9a3c','#ffe27a','#ffffff'][i%3],1.1,0.55,5);
      SND.explode();F.shake=1;for(let i=0;i<3;i++)dropPack(B.x+(i-1)*2,B.z+(Math.random()-0.5)*2);
      removeBoss();F.wave++;banner('🔥 第 '+F.wave+' 波','fight');SND.setIntensity(F.wave);return;
    }
  }else if(B.state==='frozen'){
    B.ft-=dt;if(B.ice)B.ice.position.set(B.x,2.6,B.z);
    if(B.ft<=0){
      if(B.ice){scene.remove(B.ice);B.ice=null;}
      for(let i=0;i<30;i++)emit(B.x,2.5,B.z,(Math.random()-0.5)*9,Math.random()*6+1,(Math.random()-0.5)*9,5,i%2?'#cfeeff':'#ffffff',1,0.3,5);
      SND.shatter();F.shake=0.8;B.hp-=140;dmgNum(B.x,5.2,B.z,140,'#9fdcff');B.state='walk';B.cd=1.0;
      if(B.hp<=0){bossDie();return;}
    }
  }else{
    let dd=want-B.face;dd=Math.atan2(Math.sin(dd),Math.cos(dd));B.face+=dd*Math.min(1,dt*(B.state==='walk'?4:1.5));
    const sp=B.two?2.5:1.8;
    if(B.state==='walk'){
      B.cd-=dt;
      if(d>3.0){B.x+=dx/d*sp*dt;B.z+=dz/d*sp*dt;walking=true;}
      if(B.cd<=0){
        B.t=0;B.hitDone=false;
        if(d<3.8)B.state='swing';else if(d<10&&Math.random()<0.6)B.state='pound';else B.state='rocket';
      }
    }else if(B.state==='swing'){
      B.t+=dt;armR=B.t<0.7?-2.4*(B.t/0.7):-2.4+(Math.min(B.t,0.85)-0.7)/0.15*3.2;lean=B.t>0.7?0.25:-0.1;
      if(!B.hitDone&&B.t>=0.78){B.hitDone=true;SND.whoosh();if(d<4.1)hurtPlayer(16,dx/d,dz/d,true);
      if(isHo()&&RP.on){const rx=RP.x-B.x,rz=RP.z-B.z,rd=Math.hypot(rx,rz)||1;if(rd<4.1)NET.send({t:'phit',dmg:16,dx:rx/rd,dz:rz/rd,hv:1});}F.shake=Math.max(F.shake,0.4);}
      if(B.t>1.2){B.state='walk';B.cd=B.two?0.8:1.3;}
    }else if(B.state==='pound'){
      B.t+=dt;const k=Math.min(1,B.t/1.0);armR=armL=B.t<1.0?-3.0*k:-3.0+(Math.min(B.t,1.15)-1.0)/0.15*3.6;lean=B.t<1.0?-0.15:0.3;
      const R=B.two?7:5.6;
      if(B.t<1.0){const m=bossTel(B,'disc',R*k);if(m)m.material.opacity=0.2+0.25*k;}
      if(!B.hitDone&&B.t>=1.05){
        B.hitDone=true;hideBossTel(B);SND.slam();F.shake=1.0;F.stop=0.12;
        emit(B.x,0.2,B.z,0,0,0,4,'#ffffff',0.5,0.9,0,R*1.6);emit(B.x,0.3,B.z,0,0,0,4,'#ffd24a',0.7,0.6,0,R*1.2);
        for(let i=0;i<26;i++){const an=i/26*PI*2;emit(B.x+Math.cos(an)*2,0.3,B.z+Math.sin(an)*2,Math.cos(an)*7,2+Math.random()*2,Math.sin(an)*7,0,'#ffb060',0.7,0.4,3);}
        if(d<R+0.3)hurtPlayer(B.two?26:20,dx/d,dz/d,true);
        if(isHo()&&RP.on){const rx=RP.x-B.x,rz=RP.z-B.z,rd=Math.hypot(rx,rz)||1;if(rd<R+0.3)NET.send({t:'phit',dmg:B.two?26:20,dx:rx/rd,dz:rz/rd,hv:1});}
      }
      if(B.t>1.7){B.state='walk';B.cd=B.two?1.0:1.6;}
    }else if(B.state==='rocket'){
      B.t+=dt;armR=-1.6;lean=-0.15;
      if(!B.hitDone&&B.t>=0.8){
        B.hitDone=true;SND.missile();const n=B.two?5:3;
        for(let i=0;i<n;i++){const a2=want+(i-(n-1)/2)*0.22;fireShot(B.x+Math.sin(a2)*1.6,B.z+Math.cos(a2)*1.6,Math.sin(a2),Math.cos(a2),7.5,10,'missile');}
      }
      if(B.t>1.4){B.state='walk';B.cd=B.two?0.9:1.4;}
    }
    if(d<1.7){B.x-=dx/d*(1.7-d)*0.5;B.z-=dz/d*(1.7-d)*0.5;}   // 不要貼進玩家
    const a=AREAS[0];B.x=clamp(B.x,a.x0+2,a.x1-1);B.z=clamp(B.z,-4.6,5.6);
    if(B.state!=='pound')hideBossTel(B);
  }
  // 動畫
  if(B.state!=='frozen'){
    B.walk+=dt*(walking?6:0);
    const sw=Math.sin(B.walk)*0.55*(walking?1:0);U.legL.rotation.x=sw;U.legR.rotation.x=-sw;
    U.armL.rotation.x=armL||(walking?-sw*0.7:0);U.armR.rotation.x=armR||(walking?sw*0.7:0);
    U.body.rotation.x=lean;U.body.position.y=2.3+Math.abs(Math.sin(B.walk))*0.12*(walking?1:0)+Math.sin(t*2)*0.03;
    U.core.scale.setScalar(1+Math.sin(t*6)*0.18+(B.two?0.3:0));
  }
  B.g.position.set(B.x,B.state==='dead'?B.g.position.y:B.y,B.z);
  if(B.state!=='dead')B.g.rotation.y=B.face;
}
function updateFight(dt,t){
  updWords(dt);updNums(dt);updSlash(dt);updShots(dt);
  if(F.dead){
    F.deadT+=dt;
    if(F.deadT>1.8&&!$h('koov').classList.contains('show')){const ov=$h('koov');ov.innerHTML='<div><b>擊倒 '+F.kills+' 人</b><span>得分 '+F.score+'　到達第 '+F.wave+' 波</span><span>最高紀錄 '+F.best+' 人</span><small>回到更衣室…</small></div>';ov.classList.add('show');}
    if(F.deadT>4.4)goHome();
    hud();drawMap();return;
  }
  if(F.comboT>0){F.comboT-=dt;if(F.comboT<=0)F.combo=0;}
  if(F.chainT>0){F.chainT-=dt;if(F.chainT<=0)F.chain=0;}
  if(F.dizzy>0){
    F.dizzy-=dt;F.dizzyT+=dt;const hp=new THREE.Vector3();me.headPos.getWorldPosition(hp);
    for(let i=0;i<4;i++){const an=F.dizzyT*9+i*PI/2;emit(hp.x+Math.cos(an)*0.75,hp.y+0.85+Math.sin(F.dizzyT*5+i)*0.05,hp.z+Math.sin(an)*0.75,0,0,0,0,'#ffe14a',0.09,0.32,0,0);}
  }
  if(F.inv>0)F.inv-=dt;if(F.stun>0){F.stun-=dt;}if(F.streakT>0)F.streakT-=dt;
  if(Math.abs(F.kx)+Math.abs(F.kz)>0.05){const nx=pos.x+F.kx*dt,nz=pos.z+F.kz*dt;if(walkable(nx,nz)){pos.x=nx;pos.z=nz;collide(pos);}F.kx*=Math.pow(0.02,dt);F.kz*=Math.pow(0.02,dt);}
  if(F.atk&&!F.atk.snd&&F.atk.t>=F.atk.hitAt-0.07){F.atk.snd=true;SND.whoosh(F.atk.k);}
  if(F.atk){F.atk.t+=dt;if(!F.atk.hit&&F.atk.t>=F.atk.hitAt){F.atk.hit=true;
      {const fx=Math.sin(face),fz=Math.cos(face),up=F.atk.big;slashFx(pos.x+fx*(up?0.7:1.2),up?2.0:1.15,pos.z+fz*(up?0.7:1.2),up?'upper':'jab',fx,up?'#ffd24a':'#ffffff');
       emit(pos.x+fx*1.1,up?1.9:1.15,pos.z+fz*1.1,0,0,0,4,'#ffffff',0.22,0.35,0,up?7:4.5);F.zoomK=Math.max(F.zoomK,0.3);}
      resolveHit();}if(F.atk.t>=F.atk.dur){F.atk=null;if(F.buf){F.buf=false;punch();}}}
  if(F.atk&&Math.random()<0.8){const fx=Math.sin(face),fz=Math.cos(face);emit(pos.x+fx*0.9,1.0,pos.z+fz*0.9,fx*1.5,0.3,fz*1.5,0,F.atk.big?'#ffd24a':'#ffffff',0.2,0.25,0,0.1);}
  if(F.charging){
    F.ct+=dt;F.gauge=Math.min(100,F.gauge+dt*42*(1+0.3*lv('charge')));F.sT-=dt;
    if(F.sT<=0){F.sT=0.22;SND.chargeTick(F.gauge);}
    for(let i=0;i<4;i++){const an=Math.random()*PI*2,r=0.45+Math.random()*0.75;emit(pos.x+Math.cos(an)*r,0.03,pos.z+Math.sin(an)*r,0,3+Math.random()*2.5,0,8,Math.random()<0.6?'#9fd8ff':'#ffffff',0.55,0.55,-3.5,0.1);}
    if(Math.random()<0.1)groundRing(pos.x,pos.z,0x9fd8ff,2.0,0.4,0.1);
    if(F.gauge>=100&&!F.maxed){F.maxed=true;burst('body',['#9fd8ff','#ffffff'],24);toast('⚡ 集滿了！放開手施放大絕！');SND.sparkle();banner('MAX！','ice');SND.say('力量集滿了！',{pitch:1.3,rate:1.1,gap:0});}
  }
  if(F.gauge<100)F.maxed=false;
  if(F.hold){
    F.hold.t+=dt;
    if(F.hold.t>=0.4&&!F.tc&&!F.atk&&F.stun<=0&&!F.ult&&!F.torn){F.tc={t:0,maxed:false};F.tcS=0;}
    if(F.tc){
      F.tc.t+=dt*(1+0.3*lv('charge'));const pr=Math.min(1,F.tc.t/1);bP.style.setProperty('--p',pr*100);
      const ang=F.tc.t*9;
      for(let i=0;i<4;i++){const an=Math.random()*PI*2,r=0.4+Math.random()*0.8;emit(pos.x+Math.cos(an)*r,0.03,pos.z+Math.sin(an)*r,0,3.5+Math.random()*2.5,0,8,Math.random()<0.6?'#ffd24a':'#fff2c0',0.55,0.6,-3.5,0.1);}
      if(Math.random()<0.14)groundRing(pos.x,pos.z,0xffd24a,2.2,0.4,0.1);
      if(Math.random()<0.5)emit(pos.x+(Math.random()-0.5)*5,0.1,pos.z+(Math.random()-0.5)*5,0,0.3,0,4,'#e8dcc8',0.4,0.3,0,1);
      F.tcS-=dt;if(F.tcS<=0){F.tcS=0.2;SND.chargeTick(pr*100);}
      F.shake=Math.max(F.shake,0.06+pr*0.18);
      if(pr>=1&&!F.tc.maxed){F.tc.maxed=true;burst('body',['#ffffff','#ffe27a'],26);emit(pos.x,0.2,pos.z,0,0,0,4,'#ffffff',0.4,0.5,0,9);toast('🌪 放開！戰鬥龍捲風');SND.sparkle();}
    }
  }
  if(F.ult)updateGaia(dt);
  if(F.torn)updateTornado(dt,t);
  icefxs=icefxs.filter(o=>{
    o.t+=dt;
    if(o.type==='fring'){const s=Math.min(1,o.t/0.5)*13;o.mesh.scale.setScalar(Math.max(0.01,s));o.mesh.material.opacity=Math.max(0,0.95-o.t*1.1);if(o.t>1.0){scene.remove(o.mesh);return false;}}
    else if(o.type==='fdome'){const s=Math.min(1,o.t/0.4)*9;o.mesh.scale.setScalar(Math.max(0.01,s));o.mesh.material.opacity=Math.max(0,0.7-o.t*1.2);if(o.t>0.7){scene.remove(o.mesh);return false;}}
    else if(o.type==='fscorch'){o.mesh.material.opacity=Math.max(0,0.6-Math.max(0,o.t-1.5)*0.4);if(o.t>3.2){scene.remove(o.mesh);return false;}}
    else if(o.type==='fpillar'){
      const k=o.t-o.delay;let sc=0;
      if(k>0&&k<0.22)sc=k/0.22;else if(k>=0.22&&k<0.9)sc=1;else if(k>=0.9)sc=Math.max(0,1-(k-0.9)/0.5);
      o.mesh.scale.y=Math.max(0.001,sc);o.mesh.position.y=o.h*sc/2;
      if(k>1.5){scene.remove(o.mesh);return false;}
    }
    return true;
  });
  // 生成敵人（魔王戰時只生少量雜魚）
  if(!isCl()){
  F.spawnT-=dt;
  const alive=enemies.filter(e=>e.state!=='ko').length,cap=F.boss?3:Math.min(3+F.wave,12);
  if(F.spawnT<=0&&alive<cap){spawnEnemy(F.boss?(Math.random()<0.5?'norm':'fast'):undefined);F.spawnT=(F.boss?5:Math.max(0.7,3.4-F.wave*0.22))+Math.random()*0.8;}
  F.packT-=dt;if(F.packT<=0){F.packT=22;if(packs.length<2){const s=pickRandomSpot();dropPack(s[0],s[1]);}}
  }
  if(!isCl())updateBoss(dt,t);else clientBossTick(dt,t);
  updateSkills(dt,t);updateOrbs(dt,t);updateStar(dt,t);
  {const B=F.boss;
   if(B&&B.state!=='dead'){
     const occ=occludesLine(B.x,2.4,B.z,2.3);
     const tf2=occ?0.35:1;if(B.fadeA===undefined)B.fadeA=1;B.fadeA+=(tf2-B.fadeA)*Math.min(1,dt*14);
     if(B.fadeA<0.985||B.wasFaded){B.wasFaded=B.fadeA<0.985;fadeChar(B.g,B.fadeA);}
   }}
  // 敵人 AI
  if(!isCl()){
  const px=pos.x,pz=pos.z,A0=AREAS[0];
  for(const e of enemies){
    e.et+=dt;if(e.pop>0)e.pop=Math.max(0,e.pop-dt*5);
    if(e.state==='ko'){
      e.t+=dt;e.vy-=18*dt;e.y=Math.max(0,e.y+e.vy*dt);e.x+=e.kx*dt;e.z+=e.kz*dt;e.kx*=Math.pow(0.15,dt);e.kz*=Math.pow(0.15,dt);
      const p=tmpV.set(e.x,0,e.z);collide(p);e.x=p.x;e.z=p.z;
      {const A0=AREAS[0];
       if(e.x>A0.x1-0.3){e.x=A0.x1-0.3;e.kx*=-0.55;impact(e.x,1,e.z,5,'#e8dcc8');}
       if(e.x<A0.x0+0.4){e.x=A0.x0+0.4;e.kx*=-0.55;impact(e.x,1,e.z,5,'#e8dcc8');}
       if(e.z>A0.z1){e.z=A0.z1;e.kz*=-0.55;}
       if(e.z<A0.z0){e.z=A0.z0;e.kz*=-0.55;}}
      e.face+=e.spin*dt*(e.y>0?1:0.2);
      if(e.t>0.9)e.fade=Math.max(0,1-(e.t-0.9)/0.5);
      e.ch.setPose(e.y>0.05?'jump':'lie');
      continue;
    }
    if(e.state==='freeze'){e.ft-=dt;
      if(e.ft<=0){
        if(e.wdot){
          const dm=Math.round(12*pmul());e.hp-=dm;dmgNum(e.x,2.3*e.sc,e.z,dm,'#4aa8ff');
          groundRing(e.x,e.z,0x7fc8ff,3.4,0.5,0.16);waterJet(e.x,e.z,e.sc);SND.splash();e.wdot=null;
          if(e.hp<=0){if(e.ice){scene.remove(e.ice);e.ice=null;}koEnemy(e,(Math.random()-0.5)*2,(Math.random()-0.5)*2);continue;}
        }
        shatterEnemy(e);
      }
      continue;}
    let ttx=px,ttz=pz;e.onClone=false;e.onRemote=false;e.onRClone=false;
    if(isHo()&&RP.on&&RP.room===0){const rdd=Math.hypot(RP.x-e.x,RP.z-e.z),pdd0=Math.hypot(px-e.x,pz-e.z);if(rdd<pdd0){ttx=RP.x;ttz=RP.z;e.onRemote=true;}}
    if(F.clone){const cdd=Math.hypot(F.clone.x-e.x,F.clone.z-e.z),tdd=Math.hypot(ttx-e.x,ttz-e.z);if(cdd<tdd+6){ttx=F.clone.x;ttz=F.clone.z;e.onClone=true;e.onRemote=false;}}
    if(isHo()&&RP.on&&RP.clone){const cd2=Math.hypot(RP.clone.x-e.x,RP.clone.z-e.z),td2=Math.hypot(ttx-e.x,ttz-e.z);if(cd2<td2+6){ttx=RP.clone.x;ttz=RP.clone.z;e.onRClone=true;e.onClone=false;e.onRemote=false;}}
    const dx=ttx-e.x,dz=ttz-e.z,d=Math.hypot(dx,dz)||0.001,want=Math.atan2(dx,dz);let mv=0;
    const face2=(rate)=>{let dd=want-e.face;dd=Math.atan2(Math.sin(dd),Math.cos(dd));e.face+=dd*Math.min(1,dt*rate);};
    const step=(sx,sz,spd)=>{e.x+=sx*spd*dt;e.z+=sz*spd*dt;mv=1;};
    if(e.state==='hit'){
      e.t-=dt;e.x+=e.kx*dt;e.z+=e.kz*dt;e.kx*=Math.pow(0.03,dt);e.kz*=Math.pow(0.03,dt);
      e.vy-=18*dt;e.y=Math.max(0,e.y+e.vy*dt);if(e.y===0&&e.vy<0)e.vy=0;
      if(e.t<=0){e.state='walk';e.emote=null;e.cd=0.3+Math.random()*0.5;e.y=0;}
    }else if(e.state==='walk'){
      face2(7);e.cd-=dt/(e.cdK||1);
      switch(e.type){
        case 'thrower':
          if(d<4.2)step(-dx/d,-dz/d,e.speed*1.1);else if(d>7.5)step(dx/d,dz/d,e.speed);
          if(e.cd<=0&&d<11){e.state='throw';e.t=0.6;e.emote='windup';e.et=0;}
          break;
        case 'healer':{
          if(d<4.5)step(-dx/d,-dz/d,e.speed*1.15);else if(d>9)step(dx/d,dz/d,e.speed);
          if(e.cd<=0){
            let tg=null,bd=1e9;for(const o of enemies){if(o===e||o.state==='ko'||o.state==='freeze'||o.hp>=o.max)continue;const dd=Math.hypot(o.x-e.x,o.z-e.z);if(dd<12&&dd<bd){bd=dd;tg=o;}}
            if(tg){e.state='heal';e.t=0.8;e.tgt=tg;e.emote='ult';e.et=0;}else e.cd=0.6;
          }
          break;}
        case 'charger':
          if(d>7)step(dx/d,dz/d,e.speed);else if(d>3&&e.cd>0.4)step(dx/d,dz/d,e.speed*0.5);
          if(e.cd<=0&&d<8){e.state='tele';e.t=0.9;e.dirx=dx/d;e.dirz=dz/d;e.emote='windup';e.et=0;}
          break;
        case 'heavy':
          if(d>2.3)step(dx/d,dz/d,e.speed);
          if(d<2.7&&e.cd<=0){e.state='slamw';e.t=1.05;e.emote='ult';e.et=0;}
          break;
        case 'fast':
          if(d>3.3)step(dx/d,dz/d,e.speed);
          if(e.cd<=0&&d<7&&d>2.2){e.state='dash';e.t=0.3;e.dirx=dx/d;e.dirz=dz/d;e.emote=null;}
          else if(d<=1.5&&e.cd<=0){e.state='wind';e.t=0.3;e.emote='windup';e.et=0;}
          break;
        default:
          if(d>1.45)step(dx/d,dz/d,e.speed);else if(e.cd<=0){e.state='wind';e.t=0.5;e.emote='windup';e.et=0;}
      }
    }else if(e.state==='wind'){
      e.t-=dt;face2(10);
      if(e.t<=0){e.emote='punchR';e.et=0;e.state='strike';e.t=0.28;e.hitDone=false;SND.whoosh();
        if(Math.random()<0.25)SND.say(pick(['可惡！','看拳！','別跑！','吃我一拳！']),{pitch:0.55,rate:1,gap:1400,vol:0.9});}
    }else if(e.state==='strike'){
      e.t-=dt;
      if(!e.hitDone&&e.t<=0.17){e.hitDone=true;if(d<1.9+(e.sc-1)*0.5)dealHit(e,e.dmg,dx/d,dz/d,e.type==='heavy');}
      if(e.t<=0){e.state='walk';e.emote=null;e.cd=0.8+Math.random()*0.7;}
    }else if(e.state==='dash'){
      e.t-=dt;step(e.dirx,e.dirz,9.5);e.emote='punchR';e.et=0.1;
      emit(e.x,0.2,e.z,0,0.3,0,4,'#e8dcc8',0.3,0.3,0);
      if(d<1.4||e.t<=0){e.state='wind';e.t=0.12;e.emote='windup';e.et=0;}
    }else if(e.state==='throw'){
      e.t-=dt;face2(12);
      if(e.t<=0){fireShot(e.x+Math.sin(e.face)*0.8,e.z+Math.cos(e.face)*0.8,dx/d,dz/d,7.5,e.dmg,'ball');SND.whoosh();e.state='walk';e.emote=null;e.cd=2.0+Math.random()*0.8;}
    }else if(e.state==='heal'){
      e.t-=dt;
      if(e.tgt&&e.tgt.state!=='ko'&&Math.random()<0.5)emit(e.tgt.x,0.4,e.tgt.z,(Math.random()-0.5),2,(Math.random()-0.5),0,'#6bd47a',0.6,0.3,0);
      if(e.t<=0){
        if(e.tgt&&e.tgt.state!=='ko'){e.tgt.hp=Math.min(e.tgt.max,e.tgt.hp+20);dmgNum(e.tgt.x,2.2*e.tgt.sc,e.tgt.z,'+20','#6bd47a');for(let i=0;i<10;i++)emit(e.tgt.x,1.2,e.tgt.z,(Math.random()-0.5)*3,Math.random()*3,(Math.random()-0.5)*3,0,'#9bf0b0',0.7,0.3,0);SND.heal();}
        e.state='walk';e.emote=null;e.cd=3+Math.random();
      }
    }else if(e.state==='tele'){
      e.t-=dt;const m=getTel(e,'line');m.position.set(e.x,0.07,e.z);m.rotation.y=Math.atan2(e.dirx,e.dirz)+PI;m.scale.set(1,9,1);m.material.opacity=0.25+0.3*Math.abs(Math.sin(e.t*18));
      if(e.t<=0){hideTel(e);e.state='rush';e.t=0.75;e.hitDone=false;e.emote='punchR';SND.whoosh();}
    }else if(e.state==='rush'){
      e.t-=dt;const ox=e.x,oz=e.z;step(e.dirx,e.dirz,11);e.et=0.1;
      emit(e.x,0.2,e.z,0,0.3,0,4,'#e8dcc8',0.3,0.35,0);
      const p=tmpV.set(e.x,0,e.z);collide(p);const blocked=Math.hypot(p.x-e.x,p.z-e.z)>0.05;e.x=p.x;e.z=p.z;
      if(!e.hitDone&&d<1.4){e.hitDone=true;dealHit(e,e.dmg,e.dirx,e.dirz,true);}
      if(e.t<=0||blocked){e.state='tired';e.t=1.1;e.emote='hurt';e.et=0;if(blocked){F.shake=Math.max(F.shake,0.3);impact(e.x,1,e.z,8,'#e8dcc8');}}
    }else if(e.state==='tired'){
      e.t-=dt;if(e.t<=0){e.state='walk';e.emote=null;e.cd=1.2+Math.random()*0.8;}
    }else if(e.state==='slamw'){
      e.t-=dt;face2(8);const k=1-Math.max(0,e.t/1.05);const m=getTel(e,'disc');m.position.set(e.x,0.07,e.z);m.scale.setScalar(2.9*k);m.material.opacity=0.2+0.3*k;
      if(e.t<=0){
        hideTel(e);SND.slam();F.shake=Math.max(F.shake,0.7);emit(e.x,0.2,e.z,0,0,0,4,'#ffffff',0.45,0.7,0,7);
        for(let i=0;i<14;i++){const an=i/14*PI*2;emit(e.x,0.3,e.z,Math.cos(an)*5,2,Math.sin(an)*5,0,'#e8dcc8',0.5,0.3,3);}
        if(d<3.1)dealHit(e,e.dmg,dx/d,dz/d,true);
        e.state='walk';e.emote=null;e.cd=1.6+Math.random();
      }
    }
    // 彼此推開
    for(const o of enemies){if(o===e||o.state==='ko'||o.state==='freeze')continue;const ox=e.x-o.x,oz=e.z-o.z,od=Math.hypot(ox,oz);if(od<1.05&&od>0.001){e.x+=ox/od*(1.05-od)*0.5;e.z+=oz/od*(1.05-od)*0.5;}}
    if(d<0.9){e.x-=dx/d*(0.9-d)*0.6;e.z-=dz/d*(0.9-d)*0.6;}
    e.x=clamp(e.x,A0.x0+0.6,A0.x1-0.2);e.z=clamp(e.z,A0.z0,A0.z1);
    if(e.state!=='rush'){const p=tmpV.set(e.x,0,e.z);collide(p);e.x=p.x;e.z=p.z;}
    e.mv+=(mv-e.mv)*Math.min(1,dt*8);
  }
  }else clientEnemiesInterp(dt,t);
  for(const e of enemies){
    if(e.emote==='dizzy'&&e.state!=='ko'){for(let i=0;i<3;i++){const an=t*9+i*PI*2/3;emit(e.x+Math.cos(an)*0.7*e.sc,e.y+2.15*e.sc,e.z+Math.sin(an)*0.7*e.sc,0,0,0,0,'#ffe14a',0.09,0.28,0,0);}}
    if(e.elite&&e.state!=='ko'&&Math.random()<0.5)emit(e.x+(Math.random()-0.5)*0.9,0.2+Math.random()*2.2*e.sc,e.z+(Math.random()-0.5)*0.9,0,1.2,0,0,'#ffd24a',0.5,0.22,-0.5,0.1);
    e.ch.root.position.set(e.x,e.y,e.z);e.ch.root.rotation.y=e.face;
    const pp=e.pop>0?1+0.22*Math.sin(e.pop*PI):1;
    const sc=e.sc*(e.fade===undefined?1:Math.max(0.01,e.fade));e.ch.root.scale.set(sc*(2-pp),sc*pp,sc*(2-pp));
    if(e.state==='freeze')e.ch.tick(0,t,0,'hurt',0);else e.ch.tick(dt,t,(e.state==='walk'||e.state==='dash'||e.state==='rush')?Math.max(e.mv,e.state==='walk'?0:1):0,e.emote,e.et);
    if(e.ice){
      if(e.state!=='freeze'){scene.remove(e.ice);e.ice=null;e.wdot=null;}
      else{
        e.ice.position.set(e.x,0,e.z);
        const U=e.ice.userData||{};
        if(U.kind==='water'){
          const ph=t*4;
          e.ice.scale.set(1+0.05*Math.sin(ph),1-0.04*Math.sin(ph),1+0.05*Math.cos(ph*0.8));
          U.rings[0].rotation.z=t*1.2;U.rings[1].rotation.z=-t*1.5;
          U.bubs.forEach(b=>{const u=b.userData;u.y+=dt*u.sp;if(u.y>2.2*e.sc)u.y=0.12;b.position.set(Math.cos(u.an+t*0.8)*u.r,u.y+0.15,Math.sin(u.an+t*0.8)*u.r);});
          if(Math.random()<0.08)emit(e.x+(Math.random()-0.5)*0.8,2.3*e.sc,e.z+(Math.random()-0.5)*0.8,0,0.5,0,2,'#bfe6ff',0.5,0.14,2);
        }else{
          e.ice.rotation.y+=dt*0.35;
          if(U.shards)U.shards.forEach((sh,i)=>{const an=t*1.4+i*2.1;sh.position.set(Math.cos(an)*1.5*e.sc,(1.0+0.5*Math.sin(t*2+i))*e.sc,Math.sin(an)*1.5*e.sc);sh.rotation.y=t*3;sh.rotation.x=t*2;});
          if(Math.random()<0.1)emit(e.x+(Math.random()-0.5)*1.2,(0.5+Math.random()*1.5)*e.sc,e.z+(Math.random()-0.5)*1.2,0,0.3,0,6,'#ffffff',0.6,0.16,-0.3);
        }
      }
    }
    {const occ=e.state!=='ko'&&occludesLine(e.x,1.1*e.sc,e.z,1.15*e.sc);
     const tf2=occ?0.32:1;if(e.fadeA===undefined)e.fadeA=1;e.fadeA+=(tf2-e.fadeA)*Math.min(1,dt*14);
     if(e.fadeA<0.985||e.wasFaded){e.wasFaded=e.fadeA<0.985;fadeChar(e.ch.root,e.fadeA);}}
    e.bar.visible=e.state!=='ko';e.bar.position.set(e.x,2.45*e.sc,e.z);e.bar.quaternion.copy(camera.quaternion);
    const r=Math.max(0,e.hp/e.max),fg=e.bar.userData.fg;fg.scale.x=Math.max(0.001,r);fg.position.x=-(1-r)*0.5;fg.material.color.set(r<0.3?0xe8505b:e.col);
    e.bar.scale.set(e.sc*0.9,1,1);
  }
  for(let i=enemies.length-1;i>=0;i--){const e=enemies[i];if(e.state==='ko'&&e.t>1.45){removeEnemy(e);enemies.splice(i,1);}}
  for(let i=packs.length-1;i>=0;i--){
    const p=packs[i];p.t+=dt;p.mesh.position.y=0.8+Math.sin(p.t*3)*0.12;p.mesh.rotation.y+=dt*1.6;
    if(p.t>p.life-3)p.mesh.visible=Math.floor(p.t*8)%2===0;
    if(isHo()&&RP.on&&Math.hypot(p.x-RP.x,p.z-RP.z)<1.05){
      scene.remove(p.mesh);packs.splice(i,1);NET.send({t:'pick',k:'pack'});continue;
    }
    if(!isCl()&&Math.hypot(p.x-pos.x,p.z-pos.z)<1.05){
      F.hp=Math.min(F.max,F.hp+35);scene.remove(p.mesh);packs.splice(i,1);
      burst('body',['#9bf0b0','#ffffff','#e8505b'],18);SND.heal();toast('❤ 補血 +35');dmgNum(pos.x,2.4,pos.z,'+35','#6bd47a');if(Math.random()<0.5)SND.say('呼～好多了',{pitch:1.4,gap:900});
    }else if(!isCl()&&p.t>p.life){scene.remove(p.mesh);packs.splice(i,1);}
  }
  hud();drawMap();
}

/* ---------- 升級技能（10 種 × 5 級，升級時三選一） ---------- */
let swords=[],cloneCh=null,lastHealNum=0;
function lv(id){return F.sk[id]||0;}
function pmul(){return 1+0.2*lv('power');}
function vampAmt(L){return Math.max(1,Math.round(L*1.2+9*0.03*L));}
function cloneDur(L){return 4+2*L;}
const SK=[
  {id:'power',ic:'💪',n:'力量增強',d:L=>'所有攻擊傷害 +'+L*20+'%',m:'20% 機率暴擊 ×2'},
  {id:'defense',ic:'🛡️',n:'防禦增強',d:L=>'受到的傷害 -'+L*10+'%',m:'25% 機率完全格擋'},
  {id:'charge',ic:'⚡',n:'集氣加速',d:L=>'集氣速度 +'+L*30+'%，打中敵人集氣更多',m:'放完蓋亞炮保留 30 集氣'},
  {id:'speed',ic:'👟',n:'移動加速',d:L=>'移動速度 +'+L*10+'%',m:'15% 機率自動閃避攻擊'},
  {id:'vamp',ic:'🧛',n:'吸血鬼',d:L=>'拳頭打中敵人回復約 '+vampAmt(L)+' 點血（只有拳頭有效）',m:'擊殺吸魂回 12 血'},
  {id:'swords',ic:'🗡️',n:'萬劍歸宗',d:L=>(L+1)+' 把飛劍環繞身邊，自動射向敵人',m:'飛劍繼承屬性球效果'},
  {id:'shock',ic:'🌋',n:'隔山打牛',d:L=>'攻擊範圍 +'+L*12+'%，出拳引發圓形震波，震飛周圍 '+(2.2+0.6*L).toFixed(1)+' 公尺內所有敵人',m:'震波傷害提升到 75%'},
  {id:'thorns',ic:'🌵',n:'荊棘王',d:L=>'被打時反傷周圍敵人（受傷的 '+Math.round(40+30*L)+'%）',m:'自動反彈飛來的彈幕'},
  {id:'clone',ic:'👥',n:'影分身',d:L=>'召喚分身吸引敵人注意，持續 '+cloneDur(L)+' 秒',m:'分身會出拳攻擊'},
  {id:'dual',ic:'☯️',n:'左右互博',d:L=>'①冰凍 '+(0.8+0.3*L).toFixed(1)+' 秒 ②燃燒每秒 '+(3+2*L)+' 傷 ③上勾拳擊飛 ×'+(1+0.25*L).toFixed(2),m:'上勾拳擊飛附加燃燒'}
];
function gainXP(n){
  F.xp+=n;
  while(F.xp>=F.xpNeed){F.xp-=F.xpNeed;F.upN++;F.xpNeed=3+F.upN*2;F.lvlQ++;}
  if(F.lvlQ>0&&!F.pause&&!F.dead)showLevelUp();
}
let lvRound=0,lvCdInt=null,lvWait=false,myLvN=0;
function lvResume(){lvWait=false;F.pause=false;$h('lvl').classList.remove('show');if(lvCdInt){clearInterval(lvCdInt);lvCdInt=null;}}
function showLevelUp(){
  const pool=SK.filter(s=>lv(s.id)<5);
  if(!pool.length){F.lvlQ=0;return;}
  const picks=[];while(picks.length<3&&pool.length)picks.push(pool.splice((Math.random()*pool.length)|0,1)[0]);
  F.pause=true;F.lvlQ--;F.charging=false;F.tc=null;F.hold=null;F.atk=null;F.buf=false;bP.classList.remove('tc');bP.style.setProperty('--p',0);
  const box=$h('lvl');box.innerHTML='<h2>⭐ 升級！選一個技能</h2><div class="cards"></div>';
  const wrap=box.querySelector('.cards');
  picks.forEach((s,i)=>{
    const L=lv(s.id),c=document.createElement('button');c.className='card';
    c.innerHTML='<i>'+(i+1)+'</i><div class="ic">'+s.ic+'</div><b>'+s.n+'</b><em>'+(L?'Lv '+L+' → Lv '+(L+1):'新技能 Lv 1')+'</em><span>'+s.d(L+1)+'</span>'+((L+1===5&&s.m)?'<i class="mast">⭐ 大師：'+s.m+'</i>':'')+'<div class="pips">'+'●'.repeat(L+1)+'○'.repeat(4-L)+'</div>';
    c.onclick=()=>pickSkill(s.id);wrap.appendChild(c);
  });
  box.classList.add('show');F.lvlPicks=picks;SND.round();
  if(NET.state()==='on'){
    lvRound++;
    box.style.position='relative';
    const cd=document.createElement('div');
    cd.style.cssText='position:absolute;top:8px;right:16px;font-size:36px;font-weight:900;color:#ff8a2a;text-shadow:0 2px 0 rgba(255,255,255,.8)';
    cd.textContent='10';box.appendChild(cd);
    let left=10;
    if(lvCdInt)clearInterval(lvCdInt);
    lvCdInt=setInterval(()=>{
      left--;cd.textContent=Math.max(0,left);
      if(left<=0){
        clearInterval(lvCdInt);lvCdInt=null;
        if(F.lvlPicks&&F.pause)pickSkill(F.lvlPicks[(Math.random()*F.lvlPicks.length)|0].id);
        else if(lvWait)lvResume();
      }
    },1000);
  }
}
function pickSkill(id){
  if(!F.pause)return;
  F.sk[id]=lv(id)+1;$h('lvl').classList.remove('show');F.pause=false;F.lvlPicks=null;
  SND.sparkle();burst('body',['#ffe14a','#ffffff'],22);toast(SK.find(s=>s.id===id).n+'  Lv '+F.sk[id]);
  if(id==='clone')F.cloneCd=Math.min(F.cloneCd,0.4);
  skillHud();hud();save();
  if(F.lvlQ>0)setTimeout(showLevelUp,300);
}
function skillHud(){
  const el=$h('skills');el.innerHTML='';
  SK.forEach(s=>{const L=lv(s.id);if(!L)return;const d=document.createElement('div');d.className='sk';d.title=s.n;d.innerHTML=s.ic+'<small>'+L+'</small>';el.appendChild(d);});
}
addEventListener('keydown',e=>{if(F.lvlPicks&&F.pause&&e.key>='1'&&e.key<='3'){const p=F.lvlPicks[+e.key-1];if(p){pickSkill(p.id);e.stopPropagation();}}},true);

/* ----- 吸血鬼 / 荊棘 ----- */
function lifeSteal(dmg){
  const L=lv('vamp');if(!L)return;
  const h=Math.max(1,Math.round(L*1.2+dmg*0.03*L));
  if(F.hp<F.max){F.hp=Math.min(F.max,F.hp+h);
    const now=performance.now();if(now-lastHealNum>300){lastHealNum=now;dmgNum(pos.x,2.4,pos.z,'+'+h,'#6bd47a');for(let i=0;i<3;i++)emit(pos.x+(Math.random()-0.5)*0.8,0.8,pos.z+(Math.random()-0.5)*0.8,0,1.6,0,0,'#6bd47a',0.5,0.22,-0.5,0.1);}
  }
}
function thornsReflect(raw){
  const L=lv('thorns');if(!L)return;
  emit(pos.x,0.15,pos.z,0,0,0,4,'#6bd47a',0.3,0.5,0,5);
  for(const e of enemies){
    if(e.state==='ko')continue;
    const dx=e.x-pos.x,dz=e.z-pos.z,d=Math.hypot(dx,dz)||0.001;
    if(d<2.7){
      const dm=Math.max(5,Math.round(raw*(0.4+0.3*L)));
      if(isCl()){cDmg(e,dm,4,dx/d,dz/d,false,undefined);continue;}
      e.hp-=dm;dmgNum(e.x,2*e.sc,e.z,dm,'#6bd47a');impact(e.x,1.2,e.z,6,'#6bd47a');flashChar(e.ch.root,70);
      if(e.hp<=0)koEnemy(e,dx/d,dz/d);else if(e.state!=='freeze'){e.state='hit';e.t=0.3;e.kx=dx/d*4;e.kz=dz/d*4;e.emote='hurt';e.et=0;}
    }
  }
}
/* ----- 左右互博：冰凍 / 燃燒 ----- */
function freezeEnemy(e,dur){
  if(e.state==='ko'||e.state==='freeze')return;
  hideTel(e);e.state='freeze';e.ft=dur;e.emote=null;
  const b=new THREE.Mesh(new THREE.BoxGeometry(1.2*e.sc,2.3*e.sc,1.2*e.sc),new THREE.MeshBasicMaterial({color:0x9fdcff,transparent:true,opacity:0.5,depthWrite:false}));
  b.position.set(e.x,1.15*e.sc,e.z);scene.add(b);e.ice=b;
  for(let i=0;i<8;i++)emit(e.x,1.2,e.z,(Math.random()-0.5)*3,Math.random()*2,(Math.random()-0.5)*3,6,'#ffffff',0.7,0.26,0);
}
function shatterEnemy(e){
  if(e.ice){scene.remove(e.ice);e.ice=null;}
  for(let i=0;i<14;i++)emit(e.x,1.2*e.sc,e.z,(Math.random()-0.5)*6,Math.random()*4+1,(Math.random()-0.5)*6,5,i%2?'#cfeeff':'#ffffff',0.8,0.2,5);
  SND.shatter();e.state='walk';e.emote=null;e.cd=0.4;
}
/* ----- 萬劍歸宗 ----- */
function makeSword(){
  const g=new THREE.Group(),bm=c=>new THREE.MeshBasicMaterial({color:c});
  const bl=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.9,0.03),bm(0xcfefff));bl.position.y=0.45;g.add(bl);
  const tip=new THREE.Mesh(new THREE.ConeGeometry(0.07,0.25,4),bm(0xcfefff));tip.position.y=1.02;g.add(tip);
  const gd=new THREE.Mesh(new THREE.BoxGeometry(0.3,0.06,0.06),bm(0xffd24a));g.add(gd);
  const hl=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.3,6),bm(0x8a5a3a));hl.position.y=-0.17;g.add(hl);
  g.scale.setScalar(1.15);scene.add(g);return g;
}
function nearestTarget(x,z,maxd){
  let tg=null,bd=maxd;
  for(const e of enemies){if(e.state==='ko')continue;const d=Math.hypot(e.x-x,e.z-z);if(d<bd){bd=d;tg=e;}}
  const B=F.boss||CO.boss;if(B&&B.state!=='dead'&&B.state!=='drop'){const d=Math.hypot(B.x-x,B.z-z)-1;if(d<bd){bd=d;tg=B;}}
  return tg;
}
function swordStrike(s){
  const tg=s.tgt,L=lv('swords'),dm=Math.round((9+3*L)*pmul()),useEl=L>=5&&F.elem;
  if(tg===F.boss){if(F.boss&&F.boss.state!=='dead')hitBoss(dm,false,Math.sign(F.boss.x-s.x)||1,0);}
  else if(tg&&tg.state!=='ko'){
    if(isCl()){const sv=F.elem;if(!useEl)F.elem=null;cDmg(tg,dm,2.5,dir,0,false,undefined);F.elem=sv;SND.hit(false,1);return;}
    tg.hp-=dm;dmgNum(tg.x,2.2*tg.sc,tg.z,dm,'#bfe8ff');impact(tg.x,1.3*tg.sc,tg.z,6,'#bfe8ff');flashChar(tg.ch.root,60);
    emit(tg.x,1.2*tg.sc,tg.z,0,0,0,4,'#bfe8ff',0.2,0.25,0,3);
    if(tg.hp<=0)koEnemy(tg,Math.sign(tg.x-s.x)||1,0);else if(tg.state!=='freeze'){hideTel(tg);tg.state='hit';tg.t=0.22;tg.kx=(Math.sign(tg.x-s.x)||1)*2.5;tg.emote='hurt';tg.et=0;}
  }
  SND.hit(false,1);
}
function updateSwords(dt,t){
  const L=lv('swords'),n=(F.on&&!F.dead&&L)?(L+1+(L>=5?2:0)):0;
  while(swords.length<n)swords.push({g:makeSword(),state:'orbit',cd:0.4+Math.random()*0.6,tgt:null,x:pos.x,y:1.7,z:pos.z});
  while(swords.length>n)scene.remove(swords.pop().g);
  swords.forEach((s,i)=>{
    const base=t*2.6+i*PI*2/Math.max(1,swords.length);
    if(s.state==='orbit'){
      const ox=pos.x+Math.cos(base)*1.75,oz=pos.z+Math.sin(base)*1.75,oy=1.7+Math.sin(t*3+i)*0.12,k=Math.min(1,dt*14);
      s.x+=(ox-s.x)*k;s.y+=(oy-s.y)*k;s.z+=(oz-s.z)*k;
      s.g.position.set(s.x,s.y,s.z);orient(s.g,V(Math.cos(base)*0.4,1,Math.sin(base)*0.4));
      if(s.g.userData.gl)s.g.userData.gl.material.color.setHex((L>=5&&F.elem)?ELEMS[F.elem.type].col:0x7fd8ff);
      s.cd-=dt;
      if(s.cd<=0){const tg=nearestTarget(pos.x,pos.z,10);if(tg){s.tgt=tg;s.state='fly';SND.whoosh(0);}else s.cd=0.3;}
    }else{
      const tg=s.tgt;
      if(!tg||(tg!==F.boss&&tg.state==='ko')||(tg===F.boss&&!F.boss)){s.state='orbit';s.cd=0.3;return;}
      const dx=tg.x-s.x,dy=1.2-s.y,dz=tg.z-s.z,d=Math.hypot(dx,dy,dz)||1,sp=24*dt;
      if(d<=sp+0.7){swordStrike(s);s.state='orbit';s.cd=Math.max(L>=5?0.32:0.5,1.4-0.1*L);}
      else{s.x+=dx/d*sp;s.y+=dy/d*sp;s.z+=dz/d*sp;s.g.position.set(s.x,s.y,s.z);orient(s.g,V(dx,dy,dz));emit(s.x,s.y,s.z,0,0,0,0,'#bfe8ff',0.25,0.2,0,0.1);}
    }
  });
}
/* ----- 影分身 ----- */
function ghostify(root){root.traverse(o=>{if(o.isMesh&&o.material){o.material.transparent=true;o.material.opacity=0.55;if(o.material.emissive)o.material.emissive.setHex(0x1c4a7a);o.material.depthWrite=false;}});}
function cloneSmoke(x,z){for(let i=0;i<14;i++)emit(x+(Math.random()-0.5)*0.8,0.3+Math.random()*1.4,z+(Math.random()-0.5)*0.8,(Math.random()-0.5)*2,Math.random()*1.5,(Math.random()-0.5)*2,4,'#b8d8ff',0.5,0.4,0,1);}
function spawnClone(L){
  if(!cloneCh){cloneCh=new Character();scene.add(cloneCh.root);cloneCh.update(cfg,outfit);ghostify(cloneCh.root);}
  cloneCh.root.visible=true;
  F.clone={ch:cloneCh,x:pos.x+Math.sin(face+PI/2)*2.2,z:pos.z+Math.cos(face+PI/2)*2.2,face,t:cloneDur(L),mv:0,pop:0};
  cloneSmoke(F.clone.x,F.clone.z);SND.sparkle();toast('👥 影分身！');
}
function killClone(){
  if(F.clone){cloneSmoke(F.clone.x,F.clone.z);F.clone.ch.root.visible=false;F.clone=null;}
  F.cloneCd=Math.max(5,14-1.5*lv('clone'));
}
function updateClone(dt,t){
  const L=lv('clone');
  if(!F.on||F.dead||!L){if(F.clone){F.clone.ch.root.visible=false;F.clone=null;}return;}
  if(!F.clone){F.cloneCd-=dt;if(F.cloneCd<=0)spawnClone(L);return;}
  const C=F.clone;C.t-=dt;
  const tx=pos.x+Math.cos(t*0.9)*3.8,tz=pos.z+Math.sin(t*0.9)*2.4,dx=tx-C.x,dz=tz-C.z,d=Math.hypot(dx,dz);
  let mv=0;if(d>0.3){C.x+=dx/d*Math.min(d,5.2*dt);C.z+=dz/d*Math.min(d,5.2*dt);mv=1;let dd=Math.atan2(dx,dz)-C.face;dd=Math.atan2(Math.sin(dd),Math.cos(dd));C.face+=dd*Math.min(1,dt*10);}
  const A0=AREAS[0];C.x=clamp(C.x,A0.x0+0.6,A0.x1-0.2);C.z=clamp(C.z,A0.z0,A0.z1);
  C.mv+=(mv-C.mv)*Math.min(1,dt*8);
  C.ch.root.position.set(C.x,0,C.z);C.ch.root.rotation.y=C.face;
  const k=C.pop>0?1+0.15*Math.sin(C.pop*PI):1;C.pop=Math.max(0,C.pop-dt*5);C.ch.root.scale.set(2-k,k,2-k);
  C.ch.root.visible=C.t>1?true:Math.floor(C.t*10)%2===0;
  if(lv('clone')>=5){
    C.atk=(C.atk||0)-dt;C.emT=(C.emT||0)-dt;
    if(C.atk<=0){
      C.atk=0.6;
      let tg2=null,bd2=2.3;
      for(const e2 of enemies){if(e2.state==='ko')continue;const d2=Math.hypot(e2.x-C.x,e2.z-C.z);if(d2<bd2){bd2=d2;tg2=e2;}}
      if(tg2){C.emT=0.3;C.face=Math.atan2(tg2.x-C.x,tg2.z-C.z);
        const dx2=(tg2.x-C.x)/bd2||1,dz2=(tg2.z-C.z)/bd2||0;
        hitEnemy(tg2,14,3.5,dx2,dz2,false,undefined);SND.whoosh(0);}
    }
  }
  C.ch.tick(dt,t,C.mv,C.emT>0?'punchR':null,C.emT>0?0.3-C.emT:0);
  if(Math.random()<0.4)emit(C.x+(Math.random()-0.5)*0.8,0.3,C.z+(Math.random()-0.5)*0.8,0,1,0,0,'#9fd0ff',0.5,0.16,-0.4,0.1);
  if(C.t<=0)killClone();
}
function cloneHurt(){const C=F.clone;if(!C)return;C.pop=1;emit(C.x,1.2,C.z,0,0,0,4,'#9fd0ff',0.25,0.4,0,3);for(let i=0;i<5;i++)emit(C.x,1.2,C.z,(Math.random()-0.5)*4,Math.random()*3,(Math.random()-0.5)*4,0,'#cfe8ff',0.4,0.22,3);}
function dealHit(e,dmg,dx,dz,heavy){if(e.onClone)cloneHurt();else if(e.onRClone)NET.send({t:'clh'});else if(e.onRemote)NET.send({t:'phit',dmg,dx,dz,hv:heavy?1:0});else hurtPlayer(dmg,dx,dz,heavy);}
function clearSkillObjs(){
  swords.forEach(s=>scene.remove(s.g));swords=[];
  if(F.clone){F.clone.ch.root.visible=false;F.clone=null;}
}
/* ----- 每幀更新（燃燒、飛劍、分身） ----- */
function updateSkills(dt,t){
  if(dt<=0)return;
  for(const e of enemies){
    if(e.wdot){
      if(e.state!=='freeze')e.wdot=null;
      else{e.wdot.acc+=dt;
        if(Math.random()<0.3)emit(e.x+(Math.random()-0.5)*0.8,(0.4+Math.random()*1.6)*e.sc,e.z+(Math.random()-0.5)*0.8,0,1.2,0,2,'#6ac0ff',0.5,0.2,-1,0.1);
        if(!isCl()&&e.wdot.acc>=0.5){e.wdot.acc-=0.5;const dm=Math.max(1,Math.round(5.5*pmul()));e.hp-=dm;dmgNum(e.x,2.1*e.sc,e.z,dm,'#4aa8ff');
          if(e.hp<=0){e.wdot=null;shatterEnemy(e);koEnemy(e,(Math.random()-0.5)*2,(Math.random()-0.5)*2);continue;}}
      }
    }
    if(!e.burn||e.state==='ko')continue;
    e.burn.t-=dt;e.burn.acc+=dt;
    if(Math.random()<0.6)emit(e.x+(Math.random()-0.5)*0.6,0.4+Math.random()*1.6*e.sc,e.z+(Math.random()-0.5)*0.6,0,1.5,0,Math.random()<0.5?0:4,['#ff7a1c','#ffd24a','#ff4a1a'][(Math.random()*3)|0],0.45,0.26,-0.6,0.1);
    if(!isCl()&&e.burn.acc>=0.5){
      e.burn.acc-=0.5;const dm=Math.max(1,Math.round(e.burn.dps*0.5*pmul()));e.hp-=dm;dmgNum(e.x,2.1*e.sc,e.z,dm,'#ff8a3c');
      if(e.hp<=0){e.burn=null;koEnemy(e,(Math.random()-0.5)*2,(Math.random()-0.5)*2);}
    }
    if(e.burn&&!isCl()){
      e.burn.sp=(e.burn.sp||0)-dt;
      if(e.burn.sp<=0){e.burn.sp=0.4;
        for(const o of enemies){
          if(o===e||o.burn||o.state==='ko'||o.state==='freeze')continue;
          if(Math.hypot(o.x-e.x,o.z-e.z)<2.0){
            o.burn={t:2.6,dps:e.burn.dps,acc:0};
            groundRing(o.x,o.z,0xff7a1c,1.8,0.4,0.14);
            const mx=(e.x+o.x)/2,mz=(e.z+o.z)/2;
            for(let q=0;q<6;q++)emit(mx,0.7,mz,(o.x-e.x)*1.2,1.5+Math.random(),(o.z-e.z)*1.2,7,'#ffffff',0.45,0.4,-1,0.2);
            if(Math.random()<0.5)SND.ignite();
          }
        }
      }
    }
    if(e.burn&&e.burn.t<=0){e.burn=null;clearBurnFx(e);}
  }
  const B=F.boss;
  if(B&&B.burn&&B.state!=='dead'){
    B.burn.t-=dt;B.burn.acc+=dt;
    if(Math.random()<0.7)emit(B.x+(Math.random()-0.5)*1.6,0.6+Math.random()*3.4,B.z+(Math.random()-0.5)*1.2,0,1.5,0,Math.random()<0.5?0:4,['#ff7a1c','#ffd24a','#ff4a1a'][(Math.random()*3)|0],0.45,0.4,-0.6,0.1);
    if(B.burn.acc>=0.5){B.burn.acc-=0.5;const dm=Math.max(1,Math.round(B.burn.dps*0.5*pmul()));B.hp-=dm;dmgNum(B.x,5.2,B.z,dm,'#ff8a3c');if(B.hp<=0){B.burn=null;bossDie();}}
    if(B.burn&&B.burn.t<=0)B.burn=null;
  }
  updateSwords(dt,t);updateClone(dt,t);
}

/* ================= 技能特效強化（後面的同名函式會覆蓋前面的） ================= */
let sfx=[],swordRing=null;
const glowTex=canvasTex(128,128,g=>{const r=g.createRadialGradient(64,64,2,64,64,62);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(0.35,'rgba(255,255,255,0.55)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,128,128);});
const crackTex=canvasTex(256,128,g=>{
  g.strokeStyle='#3a2414';g.lineCap='round';
  const br=(x,y,a,len,d)=>{if(d>3||len<10)return;const x2=x+Math.cos(a)*len,y2=y+Math.sin(a)*len;g.lineWidth=Math.max(2,7-d*2);g.beginPath();g.moveTo(x,y);g.lineTo(x2,y2);g.stroke();br(x2,y2,a+0.55*(Math.random()-0.25),len*0.72,d+1);if(Math.random()<0.7)br(x2,y2,a-0.65,len*0.55,d+1);};
  for(let i=0;i<5;i++)br(6,64,(i-2)*0.3,62+Math.random()*34,0);
});
const markTex=canvasTex(64,64,g=>{g.font='900 54px Arial Black,sans-serif';g.textAlign='center';g.textBaseline='middle';g.lineWidth=9;g.strokeStyle='#ffffff';g.strokeText('!',32,34);g.fillStyle='#e8505b';g.fillText('!',32,34);});
function fxAdd(mesh,life,upd){scene.add(mesh);sfx.push({mesh,life,t:0,upd});}
function updFx(dt){for(let i=sfx.length-1;i>=0;i--){const f=sfx[i];f.t+=dt;f.upd(Math.min(1,f.t/f.life),f.t,f.mesh);if(f.t>=f.life){scene.remove(f.mesh);sfx.splice(i,1);}}}
function addGlowSprite(col,sc){return new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:col,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));}
function groundRing(x,z,col,maxR,life,w){
  const m=new THREE.Mesh(new THREE.RingGeometry(1-(w||0.1),1,56),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0.6,side:2,depthWrite:false,blending:THREE.AdditiveBlending}));
  m.rotation.x=-PI/2;m.position.set(x,0.1,z);
  fxAdd(m,life,k=>{m.scale.setScalar(Math.max(0.01,k*maxR));m.material.opacity=0.6*(1-k);});
}
function spikeFx(x,z,h,r,col,delay,hold){
  const sp=new THREE.Mesh(new THREE.ConeGeometry(r,h,6),new THREE.MeshBasicMaterial({color:col}));
  sp.position.set(x,0,z);sp.scale.y=0.001;
  fxAdd(sp,delay+hold+0.5,(k,t)=>{const kk=t-delay;let s=0;if(kk>0&&kk<0.1)s=kk/0.1;else if(kk>=0.1&&kk<hold)s=1;else if(kk>=hold)s=Math.max(0,1-(kk-hold)/0.35);sp.scale.y=Math.max(0.001,s);sp.position.y=h*s/2;});
}
/* ----- 升級光柱 ----- */
function levelFx(){
  groundRing(pos.x,pos.z,0xffd24a,4,0.6,0.15);
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(0.9,0.9,6,20,1,true),new THREE.MeshBasicMaterial({color:0xffe27a,transparent:true,opacity:0.34,side:2,depthWrite:false,blending:THREE.AdditiveBlending}));
  beam.position.set(pos.x,3,pos.z);fxAdd(beam,0.8,k=>{beam.material.opacity=0.34*(1-k);beam.scale.set(1-k*0.5,1,1-k*0.5);beam.position.set(pos.x,3,pos.z);});
  for(let i=0;i<20;i++)emit(pos.x+(Math.random()-0.5)*1.4,0.2,pos.z+(Math.random()-0.5)*1.4,0,3+Math.random()*3,0,0,'#ffe27a',0.9,0.35,-0.5,0.1);
}
function pickSkill(id){
  if(!F.pause||!F.lvlPicks)return;
  F.sk[id]=lv(id)+1;$h('lvl').classList.remove('show');F.pause=false;F.lvlPicks=null;
  SND.sparkle();levelFx();toast(SK.find(s=>s.id===id).n+'  Lv '+F.sk[id]);
  if(F.sk[id]===5){banner('⭐ 大師解鎖 ⭐','fight');SND.starPower();burst('body',['#ffd24a','#fff6d8','#ffffff'],30);groundRing(pos.x,pos.z,0xffd24a,4.5,0.7,0.14);}
  if(id==='clone')F.cloneCd=Math.min(F.cloneCd,0.4);
  skillHud();hud();
  if(NET.state()==='on'){
    NET.send({t:'sk',sk:F.sk});
    myLvN=lvRound;NET.send({t:'lvp',n:lvRound});
    if(F.lvlQ<=0&&RP.on&&RP.room===0&&(RP.lvpN|0)<lvRound){
      lvWait=true;F.pause=true;
      const box2=$h('lvl');box2.innerHTML='<h2>⌛ 等待夥伴選擇技能…</h2>';box2.classList.add('show');
      if(lvCdInt)clearInterval(lvCdInt);
      lvCdInt=setTimeout(()=>{lvCdInt=null;if(lvWait)lvResume();},8000);
    }else if(F.lvlQ<=0&&lvCdInt){clearInterval(lvCdInt);lvCdInt=null;}
  }
  if(F.lvlQ>0)setTimeout(showLevelUp,300);
}
/* ----- 吸血：血球飛回身上 ----- */
function siphonFx(sx,sz){
  for(let i=0;i<3;i++){
    const o=addGlowSprite(0xff5a7a);o.scale.set(0.6,0.6,1);const ox=(Math.random()-0.5)*1.2,oz=(Math.random()-0.5)*1.2;
    o.position.set(sx,1.2,sz);
    fxAdd(o,0.4+i*0.08,k=>{const e=k*k;o.position.set(sx+(pos.x-sx)*e+ox*(1-e),1.2+(1.5-1.2)*e+Math.sin(k*PI)*0.6,sz+(pos.z-sz)*e+oz*(1-e));o.scale.setScalar(0.6*(1-k*0.5));});
  }
}
function lifeSteal(dmg,src){
  if(CO.apply)return;
  const L=lv('vamp');if(!L)return;
  const h=Math.max(1,Math.round(L*1.2+dmg*0.03*L));
  if(src)siphonFx(src.x,src.z);
  if(F.hp<F.max){
    F.hp=Math.min(F.max,F.hp+h);
    const now=performance.now();
    if(now-lastHealNum>180){lastHealNum=now;
      dmgNum(pos.x,2.5,pos.z,'+'+h,'#49e07a');
      emit(pos.x,1.2,pos.z,0,0,0,4,'#49e07a',0.35,0.5,0,4);
      for(let i=0;i<4;i++)emit(pos.x+(Math.random()-0.5)*1.0,0.4+Math.random()*0.8,pos.z+(Math.random()-0.5)*1.0,0,2.2,0,2,'#49e07a',0.7,0.3,-1.2,0.1);
    }
  }
}
/* ----- 荊棘王：地刺一圈 ----- */
function thornsFx(){
  groundRing(pos.x,pos.z,0x6bd47a,3.1,0.4,0.12);groundRing(pos.x,pos.z,0x3ec45a,2.2,0.55,0.18);
  for(let i=0;i<14;i++){const an=i/14*PI*2+Math.random()*0.2;
    emit(pos.x+Math.cos(an)*0.5,0.45,pos.z+Math.sin(an)*0.5,Math.cos(an)*6,0.9+Math.random(),Math.sin(an)*6,9,i%2?'#4ec86a':'#86f09a',0.42,0.5,2,0.1);}
  for(let i=0;i<8;i++)emit(pos.x,0.9,pos.z,(Math.random()-0.5)*3.5,1.5+Math.random()*2,(Math.random()-0.5)*3.5,1,'#9af0a8',0.65,0.24,2);
  emit(pos.x,0.8,pos.z,0,0,0,4,'#6bd47a',0.3,0.6,0,4);
}
function thornsReflect(raw){
  const L=lv('thorns');if(!L)return;
  thornsFx();
  for(const e of enemies){
    if(e.state==='ko')continue;
    const dx=e.x-pos.x,dz=e.z-pos.z,d=Math.hypot(dx,dz)||0.001;
    if(d<2.7){
      const dm=Math.max(5,Math.round(raw*(0.4+0.3*L)));e.hp-=dm;dmgNum(e.x,2*e.sc,e.z,dm,'#6bd47a');impact(e.x,1.2,e.z,6,'#86f09a');flashChar(e.ch.root,70);
      if(e.hp<=0)koEnemy(e,dx/d,dz/d);else if(e.state!=='freeze'){e.state='hit';e.t=0.3;e.kx=dx/d*4;e.kz=dz/d*4;e.emote='hurt';e.et=0;}
    }
  }
}
/* ----- 隔山打牛：地面裂開、地刺、衝擊波 ----- */
function shockFx(x,z,range){
  for(let i=0;i<3;i++){
    const dl=i*0.08,life=0.5+dl,col=[0xfff0d8,0xffd9a0,0xe8b070][i];
    const m=new THREE.Mesh(new THREE.RingGeometry(0.85,1,48),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0.75,side:2,depthWrite:false,blending:THREE.AdditiveBlending}));
    m.rotation.x=-PI/2;m.position.set(x,0.1+i*0.015,z);
    fxAdd(m,life,k=>{const kk=Math.max(0,(k*life-dl)/0.5);m.scale.setScalar(Math.max(0.01,kk*range));m.material.opacity=0.75*(1-kk);});
  }
  for(let i=0;i<18;i++){const an=i/18*PI*2;
    emit(x+Math.cos(an)*0.8,0.15,z+Math.sin(an)*0.8,Math.cos(an)*5.5,1.2+Math.random()*1.5,Math.sin(an)*5.5,4,'#d8b880',0.5,0.42,3,0.6);
    if(i%2)emit(x+Math.cos(an)*0.6,0.2,z+Math.sin(an)*0.6,Math.cos(an)*4,2.5+Math.random()*2,Math.sin(an)*4,0,'#c0a070',0.6,0.22,8);}
  emit(x,0.3,z,0,0,0,4,'#ffe2b0',0.3,0.7,0,5);
}
/* ----- 命中判定 ----- */
function resolveHit(){window._rh=(window._rh||0)+1;
  const fx=Math.sin(face),fz=Math.cos(face);let hits=0;const A=F.atk,SL=lv('shock'),RM=1+0.12*SL,pm=pmul(),done=new Set();
  for(const e of enemies){
    if(e.state==='ko')continue;
    const dx=e.x-pos.x,dz=e.z-pos.z,d=Math.hypot(dx,dz)||0.001;
    if(d<(1.9+(e.sc-1)*0.4)*RM&&(dx*fx+dz*fz)/d>0.25){hitEnemy(e,A.dmg*pm,A.kb,dx/d,dz/d,A.big,A.k);hits++;done.add(e);}
  }
  const B=F.boss;
  if(B&&B.state!=='dead'&&B.state!=='drop'){
    const dx=B.x-pos.x,dz=B.z-pos.z,d=Math.hypot(dx,dz)||0.001;
    if(d<3.1*RM&&(dx*fx+dz*fz)/d>0.15){hitBoss(Math.round(A.dmg*pm),A.big,dx/d,dz/d,A.k);hits++;}
  }
  for(const s of shots){
    if(!s.hostile)continue;
    const dx=s.x-pos.x,dz=s.z-pos.z,d=Math.hypot(dx,dz)||0.001;
    if(d<2.4&&(dx*fx+dz*fz)/d>0.05)reflectShot(s);
  }
  if(SL){
    const range=2.2+0.6*SL;
    shockFx(pos.x,pos.z,range);
    for(const e of enemies){
      if(e.state==='ko'||done.has(e))continue;
      const dx=e.x-pos.x,dz=e.z-pos.z,d=Math.hypot(dx,dz)||0.001;
      if(d<range){
        const dm=Math.round(A.dmg*0.5*pm);
        if(isCl()){cDmg(e,dm,5,dx/d,dz/d,false,undefined);hits++;continue;}
        e.hp-=dm;dmgNum(e.x,2*e.sc,e.z,dm,'#e8c890');impact(e.x,0.4,e.z,8,'#d8b880');flashChar(e.ch.root,70);
        if(e.hp<=0)koEnemy(e,dx/d,dz/d);else if(e.state!=='freeze'){hideTel(e);e.state='hit';e.t=0.4;e.kx=dx/d*5;e.kz=dz/d*5;e.vy=3;e.y=0.01;e.emote='hurt';e.et=0;}
        hits++;
      }
    }
  }
  if(hits){F.shake=Math.max(F.shake,A.big?0.3:0.12);F.gauge=Math.min(100,F.gauge+6*hits*(1+0.2*lv('charge')));F.chain+=hits;F.chainT=1.3;SND.hit(A.big,A.k);}
}
function hitEnemy(e,dmg,kb,dx,dz,big,k){
  if(isCl()){cDmg(e,dmg,kb,dx,dz,big,k);return;}
  if(e.state==='freeze')dmg*=1.8;
  dmg=Math.round(dmg);
  e.hp-=dmg;hitFx(e.x,1.3*e.sc,e.z,big,dmg,F.elem?ELEMS[F.elem.type].hex:undefined);flashChar(e.ch.root,90);e.pop=1;lifeSteal(dmg,e);
  if(e.hp<=0){koEnemy(e,dx,dz);return;}
  if(e.state!=='freeze'){hideTel(e);e.state='hit';e.t=big?0.6:0.38;e.kx=dx*kb*1.15;e.kz=dz*kb*1.15;e.emote='hurt';e.et=0;if(big){e.vy=4.2;e.y=0.01;}}
  const D=lv('dual');
  if(D&&k!==undefined){
    if(k===0){freezeEnemy(e,0.8+0.3*D);}
    else if(k===1){
      e.burn={t:3,dps:3+2*D,acc:0};groundRing(e.x,e.z,0xff7a1c,2.2,0.5,0.2);
      for(let i=0;i<10;i++)emit(e.x,0.8*e.sc,e.z,(Math.random()-0.5)*4,Math.random()*3,(Math.random()-0.5)*4,7,'#ffffff',0.55,0.6,-0.8,0.2);
    }else if(k===2){
      hideTel(e);if(e.ice){scene.remove(e.ice);e.ice=null;}
      const m=(1+0.25*D)*1.4;e.state='hit';e.t=1.0;e.kx=dx*kb*m;e.kz=dz*kb*m;e.vy=9+D;e.y=0.02;e.emote='hurt';e.et=0;e.lau=1.1;if(D>=5)e.burn={t:3,dps:3+2*D,acc:0};
      groundRing(e.x,e.z,0xffffff,2.6,0.4,0.15);emit(e.x,0.6,e.z,0,0,0,4,'#ffe27a',0.3,0.7,0,6);
    }
  }
  if(F.elem)applyElem(e,dx,dz);
}
/* ----- 冰凍：冰晶尖刺 ----- */
function freezeEnemy(e,dur){
  if(e.state==='ko'||e.state==='freeze')return;
  hideTel(e);e.state='freeze';e.ft=dur;e.emote=null;
  const g=new THREE.Group(),sc=e.sc;
  const box=new THREE.Mesh(new THREE.BoxGeometry(1.15*sc,2.2*sc,1.15*sc),new THREE.MeshBasicMaterial({color:0xaee6ff,transparent:true,opacity:0.42,depthWrite:false}));box.position.y=1.1*sc;g.add(box);
  for(let i=0;i<8;i++){
    const an=i/8*PI*2,h=(0.9+Math.random()*1.0)*sc,c=new THREE.Mesh(new THREE.ConeGeometry(0.16*sc,h,5),new THREE.MeshBasicMaterial({color:i%2?0xdff6ff:0x8fd8ff,transparent:true,opacity:0.85}));
    c.position.set(Math.cos(an)*0.7*sc,h*0.45,Math.sin(an)*0.7*sc);c.rotation.z=-Math.cos(an)*0.45;c.rotation.x=Math.sin(an)*0.45;g.add(c);
  }
  const top=new THREE.Mesh(new THREE.ConeGeometry(0.28*sc,1.1*sc,5),new THREE.MeshBasicMaterial({color:0xeaf9ff,transparent:true,opacity:0.8}));top.position.set(0,2.5*sc,0);g.add(top);
  g.position.set(e.x,0,e.z);scene.add(g);e.ice=g;
  groundRing(e.x,e.z,0x9fe0ff,2.6,0.5,0.2);groundRing(e.x,e.z,0xdff6ff,1.8,0.7,0.12);
  for(let i=0;i<22;i++)emit(e.x,1.2*sc,e.z,(Math.random()-0.5)*4.5,Math.random()*3,(Math.random()-0.5)*4.5,6,'#ffffff',0.8,0.34,2);
}
function shatterEnemy(e){
  if(e.ice){scene.remove(e.ice);e.ice=null;}
  groundRing(e.x,e.z,0xbfeaff,2.6,0.4,0.15);
  for(let i=0;i<26;i++)emit(e.x,1.2*e.sc,e.z,(Math.random()-0.5)*8,Math.random()*5+1,(Math.random()-0.5)*8,5,i%2?'#cfeeff':'#ffffff',0.9,0.26,5);
  SND.shatter();e.state='walk';e.emote=null;e.cd=0.4;
}
/* ----- 萬劍歸宗：發光大劍、光尾、斬擊 ----- */
function makeSword(){
  const g=new THREE.Group(),bm=c=>new THREE.MeshBasicMaterial({color:c});
  const bl=new THREE.Mesh(new THREE.BoxGeometry(0.16,1.3,0.04),bm(0xdff6ff));bl.position.y=0.65;g.add(bl);
  const ed=new THREE.Mesh(new THREE.BoxGeometry(0.05,1.3,0.06),bm(0x6fd0ff));ed.position.y=0.65;g.add(ed);
  const tip=new THREE.Mesh(new THREE.ConeGeometry(0.11,0.35,4),bm(0xdff6ff));tip.position.y=1.47;g.add(tip);
  const gd=new THREE.Mesh(new THREE.BoxGeometry(0.46,0.09,0.09),bm(0xffd24a));g.add(gd);
  const hl=new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.045,0.38,6),bm(0x8a5a3a));hl.position.y=-0.24;g.add(hl);
  const gl=addGlowSprite(0x7fd8ff);gl.material.opacity=0.45;gl.scale.set(1.1,1.1,1);gl.position.y=0.75;g.add(gl);
  g.userData.gl=gl;g.scale.setScalar(0.82);scene.add(g);return g;
}
function swordStrike(s){
  const tg=s.tgt,L=lv('swords'),dm=Math.round((9+3*L)*pmul()),useEl=L>=5&&F.elem;
  const tx=tg?tg.x:s.x,tz=tg?tg.z:s.z,dir=Math.sign(tx-s.x)||1,hy=tg&&tg!==F.boss?1.3*tg.sc:2.6;
  slashFx(tx,hy,tz,'jab',dir,'#9fe0ff');emit(tx,hy,tz,0,0,0,4,'#9fd0e8',0.22,0.35,0,3);
  for(let i=0;i<6;i++)emit(tx,hy,tz,(Math.random()-0.5)*7,Math.random()*4,(Math.random()-0.5)*7,0,i%2?'#9fe0ff':'#ffffff',0.45,0.32,3);
  if(tg===F.boss){if(F.boss&&F.boss.state!=='dead')hitBoss(dm,false,dir,0);}
  else if(tg&&tg.state!=='ko'){
    if(isCl()){const sv=F.elem;if(!useEl)F.elem=null;cDmg(tg,dm,2.5,dir,0,false,undefined);F.elem=sv;}
    else{
      tg.hp-=dm;dmgNum(tg.x,2.2*tg.sc,tg.z,dm,'#bfe8ff');flashChar(tg.ch.root,60);
      if(tg.hp<=0)koEnemy(tg,dir,0);else if(tg.state!=='freeze'){hideTel(tg);tg.state='hit';tg.t=0.22;tg.kx=dir*2.5;tg.emote='hurt';tg.et=0;}
      if(useEl&&tg.state!=='ko')applyElem(tg,dir,0);
    }
  }
  SND.hit(false,1);
}
function updateSwords(dt,t){
  const L=lv('swords'),n=(F.on&&!F.dead&&L)?(L+1+(L>=5?2:0)):0;
  while(swords.length<n)swords.push({g:makeSword(),state:'orbit',cd:0.4+Math.random()*0.6,tgt:null,x:pos.x,y:1.7,z:pos.z});
  while(swords.length>n)scene.remove(swords.pop().g);
  if(n>0&&!swordRing){swordRing=new THREE.Mesh(new THREE.RingGeometry(1.7,1.82,56),new THREE.MeshBasicMaterial({color:0x7fd8ff,transparent:true,opacity:0.4,side:2,depthWrite:false,blending:THREE.AdditiveBlending}));swordRing.rotation.x=-PI/2;scene.add(swordRing);}
  if(n===0&&swordRing){scene.remove(swordRing);swordRing=null;}
  if(swordRing){swordRing.position.set(pos.x,0.12,pos.z);swordRing.material.opacity=0.16+0.07*Math.sin(t*4);}
  swords.forEach((s,i)=>{
    const base=t*2.6+i*PI*2/Math.max(1,swords.length);
    if(s.state==='orbit'){
      const ox=pos.x+Math.cos(base)*1.75,oz=pos.z+Math.sin(base)*1.75,oy=1.7+Math.sin(t*3+i)*0.12,k=Math.min(1,dt*14);
      s.x+=(ox-s.x)*k;s.y+=(oy-s.y)*k;s.z+=(oz-s.z)*k;
      s.g.position.set(s.x,s.y,s.z);orient(s.g,V(Math.cos(base)*0.4,1,Math.sin(base)*0.4));
      if(s.g.userData.gl)s.g.userData.gl.material.color.setHex((L>=5&&F.elem)?ELEMS[F.elem.type].col:0x7fd8ff);
      if(Math.random()<0.35)emit(s.x,s.y+0.6,s.z,0,0.3,0,0,'#9fe0ff',0.3,0.16,0,-0.3);
      s.cd-=dt;
      if(s.cd<=0){const tg=nearestTarget(pos.x,pos.z,10);if(tg){s.tgt=tg;s.state='fly';SND.whoosh(0);}else s.cd=0.3;}
    }else{
      const tg=s.tgt;
      if(!tg||(tg!==F.boss&&tg.state==='ko')||(tg===F.boss&&!F.boss)){s.state='orbit';s.cd=0.3;return;}
      const dx=tg.x-s.x,dy=1.2-s.y,dz=tg.z-s.z,d=Math.hypot(dx,dy,dz)||1,sp=26*dt;
      if(d<=sp+0.7){swordStrike(s);s.state='orbit';s.cd=Math.max(L>=5?0.32:0.5,1.4-0.1*L);}
      else{
        s.x+=dx/d*sp;s.y+=dy/d*sp;s.z+=dz/d*sp;s.g.position.set(s.x,s.y,s.z);orient(s.g,V(dx,dy,dz));
        for(let q=0;q<2;q++)emit(s.x-dx/d*q*0.4,s.y+0.6,s.z-dz/d*q*0.4,0,0,0,0,q%2?'#9fd0e8':'#7fb8e0',0.3,0.3-q*0.07,0,-0.4);
      }
    }
  });
}
/* ----- 影分身：光圈、光柱、驚嘆號 ----- */
function ghostify(root){root.traverse(o=>{if(!o.isMesh)return;if(o.userData.ol){o.visible=false;return;}if(o.material){o.material.transparent=true;o.material.opacity=0.72;if(o.material.emissive)o.material.emissive.setHex(0x2a6aa8);o.material.depthWrite=false;}});}
function spawnClone(L){
  if(!cloneCh){cloneCh=new Character();scene.add(cloneCh.root);cloneCh.update(cfg,outfit);ghostify(cloneCh.root);}
  cloneCh.root.visible=true;
  const x=pos.x+Math.sin(face+PI/2)*2.2,z=pos.z+Math.cos(face+PI/2)*2.2;
  const ring=new THREE.Mesh(new THREE.RingGeometry(0.85,1.05,40),new THREE.MeshBasicMaterial({color:0x7fd0ff,transparent:true,opacity:0.7,side:2,depthWrite:false,blending:THREE.AdditiveBlending}));ring.rotation.x=-PI/2;scene.add(ring);
  const col=new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.55,4.6,20,1,true),new THREE.MeshBasicMaterial({color:0x7fd0ff,transparent:true,opacity:0.16,side:2,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(col);
  const mark=new THREE.Sprite(new THREE.SpriteMaterial({map:markTex,transparent:true,depthTest:false}));mark.scale.set(0.8,0.8,1);mark.renderOrder=28;scene.add(mark);
  F.clone={ch:cloneCh,x,z,face,t:cloneDur(L),mv:0,pop:0,ring,col,mark};
  cloneSmoke(x,z);groundRing(x,z,0x7fd0ff,2.6,0.5,0.15);SND.sparkle();toast('👥 影分身！');
}
function dropCloneFx(C){scene.remove(C.ring);scene.remove(C.col);scene.remove(C.mark);}
function killClone(){
  if(F.clone){cloneSmoke(F.clone.x,F.clone.z);groundRing(F.clone.x,F.clone.z,0x7fd0ff,2.2,0.4,0.15);dropCloneFx(F.clone);F.clone.ch.root.visible=false;F.clone=null;}
  F.cloneCd=Math.max(5,14-1.5*lv('clone'));
}
function updateClone(dt,t){
  const L=lv('clone');
  if(!F.on||F.dead||!L){if(F.clone){dropCloneFx(F.clone);F.clone.ch.root.visible=false;F.clone=null;}return;}
  if(!F.clone){F.cloneCd-=dt;if(F.cloneCd<=0)spawnClone(L);return;}
  const C=F.clone;C.t-=dt;
  const tx=pos.x+Math.cos(t*0.9)*3.8,tz=pos.z+Math.sin(t*0.9)*2.4,dx=tx-C.x,dz=tz-C.z,d=Math.hypot(dx,dz);
  let mv=0;if(d>0.3){C.x+=dx/d*Math.min(d,5.2*dt);C.z+=dz/d*Math.min(d,5.2*dt);mv=1;let dd=Math.atan2(dx,dz)-C.face;dd=Math.atan2(Math.sin(dd),Math.cos(dd));C.face+=dd*Math.min(1,dt*10);}
  const A0=AREAS[0];C.x=clamp(C.x,A0.x0+0.6,A0.x1-0.2);C.z=clamp(C.z,A0.z0,A0.z1);
  C.mv+=(mv-C.mv)*Math.min(1,dt*8);
  C.ch.root.position.set(C.x,0,C.z);C.ch.root.rotation.y=C.face;
  const k=C.pop>0?1+0.15*Math.sin(C.pop*PI):1;C.pop=Math.max(0,C.pop-dt*5);C.ch.root.scale.set(2-k,k,2-k);
  const vis=C.t>1?true:Math.floor(C.t*10)%2===0;C.ch.root.visible=vis;C.ring.visible=C.col.visible=C.mark.visible=vis;
  C.ring.position.set(C.x,0.1,C.z);C.ring.scale.setScalar(1+0.12*Math.sin(t*5));C.col.position.set(C.x,2.3,C.z);C.mark.position.set(C.x,3.0+Math.sin(t*6)*0.12,C.z);
  C.ch.tick(dt,t,C.mv,null,0);
  if(Math.random()<0.5)emit(C.x+(Math.random()-0.5)*0.9,0.3,C.z+(Math.random()-0.5)*0.9,0,1.4,0,0,'#9fd0ff',0.6,0.2,-0.4,0.1);
  if(C.t<=0)killClone();
}
function clearSkillObjs(){
  swords.forEach(s=>scene.remove(s.g));swords=[];
  if(swordRing){scene.remove(swordRing);swordRing=null;}
  if(F.clone){dropCloneFx(F.clone);F.clone.ch.root.visible=false;F.clone=null;}
  sfx.forEach(f=>scene.remove(f.mesh));sfx=[];
}
/* ----- 每幀：燃燒火焰、擊飛光尾 ----- */
function updateSkills(dt,t){
  if(dt<=0)return;
  for(const e of enemies){
    if(e.lau>0&&e.state!=='ko'){e.lau-=dt;if(e.y>0.3){emit(e.x,e.y+1,e.z,0,0,0,0,Math.random()<0.5?'#ffffff':'#ffe27a',0.3,0.45,0,-0.3);emit(e.x,e.y+0.4,e.z,0,0,0,4,'#ffffff',0.2,0.35,0,1);}}
    if(!e.burn||e.state==='ko')continue;
    e.burn.t-=dt;e.burn.acc+=dt;
    ensureBurnFx(e);
    e.burnFx.forEach((s,i)=>{s.userData.ph+=dt*(6+i*2);
      const ph=s.userData.ph,yy=e.y+(0.5+0.5*i)*e.sc+Math.sin(ph*1.7)*0.08;
      s.position.set(e.x+Math.cos(s.userData.an+ph*0.6)*s.userData.r,yy,e.z+Math.sin(s.userData.an+ph*0.6)*s.userData.r);
      const sc2=(0.55+0.2*Math.sin(ph*2.3)+0.12*i)*e.sc;s.scale.set(sc2,sc2*1.3,1);
      s.material.opacity=0.72+0.22*Math.sin(ph*3.1);s.material.rotation=Math.sin(ph)*0.2;});
    if(Math.random()<0.3)emit(e.x+(Math.random()-0.5)*0.5,(0.6+Math.random())*e.sc,e.z+(Math.random()-0.5)*0.5,(Math.random()-0.5)*0.5,1.9,(Math.random()-0.5)*0.5,0,'#ffb060',0.6,0.15,-1,0.1);
    if(e.burn.acc>=0.5){
      e.burn.acc-=0.5;const dm=Math.max(1,Math.round(e.burn.dps*0.5*pmul()));e.hp-=dm;dmgNum(e.x,2.1*e.sc,e.z,dm,'#ff8a3c');
      if(e.hp<=0){e.burn=null;koEnemy(e,(Math.random()-0.5)*2,(Math.random()-0.5)*2);}
    }
    if(e.burn&&e.burn.t<=0)e.burn=null;
  }
  const B=F.boss;
  if(B&&B.burn&&B.state!=='dead'){
    B.burn.t-=dt;B.burn.acc+=dt;
    for(let i=0;i<3;i++)emit(B.x+(Math.random()-0.5)*1.8,0.6+Math.random()*3.4,B.z+(Math.random()-0.5)*1.4,0,1.8,0,7,'#ffffff',0.5,0.9,-0.8,0.2);
    if(B.burn.acc>=0.5){B.burn.acc-=0.5;const dm=Math.max(1,Math.round(B.burn.dps*0.5*pmul()));B.hp-=dm;dmgNum(B.x,5.2,B.z,dm,'#ff8a3c');if(B.hp<=0){B.burn=null;bossDie();}}
    if(B.burn&&B.burn.t<=0)B.burn=null;
  }
  updFx(dt);updateSwords(dt,t);updateClone(dt,t);
}
/* ================= 暫停按鈕：顯示目前技能與等級 ================= */
function showPause(){
  if(!F.on||F.dead||F.pause)return;
  F.pause=true;F.manual=true;
  const owned=SK.filter(s=>lv(s.id));
  let h='<div class="pbox"><h2>⏸ 暫停</h2><div class="plist">';
  if(!owned.length)h+='<p class="pnone">還沒有技能。打倒敵人累積經驗升級，就能選技能！</p>';
  owned.forEach(s=>{const L=lv(s.id);h+='<div class="prow"><b>'+s.ic+' '+s.n+'</b><em>Lv '+L+' / 5</em><span>'+s.d(L)+'</span>'+(L===5&&s.m?'<span class="mast">⭐ '+s.m+'</span>':'')+'<div class="pips">'+'●'.repeat(L)+'○'.repeat(5-L)+'</div></div>';});
  h+='</div><div class="pinfo">第 '+F.wave+' 波　擊倒 '+F.kills+'　等級 Lv '+(F.upN+1)+'（經驗 '+F.xp+' / '+F.xpNeed+'）</div><div class="pbtns"><button id="pRes">▶ 繼續</button><button id="pHome">🏠 回更衣室</button></div></div>';
  const box=$h('pauseov');box.innerHTML=h;box.classList.add('show');
  $h('pRes').onclick=hidePause;$h('pHome').onclick=()=>{hidePause();leaveToHome();};
}
function hidePause(){if(!F.manual)return;F.manual=false;F.pause=false;$h('pauseov').classList.remove('show');}
function leaveToHome(){F.hp=Math.max(F.hp,60);pos.set(0,0,1.6);target=null;wps=[];stopFight();toast('🏠 回到更衣室');}
$h('bPause').onclick=()=>{F.manual?hidePause():showPause();};
addEventListener('keydown',e=>{if(e.key==='p'||e.key==='P'||e.key==='Escape'){if(F.manual)hidePause();else if(F.on&&!F.pause)showPause();}});


/* ---------- 屬性球：撿到後拳頭附魔，打中觸發元素效果 ---------- */
const ELEMS={
  ice:{ic:'❄️',n:'冰之力',col:0x7fd8ff,hex:'#7fd8ff'},
  dark:{ic:'🌑',n:'黑洞之力',col:0x8a5ae0,hex:'#8a5ae0'},
  fire:{ic:'🔥',n:'火之力',col:0xff6a2a,hex:'#ff8a3c'},
  thunder:{ic:'⚡',n:'雷之力',col:0xffe14a,hex:'#ffe14a'},
  water:{ic:'💧',n:'水之力',col:0x4aa8ff,hex:'#4aa8ff'},
  wind:{ic:'🌪️',n:'風之力',col:0x7fe0b8,hex:'#7fe0b8'}
};
let orbs=[];
const elemRing=new THREE.Mesh(new THREE.RingGeometry(0.72,0.92,32),new THREE.MeshBasicMaterial({transparent:true,opacity:0.45,side:2,depthWrite:false,blending:THREE.AdditiveBlending}));
elemRing.rotation.x=-PI/2;elemRing.visible=false;scene.add(elemRing);
function spawnOrb(x,z,type){
  type=type||pick(Object.keys(ELEMS));const E=ELEMS[type];
  const g=new THREE.Group();
  const core=new THREE.Mesh(new THREE.SphereGeometry(0.26,14,10),new THREE.MeshBasicMaterial({color:E.col}));g.add(core);
  const inner=new THREE.Mesh(new THREE.SphereGeometry(0.11,10,8),new THREE.MeshBasicMaterial({color:0xffffff}));inner.position.set(-0.07,0.07,0.1);g.add(inner);
  const gl=addGlowSprite(E.col);gl.material.opacity=0.45;gl.scale.set(1.3,1.3,1);g.add(gl);
  const rg=new THREE.Mesh(new THREE.RingGeometry(0.42,0.52,24),new THREE.MeshBasicMaterial({color:E.col,transparent:true,opacity:0.5,side:2,depthWrite:false}));
  rg.rotation.x=-PI/2;rg.position.y=-0.75;g.add(rg);
  g.position.set(x,0.85,z);scene.add(g);
  orbs.push({g,x,z,type,t:0,life:20});
}
function clearOrbs(){orbs.forEach(o=>scene.remove(o.g));orbs=[];F.elem=null;elemRing.visible=false;if(F.bh){scene.remove(F.bh.mesh);F.bh=null;}}
function updateOrbs(dt,t){
  if(!isCl()){F.orbT-=dt;}
  if(!isCl()&&F.orbT<=0){F.orbT=13+Math.random()*5;if(orbs.length<2){const s=pickRandomSpot();spawnOrb(s[0],s[1]);}}
  for(let i=orbs.length-1;i>=0;i--){
    const o=orbs[i];o.t+=dt;
    o.g.position.y=0.85+Math.sin(o.t*2.6)*0.14;o.g.rotation.y+=dt*2;
    if(o.t>o.life-3)o.g.visible=Math.floor(o.t*8)%2===0;
    if(isHo()&&RP.on&&Math.hypot(o.x-RP.x,o.z-RP.z)<1.05){
      scene.remove(o.g);orbs.splice(i,1);NET.send({t:'pick',k:'orb',o:o.type});continue;
    }
    if(!isCl()&&Math.hypot(o.x-pos.x,o.z-pos.z)<1.05){
      const E=ELEMS[o.type];F.elem={type:o.type,t:10};
      scene.remove(o.g);orbs.splice(i,1);
      burst('body',[E.hex,'#ffffff'],18);groundRing(pos.x,pos.z,E.col,3.2,0.5,0.14);SND.sparkle();
      toast(E.ic+' '+E.n+'！拳頭附魔 10 秒');
    }else if(!isCl()&&o.t>o.life){scene.remove(o.g);orbs.splice(i,1);}
  }
  const chip=$h('elembuff');
  if(F.elem){
    F.elem.t-=dt;
    if(F.elem.t<=0){F.elem=null;elemRing.visible=false;chip.style.display='none';}
    else{
      const E=ELEMS[F.elem.type];
      elemRing.visible=true;elemRing.position.set(pos.x,0.1,pos.z);elemRing.material.color.setHex(E.col);
      elemRing.material.opacity=0.3+0.14*Math.sin(t*6);elemRing.scale.setScalar(1+0.08*Math.sin(t*6));
      if(Math.random()<0.3)emit(pos.x+(Math.random()-0.5)*0.9,0.3,pos.z+(Math.random()-0.5)*0.9,0,1.6,0,0,E.hex,0.5,0.18,-0.8,0.1);
      chip.style.display='block';chip.textContent=E.ic+' '+Math.ceil(F.elem.t)+'s';chip.style.borderColor=E.hex;
      if(F.elem.type==='thunder'&&Math.random()<0.14){const an=Math.random()*PI*2;boltFx(pos.x,pos.x+Math.cos(an)*1.4,pos.z,pos.z+Math.sin(an)*1.4,0.55);}
    }
  }else chip.style.display='none';
  // 黑洞
  if(F.bh){
    const B=F.bh;B.t-=dt;
    B.mesh.rotation.y+=dt*7;B.mesh.children[1].material.opacity=0.4+0.2*Math.sin(t*12);
    for(let i=0;i<3;i++){const an=Math.random()*PI*2,r=2.5+Math.random()*4.5;emit(B.x+Math.cos(an)*r,0.4+Math.random()*1.6,B.z+Math.sin(an)*r,-Math.cos(an)*4,0.2,-Math.sin(an)*4,0,'#b08ae8',0.4,0.2,0,0.1);}
    for(const e of enemies){
      if(e.state==='ko'||e.state==='freeze')continue;
      const dx=B.x-e.x,dz=B.z-e.z,d=Math.hypot(dx,dz)||0.01;
      if(d<8.5){const pl=Math.min(d,(9.5-d)*2.0*dt+6*dt);e.x+=dx/d*pl;e.z+=dz/d*pl;e.cd=Math.max(e.cd,0.4);if(Math.random()<0.1){e.emote='hurt';e.et=0;}}
    }
    if(B.t<=0){
      for(const e of enemies){
        if(e.state==='ko')continue;
        const dx=e.x-B.x,dz=e.z-B.z,d=Math.hypot(dx,dz)||0.01;
        if(d<3.6){const dm=Math.round(25*pmul());e.hp-=dm;dmgNum(e.x,2*e.sc,e.z,dm,'#b08ae8');if(e.hp<=0)koEnemy(e,dx/d,dz/d);}
      }
      emit(B.x,1,B.z,0,0,0,4,'#b08ae8',0.4,0.8,0,7);groundRing(B.x,B.z,0x8a5ae0,4.5,0.5,0.15);SND.hit(true,1);
      scene.remove(B.mesh);F.bh=null;
    }
  }
}
function boltFx(ax,bx,az,bz,inten){
  inten=inten||1;
  const g=new THREE.Group(),mats=[];
  const mk=(w,col,op,jit)=>{const mb=new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:op,blending:THREE.AdditiveBlending,depthWrite:false});mb.userData.base=op;mats.push(mb);
    let px=ax,py=1.5,pz=az;
    for(let i=1;i<=5;i++){const t2=i/5,j=i<5?jit:0,nx=ax+(bx-ax)*t2+(Math.random()-0.5)*j,ny=1.3+(Math.random()-0.5)*j*0.7,nz=az+(bz-az)*t2+(Math.random()-0.5)*j;
      g.add(bar(V(px,py,pz),V(nx,ny,nz),w,mb));px=nx;py=ny;pz=nz;}};
  mk(0.3*inten,0x6aa8ff,0.3,0.9*inten);mk(0.14*inten,0x9fd8ff,0.55,0.8*inten);mk(0.055,0xffffff,1,0.8*inten);
  const gl=addGlowSprite(0xcfe8ff);gl.scale.set(1.8*inten,1.8*inten,1);gl.position.set(bx,1.3,bz);g.add(gl);
  fxAdd(g,0.4,k=>{const f=(1-k)*(Math.random()<0.22?0.25:1);mats.forEach(m=>m.opacity=m.userData.base*f);gl.material.opacity=0.85*f;});
}
function strikeBolt(x,z,sc){
  sc=sc||1;
  const g=new THREE.Group(),mats=[];
  const mk=(w,col,op)=>{const mb=new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:op,blending:THREE.AdditiveBlending,depthWrite:false});mb.userData.base=op;mats.push(mb);
    let px=x+(Math.random()-0.5)*0.4,py=6.2,pz=z;
    for(let i=1;i<=4;i++){const t2=i/4,j=i<4?0.6:0,nx=x+(Math.random()-0.5)*j,ny=6.2-(6.2-0.4)*t2,nz=z+(Math.random()-0.5)*j;
      g.add(bar(V(px,py,pz),V(nx,ny,nz),w*sc,mb));px=nx;py=ny;pz=nz;}};
  mk(0.34,0x6aa8ff,0.35);mk(0.16,0x9fd8ff,0.6);mk(0.06,0xffffff,1);
  const gl=addGlowSprite(0xffffff);gl.scale.set(2.6*sc,2.6*sc,1);gl.position.set(x,0.8,z);g.add(gl);
  const rg=new THREE.Mesh(new THREE.RingGeometry(0.8,1,36),new THREE.MeshBasicMaterial({color:0xbfe0ff,transparent:true,opacity:0.9,side:2,depthWrite:false,blending:THREE.AdditiveBlending}));
  rg.rotation.x=-PI/2;rg.position.set(x,0.1,z);g.add(rg);
  impact(x,1,z,8,'#fff27a');
  fxAdd(g,0.42,k=>{const f=(1-k)*(Math.random()<0.25?0.3:1);mats.forEach(m=>m.opacity=m.userData.base*f);gl.material.opacity=0.9*f;rg.scale.setScalar(Math.max(0.01,k*3.2*sc));rg.material.opacity=0.9*(1-k);});
}
function imprisonEnemy(e,dur){
  if(e.state==='ko'||e.state==='freeze')return;
  hideTel(e);e.state='freeze';e.ft=dur;e.emote=null;e.wdot={acc:0};
  const g=new THREE.Group(),sc=e.sc;
  const bub=new THREE.Mesh(new THREE.SphereGeometry(1.15*sc,18,14),new THREE.MeshBasicMaterial({color:0x6ac0ff,transparent:true,opacity:0.4,depthWrite:false}));
  bub.position.y=1.15*sc;bub.scale.y=1.15;g.add(bub);
  for(let i=0;i<5;i++){const b2=new THREE.Mesh(new THREE.SphereGeometry(0.08+Math.random()*0.06,8,6),new THREE.MeshBasicMaterial({color:0xcfeaff,transparent:true,opacity:0.7}));
    b2.position.set((Math.random()-0.5)*1.2*sc,(0.4+Math.random()*1.5)*sc,(Math.random()-0.5)*1.2*sc);g.add(b2);}
  g.position.set(e.x,0,e.z);scene.add(g);e.ice=g;
  groundRing(e.x,e.z,0x4aa8ff,2.0,0.5,0.2);
}
function applyElem(e,dx,dz){
  const T=F.elem.type,E=ELEMS[T];
  switch(T){
    case 'ice':{
      freezeEnemy(e,3.2);const dm=Math.round(8*pmul());e.hp-=dm;dmgNum(e.x,2.3*e.sc,e.z,dm,'#9fe0ff');
      groundRing(e.x,e.z,0x9fe0ff,3.2,0.5,0.16);SND.iceHit();
      for(let i=0;i<12;i++)emit(e.x,1.2*e.sc,e.z,(Math.random()-0.5)*5,Math.random()*3,(Math.random()-0.5)*5,6,'#ffffff',0.7,0.3,2);
      break;}
    case 'fire':{
      e.burn={t:3.5,dps:11,acc:0};SND.ignite();groundRing(e.x,e.z,0xff7a1c,3.0,0.5,0.18);groundRing(e.x,e.z,0xffd24a,2.0,0.4,0.12);flameFountain(e.x,e.z,0.9,1.3);
      emit(e.x,1.2*e.sc,e.z,0,0,0,4,'#ff9a3c',0.3,0.7,0,5);
      for(let i=0;i<14;i++)emit(e.x,0.6*e.sc,e.z,(Math.random()-0.5)*4,Math.random()*4+1,(Math.random()-0.5)*4,7,'#ffffff',0.6,0.55,-0.5,0.2);
      break;}
    case 'thunder':{
      SND.zap();flashFx('thunderfx',170);F.shake=Math.max(F.shake,0.4);F.zoomK=Math.max(F.zoomK,0.6);
      boltFx(pos.x+Math.sin(face)*0.7,e.x,pos.z+Math.cos(face)*0.7,e.z,1.2);
      strikeBolt(e.x,e.z,1.3);
      let n2=0,prev=e;
      for(const o of enemies){
        if(o===e||o.state==='ko'||n2>=4)continue;
        const d=Math.hypot(o.x-prev.x,o.z-prev.z);
        if(d<6.5){n2++;
          boltFx(prev.x,o.x,prev.z,o.z,1.1);strikeBolt(o.x,o.z,1);
          const dm=Math.round(20*pmul());o.hp-=dm;dmgNum(o.x,2.2*o.sc,o.z,dm,'#fff27a');flashChar(o.ch.root,90);o.pop=1;
          if(o.hp<=0)koEnemy(o,(o.x-prev.x)/d||1,(o.z-prev.z)/d||0);else if(o.state!=='freeze'){o.state='hit';o.t=0.4;o.emote='hurt';o.et=0;}
          prev=o;
        }
      }
      const B2=F.boss;
      if(B2&&B2.state!=='dead'&&B2.state!=='drop'){const d=Math.hypot(B2.x-prev.x,B2.z-prev.z);if(d<7){boltFx(prev.x,B2.x,prev.z,B2.z,1.5);strikeBolt(B2.x,B2.z,1.8);hitBoss(Math.round(18*pmul()),false,(B2.x-prev.x)/d||1,0);}}
      break;}
    case 'water':{imprisonEnemy(e,3.2);SND.splash();waterJet(e.x,e.z,e.sc);
      for(let i=0;i<10;i++)emit(e.x,1.4*e.sc,e.z,(Math.random()-0.5)*4,Math.random()*3+1,(Math.random()-0.5)*4,2,'#6ac0ff',0.6,0.3,4);
      break;}
    case 'wind':{
      if(e.state!=='ko'){
        SND.gust();const dm=Math.round(15*pmul());e.hp-=dm;dmgNum(e.x,2.3*e.sc,e.z,dm,'#7fe0b8');
        if(e.hp<=0){koEnemy(e,dx,dz);break;}
        e.state='hit';e.t=1.4;e.kx=dx*19;e.kz=dz*19;e.vy=10;e.y=0.02;e.lau=1.4;e.emote='hurt';e.et=0;
        const tc=new THREE.Mesh(new THREE.CylinderGeometry(0.3,1.25,3.2,16,1,true),new THREE.MeshBasicMaterial({map:tornTex,color:0xcff2e2,transparent:true,opacity:0.6,side:2,depthWrite:false}));
        tc.position.set(e.x,1.4,e.z);fxAdd(tc,0.8,(k,tt,m)=>{m.rotation.y+=0.6;m.position.set(e.x,1.4+e.y,e.z);m.scale.setScalar(1+k*0.5);m.material.opacity=0.6*(1-k);});
        groundRing(e.x,e.z,0x7fe0b8,3.4,0.5,0.14);
      }break;}
    case 'dark':{
      if(!F.bh){
        SND.hole();
        const g=new THREE.Group();
        g.add(new THREE.Mesh(new THREE.SphereGeometry(0.78,18,14),new THREE.MeshBasicMaterial({color:0x14081f})));
        const halo=new THREE.Mesh(new THREE.RingGeometry(1.0,1.5,32),new THREE.MeshBasicMaterial({color:0x9a6ae8,transparent:true,opacity:0.55,side:2,depthWrite:false,blending:THREE.AdditiveBlending}));
        halo.rotation.x=-PI/2;g.add(halo);
        const halo2=new THREE.Mesh(new THREE.RingGeometry(1.6,1.75,32),new THREE.MeshBasicMaterial({color:0x6a3ae0,transparent:true,opacity:0.35,side:2,depthWrite:false,blending:THREE.AdditiveBlending}));
        halo2.rotation.x=-PI/2;g.add(halo2);
        const gl2=addGlowSprite(0x8a5ae0);gl2.material.opacity=0.6;gl2.scale.set(3.6,3.6,1);g.add(gl2);
        g.position.set(e.x,1.2,e.z);scene.add(g);
        F.bh={x:e.x,z:e.z,t:1.8,mesh:g};
      }break;}
  }
}


/* ---------- 無敵星星 ---------- */
let starObj=null;const _rv=new THREE.Vector3();
function starShape2(R){const s=new THREE.Shape();for(let i=0;i<10;i++){const an=-PI/2+i*PI/5,r=i%2?R*0.45:R,x=Math.cos(an)*r,y=Math.sin(an)*r;i?s.lineTo(x,y):s.moveTo(x,y);}s.closePath();return s;}
function spawnStar(x,z){
  const g=new THREE.Group();
  const sm=new THREE.Mesh(new THREE.ExtrudeGeometry(starShape2(0.42),{depth:0.14,bevelEnabled:false}),new THREE.MeshBasicMaterial({color:0xffc83c}));sm.position.z=-0.07;g.add(sm);
  const sm2=new THREE.Mesh(new THREE.ExtrudeGeometry(starShape2(0.27),{depth:0.16,bevelEnabled:false}),new THREE.MeshBasicMaterial({color:0xfff2b0}));sm2.position.z=-0.08;g.add(sm2);
  const gl=addGlowSprite(0xffe27a);gl.material.opacity=0.6;gl.scale.set(2.4,2.4,1);g.add(gl);
  const rg=new THREE.Mesh(new THREE.RingGeometry(0.5,0.63,26),new THREE.MeshBasicMaterial({color:0xffd24a,transparent:true,opacity:0.55,side:2,depthWrite:false}));
  rg.rotation.x=-PI/2;rg.position.y=-0.95;g.add(rg);
  g.position.set(x,1.0,z);scene.add(g);
  starObj={g,x,z,t:0};
}
function clearRainbow(){me.root.traverse(o=>{if(o.isMesh&&!o.userData.ol&&o.material&&o.material.emissive)o.material.emissive.setHex(0);});}
function clearStar(){if(starObj){scene.remove(starObj.g);starObj=null;}if(F.star>0){F.star=0;clearRainbow();}$h('starbuff').style.display='none';}
function updateStar(dt,t){
  if(!isCl())F.starT-=dt;
  if(!isCl()&&F.starT<=0){F.starT=30+Math.random()*16;if(!starObj&&F.star<=0){const s2=pickRandomSpot();spawnStar(s2[0],s2[1]);}}
  if(starObj){
    const o=starObj;o.t+=dt;
    o.g.position.y=1.0+Math.sin(o.t*2.4)*0.16;o.g.rotation.y+=dt*2.8;
    if(Math.random()<0.25)emit(o.x+(Math.random()-0.5)*0.8,0.6+Math.random()*0.8,o.z+(Math.random()-0.5)*0.8,0,0.8,0,0,'#ffe27a',0.5,0.2,-0.5,0.1);
    if(o.t>15)o.g.visible=Math.floor(o.t*8)%2===0;
    if(isHo()&&RP.on&&Math.hypot(o.x-RP.x,o.z-RP.z)<1.1){
      scene.remove(o.g);starObj=null;NET.send({t:'pick',k:'star'});
    }else
    if(!isCl()&&Math.hypot(o.x-pos.x,o.z-pos.z)<1.1){
      scene.remove(o.g);starObj=null;F.star=5;
      SND.starPower();toast('⭐ 無敵星星！5 秒無敵！');burst('body',['#ffd24a','#ff6a88','#6bb6f2','#6bd47a','#ffffff'],26);
      groundRing(pos.x,pos.z,0xffd24a,3.6,0.6,0.14);
    }else if(!isCl()&&o.t>19){scene.remove(o.g);starObj=null;}
  }
  const chip=$h('starbuff');
  if(F.star>0){
    F.star-=dt;
    me.root.traverse(o=>{if(o.isMesh&&!o.userData.ol&&o.material&&o.material.emissive){o.getWorldPosition(_rv);const hue=(((_rv.y*1.5-t*2.4)%1)+1)%1;o.material.emissive.setHSL(hue,1,0.45);}});
    const hue=(t*320|0)%360;
    emit(pos.x+(Math.random()-0.5)*0.7,0.3+Math.random()*1.4,pos.z+(Math.random()-0.5)*0.7,0,0.6,0,0,'hsl('+hue+',100%,68%)',0.55,0.28,-0.4,0.1);
    if(Math.random()<0.2)groundRing(pos.x,pos.z,new THREE.Color('hsl('+hue+',100%,65%)').getHex(),2.4,0.4,0.1);
    chip.style.display='block';chip.textContent='⭐ '+Math.ceil(F.star)+'s';
    if(F.star<=0){clearRainbow();chip.style.display='none';}
  }else chip.style.display='none';
}
function flameFountain(x,z,dur,sc){
  const dum=new THREE.Object3D();dum.position.set(x,0,z);
  fxAdd(dum,dur,()=>{if(Math.random()<0.7)emit(x+(Math.random()-0.5)*0.5,0.15,z+(Math.random()-0.5)*0.5,(Math.random()-0.5)*0.6,3.5+Math.random()*2.5,(Math.random()-0.5)*0.6,7,'#ffffff',0.5,0.6*(sc||1),-2,0.15);});
}
function waterJet(x,z,sc){
  for(let i=0;i<16;i++)emit(x+(Math.random()-0.5)*0.5,0.3,z+(Math.random()-0.5)*0.5,(Math.random()-0.5)*2,4+Math.random()*3,(Math.random()-0.5)*2,2,i%2?'#6ac0ff':'#bfe6ff',0.7,0.34,6);
  emit(x,1.2*(sc||1),z,0,0,0,4,'#6ac0ff',0.35,0.7,0,5);
}


/* ---------- 屬性視覺 v2：水晶冰凍、水牢水球、貼身火苗 ---------- */
function freezeEnemy(e,dur){
  if(e.state==='ko'||e.state==='freeze')return;
  hideTel(e);if(e.ice)scene.remove(e.ice);
  e.state='freeze';e.ft=dur;e.emote=null;e.wdot=null;
  const sc=e.sc,g=new THREE.Group();
  const gem=new THREE.Mesh(new THREE.IcosahedronGeometry(1.05*sc,0).toNonIndexed(),LAMB({color:0xbfe8ff,transparent:true,opacity:0.5}));
  gem.geometry.computeVertexNormals();gem.position.y=1.1*sc;gem.scale.set(1,1.35,1);g.add(gem);
  const gem2=new THREE.Mesh(new THREE.IcosahedronGeometry(0.72*sc,0).toNonIndexed(),new THREE.MeshBasicMaterial({color:0xeaf8ff,transparent:true,opacity:0.32,blending:THREE.AdditiveBlending,depthWrite:false}));
  gem2.geometry.computeVertexNormals();gem2.position.y=1.1*sc;gem2.scale.set(1,1.3,1);g.add(gem2);
  const shards=[];
  for(let i=0;i<3;i++){const sh=new THREE.Mesh(new THREE.OctahedronGeometry(0.15*sc),new THREE.MeshBasicMaterial({color:0xdff4ff,transparent:true,opacity:0.9}));g.add(sh);shards.push(sh);}
  g.userData={kind:'icegem',shards};
  g.position.set(e.x,0,e.z);scene.add(g);e.ice=g;
  groundRing(e.x,e.z,0x9fe0ff,2.6,0.5,0.2);groundRing(e.x,e.z,0xdff6ff,1.8,0.7,0.12);
  for(let i=0;i<18;i++)emit(e.x,1.2*sc,e.z,(Math.random()-0.5)*4.5,Math.random()*3,(Math.random()-0.5)*4.5,6,'#ffffff',0.8,0.3,2);
}
function imprisonEnemy(e,dur){
  if(e.state==='ko'||e.state==='freeze')return;
  hideTel(e);if(e.ice)scene.remove(e.ice);
  e.state='freeze';e.ft=dur;e.emote=null;e.wdot={acc:0};
  const sc=e.sc,g=new THREE.Group();
  const orb=new THREE.Mesh(new THREE.SphereGeometry(1.1*sc,22,16),LAMB({color:0x5ab4ff,transparent:true,opacity:0.3}));
  orb.position.y=1.15*sc;orb.scale.y=1.2;g.add(orb);
  const orb2=new THREE.Mesh(new THREE.SphereGeometry(1.14*sc,22,16),new THREE.MeshBasicMaterial({color:0xbfe6ff,transparent:true,opacity:0.22,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.BackSide}));
  orb2.position.y=1.15*sc;orb2.scale.y=1.2;g.add(orb2);
  const rings=[];
  for(let i=0;i<2;i++){const r=new THREE.Mesh(new THREE.TorusGeometry(1.0*sc,0.045,8,32),new THREE.MeshBasicMaterial({color:0xcfeaff,transparent:true,opacity:0.55,blending:THREE.AdditiveBlending,depthWrite:false}));
    r.rotation.x=PI/2;r.position.y=(0.65+i*0.95)*sc;g.add(r);rings.push(r);}
  const bubs=[];
  for(let i=0;i<7;i++){const b=new THREE.Mesh(new THREE.SphereGeometry(0.05+Math.random()*0.05,8,6),new THREE.MeshBasicMaterial({color:0xe8f6ff,transparent:true,opacity:0.8}));
    b.userData={an:Math.random()*PI*2,r:(0.3+Math.random()*0.5)*sc,sp:0.6+Math.random()*0.8,y:Math.random()*2*sc};g.add(b);bubs.push(b);}
  const base=new THREE.Mesh(new THREE.CircleGeometry(1.0*sc,24),new THREE.MeshBasicMaterial({color:0x7fc8ff,transparent:true,opacity:0.3,depthWrite:false,blending:THREE.AdditiveBlending}));
  base.rotation.x=-PI/2;base.position.y=0.06;g.add(base);
  g.userData={kind:'water',rings,bubs};
  g.position.set(e.x,0,e.z);scene.add(g);e.ice=g;
  groundRing(e.x,e.z,0x4aa8ff,2.4,0.5,0.2);
}
function ensureBurnFx(e){
  if(e.burnFx)return;
  e.burnFx=[];
  for(let i=0;i<3;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:ptex[7],transparent:true,depthWrite:false,color:i?0xffa050:0xffd890}));
    s.userData={ph:Math.random()*9,r:i?0.3*e.sc:0,an:i*2.1};scene.add(s);e.burnFx.push(s);}
}
function clearBurnFx(e){if(e.burnFx){e.burnFx.forEach(s=>scene.remove(s));e.burnFx=null;}}

const bP=$h('bPunch'),bC=$h('bCharge');
function holdStart(){if(!F.on||F.dead||F.stun>0||F.ult||F.torn||F.hold||F.dizzy>0||F.pause)return;F.hold={t:0};bP.classList.add('tc');punch();}
function holdEnd(){
  const h=F.hold;F.hold=null;const tc=F.tc;F.tc=null;bP.classList.remove('tc');bP.style.setProperty('--p',0);
  if(!h||!F.on||F.dead)return;
  if(tc&&tc.t>=1){tornado();return;}
}
bP.addEventListener('pointerdown',e=>{e.preventDefault();SND.resume();try{bP.setPointerCapture(e.pointerId);}catch(_){}holdStart();});
['pointerup','pointercancel'].forEach(ev=>bP.addEventListener(ev,()=>holdEnd()));
bC.addEventListener('pointerdown',e=>{e.preventDefault();SND.resume();try{bC.setPointerCapture(e.pointerId);}catch(_){}startCharge();});
['pointerup','pointercancel'].forEach(ev=>bC.addEventListener(ev,()=>endCharge()));
addEventListener('keydown',e=>{if(e.repeat)return;const k=e.key.toLowerCase();if(k==='j'||k===' '){holdStart();e.preventDefault();}else if(k==='k')startCharge();});
addEventListener('keyup',e=>{const k=e.key.toLowerCase();if(k==='k')endCharge();else if(k==='j'||k===' ')holdEnd();});
window.addEventListener('error',e=>{document.title='ERR '+e.message+' @'+e.lineno;});


/* ---------- 公園的貓貓 ---------- */
function makeCat(){
  const g=new THREE.Group(),C='#f0a35a',D='#d4823c',W='#fff6ec';
  const S2=(r,x,y,z,sx,sy,sz,c)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(r,14,10),M(c||C));m.position.set(x,y,z);m.scale.set(sx||1,sy||1,sz||1);g.add(m);return m;};
  S2(0.21,0,0.26,-0.05,1.1,0.95,1.5);
  S2(0.17,0,0.42,0.22);
  S2(0.085,0,0.34,0.36,1,0.8,0.7,W);
  S2(0.045,-0.065,0.46,0.355,1,1.1,0.5,'#3a2a24');S2(0.045,0.065,0.46,0.355,1,1.1,0.5,'#3a2a24');
  S2(0.028,0,0.4,0.39,1,0.8,0.6,'#e8788a');
  S2(0.09,0,0.44,-0.02,1.5,0.5,1.3,D);
  [-1,1].forEach(s=>{const e=new THREE.Mesh(new THREE.ConeGeometry(0.07,0.15,4),M(C));e.position.set(s*0.1,0.6,0.19);e.rotation.z=-s*0.25;g.add(e);
    const i2=new THREE.Mesh(new THREE.ConeGeometry(0.04,0.09,4),M('#ffb6c0'));i2.position.set(s*0.1,0.59,0.215);i2.rotation.z=-s*0.25;g.add(i2);});
  [-1,1].forEach(sx=>[-1,1].forEach(sz=>{const l=new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.05,0.18,8),M(sz>0?W:C));l.position.set(sx*0.11,0.09,sz*0.16+0.04);g.add(l);}));
  const tail=[];for(let i=0;i<5;i++)tail.push(S2(0.055-i*0.004,0,0.3+i*0.075,-0.32-i*0.06,1,1,1,i===4?W:C));
  addOutlines(g);g.traverse(o=>{if(o.isMesh&&!o.userData.ol)o.castShadow=true;});
  scene.add(g);g.userData.tail=tail;return g;
}
const CAT={g:makeCat(),x:50,z:0.2,face:0,st:'idle',t:1,tx:50,tz:0.2,petCd:0,mv:0};CAT.g.position.set(CAT.x,0,CAT.z);CAT.g.visible=false;
function updateCat(dt,t){
  const A=AREAS[6];if(!A)return;
  const vis=curRoom===6;CAT.g.visible=vis;if(!vis)return;
  const pd=Math.hypot(pos.x-CAT.x,pos.z-CAT.z);
  CAT.petCd=Math.max(0,CAT.petCd-dt);CAT.t-=dt;
  const near=roomOf(pos.x,pos.z)===6;
  if(near&&pd<2.6&&CAT.st!=='flee'){
    CAT.st='flee';const an=Math.atan2(CAT.x-pos.x,CAT.z-pos.z)+(Math.random()-0.5)*1.2;
    CAT.tx=clamp(CAT.x+Math.sin(an)*7,A.x0+1,A.x1-1);CAT.tz=clamp(CAT.z+Math.cos(an)*5,A.z0+0.4,A.z1-0.3);CAT.t=1.6;
    if(Math.random()<0.5)SND.meow(1.35,clamp((CAT.x-pos.x)/10,-0.9,0.9));
  }
  if(near&&pd<1.15&&CAT.petCd<=0){
    CAT.petCd=2.5;SND.meow(1.0,clamp((CAT.x-pos.x)/10,-0.9,0.9));toast('🐾 摸到貓貓了！喵～');
    for(let i=0;i<9;i++)emit(CAT.x,0.8,CAT.z,(Math.random()-0.5)*2.5,2+Math.random()*2,(Math.random()-0.5)*2.5,1,'#ff9ec0',0.85,0.3,2,0.1);
  }
  let sp=0;
  if(CAT.st==='flee'){sp=6.4;if(CAT.t<=0||Math.hypot(CAT.tx-CAT.x,CAT.tz-CAT.z)<0.4){CAT.st='idle';CAT.t=0.6+Math.random()*1.5;}}
  else if(CAT.st==='walk'){sp=1.9;if(Math.hypot(CAT.tx-CAT.x,CAT.tz-CAT.z)<0.3||CAT.t<=0){CAT.st='idle';CAT.t=1+Math.random()*2.4;}}
  else if(CAT.t<=0){CAT.st='walk';CAT.t=4.5;CAT.tx=A.x0+1+Math.random()*(A.x1-A.x0-2);CAT.tz=A.z0+0.5+Math.random()*(A.z1-A.z0-1);}
  if(sp>0){const dx=CAT.tx-CAT.x,dz=CAT.tz-CAT.z,d=Math.hypot(dx,dz)||1;CAT.x+=dx/d*sp*dt;CAT.z+=dz/d*sp*dt;
    const tf=Math.atan2(dx,dz);let dd=tf-CAT.face;dd=Math.atan2(Math.sin(dd),Math.cos(dd));CAT.face+=dd*Math.min(1,dt*10);}
  CAT.mv+=((sp>0?1:0)-CAT.mv)*Math.min(1,dt*8);
  CAT.g.position.set(CAT.x,Math.abs(Math.sin(t*(CAT.st==='flee'?16:8)))*0.09*CAT.mv,CAT.z);
  CAT.g.rotation.y=CAT.face;
  CAT.g.userData.tail.forEach((m,i)=>{m.position.x=Math.sin(t*4+i*0.9)*0.055*(1+CAT.mv);});
}

/* ---------- 主迴圈 ---------- */
let W=1,H=1,t=0,last=performance.now(),baseFov=40,rotLock=false,UIS=1,UIB=1,netAcc=0;
const camPos=new THREE.Vector3(0,5,8),camLook=new THREE.Vector3(),want=new THREE.Vector3(),wantL=new THREE.Vector3();
const vo={x:0,y:0};
function resize(){
  W=innerWidth;H=innerHeight;renderer.setSize(W,H,false);
  UIS=Math.max(0.55,Math.min(1,Math.min(W/900,H/560)));UIB=Math.max(0.78,UIS);
  document.documentElement.style.setProperty('--uis',UIS);
  document.documentElement.style.setProperty('--uib',UIB);
  rotLock=H>W;
  const rl=document.getElementById('rotlock');if(rl)rl.classList.toggle('show',rotLock);
  camera.aspect=W/H;baseFov=W/H<0.9?54:40;camera.fov=baseFov;
}
addEventListener('resize',resize);resize();
const CAMP={head:[1.38,3.1],hair:[1.38,3.7],body:[0.95,5.3]};
let rafArmed=false,lastLoopT=0;
function armLoop(){if(rafArmed)return;rafArmed=true;requestAnimationFrame(ts=>{rafArmed=false;loop(ts);});}
if(!navigator.webdriver&&!/nowd/.test(location.hash))setInterval(()=>{if(performance.now()-lastLoopT>1600)loop(performance.now());},1000);
function loop(now){
  armLoop();lastLoopT=performance.now();
  let dt=Math.min((now-last)/1000,0.05);last=now;if(F.pause||rotLock){dt=0;}else if(F.stop>0){F.stop-=dt;dt*=0.08;}else if(F.slow>0){F.slow-=dt;dt*=0.35;}t+=dt;
  let moving=false;
  if(mode==='room'&&act){updateAct(dt);}
  else if(mode==='room'){
    let mx=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),my=(keys.w||keys.arrowup?1:0)-(keys.s||keys.arrowdown?1:0);
    if(titleOn){mx=0;my=0;}
    if(Math.hypot(joy.x,joy.y)>0.12){mx+=joy.x;my+=joy.y;}
    const s=Math.sin(camYaw),c=Math.cos(camYaw);
    const dir=new THREE.Vector3();
    const mag=Math.min(1,Math.hypot(mx,my));
    if(mag>0.1){dir.set(c*mx-s*my,0,-s*mx-c*my).normalize().multiplyScalar(mag);target=null;marker.visible=false;}
    else if(target){
      const gl=wps.length?wps[0]:target,d=gl.clone().sub(pos);d.y=0;
      if(stuck>0.5){target=null;wps=[];marker.visible=false;}
      else if(d.length()<(wps.length?0.2:0.12)){if(wps.length)wps.shift();else{target=null;marker.visible=false;}}
      else dir.copy(d.normalize());
    }
    if(F.on&&(F.stun>0||F.charging||F.dead||F.tc||F.ult||F.torn||F.dizzy>0))dir.set(0,0,0);
    if(dir.lengthSq()>0.0025){
      moving=true;if(emote)emote=null;stepAcc+=dt;if(stepAcc>(F.on?0.17:0.28)){stepAcc=0;SND.step();if(F.on)emit(pos.x,0.12,pos.z,(Math.random()-0.5)*0.6,0.5,(Math.random()-0.5)*0.6,4,'#e8dcc8',0.45,0.24,0);}
      const spd=(F.on?6.2*(1+0.1*lv('speed')):3.2)*(F.atk?0.4:1)*(swim?0.55:1),before=pos.clone(),nx=pos.x+dir.x*spd*dt,nz=pos.z+dir.z*spd*dt;
      if(walkable(nx,nz)){pos.x=nx;pos.z=nz;}else if(walkable(nx,pos.z))pos.x=nx;else if(walkable(pos.x,nz))pos.z=nz;
      collide(pos);
      if(target){stuck=pos.distanceTo(before)<3.2*dt*0.3?stuck+dt:0;}
      const ta=Math.atan2(dir.x,dir.z);let dd=ta-face;dd=Math.atan2(Math.sin(dd),Math.cos(dd));face+=dd*Math.min(1,dt*14);
    }
    marker.scale.setScalar(1+Math.sin(t*6)*0.12);
    const ri=roomOf(pos.x,pos.z);if(ri!==curRoom){const was=curRoom;curRoom=ri;applyZone(ri);if(was>=0){toast('📍 '+RNAMES[ri]);flashFx('zonefx',500);SND.creak();}SND.setAmbience(ri===6?'park':ri===7?'beach':ri===0?'street':'indoor');}
  }else{
    let dd=createYaw-face;face+=dd*Math.min(1,dt*10);
  }
  if(mode==='room'&&!moving&&!target&&!emote&&!act){
    const fo=roomFocus();
    if(fo){const tf=camYaw+(fo.back?PI:0);let d=tf-face;d=Math.atan2(Math.sin(d),Math.cos(d));face+=d*Math.min(1,dt*8);}
  }
  if(mode==='room'){
    if(moving&&panelOpen){panelOpen=false;applyPanelVis();}
    if(faceTo!==null){if(moving)faceTo=null;else{let d=faceTo-face;d=Math.atan2(Math.sin(d),Math.cos(d));face+=d*Math.min(1,dt*10);if(Math.abs(d)<0.03)faceTo=null;}}
    {const inSt=(mode==='room'&&!act&&roomOf(pos.x,pos.z)===0);if(inSt&&!F.on)startFight();else if(!inSt&&F.on&&!F.dead)stopFight();}
    nearHot=act?null:nearestHot();nearNpc=(act||nearHot||F.on)?null:nearestNpc();room.tick(t,dt);updateNpcs(dt,t);updateCat(dt,t);updateBubble(dt);if(F.on)updateFight(dt,t);renderActs();
    if(!act)actY=0;
  }else{actY=0;}
  let et=0,en=null;
  if(emote){emote.t+=dt;et=emote.t;en=emote.type;if(emote.type==='spin')face+=dt*PI*2/0.9;if(emote.t>emote.dur){if(emote.type==='spin'){face=Math.round(face/(PI*2))*PI*2;}emote=null;en=null;}}
  if(F.on){if(F.atk){en=F.atk.type;et=F.atk.t;}else if(F.torn){en='fly';et=F.torn.t;}else if(F.dizzy>0){en='dizzy';et=F.dizzyT;}else if(F.ult){if(F.ult.phase===0){en='ult';et=F.ult.t;}else{en='gaiaThrow';et=F.ult.phase===1?F.ult.t:0.4;}}else if(F.charging||F.tc){en='charge';et=t;}else if(F.stun>0){en='hurt';et=0;}}
  moveAmt+=((moving?1:0)-moveAmt)*Math.min(1,dt*10);
  const rp=mode==='room'?pos:V(0,0,0);
  me.root.position.copy(rp);me.root.position.y=actY+(F.dead?0.2:0)+(F.flyY||0)+(swim?-0.5+Math.sin(t*3.2)*0.05:0);me.root.rotation.set(0,face,0);
  if(F.torn)setTornQuat();
  me.runK=(me.runK||0)+(((F.on&&moving&&!F.dead)?1:0)-(me.runK||0))*Math.min(1,dt*10);
  me.tick(dt,t,moveAmt,en,et);
  if(popT>0){popT=Math.max(0,popT-dt*2.2);const k=Math.sin((1-popT)*PI*3)*0.12*popT;me.root.scale.set(1-k*0.6,1+k,1-k*0.6);}else me.root.scale.set(1,1,1);
  updParts(dt);
  shadow.position.set(rp.x,0.02,rp.z);
  stage.tick(t);
  applyZoneVis();
  propOcclude(dt);
  coHudTick(dt);
  seaTick(dt,t);
  if(NET.state()==='on'){
    netAcc+=dt;
    if(netAcc>=0.1){netAcc=0;
      NET.send({t:'st',x:pos.x,z:pos.z,f:face,m:moveAmt,r:curRoom,h:Math.round(F.hp),hm:F.max,c:F.clone?[+F.clone.x.toFixed(2),+F.clone.z.toFixed(2)]:0,el:F.elem?F.elem.type:0,e:emote?emote.type:(F.atk?F.atk.type:(F.charging||F.tc?'charge':null))});
      if(isHo()&&F.on){
        const es={t:'es',w:F.wave,k:F.kills,s:F.score,en:[],sh:shots.map(s2=>[+s2.x.toFixed(1),+s2.z.toFixed(1),s2.hostile?1:0,s2.missile?1:0]),
          pk:packs.map(p2=>[+p2.x.toFixed(1),+p2.z.toFixed(1)]),ob:orbs.map(o2=>[+o2.x.toFixed(1),+o2.z.toFixed(1),o2.type]),
          st:starObj?[+starObj.x.toFixed(1),+starObj.z.toFixed(1)]:0,
          bo:F.boss?[Math.round(F.boss.hp),F.boss.max,+F.boss.x.toFixed(2),+F.boss.z.toFixed(2),+F.boss.face.toFixed(2),F.boss.state,F.bossN]:0};
        enemies.forEach(e2=>es.en.push([e2.id,+e2.x.toFixed(2),+e2.z.toFixed(2),+e2.face.toFixed(2),Math.round(e2.hp),e2.state,+(e2.y||0).toFixed(2),e2.burn?1:0,e2.ice?(e2.wdot?2:1):0]));
        NET.send(es);
      }
    }
  }
  updateRP(dt,t);

  // 相機
  const zoom=camZoom;
  if(mode==='room'){
    const fo=roomFocus(),hdy=me.headPos.position.y-1.38,D=(fo?fo.d:10.4)*zoom*(F.on?1.12:1),ly=(fo?fo.y:1.1)+hdy*((fo&&fo.y>1.2)?1:0.5),pe=fo?Math.min(camPitch,fo.p):camPitch,cp=Math.cos(pe);
    want.set(pos.x+Math.sin(camYaw)*cp*D,ly+Math.sin(pe)*D,pos.z+Math.cos(camYaw)*cp*D);wantL.set(pos.x,ly,pos.z);
    if(F.on){const D2=14.5*zoom*(F.boss?1.18:1),pe2=0.46,lx=pos.x+Math.sin(face)*1.5;want.set(lx,1.2+Math.sin(pe2)*D2,-0.3+Math.cos(pe2)*D2);wantL.set(lx,1.2,-0.4);camYaw+=(0-camYaw)*Math.min(1,dt*3);}
  }else{
    const p=CAMP[curTabs()[tabIdx].cam||'body'];
    const cyy=p[0]+(me.headPos.position.y-1.38)*(p[0]>1.2?1:0.5);
    want.set(0,cyy+Math.sin(createPitch)*p[1]*zoom,Math.cos(createPitch)*p[1]*zoom);wantL.set(0,cyy,0);
  }
  const k=1-Math.exp(-dt*6);camPos.lerp(want,k);camLook.lerp(wantL,k);
  camera.position.copy(camPos);camera.lookAt(camLook);
  if(F.shake>0){camera.position.x+=(Math.random()-0.5)*F.shake*0.25;camera.position.y+=(Math.random()-0.5)*F.shake*0.25;F.shake=Math.max(0,F.shake-dt*3);}
  // 面板擠出的空間：把角色往沒被擋住的區域移
  const pr=$('#panel').getBoundingClientRect();let tx=0,ty=0;
  if(panelOpen){if(W>H*1.05)tx=pr.width/2;else ty=pr.height/2;}
  vo.x+=(tx-vo.x)*k;vo.y+=(ty-vo.y)*k;
  if(F.on){const fb=document.getElementById('fbtns'),fw=fb.offsetWidth;
    if(fw){fb.style.right='auto';fb.style.left=(W-fw*UIB-(PHONE?12:24))+'px';}
    const eb=$h('elembuff'),sb=$h('starbuff');
    if(eb.style.display!=='none'&&eb.offsetWidth)eb.style.right='',eb.style.left=(W-eb.offsetWidth*UIB-(PHONE?18:30))+'px';
    if(sb.style.display!=='none'&&sb.offsetWidth)sb.style.right='',sb.style.left=(W-sb.offsetWidth*UIB-(PHONE?18:30))+'px';
  }
  camera.fov=baseFov-F.zoomK*5;F.zoomK=Math.max(0,F.zoomK-dt*3.5);
  camera.setViewOffset(W,H,vo.x,vo.y,W,H);
  {const sp0=mode==='room'?pos:V(0,0,0);sun.target.position.set(sp0.x,0,sp0.z);sun.position.set(sp0.x+4,9,sp0.z+5);}
  renderer.render(scene,camera);
}


/* ---------- 登入畫面 ---------- */
let titleOn=false;
function renderTitle(){
  const box=$('#slots');box.innerHTML='';
  if(hasSave){
    const d=document.createElement('div');d.className='pslot';
    const im=document.createElement('img');im.draggable=false;
    try{im.src=renderThumb('body',cfg,outfit,0);}catch(e){}
    d.appendChild(im);
    const nm=document.createElement('b');nm.textContent='▶ 繼續遊戲';d.appendChild(nm);
    const sm=document.createElement('small');sm.textContent='Lv '+((F.upN||0)+1)+' ・ 第 '+(F.wave||1)+' 波 ・ 擊倒 '+(F.best||0);d.appendChild(sm);
    d.onclick=()=>{SND.resume();closeTitle(mode==='create'?'create':'room');toast('👋 歡迎回來！');};
    box.appendChild(d);
  }
  const r=document.createElement('div');r.className='pslot pnew';
  r.innerHTML='<span>✨</span><b>'+(hasSave?'重新開始':'開始遊戲')+'</b><small>'+(hasSave?'進度和角色會清除':'創造你的角色！')+'</small>';
  r.onclick=()=>{
    SND.resume();
    if(hasSave&&!r.dataset.c){r.dataset.c='1';r.querySelector('b').textContent='再按一次確認';r.classList.add('warn');
      setTimeout(()=>{delete r.dataset.c;r.classList.remove('warn');try{r.querySelector('b').textContent='重新開始';}catch(e){}},2500);SND.click();return;}
    try{localStorage.removeItem(SAVE);}catch(e){}
    hasSave=false;
    cfg=Object.assign({},DEFAULT_CFG);outfit=EMPTY_OUT();
    outfit.top=mkItem('top','tee');outfit.bottom=mkItem('bottom','shorts');outfit.shoes=mkItem('shoes','sneaker');
    F.wave=1;F.upN=0;F.xp=0;F.xpNeed=4;F.sk={};F.bossN=0;F.bossWave=0;F.kills=0;F.score=0;F.hp=F.max;F.gauge=0;seenHint=false;
    skillHud();me.update(cfg,shown());
    closeTitle('create');toast('✨ 開始新冒險！');
  };
  box.appendChild(r);
}
function openTitle(){if(F.on)stopFight();save();titleOn=true;renderTitle();$('#title').classList.add('show');}
function closeTitle(m){titleOn=false;$('#title').classList.remove('show');flashFx('zonefx',500);SND.round();setMode(m);}
$('#bUser').onclick=()=>{if(!titleOn){SND.click();openTitle();}};
addEventListener('pagehide',()=>save());



/* ---------- co-op 夥伴端 ---------- */
function coSpawnRec(id){
  const lk=CO.look.get(id);if(!lk)return null;
  const slot=enemyChar();if(!slot)return null;
  try{slot.ch.update(Object.assign({},DEFAULT_CFG,lk.cfg),Object.assign(EMPTY_OUT(),lk.outfit));}catch(e){}
  slot.ch.setPose(null);
  const rec={id,slot,ch:slot.ch,type:lk.type,T:TYPES[lk.type]||TYPES.norm,sc:lk.sc,elite:lk.elite,max:lk.max,hp:lk.max,shownHp:lk.max,
    x:0,z:0,y:0,tx:0,tz:0,ty:0,face:0,tface:0,state:'walk',pstate:'walk',mv:0,emote:null,et:0,bar:makeBar(),
    col:lk.elite?0xffd24a:((TYPES[lk.type]||{}).col||0xf7c84a),fade:1,pop:0,kx:0,kz:0,vy:0,spin:(Math.random()<0.5?-1:1)*8,burn:null,ice:null,wdot:null,t:0,cd:9,et2:0};
  slot.ch.root.scale.setScalar(rec.sc);slot.ch.root.visible=true;scene.add(slot.ch.root);
  if(lk.elite)slot.ch.root.traverse(o=>{if(o.isMesh&&o.material&&o.material.emissive&&!o.material.transparent)o.material.emissive.setHex(0x3a2a00);});
  enemies.push(rec);CO.en.set(id,rec);return rec;
}
function coApplyEs(d){
  if(!isCl())return;
  F.wave=d.w;F.kills=d.k;F.score=d.s;
  const seen=new Set();
  for(const row of d.en){
    const id=row[0];seen.add(id);
    let rec=CO.en.get(id);
    if(!rec){rec=coSpawnRec(id);if(!rec)continue;rec.x=rec.tx=row[1];rec.z=rec.tz=row[2];}
    rec.tx=row[1];rec.tz=row[2];rec.tface=row[3];
    const hp=row[4];
    if(hp<rec.shownHp-0.5&&rec.state!=='ko'){dmgNum(rec.x,2.1*rec.sc,rec.z,Math.round(rec.shownHp-hp),'#fff6d8');}
    rec.shownHp=rec.hp=hp;
    const st2=row[5];
    if(st2==='ko'&&rec.state!=='ko'){burst2(rec.x,1.4,rec.z);SND.ko();}
    rec.state=st2;rec.ty=row[6]||0;
    const bf=row[7],ic=row[8];
    if(bf&&!rec.burn)rec.burn={t:9,dps:0,acc:0,sp:9};
    if(!bf&&rec.burn){rec.burn=null;clearBurnFx(rec);}
    if(ic&&!rec.ice){if(ic===2)imprisonEnemy(rec,999);else freezeEnemy(rec,999);rec.wdot=null;rec.state=st2;}
    if(!ic&&rec.ice){scene.remove(rec.ice);rec.ice=null;SND.shatter();for(let q=0;q<10;q++)emit(rec.x,1.1*rec.sc,rec.z,(Math.random()-0.5)*5,Math.random()*3,(Math.random()-0.5)*5,5,'#cfeeff',0.6,0.2,4);}
  }
  for(const [id,rec] of [...CO.en]){
    if(!seen.has(id)){removeEnemy(rec);const ix=enemies.indexOf(rec);if(ix>=0)enemies.splice(ix,1);CO.en.delete(id);}
  }
  coSyncSimple(packs,d.pk,(x,z)=>dropPack(x,z));
  coSyncSimple(orbs,d.ob,(x,z,ty)=>spawnOrb(x,z,ty),true);
  if(d.st&&!starObj)spawnStar(d.st[0],d.st[1]);
  if(!d.st&&starObj){scene.remove(starObj.g);starObj=null;}
  if(starObj&&d.st){starObj.x=d.st[0];starObj.z=d.st[1];starObj.g.position.x=d.st[0];starObj.g.position.z=d.st[1];}
  coShots(d.sh);
  coBossEs(d.bo);
}
function coSyncSimple(arr,rows,mk,typed){
  while(arr.length>rows.length){const it=arr.pop();scene.remove(it.mesh||it.g);}
  for(let i=0;i<rows.length;i++){
    const r=rows[i];
    if(!arr[i]){mk(r[0],r[1],r[2]);}
    const it=arr[i];if(!it)continue;
    it.x=r[0];it.z=r[1];const m=it.mesh||it.g;if(m){m.position.x=r[0];m.position.z=r[1];}
    it.t=Math.min(it.t||0,5);it.life=99;
  }
}
function coShots(rows){
  while(CO.shots.length>rows.length)scene.remove(CO.shots.pop().m);
  for(let i=0;i<rows.length;i++){
    const r=rows[i];
    if(!CO.shots[i]){
      const missile=!!r[3];
      const m=new THREE.Mesh(missile?new THREE.ConeGeometry(0.17,0.75,8):new THREE.SphereGeometry(0.24,10,8),LAMB({color:missile?0xff5a3c:0xf2f6ff,emissive:missile?0x661100:0x222233}));
      scene.add(m);CO.shots[i]={m,missile};
    }
    const s=CO.shots[i];
    s.m.position.set(r[0],s.missile?1.6:1.2,r[1]);
    s.m.material.color.setHex(r[2]?(s.missile?0xff5a3c:0xf2f6ff):(s.missile?0x7fd8ff:0xffd24a));
  }
}
function coBossEs(bo){
  if(bo&&!CO.boss){
    const g=makeBoss();addOutlines(g);g.traverse(o=>{if(o.isMesh&&!o.userData.ol)o.castShadow=true;});scene.add(g);
    CO.boss={g,x:bo[2],z:bo[3],tx:bo[2],tz:bo[3],face:bo[4],tface:bo[4],hp:bo[0],max:bo[1],state:bo[5],n:bo[6],walk:0};
    banner('⚠ 魔王機器人 ⚠','ice');SND.bossWarn();
  }
  if(CO.boss&&bo){
    const B=CO.boss;
    if(bo[0]<B.hp)dmgNum(B.x,5.2,B.z,Math.round(B.hp-bo[0]),'#fff6d8');
    B.hp=bo[0];B.max=bo[1];B.tx=bo[2];B.tz=bo[3];B.tface=bo[4];B.state=bo[5];B.n=bo[6];
  }
  if(!bo&&CO.boss){
    const B=CO.boss;
    burst2(B.x,2,B.z);for(let i=0;i<30;i++)emit(B.x,2,B.z,(Math.random()-0.5)*12,Math.random()*8,(Math.random()-0.5)*12,0,['#ff9a3c','#ffe27a','#ffffff'][i%3],1,0.5,5);
    SND.explode();banner('🏆 魔王擊破！','fight');
    scene.remove(B.g);CO.boss=null;
  }
}
function clientEnemiesInterp(dt,t2){
  for(const e of enemies){
    const k=Math.min(1,dt*10);
    e.x+=(e.tx-e.x)*k;e.z+=(e.tz-e.z)*k;e.y+=((e.ty||0)-e.y)*k;
    let dd=e.tface-e.face;dd=Math.atan2(Math.sin(dd),Math.cos(dd));e.face+=dd*k;
    const sp=Math.hypot(e.tx-e.x,e.tz-e.z);
    e.mv+=((sp>0.08?1:0)-e.mv)*Math.min(1,dt*8);
    if(e.state==='ko'){e.face+=e.spin*dt*(e.y>0.05?1:0.2);e.ch.setPose(e.y>0.05?'jump':'lie');e.emote=null;}
    else{
      e.ch.setPose(null);
      e.emote={hit:'hurt',wind:'windup',strike:'punchR',slamw:'ult',throw:'windup',tele:'windup',rush:'punchR',dash:'punchR',tired:'hurt',heal:'ult'}[e.state]||null;
      if(e.emote){e.et2+=dt;e.et=e.et2;}else e.et2=0;
    }
  }
}
function clientBossTick(dt,t2){
  const B=CO.boss;if(!B)return;
  const k=Math.min(1,dt*8);
  B.x+=(B.tx-B.x)*k;B.z+=(B.tz-B.z)*k;
  let dd=B.tface-B.face;dd=Math.atan2(Math.sin(dd),Math.cos(dd));B.face+=dd*k;
  const U=B.g.userData,moving=Math.hypot(B.tx-B.x,B.tz-B.z)>0.1;
  B.walk+=dt*(moving?6:0);
  const sw=Math.sin(B.walk)*0.5*(moving?1:0);
  U.legL.rotation.x=sw;U.legR.rotation.x=-sw;
  const armT={swing:-2.2,pound:-3,rocket:-1.6}[B.state]||((moving?sw*0.7:0));
  U.armR.rotation.x+=(((typeof armT==='number')?armT:0)-U.armR.rotation.x)*Math.min(1,dt*6);
  U.armL.rotation.x+=((B.state==='pound'?-3:(moving?-sw*0.7:0))-U.armL.rotation.x)*Math.min(1,dt*6);
  U.body.position.y=2.3+Math.abs(Math.sin(B.walk))*0.12*(moving?1:0)+Math.sin(t2*2)*0.03;
  U.core.scale.setScalar(1+Math.sin(t2*6)*0.18);
  B.g.position.set(B.x,0,B.z);B.g.rotation.y=B.face;
}
function coLeave(){
  for(const [id,rec] of [...CO.en]){removeEnemy(rec);const ix=enemies.indexOf(rec);if(ix>=0)enemies.splice(ix,1);}
  CO.en.clear();CO.look.clear();
  CO.shots.forEach(s=>scene.remove(s.m));CO.shots=[];
  if(CO.boss){scene.remove(CO.boss.g);CO.boss=null;}
}

/* ---------- 連線同玩：遠端玩家 + UI ---------- */
const RP={ch:null,on:false,name:'',x:0,z:0,tx:0,tz:0,face:0,tface:0,mv:0,room:2,emote:null,et:0};
function rpEnsure(){
  if(!RP.ch){
    RP.ch=new Character();scene.add(RP.ch.root);RP.ch.root.visible=false;
    RP.bar=makeBar();RP.bar.visible=false;
    RP.ring=new THREE.Mesh(new THREE.RingGeometry(0.5,0.66,28),new THREE.MeshBasicMaterial({transparent:true,opacity:0.55,side:2,depthWrite:false,blending:THREE.AdditiveBlending}));
    RP.ring.rotation.x=-PI/2;RP.ring.visible=false;scene.add(RP.ring);
  }
}
function netSendHello(){NET.send({t:'hi',name:NET.isHost()?'房主':'夥伴',cfg,outfit,sk:F.sk});}
function recentRooms(){try{return JSON.parse(localStorage.getItem('acdress_rooms'))||[];}catch(e){return[];}}
function addRecent(c){try{let r=recentRooms().filter(x=>x!==c);r.unshift(c);r=r.slice(0,4);localStorage.setItem('acdress_rooms',JSON.stringify(r));}catch(e){}}
let netWasOn=false;
NET.on('onState',(s,msg)=>{
  const prevOn=netWasOn;netWasOn=(s==='on');
  netUI();updVoiceBtn();updNetBtn();
  if(msg)toast(msg);
  if(s==='on'){
    if(F.on)stopFight();
    F.wave=1;F.upN=0;F.xp=0;F.xpNeed=4;F.sk={};F.bossN=0;F.bossWave=0;F.kills=0;F.score=0;F.gauge=0;F.hp=F.max;F.elem=null;clearStar();
    skillHud();hud();save();
    if(!NET.isHost())addRecent(NET.code());
    toast('🤝 連線成功！共鬥從第 1 波全新開始');SND.sparkle();netSendHello();
  }
  if(s==='off'&&prevOn&&!NET.isHost()){
    if(F.on)stopFight();
    pos.set(0,0,1.6);target=null;wps=[];
    toast('🏠 連線結束，已回到自己的家');
  }
  if(s==='off'&&RP.on){RP.on=false;if(RP.ch)RP.ch.root.visible=false;coLeave();}
  if(/nettest/.test(location.hash))document.title='NET '+s+' '+NET.code();
});
NET.on('onData',d=>{
  if(!d||!d.t)return;
  if(d.t==='hi'){
    rpEnsure();RP.on=true;RP.name=(''+(d.name||'夥伴')).slice(0,12);RP.cfg=d.cfg;RP.sk=d.sk||{};RP.lvpN=0;setTimeout(drawAva,800);
    try{RP.ch.update(Object.assign({},DEFAULT_CFG,d.cfg),Object.assign(EMPTY_OUT(),d.outfit));}catch(e){}
    RP.tx=RP.x=pos.x+1.2;RP.tz=RP.z=pos.z;toast('👋 '+RP.name+' 來了！');
  }else if(d.t==='sk'){
    const old=RP.sk||{};RP.sk=d.sk||{};
    for(const k in RP.sk){if((old[k]|0)<RP.sk[k]){const s3=SK.find(s2=>s2.id===k);if(s3)toast('🤝 '+(RP.name||'夥伴')+'：'+s3.n+' Lv'+RP.sk[k]);}}
  }else if(d.t==='lvp'){
    RP.lvpN=d.n;
    if(lvWait&&(RP.lvpN|0)>=myLvN)lvResume();
  }else if(d.t==='ping'){
    NET.send({t:'pong',ts:d.ts});
  }else if(d.t==='pong'){
    RP.ping=Math.round(performance.now()-d.ts);
  }else if(d.t==='st'){
    RP.tx=d.x;RP.tz=d.z;RP.tface=d.f;RP.mv=d.m;RP.room=d.r;RP.hp=d.h;RP.hpm=d.hm||100;
    RP.elem=d.el|0;
    if(d.c&&!RP.clone){RP.clone={x:d.c[0],z:d.c[1]};RP.cloneNew=true;}
    else if(!d.c&&RP.clone){RP.cloneGone={x:RP.clone.x,z:RP.clone.z};RP.clone=null;}
    else if(d.c){RP.clone.x=d.c[0];RP.clone.z=d.c[1];}
    if(d.e&&d.e!==RP.emote){RP.emote=d.e;RP.et=0;if(/^punch|^upper/.test(d.e))RP.pf=true;}
    if(!d.e)RP.emote=null;
  }else if(d.t==='es'){coApplyEs(d);
  }else if(d.t==='esp'){CO.look.set(d.id,d);
  }else if(d.t==='dmg'&&isHo()){
    const e=enemies.find(q=>q.id===d.id);
    if(e&&e.state!=='ko'){const sv=F.elem;F.elem=d.el?{type:d.el,t:1}:null;CO.apply=true;hitEnemy(e,d.dmg,d.kb||4,d.dx||1,d.dz||0,!!d.big,(d.k===undefined||d.k===null)?undefined:d.k);CO.apply=false;F.elem=sv;}
  }else if(d.t==='bdmg'&&isHo()){
    const sv=F.elem;F.elem=d.el?{type:d.el,t:1}:null;CO.apply=true;hitBoss(d.dmg,!!d.big,d.dx||1,d.dz||0,d.k);CO.apply=false;F.elem=sv;
  }else if(d.t==='clh'){cloneHurt();
  }else if(d.t==='phit'){hurtPlayer(d.dmg,d.dx||1,d.dz||0,!!d.hv);
  }else if(d.t==='pick'){
    if(d.k==='pack'){F.hp=Math.min(F.max,F.hp+35);burst('body',['#9bf0b0','#ffffff','#e8505b'],18);SND.heal();toast('❤ 補血 +35');dmgNum(pos.x,2.4,pos.z,'+35','#6bd47a');}
    else if(d.k==='orb'){const E2=ELEMS[d.o];if(E2){F.elem={type:d.o,t:10};burst('body',[E2.hex,'#ffffff'],18);SND.sparkle();toast(E2.ic+' '+E2.n+'！拳頭附魔 10 秒');}}
    else if(d.k==='star'){F.star=5;SND.starPower();toast('⭐ 無敵星星！5 秒無敵！');burst('body',['#ffd24a','#ff6a88','#6bb6f2','#6bd47a','#ffffff'],26);}
  }else if(d.t==='xp'){gainXP(d.n||1);if(d.bko)banner('🏆 魔王擊破！','fight');
  }else if(d.t==='fend'){if(isCl()){coLeave();toast('🏳 房主離開了戰場');}
  }else if(d.t==='out'){
    RP.cfg=d.cfg;setTimeout(drawAva,300);
    if(RP.ch)try{RP.ch.update(Object.assign({},DEFAULT_CFG,d.cfg),Object.assign(EMPTY_OUT(),d.outfit));}catch(e){}
  }
});
let rpSwords=[],rpCloneCh=null,rpElemGl=null,rpFxAcc=0;
function updateRPFx(dt,t){
  const vis=RP.on&&RP.ch&&RP.ch.root.visible;
  if(RP.cloneNew){RP.cloneNew=false;if(!rpCloneCh){rpCloneCh=new Character();scene.add(rpCloneCh.root);}try{rpCloneCh.update(Object.assign({},DEFAULT_CFG,RP.cfg||{}),EMPTY_OUT());}catch(e){}ghostify(rpCloneCh.root);if(vis)cloneSmoke(RP.clone.x,RP.clone.z);}
  if(RP.cloneGone){if(vis)cloneSmoke(RP.cloneGone.x,RP.cloneGone.z);RP.cloneGone=null;}
  if(rpCloneCh){
    const cv=vis&&RP.clone&&RP.room===curRoom;
    rpCloneCh.root.visible=cv;
    if(cv){rpCloneCh.root.position.set(RP.clone.x,0,RP.clone.z);rpCloneCh.tick(dt,t,0,null,0);}
  }
  if(!rpElemGl){rpElemGl=addGlowSprite(0xffffff);rpElemGl.scale.set(1.5,1.5,1);rpElemGl.visible=false;scene.add(rpElemGl);}
  const ev=vis&&RP.elem>0&&ELEMS[RP.elem];
  rpElemGl.visible=!!ev;
  if(ev){rpElemGl.material.color.setHex(ELEMS[RP.elem].col);rpElemGl.material.opacity=0.3+0.12*Math.sin(t*5);rpElemGl.position.set(RP.x+Math.sin(t*2.2)*0.3,1.15+Math.sin(t*3.1)*0.15,RP.z+Math.cos(t*2.2)*0.3);}
  if(vis&&RP.emote==='charge'){
    rpFxAcc-=dt;
    if(rpFxAcc<=0){rpFxAcc=0.09;emit(RP.x+(Math.random()-0.5)*0.9,0.15,RP.z+(Math.random()-0.5)*0.9,0,2.6+Math.random()*1.5,0,0,'#ffd24a',0.5,0.3,-0.5,0.1);}
  }
  if(RP.pf&&RP.et>0.07){
    RP.pf=false;
    const SL2=(RP.sk&&RP.sk.shock)|0;
    if(vis&&SL2)groundRing(RP.x,RP.z,0xffb060,2.2+0.6*SL2,0.3,0.14);
  }
}
function updateRPSwords(dt,t){
  const Ls=(RP.on&&RP.sk&&RP.sk.swords)|0;
  const vis=RP.on&&RP.ch&&RP.ch.root.visible&&RP.room===0;
  const n=(vis&&Ls)?(Ls+1+(Ls>=5?2:0)):0;
  while(rpSwords.length<n)rpSwords.push(makeSword());
  while(rpSwords.length>n)scene.remove(rpSwords.pop());
  rpSwords.forEach((g,i)=>{
    const base=t*2.6+i*PI*2/rpSwords.length;
    g.position.set(RP.x+Math.cos(base)*1.6,1.7+Math.sin(t*3+i)*0.12,RP.z+Math.sin(base)*1.6);
    orient(g,V(Math.cos(base)*0.4,1,Math.sin(base)*0.4));
  });
}
function updateRP(dt,t){
  if(!RP.on||!RP.ch){if(RP.bar)RP.bar.visible=false;if(RP.ring)RP.ring.visible=false;return;}
  const k=Math.min(1,dt*10);
  RP.x+=(RP.tx-RP.x)*k;RP.z+=(RP.tz-RP.z)*k;
  let dd=RP.tface-RP.face;dd=Math.atan2(Math.sin(dd),Math.cos(dd));RP.face+=dd*k;
  const vis=mode==='room'&&RP.room===curRoom;
  RP.ch.root.visible=vis;
  if(RP.bar){
    RP.bar.visible=vis;RP.ring.visible=vis;
    if(vis){
      const r=Math.max(0,Math.min(1,(RP.hp===undefined?100:RP.hp)/(RP.hpm||100)));
      RP.bar.position.set(RP.x,2.2,RP.z);RP.bar.quaternion.copy(camera.quaternion);RP.bar.scale.set(0.8,1,1);
      const fg=RP.bar.userData.fg;fg.scale.x=Math.max(0.001,r);fg.position.x=-(1-r)*0.5;
      fg.material.color.setHex(r>0.5?0x6bd47a:(r>0.25?0xf7c84a:0xe8505b));
      RP.ring.position.set(RP.x,0.1,RP.z);
      RP.ring.material.color.setHSL(0.33*r,0.9,0.55);
      RP.ring.scale.setScalar(1+0.07*Math.sin(t*4));
    }
  }
  if(vis){
    const rpSwim=RP.room===7&&RP.z<-1.85;
    RP.ch.root.position.set(RP.x,rpSwim?-0.5:0,RP.z);RP.ch.root.rotation.y=RP.face;
    if(RP.emote)RP.et+=dt;if(RP.et>4)RP.emote=null;
    RP.ch.tick(dt,t,RP.mv||0,RP.emote,RP.et);
  }
  updateRPSwords(dt,t);
  updateRPFx(dt,t);
}
function drawAva(){
  const cv=document.getElementById('coAva');
  if(!cv||!RP.ch||!RP.ch.faceCv)return;
  const g2=cv.getContext('2d'),fc=RP.ch.faceCv;
  g2.clearRect(0,0,64,64);
  g2.fillStyle='#ffe3c8';g2.beginPath();g2.arc(32,32,32,0,2*PI);g2.fill();
  g2.save();g2.beginPath();g2.arc(32,32,32,0,2*PI);g2.clip();
  const s2=Math.min(fc.width,fc.height);
  g2.drawImage(fc,(fc.width-s2)/2,(fc.height-s2)/2,s2,s2,4,4,56,56);
  g2.restore();
}
let coAcc=0,pingAcc=0;
function coHudTick(dt){
  const el=document.getElementById('coHud');if(!el)return;
  const show=NET.state()==='on'&&RP.on;
  el.style.display=show?'flex':'none';
  if(!show)return;
  pingAcc+=dt;
  if(pingAcc>=2){pingAcc=0;NET.send({t:'ping',ts:performance.now()});if(Math.random()<0.5)drawAva();}
  coAcc+=dt;
  if(coAcc>=0.3){
    coAcc=0;
    document.getElementById('coName').textContent=RP.name||'夥伴';
    const r=Math.max(0,Math.min(1,(RP.hp===undefined?100:RP.hp)/(RP.hpm||100)));
    const bar=document.querySelector('#coHp i');
    bar.style.width=(r*100).toFixed(0)+'%';
    bar.style.background=r>0.5?'#6bd47a':(r>0.25?'#f7c84a':'#e8505b');
    const pe=document.getElementById('coPing');
    if(RP.ping===undefined)pe.textContent='📶 …';
    else{pe.textContent='📶 '+RP.ping+'ms';pe.style.color=RP.ping<120?'#2f9e5b':(RP.ping<280?'#c08a00':'#d04545');}
  }
}
/* ---------- 🌊 海泳模式：魚群+鯊魚 ---------- */
let swim=false,swimKx=0,swimKz=0,swimFx=0,swimToastT=-99;
const SEA={x0:58.9,x1:73.2,z0:-5.9,z1:-1.85};
const seaG=new THREE.Group();scene.add(seaG);seaG.visible=false;
const FISHES=[];let SHARK=null,swimRing=null;
(function(){
  const cols=['#7fc4e8','#f0a8c0','#9fd8a8','#ffd27f'];
  for(let i=0;i<7;i++){
    const g=new THREE.Group(),col=cols[i%4];
    const body=new THREE.Mesh(new THREE.SphereGeometry(0.15,10,8),LAMB({color:col}));body.scale.set(1.7,0.75,0.6);g.add(body);
    const tail=new THREE.Mesh(new THREE.ConeGeometry(0.09,0.2,4),LAMB({color:col}));tail.rotation.z=-PI/2;tail.position.x=-0.3;g.add(tail);
    const fin=new THREE.Mesh(new THREE.ConeGeometry(0.06,0.14,4),LAMB({color:col}));fin.position.y=0.12;g.add(fin);
    seaG.add(g);
    FISHES.push({g,cx:60.8+Math.random()*9.5,cz:-4.7+Math.random()*1.1,r:0.7+Math.random()*1.0,a:Math.random()*6.28,sp:(0.5+Math.random()*0.6)*(i%2?1:-1),jt:3+Math.random()*8,jp:-1});
  }
  const sg=new THREE.Group();
  const fin2=new THREE.Mesh(new THREE.ConeGeometry(0.22,0.62,4),LAMB({color:'#5a6b78'}));fin2.scale.z=0.35;fin2.position.y=0.26;sg.add(fin2);
  const bk=new THREE.Mesh(new THREE.SphereGeometry(0.42,10,8),LAMB({color:'#6e8290'}));bk.scale.set(2.1,0.5,0.8);bk.position.y=-0.14;sg.add(bk);
  const tl=new THREE.Mesh(new THREE.ConeGeometry(0.16,0.4,4),LAMB({color:'#5a6b78'}));tl.rotation.z=-PI/2;tl.position.set(-0.85,0.05,0);tl.scale.z=0.4;sg.add(tl);
  seaG.add(sg);
  SHARK={g:sg,x:71.5,z:-4.5,a:0,cd:0,chase:false};
  swimRing=new THREE.Mesh(new THREE.RingGeometry(0.42,0.56,26),new THREE.MeshBasicMaterial({color:0xdff4ff,transparent:true,opacity:0.5,side:2,depthWrite:false,blending:THREE.AdditiveBlending}));
  swimRing.rotation.x=-PI/2;swimRing.visible=false;scene.add(swimRing);
})();
function seaTick(dt,t){
  const inBeach=mode==='room'&&curRoom===7;
  seaG.visible=inBeach;
  if(/swimtest/.test(HASH)&&!seaTick._t1){seaTick._t1=1;if(inBeach)pos.set(63.5,0,-4.0);}
  const wasSwim=swim;
  swim=inBeach&&pos.z<SEA.z1&&pos.x>SEA.x0-0.4;
  swimRing.visible=swim;
  if(swim&&!wasSwim){
    SND.whoosh(0);
    for(let i=0;i<14;i++)emit(pos.x+(Math.random()-0.5)*0.8,0.15,pos.z+(Math.random()-0.5)*0.8,(Math.random()-0.5)*2,2.5+Math.random()*1.5,(Math.random()-0.5)*2,7,'#cfeeff',0.4,0.5,0,4);
    if(t-swimToastT>20){swimToastT=t;toast('🌊 游泳模式！小心深水區的鯊魚…');}
  }
  if(swim){
    swimRing.position.set(pos.x,0.04,pos.z);
    const sc=1+0.1*Math.sin(t*3.4);swimRing.scale.setScalar(sc);
    swimFx-=dt;
    if(swimFx<=0&&moveAmt>0.1){swimFx=0.13;emit(pos.x-Math.sin(face)*0.4,0.1,pos.z-Math.cos(face)*0.4,(Math.random()-0.5)*1.2,1.6,(Math.random()-0.5)*1.2,6,'#e4f6ff',0.35,0.45,0,4);}
    if(swimKx||swimKz){
      const nx=pos.x+swimKx*dt,nz=pos.z+swimKz*dt;
      if(walkable(nx,nz)){pos.x=nx;pos.z=nz;}
      swimKx*=Math.pow(0.02,dt);swimKz*=Math.pow(0.02,dt);
      if(Math.hypot(swimKx,swimKz)<0.2){swimKx=0;swimKz=0;}
    }
  }
  if(!inBeach)return;
  for(const f of FISHES){
    if(f.jp>=0){
      f.jp+=dt/0.9;
      if(f.jp>=1){f.jp=-1;f.jt=4+Math.random()*9;emit(f.g.position.x,0.1,f.g.position.z,0,1.5,0,5,'#dff4ff',0.3,0.4,0,4);}
    }else{f.jt-=dt;if(f.jt<=0){f.jp=0;emit(f.g.position.x,0.1,f.g.position.z,0,1.8,0,5,'#dff4ff',0.3,0.4,0,4);SND.pop&&SND.pop();}}
    f.a+=f.sp*dt;
    const fx2=f.cx+Math.cos(f.a)*f.r,fz2=f.cz+Math.sin(f.a)*f.r*0.55;
    const jy=f.jp>=0?Math.sin(f.jp*PI)*0.85:0;
    f.g.position.set(fx2,-0.1+jy,fz2);
    const fvx=-Math.sin(f.a)*f.sp,fvz=Math.cos(f.a)*0.55*f.sp;
    f.g.rotation.y=-Math.atan2(fvz,fvx);
    f.g.rotation.z=f.jp>=0?(0.5-f.jp)*1.5*(f.sp>0?1:-1):0;
  }
  if(SHARK){
    SHARK.cd-=dt;
    const dx=pos.x-SHARK.x,dz=pos.z-SHARK.z,d=Math.hypot(dx,dz);
    SHARK.chase=swim&&d<4.2&&SHARK.cd<=0;
    if(SHARK.chase){
      SHARK.x+=dx/d*1.7*dt;SHARK.z+=dz/d*1.7*dt;
      SHARK.g.rotation.y=-Math.atan2(dz,dx);
      if(d<1.0){
        SHARK.cd=3.5;
        SND.slam();SND.whoosh(1);
        for(let i=0;i<26;i++)emit(pos.x+(Math.random()-0.5),0.2,pos.z+(Math.random()-0.5),(Math.random()-0.5)*4,3+Math.random()*2.5,(Math.random()-0.5)*4,8,i%3?'#dff4ff':'#9fd8f0',0.5,0.6,0,5);
        const kd=Math.hypot(dx,dz)||1;
        swimKx=dx/kd*5;swimKz=4.5;
        startEmote('dizzy',1.6);
        toast('🦈 哇！被鯊魚撞到了！');
      }
    }else{
      SHARK.a+=dt*0.35;
      const tx2=66+Math.cos(SHARK.a)*5.5,tz2=-4.5+Math.sin(SHARK.a)*0.9;
      const mx=tx2-SHARK.x,mz=tz2-SHARK.z,md=Math.hypot(mx,mz);
      if(md>0.05){SHARK.x+=mx/md*Math.min(md,0.95*dt);SHARK.z+=mz/md*Math.min(md,0.95*dt);SHARK.g.rotation.y=-Math.atan2(mz,mx);}
    }
    SHARK.z=Math.max(-6.3,Math.min(-2.2,SHARK.z));
    SHARK.x=Math.max(59.3,Math.min(73,SHARK.x));
    SHARK.g.position.set(SHARK.x,-0.08+Math.sin(t*2.6)*0.03,SHARK.z);
  }
}
function netUI(){
  const body=$('#netbody');if(!body)return;
  const s=NET.state();body.innerHTML='';
  const mk=(txt,cls,fn)=>{const b2=document.createElement('button');b2.className=cls;b2.textContent=txt;b2.onclick=fn;return b2;};
  if(s==='off'){
    const p=document.createElement('p');p.innerHTML='兩台裝置都開著遊戲（需網路）。<br>一人建立房間拿到 <b>5 字房號</b>，另一人輸入房號就能一起玩、開語音！';
    body.appendChild(p);
    body.appendChild(mk('🏠 建立房間','ngreen',()=>{SND.click();NET.host();netUI();}));
    const row=document.createElement('div');row.className='nrow';
    const inp=document.createElement('input');inp.id='nCode';inp.maxLength=5;inp.placeholder='房號';
    row.appendChild(inp);
    row.appendChild(mk('🚪 加入','nblue',()=>{SND.click();NET.join(inp.value);netUI();}));
    body.appendChild(row);
    const rr=recentRooms();
    if(rr.length){
      const lab=document.createElement('p');lab.innerHTML='<b>⏱ 最近的房間</b>（🟢=開房中，點了直接加入）';body.appendChild(lab);
      const row2=document.createElement('div');row2.className='nrow';
      const bts={};
      rr.forEach(c2=>{const b3=mk('⏳'+c2,'nrecent',()=>{SND.click();NET.join(c2);netUI();});bts[c2]=b3;row2.appendChild(b3);});
      body.appendChild(row2);
      NET.probe(rr,(cd,ok)=>{const b3=bts[cd];if(b3){b3.textContent=(ok?'🟢':'⚪')+cd;if(ok){b3.style.borderColor='#3fae6a';b3.style.boxShadow='0 0 10px rgba(63,174,106,.6)';}else b3.style.opacity=0.6;}});
    }
  }else if(s==='wait'||s==='joining'){
    const p=document.createElement('p');p.textContent=s==='wait'?'正在連上配對服務…':'正在連到房主…';body.appendChild(p);
    body.appendChild(mk('❌ 取消','ngray',()=>{NET.leave();netUI();}));
  }else if(s==='hosting'){
    const c=document.createElement('div');c.className='ncode';c.textContent=NET.code();body.appendChild(c);
    const p=document.createElement('p');p.innerHTML='把房號告訴朋友，等他加入…<br><small>第一次會詢問麥克風權限（語音用，可拒絕）</small>';body.appendChild(p);
    body.appendChild(mk('❌ 取消','nred',()=>{NET.leave();netUI();}));
  }else if(s==='on'){
    const p=document.createElement('p');p.innerHTML='✅ 已連線'+(RP.on?('：<b>'+RP.name+'</b> 同行中'):'')+'<br>'+(NET.micOk()?'🔊 語音開啟中':'🎙 語音未啟用');body.appendChild(p);
    const row=document.createElement('div');row.className='nrow';
    if(NET.micOk())row.appendChild(mk(NET.muted()?'🎙 取消靜音':'🔇 靜音','nblue',function(){const m=NET.toggleMute();this.textContent=m?'🎙 取消靜音':'🔇 靜音';updVoiceBtn();}));
    else row.appendChild(mk('🎙 開啟語音','ngreen',function(){this.textContent='🎙 詢問權限中…';NET.enableVoice().then(ok=>{toast(ok?'🔊 語音已開啟！':'🎙 麥克風權限被拒，語音無法使用');netUI();updVoiceBtn();});}));
    row.appendChild(mk('❌ 離開連線','nred',()=>{NET.leave();netUI();}));
    body.appendChild(row);
  }
}
function updVoiceBtn(){
  const b=$('#bVoice');if(!b)return;
  if(NET.state()!=='on'){b.style.display='none';return;}
  b.style.display='';b.textContent=NET.micOk()?(NET.muted()?'🔇':'🎙'):'🎙';b.style.opacity=NET.micOk()?1:0.5;
}
function updNetBtn(){
  const b=$('#bNet');if(!b)return;const s=NET.state();
  b.classList.toggle('hosting',s==='hosting'||s==='wait'||s==='joining');
  b.classList.toggle('non',s==='on');
}
$('#bVoice').onclick=()=>{
  SND.resume();
  if(!NET.micOk())NET.enableVoice().then(ok=>{toast(ok?'🔊 語音已開啟！':'🎙 麥克風權限被拒');updVoiceBtn();netUI();});
  else{NET.toggleMute();updVoiceBtn();toast(NET.muted()?'🔇 已靜音':'🎙 麥克風開啟');}
};
function openNet(){SND.resume();netUI();updVoiceBtn();updNetBtn();$('#netov').classList.add('show');}
$('#bNet').onclick=()=>{if(!F.on){SND.click();openNet();}};
$('#nClose').onclick=()=>$('#netov').classList.remove('show');

/* ---------- 啟動 ---------- */
const HASH=location.hash;
if(/noblink/.test(HASH))me.blinkT=1e9;
if(/room/.test(HASH))mode='room';
{const hm=HASH.match(/hair=(\d+)/),xm=HASH.match(/sex=(m|f)/);if(xm)cfg.sex=xm[1];if(hm)cfg.hair=+hm[1];const cm=HASH.match(/hc=(\d+)/);if(cm)cfg.hairCol=+cm[1];me.update(cfg,shown());}
{const zm=HASH.match(/z=([0-9.]+)/);if(zm)camZoom=+zm[1];}
{const am=HASH.match(/at=(\d)/);if(am){pos.set(RCENT[+am[1]][0],0,RCENT[+am[1]][1]);camPos.set(pos.x,7,pos.z+9);camLook.set(pos.x,1,pos.z);}
if(/nopanel/.test(HASH)){panelOpen=false;}
const dm2=HASH.match(/do=([a-z]+)\.(\w+)/);if(dm2){const hh=HOT.find(x=>x.id===dm2[1]),aa=hh&&hh.acts.find(x=>x.id===dm2[2]);if(hh&&aa){pos.set(hh.x,0,hh.z);camPos.set(pos.x,5,pos.z+8);camLook.set(pos.x,1,pos.z);mode='room';setTimeout(()=>startAct(hh,aa),400);}}
if(/fight/.test(HASH)){mode='room';pos.set(-30,0,0);camPos.set(pos.x,6,pos.z+9);camLook.set(pos.x,1,pos.z);
  const wm=HASH.match(/wave=(\d+)/);
  setTimeout(()=>{
    if(wm)F.wave=+wm[1];
    if(/types/.test(HASH)){['norm','fast','thrower','charger','heavy','healer'].forEach((k,i)=>{spawnEnemy(k);const e=enemies[enemies.length-1];e.x=pos.x+(i-2.5)*2.5;e.z=pos.z-1.8+(i%2)*2.6;});}
    else if(!/boss/.test(HASH)){for(let i=0;i<4;i++)spawnEnemy();enemies.forEach((e,i)=>{e.x=pos.x+(i%2?3.2:-3.2)+(i>1?1:0);e.z=pos.z+(i<2?-1.2:1.4);});}
    F.spawnT=99;
    if(/skills/.test(HASH)){SK.forEach(s2=>F.sk[s2.id]=/skills5/.test(HASH)?5:3);skillHud();}
    if(/lvl/.test(HASH)){gainXP(99);}
    if(/star/.test(HASH)){F.star=8;spawnStar(pos.x+2.5,pos.z+1.5);}
    if(/orbs/.test(HASH)){Object.keys(ELEMS).forEach((k2,i)=>spawnOrb(pos.x-6+i*2.4,pos.z+2.2,k2));}
    const em2=HASH.match(/elem=(\w+)/);if(em2){F.elem={type:em2[1],t:60};}
    if(/pause/.test(HASH)){showPause();}
    {const nm2=HASH.match(/net=(host|join):([A-Za-z0-9]+)/);
     if(nm2){setTimeout(()=>{if(nm2[1]==='host')NET.host(nm2[2]);else NET.join(nm2[2]);openNet();},600);}}
    if(/occl/.test(HASH)){const e2=enemies[0];if(e2){e2.x=pos.x+0.3;e2.z=pos.z+2.3;e2.state='hit';e2.t=99;e2.kx=0;e2.kz=0;if(/fadetest/.test(HASH))setInterval(()=>fadeChar(e2.ch.root,0.3),500);
if(/probe/.test(HASH))setInterval(()=>{const o=occludesLine(e2.x,1.1*e2.sc,e2.z,1.15*e2.sc);groundRing(pos.x,pos.z,o?0x00ff00:0xff0000,2.5,0.5,0.2);dmgNum(pos.x,3,pos.z,(o?'OCC':'no')+' fA='+(e2.fadeA===undefined?'-':e2.fadeA.toFixed(2)),o?'#00ff88':'#ff6666');},700);}}
    if(/refl/.test(HASH)){setTimeout(()=>{enemies.forEach(e2=>{e2.x=pos.x-16;e2.z=3;});fireShot(pos.x+4,pos.z,-1,0,7.5,8,'ball');face=Math.PI/2;setTimeout(()=>punch(),300);
      setTimeout(()=>{document.title=document.title.replace('歡樂派對','')+' |REFL rh='+(window._rh|0)+' rf='+(window._rf|0)+' atk='+(!!F.atk)+' face='+face.toFixed(2)+' on='+F.on+' m='+mode+' px='+(pos.x|0)+' cr='+curRoom+' en='+enemies.length+' P='+F.pause+' lq='+F.lvlQ+' stop='+F.stop.toFixed(2)+' slow='+F.slow.toFixed(2)+' ov='+$h('lvl').className+' '+(shots[0]?(shots[0].hostile?'H':'F')+' d='+Math.hypot(shots[0].x-pos.x,shots[0].z-pos.z).toFixed(1):'gone');},750);},1500);}
    if(/uitest/.test(HASH)){setTimeout(()=>{const r1=bP.getBoundingClientRect(),r2=bC.getBoundingClientRect(),f=document.getElementById('fbtns'),rf=f.getBoundingClientRect();
      document.title='BTN P['+(r1.x|0)+','+(r1.y|0)+','+(r1.width|0)+','+getComputedStyle(bP).display+'] C['+(r2.x|0)+','+(r2.y|0)+','+(r2.width|0)+'] F['+(rf.x|0)+','+(rf.y|0)+','+(rf.width|0)+'] CS[r='+getComputedStyle(f).right+'/l='+getComputedStyle(f).left+'/w='+getComputedStyle(f).width+'/'+getComputedStyle(f).flexDirection+'] W='+innerWidth+'/'+document.documentElement.clientWidth+'/'+(window.visualViewport?visualViewport.width|0:'-');},2600);}
    if(/fxtest/.test(HASH)){
      SK.forEach(s=>F.sk[s.id]=3);skillHud();F.cloneCd=0;
      enemies.forEach((e,i)=>{e.x=pos.x+(i%2?4:-4)+(i>1?1.5:0);e.z=pos.z+(i<2?-1.5:1.5);});
      if(enemies[0])freezeEnemy(enemies[0],20);
      if(enemies[1])enemies[1].burn={t:20,dps:6,acc:0};
      if(enemies[2])hitEnemy(enemies[2],5,3,1,0,true,2);
      shockFx(pos.x+0.6,pos.z,1,0,4);thornsFx();levelFx();
    }
    if(/boss/.test(HASH)){F.wave=10;F.bossWave=10;spawnBoss();
      if(/drop/.test(HASH)){const B=F.boss;B.y=0.5;B.vy=-4;B.x=pos.x+5;B.z=pos.z;}
      else if(/land/.test(HASH)){const B=F.boss;B.y=0;B.vy=0;B.state='walk';B.cd=99;B.x=pos.x+6;B.z=pos.z;const m=HASH.match(/atk=(\w+)/);if(m){B.state=m[1];B.t=m[1]==='pound'?0.85:0.55;B.hitDone=false;B.cd=99;}}}
  },900);
  if(/dizzy/.test(HASH)){setTimeout(()=>{F.dizzy=5;F.dizzyT=0;},1500);}
  if(/torn/.test(HASH)){setTimeout(()=>{if(enemies[0]){enemies.forEach((e,i)=>{e.x=pos.x+3+i*1.6;e.z=pos.z+(i%2?0.8:-0.8);});}tornado();},1800);}
  else if(/ult/.test(HASH)){setTimeout(()=>{F.gauge=100;ultimate();},/boss/.test(HASH)?4200:2200);}
  else if(/punch/.test(HASH)){setTimeout(()=>{enemies[0].x=pos.x+1.1;enemies[0].z=pos.z;enemies[0].state='hit';enemies[0].t=3;punch();},1800);}
  else if(/hurt/.test(HASH)){setTimeout(()=>{F.hp=10;},1500);}}
if(/colltest/.test(HASH)){setTimeout(()=>{document.title='COLL '+JSON.stringify(room.boxes.filter(b=>b.x1<-19&&!(b.front&&F.on)).map(b=>[b.x0,b.x1,b.z0,b.z1].map(v=>+v.toFixed(1))));},2500);}
const sm2=HASH.match(/shop=(\d)/);if(sm2){const nn=NPCS[+sm2[1]];pos.set(nn.x,0,nn.z+1.9);camPos.set(pos.x,5,pos.z+8);camLook.set(pos.x,1,pos.z);mode='room';if(/talk/.test(HASH))setTimeout(()=>npcTalk(nn),500);if(/buy/.test(HASH))setTimeout(()=>npcBuy(nn),500);}}
const tm=HASH.match(/tab=(\d+)/);if(tm)tabIdx=+tm[1];
me.update(cfg,shown());
if(savedFight){Object.assign(F,{wave:savedFight.wave||1,upN:savedFight.upN||0,xp:savedFight.xp||0,xpNeed:savedFight.xpNeed||4,sk:savedFight.sk||{},bossN:savedFight.bossN||0,bossWave:savedFight.bossWave||0,kills:savedFight.kills||0,score:savedFight.score||0});if(savedFight.best>F.best)F.best=savedFight.best;skillHud();}
if(!(HASH.length>1&&!/login/.test(HASH)))openTitle();
setMode(mode);if(tm){tabIdx=+tm[1];renderPanel(false);}
const sm=HASH.match(/set=(\d+)/);if(sm){applySet(SETS[+sm[1]]);panelOpen=false;applyPanelVis();}
requestAnimationFrame(t0=>{last=t0;loop(t0);});
})();
