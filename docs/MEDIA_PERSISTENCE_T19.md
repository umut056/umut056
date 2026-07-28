# Media Persistence T19

Bu not fotograf, video ve ses medyalarinin lokal/cloud kalicilik kurallarini aciklar.

## Kapsanan Kurallar

- Medya once lokal IndexedDB deposuna yazilir.
- Cloud upload basarili olursa metadata cloud bilgileriyle zenginlesir.
- Cloud upload basarisiz olursa medya `local_saved` olarak kalir.
- Storage path yoksa signed URL istenmez.
- Oturum tokeni yoksa mevcut cached URL kullanilir.
- Token varsa Supabase signed URL yenilenir.
- Signed URL yenileme basarisiz olursa mevcut cached URL ile devam edilir.

## Neden Onemli?

Gorev kanit fotografi, profil fotografi, urun videosu ve mesaj medyasi uygulamanin kritik verileridir. Kullanici internet yokken de kaydin kaybolmadigini gormeli; internet geldiginde cloud metadata ayni model uzerinden zenginlesebilmelidir.

## Test

```bash
npm test
```
