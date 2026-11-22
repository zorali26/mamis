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

## Canlı dağıtım (önerilen)

GitHub Pages **statik** sunar; Express API orada çalışmaz. Bu yüzden:

### 1) Render → API (Web Service)

- Runtime: **Node** (Docker seçmene gerek yok)
- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Environment: `JWT_SECRET=uzun-rastgele-bir-anahtar`
- Service URL örn: `https://mamis-api.onrender.com`

`npm start` Express'i başlatır ve `client/dist` varsa arayüzü de aynı servisten sunar
(yani tek Render servisi bile yeterli olur).

### 2) GitHub Pages → arayüz

- Repo **Settings → Pages → Source: GitHub Actions**
- Repo **Settings → Variables → Actions** altına `VITE_API_URL` ekle:
  `https://mamis-api.onrender.com/api`
- GitHub web arayüzünden **Add file → Create new file** ile `.github/workflows/deploy.yml`
  oluştur ve `docs/github-pages-workflow.yml` içeriğini yapıştır (commit et).
  Not: mevcut OAuth token'da `workflow` scopes olmadığı için bu dosya otomatik push edilemiyor.
- `main` branch'e push atınca workflow client'ı build edip Pages'e yayınlar.
  Adres: `https://zorali26.github.io/mamis/#/`

Client HashRouter kullanır, böylece sayfa yenileme/linkler Pages'te çalışır.
`VITE_API_URL` boş olursa istekler `/api`'ye gider ve Pages'te çalışmaz — mutlaka set et.

Not: Render ücretsiz planında SQLite dosyası kalıcı değildir (restart'da sıfırlanabilir).
Kalıcı veri için Firebase RTDB kurallarını/auth'u açmak veya ücretli disk gerekir.
`node_modules`, `dist` ve `*.db` repo'ya dahil değildir; DB ilk açılışta oluşur.

## Cüzdan ve admin

- Kur: **50 MC = 1 TL**. Minimum yatırım 20 TL, minimum çekim 50 TL.
- Admin yetkisi vermek için: `npm run admin -- kullanci@email.com` (server klasöründe).
- Admin paneli `/admin` adresinde; borsa fiyatı/volatilite/aktiflik, zamanlı fiyat değişimi,
  kullanıcı bakiyesi/rolü ve işlem geçmişi canlı olarak yönetilir.

## 3D ev

- `client/src/components/House3D/` — sahne, kamera kontrolleri, yerleşim mantığı.
- Eşya konumları Firebase Realtime Database'de (`layouts/<userId>`) saklanır; erişim
  kuralları izin vermezse yerel API yedeği kullanılır.
- Firebase Storage kullanılmaz.
