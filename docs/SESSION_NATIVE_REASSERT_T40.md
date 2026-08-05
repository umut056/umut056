# Session Native Reassert T40

## Amaç

Android WebView arka plandan döndüğünde native köprüsü yeniden aktif olmayabilir. Bu durumda kullanıcı oturumu ekranda açık görünse bile native alarm tarafı eski durumla kalabilir.

## Değişiklik

`App.jsx` içinde aktif kullanıcı varken:

- Sayfa ilk yüklenince `saveSession(user)` yeniden çağrılır.
- Uygulama tekrar görünür olduğunda oturum native tarafa yeniden bildirilir.
- Danışan oturumunda mevcut günlük görev alarmları yeniden schedule edilir.

## Beklenen Etki

- Arka plandan dönüşte oturumun native tarafta pasif kalma riski azalır.
- Danışan alarm listesi internet olmasa bile tekrar native tarafa aktarılır.
- Logout davranışı değişmez; çıkışta alarmlar hâlâ iptal edilir.
