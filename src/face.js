'use strict';
/* ===== 臉部貼圖（畫在貼合頭部球面的 canvas 上）— 動森風：大眼睛、白眼球、睫毛、橘色小鼻子 ===== */
const FW=640,FH=452,FS=376,FTH0=1.1,FPH=1.7;
const fx=p=>FW/2+p*FS, fy=t=>(t-FTH0)*FS;
function rgb(hex){const n=parseInt(hex.slice(1),16);return [n>>16,(n>>8)&255,n&255];}
function shade(hex,k){
  let [r,g,b]=rgb(hex);
  if(k<0){r*=1+k;g*=1+k;b*=1+k;}else{r+=(255-r)*k;g+=(255-g)*k;b+=(255-b)*k;}
  return 'rgb('+(r|0)+','+(g|0)+','+(b|0)+')';
}
function tint(h1,h2,t){const a=rgb(h1),b=rgb(h2);return 'rgb('+a.map((v,i)=>(v+(b[i]-v)*t)|0).join(',')+')';}
const INK='#2a2224';
const EYE_SC=[2.6,2.4,2.0,2.3,2.3,2.6,2.1,2.2];
function eyeLayout(cfg){const F=FACES[cfg.face];return {th:1.74+F.ey+(cfg.featY||0),ph:0.30*F.es};}

function drawEye(g,sh,x,y,s,col,blink,fem){
  const w=20,h=27;
  const ell=(cx,cy,rx,ry,c)=>{g.fillStyle=c;g.beginPath();g.ellipse(cx,cy,rx,ry,0,0,7);g.fill();};
  const hl=(cx,cy,r)=>{g.fillStyle='#fff';g.beginPath();g.arc(cx,cy,r,0,7);g.fill();};
  const lashes=()=>{ if(!fem)return;g.strokeStyle=INK;g.lineWidth=4.5;
    g.beginPath();g.moveTo(x+s*w*0.92,y-h*0.42);g.lineTo(x+s*(w+13),y-h*0.62);g.stroke();
    g.beginPath();g.moveTo(x+s*w*0.72,y-h*0.78);g.lineTo(x+s*(w+6),y-h*1.08);g.stroke();};
  g.lineCap='round';g.lineJoin='round';
  if(blink&&sh!==6){g.strokeStyle=INK;g.lineWidth=6;g.beginPath();g.arc(x,y-6,w*0.95,0.15*Math.PI,0.85*Math.PI);g.stroke();
    if(fem){g.beginPath();g.moveTo(x+s*w*0.9,y+2);g.lineTo(x+s*(w+11),y-4);g.stroke();}return;}
  switch(sh){
    case 0:case 1:{
      const ww=sh===1?w*0.86:w,hh=sh===1?h*1.2:h;
      ell(x,y,ww,hh,'#fffdf8');
      g.save();g.beginPath();g.ellipse(x,y,ww,hh,0,0,7);g.clip();
      ell(x,y+4,ww*0.84,hh*0.9,col);
      ell(x,y+5,ww*0.5,hh*0.56,INK);
      g.restore();
      hl(x-ww*0.3,y-hh*0.35,ww*0.3);hl(x+ww*0.32,y+hh*0.4,ww*0.15);
      g.strokeStyle=INK;g.lineWidth=5.5;g.beginPath();g.ellipse(x,y,ww,hh,0,Math.PI*1.02,Math.PI*1.98);g.stroke();
      g.strokeStyle='rgba(70,50,50,.45)';g.lineWidth=2;g.beginPath();g.ellipse(x,y,ww,hh,0,0,Math.PI);g.stroke();
      lashes();break;}
    case 2:ell(x,y,w*0.72,h*0.72,INK);hl(x-5,y-6,5);if(fem){g.strokeStyle=INK;g.lineWidth=3.5;g.beginPath();g.moveTo(x+s*w*0.6,y-h*0.4);g.lineTo(x+s*(w+4),y-h*0.6);g.stroke();}break;
    case 3:
      g.fillStyle='#fffdf8';g.beginPath();g.ellipse(x,y-4,w*1.1,h*.85,0,0,Math.PI);g.closePath();g.fill();
      g.fillStyle=col;g.beginPath();g.ellipse(x,y-2,w*.8,h*.62,0,0,Math.PI);g.closePath();g.fill();
      g.fillStyle=INK;g.beginPath();g.ellipse(x,y,w*.45,h*.36,0,0,Math.PI);g.closePath();g.fill();
      g.strokeStyle=INK;g.lineWidth=7;g.beginPath();g.moveTo(x-w*1.2,y-4);g.lineTo(x+w*1.2,y-4);g.stroke();
      hl(x-5,y+4,4.5);lashes();break;
    case 4:case 7:{
      const k=sh===7?0.75:1;
      const ix=x-s*w*1.1,iy=y+h*.35,ox=x+s*w*1.4,oy=y-h*.45;
      g.save();g.beginPath();g.moveTo(ix,iy);g.quadraticCurveTo(x,y-h*1.2*k,ox,oy);g.quadraticCurveTo(x+s*w*.2,y+h*.95*k,ix,iy);g.closePath();
      g.fillStyle='#fffdf8';g.fill();g.clip();
      ell(x+s*2,y+3,w*.75,h*.72*k+4,col);ell(x+s*2,y+4,w*.45,h*.5*k+3,INK);hl(x-5,y-6,5.5);
      g.restore();
      g.strokeStyle=INK;g.lineWidth=5;g.beginPath();g.moveTo(ix,iy);g.quadraticCurveTo(x,y-h*1.2*k,ox,oy);g.stroke();
      g.beginPath();g.moveTo(ox,oy);g.lineTo(ox+s*12,oy-10);g.stroke();
      break;}
    case 5:ell(x,y,w*1.1,h*1.12,INK);ell(x,y+2,w*0.95,h*.98,col);ell(x,y+5,w*.55,h*.6,INK);hl(x-7,y-10,8);hl(x+8,y+10,4);hl(x+9,y-4,2.5);lashes();break;
    case 6:g.strokeStyle=INK;g.lineWidth=7;g.beginPath();g.arc(x,y+8,w*.95,1.15*Math.PI,1.85*Math.PI);g.stroke();
      if(fem){g.lineWidth=4.5;g.beginPath();g.moveTo(x+s*w*.85,y-h*.05);g.lineTo(x+s*(w+10),y-h*.3);g.stroke();}break;
  }
}
function drawBrow(g,sh,x,y,s,col){
  g.strokeStyle=col;g.fillStyle=col;g.lineCap='round';
  const L=34,ln=(a,b,c,d,w)=>{g.lineWidth=w;g.beginPath();g.moveTo(a,b);g.lineTo(c,d);g.stroke();};
  switch(sh){
    case 0:ln(x-L,y,x+L,y,7);break;
    case 1:g.lineWidth=6.5;g.beginPath();g.moveTo(x-L,y+5);g.quadraticCurveTo(x,y-12,x+L,y+5);g.stroke();break;
    case 2:ln(x-26,y,x+26,y,13);break;
    case 3:g.lineWidth=4.5;g.beginPath();g.moveTo(x-L*1.25,y+6);g.quadraticCurveTo(x,y-14,x+L*1.25,y+4);g.stroke();break;
    case 4:ln(x-s*L,y+7,x+s*L,y-9,7);break;
    case 5:ln(x-s*L,y-8,x+s*L,y+8,7);break;
    case 6:g.beginPath();g.arc(x,y,7,0,7);g.fill();break;
    case 7:ln(x-s*L*.6,y+4,x+s*L*.7,y-5,9);break;
  }
}
// 動森的鼻子：中間一個橘色小水滴
function drawNose(g,sh,x,y,c){
  g.strokeStyle=c;g.fillStyle=c;g.lineCap='round';g.lineJoin='round';
  switch(sh){
    case 0:g.beginPath();g.moveTo(x,y-14);g.bezierCurveTo(x+11,y-2,x+9,y+10,x,y+10);g.bezierCurveTo(x-9,y+10,x-11,y-2,x,y-14);g.fill();break;
    case 1:g.lineWidth=5;g.beginPath();g.moveTo(x-3,y-12);g.quadraticCurveTo(x-3,y+4,x+8,y+5);g.stroke();break;
    case 2:g.lineWidth=5;g.beginPath();g.moveTo(x-8,y+4);g.lineTo(x,y-7);g.lineTo(x+8,y+4);g.closePath();g.stroke();break;
    case 3:g.beginPath();g.ellipse(x,y,11,8,0,0,7);g.fill();break;
    case 4:g.beginPath();g.arc(x-9,y,4.5,0,7);g.arc(x+9,y,4.5,0,7);g.fill();break;
    case 5:g.lineWidth=5;g.beginPath();g.arc(x,y-4,8,0.2*Math.PI,0.8*Math.PI);g.stroke();break;
  }
}
function drawMouth(g,sh,x,y,lip){
  g.strokeStyle=lip;g.fillStyle=lip;g.lineCap='round';g.lineJoin='round';
  const dark='#6a2a30';
  switch(sh){
    case 0:g.lineWidth=6;g.beginPath();g.moveTo(x-26,y-4);g.quadraticCurveTo(x,y+18,x+26,y-4);g.stroke();break;
    case 1:g.fillStyle=dark;g.beginPath();g.ellipse(x,y+4,9,12,0,0,7);g.fill();g.strokeStyle=lip;g.lineWidth=4;g.stroke();break;
    case 2:case 6:{
      g.beginPath();g.moveTo(x-32,y-8);g.quadraticCurveTo(x,y-2,x+32,y-8);g.quadraticCurveTo(x+27,y+30,x,y+30);g.quadraticCurveTo(x-27,y+30,x-32,y-8);g.closePath();
      g.fillStyle=sh===6?'#fff':dark;g.fill();g.lineWidth=5;g.strokeStyle=lip;g.stroke();
      if(sh===2){g.save();g.clip();g.fillStyle='#f08a8a';g.beginPath();g.ellipse(x,y+30,16,12,0,0,7);g.fill();g.restore();}
      else{g.strokeStyle='#ccc';g.lineWidth=2;g.beginPath();g.moveTo(x-27,y+8);g.lineTo(x+27,y+8);g.stroke();}
      break;}
    case 3:g.lineWidth=6;g.beginPath();g.moveTo(x-20,y);g.lineTo(x+20,y);g.stroke();break;
    case 4:g.lineWidth=5.5;g.beginPath();g.arc(x-13,y,13,0.05*Math.PI,0.95*Math.PI);g.stroke();g.beginPath();g.arc(x+13,y,13,0.05*Math.PI,0.95*Math.PI);g.stroke();break;
    case 5:g.beginPath();g.ellipse(x,y+3,12,7.5,0,0,7);g.fill();break;
    case 7:g.lineWidth=6;g.beginPath();g.moveTo(x-22,y+6);g.quadraticCurveTo(x+4,y+10,x+27,y-8);g.stroke();break;
  }
}
const FRECK=[[-.34,1.97],[-.44,2.03],[-.56,2.0],[-.4,2.11],[-.5,2.09],[-.62,2.07],[-.3,2.06],[-.46,1.94],[-.58,1.94],[-.36,2.16],[-.54,2.15],[-.66,2.0]];

function drawFace(cv,cfg,blink,expr){
  const g=cv.getContext('2d');g.clearRect(0,0,FW,FH);
  const F=FACES[cfg.face],skin=SKIN[cfg.skin],fem=cfg.sex==='f';
  const L=eyeLayout(cfg),eT=L.th,eP=L.ph,fS=cfg.featS||1,dY=cfg.featY||0;
  const hairC=HAIRCOL[cfg.hairCol],browC=cfg.browCol<0?hairC:HAIRCOL[cfg.browCol];
  if(cfg.cheek>0){
    [-1,1].forEach(s=>{
      const cx=fx(s*0.56),cy=fy(2.0+F.ey*0.5+dY*0.8);
      if(cfg.cheek===1){const gr=g.createRadialGradient(cx,cy,2,cx,cy,52);gr.addColorStop(0,'rgba(255,105,125,.55)');gr.addColorStop(1,'rgba(255,105,125,0)');g.fillStyle=gr;g.fillRect(cx-60,cy-60,120,120);}
      else if(cfg.cheek===2){g.fillStyle='rgba(240,80,100,.5)';g.beginPath();g.ellipse(cx,cy,30,21,0,0,7);g.fill();}
      else{g.strokeStyle='rgba(235,70,90,.65)';g.lineWidth=5;g.lineCap='round';for(let i=0;i<3;i++){g.beginPath();g.moveTo(cx-18+i*14,cy+11);g.lineTo(cx-9+i*14,cy-10);g.stroke();}}
    });
  }
  if(cfg.freckle>0){
    g.fillStyle=shade(skin,-0.3);
    const n=cfg.freckle===1?5:12;
    [-1,1].forEach(s=>{for(let i=0;i<n;i++){const p=FRECK[i];g.beginPath();g.arc(fx(s*-p[0]),fy(p[1]+F.ey*0.5),3.6,0,7);g.fill();}});
  }
  let bOv=null,mOv=null;
  if(expr==='grit'){bOv='angry';mOv=6;}
  else if(expr==='shout'){bOv='angry';mOv=2;}
  else if(expr==='hurt'){bOv=5;mOv=7;blink=true;}
  const sc=(x,y,k,fn)=>{g.save();g.translate(x,y);g.scale(k,k);g.translate(-x,-y);fn();g.restore();};
  [-1,1].forEach(s=>{
    const ex=fx(s*eP),ey=fy(eT),k=EYE_SC[cfg.eye]*fS;
    sc(ex,ey,k,()=>drawEye(g,cfg.eye,ex,ey,s,EYECOL[cfg.eyeCol],blink,fem));
    const by=ey-95*fS;
    if(bOv==='angry'){sc(ex,by,1.25*fS,()=>{g.strokeStyle=browC;g.lineCap='round';g.lineWidth=9;g.beginPath();g.moveTo(ex-s*36,by-12);g.lineTo(ex+s*18,by+8);g.stroke();});}
    else sc(ex,by,1.25*fS,()=>drawBrow(g,bOv!==null?bOv:cfg.brow,ex,by,s,browC));
  });
  const ny=fy(1.9+F.ey*0.6+dY),my=fy(2.09+F.ey*0.6+dY);
  sc(FW/2,ny,1.35*fS,()=>drawNose(g,cfg.nose,FW/2,ny,tint(skin,'#e0703c',0.55)));
  sc(FW/2,my,1.15*fS,()=>drawMouth(g,mOv!==null?mOv:cfg.mouth,FW/2,my,LIPCOL[cfg.lipCol]));
}
