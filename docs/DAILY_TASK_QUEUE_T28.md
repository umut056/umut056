# Daily Task Queue T28

## Amaç

Danışan günlük görevlerinde tamamlanan görevlerin listeden kalkması ve sıradaki görevin güvenilir şekilde belirlenmesi.

## Değişiklik

- `dailyTaskQueue` helper'ı eklendi.
- Helper toplam görev, tamamlanan görev, kalan görev, görünür görev listesi ve sıradaki görevi tek modelde döndürür.
- `dailyTasksComplete` artık aynı queue modelini kullanır.

## Kabul Kriteri

- Tamamlanan görevler görünür listede yer almaz.
- Bir sonraki yapılacak görev `next` alanından okunabilir.
- Gün değiştiğinde `dailyStateFor` yeni tarih için temiz state üretmeye devam eder.
