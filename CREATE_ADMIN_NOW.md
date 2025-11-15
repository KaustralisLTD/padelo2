# Создание админа через SQL

Из-за превышения лимита соединений (50), создайте админа напрямую через SQL:

## ⚠️ ВАЖНО: Сначала закройте все соединения

Перед созданием админа нужно закрыть все активные соединения. Выполните в SQL:

```sql
-- Показать все активные соединения
SHOW PROCESSLIST;

-- Закрыть все соединения для вашего пользователя (кроме текущего)
-- ВНИМАНИЕ: Это закроет ВСЕ соединения, включая активные сессии!
-- Выполняйте только если уверены!
KILL <process_id>;
```

Или подождите 5-10 минут, чтобы соединения закрылись автоматически.

## Вариант 1: Через phpMyAdmin (РЕКОМЕНДУЕТСЯ)

1. Откройте phpMyAdmin по адресу вашего хостинга
2. Выберите базу данных `foldis00_padelo2`
3. Перейдите на вкладку "SQL"
4. Выполните следующий SQL:

```sql
-- Создать или обновить админа
INSERT INTO users (id, email, password_hash, first_name, last_name, role, created_at, updated_at)
VALUES (
    UUID(),
    'admin@padelo2.com',
    '$2b$10$OItPOG3KWFiG/at.hPzGEOfQN4lbhQftuB0e1wmMsoas/MaTaFyie', -- хеш для 'admin123' (bcrypt, 10 rounds)
    'Super',
    'Admin',
    'superadmin',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
password_hash = VALUES(password_hash),
role = 'superadmin',
updated_at = NOW();

-- Проверить, что админ создан
SELECT id, email, first_name, last_name, role, created_at FROM users WHERE email = 'admin@padelo2.com';
```

## Вариант 2: Через командную строку MySQL

```bash
mysql -h foldis00.mysql.tools -u foldis00_padelo2 -p foldis00_padelo2 < scripts/create-admin-sql.sql
```

Пароль: `6p^XZbu!34`

## Данные для входа:
- **Email:** `admin@padelo2.com`
- **Password:** `admin123`
- **Role:** `superadmin`

## После создания админа

1. Подождите 2-3 минуты, чтобы соединения закрылись
2. Попробуйте войти на сайте
3. Если не получается, проверьте в SQL, что админ создан:

```sql
SELECT * FROM users WHERE email = 'admin@padelo2.com';
```

## Если проблема сохраняется

1. Проверьте, что в таблице `users` есть запись с `email = 'admin@padelo2.com'`
2. Проверьте, что `role = 'superadmin'`
3. Проверьте, что `password_hash` совпадает с хешем в скрипте
4. Попробуйте обновить пароль вручную через SQL

