# Message Nav Badge T26

## Amaç

Koç veya danışan mesaj aldığında alt navigasyon rozetinin yalnızca ham kırmızı işaret gibi davranmaması, okunmamış mesaj sayısını merkezi bildirim servisindeki kişi bazlı özetle taşıması.

## Kapsam

- `unreadMessageBadge` App seviyesine bağlandı.
- Alt navigasyon butonlarına `title` ve `aria-label` olarak okunabilir mesaj özeti verildi.
- Görsel rozet mevcut kompakt sayı davranışını korur; mesaj listesi kişi bazlı okunmamış sayıları göstermeye devam eder.

## Kabul Kriteri

- Koç tarafında birden fazla danışandan gelen okunmamış mesajlar toplam sayı olarak görünür.
- Tek danışandan gelen mesajlarda erişilebilir etiket danışan adını ve mesaj sayısını taşır.
- Mevcut mesaj ekranı, konuşma listesi ve okundu senkronizasyonu bozulmaz.
