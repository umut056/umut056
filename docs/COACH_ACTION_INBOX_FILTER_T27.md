# Coach Action Inbox Filter T27

## Amaç

Koç özet ekranında mesaj dışındaki danışan aksiyonlarını ayrı takip edebilmek. Mesajlar kendi sekmesinde kalır; fotoğraf kanıtı ve randevu gibi işlem gerektiren kayıtlar aksiyon kutusunda yönetilebilir.

## Değişiklik

- `coachActionInbox` fonksiyonuna `includeMessages` seçeneği eklendi.
- Varsayılan değer `true` bırakıldı, böylece mevcut çağrılar bozulmaz.
- `includeMessages: false` ile okunmamış mesajlar aksiyon listesinden çıkarılır.

## Kabul Kriteri

- Mesajlar kapatıldığında inbox yalnızca fotoğraf/randevu gibi aksiyonları döndürür.
- Varsayılan kullanım eski sıralama davranışını korur.
- Mesaj sayıları `unreadMessageBadge` ve mesaj ekranı üzerinden yönetilmeye devam eder.
