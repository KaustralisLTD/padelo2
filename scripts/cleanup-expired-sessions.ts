/**
 * Скрипт для очистки истекших сессий из БД
 * Можно запускать периодически (например, через cron)
 * Выполнить: npx tsx scripts/cleanup-expired-sessions.ts
 */

// Загружаем переменные окружения
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

import { getDbPool } from '../lib/db';

async function cleanupExpiredSessions() {
  try {
    console.log('🧹 Очистка истекших сессий...');
    const pool = getDbPool();
    
    // Удаляем все истекшие сессии
    const [result] = await pool.execute(
      'DELETE FROM sessions WHERE expires_at <= NOW()'
    ) as any[];
    
    const deletedCount = (result as any).affectedRows || 0;
    console.log(`✅ Удалено истекших сессий: ${deletedCount}`);
    
    // Проверяем общее количество активных сессий
    const [activeSessions] = await pool.execute(
      'SELECT COUNT(*) as count FROM sessions WHERE expires_at > NOW()'
    ) as any[];
    
    console.log(`📊 Активных сессий: ${activeSessions[0].count}`);
    
  } catch (error: any) {
    console.error('❌ Ошибка при очистке сессий:', error);
    process.exit(1);
  }
}

cleanupExpiredSessions();

