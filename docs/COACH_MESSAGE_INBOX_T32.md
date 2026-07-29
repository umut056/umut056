# Coach Message Inbox T32

## Amac

Koc tarafinda mesaj bildirimi yalnizca alt bardaki kirmizi rozetle kalmasin; mesajlar ekranina girince hangi danisandan kac mesaj geldigi net gorunsun.

## Degisiklikler

- Mevcut `unreadConversationSummaries` servisi yeniden kullanildi.
- Koc mesajlar ekraninin ustune okunmamis mesaj ozeti eklendi.
- Ozet karti en yeni/agirlikli gondereni acar.
- Danisan listesi okunmamis mesaj olanlari uste tasir.
- Her satirda danisan adi, son mesaj onizlemesi, saat ve okunmamis adet daha belirgin hale getirildi.

## Kabul Kriterleri

- Koca birden fazla danisandan mesaj gelirse toplam mesaj ve danisan sayisi gorunur.
- Tek danisandan mesaj gelirse danisan adi ve son mesaj onizlemesi gorunur.
- Ozet karta basinca ilgili sohbet acilir.
- Sohbet acilinca mevcut `syncConversationRead` akisi okunmamis durumunu temizlemeye devam eder.
