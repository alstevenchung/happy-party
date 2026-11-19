'use strict';
/* ===== 音效與背景音樂（WebAudio 即時合成，無外部檔案） ===== */
const SND=(function(){
  let ctx=null,master,comp,conv,sfxRev,musRev,dly,fbk,dlyG,ambG,sfxG,musG,scene='create',timer=null,nextT=0,eighth=0,bar=0,mi=3,stepFlip=1,amb='none',ambNext=0;
  let musicOn=true,sfxOn=true;
  try{const p=JSON.parse(localStorage.getItem('acdress_snd'));if(p){musicOn=p.m!==false;sfxOn=p.s!==false;}}catch(e){}
  const saveP=()=>{try{localStorage.setItem('acdress_snd',JSON.stringify({m:musicOn,s:sfxOn}));}catch(e){}};
  const mtof=m=>440*Math.pow(2,(m-69)/12);
  const PENT=[72,74,76,79,81,84,86,88];
  const CH=[[0,4,7],[9,0,4],[5,9,0],[7,11,2]],ROOT=[48,45,41,43];
  let noiseBuf=null;

  let lastErr='';
  function init(){
    if(ctx)return;
    try{
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
    ctx=new AC();
    master=ctx.createGain();master.gain.value=0.92;
    comp=ctx.createDynamicsCompressor();comp.threshold.value=-14;comp.knee.value=18;comp.ratio.value=5;comp.attack.value=0.003;comp.release.value=0.22;
    master.connect(comp);comp.connect(ctx.destination);
    conv=ctx.createConvolver();
    {const dur2=1.3,len=(ctx.sampleRate*dur2)|0,b=ctx.createBuffer(2,len,ctx.sampleRate);
     for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.4);}
     conv.buffer=b;}
    conv.connect(master);
    sfxRev=ctx.createGain();sfxRev.gain.value=0.16;sfxRev.connect(conv);
    musRev=ctx.createGain();musRev.gain.value=0.11;musRev.connect(conv);
    ambG=ctx.createGain();ambG.gain.value=musicOn?0.7:0;ambG.connect(master);ambG.connect(musRev);
    dly=ctx.createDelay(1);dly.delayTime.value=0.27;fbk=ctx.createGain();fbk.gain.value=0.3;dlyG=ctx.createGain();dlyG.gain.value=0.18;
    dly.connect(fbk);fbk.connect(dly);dly.connect(dlyG);dlyG.connect(master);
    sfxG=ctx.createGain();sfxG.gain.value=sfxOn?1:0;sfxG.connect(master);sfxG.connect(sfxRev);
    musG=ctx.createGain();musG.gain.value=musicOn?0.9:0;musG.connect(master);musG.connect(musRev);musG.connect(dly);
    noiseBuf=ctx.createBuffer(1,ctx.sampleRate*0.5,ctx.sampleRate);
    const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    nextT=ctx.currentTime+0.1;timer=setInterval(sched,80);
    }catch(e){lastErr=String(e&&e.message||e);}
  }
  function resume(){
    init();
    if(ctx&&ctx.state!=='running'){try{ctx.resume();}catch(e){lastErr=String(e);}}
    if(ctx){try{const b=ctx.createBuffer(1,1,22050),s=ctx.createBufferSource();s.buffer=b;s.connect(ctx.destination);s.start(0);}catch(e){}}
  }
  function tone(f,t,dur,type,vol,dest,slide,pan,atk){
    const o=ctx.createOscillator(),g=ctx.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);
    if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+dur);
    g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(vol,t+(atk||0.012));g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    let out=g;
    if(pan&&ctx.createStereoPanner){const pr=ctx.createStereoPanner();pr.pan.value=Math.max(-1,Math.min(1,pan));g.connect(pr);out=pr;}
    out.connect(dest||sfxG);o.connect(g);o.start(t);o.stop(t+dur+0.08);
  }
  function noise(t,dur,vol,f0,f1,dest,pan){
    const s=ctx.createBufferSource();s.buffer=noiseBuf;const b=ctx.createBiquadFilter();b.type='bandpass';b.frequency.setValueAtTime(f0,t);
    if(f1)b.frequency.exponentialRampToValueAtTime(f1,t+dur);b.Q.value=1.2;
    const g=ctx.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    let out=g;
    if(pan&&ctx.createStereoPanner){const pr=ctx.createStereoPanner();pr.pan.value=Math.max(-1,Math.min(1,pan));g.connect(pr);out=pr;}
    s.connect(b);b.connect(g);out.connect(dest||sfxG);s.start(t);s.stop(t+dur+0.05);
  }
  const ok=()=>ctx&&sfxOn;
  const seq=(notes,gap,type,vol,dur)=>{const t=ctx.currentTime;notes.forEach((m,i)=>tone(mtof(m),t+i*gap,dur||0.25,type||'triangle',vol||0.22));};

  /* ---- 背景音樂 ---- */
  function waveSfx(t){
    const src=ctx.createBufferSource();src.buffer=noiseBuf;src.loop=true;
    const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(320,t);lp.frequency.linearRampToValueAtTime(1500,t+1.4);lp.frequency.linearRampToValueAtTime(280,t+3.4);
    const g=ctx.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(0.17,t+1.3);g.gain.exponentialRampToValueAtTime(0.0001,t+3.6);
    src.connect(lp);lp.connect(g);g.connect(ambG);src.start(t);src.stop(t+3.8);
  }
  function chirp(t,pan){
    let tt=t;const n=2+(Math.random()*3|0);
    for(let i=0;i<n;i++){const f=2300+Math.random()*1600;tone(f,tt,0.09,'sine',0.05,ambG,f*(0.72+Math.random()*0.22),pan);tt+=0.1+Math.random()*0.09;}
  }
  function ambStep(){
    if(!ctx||scene!=='room')return;const t=ctx.currentTime;
    if(t<ambNext)return;
    if(amb==='beach'){ambNext=t+2.8+Math.random()*2.2;waveSfx(t);}
    else if(amb==='park'){ambNext=t+1.3+Math.random()*2.6;if(Math.random()<0.85)chirp(t,(Math.random()-0.5)*1.4);if(Math.random()<0.25)noise(t,1.6,0.025,350,750,ambG);}
    else if(amb==='street'){ambNext=t+3+Math.random()*4;if(Math.random()<0.5)chirp(t,(Math.random()-0.5)*1.6);}
    else ambNext=t+1;
  }
  function sched(){
    if(!ctx)return;
    ambStep();
    if(nextT<ctx.currentTime-0.5)nextT=ctx.currentTime+0.05;
    while(nextT<ctx.currentTime+0.3){
      if(scene==='fight'){fightStep(nextT,eighth,bar);nextT+=60/(160+Math.min(inten,6)*4)/4;eighth++;if(eighth>=16){eighth=0;bar++;}continue;}
      const room=scene!=='create',ed=60/(scene==='fight'?150:room?116:88)/2;
      const ch=CH[bar%4],ns=ch.map((n,i)=>60+n+(i&&n<ch[0]?12:0)),e=eighth;
      if(e%4===0)tone(mtof(ROOT[bar%4]),nextT,ed*3.2,'sine',0.3,musG);
      if(e%4===2&&room)tone(mtof(ROOT[bar%4]+12),nextT,ed*1.5,'sine',0.12,musG);
      tone(mtof(ns[[0,1,2,1,0,1,2,1][e]]),nextT,ed*2.2,'sine',room?0.11:0.09,musG);
      if(room&&e%2===1)noise(nextT,0.04,0.05,7000,0,musG);
      if(e===0||e===4){tone(mtof(ns[0]-12),nextT,ed*7,'triangle',0.05,musG);}
      if(e===0)ns.forEach((m2,i2)=>tone(mtof(m2),nextT,ed*7.6,'triangle',0.035,musG,0,(i2-1)*0.4,ed*2));
      const p=room?0.7:0.45;
      if(e%2===0&&Math.random()<p){
        mi=Math.max(0,Math.min(PENT.length-1,mi+Math.floor(Math.random()*5)-2));
        let m=PENT[mi];
        if(bar%4===3&&e===6){m=ns[2]+12;}
        tone(mtof(m),nextT,ed*(Math.random()<0.4?3.5:1.8),'triangle',room?0.14:0.11,musG);
      }
      nextT+=ed;eighth++;if(eighth>=8){eighth=0;bar++;}
    }
  }

  /* ---- 熱血格鬥配樂：A 小調、四四拍、踢鼓/小鼓/鈴鈸 + 鋸齒貝斯 + 方波主旋律 ---- */
  let inten=0;
  const RT=[45,41,48,43];
  const RIFF=[
    [81,0,84,0,88,0,84,81, 0,79,0,81,0,0,76,0],
    [77,0,81,0,84,0,81,77, 0,76,0,77,0,0,72,0],
    [79,0,84,0,88,0,84,79, 0,76,0,79,0,0,76,0],
    [79,0,83,0,86,0,83,79, 0,76,0,74,0,76,79,83]];
  function fightStep(t,s,b){
    const r=RT[b%4];
    if(s%4===0||s===10){tone(160,t,0.15,'sine',0.55,musG,45);noise(t,0.016,0.14,4200,0,musG);}
    if(s%8===4){noise(t,0.15,0.34,2600,1400,musG);noise(t+0.014,0.09,0.2,1700,900,musG);tone(230,t,0.09,'triangle',0.22,musG,150);}
    if(s%2===0)noise(t,0.03,0.07,9000,0,musG);
    if(s%8===6)noise(t,0.12,0.06,8000,0,musG);
    if(s%2===0)tone(mtof(r+(s%8===6?12:0)),t,0.13,'sawtooth',0.17,musG);
    if(s%8===0){tone(mtof(r+24),t,0.4,'square',0.05,musG);tone(mtof(r+31),t,0.4,'square',0.05,musG);}
    const n=RIFF[b%4][s];
    if(n){tone(mtof(n),t,0.12,'square',0.1,musG);if(inten>=2)tone(mtof(n-12),t,0.12,'sawtooth',0.06,musG);}
    if(inten>=3&&s%4===2)tone(mtof(r+12),t,0.08,'square',0.05,musG);
  }
  /* ---- 配音：優先用瀏覽器內建語音（zh-TW），沒有就用合成吶喊 ---- */
  let voice=null,lastSay=0;
  const synthOK=false;
  function pickVoice(){if(!synthOK)return;const vs=speechSynthesis.getVoices()||[];voice=vs.find(v=>/zh[-_]TW/i.test(v.lang))||vs.find(v=>/zh/i.test(v.lang))||null;}
  if(synthOK){pickVoice();try{speechSynthesis.onvoiceschanged=pickVoice;}catch(e){}}
  function yell(pitch,big){
    if(!ctx||!sfxOn)return;const t=ctx.currentTime,f=(pitch>1?330:pitch<0.7?110:195)*(0.9+Math.random()*0.2),D=big?1.0:0.34;
    const g=ctx.createGain(),bp=ctx.createBiquadFilter();bp.type='bandpass';
    const fm=[[750,1250],[620,1000],[880,1400]][(Math.random()*3)|0];
    bp.frequency.setValueAtTime(fm[0],t);bp.frequency.exponentialRampToValueAtTime(fm[1],t+D*0.6);bp.Q.value=1.8;
    g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(big?0.6:0.42,t+0.035);g.gain.setValueAtTime(big?0.5:0.3,t+D*0.6);g.gain.exponentialRampToValueAtTime(0.0001,t+D);
    const vib=ctx.createOscillator(),vg=ctx.createGain();vib.frequency.value=big?6:9;vg.gain.value=f*0.06;vib.connect(vg);
    [0,big?-16:-9].forEach(dtn=>{const o=ctx.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(f*1.3,t);o.frequency.exponentialRampToValueAtTime(f*(big?0.5:0.7),t+D);o.detune.value=dtn;vg.connect(o.frequency);o.connect(bp);o.start(t);o.stop(t+D+0.05);});
    vib.start(t);vib.stop(t+D+0.05);bp.connect(g);g.connect(sfxG);
    noise(t,Math.min(0.1,D),0.12,2800,1200);
  }
  function speak(text,o){
    o=o||{};if(!sfxOn||!text)return;
    const now=performance.now();if(now-lastSay<(o.gap===undefined?350:o.gap))return;lastSay=now;
    if(!synthOK){yell(o.pitch||1,/冰封|魔王/.test(text));return;}
    try{
      speechSynthesis.cancel();
      const u=new SpeechSynthesisUtterance(text);u.lang='zh-TW';if(voice)u.voice=voice;
      u.pitch=Math.min(2,o.pitch||1.2);u.rate=o.rate||1.1;u.volume=o.vol||1;speechSynthesis.speak(u);
    }catch(e){yell(o.pitch||1);}
  }

  return {
    resume,info:()=>({state:ctx?ctx.state:'none',err:lastErr,t:ctx?ctx.currentTime:0}),
    setAmbience(k){if(k!==amb){amb=k;ambNext=0;}},
    setScene(s){scene=s;eighth=0;bar=0;if(ctx&&musG)musG.gain.setTargetAtTime(musicOn?(s==='fight'?0.5:0.9):0,ctx.currentTime,0.2);},
    musicOn:()=>musicOn,sfxOn:()=>sfxOn,
    toggleMusic(){musicOn=!musicOn;saveP();if(musG)musG.gain.setTargetAtTime(musicOn?0.9:0,ctx.currentTime,0.1);if(ambG)ambG.gain.setTargetAtTime(musicOn?0.7:0,ctx.currentTime,0.1);return musicOn;},
    toggleSfx(){sfxOn=!sfxOn;saveP();if(sfxG)sfxG.gain.setTargetAtTime(sfxOn?1:0,ctx.currentTime,0.05);return sfxOn;},
    click(){if(!ok())return;tone(1100,ctx.currentTime,0.06,'sine',0.18,null,700);},
    pop(){if(!ok())return;const t=ctx.currentTime;tone(520,t,0.12,'triangle',0.3,null,900);},
    blip(){if(!ok())return;tone(mtof(PENT[Math.floor(Math.random()*PENT.length)]+12),ctx.currentTime,0.12,'sine',0.2);},
    sparkle(){if(!ok())return;const t=ctx.currentTime;seq([84,88,91,96],0.055,'triangle',0.2,0.3);noise(t,0.25,0.06,6000,9000);tone(mtof(108),t+0.12,0.4,'sine',0.08);},
    big(){if(!ok())return;const t=ctx.currentTime;seq([72,76,79,84,88,91,96,100],0.06,'triangle',0.22,0.4);noise(t+0.1,0.5,0.08,4000,10000);tone(mtof(60),t,0.6,'sine',0.2);},
    remove(){if(!ok())return;seq([79,72],0.07,'triangle',0.2,0.18);},
    step(){if(!ok())return;const t=ctx.currentTime;stepFlip*=-1;noise(t,0.05,0.11,500+Math.random()*250,300,null,stepFlip*0.22);tone(145+Math.random()*35,t,0.05,'sine',0.08,null,0,stepFlip*0.22);},
    wave(){if(!ok())return;seq([81,84,81,88],0.12,'triangle',0.2,0.2);},
    dance(){if(!ok())return;seq([72,76,79,76,84,79,76,72,79,84],0.13,'triangle',0.2,0.2);},
    spin(){if(!ok())return;const t=ctx.currentTime;tone(300,t,0.7,'sine',0.2,null,1500);noise(t,0.7,0.08,500,3000);},
    photo(){if(!ok())return;const t=ctx.currentTime;noise(t,0.05,0.5,3000,0);noise(t+0.09,0.07,0.5,2000,0);tone(1500,t,0.04,'square',0.06);},
    mode(){if(!ok())return;seq([79,86],0.1,'sine',0.25,0.3);},
    dice(){if(!ok())return;const t=ctx.currentTime;for(let i=0;i<6;i++)tone(300+Math.random()*500,t+i*0.05,0.04,'square',0.07);tone(mtof(88),t+0.34,0.25,'triangle',0.2);},
    sit(){if(!ok())return;tone(320,ctx.currentTime,0.18,'sine',0.3,null,160);},
    boing(){if(!ok())return;tone(180,ctx.currentTime,0.25,'sine',0.3,null,520);},
    flush(){if(!ok())return;const t=ctx.currentTime;noise(t,1.3,0.3,1800,350);tone(200,t+0.2,0.9,'sine',0.08,null,90);},
    water(){if(!ok())return;const t=ctx.currentTime;noise(t,0.4,0.16,3200,1500);noise(t+0.15,0.35,0.12,2600,1200);},
    quack(){if(!ok())return;const t=ctx.currentTime;tone(520,t,0.12,'square',0.12,null,380);tone(500,t+0.17,0.14,'square',0.12,null,340);},
    tv(on){if(!ok())return;const t=ctx.currentTime;noise(t,0.3,0.12,4000,900);if(on)seq([84,88],0.09,'triangle',0.15,0.2);else tone(600,t,0.25,'sine',0.15,null,100);},
    creak(){if(!ok())return;tone(190,ctx.currentTime,0.4,'sawtooth',0.08,null,110);},
    washer(){if(!ok())return;const t=ctx.currentTime;tone(90,t,0.6,'sine',0.25);noise(t,0.6,0.1,300,200);},
    snore(){if(!ok())return;tone(120,ctx.currentTime,1.0,'sine',0.12,null,70);},
    whoosh(k){if(!ok())return;const t=ctx.currentTime;
      if(k===2){noise(t,0.32,0.6,500,3800);tone(260,t,0.3,'sine',0.16,null,1600);noise(t+0.13,0.22,0.34,3800,900);}
      else{noise(t,0.14,0.55,1000,4200);noise(t+0.07,0.15,0.36,4200,700);tone(900,t,0.17,'sine',0.11,null,260);}
    },
    hit(big,k){if(!ok())return;const t=ctx.currentTime,p=1+(k||0)*0.12,pn=(Math.random()-0.5)*0.45;
      noise(t,big?0.3:0.16,big?0.9:0.7,big?1100:1700,160,null,pn);
      tone((big?120:190)*p,t,big?0.36:0.2,'square',big?0.42:0.3,null,50,pn);
      tone(big?75:100,t,big?0.34:0.2,'sine',big?0.75:0.55,null,32);
      noise(t,0.05,0.45,6000,3000);
      if(big){tone(mtof(47),t+0.02,0.45,'sawtooth',0.2,null,mtof(32));noise(t+0.05,0.35,0.35,500,120);}
    },
    slam(){if(!ok())return;const t=ctx.currentTime;noise(t,0.7,0.55,600,70);tone(70,t,0.7,'sine',0.55,null,28);},
    missile(){if(!ok())return;const t=ctx.currentTime;noise(t,0.45,0.22,2200,500);tone(520,t,0.4,'sawtooth',0.1,null,180);},
    bossWarn(){if(!ok())return;const t=ctx.currentTime;for(let i=0;i<4;i++){tone(mtof(i%2?62:57),t+i*0.26,0.24,'sawtooth',0.22);}tone(50,t,1.1,'sine',0.35,null,30);},
    explode(){if(!ok())return;const t=ctx.currentTime;noise(t,1.2,0.65,900,50);tone(90,t,1.0,'sine',0.55,null,22);seq([60,55,48,43],0.1,'sawtooth',0.2,0.3);},
    hurt(){if(!ok())return;const t=ctx.currentTime;noise(t,0.25,0.65,800,160);tone(240,t,0.3,'sawtooth',0.25,null,100);tone(80,t,0.25,'sine',0.5,null,40);},
    ko(){if(!ok())return;const t=ctx.currentTime;noise(t,0.35,0.45,800,150);tone(200,t,0.5,'square',0.22,null,50);seq([76,72,67],0.08,'triangle',0.15,0.2);},
    chargeTick(g){if(!ok())return;tone(300+g*5,ctx.currentTime,0.14,'sine',0.1,null,420+g*6);},
    ice(){if(!ok())return;const t=ctx.currentTime;tone(mtof(60),t,1.2,'sine',0.25,null,mtof(96));noise(t,0.9,0.25,9000,2500);seq([96,100,103,108,112],0.07,'triangle',0.2,0.6);tone(80,t+0.5,0.6,'sine',0.35,null,40);},
    shatter(){if(!ok())return;const t=ctx.currentTime;noise(t,0.35,0.4,7000,2000);for(let i=0;i<6;i++)tone(1800+Math.random()*2500,t+i*0.03,0.1,'triangle',0.1);},
    heal(){if(!ok())return;seq([72,76,79,84],0.07,'sine',0.22,0.25);},
    round(){if(!ok())return;seq([67,72,79],0.12,'square',0.12,0.25);},
    gaiaCharge(){if(!ok())return;const t=ctx.currentTime;tone(70,t,1.15,'sawtooth',0.28,null,300);noise(t,1.15,0.2,200,1800);tone(mtof(40),t,1.15,'sine',0.3,null,mtof(64));},
    gaiaFire(){if(!ok())return;const t=ctx.currentTime;noise(t,0.45,0.55,3000,300);tone(1000,t,0.45,'sawtooth',0.22,null,110);},
    boom(){if(!ok())return;const t=ctx.currentTime;noise(t,1.5,0.85,1100,40);tone(80,t,1.3,'sine',0.7,null,18);tone(160,t,0.5,'square',0.3,null,40);noise(t+0.1,0.9,0.4,300,60);seq([60,55,48,43],0.09,'sawtooth',0.22,0.35);},
    tornado(){if(!ok())return;const t=ctx.currentTime;noise(t,0.95,0.55,500,2400);noise(t+0.22,0.75,0.45,2400,500);tone(170,t,0.95,'sawtooth',0.15,null,460);},
    dizzy(){if(!ok())return;const t=ctx.currentTime;for(let i=0;i<5;i++)tone(i%2?520:380,t+i*0.1,0.12,'sine',0.14,null,i%2?400:300);},
    say(text,o){speak(text,o);},
    meow(p,pan){if(!ok())return;const t=ctx.currentTime;p=p||1;
      [[760,430,0,0.22],[880,520,0.26,0.3]].forEach(q=>{const o=ctx.createOscillator(),g=ctx.createGain(),bp=ctx.createBiquadFilter();
        o.type='triangle';o.frequency.setValueAtTime(q[0]*p,t+q[2]);o.frequency.exponentialRampToValueAtTime(q[1]*p,t+q[2]+q[3]);
        bp.type='bandpass';bp.frequency.value=1100*p;bp.Q.value=1.4;
        g.gain.setValueAtTime(0.0001,t+q[2]);g.gain.linearRampToValueAtTime(0.3,t+q[2]+0.04);g.gain.exponentialRampToValueAtTime(0.0001,t+q[2]+q[3]);
        let out=g;if(pan&&ctx.createStereoPanner){const pr=ctx.createStereoPanner();pr.pan.value=Math.max(-1,Math.min(1,pan));g.connect(pr);out=pr;}
        o.connect(bp);bp.connect(g);out.connect(sfxG);o.start(t+q[2]);o.stop(t+q[2]+q[3]+0.05);});},
    zap(){if(!ok())return;const t=ctx.currentTime;noise(t,0.16,0.5,7000,1400);tone(140,t,0.14,'square',0.3,null,60);for(let i=0;i<4;i++)noise(t+0.03+i*0.035,0.025,0.3,5000,2500);},
    splash(){if(!ok())return;const t=ctx.currentTime;noise(t,0.35,0.4,2600,500);tone(500,t+0.05,0.2,'sine',0.15,null,180);tone(820,t+0.16,0.14,'sine',0.1,null,420);},
    gust(){if(!ok())return;const t=ctx.currentTime;noise(t,0.55,0.4,420,2600);noise(t+0.25,0.4,0.3,2600,500);},
    ignite(){if(!ok())return;const t=ctx.currentTime;noise(t,0.3,0.4,1800,400);tone(210,t,0.3,'sawtooth',0.16,null,55);for(let i=0;i<3;i++)noise(t+0.1+i*0.07,0.03,0.2,3500,1500);},
    hole(){if(!ok())return;const t=ctx.currentTime;tone(190,t,0.9,'sine',0.35,null,36);noise(t,0.8,0.18,300,1800);},
    starPower(){if(!ok())return;const t=ctx.currentTime;[72,76,79,84,88,91,96,100].forEach((m,i)=>tone(mtof(m),t+i*0.05,0.16,'square',0.15));noise(t,0.45,0.12,6000,10000);tone(mtof(108),t+0.42,0.5,'triangle',0.14);},
    deflect(){if(!ok())return;const t=ctx.currentTime;tone(1500,t,0.16,'triangle',0.32,null,2600);tone(620,t,0.08,'square',0.15,null,950);noise(t,0.06,0.28,6000,9500);},
    iceHit(){if(!ok())return;const t=ctx.currentTime;seq([96,100,103],0.05,'triangle',0.2,0.25);noise(t,0.2,0.25,8000,3000);},
    setIntensity(n){inten=n;}
  };
})();
