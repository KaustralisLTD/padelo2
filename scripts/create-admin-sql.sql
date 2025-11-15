-- SQL скрипт для создания админа напрямую в БД
-- Выполните через phpMyAdmin или другой SQL клиент
-- Это обойдет проблему с лимитом соединений

-- ВАЖНО: Если у вас превышен лимит соединений, сначала закройте их:
-- SHOW PROCESSLIST;
-- KILL <process_id>;

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

-- Данные для входа:
-- Email: admin@padelo2.com
-- Password: admin123
-- Role: superadmin

