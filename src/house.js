'use strict';
/* ===== 整間屋子：更衣室 + 客廳 + 房間 + 廁所（全程式生成） ===== */
function buildHouse(){
  const R=buildRoom(),G=R.group,boxes=R.boxes;
  const mm=(c,o)=>LAMB(Object.assign({color:c},o||{}));
  const MT=c=>typeof c==='string'?mm(c):c;
  const box=(w,h,d,c,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),MT(c));o.position.set(x,y,z);G.add(o);return o;};
  const cyl=(rt,rb,h,c,x,y,z,seg)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg||20),MT(c));o.position.set(x,y,z);G.add(o);return o;};
  const sph=(r,c,x,y,z,sx,sy,sz)=>{const o=new THREE.Mesh(new THREE.SphereGeometry(r,16,12),MT(c));o.position.set(x,y,z);o.scale.set(sx||1,sy||1,sz||1);G.add(o);return o;};
  const plane=(w,h,m,x,y,z,ry)=>{const o=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m);o.position.set(x,y,z);o.rotation.y=ry||0;G.add(o);return o;};
  const aabb=(x0,x1,z0,z1)=>boxes.push({x0,x1,z0,z1});
  const rnd=i=>{const s=Math.sin(i*127.1+311.7)*43758.5453;return s-Math.floor(s);};

  /* ---- 外殼 ---- */
  function shell(cx,w,floorTex,wallTex,o){
    const fm=LAMB({map:floorTex}),wm=LAMB({map:wallTex});
    plane(w,10,fm,cx,0,-1,0).rotation.set(-PI/2,0,0);
    plane(w,4.2,wm,cx,2.1,-6,0);
    const side=(x,ry,door)=>{
      if(door){plane(8,4.2,wm,x,2.1,-2,ry);plane(1.9,1.2,wm,x,3.6,2.95,ry);}
      else plane(10,4.2,wm,x,2.1,-1,ry);
    };
    if(o.west)side(o.west.x,PI/2,o.west.door);
    if(o.east)side(o.east.x,-PI/2,o.east.door);
    box(w,0.3,0.12,'#fff4e6',cx,0.15,-5.95);box(w,0.12,0.14,o.trim||'#f6b9c8',cx,4.15,-5.94);
    if(o.west){const l=o.west.door?8:10;box(0.12,0.3,l,'#fff4e6',o.west.x+0.05,0.15,o.west.door?-2:-1);}
    if(o.east){const l=o.east.door?8:10;box(0.12,0.3,l,'#fff4e6',o.east.x-0.05,0.15,o.east.door?-2:-1);}
  }
  function doorFrame(x){
    [2.0,3.9].forEach(z=>box(0.32,3.05,0.18,'#b5865a',x,1.52,z));
    box(0.32,0.2,2.1,'#b5865a',x,3.05,2.95);
  }
  const wood=(c1,c2,rep)=>canvasTex(512,512,(g,w,h)=>{g.fillStyle=c1;g.fillRect(0,0,w,h);
    for(let i=0;i<8;i++){g.fillStyle=i%2?'rgba(255,255,255,.10)':c2;g.fillRect(0,i*64,w,64);g.fillStyle='rgba(90,50,20,.3)';g.fillRect(0,i*64,w,2);}
    for(let i=0;i<14;i++){g.fillStyle='rgba(90,50,20,.22)';g.fillRect(((i*97)%512),((i*3)%8)*64,2,64);}},rep);
  const paper=(bg,fg,kind,rep)=>canvasTex(256,256,(g,w,h)=>{g.fillStyle=bg;g.fillRect(0,0,w,h);g.fillStyle=fg;
    if(kind==='stripe'){for(let i=0;i<4;i++)g.fillRect(i*64+22,0,20,h);}
    else if(kind==='star'){for(let y=0;y<4;y++)for(let x=0;x<4;x++){const cx=x*64+(y%2)*32+16,cy=y*64+32;starPath(g,cx,cy,9);}}
    else if(kind==='tile'){g.fillRect(0,0,w,h);g.strokeStyle='rgba(120,170,180,.55)';g.lineWidth=3;for(let i=0;i<=8;i++){g.beginPath();g.moveTo(i*32,0);g.lineTo(i*32,h);g.stroke();g.beginPath();g.moveTo(0,i*32);g.lineTo(w,i*32);g.stroke();}}
    },rep);

  /* ================= 客廳 x:-18 ~ -6 ================= */
  shell(-12,12,wood('#dcb88c','rgba(120,70,20,.07)',[6,5]),paper('#fdf0d5','rgba(255,255,255,.6)','stripe',[3,1]),{west:{x:-17.98,door:true},east:{x:-6.02,door:true},trim:'#f7c59f'});
  doorFrame(-6);doorFrame(-18);
  // 沙發
  const sofaC='#7cc6b5',sofaL='#9bd9ca';
  box(4.4,0.55,1.5,sofaC,-12,0.375,-5.0);box(4.4,1.15,0.4,sofaC,-12,1.1,-5.75);
  [-1.45,0,1.45].forEach(x=>{box(1.35,0.28,1.25,sofaL,-12+x,0.78,-4.95);box(1.3,0.8,0.28,sofaL,-12+x,1.2,-5.45).rotation.x=-0.12;});
  [-1,1].forEach(s=>box(0.4,0.85,1.5,sofaC,-12+s*2.2,0.65,-5.0));
  sph(0.3,'#f48fb1',-13.3,1.0,-4.9,1,1,0.55).rotation.z=0.3;sph(0.3,'#f7d44a',-10.7,1.0,-4.9,1,1,0.55).rotation.z=-0.3;
  aabb(-14.4,-9.6,-6,-4.2);
  // 咖啡桌
  cyl(0.95,0.95,0.1,'#e0b88a',-12,0.62,-2.4,32);[[-0.55,-0.3],[0.55,-0.3],[-0.55,0.35],[0.55,0.35]].forEach(p=>cyl(0.06,0.06,0.6,'#c99a6b',-12+p[0],0.3,-2.4+p[1]));
  cyl(0.16,0.14,0.2,'#fafafa',-12.3,0.77,-2.5);cyl(0.16,0.14,0.2,'#f48fb1',-11.6,0.77,-2.2);box(0.5,0.06,0.7,'#6bb6f2',-12.0,0.70,-2.0);
  aabb(-13.05,-10.95,-3.45,-1.35);
  // 地毯
  box(6.4,0.02,4.8,'#f6c9b3',-12,0.012,-2.8);box(5.6,0.024,4.0,'#fff3e6',-12,0.014,-2.8);box(4.8,0.028,3.2,'#f6c9b3',-12,0.016,-2.8);
  // 電視櫃 + 電視（西牆）
  box(0.8,0.7,3.0,'#c99a6b',-17.55,0.35,-1.5);box(0.14,1.5,2.5,'#2b2b30',-17.75,1.6,-1.5);box(0.1,0.2,0.8,'#2b2b30',-17.7,0.85,-1.5);
  const tvT=canvasTex(256,128,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'#ffd1e8');gr.addColorStop(1,'#bfe8ff');g.fillStyle=gr;g.fillRect(0,0,w,h);
    g.fillStyle='#fff';[[50,40,22],[80,46,26],[190,90,20],[215,92,24]].forEach(c=>{g.beginPath();g.arc(c[0],c[1],c[2],0,7);g.fill();});
    g.fillStyle='#f7d44a';starPath(g,190,36,18);g.fillStyle='#8fd694';g.fillRect(0,108,w,20);});
  plane(2.3,1.3,new THREE.MeshBasicMaterial({map:tvT}),-17.66,1.6,-1.5,PI/2);
  aabb(-18,-17.1,-3.2,0.2);
  // 扶手椅
  box(1.3,0.5,1.3,'#f4b183',-8.2,0.4,-1.2);box(0.3,1.0,1.3,'#f4b183',-7.6,1.0,-1.2);box(1.1,0.2,1.1,'#f8c9a2',-8.3,0.75,-1.2);aabb(-8.9,-7.4,-1.9,-0.5);
  // 書櫃
  box(2.2,3.2,0.1,'#c99a6b',-7.4,1.6,-5.9);[-1,1].forEach(s=>box(0.08,3.2,0.7,'#c99a6b',-7.4+s*1.1,1.6,-5.55));
  [0.05,0.95,1.85,2.75,3.2].forEach(y=>box(2.2,0.08,0.7,'#d4a574',-7.4,y,-5.55));
  const bc=['#e8505b','#f7d44a','#6bb6f2','#9bd45a','#8e5bc9','#f59a3c','#f48fb1','#3bb3c9'];
  [0.09,0.99,1.89,2.79].forEach((y,r)=>{let x=-8.4;for(let i=0;i<7&&x<-6.5;i++){const w=0.14+rnd(r*9+i)*0.1,hh=0.5+rnd(r*5+i+3)*0.3;box(w,hh,0.4,bc[(r*3+i)%8],x+w/2,y+hh/2,-5.55);x+=w+0.04;}});
  aabb(-8.6,-6.2,-6,-5.1);
  // 大盆栽 + 落地燈
  cyl(0.4,0.3,0.6,'#d98a5a',-17.3,0.3,-5.2);for(let i=0;i<8;i++){const a=i/8*2*PI,l=sph(0.28,'#3fae6a',-17.3+Math.sin(a)*0.3,1.1+(i%3)*0.25,-5.2+Math.cos(a)*0.3,0.8,1.8,0.6);l.rotation.z=Math.sin(a)*0.5;l.rotation.x=Math.cos(a)*0.5;}
  aabb(-17.8,-16.8,-5.7,-4.7);
  cyl(0.03,0.03,2.4,'#8a8a92',-14.9,1.2,-5.4);cyl(0.22,0.22,0.06,'#8a8a92',-14.9,0.03,-5.4);
  const ls=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.4,0.55,16,1,true),new THREE.MeshBasicMaterial({color:'#ffe9a8',side:2}));ls.position.set(-14.9,2.55,-5.4);G.add(ls);aabb(-15.2,-14.6,-5.7,-5.1);
  // 窗戶 + 窗簾 + 掛畫
  const sky=canvasTex(128,128,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#8fd3f4');gr.addColorStop(1,'#e0f6ff');g.fillStyle=gr;g.fillRect(0,0,w,h);g.fillStyle='rgba(255,255,255,.9)';[[30,40,16],[50,44,20],[96,86,16]].forEach(c=>{g.beginPath();g.arc(c[0],c[1],c[2],0,7);g.fill();});});
  box(2.3,2.1,0.1,'#fff',-16.5,2.7,-5.95);plane(2.0,1.8,new THREE.MeshBasicMaterial({map:sky}),-16.5,2.7,-5.88,0);box(0.07,1.8,0.08,'#fff',-16.5,2.7,-5.85);box(2.0,0.07,0.08,'#fff',-16.5,2.7,-5.85);
  const curL=[-1,1].map(s=>({m:box(0.6,2.4,0.15,'#f4a6c0',-16.5+s*1.4,2.6,-5.8),s,cx:-16.5}));
  [['#f48fb1',-13.2],['#f7d44a',-12],['#6bb6f2',-10.8]].forEach(p=>{box(0.95,1.2,0.06,'#fff',p[1],3.0,-5.96);plane(0.75,1.0,new THREE.MeshBasicMaterial({color:p[0]}),p[1],3.0,-5.92,0);});

  /* ================= 房間（臥室） x:6 ~ 18 ================= */
  shell(12,12,wood('#d6bdee','rgba(120,80,170,.14)',[6,5]),paper('#e9dcf7','#ffffff','star',[3,1]),{west:{x:6.02,door:true},east:{x:17.98,door:true},trim:'#c9b3ef'});
  doorFrame(6);doorFrame(18);
  // 床
  box(3.9,1.8,0.2,'#f2a8c0',12,1.4,-5.88);box(3.6,0.5,4.4,'#d98aa8',12,0.45,-3.8);box(3.3,0.4,4.2,'#fff5f8',12,0.85,-3.8);
  const blT=canvasTex(128,128,(g,w,h)=>{g.fillStyle='#bfe3ff';g.fillRect(0,0,w,h);g.fillStyle='#fff';for(let i=0;i<4;i++)g.fillRect(0,i*32+8,w,12);},[1,1]);
  box(3.4,0.14,2.9,LAMB({map:blT}),12,1.1,-2.85);
  [-1,1].forEach(s=>box(1.3,0.3,0.75,'#ffffff',12+s*0.95,1.13,-5.2));
  sph(0.42,'#b9792f',12,1.4,-4.2);sph(0.3,'#b9792f',12,1.9,-4.2);[-1,1].forEach(s=>sph(0.12,'#b9792f',12+s*0.22,2.15,-4.2));sph(0.1,'#2b2b30',11.9,1.92,-3.93);sph(0.1,'#2b2b30',12.1,1.92,-3.93);
  aabb(10.1,13.9,-6,-1.5);
  // 床頭櫃 + 檯燈
  const lampBmats=[];
  [9.4,14.6].forEach(x=>{box(0.9,0.9,0.9,'#f7d7a8',x,0.45,-5.45);box(0.4,0.04,0.4,'#e0b88a',x,0.92,-5.45);cyl(0.06,0.1,0.4,'#c99a6b',x,1.12,-5.45);
    const sh=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.3,0.35,14,1,true),new THREE.MeshBasicMaterial({color:'#ffe0e8',side:2}));sh.position.set(x,1.5,-5.45);G.add(sh);lampBmats.push(sh.material);aabb(x-0.5,x+0.5,-6,-4.95);});
  // 書桌與椅子（東牆）
  box(1.4,0.1,3.0,'#f0dcb4',17.2,1.1,-3.8);[[-0.6,-1.3],[-0.6,1.3],[0.6,-1.3],[0.6,1.3]].forEach(p=>cyl(0.05,0.05,1.1,'#c99a6b',17.2+p[0],0.55,-3.8+p[1]));
  box(0.5,0.03,0.7,'#d8d8dc',17.1,1.17,-3.8);box(0.03,0.45,0.68,'#2b2b30',17.34,1.4,-3.8).rotation.z=0.2;
  cyl(0.1,0.1,0.18,'#f48fb1',17.3,1.24,-2.8);cyl(0.1,0.1,0.18,'#6bb6f2',17.2,1.24,-4.7);
  box(0.8,0.12,0.8,'#8e5bc9',15.8,0.7,-3.8);box(0.1,0.9,0.8,'#8e5bc9',15.4,1.15,-3.8);cyl(0.05,0.05,0.65,'#8a8a92',15.8,0.33,-3.8);
  aabb(16.4,18,-5.4,-2.2);aabb(15.2,16.3,-4.3,-3.3);
  // 玩偶櫃（西牆）
  box(0.9,2.5,2.9,'#f7d7a8',6.5,1.25,-3.8);[0.6,1.3,2.0].forEach(y=>box(0.95,0.06,2.9,'#e0b88a',6.5,y,-3.8));
  const pc=['#f48fb1','#6bb6f2','#f7d44a','#9bd45a','#8e5bc9','#f59a3c'];
  [0.68,1.38,2.08].forEach((y,r)=>{for(let i=0;i<3;i++){sph(0.2,pc[(r*3+i)%6],6.65,y+0.2,-4.9+i*0.95);sph(0.13,pc[(r*3+i+2)%6],6.65,y+0.5,-4.9+i*0.95);}});
  aabb(6,7.05,-5.3,-2.3);
  // 懶骨頭 + 圓地毯
  sph(0.85,'#6bb6f2',8.5,0.5,0.2,1,0.7,1);aabb(7.6,9.4,-0.7,1.1);
  cyl(2.7,2.7,0.02,'#f6b9d6',12,0.012,0.2,48);cyl(2.2,2.2,0.024,'#fff5fa',12,0.014,0.2,48);cyl(1.7,1.7,0.028,'#f6b9d6',12,0.016,0.2,48);
  // 窗 + 窗簾 + 海報 + 燈串
  box(2.3,2.1,0.1,'#fff',16.4,2.7,-5.95);plane(2.0,1.8,new THREE.MeshBasicMaterial({map:sky}),16.4,2.7,-5.88,0);box(0.07,1.8,0.08,'#fff',16.4,2.7,-5.85);box(2.0,0.07,0.08,'#fff',16.4,2.7,-5.85);
  const curB=[-1,1].map(s=>({m:box(0.6,2.4,0.15,'#fbe6a2',16.4+s*1.4,2.6,-5.8),s,cx:16.4}));
  [['#f48fb1',7.9],['#9bd45a',9.2]].forEach(p=>{box(0.9,1.3,0.05,'#fff',p[1],2.9,-5.96);plane(0.72,1.1,new THREE.MeshBasicMaterial({color:p[0]}),p[1],2.9,-5.92,0);});
  for(let i=0;i<=16;i++){const tt=i/16;sph(0.06,['#f7d44a','#f48fb1','#6bb6f2','#fff'][i%4],6.6+10.8*tt,3.7-Math.sin(tt*PI)*0.4,-5.9);}

  /* ================= 廁所 x:18 ~ 28 ================= */
  shell(23,10,paper('#ffffff','#cfeee6','tile',[5,5]),paper('#d4eef2','#ffffff','tile',[5,2]),{west:{x:18.02,door:true},east:{x:27.98,door:true},trim:'#9fd8f0'});doorFrame(28);
  // 浴缸（膠囊形，白色，水面 + 泡泡 + 小黃鴨）
  const tubG=new THREE.CapsuleGeometry(0.78,2.1,8,20);tubG.rotateZ(PI/2);
  const tub=new THREE.Mesh(tubG,mm('#ffffff'));tub.position.set(23,0.55,-5.0);tub.scale.set(1,0.62,1);G.add(tub);
  const wG=new THREE.CapsuleGeometry(0.64,2.0,8,20);wG.rotateZ(PI/2);
  const water=new THREE.Mesh(wG,mm('#9fd8f0',{transparent:true,opacity:0.9}));water.position.set(23,0.9,-5.0);water.scale.set(1,0.05,1);G.add(water);
  box(3.6,0.1,0.1,'#cfd8dc',23,0.3,-4.2);
  for(let i=0;i<16;i++){const x=21.8+rnd(i)*2.4,z=-5.0+(rnd(i+20)-0.5)*0.9,r=0.1+rnd(i+40)*0.12;sph(r,'#ffffff',x,0.95+r*0.4,z,1,0.8,1);}
  const duck=new THREE.Group();duck.position.set(22.5,1.0,-4.9);G.add(duck);
  const dm=mm('#f7d44a'),dsp=(r,m,x,y,z,sx,sy,sz)=>{const o=new THREE.Mesh(new THREE.SphereGeometry(r,14,10),m);o.position.set(x,y,z);o.scale.set(sx||1,sy||1,sz||1);duck.add(o);};
  dsp(0.2,dm,0,0.08,0,1,0.9,1.1);dsp(0.13,dm,-0.05,0.28,0.12);dsp(0.06,mm('#f59a3c'),-0.05,0.26,0.25,1,0.6,1.5);dsp(0.025,mm('#2b2b30'),-0.1,0.31,0.2);dsp(0.025,mm('#2b2b30'),0,0.31,0.2);
  // 水龍頭 + 蓮蓬頭
  cyl(0.05,0.05,0.5,'#cfd8dc',23,1.2,-5.85);const sp=cyl(0.04,0.04,0.45,'#cfd8dc',23,1.45,-5.65);sp.rotation.x=PI/2;cyl(0.08,0.08,0.08,'#e8505b',22.7,1.2,-5.85);cyl(0.08,0.08,0.08,'#6bb6f2',23.3,1.2,-5.85);
  cyl(0.04,0.04,1.2,'#cfd8dc',24.8,2.4,-5.88);cyl(0.2,0.12,0.1,'#cfd8dc',24.8,3.05,-5.7);
  aabb(21.2,24.8,-6,-4.2);
  // 馬桶
  box(0.85,0.95,0.45,'#ffffff',26.9,0.85,-5.75);cyl(0.1,0.1,0.06,'#cfd8dc',26.9,1.35,-5.7);
  const bowl=cyl(0.38,0.3,0.5,'#ffffff',26.9,0.3,-5.0);bowl.scale.z=1.35;
  const seat=new THREE.Mesh(new THREE.TorusGeometry(0.31,0.06,8,20),mm('#f4f4f4'));seat.rotation.x=PI/2;seat.position.set(26.9,0.56,-5.0);seat.scale.set(1,1.3,1);G.add(seat);
  cyl(0.31,0.31,0.05,'#fff0f5',26.9,1.12,-5.5,20).rotation.x=0;
  aabb(26.4,27.5,-6,-4.3);
  // 洗衣機
  const wbody=box(1.2,1.3,1.2,'#ffffff',27.3,0.65,-3.5);const dr=cyl(0.4,0.4,0.06,'#9fd8f0',26.7,0.75,-3.5);dr.rotation.z=PI/2;cyl(0.5,0.5,0.04,'#cfd8dc',26.68,0.75,-3.5).rotation.z=PI/2;
  const wsp=new THREE.Group();wsp.position.set(26.66,0.75,-3.5);G.add(wsp);[0,PI/2].forEach(a=>{const b=new THREE.Mesh(new THREE.BoxGeometry(0.02,0.7,0.07),mm('#ffffff'));b.rotation.x=a;wsp.add(b);});sph(0.06,'#f48fb1',26.7,1.15,-3.0);sph(0.06,'#6bb6f2',26.7,1.15,-3.2);
  aabb(26.6,28,-4.15,-2.85);
  // 洗手台 + 鏡子
  cyl(0.2,0.26,0.85,'#ffffff',27.3,0.42,-1.5);const ba=sph(0.48,'#ffffff',27.2,0.95,-1.5,1,0.4,1.3);cyl(0.04,0.04,0.3,'#cfd8dc',27.6,1.2,-1.5);
  const mT=canvasTex(128,160,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'#eaf7ff');gr.addColorStop(1,'#b9dcf0');g.fillStyle=gr;g.fillRect(0,0,w,h);g.fillStyle='rgba(255,255,255,.6)';g.beginPath();g.moveTo(20,0);g.lineTo(55,0);g.lineTo(5,70);g.lineTo(0,70);g.fill();});
  box(0.08,1.7,1.3,'#9fd8f0',27.94,2.2,-1.5);plane(1.15,1.55,new THREE.MeshBasicMaterial({map:mT}),27.88,2.2,-1.5,-PI/2);
  aabb(26.7,28,-2.5,-0.6);
  // 毛巾架、置物架、洗衣籃、腳踏墊、植物
  cyl(0.04,0.04,2.2,'#cfd8dc',19.8,2.3,-5.85).rotation.z=PI/2;
  [['#f48fb1',-0.5],['#6bb6f2',0.1],['#f7d44a',0.7]].forEach(p=>box(0.45,0.9,0.06,p[0],19.8+p[1],1.8,-5.8));
  box(1.6,0.06,0.4,'#d4a574',22,2.2,-5.8);sph(0.1,'#f48fb1',21.5,2.35,-5.8);cyl(0.1,0.1,0.3,'#9fd8f0',22.1,2.4,-5.8);cyl(0.08,0.08,0.25,'#f7d44a',22.5,2.37,-5.8);
  cyl(0.45,0.38,0.8,'#f0dcb4',19.3,0.4,-4.6);cyl(0.46,0.46,0.06,'#d4a574',19.3,0.82,-4.6);aabb(18.8,19.8,-5.1,-4.1);
  box(1.9,0.03,1.1,'#f48fb1',23,0.02,-3.3);box(1.5,0.035,0.8,'#fff',23,0.025,-3.3);
  cyl(0.28,0.22,0.4,'#d98a5a',19.4,0.2,-2.6);for(let i=0;i<6;i++){const a=i/6*2*PI,l=sph(0.15,'#3fae6a',19.4+Math.sin(a)*0.18,0.7+(i%2)*0.15,-2.6+Math.cos(a)*0.18,0.8,1.8,0.6);l.rotation.z=Math.sin(a)*0.5;l.rotation.x=Math.cos(a)*0.5;}
  aabb(19,19.8,-3,-2.2);
  // 小窗
  box(1.6,1.3,0.1,'#fff',20.6,3.0,-5.95);plane(1.4,1.1,new THREE.MeshBasicMaterial({map:sky}),20.6,3.0,-5.88,0);


  /* ================= 廚房 x:28 ~ 38 ================= */
  shell(33,10,wood('#f3ddba','rgba(160,110,50,.08)',[6,5]),paper('#e2f3ea','rgba(255,255,255,.65)','stripe',[3,1]),{west:{x:28.02,door:true},east:{x:37.98,door:true},trim:'#ffd9a0'});doorFrame(38);
  // 流理台（北牆）：薄荷綠櫃身 + 木紋檯面
  box(5.4,0.92,1.0,'#bfe3d2',31.6,0.46,-5.45);box(5.6,0.1,1.12,'#e0b88a',31.6,0.97,-5.42);
  for(let i=0;i<4;i++){box(1.1,0.62,0.05,'#a9d6c2',29.6+i*1.32,0.42,-4.92);sph(0.05,'#e8c99a',29.6+i*1.32,0.42,-4.88);}
  aabb(28.8,34.4,-6,-4.85);
  // 水槽 + 水龍頭
  box(0.9,0.08,0.6,'#d8e8e0',30.1,0.99,-5.4);cyl(0.05,0.05,0.4,'#b8c4c0',30.4,1.2,-5.65);const kfc=cyl(0.04,0.04,0.3,'#b8c4c0',30.3,1.38,-5.55);kfc.rotation.z=PI/2.4;
  // 瓦斯爐 + 湯鍋 + 火焰 + 蒸氣
  box(1.5,0.06,0.9,'#4a4a52',33,1.01,-5.4);
  cyl(0.22,0.22,0.05,'#2b2b30',32.6,1.06,-5.4);cyl(0.22,0.22,0.05,'#2b2b30',33.4,1.06,-5.4);
  const stFlames=[];for(let i=0;i<5;i++){const f=new THREE.Mesh(new THREE.ConeGeometry(0.06,0.16,6),new THREE.MeshBasicMaterial({color:i%2?0xffa64a:0x6bb6f2}));f.position.set(32.6+Math.cos(i/5*PI*2)*0.12,1.12,-5.4+Math.sin(i/5*PI*2)*0.12);f.visible=false;G.add(f);stFlames.push(f);}
  cyl(0.3,0.28,0.3,'#e8505b',32.6,1.25,-5.4);cyl(0.31,0.31,0.05,'#fff4e6',32.6,1.42,-5.4);sph(0.05,'#5a4244',32.6,1.47,-5.4);
  [-1,1].forEach(s=>{const hd=cyl(0.03,0.03,0.16,'#5a4244',32.6+s*0.32,1.3,-5.4);hd.rotation.z=PI/2;});
  const stSteam=[];for(let i=0;i<3;i++){const sm=sph(0.08,'#ffffff',32.6,1.6,-5.4);sm.material=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0});G.add(sm);stSteam.push(sm);}
  // 抽油煙機
  box(1.6,0.5,0.8,'#d8d8dc',33,3.0,-5.55);box(0.5,1.0,0.5,'#d8d8dc',33,3.75,-5.7);
  // 冰箱（門可開）
  box(1.35,2.5,1.1,'#fdfdfd',36.6,1.25,-5.3);box(1.35,0.06,1.1,'#d8e8e0',36.6,1.72,-5.3);
  box(1.15,0.9,0.1,'#3a3a40',36.6,1.1,-4.78);
  [[0.6,'#f7d44a'],[0.9,'#9bd45a'],[1.2,'#f48fb1'],[1.5,'#6bb6f2']].forEach(p=>{box(1.0,0.05,0.5,'#e8f4ee',36.6,p[0],-5.05);sph(0.09,p[1],36.4,p[0]+0.12,-5.0);sph(0.09,'#e8505b',36.8,p[0]+0.12,-5.1);});
  const frDoor=new THREE.Group();frDoor.position.set(35.93,1.25,-4.74);G.add(frDoor);
  const frP=new THREE.Mesh(new THREE.BoxGeometry(1.35,2.42,0.12),mm('#f4fbf8'));frP.position.x=0.67;frDoor.add(frP);
  const frH=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,0.8,8),mm('#b8c4c0'));frH.position.set(1.2,0.3,0.1);frDoor.add(frH);
  aabb(35.9,37.3,-6,-4.6);
  // 餐桌 + 蛋糕 + 茶壺 + 兩張小凳
  cyl(1.3,1.3,0.03,'#ffe3c2',31.5,0.018,0.8,40);
  cyl(0.78,0.78,0.08,'#e0b88a',31.5,0.72,0.8,28);cyl(0.07,0.07,0.7,'#c99a6b',31.5,0.36,0.8);cyl(0.3,0.3,0.04,'#c99a6b',31.5,0.03,0.8);
  cyl(0.3,0.3,0.03,'#ffffff',31.5,0.78,0.6,24);cyl(0.24,0.26,0.14,'#f7d7a8',31.5,0.86,0.6,24);cyl(0.25,0.25,0.04,'#fff0f5',31.5,0.95,0.6,24);sph(0.06,'#e8505b',31.5,1.0,0.6);
  sph(0.11,'#9fd8f0',31.8,0.84,1.1);cyl(0.03,0.05,0.1,'#9fd8f0',31.95,0.86,1.03);sph(0.04,'#5a4244',31.8,0.95,1.1);
  [[30.4,'#f48fb1'],[32.6,'#9bd45a']].forEach(p=>{cyl(0.34,0.34,0.4,p[1],p[0],0.2,0.8);cyl(0.36,0.36,0.06,'#fff',p[0],0.43,0.8);});
  aabb(30.9,32.1,0.2,1.4);
  // 牆上層架（罐子）+ 吊鍋 + 窗
  box(1.8,0.06,0.4,'#e0b88a',30.0,2.3,-5.75);
  [['#f48fb1',29.4],['#f7d44a',29.9],['#9bd45a',30.4],['#9fd8f0',30.8]].forEach(p=>{cyl(0.12,0.12,0.3,p[0],p[1],2.47,-5.75);cyl(0.13,0.13,0.05,'#e0b88a',p[1],2.64,-5.75);});
  cyl(0.03,0.03,2.0,'#8a8a92',35.2,2.9,-5.8).rotation.z=PI/2;
  [[34.6,'#e8505b'],[35.3,'#8a8a92'],[35.9,'#e0b88a']].forEach(p=>{const pan=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.22,0.06,16),mm(p[1]));pan.position.set(p[0],2.5,-5.8);G.add(pan);cyl(0.02,0.02,0.34,'#5a4244',p[0],2.72,-5.8);});
  box(1.9,1.6,0.1,'#fff',35.0,2.9,-5.95);plane(1.7,1.4,new THREE.MeshBasicMaterial({map:canvasTex(128,128,(g,w,hh)=>{const gr=g.createLinearGradient(0,0,0,hh);gr.addColorStop(0,'#8fd3f4');gr.addColorStop(1,'#e0f6ff');g.fillStyle=gr;g.fillRect(0,0,w,hh);g.fillStyle='rgba(255,255,255,.9)';g.beginPath();g.arc(40,46,18,0,7);g.arc(66,42,22,0,7);g.fill();})}),35.0,2.9,-5.88,0);
  box(0.06,1.4,0.08,'#fff',35.0,2.9,-5.85);box(1.7,0.06,0.08,'#fff',35.0,2.9,-5.85);
  [-1,1].forEach(s=>box(0.5,1.8,0.12,'#ffd9a0',35.0+s*1.15,2.8,-5.8));
  // 盆栽
  cyl(0.28,0.22,0.4,'#d98a5a',28.9,0.2,2.9);for(let i=0;i<6;i++){const a2=i/6*PI*2,l=sph(0.15,'#3fae6a',28.9+Math.sin(a2)*0.18,0.68+(i%2)*0.14,2.9+Math.cos(a2)*0.18);l.scale.set(0.8,1.7,0.6);l.rotation.z=Math.sin(a2)*0.5;}
  aabb(28.5,29.3,2.5,3.3);


  /* ================= 後院公園 x:38 ~ 58 ================= */
  const petals=[],canopy=[];let foamT,foamM,buoyG,ballG,hotBall,shakeT=0,bv=null;
  {
    const grassT=canvasTex(256,256,(g,w,hh)=>{g.fillStyle='#9ed47f';g.fillRect(0,0,w,hh);
      for(let i=0;i<240;i++){g.fillStyle=['#8cc96d','#aede8f','#96d077'][i%3];g.fillRect((i*97)%w,(i*57)%hh,3,7);}
      g.fillStyle='rgba(255,255,255,.2)';for(let i=0;i<12;i++){g.beginPath();g.arc((i*83)%w,(i*131)%hh,2.2,0,7);g.fill();}},[8,6]);
    const pg=plane(20.4,17,LAMB({map:grassT}),48,0,0,0);pg.rotation.set(-PI/2,0,0);pg.position.set(48,-0.012,1);pg.receiveShadow=true;
    // 廚房外牆（公園側）
    const sid=LAMB({color:'#f6e7c8'});
    plane(8,4.2,sid,38.04,2.1,-2,PI/2);plane(1.9,1.2,sid,38.04,3.6,2.95,PI/2);
    // 石板小路：門口到沙灘口，彎向櫻花樹
    for(let i=0;i<=15;i++){const t2=i/15,px=38.8+18.4*t2,pz=2.75-2.3*Math.sin(t2*PI)+((i%2)?0.18:-0.18);
      cyl(0.52,0.52,0.035,'#ece0cc',px,0.02,pz,10);}
    // 巨大櫻花樹
    cyl(0.55,0.8,3.4,'#8a6248',47.5,1.7,-2.4,12);
    const br1=cyl(0.22,0.3,2.2,'#8a6248',46.4,3.6,-2.1,8);br1.rotation.z=0.7;
    const br2=cyl(0.2,0.28,2.0,'#8a6248',48.5,3.7,-2.7,8);br2.rotation.z=-0.65;br2.rotation.x=0.3;
    [[47.5,5.6,-2.4,2.6],[45.3,4.9,-1.8,1.9],[49.6,5.0,-2.9,1.9],[46.6,6.3,-3.2,1.7],[48.6,6.2,-1.5,1.7],[47.4,4.6,-0.8,1.6],[47.6,4.7,-4.0,1.6],[44.2,4.2,-2.8,1.3],[50.6,4.1,-2.0,1.3]].forEach((p,i)=>{
      const b2=sph(p[3],['#ffc9d8','#ffbcd0','#ffd7e4'][i%3],p[0],p[1],p[2]);b2.userData.bx=p[0];b2.userData.by=p[1];b2.userData.bz=p[2];canopy.push(b2);});
    sph(0.5,'#8a6248',47.0,0.15,-2.0,1.6,0.4,1.2);sph(0.4,'#8a6248',48.1,0.1,-2.8,1.4,0.35,1);
    aabb(46.4,48.6,-3.4,-1.4);
    // 飄落的花瓣
    for(let i=0;i<34;i++){
      const m=new THREE.Mesh(new THREE.PlaneGeometry(0.17,0.12),new THREE.MeshBasicMaterial({color:['#ffc9d8','#ffb9cf','#ffe0ea'][i%3],side:2,transparent:true,opacity:0.95}));
      const px2=47.5+(Math.random()-0.5)*8,pz2=-2.4+(Math.random()-0.5)*6,py2=Math.random()*6+1;m.position.set(px2,py2,pz2);G.add(m);petals.push({m,x:px2,z:pz2,y:py2,ph:Math.random()*9,sp:Math.random()*0.5});
    }
    // 花園花圃 ×2（圓石邊框 + 花）
    const fl=(x,z,c)=>{cyl(0.025,0.03,0.3,'#4aa86a',x,0.15,z,6);sph(0.07,'#ffd24a',x,0.34,z);
      for(let k=0;k<5;k++){const an=k/5*PI*2;sph(0.065,c,x+Math.cos(an)*0.095,0.34,z+Math.sin(an)*0.095);}};
    [[42.2,0.2],[53.6,0.2]].forEach((bp,bi)=>{
      for(let k=0;k<14;k++){const an=k/14*PI*2;sph(0.17,'#c9b8a0',bp[0]+Math.cos(an)*1.7,0.1,bp[1]+Math.sin(an)*1.15);}
      const cols=bi?['#f48fb1','#ffd24a','#ff8a66','#b89aec']:['#ff6a88','#ffb9cf','#ffd24a','#8ab4f8'];
      for(let r=0;r<2;r++)for(let k2=0;k2<4;k2++)fl(bp[0]-1.05+k2*0.7,bp[1]-0.4+r*0.8,cols[(r*4+k2)%4]);
      aabb(bp[0]-1.9,bp[0]+1.9,bp[1]-1.4,bp[1]+1.4);
    });
    // 長椅 ×2、公園燈
    [[44.5,2.0,0.5],[51.0,2.0,-0.5]].forEach(b=>{
      box(1.7,0.09,0.55,'#c99a6b',b[0],0.48,b[1]);box(1.7,0.5,0.09,'#c99a6b',b[0],0.82,b[1]-0.3);
      [-0.7,0.7].forEach(d=>box(0.09,0.46,0.5,'#8a6248',b[0]+d,0.23,b[1]));
      aabb(b[0]-0.95,b[0]+0.95,b[1]-0.45,b[1]+0.45);
    });
    [[40.5,-3.5],[56.0,-3.5]].forEach(p=>{cyl(0.07,0.1,2.6,'#6a7a6e',p[0],1.3,p[1],8);
      const gl=sph(0.26,'#fff2b8',p[0],2.75,p[1]);gl.material=new THREE.MeshBasicMaterial({color:0xfff2b8});
      aabb(p[0]-0.3,p[0]+0.3,p[1]-0.3,p[1]+0.3);});
    // 北側圓灌木籬
    for(let x=38.8;x<57.4;x+=1.1)sph(0.62,(x*7|0)%2?'#7cc26a':'#8ed47e',x,0.4,-5.6,1,0.85,1);
    // 東側樹籬（往沙灘的門留缺口）
    for(let z=-5.0;z<1.8;z+=0.95)sph(0.55,'#7cc26a',58,0.38,z,1,0.8,1);
    aabb(57.6,58.4,-5.3,1.95);
    doorFrame(58);
  }
  /* ================= 沙灘 x:58 ~ 74 ================= */
  {
    const sandT=canvasTex(256,256,(g,w,hh)=>{g.fillStyle='#f7e3b2';g.fillRect(0,0,w,hh);
      for(let i=0;i<300;i++){g.fillStyle=i%3?'rgba(200,160,90,.25)':'rgba(255,255,255,.3)';g.fillRect((i*89)%w,(i*53)%hh,2,2);}},[6,5]);
    const sd=plane(16.6,13,LAMB({map:sandT}),66.2,0,0,0);sd.rotation.set(-PI/2,0,0);sd.position.set(66.2,-0.012,2.8);sd.receiveShadow=true;
    const oceanT=canvasTex(128,256,(g,w,hh)=>{const gr=g.createLinearGradient(0,0,0,hh);gr.addColorStop(0,'#3e9edb');gr.addColorStop(0.55,'#58b8e8');gr.addColorStop(1,'#9fdcf0');g.fillStyle=gr;g.fillRect(0,0,w,hh);
      g.fillStyle='rgba(255,255,255,.25)';for(let i=0;i<9;i++)g.fillRect(0,(i*31)%hh,w,2);});
    const oc=plane(16.6,5.4,new THREE.MeshBasicMaterial({map:oceanT}),66.2,0,0,0);oc.rotation.set(-PI/2,0,0);oc.position.set(66.2,-0.02,-4.4);
    foamT=canvasTex(256,64,(g,w,hh)=>{g.clearRect(0,0,w,hh);g.fillStyle='#ffffff';g.beginPath();g.moveTo(0,hh);
      for(let x=0;x<=w;x+=8)g.lineTo(x,22+Math.sin(x*0.11)*9+Math.sin(x*0.31)*4);g.lineTo(w,hh);g.closePath();g.fill();},[3,1]);
    foamM=plane(16.6,1.3,new THREE.MeshBasicMaterial({map:foamT,transparent:true,opacity:0.9}),66.2,0,0,0);
    foamM.rotation.set(-PI/2,0,PI);foamM.position.set(66.2,0.01,-1.7);
    // 椰子樹 ×2（彎曲樹幹 + 圓葉）
    [[60.6,1.3,1],[71.6,-0.4,-1]].forEach(pp=>{
      let bx=pp[0],by=0.35;
      for(let i=0;i<6;i++){const seg=cyl(0.155-i*0.012,0.2-i*0.012,0.8,'#a0764e',bx,by,pp[1],10);seg.rotation.z=pp[2]*(0.06+i*0.045);bx+=pp[2]*(0.09+i*0.05);by+=0.56;}
      const tx=bx+pp[2]*0.15,ty=by+0.2;
      for(let k=0;k<7;k++){const an=k/7*PI*2,lf=sph(0.95,k%2?'#5cae6a':'#6cc27a',tx+Math.cos(an)*0.95,ty+0.1,pp[1]+Math.sin(an)*0.75);lf.scale.set(1.25,0.18,0.55);lf.rotation.y=-an;lf.rotation.z=0.25*pp[2];}
      sph(0.14,'#8a6248',tx-0.15,ty-0.15,pp[1]+0.1);sph(0.14,'#8a6248',tx+0.12,ty-0.18,pp[1]-0.12);
      aabb(pp[0]-0.45,pp[0]+0.45,pp[1]-0.45,pp[1]+0.45);
    });
    // 陽傘 + 野餐墊 + 海灘球
    cyl(0.05,0.06,2.3,'#e8e0d0',65,1.15,0.6,8);
    const umbT=canvasTex(128,64,(g,w,hh)=>{g.fillStyle='#ff6a88';g.fillRect(0,0,w,hh);g.fillStyle='#fff';for(let i=0;i<4;i++)g.fillRect(i*32,0,16,hh);},[4,1]);
    const umb=new THREE.Mesh(new THREE.ConeGeometry(1.6,0.75,18,1,true),LAMB({map:umbT,side:2}));umb.position.set(65,2.45,0.6);G.add(umb);
    sph(0.07,'#ffd24a',65,2.9,0.6);
    box(1.5,0.035,2.1,'#79c8e8',66.6,0.03,1.5);box(1.5,0.035,0.5,'#ffffff',66.6,0.045,0.75);
    ballG=new THREE.Group();ballG.position.set(64.0,0.34,2.3);G.add(ballG);
    {const b1=new THREE.Mesh(new THREE.SphereGeometry(0.34,16,12),LAMB({color:'#ffffff'}));ballG.add(b1);
     const b2=new THREE.Mesh(new THREE.SphereGeometry(0.2,12,10),LAMB({color:'#ff6a66'}));b2.position.set(-0.16,0.17,-0.08);ballG.add(b2);
     const b3=new THREE.Mesh(new THREE.SphereGeometry(0.18,12,10),LAMB({color:'#5aa8e8'}));b3.position.set(0.19,0.13,0.14);ballG.add(b3);
     ballG.traverse(o=>{if(o.isMesh)o.castShadow=true;});}
    aabb(64.4,65.6,0.1,1.2);
    // 沙堡
    [[69.3,1.6,0.45,0.75],[70.1,1.9,0.34,0.6],[69.7,1.2,0.3,0.5]].forEach(c2=>{
      cyl(c2[2],c2[2]*1.15,c2[3],'#eed3a0',c2[0],c2[3]/2,c2[1],10);
      const rf=new THREE.Mesh(new THREE.ConeGeometry(c2[2]*1.2,0.35,10),LAMB({color:'#e0bc84'}));rf.position.set(c2[0],c2[3]+0.17,c2[1]);G.add(rf);});
    box(1.3,0.3,0.25,'#eed3a0',69.7,0.15,2.25);
    const fg2=new THREE.Mesh(new THREE.ConeGeometry(0.09,0.16,3),LAMB({color:'#ff6a66'}));fg2.position.set(69.3,2.15,1.6);fg2.rotation.z=PI/2;G.add(fg2);
    cyl(0.012,0.012,0.4,'#8a6248',69.3,1.95,1.6,6);
    aabb(68.7,70.6,0.9,2.5);
    // 貝殼、海星、救生圈、浮球
    sph(0.12,'#ffd7e4',62.2,0.08,2.8,1,0.5,1);sph(0.1,'#fff',67.8,0.07,3.1,1,0.5,1);sph(0.09,'#ffe9b8',71.2,0.07,2.3,1,0.5,1);
    {const st=63.2,sz2=2.0;for(let k=0;k<5;k++){const an=k/5*PI*2;sph(0.1,'#ff9a5c',st+Math.cos(an)*0.17,0.06,sz2+Math.sin(an)*0.17,1.6,0.4,0.7).rotation.y=-an;}sph(0.11,'#ffb070',st,0.08,sz2,1,0.5,1);}
    {const rg2=new THREE.Mesh(new THREE.TorusGeometry(0.5,0.16,10,22),LAMB({color:'#ff6a66'}));rg2.rotation.x=-PI/2;rg2.position.set(61.5,0.18,3.0);G.add(rg2);
     [0,PI/2,PI,PI*1.5].forEach(an=>{const w2=new THREE.Mesh(new THREE.TorusGeometry(0.5,0.165,8,6,0.5),LAMB({color:'#ffffff'}));w2.rotation.x=-PI/2;w2.rotation.z=an;w2.position.set(61.5,0.18,3.0);G.add(w2);});
     aabb(60.9,62.1,2.4,3.6);}
    buoyG=new THREE.Group();buoyG.position.set(63,0,-3.4);G.add(buoyG);
    {const b1=new THREE.Mesh(new THREE.SphereGeometry(0.32,14,10),LAMB({color:'#ff6a66'}));b1.position.y=0.1;buoyG.add(b1);
     const b2=new THREE.Mesh(new THREE.SphereGeometry(0.325,14,6,0,PI*2,0,0.9),LAMB({color:'#ffffff'}));b2.position.y=0.12;buoyG.add(b2);
     const b3=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.5,6),LAMB({color:'#8a6248'}));b3.position.y=0.5;buoyG.add(b3);}
    // 東側礁岩
    for(let z=-1.2;z<3.6;z+=0.9)sph(0.6+((z*3|0)%2)*0.2,'#b8b0a4',74.0,0.35,z,1,0.75,1);
    // 南側沙丘
    for(let x=59;x<73.5;x+=1.6)sph(0.7,'#f3dca6',x,0.25,4.1,1.4,0.5,1);
  }

  const ST=buildStreet(G,boxes);
  /* ---- 可走區域（含門洞） ---- */
  const zz=[-5.3,3.5];
  const areas=[
    ST.area,
    {n:'客廳',x0:-17.55,x1:-6.45,z0:zz[0],z1:zz[1]},
    {n:'更衣室',x0:ROOM.x0,x1:ROOM.x1,z0:ROOM.z0,z1:ROOM.z1},
    {n:'房間',x0:6.45,x1:17.55,z0:zz[0],z1:zz[1]},
    {n:'廁所',x0:18.45,x1:27.55,z0:zz[0],z1:zz[1]},
    {n:'廚房',x0:28.45,x1:37.55,z0:zz[0],z1:zz[1]},
    {n:'公園',x0:38.45,x1:57.55,z0:zz[0],z1:zz[1]},
    {n:'沙灘',x0:58.45,x1:73.55,z0:-1.5,z1:zz[1]},
    {n:'門',x0:-6.6,x1:-5.4,z0:2.15,z1:3.45},{n:'門',x0:5.4,x1:6.6,z0:2.15,z1:3.45},{n:'門',x0:17.4,x1:18.6,z0:2.15,z1:3.45},{n:'門',x0:-18.6,x1:-17.4,z0:2.15,z1:3.45},{n:'門',x0:27.4,x1:28.6,z0:2.15,z1:3.45},{n:'門',x0:37.4,x1:38.6,z0:2.15,z1:3.45},{n:'門',x0:57.4,x1:58.6,z0:2.15,z1:3.45}
  ];
  /* ---- 互動熱點 ---- */
  const A=(id,label,type,x,y,z,face,o)=>Object.assign({id,label,type,x,y,z,face},o||{});
  const Tg=(id,label,fn,face)=>({id,label,type:'toggle',fn,face});
  const hot=[
    {id:'sofa',x:-14,z:-3.4,r:2.6,acts:[A('sit','🛋️ 坐下','sit',-12,0.38,-4.95,0),A('lie','😴 躺沙發','lie',-11.2,1.12,-4.95,PI/2)]},
    {id:'tv',x:-16.2,z:-1.5,r:1.8,acts:[Tg('tv','📺 開關電視','tv',-PI/2)]},
    {id:'arm',x:-8.3,z:0.3,r:1.9,acts:[A('sit','🪑 坐下','sit',-8.2,0.31,-1.2,-PI/2),A('jump','🦘 在椅子上跳','jump',-8.2,0.85,-1.2,-PI/2)]},
    {id:'curl',x:-15.9,z:-4.2,r:2.0,acts:[Tg('cur','🪟 開關窗簾','curL',PI)]},
    {id:'lampl',x:-14.9,z:-4.4,r:1.4,acts:[Tg('lamp','💡 開關燈','lampL',PI)]},
    {id:'mirror',x:0,z:-4.3,r:2.0,acts:[Tg('selfie','🤳 照鏡子自拍','mirror',PI)]},
    {id:'wardl',x:-3.7,z:-4.4,r:2.0,acts:[Tg('open','👗 開衣櫃','wardL',PI)]},
    {id:'wardr',x:3.7,z:-4.4,r:2.0,acts:[Tg('open','👗 開衣櫃','wardR',PI)]},
    {id:'stool',x:-2.7,z:2.2,r:1.6,acts:[A('sit','🪑 坐下','sit',-2.7,-0.08,0.9,0),A('jump','🦘 在凳子上跳','jump',-2.7,0.46,0.9,0)]},
    {id:'bed',x:12,z:-0.9,r:3.0,acts:[A('sleep','💤 躺下睡覺','lie',12,1.25,-3.8,0,{sleep:true}),A('jump','🦘 在床上跳','jump',12,1.05,-3.3,0),Tg('lamp','💡 開關床頭燈','lampB',PI),Tg('cur','🪟 開關窗簾','curB',PI)]},
    {id:'desk',x:15,z:-2.3,r:1.9,acts:[A('sit','💻 坐下用電腦','sit',15.8,0.22,-3.8,PI/2,{work:true}),A('jump','🦘 在椅子上跳','jump',15.8,0.76,-3.8,PI/2)]},
    {id:'bean',x:8.5,z:1.6,r:1.9,acts:[A('sit','🫧 陷進去坐','sit',8.5,0.49,0.2,0),A('jump','🦘 在懶骨頭上跳','jump',8.5,1.05,0.2,0)]},
    {id:'tub',x:23,z:-3.5,r:2.3,acts:[A('bath','🛁 洗澡','bath',23,0.4,-5.0,0,{extra:[{label:'🦆 捏小鴨',fn:'duck'}]}),Tg('duck','🦆 捏小鴨','duck',PI)]},
    {id:'toilet',x:25.8,z:-4.8,r:1.7,acts:[A('sit','🚽 坐馬桶','sit',26.9,0.09,-5.1,0,{extra:[{label:'💧 沖水',fn:'flush'}]})]},
    {id:'sink',x:26,z:-1.5,r:1.6,acts:[A('wash','🧼 洗手','wash',26.05,0,-1.5,PI/2)]},
    {id:'fridge',x:36.3,z:-4.0,r:2.0,acts:[Tg('fridge','🧊 開關冰箱','fridge',PI)]},
    {id:'stove',x:32.8,z:-4.3,r:2.0,acts:[Tg('stove','🍳 開火煮湯','stove',PI)]},
    {id:'dining',x:31.5,z:0.9,r:2.3,acts:[A('sit','🪑 坐下吃點心','sit',30.4,0.12,0.8,PI/2,{extra:[{label:'🍰 吃蛋糕',fn:'cake'}]}),A('sit2','☕ 坐另一邊','sit',32.6,0.12,0.8,-PI/2,{extra:[{label:'🍰 吃蛋糕',fn:'cake'}]})]},
    {id:'washer',x:25.8,z:-3.5,r:1.5,acts:[Tg('washer','🧺 開關洗衣機','washer',PI/2)]},
    {id:'bench1',x:44.5,z:2.0,r:1.8,acts:[A('sit','🪑 坐長椅賞花','sit',44.5,0.26,2.0,PI)]},
    {id:'bench2',x:51.0,z:2.0,r:1.8,acts:[A('sit','🪑 坐長椅賞花','sit',51.0,0.26,2.0,PI)]},
    {id:'tree',x:47.5,z:-1.2,r:2.8,acts:[Tg('shake','🌸 搖搖櫻花樹','shake',PI)]},
    {id:'flow1',x:42.2,z:0.2,r:2.3,acts:[Tg('smell','🌼 聞花香','smell',PI)]},
    {id:'flow2',x:53.6,z:0.2,r:2.3,acts:[Tg('smell','🌼 聞花香','smell',PI)]},
    {id:'towel',x:66,z:1.2,r:2.0,acts:[A('lie','🧘 躺著曬太陽','lie',66.6,0.14,1.5,0),A('sit','⛱️ 傘下乘涼','sit',65.1,0.04,0.85,PI*0.75)]},
    {id:'sea',x:66.2,z:-1.3,r:2.8,acts:[A('wash','🌊 玩水','wash',66.2,0,-1.42,PI,{sea:true})]},
    {id:'ball',x:64,z:2.3,r:1.7,acts:[Tg('kick','⚽ 踢海灘球','kick',0)]},
    {id:'castle',x:69.7,z:1.9,r:1.9,acts:[Tg('pat','🏰 拍拍沙堡','pat',PI)]}
  ];
  hotBall=hot.find(h2=>h2.id==='ball');

  /* ---- 可操作的家具狀態 ---- */
  const S={tv:false,lampL:true,lampB:true,curL:0,curB:0,wardL:0,wardR:0,washer:false,fridge:0,stove:false};
  const cur={curL:0,curB:0,wardL:0,wardR:0,fridge:0};
  const lampMats={lampL:[ls.material],lampB:lampBmats};
  Object.keys(lampMats).forEach(k=>lampMats[k].forEach(m=>{m.userData.on=m.color.getHex();}));
  const setLamp=(k,on)=>lampMats[k].forEach(m=>m.color.set(on?m.userData.on:0x8c8470));
  let tvI=0,tvLast=0;
  function drawTv(on){
    const g=tvT.image.getContext('2d'),w=256,hh=128;
    if(!on){g.fillStyle='#16161d';g.fillRect(0,0,w,hh);g.fillStyle='rgba(255,255,255,.07)';g.fillRect(8,8,100,12);}
    else{
      const hu=(tvI*67)%360,gr=g.createLinearGradient(0,0,w,hh);gr.addColorStop(0,'hsl('+hu+',80%,80%)');gr.addColorStop(1,'hsl('+((hu+70)%360)+',80%,75%)');g.fillStyle=gr;g.fillRect(0,0,w,hh);
      g.fillStyle='#fff';[[50,40,22],[80,46,26],[190,90,20]].forEach(c=>{g.beginPath();g.arc(c[0]+(tvI%3)*8,c[1],c[2],0,7);g.fill();});
      g.fillStyle='#f7d44a';starPath(g,40+(tvI*47)%180,36,18);g.fillStyle='rgba(90,200,120,.9)';g.fillRect(0,108,w,20);
    }
    tvT.needsUpdate=true;
  }
  drawTv(false);
  function toggle(name,px,pz){
    switch(name){
      case 'tv':S.tv=!S.tv;drawTv(S.tv);return S.tv?'📺 電視開了':'📺 電視關了';
      case 'lampL':S.lampL=!S.lampL;setLamp('lampL',S.lampL);return S.lampL?'💡 燈亮了':'💡 燈關了';
      case 'lampB':S.lampB=!S.lampB;setLamp('lampB',S.lampB);return S.lampB?'💡 床頭燈亮了':'💡 床頭燈關了';
      case 'curL':S.curL=S.curL?0:1;return S.curL?'🪟 窗簾拉上':'🪟 窗簾拉開';
      case 'curB':S.curB=S.curB?0:1;return S.curB?'🪟 窗簾拉上':'🪟 窗簾拉開';
      case 'wardL':S.wardL=S.wardL?0:1;return S.wardL?'👗 衣櫃打開了':'👗 衣櫃關上了';
      case 'wardR':S.wardR=S.wardR?0:1;return S.wardR?'👗 衣櫃打開了':'👗 衣櫃關上了';
      case 'washer':S.washer=!S.washer;return S.washer?'🧺 洗衣機轉動中':'🧺 洗衣機停了';
      case 'fridge':S.fridge=S.fridge?0:1;return S.fridge?'🧊 冰箱打開了，好涼～':'🧊 冰箱關上了';
      case 'stove':S.stove=!S.stove;return S.stove?'🍳 開火！湯咕嘟咕嘟滾了':'🍳 關火了';
      case 'duck':duck.position.y=1.25;return '🦆 呱呱！';
      case 'shake':shakeT=1.2;petals.forEach(p=>{if(Math.random()<0.65){p.y=4.2+Math.random()*2.6;p.sp=1.3+Math.random();}});return '🌸 櫻花雨飄下來了～';
      case 'smell':return '🌼 哇～花香好舒服';
      case 'pat':return '🏰 沙堡拍得更結實了！';
      case 'kick':{if(ballG){const dx=ballG.position.x-px,dz=ballG.position.z-pz,d=Math.hypot(dx,dz)||1;bv={x:dx/d*7.5+(Math.random()-0.5),z:dz/d*7.5+(Math.random()-0.5),y:4.6};}return '⚽ 踢飛出去！';}
    }
    return '';
  }
  function tick(t,dt){
    const e=Math.min(1,dt*4);
    ['curL','curB','wardL','wardR','fridge'].forEach(k=>cur[k]+=(S[k]-cur[k])*e);
    frDoor.rotation.y=-1.9*cur.fridge;
    stFlames.forEach((f,i)=>{f.visible=S.stove;if(S.stove)f.scale.y=0.8+0.5*Math.abs(Math.sin(t*14+i*2));});
    stSteam.forEach((sm,i)=>{const k=(t*0.45+i/3)%1;sm.position.set(32.6+Math.sin(t*2+i*2)*0.08,1.55+k*1.1,-5.4);sm.material.opacity=S.stove?0.5*Math.sin(k*PI):0;const ss=0.06+k*0.14;sm.scale.setScalar(ss/0.08);});
    [[curL,'curL'],[curB,'curB']].forEach(p=>p[0].forEach(c=>{const a=cur[p[1]];c.m.position.x=c.cx+c.s*(1.4-0.85*a);c.m.scale.x=1+0.9*a;}));
    R.wards[0].forEach(d=>d.pv.rotation.y=d.s*1.65*cur.wardL);R.wards[1].forEach(d=>d.pv.rotation.y=d.s*1.65*cur.wardR);
    if(S.tv&&t-tvLast>0.7){tvLast=t;tvI++;drawTv(true);}
    wsp.rotation.x+=dt*(S.washer?9:0);wbody.position.z=-3.5+(S.washer?Math.sin(t*50)*0.012:0);
    petals.forEach(p=>{p.y-=dt*(0.55+p.sp);p.ph+=dt;
      p.m.position.set(p.x+Math.sin(p.ph*1.6)*0.7,p.y,p.z+Math.cos(p.ph*1.2)*0.45);
      p.m.rotation.set(p.ph*2.2,p.ph*1.4,0);
      if(p.y<0.04){p.y=4.5+Math.random()*2.8;p.sp=Math.random()*0.5;const an=Math.random()*PI*2,r=Math.random()*4.3;p.x=47.5+Math.cos(an)*r;p.z=-2.4+Math.sin(an)*r*0.8;}});
    if(foamT){foamT.offset.x=t*0.022;foamM.position.z=-1.7+Math.sin(t*0.7)*0.14;foamM.material.opacity=0.75+0.2*Math.sin(t*0.7);}
    if(buoyG){buoyG.position.y=-0.03+Math.sin(t*1.3)*0.1;buoyG.rotation.z=Math.sin(t*1.05)*0.16;}
    if(shakeT>0){shakeT-=dt;canopy.forEach((b2,i)=>{b2.position.set(b2.userData.bx+Math.sin(t*32+i*2)*0.1*shakeT,b2.userData.by+Math.cos(t*27+i)*0.07*shakeT,b2.userData.bz);});
      if(shakeT<=0)canopy.forEach(b2=>b2.position.set(b2.userData.bx,b2.userData.by,b2.userData.bz));}
    if(bv&&ballG){
      const bp=ballG.position;
      bp.x+=bv.x*dt;bp.z+=bv.z*dt;bv.y-=14*dt;bp.y+=bv.y*dt;
      if(bp.y<0.34){bp.y=0.34;bv.y=Math.abs(bv.y)>1.2?-bv.y*0.52:0;}
      if(bp.x<58.9){bp.x=58.9;bv.x=Math.abs(bv.x)*0.65;}
      if(bp.x>73.2){bp.x=73.2;bv.x=-Math.abs(bv.x)*0.65;}
      if(bp.z<-1.3){bp.z=-1.3;bv.z=Math.abs(bv.z)*0.65;}
      if(bp.z>3.4){bp.z=3.4;bv.z=-Math.abs(bv.z)*0.65;}
      ballG.rotation.z-=bv.x*dt*2.4;ballG.rotation.x+=bv.z*dt*2.4;
      bv.x*=Math.pow(0.3,dt);bv.z*=Math.pow(0.3,dt);
      if(Math.abs(bv.x)+Math.abs(bv.z)<0.15&&bp.y<=0.345)bv=null;
    }
    if(hotBall&&ballG){hotBall.x=ballG.position.x;hotBall.z=ballG.position.z;}
    ST.clouds.forEach(c=>{c.position.x+=dt*c.userData.v;if(c.position.x>c.userData.x1)c.position.x=c.userData.x0;});
    duck.position.y+=(1.0+Math.sin(t*2)*0.03-duck.position.y)*Math.min(1,dt*6);duck.rotation.z=Math.sin(t*1.7)*0.1;
  }

  return {group:G,boxes,areas,hot,toggle,tick,state:()=>S,npcs:ST.npcs,front:ST.front};
}
