# Coach Proof Queue T16

Bu not danisan fotograf kanitlarinin koc ozetindeki onay kuyruguna guvenli aktarimini aciklar.

## Kapsanan Kurallar

- Sadece ilgili koca bagli danisanlarin bekleyen kanitlari listelenir.
- Danisanin kanit notu ve gorev adi onay aksiyonunda korunur.
- Bos veya hatali `users` verisi beyaz ekrana neden olmaz.
- Onay/red islemi hem kok `photoProofs` kopyasina hem gunluk `dailyTasks[date].photoProofs` kopyasina yazilir.
- Koc bildirimi kapatirsa kanit silinmez, sadece koc kuyrugundan gizlenir.
- Inceleme logu koc, danisan, gorev, aksiyon ve tarihi icerir.

## Neden Onemli?

Koc tarafinda fotograf onaylari raporda ve ozette daginik kalmamali. Servis kuyrugu tek kaynak olarak davranirsa UI, rapor ve bildirim katmanlari ayni davranisi kullanabilir.

## Test

```bash
npm test
```
