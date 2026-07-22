# StepWise Plus V2 - Design System Master Specification

Bu doküman StepWise Plus V2'nin görsel dili, component standardı, ikon sistemi, animasyon sistemi ve tüm UI state kurallarını tanımlar.

Amaç her ekranda aynı kaliteyi, aynı hissi ve aynı davranışı sağlamaktır.

## Design Direction

StepWise Plus V2 tasarım dili şu ürünlerin birleşimi gibi hissettirmelidir:

- Apple Health: sade sağlık verisi sunumu
- Whoop: performans, skor ve ritim hissi
- Oura: premium wellness sakinliği
- Linear: net hiyerarşi, hızlı kullanım
- Notion: okunabilirlik ve düzen
- Stripe Dashboard: güven veren operasyon paneli

## Design Principles

- Minimal ama boş değil.
- Premium ama ağır değil.
- Modern ama oyuncak gibi değil.
- Hızlı, okunabilir, erişilebilir.
- Kartlar bilgi taşır; süs amaçlı kart kullanılmaz.
- Her ekranın birincil işi ilk bakışta anlaşılır.
- Fazla yeşil kullanılmaz; yeşil vurgu ve marka rengi olarak kalır.

## Color Tokens

| Token | Değer | Kullanım |
| --- | --- | --- |
| `color.primary` | `#3A7D44` | Ana marka, primary button, aktif tab |
| `color.primaryStrong` | `#0B3D2B` | Hero card, koyu başlık alanı |
| `color.secondary` | `#7BC47F` | Başarı, vurgu, progress |
| `color.accentLime` | `#A7F432` | Küçük highlight, badge, streak |
| `color.background` | `#F7F8F6` | Ana sayfa zemini |
| `color.surface` | `#FFFFFF` | Kart ve modal |
| `color.surfaceSoft` | `#EEF8F1` | Pasif input, soft chip |
| `color.text` | `#10231C` | Ana metin |
| `color.textMuted` | `#6E8177` | Yardımcı metin |
| `color.border` | `#D7E9DE` | Input/card çizgisi |
| `color.warning` | `#E6A21A` | Uyarı |
| `color.danger` | `#D94F3D` | Hata, yasak, risk |
| `color.info` | `#3A82D7` | Bilgi |
| `color.gold` | `#F6C84C` | Başarı/kupa |

## Typography

Ana font: Plus Jakarta Sans.

| Stil | Boyut | Weight | Kullanım |
| --- | --- | --- | --- |
| `display` | 36-44 | 900 | Giriş/hero başlığı |
| `screenTitle` | 26-32 | 900 | Ekran ana başlığı |
| `sectionTitle` | 18-22 | 850 | Bölüm başlığı |
| `cardTitle` | 15-18 | 800 | Kart başlığı |
| `body` | 14-16 | 500 | Normal metin |
| `bodySmall` | 12-13 | 500 | Yardımcı açıklama |
| `label` | 11-12 | 800 | Input etiketi, küçük başlık |
| `metric` | 32-56 | 900 | Büyük skor/kilo/uyum |

Kurallar:

- Letter spacing negatif olmayacak.
- Buton içinde metin taşmayacak.
- Küçük ekranlarda hero boyutları kart içine taşmayacak.
- Metric metinleri sadece metric kartlarında kullanılacak.

## Spacing System

4 tabanlı spacing sistemi:

| Token | Değer |
| --- | --- |
| `space.1` | 4 |
| `space.2` | 8 |
| `space.3` | 12 |
| `space.4` | 16 |
| `space.5` | 20 |
| `space.6` | 24 |
| `space.8` | 32 |
| `space.10` | 40 |

Mobil ekranlarda standart page padding: `16px - 20px`.

Kart iç padding:

- Küçük kart: `12px`
- Normal kart: `16px`
- Büyük dashboard kartı: `20px`

## Radius System

| Token | Değer | Kullanım |
| --- | --- | --- |
| `radius.sm` | 10 | Chip, küçük button |
| `radius.md` | 14 | Input, compact card |
| `radius.lg` | 20 | Ana kart |
| `radius.xl` | 24 | Modal, büyük card |
| `radius.full` | 999 | Avatar, pill |

## Shadow System

| Token | Kullanım |
| --- | --- |
| `shadow.none` | Flat alanlar |
| `shadow.sm` | Input focus, küçük button |
| `shadow.md` | Normal kart |
| `shadow.lg` | Bottom sheet, modal |
| `shadow.glow` | Başarı ve milestone highlight |

Gölge çok koyu olmayacak. Premium görünüm için soft, diffuse shadow kullanılacak.

## Grid & Layout

Mobil:

- Tek kolon ana akış.
- Metric kartlarda 2 kolon.
- Dashboard quick action kartlarında 2 veya 3 kolon.
- Bottom navigation sabit, içerik onun altında kalmayacak.

Tablet/Web:

- Admin ve coach dashboard 12 kolon grid.
- Sidebar + content düzeni desteklenecek.
- Mobil layout büyütülerek kullanılmayacak; web için ayrı yoğunluk ayarı olacak.

## Component Library

Tüm ekranlar bu standart component ailesinden türetilecek.

### AppButton

Varyantlar:

- `primary`: ana aksiyon
- `secondary`: alternatif aksiyon
- `soft`: düşük öncelikli
- `danger`: yıkıcı aksiyon
- `ghost`: ikon veya hafif link aksiyonu

Primary button:

- Background: `color.primary`
- Text: white
- Radius: `radius.md` veya `radius.lg`
- Height: 48-56
- Font weight: 800
- Shadow: `shadow.sm`

Secondary button:

- Background: `surfaceSoft`
- Text: `primary`
- Border: `border`
- Shadow: none

Danger button:

- Background: `#FDE8E6`
- Text: `danger`
- Border: transparent veya danger soft

### AppCard

Standart:

- Background: white veya translucent white
- Radius: 20
- Border: soft white/border
- Shadow: soft
- İç padding: 16

Card tipleri:

- `metric`
- `action`
- `listItem`
- `media`
- `form`
- `warning`
- `success`

Kart içinde kart kullanılmayacak.

### AppInput

Standart:

- Height: 48-56
- Border: `color.border`
- Radius: 14
- Background: white
- Focus border: primary
- Error border: danger
- Label üstte.
- Yardımcı metin label altında değil input altında.

Input tipleri:

- Text
- Email
- Password
- Number
- Date
- Time
- Textarea
- Select
- Search

### AppAvatar

Boyutlar:

- `xs`: 28
- `sm`: 36
- `md`: 48
- `lg`: 64
- `xl`: 86

Kurallar:

- Profil ekranlarında `lg` veya `xl`.
- Dashboard header’da en az `lg`.
- Liste satırlarında `sm`/`md`.
- Foto yoksa baş harf avatarı.
- Danışan adları gizlenecek yerlerde maskeli gösterim kullanılabilir.

### MetricCard

Kullanım:

- Uyum
- Aktif danışan
- Riskli danışan
- Fotoğraf bekleyen
- Kilo değişimi

Kurallar:

- Başlık küçük.
- Değer büyük.
- Yardımcı metin kısa.
- Renk anlamlı olmalı.

### ProgressCard

Kullanım:

- Bugünkü ilerleme
- Program uyumu
- Seri/streak
- Kilo hedefi

İçerik:

- Başlık
- Büyük skor
- Sub metric
- Progress bar
- Zaman veya hedef metni

### WeightCard

Alanlar:

- Başlangıç
- Güncel
- Hedef
- Değişim

Küçük ekranlarda 2x2 grid.

### DailyTaskCard

Alanlar:

- Görev adı
- Saat
- Bölüm
- Ürün ölçü chipleri
- Durum
- Kamera/kanıt gerekiyorsa sadece görev tamamlanırken açılır.

Görev tamamlanınca danışan özetinde değil, görevler ekranındaki sıradan kalkar.

### AIInsightCard

Kullanım:

- AI öneri
- AI risk uyarısı
- AI motivasyon

Kurallar:

- AI içeriği kesin karar gibi sunulmaz.
- Koç onayı gereken öneriler etiketlenir.
- “AI notu” görsel dili insan notundan ayrılır.

### StatisticCard

Kullanım:

- Admin/coach dashboard küçük istatistikleri.

### ChartCard

Kullanım:

- Kilo trendi
- Uyum trendi
- Haftalık görev
- Aylık sıralama

Chart boşsa empty state gösterir.

### BottomSheet

Kurallar:

- Mobilde modal yerine ilk tercih.
- Max height: ekranın %88’i.
- Dikey scroll olabilir.
- Yatay scroll olmayacak.
- Kapatma butonu sağ üstte.
- Telefon geri tuşu kapatır.

### AppModal

Kullanım:

- Admin kritik onay
- Detay edit
- Media preview

Kurallar:

- Backdrop koyu ama aşırı opak değil.
- Close accessible olmalı.
- Escape/geri tuşu desteklenmeli.

### FAB

Kullanım:

- Yeni görev
- Yeni program
- Yeni danışan
- Ana aksiyon

Kurallar:

- Her ekranda tek FAB.
- Bottom nav ile çakışmaz.
- Uzun label sadece gerektiğinde.

### Navigation

Mobil:

- Bottom nav role bazlı.
- Aktif tab ikon + label net.
- Badge sadece okunmamış/aksiyon varsa görünür.

Web/tablet:

- Sidebar veya top nav.
- Admin panel yoğun dashboard düzeni.

## Icon System

Kısa vadede mevcut inline icon sistemi korunur.

V2 hedefi:

- Rounded outlined ikon dili.
- Stroke 1.6-2.0.
- Köşeler yumuşak.
- Lucide tarzı kullanılabilir.
- Platforma çok native his gerekiyorsa SF Symbols benzeri çizgi dili referans alınır.

Kurallar:

- Aynı anlam için tek ikon.
- Filled ikon sadece aktif tab veya başarı için.
- Kritik durumlarda ikon + metin birlikte kullanılmalı.

## Animation System

Animasyonlar minimal ve hızlı olmalı.

| Alan | Süre | Easing |
| --- | --- | --- |
| Page transition | 180-240ms | ease-out |
| Bottom sheet | 220-280ms | cubic |
| Modal fade | 140-180ms | ease |
| Button press | 80-120ms | ease |
| Progress bar | 350-600ms | ease-out |
| Chart enter | 400-700ms | stagger |
| Hero/splash | 900-1400ms | brand easing |

Kurallar:

- Hareket anlamlı olmalı.
- Loading animasyonu kullanıcıyı kandırmamalı.
- Aşırı bounce kullanılmaz.
- Reduced motion desteklenir.

## Loading States

Her data ekranında loading state tanımlıdır.

Tipler:

- Skeleton card
- Skeleton list
- Inline spinner
- Button loading
- Media placeholder
- Chart skeleton

Kurallar:

- Tam ekran spinner son çare.
- Dashboard önce skeleton gösterir.
- Butona basınca button loading olur, ekran kilitlenmez.

## Empty States

Her modülün boş hali olacak.

Örnekler:

- Danışan yok: “İlk danışanını ekle.”
- Program yok: “Kayıtlı program oluştur.”
- Mesaj yok: “Henüz mesaj yok.”
- Fotoğraf yok: “İlk gelişim fotoğrafını ekle.”
- Randevu yok: “Yeni randevu talep et.”
- AI raporu yok: “İlk rapor için veri birikiyor.”

Empty state içinde:

- İkon/illüstrasyon
- Kısa başlık
- 1 satır açıklama
- Uygunsa tek primary action

## Error States

Hata tipleri:

- İnternet yok
- Yetki yok
- Sunucu hatası
- Timeout
- Validation hatası
- Dosya yüklenemedi
- Kamera/mikrofon izni yok

Kurallar:

- Kullanıcıya teknik hata kodu direkt gösterilmez.
- Geliştirici için log tutulur.
- Retry aksiyonu varsa gösterilir.
- Yetki hatasında doğru role yönlendirme yapılır.

## Offline UI

Offline durumunda:

- Header veya küçük banner gösterilir.
- Görev tamamlama lokal kuyruğa alınır.
- Medya “yükleme bekliyor” etiketi alır.
- Mesaj yazılabilir ama “gönderilecek” durumunda kalır.
- Kilo/ölçüm kaydı lokal draft olur.

## Accessibility

- Touch target minimum 44px.
- Text contrast WCAG AA hedefler.
- Hata sadece renkle anlatılmaz.
- Tüm ikon butonlarda aria-label eşdeğeri olmalı.
- Form hata mesajları input ile ilişkili olmalı.
- Motion azaltma tercihine uyulur.

## Kabul Kriterleri

- Yeni ekranlar bu design system dışında özel button/input/card yazmaz.
- Primary, secondary, danger ve soft button varyantları tek component ailesinden gelir.
- Her data ekranında loading, empty ve error state vardır.
- Bottom sheet yatay scroll üretmez.
- Mobilde bottom nav ile içerik çakışmaz.
- İkon dili ekranlar arasında tutarlıdır.
- Animasyonlar performansı düşürmez.
