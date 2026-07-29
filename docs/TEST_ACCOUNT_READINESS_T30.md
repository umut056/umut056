# Test Account Readiness T30

## Amaç

Test sürecinde koç ve danışan hazır giriş bilgilerinin kartlarda farklı, seed kullanıcılarında farklı kalmasını engellemek.

## Kapsam

- `TEST_LOGIN_ACCOUNTS` tek kaynak olarak tanımlandı.
- Login ekranındaki hazır hesap kartları bu kaynaktan üretilir.
- Lokal seed koç ve 3 danışan hesabı aynı kaynaktaki e-posta/şifreyi kullanır.
- Readiness helper eksik test kullanıcılarını giriş denemesinden önce raporlayabilir.

## Test Hesapları

- Koç: `koc.test0306@stepwiseplus.app` / `test123`
- Danışan 1: `danisan.test0306@stepwiseplus.app` / `test123`
- Danışan 2: `elif.test0306@stepwiseplus.app` / `test123`
- Danışan 3: `mert.test0306@stepwiseplus.app` / `test123`

## Not

Bu adım lokal/test APK akışını güvenceye alır. Supabase staging kullanıcıları ayrı olarak `npm run test:rls:staging` ile service role üzerinden hazırlanır.
