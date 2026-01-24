import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import { UserRole } from '@/lib/auth';
import { getDbPool } from '@/lib/db';

async function checkAdminAccess(request: NextRequest): Promise<{ authorized: boolean; userId?: string; role?: UserRole }> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

  if (!token) {
    return { authorized: false };
  }

  const session = await getSession(token);
  if (!session) {
    return { authorized: false };
  }

  if (session.role === 'superadmin') {
    return { authorized: true, userId: session.userId, role: session.role };
  }

  try {
    const { getStaffTournamentAccess } = await import('@/lib/tournaments');
    const staffAccess = await getStaffTournamentAccess(undefined, session.userId);
    const hasEmailPermission = staffAccess.some(access => access.canSendEmails);
    
    if (hasEmailPermission) {
      return { authorized: true, userId: session.userId, role: session.role };
    }
  } catch (error) {
    console.error('Error checking staff access:', error);
  }

  return { authorized: false };
}

// GET - List all folders
export async function GET(request: NextRequest) {
  const access = await checkAdminAccess(request);
  if (!access.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const pool = getDbPool();
    
    // Create folders table if it doesn't exist
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS email_folders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        color VARCHAR(7) DEFAULT '#00C4FF',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_name (name)
      )
    `);
    
    const [folders] = await pool.execute('SELECT * FROM email_folders ORDER BY name') as any[];
    
    return NextResponse.json({ folders });
  } catch (error: any) {
    console.error('[Folders GET] Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}

// POST - Create new folder
export async function POST(request: NextRequest) {
  const access = await checkAdminAccess(request);
  if (!access.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, color } = body;
    
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    const pool = getDbPool();
    
    // Create folders table if it doesn't exist
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS email_folders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        color VARCHAR(7) DEFAULT '#00C4FF',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_name (name)
      )
    `);
    
    // Create email_folder_mappings table if it doesn't exist
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS email_folder_mappings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email_id INT NOT NULL,
        folder_id INT NOT NULL,
        email_type ENUM('incoming', 'sent') NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_email_folder (email_id, folder_id, email_type),
        INDEX idx_email (email_id, email_type),
        INDEX idx_folder (folder_id),
        FOREIGN KEY (folder_id) REFERENCES email_folders(id) ON DELETE CASCADE
      )
    `);
    
    const [result] = await pool.execute(
      'INSERT INTO email_folders (name, color) VALUES (?, ?)',
      [name.trim(), color || '#00C4FF']
    ) as any[];
    
    return NextResponse.json({ 
      success: true,
      folder: {
        id: result.insertId,
        name: name.trim(),
        color: color || '#00C4FF',
      }
    });
  } catch (error: any) {
    console.error('[Folders POST] Error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Folder with this name already exists' }, { status: 400 });
    }
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}
