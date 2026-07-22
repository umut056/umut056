# StepWise Plus V2 - Business Rules Master

Bu dokuman StepWise Plus V2 domain is kurallarinin ana kaynagidir.

## 1. Genel Kurallar

- Admin tum sistemi gorur ama hassas islemler audit log uretir.
- Coach yalnizca kendi danisanlarini gorur.
- Client yalnizca kendi verisini gorur.
- Program atama olmadan danisan gorev akisi baslamaz.
- Gunluk gorevler gun sonunda yeni gune devretmez; yeni gun kendi state'i ile baslar.
- Gorev fotografi gerekiyorsa galeri degil kamera acilir.
- Profil fotografi galeri/kamera ile secilebilir.

## 2. Auth Kurallari

- Coach kaydi admin tarafindan uretilen kodla yapilir.
- Client kaydi coach referans koduyla yapilir.
- Client kod girdiginde coach adi gorunur.
- E-posta benzersizdir.
- Rol client tarafindan serbest degistirilemez.

## 3. Program Kurallari

- Program koc tarafindan eklenebilir.
- Program duzenlenebilir.
- Program silinebilir veya arsivlenebilir.
- Atanmis program gecmisi korunur.
- Atomlu/atomsuz dongu program tanimindan otomatik hesaplanir.
- Urun kullanim videosu programa baglanabilir.
- Program danisana atandiginda gorevler danisan gunluk akisina yansir.

## 4. Gorev Kurallari

- Gorevler gunluk state uretir.
- Tamamlanan gorev listeden kalkabilir veya tamamlandi alanina tasinir.
- Geciken gorev alarm uretir.
- Alarm internet olmasa bile calismalidir.
- Tamamlanan gorevin alarmi durur.
- Danisan fotograf yuklediginde koc onay akisi baslar.
- Koc onaylayinca bildirim ozet ekranindan kalkar.

## 5. Mesaj Kurallari

- Koc ve danisan mesajlari karsilikli ve kalici olur.
- Mesaj bildiriminde gonderen kisi belli olur.
- Okunmamis sayisi kisi bazli gorunur.
- Mesaj, ozet ekraninda metin olarak tekrar gosterilmez.
- Foto ve sesli mesaj saklanir.

## 6. Kilo ve Olcum Kurallari

- Baslangic kilo, guncel kilo, hedef kilo ve degisim her zaman tanimli gosterilir.
- `undefined kg` gibi bos deger UI'da gorunmez.
- Kilo verme ve alma hedefleri ters mantikla hesaplanir.
- Her 1 kg ve her 5 kg esiginde kutlama tetiklenebilir.
- Kutlama karti danisan ozetinde anlamli ise gosterilir.

## 7. Coach Kurallari

- Coach danisan ekler, duzenler, program atar.
- Coach onay bekleyen gorev fotografini ozet ekraninda gorur.
- Coach gerekli bildirimi onaylayinca/kapatinca kart kalkar.
- Coach rapor ekranlari beyaz ekran vermemelidir.
- Coach program kutuphanesi duplicate programlari ayirt edebilmelidir.

## 8. Admin Kurallari

- Admin coach ve client detayini gorebilir.
- Admin kullanici duzenleyebilir.
- Admin ban/aktif durumlarini yonetir.
- Admin kod uretir.
- Admin islemleri auditlenir.

## 9. Kabul Kriterleri

- Her kural icin test senaryosu vardir.
- Bos veri UI'da bozuk gorunmez.
- Yetkisiz kullanici veri gormez.
- Kritik islemler audit log uretir.
- Raporlar ve profiller crash/white screen vermez.

