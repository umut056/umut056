# Session and Progress Guard T37

Bu paket iki kritik regresyon alanını kapatır.

## Kapsam

- Uygulama yeniden açılırken workspace kullanıcı listesi henüz hazır değilse kayıtlı oturum artık hemen silinmez.
- Bu davranış, Android/WebView arka plan dönüşlerinde kullanıcının gereksiz şekilde login ekranına düşme riskini azaltır.
- Koç raporundaki güncel kilo satırı normalize edilmiş body verisiyle çizilir.
- Danışan profilindeki hedef kilo kartı normalize edilmiş body verisinden okunur.
- Dashboard kilo formatı için `undefined` metninin ekrana sızmasını engelleyen regresyon testi eklendi.

## Not

Gerçek çıkış akışı aynı kalır. Kullanıcı `Çıkış Yap` dediğinde oturum temizlenir ve native görev alarmları iptal edilir.
