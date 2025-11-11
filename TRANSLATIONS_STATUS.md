# Статус переводов

## ✅ Полностью переведено (4 языка):
- **English (en)** - готово
- **Spanish (es)** - готово  
- **Russian (ru)** - готово
- **Ukrainian (ua)** - готово

## ⚠️ Требуют переводы (10 языков):
- Catalan (ca)
- Chinese (zh)
- Dutch (nl)
- Danish (da)
- Swedish (sv)
- German (de)
- Norwegian (no)
- Italian (it)
- French (fr)
- Arabic (ar)

## Структура для добавления переводов:

Для каждого языка нужно добавить в файл `messages/{locale}.json`:

```json
"Machines": {
  "title": "...",
  "headline": "...",
  "subhead": "...",
  "body": "...",
  "features": {
    "aiDrills": {
      "title": "...",
      "description": "..."
    },
    "visionAnalysis": {
      "title": "...",
      "description": "..."
    },
    "virtualCoach": {
      "title": "...",
      "description": "..."
    },
    "cloudApi": {
      "title": "...",
      "description": "..."
    },
    "rentalMode": {
      "title": "...",
      "description": "..."
    }
  },
  "cta": "..."
},
"About": {
  "title": "...",
  "paragraph1": "...",
  "paragraph2": "...",
  "tagline": "..."
}
```

## Временное решение:

Пока переводы не добавлены, сайт будет использовать английские тексты как fallback для отсутствующих ключей.

