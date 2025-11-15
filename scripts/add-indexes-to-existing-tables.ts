/**
 * Скрипт для добавления индексов к существующим таблицам
 * Выполнить: tsx scripts/add-indexes-to-existing-tables.ts
 */

// Загружаем переменные окружения из .env.local
import dotenv from 'dotenv';
import { resolve } from 'path';

// Загружаем .env.local (приоритет) или .env
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

import { getDbPool, initDatabase } from '../lib/db';

async function addIndexes() {
  try {
    console.log('🔌 Подключение к базе данных...');
    await initDatabase();
    const pool = getDbPool();

    console.log('📊 Добавление индексов к существующим таблицам...');

    // Индексы для sessions
    try {
      await pool.execute('CREATE INDEX idx_token_lookup ON sessions(token, expires_at)');
      console.log('✅ Индекс idx_token_lookup добавлен в sessions');
    } catch (e: any) {
      if (e.message.includes('Duplicate key name')) {
        console.log('ℹ️  Индекс idx_token_lookup уже существует в sessions');
      } else {
        throw e;
      }
    }

    // Дополнительные индексы для tournament_registrations (если нужны)
    // Примечание: в таблице нет поля user_id, поэтому индекс не добавляем

    // Индексы для tournament_group_pairs
    try {
      await pool.execute('CREATE INDEX idx_group_pair_number ON tournament_group_pairs(group_id, pair_number)');
      console.log('✅ Индекс idx_group_pair_number добавлен в tournament_group_pairs');
    } catch (e: any) {
      if (e.message.includes('Duplicate key name')) {
        console.log('ℹ️  Индекс idx_group_pair_number уже существует в tournament_group_pairs');
      } else {
        throw e;
      }
    }

    // Дополнительные индексы для оптимизации
    try {
      await pool.execute('CREATE INDEX idx_tournament_groups_category ON tournament_groups(category)');
      console.log('✅ Индекс idx_tournament_groups_category добавлен в tournament_groups');
    } catch (e: any) {
      if (e.message.includes('Duplicate key name')) {
        console.log('ℹ️  Индекс idx_tournament_groups_category уже существует в tournament_groups');
      } else {
        throw e;
      }
    }

    try {
      await pool.execute('CREATE INDEX idx_tournament_matches_group_date ON tournament_matches(group_id, match_date)');
      console.log('✅ Индекс idx_tournament_matches_group_date добавлен в tournament_matches');
    } catch (e: any) {
      if (e.message.includes('Duplicate key name')) {
        console.log('ℹ️  Индекс idx_tournament_matches_group_date уже существует в tournament_matches');
      } else {
        throw e;
      }
    }

    console.log('\n✅ Все индексы успешно добавлены!');
    console.log('📈 Производительность БД должна улучшиться.');

  } catch (error: any) {
    console.error('❌ Ошибка при добавлении индексов:', error);
    process.exit(1);
  }
}

addIndexes();

