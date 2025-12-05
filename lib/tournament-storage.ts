// Tournament registration storage
// Uses database in production, in-memory storage in development

import crypto from 'crypto';

interface TournamentRegistration {
  tournamentId: number;
  userId?: string | null;
  tournamentName: string;
  locale: string;
  firstName: string;
  lastName: string;
  email: string;
  telegram?: string;
  phone: string;
  categories: string[];
  tshirtSize: string;
  message?: string;
  partner?: {
    name: string;
    email: string;
    phone: string;
    tshirtSize: string;
    photoName?: string | null;
    photoData?: string | null;
  } | null;
  categoryPartners?: Record<string, {
    name: string;
    email: string;
    phone: string;
    tshirtSize: string;
    photoName?: string | null;
    photoData?: string | null;
  }>;
  userPhoto?: {
    data: string | null;
    name: string | null;
  };
  childData?: {
    firstName: string;
    lastName: string;
    photoName?: string | null;
    photoData?: string | null;
  } | null;
  parentUserId?: string | null; // Для регистраций детей - ID родителя
  registrationType?: 'participant' | 'guest'; // Тип регистрации
  token: string;
  createdAt: string;
  confirmed: boolean;
  confirmedAt?: string;
}

// In-memory storage for development (will be lost on server restart)
const registrations = new Map<string, TournamentRegistration>();

// Check if database is configured
const useDatabase = !!(
  process.env.DATABASE_HOST &&
  process.env.DATABASE_USER &&
  process.env.DATABASE_PASSWORD &&
  process.env.DATABASE_NAME
);

export async function saveRegistration(token: string, registration: TournamentRegistration): Promise<void> {
  if (useDatabase) {
    try {
      const { getDbPool } = await import('./db');
      const pool = getDbPool();
      
      // Убеждаемся, что categories всегда массив
      const categoriesArray = Array.isArray(registration.categories) ? registration.categories : [];
      // Для гостей категории не обязательны
      if (registration.registrationType !== 'guest' && categoriesArray.length === 0) {
        throw new Error('At least one category must be selected');
      }
      
      // Убеждаемся, что tshirt_size не null (если поле не заполнено, используем пустую строку)
      const tshirtSize = registration.tshirtSize || '';
      
      // Проверяем, какие поля есть в таблице, и строим запрос динамически
      // Используем NOW() для created_at вместо передачи Date объекта
      const [result] = await pool.execute(
        `INSERT INTO tournament_registrations (
          token, tournament_id, user_id, tournament_name, locale,
          first_name, last_name, email, telegram, phone,
          categories, tshirt_size, message,
          partner_name, partner_email, partner_phone,
          partner_tshirt_size, partner_photo_name, partner_photo_data,
          category_partners, user_photo_name, user_photo_data,
          child_data, parent_user_id, registration_type,
          confirmed, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, NOW())`,
        [
          token,
          registration.tournamentId,
          registration.userId || null,
          registration.tournamentName,
          registration.locale,
          registration.firstName,
          registration.lastName,
          registration.email,
          registration.telegram || null,
          registration.phone,
          JSON.stringify(categoriesArray),
          tshirtSize,
          registration.message || null,
          registration.partner?.name || null,
          registration.partner?.email || null,
          registration.partner?.phone || null,
          registration.partner?.tshirtSize || null,
          registration.partner?.photoName || null,
          registration.partner?.photoData || null,
          registration.categoryPartners ? JSON.stringify(registration.categoryPartners) : null,
          registration.userPhoto?.name || null,
          registration.userPhoto?.data || null,
          registration.childData ? JSON.stringify(registration.childData) : null,
          registration.parentUserId || null,
          registration.registrationType || 'participant',
        ]
      ) as any;
      
      // НЕ создаем отдельную регистрацию для ребенка
      // Ребенок является частью регистрации родителя (childData хранится в той же записи)
      // Это позволяет избежать дублирования регистраций на один турнир
      
      console.log(`[saveRegistration] Registration saved to database with ID: ${result.insertId}, token: ${token.substring(0, 8)}... (full length: ${token.length})`);
      
      // Проверяем, что регистрация действительно сохранилась
      const [verifyRows] = await pool.execute(
        `SELECT token FROM tournament_registrations WHERE id = ?`,
        [result.insertId]
      ) as any[];
      if (verifyRows.length > 0) {
        const savedToken = verifyRows[0].token;
        console.log(`[saveRegistration] Verification: saved token length: ${savedToken.length}, matches: ${savedToken === token}`);
        if (savedToken !== token) {
          console.error(`[saveRegistration] TOKEN MISMATCH! Expected: ${token.substring(0, 16)}..., Got: ${savedToken.substring(0, 16)}...`);
        }
      }
    } catch (error: any) {
      console.error('[saveRegistration] Database save error:', error);
      console.error('[saveRegistration] Error details:', {
        message: error.message,
        code: error.code,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage,
        errno: error.errno,
        stack: error.stack,
      });
      // Возвращаем более детальную ошибку для отладки
      const errorMessage = error.sqlMessage || error.message || 'Unknown database error';
      throw new Error(`Database save failed: ${errorMessage}`);
    }
  } else {
    registrations.set(token, registration);
  }
}

export async function getRegistration(token: string): Promise<TournamentRegistration | undefined> {
  if (useDatabase) {
    try {
      const { getDbPool } = await import('./db');
      const pool = getDbPool();
      
      console.log(`[getRegistration] Looking for token: ${token.substring(0, 8)}... (length: ${token.length})`);
      
      // Сначала проверим, есть ли вообще регистрации в таблице
      const [countRows] = await pool.execute(
        `SELECT COUNT(*) as count FROM tournament_registrations`
      ) as any[];
      console.log(`[getRegistration] Total registrations in DB: ${countRows[0].count}`);
      
      const [rows] = await pool.execute(
        `SELECT * FROM tournament_registrations WHERE token = ?`,
        [token]
      ) as any[];
      
      console.log(`[getRegistration] Found ${rows.length} registration(s) for token: ${token.substring(0, 8)}...`);
      
      if (rows.length === 0) {
        // Попробуем найти регистрацию без учета регистра (на случай проблем с кодировкой)
        const [allRows] = await pool.execute(
          `SELECT token, created_at FROM tournament_registrations WHERE token LIKE ? ORDER BY created_at DESC LIMIT 5`,
          [`${token.substring(0, 8)}%`]
        ) as any[];
        console.log(`[getRegistration] Found ${allRows.length} similar tokens (first 8 chars match)`);
        if (allRows.length > 0) {
          console.log(`[getRegistration] Sample tokens:`, allRows.map((r: any) => ({
            token: r.token.substring(0, 16) + '...',
            length: r.token.length,
            created: r.created_at
          })));
        }
        
        // Также проверим последние 5 регистраций для отладки
        const [recentRows] = await pool.execute(
          `SELECT token, created_at FROM tournament_registrations ORDER BY created_at DESC LIMIT 5`
        ) as any[];
        console.log(`[getRegistration] Most recent registrations:`, recentRows.map((r: any) => ({
          token: r.token.substring(0, 16) + '...',
          length: r.token.length,
          created: r.created_at
        })));
        
        return undefined;
      }
      
      const row = rows[0];
      
      // Безопасный парсинг categories - может быть JSON массив или строка
      let categories: string[] = [];
      try {
        if (row.categories) {
          if (typeof row.categories === 'string') {
            // Пытаемся распарсить как JSON
            try {
              const parsed = JSON.parse(row.categories);
              categories = Array.isArray(parsed) ? parsed : typeof parsed === 'string' ? [parsed] : [];
            } catch (jsonError) {
              // Если не JSON, значит это строка - преобразуем в массив
              console.warn(`[getRegistration] categories is not JSON, treating as string: ${row.categories}`);
              categories = [row.categories];
            }
          } else if (Array.isArray(row.categories)) {
            categories = row.categories;
          }
        }
      } catch (e) {
        console.error(`[getRegistration] Error parsing categories:`, e);
        categories = [];
      }
      
      // Безопасный парсинг category_partners
      let categoryPartners: Record<string, any> | undefined = undefined;
      if (row.category_partners) {
        try {
          if (typeof row.category_partners === 'string') {
            categoryPartners = JSON.parse(row.category_partners);
          } else if (typeof row.category_partners === 'object') {
            categoryPartners = row.category_partners;
          }
        } catch (e) {
          console.warn(`[getRegistration] Failed to parse category_partners as JSON: ${row.category_partners}`);
          categoryPartners = undefined;
        }
      }
      
      // Безопасный парсинг child_data
      let childData: any = undefined;
      if (row.child_data) {
        try {
          if (typeof row.child_data === 'string') {
            childData = JSON.parse(row.child_data);
          } else if (typeof row.child_data === 'object') {
            childData = row.child_data;
          }
        } catch (e) {
          console.warn(`[getRegistration] Failed to parse child_data as JSON: ${row.child_data}`);
          childData = undefined;
        }
      }
      
      return {
        tournamentId: row.tournament_id,
        tournamentName: row.tournament_name,
        userId: row.user_id,
        locale: row.locale,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        telegram: row.telegram,
        phone: row.phone,
        categories,
        tshirtSize: row.tshirt_size,
        message: row.message,
        partner: row.partner_name ? {
          name: row.partner_name,
          email: row.partner_email,
          phone: row.partner_phone,
          tshirtSize: row.partner_tshirt_size,
          photoName: row.partner_photo_name,
          photoData: row.partner_photo_data,
        } : null,
        categoryPartners,
        userPhoto: row.user_photo_data ? {
          data: row.user_photo_data,
          name: row.user_photo_name,
        } : undefined,
        childData,
        parentUserId: row.parent_user_id || undefined,
        token: row.token,
        createdAt: row.created_at.toISOString(),
        confirmed: !!row.confirmed,
        confirmedAt: row.confirmed_at ? row.confirmed_at.toISOString() : undefined,
      };
    } catch (error) {
      console.error('Database get error:', error);
      // Fallback to in-memory storage
      return registrations.get(token);
    }
  } else {
    return registrations.get(token);
  }
}

export async function confirmRegistration(token: string): Promise<boolean> {
  if (useDatabase) {
    try {
      const { getDbPool } = await import('./db');
      const pool = getDbPool();
      
      const [result] = await pool.execute(
        `UPDATE tournament_registrations 
         SET confirmed = TRUE, confirmed_at = NOW() 
         WHERE token = ? AND confirmed = FALSE`,
        [token]
      ) as any[];
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Database confirm error:', error);
      // Fallback to in-memory storage
      const registration = registrations.get(token);
      if (!registration) {
        return false;
      }
      registration.confirmed = true;
      registration.confirmedAt = new Date().toISOString();
      registrations.set(token, registration);
      return true;
    }
  } else {
    const registration = registrations.get(token);
    if (!registration) {
      return false;
    }
    registration.confirmed = true;
    registration.confirmedAt = new Date().toISOString();
    registrations.set(token, registration);
    return true;
  }
}

export async function getAllRegistrations(): Promise<TournamentRegistration[]> {
  if (useDatabase) {
    try {
      const { getDbPool } = await import('./db');
      const pool = getDbPool();
      
      const [rows] = await pool.execute(
        `SELECT * FROM tournament_registrations ORDER BY created_at DESC`
      ) as any[];
      
      return rows.map((row: any) => ({
        tournamentId: row.tournament_id,
        tournamentName: row.tournament_name,
        userId: row.user_id,
        locale: row.locale,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        telegram: row.telegram,
        phone: row.phone,
        categories: JSON.parse(row.categories),
        tshirtSize: row.tshirt_size,
        message: row.message,
        partner: row.partner_name ? {
          name: row.partner_name,
          email: row.partner_email,
          phone: row.partner_phone,
          tshirtSize: row.partner_tshirt_size,
          photoName: row.partner_photo_name,
          photoData: row.partner_photo_data,
        } : null,
        token: row.token,
        createdAt: row.created_at.toISOString(),
        confirmed: !!row.confirmed,
        confirmedAt: row.confirmed_at ? row.confirmed_at.toISOString() : undefined,
      }));
    } catch (error) {
      console.error('Database getAll error:', error);
      return Array.from(registrations.values());
    }
  } else {
    return Array.from(registrations.values());
  }
}

