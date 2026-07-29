# Alarm Offline Repeat Hardening T31

## Amac

Gorev alarmlarinin internet olmadan, ekran kilitliyken ve uygulama arka plandayken daha guvenilir calismasi icin native Android planlama akisi guclendirildi.

## Degisiklikler

- Web alarm modeli native tarafa `repeatDelayMs`, `graceMinutes` ve `requiresAcknowledgement` metadata alanlarini gonderir.
- Android alarm receiver yeni kanal surumuyle (`stepwise_task_alarm_v8`) ses/titresim ayarlarini tekrar kurar.
- Alarm tekrar tetiklemesi artik web tarafindan gelen tekrar araligini okur.
- Oturum kapaliysa native alarm calmaz ve stale alarm kaydi temizlenir.
- Tek gorev alarmi iptal edildiginde kayitli alarm listesi de guncellenir.
- Toplu iptal araligi 120'den 240 alarm id'sine genisletildi.

## Manuel Test

1. Danisan olarak giris yap.
2. Bugunku gorevlerden hatirlaticilari ac.
3. Cihazi kilitle veya uygulamayi arka plana al.
4. Gorev saatinden 5 dakika sonra alarm bildirimini bekle.
5. Gorevi tamamla; ayni gorev icin tekrar alarm gelmemeli.
6. Uygulamadan cikis yap; eski gorev alarmlari tekrar calmamali.

## Not

Android alarm kanallari cihaz tarafinda kalici oldugu icin kanal surumu artirildi. Bu, onceki sessiz/az duyulan kanal ayarlarini yeni kurulumda bypass eder.
