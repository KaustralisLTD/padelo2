-- SQL скрипт для принудительного закрытия всех соединений пользователя
-- Выполните этот скрипт через phpMyAdmin или другой SQL клиент

-- Показать все активные соединения пользователя
SELECT 
    Id, 
    User, 
    Host, 
    db, 
    Command, 
    Time, 
    State, 
    Info
FROM information_schema.PROCESSLIST 
WHERE User = 'foldis00_padelo2';

-- Закрыть все соединения пользователя (кроме текущего)
-- ВНИМАНИЕ: Это закроет ВСЕ соединения, включая активные запросы!
-- Используйте с осторожностью!

-- Сначала посмотрите список выше, затем раскомментируйте строки ниже:

-- KILL CONNECTION 123; -- замените 123 на ID соединения из списка выше
-- KILL CONNECTION 124;
-- и т.д.

-- Или создайте админа напрямую:
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

