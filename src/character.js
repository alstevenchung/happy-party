'use strict';
/* ===== 3D 角色（全部由程式組出，無外部素材） ===== */
const PI=Math.PI;
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
/* 三階賽璐璐上色：亮面/中間調/暗面，卡通感的關鍵 */
const TOONGRAD=(()=>{const v=[172,176,190,214,236,248,253,255],d=new Uint8Array(v.length*4);
  v.forEach((x,i)=>{d[i*4]=x;d[i*4+1]=Math.round(x*0.985);d[i*4+2]=Math.round(x*0.97);d[i*4+3]=255;});
  const t=new THREE.DataTexture(d,v.length,1,THREE.RGBAFormat);t.minFilter=t.magFilter=THREE.LinearFilter;t.needsUpdate=true;return t;})();
function LAMB(opt){return new THREE.MeshToonMaterial(Object.assign({gradientMap:TOONGRAD},opt));}
const M=(c,o)=>LAMB(Object.assign({color:c},o||{}));
/* 卡通描邊：沿法線外推的反向殼，深可可色 */
const OUTLINE=new THREE.ShaderMaterial({side:THREE.BackSide,
  vertexShader:'void main(){vec3 p=position+normal*0.0085;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',
  fragmentShader:'void main(){gl_FragColor=vec4(0.45,0.29,0.27,1.0);}'});
OUTLINE.userData.shared=1;
const OUTLINE_ON=false;
/* 麻糬頭型：臉頰處微微鼓出、下巴收圓、頭頂略平；頭、臉部貼圖共用同一個變形 */
function headShape(geo){
  const p=geo.attributes.position;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i),r=Math.hypot(x,y,z)||1,ny=y/r;
    const ck=1+0.055*Math.exp(-Math.pow((ny+0.34)/0.36,2));
    const top=ny>0.55?1-0.05*(ny-0.55)/0.45:1,chin=ny<-0.7?1-0.07*(-0.7-ny)/0.3:1;
    p.setXYZ(i,x*ck,y*top*chin,z*(1+(ck-1)*0.55));
  }
  p.needsUpdate=true;geo.computeVertexNormals();return geo;
}
/* 邊緣光：輪廓處補一圈暖白，角色從背景浮出來（只加在有描邊的角色/魔王/貓） */
function RIMFN(sh){
  sh.fragmentShader=sh.fragmentShader.replace('#include <output_fragment>',
    'float rimK=pow(1.0-clamp(dot(normalize(normal),normalize(vViewPosition)),0.0,1.0),2.6);\noutgoingLight+=vec3(1.0,0.95,0.86)*rimK*0.26;\n#include <output_fragment>');
}
function addRim(m){if(m&&m.isMeshToonMaterial&&!m.userData.rim){m.userData.rim=1;m.onBeforeCompile=RIMFN;m.needsUpdate=true;}}
function addOutlines(root){
  const list=[];
  root.traverse(o=>{if(o.isMesh&&!o.userData.ol&&o.material&&!o.material.transparent)addRim(o.material);});
  root.traverse(o=>{if(o.isMesh&&o.type==='Mesh'&&!o.userData.ol&&!o.userData.hasOl&&o.material&&!o.material.transparent)list.push(o);});
  if(!OUTLINE_ON)return;
  for(const o of list){const m=new THREE.Mesh(o.geometry,OUTLINE);m.userData.ol=1;o.userData.hasOl=1;o.add(m);}
}
const SPH=(r,ws,hs)=>new THREE.SphereGeometry(r,ws||16,hs||12);
function clear(g){
  while(g.children.length){
    const c=g.children[0];g.remove(c);
    c.traverse(o=>{
      if(o.geometry)o.geometry.dispose();
      if(o.material&&!o.material.userData.shared)o.material.dispose();
    });
  }
}
function orient(o,dir){o.quaternion.setFromUnitVectors(V(0,1,0),dir.clone().normalize());}
function place(o,pos){o.position.copy(pos);o.quaternion.setFromUnitVectors(V(0,0,1),pos.clone().normalize());}
function surf(r,th,ph){return V(r*Math.sin(th)*Math.sin(ph),r*Math.cos(th),r*Math.sin(th)*Math.cos(ph));}
function bar(a,b,r,m){
  const d=b.clone().sub(a),o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d.length(),8),m);
  o.position.copy(a).add(b).multiplyScalar(0.5);orient(o,d);return o;
}

/* --- 花紋貼圖 --- */
const TEX={};
const PAT_REP={stripe:[1,5],vstripe:[10,1],check:[6,5],dots:[6,4],star:[5,3],heart:[5,3],border:[1,1],gradient:[1,1]};
function starPath(g,cx,cy,r){g.beginPath();for(let i=0;i<10;i++){const a=-PI/2+i*PI/5,rr=i%2?r*0.45:r;g.lineTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr);}g.closePath();g.fill();}
function heartPath(g,cx,cy,s){g.beginPath();g.moveTo(cx,cy+s*.9);g.bezierCurveTo(cx-s*1.6,cy-s*.1,cx-s*.7,cy-s*1.1,cx,cy-s*.35);g.bezierCurveTo(cx+s*.7,cy-s*1.1,cx+s*1.6,cy-s*.1,cx,cy+s*.9);g.fill();}
function patternTex(p,c1,c2){
  const key=p+c1+c2;if(TEX[key])return TEX[key];
  const s=128,cv=document.createElement('canvas');cv.width=cv.height=s;const g=cv.getContext('2d');
  g.fillStyle=c1;g.fillRect(0,0,s,s);g.fillStyle=c2;g.strokeStyle=c2;
  switch(p){
    case 'stripe':g.fillRect(0,0,s,s/2);break;
    case 'vstripe':g.fillRect(0,0,s/2,s);break;
    case 'check':g.globalAlpha=.5;g.fillRect(0,0,s/2,s);g.fillRect(0,0,s,s/2);break;
    case 'dots':g.beginPath();g.arc(32,32,15,0,7);g.fill();g.beginPath();g.arc(96,96,15,0,7);g.fill();break;
    case 'star':starPath(g,64,66,34);break;
    case 'heart':heartPath(g,64,62,26);break;
    case 'border':g.fillRect(0,s*.76,s,s*.24);break;
    case 'gradient':{const gr=g.createLinearGradient(0,s,0,0);gr.addColorStop(0,c2);gr.addColorStop(1,c1);g.fillStyle=gr;g.fillRect(0,0,s,s);break;}
  }
  const t=new THREE.CanvasTexture(cv);t.wrapS=t.wrapT=THREE.RepeatWrapping;
  const r=PAT_REP[p]||[1,1];t.repeat.set(r[0],r[1]);TEX[key]=t;return t;
}
function clothMat(p,c1,c2){
  if(!p||p==='solid')return M(c1,{side:2});
  return M(0xffffff,{map:patternTex(p,c1,c2||c1),side:2});
}

/* --- 軀幹輪廓 --- */
const TR=0.19,TC0=0.49,TC1=0.60,TY0=0.30,TY1=0.79;
const BODY={chest:1,waist:1};
function torsoR(y){
  const t=Math.max(0,Math.min(1,(y-TY0)/(TY1-TY0))),tp=(1.1-0.1*t)*(1+(BODY.waist-1)*Math.exp(-Math.pow((t-0.38)/0.22,2))+(BODY.chest-1)*Math.exp(-Math.pow((t-0.8)/0.25,2)));
  if(y<TC0){const d=TC0-y;return Math.sqrt(Math.max(0,TR*TR-d*d))*tp;}
  if(y>TC1){const d=y-TC1;return Math.sqrt(Math.max(0,TR*TR-d*d))*tp;}
  return TR*tp;
}
function torsoBand(y0,y1,off,phi0,phiL){
  const pts=[],n=Math.max(2,Math.ceil((y1-y0)/0.03));
  for(let i=0;i<=n;i++){const y=y0+(y1-y0)*i/n;pts.push(new THREE.Vector2(torsoR(y)+off,y));}
  return new THREE.LatheGeometry(pts,phiL?10:28,phi0||0,phiL||PI*2);
}
function heartGeo(sz){
  const s=new THREE.Shape();s.moveTo(0,-.5);s.bezierCurveTo(-.9,.1,-.6,.8,0,.35);s.bezierCurveTo(.6,.8,.9,.1,0,-.5);
  const g=new THREE.ShapeGeometry(s);g.scale(sz,sz,sz);return g;
}

/* --- 連續髮殼：每個方位角有各自的髮線(瀏海/兩側/後長)，髮尾外翻、帶髮絲紋理 --- */
function hairShell(R,hl,flare){
  const N=110,M=24,pos=[],col=[],idx=[];
  for(let i=0;i<=N;i++){
    const a=-PI+i/N*2*PI,e=hl(a);
    for(let j=0;j<=M;j++){
      const v=j/M,th=v*e;
      let r=R*(1+0.04*Math.sin(v*PI)+0.025*Math.pow(v,4))*flare(th,a);
      const p=surf(r,th,a);pos.push(p.x,p.y,p.z);
      const strand=0.5+0.5*Math.sin(a*24+th*3);
      const sheen=Math.exp(-Math.pow((th-0.62)/0.17,2))*(0.55+0.45*Math.max(0,Math.cos(a-0.5)))*0.2;
      const f=Math.min(1,0.8+0.045*strand+sheen+0.04*(1-v));
      col.push(f,f,f);
    }
  }
  for(let i=0;i<N;i++)for(let j=0;j<M;j++){
    const a=i*(M+1)+j,b=(i+1)*(M+1)+j,c=b+1,d=a+1;idx.push(a,d,b,b,d,c);
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  g.setIndex(idx);g.computeVertexNormals();
  // 確認法線朝外
  const k=(Math.floor(N/2)*(M+1)+Math.floor(M/2))*3,nn=g.attributes.normal.array;
  if(nn[k]*pos[k]+nn[k+1]*pos[k+1]+nn[k+2]*pos[k+2]<0){
    for(let q=0;q<idx.length;q+=3){const t=idx[q+1];idx[q+1]=idx[q+2];idx[q+2]=t;}
    g.setIndex(idx);g.computeVertexNormals();
  }
  return g;
}
/* --- 錐形肢體（上粗下細、圓頭），d = 離肩/髖的距離 --- */
const armR=d=>0.076-0.026*Math.min(1,d/0.3);
const legR=d=>0.088-0.03*Math.min(1,d/0.34);
function taperGeo(fn,top,bot){
  const r0=fn(bot),pts=[new THREE.Vector2(0,-bot),new THREE.Vector2(r0*0.55,-bot+0.008),new THREE.Vector2(r0*0.85,-bot+0.025)],n=14;
  for(let i=0;i<=n;i++){const y=-bot+0.04+(bot-0.04)*i/n;pts.push(new THREE.Vector2(fn(Math.max(0,-y)),y));}
  pts.push(new THREE.Vector2(fn(0)*0.7,top),new THREE.Vector2(0,top+0.01));
  return new THREE.LatheGeometry(pts,18);
}
const ss=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};

class Character{
  constructor(){
    this.root=new THREE.Group();this.k={};this.cfg=null;this.phase=0;this.blinkT=2;this.blinking=false;
    this.backAnim=null;this.hatAnim=null;
    this.skinMat=M('#f3b68f');this.skinMat.userData.shared=1;
    this.hairMat=M('#4a2c1c',{side:2});this.hairMat.userData.shared=1;
    this.hairHi=M('#ffffff',{side:2,transparent:true,opacity:0.22,depthWrite:false});this.hairHi.userData.shared=1;
    this.hairMatV=M('#4a2c1c',{side:2,vertexColors:true});this.hairMatV.userData.shared=1;
    this.body=new THREE.Group();this.root.add(this.body);
    this.lower=new THREE.Group();this.lower.scale.setScalar(1.15);this.body.add(this.lower);
    this.torsoG=new THREE.Group();this.torsoG.scale.set(1.05,1,0.95);this.lower.add(this.torsoG);
    this.torsoSkin=new THREE.Mesh(torsoBand(TY0,TY1,0),this.skinMat);this.torsoG.add(this.torsoSkin);
    this.topG=new THREE.Group();this.botG=new THREE.Group();this.torsoG.add(this.topG,this.botG);
    this.arms=[];this.legs=[];this.sleeveG=[];this.pantsG=[];this.sockG=[];this.shoeG=[];
    const capA=taperGeo(armR,0.04,0.37),capL=taperGeo(legR,0.0,0.345);
    for(let i=0;i<2;i++){
      const a=new THREE.Group();a.position.set((i?1:-1)*0.27,0.68,0);
      const am=new THREE.Mesh(capA,this.skinMat);a.add(am);
      const hd=new THREE.Mesh(SPH(0.08,16,14),this.skinMat);hd.position.y=-0.355;hd.scale.set(1,1.1,0.88);(this.hands=this.hands||[]).push(hd);a.add(hd);
      const sg=new THREE.Group();a.add(sg);this.sleeveG.push(sg);this.lower.add(a);this.arms.push(a);
      const l=new THREE.Group();l.position.set((i?1:-1)*0.11,0.42,0);
      const lm=new THREE.Mesh(capL,this.skinMat);l.add(lm);
      const pg=new THREE.Group(),kg=new THREE.Group(),sh=new THREE.Group();l.add(kg,pg,sh);
      this.pantsG.push(pg);this.sockG.push(kg);this.shoeG.push(sh);this.lower.add(l);this.legs.push(l);
    }
    // 頭
    this.headPos=new THREE.Group();this.headPos.position.set(0,1.38,0);this.body.add(this.headPos);
    this.headS=new THREE.Group();this.headPos.add(this.headS);
    this.headS.add(new THREE.Mesh(headShape(SPH(0.5,40,30)),this.skinMat));
    for(const s of[-1,1]){const e=new THREE.Mesh(SPH(0.09,12,10),this.skinMat);e.position.set(s*0.49,-0.03,0);e.scale.set(0.5,1,0.7);this.headS.add(e);}
    this.faceCv=document.createElement('canvas');this.faceCv.width=FW;this.faceCv.height=FH;
    this.faceTex=new THREE.CanvasTexture(this.faceCv);
    const dg=headShape(new THREE.SphereGeometry(0.503,48,32,PI/2-FPH/2,FPH,FTH0,FH/FS));
    const dm=new THREE.MeshLambertMaterial({map:this.faceTex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
    dm.userData.shared=1;this.headS.add(new THREE.Mesh(dg,dm));
    this.hairG=new THREE.Group();this.hatG=new THREE.Group();this.faceG=new THREE.Group();
    this.headS.add(this.hairG,this.hatG,this.faceG);
    this.backG=new THREE.Group();this.lower.add(this.backG);
    this.buildShoes(null);
  }

  update(cfg,o){
    this.cfg=cfg;const J=JSON.stringify,k=this.k;let s;
    BODY.chest=cfg.chest||1;BODY.waist=cfg.waist||1;
    s=J([cfg.sex,cfg.skin,cfg.face,cfg.headSize,cfg.faceW,cfg.faceH,cfg.height,cfg.chest,cfg.waist,cfg.legs]);if(k.body!==s){k.body=s;this.applyBody();}
    s=J([cfg.skin,cfg.face,cfg.eye,cfg.eyeCol,cfg.brow,cfg.browCol,cfg.hairCol,cfg.nose,cfg.mouth,cfg.lipCol,cfg.cheek,cfg.freckle,cfg.featY,cfg.featS]);
    if(k.face!==s){k.face=s;this.redrawFace(false);}
    const hi=o.hat&&findItem('hat',o.hat.id),cover=hi&&hi.cover?1:0;
    s=J([cfg.sex,cfg.hair,cover]);if(k.hair!==s){k.hair=s;this.buildHair(cover);}
    this.hairMat.color.set(HAIRCOL[cfg.hairCol]);this.hairMatV.color.set(HAIRCOL[cfg.hairCol]);
    s=J([o.top,o.bottom,o.dress,cfg.chest,cfg.waist]);if(k.cl!==s){k.cl=s;this.buildClothes(o);}
    s=J(o.shoes||0);if(k.sh!==s){k.sh=s;this.buildShoes(o.shoes);}
    s=J(o.socks||0);if(k.so!==s){k.so=s;this.buildSocks(o.socks);}
    s=J(o.hat||0);if(k.hat!==s){k.hat=s;this.buildHat(o.hat);}
    s=J([o.face||0,cfg.face,cfg.featY]);if(k.fa!==s){k.fa=s;this.buildFaceAcc(o.face);}
    s=J([o.back||0,cfg.chest,cfg.waist]);if(k.bk!==s){k.bk=s;this.buildBack(o.back);}
    addOutlines(this.root);this.root.traverse(q=>{if(q.isMesh&&!q.userData.ol&&!(q.material&&q.material.transparent))q.castShadow=true;});
  }
  applyBody(){
    const c=this.cfg,F=FACES[c.face],g=k=>c[k]===undefined?1:c[k];
    this.skinMat.color.set(SKIN[c.skin]);
    const hs=g('headSize'),sxh=(1+(F.sx-1)*0.6)*0.985*g('faceW')*hs,syh=(1+(F.sy-1)*0.6)*1.0*g('faceH')*hs;
    this.headS.scale.set(sxh,syh,hs);
    const H=g('height'),L=g('legs'),s=1.15*H,lift=0.42*s*(L-1);
    this.lower.scale.setScalar(s);this.lower.position.y=lift;
    this.legs.forEach((l,i)=>{l.scale.y=L;this.shoeG[i].scale.y=1/L;this.shoeG[i].position.y=0.42*(1-L)/L;});
    const sx=(c.sex==='f'?1.02:1.12)/Math.pow(H,0.5);this.torsoG.scale.x=sx;
    const ax=sx*0.16+0.052+(g('chest')-1)*0.05;
    this.arms[0].position.x=-ax;this.arms[1].position.x=ax;
    this.torsoSkin.geometry.dispose();this.torsoSkin.geometry=torsoBand(TY0,TY1,0);this.torsoSkin.children.forEach(ch=>{if(ch.userData.ol)ch.geometry=this.torsoSkin.geometry;});
    this.headPos.position.y=0.79*s+lift+0.5*syh-0.06;
  }
  redrawFace(blink){drawFace(this.faceCv,this.cfg,blink,this.expr);this.faceTex.needsUpdate=true;}
  setExpr(e){if(this.expr!==e){this.expr=e;if(this.cfg)this.redrawFace(this.blinking);}}

  /* ---------- 髮型 ---------- */
  buildHair(cover){
    const G=this.hairG;clear(G);
    const H=HAIR[this.cfg.sex][this.cfg.hair];if(!H)return;
    const m=this.hairMat,Rh=0.545*(H.vol||1);
    const part=(r,p0,pl,t0,tl)=>{const o=new THREE.Mesh(new THREE.SphereGeometry(r,28,18,p0,pl,t0,tl),m);G.add(o);return o;};
    const E=(r,x,y,z,sx,sy,sz)=>{const o=new THREE.Mesh(SPH(r,18,14),m);o.position.set(x,y,z);o.scale.set(sx||1,sy||1,sz||1);G.add(o);return o;};
    const capT=H.cap!==undefined?H.cap:0.95;
    let sideT=[1.3,1.75,2.1,2.4][H.sd];
    if(H.ex.includes('mohawk'))sideT=0.75;
    const fr=a=>{
      const x=Math.abs(a);
      switch(H.fr){
        case 'short':return Math.max(capT,1.05+0.05*Math.sin(a*11));
        case 'straight':return 1.38-0.12*ss(0.3,1.3,x)+0.03*Math.sin(a*13);
        case 'side':return 1.28-0.25*Math.max(-1.3,Math.min(1.3,a))/1.2+0.03*Math.sin(a*12);
        case 'center':return 1.0+0.36*ss(0,0.5,x)+0.06*ss(0.5,1.3,x)+0.02*Math.sin(a*12)*ss(0.3,0.6,x);
        case 'curtain':return 1.0+0.5*ss(0,0.5,x)+0.2*ss(0.5,1.3,x);
        default:return capT;
      }
    };
    const bkT=Math.max(sideT,[0,1.95,2.3,2.65][H.bk]);
    const hl=a=>{
      const x=Math.abs(a);let e=Math.max(fr(a),capT);
      e=e*(1-ss(1.0,1.7,x))+sideT*ss(1.0,1.7,x);
      const wb=ss(2.0,2.7,x);return e*(1-wb)+bkT*wb;
    };
    const fl=H.bk===3?0.45:H.bk===2?0.35:H.bk===1?0.15:0,fs=H.sd>=2?0.16*(H.sd-1):0;
    const flare=(th,a)=>{const x=Math.abs(a);return 1+(fs*ss(0.9,1.6,x)+fl*ss(1.8,2.6,x))*Math.max(0,th-1.6);};
    G.add(new THREE.Mesh(hairShell(Rh,hl,flare),this.hairMatV));
    G.scale.set(1,1,1);
    for(const e of H.ex){
      switch(e){
        case 'spikes':if(cover)break;
          for(let i=0;i<7;i++){const a=i/7*2*PI,c=new THREE.Mesh(new THREE.ConeGeometry(0.13,0.38,8),m);
            c.position.set(Math.sin(a)*0.3,0.52,Math.cos(a)*0.3-0.04);orient(c,V(Math.sin(a)*0.7,1,Math.cos(a)*0.7));G.add(c);}
          {const c=new THREE.Mesh(new THREE.ConeGeometry(0.13,0.4,8),m);c.position.set(0,0.62,-0.04);G.add(c);}break;
        case 'pomp':if(cover)break;E(0.3,0,0.5,0.28,0.9,0.55,1);break;
        case 'afro':case 'fluff':{
          if(cover&&e==='afro')break;
          const r=e==='afro'?0.72:0.62,ft=e==='afro'?1.2:1.15,bt=e==='afro'?1.95:2.1,y=e==='afro'?0.05:0.02,z=e==='afro'?-0.1:-0.06;
          const a=part(r,PI/2-1.2,2.4,0,ft),b=part(r,PI/2+1.2,2*PI-2.4,0,bt);a.position.set(0,y,z);b.position.set(0,y,z);break;}
        case 'mohawk':if(cover)break;for(let i=0;i<7;i++){const z=0.32-0.1*i;E(0.1,0,Math.sqrt(0.3-z*z)-0.0,z,0.5,1.5,1.1);}break;
        case 'ahoge':{const c=new THREE.Mesh(new THREE.ConeGeometry(0.035,0.32,6),m);c.position.set(0.04,0.6,0.15);orient(c,V(0.4,1,0.5));G.add(c);break;}
        case 'knot':if(cover)break;E(0.15,0,0.6,-0.02);{const c=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.07,0.1,10),m);c.position.set(0,0.52,-0.02);G.add(c);}break;
        case 'bun':if(cover)break;E(0.21,0,0.58,-0.1);break;
        case 'twinbun':if(cover)break;[-1,1].forEach(s=>E(0.19,s*0.36,0.46,-0.06));break;
        case 'pony':E(0.07,0,0.14,-0.55);E(0.19,0,-0.2,-0.66,0.8,2.3,0.8).rotation.x=0.15;break;
        case 'sidepony':E(0.07,0.46,0.12,-0.2);E(0.17,0.55,-0.2,-0.25,0.8,2.2,0.8).rotation.z=-0.15;break;
        case 'twin':[-1,1].forEach(s=>{E(0.07,s*0.5,0.14,-0.1);E(0.17,s*0.58,-0.28,-0.12,0.8,2.6,0.8);});break;
        case 'braid':for(let i=0;i<5;i++)E(0.1*(1-i*0.08),0,-0.1-0.15*i,-0.52-0.01*i,1,1.1,1);break;
        case 'curl':[-1,1].forEach(s=>{for(let i=0;i<5;i++)E(0.12,s*0.52,-0.12-0.14*i,0.02-0.02*i);});break;
        case 'sidelocks':[-1,1].forEach(s=>E(0.1,s*0.44,-0.2,0.2,0.7,2.6,0.6));break;
      }
    }
  }

  /* ---------- 衣服 ---------- */
  buildClothes(o){
    clear(this.topG);clear(this.botG);this.sleeveG.forEach(clear);this.pantsG.forEach(clear);
    let top,bot,pat=null;
    if(o.dress){
      const it=findItem('dress',o.dress.id),c2=o.dress.c2||o.dress.c1;
      top={def:Object.assign({pat:it.def.pat},it.def.top),c1:o.dress.c1,c2};
      bot={def:Object.assign({pat:it.def.pat},it.def.bot),c1:o.dress.c1,c2};
    }else{
      top=o.top?{def:findItem('top',o.top.id).def,c1:o.top.c1,c2:o.top.c2}:{def:{sl:'none',neck:'round'},c1:'#f4f4f4',c2:'#f4f4f4'};
      bot=o.bottom?{def:findItem('bottom',o.bottom.id).def,c1:o.bottom.c1,c2:o.bottom.c2}:{def:{t:'pants',len:'tiny'},c1:'#f4f4f4',c2:'#f4f4f4'};
    }
    this.makeTop(top);this.makeBottom(bot);
  }
  makeTop(t){
    const d=t.def,G=this.topG,hem=d.hem||0.42,c2=t.c2||t.c1;
    const mat=clothMat(d.pat,t.c1,c2),m2=M(c2,{side:2}),ex=d.ex||[];
    const zf=y=>torsoR(y)+0.025;
    G.add(new THREE.Mesh(torsoBand(hem,TY1,0.016),mat));
    const sl=d.sl;
    if(sl&&sl!=='none'){
      const len={short:0.1,puff:0.1,long:0.32,'3q':0.22}[sl],r=sl==='puff'?0.11:0.1;
      for(let i=0;i<2;i++){
        const S=this.sleeveG[i];
        const cy=new THREE.Mesh(new THREE.CylinderGeometry(armR(0)+0.014+(sl==='puff'?0.01:0),armR(len-0.03)+0.014+(sl==='puff'?0.012:0),len,16,1,true),mat);cy.position.y=-len/2+0.03;S.add(cy);
        S.add(new THREE.Mesh(SPH(0.104,14,10),mat));
        if(sl==='puff'){const p=new THREE.Mesh(SPH(0.14,14,10),mat);p.position.y=-0.045;p.scale.y=0.8;S.add(p);
          const rg=new THREE.Mesh(new THREE.TorusGeometry(0.1,0.012,6,16),m2);rg.rotation.x=PI/2;rg.position.y=-0.06;S.add(rg);}
        if(ex.includes('cuff')){const rg=new THREE.Mesh(new THREE.TorusGeometry(armR(len-0.03)+0.016,0.014,6,16),m2);rg.rotation.x=PI/2;rg.position.y=-len+0.045;S.add(rg);}
      }
    }
    const add=(g,m,x,y,z)=>{const q=new THREE.Mesh(g,m);q.position.set(x,y,z);G.add(q);return q;};
    const bowAt=(x,y,z,m)=>{
      add(SPH(0.04,10,8),m,x,y,z);
      [-1,1].forEach(s=>{const c=new THREE.Mesh(new THREE.ConeGeometry(0.06,0.11,10),m);c.rotation.z=s*PI/2;c.position.set(x+s*0.065,y,z);G.add(c);});
    };
    switch(d.neck){
      case 'round':break;
      case 'collar':{const col=(d.pat&&d.pat!=='solid')?M(t.c1,{side:2}):m2;const rg=add(new THREE.TorusGeometry(0.19,0.032,8,28),col,0,0.67,0.01);rg.rotation.x=PI/2+0.3;break;}
      case 'turtle':{const rg=add(new THREE.TorusGeometry(0.11,0.05,8,28),mat,0,0.76,0);rg.rotation.x=PI/2;break;}
      case 'sailor':{
        G.add(new THREE.Mesh(torsoBand(0.5,0.74,0.035),m2));
        const red=M('#e8505b',{side:2});bowAt(0,0.53,0.205,red);break;}
      case 'hood':{
        const h=add(SPH(0.2,16,12),mat,0,0.68,-0.14);h.scale.set(1.1,0.9,0.8);
        const rg=add(new THREE.TorusGeometry(0.18,0.05,8,28),mat,0,0.68,0.0);rg.rotation.x=PI/2;break;}
      case 'bow':bowAt(0,0.6,0.205,m2);break;
    }
    if(ex.includes('pocket'))add(new THREE.BoxGeometry(0.17,0.12,0.03),m2,0,0.46,0.2);
    if(ex.includes('buttons'))for(let i=0;i<4;i++){const y=0.58-0.07*i;add(SPH(0.016,8,6),m2,0,y,zf(y));}
    if(ex.includes('zip'))add(new THREE.BoxGeometry(0.016,0.3,0.016),m2,0,0.5,zf(0.5)-0.004);
    if(ex.includes('apron')){
      G.add(new THREE.Mesh(torsoBand(0.34,0.7,0.026,-0.95,1.9),m2));
      add(new THREE.BoxGeometry(0.12,0.08,0.02),M('#ffffff',{side:2}),0,0.48,zf(0.48)+0.02);
    }
  }
  makeBottom(b){
    const d=b.def,G=this.botG,c2=b.c2||b.c1,mat=clothMat(d.pat,b.c1,c2),m2=M(c2,{side:2}),ex=d.ex||[];
    G.add(new THREE.Mesh(torsoBand(TY0,0.52,0.010),mat));
    if(d.t==='pants'){
      const L={tiny:0.1,short:0.17,mid:0.27,long:0.35}[d.len],w=d.wide||0,r=legR(0)+0.01+(w?0.022:0),rb=legR(L)+0.01+(w?0.04:0)+(w===2?0.012:0);
      for(let i=0;i<2;i++){
        const P=this.pantsG[i];
        P.add(new THREE.Mesh(SPH(r+0.004,14,10),mat));
        const cy=new THREE.Mesh(new THREE.CylinderGeometry(r,rb,L,18,1,true),mat);cy.position.y=-L/2;P.add(cy);
        if(w===2){const pf=new THREE.Mesh(SPH(rb+0.03,14,10),mat);pf.position.y=-L+0.03;pf.scale.y=0.7;P.add(pf);
          const rg=new THREE.Mesh(new THREE.TorusGeometry(rb+0.005,0.016,6,18),m2);rg.rotation.x=PI/2;rg.position.y=-L-0.015;P.add(rg);}
      }
    }else{
      const len={short:0.13,mid:0.22,long:0.38}[d.len],rt=TR+0.016;
      const sk=new THREE.Mesh(new THREE.CylinderGeometry(rt,rt+(d.flare||0),len,32,1,true),mat);sk.position.y=0.5-len/2;G.add(sk);
    }
    if(ex.includes('bib')){
      const sm=M(b.c1,{side:2});
      G.add(new THREE.Mesh(torsoBand(0.46,0.63,0.024,-0.62,1.24),sm));
      [-1,1].forEach(s=>{
        G.add(new THREE.Mesh(torsoBand(0.58,0.78,0.024,s*0.45-0.11,0.22),sm));
        G.add(new THREE.Mesh(torsoBand(0.58,0.78,0.024,PI+s*0.45-0.11,0.22),sm));
        const bt=new THREE.Mesh(SPH(0.022,8,6),m2);bt.position.set(Math.sin(s*0.45)*0.225,0.62,Math.cos(s*0.45)*0.225);G.add(bt);
      });
    }
    if(ex.includes('obi')){
      G.add(new THREE.Mesh(torsoBand(0.5,0.64,0.032),m2));
      const bw=new THREE.Mesh(new THREE.BoxGeometry(0.2,0.14,0.05),m2);bw.position.set(0,0.57,-0.235);G.add(bw);
    }
  }

  /* ---------- 襪子 / 鞋子 ---------- */
  buildSocks(s){
    this.sockG.forEach(clear);if(!s)return;
    const it=findItem('socks',s.id),d=it.def,len={ankle:0.1,crew:0.17,knee:0.26,over:0.32,tights:0.36}[d.len];
    const mat=clothMat(d.pat,s.c1,s.c2||s.c1);
    for(let i=0;i<2;i++){
      const cy=new THREE.Mesh(new THREE.CylinderGeometry(legR(0.342-len)+0.005,legR(0.342)+0.005,len,16,1,true),mat);cy.position.y=-0.342+len/2;this.sockG[i].add(cy);
      if(d.len==='tights'){const h=new THREE.Mesh(SPH(legR(0)+0.005,12,10),mat);h.position.y=0.01;this.sockG[i].add(h);}
    }
  }
  buildShoes(s){
    this.shoeG.forEach(clear);
    for(let i=0;i<2;i++){
      const F=new THREE.Group();F.position.y=-0.42;F.scale.setScalar(1.0);this.shoeG[i].add(F);
      const E=(r,x,y,z,sx,sy,sz,m)=>{const o=new THREE.Mesh(SPH(r,16,12),m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);F.add(o);return o;};
      const skinFoot=()=>E(0.09,0,0.065,0.04,1,0.75,1.45,this.skinMat);
      if(!s){skinFoot();continue;}
      const it=findItem('shoes',s.id),d=it.def.sh,m1=M(s.c1,{side:2}),m2=M(s.c2||s.c1,{side:2});
      const shaft=h=>{const c=new THREE.Mesh(new THREE.CylinderGeometry(0.088,0.098,h,18,1,true),m1);c.position.y=0.07+h/2;F.add(c);};
      const arch=(z,y,r,m)=>{const t=new THREE.Mesh(new THREE.TorusGeometry(r,0.016,6,16,PI),m);t.position.set(0,y,z);F.add(t);};
      switch(d){
        case 'sneaker':E(0.1,0,0.085,0.04,1.02,0.85,1.55,m1);E(0.1,0,0.03,0.045,1.06,0.3,1.6,m2);E(0.07,0,0.08,0.15,0.9,0.7,0.8,m2);break;
        case 'loafer':E(0.1,0,0.075,0.04,1,0.7,1.55,m1);E(0.1,0,0.025,0.045,1.03,0.25,1.58,m2);break;
        case 'boot':E(0.1,0,0.075,0.04,1,0.75,1.55,m1);E(0.1,0,0.025,0.045,1.04,0.25,1.58,m2);shaft(0.14);break;
        case 'tallboot':E(0.1,0,0.075,0.04,1,0.75,1.55,m1);E(0.1,0,0.025,0.045,1.04,0.25,1.58,m2);shaft(0.28);break;
        case 'rain':E(0.1,0,0.08,0.04,1.02,0.85,1.55,m1);E(0.1,0,0.03,0.045,1.06,0.3,1.6,m2);shaft(0.22);break;
        case 'highcut':E(0.1,0,0.085,0.04,1.02,0.85,1.55,m1);E(0.1,0,0.03,0.045,1.06,0.3,1.6,m2);E(0.07,0,0.08,0.15,0.9,0.7,0.8,m2);shaft(0.12);break;
        case 'sandal':skinFoot();E(0.1,0,0.02,0.04,1.05,0.2,1.55,m2);arch(0.0,0.03,0.09,m1);arch(0.12,0.03,0.085,m1);break;
        case 'geta':{skinFoot();
          const b=new THREE.Mesh(new THREE.BoxGeometry(0.2,0.025,0.36),m1);b.position.set(0,0.05,0.04);F.add(b);
          [-0.07,0.13].forEach(z=>{const t=new THREE.Mesh(new THREE.BoxGeometry(0.2,0.04,0.045),m1);t.position.set(0,0.02,z);F.add(t);});
          arch(0.12,0.06,0.075,m2);break;}
        case 'mary':E(0.1,0,0.075,0.04,1,0.7,1.55,m1);E(0.1,0,0.025,0.045,1.03,0.25,1.58,m2);arch(0.0,0.08,0.088,m2);E(0.02,0.0,0.17,0.0,1,1,1,m2);break;
        case 'slipper':skinFoot();E(0.1,0,0.055,0.06,1.05,0.5,1.45,m1);E(0.09,0,0.09,0.15,0.95,0.75,0.9,m1);E(0.1,0,0.02,0.05,1.06,0.2,1.5,m2);break;
      }
    }
  }

  /* ---------- 頭飾 ---------- */
  buildHat(h){
    const G=this.hatG;clear(G);this.hatAnim=null;if(!h)return;
    const m1=M(h.c1,{side:2}),m2=M(h.c2||h.c1,{side:2});
    const add=(g,m,x,y,z,sx,sy,sz)=>{const o=new THREE.Mesh(g,m);o.position.set(x||0,y||0,z||0);o.scale.set(sx||1,sy||1,sz||1);G.add(o);return o;};
    const dome=(r,th)=>new THREE.SphereGeometry(r,28,16,0,PI*2,0,th);
    const cyl=(rt,rb,hh,open)=>new THREE.CylinderGeometry(rt,rb,hh,28,1,!!open);
    const cone=(r,hh,s)=>new THREE.ConeGeometry(r,hh,s||12);
    switch(h.id){
      case 'cap':add(dome(0.58,1.22),m1);add(SPH(1,16,8),m2,0,0.2,0.55,0.36,0.035,0.3).rotation.x=0.12;add(SPH(0.04),m2,0,0.58,0);break;
      case 'beanie':add(dome(0.6,1.5),m1);add(cyl(0.615,0.615,0.16,true),m2,0,0.07,0);add(SPH(0.12,12,10),m2,0,0.6,0);break;
      case 'witch':add(dome(0.58,1.2),m1);add(cyl(0.85,0.85,0.03),m1,0,0.2,0);add(cone(0.36,0.85,24),m1,0,0.65,-0.04).rotation.x=-0.12;add(cyl(0.365,0.375,0.1,true),m2,0,0.27,0);break;
      case 'tophat':add(cyl(0.62,0.62,0.03),m1,0,0.22,0);add(cyl(0.38,0.4,0.55),m1,0,0.5,0);add(cyl(0.405,0.405,0.1,true),m2,0,0.33,0);break;
      case 'beret':add(SPH(0.6,24,12),m1,0.04,0.36,0,1.05,0.38,1.05).rotation.z=-0.1;add(SPH(0.04),m1,0.05,0.52,0);break;
      case 'straw':add(cyl(0.9,0.9,0.03),m1,0,0.24,0);add(dome(0.56,1.3),m1);add(cyl(0.57,0.58,0.1,true),m2,0,0.24,0);break;
      case 'bow':{const B=new THREE.Group();
        [-1,1].forEach(s=>{const c=new THREE.Mesh(cone(0.14,0.28),m1);c.rotation.z=s*PI/2;c.position.x=s*0.14;B.add(c);});
        B.add(new THREE.Mesh(SPH(0.06,10,8),m1));place(B,surf(0.56,0.85,0.75));B.rotateZ(0.4);G.add(B);break;}
      case 'flowers':{const cols=[h.c1,h.c2||'#fff','#f7d44a'];
        for(let i=0;i<10;i++){const ph=i/10*2*PI,p=surf(0.55,1.0,ph);
          const f=add(SPH(0.065,10,8),M(cols[i%3]),p.x,p.y,p.z,1,0.7,1);f.quaternion.setFromUnitVectors(V(0,1,0),p.clone().normalize());
          const q=surf(0.55,1.0,ph+PI/10);add(SPH(0.045,8,6),M('#3fae6a'),q.x,q.y,q.z,1,0.6,1.4);}break;}
      case 'cat':[-1,1].forEach(s=>{const p=surf(0.54,0.62,s*0.75),dir=p.clone().normalize().add(V(0,0.5,0));
        const e=new THREE.Mesh(cone(0.2,0.42,4),m1);e.position.copy(p).addScaledVector(dir.clone().normalize(),0.14);orient(e,dir);G.add(e);
        const n=new THREE.Mesh(cone(0.13,0.3,4),m2);n.position.copy(e.position).add(V(0,0,0.045)).addScaledVector(dir.clone().normalize(),-0.02);orient(n,dir);G.add(n);});break;
      case 'bunny':[-1,1].forEach(s=>{const g=new THREE.Group();g.position.copy(surf(0.5,0.55,s*0.4));g.rotation.z=-s*0.25;
        const e=new THREE.Mesh(SPH(0.1,12,12),m1);e.position.y=0.28;e.scale.set(0.55,2.8,0.28);g.add(e);
        const n=new THREE.Mesh(SPH(0.07,10,10),m2);n.position.set(0,0.28,0.025);n.scale.set(0.5,2.4,0.2);g.add(n);G.add(g);});break;
      case 'crown':add(cyl(0.34,0.36,0.2,true),m1,0,0.5,0);
        for(let i=0;i<5;i++){const a=i/5*2*PI;add(cone(0.07,0.2,6),m1,Math.sin(a)*0.35,0.7,Math.cos(a)*0.35);}
        add(SPH(0.04,8,6),m2,0,0.5,0.36);add(SPH(0.035,8,6),m2,0.3,0.5,0.19);add(SPH(0.035,8,6),m2,-0.3,0.5,0.19);break;
      case 'chef':add(cyl(0.36,0.34,0.18),m1,0,0.5,0);add(SPH(0.42,18,12),m1,0,0.8,0,1,0.75,1);break;
      case 'sailorcap':add(cyl(0.5,0.5,0.24),m1,0,0.47,0);add(cyl(0.6,0.5,0.05),m1,0,0.61,0);add(cyl(0.505,0.505,0.07,true),m2,0,0.38,0);break;
      case 'bandana':{const mt=clothMat('dots',h.c1,h.c2||'#fff');add(dome(0.58,1.25),mt);
        add(SPH(0.09,10,8),m1,0,0.2,-0.56);[-1,1].forEach(s=>{const c=add(cone(0.05,0.16,8),m1,s*0.08,0.12,-0.6);c.rotation.z=s*0.6;c.rotation.x=0.4;});break;}
      case 'helmet':add(dome(0.6,1.3),m1);add(SPH(0.06,10,8),m2,0,0.55,0,1,1,10);add(SPH(1,16,8),m2,0,0.25,0.55,0.3,0.03,0.2);break;
      case 'headband':{const t=add(new THREE.TorusGeometry(0.515,0.035,8,36),m1,0,0.24,0);t.rotation.x=PI/2;
        add(SPH(0.05,8,6),m2,0,0.24,0.54);break;}
      case 'bear':[-1,1].forEach(s=>{const p=surf(0.54,0.85,s*0.75);add(SPH(0.15,14,12),m1,p.x,p.y,p.z);const q=p.clone().add(p.clone().normalize().multiplyScalar(0.07));add(SPH(0.09,12,10),m2,q.x,q.y,q.z);});break;
      case 'horns':[-1,1].forEach(s=>{const p=surf(0.54,0.62,s*0.5),dir=p.clone().normalize().add(V(0,0.7,0));
        const e=new THREE.Mesh(cone(0.07,0.28,8),m1);e.position.copy(p).addScaledVector(dir.clone().normalize(),0.1);orient(e,dir);G.add(e);});break;
      case 'halo':{const mt=new THREE.MeshBasicMaterial({color:h.c1});const t=add(new THREE.TorusGeometry(0.3,0.035,10,36),mt,0,0.85,0);t.rotation.x=PI/2;
        this.hatAnim=(tm)=>{t.position.y=0.85+Math.sin(tm*2)*0.03;};break;}
      case 'cowboy':add(dome(0.58,1.25),m1);add(cyl(0.8,0.8,0.03),m1,0,0.22,0);add(SPH(0.4,16,8),m1,0,0.5,0,1,0.55,1);add(cyl(0.54,0.56,0.07,true),m2,0,0.3,0);
        [-1,1].forEach(s=>add(SPH(0.2,12,8),m1,s*0.75,0.3,0,0.4,0.15,1));break;
      case 'newsboy':add(SPH(1,24,14),m1,0,0.3,0,0.6,0.36,0.6);add(SPH(1,16,8),m1,0,0.2,0.52,0.34,0.04,0.26).rotation.x=0.12;add(SPH(0.04),m1,0,0.66,0);break;
      case 'bucket':add(cyl(0.5,0.6,0.34),m1,0,0.38,0);add(cyl(0.5,0.5,0.02),m1,0,0.55,0);add(new THREE.CylinderGeometry(0.62,0.92,0.1,28,1,true),m1,0,0.2,0);add(cyl(0.6,0.6,0.06,true),m2,0,0.3,0);break;
      case 'slouch':add(dome(0.6,1.5),m1);add(cone(0.52,0.7,24),m1,0,0.55,-0.1).rotation.x=-0.25;add(cyl(0.615,0.615,0.16,true),m2,0,0.07,0);break;
      case 'santa':{add(dome(0.58,1.2),m1);const t=add(new THREE.TorusGeometry(0.54,0.07,10,28),m2,0,0.21,0);t.rotation.x=PI/2;
        add(cone(0.4,0.7,20),m1,0,0.75,-0.1).rotation.x=-0.45;add(SPH(0.1,12,10),m2,0,1.065,-0.25);break;}
    }
  }

  /* ---------- 臉部配件 ---------- */
  buildFaceAcc(a){
    const G=this.faceG;clear(G);if(!a)return;
    const L=eyeLayout(this.cfg),eL=surf(0.5,L.th,-L.ph),eR=surf(0.5,L.th,L.ph);
    const m1=M(a.c1,{side:2}),m2=M(a.c2||a.c1,{side:2});
    const lens=M('#bfe6ff',{transparent:true,opacity:0.25,side:2});
    const eyes=[eL,eR];
    switch(a.id){
      case 'round':case 'square':case 'sun':
        eyes.forEach(p=>{
          const geo=a.id==='square'?new THREE.TorusGeometry(0.115,0.013,6,4):new THREE.TorusGeometry(0.1,0.013,8,24);
          const rg=new THREE.Mesh(geo,m1);rg.position.set(p.x,p.y,p.z+0.035);if(a.id==='square')rg.rotation.z=PI/4;G.add(rg);
          const ln=new THREE.Mesh(new THREE.CircleGeometry(a.id==='square'?0.085:0.1,a.id==='square'?4:20),a.id==='sun'?M('#1a1a22',{transparent:true,opacity:0.88,side:2}):lens);
          ln.position.set(p.x,p.y,p.z+0.034);if(a.id==='square')ln.rotation.z=PI/4;G.add(ln);
          const s=Math.sign(p.x);G.add(bar(V(p.x+s*0.1,p.y,p.z+0.03),V(s*0.5,p.y+0.005,0.03),0.01,m1));
        });
        G.add(bar(V(eL.x+0.1,eL.y,eL.z+0.04),V(eR.x-0.1,eR.y,eR.z+0.04),0.012,m1));break;
      case 'heart':
        eyes.forEach(p=>{
          const o=new THREE.Mesh(heartGeo(0.2),m1);o.position.set(p.x,p.y-0.01,p.z+0.038);G.add(o);
          const i=new THREE.Mesh(heartGeo(0.15),M('#ffffff',{transparent:true,opacity:0.55,side:2}));i.position.set(p.x,p.y-0.005,p.z+0.04);G.add(i);
          const s=Math.sign(p.x);G.add(bar(V(p.x+s*0.12,p.y,p.z+0.03),V(s*0.5,p.y+0.005,0.03),0.01,m1));
        });break;
      case 'patch':{
        const o=new THREE.Mesh(SPH(0.115,14,10),m1);o.position.set(eL.x,eL.y,eL.z+0.01);o.scale.z=0.35;G.add(o);
        const t=new THREE.Mesh(new THREE.TorusGeometry(0.507,0.012,6,36),m1);t.rotation.x=PI/2-0.35;t.position.y=0.06;G.add(t);break;}
      case 'mask':{
        const o=new THREE.Mesh(new THREE.SphereGeometry(0.517,24,12,PI/2-0.8,1.6,2.0,0.65),m1);G.add(o);
        [-1,1].forEach(s=>{const p=surf(0.515,2.0,s*0.8);G.add(bar(p,V(s*0.5,-0.03,0.0),0.008,m1));});break;}
      case 'clown':{const p=surf(0.5,1.9+FACES[this.cfg.face].ey*0.6,0);const o=new THREE.Mesh(SPH(0.065,12,10),m1);o.position.set(0,p.y,p.z+0.045);G.add(o);break;}
      case 'whisker':[-1,1].forEach(s=>{for(let i=0;i<3;i++){const p0=surf(0.51,2.0,s*0.6);G.add(bar(p0,p0.clone().add(V(s*0.22,(i-1)*0.07,-0.02)),0.006,m1));}});break;
      case 'mustache':[-1,1].forEach(s=>{const p=surf(0.51,2.0+FACES[this.cfg.face].ey*0.6,s*0.15);const o=new THREE.Mesh(SPH(0.08,12,8),m1);o.position.copy(p);o.scale.set(1.3,0.45,0.5);o.rotation.z=-s*0.35;G.add(o);});break;
    }
  }

  /* ---------- 背飾 ---------- */
  buildBack(b){
    const G=this.backG;clear(G);this.backAnim=null;if(!b)return;
    const m1=M(b.c1,{side:2}),m2=M(b.c2||b.c1,{side:2});
    const E=(r,x,y,z,sx,sy,sz,m,P)=>{const o=new THREE.Mesh(SPH(r,16,12),m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);(P||G).add(o);return o;};
    const sx=this.torsoG.scale.x;
    const zf=(y,x)=>0.9*Math.sqrt(Math.max(0,Math.pow(torsoR(y)+0.024,2)-Math.pow(x/sx,2)));
    switch(b.id){
      case 'pack':
        E(1,0,0.58,-0.27,0.17,0.22,0.11,m1);E(1,0,0.46,-0.34,0.13,0.08,0.07,m2);E(1,0,0.72,-0.27,0.15,0.07,0.09,m2);
        [-1,1].forEach(s=>G.add(bar(V(s*0.13,0.72,zf(0.72,0.13)),V(s*0.12,0.46,zf(0.46,0.12)),0.018,m2)));break;
      case 'satchel':
        E(1,-0.19,0.4,zf(0.4,0.19)+0.06,0.14,0.11,0.07,m1);E(1,-0.19,0.46,zf(0.4,0.19)+0.1,0.14,0.05,0.04,m2);
        for(let i=0;i<=12;i++){const t=i/12,x=0.14-0.31*t,y=0.74-0.3*t;E(0.02,x,y,zf(y,x)+0.005,1,1,1,m2);}break;
      case 'cape':{
        const c=new THREE.Mesh(new THREE.CylinderGeometry(0.27,0.42,0.85,20,1,true,PI-1.25,2.5),m1);c.position.set(0,0.45,-0.02);G.add(c);
        [-1,1].forEach(s=>E(0.025,s*0.2,0.64,0.1,1,1,1,m2));
        this.backAnim=(t,mv)=>{c.rotation.x=mv?0.14+Math.sin(t*10)*0.06:0.03;c.position.y=0.45;};break;}
      case 'angel':case 'butterfly':case 'devil':{
        const wings=[];
        [-1,1].forEach(s=>{
          const W=new THREE.Group();W.position.set(s*0.1,0.62,-0.17);W.rotation.y=s*0.5;
          if(b.id==='angel'){for(let i=0;i<5;i++){const th=0.8-0.35*i;const o=E(0.1,s*Math.cos(th)*0.2,Math.sin(th)*0.2,-0.005*i,2.2,0.55,0.25,m1,W);o.rotation.z=s*th;}}
          else if(b.id==='butterfly'){
            E(0.3,s*0.28,0.16,0,1.1,0.9,0.08,m1,W).rotation.z=s*0.5;E(0.2,s*0.2,-0.15,0,1.0,0.9,0.08,m2,W).rotation.z=-s*0.3;
            E(0.07,s*0.32,0.2,0.01,1,1,0.3,m2,W);E(0.05,s*0.2,-0.17,0.01,1,1,0.3,m1,W);}
          else{E(0.3,s*0.3,0.1,0,1.2,0.8,0.05,m1,W).rotation.z=s*0.2;
            W.add(bar(V(0,0,0),V(s*0.58,0.32,0),0.014,m2));W.add(bar(V(s*0.2,0.1,0),V(s*0.45,-0.12,0),0.01,m2));W.add(bar(V(s*0.35,0.2,0),V(s*0.6,-0.02,0),0.01,m2));}
          G.add(W);wings.push([W,s]);
        });
        this.backAnim=(t,mv)=>wings.forEach(w=>{w[0].rotation.y=w[1]*(0.5+Math.sin(t*(mv?9:3))*(mv?0.2:0.1));});break;}
      case 'cattail':{
        const T=new THREE.Group();T.position.set(0,0.36,-0.17);
        for(let i=0;i<8;i++)E(0.045,0,0.012*i*i,-0.05-0.055*i,1,1,1,i===7?m2:m1,T);
        G.add(T);this.backAnim=(t,mv)=>{T.rotation.y=Math.sin(t*(mv?8:2.5))*(mv?0.3:0.2);};break;}
      case 'foxtail':{
        const T=new THREE.Group();T.position.set(0,0.38,-0.18);const S=new THREE.Group();S.rotation.x=0.5;T.add(S);
        E(0.13,0,0,-0.2,1,1,2.3,m1,S);E(0.1,0,0,-0.45,1,1,1.5,m2,S);G.add(T);
        this.backAnim=(t,mv)=>{T.rotation.y=Math.sin(t*(mv?7:2))*(mv?0.25:0.15);};break;}
      case 'shell':{
        const d=new THREE.Mesh(new THREE.SphereGeometry(0.34,22,12,0,PI*2,0,PI/2),m1);d.rotation.x=-PI/2;d.position.set(0,0.6,-0.16);d.scale.set(1,1,0.9);G.add(d);
        const r=new THREE.Mesh(new THREE.TorusGeometry(0.34,0.025,6,24),m2);r.position.set(0,0.6,-0.16);G.add(r);break;}
    }
  }

  /* ---------- 動畫 ---------- */
  setPose(p){this.poseName=p||null;}
  setSleep(b){this.sleep=!!b;this.redrawFace(!!b);}
  tick(dt,t,mv,emote,et){
    this.setExpr({punchR:'grit',punchL:'grit',upper:'shout',charge:'grit',windup:'grit',hurt:'hurt',dizzy:'hurt',fly:'shout',gaiaThrow:'shout',ult:'shout'}[emote]||null);
    const pn=this.poseName;if(pn)mv=0;
    if(this.hands)this.hands.forEach(h=>h.scale.set(1,1.1,0.88));
    this.phase+=dt*(11+7*(this.runK||0))*mv;
    const sw=Math.sin(this.phase)*(0.8+0.45*(this.runK||0))*mv;
    this.legs[0].rotation.x=sw;this.legs[1].rotation.x=-sw;
    this.arms[0].rotation.x=-sw*0.8;this.arms[1].rotation.x=sw*0.8;
    this.arms[0].rotation.z=-0.17-Math.sin(t*2)*0.025;this.arms[1].rotation.z=0.17+Math.sin(t*2)*0.025;
    let by=Math.abs(Math.sin(this.phase))*0.05*mv*(1+1.4*(this.runK||0)),bz=0,hz=0,lean=0.24*(this.runK||0)*mv,twist=0;
    if(emote==='wave'){this.arms[1].rotation.x=0;this.arms[1].rotation.z=2.5+Math.sin(et*12)*0.3;hz=0.05;}
    else if(emote==='dance'){
      by=Math.abs(Math.sin(et*7))*0.12;bz=Math.sin(et*3.5)*0.12;hz=Math.sin(et*3.5)*0.15;
      this.arms[0].rotation.x=this.arms[1].rotation.x=0;
      this.arms[0].rotation.z=-(1.9+Math.sin(et*7)*0.6);this.arms[1].rotation.z=1.9+Math.sin(et*7+PI)*0.6;
      this.legs[0].rotation.x=Math.sin(et*7)*0.4;this.legs[1].rotation.x=-Math.sin(et*7)*0.4;
    }else if(emote==='poke'){this.arms[1].rotation.x=-1.5;this.arms[1].rotation.z=0.12;}
    else if(emote==='peace'){this.arms[1].rotation.x=0;this.arms[1].rotation.z=2.4+Math.sin(et*8)*0.1;hz=0.15;}
    else if(emote==='punchR'||emote==='punchL'){
      const k=Math.min(1,et/0.3),i=emote==='punchR'?1:0,s=i?1:-1,eo=x=>1-Math.pow(1-x,3),ei=x=>x*x;
      let arm,tw,ln,lg,ex;
      if(k<0.25){const p=k/0.25;arm=0.9*p;tw=s*0.35*p;ln=-0.06*p;lg=0;ex=0;}
      else if(k<0.5){const p=eo((k-0.25)/0.25);arm=0.9-2.65*p;tw=s*(0.35-0.85*p);ln=-0.06+0.36*p;lg=p;ex=p;}
      else{const q=ei((k-0.5)/0.5);arm=-1.75*(1-q);tw=-s*0.5*(1-q);ln=0.3*(1-q);lg=1-q;ex=1-q;}
      this.arms[i].rotation.x=arm;this.arms[i].rotation.z=s*(0.05+0.1*ex);
      this.arms[1-i].rotation.x=-1.0*(1-ex)+0.7*ex;this.arms[1-i].rotation.z=-s*0.15;
      this.legs[i].rotation.x=-0.7*lg;this.legs[1-i].rotation.x=0.5*lg;
      if(this.hands)this.hands[i].scale.multiplyScalar(1+0.6*ex);
      lean=ln;twist=tw;hz=-s*0.1*ex;
    }else if(emote==='upper'){
      const k=Math.min(1,et/0.45),eo=x=>1-Math.pow(1-x,3),ei=x=>x*x;
      let arm,tw,ln,jy,ex;
      if(k<0.3){const p=k/0.3;arm=0.8*p;tw=0.35*p;ln=0.28*p;jy=-0.15*p;ex=0;}
      else if(k<0.6){const p=eo((k-0.3)/0.3);arm=0.8-3.9*p;tw=0.35-0.8*p;ln=0.28-0.5*p;jy=-0.15+0.5*p;ex=p;}
      else{const q=ei((k-0.6)/0.4);arm=-3.1*(1-q);tw=-0.45*(1-q);ln=-0.22*(1-q);jy=0.35*(1-q);ex=1-q;}
      this.arms[1].rotation.x=arm;this.arms[1].rotation.z=0.12;
      this.arms[0].rotation.x=-0.8*(1-ex)+0.9*ex;this.arms[0].rotation.z=-0.2;
      this.legs[1].rotation.x=-0.5*ex;this.legs[0].rotation.x=0.6*ex;
      if(this.hands)this.hands[1].scale.multiplyScalar(1+0.7*ex);
      lean=ln;twist=tw;by=jy;
    }else if(emote==='charge'){
      this.arms[0].rotation.z=-1.0;this.arms[1].rotation.z=1.0;this.arms[0].rotation.x=this.arms[1].rotation.x=0.5;
      by=-0.04+Math.sin(et*45)*0.012;lean=0.2;this.legs[0].rotation.x=0.35;this.legs[1].rotation.x=-0.35;
    }else if(emote==='hurt'){
      lean=-0.32;this.arms[0].rotation.x=this.arms[1].rotation.x=0.7;this.arms[0].rotation.z=-0.5;this.arms[1].rotation.z=0.5;hz=0.2;
    }else if(emote==='ult'){
      this.arms[0].rotation.z=-2.7;this.arms[1].rotation.z=2.7;this.arms[0].rotation.x=this.arms[1].rotation.x=0;by=0.12;
    }else if(emote==='gaiaThrow'){
      const k=Math.min(1,et/0.35),e=1-Math.pow(1-k,3);
      this.arms[0].rotation.x=this.arms[1].rotation.x=-3.0+2.2*e;this.arms[0].rotation.z=-0.2;this.arms[1].rotation.z=0.2;
      lean=0.1+0.35*e;by=-0.05*e;this.legs[0].rotation.x=-0.5*e;this.legs[1].rotation.x=0.4*e;
    }else if(emote==='dizzy'){
      bz=Math.sin(et*14)*0.2;lean=0.1+Math.sin(et*9)*0.12;twist=Math.sin(et*7)*0.3;hz=Math.sin(et*11)*0.28;
      this.arms[0].rotation.z=-0.6+Math.sin(et*12)*0.25;this.arms[1].rotation.z=0.6-Math.sin(et*12)*0.25;this.arms[0].rotation.x=this.arms[1].rotation.x=Math.sin(et*10)*0.3;
      this.legs[0].rotation.x=Math.sin(et*14)*0.25;this.legs[1].rotation.x=-Math.sin(et*14)*0.25;
    }else if(emote==='fly'){
      this.arms[0].rotation.x=this.arms[1].rotation.x=-3.05;this.arms[0].rotation.z=-0.08;this.arms[1].rotation.z=0.08;this.legs[0].rotation.x=0.05;this.legs[1].rotation.x=-0.05;
    }else if(emote==='spinatk'){
      this.arms[0].rotation.z=-1.55;this.arms[1].rotation.z=1.55;this.arms[0].rotation.x=this.arms[1].rotation.x=0;lean=0.12;this.legs[0].rotation.x=0.4;this.legs[1].rotation.x=-0.4;
    }else if(emote==='windup'){
      this.arms[1].rotation.x=0.9;this.arms[1].rotation.z=0.3;lean=-0.15;
    }
    else if(emote==='spin'){this.arms[0].rotation.z=-1.2;this.arms[1].rotation.z=1.2;by=Math.sin(et*PI/0.9)*0.2;}
    if(pn==='sit'||pn==='work'){
      this.legs[0].rotation.x=this.legs[1].rotation.x=-1.45;by=0;
      this.arms[0].rotation.x=pn==='work'?-1.2+Math.sin(t*13)*0.07:-0.7;this.arms[1].rotation.x=pn==='work'?-1.2+Math.sin(t*13+2)*0.07:-0.7;
    }else if(pn==='lie'){this.legs[0].rotation.x=this.legs[1].rotation.x=0;this.arms[0].rotation.x=this.arms[1].rotation.x=0;by=0;}
    else if(pn==='bath'){this.arms[0].rotation.z=-1.0;this.arms[1].rotation.z=1.0;this.arms[0].rotation.x=this.arms[1].rotation.x=-0.3+Math.sin(t*2)*0.05;by=Math.sin(t*2)*0.01;}
    else if(pn==='wash'){this.arms[0].rotation.x=-1.15+Math.sin(t*10)*0.12;this.arms[1].rotation.x=-1.15-Math.sin(t*10)*0.12;this.arms[0].rotation.z=-0.1;this.arms[1].rotation.z=0.1;this.legs[0].rotation.x=this.legs[1].rotation.x=0;by=0;}
    else if(pn==='jump'){const q=Math.sin(t*11)*0.3;this.arms[0].rotation.z=-(2.2+q);this.arms[1].rotation.z=2.2+q;this.arms[0].rotation.x=this.arms[1].rotation.x=0;this.legs[0].rotation.x=-0.4;this.legs[1].rotation.x=0.2;by=0;}
    this.body.rotation.x=pn==='lie'?-PI/2:lean;this.body.rotation.y=twist;
    this.body.position.y=by;this.body.rotation.z=bz;this.headPos.rotation.z=hz;
    this.body.scale.y=1+Math.sin(t*2.2)*0.012;
    if(this.backAnim)this.backAnim(t,mv>0.3);
    if(this.hatAnim)this.hatAnim(t);
    if(dt>0&&this.cfg&&!this.sleep){
      this.blinkT-=dt;
      if(this.blinkT<=0){
        if(!this.blinking){this.blinking=true;this.redrawFace(true);this.blinkT=0.13;}
        else{this.blinking=false;this.redrawFace(false);this.blinkT=2+Math.random()*3;}
      }
    }
  }
}
