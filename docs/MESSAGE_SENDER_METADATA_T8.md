# Message Sender Metadata T8

## Amaç

Koç tarafında mesaj bildirimi veya mesaj listesi cloud restore sonrasında açıldığında gönderen danışanın adını kaybetmemek.

## Değişiklik

- `messages.sender_name` alanı Supabase şemasına geriye uyumlu eklendi.
- Yeni mesaj cloud'a yazılırken gönderen adı da saklanır.
- Cloud'dan okunan mesajlar uygulama modeline `senderName` olarak döner.
- Mesaj map testi eklendi.

## Risk

Düşük. Alan nullable olduğu için eski mesaj kayıtları çalışmaya devam eder.

## Test

- `npm run lint`
- `npm run build`
- `npm test`
