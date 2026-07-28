# Profile Patch Resilience T15

Bu not profil kaydetme akisinda beyaz ekran riskini azaltan servis guvencesini aciklar.

## Kapsanan Kurallar

- Profil patch lokal kullanici objesiyle birlestirilir.
- Production disinda cloud cagri yapilmaz.
- Production modda cloud save yalnizca `id` ve `supabaseToken` birlikte varsa denenir.
- Cloud save basarisiz olursa ekran lokal patch ile calismaya devam eder.
- Cloud sonucunda gelen alanlar lokal patch sonucuna eklenir.

## Neden Onemli?

Profil ekranlari telefonun offline kalmasi, Supabase oturumunun gec yuklenmesi veya profil id bilgisinin eksik gelmesi durumunda bos ekrana dusmemelidir. Bu servis seviyesi testleri profil ekranini buyutmeden once guvenli temel olusturur.

## Test

```bash
npm test
```
