# Task Alarm Rules T14

Bu not gorev alarm servisinin regression kapsamidir.

## Kapsanan Kurallar

- Tamamlanan gorevler alarm listesine girmez.
- Alarm kaydinda gorevin orijinal `idx` degeri korunur.
- Ertelenen gorevlerde `nextAlarm` asil gorev saatinden onceliklidir.
- Gecersiz saatler alarm listesine alinmaz.
- Ayni gun alarm farki dakika bazinda hesaplanir.
- Gorev ancak planlanan saatten 5 dakika sonra gecikmis sayilir.
- Tamamlanan gorevler gecikmis sayilmaz.
- Kesin alarm ve kilit ekrani izin uyarilari birlikte doner.

## Neden Onemli?

Danisanin gunluk gorev alarmi internet olmasa bile cihaz tarafinda dogru kurulabilmeli. Web servis katmanindaki bu kurallar native Android alarm katmanina giden verinin temiz ve tahmin edilebilir kalmasini saglar.

## Test

```bash
npm test
```
