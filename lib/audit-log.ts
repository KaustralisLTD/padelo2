/**
 * Audit Log System
 * Логирует все действия пользователей и админов
 */

import { getDbPool } from './db';
import { NextRequest } from 'next/server';

export interface AuditLogEntry {
  id?: number;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  action: string; // 'create', 'update', 'delete', 'login', 'logout', 'register', etc.
  entityType: string; // 'tournament', 'user', 'pair', 'match', 'schedule', etc.
  entityId?: string | number;
  details?: Record<string, any>; // Дополнительные детали действия
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date;
}

const useDatabase = !!(
  process.env.DATABASE_HOST &&
  process.env.DATABASE_USER &&
  process.env.DATABASE_PASSWORD &&
  process.env.DATABASE_NAME
);

/**
 * Создать запись в логе аудита
 */
export async function logAction(
  action: string,
  entityType: string,
  options: {
    userId?: string;
    userEmail?: string;
    userRole?: string;
    entityId?: string | number;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  } = {}
): Promise<void> {
  try {
    if (!useDatabase) {
      // В режиме без БД просто логируем в консоль
      console.log('[AUDIT LOG]', {
        timestamp: new Date().toISOString(),
        action,
        entityType,
        ...options,
      });
      return;
    }

    const pool = getDbPool();
    
    // Проверяем, существует ли таблица audit_logs
    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id INT(11) NOT NULL AUTO_INCREMENT,
          user_id VARCHAR(36) DEFAULT NULL,
          user_email VARCHAR(255) DEFAULT NULL,
          user_role VARCHAR(50) DEFAULT NULL,
          action VARCHAR(100) NOT NULL,
          entity_type VARCHAR(100) NOT NULL,
          entity_id VARCHAR(255) DEFAULT NULL,
          details JSON DEFAULT NULL,
          ip_address VARCHAR(45) DEFAULT NULL,
          user_agent TEXT DEFAULT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          INDEX idx_user (user_id),
          INDEX idx_action (action),
          INDEX idx_entity (entity_type, entity_id),
          INDEX idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    } catch (error: any) {
      // Таблица уже существует или другая ошибка
      if (!error.message.includes('already exists')) {
        console.error('Error creating audit_logs table:', error);
      }
    }

    // Вставляем запись
    await pool.execute(
      `INSERT INTO audit_logs 
       (user_id, user_email, user_role, action, entity_type, entity_id, details, ip_address, user_agent, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        options.userId || null,
        options.userEmail || null,
        options.userRole || null,
        action,
        entityType,
        options.entityId ? String(options.entityId) : null,
        options.details ? JSON.stringify(options.details) : null,
        options.ipAddress || null,
        options.userAgent || null,
      ]
    );
  } catch (error: any) {
    // Не прерываем выполнение, если логирование не удалось
    console.error('Error logging audit action:', error);
  }
}

/**
 * Получить логи аудита с фильтрацией
 */
export async function getAuditLogs(filters: {
  userId?: string;
  action?: string;
  entityType?: string;
  entityId?: string | number;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
} = {}): Promise<AuditLogEntry[]> {
  if (!useDatabase) {
    return [];
  }

  try {
    const pool = getDbPool();
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params: any[] = [];

    if (filters.userId) {
      query += ' AND user_id = ?';
      params.push(filters.userId);
    }
    if (filters.action) {
      query += ' AND action = ?';
      params.push(filters.action);
    }
    if (filters.entityType) {
      query += ' AND entity_type = ?';
      params.push(filters.entityType);
    }
    if (filters.entityId) {
      query += ' AND entity_id = ?';
      params.push(String(filters.entityId));
    }
    if (filters.startDate) {
      query += ' AND created_at >= ?';
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      query += ' AND created_at <= ?';
      params.push(filters.endDate);
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
      if (filters.offset) {
        query += ' OFFSET ?';
        params.push(filters.offset);
      }
    }

    const [rows] = await pool.execute(query, params) as any[];

    return rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      userEmail: row.user_email,
      userRole: row.user_role,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      details: row.details ? JSON.parse(row.details) : null,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      createdAt: row.created_at ? (row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at) : new Date().toISOString(),
    }));
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    console.error('Error details:', error.message, error.stack);
    return [];
  }
}

/**
 * Получить IP адрес из запроса
 */
export function getIpAddress(request: Request | NextRequest): string | undefined {
  if (request instanceof Request) {
    // Для стандартного Request
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return request.headers.get('x-real-ip') || undefined;
  } else {
    // Для NextRequest
    const nextRequest = request as NextRequest;
    const forwarded = nextRequest.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return nextRequest.headers.get('x-real-ip') || undefined;
  }
}

/**
 * Получить User-Agent из запроса
 */
export function getUserAgent(request: Request | NextRequest): string | undefined {
  if (request instanceof Request) {
    return request.headers.get('user-agent') || undefined;
  } else {
    const nextRequest = request as NextRequest;
    return nextRequest.headers.get('user-agent') || undefined;
  }
}

