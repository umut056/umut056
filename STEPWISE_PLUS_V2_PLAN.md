# StepWise Plus V2 Analiz ve Yol Haritasi

Bu dokuman, mevcut repository icindeki calisan StepWise Plus uygulamasinin V2 icin profesyonel analiz raporudur.

Kapsam disi birakilanlar:

- Bu asamada yeni ozellik implementasyonu yapilmadi.
- Mevcut uygulama kodu degistirilmedi.
- Dosya silinmedi.
- Veritabani migration'i uygulanmadi.
- APK/AAB uretilmedi.

Bu raporun amaci mevcut durumu netlestirmek, hedef mimariyle farklari cikarmak ve onay sonrasi uygulanacak refactor/yeni gelistirme sirasini belirlemektir.

---

## Asama 1 - Mevcut Proje Analizi

### Genel Mimari

Mevcut proje, React tabanli bir mobil-web uygulamasidir. Android tarafi Capacitor ile paketlenmektedir. Uygulama tek sayfa uygulamasi gibi calisir; ekran gecisleri URL routing ile degil, React state ve tab state uzerinden yonetilir.

Ana mimari katmanlari:

- Frontend: React + Vite
- Native kabuk: Capacitor Android
- Cloud backend: Supabase PostgreSQL + Supabase Auth + Supabase Storage + Edge Functions
- Bildirim: Firebase Cloud Messaging
- Lokal veri: localStorage + IndexedDB
- Alarm: Android native AlarmManager + BroadcastReceiver

Mevcut uygulama sifirdan yapilacak durumda degil; calisan bir MVP/ileri prototip halinden gercek urune evrilecek durumda.

### Kullanilan Paketler

`package.json` uzerinden gorulen ana paketler:

- `react`
- `react-dom`
- `vite`
- `@vitejs/plugin-react`
- `@capacitor/core`
- `@capacitor/android`
- `@capacitor/cli`

Dikkat ceken durumlar:

- UI kutuphanesi yok.
- Router kutuphanesi yok.
- State management kutuphanesi yok.
- Form/validation kutuphanesi yok.
- Test kutuphanesi yok.
- Supabase JS SDK kullanilmiyor; REST cagirilari custom fetch helper'lariyla yapiliyor.
- OpenAI entegrasyonu henuz yok.

Bu sade paket yapisi APK boyutunu kucuk tutar; ancak buyuyen uygulamada bakim maliyetini artirir.

### Dosya Yapisi

Onemli dosyalar:

- `src/App.jsx`: Uygulamanin buyuk bolumu burada. Ekranlar, sabit veriler, local DB helper'lari, UI bilesenleri, programlar ve is kurallari ayni dosyada.
- `src/main.jsx`: React uygulamasini baslatir.
- `src/lib/production.js`: Supabase REST, Edge Function, Storage ve cloud sync islemleri.
- `src/lib/session.js`: Native session durumu ile iliskili yardimcilar.
- `src/lib/alarms.js`: Web tarafindan native alarm katmanina veri gonderen yardimcilar.
- `supabase/schema.sql`: Ana veritabani semasi.
- `supabase/migrations/*`: Uygulanmis/planlanmis migration dosyalari.
- `supabase/functions/*`: Admin user create, coach client create, workspace import, notification fonksiyonlari.
- `android/app/src/main/java/app/stepwise/plus/*`: Native Android alarm, boot restore, FCM ve bridge kodlari.
- `public/*`: Logo, ikon, arka plan ve gorsel asset'ler.

Teknik gozlem:

`src/App.jsx` yaklasik 2500+ satirlik monolit bir dosya haline gelmis. Bu dosya artik uygulamanin en buyuk teknik borcudur.

### State Management

Mevcut state yonetimi:

- React `useState`
- React `useEffect`
- React `useMemo`
- React `useRef`
- `localStorage`
- `sessionStorage`
- `IndexedDB`

Kullanilan lokal veri anahtarlari:

- `ct_users`
- `ct_msgs`
- `ct_sess`
- `ct_task_logs`
- `ct_audit_logs`
- `ct_programs`
- `ct_coach_codes`
- `ct_seed_version`
- `ct_session`

Medya icin:

- IndexedDB database: `stepwise_media`
- Object store: `videos`

Sorun:

Lokal state ile Supabase cloud state birlikte yasiyor. Bu durum test icin yararli, fakat production icin veri tutarsizligi riski doguruyor. Cloud login basarisiz olursa lokal fallback devreye girebiliyor. Bu, yayin modunda kullanicinin gercek auth durumunu belirsizlestirebilir.

### Routing

Projede React Router yok.

Mevcut akista:

- Login/Register ekranlari state ile gosteriliyor.
- Admin, koc ve danisan rolleri role bazli render ediliyor.
- Koc tablari: Ozet, Danisanlar, Takvim, Mesajlar, Rapor, Profil
- Danisan tablari: Ozet, Gorevler, Takvim, Ilerleme, Kocum, Profil
- Admin panel ayri render ediliyor.

Risk:

URL tabanli route olmadigi icin:

- Derin link yok.
- Geri tusu davranislari custom cozulmek zorunda.
- Ekranlar arasinda test yazmak zorlasir.
- Buyuk modullerde ekran izolasyonu dusuk kalir.

### Authentication

Mevcut auth akisi:

- Supabase Auth email/password ile login deneniyor.
- Kullanici profili `profiles` tablosundan okunuyor.
- Hata olursa lokal kullanici verisine fallback yapiliyor.
- Admin/coach/client rolleri profile role alanindan geliyor.

Kullanici rolleri:

- `admin`
- `coach`
- `client`

Kayit/kullanici olusturma:

- Coach/admin tarafinda Supabase Edge Functions kullaniliyor.
- `admin-create-user`
- `coach-create-client`
- `registerAccount`

Eksikler:

- Production ve demo auth ayrimi yeterince sert degil.
- Demo kullanici bilgileri source icinde duruyor.
- Auth fallback production'da riskli.
- Admin yetkileri daha ayrintili role/permission seviyesine ayrilmamis.
- Password policy, email confirmation ve account hardening tarafi tamamen urun seviyesine tasinmali.

### Database Yapisi

Supabase tarafinda mevcut ana tablolar:

- `profiles`
- `coach_codes`
- `programs`
- `program_tasks`
- `client_programs`
- `body_metrics`
- `task_logs`
- `daily_task_status`
- `messages`
- `appointments`
- `media_files`
- `notifications`
- `device_tokens`
- `audit_logs`

Mevcut guclu taraflar:

- Role bazli RLS acik.
- Coach-client iliskisi icin helper function var.
- Storage bucket private tasarlanmis.
- Audit log temeli var.
- Program/task yapisi ayrilmis.
- Bildirim ve cihaz token tablolari dusunulmus.

Eksikler:

- Body metrics yeterince genis degil.
- Progress photo ayri domain olarak yok.
- Nutrition log ayri domain olarak yok.
- Product tracking ayri domain olarak yok.
- Premium/billing tablolari yok.
- AI prompt/report/conversation/embedding tablolari yok.
- Task proof/review sureci ayrica modellenmemis.
- Program donguleri icin 3 gun atomlu / 2 gun atomsuz gibi kurallar net semaya islenmemis.
- Cloud ve local data mapping bazi alanlari kaybedebilir.

### UI Component Sistemi

UI custom yazilmis.

Kullanilan yapilar:

- Inline style agirlikli React component'leri
- `Card`, `Pill`, `ScreenBoundary` gibi yardimci bilesenler
- Merkezi renk/font sabitleri
- Plus Jakarta Sans
- Yesil/beyaz wellness tasarim dili
- Rounded card tabanli mobil tasarim

Material Design degil.

Cupertino degil.

Custom wellness UI.

Sorun:

Component sistemi tam olusmamis. Benzer kartlar, butonlar, avatarlar, inputlar ve listeler farkli ekranlarda tekrar tekrar yazilmis. Bu da tasarim tutarliligini bozma riskini artiriyor.

### Theme Sistemi

Tema, `src/App.jsx` icinde renk/font sabitleriyle yonetiliyor.

Guclu taraf:

- Marka rengi ve font fikri mevcut.
- Giris ekrani yeni wellness tarzina yaklasmis.

Zayif taraf:

- Tema merkezi bir dosyada degil.
- Light/dark/premium temalar icin altyapi yok.
- Spacing, radius, elevation, typography token'lari net degil.
- Native status bar/nav bar temasi tum ekranlarda garanti degil.

### Eksik Moduller

Hedef wellness platforma gore eksik veya yetersiz moduller:

- AI Coach
- AI Nutrition
- AI Vision
- AI Reports
- AI Motivation
- AI Reminder
- Premium abonelik
- Structured Herbalife product tracking
- Structured nutrition tracking
- Progress photo timeline
- Measurement tracking detayi
- Coach dashboard analytics
- Admin security/compliance paneli
- Bildirim merkezi
- Offline queue ve sync conflict handling
- Test altyapisi
- Crash reporting / observability
- Kullanici aktivite loglari icin daha detayli admin gorunumu

### Kullanilmayan / Supheli Kodlar

Kesin silme onerisinden once detayli test gerekir; ancak supheli alanlar:

- Demo seed hesaplar production bundle icinde yer aliyor.
- Bazi demo UI bloklari kapatilmis olsa bile kod olarak duruyor.
- Cloud fallback ve local fallback ayni akista oldugu icin gereksiz karmasiklik olusmus.
- Koclar arasi sohbet taslak altyapisi varsa urunde gorunmemeli, moduler feature flag ile ayrilmali.
- Bazi bildirim/metin alanlarinda bozuk Turkce karakterler bulunuyor.
- `ScreenBoundary` beyaz ekranlari engelliyor ama asil crash nedenini gizleyebilir.

### Teknik Borclar

En kritik teknik borclar:

1. `App.jsx` monolit yapisi.
2. Local/cloud veri cift kaynak problemi.
3. Program atama/gorev dongusu kurallarinin tek bir engine'de olmamasi.
4. Mesajlasmanin polling/fetch yaklasimiyla sinirli kalmasi.
5. Medya upload, thumbnail, kalicilik ve storage lifecycle sureclerinin netlesmemesi.
6. Alarm davranisinin session/gunluk gorev state'i ile tam uyumlu olmamasi.
7. Test altyapisinin olmamasi.
8. Admin guvenlik/permission ayriminin yetersiz kalmasi.
9. AI icin hic backend proxy ve veri modeli olmamasi.
10. UI component system'in oturmamis olmasi.

---

## Asama 2 - Hedef Mimariyle Karsilastirma

Hedef urun:

- Wellness Platform
- AI Coach
- Coach Dashboard
- Herbalife Product Tracking
- Progress Photos
- Weight Tracking
- Measurement Tracking
- Nutrition Tracking
- Tasks
- Notifications
- Premium
- Admin Panel

### Wellness Platform

Mevcut durum:

- Wellness mantigi programlar, gorevler, kilo takibi ve danisan/koc iliskisi uzerinden baslamis.

Eksik:

- Wellness verileri ayri domain modullerine ayrilmamis.
- Beslenme, urun, beden olcumu, fotograf ve motivasyon parcali durumda.

Entegrasyon:

- `wellness` domain'i altinda measurement, weight, progress photos, nutrition ve product usage birlestirilmeli.

### AI Coach

Mevcut durum:

- AI yok.

Entegrasyon:

- OpenAI API dogrudan APK icine konmayacak.
- Supabase Edge Function AI proxy olacak.
- Danisanin gorevleri, kilo verisi, beden analizi ve program bilgisi AI context olarak kullanilacak.
- AI cevaplari koc denetimli/human-in-the-loop tasarlanacak.

### Coach Dashboard

Mevcut durum:

- Koc ozet ekrani var.
- Aktif danisan, riskli, fotograf, uyum gibi metrikler var.

Eksik:

- Dashboard metrikleri moduler degil.
- Rapor ekrani daha once beyaz ekran riski yasamis.
- Bildirim/aksiyon merkezi tam degil.

Entegrasyon:

- Koc dashboard, action inbox mantigina cevrilmeli:
  - Onay bekleyen fotograflar
  - Riskli danisanlar
  - Kacan gorevler
  - Yeni mesajlar
  - Randevu talepleri
  - AI risk uyarilari

### Herbalife Product Tracking

Mevcut durum:

- Urunler program metinlerinde ve gorev iceriklerinde geciyor.
- Olcekler gorev etiketleri olarak kismen var.

Eksik:

- Urun katalogu yok.
- Urun kullanim log'u yok.
- Stok/bitis/hatirlatici yok.
- Urun fotografi veya video anlatimlari programla yapisal bagli degil.

Entegrasyon:

- `products`, `program_products`, `product_usage_events` tablolari eklenmeli.
- Program gorevleri urun ve olceklerle iliskilendirilmeli.

### Progress Photos

Mevcut durum:

- Gorev kanit fotografi ve media_files altyapisi var.

Eksik:

- Once/sonra albumu yok.
- Aylik karsilastirma yok.
- AI vision analiz pipeline'i yok.

Entegrasyon:

- `progress_photos` tablosu eklenmeli.
- Storage path, thumbnail path, capture date ve privacy alanlari olmali.

### Weight Tracking

Mevcut durum:

- Body metrics ve local body alanlari var.
- Baslangic/guncel/hedef/degesim UI'da gosteriliyor.

Eksik:

- Veri kaynagi bazen undefined uretmis.
- Kilo gecmisi ve hedefe ilerleme net domain degil.

Entegrasyon:

- `weight_entries` veya genisletilmis `body_metrics` ile tarihsel kilo log'u tutulmali.
- Tebrik milestone sistemi bu log uzerinden calismali.

### Measurement Tracking

Mevcut durum:

- Boy, kilo, yag orani, BMI gibi baslangic alanlari var.

Eksik:

- Bel, kalca, gogus, kol, bacak, su, kas, metabolik yas gibi detaylar semada net degil.

Entegrasyon:

- `measurement_entries` tablosu veya `body_metrics` genisletmesi yapilmali.

### Nutrition Tracking

Mevcut durum:

- Program gorevleri beslenme akisini tarif ediyor.

Eksik:

- Ogun log'u yok.
- Kalori/makro yok.
- AI nutrition analizi yok.
- Fotografli yemek analizi yok.

Entegrasyon:

- `nutrition_logs`, `meal_items`, `meal_photos` eklenmeli.

### Tasks

Mevcut durum:

- Program task mantigi var.
- Gorev fotografi ve alarm mantigi var.

Eksik:

- Program dongu engine'i yeterince formal degil.
- Gunluk sifirlama ve kacinci gun/dongu hesaplari tek merkezde degil.
- Task proof review modeli ayrik degil.

Entegrasyon:

- Program task engine ayrilmali.
- Cycle rules ve task proof review semaya eklenmeli.

### Notifications

Mevcut durum:

- Supabase notifications tablosu, Edge Function, FCM, native notification var.

Eksik:

- Bildirim tipi, aksiyon, entity id, okundu/silindi/kapandi state'i yetersiz.
- Alarm ve remote notification ayrimi netlestirilmeli.

Entegrasyon:

- `notification_events` veya mevcut `notifications` genisletmesi yapilmali.
- Mesaj bildirimi, gorev bildirimi, randevu bildirimi ve admin bildirimi ayrilmali.

### Premium

Mevcut durum:

- Yok.

Entegrasyon:

- Baslangicta sadece feature flag + plan modeli.
- Daha sonra Google Play Billing.

### Admin Panel

Mevcut durum:

- Mobil/admin panel mevcut.
- Kullanicilar, yasaklama ve bazi yonetim islemleri var.

Eksik:

- Yetki matrisi.
- Audit log gorunumu.
- Plan/premium yonetimi.
- Koc-danisan baglanti gorunumu.
- Veri duzeltme ve support aksiyonlari.
- Guvenlik uyarilari.

Entegrasyon:

- Admin modulu frontend olarak ayrilmali.
- Kritik islemler sadece Edge Function ile yapilmali.

---

## Asama 3 - Refactor Onerileri

### Authentication

Onem: ★★★★★

Sebep:

Auth, uygulamanin en kritik guvenlik katmani. Mevcut yapida Supabase Auth ile lokal fallback birlikte calisiyor.

Oneri:

- Production modda lokal fallback kapatilmali.
- Demo hesaplar feature flag ile ayrilmali.
- Role ve permission kontrolleri frontend degil backend/RLS merkezli olmali.
- Admin islemleri sadece Edge Functions uzerinden yapilmali.

Risk:

Yanlis gecis kullanici girislerini bozabilir.

Tahmini sure:

2-4 gun.

### Cloud Source of Truth

Onem: ★★★★★

Sebep:

Local ve cloud verinin birlikte asil veri gibi davranmasi tutarsizlik yaratir.

Oneri:

- Supabase asil kaynak olmali.
- Local storage sadece cache/offline draft olmali.
- Sync servisleri tek modulde toplanmali.

Risk:

Gecis sirasinda eski lokal test verileri kaybolmus gibi gorunebilir.

Tahmini sure:

4-7 gun.

### App.jsx Modularization

Onem: ★★★★★

Sebep:

Tek dosya buyudukce beyaz ekran, regression ve tasarim uyumsuzlugu riski artiyor.

Oneri:

Moduller:

- `auth`
- `admin`
- `coach`
- `client`
- `programs`
- `tasks`
- `messages`
- `alarms`
- `media`
- `ui`
- `theme`
- `services`

Risk:

Refactor sirasinda ekran state'leri bozulabilir.

Tahmini sure:

5-10 gun.

### Program ve Task Engine

Onem: ★★★★★

Sebep:

3 gun atomlu / 2 gun atomsuz gibi kurallar uygulamanin merkezinde.

Oneri:

- Program task rule engine yazilmali.
- Gorev listesi gunluk hesaplanmali.
- Tamamlanan gorevler siradan kalkip bir sonraki gorev one cikmali.
- Gun bitince gorev state'i sifirlanmali.

Risk:

Mevcut atanmis programlarin migrasyonu dikkat ister.

Tahmini sure:

4-6 gun.

### Mesajlasma

Onem: ★★★★☆

Sebep:

Koc-danisan iletisim urunun ana kullanim alanlarindan biri.

Oneri:

- Supabase Realtime channel kullanilmali.
- Mesaj okundu/okunmadi sayaci net olmali.
- Koc tarafinda mesajin hangi danisandan geldigi liste ekraninda gorunmeli.
- Ses/foto/video medya mesajlari tek medya pipeline'ina baglanmali.

Risk:

Realtime ve offline senkronizasyonu ayni anda tasarlamak gerekir.

Tahmini sure:

3-6 gun.

### Medya Pipeline

Onem: ★★★★☆

Sebep:

Fotograf, video ve ses uygulamanin guvenilirlik algisini dogrudan etkiliyor.

Oneri:

- Supabase Storage asil kaynak olmali.
- Local IndexedDB sadece gecici cache olmali.
- Thumbnail, signed URL, upload retry ve metadata ayrilmali.
- Gorev fotografi, profil fotografi, progress photo ve mesaj medyasi tip olarak ayrilmali.

Risk:

Buyuk medya dosyalari performans ve kota problemi yaratabilir.

Tahmini sure:

4-7 gun.

### Alarm Engine

Onem: ★★★★★

Sebep:

Kullanici internet olmasa bile gorev hatirlaticilarinin calismasini istiyor.

Oneri:

- Alarm planlari cihazda kalici saklanmali.
- Login/session durumuna gore alarm iptali netlestirilmeli.
- Gunluk gorev reseti ile alarm reseti ayni engine'den beslenmeli.
- Alarm tekrar stratejisi urun kuralina gore belirlenmeli.

Risk:

Android pil optimizasyonlari her cihazda farkli davranir.

Tahmini sure:

3-5 gun.

### UI Component ve Theme Sistemi

Onem: ★★★★☆

Sebep:

Giris ekrani yeni marka diline yaklasti; ic ekranlar ayni seviyeye getirilmeli.

Oneri:

- `theme/tokens`
- `components/Button`
- `components/Card`
- `components/Input`
- `components/Avatar`
- `components/MetricCard`
- `components/BottomNav`
- `components/Modal`
- `components/ActionSheet`

Risk:

Gorsel degisim kullanici tarafinda tekrar ince ayar isteyebilir.

Tahmini sure:

5-8 gun.

### Admin Panel Hardening

Onem: ★★★★☆

Sebep:

Admin en yetkili bolum. Yanlis islem ya da sizma riski en yuksek alan.

Oneri:

- Admin aksiyonlari Edge Function uzerinden yapilmali.
- Audit log zorunlu olmali.
- Kullanici detay, koc-danisan iliskisi, ban/aktif, program atama ve veri duzeltme ayrilmali.
- Admin UI mobile/web ayrimi net olmali.

Risk:

Fazla yetki frontend'de birakilirsa guvenlik zayiflar.

Tahmini sure:

4-6 gun.

### AI Layer

Onem: ★★★★☆

Sebep:

AI, V2'nin fark yaratan katmani olacak.

Oneri:

- OpenAI anahtari APK icine konmayacak.
- Supabase Edge Function AI gateway olacak.
- Prompt library versiyonlanacak.
- AI raporlari kaydedilecek.
- Koc onayi gereken AI aksiyonlari ayrilacak.

Risk:

Yanlis AI onerileri saglik/wellness alaninda guven riski dogurur.

Tahmini sure:

5-10 gun.

### Premium

Onem: ★★★☆☆

Sebep:

Yayin sonrasi gelir modeli icin gerekli.

Oneri:

- Once plan/feature flag modeli.
- Sonra Google Play Billing.

Risk:

Erken eklenirse ana urun akisini yavaslatir.

Tahmini sure:

3-8 gun.

### Testing ve Observability

Onem: ★★★★★

Sebep:

Beyaz ekran, auth, alarm ve mesaj sorunlari testle yakalanmali.

Oneri:

- Smoke test
- Role bazli ekran testleri
- Supabase RLS testleri
- Alarm manuel/native test listesi
- Crash reporting
- Production doctor genisletmesi

Risk:

Test olmadan her APK'de onceki sorunlar geri gelebilir.

Tahmini sure:

3-6 gun.

---

## Asama 4 - Roadmap

Her sprint sonunda uygulama calisir durumda kalmalidir.

### Sprint 1 - Stabilizasyon ve Kaynak Ayrimi

Hedef:

- Mevcut uygulama bozulmadan teknik riskleri azaltmak.

Isler:

- Auth akisini netlestir.
- Production/demo mod ayrimini sertlestir.
- Beyaz ekran veren ekranlari izole et.
- App.jsx icinden once servisleri ayir.
- Bildirim ve alarm metinlerindeki Turkce karakter bozukluklarini temizle.
- Production doctor script'ini genislet.

Cikis kriteri:

- Admin/koc/danisan login calisir.
- Mevcut ekranlar calisir.
- APK test edilebilir kalir.

### Sprint 2 - Program, Gorev ve Alarm Engine

Hedef:

- Program atama, gunluk gorev, dongu ve alarm altyapisini saglamlastirmak.

Isler:

- Program editorunu gercek editore donustur.
- Program silme/duzenleme ekle.
- 3 gun atomlu / 2 gun atomsuz dongu kurallarini merkezi engine'e al.
- Gunluk gorev resetini local tarih mantigiyla duzelt.
- Gorev tamamlandikca listeden kalkma akisini netlestir.
- Alarm planlarini offline calisir hale getir.

Cikis kriteri:

- Program atanir.
- Danisanda dogru gorevler gorunur.
- Internet yokken alarm calisir.
- Ertesi gun gorevler sifirlanir.

### Sprint 3 - Mesaj, Medya ve Bildirim Merkezi

Hedef:

- Mesajlasma, fotograf/video/ses ve bildirimleri gercek urun seviyesine yaklastirmak.

Isler:

- Mesajlasma Realtime'a tasinir.
- Koc tarafinda mesajin kimden geldigi ve kac okunmamis mesaj oldugu gorunur.
- Medya upload pipeline'i teklesir.
- Gorev fotograf onaylari koc ozet aksiyon merkezinde gorunur.
- Onay verilen aksiyonlar ekrandan kalkar.

Cikis kriteri:

- Koc-danisan mesajlari karsilikli ve kalici calisir.
- Fotograf/video/ses kaybolmaz.
- Bildirim kimin icin geldiyse belli olur.

### Sprint 4 - Wellness, Rapor ve Admin Derinlestirme

Hedef:

- Weight, measurement, progress photo, nutrition ve admin kontrolunu guclendirmek.

Isler:

- Kilo ve beden olcumleri structured hale gelir.
- Ilerleme ekrani undefined deger uretmez.
- Tebrik/milestone kartlari dogru veriden beslenir.
- Admin kullanici detay/duzenleme guclenir.
- Koc rapor ekrani stabil analytics ekranina donusur.

Cikis kriteri:

- Danisan ilerleme verileri dogru gorunur.
- Koc ve admin raporlari beyaz ekran vermez.
- Admin koc/danisan bilgilerini guvenli sekilde duzenleyebilir.

### Sprint 5 - AI, Premium ve Yayin Hazirligi

Hedef:

- V2 fark yaratan modulleri planli sekilde eklemek.

Isler:

- AI proxy Edge Function eklenir.
- Prompt library ve AI reports modeli kurulur.
- AI Coach ilk versiyon sadece koc destekli calisir.
- Premium plan/feature flag altyapisi kurulur.
- Release signing, AAB, Play Console hazirligi yapilir.

Cikis kriteri:

- AI onerileri kontrollu sekilde uretilir.
- Premium altyapi hazirdir.
- Release test APK/AAB akisi netlesir.

---

## Asama 5 - Database Analizi ve Migration Plani

### Mevcut Database Durumu

Mevcut Supabase semasi temel urun icin iyi bir baslangic sagliyor. RLS, role helper'lari, profile, program, task, message, appointment, media ve notification tablolarinin bulunmasi dogru yonde.

Ancak V2 hedefi icin sema wellness platform seviyesine cikmali.

### Yeni Tablo Onerileri

Eski tablolar silinmemeli. Yeni tablolar additive migration olarak eklenmeli.

#### `products`

Amac:

Herbalife ve diger kullanilan urunleri kataloglamak.

Alan onerileri:

- `id`
- `name`
- `brand`
- `category`
- `description`
- `default_unit`
- `image_path`
- `is_active`
- `created_at`
- `updated_at`

#### `program_products`

Amac:

Programlar ile urunleri iliskilendirmek.

Alan onerileri:

- `id`
- `program_id`
- `product_id`
- `dose_text`
- `timing`
- `notes`

#### `product_usage_events`

Amac:

Danisanin urun kullanimini tarihsel takip etmek.

Alan onerileri:

- `id`
- `client_id`
- `coach_id`
- `product_id`
- `task_id`
- `amount`
- `unit`
- `used_at`
- `proof_media_id`

#### `weight_entries`

Amac:

Kilo gecmisini net ayirmak.

Alan onerileri:

- `id`
- `client_id`
- `weight_kg`
- `source`
- `measured_at`
- `created_by`
- `proof_media_id`

#### `measurement_entries`

Amac:

Beden olcumlerini detayli tutmak.

Alan onerileri:

- `id`
- `client_id`
- `height_cm`
- `waist_cm`
- `hip_cm`
- `chest_cm`
- `arm_cm`
- `leg_cm`
- `body_fat_percent`
- `muscle_percent`
- `water_percent`
- `bmi`
- `measured_at`
- `created_by`

#### `nutrition_logs`

Amac:

Ogun ve beslenme takibi.

Alan onerileri:

- `id`
- `client_id`
- `meal_type`
- `meal_time`
- `description`
- `photo_media_id`
- `ai_estimated_calories`
- `ai_macros`
- `coach_note`

#### `progress_photos`

Amac:

Once/sonra ve aylik gelisim fotograflarini gorev kanitindan ayirmak.

Alan onerileri:

- `id`
- `client_id`
- `photo_media_id`
- `photo_type`
- `captured_at`
- `visibility`
- `ai_summary`

#### `task_proofs`

Amac:

Gorev tamamlama kanitlarini review surecine almak.

Alan onerileri:

- `id`
- `task_log_id`
- `media_id`
- `note`
- `status`
- `reviewed_by`
- `reviewed_at`
- `review_note`

#### `program_task_rules`

Amac:

Dongulu program kurallarini semaya almak.

Alan onerileri:

- `id`
- `program_task_id`
- `repeat_type`
- `cycle_length_days`
- `active_days`
- `skip_days`
- `start_offset_days`

#### `ai_prompt_library`

Amac:

Prompt'lari versiyonlamak.

Alan onerileri:

- `id`
- `key`
- `version`
- `role`
- `template`
- `is_active`
- `created_at`

#### `ai_conversations`

Amac:

AI Coach sohbet oturumlarini tutmak.

Alan onerileri:

- `id`
- `client_id`
- `coach_id`
- `mode`
- `status`
- `created_at`

#### `ai_messages`

Amac:

AI mesajlarini audit edilebilir yapmak.

Alan onerileri:

- `id`
- `conversation_id`
- `sender_type`
- `content`
- `model`
- `input_tokens`
- `output_tokens`
- `safety_status`
- `created_at`

#### `ai_reports`

Amac:

AI tarafindan uretilen haftalik/aylik analizleri saklamak.

Alan onerileri:

- `id`
- `client_id`
- `coach_id`
- `report_type`
- `summary`
- `recommendations`
- `risk_flags`
- `approved_by_coach`
- `created_at`

#### `knowledge_documents`

Amac:

Program, urun, yasakli liste ve koc notlarini AI bilgi tabanina almak.

Alan onerileri:

- `id`
- `owner_id`
- `scope`
- `title`
- `content`
- `source_type`
- `created_at`

#### `document_embeddings`

Amac:

AI arama/RAG icin embedding verisi.

Alan onerileri:

- `id`
- `document_id`
- `chunk_text`
- `embedding`
- `metadata`

#### `premium_plans`

Amac:

Premium planlari tanimlamak.

Alan onerileri:

- `id`
- `name`
- `price`
- `features`
- `is_active`

#### `subscriptions`

Amac:

Koc/admin/danisan plan durumunu tutmak.

Alan onerileri:

- `id`
- `user_id`
- `plan_id`
- `provider`
- `status`
- `started_at`
- `expires_at`

#### `notification_events`

Amac:

Bildirimleri entity/action bazli takip etmek.

Alan onerileri:

- `id`
- `user_id`
- `type`
- `entity_type`
- `entity_id`
- `title`
- `body`
- `status`
- `read_at`
- `dismissed_at`
- `created_at`

### Migration Plani

1. Yeni tablolar additive migration olarak eklenir.
2. Eski tablolar silinmez.
3. RLS politikalarinin testleri yazilir.
4. Mevcut `body_metrics`, `media_files`, `program_tasks`, `task_logs` verileri yeni alanlara backfill edilir.
5. Frontend once read adapter ile yeni/eski veriyi okuyabilir hale gelir.
6. Sonra write path yeni tablolara tasinir.
7. Bir sure dual-read/dual-write izlenir.
8. Veriler dogrulandiktan sonra eski alanlar sadece backward compatibility icin birakilir.

---

## Asama 6 - AI Entegrasyon Plani

OpenAI dokumantasyonuna gore API anahtari guvenli ortamda tutulmali; mobil uygulama icine gomulmemelidir. Vision ve embedding gibi yetenekler sunucu tarafindan cagrilmalidir. Bu nedenle StepWise Plus icin en dogru yapi Supabase Edge Function uzerinden OpenAI proxy katmanidir.

Kaynak notu:

- OpenAI API, text, vision ve embeddings gibi yetenekleri destekler.
- API key guvenli ortamda saklanmali; client APK icine konmamalidir.
- Responses API image input ve tool destekli akislari destekler.

### OpenAI

Kullanim:

- AI Coach cevaplari
- AI Nutrition yorumlari
- AI Vision fotograf analizi
- AI Reports
- AI Motivation
- AI Reminder metinleri

Kurallar:

- API key sadece Supabase Edge Function secret olarak tutulmali.
- Her AI cagrisi audit edilmeli.
- Saglik teshisi yapilmamali.
- Koc onayi gereken oneriler ayri status ile tutulmali.

### Supabase

Rol:

- Auth context saglar.
- Kullanici/program/task/measurement verisini AI context'e hazirlar.
- AI yanitlarini kaydeder.
- RLS ile role bazli erisim saglar.

### Storage

Rol:

- Progress photos
- Task proof photos
- Product usage videos
- Message media
- AI vision input images

Gerekenler:

- Signed URL
- Thumbnail
- File type validation
- Size limit
- Retention/lifecycle policy

### Vision

Kullanim:

- Tartı fotografi dogrulama
- Yemek fotografi yorumlama
- Progress photo summary
- Gorev fotograf kaniti kontrolu

Risk:

AI vision kesin dogrulama sistemi gibi kullanilmamali; yardimci analiz olarak konumlanmali.

### Prompt Library

Gereken prompt tipleri:

- `ai_coach_daily_checkin`
- `ai_nutrition_feedback`
- `ai_progress_report_weekly`
- `ai_motivation_message`
- `ai_reminder_message`
- `ai_vision_weight_photo`
- `ai_vision_meal_photo`
- `ai_vision_progress_photo`

Her prompt:

- Version
- Role
- Scope
- Safety notes
- Output schema

ile tutulmali.

### Embeddings

Kullanim:

- Program arama
- Urun bilgisi arama
- Yasakli liste sorgusu
- Kocun kendi dokumanlarindan AI cevap uretme

Yapi:

- `knowledge_documents`
- `document_embeddings`
- Supabase vector extension veya alternatif vector store

### AI Coach

Ilk versiyon:

- Danisanin gunluk durumunu yorumlar.
- Kocun belirledigi programa sadik kalir.
- Kocun yerine karar vermez.
- Riskli durumda koca yonlendirir.

### AI Reports

Uretilecek raporlar:

- Haftalik uyum raporu
- Aylik kilo/olcum raporu
- Riskli danisan listesi
- Program verimlilik analizi

### AI Nutrition

Kullanim:

- Ogun fotograf yorumlama
- Programla uyum kontrolu
- Basit kalori/makro tahmini

Not:

Tibbi/diyetisyen teshisi gibi sunulmamali.

### AI Motivation

Kullanim:

- Kilo milestone tebrikleri
- Gorev kacirma sonrasi nazik hatirlatma
- Haftalik motivasyon

### AI Reminder

Kullanim:

- Gorev saati yaklasinca kisilestirilmis hatirlatma
- Erteleme sonrasi motivasyonlu mesaj

---

## Asama 7 - UI Analizi

Mevcut UI tipi:

- Material Design degil.
- Cupertino degil.
- Custom wellness mobile UI.

Tasarim dili:

- Yesil/beyaz agirlikli.
- Soft card yapisi.
- Buyuk metric kartlari.
- Rounded bottom navigation.
- Wellness/Herbalife hissi.
- Giris ekrani marka yonunden guclu.

Sorunlar:

- Ic ekranlar giris ekrani kadar premium degil.
- Bazi kartlar fazla bosluklu.
- Bazi profil fotograflari kucuk kaliyor.
- Bildirim badge mantigi daha okunabilir olmali.
- Dialog/modal yatay scroll hatalari yasamis.
- Bazi ekranlarda scroll kontrolu gereksiz veya eksik.
- UI bilesenleri tekrar ediyor.

Yeni ekranlar mevcut tasarimla uyumlu olmali:

- Beyaz/mint zemin
- Koyu yesil basliklar
- Lime vurgular
- Soft shadow
- 8-24 px arasi radius hiyerarsisi
- Net avatar/fotograf boyutlari
- Profesyonel card spacing

UI refactor hedefi:

- Tek design token sistemi
- Tek button/input/card/avatar component ailesi
- Role bazli ekranlar ayni marka dilinde
- Accessibility: contrast, font size, touch target

---

## Asama 8 - Performans Analizi

### Lazy Loading

Mevcut durum:

- Tum uygulama tek ana bundle icinde yukleniyor.
- Ekranlar lazy load edilmiyor.

Oneri:

- Admin, coach ve client ekranlari ayri chunk'lara bolunmeli.
- AI, reports, media-heavy ekranlar lazy load edilmeli.

### Caching

Mevcut durum:

- LocalStorage ve IndexedDB cache gibi kullaniliyor.
- Cloud refresh polling yaklasimi var.

Oneri:

- Query cache katmani olusturulmali.
- Role bazli cache invalidation yapilmali.
- Offline draft ile cloud source of truth ayrilmali.

### Image Optimization

Mevcut durum:

- Medya gosterimi var ama thumbnail/resize pipeline net degil.

Oneri:

- Profil fotografi icin kucuk thumbnail.
- Gorev kaniti icin compressed upload.
- Video icin poster thumbnail.
- Buyuk gorseller icin lazy loading.

### Query Optimization

Mevcut durum:

- Workspace load cok sayida tabloyu bir kerede cekiyor.
- Bazi listeler limitli ama domain bazli query ayrimi zayif.

Oneri:

- Dashboard icin summary RPC.
- Mesajlar icin pagination.
- Task logs icin tarih araligi.
- Notifications icin unread count query.
- Reports icin materialized/summary table veya RPC.

### State Optimization

Mevcut durum:

- Buyuk state array'leri sik sik set ediliyor.
- Local DB rewrite yaklasimi kullaniliyor.

Oneri:

- Domain store'lari ayrilmali.
- Memoized selectors kullanilmali.
- Büyük screen component'leri bolunmeli.
- Optimistic update standartlastirilmali.

---

## Genel Eksik/Fazla Degerlendirmesi

### Eksik

- AI altyapisi
- Premium altyapisi
- Structured nutrition/product tracking
- Dedicated progress photo module
- Guclu admin permission modeli
- Realtime mesajlasma
- Test altyapisi
- Crash/analytics izleme
- App.jsx modular mimari
- Offline sync conflict strategy
- Production/demo sert ayrimi
- UI component library

### Fazla veya Riskli

- Source icinde demo kullanici bilgileri
- App.jsx icinde fazla sorumluluk
- Local fallback'in production auth ile ic ice olmasi
- Bazi tekrar eden UI bloklari
- Bazi kapali/taslak ozelliklerin production bundle icinde durmasi
- `ScreenBoundary` ile sorunlari gecici saklama egilimi

---

## Sonuc

StepWise Plus mevcut haliyle calisan bir temel uygulamadir. Ancak V2 hedefi icin sifirdan yazmak yerine kontrollu refactor ve additive database migration en dogru yoldur.

En kritik siralama:

1. Auth ve cloud source of truth netlestirme
2. App.jsx modularizasyonu
3. Program/task/alarm engine
4. Mesaj/medya/bildirim merkezi
5. Wellness tracking domain'leri
6. Admin hardening
7. AI proxy ve prompt library
8. Premium/yayin altyapisi

Bir sonraki adim icin onay gereklidir. Onay olmadan implementasyona gecilmemelidir.
