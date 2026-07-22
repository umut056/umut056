# StepWise Plus V2 Analiz Raporu

Bu rapor, StepWise Plus repository'sinin mevcut durumunu analiz etmek icin hazirlandi. Bu asamada kod degisikligi yapilmadi; yalnizca dokumanlar ve mevcut dosya yapisi incelendi.

## Okunan Dokumanlar

- `docs/production-checklist.md`
- `supabase/README.md`
- `STEPWISE_PLUS_V2_PLAN.md`

Dokumanlardan cikan ana vizyon: StepWise Plus yalnizca kilo takip uygulamasi degil, koç ve danisanlari ayni sistemde bulusturan, uzun vadede AI destekli wellness platformuna donusecek bir urun olmalidir.

Hedef platform kapsaminda su basliklar one cikiyor:

- Weight Tracking
- Measurement Tracking
- Progress Photos
- AI Coach
- AI Nutrition
- AI Progress
- AI Vision
- AI Reminder
- AI Motivation
- Herbalife Product Tracking
- Tasks
- Notifications
- Coach Dashboard
- Admin Dashboard
- Reports
- Premium
- Subscriptions
- Payments

## Mevcut Mimari Ozeti

### Teknoloji

- Frontend: React + Vite
- Mobil kapsayici: Capacitor Android
- Backend: Supabase PostgreSQL, Supabase Auth, Supabase Storage, Supabase Edge Functions
- Bildirim: Firebase Cloud Messaging ve Android native receiver yapisi
- Alarm: Android native alarm receiver, boot restore ve full-screen intent destegi

### Paketler

Temel paketler:

- `react`
- `react-dom`
- `vite`
- `@vitejs/plugin-react`
- `@capacitor/core`
- `@capacitor/android`
- `@capacitor/cli`

Eksik olanlar:

- Routing paketi yok.
- Ayrik state management paketi yok.
- Test paketi yok.
- Lint script'i yok.
- UI component library yok.
- Framer Motion henuz ekli degil.
- OpenAI entegrasyonu henuz yok.

### State Management

Mevcut state yonetimi agirlikli olarak `src/App.jsx` icindeki `useState`, `useEffect`, local helper fonksiyonlar ve localStorage uzerinden ilerliyor.

Ayrica cloud veriler `src/lib/production.js` uzerinden yukleniyor. Ancak local state, localStorage ve Supabase arasinda tek bir repository katmani olmadigi icin veri akisi daginik.

### Routing

Gercek route sistemi yok. Ekran gecisleri `screen`, `tab` ve role bazli kosullarla `App.jsx` icinde yonetiliyor.

### Authentication

Mevcut sistemde:

- Local seed/demo hesap mantigi var.
- Supabase Auth entegrasyonu var.
- Admin, koç ve danisan rolleri destekleniyor.
- Koç kodu ve danisan referans kodu akisi baslamis durumda.

Eksik taraf:

- Auth akisi tek basina ayrilmis bir feature degil.
- Role guard, session restore, cloud/local ayrimi ve hata yonetimi merkezi degil.
- Demo hesaplar icin yayin modu kontrolu eklenmis olsa da bu alanin net sekilde environment bazli korunmasi kritik.

### Database Yapisi

Supabase tarafinda mevcut tablolar:

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

Guclu taraf:

- RLS politikalarinin temeli kurulmus.
- Storage bucket politikasi var.
- Admin, koç ve danisan scope mantigi dusunulmus.
- Program, gorev, mesaj, randevu, medya ve bildirim icin temel tablolar mevcut.

Eksik taraf:

- `weights`, `measurements`, `photos`, `nutrition`, `water`, `activities`, `products`, `reports`, `ai_reports`, `ai_chats`, `subscriptions`, `payments`, `coach_notes`, `badge_progress`, `product_logs`, `progress_logs` gibi hedef domain tablolar ayri ayri yok.
- `body_metrics` birden fazla sorumlulugu tasiyor.
- `media_files` genel amacli; progress photo, profile photo, product video ve message media ayrimlari servis katmaninda netlestirilmeli.
- AI ve Premium icin hic tablo yok.

### Dosya Yapisi

Mevcut ana dosyalar:

- `src/App.jsx`
- `src/main.jsx`
- `src/lib/production.js`
- `src/lib/alarms.js`
- `src/lib/session.js`
- `src/lib/demoAccounts.js`
- `supabase/schema.sql`
- `supabase/functions/*`
- `android/app/src/main/*`

En buyuk risk:

- `src/App.jsx` yaklasik 2500 satirlik monolit bir dosya.
- Ekranlar, componentler, data helper'lari, local DB, seed data ve is kurallari ayni dosyada.

### UI Component Sistemi

Mevcut reusable componentler:

- `Card`
- `Pill`
- `Avatar`
- `Av`
- `Ico`
- `BotNav`
- `ScreenBoundary`
- `MediaImage`
- `ProductVideo`
- `MediaAudio`
- `ImageLightbox`
- `SWPMonogram`
- `AdminUserEditor`

Ancak bunlar ortak bir `shared/ui` klasorunde degil, buyuk oranda `App.jsx` icinde duruyor.

### Theme Sistemi

Mevcut tasarim custom CSS ve inline style karmasi ile kurulmus. Ana renk paleti yesil agirlikli. V2 hedefindeki premium tasarim yonu su sekilde netlesmeli:

- Ana renk: `#3A7D44`
- Ikincil renk: `#7BC47F`
- Arkaplan: `#F7F8F6`
- Kart radius: `20px`
- Minimal animasyon
- Apple Health, Whoop, Linear, Notion ve Stripe Dashboard karisimi premium his

## Guclu Yonler

- Uygulama calisan bir mobil prototip seviyesini gecmis durumda.
- Admin, koç ve danisan rolleri mevcut.
- Supabase schema, RLS ve Edge Function yaklasimi baslatilmis.
- Android tarafinda alarm, boot restore, notification permission ve FCM entegrasyonu var.
- Program, gorev, kanit fotografi, mesaj, randevu, profil, video ve medya akislari icin temel davranislar mevcut.
- Production checklist ve doctor script gibi yayin oncesi kontrol dusunulmus.
- UI dili ve marka yonu artik daha net: StepWise Plus, wellness ve koç/danisan takip platformu.

## Zayif Yonler

- `App.jsx` cok buyuk ve fazla sorumluluk tasiyor.
- Feature based folder structure henuz yok.
- MVVM veya repository ayrimi net degil.
- Routing merkezi degil.
- Cloud ve local data kaynaklari ic ice.
- Test, lint ve otomatik kalite kapilari eksik.
- UI componentler tekrar kullanilabilir hale getirilmemis.
- Mesajlasma, program atama, medya ve bildirim davranislari merkezi servis yerine ekran iclerinde daginik.
- AI, premium ve abonelik altyapisi henuz yok.
- Dark mode destegi sistematik degil.

## Tamamlanmis Ozellikler

Mevcut durumda tamamlanmis veya temel seviyede calisan alanlar:

- Login ve register ekranlari
- Admin, koç, danisan rolleri
- Demo/local seed hesaplar
- Koç kodu ve danisan referans kodu mantigi
- Koç dashboard temel metrikleri
- Danisan dashboard temel ilerleme karti
- Program sablonlari
- Program atama altyapisi
- Gunluk gorev listesi
- Kamera/fotograf kanit akisi icin temel altyapi
- Profil fotografi ve medya gosterimi
- Koç-danisan mesaj ekranlari
- Urun kullanim videosu mantigi
- Randevu/appointment temel modeli
- Supabase schema ve RLS baslangici
- Supabase Storage upload ve signed URL servisleri
- Firebase FCM native entegrasyon baslangici
- Android native alarm receiver
- Boot sonrasi alarm restore
- Production doctor script
- Production checklist

## Eksik Ozellikler

Hedef wellness platformuna gore eksik alanlar:

- AI Coach
- AI Nutrition
- AI Progress
- AI Vision
- AI Reports
- AI Reminder
- Merkezi prompt library
- Weight Tracking icin ayri domain modeli
- Measurement Tracking icin ayri domain modeli
- Progress Photos icin ayri domain modeli
- Nutrition, water ve activity tracking
- Product logs ve Herbalife urun takip modeli
- Premium, subscription ve payment sistemi
- Admin analytics
- Sistem audit ekranlari
- Coach notes domain modeli
- Badge progress modeli
- Realtime mesajlasma ve okunmamis sayaci
- Kalici ve guvenilir notification inbox
- Ekran bazli hata sinirlari ve recovery akislari
- Unit/integration/e2e testleri
- Release imzali AAB sureci ve Play Store hazirligi

## Tekrar Eden Kodlar

Asagidaki alanlarda tekrar var:

- Mesaj gonderme fonksiyonlari farkli ekranlarda tekrar ediyor.
- Dosya/fotograf/ses medya gonderme kodlari tekrar ediyor.
- Profil guncelleme ve `DB.setUsers` akislari birden fazla yerde var.
- Metric card ve mini istatistik kartlari ekranlara gomulu.
- Modal, bottom sheet ve kart stilleri tekrar ediyor.
- Date/today key/gunluk gorev hesaplari daginik.
- LocalStorage ve cloud write fallback mantigi tekrar ediyor.
- Alert/confirm gibi native browser dialoglari merkezi olmayan sekilde kullaniliyor.
- Program gorev normalize etme ve program atama davranislari tek servis altinda toplanmamis.

## Yeniden Kullanilabilir Componentler

Mevcut componentlerden ayristirilip tekrar kullanilabilecekler:

- `Card`
- `Pill`
- `Avatar`
- `Ico`
- `BotNav`
- `ScreenBoundary`
- `MediaImage`
- `ProductVideo`
- `MediaAudio`
- `ImageLightbox`
- `AdminUserEditor`
- Program kartlari
- Metric kartlari
- Kullanici satirlari
- Profil header kartlari
- Form input alanlari
- Bottom sheet/modal yapilari

Bu componentler yeni duplicate component yazmadan `src/shared/ui` altina alinabilir.

## Genisletilebilir Servisler

Mevcut servislerden genisletilebilecekler:

- `src/lib/production.js`
  - Auth
  - Workspace load
  - Message
  - Program
  - Appointment
  - Notification
  - Media upload
  - Profile patch

- `src/lib/alarms.js`
  - Web/native alarm bridge
  - Local reminder planlama
  - Offline alarm fallback

- `src/lib/session.js`
  - Session persistence
  - Role restore
  - Background/foreground davranisi

- `src/lib/demoAccounts.js`
  - Dev/test hesaplari
  - Production gizleme kontrolu

Bu servisler yeni feature servislerine bolunmeli; ancak once mevcut fonksiyonlar tasinmali, ayni isi yapan yeni API yazilmamali.

## Teknik Borc

### Kritik

- `App.jsx` monolit yapida.
- Cloud/local veri kaynagi ayrimi net degil.
- Mesajlasma ve program atama gibi kritik akislarda tek kaynakli dogruluk yok.
- Test ve lint altyapisi yok.
- Git repository durumu sorunlu gorunuyor; `.git` klasoru olmasina ragmen `git status` calismiyor. Versiyon takibi netlestirilmeli.

### Yuksek

- Android alarm davranisi session durumundan bagimsiz kalabiliyor.
- Native tarafta Turkce karakter bozulma riski var.
- `allowBackup=true` hassas local veriler icin risk olusturabilir.
- Release build minify kapali.
- Rapor, profil ve mesaj ekranlarinda beyaz ekran riski daha once yasanmis.

### Orta

- Component stilleri merkezi degil.
- Dark mode stratejisi yok.
- Error handling daginik.
- Supabase sorgulari tum workspace'i yuklemeye egilimli.
- Caching ve pagination eksik.

### Dusuk

- Dokumantasyon parcali.
- CHANGELOG, ROADMAP ve README guncelleme akisi standartlasmamis.
- UI metinleri ve terimler merkezi degil.

## Refactor Onerileri

### Authentication

Oncelik: Cok yuksek

Sebep:
Auth, rol ve session davranisi tum uygulamanin temeli.

Oneri:
`src/features/auth` altina login, register, session restore ve role guard akislari tasinmali. Mevcut auth fonksiyonlari kullanilmali, duplicate yazilmamali.

Risk:
Yanlis refactor girisleri bozabilir.

Tahmini sure:
1 sprint icinde parca parca.

### App.jsx Parcalama

Oncelik: Cok yuksek

Sebep:
Tek dosyada cok fazla sorumluluk var.

Oneri:
Mevcut ekranlar yeniden yazilmadan feature klasorlerine tasinmali.

Hedef:

- `src/features/admin`
- `src/features/coach`
- `src/features/client`
- `src/features/programs`
- `src/features/tasks`
- `src/features/messages`
- `src/features/media`
- `src/features/wellness`
- `src/features/notifications`
- `src/shared/ui`
- `src/shared/theme`
- `src/shared/lib`

Risk:
Import hatalari ve state gecislerinde regresyon.

Tahmini sure:
2-3 sprint.

### Repository / Service Ayrimi

Oncelik: Yuksek

Sebep:
Cloud ve local data islemleri daginik.

Oneri:
Once mevcut `production.js` fonksiyonlari domain bazli servis dosyalarina bolunmeli. Daha sonra repository katmani eklenmeli.

Risk:
Veri senkronizasyon hatalari.

Tahmini sure:
2 sprint.

### UI System

Oncelik: Yuksek

Sebep:
Premium V2 hissi icin tutarli component ve theme gerekli.

Oneri:
Mevcut componentler `shared/ui` altina tasinmali. Yeni component yazmadan once mevcut component genisletilmeli.

Risk:
Gorsel regresyon.

Tahmini sure:
1-2 sprint.

### Messaging

Oncelik: Yuksek

Sebep:
Koç ve danisan iliskisinde mesajlasma kritik.

Oneri:
Mesaj gonderme, medya ekleme, okunmamis sayaci, kimden geldigi, read status ve realtime dinleme tek servis altina alinmali.

Risk:
Bildirim ve mesaj tutarsizligi.

Tahmini sure:
1 sprint.

### Program / Task Engine

Oncelik: Yuksek

Sebep:
StepWise Plus'in ana degeri gorev ve program takip sistemi.

Oneri:
Program editoru, 3 gun atomlu / 2 gun atomsuz dongu, gorev tamamlama, kanit fotografi, gunluk reset ve alarm hesaplama tek bir task engine altinda toplanmali.

Risk:
Gunluk gorev ve alarm hatalari.

Tahmini sure:
1-2 sprint.

### AI Hazirlik

Oncelik: Orta

Sebep:
AI hedef platformun ana farklilastirici ozelligi.

Oneri:
Henuz component icine prompt yazilmamali. `ai` feature altinda prompt library, servis arayuzleri ve backend proxy plani hazirlanmali.

Risk:
API key guvenligi ve maliyet kontrolu.

Tahmini sure:
Sprint 4.

## Sprint Plani

### Sprint 1 - Kod Analizi, Refactor, UI Duzenleme

Amaç:
Mevcut sistemi bozmadan mimariyi temizlemeye baslamak.

Isler:

- `App.jsx` icinden reusable UI componentleri ayristirma.
- Auth/session helperlarini ayristirma.
- Production service fonksiyonlarini domain basliklarina ayirma plani.
- Mevcut theme tokenlarini merkezi hale getirme.
- Beyaz ekran riskli ekranlara error boundary kontrolu.
- README, CHANGELOG ve ROADMAP baslangic duzeni.

Sprint sonunda:
Uygulama mevcut fonksiyonlariyla calisir durumda kalmali.

### Sprint 2 - Weight, Measurement, Photos

Amaç:
Danisan ilerleme modullerini gercek domain yapisina almak.

Isler:

- Weight tracking modeli.
- Measurement tracking modeli.
- Progress photo modeli.
- Eski `body_metrics` verisini bozmadan yeni domain uyumu.
- Danisan ozetindeki baslangic/guncel/hedef/degisim kartlarini servislesme.
- Fotograflarin kalici, acilabilir ve onaylanabilir hale gelmesi.

### Sprint 3 - Coach Dashboard, Clients, Reports

Amaç:
Koç tarafini profesyonel yonetim paneline yaklastirmak.

Isler:

- Danisan listesi filtre/siralama.
- Riskli danisan, bekleyen fotograf, mesaj, randevu bildirimleri.
- Program atama ve program editorunun tamamlanmasi.
- Reports ekraninin beyaz ekran riskinden arindirilmasi.
- Koç dashboard kartlarinin tiklanabilir ve islevsel hale gelmesi.

### Sprint 4 - AI Coach, AI Reports, AI Nutrition

Amaç:
AI altyapisini guvenli ve moduler sekilde baslatmak.

Isler:

- OpenAI servis arayuzu.
- Prompt library.
- AI Coach servis iskeleti.
- AI Nutrition servis iskeleti.
- AI Reports servis iskeleti.
- AI promptlarin component icine yazilmasini engelleyen yapi.
- Supabase Edge Function veya guvenli backend proxy plani.

### Sprint 5 - Premium, Subscriptions, Payments

Amaç:
Gelir modeli altyapisini kurmak.

Isler:

- Subscription modeli.
- Payment modeli.
- Premium feature flag.
- Admin tarafinda plan takibi.
- Stripe benzeri dashboard uyumlu UI.

### Sprint 6 - Admin Panel, Analytics, System

Amaç:
Admin'i en ust yetkili, guvenli ve profesyonel panele donusturmek.

Isler:

- Admin user detail/edit.
- Koç-danisan baglanti gorunurlugu.
- Sistem kodlari.
- Ban/yetki yonetimi.
- Analytics kartlari.
- Audit log goruntuleme.

### Sprint 7 - Optimization, Testing, Release

Amaç:
Google Play'e hazir release kalitesine yaklasmak.

Isler:

- Build optimizasyonu.
- Image optimization.
- Query optimization.
- Lazy loading.
- Test altyapisi.
- Release APK/AAB akisi.
- Production doctor sertlestirme.
- Privacy, terms, data safety hazirligi.

## Database Analizi ve Migration Plani

Mevcut tablolar silinmemeli. Yeni tablolar gerekiyorsa additive migration ile eklenmeli.

Onerilen yeni tablolar:

- `weights`
- `measurements`
- `progress_photos`
- `nutrition_logs`
- `water_logs`
- `activity_logs`
- `products`
- `product_logs`
- `reports`
- `ai_reports`
- `ai_chats`
- `coach_notes`
- `badge_progress`
- `progress_logs`
- `subscriptions`
- `payments`

Migration prensibi:

1. Eski tablolar korunur.
2. Yeni tablolar eklenir.
3. Eski data yeni domainlere kopyalanir veya view/mapper ile desteklenir.
4. Uygulama once geriye uyumlu calisir.
5. Eski alanlar hemen silinmez.

## AI Entegrasyon Plani

AI modulleri component icinde yazilmamali.

Onerilen yapi:

- `src/features/ai/services/aiCoachService.js`
- `src/features/ai/services/aiNutritionService.js`
- `src/features/ai/services/aiProgressService.js`
- `src/features/ai/services/aiVisionService.js`
- `src/features/ai/prompts/*`

Guvenlik:

- OpenAI API key APK icinde bulunmamali.
- AI istekleri Supabase Edge Function veya guvenli backend uzerinden gecmeli.
- Promptlar merkezi olmali.
- Kullanici verisi minimum gerekli kapsamda gonderilmeli.

## UI Analizi

Mevcut UI custom tasarimdir; Material veya Cupertino degildir.

V2 hedefi:

- Apple Health gibi temiz ve saglik odakli
- Whoop gibi performans hissi
- Linear gibi sade, keskin ve premium
- Notion gibi okunabilir
- Stripe Dashboard gibi guven veren panel yapisi

Mevcut ekranlar silinmeden, ayni component diliyle kademeli iyilestirme yapilmalidir.

## Performans Analizi

Eksikler:

- Lazy loading yok.
- Ekran bazli code splitting yok.
- Supabase sorgularinda pagination sinirli.
- Image optimization merkezi degil.
- Medya cache stratejisi net degil.
- App state buyudukce render maliyeti artabilir.

Oneriler:

- Feature bazli lazy import.
- Media thumbnail ve signed URL cache.
- Workspace load'un parca parca yuklenmesi.
- Mesajlar icin pagination.
- Danisan listeleri icin filtrelenmis sorgular.
- UI kartlarinda memoization.

## Risk Analizi

### En Yuksek Riskler

- Mevcut calisan sistemi bozma riski.
- `App.jsx` refactor sirasinda import/state hatalari.
- Cloud/local data tutarsizligi.
- Alarm davranisinin cihaz, uyku modu ve uygulama kapanma durumlarinda farkli calismasi.
- Mesaj ve bildirimlerin farkli kaynaklardan gelip tutarsiz gorunmesi.

### Guvenlik Riskleri

- Service role key veya Firebase service account APK icine girmemeli.
- Admin islemleri client tarafindan dogrudan yapilmamali.
- Storage private kalmali.
- Signed URL sureleri kontrol edilmeli.
- `allowBackup=true` hassas data icin degerlendirilmeli.

### Urun Riskleri

- Cok hizli ozellik eklemek mimari borcu buyutur.
- AI, premium ve dashboard ayni anda eklenirse test edilebilirlik duser.
- UI degisiklikleri mevcut kullanici aliskanliklarini bozabilir.

## Oncelik Sirasi

1. Git/repository sagligini netlestirme.
2. Build, doctor ve temel calisma durumunu sabitleme.
3. `App.jsx` icinden reusable componentleri ayristirma.
4. Auth/session/role akisini guclendirme.
5. Program atama ve task engine'i merkezi hale getirme.
6. Mesajlasma ve bildirim sayacini kalici ve dogru hale getirme.
7. Weight/measurement/progress photo domainlerini ayirma.
8. Coach dashboard ve reports ekranlarini stabil hale getirme.
9. AI servis altyapisi ve prompt library.
10. Premium/subscription/payment.
11. Admin analytics ve sistem paneli.
12. Optimization, testing ve release.

## Sonuc

StepWise Plus V2 icin mevcut repository iyi bir baslangic noktasina sahip. Uygulama sifirdan yazilmamali. Ancak V2 seviyesine cikmak icin en kritik is, yeni ozellik eklemeden once mevcut calisan yapinin moduler, test edilebilir ve genisletilebilir hale getirilmesidir.

Bir sonraki adim icin onay beklenmelidir. Onay alinmadan sprint implementasyonuna gecilmemelidir.
