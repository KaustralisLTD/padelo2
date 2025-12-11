# Security Fixes - CVE-2025-55184 and CVE-2025-55183

## Уязвимости

1. **CVE-2025-55184 (High Severity - DoS)**: Злонамеренный HTTP запрос может вызвать зависание сервера
2. **CVE-2025-55183 (Medium Severity - Source Code Exposure)**: Злонамеренный запрос может раскрыть исходный код Server Actions

## Исправления

### 1. Обновление Next.js
- ✅ Обновлен Next.js с `^14.2.0` до `^14.2.34`
- ✅ Обновлен `eslint-config-next` до `^14.2.34`

### 2. Защита от раскрытия секретов (CVE-2025-55183)

**Важно**: Убедитесь, что в коде нет жестко закодированных секретов в Server Actions.

#### Настройка переменной окружения

Добавьте в `.env.local`:

```env
NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=your-32-character-secret-key-here
```

Сгенерируйте ключ:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Проверка кода

Убедитесь, что все секреты используют переменные окружения:
- ✅ `process.env.RESEND_API_KEY` - используется правильно
- ✅ `process.env.DATABASE_PASSWORD` - используется правильно
- ⚠️ `'admin123'` - используется только для инициализации дефолтного админа (не критично, но лучше вынести в env)
- ⚠️ `'temporary-secret-key-change-in-production'` - используется как fallback, лучше убрать

### 3. Рекомендации

1. **Удалите жестко закодированные пароли**:
   - Вынесите дефолтный пароль админа в переменную окружения
   - Используйте `ADMIN_DEFAULT_PASSWORD` вместо `'admin123'`

2. **Настройте NEXT_SERVER_ACTIONS_ENCRYPTION_KEY**:
   - Обязательно добавьте эту переменную в production
   - Используйте случайный 32-символьный ключ

3. **Мониторинг**:
   - Следите за логами на предмет подозрительных запросов
   - Проверяйте использование CPU на предмет DoS атак

## Проверка

После обновления:
1. Перезапустите сервер: `npm run dev`
2. Проверьте, что приложение работает корректно
3. Убедитесь, что переменная `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` установлена

## Дополнительная информация

- [Next.js Security Advisory](https://github.com/vercel/next.js/security/advisories)
- [React Server Components Security](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations#security)

