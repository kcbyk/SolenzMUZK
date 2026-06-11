# Gereksinimler Belgesi

## Giriş

MYT Müzik Klonu, kullanıcıların YouTube üzerinden müzik ve video arayabildiği, dinleyebildiği/izleyebildiği ve cihazlarına indirebildiği bir web/mobil uygulamasıdır. Temel hedef; kullanıcılara YouTube'un geniş içerik kataloğuna erişim sağlamak, içerikleri ses (MP3/AAC) veya video (MP4) olarak indirebilmek ve kişiselleştirilmiş bir müzik/video deneyimi sunmaktır. İçerik arama ve keşif altyapısı yt-dlp kütüphanesi üzerine inşa edilmiştir.

---

## Sözlük

- **Sistem**: MYT Müzik Klonu uygulaması (web ve/veya mobil istemci + sunucu tarafı).
- **Kullanıcı**: Uygulamaya kayıtlı veya misafir olarak erişen son kullanıcı.
- **Kayıtlı_Kullanıcı**: Hesap oluşturmuş ve oturum açmış kullanıcı.
- **Misafir_Kullanıcı**: Kayıt olmadan uygulamayı kullanan kullanıcı.
- **İçerik**: YouTube'dan alınan ses veya video öğesi; başlık, kanal adı, süre, thumbnail ve YouTube video ID'si gibi meta verileri barındırır.
- **yt-dlp**: YouTube başta olmak üzere çeşitli platformlardan medya indirme ve meta veri çekme işlemlerini gerçekleştiren açık kaynaklı komut satırı aracı ve kütüphane.
- **YouTube_Arama_Motoru**: yt-dlp aracılığıyla YouTube'da sorgu çalıştıran ve sonuçları döndüren bileşen.
- **İndirme_Yöneticisi**: İndirme işlemlerini başlatan, izleyen ve tamamlayan bileşen.
- **Ses_Oynatıcı**: Ses içeriğini (audio-only stream) çalan, durduran ve kontrol eden bileşen.
- **Video_Oynatıcı**: Video içeriğini stream olarak oynatан, tam ekran ve kalite kontrolü sunan bileşen.
- **Playlist**: Kullanıcının oluşturduğu içerik listesi (şarkı veya video).
- **İndirilen_İçerik_Deposu**: Kullanıcının cihazına indirilen ses ve video dosyalarının yerel depolama alanı.
- **Meta_Veri**: İçeriğe ait başlık, kanal adı, süre, thumbnail URL ve YouTube video ID'si gibi bilgiler.
- **Ses_Kalitesi**: Ses içeriğinin bit hızı ile ifade edilen kalite düzeyi (örn. 128 kbps, 192 kbps, 320 kbps).
- **Video_Kalitesi**: Video içeriğinin çözünürlük ile ifade edilen kalite düzeyi (örn. 360p, 720p, 1080p).
- **Thumbnail**: YouTube'un her video için sağladığı küçük önizleme görseli.
- **Kanal**: İçeriği yayımlayan YouTube kanal adı.
- **Audio_Stream**: Yalnızca ses içeren, görüntü barındırmayan medya akışı.
- **Video_Stream**: Ses ve görüntü birlikte içeren medya akışı.

---

## Gereksinimler

### Gereksinim 1: YouTube İçerik Arama

**Kullanıcı Hikâyesi:** Bir kullanıcı olarak, YouTube'da şarkı adı, sanatçı adı veya video başlığına göre arama yapabilmek istiyorum; böylece yt-dlp aracılığıyla istediğim müzik veya videoyu hızlıca bulabilirim.

#### Kabul Kriterleri

1. WHEN kullanıcı arama kutusuna en az 2 karakter girdiğinde, THE YouTube_Arama_Motoru SHALL sorguyu yt-dlp kütüphanesi aracılığıyla YouTube'a iletmeli ve sonuçları döndürmelidir.
2. WHEN kullanıcı en az 2 karakter girdiğinde, THE YouTube_Arama_Motoru SHALL arama sonuçlarını 3 saniye içinde listelemelidir.
3. WHEN arama sonucu bulunduğunda, THE Sistem SHALL her sonuç için thumbnail görseli, başlık, kanal adı ve süreyi MM:SS formatında görüntülemeli; sonuç sayısı en fazla 50 ile sınırlandırılmalıdır.
4. IF arama sorgusuyla eşleşen YouTube sonucu bulunamazsa, THEN THE Sistem SHALL kullanıcıya "Sonuç bulunamadı" mesajı göstermelidir.
5. THE YouTube_Arama_Motoru SHALL Türkçe karakterleri (ş→s, ğ→g, ı→i, ü→u, ö→o, ç→c) büyük/küçük harf duyarsız ve karakter normalize edilmiş biçimde işlemelidir.
6. IF kullanıcı 200 karakterden uzun bir sorgu girerse, THEN THE Sistem SHALL sorguyu 200 karakterde keserek arama yapmalı ve kullanıcıya uyarı göstermelidir.
7. IF yt-dlp kütüphanesi YouTube'a erişemezse veya hata döndürürse, THEN THE Sistem SHALL kullanıcıya "Arama gerçekleştirilemedi, lütfen tekrar deneyin" mesajı göstermeli ve yeniden deneme seçeneği sunmalıdır.

---

### Gereksinim 2: YouTube İçerik Listeleme ve Keşif

**Kullanıcı Hikâyesi:** Bir kullanıcı olarak, YouTube'daki popüler ve önerilen içerikleri ana ekranda görmek istiyorum; böylece aktif arama yapmadan yeni müzikler ve videolar keşfedebilirim.

#### Kabul Kriterleri

1. THE Sistem SHALL ana sayfada yt-dlp aracılığıyla çekilen trend/popüler YouTube içeriklerini sayfa başına 20 öğe gelecek şekilde sayfalı (pagination) biçimde listeleyecektir; kullanıcı "Sonraki / Önceki" kontrolleriyle gezinebilmelidir.
2. WHEN kullanıcı bir içerik kategorisi (müzik, oyun, eğitim vb.) seçtiğinde, THE Sistem SHALL ilgili kategoriye ait YouTube içeriklerini 3 saniye içinde listeleyecektir.
3. THE Sistem SHALL her içerik için thumbnail görseli, başlık, kanal adı ve süreyi MM:SS formatında liste görünümünde göstermelidir; thumbnail mevcut değilse varsayılan görsel kullanılmalıdır.
4. WHEN içerik listesi yüklenirken, THE Sistem SHALL kullanıcıya yükleme göstergesi (loading indicator) sunmalıdır.
5. IF yt-dlp aracılığıyla içerik listesi alınamazsa, THEN THE Sistem SHALL kullanıcıya "İçerikler yüklenemedi, lütfen tekrar deneyin" mesajı göstermeli ve yeniden deneme düğmesi sunmalıdır.
6. WHEN seçilen kategoride hiç içerik bulunamazsa, THE Sistem SHALL "Bu kategoride henüz içerik yok" mesajı göstermelidir.

---

### Gereksinim 3: İçerik Çalma (Streaming)

**Kullanıcı Hikâyesi:** Bir kullanıcı olarak, bir içeriğe tıkladığımda onu anında dinleyebilmek veya izleyebilmek istiyorum; böylece önce indirmeden müzik dinleyebilir veya video izleyebilirim.

#### Kabul Kriterleri

1. WHEN kullanıcı bir ses içeriğini seçtiğinde, THE Ses_Oynatıcı SHALL yt-dlp üzerinden audio-only stream URL'ini alarak normal ağ koşullarında 3 saniye içinde çalmaya başlamalıdır.
2. WHEN kullanıcı bir video içeriğini seçtiğinde, THE Video_Oynatıcı SHALL yt-dlp üzerinden video stream URL'ini alarak normal ağ koşullarında 3 saniye içinde oynatmaya başlamalıdır.
3. THE Ses_Oynatıcı SHALL oynat, duraklat, sonraki parçaya geç, önceki parçaya geç ve ses seviyesi (0–100%) kontrol düğmelerini her zaman görünür ve tıklanabilir biçimde sunmalıdır.
4. THE Video_Oynatıcı SHALL oynat, duraklat, ileri/geri sarma, ses seviyesi (0–100%) ve tam ekran kontrol düğmelerini her zaman görünür ve tıklanabilir biçimde sunmalıdır.
5. THE Ses_Oynatıcı SHALL çalan içeriğin thumbnail görselini, başlığını ve kanal adını ekranda göstermelidir; thumbnail mevcut değilse varsayılan görsel kullanılmalıdır.
6. THE Ses_Oynatıcı SHALL çalan içeriğin geçen süresini en fazla 1 saniyelik aralıklarla güncelleyerek MM:SS formatında ve toplam süreyle birlikte göstermelidir.
7. WHILE bir içerik çalıyorken, THE Ses_Oynatıcı SHALL kullanıcının uygulama içinde başka sayfalara geçmesine izin vermeli ve arka planda çalmayı kesintisiz sürdürmelidir.
8. IF ağ bağlantısı kesilirse ve içerik tamamen yüklenmemişse, THEN THE Ses_Oynatıcı SHALL çalmayı duraklatmalı, "Bağlantı kesildi" uyarısı göstermeli; bağlantı yeniden kurulduğunda otomatik olarak kaldığı yerden devam etmelidir.
9. IF içerik 5 saniye içinde yüklenmezse, THEN THE Sistem SHALL kullanıcıya "İçerik yüklenemedi, lütfen tekrar deneyin" mesajı göstermeli ve yeniden deneme seçeneği sunmalıdır.

---

### Gereksinim 4: İçerik İndirme (Ses ve Video)

**Kullanıcı Hikâyesi:** Kayıtlı bir kullanıcı olarak, YouTube içeriklerini ses (MP3/AAC) veya video (MP4) formatında cihazıma indirebilmek istiyorum; böylece internet bağlantısı olmadan da dinleyebilir veya izleyebilirim.

#### Kabul Kriterleri

1. WHEN Kayıtlı_Kullanıcı bir içerik için "İndir" düğmesine tıkladığında, THE Sistem SHALL kullanıcıya format seçim diyalogu göstermeli; kullanıcı "Yalnızca Ses" (MP3/AAC) veya "Video" (MP4) seçeneklerinden birini seçebilmelidir.
2. WHERE kullanıcı "Yalnızca Ses" formatını seçmişse, THE Sistem SHALL ses kalitesi seçeneklerini (128 kbps, 192 kbps, 320 kbps) kullanıcıya sunmalıdır.
3. WHERE kullanıcı "Video" formatını seçmişse, THE Sistem SHALL yt-dlp aracılığıyla mevcut video kalite seçeneklerini (360p, 720p, 1080p) kullanıcıya sunmalıdır.
4. WHEN kullanıcı format ve kalite seçimini tamamladığında, THE İndirme_Yöneticisi SHALL yt-dlp aracılığıyla indirme işlemini başlatmalı ve "İndirme başladı" bildirimini göstermelidir.
5. WHILE indirme devam ederken, THE İndirme_Yöneticisi SHALL kullanıcıya her 2 saniyede bir güncellenen yüzde cinsinden ilerleme göstermelidir (örn. %45).
6. WHEN indirme tamamlandığında, THE İndirme_Yöneticisi SHALL kullanıcıya "İndirme başarıyla tamamlandı" bildirimi göndermelidir.
7. IF indirme sırasında ağ hatası oluşursa, THEN THE İndirme_Yöneticisi SHALL kısmi indirme verisini 24 saat boyunca saklamalı ve kullanıcıya "Kaldığı yerden devam et" seçeneği sunmalıdır.
8. WHEN kullanıcı "Kaldığı yerden devam et" seçeneğine tıkladığında, THE İndirme_Yöneticisi SHALL indirmeyi kaldığı bayttan itibaren sürdürmelidir.
9. WHEN eşzamanlı indirme sayısı 3'e ulaştığında, THE İndirme_Yöneticisi SHALL yeni indirme taleplerini reddetmeli ve kullanıcıya "En fazla 3 indirme aynı anda yapılabilir" mesajı göstermelidir.
10. WHEN Misafir_Kullanıcı "İndir" düğmesine tıkladığında, THE Sistem SHALL kullanıcıyı kayıt/giriş ekranına yönlendirmelidir.
11. WHEN Kayıtlı_Kullanıcı daha önce indirilmiş bir içerik için "İndir" düğmesine tıkladığında, THE Sistem SHALL indirme başlatmadan kullanıcıya "Bu içerik zaten indirildi" mesajı göstermelidir.

---

### Gereksinim 5: İndirilen İçeriklerin Yönetimi

**Kullanıcı Hikâyesi:** Kayıtlı bir kullanıcı olarak, indirdiğim ses ve video dosyalarını görüntüleyebilmek, çalabilmek/izleyebilmek ve silebilmek istiyorum; böylece cihazımdaki depolama alanını yönetebilirim.

#### Kabul Kriterleri

1. WHEN Kayıtlı_Kullanıcı "İndirilenler" bölümünü açtığında, THE Sistem SHALL indirilen tüm içerikleri başlık, kanal adı, dosya boyutu (KB veya MB) ve içerik türü (Ses / Video) bilgileriyle listeleyerek göstermelidir.
2. IF hiç indirilmiş içerik yoksa, THEN THE Sistem SHALL "Henüz indirilmiş içerik yok" mesajını göstermelidir.
3. WHEN kullanıcı indirilen bir ses içeriğini seçtiğinde, THE Ses_Oynatıcı SHALL içeriği internet bağlantısı olmaksızın İndirilen_İçerik_Deposu'ndan çalmalıdır.
4. WHEN kullanıcı indirilen bir video içeriğini seçtiğinde, THE Video_Oynatıcı SHALL içeriği internet bağlantısı olmaksızın İndirilen_İçerik_Deposu'ndan oynatmalıdır.
5. WHEN kullanıcı bir içeriği silmek istediğinde, THE Sistem SHALL "Bu içeriği silmek istediğinizden emin misiniz?" onay dialogu göstermelidir.
6. WHEN kullanıcı silme işlemini onayladığında, THE Sistem SHALL içeriği İndirilen_İçerik_Deposu'ndan kaldırmalı ve listeyi güncellemelidir.
7. WHEN kullanıcı silme dialogunda "İptal" seçeneğine tıkladığında, THE Sistem SHALL içeriği silmeden dialogu kapatmalıdır.
8. THE Sistem SHALL İndirilenler bölümünde tüm indirilen içeriklerin toplam kapladığı depolama alanını; 1024 MB altında MB, 1024 MB ve üzerinde GB cinsinden göstermelidir.
9. THE Sistem SHALL indirilen içeriklerin Meta_Veri bilgilerini (başlık, kanal adı, süre, thumbnail) çevrimdışı ortamda da eksiksiz göstermeli; thumbnail mevcut değilse varsayılan görsel kullanılmalıdır.

---

### Gereksinim 6: Kullanıcı Hesabı ve Kimlik Doğrulama

**Kullanıcı Hikâyesi:** Bir kullanıcı olarak, uygulamaya kayıt olabilmek ve giriş yapabilmek istiyorum; böylece indirme geçmişim ve ayarlarım cihazlar arasında saklanabilsin.

#### Kabul Kriterleri

1. THE Sistem SHALL kullanıcının e-posta adresi ve şifre ile kayıt olmasına olanak tanımalıdır.
2. WHEN kullanıcı kayıt formunu gönderdiğinde, THE Sistem SHALL e-posta adresinin RFC 5322 formatına uygun olduğunu ve şifrenin en az 8 karakter, en az 1 büyük harf ve en az 1 rakam içerdiğini doğrulamalı; hatalı alanların altında açıklayıcı hata mesajı göstermelidir.
3. WHEN geçersiz giriş bilgileri girildiğinde, THE Sistem SHALL hangi alanın hatalı olduğunu belirtmeksizin yalnızca "E-posta veya şifre hatalı" mesajı göstermelidir.
4. WHEN kullanıcı başarıyla giriş yaptığında, THE Sistem SHALL oturum token'ını HttpOnly çerezi veya güvenli yerel depolama alanında saklayarak kullanıcıyı ana sayfaya yönlendirmelidir.
5. WHEN kullanıcı "Şifremi Unuttum" seçeneğine tıklayıp e-posta adresini girdiğinde, THE Sistem SHALL o adrese tek kullanımlık şifre sıfırlama bağlantısı göndermelidir; bağlantı 30 dakika sonra otomatik olarak geçersiz hale gelmelidir.
6. IF şifre sıfırlama bağlantısı 30 dakikalık süreyi aştıktan sonra kullanılırsa, THEN THE Sistem SHALL "Bu bağlantının süresi dolmuştur, lütfen yeni bir sıfırlama talebinde bulunun" mesajı göstermelidir.
7. WHEN kullanıcı 5 ardışık başarısız giriş denemesi yaparsa, THE Sistem SHALL ilgili hesabı 15 dakika boyunca kilitlemeli ve kullanıcıya bildirim göstermelidir.

---

### Gereksinim 7: Playlist Yönetimi

**Kullanıcı Hikâyesi:** Kayıtlı bir kullanıcı olarak, kendi playlist'lerimi oluşturabilmek ve yönetebilmek istiyorum; böylece sevdiğim şarkıları ve videoları düzenli biçimde tutabilirim.

#### Kabul Kriterleri

1. THE Sistem SHALL Kayıtlı_Kullanıcının en az 1, en fazla 100 karakter uzunluğunda isimli playlist oluşturmasına, yeniden adlandırmasına ve silmesine olanak tanımalıdır.
2. WHEN kullanıcı bir içeriği playlist'e eklemek istediğinde, THE Sistem SHALL kullanıcının mevcut playlist'lerini listeleyerek seçim yapmasına izin vermeli; seçim sonrası "İçerik eklendi" bildirimi göstermelidir.
3. IF kullanıcı bir içeriği zaten 500 öğe içeren bir playlist'e eklemeye çalışırsa, THEN THE Sistem SHALL eklemeyi reddetmeli ve "Bu playlist maksimum kapasiteye ulaşmıştır" mesajı göstermelidir.
4. WHEN Kayıtlı_Kullanıcı bir playlist'i çalmak istediğinde, THE Ses_Oynatıcı SHALL playlist'teki ses içeriklerini sıralı modda çalmalı; kullanıcı isterse karışık (shuffle) moda geçebilmelidir.
5. THE Sistem SHALL playlist bilgilerini (ad, içerik listesi, sıra) sunucu tarafında saklayarak kullanıcının farklı cihazlardan aynı playlist'lere erişmesini sağlamalıdır.
6. WHEN kullanıcı bir playlist'i silmek istediğinde, THE Sistem SHALL "Bu playlist'i silmek istediğinizden emin misiniz?" onay dialogu göstermeli ve onay alındıktan sonra silme işlemini gerçekleştirmelidir.

---

### Gereksinim 8: YouTube Kanal Sayfası

**Kullanıcı Hikâyesi:** Bir kullanıcı olarak, bir içeriğin kanal adına tıklayarak o YouTube kanalına ait içerikleri görüntülemek istiyorum; böylece aynı kanalın diğer videolarına ve müziklerine kolayca ulaşabilirim.

#### Kabul Kriterleri

1. WHEN kullanıcı bir içeriğin kanal adına tıkladığında, THE Sistem SHALL yt-dlp aracılığıyla o kanala ait içerikleri 3 saniye içinde listeleyerek kanal sayfasını açmalıdır.
2. THE Sistem SHALL kanal sayfasında kanal adı, kanal thumbnail görseli (mevcut değilse varsayılan görsel) ve kanala ait içerik listesini göstermelidir.
3. THE Sistem SHALL kanal sayfasındaki her içerik için thumbnail, başlık, süre (MM:SS) ve yayımlanma tarihini göstermelidir.
4. WHEN kullanıcı kanal sayfasındaki bir içeriğe tıkladığında, THE Sistem SHALL ilgili içeriği Ses_Oynatıcı veya Video_Oynatıcı üzerinden çalmaya başlamalıdır.
5. IF kanal verisi yt-dlp aracılığıyla yüklenemezse, THEN THE Sistem SHALL "Kanal içerikleri yüklenemedi, lütfen tekrar deneyin" mesajı ve yeniden deneme düğmesi göstermelidir.

---

### Gereksinim 9: Video İzleme

**Kullanıcı Hikâyesi:** Bir kullanıcı olarak, müzik videoları ve diğer YouTube videolarını uygulama içinde izleyebilmek istiyorum; böylece yalnızca ses dinlemekle sınırlı kalmadan tam video deneyimi yaşayabilirim.

#### Kabul Kriterleri

1. WHEN kullanıcı bir video içeriğini seçtiğinde, THE Video_Oynatıcı SHALL yt-dlp üzerinden video stream URL'ini alarak en az 10 Mbps indirme hızında 3 saniye içinde video oynatmaya başlamalıdır.
2. THE Video_Oynatıcı SHALL oynat, duraklat, ileri/geri sarma (±10 saniye), ses seviyesi (0–100%) ve tam ekran kontrol düğmelerini her zaman görünür ve tıklanabilir biçimde sunmalıdır.
3. WHEN kullanıcı tam ekran düğmesine tıkladığında, THE Video_Oynatıcı SHALL videoyu cihazın tam ekran modunda göstermeli ve kontrol düğmeleri tam ekranda da erişilebilir kalmalıdır.
4. WHEN kullanıcı video oynatılırken bir kalite seçeneği (360p, 720p, 1080p) seçtiğinde, THE Video_Oynatıcı SHALL 3 saniye içinde seçilen kaliteye geçmeli ve oynatma konumunu korumalıdır.
5. THE Video_Oynatıcı SHALL oynatılan videonun başlığını ve kanal adını video arayüzünde görüntülemeli; meta veri alınamazsa "Bilinmiyor" değerini kullanmalıdır.
6. WHILE video oynatılırken, THE Video_Oynatıcı SHALL videonun geçen süresini en fazla 1 saniyelik aralıklarla güncelleyerek MM:SS formatında ve toplam süreyle birlikte göstermelidir.
7. IF ağ bağlantısı kesilirse ve video tamamen yüklenmemişse, THEN THE Video_Oynatıcı SHALL oynatmayı duraklatmalı, "Bağlantı kesildi" uyarısı göstermeli; bağlantı yeniden kurulduğunda otomatik olarak kaldığı yerden devam etmelidir.
8. IF video 5 saniye içinde yüklenmezse, THEN THE Video_Oynatıcı SHALL kullanıcıya "Video yüklenemedi, lütfen tekrar deneyin" mesajı göstermeli; kullanıcı en fazla 3 kez yeniden deneyebilmelidir.
9. WHEN kullanıcı video oynatma ekranında "Yalnızca Sesi İndir" veya "Videoyu İndir" seçeneğini seçtiğinde, THE Sistem SHALL ilgili format ve kalite seçim diyalogunu açarak Gereksinim 4'teki indirme akışını başlatmalıdır.
