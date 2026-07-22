# StepWise Plus V2 - Report Templates

Bu dokuman koc, danisan, admin ve AI rapor sablonlarini tanimlar.

## 1. Genel Kurallar

- Raporlar snapshot olarak saklanir.
- Rapor verisi tekrar hesaplanabilir olmali ama gosterilen rapor versionlanmalidir.
- Undefined/NaN UI'da gorunmez.
- PDF/Excel export ileride ayni template uzerinden uretilir.

## 2. Client Weekly Progress Report

Audience: Danisan ve koc.

Sections:

1. Summary
2. Weight change
3. Task compliance
4. Photo proof count
5. Measurement change
6. Coach note
7. Next week focus

Payload:

```json
{
  "type": "client_weekly_progress",
  "version": 1,
  "client": {
    "id": "uuid",
    "name": "Elif Yilmaz"
  },
  "period": {
    "start": "2026-06-01",
    "end": "2026-06-07"
  },
  "metrics": {
    "start_weight_kg": 72,
    "current_weight_kg": 67.5,
    "change_kg": -4.5,
    "task_compliance_percent": 73,
    "photo_count": 10
  },
  "summary": "Bu hafta duzenli ilerleme var.",
  "next_focus": ["Su hedefi", "Sabah tarti rutini"]
}
```

## 3. Coach Dashboard Report

Audience: Koc.

Sections:

- Active clients
- Risk clients
- Pending proofs
- Unread messages
- Appointment requests
- Top progress clients
- Clients requiring action

Acceptance:

- All cards clickable.
- Each card opens filtered detail.
- No white screen.

## 4. Admin System Report

Audience: Admin.

Sections:

- Total users
- Active coaches
- Active clients
- Banned users
- New registrations
- Storage usage
- Notification health
- Audit activity

## 5. AI Coach Insight Report

Audience: Koc.

Sections:

- Risk summary
- Client-specific insights
- Suggested action
- Confidence
- Source events

Output:

```json
{
  "type": "ai_coach_insight",
  "version": 1,
  "insights": [
    {
      "client_id": "uuid",
      "severity": "medium",
      "title": "Motivasyon dususu riski",
      "reason": "3 gundur gorev tamamlanmadi.",
      "suggested_action": "Kisa bir destek mesaji gonder."
    }
  ]
}
```

## 6. Export Templates

### PDF

- Cover title
- Period
- Metric cards
- Trend chart
- Notes
- Footer privacy note

### Excel

Sheets:

- Summary
- Weight
- Measurements
- Tasks
- Photos
- Messages summary

### CSV

- One domain per CSV.
- UTF-8.
- Header row required.

