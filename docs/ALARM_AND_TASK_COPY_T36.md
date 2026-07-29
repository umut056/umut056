# Alarm and Task Copy Hardening T36

## Amaç

Danışan görev ekranındaki sert "kanıt/zorunlu fotoğraf" dilini temizlemek ve Android görev alarmlarının tek uyarıdan sonra sessiz kalma riskini azaltmak.

## Değişiklikler

- Fotoğraf gerektiren görevlerde kamera davranışı korundu.
- Kullanıcı arayüzündeki "kanıt", "zorunlu fotoğraf" ve "kamera kanıtı" ifadeleri görev fotoğrafı diline çekildi.
- Koç onay kuyruğunda danışan notu ve fotoğraf önizleme akışı korundu.
- Android native alarm tekrarı dönüşümlü bildirim ID kullanacak şekilde güçlendirildi.
- Görev tamamlanınca veya alarm iptal edilince dönüşümlü bildirim ID'leri birlikte temizlenir.
- Web bildirim metinlerindeki Türkçe karakter bozulmaları düzeltildi.

## Manuel Kontrol

1. Danışanla giriş yap.
2. Görevler ekranında fotoğraf gerektiren bir görevi tamamlamaya çalış.
3. Kamera açılmalı; ekranda "zorunlu fotoğraf" veya "kanıt" dili görünmemeli.
4. Görev alarmı süresi geçince native bildirim gelmeli.
5. Görev tamamlanmadan alarm aktif kalırsa tekrar uyarı üretmeli.
6. Görev tamamlanınca ilgili alarm bildirimleri kapanmalı.
