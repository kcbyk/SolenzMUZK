# MYT Müzik Klonu

YouTube içeriklerine erişim sağlayan, Android APK olarak dağıtılan müzik uygulaması. React Native + Expo mobil istemci ve Node.js + Express backend'inden oluşur.

---

## Proje Yapısı

```
myt-clone/
├── mobile/          # React Native + Expo mobil uygulama (Android APK)
│   ├── app/         # Expo Router ekranları (file-based routing)
│   ├── components/  # Yeniden kullanılabilir UI bileşenleri
│   ├── store/       # Zustand global state (auth, player, download)
│   ├── services/    # API istemcisi ve servis katmanları
│   ├── hooks/       # Custom React hook'ları
│   └── tsconfig.json
│
├── backend/         # Node.js + Express + TypeScript API sunucusu
│   ├── src/
│   │   ├── controllers/  # HTTP istek yöneticileri
│   │   ├── services/     # İş mantığı (yt-dlp, auth, indirme)
│   │   ├── repositories/ # Veritabanı erişim katmanı
│   │   ├── middleware/   # Auth, rate limiter, hata yönetimi
│   │   ├── db/           # PostgreSQL pool ve migration'lar
│   │   └── utils/        # Yardımcı fonksiyonlar
│   └── tsconfig.json
│
├── package.json     # npm workspaces kök yapılandırması
├── tsconfig.json    # Paylaşılan TypeScript temel yapılandırması
├── .gitignore
├── .editorconfig
└── README.md
```

---

## Mimari

| Katman | Teknoloji | Açıklama |
|--------|-----------|----------|
| Mobil istemci | React Native + Expo | Android APK, `eas build` ile derlenir |
| Backend API | Node.js + Express | Render.com Docker container |
| İçerik kaynağı | yt-dlp (Python CLI) | Arama, stream URL alma |
| Medya oynatma | `react-native-track-player` | Arka plan ses çalma |
| Video oynatma | `expo-video` | İçerik oynatma |
| İndirme | `expo-file-system` | Cihaza yerel kayıt |
| Veritabanı | PostgreSQL (Render.com) | Kullanıcı, playlist, indirme meta verisi |
| Token yönetimi | `expo-secure-store` | Android Keystore şifreli depolama |

---

## Geliştirme Ortamı

### Gereksinimler

- Node.js 20+
- npm 10+
- Docker & Docker Compose (backend yerel geliştirme)
- Expo CLI veya EAS CLI (mobil)

### Kurulum

```bash
# Bağımlılıkları yükle (tüm workspace'ler)
npm install

# Backend geliştirme sunucusunu başlat (Docker Compose ile)
cd backend
docker compose up

# Mobil uygulamayı başlat
cd mobile
npx expo start
```

### Testler

```bash
# Tüm workspace'lerde testleri çalıştır
npm test

# Yalnızca backend testleri
npm test --workspace=backend

# Yalnızca mobil testler
npm test --workspace=mobile
```

---

## Dağıtım

### Backend (Render.com)

`backend/` dizininde `Dockerfile` bulunur. Render.com üzerinde Docker servisi olarak deploy edilir. `render.yaml` dosyası servis yapılandırmasını içerir.

### Mobil (EAS Build)

```bash
# APK derle (önizleme profili)
cd mobile
eas build --platform android --profile preview
```

---

## Ortam Değişkenleri

`backend/.env.example` dosyasını kopyalayın:

```bash
cp backend/.env.example backend/.env
```

| Değişken | Açıklama |
|----------|----------|
| `DATABASE_URL` | PostgreSQL bağlantı URL'si |
| `JWT_SECRET` | Access token imzalama anahtarı |
| `JWT_REFRESH_SECRET` | Refresh token imzalama anahtarı |
| `PORT` | Sunucu port (varsayılan: 3000) |

---

## Özellikler

- YouTube içerik arama (Türkçe karakter desteği)
- Trend içerikler ve kanal sayfaları
- Arka planda ses çalma (Android media session)
- MP3/AAC/MP4 indirme (cihaza yerel)
- Kişisel playlist yönetimi
- Kullanıcı kimlik doğrulama (e-posta + şifre)
