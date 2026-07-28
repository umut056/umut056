# Appointment Service Rules T18

Bu not takvim/randevu servisinin guvenli davranislarini aciklar.

## Kapsanan Kurallar

- Randevular koc, danisan ve tarih bazinda filtrelenir.
- Eksik veya bozuk randevu dizisi bos listeye duser.
- Session patch islemi mevcut randevuyu koruyarak patch uygular.
- Eksik session dizisinde patch beyaz ekran yerine bos sonuc dondurur.
- Koc tarafindan olusturulan randevular varsayilan olarak onayli gelir.
- Danisan tarafindan talep edilen randevular varsayilan olarak beklemede gelir.
- Randevu bildirim metinleri Turkce karakterlerle dogru uretilir.
- Haftalik takvim yardimcisi pazartesi baslangicli 7 gun uretir.

## Neden Onemli?

Takvim bolumu hem koc hem danisan tarafinda randevu akisini tasiyacak. Bu servis testleri UI tarafinda beyaz ekran riskini azaltir ve ileride bildirim/notification entegrasyonu icin ayni kurallari tekrar kullanmayi saglar.

## Test

```bash
npm test
```
