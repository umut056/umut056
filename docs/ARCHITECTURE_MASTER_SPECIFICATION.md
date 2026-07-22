# StepWise Plus V2 - Architecture Master Specification

Bu dokuman StepWise Plus V2'nin uzun vadeli yazilim mimarisini tanimlar.

Amac; uygulama buyudukce modullerin birbirine dolanmasini engellemek, her ozelligi bagimsiz gelistirilebilir hale getirmek ve AI destekli wellness platformunu production seviyesinde olceklenebilir tutmaktir.

## 1. Domain Driven Design

StepWise Plus domain bazli gelistirilecektir. Her domain kendi is kurallarini, veri modellerini, servislerini, eventlerini ve UI ekranlarini mumkun oldugunca bagimsiz tasimalidir.

### Ana Domainler

| Domain | Sorumluluk |
| --- | --- |
| `Authentication` | Login, register, session, role restore, password, auth guard |
| `User` | Profil, ayarlar, avatar, cihaz, izinler |
| `Coach` | Koc profili, danisan yonetimi, koc dashboard |
| `Client` | Danisan profili, hedef, program durumu |
| `Weight` | Kilo girisi, kilo gecmisi, kilo hedefi |
| `Measurement` | Beden olculeri, vucut analizi |
| `Nutrition` | Ogun, kalori, makro, yemek fotografi |
| `Water` | Su hedefi ve su tuketimi |
| `Activity` | Egzersiz, yuruyus, aktivite hedefi |
| `Tasks` | Gunluk gorevler, kanit, alarm, erteleme |
| `Programs` | Program katalogu, program editoru, atama |
| `Products` | Urun katalogu, kullanim, stok, marka pluginleri |
| `Reports` | Koc, danisan ve admin raporlari |
| `AI` | AI coach, AI vision, AI nutrition, AI reports |
| `Payments` | Premium, subscription, odeme, entitlement |
| `Notifications` | Push, in-app, local alarm, reminder |
| `Messaging` | Koc-danisan mesajlasma, medya mesajlari |
| `Calendar` | Randevu, takvim, slot, hatirlatma |
| `Community` | Gruplar, challenge, leaderboard |
| `Admin` | Kullanici yonetimi, guvenlik, audit, sistem ayarlari |

### Domain Katmanlari

Her domain su katmanlari kullanir:

```text
domain/
  model
  rules
  services
  repository
  selectors
  events
  ui
  tests
```

Kurallar:

- Domain baska domainin ic state'ine dogrudan erismez.
- Domainler event bus ve public service contract uzerinden haberlesir.
- UI is kurali icermez.
- Repository veri kaynagini soyutlar.
- Selector UI icin hesaplanmis veri uretir.

## 2. Design Token Sistemi

Kod icinde dogrudan renk, spacing, radius, shadow, typography ve animation degeri yazilmayacaktir.

### Token Gruplari

- `color`
- `spacing`
- `radius`
- `shadow`
- `typography`
- `motion`
- `zIndex`
- `breakpoint`
- `opacity`
- `size`

### Ornek Token Isimleri

```js
tokens.color.primary
tokens.color.secondary
tokens.color.surface
tokens.color.background
tokens.color.error
tokens.color.success
tokens.spacing.md
tokens.radius.lg
tokens.shadow.card
tokens.typography.screenTitle
tokens.motion.fast
```

Kurallar:

- `green500`, `red400` gibi ham renk isimleri UI icinde kullanilmaz.
- Component "renk" degil "anlam" kullanir: `success`, `error`, `warning`, `primary`.
- Tenant branding token override ile yapilir.

## 3. Feature Toggle Engine

Ozellikler kod degistirmeden acilip kapatilabilir olmalidir.

### Feature Flag Tipleri

- `global`
- `tenant`
- `role`
- `user`
- `beta`
- `premium`
- `hidden`
- `experiment`

### Ornek Flags

```text
ai.coach.enabled
ai.vision.enabled
premium.enabled
video.productUsage.enabled
community.enabled
marketplace.enabled
coach.dashboard.v2
reports.ai.enabled
```

### Degerlendirme Sirasi

1. System kill switch
2. Tenant override
3. Role permission
4. Premium entitlement
5. Beta membership
6. Experiment assignment
7. Default value

Feature flag sonucu her zaman auditlenebilir olmalidir.

## 4. Remote Config

Remote config uygulamayi guncellemeden davranis degistirmek icin kullanilir.

### Kapsam

- Banner metni
- Kampanya metni
- Bakim modu
- AI kill switch
- Minimum app version
- Force update
- Onboarding icerigi
- Support linkleri
- Urun katalog gorunurlugu
- Rollout yuzdesi

### Kurallar

- Remote config cache'lenir.
- Son bilinen gecerli config offline modda kullanilir.
- Kritik config degisiklikleri auditlenir.
- Remote config business logic'in yerine gecmez; sadece davranis parametresi saglar.

## 5. Modular Plugin System

Urun sistemi markaya bagimli olmayacaktir. Herbalife sadece bir plugin olmalidir.

### Plugin Ornekleri

- `herbalife`
- `fitline`
- `usana`
- `amway`
- `genericWellness`

### Plugin Saglayabilecekleri

- Urun katalogu
- Urun olcu birimleri
- Program sablonlari
- Egitim icerikleri
- Urun kullanim kurallari
- AI prompt context bilgileri
- Marka token override'lari

### Product Plugin Contract

```ts
type ProductPlugin = {
  key: string;
  version: string;
  products: ProductDefinition[];
  programTemplates: ProgramTemplate[];
  usageRules: ProductUsageRule[];
  educationContent: EducationItem[];
  promptContext?: PromptContext;
};
```

Kurallar:

- Core uygulama marka ismi bilmez.
- Plugin kapaliysa o markaya ait urunler UI'da gorunmez.
- Plugin migration'i geriye uyumlu olmalidir.

## 6. AI Orchestration

AI modulleri tek tek componentlerden cagrilmayacaktir. Tum AI isleri AI Orchestrator tarafindan yonetilecektir.

### AI Orchestrator Sorumluluklari

- Hangi AI modulunun calisacagini secmek
- Dogru prompt versiyonunu secmek
- Kullanici context'ini toplamak
- Safety/risk kontrolu yapmak
- Cost ve rate limit uygulamak
- AI sonucunu event olarak yaymak
- AI output'unu auditlenebilir hale getirmek

### AI Modulleri

- AI Coach
- AI Vision
- AI Nutrition
- AI Progress
- AI Reports
- AI Motivation
- AI Reminder
- AI Risk Detection
- Coach Intelligence

Kurallar:

- Prompt component icinde yazilmaz.
- AI medical diagnosis uretmez.
- AI output her zaman kaynak context ve prompt versiyonu ile loglanir.

## 7. Workflow Engine

Karmasik kullanici akislarinda if/else zinciri buyutulmeyecektir. Workflow engine kullanilacaktir.

### Ornek Workflow

```text
UserRegistered
  -> ProfileCompleted
  -> FirstWeightAdded
  -> FirstProgramAssigned
  -> FirstTaskCompleted
  -> FirstReportGenerated
```

### Workflow Step Yapisi

- step key
- required event
- optional condition
- timeout
- retry policy
- notification action
- next step

### Kapsam

- Onboarding
- Program baslatma
- Gunluk rutin
- Randevu talep/onay
- Premium payment lifecycle
- AI report creation

## 8. Rule Engine

Kurallar UI veya component icinde hard-code edilmeyecektir.

### Ornek Kurallar

```text
BMI > 35 -> AI daha dikkatli ve tibbi yonlendirmeli konusur.
30 gun giris yapmadi -> reminder olustur.
5 kg verdi -> badge ve kutlama olustur.
3 gun gorev yapmadi -> risk seviyesi artar.
Program bitisine 3 gun kaldi -> koca haber ver.
```

### Rule Modeli

```json
{
  "key": "client.inactive_14_days",
  "version": 1,
  "when": "last_login_days >= 14",
  "then": ["create_risk", "notify_coach"],
  "severity": "medium"
}
```

Kurallar versiyonlanir ve aktif/pasif hale getirilebilir.

## 9. Formula Engine

Wellness hesaplamalari tek bir formula engine altinda toplanir.

### Formuller

- BMI
- BMR
- TDEE
- Protein hedefi
- Su hedefi
- Kalori hedefi
- Makro dagilimi
- Hedef tarihi
- Tahmini yag orani
- Tahmini fazla kilo
- Health Score

### Formula Metadata

- formula key
- version
- input schema
- output schema
- unit
- source
- safety note

UI sadece formula engine sonucunu gosterir.

## 10. Recommendation Engine

AI olmasa bile calisacak oneriler gerekir.

### Ornek Oneriler

- Bugun su hedefin dusuk kaldi.
- Shake saatini kacirdin.
- Bugun kisa yuruyus onerilir.
- Protein dusuk kaldi.
- Tartim fotografi henuz yok.

Recommendation Engine rule engine, formula engine ve event bus verilerini kullanir.

## 11. Audit System

Kim, ne zaman, neyi degistirdi kayit altina alinacaktir.

### Audit Kapsami

- Kullanici olusturma
- Profil degisikligi
- Program ekleme, silme, duzenleme
- Program atama
- Kilo/olcum degisikligi
- Fotograf onayi
- Kullanici yasaklama
- Admin ayarlari
- Payment/subscription degisikligi
- Feature flag degisikligi

### Audit Alanlari

- actor user id
- action
- target type
- target id
- old value
- new value
- tenant id
- ip/device
- timestamp
- reason

Audit log silinmez; gerekirse maskelenir.

## 12. Versioning

Sistemde degisen her kritik katman versiyonlanir.

### Version Tipleri

- API version
- Database migration version
- Prompt version
- Feature version
- Program template version
- Formula version
- Plugin version
- App version

Kurallar:

- Breaking change yeni version ister.
- Eski program atamalari yeni program sablonuyla bozulmaz.
- AI prompt degisikligi prompt usage log'unda gorunur.

## 13. Health Score

Health Score StepWise Plus'in ana wellness metriği olacaktir.

### Kaynaklar

- Kilo trendi
- Gorev uyumu
- Su tuketimi
- Beslenme kalitesi
- Urun kullanim duzeni
- Aktivite
- Uyku
- Koc ile etkilesim
- Streak

### Skor

Health Score 0-100 arasindadir.

| Alan | Agirlik |
| --- | --- |
| Gorev uyumu | 25 |
| Kilo/olcum trendi | 20 |
| Beslenme | 15 |
| Su | 10 |
| Aktivite | 10 |
| Urun kullanim | 10 |
| Koc etkilesimi | 5 |
| Streak | 5 |

Agirliklar tenant veya program tipine gore override edilebilir.

## 14. Success Prediction

AI ve analitik kullanilarak kullanicinin hedefe ulasma olasiligi hesaplanir.

### Inputlar

- Ilk 7 gun uyum
- Gorev tamamlama trendi
- Kilo trendi
- Program tipi
- Mesaj etkilesimi
- Randevu katilimi
- Urun kullanim duzeni
- Giris sikligi

### Output

- Basari olasiligi
- Risk faktorleri
- Koc icin aksiyon onerisi
- Danisan icin motivasyon mesaji

Bu skor kesin yargi degildir; karar destek verisidir.

## 15. Risk Detection

Risk Detection danisanin birakma, motivasyon dususu veya takipten kopma riskini tespit eder.

### Risk Sinyalleri

- 14 gun giris yok
- 3 gun gorev yok
- Kilo girisi yok
- Mesajlar okunmuyor
- Kanit fotografi yok
- Randevu kacirildi
- Ani kilo degisimi

### Risk Seviyeleri

- Low
- Medium
- High
- Critical

Risk event'i coach dashboard ve notification engine tarafindan dinlenir.

## 16. Coach Intelligence

Coach Intelligence koca aksiyon alinabilir bilgi verir.

### Ornek Insightlar

- "Ali'nin motivasyonu dusuyor."
- "Ayse urunlerini duzenli kullanmiyor."
- "Mehmet 2 haftadir kilo girmedi."
- "Bu hafta en iyi ilerleyen danisan Elif."

### Kaynak Eventler

- `TaskMissed`
- `WeightNotEntered`
- `MessageUnread`
- `PhotoApproved`
- `MilestoneReached`
- `ProgramCompleted`

## 17. Digital Twin

Her kullanici icin zamanla ogrenilen AI destekli davranis profili olusur.

### Digital Twin Verileri

- Hedef tercihleri
- Motivasyon dili
- Basari paternleri
- Zorlandigi saatler
- Gorev tamamlama aliskanligi
- Urun kullanim davranisi
- Koc ile iletisim stili
- Risk gecmisi
- Health Score trendi

### Guvenlik

- Kullanici verisi silinebilir olmalidir.
- Digital Twin tibbi tani icin kullanilmaz.
- Tenant ve coach yetki sinirlari korunur.

## 18. AI Prompt Versioning

Tum promptlar merkezi ve versiyonlu saklanir.

### Prompt Metadata

- key
- version
- module
- locale
- persona
- input_schema
- output_schema
- safety_rules
- created_by
- active

### Prompt Kullanim Logu

AI response her zaman:

- prompt key
- prompt version
- model
- input tokens
- output tokens
- safety result

kaydeder.

## 19. Experiment Engine

A/B test ve kontrollu rollout icin Experiment Engine gerekir.

### Experiment Tipleri

- Dashboard A/B
- Motivasyon mesaj dili
- Gorev karti duzeni
- Onboarding akisi
- Reminder timing
- AI insight formati

### Kurallar

- Deneyler feature flag ile baglidir.
- Kullanici deney grubu sabit kalir.
- Sensitive saglik sonuclari riskli experiment konusu yapilmaz.
- Basari metrigi onceden tanimlanir.

## 20. Event Bus

Event Bus tum modullerin dogrudan birbirine baglanmasini engeller.

### Event Bus Ilkeleri

- Modul baska modulu dogrudan cagirmaz.
- Modul event yayinlar.
- Dinleyici kendi isini yapar.
- Eventler idempotent islenir.
- Retry ve dead-letter queue desteklenir.

### Event Bus Kullanim Ornegi

```text
WeightAdded
  -> HealthScoreUpdated
  -> SuccessPredictionUpdated
  -> RiskScoreUpdated
  -> CoachInsightCreated
  -> MilestoneChecked
  -> ReportSnapshotUpdated
```

### Event Bus Katmanlari

- Client local event bus
- Supabase `domain_events`
- Edge Function event handlers
- Scheduler jobs
- Analytics pipeline

## Mimari Kabul Kriterleri

- Yeni domain, public contract olmadan baska domain state'ine erismez.
- Her kritik aksiyon event uretir.
- Formula UI icinde yazilmaz.
- AI prompt component icine yazilmaz.
- Feature flag olmadan beta, premium veya AI modulu acilmaz.
- Plugin sistemi olmadan marka bagimli urun mantigi kodun cekirdegine gomulmez.
- Workflow ve rule engine'e girecek isler hard-coded if/else olarak buyutulmez.
- Audit gerektiren islem log uretmeden tamamlanmis sayilmaz.
