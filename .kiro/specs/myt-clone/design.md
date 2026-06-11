# Design Document: MYT Müzik Klonu

## Overview

MYT Müzik Klonu, yt-dlp kütüphanesi üzerine inşa edilmiş, YouTube içeriklerine erişimi merkezi bir sunucu katmanı üzerinden sağlayan bir **Android uygulamasıdır**. Kullanıcılar YouTube'da arama yapabilir, içerikleri stream olarak dinleyip/izleyebilir, MP3/AAC veya MP4 olarak indirebilir ve kişisel playlist'ler oluşturabilir.

**Platform kararları:**
- **Mobil istemci:** React Native + Expo (APK çıktısı için `eas build`)
- **Backend:** Node.js + Express, **Render.com** üzerinde Docker container olarak deploy edilir; Python + yt-dlp Docker imajına dahildir
- **Veritabanı:** Render.com PostgreSQL servisi
- **İndirme:** Backend stream URL'ini döndürür, React Native tarafında `expo-file-system` ile kullanıcının cihazına indirilir (Render'ın ephemeral dosya sistemine güvenilmez)

**Temel tasarım kararı:** yt-dlp tüm içerik işlemlerini (arama, stream URL alma) **sunucu tarafında** yürütür. İndirilen dosyalar kullanıcının telefonuna kaydedilir, sunucuda tutulmaz. Bu yaklaşım Render ücretsiz plan kısıtlarıyla uyumludur.

### Sistem Geneli Bileşen Diyagramı

```
┌─────────────────────────────────────────────────────────────────┐
│                    MOBİL UYGULAMA (Android APK)                  │
│  React Native + Expo (TypeScript)                               │
│  • Arama, Keşif, Kanal, İndirilenler, Playlist ekranları        │
│  • Ses oynatıcı (react-native-track-player, arka plan çalma)    │
│  • Video oynatıcı (expo-video)                                   │
│  • İndirme: expo-file-system (cihaz depolama)                   │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTPS REST (JSON)
┌──────────────────────▼──────────────────────────────────────────┐
│              API SUNUCUSU — Render.com (Docker)                  │
│  Node.js + Express + TypeScript                                  │
│  Python 3 + yt-dlp (Docker imajında kurulu)                     │
│  • Auth, Search, Stream, Playlist Controller                     │
│  • yt-dlp Service (child_process.spawn)                          │
└──────────┬──────────────────────────────────────────────────────┘
           │
┌──────────▼───────────┐
│  Render PostgreSQL    │
│  • users              │
│  • playlists          │
│  • playlist_items     │
│  • downloads (meta)   │
└──────────────────────┘
```

### Render.com Deployment Yapısı

```dockerfile
# Dockerfile (backend/)
FROM node:20-slim
RUN apt-get update && apt-get install -y python3 python3-pip ffmpeg \
    && pip3 install yt-dlp \
    && apt-get clean
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

---

## Architecture

### Katman Mimarisi

Uygulama üç temel katmandan oluşur:

**1. Sunum Katmanı (Mobil — React Native + Expo)**
React Native ekranları, React Navigation ile sayfa geçişlerini yönetir. `react-native-track-player` arka plan ses çalmayı, `expo-video` video oynatmayı, `expo-file-system` cihaza indirmeyi sağlar. Global state için Zustand kullanılır.

**2. Uygulama Katmanı (Backend API — Render.com)**
Express tabanlı REST API, Render.com Docker servisi üzerinde çalışır. Controller → Service → Repository mimarisi uygulanır. yt-dlp, Docker imajına dahil Python CLI olarak `child_process.spawn()` ile çağrılır.

**3. Veri Katmanı**
Render.com PostgreSQL (kullanıcı, playlist, indirme meta verisi). İndirilen medya dosyaları sunucuda değil, kullanıcının Android cihazında `expo-file-system` ile saklanır.

### yt-dlp Çalışma Modeli

yt-dlp, Node.js'den `child_process.spawn()` ile çağrılır. Eşzamanlılık sınırlandırması için bir **istek kuyruğu** (p-queue) kullanılır. Maksimum eşzamanlı yt-dlp süreci: **5**.

```typescript
// Örnek: Stream URL alma
const ytdlp = spawn('yt-dlp', [
  '--no-playlist',
  '-f', 'bestaudio',
  '--get-url',
  `https://www.youtube.com/watch?v=${videoId}`
]);
```

### Akış Türleri

| Akış Türü | yt-dlp Format | Kullanım |
|-----------|--------------|----------|
| Ses stream | `bestaudio` | Arka plan müzik oynatma |
| Video stream | `bestvideo+bestaudio` | Video izleme |
| Ses indirme | `bestaudio --extract-audio --audio-format mp3` | MP3/AAC indir |
| Video indirme | `bestvideo[height<=720]+bestaudio` | MP4 indir |

### Token Saklama — Mobil

Mobil uygulamada JWT token `expo-secure-store` ile Android Keystore üzerinde şifreli olarak saklanır. Her API isteğinde `Authorization: Bearer <token>` header'ı olarak gönderilir (cookie kullanılmaz).

```
İstemci (RN)      Backend              DB
   |--- POST /auth/login -----------> |
   |                                  |--- Şifre doğrula (bcrypt) --->|
   |<-- 200 + { accessToken, refreshToken } --|
   | SecureStore.setItem(token)        |
   |                                  |
   |--- GET /api/playlists ---------->|
   |    Authorization: Bearer <token> |--- JWT doğrula (middleware) -->|
   |<-- 200 + playlist listesi -------|
```

---

## Components and Interfaces

### Frontend Bileşen Yapısı (React Native + Expo)

```
mobile/
├── app/                          # Expo Router (file-based routing)
│   ├── (tabs)/
│   │   ├── index.tsx             # Ana Sayfa (Trend içerikler)
│   │   ├── search.tsx            # Arama ekranı
│   │   ├── downloads.tsx         # İndirilenler
│   │   └── playlists.tsx         # Playlist listesi
│   ├── channel/[channelId].tsx   # Kanal sayfası
│   ├── playlist/[id].tsx         # Playlist detay
│   ├── auth/login.tsx
│   ├── auth/register.tsx
│   └── _layout.tsx               # Root layout + player bar
├── components/
│   ├── player/
│   │   ├── AudioPlayerBar.tsx    # Alt sabit ses oynatıcı çubuğu
│   │   ├── AudioPlayerModal.tsx  # Tam ekran ses oynatıcı
│   │   └── VideoPlayerScreen.tsx # Tam ekran video oynatıcı (expo-video)
│   ├── content/
│   │   ├── ContentCard.tsx       # Thumbnail + başlık + süre kartı
│   │   └── ContentList.tsx       # FlatList sarmalayıcı
│   ├── download/
│   │   ├── DownloadSheet.tsx     # Format/kalite seçim bottom sheet
│   │   └── DownloadProgressItem.tsx
│   ├── playlist/
│   │   ├── PlaylistCard.tsx
│   │   └── AddToPlaylistSheet.tsx
│   └── common/
│       ├── SearchBar.tsx
│       └── LoadingSpinner.tsx
├── store/
│   ├── playerStore.ts            # react-native-track-player global state
│   ├── downloadStore.ts          # Aktif indirmeler (expo-file-system)
│   └── authStore.ts              # JWT token (expo-secure-store)
├── services/
│   ├── api.ts                    # Axios + BASE_URL (Render backend)
│   ├── searchService.ts
│   ├── streamService.ts
│   ├── downloadService.ts        # expo-file-system ile cihaza indirme
│   └── playlistService.ts
└── hooks/
    ├── useSearch.ts
    ├── usePlayer.ts
    └── useDownload.ts
```

**Kritik kütüphaneler:**
- `react-native-track-player` — arka plan ses çalma, bildirim kontrolü (Android media session)
- `expo-video` — video oynatma
- `expo-file-system` — cihaza indirme ve depolama
- `expo-secure-store` — JWT token güvenli saklama
- `@gorhom/bottom-sheet` — format seçim bottom sheet

### Backend Servis Yapısı

```
src/
├── controllers/
│   ├── authController.ts
│   ├── searchController.ts
│   ├── streamController.ts
│   ├── downloadController.ts
│   ├── playlistController.ts
│   └── channelController.ts
├── services/
│   ├── ytdlpService.ts           # Tüm yt-dlp etkileşimleri
│   ├── authService.ts
│   ├── downloadService.ts        # İndirme kuyruğu ve yönetimi
│   ├── playlistService.ts
│   └── storageService.ts         # Dosya sistemi işlemleri
├── repositories/
│   ├── userRepository.ts
│   ├── playlistRepository.ts
│   └── downloadRepository.ts
├── middleware/
│   ├── authMiddleware.ts         # JWT doğrulama
│   ├── rateLimiter.ts            # API hız sınırı
│   └── errorHandler.ts
└── utils/
    ├── ytdlpWrapper.ts           # child_process spawn yardımcısı
    └── formatters.ts             # Süre, boyut formatlama
```

### API Uç Noktaları (REST)

#### Kimlik Doğrulama

| Metot | Yol | Açıklama | Auth |
|-------|-----|----------|------|
| POST | `/auth/register` | E-posta + şifre ile kayıt | - |
| POST | `/auth/login` | Giriş, cookie set eder | - |
| POST | `/auth/logout` | Cookie'yi temizler | ✓ |
| POST | `/auth/refresh` | Access token yeniler | - |
| POST | `/auth/forgot-password` | Sıfırlama e-postası gönderir | - |
| POST | `/auth/reset-password` | Token + yeni şifre ile sıfırlar | - |

#### Arama ve İçerik Keşfi

| Metot | Yol | Açıklama | Auth |
|-------|-----|----------|------|
| GET | `/api/search?q={query}&limit=50` | YouTube araması | - |
| GET | `/api/trending?category={cat}&page={n}` | Trend içerikler (sayfalı) | - |
| GET | `/api/channels/:channelId/videos?page={n}` | Kanal videoları | - |

**Örnek Arama Yanıtı:**
```json
{
  "items": [
    {
      "videoId": "dQw4w9WgXcQ",
      "title": "Rick Astley - Never Gonna Give You Up",
      "channelName": "Rick Astley",
      "channelId": "UCuAXFkgsw1L7xaCfnd5JJOw",
      "durationSec": 213,
      "thumbnailUrl": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
    }
  ],
  "totalCount": 20,
  "query": "rick astley"
}
```

#### Stream

| Metot | Yol | Açıklama | Auth |
|-------|-----|----------|------|
| GET | `/api/stream/:videoId/audio-url` | yt-dlp ile audio stream URL'i al | - |
| GET | `/api/stream/:videoId/video-url?quality={q}` | Video stream URL'i al | - |

#### İndirme

| Metot | Yol | Açıklama | Auth |
|-------|-----|----------|------|
| POST | `/api/downloads` | İndirme başlat | ✓ |
| GET | `/api/downloads` | İndirme listesi | ✓ |
| GET | `/api/downloads/:id/progress` | SSE ile ilerleme | ✓ |
| GET | `/api/downloads/:id/file` | İndirilmiş dosyayı sun | ✓ |
| POST | `/api/downloads/:id/resume` | Yarım kalan indirmeyi devam ettir | ✓ |
| DELETE | `/api/downloads/:id` | Sil | ✓ |

**POST /api/downloads istek gövdesi:**
```json
{
  "videoId": "dQw4w9WgXcQ",
  "format": "mp3",
  "quality": "320kbps"
}
```

**GET /api/downloads/:id/progress (SSE formatı):**
```
data: {"downloadId":"abc123","progressPct":45,"bytesDownloaded":4718592,"status":"downloading"}

data: {"downloadId":"abc123","progressPct":100,"status":"completed"}
```

#### Playlist

| Metot | Yol | Açıklama | Auth |
|-------|-----|----------|------|
| GET | `/api/playlists` | Kullanıcının playlist'leri | ✓ |
| POST | `/api/playlists` | Yeni playlist oluştur | ✓ |
| PUT | `/api/playlists/:id` | Playlist adı güncelle | ✓ |
| DELETE | `/api/playlists/:id` | Playlist sil | ✓ |
| GET | `/api/playlists/:id/items` | Playlist öğelerini listele | ✓ |
| POST | `/api/playlists/:id/items` | Öğe ekle | ✓ |
| DELETE | `/api/playlists/:id/items/:itemId` | Öğe kaldır | ✓ |
| PUT | `/api/playlists/:id/items/reorder` | Sırayı güncelle | ✓ |

#### Kullanıcı

| Metot | Yol | Açıklama | Auth |
|-------|-----|----------|------|
| GET | `/api/users/me` | Profil bilgisi | ✓ |
| GET | `/api/users/me/storage` | Toplam depolama kullanımı | ✓ |

---

## Data Models

### PostgreSQL Şema Tanımları

#### users

```sql
CREATE TABLE users (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                 VARCHAR(255) UNIQUE NOT NULL,
  password_hash         VARCHAR(255) NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  login_attempts        INTEGER NOT NULL DEFAULT 0,
  locked_until          TIMESTAMPTZ,
  reset_token           VARCHAR(255),
  reset_token_expires_at TIMESTAMPTZ
);
```

#### playlists

```sql
CREATE TABLE playlists (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       VARCHAR(100) NOT NULL CHECK (char_length(name) >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### playlist_items

```sql
CREATE TABLE playlist_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id   UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  video_id      VARCHAR(50) NOT NULL,
  title         VARCHAR(500) NOT NULL,
  channel_name  VARCHAR(255) NOT NULL,
  duration_sec  INTEGER NOT NULL,
  thumbnail_url VARCHAR(500),
  position      INTEGER NOT NULL,
  added_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(playlist_id, video_id)
);
```

#### downloads

```sql
CREATE TABLE downloads (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id         VARCHAR(50) NOT NULL,
  title            VARCHAR(500) NOT NULL,
  channel_name     VARCHAR(255) NOT NULL,
  duration_sec     INTEGER NOT NULL,
  thumbnail_url    VARCHAR(500),
  format           VARCHAR(10) NOT NULL CHECK (format IN ('mp3', 'aac', 'mp4')),
  quality          VARCHAR(20) NOT NULL,
  file_path        VARCHAR(1000) NOT NULL,
  file_size_bytes  BIGINT NOT NULL DEFAULT 0,
  status           VARCHAR(20) NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','downloading','completed','failed','paused')),
  progress_pct     INTEGER NOT NULL DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  bytes_downloaded BIGINT NOT NULL DEFAULT 0,
  error_message    TEXT,
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### TypeScript Arayüz Tanımları

```typescript
interface ContentItem {
  videoId: string;
  title: string;
  channelName: string;
  channelId?: string;
  durationSec: number;
  thumbnailUrl: string | null;
}

interface SearchResult {
  items: ContentItem[];
  totalCount: number;
  query: string;
}

interface DownloadRequest {
  videoId: string;
  format: 'mp3' | 'aac' | 'mp4';
  quality: '128kbps' | '192kbps' | '320kbps' | '360p' | '720p' | '1080p';
}

interface PlaylistItem extends ContentItem {
  position: number;
  addedAt: string; // ISO 8601
}

interface UserAuth {
  id: string;
  email: string;
}
```

### yt-dlp Entegrasyon Detayları

#### Arama

```typescript
async search(query: string, limit: number = 50): Promise<ContentItem[]> {
  const normalizedQuery = normalizeQuery(query); // Türkçe karakter normalizasyonu

  const args = [
    `ytsearch${limit}:${normalizedQuery}`,
    '--no-playlist',
    '--print', '%(id)s\t%(title)s\t%(uploader)s\t%(duration)s\t%(thumbnail)s',
    '--no-warnings',
    '--quiet'
  ];

  const output = await this.runYtdlp(args);
  return this.parseTabSeparatedOutput(output);
}
```

#### İndirme İşlemi

İndirme süreci şu adımları izler:

1. `POST /api/downloads` isteği alınır; veritabanına `status: 'pending'` kaydı oluşturulur.
2. İndirme kuyruğuna (DownloadQueue, p-queue tabanlı) eklenir.
3. Kuyruktan sıra geldiğinde yt-dlp `--newline` ve `--progress-template` bayraklarıyla çalıştırılır.
4. stdout çıktısı ayrıştırılarak veritabanındaki `progress_pct` ve `bytes_downloaded` güncellenir.
5. SSE bağlantısı üzerinden istemciye anlık ilerleme bilgisi iletilir.
6. İndirme tamamlandığında dosya `/downloads/{userId}/{videoId}.{format}` yoluna taşınır.

```typescript
const args = [
  '-f', formatStr,
  '--newline',
  '--progress-template', '%(progress._percent_str)s\t%(progress._downloaded_bytes_str)s',
  '-o', outputPath,
  `https://www.youtube.com/watch?v=${videoId}`
];

if (['mp3', 'aac'].includes(format)) {
  args.push('--extract-audio', '--audio-format', format);
}
```

#### Kanal İçerikleri

```typescript
async getChannelVideos(channelId: string, page: number = 1): Promise<ContentItem[]> {
  const args = [
    '--flat-playlist',
    '--print', '%(id)s\t%(title)s\t%(uploader)s\t%(duration)s\t%(thumbnail)s\t%(upload_date)s',
    '--playlist-start', String((page - 1) * 20 + 1),
    '--playlist-end', String(page * 20),
    `https://www.youtube.com/@${channelId}/videos`
  ];

  const output = await this.runYtdlp(args);
  return this.parseTabSeparatedOutput(output);
}
```

### Temel Teknik Kararlar

| Karar | Seçim | Gerekçe |
|-------|-------|---------|
| Mobil platform | React Native + Expo | Tek kod tabanı, `eas build` ile APK |
| Backend hosting | Render.com (Docker) | Python + yt-dlp + ffmpeg Docker'da kurulur |
| Token saklama | `expo-secure-store` | Android Keystore ile şifreli, XSS yok |
| yt-dlp çağrı yöntemi | `child_process.spawn()` | Streaming stdout desteği; büyük indirmelerde bellek tasarrufu |
| Stream yöntemi | URL yönlendirme (proxy değil) | Render bant genişliği korunur; CDN'den doğrudan servis |
| İndirme depolama | Cihaz (expo-file-system) | Render ephemeral disk — server'da dosya tutulmaz |
| İlerleme bildirimi | Polling veya expo-file-system progress callback | SSE yerine RN uyumlu yaklaşım |
| Eşzamanlı indirme limiti | 3 (kullanıcı başına) | Render kaynakları ve yt-dlp süreci limiti |
| Ses çalma | `react-native-track-player` | Android media session, bildirim kontrolü, arka plan çalma |

---

## Correctness Properties

*Bir özellik (property), bir sistemin tüm geçerli yürütmelerinde doğru olması gereken bir karakteristik veya davranıştır. Özellikler, insan tarafından okunabilen spesifikasyonlar ile makine tarafından doğrulanabilir doğruluk garantileri arasında köprü görevi görür.*

### Property 1: İçerik Meta Verisi Tamlığı

*Her* arama, listeleme veya kanal sorgusundan döndürülen içerik öğesi; `videoId`, `title`, `channelName` ve `durationSec` alanlarını içermeli; `thumbnailUrl` ise ya geçerli bir URL ya da `null` olmalıdır.

**Validates: Requirements 1.3, 2.3, 8.3**

### Property 2: Türkçe Karakter Normalizasyonu

*Her* Türkçe özel karakter (ş, ğ, ı, ü, ö, ç) içeren arama sorgusu için, orijinal sorgu ile karakterleri ASCII karşılıklarına (s, g, i, u, o, c) dönüştürülmüş normalize sorgu aynı arama sonuç kümesini üretmelidir.

**Validates: Requirements 1.5**

### Property 3: Sorgu Uzunluğu Kırpma

*Her* 200 karakterden uzun girdi string'i için, `truncateQuery(input)` fonksiyonu tam olarak 200 karakter uzunluğunda bir string döndürmelidir; döndürülen string, girdinin ilk 200 karakterinin prefix'i olmalıdır.

**Validates: Requirements 1.6**

### Property 4: Sayfalama Tutarlılığı

*Her* geçerli `page` (≥ 1) ve `pageSize` (1–50 arası) değeri için, sayfa yanıtındaki öğe sayısı `pageSize`'ı aşmamalı; toplam sayfa sayısı `ceil(totalCount / pageSize)` ile eşit olmalıdır.

**Validates: Requirements 2.1**

### Property 5: Süre Formatlama

*Her* negatif olmayan tamsayı saniye değeri için, `formatDuration(seconds)` fonksiyonu `MM:SS` biçiminde bir string üretmelidir; burada dakika ve saniye bölümleri sıfır dolgulu (zero-padded) iki haneli sayılardır ve `dkk * 60 + sn == girdi` koşulunu sağlar.

**Validates: Requirements 3.6, 9.6**

### Property 6: İndirme Kuyruğu Kapasitesi

*Her* kullanıcı ve aktif indirme sayısı `n` için: `n < 3` ise yeni bir indirme talebi kabul edilmeli (`status: 'pending'` kaydı oluşturulmalı); `n >= 3` ise talep reddedilmeli ve uygun hata kodu döndürülmelidir.

**Validates: Requirements 4.9**

### Property 7: İndirme İlerleme Yüzdesi Doğruluğu

*Her* `bytesDownloaded` (≥ 0) ve `totalBytes` (> 0) çifti için, `calculateProgress(bytesDownloaded, totalBytes)` fonksiyonu `floor((bytesDownloaded / totalBytes) * 100)` değerine eşit ve 0–100 aralığında bir tamsayı döndürmelidir.

**Validates: Requirements 4.5**

### Property 8: Depolama Alanı Formatlama

*Her* `totalBytes` (≥ 0) değeri için, `formatStorageSize(totalBytes)` fonksiyonu: `totalBytes < 1024 * 1024 * 1024` ise MB cinsinden, aksi hâlde GB cinsinden (iki ondalık basamak) bir string döndürmelidir.

**Validates: Requirements 5.8**

### Property 9: E-posta ve Şifre Doğrulama

*Her* kayıt formu gönderimi için: RFC 5322 uyumlu e-posta adresi `validateEmail(email) === true` üretmeli; en az 8 karakter, en az 1 büyük harf ve en az 1 rakam içeren şifre `validatePassword(password) === true` üretmelidir. Bu koşullardan herhangi birini sağlamayan girdi `false` üretmelidir.

**Validates: Requirements 6.2**

### Property 10: Hesap Kilitleme Eşiği

*Her* başarısız giriş denemesi sayısı `n` için: `n < 5` ise hesap kilitli olmamalı (`lockedUntil === null`); `n >= 5` ise hesap 15 dakika kilitli olmalıdır (`lockedUntil >= now + 15 dakika`).

**Validates: Requirements 6.7**

### Property 11: Playlist İş Kuralları

*Her* playlist adı için: uzunluğu 1–100 karakter aralığında ise `validatePlaylistName(name) === true`; uzunluğu 0 veya 100'den büyük ise `false` üretmelidir.
*Her* playlist için: mevcut öğe sayısı `n < 500` ise yeni öğe ekleme başarılı olmalı; `n >= 500` ise reddedilmeli ve uygun hata kodu döndürülmelidir.

**Validates: Requirements 7.1, 7.3**

### Property 12: Shuffle Permütasyon Bütünlüğü

*Her* playlist için, shuffle modunu etkinleştirmek playlist'teki tüm öğelerin aynı kümesini korumalıdır; shuffle sonrası döndürülen öğe listesi, orijinal liste ile aynı elemanları içeren bir permütasyon olmalıdır (hiçbir eleman eklenmemeli veya çıkarılmamalıdır).

**Validates: Requirements 7.4**

---

## Error Handling

### Hata Kategorileri ve HTTP Yanıt Kodları

| Kategori | HTTP Kodu | Örnek |
|----------|-----------|-------|
| Doğrulama hatası | 400 | Geçersiz e-posta formatı |
| Kimlik doğrulama hatası | 401 | Geçersiz/süresi dolmuş token |
| Yetki hatası | 403 | Başka kullanıcının kaynağına erişim |
| Bulunamadı | 404 | Playlist/download ID mevcut değil |
| Kapasite aşımı | 409 | Max indirme limiti, playlist dolu |
| yt-dlp hatası | 502 | YouTube'a erişilemedi |
| Sunucu hatası | 500 | Beklenmeyen iç hata |

### Standart Hata Yanıt Formatı

```json
{
  "error": {
    "code": "YTDLP_UNAVAILABLE",
    "message": "Arama gerçekleştirilemedi, lütfen tekrar deneyin",
    "retryable": true
  }
}
```

### yt-dlp Hata Yönetimi

yt-dlp sürecinden dönen stderr çıktısı izlenir. Bilinen hata kalıpları (`ERROR: Video unavailable`, `HTTP Error 429`) yakalanarak anlamlı uygulama hatalarına dönüştürülür. Rate limit (HTTP 429) durumunda exponential backoff ile yeniden deneme uygulanır: 1s → 2s → 4s, maksimum 3 deneme.

### İndirme Hata Kurtarma

Ağ hatası durumunda `bytes_downloaded` alanı veritabanına kaydedilir. `yt-dlp --continue` bayrağı ile mevcut dosyadan kaldığı yerden devam edilir. 24 saatten eski başarısız indirmeler cron job ile otomatik temizlenir.

### Bağlantı Kesintisi

Oynatma sırasında ağ bağlantısı kesilirse `<audio>`/`<video>` öğesinin `waiting` ve `error` olayları dinlenerek kullanıcıya "Bağlantı kesildi" uyarısı gösterilir. `online` olayı tetiklendiğinde otomatik devam sağlanır.

---

## Testing Strategy

### Birim Testler

Saf fonksiyonlar ve iş mantığı katmanı için birim testler yazılır. **Jest** ile TypeScript projesi test edilir.

Test kapsamı:
- `formatDuration()` → MM:SS dönüşüm doğruluğu
- `formatStorageSize()` → MB/GB eşik formatlama
- `validateEmail()` ve `validatePassword()` → giriş doğrulama kuralları
- `truncateQuery()` → sorgu kırpma
- `calculateProgress()` → ilerleme yüzdesi hesabı
- Hesap kilitleme mantığı
- Playlist adı ve kapasite doğrulama

### Özellik Tabanlı Testler (Property-Based Testing)

**Kütüphane:** `fast-check` (TypeScript için PBT kütüphanesi)
**Minimum iterasyon:** Her özellik testi için 100 çalıştırma

Tasarım belgesinde tanımlanan 12 özelliğin tamamı `fast-check` ile uygulanır. Her test şu yorum etiketini içerir:

```typescript
// Feature: myt-clone, Property 5: formatDuration - süre formatlama
it.prop([fc.integer({ min: 0, max: 86399 })])('MM:SS formatını doğrular', (seconds) => {
  const result = formatDuration(seconds);
  const [mm, ss] = result.split(':').map(Number);
  expect(result).toMatch(/^\d{2}:\d{2}$/);
  expect(mm * 60 + ss).toBe(seconds);
});

// Feature: myt-clone, Property 6: İndirme kuyruğu kapasitesi
it.prop([fc.integer({ min: 0, max: 10 })])('3 aktif indirmede yeni talep reddedilir', (n) => {
  const queue = createDownloadQueue(n);
  if (n < 3) {
    expect(queue.canAccept()).toBe(true);
  } else {
    expect(queue.canAccept()).toBe(false);
  }
});
```

### Entegrasyon Testleri

- Auth akışı: kayıt → giriş → korumalı endpoint erişimi
- yt-dlp servis çağrıları (gerçek yt-dlp ile, test ortamında limit 5 çağrı)
- Veritabanı CRUD işlemleri (test PostgreSQL instance'ı)
- SSE indirme ilerleme akışı

### Uçtan Uca (E2E) Testler

**Playwright** ile kritik akışlar test edilir:
- Arama → sonuç seçme → ses oynatma
- Kayıt → giriş → indirme başlatma
- Playlist oluşturma → öğe ekleme → çalma
