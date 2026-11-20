'use strict';
/* ===== 連線同玩：WebRTC（資料+語音）。房主是中心，最多 4 人（房主＋3），可中途加入 =====
   房主端：links = 每位加入者一條連線；最後一人離開後房間仍開著（state 回到 hosting）
   加入端：只連房主，其他玩家的資料由房主轉送 */
const NET=(function(){
  let peer=null,conn=null,fast=null,micStream=null;
  let state='off',code='',isHost=false,muted=false,micOk=false,myId=0,manual=false;
  const MAXC=3;
  const links=new Map();let nextPid=1;
  const calls=[],audios=[];
  const L={onState:null,onData:null,onPeer:null};
  const CH='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  function mkCode(){let c='';for(let i=0;i<5;i++)c+=CH[(Math.random()*CH.length)|0];return c;}
  function setState(s,msg){state=s;if(L.onState)try{L.onState(s,msg||'');}catch(e){if(/nettest/.test(location.hash))document.title='NETERR '+(e&&e.message);}}
  function up(d,pid){if(L.onData)try{L.onData(d,pid);}catch(e){}}
  function peerEvt(pid,on){if(L.onPeer)try{L.onPeer(pid,on);}catch(e){}}
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
    calls.push(cl);
    cl.on('stream',st=>{
      const a=document.createElement('audio');a.autoplay=true;a.style.display='none';document.body.appendChild(a);audios.push(a);
      a.srcObject=st;if(a.play)a.play().catch(()=>{});
      setState(state,'🔊 語音已接通');
    });
    cl.on('error',()=>{});
  }
  /* ---------- 房主端：加入/離開 ---------- */
  function addLink(lk){
    lk.pid=nextPid++;links.set(lk.pid,lk);
    try{lk.conn.send({t:'you',id:lk.pid});}catch(e){}
    if(state!=='on')setState('on');
    peerEvt(lk.pid,true);
    return lk;
  }
  function dropLink(lk){
    if(!lk||!links.has(lk.pid))return;
    links.delete(lk.pid);
    try{if(lk.fast)lk.fast.close();}catch(e){}
    try{lk.conn.close();}catch(e){}
    try{if(lk.pc)lk.pc.close();}catch(e){}
    peerEvt(lk.pid,false);
    if(!links.size&&state==='on')setState('hosting','');
  }
  /* ---------- 加入端：連到房主 ---------- */
  function clientData(d){
    if(d&&d.t==='you'){myId=d.id|0;return;}
    if(d&&d.t==='full'){cleanup('房間已滿（最多 '+(MAXC+1)+' 人）');return;}
    up(d,0);
  }
  function wireConn(c){
    conn=c;
    c.on('open',async()=>{
      setState('on');
      try{
        if(peer){
          const f=peer.connect(c.peer,{reliable:false,label:'fast',serialization:'json'});
          f.on('open',()=>{fast=f;});
          f.on('data',clientData);
          f.on('close',()=>{if(fast===f)fast=null;});
          f.on('error',()=>{if(fast===f)fast=null;});
        }
      }catch(e){}
      await getMic();
      if(micStream&&peer&&conn===c){const cl=peer.call(c.peer,micStream);wireCall(cl);}
    });
    c.on('data',clientData);
    c.on('close',()=>{if(conn===c)cleanup('房主已離開，連線結束');});
    c.on('error',()=>{if(conn===c)cleanup('連線中斷');});
  }
  function host(forced){
    cleanup();isHost=true;code=(forced||mkCode()).toUpperCase();
    if(typeof Peer==='undefined'){setState('off','此環境缺少連線元件');return code;}
    setState('wait','正在連上配對服務…');
    peer=newPeer('hp2'+code);
    peer.on('open',()=>{if(state==='wait')setState('hosting');getMic();});
    peer.on('connection',c=>{
      if(c.label==='fast'){
        const find=()=>{for(const lk of links.values())if(lk.peerId===c.peer)return lk;return null;};
        c.on('open',()=>{const lk=find();if(lk)lk.fast=c;});
        c.on('data',d=>{const lk=find();if(lk){lk.fast=c;up(d,lk.pid);}});
        c.on('close',()=>{const lk=find();if(lk&&lk.fast===c)lk.fast=null;});
        c.on('error',()=>{const lk=find();if(lk&&lk.fast===c)lk.fast=null;});
        return;
      }
      let role=null,lk=null;
      c.on('data',d=>{
        if(role==='probe')return;
        if(!role){
          if(d&&d.t==='probe'){role='probe';try{c.send({t:'alive',n:links.size+1});}catch(e){}setTimeout(()=>{try{c.close();}catch(e){}},400);return;}
          if(links.size>=MAXC){role='probe';try{c.send({t:'full'});}catch(e){}setTimeout(()=>{try{c.close();}catch(e){}},300);return;}
          role='real';lk=addLink({conn:c,fast:null,peerId:c.peer});getMic();
        }
        if(role==='real')up(d,lk.pid);
      });
      c.on('close',()=>{if(role==='real')dropLink(lk);});
      c.on('error',()=>{if(role==='real')dropLink(lk);});
    });
    peer.on('call',cl=>{cl.answer(micStream||undefined);wireCall(cl);});
    peer.on('error',e=>{
      if(e&&e.type==='unavailable-id')setState('off','房號撞號了，請再建一次');
      else if(state==='wait')setState('off','配對服務連不上（需要網路）');
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
  function wrapDc(dc){
    const w={open:false,peer:'manual',send:o=>dc.send(JSON.stringify(o)),close:()=>{try{dc.close();}catch(e){}},dc};
    return w;
  }
  let mpend=null,mpc=null;   // mpend：房主正在等回覆碼的那一條；mpc：加入端的連線
  // 房主：產生連線碼 → 給對方 → 再輸入對方回傳的回覆碼。可重複呼叫讓更多人加入
  async function manualHost(){
    if(typeof RTCPeerConnection==='undefined')throw new Error('此瀏覽器不支援直連');
    if(!(isHost&&manual&&state!=='off')){cleanup();isHost=true;manual=true;code='手動';setState('hosting');}
    if(links.size>=MAXC)throw new Error('房間已滿');
    if(mpend){try{mpend.pc.close();}catch(e){}mpend=null;}
    const pc=new RTCPeerConnection({iceServers:[]});
    const P={pc,lk:null};mpend=P;
    const mw=wrapDc(pc.createDataChannel('main',{ordered:true})),fw=wrapDc(pc.createDataChannel('fast',{ordered:false,maxRetransmits:0}));
    mw.dc.onopen=()=>{mw.open=true;if(mpend===P)mpend=null;P.lk=addLink({conn:mw,fast:null,pc});if(fw.open)P.lk.fast=fw;};
    mw.dc.onmessage=ev=>{let d;try{d=JSON.parse(ev.data);}catch(e){return;}if(P.lk)up(d,P.lk.pid);};
    mw.dc.onclose=()=>{mw.open=false;if(P.lk)dropLink(P.lk);};
    fw.dc.onopen=()=>{fw.open=true;if(P.lk)P.lk.fast=fw;};
    fw.dc.onmessage=mw.dc.onmessage;
    fw.dc.onclose=()=>{fw.open=false;if(P.lk&&P.lk.fast===fw)P.lk.fast=null;};
    pc.onconnectionstatechange=()=>{if(pc.connectionState==='failed'){if(P.lk)dropLink(P.lk);else if(mpend===P){mpend=null;setState(state,'連不上對方：請確認兩台裝置在同一個 WiFi／區網');}}};
    await pc.setLocalDescription(await pc.createOffer());
    await gathered(pc);
    if(mpend!==P)throw new Error('已取消');
    const c=packSdp(pc.localDescription.sdp,'O');
    if(!c){mpend=null;try{pc.close();}catch(e){}throw new Error('找不到區網位址，這台裝置好像沒有連上 WiFi／區網');}
    return c;
  }
  async function manualAccept(ans){
    const d=unpackSdp(ans);
    if(!mpend||!d||d.type!=='answer')throw new Error('這不是回覆碼');
    await mpend.pc.setRemoteDescription(d);
  }
  // 加入者：輸入房主的連線碼 → 產生回覆碼給房主
  async function manualJoin(offer){
    if(typeof RTCPeerConnection==='undefined')throw new Error('此瀏覽器不支援直連');
    const d=unpackSdp(offer);
    if(!d||d.type!=='offer')throw new Error('這不是房主的連線碼');
    cleanup();isHost=false;manual=true;code='手動';
    const pc=new RTCPeerConnection({iceServers:[]});mpc=pc;
    pc.ondatachannel=ev=>{
      const w=wrapDc(ev.channel),main=ev.channel.label==='main';
      ev.channel.onopen=()=>{w.open=true;if(main){conn=w;setState('on');}else fast=w;};
      ev.channel.onmessage=e2=>{let m;try{m=JSON.parse(e2.data);}catch(e){return;}clientData(m);};
      ev.channel.onclose=()=>{w.open=false;if(main){if(conn===w&&state==='on')cleanup('房主已離開，連線結束');}else if(fast===w)fast=null;};
      if(ev.channel.readyState==='open')ev.channel.onopen();
    };
    pc.onconnectionstatechange=()=>{if(mpc===pc&&pc.connectionState==='failed')cleanup(state==='on'?'連線中斷':'連不上對方：請確認兩台裝置在同一個 WiFi／區網');};
    setState('joining','');
    await pc.setRemoteDescription(d);
    await pc.setLocalDescription(await pc.createAnswer());
    await gathered(pc);
    if(mpc!==pc)throw new Error('已取消');
    const c=packSdp(pc.localDescription.sdp,'A');
    if(!c){cleanup('找不到區網位址：這台裝置好像沒有連上 WiFi／區網');throw new Error('no candidate');}
    return c;
  }
  /* ---------- 傳送 ---------- */
  function put(lk,o,quick){
    if(quick&&lk.fast&&lk.fast.open){try{lk.fast.send(o);return;}catch(e){}}
    if(lk.conn&&lk.conn.open)try{lk.conn.send(o);}catch(e){}
  }
  // 加入端→房主；房主→所有人
  function send(o,quick){
    if(isHost){for(const lk of links.values())put(lk,o,quick);return;}
    if(quick&&fast&&fast.open){try{fast.send(o);return;}catch(e){}}
    if(conn&&conn.open)try{conn.send(o);}catch(e){}
  }
  function sendTo(pid,o,quick){const lk=links.get(pid);if(lk)put(lk,o,quick);}
  function sendExcept(pid,o,quick){for(const lk of links.values())if(lk.pid!==pid)put(lk,o,quick);}
  function cleanup(msg){
    if(mpend){try{mpend.pc.close();}catch(e){}mpend=null;}
    if(mpc){const p0=mpc;mpc=null;try{p0.close();}catch(e){}}
    for(const lk of [...links.values()]){try{if(lk.fast)lk.fast.close();}catch(e){}try{lk.conn.close();}catch(e){}try{if(lk.pc)lk.pc.close();}catch(e){}}
    links.clear();nextPid=1;myId=0;manual=false;
    try{if(fast)fast.close();}catch(e){}fast=null;
    try{if(conn)conn.close();}catch(e){}
    calls.forEach(c=>{try{c.close();}catch(e){}});calls.length=0;
    audios.forEach(a=>{try{a.srcObject=null;a.remove();}catch(e){}});audios.length=0;
    try{if(peer)peer.destroy();}catch(e){}
    if(micStream){try{micStream.getTracks().forEach(t=>t.stop());}catch(e){}}
    conn=null;peer=null;micStream=null;micOk=false;
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
          c.on('data',d=>{if(d&&d.t==='alive'&&!done.has(cd)){done.add(cd);try{cb(cd,true,d.n|0);}catch(e){}}try{c.close();}catch(e){}});
        }catch(e){}
      });
    });
    tp.on('error',e=>{
      if(e&&e.type==='peer-unavailable'){
        const m=/hp2([A-Z0-9]+)/.exec(e.message||'');
        if(m&&!done.has(m[1])){done.add(m[1]);try{cb(m[1],false,0);}catch(e2){}}
      }
    });
    setTimeout(()=>{try{tp.destroy();}catch(e){}},9000);
  }
  async function enableVoice(){
    if(manual)return false;
    await getMic();
    if(micStream&&peer&&!isHost&&conn&&conn.open){const cl=peer.call(conn.peer,micStream);wireCall(cl);}
    return micOk;
  }
  function fastOk(){
    if(isHost){for(const lk of links.values())if(lk.fast&&lk.fast.open)return true;return false;}
    return !!(fast&&fast.open);
  }
  return {host,join,send,sendTo,sendExcept,manualHost,manualAccept,manualJoin,isManual:()=>manual,_pack:packSdp,_unpack:unpackSdp,
    leave:()=>cleanup('已離開連線'),toggleMute,enableVoice,probe,
    state:()=>state,fast:fastOk,code:()=>code,isHost:()=>isHost,muted:()=>muted,micOk:()=>micOk,
    myId:()=>myId,count:()=>links.size,max:()=>MAXC+1,pids:()=>[...links.keys()],pendingManual:()=>!!mpend,
    on:(k,f)=>{L[k]=f;}};
})();
