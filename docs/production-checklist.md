# StepWise Plus Production Checklist

Bu dosya APK uretmeden once gercek altyapiya gecis sirasi icindir.

## 1. Supabase Projesi

1. Supabase projesi olustur.
2. Project URL ve anon key degerlerini al.
3. SQL Editor icinde `supabase/schema.sql` dosyasini calistir veya Supabase CLI ile `supabase db push` kullan.
4. Storage tarafinda `stepwise-media` bucket olustugunu kontrol et.
5. Bucket public olmamali. Dosyalar signed URL ile acilir.

## 2. Ortam Degiskenleri

Uygulama icin `.env.production`:

```env
VITE_APP_ENV=production
VITE_ENABLE_DEMO_ACCOUNTS=false
VITE_SUPABASE_URL=https://PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=SUPABASE_ANON_KEY
VITE_SUPABASE_MEDIA_BUCKET=stepwise-media
VITE_FCM_VAPID_KEY=FIREBASE_WEB_PUSH_VAPID_KEY
```

Supabase Edge Function secrets:

```powershell
supabase secrets set SUPABASE_URL="https://PROJECT_ID.supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="SERVICE_ROLE_KEY"
supabase secrets set FIREBASE_SERVICE_ACCOUNT_JSON="PASTE_FIREBASE_SERVICE_ACCOUNT_JSON"
```

`SERVICE_ROLE_KEY` ve `FIREBASE_SERVICE_ACCOUNT_JSON` asla APK icine konmaz.

## 3. Edge Function Deploy

Deploy sirasi:

```powershell
supabase functions deploy admin-create-user
supabase functions deploy coach-create-client
supabase functions deploy admin-import-workspace
supabase functions deploy notify-user
```

## 4. Firebase

1. Firebase projesi olustur.
2. Android app ekle.
3. Paket adi su an: `app.stepwise.plus`.
4. `google-services.json` dosyasini `android/app/google-services.json` konumuna koy.
5. Firebase Cloud Messaging etkin olsun.
6. Service account JSON degerini Supabase secret olarak ekle.

Google Play'e gecmeden once paket adinin Firebase ve Play Console'da ayni oldugu kontrol edilmeli.

## 5. Ilk Admin

Guvenli yol:

1. Supabase Auth icinde ilk kullaniciyi manuel olustur.
2. `profiles` kaydini admin yap.
3. Gerekirse SQL Editor icinde:

```sql
select public.admin_bootstrap('admin@example.com');
```

Bu fonksiyon public/anon/authenticated rollere kapali tutulur.

## 6. Veri Aktarimi

1. Test uygulamasindan admin panelde JSON yedek al.
2. Production modda admin hesabiyla gir.
3. Admin panelde yedekten yukle.
4. Bu islem `admin-import-workspace` fonksiyonunu cagirir.
5. Aktarim sonrasi kontrol:
   - Koclar
   - Danisanlar
   - Programlar
   - Program gorevleri
   - Randevular
   - Mesajlar
   - Vucut analizi
   - Gunluk gorev durumlari

## 7. Canli Test Sirasi

1. Admin girisi.
2. Admin koc kodu uretme.
3. Koc kaydi.
4. Koc referans kodu ile danisan kaydi.
5. Koc danisan ekleme.
6. Koc program ekleme.
7. Program atama.
8. Danisan gorev tamamlama.
9. Zorunlu fotograf yukleme.
10. Profil fotografi.
11. Urun videosu.
12. Mesaj metin/foto/ses.
13. Randevu talebi ve onay.
14. Push bildirimi.
15. Alarm kilit ekraninda.
16. Alarm uygulama kapaliyken.
17. Alarm cihaz yeniden baslayinca.

## 8. APK/AAB Oncesi

APK/AAB sadece su maddeler gecince alinacak:

- Supabase schema calisti.
- Edge Functions deploy edildi.
- Firebase `google-services.json` eklendi.
- Production env ile build gecti.
- Auth/kayit/yetki testleri tamamlandi.
- Storage upload testleri tamamlandi.
- Push testleri tamamlandi.
- Alarm cihaz testleri tamamlandi.
- Paket adi ve release imzasi kararlastirildi.

## 9. Google Play Hazirligi

- Release keystore.
- Signed AAB.
- Kalici package id.
- Privacy policy.
- Terms of use.
- Data deletion request metni veya sayfasi.
- Data Safety formu.
- Crash reporting.
- Version code/version name sistemi.
