# StepWise Plus V2 - Product Delivery Master Specification

Bu dokuman StepWise Plus V2 icin kullanici hikayeleri, kabul kriterleri, Definition of Done, backlog, release plani, QA, veri gizliligi ve operasyon standartlarini tanimlar.

Amac, gelistirmenin sadece teknik olarak degil; kullanici degeri, test edilebilirlik, yayin kalitesi ve yasal uyumluluk acisindan da production seviyesinde ilerlemesini saglamaktir.

## 1. Gercek Kullanici Senaryolari

Her yeni ozellik asagidaki rollerden en az biri icin user story ile tanimlanir:

- Danisan
- Koc
- Admin
- Sistem/operator

### User Story Formati

```text
Bir [rol] olarak,
[ihtiyac] yapmak istiyorum,
cunku [kullanici degeri].
```

### Temel User Story Katalogu

#### Authentication

- Bir danisan olarak, koc kodu ile kayit olmak istiyorum, cunku dogru koca baglanarak programa baslamaliyim.
- Bir koc olarak, admin tarafindan verilen kodla uye olmak istiyorum, cunku sadece yetkili koclar sisteme girebilmeli.
- Bir admin olarak, koc kayit kodlarini yonetmek istiyorum, cunku platforma yetkisiz koc girisini engellemeliyim.

#### Profil

- Bir danisan olarak, profil fotografimi tek sefer secmek istiyorum, cunku hesabimin kisisel gorunmesini isterim.
- Bir koc olarak, profil fotografimi istedigimde guncellemek istiyorum, cunku danisanlarimin beni kolay tanimasini isterim.
- Bir kullanici olarak, verilerimi duzenleyebilmek istiyorum, cunku yanlis bilgileri duzeltmeliyim.

#### Weight Tracking

- Bir danisan olarak, baslangic ve guncel kilomu gormek istiyorum, cunku ilerlememi takip etmek isterim.
- Bir koc olarak, danisanimin gunluk kilosunu girebilmek istiyorum, cunku degisim ve risk durumunu izlemeliyim.
- Bir danisan olarak, kilo hedefime yaklastigimda kutlama gormek istiyorum, cunku motivasyonum artsin.

#### Measurement Tracking

- Bir danisan olarak, beden olculerimi ve vucut analizimi gormek istiyorum, cunku sadece kilo degil genel degisimimi anlamaliyim.
- Bir koc olarak, danisanin boy, kilo, yas ve olculerine gore tahmini degerleri gormek istiyorum, cunku daha iyi takip yapmaliyim.

#### Daily Tasks

- Bir danisan olarak, bugunku gorevlerimi sirayla gormek istiyorum, cunku hangi isi yapacagimi karistirmamaliyim.
- Bir danisan olarak, fotograf gereken gorevde kameranin acilmasini istiyorum, cunku kaniti galeriden secmeden gercek zamanda cekmeliyim.
- Bir koc olarak, danisanin gonderdigi kanitlari onaylamak istiyorum, cunku tamamlanan gorevlerin dogrulugunu kontrol etmeliyim.

#### Programs

- Bir koc olarak, kayitli program eklemek, duzenlemek ve silmek istiyorum, cunku kendi program katalogumu yonetmeliyim.
- Bir koc olarak, programa video eklemek istiyorum, cunku program danisana ataninca urun kullanim anlatimi da gitsin.
- Bir danisan olarak, atanan programimin gorevlerini net gormek istiyorum, cunku uygulamam gereken rutini bilmeliyim.

#### Messaging

- Bir danisan olarak, kocuma mesaj, fotograf ve sesli mesaj gonderebilmek istiyorum, cunku takip surecinde iletisim kurmaliyim.
- Bir koc olarak, hangi danisandan kac okunmamis mesaj geldigini gormek istiyorum, cunku mesaj kutusuna girince onceligi bilmeliyim.

#### Calendar

- Bir danisan olarak, kocumdan randevu talep etmek istiyorum, cunku gorusme zamanini planlamaliyim.
- Bir koc olarak, randevu talebini onaylamak veya yeni saat onermek istiyorum, cunku takvimimi kontrol etmeliyim.

#### AI

- Bir danisan olarak, AI coach'tan motivasyon ve oneriler almak istiyorum, cunku hedefime daha bilincli ilerlemek isterim.
- Bir koc olarak, AI risk ve progress insight'larini gormek istiyorum, cunku hangi danisana mudahale edecegimi bilmeliyim.

#### Admin

- Bir admin olarak, koc ve danisanlari listelemek, detaylarini gormek ve duzenlemek istiyorum, cunku sistemin en yetkili kontrol noktasi admin panelidir.
- Bir admin olarak, audit loglari gormek istiyorum, cunku kim neyi degistirdi takip edilebilmeli.

## 2. Acceptance Criteria

Her ekran veya feature tamamlandi sayilmak icin kabul kriterlerine sahip olmalidir.

### Genel Kabul Kriterleri

- Kullanici rolune gore dogru ekran gorunur.
- Yetkisiz kullanici korunan veriye erisemez.
- Offline durumda kritik yerel akislarda uygulama cokmez.
- API hatasi kullaniciya anlasilir mesajla gosterilir.
- Loading, empty ve error state tanimlidir.
- Mobil ekranlarda yatay scroll olusmaz.
- Geri butonu ve kapatma davranisi platform beklentisine uygundur.
- Veri kaydedildikten sonra UI anlik veya senkronizasyon sonrasi tutarli hale gelir.

### Authentication Kabul Kriterleri

- Danisan kaydinda koc kodu dogrulanir.
- Koc kaydinda admin kodu dogrulanir.
- Yanlis sifre veya e-posta anlasilir hata verir.
- Oturum arka plana atilinca gereksiz cikis yapmaz.
- Logout sonrasi alarm ve bildirim abonelikleri dogru temizlenir veya role gore pasif hale gelir.

### Task/Alarm Kabul Kriterleri

- Gorev alarmi internet olmasa bile lokal olarak calisir.
- Gorev gunluk olarak sifirlanir.
- Tamamlanan gorev listeden kalkar ve siradaki gorev one gelir.
- Fotograf isteyen gorev kamera akisina yonelir.
- Koc onaylamadan once kanit onizlemesi acilabilir.

### Messaging Kabul Kriterleri

- Mesaj iki tarafta da kalici gorunur.
- Koc hangi danisandan kac mesaj geldigini gorur.
- Okunmamis sayaclar dogru sifirlanir.
- Sesli mesaj mikrofon izinleriyle calisir.
- Fotograf ekleme arti menu uzerinden yapilir.

### Program Kabul Kriterleri

- Koc program ekler, duzenler ve siler.
- Program atama danisan tarafina anlik veya senkronizasyonla duser.
- Program videosu programla beraber atanir.
- Atomlu/atomsuz dongu program kurallarina gore otomatik olusur.

### Reports/Progress Kabul Kriterleri

- Undefined, NaN veya bos kritik metrik gosterilmez.
- Baslangic, guncel, hedef ve degisim degerleri dogru hesaplanir.
- Kutlama karti milestone mantigina gore gorunur.
- Koc rapor ekranlari beyaz ekranda kalmaz.

## 3. Definition of Done

Her task tamamlandi sayilmak icin asagidaki kontrollerden gecmelidir:

- Kod mevcut mimariye uygun yazildi.
- Duplicate component/service/provider/route/database olusmadi.
- Gerekli test veya manuel QA notu eklendi.
- `npm run build` basarili.
- `npm run doctor:production` basarili veya yeni uyari aciklandi.
- README/CHANGELOG/ROADMAP veya ilgili docs guncellendi.
- Responsive kontrol edildi.
- Dark mode uyumlulugu bozulmadi.
- Accessibility kontrol edildi.
- Performans etkisi kontrol edildi.
- Hata ve empty state kontrol edildi.
- Kritik veri akisi icin yetki kontrolu dusunuldu.

## 4. Feature Backlog

Backlog fikirleri ilk surumden ayrilmalidir. Her sey hemen yapilmayacaktir.

### V1 - Production Minimum

- Authentication ve role ayrimi
- Koc kodu ve danisan kaydi
- Kilo takibi
- Olcum takibi
- Progress photo
- Daily tasks
- Program katalogu ve program atama
- Mesajlasma
- Randevu/takvim
- Koc dashboard
- Danisan dashboard
- Admin temel panel
- Bildirimler
- Offline alarm
- Supabase sync
- Temel raporlar
- Veri silme ve export temel akisi

### V1.1 - AI Foundation

- Merkezi prompt library
- AI Orchestrator
- AI Coach temel chat
- AI Motivation
- AI Reports baslangic
- AI usage log
- Prompt versioning

### V2 - Growth

- Community
- Challenge
- Gamification engine
- Coach CRM
- Education library
- Product plugin system
- Advanced reports
- Marketplace altyapisi

### V3 - Enterprise and Integrations

- Wearable cihaz entegrasyonlari
- Kurumsal panel
- Multi-tenant self-service
- Advanced analytics
- Subscription/payment derin entegrasyon
- Enterprise audit ve compliance tooling

## 5. Release Plan

### Alpha

- Hedef: Gelistirici ve ic ekip testi.
- Kapsam: Core login, profil, program, gorev, alarm, mesaj, kilo.
- Cikis kriteri: Kritik beyaz ekran yok, build geciyor.

### Beta

- Hedef: Sinirli koc ve danisan testi.
- Kapsam: Gercek kullanici akislari, Supabase sync, bildirim, medya upload.
- Cikis kriteri: Veri kaybi yok, login/session stabil, kritik alarm akisi calisiyor.

### Closed Beta

- Hedef: Davetli gercek ekipler.
- Kapsam: Koc dashboard, danisan listesi, rapor, randevu, mesaj.
- Cikis kriteri: Crash seviyesi kabul edilebilir, QA checklist geciyor.

### Open Beta

- Hedef: Daha genis test kitlesi.
- Kapsam: Privacy/legal ekranlar, support, feedback, analytics.
- Cikis kriteri: Store gereklilikleri tamam.

### v1.0

- Hedef: Play Store yayinina hazir stabil wellness takip platformu.
- Cikis kriteri: Release imza, gizlilik politikasi, veri silme/export, temel testler, production doctor basarili.

### v1.1

- Hedef: AI foundation ve gelismis raporlar.

### v2.0

- Hedef: Community, gamification, plugin ve premium buyume katmani.

## 6. QA Checklist

Her surumde asagidaki kontroller yapilir:

- Uygulama aciliyor mu?
- Login/register tum roller icin calisiyor mu?
- Arka plana alma oturumu bozuyor mu?
- Offline iken alarm calisiyor mu?
- Online olunca sync dogru calisiyor mu?
- Koc program atadiginda danisana dusuyor mu?
- Danisan fotograf cekince koc onayina dusuyor mu?
- Koc onay verince bildirim kayboluyor mu?
- Mesaj iki tarafa da gidiyor mu?
- Okunmamis sayac dogru mu?
- Rapor ekranlari aciliyor mu?
- Undefined/NaN gorunuyor mu?
- Modal ve bottom sheetlerde yatay scroll var mi?
- Geri/kapat davranisi platforma uygun mu?
- Medya upload ve video playback calisiyor mu?
- API hatalari kullanici dostu mu?
- Performans kabul edilebilir mi?
- Buyuk resimler optimize mi?
- Ekran okuyucu temel label'lari var mi?
- Android izinleri dogru mu?

## 7. Veri Gizliligi ve Yasal Uyumluluk

StepWise Plus saglik, beslenme ve ilerleme verileri isleyebilir. Bu nedenle KVKK ve GDPR ilkeleri bastan tasarlanmalidir.

### Gerekli Yasal Akislar

- Acik riza ekrani
- Gizlilik politikasi
- Kullanim sartlari
- Hassas veri isleme bilgilendirmesi
- Veri silme talebi
- Veri disa aktarma talebi
- Pazarlama izni ayri onay
- Bildirim izni ayri onay
- AI kullanimi icin acik bilgilendirme

### Veri Haklari

- Kullanici verisini gorebilir.
- Kullanici verisini duzeltebilir.
- Kullanici verisini disa aktarabilir.
- Kullanici hesabini ve verilerini silebilir.
- Kullanici AI ile islenen veriler hakkinda bilgilendirilir.

### Guvenlik Ilkeleri

- Service role key client uygulamaya girmez.
- Supabase RLS aktif olur.
- Admin islemleri auditlenir.
- Medya dosyalari yetkisiz acilmaz.
- Hassas loglarda kisisel veri maskelenir.

## 8. Operasyon Dokumantasyonu

Projeyi devralan biri calistirabilmelidir.

### Kurulum Rehberi

- Node versiyonu
- Paket kurulumu
- Env dosyalari
- Supabase baglantisi
- Firebase baglantisi
- Android build gereksinimleri

### Ortam Degiskenleri

- Degisken adi
- Ortam: local, preview, production
- Zorunlu mu?
- Client'a girer mi?
- Secret mi?

### Deploy Rehberi

- Web build
- Android sync
- Debug APK
- Release APK
- AAB
- Store upload
- Rollback

### Backup Plan

- Supabase backup periyodu
- Storage backup periyodu
- Migration snapshot
- Restore testi

### Disaster Recovery

- Supabase kesintisi
- Firebase kesintisi
- Storage kesintisi
- Yanlis migration
- Rollback plani
- Kullaniciya durum bildirimi

## 9. Kabul Kriteri

Bu dokuman tamamlandiginda:

- Her buyuk feature user story ile baslar.
- Her task DoD ile kapanir.
- Her release QA checklist ile dogrulanir.
- Backlog surumlere ayrilir.
- KVKK/GDPR ve operasyon ihtiyaclari ilk gunden planlanir.
- Daha fazla genel talimat eklemek yerine modul bazli teknik spesifikasyonlara gecilir.
