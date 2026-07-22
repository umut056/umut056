# StepWise Plus V2 - Business Rules

Bu dokuman uygulamanin is kurallarini domain bazli tanimlar. Kod icinde daginik if/else yerine rule engine tarafindan uygulanabilir hale getirilmelidir.

## 1. Authentication

- Koc kaydi admin tarafindan uretilen gecici kod ile yapilir.
- Danisan kaydi koc ref kodu ile yapilir.
- Danisan ref kodu girince koc ad soyad onayi gorur.
- Admin kodlari tek kullanimlik veya sureli olabilir.
- Banned kullanici login olamaz.

## 2. Roles and Permissions

| Aksiyon | Admin | Koc | Danisan |
| --- | --- | --- | --- |
| Tum kullanicilari gorme | Evet | Hayir | Hayir |
| Kendi danisanlarini gorme | Evet | Evet | Hayir |
| Program ekleme | Evet | Evet | Hayir |
| Program atama | Evet | Evet | Hayir |
| Gorev tamamlama | Hayir | Hayir | Evet |
| Kanit onaylama | Evet | Evet | Hayir |
| Mesaj gonderme | Evet | Evet | Evet |
| Audit log gorme | Evet | Hayir | Hayir |

## 3. Programs

- Sistem programlari silinmez, sadece gizlenebilir.
- Koc kendi programlarini ekleyebilir, duzenleyebilir ve silebilir.
- Bir program danisana atandiginda snapshot olarak saklanir.
- Sonradan program sablonu degisse bile mevcut danisan atamasi bozulmaz.
- Atomlu/atomsuz dongu program kurali olarak saklanir.
- Program videosu programla beraber atanir.

## 4. Tasks

- Gunluk gorevler her gun sifirlanir.
- Tamamlanan gorev aktif listeden kalkar.
- Fotograf isteyen gorev galeri secimiyle tamamlanmaz; kamera akisi kullanilir.
- Koc onayi gerektiren kanit pending durumda kalir.
- Koc onay verince bildirim kaybolur.

## 5. Weight and Measurement

- Baslangic kilo program baslangic tarihine baglidir.
- Guncel kilo en son girilen kilo kaydidir.
- Degisim = guncel kilo - baslangic kilo.
- Kilo alma programinda pozitif degisim basari olarak yorumlanabilir.
- Undefined, NaN veya null kritik metrik UI'da gosterilmez.

## 6. Milestones

- 1 kg degisimden itibaren motivasyon mesaji uretilebilir.
- Her 5 kg milestone icin daha belirgin kutlama gosterilir.
- Kutlama mesaji kac gunde kac kg degisim oldugunu yazmalidir.
- Kutlama karti danisan ozet ekraninda sabit kalabilir.

## 7. Messaging

- Koc genel sohbeti acip kapatabilir.
- Kapanan sohbet yeni mesaj gonderimini engeller, gecmis mesajlari silmez.
- Mesajlar kalici saklanir.
- Koc mesaj ekraninda hangi danisandan kac mesaj geldigini gorur.

## 8. Calendar

- Danisan randevu talep eder.
- Koc onaylar veya alternatif saat onerir.
- Onaylanan randevu yesil gorunur.
- Uygun olmayan randevu beklemede kalmaz; alternatif bekler.

## 9. Admin

- Admin en yetkili roldur.
- Admin kullanici detayini gorur ve duzenler.
- Admin aksiyonlari audit log uretir.
- Admin sayfasi mobilde de kullanilabilir ama uzun vadede web panel onceliklidir.

## 10. AI

- AI kullanici verisine rol ve consent sinirlarina gore erisir.
- AI tibbi tani koymaz.
- AI promptlari versionlanir.
- AI sonucu event ve usage log uretir.

