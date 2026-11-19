'use strict';
/* ===== 商店街（家門外）：店面、街燈、噴水池、可互動的店員與路人（全程式生成） ===== */
function buildStreet(G,boxes){
  const mm=(c,o)=>LAMB(Object.assign({color:c},o||{}));
  const MT=c=>typeof c==='string'?mm(c):c;
  const box=(w,h,d,c,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),MT(c));o.position.set(x,y,z);G.add(o);return o;};
  const cyl=(rt,rb,h,c,x,y,z,seg)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg||20),MT(c));o.position.set(x,y,z);G.add(o);return o;};
  const sph=(r,c,x,y,z,sx,sy,sz)=>{const o=new THREE.Mesh(new THREE.SphereGeometry(r,14,10),MT(c));o.position.set(x,y,z);o.scale.set(sx||1,sy||1,sz||1);G.add(o);return o;};
  const plane=(w,h,m,x,y,z,ry)=>{const o=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m);o.position.set(x,y,z);o.rotation.y=ry||0;G.add(o);return o;};
  const aabb=(x0,x1,z0,z1)=>boxes.push({x0,x1,z0,z1});
  const rnd=i=>{const s=Math.sin(i*127.1+311.7)*43758.5453;return s-Math.floor(s);};
  const X0=-58,X1=-18.5,CX=(X0+X1)/2;

  /* ---- 地面 ---- */
  const pave=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#e9dcc8';g.fillRect(0,0,w,h);g.strokeStyle='#d3c3aa';g.lineWidth=3;
    for(let i=0;i<=4;i++){g.beginPath();g.moveTo(i*64,0);g.lineTo(i*64,h);g.stroke();g.beginPath();g.moveTo(0,i*64);g.lineTo(w,i*64);g.stroke();}
    g.fillStyle='rgba(255,255,255,.35)';g.fillRect(70,70,52,52);g.fillRect(6,6,52,52);},[20,5]);
  const gr=plane(X1-X0+2,10,LAMB({map:pave}),CX,0,-1,0);gr.rotation.x=-PI/2;
  const grass=plane(80,14,mm('#a8d492'),CX,-0.02,11,0);grass.rotation.x=-PI/2;
  const grass2=plane(80,6,mm('#a8d492'),CX,-0.02,-9,0);grass2.rotation.x=-PI/2;

  /* ---- 房子外牆 + 門（x=-18） ---- */
  const brick=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#d9a58a';g.fillRect(0,0,w,h);g.strokeStyle='rgba(120,60,40,.35)';g.lineWidth=3;
    for(let y=0;y<8;y++){g.beginPath();g.moveTo(0,y*32);g.lineTo(w,y*32);g.stroke();for(let x=0;x<4;x++){g.beginPath();g.moveTo(x*64+(y%2)*32,y*32);g.lineTo(x*64+(y%2)*32,y*32+32);g.stroke();}}},[4,1]);
  const bm=LAMB({map:brick});
  plane(8,4.2,bm,-18.04,2.1,-2,-PI/2);plane(1.9,1.2,bm,-18.04,3.6,2.95,-PI/2);
  const signT=canvasTex(256,64,(g,w,h)=>{g.fillStyle='#fff7e6';g.fillRect(0,0,w,h);g.fillStyle='#e8505b';g.font='bold 34px "Microsoft JhengHei",sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('🏠 我的家',w/2,h/2+2);});
  plane(1.7,0.42,new THREE.MeshBasicMaterial({map:signT}),-18.1,3.6,2.95,-PI/2);
  box(1.4,0.03,1.0,'#f48fb1',-19.0,0.02,2.95);box(1.1,0.035,0.7,'#fff',-19.0,0.025,2.95);

  /* ---- 店面 ---- */
  const winTex=(kind)=>canvasTex(256,180,(g,w,h)=>{
    g.fillStyle={bread:'#fbe9cf',flower:'#f9e1ec',cafe:'#ecdcc6',ice:'#e3f4fb',closet:'#ece3f7'}[kind];g.fillRect(0,0,w,h);
    g.fillStyle='rgba(120,80,40,.5)';g.fillRect(0,60,w,6);g.fillRect(0,120,w,6);
    for(let r=0;r<3;r++)for(let i=0;i<6;i++){
      const x=18+i*40,y=r*60+(r===2?30:36);
      if(kind==='bread'){g.fillStyle=['#d9a05b','#e8c28a','#c98a4a'][(i+r)%3];g.beginPath();g.ellipse(x,y,15,8,0,0,7);g.fill();}
      else if(kind==='flower'){g.fillStyle=['#f48fb1','#f7d44a','#8e5bc9','#e8505b'][(i+r)%4];g.beginPath();g.arc(x,y-4,9,0,7);g.fill();g.fillStyle='#4aa86a';g.fillRect(x-2,y,4,14);}
      else if(kind==='cafe'){g.fillStyle=['#fff','#f0dcb4','#f48fb1'][(i+r)%3];g.fillRect(x-10,y-8,20,14);g.fillStyle='#8a5a3a';g.fillRect(x-10,y-8,20,4);}
      else if(kind==='ice'){g.fillStyle='#d9a05b';g.beginPath();g.moveTo(x-9,y-4);g.lineTo(x+9,y-4);g.lineTo(x,y+14);g.fill();g.fillStyle=['#f48fb1','#9be0c8','#f7d44a'][(i+r)%3];g.beginPath();g.arc(x,y-8,11,0,7);g.fill();}
      else{g.fillStyle=['#e8505b','#6bb6f2','#f7d44a','#8e5bc9','#3fae6a'][(i+r)%5];g.fillRect(x-9,y-12,18,24);g.fillStyle='rgba(255,255,255,.5)';g.fillRect(x-9,y-12,18,5);}
    }
  });
  const nameTex=(name,en,col)=>canvasTex(512,128,(g,w,h)=>{g.fillStyle=col;g.fillRect(0,0,w,h);g.fillStyle='rgba(255,255,255,.35)';g.fillRect(0,h-14,w,14);
    g.fillStyle='#fff';g.textAlign='center';g.textBaseline='middle';g.font='bold 62px "Microsoft JhengHei",sans-serif';g.fillText(name,w/2,h/2-10);g.font='bold 26px sans-serif';g.fillText(en,w/2,h-34);});
  const awnTex=(c1,c2)=>canvasTex(128,64,(g,w,h)=>{g.fillStyle=c2;g.fillRect(0,0,w,h);g.fillStyle=c1;for(let i=0;i<8;i+=2)g.fillRect(i*16,0,16,h);},[4,1]);
  const SH=[
    {kind:'bread',n:'麵包店',en:'BAKERY',c:'#f6c9a0',aw:['#e8505b','#ffffff'],sign:'#c98a4a',cx:-25.7},
    {kind:'flower',n:'花店',en:'FLOWERS',c:'#f4b6cf',aw:['#4aa86a','#ffffff'],sign:'#d96a9a',cx:-33.1},
    {kind:'cafe',n:'咖啡廳',en:'CAFE',c:'#dcc7ad',aw:['#6b4a3a','#f0dcb4'],sign:'#7a5238',cx:-40.5},
    {kind:'ice',n:'冰淇淋店',en:'ICE CREAM',c:'#bfe8f5',aw:['#f48fb1','#ffffff'],sign:'#e57fa6',cx:-47.9},
    {kind:'closet',n:'服飾店',en:'CLOSET',c:'#d7c5f0',aw:['#8e5bc9','#ffffff'],sign:'#7b4bb8',cx:-55.3}
  ];
  SH.forEach((s,i)=>{
    const cx=s.cx;
    box(7.2,6.2,3,s.c,cx,3.1,-7.5);box(7.5,0.35,3.3,'#fff4e6',cx,6.3,-7.5);
    // 櫥窗
    box(3.5,2.5,0.1,'#fff',cx-1.5,1.75,-5.97);
    plane(3.3,2.3,new THREE.MeshBasicMaterial({map:winTex(s.kind)}),cx-1.5,1.75,-5.9,0);
    box(0.06,2.3,0.07,'#fff',cx-1.5,1.75,-5.88);box(3.3,0.06,0.07,'#fff',cx-1.5,1.75,-5.88);
    // 門
    box(1.5,2.7,0.12,'#8a5a3a',cx+2.1,1.35,-5.96);box(1.1,1.2,0.05,'#bfe6ff',cx+2.1,1.9,-5.88);sph(0.07,'#f7d44a',cx+1.6,1.3,-5.85);
    // 招牌
    box(5.2,1.1,0.16,s.sign,cx,4.35,-5.9);
    plane(5.0,0.9,new THREE.MeshBasicMaterial({map:nameTex(s.n,s.en,s.sign)}),cx,4.35,-5.8,0);
    // 遮陽棚
    const aw=new THREE.Mesh(new THREE.BoxGeometry(6.8,0.12,1.7),LAMB({map:awnTex(s.aw[0],s.aw[1])}));aw.position.set(cx,3.2,-5.15);aw.rotation.x=0.3;G.add(aw);
    for(let k=0;k<8;k++)box(0.8,0.2,0.05,k%2?s.aw[1]:s.aw[0],cx-3.0+k*0.85,2.95,-4.4);
    // 上方小窗
    [-2,2].forEach(dx=>{box(1.1,1.1,0.1,'#fff',cx+dx,5.5,-5.98);plane(0.9,0.9,new THREE.MeshBasicMaterial({color:'#cfe9f7'}),cx+dx,5.5,-5.92,0);});
    // 花盆 + 小攤位
    box(1.1,0.4,0.45,'#c68a5a',cx-3.1,0.2,-5.5);for(let k=0;k<4;k++)sph(0.17,['#f48fb1','#f7d44a','#fff','#e8505b'][(k+i)%4],cx-3.45+k*0.23,0.55,-5.5);
    const stx=cx-2.0;
    box(1.8,0.8,0.8,'#e0b88a',stx,0.4,-4.7);box(1.9,0.06,0.9,s.aw[0],stx,0.83,-4.7);
    for(let k=0;k<4;k++){const col=['#f48fb1','#f7d44a','#6bb6f2','#9bd45a'][(k+i)%4];sph(0.16,col,stx-0.6+k*0.4,1.0,-4.7);}
    aabb(stx-1.0,stx+1.0,-5.15,-4.25);
  });
  // ---- 天空背景：漸層天 + 太陽光暈 + 遠山 + 粉彩小鎮 + 飄雲 ----
  const skyBg=canvasTex(512,256,(g,w,hh)=>{
    const gr=g.createLinearGradient(0,0,0,hh);gr.addColorStop(0,'#5fb8e8');gr.addColorStop(0.45,'#9fd8f2');gr.addColorStop(0.8,'#d8f0f8');gr.addColorStop(1,'#ffeccc');
    g.fillStyle=gr;g.fillRect(0,0,w,hh);
    const sun=g.createRadialGradient(400,58,4,400,58,90);sun.addColorStop(0,'rgba(255,245,200,.95)');sun.addColorStop(0.25,'rgba(255,235,170,.5)');sun.addColorStop(1,'rgba(255,235,170,0)');
    g.fillStyle=sun;g.fillRect(290,0,220,180);
    g.fillStyle='#fff2c0';g.beginPath();g.arc(400,58,22,0,7);g.fill();
  });
  const skyP=plane(110,36,new THREE.MeshBasicMaterial({map:skyBg,depthWrite:false}),CX,14.5,-24.5);skyP.renderOrder=-3;
  const hillTex=(c1,c2,ph)=>canvasTex(512,128,(g,w,hh)=>{
    g.clearRect(0,0,w,hh);g.fillStyle=c1;g.beginPath();g.moveTo(0,hh);
    for(let x=0;x<=w;x+=8)g.lineTo(x,56+Math.sin(x*0.016+ph)*26+Math.sin(x*0.047+ph*2)*10);
    g.lineTo(w,hh);g.closePath();g.fill();
    g.fillStyle=c2;for(let i=0;i<9;i++){const x=(i*61+ph*40)%w;g.beginPath();g.arc(x,66+Math.sin(x*0.02)*20,10+(i%3)*5,0,7);g.fill();}
  });
  const h1=plane(110,13,new THREE.MeshBasicMaterial({map:hillTex('#a9d4bc','#98c9ad',1),transparent:true,depthWrite:false}),CX,6.2,-20.5);h1.renderOrder=-2;
  const h2=plane(110,11,new THREE.MeshBasicMaterial({map:hillTex('#8cc49e','#7db892',4),transparent:true,depthWrite:false}),CX,5.0,-17.5);h2.renderOrder=-1;
  const cloudT=canvasTex(256,128,(g,w,hh)=>{g.clearRect(0,0,w,hh);g.fillStyle='rgba(255,255,255,.95)';
    [[70,76,30],[110,62,38],[152,70,33],[190,82,24],[46,88,22],[128,88,34]].forEach(c=>{g.beginPath();g.arc(c[0],c[1],c[2],0,7);g.fill();});});
  const clouds=[];
  [[-54,13.5,-22,9],[-40,16,-21,12],[-27,12.5,-22.5,7.5],[-47,10.8,-18.8,6]].forEach((c,i)=>{
    const m=plane(c[3],c[3]*0.5,new THREE.MeshBasicMaterial({map:cloudT,transparent:true,opacity:0.92,depthWrite:false}),c[0],c[1],c[2]);
    m.renderOrder=-1;m.userData={v:0.12+i*0.05,x0:-60,x1:-17};clouds.push(m);
  });
  // 粉彩小鎮剪影
  [[-24,-15.5,6,'#ffd9c2'],[-31,-16.5,8.5,'#cfe4f7'],[-39,-15.8,6.5,'#ffe6ee'],[-47,-16.5,10,'#c9e8d8'],[-55,-15.5,7.5,'#fff2cc'],[-45,-19,12,'#e3d7f5'],[-35,-19,11,'#f7ddc8']].forEach(b=>{
    box(6,b[2],4,b[3],b[0],b[2]/2,b[1]);
    const rf=box(6.4,0.5,4.4,'#fffdf8',b[0],b[2]+0.25,b[1]);
    for(let k=0;k<3;k++)box(0.9,0.9,0.1,'#fff6d8',b[0]-1.8+k*1.8,b[2]*0.55,b[1]+2.01);
  });

  /* ---- 街道傢俱 ---- */
  [-22,-30,-37.5,-44.5,-52].forEach(x=>{
    cyl(0.08,0.12,4.2,'#3a3f4a',x,2.1,3.0);cyl(0.2,0.2,0.2,'#3a3f4a',x,0.1,3.0);
    const gl=sph(0.32,new THREE.MeshBasicMaterial({color:'#fff2b8'}),x,4.4,3.0);const arm=box(0.6,0.06,0.06,'#3a3f4a',x,4.1,3.0);
    aabb(x-0.3,x+0.3,2.7,3.3);
  });
  [-26,-34,-42,-50,-56.5].forEach((x,i)=>{
    box(1.2,0.5,1.2,'#b5865a',x,0.25,2.8);cyl(0.1,0.12,1.4,'#7a5238',x,1.2,2.8);
    [[0,2.6,0,0.9],[0.5,2.3,0.2,0.65],[-0.5,2.25,-0.1,0.65],[0.1,2.2,0.5,0.6]].forEach(p=>sph(p[3],i%2?'#6dbb7a':'#7fcf8a',x+p[0],p[1],2.8+p[2]));
    aabb(x-0.6,x+0.6,2.2,3.4);
  });
  [-28.5,-44].forEach(x=>{
    box(2.0,0.1,0.6,'#c68a5a',x,0.55,2.0);box(2.0,0.6,0.1,'#c68a5a',x,0.9,2.3);[-0.8,0.8].forEach(d=>box(0.1,0.55,0.5,'#6b4a3a',x+d,0.28,2.0));
    aabb(x-1.1,x+1.1,1.6,2.4);
  });
  // 旗幟串
  for(let i=0;i<=60;i++){const t=i/60,x=-57+37*t,y=4.9-Math.sin(t*PI*6)*0.0-Math.abs(Math.sin(t*PI*5))*0.5;
    const f=new THREE.Mesh(new THREE.ConeGeometry(0.16,0.34,3),mm(['#f48fb1','#f7d44a','#6bb6f2','#9bd45a','#ffffff'][i%5]));f.position.set(x,y,-0.8);f.rotation.z=PI;G.add(f);}
  box(37,0.03,0.03,'#8a8a92',CX,5.0,-0.8);
  // 圍籬（前緣）+ 左端擋牆
  for(let i=0;i<20;i++){const x=X0+1+i*2,hh=0.8+rnd(i)*0.25;box(2.0,hh,0.8,'#78b868',x,hh/2,4.3);}
  box(0.8,1.2,10,'#78b868',X0-0.5,0.6,-1);

  /* ---- 角色資料（由 app 建立真實的 Character） ---- */
  const npcs=[
    {id:'baker',name:'麵包師 小麥',x:SH[0].cx+0.9,z:-4.6,face:0,shop:{label:'🥐 買可頌',item:'bread'},
      cfg:{sex:'f',hair:4,hairCol:4,eye:0,eyeCol:1,mouth:0,cheek:1,skin:1},
      out:{top:['apron'],bottom:['jeans','#8a5a3a'],shoes:['sneaker','#8a5a3a','#fafafa'],hat:['chef']},
      lines:['歡迎光臨～剛出爐的可頌最香了！','今天的吐司鬆軟得像雲朵喔。','要不要帶一個回家呢？','麵包的香味有讓你肚子餓嗎？']},
    {id:'florist',name:'花店 小葵',x:SH[1].cx+0.9,z:-4.6,face:0,shop:{label:'💐 收下花束',item:'flower'},
      cfg:{sex:'f',hair:2,hairCol:9,eye:5,eyeCol:3,mouth:0,cheek:2,skin:0},
      out:{dress:['sundress','#9bd45a','#fafafa'],hat:['flowers'],shoes:['mary','#f48fb1','#fafafa']},
      lines:['今天的玫瑰特別漂亮喔～','花會讓心情變好，你也這樣覺得吧？','送你一束花，祝你有美好的一天！','小聲說，鬱金香最近賣得最好。']},
    {id:'barista',name:'咖啡師 阿豆',x:SH[2].cx+0.9,z:-4.6,face:0,shop:{label:'☕ 買咖啡',item:'coffee'},
      cfg:{sex:'m',hair:1,hairCol:0,eye:3,eyeCol:1,mouth:7,cheek:0,skin:2},
      out:{top:['apron','#6b4a3a','#f0dcb4'],bottom:['jeans','#2b2b30'],shoes:['loafer'],hat:['bucket','#6b4a3a','#f0dcb4']},
      lines:['來杯熱拿鐵放鬆一下吧。','今天的豆子是新到的喔。','慢慢喝，不用急。','嘘……咖啡香是會讓人變溫柔的。']},
    {id:'icecream',name:'冰店 小雪',x:SH[3].cx+0.9,z:-4.6,face:0,shop:{label:'🍦 買冰淇淋',item:'icecream'},
      cfg:{sex:'f',hair:5,hairCol:9,eye:1,eyeCol:2,mouth:2,cheek:1,skin:0},
      out:{top:['sailor','#fafafa','#6bb6f2'],bottom:['mini','#6bb6f2'],socks:['knee','#fafafa'],shoes:['sneaker','#fafafa','#6bb6f2'],hat:['sailorcap','#fafafa','#6bb6f2']},
      lines:['冰淇淋融化之前要快點吃喔！','今天的口味是草莓和薄荷～','兩球還是三球？','夏天就是要吃冰！']},
    {id:'clothier',name:'服飾店 阿衣',x:SH[4].cx+0.9,z:-4.6,face:0,shop:{label:'👗 去試穿',item:'closet'},
      cfg:{sex:'m',hair:7,hairCol:2,eye:4,eyeCol:5,mouth:0,cheek:0,skin:1},
      out:{top:['coat'],bottom:['jeans','#2b2b30'],shoes:['boot'],hat:['newsboy','#e8dcc8','#e8dcc8'],face:['round']},
      lines:['歡迎光臨！新款已經上架了。','每個人都有適合自己的樣子喔。','要不要試穿看看？鏡子在那邊。','這件大衣是這季的主打！']},
    {id:'w1',name:'路人 小布',wander:{x0:-56,x1:-22,z:-3.0,speed:0.9,dir:1,start:-34},
      cfg:{sex:'f',hair:8,hairCol:12,eye:6,eyeCol:2,mouth:0,cheek:1,skin:2},out:{top:['dots'],bottom:['pleat'],shoes:['mary']},
      lines:['今天天氣真好，適合逛街～','我在找今天的下午茶。','你的衣服好可愛！']},
    {id:'w2',name:'路人 阿虎',wander:{x0:-54,x1:-24,z:-2.2,speed:1.1,dir:-1,start:-30},
      cfg:{sex:'m',hair:3,hairCol:6,eye:7,eyeCol:3,mouth:6,cheek:0,skin:3},out:{top:['track'],bottom:['sport'],shoes:['sneaker'],hat:['headband']},
      lines:['我在晨跑！要不要一起？','咖啡店的拿鐵是這條街最棒的。','嗨！']},
    {id:'w3',name:'路人 小圓',wander:{x0:-52,x1:-22,z:-3.7,speed:0.7,dir:1,start:-48},
      cfg:{sex:'f',hair:3,hairCol:10,eye:0,eyeCol:4,mouth:4,cheek:2,skin:1},out:{dress:['princess'],hat:['crown'],shoes:['mary','#f48fb1','#fafafa']},
      lines:['我是這條街的公主喔～','冰淇淋店排隊的人好多。','要不要和我拍照？']},
    {id:'w4',name:'路人 老王',wander:{x0:-56,x1:-30,z:-2.6,speed:0.6,dir:-1,start:-36},
      cfg:{sex:'m',hair:9,hairCol:14,eye:3,eyeCol:6,mouth:3,cheek:0,skin:4,face:6},out:{top:['sweater','#8a5a3a','#f0dcb4'],bottom:['wide'],shoes:['loafer'],hat:['tophat']},
      lines:['年輕人，逛街要記得喝水。','這條街我走了三十年了。','哈哈，天氣不錯啊。']}
  ];
  npcs.filter(n=>!n.wander).forEach(n=>aabb(n.x-0.45,n.x+0.45,n.z-0.45,n.z+0.45));

  boxes.forEach(b=>{if(b.x1<-19&&b.z0>1.5)b.front=true;});
  const front=[];G.children.forEach(o=>{if(o.position.x<-19&&o.position.z>1.7&&o.position.z<3.7&&o.geometry&&o.geometry.type!=='PlaneGeometry')front.push(o);});
  return {front,clouds,area:{n:'商店街',x0:X0+1,x1:X1,z0:-5.2,z1:3.5},npcs,shops:SH};
}
