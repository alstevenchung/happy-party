'use strict';
/* ===== 連線同玩：WebRTC P2P（資料+語音），房號制訊號交換 ===== */
const NET=(function(){
  let peer=null,conn=null,fast=null,call=null,micStream=null,remoteAudio=null;
  let state='off',code='',isHost=false,muted=false,micOk=false;
  const L={onState:null,onData:null};
  const CH='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  function mkCode(){let c='';for(let i=0;i<5;i++)c+=CH[(Math.random()*CH.length)|0];return c;}
  function setState(s,msg){state=s;if(L.onState)try{L.onState(s,msg||'');}catch(e){if(/nettest/.test(location.hash))document.title='NETERR '+(e&&e.message);}}
  function newPeer(id){
    return new Peer(id,{debug:0,config:{iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}]}});
  }
  async function getMic(){
    if(micStream)return micStream;
    try{
      micStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}});
      micOk=true;
      if(muted)micStream.getAudioTracks().forEach(t=>t.enabled=false);
    }catch(e){micOk=false;setState(state,'🎙 麥克風未開啟，語音停用（遊戲連線不受影響）');}
    return micStream;
  }
  function wireCall(cl){
    call=cl;
    cl.on('stream',st=>{
      if(!remoteAudio){remoteAudio=document.createElement('audio');remoteAudio.autoplay=true;remoteAudio.style.display='none';document.body.appendChild(remoteAudio);}
      remoteAudio.srcObject=st;
      if(remoteAudio.play)remoteAudio.play().catch(()=>{});
      setState(state,'🔊 語音已接通');
    });
    cl.on('error',()=>{});
  }
  function wireConn(c){
    conn=c;
    c.on('open',async()=>{
      setState('on');
      try{
        if(!isHost&&peer){
          const f=peer.connect(c.peer,{reliable:false,label:'fast',serialization:'json'});
          f.on('open',()=>{fast=f;});
          f.on('data',d=>{if(L.onData)try{L.onData(d);}catch(e){}});
          f.on('close',()=>{if(fast===f)fast=null;});
          f.on('error',()=>{if(fast===f)fast=null;});
        }
      }catch(e){}
      if(manual)return;
      await getMic();
      if(!isHost&&micStream&&peer){const cl=peer.call(c.peer,micStream);wireCall(cl);}
    });
    c.on('data',d=>{if(L.onData)try{L.onData(d);}catch(e){}});
    c.on('close',()=>cleanup('對方已離開連線'));
    c.on('error',()=>cleanup('連線中斷'));
  }
  function host(forced){
    cleanup();isHost=true;code=(forced||mkCode()).toUpperCase();
    if(typeof Peer==='undefined'){setState('off','此環境缺少連線元件');return code;}
    setState('wait','正在連上配對服務…');
    peer=newPeer('hp2'+code);
    peer.on('open',()=>{setState('hosting');getMic();});
    peer.on('connection',c=>{
      if(c.label==='fast'){
        c.on('open',()=>{if(conn&&c.peer===conn.peer)fast=c;});
        c.on('data',d=>{if(conn&&c.peer===conn.peer){fast=c;if(L.onData)try{L.onData(d);}catch(e){}}});
        c.on('close',()=>{if(fast===c)fast=null;});
        c.on('error',()=>{if(fast===c)fast=null;});
        return;
      }
      let role=null;
      c.on('data',d=>{
        if(role==='probe')return;
        if(!role){
          if(d&&d.t==='probe'){role='probe';try{c.send({t:'alive'});}catch(e){}setTimeout(()=>{try{c.close();}catch(e){}},400);return;}
          if(conn&&conn.open){role='probe';try{c.close();}catch(e){}return;}
          role='real';conn=c;setState('on');getMic();
        }
        if(role==='real'&&L.onData)try{L.onData(d);}catch(e){}
      });
      c.on('close',()=>{if(role==='real')cleanup('對方已離開連線');});
      c.on('error',()=>{if(role==='real')cleanup('連線中斷');});
    });
    peer.on('call',cl=>{cl.answer(micStream||undefined);wireCall(cl);});
    peer.on('error',e=>{
      if(e&&e.type==='unavailable-id')setState('off','房號撞號了，請再建一次');
      else if(state!=='on')setState('off','配對服務連不上（需要網路）');
    });
    peer.on('disconnected',()=>{if(peer&&state!=='off')try{peer.reconnect();}catch(e){}});
    return code;
  }
  function join(codeIn){
    cleanup();isHost=false;code=(codeIn||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
    if(!code){setState('off','請輸入房號');return;}
    if(typeof Peer==='undefined'){setState('off','此環境缺少連線元件');return;}
    setState('wait','正在連上配對服務…');
    peer=newPeer(undefined);
    peer.on('open',()=>{
      setState('joining','正在連到房主…');
      const c=peer.connect('hp2'+code,{reliable:true});
      wireConn(c);
      setTimeout(()=>{if(state==='joining')cleanup('連不到房主（檢查房號，或雙方網路防火牆太嚴）');},12000);
    });
    peer.on('call',cl=>{cl.answer(micStream||undefined);wireCall(cl);});
    peer.on('error',e=>{
      if(e&&e.type==='peer-unavailable')cleanup('找不到這個房號');
      else if(state!=='on')cleanup('配對服務連不上（需要網路）');
    });
  }
  /* ---------- 手動連線：不經配對服務，連線資訊壓成短碼由玩家自己傳 ---------- */
  let mpc=null,manual=false;
  const b64=u8=>btoa(String.fromCharCode.apply(null,u8)).replace(/=+$/,'');
  const unb64=t=>{const b=atob(t),u=[];for(let i=0;i<b.length;i++)u.push(b.charCodeAt(i));return u;};
  // SDP → 短碼：只留 ICE 帳密、DTLS 指紋、區網 UDP 位址
  function packSdp(sdp,kind){
    const get=re=>{const m=re.exec(sdp);return m?m[1].trim():'';};
    const uf=get(/a=ice-ufrag:(.+)/),pw=get(/a=ice-pwd:(.+)/),fp=get(/a=fingerprint:sha-256 (.+)/i),su=get(/a=setup:(.+)/);
    if(!uf||!pw||!fp)return null;
    const fpb=b64(fp.split(':').map(h=>parseInt(h,16)));
    const cs=[],seen={};
    sdp.split(/\r?\n/).forEach(l=>{
      const m=/^a=candidate:\S+ 1 udp \d+ (\S+) (\d+) typ host/i.exec(l);
      if(!m||m[1].indexOf(':')>=0)return;
      const k=m[1].replace(/\.local$/,'')+':'+m[2];
      if(!seen[k]&&cs.length<4){seen[k]=1;cs.push(k);}
    });
    if(!cs.length)return null;
    return 'HP'+kind+'~'+uf+'~'+pw+'~'+fpb+'~'+(su==='passive'?'p':su==='active'?'a':'x')+'~'+cs.join(',');
  }
  function unpackSdp(code){
    const t=(''+code).replace(/\s+/g,'').split('~');
    if(t.length<6||!/^HP[OA]$/.test(t[0]))return null;
    let fp;try{fp=unb64(t[3]).map(v=>('0'+v.toString(16)).slice(-2).toUpperCase()).join(':');}catch(e){return null;}
    if(fp.length!==95)return null;
    const setup=t[4]==='p'?'passive':t[4]==='a'?'active':'actpass';
    let c='';
    t[5].split(',').forEach((k,i)=>{
      const j=k.lastIndexOf(':');if(j<1)return;
      let ad=k.slice(0,j);const po=k.slice(j+1);
      if(!/^\d+\.\d+\.\d+\.\d+$/.test(ad))ad+='.local';
      c+='a=candidate:'+(i+1)+' 1 udp '+(2122260223-i)+' '+ad+' '+po+' typ host generation 0\r\n';
    });
    const sdp='v=0\r\no=- 4611731400430051336 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\na=msid-semantic: WMS\r\n'+
      'm=application 9 UDP/DTLS/SCTP webrtc-datachannel\r\nc=IN IP4 0.0.0.0\r\n'+c+
      'a=ice-ufrag:'+t[1]+'\r\na=ice-pwd:'+t[2]+'\r\na=ice-options:trickle\r\na=fingerprint:sha-256 '+fp+'\r\na=setup:'+setup+'\r\na=mid:0\r\na=sctp-port:5000\r\na=max-message-size:262144\r\n';
    return {type:t[0]==='HPO'?'offer':'answer',sdp};
  }
  function gathered(pc){
    return new Promise(res=>{
      if(pc.iceGatheringState==='complete')return res();
      const to=setTimeout(res,3500);
      pc.addEventListener('icegatheringstatechange',()=>{if(pc.iceGatheringState==='complete'){clearTimeout(to);res();}});
    });
  }
  // 把 RTCDataChannel 包成跟 PeerJS 連線一樣的介面（open/send/close）
  function wrapDc(dc,main){
    const w={open:false,peer:'manual',send:o=>dc.send(JSON.stringify(o)),close:()=>{try{dc.close();}catch(e){}}};
    dc.onopen=()=>{w.open=true;if(main){conn=w;setState('on');}else fast=w;};
    dc.onmessage=ev=>{let d;try{d=JSON.parse(ev.data);}catch(e){return;}if(L.onData)try{L.onData(d);}catch(e){}};
    dc.onclose=()=>{w.open=false;if(main){if(conn===w&&state==='on')cleanup('對方已離開連線');}else if(fast===w)fast=null;};
    return w;
  }
  function newManualPc(){
    cleanup();manual=true;
    const pc=new RTCPeerConnection({iceServers:[]});mpc=pc;
    pc.onconnectionstatechange=()=>{
      if(mpc!==pc)return;
      if(pc.connectionState==='failed')cleanup(state==='on'?'連線中斷':'連不上對方：請確認兩台裝置在同一個 WiFi／區網');
    };
    return pc;
  }
  // 房主：產生連線碼 → 給對方 → 再輸入對方回傳的回覆碼
  async function manualHost(){
    if(typeof RTCPeerConnection==='undefined')throw new Error('此瀏覽器不支援直連');
    const pc=newManualPc();isHost=true;code='手動';
    wrapDc(pc.createDataChannel('main',{ordered:true}),true);
    wrapDc(pc.createDataChannel('fast',{ordered:false,maxRetransmits:0}),false);
    setState('hosting');
    await pc.setLocalDescription(await pc.createOffer());
    await gathered(pc);
    if(mpc!==pc)throw new Error('已取消');
    const c=packSdp(pc.localDescription.sdp,'O');
    if(!c){cleanup('找不到區網位址：這台裝置好像沒有連上 WiFi／區網');throw new Error('no candidate');}
    return c;
  }
  async function manualAccept(ans){
    const d=unpackSdp(ans);
    if(!mpc||!d||d.type!=='answer')throw new Error('這不是回覆碼');
    await mpc.setRemoteDescription(d);
  }
  // 加入者：輸入房主的連線碼 → 產生回覆碼給房主
  async function manualJoin(offer){
    if(typeof RTCPeerConnection==='undefined')throw new Error('此瀏覽器不支援直連');
    const d=unpackSdp(offer);
    if(!d||d.type!=='offer')throw new Error('這不是房主的連線碼');
    const pc=newManualPc();isHost=false;code='手動';
    pc.ondatachannel=ev=>{wrapDc(ev.channel,ev.channel.label==='main');};
    setState('joining','');
    await pc.setRemoteDescription(d);
    await pc.setLocalDescription(await pc.createAnswer());
    await gathered(pc);
    if(mpc!==pc)throw new Error('已取消');
    const c=packSdp(pc.localDescription.sdp,'A');
    if(!c){cleanup('找不到區網位址：這台裝置好像沒有連上 WiFi／區網');throw new Error('no candidate');}
    return c;
  }
  function send(o,quick){
    if(quick&&fast&&fast.open){try{fast.send(o);return;}catch(e){}}
    if(conn&&conn.open)try{conn.send(o);}catch(e){}
  }
  function cleanup(msg){
    if(mpc){const p0=mpc;mpc=null;try{p0.close();}catch(e){}}
    manual=false;
    try{if(fast)fast.close();}catch(e){}fast=null;
    try{if(conn)conn.close();}catch(e){}
    try{if(call)call.close();}catch(e){}
    try{if(peer)peer.destroy();}catch(e){}
    if(micStream){try{micStream.getTracks().forEach(t=>t.stop());}catch(e){}}
    if(remoteAudio)remoteAudio.srcObject=null;
    conn=null;call=null;peer=null;micStream=null;micOk=false;
    const was=state;state='off';
    if(was!=='off')setState('off',msg||'');
  }
  function toggleMute(){
    muted=!muted;
    if(micStream)micStream.getAudioTracks().forEach(t=>t.enabled=!muted);
    return muted;
  }
  function probe(codes,cb){
    if(state!=='off'||!codes||!codes.length||typeof Peer==='undefined')return;
    let tp=null;
    try{tp=newPeer(undefined);}catch(e){return;}
    const done=new Set();
    tp.on('open',()=>{
      codes.forEach(cd=>{
        try{
          const c=tp.connect('hp2'+cd,{reliable:true});
          c.on('open',()=>{try{c.send({t:'probe'});}catch(e){}});
          c.on('data',d=>{if(d&&d.t==='alive'&&!done.has(cd)){done.add(cd);try{cb(cd,true);}catch(e){}}try{c.close();}catch(e){}});
        }catch(e){}
      });
    });
    tp.on('error',e=>{
      if(e&&e.type==='peer-unavailable'){
        const m=/hp2([A-Z0-9]+)/.exec(e.message||'');
        if(m&&!done.has(m[1])){done.add(m[1]);try{cb(m[1],false);}catch(e2){}}
      }
    });
    setTimeout(()=>{try{tp.destroy();}catch(e){}},9000);
  }
  async function enableVoice(){
    if(manual)return false;
    await getMic();
    if(micStream&&peer&&conn&&conn.open){const cl=peer.call(conn.peer,micStream);wireCall(cl);}
    return micOk;
  }
  return {host,join,send,manualHost,manualAccept,manualJoin,isManual:()=>manual,_pack:packSdp,_unpack:unpackSdp,leave:()=>cleanup('已離開連線'),toggleMute,enableVoice,probe,
    state:()=>state,fast:()=>!!(fast&&fast.open),code:()=>code,isHost:()=>isHost,muted:()=>muted,micOk:()=>micOk,
    on:(k,f)=>{L[k]=f;}};
})();
