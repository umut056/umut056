# StepWise Plus V2 Roadmap

## 1. Repository Analizi

- Durum: Tamamlandi.
- Cikti: `STEPWISE_ANALYSIS.md`

## 2. Refactor

- Durum: Devam ediyor.
- Ilk adim: Theme tokenlari ortak klasore tasindi.
- Tamamlanan ek adim: `Card`, `Pill` ve `Ico` primitive componentleri ortak UI klasorune tasindi.
- Tamamlanan ek adim: format ve ilerleme helperlari ortak lib klasorune tasindi.
- Tamamlanan ek adim: wellness hesaplama ve olcu ayiklama helperlari ortak lib klasorune tasindi.
- Tamamlanan ek adim: medya saklama/upload servisleri feature modulu altina tasindi.
- Tamamlanan ek adim: medya gosterim componentleri feature modulu altina tasindi.
- Tamamlanan ek adim: mesaj gonderme kayit olusturma akisi feature servisine tasindi.
- Tamamlanan ek adim: login, local sifre hashleme ve Supabase profil mapleme auth servisine tasindi.
- Tamamlanan ek adim: kayitli oturum geri yukleme akisi auth session servisine tasindi.
- Tamamlanan ek adim: cloud workspace kullanici normalize etme ve mesaj birlestirme akisi sync servisine tasindi.
- Tamamlanan ek adim: koc ozet dashboard metrikleri selector katmanina tasindi.
- Tamamlanan ek adim: danisan ozet dashboard metrikleri selector katmanina tasindi.
- Tamamlanan ek adim: profil patch islemleri servis katmanina tasindi.
- Tamamlanan ek adim: kilo guncelleme ve kilo log modeli servis katmanina tasindi.
- Tamamlanan ek adim: measurement/body analysis varsayilanlari ve tahmin uygulama modeli servis katmanina tasindi.
- Tamamlanan ek adim: progress photo onay listesi ve durum guncelleme modeli servis katmanina tasindi.
- Tamamlanan ek adim: daily task state ve kullanici merge modeli servis katmanina tasindi.
- Tamamlanan ek adim: bildirim, okunmamis mesaj ve koc notu helperlari notification servisine tasindi.
- Tamamlanan ek adim: alarm planlama, gecikme kontrolu ve izin uyarilari task alarm servisine tasindi.
- Tamamlanan ek adim: program katalogu, atama secicileri ve atomlu/atomsuz dongu normalizasyonu program servisine tasindi.
- Tamamlanan ek adim: program atama sonucunda danisana yazilan patch modeli servis katmanina tasindi.
- Tamamlanan ek adim: danisan olusturma varsayilanlari ve koca baglama modeli clients servisine tasindi.
- Tamamlanan ek adim: coach/client mesaj listesi, oda mesajlari ve onizleme metni messages servisine tasindi.
- Tamamlanan ek adim: mesaj foto/ses medya draft olusturma akisi messages servisine tasindi.
- Tamamlanan ek adim: mesaj okunma ve cloud read senkron akisi messages servisine tasindi.
- Tamamlanan ek adim: takvim hafta hesaplama, seans filtreleme ve randevu taslak/notice modelleri calendar servisine tasindi.
- Tamamlanan ek adim: koc rapor metrikleri, trend barlari, task log filtreleri ve siralama selectorlari reports servisine tasindi.
- Tamamlanan ek adim: client progress body varsayilanlari, haftalik barlari ve aylik siralama selectorlari reports servisine tasindi.
- Tamamlanan ek adim: ortak form kontrol ve mesaj input shell stilleri primitive helper olarak eklendi.
- Tamamlanan ek adim: ortak button/action stilleri primitive helper olarak eklendi ve randevu formlarinda kullanilmaya baslandi.
- Tamamlanan ek adim: authentication/register temizleme, dogrulama, local kayit modeli ve production payload akisi auth servisine tasindi.
- Tamamlanan ek adim: profil bilgileri ve guvenlik form alanlari ortak form/button helperlari ile hizalandi.
- Siradaki guvenli adim: client/program modal formlarinda ortak form kontrol/button helperlarini yayginlastirmak.

## 2.1 Master Specifications

- Durum: Basladi.
- Tamamlanan adim: Database Master Schema `docs/DATABASE_MASTER_SCHEMA.md` altinda tanimlandi.
- Tamamlanan adim: Design System Master Specification `docs/DESIGN_SYSTEM_MASTER_SPECIFICATION.md` altinda tanimlandi.
- Tamamlanan adim: Platform Systems Master Specification `docs/PLATFORM_SYSTEMS_MASTER_SPECIFICATION.md` altinda tanimlandi.
- Tamamlanan adim: Product Modules Master Specification `docs/PRODUCT_MODULES_MASTER_SPECIFICATION.md` altinda tanimlandi.
- Tamamlanan adim: Architecture Master Specification `docs/ARCHITECTURE_MASTER_SPECIFICATION.md` altinda tanimlandi.
- Tamamlanan adim: Product Delivery Master Specification `docs/PRODUCT_DELIVERY_MASTER_SPECIFICATION.md` altinda tanimlandi.
- Tamamlanan adim: Database Schema Contract `docs/DATABASE_SCHEMA.sql` altinda tanimlandi.
- Tamamlanan adim: OpenAPI Contract `docs/OPENAPI.yaml` altinda tanimlandi.
- Tamamlanan adim: Figma Design Spec `docs/FIGMA_DESIGN_SPEC.md` altinda tanimlandi.
- Tamamlanan adim: AI Prompt Library `docs/AI_PROMPTS.md` altinda tanimlandi.
- Tamamlanan adim: Notification Scenarios `docs/NOTIFICATION_SCENARIOS.md` altinda tanimlandi.
- Tamamlanan adim: Business Rules `docs/BUSINESS_RULES.md` altinda tanimlandi.
- Tamamlanan adim: Formula Engine `docs/FORMULA_ENGINE.md` altinda tanimlandi.
- Tamamlanan adim: Report Templates `docs/REPORT_TEMPLATES.md` altinda tanimlandi.
- Siradaki adim: Bu sozlesmelere gore Sprint 1 refactor ve eksik core akislari kademeli uygulanacak.
- Devaminda: Test Master ve Deployment Master detaylandirilacak.

## 6. Weight Tracking

- Durum: Basladi.
- Koc tarafindan girilen guncel kilo icin local `body` ve `weightLogs` modeli servis katmanina tasindi.

## 7. Measurement Tracking

- Durum: Basladi.
- Vucut olcumu varsayilanlari, numeric temizleme ve otomatik tahmin uygulama modeli feature servisine tasindi.

## 8. Progress Photos

- Durum: Basladi.
- Koc ozetindeki onay bekleyen foto kanitlari ve kanit review log modeli feature servisine tasindi.

## 9. Daily Tasks

- Durum: Basladi.
- Gunluk gorev state olusturma ve kullaniciya geri merge etme modeli feature servisine tasindi.
- Gorev alarm planlama, gecikme kontrolu ve alarm izin uyarilari feature servisine tasindi.

## 11. Program Management

- Durum: Basladi.
- Program katalogu, sistem/koç program ayrimi, gizlenen programlar, aktif program metni, atomlu/atomsuz dongu normalizasyonu ve program videosu atama modeli feature servisine tasindi.
- Atama, program video guncelleme ve mevcut program guncelleme akisinda danisana yazilan program patch modeli tek fonksiyonda toplandi.

## 10. Notifications

- Durum: Basladi.
- Local bildirim olusturma, okunmamis mesaj sayimi, mesaj okundu isaretleme ve koc notu kapatma modeli feature servisine tasindi.

## 3. Authentication

- Durum: Basladi.
- Login ve local fallback akisi feature servisine tasindi.
- Kayitli oturum geri yukleme akisi feature servisine tasindi.
- Cloud workspace geri yukleme merge akisi feature servisine tasindi.
- Koc tarafindan danisan olustururken kullanilan default client profili servis katmanina tasindi.
- Register form validation ve local/production kayit payload modeli feature servisine tasindi.
- Register, forgot password, session, token, role ve permission akislari kademeli olarak moduler hale getirilecek.

## 4. User Profile

- Durum: Basladi.
- Profil patch islemleri feature servisine tasindi.
- Profil, boy, yas, cinsiyet, aktivite, hedef, baslangic kilosu, guncel kilo ve hedef tarih yapisi guclendirilecek.

## 5. Dashboard

- Durum: Basladi.
- Koc ozet metrikleri UI disinda selector katmanina tasindi.
- Danisan ozet metrikleri UI disinda selector katmanina tasindi.
- Apple Health seviyesinde modern dashboard kartlari kademeli olarak iyilestirilecek.

## Sonraki Basliklar

- Weight Tracking
- Measurements
- Progress Photos
- Nutrition
- Water Tracking
- Activity Tracking
- Herbalife Product Tracking
- Daily Tasks
- Achievements
- Coach Dashboard
- Calendar
- Messaging
- Reports
- Notifications
- AI Foundation
- Premium
- Payments
- Admin Panel
- Analytics
- Performance
- Testing
- Accessibility
- Localization
- Dark Mode
- Release
