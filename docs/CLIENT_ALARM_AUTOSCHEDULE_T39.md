# Client Alarm Auto Schedule T39

## Amaç

Danışan uygulamayı açtığında görev sekmesine girmese bile o güne ait aktif görev alarm planının native Android katmanına yazılması.

## Değişiklik

- App shell içinde danışan oturumu, programı, günlük görev durumu veya saat tercihleri değiştiğinde aktif görevler yeniden hesaplanır.
- Atanmış program yoksa native görev alarmları temizlenir.
- Atanmış program varsa bugünün `dailyState` verisiyle tamamlanmamış görevler native alarm katmanına gönderilir.

## Kapsam

- İnternet gerektirmez; alarm planı cihazdaki native `StepWiseNative.scheduleTaskAlarms` köprüsüne yazılır.
- Görev ekranındaki manuel "Bugünkü Hatırlatmaları Aç" davranışı korunur.
- Çıkış yapıldığında mevcut `cancelAllNativeAlarms` davranışı korunur.

## Manuel Test

1. Danışan hesabıyla giriş yap.
2. Program atanmış danışanda görev sekmesine girmeden uygulamayı arka plana al.
3. Alarm saatinden 5 dakika sonra native görev bildirimi bekle.
4. Görev tamamlanınca ilgili alarmın iptal olduğunu kontrol et.
5. Çıkış yapınca alarm planının temizlendiğini kontrol et.
