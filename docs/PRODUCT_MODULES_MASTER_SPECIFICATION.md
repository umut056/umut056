# StepWise Plus V2 - Product Modules Master Specification

Bu doküman StepWise Plus V2'nin ileri ürün modüllerini tanımlar.

Kapsam:

- AI Memory
- AI Persona
- Gamification Engine
- Community
- Education
- CRM
- Marketplace

Bu modüller ilk release için tamamı zorunlu değildir. Ancak mimari kararlar bugünden bu modülleri engellemeyecek şekilde alınmalıdır.

## AI Memory

AI Memory, yapay zekanın kullanıcıyı güvenli ve kontrollü şekilde hatırlamasını sağlar.

### AI Memory İlkeleri

- AI tıbbi karar vermez.
- AI koçun yerine geçmez.
- AI hassas veriyi gereksiz tutmaz.
- Kullanıcı ve koç gözetimi korunur.
- Memory tenant, user ve permission sınırlarına uyar.

### Memory Tipleri

| Tip | Açıklama |
| --- | --- |
| `profile_memory` | Kullanıcının hedefleri, tercihleri, genel bilgisi. |
| `program_memory` | Aktif program, ürünler, yasaklı liste. |
| `progress_memory` | Kilo, ölçüm, foto ve görev trendleri. |
| `communication_memory` | Koç notları ve geçmiş özetler. |
| `motivation_memory` | Kullanıcıyı motive eden dil ve ödüller. |
| `risk_memory` | Kaçan görev, düşük uyum, ani kilo değişimi gibi riskler. |

### Memory Kaynakları

- Profil
- Program
- Görevler
- Kilo kayıtları
- Ölçümler
- Fotoğraflar
- Koç notları
- Randevular
- Mesaj özetleri
- AI raporları

### Memory Storage

Önerilen tablolar:

- `ai_memory_items`
- `ai_memory_summaries`
- `ai_memory_permissions`
- `ai_memory_deletions`

### Memory Kuralları

- Kullanıcı memory verisinin silinmesini isteyebilir.
- AI memory raw mesajları sonsuza kadar saklamaz; özet saklar.
- AI memory hassas sağlık iddiası oluşturmaz.
- Koçun özel notları danışana açık memory’ye yazılmaz.

## AI Persona

AI konuşma karakteri ürün güvenini doğrudan etkiler.

### Persona Temeli

StepWise AI:

- Sakin
- Motive edici
- Kısa ve net
- Yargılamayan
- Koçun programına sadık
- Sağlık iddiasında bulunmayan
- Gerektiğinde “koçuna danış” diyen

### Danışan Tarafı Persona

Dil:

- Samimi ama aşırı laubali değil.
- Moral verir.
- Küçük başarıları fark eder.
- Kullanıcıyı suçlamaz.

Örnek:

> Bugün bir görevi tamamladın, güzel başlangıç. Sıradaki adım için su ve kahvaltı saatini kaçırmamaya odaklanalım.

### Koç Tarafı Persona

Dil:

- Operasyonel
- Kısa özet veren
- Riskleri net işaretleyen
- Kararı koça bırakan

Örnek:

> Mert son 3 günde 2 görev kaçırdı ve tartı fotoğrafı eklemedi. Nazik bir kontrol mesajı göndermen iyi olabilir.

### Admin Tarafı Persona

Dil:

- Teknik
- Güvenlik odaklı
- Açık risk seviyesi verir

## Gamification Engine

Gamification sadece rozet değildir. Kullanıcıyı sağlıklı alışkanlığa bağlayan ilerleme sistemidir.

### Gamification Modülleri

- XP
- Level
- Badge
- Streak
- League
- Challenge
- Reward
- Milestone

### XP Kaynakları

| Aksiyon | XP |
| --- | --- |
| Görev tamamladı | 10 |
| Fotoğraf kanıtı onaylandı | 20 |
| Günlük tüm görevleri tamamladı | 40 |
| Haftalık uyum %80+ | 100 |
| Kilo milestone | 150 |
| Randevuya katıldı | 50 |
| Su hedefini tamamladı | 20 |

### Level Sistemi

Level isimleri:

1. Başlangıç
2. Ritim
3. İstikrar
4. Güçlenme
5. Dönüşüm
6. Lider

### Badge Türleri

- İlk görev
- 3 gün seri
- 7 gün seri
- 30 gün aktif
- 1 kilo başarı
- 5 kilo başarı
- 10 kilo başarı
- Fotoğraf disiplin
- Randevu düzeni
- Ürün kullanım düzeni

### League

Aylık danışan başarı sıralaması:

- Altın kupa
- Gümüş kupa
- Bronz kupa
- İlk 10
- Yükselen danışan

İsimler gizlilik için maskelenebilir:

- `E**** Y*****`

### Challenge

Örnek challenge’lar:

- 7 gün su takibi
- 5 gün görev tamamlama
- 3 gün tartı fotoğrafı
- Haftalık aktif kalma

## Community

Community ilk release için zorunlu değildir ama mimari engellenmemelidir.

### Community Modülleri

- Arkadaş ekleme
- Grup challenge
- Koç grubu
- Başarı paylaşımı
- Aylık lig
- Grup duyuruları

### Güvenlik

- Danışanlar varsayılan olarak birbirlerinin detaylı verisini görmez.
- Paylaşım opt-in olur.
- Koç grup görünürlüğünü yönetir.
- Admin moderation yetkisi olur.

## Education

Education modülü koçların içeriklerini danışanlara düzenli aktarmasını sağlar.

### İçerik Tipleri

- Video
- PDF
- Kısa makale
- Quiz
- Ürün kullanım eğitimi
- Program açıklaması
- Yasaklı liste eğitimi

### Eğitim Akışı

- Koç içerik yükler.
- İçerik programla ilişkilendirilebilir.
- Danışan özet veya eğitim ekranında görür.
- İzleme/okuma tamamlandı event üretir.
- Quiz varsa skor kaydedilir.

### Eğitim Tabloları

- `education_courses`
- `education_lessons`
- `education_media`
- `education_assignments`
- `education_progress`
- `education_quizzes`
- `education_quiz_answers`

## CRM

Koç tarafında gerçek iş yönetimi için CRM gerekir.

### CRM Kavramları

- Lead
- Prospect
- Active client
- At risk client
- Follow-up
- Conversion
- Renewal
- Lost client

### CRM Pipeline

1. Yeni lead
2. Görüşme planlandı
3. Program önerildi
4. Üye oldu
5. Aktif takip
6. Riskli
7. Yenileme
8. Pasif

### CRM Follow-up Kuralları

Eventlerden otomatik follow-up üretilebilir:

- `TaskMissed`
- `MessageNotRead`
- `WeightNotUpdated`
- `AppointmentMissed`
- `ProgramEndingSoon`
- `SubscriptionExpiring`

### CRM Tabloları

- `crm_leads`
- `crm_pipeline_stages`
- `crm_deals`
- `crm_followups`
- `crm_notes`
- `crm_activities`
- `crm_reminders`

## Marketplace

Marketplace uzun vadeli modüldür.

### Marketplace İçerikleri

- Program şablonları
- Eğitim paketleri
- Ürün katalog paketleri
- AI prompt paketleri
- Koç dashboard template’leri

### Marketplace Kuralları

- İlk release kapsamında kapalı feature flag.
- Tenant bazlı açılabilir.
- İçerik onay mekanizması gerekir.
- Payment/commission sistemi olmadan açılmaz.

### Marketplace Tabloları

- `marketplace_items`
- `marketplace_categories`
- `marketplace_purchases`
- `marketplace_reviews`
- `marketplace_installations`

## Module Priority

| Modül | Release Önceliği |
| --- | --- |
| AI Memory altyapı | Orta |
| AI Persona | Yüksek |
| Gamification basic | Yüksek |
| Community | Düşük |
| Education product video | Yüksek |
| Education full module | Orta |
| CRM follow-up basic | Yüksek |
| CRM full pipeline | Orta |
| Marketplace | Düşük |

## Event Bağlantıları

Bu modüller event-driven architecture ile çalışır:

- `TaskCompleted` -> XP, streak, badge
- `WeightAdded` -> milestone, AI progress
- `GoalReached` -> reward, notification
- `ProgramAssigned` -> education assignment
- `MessageSent` -> CRM activity
- `AppointmentRequested` -> CRM follow-up
- `AIReportGenerated` -> coach insight
- `SubscriptionRenewed` -> entitlement update

## Kabul Kriterleri

- AI promptları component içinde yazılmaz.
- AI memory için silme ve izin modeli tanımlanmadan kullanıcıya açılmaz.
- Gamification eventlerden beslenir, UI içinden manuel puan yazılmaz.
- Community varsayılan kapalı gelir.
- Education içerikleri medya sistemiyle aynı storage standardını kullanır.
- CRM follow-up eventlerden üretilir.
- Marketplace feature flag arkasında kalır.
