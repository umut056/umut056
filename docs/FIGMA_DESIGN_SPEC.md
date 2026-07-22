# StepWise Plus V2 - Figma Design Spec

Bu dokuman Figma veya herhangi bir tasarim aracina aktarilacak UI sozlesmesini tanimlar. Kod tarafinda mevcut tasarim korunur; yeni ekranlar bu standarda gore uretilir.

## 1. Tasarim Yonu

- Stil: Apple Health + Whoop + Oura + Linear + Notion + Stripe Dashboard karisimi.
- Dil: premium, sade, okunabilir, hizli, guven veren.
- Ana renk: `#3A7D44`
- Ikincil renk: `#7BC47F`
- Arka plan: `#F7F8F6`
- Kart radius: `20px`
- Animasyon: minimal Framer Motion prensibi.

## 2. Frame Sistemi

| Frame | Boyut | Not |
| --- | --- | --- |
| Mobile compact | 360 x 800 | Dusuk Android cihazlar |
| Mobile standard | 393 x 852 | Ana test boyutu |
| Mobile large | 430 x 932 | Buyuk ekran |
| Tablet | 768 x 1024 | Ileride dashboard |
| Desktop admin | 1440 x 900 | Admin ve rapor paneli |

## 3. Spacing

- 4px base grid.
- Screen horizontal padding: 24px mobile, 32px tablet.
- Card inner padding: 18px mobile, 24px desktop.
- Section gap: 20px.
- Compact form gap: 12px.

## 4. Renk Tokenlari

| Token | Deger | Kullanim |
| --- | --- | --- |
| `color.primary` | `#3A7D44` | Ana aksiyon, aktif nav |
| `color.secondary` | `#7BC47F` | Gradient ve pozitif vurgu |
| `color.background` | `#F7F8F6` | Genel zemin |
| `color.surface` | `#FFFFFF` | Kart |
| `color.textPrimary` | `#11251F` | Ana metin |
| `color.textSecondary` | `#65756D` | Yardimci metin |
| `color.success` | `#1F9D5A` | Basari |
| `color.warning` | `#E7A51A` | Uyari |
| `color.error` | `#D34A3F` | Hata |
| `color.info` | `#3578D4` | Bilgi |

## 5. Typography

- Font ailesi: Plus Jakarta Sans varsa kullanilir; yoksa Inter/system fallback.
- Screen title: 34/40, 800.
- Section title: 22/28, 800.
- Card title: 18/24, 800.
- Body: 15/22, 500.
- Caption: 12/16, 600.
- Button: 16/20, 800.

## 6. Component Spec

### Primary Button

- Height: 58px mobile.
- Radius: 18px.
- Background: primary to secondary gradient.
- Text: white, 800.
- Disabled: opacity 0.45, no shadow.
- Loading: centered spinner, text hidden.

### Secondary Button

- Height: 48px.
- Background: light mint surface.
- Text: primary.
- Border: 1px mint.

### App Card

- Radius: 20px.
- Background: surface.
- Shadow: soft green-tinted shadow.
- Border: optional 1px translucent mint.
- No nested decorative cards.

### App Input

- Height: 54px.
- Radius: 16px.
- Border: mint.
- Icon slot left/right.
- Error text below input.

### Bottom Sheet

- Opens from bottom.
- Radius top: 28px.
- Max height: 88vh.
- Horizontal scroll forbidden.
- Native back closes sheet first.

### Navigation

- Bottom nav fixed.
- Active item: green pill/soft highlight.
- Badge: red circle with count.
- Message badge must show count, not only a dot.

## 7. Screen Notes

### Login

- No scroll on first screen for 393x852 target.
- Logo block and form card must visually balance.
- Register link sits under primary button.
- Feature chips optional; remove if crowding.

### Client Summary

- Daily task list should not duplicate tasks tab.
- Weight cards compact.
- Celebration card visible when milestone exists.
- Coach note feature removed unless explicitly reintroduced.

### Coach Summary

- All non-message client notifications appear here.
- Proof approval disappears after approve/reject.
- Metrics are tappable and open filtered lists.

### Program Editor

- Add/edit/delete visible.
- Product video upload included.
- Program task repeat/cycle fields visible.

## 8. Handoff Requirements

Each Figma component must include:

- Component name matching code component.
- Variants: default, pressed, disabled, loading, error if applicable.
- Token references, not raw values.
- Mobile and desktop examples.
- Empty and error states.

