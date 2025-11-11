# Переводы, которые нужно добавить

## ✅ Полностью переведено (5 языков):
- **English (en)** - готово
- **Spanish (es)** - готово  
- **Russian (ru)** - готово
- **Ukrainian (ua)** - готово
- **Catalan (ca)** - готово

## ⚠️ Требуют переводы (9 языков):

Для каждого языка нужно добавить/обновить в файле `messages/{locale}.json`:

### 1. Investments секция:
```json
"Investments": {
  "title": "...",
  "headline": "...",
  "subhead": "...",
  "body": "...",
  "models": {
    "title": "...",
    "revenueShare": { "title": "...", "description": "..." },
    "leaseToOwn": { "title": "...", "description": "..." },
    "localJv": { "title": "...", "description": "..." },
    "techLicensing": { "title": "...", "description": "..." }
  },
  "note": "...",
  "stats": { ... },
  "cta": "..."
}
```

### 2. About секция:
```json
"About": {
  "title": "...",
  "headline": "...",
  "subhead": "...",
  "body": "...",
  "mission": "...",
  "highlights": {
    "title": "...",
    "multilanguage": { "title": "...", "description": "..." },
    "ecosystem": { "title": "...", "description": "..." },
    "design": { "title": "...", "description": "..." }
  },
  "cta": "..."
}
```

### 3. Courts секция (если еще не добавлена):
```json
"Courts": {
  "title": "...",
  "headline": "...",
  "subhead": "...",
  "body": "...",
  "features": {
    "types": { "title": "...", "description": "..." },
    "certificates": { "title": "...", "description": "..." },
    "lighting": { "title": "...", "description": "..." },
    "options": { "title": "...", "description": "..." },
    "timeline": { "title": "...", "description": "..." }
  },
  "tabs": { ... },
  "cta": "..."
}
```

### 4. Machines секция (если еще не добавлена):
```json
"Machines": {
  "title": "...",
  "headline": "...",
  "subhead": "...",
  "body": "...",
  "features": {
    "aiDrills": { "title": "...", "description": "..." },
    "visionAnalysis": { "title": "...", "description": "..." },
    "virtualCoach": { "title": "...", "description": "..." },
    "cloudApi": { "title": "...", "description": "..." },
    "rentalMode": { "title": "...", "description": "..." }
  },
  "cta": "..."
}
```

## Языки, требующие переводы:
- Chinese (zh)
- Dutch (nl)
- Danish (da)
- Swedish (sv)
- German (de)
- Norwegian (no)
- Italian (it)
- French (fr)
- Arabic (ar)

## Временное решение:

Пока переводы не добавлены, сайт будет использовать английские тексты как fallback для отсутствующих ключей через next-intl.

