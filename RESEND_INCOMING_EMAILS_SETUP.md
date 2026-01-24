# Настройка получения входящих писем через Resend

## Обзор

Для получения входящих писем на служебную почту (например, `partner@padelo2.com`, `hello@padelo2.com`) и их отображения в административной панели, нужно настроить Resend Inbox и webhook.

## Вариант 1: Использование Resend Inbound/Inbox (Рекомендуется)

Resend предоставляет функцию Inbound/Inbox для получения входящих писем на ваш домен.

⚠️ **ВАЖНО:** Если вы сделали интеграцию Resend с Vercel, проверьте настройки в разделе интеграций Vercel.

### Шаг 1: Настройка домена в Resend

1. Войдите в [Resend Dashboard](https://resend.com/domains)
2. Перейдите в раздел **"Domains"**
3. Убедитесь, что ваш домен `padelo2.com` верифицирован
4. Если домен не добавлен:
   - Нажмите **"Add Domain"**
   - Введите `padelo2.com`
   - Добавьте DNS записи, которые Resend предоставит (MX, TXT, SPF, DKIM)
   - Дождитесь верификации (обычно несколько минут)

### Шаг 2: Настройка Inbound для домена

1. В Resend Dashboard перейдите в раздел **"Inbound"** (или **"Receiving"**)
2. Нажмите **"Add Inbound"** или **"Configure Inbound"**
3. Выберите ваш домен `padelo2.com`
4. Настройте email адреса, на которые будут приходить письма:
   - `partner@padelo2.com`
   - `hello@padelo2.com`
   - `support@padelo2.com`
   - Или используйте catch-all: `*@padelo2.com` (все письма на домен)

### Шаг 3: Настройка Webhook

⚠️ **ВАЖНО:** В зависимости от вашего плана Resend, webhook для входящих писем может настраиваться в разделе **"Inbound"** или через общий раздел **"Webhooks"**.

**Вариант A: Если есть раздел Inbound → Webhooks:**
1. В Resend Dashboard перейдите в раздел **"Inbound"**
2. Выберите ваш домен `padelo2.com`
3. Найдите настройки **"Webhooks"** внутри раздела Inbound
4. Нажмите **"Add Webhook"** или **"Configure Webhook"**
5. Введите URL: `https://padelo2.com/api/admin/partner-emails/incoming`
6. Выберите события: `email.received` (обязательно)
7. Сохраните webhook

**Вариант B: Если нет раздела Inbound → Webhooks:**
Настройте webhook в общем разделе **"Webhooks"** с событием `email.received`.

⚠️ **КРИТИЧЕСКИ ВАЖНО для URL:**
   - ❌ НЕ используйте `http://padelo2.com/...` (будет редирект 301)
   - ❌ НЕ используйте `https://www.padelo2.com/...` (может быть редирект)
   - ✅ Используйте ТОЛЬКО `https://padelo2.com/...` (без www)

### Шаг 4: Настройка переменных окружения

Добавьте в `.env.local` (или в настройках Vercel):

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_WEBHOOK_SECRET=your-webhook-secret-from-resend
NEXT_PUBLIC_SITE_URL=https://padelo2.com
```

**Где найти `RESEND_WEBHOOK_SECRET`:**
- В Resend Dashboard → Inbox → Webhooks
- Скопируйте "Signing Secret" или "Webhook Secret"

## Структура данных Webhook

Resend отправляет webhook в следующем формате:

```json
{
  "type": "email.received",
  "data": {
    "id": "email-id-123",
    "from": "sender@example.com",
    "to": ["partner@padelo2.com"],
    "subject": "Email Subject",
    "html": "<html>...</html>",
    "text": "Plain text version",
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

Наш endpoint обрабатывает оба формата:
- Прямой формат: `{ from, to, subject, html, text }`
- Формат с оберткой: `{ type, data: { ... } }`

## Тестирование и диагностика

### 1. Проверка доступности webhook endpoint

Проверьте, что endpoint доступен:
```bash
curl -X GET https://padelo2.com/api/admin/partner-emails/incoming/test
```

Должен вернуться JSON с инструкциями.

### 2. Тестирование webhook вручную

Отправьте тестовый запрос на webhook endpoint:

```bash
curl -X POST https://padelo2.com/api/admin/partner-emails/incoming \
  -H "Content-Type: application/json" \
  -H "User-Agent: Resend-Webhook/1.0" \
  -d '{
    "type": "email.received",
    "data": {
      "id": "test-email-123",
      "from": "test@example.com",
      "to": ["partner@padelo2.com"],
      "subject": "Test Email",
      "html": "<p>Test HTML content</p>",
      "text": "Test text content",
      "created_at": "2025-01-24T12:00:00Z"
    }
  }'
```

Должен вернуться ответ: `{"success": true, "emailId": "test-email-123", ...}`

### 3. Проверка в Resend Dashboard

1. Отправьте тестовое письмо на `partner@padelo2.com`
2. В Resend Dashboard → Inbox → проверьте, что письмо получено
3. Проверьте логи webhook в Resend Dashboard → Webhooks → Logs
4. Проверьте, что письмо появилось в административной панели в разделе "Входящие"

### 4. Проверка логов в Resend

1. В Resend Dashboard → Inbox → Webhooks → Logs
2. Проверьте последние запросы к webhook
3. Обратите внимание на:
   - Статус ответа (должен быть 200)
   - Время запроса
   - Тело запроса (request body)
   - Ответ сервера (response)

### 5. Проверка логов в Vercel

1. Войдите в [Vercel Dashboard](https://vercel.com)
2. Выберите проект PadelO2
3. Перейдите в раздел **Functions** → **Logs**
4. Ищите записи с `[Incoming Emails Webhook]`
5. Проверьте:
   - Приходят ли запросы от Resend
   - Есть ли ошибки при обработке
   - Сохраняются ли письма в БД

### 6. Проверка базы данных

Подключитесь к БД и выполните:

```sql
-- Проверка существования таблицы
SHOW TABLES LIKE 'incoming_emails';

-- Проверка структуры таблицы
DESCRIBE incoming_emails;

-- Проверка данных
SELECT * FROM incoming_emails ORDER BY received_at DESC LIMIT 10;

-- Проверка количества записей
SELECT COUNT(*) as total FROM incoming_emails;
```

## Устранение проблем

### Проблема: Webhook получает 301 редирект (HTTP status code 301 - Moved Permanently)

**Причина:** Resend отправляет запрос на неправильный URL (HTTP вместо HTTPS или с www).

**Решение:**
1. **Проверьте URL в настройках webhook в Resend:**
   - Откройте Resend Dashboard → Inbox → Webhooks
   - Найдите ваш webhook и откройте его для редактирования
   - Убедитесь, что URL точно: `https://padelo2.com/api/admin/partner-emails/incoming`
   - ❌ НЕ должно быть: `http://padelo2.com/...` (HTTP)
   - ❌ НЕ должно быть: `https://www.padelo2.com/...` (с www)
   - ✅ Должно быть: `https://padelo2.com/...` (HTTPS, без www)

2. **Обновите URL:**
   - Измените URL на правильный (если нужно)
   - Сохраните изменения
   - Resend автоматически повторит неудачные запросы

3. **Проверьте логи в Resend:**
   - После обновления URL проверьте логи webhook
   - Статус должен измениться с 301 на 200 (OK)

4. **Проверьте логи Vercel:**
   - Войдите в Vercel Dashboard → ваш проект → Functions → Logs
   - Ищите записи с `[Incoming Emails Webhook]`
   - Если запросы приходят, вы увидите логи

### Проблема: Webhook не получает запросы

**Причины:**
- Webhook не настроен в Resend
- Неправильный URL в настройках webhook
- Inbound не настроен для домена

**Решение:**
1. Проверьте настройки webhook в Resend Dashboard
2. Убедитесь, что URL правильный: `https://padelo2.com/api/admin/partner-emails/incoming`
3. Настройте Inbound для домена в Resend
4. Проверьте, что URL webhook доступен из интернета (не localhost)
5. Используйте ngrok для локальной разработки: `ngrok http 3000`

### Проблема: Webhook получает запросы, но письма не сохраняются

**Причины:**
- Ошибка при парсинге JSON
- Ошибка при сохранении в БД
- Неправильный формат данных от Resend

**Решение:**
1. Проверьте логи в Vercel с `[Incoming Emails Webhook]`
2. Проверьте формат данных в логах Resend
3. Проверьте структуру таблицы в БД
4. Проверьте подключение к БД
5. Проверьте, что таблица `incoming_emails` создана (создается автоматически)

### Проблема: Письма не отображаются в UI

**Причины:**
- Проблема с запросом GET к API
- Проблема с авторизацией
- Проблема с фронтендом

**Решение:**
1. Обновите страницу в браузере
2. Нажмите кнопку "🔄 Обновить" в разделе "Входящие"
3. Проверьте консоль браузера на наличие ошибок
4. Проверьте, что запрос к `/api/admin/partner-emails/incoming` возвращает данные
5. Проверьте ответ API в Network tab
6. Проверьте авторизацию пользователя

### Проблема: Ошибка 422 от Resend API (validation_error: The `id` must be a valid UUID)

**Причина:** Код пытается использовать Resend API для получения входящих писем, но API требует UUID для получения конкретного письма и не поддерживает список без параметров.

**Решение:**
- Эта проблема исправлена в коде - синхронизация через API отключена, так как Resend Inbox работает только через webhook
- Используйте только webhook для получения входящих писем

## Дополнительные настройки

### Автоматическое обновление списка писем

Можно добавить автоматическое обновление каждые 30 секунд:

```typescript
// В EmailTemplatesContent.tsx
useEffect(() => {
  if (activeTab === 'incoming') {
    const interval = setInterval(fetchIncomingEmails, 30000);
    return () => clearInterval(interval);
  }
}, [activeTab]);
```

### Уведомления о новых письмах

Можно добавить уведомления в браузере при получении нового письма:

```typescript
// Проверка новых писем
const [lastEmailId, setLastEmailId] = useState<number | null>(null);

useEffect(() => {
  if (incomingEmails.length > 0) {
    const latestId = incomingEmails[0].id;
    if (lastEmailId && latestId > lastEmailId) {
      // Показать уведомление
      if (Notification.permission === 'granted') {
        new Notification('Новое письмо', {
          body: incomingEmails[0].subject,
        });
      }
    }
    setLastEmailId(latestId);
  }
}, [incomingEmails]);
```

## Улучшения в коде

Внесены следующие улучшения:

1. ✅ Добавлено поле `emailsCount` в ответ API
2. ✅ Улучшено логирование в POST endpoint
3. ✅ Добавлена обработка ошибок парсинга JSON
4. ✅ Добавлена обработка ошибок БД
5. ✅ Добавлен тестовый endpoint `/api/admin/partner-emails/incoming/test`
6. ✅ Улучшена диагностика проблем
7. ✅ Исправлена проблема с синхронизацией через API (отключена, так как требует UUID)

## Полезные ссылки

- [Resend Documentation](https://resend.com/docs)
- [Resend Inbox Setup](https://resend.com/docs/inbox)
- [Resend Webhooks](https://resend.com/docs/webhooks)
