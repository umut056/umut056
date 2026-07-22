# StepWise Plus V2 - Test Master

Bu dokuman StepWise Plus V2 test stratejisidir.

## 1. Test Seviyeleri

| Seviye | Amac |
| --- | --- |
| Unit | Helper, selector, service fonksiyonlarini test eder |
| Component | UI component davranisini test eder |
| Integration | Feature + repository + state akisini test eder |
| E2E/Smoke | Kritik kullanici akisini test eder |
| Native Android | Alarm, camera, microphone, notification test eder |
| Security | RLS, rol, storage, secret test eder |
| Release | APK/AAB ve store oncesi dogrulama |

## 2. Minimum Smoke Akislari

1. Admin login.
2. Coach login.
3. Client login.
4. Coach client ekler.
5. Coach program ekler.
6. Coach program atar.
7. Client gorevleri gorur.
8. Client kamera ile kanit fotografi ekler.
9. Coach ozet ekraninda onay bildirimi gorur.
10. Coach kaniti onaylar.
11. Client ve coach mesajlasir.
12. Mesaj bildiriminde gonderen belli olur.
13. Client profil acilir.
14. Coach rapor acilir.
15. Alarm offline durumda calisir.

## 3. Regression Alanlari

- Login ve kayit
- Program assignment
- Daily task reset
- Proof photo save/open
- Coach approval
- Messaging
- Profile photo
- Product video
- Reports
- Alarm repeat/cancel
- Offline/cache

## 4. White Screen Guard

Su ekranlar build sonrasi smoke testten gecmelidir:

- Admin panel
- Coach summary
- Coach clients
- Coach reports
- Coach profile
- Client summary
- Client tasks
- Client progress
- Client profile
- Messages
- Calendar

## 5. Performance Testleri

- 1 coach + 100 clients
- 1 client + 90 gun task log
- 1 conversation + 1000 message
- 100 proof photo metadata
- 50 program
- 12 aylik rapor datasi

## 6. Security Testleri

- Client baska client verisini okuyamaz.
- Coach baska coach danisanini okuyamaz.
- Admin olmayan admin endpoint kullanamaz.
- Storage signed URL baska kullaniciya acilmaz.
- Service role client bundle icinde yoktur.

## 7. Definition of Done

Her task tamamlanmis sayilmaz, ta ki:

- Build gecene kadar.
- Lint/test gecene kadar.
- Kritik smoke akisi etkilenmedigi dogrulanana kadar.
- Dokumantasyon guncellenene kadar.
- Ekran kucuk cihazda kontrol edilene kadar.

