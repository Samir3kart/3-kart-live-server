# 3 Kart LIVE — təmiz versiya

Bu versiya Node.js + Express + Socket.IO + TikTok LIVE Connector ilə hazırlanıb.

## İş prinsipi
1. TikTok LIVE username Render Environment Variable kimi verilir.
2. LIVE zamanı `Parfum` hədiyyəsi gələndə göndərən avtomatik iştirakçı olur.
3. Maksimum 12 iştirakçı var.
4. Hər iştirakçıya 3 gizli kart verilir.
5. `Raundu başlat` düyməsi vurulanda kartlar açılır və xallar hesablanır.
6. Ən yüksək toplam xal qalib kimi göstərilir.
7. `Test: Parfum` düyməsi TikTok-a qoşulmadan sistemi yoxlamaq üçündür.

## Render
Build Command:
npm install

Start Command:
npm start

Environment Variables:
TIKTOK_USERNAME = sənin TikTok username-in (@ işarəsi olmadan)
GIFT_NAME = Parfum

Health:
https://SƏNİN-SAYTIN.onrender.com/health

Qeyd: TikTok LIVE hədiyyə oxuma hissəsi rəsmi TikTok API deyil; `tiktok-live-connector` TikTok-un webcast axınından istifadə edən qeyri-rəsmi kitabxanadır. TikTok protokol dəyişiklikləri bu hissəyə təsir edə bilər.
