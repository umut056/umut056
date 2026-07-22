# StepWise Plus V2 - Notification Scenarios

Bu dokuman push, in-app, local alarm ve sistem bildirim senaryolarini tanimlar.

## 1. Bildirim Kanallari

- Local alarm: internet olmadan gorev hatirlatmalari.
- Push notification: FCM ile uzaktan bildirim.
- In-app notification: uygulama icinde kart veya sayac.
- Silent sync: arka planda veri yenileme istegi.

## 2. Genel Kurallar

- Mesaj bildirimleri mesaj sekmesinde sayac olarak gorunur.
- Danisanla ilgili mesaj haric tum koc bildirimleri koc ozet ekranina duser.
- Koc onay verdikten veya kapattiktan sonra ilgili bildirim kaybolur.
- Logout olan kullanici icin gorev alarmlari pasif hale gelir.
- Local alarm internetten bagimsiz calismalidir.

## 3. Senaryo Tablosu

| Event | Alici | Kanal | Baslik | Davranis |
| --- | --- | --- | --- | --- |
| `TaskDue` | Danisan | Local alarm | Gorev zamani | Gorev ekranina yonlendir |
| `TaskOverdue` | Danisan | Local alarm + in-app | Gorev suresi gecti | Ertele veya tamamla |
| `ProofUploaded` | Koc | In-app summary | Yeni fotograf kaniti | Ozet ekraninda onay karti |
| `ProofApproved` | Danisan | Push + in-app | Gorev onaylandi | Gorev durumu guncellenir |
| `ProofRejected` | Danisan | Push + in-app | Kanit tekrar gerekli | Gorev tekrar acilir |
| `MessageReceived` | Koc/Danisan | Push + badge | Yeni mesaj | Mesaj listesinde kisi bazli sayac |
| `AppointmentRequested` | Koc | Push + in-app | Randevu talebi | Takvim detayina gider |
| `AppointmentApproved` | Danisan | Push + in-app | Randevu onaylandi | Takvimde yesil gorunur |
| `AppointmentRescheduled` | Danisan | Push + in-app | Yeni saat onerildi | Onay bekler |
| `WeightMilestone` | Danisan | In-app | Tebrikler | Ozet ekraninda kutlama karti |
| `ClientRiskIncreased` | Koc | In-app summary | Riskli danisan | Ozet risk karti |
| `ProgramAssigned` | Danisan | Push + in-app | Program atandi | Gorevler yenilenir |
| `ProgramEndingSoon` | Koc | In-app | Program bitiyor | Danisan detayina gider |

## 4. Local Alarm Davranisi

- Alarm gorev saatinden 5 dakika sonra baslar.
- Danisan toplam 60 dakika erteleme hakkini parca parca kullanabilir.
- Tamamlanan gorev icin alarm iptal edilir.
- Gun degisince gorev state sifirlanir ve yeni gun alarmlari kurulur.
- Telefon yeniden basladiginda Android native scheduler yeniden kurulum yapmalidir.

## 5. Mesaj Bildirimi

Koc tarafinda:

- Bottom nav badge toplam okunmamis mesaj sayisini gosterir.
- Mesajlar ekraninda her danisan satirinda okunmamis sayi gorunur.
- Sadece kirmizi nokta yeterli degildir.

Danisan tarafinda:

- Koc mesaji ozet ekraninda tekrar gosterilmez.
- Mesaj badge'i okunmamis sayiyi gosterir.

## 6. Kabul Kriterleri

- Offline local alarm calisir.
- Push gelmezse in-app state bozulmaz.
- Bildirim tiklaninca dogru ekrana gider.
- Kapatilan/onaylanan bildirim tekrar gorunmez.
- Bildirim metinlerinde Turkce karakter bozulmaz.
