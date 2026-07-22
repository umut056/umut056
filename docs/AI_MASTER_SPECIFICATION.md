# StepWise Plus V2 - AI Master Specification

Bu dokuman StepWise Plus V2 AI sisteminin ana sozlesmesidir. AI kullaniciya en son acilacak katmandir; once veri, guvenlik, izin, log ve test altyapisi tamamlanir.

## 1. AI Modulleri

| Modul | Amac |
| --- | --- |
| AI Coach | Danisana gunluk motivasyon ve yol gosterme |
| AI Nutrition | Beslenme kayitlarini yorumlama |
| AI Progress | Kilo, olcum, gorev ve foto ilerlemesini analiz etme |
| AI Vision | Fotograflardan ilerleme veya urun/gorev kaniti analiz etme |
| AI Reminder | Geciken gorevler icin akilli hatirlatici |
| AI Motivation | Motivasyon dususu riskinde destek mesajlari |
| AI Reports | Koc ve danisan icin rapor uretme |
| AI Admin | Sistem trendlerini admin icin ozetleme |

## 2. Temel Kurallar

- Prompt component icinde yazilmaz.
- AI cagrilari client tarafindan dogrudan secret ile yapilmaz.
- Promptlar versiyonlanir.
- AI response model, prompt version, model, token ve tarih ile kaydedilir.
- Kullanici acik riza vermeden hassas veri AI'a gonderilmez.
- AI tavsiyesi tıbbi tani gibi sunulmaz.
- AI ciktilari koç/uzman kararinin yerine gecmez.

## 3. AI Orchestrator

AI Orchestrator su kararlari verir:

- Hangi AI modulu calisacak?
- Hangi veri context'e girecek?
- Token limiti nedir?
- Kullanici izin verdi mi?
- Sonuc kaydedilecek mi?
- Bildirim uretilecek mi?

## 4. Context Policy

AI'a gidebilecek veri sinirli ve amaca bagli olur.

| Veri | AI Kullanimi | Kosul |
| --- | --- | --- |
| Profil | Personalization | Kullanici izni |
| Kilo | Progress | Kullanici izni |
| Olcum | Progress | Kullanici izni |
| Foto | Vision | Ayrica fotograf izni |
| Mesaj | Coach insight | Ayrica mesaj analizi izni |
| Gorev | Reminder/progress | Kullanici izni |
| Urun | Product tracking | Kullanici izni |

## 5. Prompt Versioning

Prompt kaydi:

```json
{
  "prompt_key": "ai_progress_summary",
  "version": "1.0.0",
  "locale": "tr-TR",
  "status": "active",
  "input_schema": {},
  "output_schema": {}
}
```

## 6. Output Model

```json
{
  "type": "progress_insight",
  "title": "Ilerlemen iyi gidiyor",
  "summary": "Son 7 gunde gorev uyumun artti.",
  "confidence": 0.82,
  "actions": [],
  "safety_notes": []
}
```

## 7. AI Safety

AI su alanlarda dikkatli olur:

- Tıbbi tani koymaz.
- Ilac/doz onermez.
- Saglik riski varsa doktora yonlendirir.
- Asiri kilo kaybi veya yeme bozuklugu sinyallerini risk olarak isaretler.
- Kullaniciya utanma/suclama dili kullanmaz.

## 8. Token ve Maliyet Kontrolu

- Her AI modulunun token limiti olur.
- Uzun context ozetlenir.
- Gereksiz mesaj gecmisi gonderilmez.
- Ayni rapor tekrar tekrar uretilmez; cache kullanilir.

## 9. AI Memory

AI memory kullaniciya ait uzun vadeli ozetlerden olusur:

- Hedef
- Basari paterni
- Zorlandigi saatler
- Motivasyon dili
- Tercihler
- Uyum gecmisi

AI memory kullanici tarafindan silinebilir olmalidir.

## 10. Kabul Kriterleri

- AI secret client bundle icinde yok.
- Promptlar merkezi.
- Prompt version kaydediliyor.
- Kullanici izinleri kontrol ediliyor.
- AI hatalari UI'i bozmaz.
- Token limiti uygulanir.
- AI ciktisi auditlenir.

