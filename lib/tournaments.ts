// Tournament management utilities
import { getDbPool } from './db';
import {
  TournamentRegistrationSettings,
  getDefaultRegistrationSettings,
  normalizeRegistrationSettings,
} from './registration-settings';

export interface EventScheduleItem {
  title: string;
  date: string;
  time: string;
  description?: string;
}

export interface Tournament {
  id: number;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  registrationDeadline?: string;
  location?: string;
  locationAddress?: string;
  locationCoordinates?: { lat: number; lng: number };
  eventSchedule?: EventScheduleItem[];
  maxParticipants?: number;
  priceSingleCategory?: number;
  priceDoubleCategory?: number;
  status: 'draft' | 'open' | 'closed' | 'in_progress' | 'completed' | 'demo' | 'archived';
  createdAt: string;
  updatedAt?: string;
  registrationSettings: TournamentRegistrationSettings;
  registrationsTotal: number;
  registrationsConfirmed: number;
}

export interface TournamentGroup {
  id: number;
  tournamentId: number;
  category: string;
  groupName: string;
  groupNumber: number;
  maxPairs: number;
  startTime?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TournamentGroupPair {
  id: number;
  groupId: number;
  pairNumber: number;
  player1RegistrationId?: number;
  player2RegistrationId?: number;
  partner1RegistrationId?: number;
  partner2RegistrationId?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface StaffTournamentAccess {
  id: number;
  userId: string;
  tournamentId: number;
  canManageGroups: boolean;
  canManageMatches: boolean;
  canViewRegistrations: boolean;
  canManageUsers: boolean;
  canManageLogs: boolean;
  canManageTournaments: boolean;
  createdAt: string;
}

const useDatabase = !!(
  process.env.DATABASE_HOST &&
  process.env.DATABASE_USER &&
  process.env.DATABASE_PASSWORD &&
  process.env.DATABASE_NAME
);

// Tournaments CRUD
function parseRegistrationSettings(value: any): TournamentRegistrationSettings {
  try {
    if (!value) {
      return getDefaultRegistrationSettings();
    }
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return normalizeRegistrationSettings(parsed);
  } catch (error) {
    console.error('[parseRegistrationSettings] Failed to parse registration settings:', error);
    return getDefaultRegistrationSettings();
  }
}

export async function getAllTournaments(): Promise<Tournament[]> {
  if (!useDatabase) {
    console.log('[getAllTournaments] Database not configured, returning empty array');
    return [];
  }
  
  try {
    const pool = getDbPool();
    const [rows] = await pool.execute(
      'SELECT * FROM tournaments ORDER BY start_date DESC'
    ) as any[];

    const [registrationStats] = await pool.execute(
      `SELECT tournament_id,
              COUNT(*) AS totalRegistrations,
              SUM(CASE WHEN confirmed = TRUE THEN 1 ELSE 0 END) AS confirmedRegistrations
         FROM tournament_registrations
         GROUP BY tournament_id`
    ) as any[];

    const registrationMap = new Map<number, { total: number; confirmed: number }>();
    registrationStats.forEach((stat: any) => {
      registrationMap.set(stat.tournament_id, {
        total: Number(stat.totalRegistrations) || 0,
        confirmed: Number(stat.confirmedRegistrations) || 0,
      });
    });
    
    console.log(`[getAllTournaments] Found ${rows.length} tournaments in database`);
    
    return rows.map((row: any) => {
      // Safely parse JSON fields
      let locationCoordinates = undefined;
      if (row.location_coordinates) {
        try {
          locationCoordinates = typeof row.location_coordinates === 'string' 
            ? JSON.parse(row.location_coordinates) 
            : row.location_coordinates;
        } catch (e) {
          console.error(`[getAllTournaments] Error parsing location_coordinates for tournament ${row.id}:`, e);
        }
      }
      
      let eventSchedule = undefined;
      if (row.event_schedule) {
        try {
          eventSchedule = typeof row.event_schedule === 'string' 
            ? JSON.parse(row.event_schedule) 
            : row.event_schedule;
        } catch (e) {
          console.error(`[getAllTournaments] Error parsing event_schedule for tournament ${row.id}:`, e);
        }
      }
      
      const counts = registrationMap.get(row.id) || { total: 0, confirmed: 0 };
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        startDate: row.start_date ? (row.start_date instanceof Date ? row.start_date.toISOString() : new Date(row.start_date).toISOString()) : '',
        endDate: row.end_date ? (row.end_date instanceof Date ? row.end_date.toISOString() : new Date(row.end_date).toISOString()) : '',
        registrationDeadline: row.registration_deadline ? (row.registration_deadline instanceof Date ? row.registration_deadline.toISOString() : new Date(row.registration_deadline).toISOString()) : undefined,
        location: row.location,
        locationAddress: row.location_address || undefined,
        locationCoordinates,
        eventSchedule,
        maxParticipants: row.max_participants,
        priceSingleCategory: row.price_single_category ? parseFloat(row.price_single_category) : undefined,
        priceDoubleCategory: row.price_double_category ? parseFloat(row.price_double_category) : undefined,
        status: row.status,
        createdAt: row.created_at ? (row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString()) : new Date().toISOString(),
        updatedAt: row.updated_at ? (row.updated_at instanceof Date ? row.updated_at.toISOString() : new Date(row.updated_at).toISOString()) : undefined,
        registrationSettings: parseRegistrationSettings(row.registration_settings),
        registrationsTotal: counts.total,
        registrationsConfirmed: counts.confirmed,
      };
    });
  } catch (error) {
    console.error('Error getting tournaments:', error);
    return [];
  }
}

export async function getTournament(id: number): Promise<Tournament | null> {
  if (!useDatabase) return null;
  
  try {
    const pool = getDbPool();
    const [rows] = await pool.execute(
      'SELECT * FROM tournaments WHERE id = ?',
      [id]
    ) as any[];
    
    if (rows.length === 0) {
      console.error(`[getTournament] Tournament ${id} not found`);
      return null;
    }
    
    const row = rows[0];
    
    // Safely parse JSON fields
    let locationCoordinates = undefined;
    if (row.location_coordinates) {
      try {
        locationCoordinates = typeof row.location_coordinates === 'string' 
          ? JSON.parse(row.location_coordinates) 
          : row.location_coordinates;
      } catch (e) {
        console.error(`[getTournament] Error parsing location_coordinates for tournament ${id}:`, e);
      }
    }
    
    let eventSchedule = undefined;
    if (row.event_schedule) {
      try {
        eventSchedule = typeof row.event_schedule === 'string' 
          ? JSON.parse(row.event_schedule) 
          : row.event_schedule;
      } catch (e) {
        console.error(`[getTournament] Error parsing event_schedule for tournament ${id}:`, e);
      }
    }
    
    const [registrationStats] = await pool.execute(
      `SELECT 
         COUNT(*) AS totalRegistrations,
         SUM(CASE WHEN confirmed = TRUE THEN 1 ELSE 0 END) AS confirmedRegistrations
       FROM tournament_registrations
       WHERE tournament_id = ?`,
      [row.id]
    ) as any[];
    const statsRow = registrationStats[0] || { totalRegistrations: 0, confirmedRegistrations: 0 };

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      startDate: row.start_date ? (row.start_date instanceof Date ? row.start_date.toISOString() : new Date(row.start_date).toISOString()) : '',
      endDate: row.end_date ? (row.end_date instanceof Date ? row.end_date.toISOString() : new Date(row.end_date).toISOString()) : '',
      registrationDeadline: row.registration_deadline ? (row.registration_deadline instanceof Date ? row.registration_deadline.toISOString() : new Date(row.registration_deadline).toISOString()) : undefined,
      location: row.location,
      locationAddress: row.location_address || undefined,
      locationCoordinates,
      eventSchedule,
      maxParticipants: row.max_participants,
      priceSingleCategory: row.price_single_category ? parseFloat(row.price_single_category) : undefined,
      priceDoubleCategory: row.price_double_category ? parseFloat(row.price_double_category) : undefined,
      status: row.status,
      createdAt: row.created_at ? (row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString()) : new Date().toISOString(),
      updatedAt: row.updated_at ? (row.updated_at instanceof Date ? row.updated_at.toISOString() : new Date(row.updated_at).toISOString()) : undefined,
      registrationSettings: parseRegistrationSettings(row.registration_settings),
      registrationsTotal: Number(statsRow.totalRegistrations) || 0,
      registrationsConfirmed: Number(statsRow.confirmedRegistrations) || 0,
    };
  } catch (error: any) {
    console.error(`[getTournament] Error getting tournament ${id}:`, error);
    console.error('Error stack:', error.stack);
    return null;
  }
}

export async function createTournament(
  tournament: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'> & {
    registrationSettings?: TournamentRegistrationSettings;
  }
): Promise<Tournament> {
  if (!useDatabase) {
    throw new Error('Database not configured');
  }
  
  const pool = getDbPool();
  const registrationSettings = normalizeRegistrationSettings(tournament.registrationSettings);
  const [result] = await pool.execute(
    `INSERT INTO tournaments (name, description, start_date, end_date, registration_deadline, location, location_address, location_coordinates, event_schedule, max_participants, price_single_category, price_double_category, status, registration_settings)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      tournament.name,
      tournament.description || null,
      tournament.startDate,
      tournament.endDate,
      tournament.registrationDeadline || null,
      tournament.location || null,
      tournament.locationAddress || null,
      tournament.locationCoordinates ? JSON.stringify(tournament.locationCoordinates) : null,
      tournament.eventSchedule ? JSON.stringify(tournament.eventSchedule) : null,
      tournament.maxParticipants || null,
      tournament.priceSingleCategory || null,
      tournament.priceDoubleCategory || null,
      tournament.status,
      JSON.stringify(registrationSettings),
    ]
  ) as any;
  
  const created = await getTournament(result.insertId);
  if (!created) throw new Error('Failed to create tournament');
  return created;
}

export async function updateTournament(id: number, tournament: Partial<Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Tournament> {
  if (!useDatabase) {
    throw new Error('Database not configured');
  }
  
  const pool = getDbPool();
  const updates: string[] = [];
  const values: any[] = [];
  
  if (tournament.name !== undefined) {
    updates.push('name = ?');
    values.push(tournament.name);
  }
  if (tournament.description !== undefined) {
    updates.push('description = ?');
    values.push(tournament.description);
  }
  if (tournament.startDate !== undefined) {
    updates.push('start_date = ?');
    values.push(tournament.startDate);
  }
  if (tournament.endDate !== undefined) {
    updates.push('end_date = ?');
    values.push(tournament.endDate);
  }
  if (tournament.registrationDeadline !== undefined) {
    updates.push('registration_deadline = ?');
    values.push(tournament.registrationDeadline || null);
  }
  if (tournament.location !== undefined) {
    updates.push('location = ?');
    values.push(tournament.location);
  }
  if (tournament.locationAddress !== undefined) {
    updates.push('location_address = ?');
    values.push(tournament.locationAddress || null);
  }
  if (tournament.locationCoordinates !== undefined) {
    updates.push('location_coordinates = ?');
    values.push(tournament.locationCoordinates ? JSON.stringify(tournament.locationCoordinates) : null);
  }
  if (tournament.eventSchedule !== undefined) {
    updates.push('event_schedule = ?');
    values.push(tournament.eventSchedule ? JSON.stringify(tournament.eventSchedule) : null);
  }
  if (tournament.maxParticipants !== undefined) {
    updates.push('max_participants = ?');
    values.push(tournament.maxParticipants);
  }
  if (tournament.priceSingleCategory !== undefined) {
    updates.push('price_single_category = ?');
    values.push(tournament.priceSingleCategory || null);
  }
  if (tournament.priceDoubleCategory !== undefined) {
    updates.push('price_double_category = ?');
    values.push(tournament.priceDoubleCategory || null);
  }
  if (tournament.status !== undefined) {
    updates.push('status = ?');
    values.push(tournament.status);
  }
  if (tournament.registrationSettings !== undefined) {
    updates.push('registration_settings = ?');
    values.push(JSON.stringify(normalizeRegistrationSettings(tournament.registrationSettings)));
  }
  
  if (updates.length === 0) {
    const existing = await getTournament(id);
    if (!existing) throw new Error('Tournament not found');
    return existing;
  }
  
  values.push(id);
  
  try {
    await pool.execute(
      `UPDATE tournaments SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );
  } catch (error: any) {
    console.error('Error executing tournament update:', error);
    console.error('SQL:', `UPDATE tournaments SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`);
    console.error('Values:', values);
    throw new Error(`Database error: ${error.message}`);
  }
  
  const updated = await getTournament(id);
  if (!updated) {
    console.error(`Tournament ${id} not found after update`);
    throw new Error('Tournament not found after update');
  }
  return updated;
}

export async function deleteTournament(id: number): Promise<boolean> {
  if (!useDatabase) {
    throw new Error('Database not configured');
  }
  
  try {
    const pool = getDbPool();
    const [result] = await pool.execute(
      'DELETE FROM tournaments WHERE id = ?',
      [id]
    ) as any;
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error deleting tournament:', error);
    return false;
  }
}

// Tournament Groups
export async function getTournamentGroups(tournamentId: number, category?: string): Promise<TournamentGroup[]> {
  if (!useDatabase) return [];
  
  try {
    const pool = getDbPool();
    let query = 'SELECT * FROM tournament_groups WHERE tournament_id = ?';
    const params: any[] = [tournamentId];
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY category, group_number';
    
    const [rows] = await pool.execute(query, params) as any[];
    
    return rows.map((row: any) => ({
      id: row.id,
      tournamentId: row.tournament_id,
      category: row.category,
      groupName: row.group_name,
      groupNumber: row.group_number,
      maxPairs: row.max_pairs,
      startTime: row.start_time ? row.start_time.toISOString() : undefined,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at ? row.updated_at.toISOString() : undefined,
    }));
  } catch (error) {
    console.error('Error getting tournament groups:', error);
    return [];
  }
}

export async function createTournamentGroup(group: Omit<TournamentGroup, 'id' | 'createdAt' | 'updatedAt'>): Promise<TournamentGroup> {
  if (!useDatabase) {
    throw new Error('Database not configured');
  }
  
  const pool = getDbPool();
  const [result] = await pool.execute(
    `INSERT INTO tournament_groups (tournament_id, category, group_name, group_number, max_pairs, start_time)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      group.tournamentId,
      group.category,
      group.groupName,
      group.groupNumber,
      group.maxPairs,
      group.startTime || null,
    ]
  ) as any;
  
  const [rows] = await pool.execute(
    'SELECT * FROM tournament_groups WHERE id = ?',
    [result.insertId]
  ) as any[];
  
  const row = rows[0];
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    category: row.category,
    groupName: row.group_name,
    groupNumber: row.group_number,
    maxPairs: row.max_pairs,
    startTime: row.start_time ? row.start_time.toISOString() : undefined,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at ? row.updated_at.toISOString() : undefined,
  };
}

export async function updateTournamentGroup(id: number, group: Partial<Omit<TournamentGroup, 'id' | 'createdAt' | 'updatedAt'>>): Promise<TournamentGroup> {
  if (!useDatabase) {
    throw new Error('Database not configured');
  }
  
  const pool = getDbPool();
  const updates: string[] = [];
  const values: any[] = [];
  
  if (group.groupName !== undefined) {
    updates.push('group_name = ?');
    values.push(group.groupName);
  }
  if (group.maxPairs !== undefined) {
    updates.push('max_pairs = ?');
    values.push(group.maxPairs);
  }
  if (group.startTime !== undefined) {
    updates.push('start_time = ?');
    values.push(group.startTime || null);
  }
  
  if (updates.length === 0) {
    throw new Error('No updates provided');
  }
  
  values.push(id);
  await pool.execute(
    `UPDATE tournament_groups SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
  
  const [rows] = await pool.execute(
    'SELECT * FROM tournament_groups WHERE id = ?',
    [id]
  ) as any[];
  
  if (rows.length === 0) throw new Error('Group not found');
  
  const row = rows[0];
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    category: row.category,
    groupName: row.group_name,
    groupNumber: row.group_number,
    maxPairs: row.max_pairs,
    startTime: row.start_time ? row.start_time.toISOString() : undefined,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at ? row.updated_at.toISOString() : undefined,
  };
}

export async function deleteTournamentGroup(id: number): Promise<boolean> {
  if (!useDatabase) {
    throw new Error('Database not configured');
  }
  
  try {
    const pool = getDbPool();
    const [result] = await pool.execute(
      'DELETE FROM tournament_groups WHERE id = ?',
      [id]
    ) as any;
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error deleting group:', error);
    return false;
  }
}

// Group Pairs
export async function getGroupPairs(groupId: number): Promise<TournamentGroupPair[]> {
  if (!useDatabase) return [];
  
  try {
    const pool = getDbPool();
    const [rows] = await pool.execute(
      'SELECT * FROM tournament_group_pairs WHERE group_id = ? ORDER BY pair_number',
      [groupId]
    ) as any[];
    
    return rows.map((row: any) => ({
      id: row.id,
      groupId: row.group_id,
      pairNumber: row.pair_number,
      player1RegistrationId: row.player1_registration_id,
      player2RegistrationId: row.player2_registration_id,
      partner1RegistrationId: row.partner1_registration_id,
      partner2RegistrationId: row.partner2_registration_id,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at ? row.updated_at.toISOString() : undefined,
    }));
  } catch (error) {
    console.error('Error getting group pairs:', error);
    return [];
  }
}

export async function updateGroupPair(id: number, pair: Partial<Omit<TournamentGroupPair, 'id' | 'createdAt' | 'updatedAt'>>): Promise<TournamentGroupPair> {
  if (!useDatabase) {
    throw new Error('Database not configured');
  }
  
  const pool = getDbPool();
  const updates: string[] = [];
  const values: any[] = [];
  
  if (pair.player1RegistrationId !== undefined) {
    updates.push('player1_registration_id = ?');
    values.push(pair.player1RegistrationId || null);
  }
  if (pair.player2RegistrationId !== undefined) {
    updates.push('player2_registration_id = ?');
    values.push(pair.player2RegistrationId || null);
  }
  if (pair.partner1RegistrationId !== undefined) {
    updates.push('partner1_registration_id = ?');
    values.push(pair.partner1RegistrationId || null);
  }
  if (pair.partner2RegistrationId !== undefined) {
    updates.push('partner2_registration_id = ?');
    values.push(pair.partner2RegistrationId || null);
  }
  
  if (updates.length === 0) {
    throw new Error('No updates provided');
  }
  
  values.push(id);
  await pool.execute(
    `UPDATE tournament_group_pairs SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
  
  const [rows] = await pool.execute(
    'SELECT * FROM tournament_group_pairs WHERE id = ?',
    [id]
  ) as any[];
  
  if (rows.length === 0) throw new Error('Pair not found');
  
  const row = rows[0];
  const updatedPair = {
    id: row.id,
    groupId: row.group_id,
    pairNumber: row.pair_number,
    player1RegistrationId: row.player1_registration_id,
    player2RegistrationId: row.player2_registration_id,
    partner1RegistrationId: row.partner1_registration_id,
    partner2RegistrationId: row.partner2_registration_id,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at ? row.updated_at.toISOString() : undefined,
  };
  
  // Если пара была обновлена (добавлены игроки), пересоздаем матчи для группы
  // Это нужно, если пара была пустой, а теперь в ней есть игроки
  if ((pair.player1RegistrationId !== undefined || pair.player2RegistrationId !== undefined) && 
      (row.player1_registration_id !== null || row.player2_registration_id !== null)) {
    try {
      const { createMissingMatchesForGroup } = await import('./matches');
      const result = await createMissingMatchesForGroup(row.group_id);
      if (result.created > 0) {
        console.log(`[updateGroupPair] Created ${result.created} matches for group ${row.group_id} after updating pair ${id}`);
      }
    } catch (error) {
      console.error(`[updateGroupPair] Error creating matches for group ${row.group_id}:`, error);
    }
  }
  
  return updatedPair;
}

// Staff Tournament Access
export async function getStaffTournamentAccess(tournamentId?: number, userId?: string): Promise<StaffTournamentAccess[]> {
  if (!useDatabase) return [];
  
  try {
    const pool = getDbPool();
    let query = 'SELECT * FROM staff_tournament_access WHERE 1=1';
    const params: any[] = [];
    
    if (tournamentId) {
      query += ' AND tournament_id = ?';
      params.push(tournamentId);
    }
    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }
    
    const [rows] = await pool.execute(query, params) as any[];
    
    return rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      tournamentId: row.tournament_id,
      canManageGroups: !!row.can_manage_groups,
      canManageMatches: !!row.can_manage_matches,
      canViewRegistrations: !!row.can_view_registrations,
      canManageUsers: !!row.can_manage_users,
      canManageLogs: !!row.can_manage_logs,
      canManageTournaments: !!row.can_manage_tournaments,
      createdAt: row.created_at.toISOString(),
    }));
  } catch (error) {
    console.error('Error getting staff access:', error);
    return [];
  }
}

export async function createStaffTournamentAccess(access: Omit<StaffTournamentAccess, 'id' | 'createdAt'>): Promise<StaffTournamentAccess> {
  if (!useDatabase) {
    throw new Error('Database not configured');
  }
  
  const pool = getDbPool();
  const [result] = await pool.execute(
    `INSERT INTO staff_tournament_access (user_id, tournament_id, can_manage_groups, can_manage_matches, can_view_registrations, can_manage_users, can_manage_logs, can_manage_tournaments)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       can_manage_groups = VALUES(can_manage_groups),
       can_manage_matches = VALUES(can_manage_matches),
       can_view_registrations = VALUES(can_view_registrations),
       can_manage_users = VALUES(can_manage_users),
       can_manage_logs = VALUES(can_manage_logs),
       can_manage_tournaments = VALUES(can_manage_tournaments)`,
    [
      access.userId,
      access.tournamentId,
      access.canManageGroups !== undefined ? access.canManageGroups : true,
      access.canManageMatches !== undefined ? access.canManageMatches : true,
      access.canViewRegistrations !== undefined ? access.canViewRegistrations : true,
      access.canManageUsers !== undefined ? access.canManageUsers : false,
      access.canManageLogs !== undefined ? access.canManageLogs : false,
      access.canManageTournaments !== undefined ? access.canManageTournaments : false,
    ]
  ) as any;
  
  const [rows] = await pool.execute(
    'SELECT * FROM staff_tournament_access WHERE user_id = ? AND tournament_id = ?',
    [access.userId, access.tournamentId]
  ) as any[];
  
  if (rows.length === 0) throw new Error('Failed to create access');
  
  const row = rows[0];
  return {
    id: row.id,
    userId: row.user_id,
    tournamentId: row.tournament_id,
    canManageGroups: !!row.can_manage_groups,
    canManageMatches: !!row.can_manage_matches,
    canViewRegistrations: !!row.can_view_registrations,
    canManageUsers: !!row.can_manage_users,
    canManageLogs: !!row.can_manage_logs,
    canManageTournaments: !!row.can_manage_tournaments,
    createdAt: row.created_at.toISOString(),
  };
}

export async function updateStaffTournamentAccess(
  userId: string,
  tournamentId: number,
  updates: Partial<Omit<StaffTournamentAccess, 'id' | 'userId' | 'tournamentId' | 'createdAt'>>
): Promise<StaffTournamentAccess> {
  if (!useDatabase) {
    throw new Error('Database not configured');
  }
  
  const pool = getDbPool();
  const updateFields: string[] = [];
  const values: any[] = [];
  
  if (updates.canManageGroups !== undefined) {
    updateFields.push('can_manage_groups = ?');
    values.push(updates.canManageGroups);
  }
  if (updates.canManageMatches !== undefined) {
    updateFields.push('can_manage_matches = ?');
    values.push(updates.canManageMatches);
  }
  if (updates.canViewRegistrations !== undefined) {
    updateFields.push('can_view_registrations = ?');
    values.push(updates.canViewRegistrations);
  }
  if (updates.canManageUsers !== undefined) {
    updateFields.push('can_manage_users = ?');
    values.push(updates.canManageUsers);
  }
  if (updates.canManageLogs !== undefined) {
    updateFields.push('can_manage_logs = ?');
    values.push(updates.canManageLogs);
  }
  if (updates.canManageTournaments !== undefined) {
    updateFields.push('can_manage_tournaments = ?');
    values.push(updates.canManageTournaments);
  }
  
  if (updateFields.length === 0) {
    throw new Error('No updates provided');
  }
  
  values.push(userId, tournamentId);
  await pool.execute(
    `UPDATE staff_tournament_access SET ${updateFields.join(', ')} WHERE user_id = ? AND tournament_id = ?`,
    values
  );
  
  const [rows] = await pool.execute(
    'SELECT * FROM staff_tournament_access WHERE user_id = ? AND tournament_id = ?',
    [userId, tournamentId]
  ) as any[];
  
  if (rows.length === 0) throw new Error('Access not found');
  
  const row = rows[0];
  return {
    id: row.id,
    userId: row.user_id,
    tournamentId: row.tournament_id,
    canManageGroups: !!row.can_manage_groups,
    canManageMatches: !!row.can_manage_matches,
    canViewRegistrations: !!row.can_view_registrations,
    canManageUsers: !!row.can_manage_users,
    canManageLogs: !!row.can_manage_logs,
    canManageTournaments: !!row.can_manage_tournaments,
    createdAt: row.created_at.toISOString(),
  };
}

export async function deleteStaffTournamentAccess(userId: string, tournamentId: number): Promise<boolean> {
  if (!useDatabase) {
    throw new Error('Database not configured');
  }
  
  try {
    const pool = getDbPool();
    const [result] = await pool.execute(
      'DELETE FROM staff_tournament_access WHERE user_id = ? AND tournament_id = ?',
      [userId, tournamentId]
    ) as any;
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error deleting staff access:', error);
    return false;
  }
}

// Auto-create groups for category
export async function autoCreateGroupsForCategory(
  tournamentId: number,
  category: string,
  numberOfGroups: number = 4,
  pairsPerGroup: number = 4
): Promise<TournamentGroup[]> {
  if (!useDatabase) {
    throw new Error('Database not configured');
  }
  
  const groups: TournamentGroup[] = [];
  
  for (let i = 1; i <= numberOfGroups; i++) {
    const group = await createTournamentGroup({
      tournamentId,
      category,
      groupName: `Group ${i}`,
      groupNumber: i,
      maxPairs: pairsPerGroup,
    });
    groups.push(group);
    
    // Create empty pairs for the group
    const pool = getDbPool();
    for (let j = 1; j <= pairsPerGroup; j++) {
      await pool.execute(
        `INSERT INTO tournament_group_pairs (group_id, pair_number)
         VALUES (?, ?)`,
        [group.id, j]
      );
    }
  }
  
  return groups;
}

/**
 * Распределение игроков по группам для категории
 * 
 * ВАЖНО: Если участник зарегистрирован в нескольких категориях (например, male1 и mixed1),
 * он будет распределен в группы для каждой категории отдельно. Одна регистрация может
 * быть в нескольких группах одновременно (по одной на каждую категорию).
 * 
 * @param tournamentId ID турнира
 * @param category Категория (male1, male2, female1, female2, mixed1, mixed2)
 * @returns Количество распределенных участников и группы
 */
export async function distributePlayersToGroups(
  tournamentId: number,
  category: string
): Promise<{ distributed: number; groups: TournamentGroup[] }> {
  if (!useDatabase) {
    throw new Error('Database not configured');
  }
  
  const pool = getDbPool();
  
  // Получаем все подтвержденные регистрации для этой категории
  // ВАЖНО: Если регистрация содержит несколько категорий, она все равно будет найдена
  // для каждой категории отдельно, когда функция вызывается для каждой категории
  const [registrations] = await pool.execute(
    `SELECT id, token, first_name, last_name, email, partner_name, partner_email, categories
     FROM tournament_registrations
     WHERE tournament_id = ? AND confirmed = TRUE AND JSON_CONTAINS(categories, ?)`,
    [tournamentId, JSON.stringify(category)]
  ) as any[];
  
  if (registrations.length === 0) {
    throw new Error('No confirmed registrations found for this category');
  }
  
  console.log(`[distributePlayersToGroups] Found ${registrations.length} registrations for category ${category}`);
  console.log(`[distributePlayersToGroups] Note: If a player is registered in multiple categories, they will be distributed separately for each category`);
  
  // Get groups for this category
  const groups = await getTournamentGroups(tournamentId, category);
  if (groups.length === 0) {
    throw new Error('No groups found for this category. Create groups first.');
  }
  
  // Clear existing pairs in groups (optional - можно оставить существующие)
  // await pool.execute('DELETE FROM tournament_group_pairs WHERE group_id IN (?)', [groups.map(g => g.id)]);
  
  // Распределяем игроков
  // ВАЖНО: Каждая регистрация распределяется независимо для каждой категории
  // Если участник в категориях male1 и mixed1, он будет распределен в обе категории отдельно
  let distributed = 0;
  let currentGroupIndex = 0;
  let currentPairNumber = 1;
  
  // Разделяем регистрации с партнерами и без
  const withPartners: any[] = [];
  const withoutPartners: any[] = [];
  
  for (const reg of registrations) {
    // Проверяем, что регистрация действительно содержит эту категорию
    // Категории могут быть в формате JSON массива или строки
    let regCategories: string[] = [];
    try {
      if (typeof reg.categories === 'string') {
        // Попробуем распарсить как JSON
        try {
          regCategories = JSON.parse(reg.categories);
        } catch {
          // Если не JSON, попробуем как строку с запятыми
          regCategories = reg.categories.split(',').map((c: string) => c.trim());
        }
      } else if (Array.isArray(reg.categories)) {
        regCategories = reg.categories;
      }
    } catch (error) {
      console.error('Error parsing categories:', error, 'Categories:', reg.categories);
      continue;
    }
    
    if (!regCategories.includes(category)) {
      continue; // Пропускаем, если категория не найдена (на всякий случай)
    }
    
    if (reg.partner_name && reg.partner_email) {
      withPartners.push(reg);
    } else {
      withoutPartners.push(reg);
    }
  }
  
  console.log(`[distributePlayersToGroups] With partners: ${withPartners.length}, Without partners: ${withoutPartners.length}`);
  
  // First, distribute pairs (registrations with partners)
  for (const reg of withPartners) {
    const group = groups[currentGroupIndex];
    
    // Check if group has space (count only pairs with players assigned)
    const [existingPairs] = await pool.execute(
      'SELECT COUNT(*) as count FROM tournament_group_pairs WHERE group_id = ? AND player1_registration_id IS NOT NULL',
      [group.id]
    ) as any[];
    
    if (existingPairs[0].count >= group.maxPairs) {
      // Move to next group
      currentGroupIndex = (currentGroupIndex + 1) % groups.length;
      currentPairNumber = 1;
      continue;
    }
    
    // Find next available pair number in this group (use existing empty pair or create new)
    const [pairs] = await pool.execute(
      'SELECT pair_number, player1_registration_id FROM tournament_group_pairs WHERE group_id = ? ORDER BY pair_number',
      [group.id]
    ) as any[];
    
    // Find first empty pair or use next available number
    let nextPairNumber = 1;
    let foundEmpty = false;
    for (const pair of pairs) {
      if (pair.player1_registration_id === null) {
        nextPairNumber = pair.pair_number;
        foundEmpty = true;
        break;
      }
      if (pair.pair_number >= nextPairNumber) {
        nextPairNumber = pair.pair_number + 1;
      }
    }
    
    // Update existing pair or create new one
    await pool.execute(
      `UPDATE tournament_group_pairs 
       SET player1_registration_id = ?, partner1_registration_id = ?, updated_at = NOW()
       WHERE group_id = ? AND pair_number = ?`,
      [reg.id, reg.id, group.id, nextPairNumber]
    );
    
    // If no row was updated, insert new pair
    const [updateResult] = await pool.execute(
      'SELECT ROW_COUNT() as affected' 
    ) as any[];
    
    if (updateResult[0]?.affected === 0) {
      await pool.execute(
        `INSERT INTO tournament_group_pairs (group_id, pair_number, player1_registration_id, partner1_registration_id)
         VALUES (?, ?, ?, ?)`,
        [group.id, nextPairNumber, reg.id, reg.id]
      );
    }
    
    distributed++;
    currentPairNumber++;
    
    // Move to next group if current is full
    if (currentPairNumber > group.maxPairs) {
      currentGroupIndex = (currentGroupIndex + 1) % groups.length;
      currentPairNumber = 1;
    }
  }
  
  // Then, try to pair up players without partners
  // For now, we'll just add them as single players (can be paired later manually)
  for (const reg of withoutPartners) {
    const group = groups[currentGroupIndex];
    
    // Check if group has space (count only pairs with players assigned)
    const [existingPairs] = await pool.execute(
      'SELECT COUNT(*) as count FROM tournament_group_pairs WHERE group_id = ? AND player1_registration_id IS NOT NULL',
      [group.id]
    ) as any[];
    
    if (existingPairs[0].count >= group.maxPairs) {
      currentGroupIndex = (currentGroupIndex + 1) % groups.length;
      currentPairNumber = 1;
      if (currentGroupIndex === 0) break; // All groups full
      continue;
    }
    
    // Find next available pair number (use existing empty pair or create new)
    const [pairs] = await pool.execute(
      'SELECT pair_number, player1_registration_id FROM tournament_group_pairs WHERE group_id = ? ORDER BY pair_number',
      [group.id]
    ) as any[];
    
    // Find first empty pair or use next available number
    let nextPairNumber = 1;
    let foundEmpty = false;
    for (const pair of pairs) {
      if (pair.player1_registration_id === null) {
        nextPairNumber = pair.pair_number;
        foundEmpty = true;
        break;
      }
      if (pair.pair_number >= nextPairNumber) {
        nextPairNumber = pair.pair_number + 1;
      }
    }
    
    // Update existing pair or create new one
    await pool.execute(
      `UPDATE tournament_group_pairs 
       SET player1_registration_id = ?, updated_at = NOW()
       WHERE group_id = ? AND pair_number = ?`,
      [reg.id, group.id, nextPairNumber]
    );
    
    // If no row was updated, insert new pair
    const [checkResult] = await pool.execute(
      `SELECT COUNT(*) as count FROM tournament_group_pairs 
       WHERE group_id = ? AND pair_number = ? AND player1_registration_id = ?`,
      [group.id, nextPairNumber, reg.id]
    ) as any[];
    
    if (checkResult[0]?.count === 0) {
      await pool.execute(
        `INSERT INTO tournament_group_pairs (group_id, pair_number, player1_registration_id)
         VALUES (?, ?, ?)`,
        [group.id, nextPairNumber, reg.id]
      );
    }
    
    distributed++;
    currentPairNumber++;
    
    if (currentPairNumber > group.maxPairs) {
      currentGroupIndex = (currentGroupIndex + 1) % groups.length;
      currentPairNumber = 1;
      if (currentGroupIndex === 0) break;
    }
  }
  
  // После распределения игроков автоматически создаем матчи для всех групп
  console.log(`[distributePlayersToGroups] Creating matches for ${groups.length} groups...`);
  const { createMissingMatchesForGroup } = await import('./matches');
  
  for (const group of groups) {
    try {
      const result = await createMissingMatchesForGroup(group.id);
      if (result.created > 0) {
        console.log(`[distributePlayersToGroups] Created ${result.created} matches for ${group.groupName} (ID: ${group.id})`);
      }
    } catch (error) {
      console.error(`[distributePlayersToGroups] Error creating matches for group ${group.id}:`, error);
    }
  }
  
  return { distributed, groups };
}

/**
 * Подсчет участников по категориям для турнира
 * ВАЖНО: Если участник зарегистрирован в нескольких категориях (например, male1 и mixed1),
 * он считается как отдельный игрок в каждой категории.
 * 
 * @param tournamentId ID турнира
 * @returns Объект с количеством участников по каждой категории
 */
export async function countParticipantsByCategory(
  tournamentId: number
): Promise<Record<string, { total: number; withPartners: number; withoutPartners: number }>> {
  if (!useDatabase) {
    return {};
  }
  
  const pool = getDbPool();
  
  // Получаем все подтвержденные регистрации для турнира
  const [registrations] = await pool.execute(
    `SELECT id, categories, partner_name, partner_email
     FROM tournament_registrations
     WHERE tournament_id = ? AND confirmed = TRUE`,
    [tournamentId]
  ) as any[];
  
  // Инициализируем счетчики для всех возможных категорий
  const categoryCounts: Record<string, { total: number; withPartners: number; withoutPartners: number }> = {};
  
  // Проходим по каждой регистрации
  for (const reg of registrations) {
    const categories = JSON.parse(reg.categories) as string[];
    const hasPartner = !!(reg.partner_name && reg.partner_email);
    
    // Для каждой категории в регистрации увеличиваем счетчик
    // Одна регистрация может быть в нескольких категориях - считаем отдельно для каждой
    for (const category of categories) {
      if (!categoryCounts[category]) {
        categoryCounts[category] = { total: 0, withPartners: 0, withoutPartners: 0 };
      }
      
      categoryCounts[category].total++;
      if (hasPartner) {
        categoryCounts[category].withPartners++;
      } else {
        categoryCounts[category].withoutPartners++;
      }
    }
  }
  
  return categoryCounts;
}

/**
 * Получить общее количество участников турнира
 * ВАЖНО: Если участник зарегистрирован в нескольких категориях, он считается несколько раз
 * (по одному разу на каждую категорию)
 * 
 * @param tournamentId ID турнира
 * @returns Общее количество "слотов" участников (с учетом множественных категорий)
 */
export async function getTotalParticipantSlots(tournamentId: number): Promise<number> {
  if (!useDatabase) {
    return 0;
  }
  
  const pool = getDbPool();
  
  // Получаем все подтвержденные регистрации
  const [registrations] = await pool.execute(
    `SELECT categories
     FROM tournament_registrations
     WHERE tournament_id = ? AND confirmed = TRUE`,
    [tournamentId]
  ) as any[];
  
  // Считаем общее количество "слотов" (каждая категория = один слот)
  let totalSlots = 0;
  for (const reg of registrations) {
    const categories = JSON.parse(reg.categories) as string[];
    totalSlots += categories.length; // Одна регистрация = несколько слотов (по одному на категорию)
  }
  
  return totalSlots;
}

/**
 * Получить количество уникальных участников турнира
 * (независимо от количества категорий)
 * 
 * @param tournamentId ID турнира
 * @returns Количество уникальных участников
 */
export async function getUniqueParticipantCount(tournamentId: number): Promise<number> {
  if (!useDatabase) {
    return 0;
  }
  
  const pool = getDbPool();
  
  const [rows] = await pool.execute(
    `SELECT COUNT(DISTINCT email) as count
     FROM tournament_registrations
     WHERE tournament_id = ? AND confirmed = TRUE`,
    [tournamentId]
  ) as any[];
  
  return rows[0]?.count || 0;
}

