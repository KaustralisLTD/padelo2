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

// POST - Move emails to folder
export async function POST(request: NextRequest) {
  const access = await checkAdminAccess(request);
  if (!access.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { emailIds, folderId, emailType } = body; // emailType: 'incoming' | 'sent'
    
    if (!Array.isArray(emailIds) || emailIds.length === 0) {
      return NextResponse.json({ error: 'Email IDs are required' }, { status: 400 });
    }
    
    if (!emailType || !['incoming', 'sent'].includes(emailType)) {
      return NextResponse.json({ error: 'Email type must be "incoming" or "sent"' }, { status: 400 });
    }

    const pool = getDbPool();
    
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
    
    // If folderId is null, remove from all folders
    if (folderId === null) {
      await pool.execute(
        'DELETE FROM email_folder_mappings WHERE email_id IN (?) AND email_type = ?',
        [emailIds, emailType]
      );
    } else {
      // Remove from all folders first, then add to new folder
      await pool.execute(
        'DELETE FROM email_folder_mappings WHERE email_id IN (?) AND email_type = ?',
        [emailIds, emailType]
      );
      
      // Add to new folder
      for (const emailId of emailIds) {
        try {
          await pool.execute(
            'INSERT INTO email_folder_mappings (email_id, folder_id, email_type) VALUES (?, ?, ?)',
            [emailId, folderId, emailType]
          );
        } catch (err: any) {
          // Ignore duplicate key errors
          if (err.code !== 'ER_DUP_ENTRY') {
            throw err;
          }
        }
      }
    }
    
    return NextResponse.json({ 
      success: true,
      moved: emailIds.length
    });
  } catch (error: any) {
    console.error('[Move to Folder] Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}
