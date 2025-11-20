// Tournament registration storage
// Uses database in production, in-memory storage in development

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
      
      await pool.execute(
        `INSERT INTO tournament_registrations (
          token, tournament_id, user_id, tournament_name, locale,
          first_name, last_name, email, telegram, phone,
          categories, tshirt_size, message,
          partner_name, partner_email, partner_phone,
          partner_tshirt_size, partner_photo_name, partner_photo_data,
          confirmed, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          JSON.stringify(registration.categories),
          registration.tshirtSize,
          registration.message || null,
          registration.partner?.name || null,
          registration.partner?.email || null,
          registration.partner?.phone || null,
          registration.partner?.tshirtSize || null,
          registration.partner?.photoName || null,
          registration.partner?.photoData || null,
          false,
          new Date(),
        ]
      );
    } catch (error) {
      console.error('Database save error:', error);
      // Fallback to in-memory storage
      registrations.set(token, registration);
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
      
      const [rows] = await pool.execute(
        `SELECT * FROM tournament_registrations WHERE token = ?`,
        [token]
      ) as any[];
      
      if (rows.length === 0) {
        return undefined;
      }
      
      const row = rows[0];
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

