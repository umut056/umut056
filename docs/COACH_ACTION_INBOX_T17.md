# Coach Action Inbox T17

Bu not kocun gunluk aksiyonlarini tek servis ciktisinda toplamayi aciklar.

## Kapsanan Kaynaklar

- Okunmamis danisan mesajlari
- Bekleyen fotograf kanitlari
- Bekleyen veya onerilen randevular

## Kapsanan Kurallar

- Mesajlarda danisan adi, okunmamis adet ve son mesaj onizlemesi korunur.
- Fotograf kanitlari mesajlardan daha yuksek oncelikle listelenir.
- Randevu talepleri tarih/saat ve danisan adiyla listelenir.
- Eksik `coachId` durumunda bos liste doner.
- Liste oncelik ve zaman bilgisine gore siralanir.

## Neden Onemli?

Koc tarafinda sadece kirmizi nokta gostermek yeterli degil. Koc mesajlar ekranina girdiginde kimin yazdigini, kac mesaj oldugunu ve hangi aksiyonun daha oncelikli oldugunu gorebilmelidir. Bu servis ileride ozet, mesajlar ve bildirim UI katmanlarina ayni veriyi verecek.

## Test

```bash
npm test
```
