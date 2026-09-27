const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;
const MAX_PLAYERS = 12;
const ENTRY_GIFT = "Parfüm";

app.use(cors());
app.use(express.json({ limit: "100kb" }));
app.use(express.static(path.join(__dirname, "public")));

let waiting = [];
let round = {
  number: 0,
  status: "waiting",
  startedAt: null,
  results: [],
  winner: null
};
const clients = new Set();

const RANKS = ["6","7","8","9","10","J","Q","K","A"];
const SUITS = ["♠","♥","♦","♣"];

function normalizeName(value) {
  if (value == null) return "";
  if (typeof value === "string") return value.replace(/^@/, "").trim().slice(0, 40);
  return String(
    value.nickname ?? value.uniqueId ?? value.unique_id ?? value.username ??
    value.user?.nickname ?? value.user?.uniqueId ?? value.user?.username ?? ""
  ).replace(/^@/, "").trim().slice(0, 40);
}

function giftIsParfum(name) {
  const s = String(name ?? "").toLowerCase().trim();
  return s === "parfüm" || s === "parfum" || s.includes("parfüm") || s.includes("parfum");
}

function cardValue(rank) {
  if (rank === "A") return 11;
  if (["10","J","Q","K"].includes(rank)) return 10;
  return Number(rank);
}

function makeDeck() {
  const deck = [];
  for (const suit of SUITS) for (const rank of RANKS) deck.push({ suit, rank });
  return deck;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function scoreHand(cards) {
  const ranks = cards.map(c => c.rank);
  if (new Set(ranks).size === 1) {
    const special = { "6":32, "7":21, "8":24, "9":27, "10":30, "J":30, "Q":30, "K":30, "A":33 };
    return special[ranks[0]];
  }
  const bySuit = {};
  for (const c of cards) bySuit[c.suit] = (bySuit[c.suit] || 0) + cardValue(c.rank);
  const suitTotals = Object.values(bySuit);
  if (suitTotals.length < 3) return Math.max(...suitTotals);
  return Math.max(...cards.map(c => cardValue(c.rank)));
}

function publicState() {
  return {
    ok: true,
    players: waiting.map((p, i) => ({
      id: p.id,
      name: p.name,
      joinedAt: p.joinedAt,
      cards: p.cards ? p.cards : null
    })),
    count: waiting.length,
    max_players: MAX_PLAYERS,
    entry_gift: ENTRY_GIFT,
    round: {
      number: round.number,
      status: round.status,
      startedAt: round.startedAt,
      winner: round.winner,
      results: round.results
    }
  };
}

function broadcast() {
  const payload = `data: ${JSON.stringify(publicState())}\n\n`;
  for (const res of clients) {
    try { res.write(payload); } catch (_) {}
  }
}

function addPlayer(name) {
  name = normalizeName(name);
  if (!name) return { ok:false, error:"Oyunçu adı boşdur." };
  if (waiting.length >= MAX_PLAYERS) return { ok:false, error:"12 oyunçu limiti doludur." };
  if (waiting.some(p => p.name.toLowerCase() === name.toLowerCase())) {
    return { ok:false, error:"Bu oyunçu artıq növbədədir." };
  }
  const player = {
    id: `p_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
    name,
    joinedAt: new Date().toISOString(),
    cards: null
  };
  waiting.push(player);
  broadcast();
  return { ok:true, player, state:publicState() };
}

app.get("/", (req,res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/health", (req,res) => {
  res.json({
    ok:true,
    service:"3-kart-tiktok-server-live",
    status:"live",
    players:waiting.length,
    max_players:MAX_PLAYERS,
    entry_gift:ENTRY_GIFT,
    time:new Date().toISOString()
  });
});

app.get("/api/state", (req,res) => res.json(publicState()));

app.get("/api/events", (req,res) => {
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
  clients.add(res);
  res.write(`data: ${JSON.stringify(publicState())}\n\n`);
  const heartbeat = setInterval(() => {
    try { res.write(`: heartbeat ${Date.now()}\n\n`); } catch (_) {}
  }, 15000);
  req.on("close", () => {
    clearInterval(heartbeat);
    clients.delete(res);
  });
});

app.post("/api/gift", (req,res) => {
  const giftName = req.body?.gift_name ?? req.body?.giftName ?? req.body?.gift?.name ?? "";
  const username = normalizeName(req.body?.username ?? req.body?.nickname ?? req.body?.uniqueId ?? req.body?.user);
  if (!giftIsParfum(giftName)) {
    return res.status(400).json({ok:false, error:`Yalnız ${ENTRY_GIFT} oyuna giriş hədiyyəsidir.`});
  }
  if (!username) return res.status(400).json({ok:false,error:"username tələb olunur."});
  const result = addPlayer(username);
  if (!result.ok) return res.status(409).json(result);
  return res.json({ok:true, event:"gift", gift_name:ENTRY_GIFT, ...result});
});

app.post("/api/player", (req,res) => {
  const result = addPlayer(req.body?.username ?? req.body?.name);
  if (!result.ok) return res.status(409).json(result);
  res.json(result);
});

app.post("/api/round/start", (req,res) => {
  if (round.status === "running") return res.status(409).json({ok:false,error:"Raund artıq başlayıb."});
  if (!waiting.length) return res.status(400).json({ok:false,error:"Əvvəl Parfüm göndərən oyunçu olmalıdır."});

  const deck = shuffle(makeDeck());
  waiting.forEach((p, i) => {
    p.cards = [deck[i*3], deck[i*3+1], deck[i*3+2]];
  });

  const results = waiting.map(p => ({
    id:p.id,
    name:p.name,
    cards:p.cards,
    score:scoreHand(p.cards)
  }));
  results.sort((a,b) => b.score - a.score);
  const winner = results[0];

  round.number += 1;
  round.status = "finished";
  round.startedAt = new Date().toISOString();
  round.results = results;
  round.winner = {id:winner.id,name:winner.name,score:winner.score,cards:winner.cards};

  // Keep results visible in the current round, then clear the queue only when reset is called.
  broadcast();
  res.json({ok:true,state:publicState()});
});

app.post("/api/round/reset", (req,res) => {
  waiting = [];
  round.status = "waiting";
  round.startedAt = null;
  round.results = [];
  round.winner = null;
  broadcast();
  res.json({ok:true,state:publicState()});
});

app.post("/api/round/clear", (req,res) => {
  waiting = [];
  round.status = "waiting";
  round.startedAt = null;
  round.results = [];
  round.winner = null;
  broadcast();
  res.json({ok:true,state:publicState()});
});

app.use((req,res) => {
  res.status(404).json({error:"Not found"});
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`3 Kart server running on port ${PORT}`);
});
