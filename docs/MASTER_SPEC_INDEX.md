# StepWise Plus V2 - Master Specification Index

Bu indeks StepWise Plus V2 icin urun sozlesmesi dosyalarini tek yerde toplar.

Amaç yeni kural eklemek degildir. Amaç ekibin, AI ajanlarinin ve gelistiricilerin ayni urun tanimina bakarak ilerlemesini saglamaktir.

## Master Dosyalar

| Dosya | Amac | Durum |
| --- | --- | --- |
| `DATABASE_MASTER_SCHEMA.md` | Uzun vadeli domain tablo haritasi ve migration yonu | Mevcut |
| `DATABASE_SCHEMA.sql` | Uygulanabilir ilk SQL taslagi | Mevcut |
| `API_MASTER_SPECIFICATION.md` | API davranis, endpoint, hata ve versioning standardi | Yeni |
| `OPENAPI.yaml` | Makine okunabilir API sozlesmesi | Mevcut |
| `UI_UX_MASTER_SPECIFICATION.md` | Tum ekranlar, component standardi, UX durumlari | Yeni |
| `FIGMA_DESIGN_SPEC.md` | Figma aktarim ve tasarim token ozeti | Mevcut |
| `AI_MASTER_SPECIFICATION.md` | AI modulleri, prompt, context, guvenlik ve versioning | Yeni |
| `AI_PROMPTS.md` | Ilk prompt kutuphanesi | Mevcut |
| `BUSINESS_RULES_MASTER.md` | Domain bazli is kurallari ve kabul kriterleri | Yeni |
| `BUSINESS_RULES.md` | Mevcut kisa is kurallari | Mevcut |
| `TEST_MASTER.md` | QA, test seviyesi, kabul ve regression matrisi | Yeni |
| `DEPLOYMENT_MASTER.md` | Release, Supabase, Android, store ve rollback plani | Yeni |
| `GO_LIVE_CHECKLIST.md` | Yayin oncesi kontrol listesi | Mevcut |

## Kullanim Sirasi

1. Yeni modül icin once `BUSINESS_RULES_MASTER.md` okunur.
2. Veri gerekiyorsa `DATABASE_MASTER_SCHEMA.md` ve `DATABASE_SCHEMA.sql` kontrol edilir.
3. API gerekiyorsa `API_MASTER_SPECIFICATION.md` ve `OPENAPI.yaml` takip edilir.
4. Ekran gerekiyorsa `UI_UX_MASTER_SPECIFICATION.md` ve `FIGMA_DESIGN_SPEC.md` takip edilir.
5. AI gerekiyorsa `AI_MASTER_SPECIFICATION.md` ve `AI_PROMPTS.md` takip edilir.
6. Geliştirme bitince `TEST_MASTER.md` ve `GO_LIVE_CHECKLIST.md` ile dogrulanir.
7. Release icin `DEPLOYMENT_MASTER.md` uygulanir.

## Degistirme Kurali

- Bu dokumanlar koddan kopuk kalmayacak.
- Yeni tablo, endpoint, ekran, AI promptu veya is kurali eklenirse ilgili master dosya guncellenecek.
- Eski tablolar silinmeyecek.
- Duplicate endpoint, duplicate component, duplicate tablo olusturulmayacak.

