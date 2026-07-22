# StepWise Plus V2 - Testing Guide

Bu dosya projede eklenen ilk otomatik test kapisini aciklar.

## Komutlar

Tum unit ve smoke testleri:

```bash
npm test
```

Sadece kritik smoke akis:

```bash
npm run smoke
```

Lint kontrolu:

```bash
npm run lint
```

Production build:

```bash
npm run build
```

Production baglanti/guvenlik temel kontrolu:

```bash
npm run doctor:production
```

## Su Anda Kapsanan Alanlar

- Program listesi tekillestirme
- Program atama modeli
- 3 gun atomlu / 2 gun atomsuz gorev dongusu normalizasyonu
- Program videosunun atamaya eklenmesi
- Gunluk gorev state olusturma
- Yeni gunde gorev state sifirlama
- Gunluk compliance ve bekleyen gorev hesaplama
- Koc-danisan mesaj filtresi
- Grup/oda mesaj siralama
- Mesaj onizleme metni
- Koc dashboard ozet hesaplama
- Danisan dashboard ilerleme hesaplama
- Kritik mini smoke flow: program ata, gorev state uret, dashboard guncelle, mesajlari filtrele

## Sonraki Test Oncelikleri

1. Login role smoke testleri.
2. Program atama cloud/local senkron testi.
3. Mesajlasma karsilikli kalicilik testi.
4. Rapor ve profil beyaz ekran regression testi.
5. Android alarm logout/tamamlandi/offline testi.
6. Supabase RLS ve Storage yetki testleri.

## Not

Bu ilk paket bilerek servis ve selector seviyesinde baslatildi. Amac calisan ekrani bozmadan hizli ve guvenilir bir test zemini kurmaktir. React ekran testleri `App.jsx` parcala-refactor ilerledikce daha saglikli eklenecektir.

