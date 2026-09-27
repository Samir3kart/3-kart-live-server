# TikTok 3 Kart LIVE

## İşə salmaq
1. Node.js quraşdırılmış kompüterdə bu qovluqda terminal aç.
2. `npm install`
3. `npm start`
4. Brauzerdə `http://localhost:3000`

Render üçün:
- Build Command: `npm install`
- Start Command: `npm start`

## Parfum test etmək
Brauzer/terminaldan:
POST `/api/gift`
JSON:
`{"gift":"Parfum","user":"Samir"}`

Bu endpoint real TikTok bağlantısının özü deyil; TikTok-dan gələn hədiyyə hadisəsini serverə ötürən inteqrasiya qatının qoşulması lazımdır.

## Oyun
Parfum -> iştirakçı əlavə olunur -> 3 bağlı kart -> RAUND BAŞLA -> KARTLARI AÇ -> xallar hesablanır.
