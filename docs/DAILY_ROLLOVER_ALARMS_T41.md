# Daily Rollover Alarms T41

## Amaç

Danışan uygulamayı gece boyunca açık veya arka planda tutarsa, önceki günün görev/alarm durumu yeni güne taşınmamalıdır.

## Değişiklik

`App.jsx` içinde uygulama seviyesinde `appDate` tutulur ve dakikada bir `todayKey()` ile kontrol edilir.

Yeni gün algılandığında:

- Danışan alarm imzası değişir.
- Günlük görev state'i yeni tarih için yeniden hesaplanır.
- Native Android alarm listesi yeni gün görevlerine göre tekrar schedule edilir.

## Beklenen Etki

- Tamamlanan görevler ertesi güne yanlış taşınmaz.
- Telefon açık veya arka planda kalsa bile yeni gün alarm planı yenilenir.
- İnternet bağlantısı olmasa bile native alarm listesi yerel görevlerden tekrar kurulur.
