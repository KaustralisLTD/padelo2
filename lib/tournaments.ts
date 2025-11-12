// Tournament management utilities
import { getDbPool } from './db';

export interface Tournament {
  id: number;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  registrationDeadline?: string;
  location?: string;
  maxParticipants?: number;
  status: 'draft' | 'open' | 'closed' | 'in_progress' | 'completed';
  createdAt: string;
  updatedAt?: string;
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
  createdAt: string;
}

const useDatabase = !!(
  process.env.DATABASE_HOST &&
  process.env.DATABASE_USER &&
  process.env.DATABASE_PASSWORD &&
  process.env.DATABASE_NAME
);

// Tournaments CRUD
export async function getAllTournaments(): Promise<Tournament[]> {
  if (!useDatabase) return [];
  
  try {
    const pool = getDbPool();
    const [rows] = await pool.execute(
      'SELECT * FROM tournaments ORDER BY start_date DESC'
    ) as any[];
    
    return rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      startDate: row.start_date.toISOString(),
      endDate: row.end_date.toISOString(),
      registrationDeadline: row.registration_deadline ? row.registration_deadline.toISOString() : undefined,
      location: row.location,
      maxParticipants: row.max_participants,
      status: row.status,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at ? row.updated_at.toISOString() : undefined,
    }));
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
    
    if (rows.length === 0) return null;
    
    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      startDate: row.start_date.toISOString(),
      endDate: row.end_date.toISOString(),
      registrationDeadline: row.registration_deadline ? row.registration_deadline.toISOString() : undefined,
      location: row.location,
      maxParticipants: row.max_participants,
      status: row.status,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at ? row.updated_at.toISOString() : undefined,
    };
  } catch (error) {
    console.error('Error getting tournament:', error);
    return null;
  }
}

export async function createTournament(tournament: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tournament> {
  if (!useDatabase) {
    throw new Error('Database not configured');
  }
  
  const pool = getDbPool();
  const [result] = await pool.execute(
    `INSERT INTO tournaments (name, description, start_date, end_date, registration_deadline, location, max_participants, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      tournament.name,
      tournament.description || null,
      tournament.startDate,
      tournament.endDate,
      tournament.registrationDeadline || null,
      tournament.location || null,
      tournament.maxParticipants || null,
      tournament.status,
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
  if (tournament.maxParticipants !== undefined) {
    updates.push('max_participants = ?');
    values.push(tournament.maxParticipants);
  }
  if (tournament.status !== undefined) {
    updates.push('status = ?');
    values.push(tournament.status);
  }
  
  if (updates.length === 0) {
    const existing = await getTournament(id);
    if (!existing) throw new Error('Tournament not found');
    return existing;
  }
  
  values.push(id);
  await pool.execute(
    `UPDATE tournaments SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
  
  const updated = await getTournament(id);
  if (!updated) throw new Error('Failed to update tournament');
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
  return {
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
    `INSERT INTO staff_tournament_access (user_id, tournament_id, can_manage_groups, can_manage_matches, can_view_registrations)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       can_manage_groups = VALUES(can_manage_groups),
       can_manage_matches = VALUES(can_manage_matches),
       can_view_registrations = VALUES(can_view_registrations)`,
    [
      access.userId,
      access.tournamentId,
      access.canManageGroups,
      access.canManageMatches,
      access.canViewRegistrations,
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

