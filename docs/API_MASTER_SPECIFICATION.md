# StepWise Plus V2 - API Master Specification

Bu dokuman StepWise Plus V2 API sozlesmesinin urun seviyesindeki ana standardidir.

Makine okunabilir endpoint sozlesmesi `OPENAPI.yaml` icindedir. Bu dosya ise API davranis kurallarini, response modelini, hata yonetimini, versioning ve guvenlik prensiplerini tanimlar.

## 1. API Prensipleri

- Client tarafinda service role key bulunmaz.
- Admin islemleri Edge Function veya RPC uzerinden yapilir.
- Her API kullanici rolune gore yetki kontrolu yapar.
- API response modeli tek tip olur.
- Hatalar merkezi formatta doner.
- Endpointler geriye uyumlu degistirilir.
- Silme islemleri mumkunse soft delete ile yapilir.
- Medya upload islemleri Storage metadata ile birlikte kayit altina alinir.

## 2. Roller

| Rol | Yetki Ozeti |
| --- | --- |
| `admin` | Tum sistemi yonetir, kod uretir, kullanici durumlarini degistirir, audit gorur |
| `coach` | Kendi danisanlarini, programlarini, mesajlarini, raporlarini yonetir |
| `client` | Kendi programini, gorevlerini, olcumlerini, mesajlarini ve medyasini gorur |
| `system` | Edge Function, bildirim, AI ve scheduler islemleri icin servis rolu |

## 3. Standart Response Modeli

Basarili response:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "request_id": "uuid",
    "version": "v1"
  }
}
```

Hatali response:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Gecerli bir e-posta girin.",
    "details": {}
  },
  "meta": {
    "request_id": "uuid",
    "version": "v1"
  }
}
```

## 4. Error Kodlari

| Kod | Anlam |
| --- | --- |
| `AUTH_REQUIRED` | Oturum yok |
| `FORBIDDEN` | Rol yetkisi yok |
| `VALIDATION_ERROR` | Input hatali |
| `NOT_FOUND` | Kayit bulunamadi |
| `CONFLICT` | Ayni veri zaten var |
| `RATE_LIMITED` | Cok fazla istek |
| `MEDIA_UPLOAD_FAILED` | Medya yukleme hatasi |
| `SYNC_CONFLICT` | Offline/online veri cakismasi |
| `INTERNAL_ERROR` | Beklenmeyen hata |

## 5. Domain Endpoint Gruplari

| Domain | Ana Endpointler |
| --- | --- |
| Auth | login, register, logout, refresh, password reset |
| Profiles | profile get/update, avatar upload |
| Coach | coach dashboard, coach clients, coach code |
| Clients | client create/update/archive, client detail |
| Programs | program list/create/update/delete/assign |
| Tasks | daily tasks, task complete, proof upload, proof approval |
| Tracking | weight, measurement, water, activity, nutrition |
| Messages | conversation list, message send, media message, read state |
| Appointments | request, approve, reschedule, cancel |
| Media | upload, signed url, thumbnail, metadata |
| Notifications | inbox, mark read, device token |
| Reports | coach reports, client reports, export |
| AI | AI chat, AI report, AI nutrition, AI vision |
| Admin | user management, codes, audit, system settings |

## 6. Versioning

- Public API version: `v1`.
- Breaking changes yeni version ister.
- Database migration versionlari migration dosya adi ile izlenir.
- AI prompt versionlari `prompt_version` ile saklanir.
- Client eski endpointleri kullanirken kirilmamalidir.

## 7. Pagination ve Filtering

Liste endpointleri varsayilan olarak pagination destekler:

```json
{
  "page": 1,
  "page_size": 25,
  "sort": "created_at.desc",
  "filters": {}
}
```

Buyuk listeler icin zorunlu:

- Messages
- Task logs
- Proof photos
- Audit logs
- Reports
- Notifications

## 8. Media API Kurallari

- Profil fotografi, gorev kaniti, mesaj medyasi, urun videosu farkli `media_type` ile saklanir.
- Dosya adi kullanici tarafindan gelen isimle guvenilmez.
- Storage path format:

```text
{tenant_id}/{owner_id}/{media_type}/{yyyy}/{mm}/{uuid}.{ext}
```

- Thumbnail her foto/video icin ayrica uretilir.
- Signed URL sureleri kisitli olur.

## 9. Audit Kurali

Su islemler audit log uretir:

- Kullanici olusturma/silme/ban
- Program atama
- Proof onay/red
- Kilo/olcum duzenleme
- Admin kod uretme
- AI rapor olusturma
- Odeme/subscription degisikligi

## 10. Kabul Kriterleri

- Her endpoint rol bazli yetki kontrolu yapar.
- Her hata standart error modeli ile doner.
- Edge Function response sekli tutarlidir.
- Service role hicbir client bundle icinde yoktur.
- OpenAPI dosyasi endpoint degisikliginde guncellenir.

