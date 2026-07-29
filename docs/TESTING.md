# StepWise Plus V2 - Testing Guide

Bu dosya projede eklenen ilk otomatik test kapisini aciklar.

## Komutlar

Tum unit ve smoke testleri:

```bash
npm test
```

Sadece kritik smoke akis:

```bash
npm run smoke
```

Lint kontrolu:

```bash
npm run lint
```

Production build:

```bash
npm run build
```

Production baglanti/guvenlik temel kontrolu:

```bash
npm run doctor:production
```

## Su Anda Kapsanan Alanlar

- Program listesi tekillestirme
- Program lifecycle: sistem sablonunu koca ozel kopyalama, satir parse etme, silme ve gizleme kurallari
- Program atama modeli
- Program kaydetme: duzenlenen programin atanmis danisanlara ve urun videosuna yansimasi
- 3 gun atomlu / 2 gun atomsuz gorev dongusu normalizasyonu
- Program videosunun atamaya eklenmesi
- Gunluk gorev state olusturma
- Yeni gunde gorev state sifirlama
- Tamamlanan gunluk gorevlerin aktif listeden dusmesi ve gun tamamlama kurali
- Gunluk gorev sirasi: kalan gorev sayisi ve siradaki gorevin tek queue modelinden uretilmesi
- Gunluk gorev ekrani: tamamlanan gorevlerin listeden dusmesi ve koc dashboard uyumunun bugunku state'ten hesaplanmasi
- Gunluk compliance ve bekleyen gorev hesaplama
- Gorev alarm kurallari: aktif gorev filtresi, erteleme onceligi, 5 dakika gecikme toleransi ve izin uyarilari
- Android alarm sesi: israrci native bildirim ve daha uzun WebView fallback tonu
- Android alarm offline tekrar: aktif oturum korumasi, stale alarm temizligi ve native tekrar metadata akisi
- Android alarm tekrar uyari hardening: ayni alarm icin donusumlu bildirim ID temizligi
- Gorev/fotograf dili: kamera zorunlulugu davranisi korunurken "kanit/zorunlu fotograf" UI metinleri temizlendi
- Koc fotograf onay kuyrugu: kapsam filtresi, danisan notu, onay/red/gizleme ve log olusturma
- Koc-danisan mesaj filtresi
- Grup/oda mesaj siralama
- Mesaj onizleme metni
- Koc action inbox: okunmamis mesaj, fotograf onayi ve randevu taleplerini oncelikli tek listede toplama
- Koc action inbox filtresi: mesajlar kapaliyken aksiyon listesinin yalnizca islem gerektiren kayitlari tasimasi
- Takvim/randevu servisi: koc/danisan/tarih filtresi, patch fallback, varsayilan session ve Turkce bildirim metinleri
- Cloud mesaj map: gonderen adi metadata koruma
- Okunmamis mesajlar: gonderen bazli adet, son mesaj ve onizleme ozeti
- Mesaj badge ozeti: tek/multiple gonderen icin okunabilir toplam ve son gonderen metadatasi
- Mesaj navigasyon rozeti: okunmamis ozet metadata'sinin alt navigasyona tasinmasi
- Koc mesaj inbox: okunmamis gonderen ozeti, danisan siralama ve sohbet acinca okundu senkronu
- Koc notu eski App shell akisi: danisan ozetinde ikinci iletisim yuzeyi olusturmamasi icin temizlendi
- Medya kaliciligi: lokal kayit, cloud upload, offline fallback ve signed URL yenileme
- Kilo/olcum servisleri: gecersiz kilo korumasi, ilk kilo kaydi, kg format fallback ve vucut olcum normalize akisi
- Koc dashboard ozet hesaplama
- Koc rapor selectorlari: eksik veri ve kapsamli danisan filtreleme regression testi
- Workspace kullanici guard'i: rapor, profil, takvim ve mesaj ekranlarinda eksik allUsers prop'u beyaz ekran olusturmaz
- Rapor/ilerleme body guard: eksik ve bozuk vucut olcumu degerlerini normalize etme
- V2 wellness dashboard: danisan health score, koc komuta ozeti, wellness modul skorlari ve su/beslenme/aktivite kayit servisleri
- Profil patch: offline/local kayit, cloud merge, cloud hata fallback ve eksik id korumasi
- Auth registration: rol, ref kodu, aktivasyon kodu ve lokal danisan varsayilanlari
- Hazir test hesaplari: login kartlari, seed e-posta/sifreleri ve auth repair akisi tek kaynakta dogrulanir
- Danisan dashboard ilerleme hesaplama
- Android alarm hardening: native kanal surumu, tekrar araligi ve kilit ekrani manuel test akisi
- Cloud/local workspace merge: program, vucut olcumu, gunluk ilerleme ve urun videosu koruma
- Mesaj cloud/local merge: okundu bilgisi, medya metadatasi ve siralama koruma
- Program task cloud mapping: repeat/cycle metadata create, update ve restore koruma
- Kritik mini smoke flow: program ata, gorev state uret, dashboard guncelle, mesajlari filtrele

## Sonraki Test Oncelikleri

1. Login role smoke testleri.
2. Rapor ve profil beyaz ekran regression testi.
3. Android alarm logout/tamamlandi/offline testi.
4. Supabase RLS ve Storage yetki testleri.

## Not

Bu ilk paket bilerek servis ve selector seviyesinde baslatildi. Amac calisan ekrani bozmadan hizli ve guvenilir bir test zemini kurmaktir. React ekran testleri `App.jsx` parcala-refactor ilerledikce daha saglikli eklenecektir.
