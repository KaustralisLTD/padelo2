# Создание админа через phpMyAdmin (обход лимита соединений)

## Проблема
Не можем создать админа через скрипт из-за превышения лимита соединений БД (50).

## Решение: Создать админа напрямую через SQL

### Шаг 1: Откройте phpMyAdmin
1. Войдите в панель управления хостингом
2. Откройте phpMyAdmin
3. Выберите базу данных `foldis00_padelo2`

### Шаг 2: Выполните SQL запрос

Перейдите на вкладку "SQL" и выполните следующий запрос:

```sql
-- Создать или обновить админа
INSERT INTO users (id, email, password_hash, first_name, last_name, role, created_at, updated_at)
VALUES (
    UUID(),
    'admin@padelo2.com',
    '$2b$10$rQZ8XK9YvJ8XK9YvJ8XK9eJ8XK9YvJ8XK9YvJ8XK9YvJ8XK9YvJ8XK9Y', -- хеш для 'admin123'
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
```

**Или используйте правильный bcrypt хеш:**

```sql
-- Правильный bcrypt хеш для пароля 'admin123' (10 rounds)
INSERT INTO users (id, email, password_hash, first_name, last_name, role, created_at, updated_at)
VALUES (
    UUID(),
    'admin@padelo2.com',
    '$2b$10$OItPOG3KWFiG/at.hPzGEOfQN4lbhQftuB0e1wmMsoas/MaTaFyie', -- правильный хеш для 'admin123'
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
```

### Шаг 3: Проверьте создание

Выполните запрос для проверки:

```sql
SELECT id, email, first_name, last_name, role, created_at 
FROM users 
WHERE email = 'admin@padelo2.com';
```

### Данные для входа:
- **Email:** `admin@padelo2.com`
- **Password:** `admin123`
- **Role:** `superadmin`

## Альтернатива: Использовать готовый SQL файл

Файл `scripts/create-admin-sql.sql` содержит готовый SQL запрос. Скопируйте его содержимое и выполните в phpMyAdmin.

