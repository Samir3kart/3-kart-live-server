const express=require("express");
const http=require("http");
const {Server}=require("socket.io");
const cors=require("cors");
const path=require("path");

const app=express();
const server=http.createServer(app);
const io=new Server(server,{cors:{origin:"*"}});
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname,"public")));

const MAX=12;
let players=[];
let round=1;
let running=false;

function cleanName(n){return String(n||"Qonaq").trim().slice(0,24)||"Qonaq";}
function makePlayer(name){
  return {
    id:Date.now().toString(36)+Math.random().toString(36).slice(2,7),
    name:cleanName(name), gift:"Parfum", score:0,
    cards:[null,null,null], joinedAt:Date.now()
  };
}
function state(){return {players,round,running,max:MAX};}
function broadcast(){io.emit("state",state());}

app.get("/api/state",(req,res)=>res.json(state()));

/* Demo/test endpoint.
   Real TikTok gift webhook/integration can call:
   POST /api/gift {"gift":"Parfum","user":"username"}
*/
app.post("/api/gift",(req,res)=>{
  const gift=String(req.body.gift||"").toLowerCase();
  const user=cleanName(req.body.user||"TikTok User");
  if(gift!=="parfum") return res.json({ok:true,joined:false,reason:"gift_not_parfum"});
  if(players.length>=MAX) return res.json({ok:false,joined:false,reason:"room_full"});
  const p=makePlayer(user);
  players.push(p);
  broadcast();
  res.json({ok:true,joined:true,player:p});
});

app.post("/api/reset",(req,res)=>{
  players=[]; round=1; running=false; broadcast(); res.json({ok:true});
});

app.post("/api/start-round",(req,res)=>{
  if(players.length===0) return res.status(400).json({ok:false,error:"No players"});
  running=true;
  players=players.map(p=>({...p,cards:[null,null,null]}));
  const deck=[0,1,2,3,4,5,6,7,8,9,10,20,30,50,100,-10];
  players=players.map(p=>{
    const cards=[0,1,2].map(()=>deck[Math.floor(Math.random()*deck.length)]);
    return {...p,cards};
  });
  broadcast(); res.json({ok:true});
});

app.post("/api/reveal",(req,res)=>{
  if(!running) return res.status(400).json({ok:false,error:"Round not started"});
  players=players.map(p=>({...p,score:p.score+p.cards.reduce((a,b)=>a+b,0)}));
  running=false;
  round++;
  broadcast(); res.json({ok:true});
});

io.on("connection",socket=>{
  socket.emit("state",state());
});

app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));

const PORT=process.env.PORT||3000;
server.listen(PORT,()=>console.log("3 Kart Live server running on "+PORT));
