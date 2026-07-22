# StepWise Plus V2 - Formula Engine

Formula Engine wellness hesaplamalarini merkezi ve test edilebilir hale getirir.

## 1. Genel Ilkeler

- Formuller UI component icinde yazilmaz.
- Her formul versionlanir.
- Input ve output schema tanimlidir.
- Birim bilgisi her sonuc ile birlikte saklanir.
- Sonuclar tibbi tani olarak sunulmaz.

## 2. Formula Registry

| Key | Version | Input | Output |
| --- | --- | --- | --- |
| `bmi` | 1 | weight_kg, height_cm | bmi, category |
| `bmr.mifflin` | 1 | weight_kg, height_cm, age, sex | kcal |
| `tdee` | 1 | bmr, activity_factor | kcal |
| `water_target` | 1 | weight_kg, activity_level | ml |
| `protein_target` | 1 | weight_kg, goal_type | grams |
| `weight_change` | 1 | start_weight, current_weight, goal_type | delta, direction |
| `body_fat_estimate` | 1 | waist, hip, neck, height, sex | percent |
| `health_score` | 1 | compliance, weight, nutrition, water, activity, product | score |

## 3. BMI

```text
bmi = weight_kg / ((height_cm / 100) ^ 2)
```

Category:

- `< 18.5`: underweight
- `18.5 - 24.9`: normal
- `25 - 29.9`: overweight
- `>= 30`: obesity range

UI notu: kategori yargilayici dille gosterilmez.

## 4. Weight Change

```text
delta = current_weight_kg - start_weight_kg
```

For weight loss:

- negative delta means progress.
- display: `abs(delta) kg gitti`.

For weight gain:

- positive delta means progress.
- display: `delta kg alindi`.

## 5. Milestone

```text
progress_kg = abs(delta)
milestone = floor(progress_kg / 5) * 5
```

- 1 kg and above: small motivation.
- 5 kg and above: celebration card.
- Text must include elapsed day count.

## 6. Water Target

Default:

```text
water_ml = weight_kg * 35
```

Activity adjustment:

- low: +0 ml
- medium: +300 ml
- high: +600 ml

## 7. Protein Target

Default ranges:

- weight_loss: `weight_kg * 1.4`
- maintenance: `weight_kg * 1.2`
- weight_gain: `weight_kg * 1.6`

## 8. Health Score

Score 0-100:

| Component | Weight |
| --- | --- |
| task_compliance | 25 |
| weight_trend | 20 |
| nutrition | 15 |
| water | 10 |
| activity | 10 |
| product_usage | 10 |
| coach_interaction | 5 |
| streak | 5 |

```text
health_score = sum(component_score * component_weight) / 100
```

## 9. Output Contract

```json
{
  "key": "weight_change",
  "version": 1,
  "value": -4.5,
  "unit": "kg",
  "display": "4.5 kg gitti",
  "confidence": "calculated",
  "warnings": []
}
```

