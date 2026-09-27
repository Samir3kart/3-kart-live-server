# 3 Kart TikTok LIVE — Render Ready

Bu paket Render Web Service üçün hazırdır.

## Render
- Build Command: `npm install`
- Start Command: `npm start`
- Environment: Node
- Port: server `process.env.PORT` istifadə edir.

## Test
Saytı açdıqdan sonra:
1. Ad yaz.
2. `🎁 Parfüm — qoş` bas.
3. 1-12 iştirakçı əlavə et.
4. `▶ RAUNDU BAŞLAT` bas.
5. Raund başlayanda bütün iştirakçıların 3 kartı açılır və qalib hesablanır.

## API
- `GET /` — oyun səhifəsi
- `GET /health` — server sağlamlıq yoxlaması
- `GET /api/state` — cari vəziyyət
- `GET /api/events` — SSE canlı hadisə axını
- `POST /api/gift` — Parfüm hədiyyəsi ilə oyunçu əlavə edir
  - JSON: `{"gift_name":"Parfüm","username":"istifadeci"}`
- `POST /api/round/start` — raundu başlayır
- `POST /api/round/reset` — yeni raund

Qeyd: TikTok-un real GiftEvent axını ayrıca TikTok LIVE connector/bridge tərəfindən `/api/gift` endpoint-inə göndərilməlidir. Bu paket test üçün həmin endpoint-i də hazır saxlayır.
