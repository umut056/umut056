# StepWise Plus V2

StepWise Plus V2, mevcut calisan StepWise Plus uygulamasinin uzerine gelistirilen AI destekli wellness platformudur.

Bu repository sifirdan yazilmayacak. Calisan ozellikler korunacak, tekrar eden kodlar azaltilacak ve yeni moduller mevcut mimariye uyumlu sekilde eklenecektir.

## Gelistirme Kurallari

- Mevcut component varsa once o kullanilir.
- Mevcut service varsa once o genisletilir.
- Ayni isi yapan ikinci component, service, provider, route veya database tablosu olusturulmaz.
- Her degisiklikten sonra build calismalidir.
- Eski ekranlar silinmez; refactor kademeli yapilir.
- Proje yonetisim, kalite ve autonomous development kurallari `PROJECT_GOVERNANCE.md` dosyasinda takip edilir.

## Komutlar

```bash
npm run build
npm run doctor:production
```

## Master Specifications

- `PROJECT_GOVERNANCE.md`: Proje yonetisim, kalite ve autonomous development kurallari.
- `docs/DATABASE_MASTER_SCHEMA.md`: Uzun vadeli veritabani domainleri, tablo katalogu, iliskiler ve migration sirasi.
- `docs/DESIGN_SYSTEM_MASTER_SPECIFICATION.md`: UI dili, component library, ikon, animasyon, loading, empty ve error state standardi.
- `docs/PLATFORM_SYSTEMS_MASTER_SPECIFICATION.md`: Offline, sync, cache, storage, search, notification, permission, multi-tenant ve event-driven mimari.
- `docs/PRODUCT_MODULES_MASTER_SPECIFICATION.md`: AI memory/persona, gamification, community, education, CRM ve marketplace modulleri.
- `docs/ARCHITECTURE_MASTER_SPECIFICATION.md`: DDD, design token, feature toggle, remote config, plugin, AI orchestration, workflow, rule, formula, recommendation, audit, versioning ve event bus mimarisi.
- `docs/PRODUCT_DELIVERY_MASTER_SPECIFICATION.md`: User story, acceptance criteria, Definition of Done, backlog, release plan, QA, KVKK/GDPR ve operasyon standartlari.
- `docs/DATABASE_SCHEMA.sql`: Mevcut Supabase cekirdegini bozmadan V2 hedef database sozlesmesi.
- `docs/OPENAPI.yaml`: Edge Function ve Supabase REST tabanli API sozlesmesi.
- `docs/FIGMA_DESIGN_SPEC.md`: Figma handoff, frame, token ve component tasarim sozlesmesi.
- `docs/AI_PROMPTS.md`: Merkezi AI prompt library, persona, safety ve output schema sozlesmesi.
- `docs/NOTIFICATION_SCENARIOS.md`: Local alarm, push, in-app ve mesaj bildirim senaryolari.
- `docs/BUSINESS_RULES.md`: Authentication, role, program, task, messaging, calendar, admin ve AI is kurallari.
- `docs/FORMULA_ENGINE.md`: BMI, kilo degisimi, milestone, su, protein ve health score hesaplama sozlesmesi.
- `docs/REPORT_TEMPLATES.md`: Danisan, koc, admin, AI rapor ve export sablonlari.

## Mevcut Durum

Ilk V2 refactor adimlari olarak tema tokenlari, primitive UI componentleri, form/input ve button style helperlari, saf helper fonksiyonlari, medya servisleri, mesaj kaydi/listeleme/medya draft/okundu senkron servisleri, calendar/randevu servisleri, reports selectorlari, temel auth/session/register servisleri, workspace sync servisi, dashboard selectorlari, profil patch servisi, kilo takip servisi, vucut olcumu servisi, progress photo servisi, daily task servisi, task alarm servisi, notification servisi, program servisi ve client servisi ortak/feature klasorlerine tasindi. Bu, ileride ortak UI component sistemine ve feature bazli modullere gecis icin temel hazirliktir.
