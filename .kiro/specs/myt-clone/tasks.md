# Implementation Plan: MYT Müzik Klonu

## Overview

Bu plan, React Native + Expo (Android APK) mobil istemci ile Node.js + Express + yt-dlp (Render.com Docker) backend'ini kapsayan MYT Müzik Klonu uygulamasını adım adım inşa eder. Görevler; monorepo iskelet kurulumu, Docker altyapısı, veritabanı şeması, kimlik doğrulama, yt-dlp servisleri, playlist yönetimi, tüm mobil ekranlar ve son olarak deploy yapılandırmasını içerir.

---

## Tasks

- [x] 1. Monorepo iskelet yapısı ve temel yapılandırma
  - [x] 1.1 Monorepo kök dizinini ve workspace yapısını oluştur
    - Kök `package.json` (npm workspaces), `mobile/` ve `backend/` dizin yapılarını oluştur
    - Her iki workspace için `tsconfig.json` dosyalarını oluştur (strict mode, path aliases)
    - Kök seviye `.gitignore`, `.editorconfig` ve `README.md` dosyalarını oluştur
    - _Gereksinimler: Tasarım: Katman Mimarisi_

  - [x] 1.2 Expo mobil uygulama iskeletini kur
    - `mobile/` altında Expo + TypeScript projesi oluştur (`expo init` ya da EAS CLI ile)
    - Expo Router dosya tabanlı routing yapısını kur (`app/` klasörü, `_layout.tsx`)
    - Temel bağımlılıkları yükle: `react-native-track-player`, `expo-video`, `expo-file-system`, `expo-secure-store`, `zustand`, `axios`, `@gorhom/bottom-sheet`
    - `app.json` içinde Android paket adı, izinler (INTERNET, FOREGROUND_SERVICE, WAKE_LOCK, RECEIVE_BOOT_COMPLETED) ve gerekli eklentileri tanımla
    - _Gereksinimler: Tasarım: Frontend Bileşen Yapısı_

  - [x] 1.3 Express backend iskeletini kur
    - `backend/` altında Node.js + Express + TypeScript projesi oluştur
    - `src/` dizin yapısını oluştur: `controllers/`, `services/`, `repositories/`, `middleware/`, `utils/`
    - Temel bağımlılıkları yükle: `express`, `pg`, `bcrypt`, `jsonwebtoken`, `dotenv`, `p-queue`
    - Dev bağımlılıkları: `typescript`, `ts-node-dev`, `jest`, `supertest`, `fast-check`
    - `src/index.ts` giriş noktası, port/env yüklemesi ve CORS yapılandırması
    - _Gereksinimler: Tasarım: Backend Servis Yapısı_

- [x] 2. Docker yapılandırması ve backend altyapısı
  - [x] 2.1 Backend için Dockerfile oluştur
    - `backend/Dockerfile` içinde `node:20-slim` baz imajı, `apt-get` ile `python3`, `python3-pip`, `ffmpeg` kurulumu, `pip3 install yt-dlp` adımlarını yaz
    - Çok aşamalı build: TypeScript derleme aşaması + üretim aşaması
    - `EXPOSE 3000`, `CMD ["node", "dist/index.js"]` direktiflerini ekle
    - `.dockerignore` dosyasını oluştur
    - _Gereksinimler: Tasarım: Render.com Deployment Yapısı_

  - [x] 2.2 Docker Compose geliştirme ortamını oluştur
    - `docker-compose.yml` içinde `backend` ve `postgres` servislerini tanımla
    - Ortam değişkenleri: `DATABASE_URL`, `JWT_SECRET`, `PORT`
    - Postgres kalıcı volume ve healthcheck ekle
    - _Gereksinimler: Tasarım: Veri Katmanı_

  - [x] 2.3 Veritabanı bağlantı katmanını ve migration sistemini oluştur
    - `backend/src/db/` altında `pool.ts` (pg Pool singleton) oluştur
    - `backend/src/db/migrations/` dizininde SQL migration dosyaları oluştur: `001_users.sql`, `002_playlists.sql`, `003_playlist_items.sql`, `004_downloads.sql`
    - Her migration dosyası tasarım belgesindeki SQL şema tanımlarını uygular
    - Basit migration runner scripti (`backend/src/db/migrate.ts`) yaz
    - _Gereksinimler: Tasarım: Data Models_

- [x] 3. Backend kimlik doğrulama sistemi
  - [x] 3.1 Kullanıcı repository ve servisini uygula
    - `userRepository.ts`: `findByEmail`, `findById`, `create`, `updateLoginAttempts`, `lockAccount`, `setResetToken` metodlarını yaz
    - `authService.ts`: bcrypt şifre hash'leme/doğrulama, JWT access/refresh token üretme ve doğrulama mantığını yaz
    - `validateEmail()` ve `validatePassword()` yardımcı fonksiyonlarını `utils/validators.ts` içinde yaz
    - _Gereksinimler: 6.1, 6.2, 6.4_

  - [ ]* 3.2 Doğrulama fonksiyonları için özellik tabanlı testler yaz
    - **Property 9: E-posta ve Şifre Doğrulama**
    - **Validates: Gereksinim 6.2**
    - RFC 5322 uyumlu e-postalar için `validateEmail` daima `true` döner; geçersizler için `false`
    - Kural karşılayan şifreler için `validatePassword` daima `true` döner

  - [x] 3.3 Auth controller ve route'larını uygula
    - `authController.ts` içinde `register`, `login`, `logout`, `refresh`, `forgotPassword`, `resetPassword` handler'larını yaz
    - `POST /auth/register`: girdi doğrulama + bcrypt hash + DB kayıt
    - `POST /auth/login`: hesap kilitleme kontrolü (5 başarısız deneme → 15 dk kilit), JWT üretme
    - `POST /auth/forgot-password`: 30 dakika geçerli tek kullanımlık reset token üretme ve DB'ye kayıt
    - `POST /auth/reset-password`: token doğrulama, süresi kontrolü, şifre güncelleme
    - _Gereksinimler: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [x] 3.4 JWT auth middleware'i uygula
    - `authMiddleware.ts`: `Authorization: Bearer <token>` başlığını ayrıştır, `jsonwebtoken.verify()` ile doğrula, `req.user` nesnesini doldur
    - Süresi dolmuş token için 401, geçersiz token için 401 yanıtı döndür
    - `rateLimiter.ts`: express-rate-limit ile auth endpoint'leri için hız sınırı uygula
    - _Gereksinimler: 6.4, 4.10_

  - [ ]* 3.5 Hesap kilitleme eşiği için özellik tabanlı test yaz
    - **Property 10: Hesap Kilitleme Eşiği**
    - **Validates: Gereksinim 6.7**
    - n < 5 deneme: hesap açık; n ≥ 5: `lockedUntil >= now + 15 dakika`

- [x] 4. Backend yt-dlp servis katmanı
  - [x] 4.1 yt-dlp wrapper ve temel servisini uygula
    - `utils/ytdlpWrapper.ts`: `child_process.spawn()` ile yt-dlp çağrısı, stdout/stderr toplama, timeout yönetimi, process temizleme
    - p-queue ile eşzamanlı yt-dlp süreç limitini 5 ile sınırla
    - `YTDLP_UNAVAILABLE`, `VIDEO_UNAVAILABLE`, `RATE_LIMITED` hata sınıflarını tanımla
    - HTTP 429 için exponential backoff (1s → 2s → 4s, maks 3 deneme)
    - _Gereksinimler: 1.7, 3.9, 8.5_

  - [x] 4.2 Arama servisini uygula
    - `ytdlpService.ts` içinde `search(query, limit)` metodunu yaz
    - `normalizeQuery()` fonksiyonu: Türkçe karakterleri ASCII karşılıklarına dönüştür (ş→s, ğ→g, ı→i, ü→u, ö→o, ç→c), büyük/küçük harf duyarsız
    - 200 karakterden uzun sorguları kırp (`truncateQuery()`); `searchController.ts` içinde uyarı döndür
    - Tab ayrımlı yt-dlp çıktısını `ContentItem[]` dizisine parse et
    - `GET /api/search?q=&limit=50` route'unu bağla
    - _Gereksinimler: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [ ]* 4.3 Türkçe karakter normalizasyonu için özellik tabanlı test yaz
    - **Property 2: Türkçe Karakter Normalizasyonu**
    - **Validates: Gereksinim 1.5**
    - Türkçe özel karakter içeren sorgu ile normalize edilmiş sorgu aynı sonuç kümesini üretmeli

  - [ ]* 4.4 Sorgu uzunluğu kırpma için özellik tabanlı test yaz
    - **Property 3: Sorgu Uzunluğu Kırpma**
    - **Validates: Gereksinim 1.6**
    - 200 karakterden uzun her girdi için `truncateQuery()` tam 200 karakter döndürür ve girdi prefix'idir

  - [x] 4.5 Trend içerikler ve kanal servisleri ile stream URL servisini uygula
    - `ytdlpService.ts` içinde `getTrending(category, page)` metodunu yaz (sayfalı, 20 öğe/sayfa)
    - `getChannelVideos(channelId, page)` metodunu yaz (`--flat-playlist`, `--playlist-start/end`)
    - `getAudioStreamUrl(videoId)` metodunu yaz (`-f bestaudio --get-url`)
    - `getVideoStreamUrl(videoId, quality)` metodunu yaz (`-f bestvideo+bestaudio --get-url`)
    - `GET /api/trending`, `GET /api/channels/:channelId/videos`, `GET /api/stream/:videoId/audio-url`, `GET /api/stream/:videoId/video-url` route'larını bağla
    - _Gereksinimler: 2.1, 2.2, 3.1, 3.2, 8.1, 8.5_

  - [x] 4.6 Ortak yardımcı fonksiyonları uygula
    - `utils/formatters.ts` içinde `formatDuration(seconds)` (MM:SS, sıfır dolgulu), `formatStorageSize(bytes)` (MB/GB), `calculateProgress(bytesDownloaded, totalBytes)` fonksiyonlarını yaz
    - _Gereksinimler: 1.3, 2.3, 3.6, 4.5, 5.8, 9.6_

  - [ ]* 4.7 Süre formatlama için özellik tabanlı test yaz
    - **Property 5: Süre Formatlama**
    - **Validates: Gereksinimler 3.6, 9.6**
    - Her negatif olmayan tamsayı saniye için `formatDuration` MM:SS üretir; `mm * 60 + ss === input`

  - [ ]* 4.8 Depolama boyutu formatlama için özellik tabanlı test yaz
    - **Property 8: Depolama Alanı Formatlama**
    - **Validates: Gereksinim 5.8**
    - `totalBytes < 1024^3` → MB; aksi hâlde GB (2 ondalık basamak)

  - [ ]* 4.9 İndirme ilerleme yüzdesi için özellik tabanlı test yaz
    - **Property 7: İndirme İlerleme Yüzdesi Doğruluğu**
    - **Validates: Gereksinim 4.5**
    - `calculateProgress(b, t) === floor((b/t)*100)` ve 0–100 arasında

- [x] 5. Backend indirme sistemi
  - [x] 5.1 İndirme repository ve kuyruk servisini uygula
    - `downloadRepository.ts`: `create`, `findById`, `findByUserId`, `updateProgress`, `updateStatus`, `delete` metodlarını yaz
    - `downloadService.ts`: p-queue tabanlı `DownloadQueue` sınıfını yaz; `canAccept(userId)` metodu kullanıcı başına aktif indirme sayısını kontrol eder
    - yt-dlp `--newline --progress-template` ile stdout'tan ilerleme ayrıştırma
    - İndirme tamamlandığında dosya yolunu, `completed_at` ve `file_size_bytes` güncelle
    - _Gereksinimler: 4.4, 4.5, 4.6, 4.7, 4.8_

  - [ ]* 5.2 İndirme kuyruğu kapasitesi için özellik tabanlı test yaz
    - **Property 6: İndirme Kuyruğu Kapasitesi**
    - **Validates: Gereksinim 4.9**
    - n < 3: `canAccept()` → true; n ≥ 3: `canAccept()` → false

  - [x] 5.3 İndirme controller ve route'larını uygula
    - `downloadController.ts` içinde tüm indirme endpoint'lerini uygula
    - `POST /api/downloads`: format/quality doğrulama, kullanıcı limiti kontrolü (3 eşzamanlı), zaten indirilmiş kontrolü, kuyruğa ekleme
    - `GET /api/downloads/:id/progress`: SSE (`text/event-stream`) ile anlık ilerleme bildirimi (2 saniyelik polling)
    - `POST /api/downloads/:id/resume`: `yt-dlp --continue` ile kaldığı yerden devam
    - `DELETE /api/downloads/:id`: kayıt silme
    - _Gereksinimler: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.11_

- [x] 6. Backend playlist CRUD
  - [x] 6.1 Playlist repository ve servisini uygula
    - `playlistRepository.ts`: `findByUserId`, `findById`, `create`, `update`, `delete`, `addItem`, `removeItem`, `reorderItems`, `countItems` metodlarını yaz
    - `playlistService.ts`: playlist adı doğrulama (`validatePlaylistName`), 500 öğe kapasite kontrolü, playlist sahipliği doğrulama
    - _Gereksinimler: 7.1, 7.2, 7.3, 7.5_

  - [ ]* 6.2 Playlist iş kuralları için özellik tabanlı test yaz
    - **Property 11: Playlist İş Kuralları**
    - **Validates: Gereksinimler 7.1, 7.3**
    - 1–100 karakter arası isim: `validatePlaylistName` → true; uzunluk 0 veya >100: false
    - n < 500 öğe: ekleme başarılı; n ≥ 500: reddedilir

  - [x] 6.3 Playlist controller ve route'larını uygula
    - `playlistController.ts` içinde tüm CRUD endpoint'lerini uygula
    - `GET /api/playlists`, `POST /api/playlists`, `PUT /api/playlists/:id`, `DELETE /api/playlists/:id` (onay dialogu client'ta)
    - `GET /api/playlists/:id/items`, `POST /api/playlists/:id/items`, `DELETE /api/playlists/:id/items/:itemId`, `PUT /api/playlists/:id/items/reorder`
    - Tüm route'lara `authMiddleware` uygula
    - _Gereksinimler: 7.1, 7.2, 7.3, 7.5, 7.6_

- [x] 7. Backend hata yönetimi ve genel middleware
  - [x] 7.1 Global hata yönetimi ve standart yanıt formatını uygula
    - `middleware/errorHandler.ts`: tüm hata sınıflarını yakalayan global Express error handler
    - Standart hata yanıt formatı: `{ error: { code, message, retryable } }`
    - HTTP durum kodu eşlemesini uygula (400, 401, 403, 404, 409, 500, 502)
    - Sayfalama tutarlılığı için `paginationHelper.ts` yardımcısını yaz
    - _Gereksinimler: 1.4, 1.7, 2.5, 3.9, 8.5_

  - [ ]* 7.2 Sayfalama tutarlılığı için özellik tabanlı test yaz
    - **Property 4: Sayfalama Tutarlılığı**
    - **Validates: Gereksinim 2.1**
    - Her geçerli `page` (≥ 1) ve `pageSize` (1–50) için öğe sayısı `pageSize`'ı aşmaz; toplam sayfa sayısı `ceil(totalCount/pageSize)` ile eşit

- [x] 8. Kontrol noktası — Backend
  - Tüm backend testlerinin geçtiğinden emin ol; eksik endpoint'leri ve migration'ları kontrol et. Sorun varsa kullanıcıya sor.

- [x] 9. Mobil — Zustand store'ları ve API servisleri
  - [x] 9.1 Temel Zustand store'larını ve API istemcisini uygula
    - `store/authStore.ts`: `token`, `user`, `login()`, `logout()` — token `expo-secure-store` ile saklanır
    - `store/playerStore.ts`: `currentTrack`, `queue`, `isPlaying`, `position`, `duration` durumları
    - `store/downloadStore.ts`: aktif indirmeler, ilerleme yüzdeleri, tamamlanan indirmeler
    - `services/api.ts`: Axios instance, `BASE_URL` (Render.com URL'si), JWT `Authorization` header interceptor
    - _Gereksinimler: 6.4, Tasarım: Token Saklama_

  - [x] 9.2 İçerik servislerini uygula
    - `services/searchService.ts`: `search(query)` → `GET /api/search`
    - `services/streamService.ts`: `getAudioUrl(videoId)`, `getVideoUrl(videoId, quality)` → stream endpoint'leri
    - `services/downloadService.ts`: `startDownload()`, `getProgress()`, `resumeDownload()`, `deleteDownload()` — `expo-file-system` ile cihaza kayıt
    - `services/playlistService.ts`: tüm playlist CRUD çağrıları
    - `hooks/useSearch.ts`, `hooks/usePlayer.ts`, `hooks/useDownload.ts` custom hook'larını yaz
    - _Gereksinimler: 1.1, 3.1, 4.4, 7.2_

- [x] 10. Mobil — Kimlik doğrulama ekranları
  - [x] 10.1 Kayıt ve giriş ekranlarını uygula
    - `app/auth/register.tsx`: e-posta + şifre formu, girdi doğrulama (RFC 5322 e-posta, ≥8 karakter + büyük harf + rakam), field düzeyinde hata mesajları
    - `app/auth/login.tsx`: giriş formu, "E-posta veya şifre hatalı" genel hata mesajı, hesap kilitlenme bildirimi
    - "Şifremi Unuttum" akışı: e-posta girişi → `POST /auth/forgot-password`
    - Başarılı girişte token'ı `expo-secure-store`'a kaydet, ana sayfaya yönlendir
    - _Gereksinimler: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 11. Mobil — Ana sayfa ve içerik meta verisi
  - [x] 11.1 İçerik meta verisi bütünlüğü için özellik tabanlı test yaz
    - **Property 1: İçerik Meta Verisi Tamlığı**
    - **Validates: Gereksinimler 1.3, 2.3, 8.3**
    - API'den dönen her `ContentItem` nesnesi `videoId`, `title`, `channelName`, `durationSec` içermeli; `thumbnailUrl` geçerli URL veya null olmalı

  - [x] 11.2 Ana sayfa ekranını uygula
    - `app/(tabs)/index.tsx`: trend içerikler `FlatList` ile listelenir (sayfalı, 20/sayfa, önceki/sonraki)
    - Kategori seçim çubuğu (müzik, oyun, eğitim vb.) — seçim `GET /api/trending?category=` çağrısını tetikler
    - `ContentCard.tsx` bileşeni: thumbnail, başlık, kanal adı, süre (MM:SS), yükleme göstergesi
    - Thumbnail yoksa varsayılan görsel, yükleme sırasında `LoadingSpinner.tsx`
    - Hata durumunda "İçerikler yüklenemedi" + yeniden dene düğmesi
    - _Gereksinimler: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 12. Mobil — Arama ekranı
  - [x] 12.1 Arama ekranını uygula
    - `app/(tabs)/search.tsx` + `components/common/SearchBar.tsx`
    - Minimum 2 karakter girişinde `GET /api/search?q=` tetiklenir (debounce ~400ms)
    - 200 karakter sınırını aşan girişte kullanıcıya uyarı göster
    - Sonuçlar `ContentList.tsx` ile listelenir (maks 50 öğe, thumbnail + başlık + kanal + süre)
    - "Sonuç bulunamadı" ve hata durumu mesajları
    - _Gereksinimler: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 13. Mobil — Ses oynatıcı
  - [x] 13.1 react-native-track-player altyapısını kur
    - `react-native-track-player` servisini kaydet (`android/app/src/main/java` PlaybackService)
    - `store/playerStore.ts` içinde `react-native-track-player` olaylarını bağla: `play`, `pause`, `next`, `previous`, `seekTo`, `setVolume`
    - Arka planda çalma, Android media session bildirimi (thumbnail, başlık, kontroller) desteğini etkinleştir
    - _Gereksinimler: 3.3, 3.7_

  - [x] 13.2 Ses oynatıcı bileşenlerini uygula
    - `components/player/AudioPlayerBar.tsx`: alt sabit çubuk — thumbnail, başlık, kanal adı, oynat/duraklat, sonraki düğmeleri
    - `components/player/AudioPlayerModal.tsx`: tam ekran oynatıcı — thumbnail, başlık, kanal, ilerleme çubuğu (MM:SS / toplam süre, ≤1 sn aralıklı), ses seviyesi (0–100%), önceki/sonraki
    - İçerik seçiminde `getAudioStreamUrl()` ile URL al → `TrackPlayer.add()` ile kuyruğa ekle → çalmaya başla (≤3 sn)
    - Ağ kesintisinde "Bağlantı kesildi" uyarısı + yeniden bağlanmada otomatik devam
    - 5 saniye yüklenemezse "İçerik yüklenemedi" mesajı + yeniden dene
    - _Gereksinimler: 3.1, 3.3, 3.5, 3.6, 3.7, 3.8, 3.9_

  - [x] 13.3 Playlist sırası ve shuffle modunu uygula
    - `playerStore.ts` içinde shuffle toggle — tüm kuyruğu Fisher-Yates algoritmasıyla karıştır
    - Orijinal playlist sırasına dönme desteği
    - _Gereksinimler: 7.4_

  - [ ]* 13.4 Shuffle permütasyon bütünlüğü için özellik tabanlı test yaz
    - **Property 12: Shuffle Permütasyon Bütünlüğü**
    - **Validates: Gereksinim 7.4**
    - Shuffle sonrası liste orijinal listenin bir permütasyonudur; eleman eklenmez veya çıkarılmaz

- [x] 14. Mobil — Video oynatıcı
  - [x] 14.1 Video oynatıcı ekranını uygula
    - `components/player/VideoPlayerScreen.tsx`: `expo-video` ile video oynatma
    - Kontroller: oynat, duraklat, ±10 sn ileri/geri sarma, ses seviyesi (0–100%), tam ekran düğmesi
    - Başlık ve kanal adını video arayüzünde göster (meta veri yoksa "Bilinmiyor")
    - Geçen süre ≤1 sn aralıklı güncelleme, MM:SS formatı + toplam süre
    - Kalite seçimi (360p, 720p, 1080p) — seçimde `getVideoStreamUrl()` ile yeni URL al, oynatma konumunu koru (≤3 sn)
    - Tam ekran modunda kontroller erişilebilir kalır
    - Ağ kesintisi ve 5 sn yüklenememe durumlarını yönet (maks 3 yeniden deneme)
    - _Gereksinimler: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

- [x] 15. Mobil — İndirme özelliği
  - [x] 15.1 Format ve kalite seçim bottom sheet'ini uygula
    - `components/download/DownloadSheet.tsx`: `@gorhom/bottom-sheet` ile format seçimi ("Yalnızca Ses" MP3/AAC | "Video" MP4)
    - Ses seçildiğinde kalite seçenekleri: 128 kbps, 192 kbps, 320 kbps
    - Video seçildiğinde kalite seçenekleri: 360p, 720p, 1080p
    - Misafir kullanıcı için kayıt/giriş ekranına yönlendirme
    - Zaten indirilmiş içerik için "Bu içerik zaten indirildi" mesajı
    - _Gereksinimler: 4.1, 4.2, 4.3, 4.10, 4.11_

  - [x] 15.2 İndirme yönetimini ve ilerleme takibini uygula
    - `components/download/DownloadProgressItem.tsx`: ilerleme çubuğu, yüzde (2 sn aralıklı güncelleme), "İndirme başladı" / "İndirme tamamlandı" bildirimleri
    - `downloadService.ts` içinde SSE bağlantısı ile sunucudan ilerleme al; `expo-file-system.downloadAsync()` ile cihaza kaydet
    - Ağ hatasında kısmi veriyi sakla (24 saat), "Kaldığı yerden devam et" seçeneği sun
    - Eşzamanlı 3 indirme limitini kontrol et; aşıldığında "En fazla 3 indirme" mesajı
    - _Gereksinimler: 4.4, 4.5, 4.6, 4.7, 4.8, 4.9_

  - [x] 15.3 Video oynatıcıdan indirme akışını bağla
    - `VideoPlayerScreen.tsx` içinde "Yalnızca Sesi İndir" ve "Videoyu İndir" seçeneklerini ekle
    - Seçim `DownloadSheet.tsx` bottom sheet'ini açar
    - _Gereksinimler: 9.9_

- [x] 16. Mobil — İndirilenler yönetim ekranı
  - [x] 16.1 İndirilenler ekranını uygula
    - `app/(tabs)/downloads.tsx`: indirilen tüm içerikleri listele — başlık, kanal adı, dosya boyutu (MB/GB), içerik türü (Ses/Video)
    - Toplam kullanılan depolama alanını MB/GB cinsinden göster
    - Boş durum: "Henüz indirilmiş içerik yok"
    - İndirilen ses: `AudioPlayerBar/Modal` ile çal (internet gerektirmez, `expo-file-system` yerel yol)
    - İndirilen video: `VideoPlayerScreen` ile oynat (yerel dosya)
    - Silme: onay dialogu ("Bu içeriği silmek istediğinizden emin misiniz?") → onayda dosyayı sil + listeyi güncelle
    - İptal: dialog kapanır, içerik silinmez
    - Çevrimdışı thumbnail ve meta veri gösterimi (thumbnail yoksa varsayılan görsel)
    - _Gereksinimler: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_

- [x] 17. Mobil — Playlist ekranları
  - [x] 17.1 Playlist listesi ve oluşturma ekranını uygula
    - `app/(tabs)/playlists.tsx`: kullanıcının playlist'lerini listele (`GET /api/playlists`)
    - Yeni playlist oluşturma: isim girişi (1–100 karakter, doğrulama + hata mesajı)
    - Playlist yeniden adlandırma ve silme (onay dialogu)
    - `components/playlist/PlaylistCard.tsx`: playlist adı, öğe sayısı
    - _Gereksinimler: 7.1, 7.5, 7.6_

  - [x] 17.2 Playlist detay ve içerik ekleme ekranlarını uygula
    - `app/playlist/[id].tsx`: playlist öğelerini listele, sırayı güncelle (`PUT /api/playlists/:id/items/reorder`)
    - `components/playlist/AddToPlaylistSheet.tsx`: içerik için "Playlist'e Ekle" seçeneği — mevcut playlist'leri listele, seçimde ekle + "İçerik eklendi" bildirimi
    - 500 öğe kapasitesi aşılırsa "Bu playlist maksimum kapasiteye ulaşmıştır" mesajı
    - Playlist çalma: sıralı mod + shuffle modu (toggle)
    - _Gereksinimler: 7.2, 7.3, 7.4, 7.5_

- [x] 18. Mobil — Kanal sayfası
  - [x] 18.1 Kanal sayfası ekranını uygula
    - `app/channel/[channelId].tsx`: kanal adı, thumbnail (yoksa varsayılan), içerik listesi
    - Her içerik için thumbnail, başlık, süre (MM:SS), yayımlanma tarihi
    - İçerik seçiminde `AudioPlayerBar` veya `VideoPlayerScreen` açılır
    - Sayfa başına 20 öğe, kaydırmayla sonraki sayfa yüklenir
    - Yükleme göstergesi; hata durumunda "Kanal içerikleri yüklenemedi" + yeniden dene
    - _Gereksinimler: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 19. Kontrol noktası — Mobil uygulama
  - Tüm ekranların birbirine bağlı olduğundan emin ol; `expo-router` navigasyonunu test et; `react-native-track-player` arka plan çalmayı doğrula. Sorun varsa kullanıcıya sor.

- [x] 20. Render.com deploy yapılandırması
  - [x] 20.1 render.yaml yapılandırma dosyasını oluştur
    - `render.yaml` içinde `web` (Express API, Docker runtime) ve `postgres` (Render managed DB) servislerini tanımla
    - Ortam değişkenleri: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `PORT=3000`
    - `healthCheckPath: /health` endpoint'i için `GET /health` route'u ekle
    - `backend/src/index.ts` içine `GET /health` → `{ status: 'ok' }` handler ekle
    - _Gereksinimler: Tasarım: Render.com Deployment Yapısı_

  - [x] 20.2 Dockerfile'ı üretim için optimize et
    - Multi-stage build: `builder` (TypeScript derleme) + `production` (yalnızca dist + node_modules)
    - `npm ci --only=production` ile gereksiz dev bağımlılıklarını dahil etme
    - `HEALTHCHECK CMD curl -f http://localhost:3000/health || exit 1` direktifini ekle
    - Güvenlik: root olmayan kullanıcı (`node` user) ile çalıştır
    - _Gereksinimler: Tasarım: Render.com Deployment Yapısı_

- [x] 21. EAS Build yapılandırması
  - [x] 21.1 EAS Build ve APK yapılandırmasını oluştur
    - `mobile/eas.json`: `development` (simulator), `preview` (internal APK), `production` (store APK) profilleri
    - `development`: `developmentClient: true`, `android.buildType: "apk"`
    - `preview`: `android.buildType: "apk"` (doğrudan cihaza yükleme)
    - `production`: `android.buildType: "app-bundle"` (Play Store için)
    - `mobile/app.json` içinde `android.package`, `versionCode`, `adaptiveIcon`, gerekli izinler, `react-native-track-player` eklentisini ekle
    - _Gereksinimler: Tasarım: Platform Kararları_

- [x] 22. Son kontrol noktası — Tüm testler ve entegrasyon
  - Tüm birim testleri ve özellik tabanlı testlerin geçtiğini doğrula; backend ve mobil entegrasyon akışlarını kontrol et. Sorun varsa kullanıcıya sor.

---

## Notes

- `*` ile işaretlenmiş görevler isteğe bağlıdır; hızlı MVP için atlanabilir
- Her görev gereksinim referansı içerir (izlenebilirlik)
- Özellik tabanlı testler `fast-check` kütüphanesi ile yazılır (min 100 iterasyon)
- Kontrol noktaları aşamalı doğrulama sağlar
- İndirilen medya dosyaları Render'da değil, kullanıcının Android cihazında saklanır
- `react-native-track-player` PlaybackService kaydı native Android build gerektirdiğinden EAS Build zorunludur

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["2.1", "2.2"] },
    { "id": 3, "tasks": ["2.3"] },
    { "id": 4, "tasks": ["3.1", "4.1"] },
    { "id": 5, "tasks": ["3.2", "3.3", "4.2"] },
    { "id": 6, "tasks": ["3.4", "3.5", "4.3", "4.4", "4.5"] },
    { "id": 7, "tasks": ["4.6", "6.1", "5.1"] },
    { "id": 8, "tasks": ["4.7", "4.8", "4.9", "5.2", "6.2", "7.1"] },
    { "id": 9, "tasks": ["5.3", "6.3", "7.2"] },
    { "id": 10, "tasks": ["9.1"] },
    { "id": 11, "tasks": ["9.2"] },
    { "id": 12, "tasks": ["10.1", "11.2"] },
    { "id": 13, "tasks": ["11.1", "12.1"] },
    { "id": 14, "tasks": ["13.1"] },
    { "id": 15, "tasks": ["13.2", "14.1"] },
    { "id": 16, "tasks": ["13.3", "15.1"] },
    { "id": 17, "tasks": ["13.4", "15.2", "16.1", "17.1"] },
    { "id": 18, "tasks": ["15.3", "17.2", "18.1"] },
    { "id": 19, "tasks": ["20.1", "21.1"] },
    { "id": 20, "tasks": ["20.2"] }
  ]
}
```
