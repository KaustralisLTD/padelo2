-- Скрипт для добавления индексов производительности
-- Выполнить в phpMyAdmin или через MySQL клиент

-- 1. Проверка и добавление индекса на users.email (если его нет)
-- Индекс должен быть, но проверим и добавим если отсутствует
CREATE INDEX IF NOT EXISTS idx_email ON users(email);

-- 2. Проверка и добавление индекса на users.role (если его нет)
CREATE INDEX IF NOT EXISTS idx_role ON users(role);

-- 3. Проверка индексов на sessions
CREATE INDEX IF NOT EXISTS idx_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_token_lookup ON sessions(token, expires_at);

-- 4. Проверка индексов на tournament_registrations
CREATE INDEX IF NOT EXISTS idx_email ON tournament_registrations(email);
CREATE INDEX IF NOT EXISTS idx_tournament ON tournament_registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_confirmed ON tournament_registrations(confirmed);

-- 5. Проверка индексов на tournament_groups
CREATE INDEX IF NOT EXISTS idx_tournament_category ON tournament_groups(tournament_id, category);
CREATE INDEX IF NOT EXISTS idx_tournament ON tournament_groups(tournament_id);

-- 6. Проверка индексов на tournament_matches
CREATE INDEX IF NOT EXISTS idx_group ON tournament_matches(group_id);
CREATE INDEX IF NOT EXISTS idx_match_date ON tournament_matches(match_date);
CREATE INDEX IF NOT EXISTS idx_pair1 ON tournament_matches(pair1_id);
CREATE INDEX IF NOT EXISTS idx_pair2 ON tournament_matches(pair2_id);

-- 7. Проверка индексов на tournament_group_pairs
CREATE INDEX IF NOT EXISTS idx_group ON tournament_group_pairs(group_id);
CREATE INDEX IF NOT EXISTS idx_player1 ON tournament_group_pairs(player1_registration_id);

-- 8. Оптимизация таблицы users (если нужно)
-- ANALYZE TABLE users;

-- Проверка существующих индексов
-- SHOW INDEX FROM users;
-- SHOW INDEX FROM sessions;
-- SHOW INDEX FROM tournament_registrations;
