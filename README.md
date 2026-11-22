# Mamis Borsa

React + Vite (client) ve Express + SQLite (server) uygulaması. Varlıklarım sayfasında
Three.js ile etkileşimli 3D ev ve Clash of Clans tarzı sürükle-bırak eşya yerleşimi var.

## Yerel geliştirme

```bash
npm install
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:3001

## Render dağıtımı

**Web Service** için:

- Build Command: `npm install && npm run build`
- Start Command: `npm start`

`postinstall` server ve client bağımlılıklarını kurar. `npm start` Express API sunucusunu
başlatır. Client `dist/` çıktısı statik olarak da sunulabilir (opsiyonel).

Not: `node_modules`, `dist` ve `*.db` dosyaları repo'ya dahil değildir; veritabanı sunucu
ilk açılışta otomatik oluşturulur.

## 3D ev

- `client/src/components/House3D/` — sahne, kamera kontrolleri, yerleşim mantığı.
- Eşya konumları Firebase Realtime Database'de (`layouts/<userId>`) saklanır; erişim
  kuralları izin vermezse yerel API yedeği kullanılır.
- Firebase Storage kullanılmaz.
