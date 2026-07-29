# Wellness Dashboard Foundation T29

## Amaç

StepWise Plus V2 vizyonuna geçiş için mevcut ekranları silmeden wellness merkezli dashboard temeli eklendi.

## Kapsam

- Danışan ana ekranında health score, AI koç önizleme, modül skorları ve aksiyon kartları gösterilir.
- Koç ana ekranında coach command center, wellness skoru, risk/onay/danışan odağı ve AI takip özeti gösterilir.
- Danışan ilerleme ekranı kilo, ölçüm, su, beslenme ve aktivite kayıtlarını tek wellness merkezi altında toplar.
- Wellness servisleri mevcut `weight` ve `measurement` servislerini genişletir; aynı işi yapan ikinci kayıt motoru oluşturmaz.

## Veri Modeli

Yeni cihaz içi alan:

- `user.wellnessLogs[date].waterMl`
- `user.wellnessLogs[date].activityMinutes`
- `user.wellnessLogs[date].nutrition`
- `user.measurementLogs`

Bu alanlar eski `body`, `weightLogs`, `dailyTasks` ve program görevleriyle geriye uyumlu çalışır.

## Test

- Wellness kayıt servisleri immutability, kilo/ölçüm güncelleme ve health score hesaplamasını kapsar.
- Dashboard selector testleri danışan ve koç V2 snapshot çıktısını doğrular.

## Risk

AI henüz gerçek OpenAI çağrısı yapmaz; bu adım veri ve UI hazırlığıdır. AI entegrasyonu sonraki sprintlerde merkezi servis ve prompt versiyonlama ile bağlanmalıdır.
