# StepWise Plus V2 - UI/UX Master Specification

Bu dokuman StepWise Plus V2 icin tum ekranlarin, componentlerin ve UX durumlarinin ana tasarim sozlesmesidir.

## 1. Tasarim Kimligi

StepWise Plus premium, sade, saglik odakli ve guven veren bir wellness platformudur.

Referans kalite:

- Apple Health
- Oura
- Whoop
- Linear
- Notion
- Stripe Dashboard

Ana karakter:

- Temiz
- Havadar
- Modern
- Okunakli
- Dokunmasi kolay
- Fazla suslu olmayan premium

## 2. Design Tokens

| Token | Deger |
| --- | --- |
| `color.primary` | `#3A7D44` |
| `color.secondary` | `#7BC47F` |
| `color.background` | `#F7F8F6` |
| `color.surface` | `#FFFFFF` |
| `color.text.primary` | `#0F241B` |
| `color.text.secondary` | `#6B7C73` |
| `color.error` | `#D94A3A` |
| `color.warning` | `#E6A51D` |
| `color.success` | `#21A36B` |
| `radius.card` | `20px` |
| `radius.input` | `18px` |
| `radius.button` | `18px` |
| `spacing.base` | `4px` |

## 3. Component Library

Standart componentler:

- `AppScreen`
- `AppCard`
- `AppInput`
- `PrimaryButton`
- `SecondaryButton`
- `GhostButton`
- `IconButton`
- `AppAvatar`
- `ProgressCard`
- `WeightCard`
- `MetricCard`
- `DailyTaskCard`
- `ProgramCard`
- `MessageBubble`
- `NotificationCard`
- `AIInsightCard`
- `ChartCard`
- `BottomSheet`
- `AppModal`
- `EmptyState`
- `ErrorState`
- `LoadingState`
- `Skeleton`

Kurallar:

- Ayni is icin ikinci component olusturulmaz.
- Mevcut component genisletilebilir ise yeni component yazilmaz.
- Native `alert` ve `confirm` yerine `AppModal` kullanilir.
- Formlar `AppInput` ve ortak validation dili kullanir.

## 4. Icon System

- Stil: rounded outline.
- Aktif durum: primary yesil.
- Pasif durum: muted gray-green.
- Kritik durum: error/warning token.
- Icon-only button mutlaka accessibility label alir.

## 5. Animation System

Animasyon sade ve kisa olur.

| Alan | Standart |
| --- | --- |
| Page transition | 160-220ms fade/slide |
| Modal open | 180ms scale + fade |
| Bottom sheet | 220ms vertical slide |
| Button tap | 96ms press scale |
| Chart update | 300ms smooth |
| Task complete | 240ms success pulse |
| Splash | Logo motion, 1200-1800ms max |

## 6. Empty States

Her liste bosken kullanici ne yapacagini anlamali.

| Ekran | Empty State |
| --- | --- |
| Danisanlar | "Henuz danisan eklenmedi" + Ekle CTA |
| Programlar | "Kayitli program yok" + Program ekle CTA |
| Mesajlar | "Henuz mesaj yok" |
| Takvim | "Randevu yok" |
| Raporlar | "Rapor olusturmak icin veri gerekli" |
| Fotograflar | "Ilk ilerleme fotografini ekle" |

## 7. Error States

| Durum | Davranis |
| --- | --- |
| Internet yok | Offline banner, tekrar dene |
| Yetki yok | Rol uyari ekrani |
| Sunucu hatasi | Kisa mesaj + retry |
| Medya yuklenemedi | Dosya boyutu/tur uyari |
| Form hatasi | Alan altinda net aciklama |

## 8. Loading States

- Dashboard: skeleton cards.
- Liste: 3-5 skeleton row.
- Medya: blur placeholder.
- AI: streaming/loading indicator.
- Rapor: progress + kisa bilgi.

## 9. Ana Ekran Listesi

### Auth

- Splash
- Login
- Register role selection
- Coach register
- Client register
- Forgot password
- Consent/privacy

### Client

- Client summary
- Daily tasks
- Task detail/proof
- Progress
- Weight
- Measurements
- Photos
- Nutrition
- Water
- Activity
- Coach messages
- Calendar
- Profile
- Settings

### Coach

- Coach summary
- Clients
- Client detail
- Program library
- Program editor
- Program assignment
- Proof approvals
- Messages
- Calendar
- Reports
- Coach profile
- Coach settings

### Admin

- Admin summary
- Users
- Coaches
- Clients
- Codes
- Programs
- Audit logs
- System settings
- Analytics

### AI and Premium

- AI coach
- AI nutrition
- AI progress report
- AI vision review
- Premium plans
- Subscription status
- Payment result

## 10. Responsive Kurallar

- Mobile ilk oncelik.
- Kucuk Android ekranlarda yatay scroll olmayacak.
- Bottom nav her zaman ulasilabilir olacak.
- Kritik form aksiyonu tek elle kullanilabilir olacak.
- 360px genislikte metin tasmasi olmayacak.

## 11. Kabul Kriterleri

- Yeni ekran mevcut tema ile uyumlu.
- Ayni button/card/input farkli gorunmez.
- Loading, empty, error durumu var.
- Kucuk ekranda yatay scroll yok.
- Touch target en az 44px.
- Ana aksiyon net.

