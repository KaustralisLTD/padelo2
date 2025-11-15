// Скрипт для проверки и добавления индексов производительности
import dotenv from 'dotenv';
import { resolve } from 'path';

// Загружаем переменные окружения
dotenv.config({ path: resolve(__dirname, '../.env.local') });
dotenv.config({ path: resolve(__dirname, '../.env') });

import { getDbPool } from '../lib/db';

async function checkAndAddIndexes() {
  try {
    const pool = getDbPool();
    
    console.log('🔍 Проверка индексов...\n');
    
    // Проверяем индексы на таблице users
    const [userIndexes] = await pool.execute('SHOW INDEX FROM users') as any[];
    console.log('📊 Индексы таблицы users:');
    const userIndexNames = userIndexes.map((idx: any) => idx.Key_name);
    console.log('  Существующие индексы:', userIndexNames);
    
    const hasEmailIndex = userIndexNames.some((name: string) => name === 'idx_email' || name === 'email');
    const hasRoleIndex = userIndexNames.some((name: string) => name === 'idx_role' || name === 'role');
    
    if (!hasEmailIndex) {
      console.log('  ⚠️  Индекс на email отсутствует! Добавляю...');
      try {
        await pool.execute('CREATE INDEX idx_email ON users(email)');
        console.log('  ✅ Индекс idx_email добавлен');
      } catch (error: any) {
        if (error.message.includes('Duplicate key name')) {
          console.log('  ℹ️  Индекс уже существует (возможно с другим именем)');
        } else {
          console.error('  ❌ Ошибка при добавлении индекса:', error.message);
        }
      }
    } else {
      console.log('  ✅ Индекс на email существует');
    }
    
    if (!hasRoleIndex) {
      console.log('  ⚠️  Индекс на role отсутствует! Добавляю...');
      try {
        await pool.execute('CREATE INDEX idx_role ON users(role)');
        console.log('  ✅ Индекс idx_role добавлен');
      } catch (error: any) {
        if (error.message.includes('Duplicate key name')) {
          console.log('  ℹ️  Индекс уже существует (возможно с другим именем)');
        } else {
          console.error('  ❌ Ошибка при добавлении индекса:', error.message);
        }
      }
    } else {
      console.log('  ✅ Индекс на role существует');
    }
    
    // Проверяем индексы на sessions
    console.log('\n📊 Индексы таблицы sessions:');
    const [sessionIndexes] = await pool.execute('SHOW INDEX FROM sessions') as any[];
    const sessionIndexNames = sessionIndexes.map((idx: any) => idx.Key_name);
    console.log('  Существующие индексы:', sessionIndexNames);
    
    // Проверяем размер таблицы users
    console.log('\n📈 Статистика таблицы users:');
    const [userStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_rows,
        ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
      FROM information_schema.TABLES 
      WHERE table_schema = DATABASE() 
      AND table_name = 'users'
    `) as any[];
    
    if (userStats.length > 0) {
      console.log(`  Всего строк: ${userStats[0].total_rows}`);
      console.log(`  Размер таблицы: ${userStats[0].size_mb} MB`);
    }
    
    // Проверяем производительность запроса
    console.log('\n⚡ Тест производительности запроса:');
    const startTime = Date.now();
    const [testResult] = await pool.execute(
      "SELECT id, email, first_name, last_name, role FROM users WHERE email = 'admin@padelo2.com'"
    ) as any[];
    const queryTime = Date.now() - startTime;
    console.log(`  Время выполнения: ${queryTime}ms`);
    console.log(`  Найдено записей: ${testResult.length}`);
    
    if (queryTime > 1000) {
      console.log('  ⚠️  Запрос выполняется слишком долго! Возможные причины:');
      console.log('     - Отсутствует индекс на email');
      console.log('     - Таблица очень большая');
      console.log('     - Проблемы с БД');
    } else {
      console.log('  ✅ Запрос выполняется быстро');
    }
    
    console.log('\n✅ Проверка завершена');
    
  } catch (error: any) {
    console.error('❌ Ошибка при проверке индексов:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

checkAndAddIndexes();

