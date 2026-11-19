'use strict';
/* ===== 連線同玩：WebRTC P2P（資料+語音），房號制訊號交換 ===== */
const NET=(function(){
  let peer=null,conn=null,call=null,micStream=null,remoteAudio=null;
  let state='off',code='',isHost=false,muted=false,micOk=false;
  const L={onState:null,onData:null};
  const CH='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  function mkCode(){let c='';for(let i=0;i<5;i++)c+=CH[(Math.random()*CH.length)|0];return c;}
  function setState(s,msg){state=s;if(L.onState)try{L.onState(s,msg||'');}catch(e){}}
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
    peer.on('connection',c=>{if(conn&&conn.open){c.close();return;}wireConn(c);});
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
  function send(o){if(conn&&conn.open)try{conn.send(o);}catch(e){}}
  function cleanup(msg){
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
  return {host,join,send,leave:()=>cleanup('已離開連線'),toggleMute,
    state:()=>state,code:()=>code,isHost:()=>isHost,muted:()=>muted,micOk:()=>micOk,
    on:(k,f)=>{L[k]=f;}};
})();
