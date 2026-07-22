# StepWise Plus V2 - Deployment Master

Bu dokuman StepWise Plus V2 deployment, release, rollback ve operasyon planidir.

## 1. Ortamlar

| Ortam | Amac |
| --- | --- |
| Local | Gelistirme |
| Preview | Web/Android test build |
| Staging | Supabase staging, kapali test |
| Production | Gercek kullanici |

## 2. Environment Variables

Client tarafina girebilecekler:

- Supabase URL
- Supabase anon key
- Public storage bucket name
- Firebase public config

Client tarafina girmeyecekler:

- Supabase service role key
- Firebase service account private key
- OpenAI API key
- Payment provider secret

## 3. Supabase Deployment

Sira:

1. Migration review.
2. Backup al.
3. Migration staging'e uygula.
4. RLS testleri calistir.
5. Edge Function deploy.
6. Smoke test.
7. Production migration.
8. Production smoke test.

## 4. Android Release

Sira:

1. `npm run build`
2. `npm run doctor:production`
3. `npm run android:sync`
4. Release APK build
5. Release AAB build
6. APK smoke test
7. AAB internal test upload
8. Closed testing
9. Open testing
10. Production rollout

## 5. Rollback

Rollback plani olmadan release yapilmaz.

- Web build rollback.
- Android onceki surum rollout.
- Supabase migration rollback veya forward-fix.
- Edge Function onceki version deploy.
- Storage policy rollback.

## 6. Monitoring

Production ortaminda takip edilecekler:

- Crash rate
- Login failure
- Message send failure
- Media upload failure
- Alarm delivery issue
- Edge Function error
- Supabase slow query
- Storage bandwidth
- Push notification delivery

## 7. Backup

- Database otomatik backup aktif.
- Storage backup stratejisi var.
- Restore testi ayda en az bir kez yapilir.
- Kritik migration oncesi manuel backup alinir.

## 8. Release Gates

Public release oncesi:

- Build pass.
- Production doctor pass.
- Smoke test pass.
- RLS test pass.
- Legal docs ready.
- Privacy Policy live.
- Terms live.
- Crash reporting active.
- Analytics active.
- Go-live checklist complete.

## 9. Incident Plan

Kritik hata durumunda:

1. Release durdur.
2. Etkilenen modul belirle.
3. Kullanici etkisini olc.
4. Rollback veya hotfix karari ver.
5. Audit log ve server log incele.
6. Kullanici iletisim metni hazirla.
7. Postmortem yaz.

