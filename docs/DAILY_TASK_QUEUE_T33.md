# Daily Task Queue T33

## Amac

Danisan gorev ekraninda tamamlanan gorevler listeden kalkmali, siradaki gorev one cikmali ve yeni gun eski tamamlanmis state'i tasimamali.

## Degisiklikler

- `ClientTasks` gorunur gorev listesini artik tek kaynak olan `dailyTaskQueue` servisinden alir.
- Hatirlatma karti yalnizca bekleyen gorev varsa gosterilir.
- Gorev ilerleme sayaci queue `done/total` degerlerinden beslenir.
- Koc dashboard ortalama uyumu stale `client.compliance` yerine bugunku daily state'ten hesaplanabilir hale getirildi.

## Kabul Kriterleri

- Danisan bir gorevi tamamlayinca o gorev listeden duser.
- Butun gorevler tamamlaninca gorev listesi yerine gun tamamlandi karti gorunur.
- Yeni gunde daily state sifirlanir ve koc dashboard onceki gun uyumunu tasimaz.
- Servis seviyesinde eski compliance degeri olsa bile bugunku uyum override edilebilir.
