# Changelog

## Unreleased

- Mesaj alt navigasyon rozeti kisi bazli okunmamis mesaj ozetiyle baglandi.

- Program kaydetme akisi servis seviyesinde atanmis danisanlara ve urun videosuna yansitilacak sekilde guvenceye alindi.

- Rapor ve ilerleme ekranlari icin eksik/bozuk vucut olcumu degerleri normalize edildi.

- Mesaj bildirimleri icin gonderen ve toplam okunmamis mesaj ozeti servis seviyesinde eklendi.

- Android gorev alarmlari israrci bildirimle guclendirildi ve WebView fallback alarm tonu uzatildi.

- Gunluk gorevlerde tamamlanan maddelerin aktif listeden dusmesi ve gun tamamlama kurali testle sabitlendi.

- Kilo ve vucut olcum servisleri bos deger, degisim hesaplama ve format fallback testleriyle guvenceye alindi.

- Medya kalicilik servisi lokal kayit, cloud upload, offline fallback ve signed URL yenileme testleriyle guvenceye alindi.

- Takvim/randevu servisi koc/danisan/tarih filtresi, patch fallback, varsayilan session ve Turkce bildirim metinleriyle testlendi.

- Koc action inbox servisi okunmamis mesajlari, fotograf onaylarini ve randevu taleplerini oncelikli tek listeye toplayacak sekilde eklendi.

- Koc fotograf onay kuyrugu kapsam filtresi, danisan notu, onay/red/gizleme ve log olusturma testleriyle guvenceye alindi.

- Profil patch servisi offline/local kayit, cloud merge, cloud hata fallback ve eksik id durumlari icin regression testleriyle guvenceye alindi.

- Gorev alarm kurallari icin aktif gorev, erteleme, 5 dakika gecikme toleransi ve izin uyarilari regression testleri eklendi.

- Program lifecycle kurallari servis katmanina tasindi: koca ozel kopya, gorev satiri parse, ozel program silme ve sistem sablonu gizleme testlendi.

- Android gorev alarmlari v7 kanalina tasindi; kilit ekraninda daha belirgin titresim ve 1 dakikalik tekrar davranisi eklendi.

- Okunmamis mesajlar icin gonderen bazli adet, son mesaj ve onizleme ozeti notification service'e eklendi.

- Auth kayit dogrulama ve lokal danisan varsayilanlari regression testleriyle guvenceye alindi.

- Koc rapor selectorlari eksik veya gec yuklenen veriyle beyaz ekran riskine karsi guclendirildi.

- Mesajlar icin sender_name metadata alani eklendi; cloud restore sonrasi gonderen adi kaybolmayacak.

- Program gorevleri icin repeat/cycle metadata Supabase semasina, create/update akisina ve cloud restore map'ine eklendi.

- Mesaj cloud/local merge akisi okundu bilgisi, medya metadatasi, gonderen adi ve cloud siralama bilgisini koruyacak sekilde guclendirildi.

- Cloud/local workspace merge guclendirildi; eksik cloud snapshot program, vucut olcumu, gunluk ilerleme veya urun videosu bilgisini artik gereksiz ezmiyor.

- Session saklama modeli tam kullanici objesi yerine guvenli oturum snapshot'ina indirildi; production cloud token restore akisi local cache'e bagimli olmayacak sekilde guclendirildi.

- Local/demo auth sifre saklama PBKDF2 tabanli tuzlu hash formatina tasindi; eski SHA/plain kayitlar basarili giriste otomatik migrate ediliyor ve production auth hatasinda local fallback kapatildi.

- Staging Supabase RLS capraz rol dogrulamasi icin `npm run test:rls:staging` eklendi; admin, koc ve danisan JWT senaryolari PASS olarak belgelendi.

- Test APK surumu `1.0.16-test.1` olarak ayrildi; Android `versionCode` 17 / `versionName` 1.0.16-test.1 yapildi.
- Giris ekranina gorunur `Test APK v1.0.16` etiketi eklendi; boylece telefonda eski/yeni APK karisikligi kontrol edilebilir hale geldi.
- Eski telefon verisi yeni test surumune gecince hazir admin/koc/danisan hesaplarini koruyacak migration eklendi.
- Vitest ve ESLint tabanli ilk test/lint altyapisi eklendi.
- Program atama, gunluk gorev, mesajlasma ve dashboard selectorlari icin temel unit/smoke testleri eklendi.
- Test komutlari ve kapsam aciklamasi `docs/TESTING.md` icinde belgelendi.
- Master specification paketi icin `docs/MASTER_SPEC_INDEX.md`, `docs/API_MASTER_SPECIFICATION.md`, `docs/UI_UX_MASTER_SPECIFICATION.md`, `docs/AI_MASTER_SPECIFICATION.md`, `docs/BUSINESS_RULES_MASTER.md`, `docs/TEST_MASTER.md` ve `docs/DEPLOYMENT_MASTER.md` eklendi.
- Tam proje denetimi icin `PROJECT_AUDIT_REPORT.md` olusturuldu.
- Yayin oncesi kalite, guvenlik, KVKK/GDPR, store ve CI/CD kontrolleri icin `GO_LIVE_CHECKLIST.md` olusturuldu.
- StepWise Plus V2 master contract kapsaminda refactor akisi baslatildi.
- Ortak renk ve font tokenlari `src/shared/theme/tokens.js` altina tasindi.
- `Card`, `Pill` ve `Ico` primitive componentleri `src/shared/ui/primitives.jsx` altina tasindi.
- Isim kisa gosterimi, gun hesabi, kilo degisimi ve rozet helperlari `src/shared/lib/format.js` altina tasindi.
- Vucut tahmini ve program olcu etiketi helperlari `src/shared/lib/wellness.js` altina tasindi.
- IndexedDB medya saklama, cloud medya upload ve signed URL yenileme islemleri `src/features/media/mediaService.js` altina tasindi.
- Medya gosterim componentleri `src/features/media/mediaComponents.jsx` altina tasindi.
- Mesaj kaydi olusturma akisi `src/features/messages/messageService.js` altina tasindi.
- Login, sifre hashleme ve Supabase profil mapleme akisi `src/features/auth/authService.js` altina tasindi.
- Kayitli oturum geri yukleme akisi `src/features/auth/sessionService.js` altina tasindi.
- Cloud workspace kullanici normalize etme ve mesaj birlestirme akisi `src/features/sync/workspaceService.js` altina tasindi.
- Koc ozet dashboard metrikleri `src/features/dashboard/dashboardSelectors.js` altina tasindi.
- Danisan ozet dashboard metrikleri `src/features/dashboard/dashboardSelectors.js` altina tasindi.
- Profil guncelleme patch akisi `src/features/profile/profileService.js` altina tasindi.
- Kilo guncelleme ve kilo log modeli `src/features/weight/weightService.js` altina tasindi.
- Vucut olcumu varsayilanlari ve tahmin uygulama modeli `src/features/measurements/measurementService.js` altina tasindi.
- Progress photo onay listesi ve kanit durum guncelleme modeli `src/features/photos/proofService.js` altina tasindi.
- Gunluk gorev state ve kullanici merge modeli `src/features/tasks/dailyTaskService.js` altina tasindi.
- Bildirim, okunmamis mesaj ve koc notu durum helperlari `src/features/notifications/notificationService.js` altina tasindi.
- Gorev alarm planlama, gecikme kontrolu ve alarm izin uyarilari `src/features/tasks/taskAlarmService.js` altina tasindi.
- Web bildirim metinlerindeki bozuk Turkce karakterler temizlendi.
- Program katalogu, atama secicileri, atomlu/atomsuz dongu normalizasyonu ve program gorunum helperlari `src/features/programs/programService.js` altina tasindi.
- Program atama sonucu olusan danisan patch modeli `buildAssignedProgramClient` ile tek noktaya alindi.
- Yeni danisan varsayilan profil modeli ve koca baglama helperi `src/features/clients/clientService.js` altina tasindi.
- Mesaj konusma filtreleme, oda mesajlari ve mesaj onizleme metni `src/features/messages/messageService.js` altina tasindi.
- Mesaj foto/ses medya draft olusturma akisi `src/features/messages/messageService.js` icinde tek fonksiyona indirildi.
- Mesaj okundu isaretleme ve cloud read senkron orkestrasyonu `src/features/messages/messageService.js` altina tasindi.
- Takvim hafta hesaplama, seans filtreleme ve randevu taslak/notice modelleri `src/features/calendar/appointmentService.js` altina tasindi.
- Koc rapor metrikleri, trend barlari, task log filtreleri ve siralama selectorlari `src/features/reports/reportSelectors.js` altina tasindi.
- Danisan ilerleme body varsayilanlari, haftalik barlari ve aylik siralama selectorlari `src/features/reports/reportSelectors.js` altina tasindi.
- Ortak form kontrol ve mesaj input shell stilleri `src/shared/ui/primitives.jsx` altina tasindi.
- Ortak primary/soft/mint/danger button style helperi `src/shared/ui/primitives.jsx` altina eklendi ve randevu formlarinda kullanilmaya baslandi.
- Register form temizleme, temel dogrulama, lokal koc/danisan kayit modeli ve production kayit payload akisi `src/features/auth/authService.js` altina tasindi.
- Register ekranindaki input ve ana aksiyon butonu ortak `controlStyle`/`buttonStyle` helperlari ile hizalandi.
- Profil bilgileri ve guvenlik form alanlari ortak `controlStyle`/`buttonStyle` helperlari ile hizalandi.
- Proje karar, kalite, release ve autonomous development kurallari `PROJECT_GOVERNANCE.md` dosyasinda belgelendi.
- V2 uzun vadeli veritabani domainleri, 170 tablolu master katalog, iliskiler ve migration sirasi `docs/DATABASE_MASTER_SCHEMA.md` dosyasinda tanimlandi.
- V2 design system, component library, icon, animation, loading, empty ve error state standardi `docs/DESIGN_SYSTEM_MASTER_SPECIFICATION.md` dosyasinda tanimlandi.
- Offline mode, sync engine, cache, storage, search, notification, scheduler, permission, multi-tenant ve event-driven architecture `docs/PLATFORM_SYSTEMS_MASTER_SPECIFICATION.md` dosyasinda tanimlandi.
- AI memory/persona, gamification, community, education, CRM ve marketplace urun modulleri `docs/PRODUCT_MODULES_MASTER_SPECIFICATION.md` dosyasinda tanimlandi.
- DDD, design token sistemi, feature toggle, remote config, plugin, AI orchestrator, workflow, rule, formula, recommendation engine, audit, versioning, health score, prediction, risk, digital twin, prompt versioning, experiment ve event bus mimarisi `docs/ARCHITECTURE_MASTER_SPECIFICATION.md` dosyasinda tanimlandi.
- User story, acceptance criteria, Definition of Done, feature backlog, release plan, QA checklist, KVKK/GDPR ve operasyon standartlari `docs/PRODUCT_DELIVERY_MASTER_SPECIFICATION.md` dosyasinda tanimlandi.
- V2 uygulanabilir sozlesme katmani icin `docs/DATABASE_SCHEMA.sql`, `docs/OPENAPI.yaml`, `docs/FIGMA_DESIGN_SPEC.md`, `docs/AI_PROMPTS.md`, `docs/NOTIFICATION_SCENARIOS.md`, `docs/BUSINESS_RULES.md`, `docs/FORMULA_ENGINE.md` ve `docs/REPORT_TEMPLATES.md` eklendi.
- README ve ROADMAP dosyalari V2 calisma kurallarina gore baslatildi.
