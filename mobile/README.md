# MYT Müzik — Mobil Uygulama

## APK Oluşturma

### Önkoşullar
- Node.js 20+
- EAS CLI: `npm install -g eas-cli`
- Expo hesabı: `eas login`

### Geliştirme APK (yerel test için)
```bash
cd mobile
eas build --platform android --profile development
```

### Önizleme APK (doğrudan cihaza yükleme)
```bash
eas build --platform android --profile preview
```
Bu komut bir APK dosyası oluşturur — QR kod ile veya doğrudan `eas build:download` ile indirip cihaza yükleyebilirsiniz.

### Üretim Build (Google Play için)
```bash
eas build --platform android --profile production
```

## Backend URL Ayarı

`eas.json` içindeki `EXPO_PUBLIC_API_URL` değerini kendi Render.com backend URL'iniz ile değiştirin.

## Backend Deploy (Render.com)

1. Repo'yu GitHub'a push edin
2. [render.com](https://render.com) → "New" → "Blueprint" → repo'yu seçin
3. `render.yaml` otomatik olarak servisleri oluşturur
4. Deploy tamamlandığında backend URL'ini `eas.json`'a yapıştırın
