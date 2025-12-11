# Ручная отправка писем через Resend

## Описание

Resend - это API-сервис для отправки транзакционных писем. Он не имеет веб-интерфейса для ручной отправки, поэтому для отправки писем вручную используется скрипт.

## Настройка

1. Убедитесь, что у вас есть `RESEND_API_KEY` в `.env.local`:
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_DOMAIN=padelo2.com
NEXT_PUBLIC_SITE_URL=https://padelo2.com
```

2. Установите зависимости (если еще не установлены):
```bash
npm install
```

## Использование

### 1. Отправка письма о спонсорстве UA PADEL OPEN (рекомендуется)

```bash
tsx scripts/send-manual-email.ts sponsorship <email> [компания] [имя] [locale]
```

**Пример:**
```bash
tsx scripts/send-manual-email.ts sponsorship partner@acerko.com "Acerko Telecom" "Иван" en
npm run send-email sponsorship partner@example.com "Company Name"
```

Этот вариант использует готовый шаблон письма о спонсорстве с фирменным дизайном PadelO₂.

### 2. Отправка письма партнеру

```bash
tsx scripts/send-manual-email.ts <email> <имя> [locale]
```

**Пример:**
```bash
tsx scripts/send-manual-email.ts partner@example.com "Иван Иванов" ru
```

### 3. Отправка произвольного письма

```bash
tsx scripts/send-manual-email.ts custom <email> <тема> <сообщение>
```

**Пример:**
```bash
tsx scripts/send-manual-email.ts custom user@example.com "Привет" "Это тестовое сообщение"
```

## Программное использование

Вы можете использовать функции из `lib/resend-template-helper.ts` в своем коде:

### Отправка письма о спонсорстве

```typescript
import { generateSponsorshipProposalEmailHTML } from '@/lib/resend-template-helper';
import { sendEmail } from '@/lib/email';

// Генерация HTML для письма о спонсорстве
const html = generateSponsorshipProposalEmailHTML({
  partnerName: 'Иван',
  partnerCompany: 'Acerko Telecom',
  locale: 'en',
  phone: '+34 662 423 738',
  email: 'partner@padelO2.com',
});

// Отправка письма
await sendEmail({
  to: 'partner@example.com',
  subject: 'Sponsorship Proposal – UA PADEL OPEN',
  html,
  locale: 'en',
});
```

### Отправка письма партнеру

```typescript
import { generatePartnerEmailHTML } from '@/lib/resend-template-helper';
import { sendEmail } from '@/lib/email';

// Генерация HTML для письма партнеру
const html = generatePartnerEmailHTML({
  partnerName: 'Иван Иванов',
  partnerCompany: 'Компания',
  message: 'Ваше сообщение здесь...',
  locale: 'ru',
  buttonUrl: 'https://padelo2.com/ru/contact',
  buttonText: 'Связаться с нами',
});

// Отправка письма
await sendEmail({
  to: 'partner@example.com',
  subject: 'Партнерство с PadelO₂',
  html,
  locale: 'ru',
});
```

## Шаблон письма

Шаблон находится в файле `resend-template.html` и использует переменные в формате `{{variableName}}`.

### Доступные переменные:

- `{{locale}}` - язык письма
- `{{subject}}` - тема письма
- `{{title}}` - заголовок
- `{{greeting}}` - приветствие
- `{{content}}` - основной контент
- `{{buttonUrl}}` - URL кнопки
- `{{buttonText}}` - текст кнопки
- `{{brandTagline}}` - слоган бренда
- `{{welcomeBadge}}` - текст бейджа
- `{{footerText}}` - текст футера
- `{{team}}` - название команды
- И другие...

## Альтернативные решения

Если вам нужен веб-интерфейс для отправки писем, рассмотрите:

1. **Mailchimp** - имеет веб-интерфейс для создания и отправки писем
2. **SendGrid** - имеет веб-интерфейс и API
3. **Создать админ-панель** - можно добавить страницу в админке для отправки писем

## Примеры использования

### Пример 1: Отправка письма о спонсорстве

```bash
# Минимальный вариант (только email)
npm run send-email sponsorship partner@acerko.com

# С указанием компании
npm run send-email sponsorship partner@acerko.com "Acerko Telecom"

# Полный вариант
npm run send-email sponsorship partner@acerko.com "Acerko Telecom" "Иван" en
```

### Пример 2: Запрос партнеру

```bash
tsx scripts/send-manual-email.ts partner@company.com "ООО Компания" ru
```

### Пример 3: Приглашение на турнир

```bash
tsx scripts/send-manual-email.ts custom player@example.com "Приглашение на турнир" "Приглашаем вас принять участие в турнире..."
```

## Примечания

- Resend требует верифицированный домен для отправки писем
- Убедитесь, что домен добавлен в настройках Resend
- Письма отправляются от имени `hello@padelo2.com` (или указанного в настройках)

