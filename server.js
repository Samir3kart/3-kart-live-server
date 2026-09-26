import express from "express";
import http from "http";
import { Server } from "socket.io";
import { TikTokLiveConnection, WebcastEvent } from "tiktok-live-connector";

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.static(process.cwd()));
app.get("/", (_req, res) => res.sendFile("index.html", { root: process.cwd() }));
app.get("/health", (_req, res) => res.json({ ok: true, service: "3-kart-live" }));

const MAX_PLAYERS = 12;
const GIFT_NAME = (process.env.GIFT_NAME || "Parfum").trim().toLowerCase();
const TIKTOK_USERNAME = (process.env.TIKTOK_USERNAME || "").replace(/^@/, "").trim();

let round = 1;
let state = { connected:false, status:"Gözləyir", players:[], revealed:false, round };

const esc = v => String(v ?? "");
function cardValue(){ return Math.floor(Math.random()*10)+1; }
function makePlayer(username,nickname){
  return { id:esc(username).toLowerCase(), username:esc(username), nickname:esc(nickname)||esc(username), cards:[cardValue(),cardValue(),cardValue()], score:null, gift:"Parfum" };
}
function broadcast(){ io.emit("state", state); }
function addPlayer(username,nickname){
  if(!username || state.revealed || state.players.length>=MAX_PLAYERS) return false;
  const id=esc(username).toLowerCase();
  if(state.players.some(p=>p.id===id)) return false;
  state.players.push(makePlayer(username,nickname));
  state.status=`${state.players.length}/12 iştirakçı`;
  broadcast();
  return true;
}
function resetRound(){
  round += 1;
  state={connected:state.connected,status:"Gözləyir",players:[],revealed:false,round};
  broadcast();
}
function revealRound(){
  if(!state.players.length) return;
  state.revealed=true;
  for(const p of state.players) p.score=p.cards.reduce((a,b)=>a+b,0);
  const max=Math.max(...state.players.map(p=>p.score));
  const winners=state.players.filter(p=>p.score===max);
  state.status=winners.length===1?`Qalib: ${winners[0].nickname}`:`Heç-heçə: ${winners.map(w=>w.nickname).join(", ")}`;
  broadcast();
}

io.on("connection", socket=>{
  socket.emit("state",state);
  socket.on("start-round",()=>{ if(state.players.length) revealRound(); });
  socket.on("reveal",revealRound);
  socket.on("reset",resetRound);
  socket.on("demo-gift",({username,nickname}={})=>addPlayer(username||`demo${Date.now()}`,nickname||username||"Demo"));
});

let tiktok=null; let reconnectTimer=null;
function scheduleReconnect(){
  if(reconnectTimer || !TIKTOK_USERNAME) return;
  reconnectTimer=setTimeout(()=>{ reconnectTimer=null; connectTikTok(); },15000);
}
async function connectTikTok(){
  if(!TIKTOK_USERNAME){ state.status="TikTok username gözləyir"; broadcast(); return; }
  try{
    if(tiktok){ try{ await tiktok.disconnect(); }catch{} }
    tiktok=new TikTokLiveConnection(TIKTOK_USERNAME,{enableExtendedGiftInfo:true,processInitialData:false});
    tiktok.on(WebcastEvent.GIFT,data=>{
      const giftName=String(data?.giftName||data?.gift?.name||data?.extendedGiftInfo?.name||"").trim().toLowerCase();
      if(giftName!==GIFT_NAME) return;
      if(data?.giftType===1 && data?.repeatEnd===true) return;
      const username=data?.user?.uniqueId||data?.uniqueId||"";
      const nickname=data?.user?.nickname||data?.nickname||username;
      addPlayer(username,nickname);
    });
    tiktok.on("connected",()=>{ state.connected=true; state.status="TikTok LIVE qoşuldu"; broadcast(); });
    tiktok.on("disconnected",()=>{ state.connected=false; state.status="TikTok bağlantısı kəsildi"; broadcast(); scheduleReconnect(); });
    tiktok.on("error",err=>{ console.error(err?.message||err); state.connected=false; state.status="TikTok bağlantı xətası"; broadcast(); scheduleReconnect(); });
    await tiktok.connect();
  }catch(err){ console.error("TikTok connect failed:",err?.message||err); state.connected=false; state.status="TikTok LIVE hazır deyil"; broadcast(); scheduleReconnect(); }
}

server.listen(PORT,()=>{ console.log(`3 Kart LIVE running on port ${PORT}`); connectTikTok(); });
