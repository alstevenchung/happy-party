'use strict';
/* ===== 更衣間場景（全部用程式生成） ===== */
function canvasTex(w,h,draw,rep){
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;draw(cv.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(cv);if(rep){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep[0],rep[1]);}return t;
}
const ROOM={x0:-5.55,x1:5.55,z0:-5.3,z1:3.5};

function buildRoom(){
  const G=new THREE.Group(),boxes=[];
  const mat=(c,o)=>LAMB(Object.assign({color:c},o||{}));
  const box=(w,h,d,c,x,y,z,P)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),typeof c==='string'?mat(c):c);o.position.set(x,y,z);(P||G).add(o);return o;};
  const cyl=(rt,rb,h,c,x,y,z,P,seg)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg||24),typeof c==='string'?mat(c):c);o.position.set(x,y,z);(P||G).add(o);return o;};
  const sph=(r,c,x,y,z,P)=>{const o=new THREE.Mesh(new THREE.SphereGeometry(r,14,10),typeof c==='string'?mat(c):c);o.position.set(x,y,z);(P||G).add(o);return o;};
  const aabb=(x0,x1,z0,z1)=>boxes.push({x0,x1,z0,z1});

  // 地板
  const floorT=canvasTex(512,512,(g,w,h)=>{
    g.fillStyle='#efcf9f';g.fillRect(0,0,w,h);
    for(let i=0;i<8;i++){g.fillStyle=i%2?'rgba(255,255,255,.12)':'rgba(120,70,20,.07)';g.fillRect(0,i*64,w,64);g.fillStyle='rgba(120,70,20,.35)';g.fillRect(0,i*64,w,2);}
    for(let i=0;i<14;i++){g.fillStyle='rgba(120,70,20,.25)';g.fillRect(((i*97)%512),((i*3)%8)*64,2,64);}
  },[6,11]);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(12,22),LAMB({map:floorT}));
  floor.rotation.x=-PI/2;floor.position.set(0,0,5);G.add(floor);

  // 牆
  const wallT=canvasTex(256,256,(g,w,h)=>{
    g.fillStyle='#d9f0e4';g.fillRect(0,0,w,h);
    for(let i=0;i<4;i++){g.fillStyle='rgba(255,255,255,.55)';g.fillRect(i*64+22,0,20,h);}
    g.fillStyle='rgba(255,255,255,.7)';for(let y=20;y<h;y+=64)for(let x=0;x<w;x+=64){g.beginPath();g.arc(x+32,y+22,4,0,7);g.fill();}
  },[3,1]);
  const wallM=LAMB({map:wallT});
  const wall=(w,x,z,ry)=>{const o=new THREE.Mesh(new THREE.PlaneGeometry(w,4.2),wallM);o.position.set(x,2.1,z);o.rotation.y=ry;G.add(o);};
  wall(12,0,-6,0);
  const seg=(len,h,x,y,z,ry)=>{const o=new THREE.Mesh(new THREE.PlaneGeometry(len,h),wallM);o.position.set(x,y,z);o.rotation.y=ry;G.add(o);};
  seg(8,4.2,-6,2.1,-2,PI/2);seg(1.9,1.2,-6,3.6,2.95,PI/2);seg(8,4.2,6,2.1,-2,-PI/2);seg(1.9,1.2,6,3.6,2.95,-PI/2);
  // 踢腳板與牆腰
  box(12,0.3,0.12,'#fff4e6',0,0.15,-5.95);box(0.12,0.3,8,'#fff4e6',-5.95,0.15,-2);box(0.12,0.3,8,'#fff4e6',5.95,0.15,-2);
  box(12,0.12,0.14,'#f6b9c8',0,4.15,-5.94);box(0.14,0.12,10,'#f6b9c8',-5.94,4.15,-1);box(0.14,0.12,10,'#f6b9c8',5.94,4.15,-1);

  // 衣櫃
  const wards=[];
  const wardrobe=x=>{
    box(2.4,3.3,0.9,'#c99a6b',x,1.65,-5.5);box(2.7,0.2,1.05,'#a97a4b',x,3.4,-5.47);
    box(2.2,3.0,0.02,'#fff1e0',x,1.65,-5.035);
    for(let i=0;i<6;i++){box(0.3,0.95,0.05,CLOTHCOL[(i*3+(x>0?1:0))%16],x-0.9+i*0.36,2.2,-5.0);box(0.02,0.12,0.02,'#8a8a92',x-0.9+i*0.36,2.72,-5.0);}
    box(2.1,0.05,0.08,'#e3b98a',x,0.9,-5.03);box(0.5,0.4,0.06,'#f48fb1',x-0.5,1.12,-5.02);box(0.5,0.3,0.06,'#6bb6f2',x+0.5,1.07,-5.02);
    const pair=[];
    [-1,1].forEach(s=>{
      const pv=new THREE.Group();pv.position.set(x+s*1.11,1.65,-4.98);G.add(pv);
      const d=new THREE.Mesh(new THREE.BoxGeometry(1.08,3.0,0.05),mat('#e3b98a'));d.position.x=-s*0.54;pv.add(d);
      [2.4,1.0].forEach(y=>{const p=new THREE.Mesh(new THREE.BoxGeometry(0.8,1.0,0.03),mat('#d4a574'));p.position.set(-s*0.54,y-1.65,0.03);pv.add(p);});
      const kb=new THREE.Mesh(new THREE.SphereGeometry(0.06,10,8),mat('#f7d44a'));kb.position.set(-s*0.99,0,0.06);pv.add(kb);
      pair.push({pv,s});
    });
    wards.push(pair);
    aabb(x-1.25,x+1.25,-6,-4.95);
  };
  wardrobe(-3.7);wardrobe(3.7);

  // 全身鏡
  box(1.7,3.2,0.1,'#e0b44a',0,1.9,-5.9);
  const glassT=canvasTex(128,256,(g,w,h)=>{
    const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'#e8f6ff');gr.addColorStop(1,'#b9dcf0');g.fillStyle=gr;g.fillRect(0,0,w,h);
    g.fillStyle='rgba(255,255,255,.55)';g.beginPath();g.moveTo(20,0);g.lineTo(60,0);g.lineTo(10,h*0.5);g.lineTo(0,h*0.5);g.fill();
    g.beginPath();g.moveTo(80,0);g.lineTo(92,0);g.lineTo(40,h*0.45);g.lineTo(28,h*0.45);g.fill();
  });
  const gl=new THREE.Mesh(new THREE.PlaneGeometry(1.45,2.95),new THREE.MeshBasicMaterial({map:glassT}));gl.position.set(0,1.9,-5.83);G.add(gl);
  // 招牌
  const signT=canvasTex(512,128,(g,w,h)=>{
    g.fillStyle='#f48fb1';g.beginPath();g.roundRect?g.roundRect(4,4,w-8,h-8,28):g.rect(4,4,w-8,h-8);g.fill();
    g.fillStyle='#fff';g.font='bold 64px "Microsoft JhengHei",sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('★ 更 衣 間 ★',w/2,h/2+4);
  });
  const sg=new THREE.Mesh(new THREE.PlaneGeometry(3.2,0.8),new THREE.MeshBasicMaterial({map:signT,transparent:true}));sg.position.set(0,3.75,-5.92);G.add(sg);
  // 燈串
  for(let i=0;i<=24;i++){const t=i/24,x=-5.6+11.2*t,y=3.95-Math.sin(t*PI)*0.35-0.1*Math.abs(Math.sin(t*PI*6))*0;
    sph(0.07,['#f7d44a','#f48fb1','#6bb6f2','#9bd45a','#f59a3c'][i%5],x,y,-5.9);}

  // 左牆：窗戶 + 衣架
  box(0.1,2.1,2.3,'#ffffff',-5.93,2.5,0.4);
  const skyT=canvasTex(128,128,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#8fd3f4');gr.addColorStop(1,'#d8f3ff');g.fillStyle=gr;g.fillRect(0,0,w,h);
    g.fillStyle='rgba(255,255,255,.9)';[[30,40,16],[48,42,20],[70,36,14],[90,90,14],[106,92,18]].forEach(c=>{g.beginPath();g.arc(c[0],c[1],c[2],0,7);g.fill();});});
  const win=new THREE.Mesh(new THREE.PlaneGeometry(1.9,1.7),new THREE.MeshBasicMaterial({map:skyT}));win.rotation.y=PI/2;win.position.set(-5.86,2.5,0.4);G.add(win);
  box(0.06,1.7,0.07,'#ffffff',-5.83,2.5,0.4);box(0.06,0.07,1.9,'#ffffff',-5.83,2.5,0.4);
  // 衣架
  [-4.2,-1.4].forEach(z=>{cyl(0.05,0.05,2.7,'#8a8a92',-5.1,1.35,z);box(0.9,0.08,0.08,'#8a8a92',-5.1,0.04,z);});
  cyl(0.04,0.04,2.8,'#b0b0b8',-5.1,2.7,-2.8).rotation.x=PI/2;
  for(let i=0;i<7;i++){
    const z=-4.0+i*0.4,c=CLOTHCOL[(i*3)%16];
    const sh=box(0.08,0.75,0.34,c,-5.1,2.2,z);
    box(0.06,0.2,0.5,c,-5.1,2.5,z);sph(0.05,'#fff',-5.1,2.66,z);
  }
  aabb(-5.55,-4.65,-4.5,-1.1);

  // 右牆：置物架 + 帽盒
  [0.35,1.3,2.25,3.2].forEach(y=>box(0.9,0.08,3.1,'#d4a574',5.45,y,-2.6));
  [-4.1,-1.1].forEach(z=>box(0.9,3.2,0.08,'#c99a6b',5.45,1.6,z));
  box(0.05,3.2,3.1,'#b5865a',5.93,1.6,-2.6);
  const pas=['#f48fb1','#6bb6f2','#f7d44a','#9bd45a','#8e5bc9'];
  for(let r=0;r<3;r++)for(let i=0;i<3;i++){
    const y=0.35+0.95*r+0.04,z=-3.6+i*0.95,c=pas[(r*3+i)%5];
    if((r+i)%2){cyl(0.3,0.3,0.32,c,5.4,y+0.16,z);cyl(0.32,0.32,0.06,'#fff',5.4,y+0.35,z);}
    else{box(0.5,0.12,0.6,c,5.4,y+0.06,z);box(0.5,0.12,0.6,pas[(r+i+2)%5],5.4,y+0.18,z);}
  }
  aabb(4.95,6,-4.2,-1.0);

  // 地毯
  cyl(3.0,3.0,0.02,'#f6b9c8',0,0.012,0.4,G,48);cyl(2.5,2.5,0.024,'#fff0f3',0,0.014,0.4,G,48);cyl(2.1,2.1,0.028,'#f6b9c8',0,0.016,0.4,G,48);
  for(let i=0;i<10;i++){const a=i/10*2*PI;cyl(0.14,0.14,0.032,'#fff',Math.sin(a)*2.3,0.018,0.4+Math.cos(a)*2.3,G,12);}

  // 試衣間（窗簾）
  [[3.5,-0.7],[5.7,-0.7],[3.5,1.9],[5.7,1.9]].forEach(p=>cyl(0.05,0.05,3.1,'#e0b44a',p[0],1.55,p[1],G,10));
  box(2.3,0.06,0.06,'#e0b44a',4.6,3.1,-0.7);box(2.3,0.06,0.06,'#e0b44a',4.6,3.1,1.9);box(0.06,0.06,2.7,'#e0b44a',3.5,3.1,0.6);box(0.06,0.06,2.7,'#e0b44a',5.7,3.1,0.6);
  const curT=canvasTex(128,64,(g,w,h)=>{g.fillStyle='#f48fb1';g.fillRect(0,0,w,h);g.fillStyle='#fff';for(let i=0;i<4;i++)g.fillRect(i*32+8,0,16,h);},[6,1]);
  const cm=LAMB({map:curT});
  box(2.1,2.8,0.07,cm,4.6,1.6,-0.68);box(0.07,2.8,2.5,cm,5.68,1.6,0.6);box(0.55,2.8,0.07,cm,3.78,1.6,1.9);box(0.55,2.8,0.07,cm,5.4,1.6,1.9);
  cyl(0.28,0.28,0.4,'#f7d44a',4.7,0.2,0.2);
  aabb(3.5,5.75,-0.75,-0.6);aabb(5.6,5.8,-0.7,1.95);

  // 盆栽
  cyl(0.32,0.25,0.5,'#d98a5a',-5.1,0.25,-0.6);
  for(let i=0;i<7;i++){const a=i/7*2*PI,l=sph(0.2,'#3fae6a',-5.1+Math.sin(a)*0.25,0.8+(i%2)*0.15,-0.6+Math.cos(a)*0.25);l.scale.set(0.9,1.5,0.6);l.rotation.z=Math.sin(a)*0.5;l.rotation.x=Math.cos(a)*0.5;}
  aabb(-5.5,-4.7,-1.0,-0.2);
  // 落地燈
  cyl(0.03,0.03,2.2,'#8a8a92',1.7,1.1,-5.4);cyl(0.22,0.22,0.06,'#8a8a92',1.7,0.03,-5.4);
  const sh=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.38,0.5,16,1,true),new THREE.MeshBasicMaterial({color:'#ffe9a8',side:2}));sh.position.set(1.7,2.35,-5.4);G.add(sh);
  aabb(1.4,2.0,-5.7,-5.1);
  // 腳凳
  cyl(0.5,0.5,0.4,'#f48fb1',-2.7,0.2,0.9);cyl(0.52,0.52,0.06,'#fff',-2.7,0.4,0.9);aabb(-3.25,-2.15,-0.15,1.95);
  // 小圓桌
  cyl(0.6,0.6,0.06,'#fff4e6',2.4,0.9,-2.2);cyl(0.06,0.06,0.9,'#c99a6b',2.4,0.45,-2.2);cyl(0.3,0.3,0.05,'#c99a6b',2.4,0.03,-2.2);
  cyl(0.12,0.1,0.2,'#6bb6f2',2.4,1.03,-2.2);sph(0.1,'#e8505b',2.55,1.06,-2.3);aabb(1.75,3.05,-2.85,-1.55);

  return {group:G,boxes,wallM,wards};
}

function buildStage(){
  const G=new THREE.Group();
  const m=c=>LAMB({color:c});
  const d=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.6,0.14,40),m('#fff6c9'));d.position.y=-0.07;G.add(d);
  const r=new THREE.Mesh(new THREE.TorusGeometry(1.55,0.05,8,48),m('#ffb5c8'));r.rotation.x=PI/2;r.position.y=0.0;G.add(r);
  const sp=[];
  for(let i=0;i<14;i++){const o=new THREE.Mesh(new THREE.OctahedronGeometry(0.07+0.04*(i%3)),new THREE.MeshBasicMaterial({color:['#ffd966','#ff9ec0','#9ee0ff','#b6f0a8'][i%4]}));
    const a=i/14*2*PI,rr=2.0+0.6*(i%3);o.userData={a,rr,y:0.4+0.25*(i%5)};G.add(o);sp.push(o);}
  return {group:G,tick:t=>sp.forEach((o,i)=>{const a=o.userData.a+t*0.25;o.position.set(Math.sin(a)*o.userData.rr,o.userData.y+Math.sin(t*1.5+i)*0.15,Math.cos(a)*o.userData.rr-0.5);o.rotation.y=t*2+i;})};
}
