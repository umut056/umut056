# Report Selector Hardening T9

## Amaç

Koç rapor ekranının eksik veya geç yüklenen workspace verisinde beyaz ekrana düşmesini engellemek.

## Değişiklik

- Rapor selector'ları `null`, `undefined` veya beklenmeyen liste dışı değerlerde boş liste/0 dönecek şekilde korumaya alındı.
- Riskli danışan ve görev log selector'ları hatalı callback veya eksik log verisinde güvenli davranır.
- Koç danışan filtreleme, ortalama uyum, kilo değişimi, sıralama ve görev log kapsamı test edildi.

## Risk

Düşük. Veri tam geldiğinde mevcut sıralama ve hesaplama davranışı korunur.

## Test

- `npm run lint`
- `npm run build`
- `npm test`
