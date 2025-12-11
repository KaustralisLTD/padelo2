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

  // Only superadmin can save templates
  if (session.role !== 'superadmin') {
    return { authorized: false };
  }

  return { authorized: true, userId: session.userId, role: session.role };
}

export async function POST(request: NextRequest) {
  const access = await checkAdminAccess(request);
  if (!access.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { templateId, html, templateType = 'custom' } = body;

    if (!templateId || !html) {
      return NextResponse.json(
        { error: 'Template ID and HTML are required' },
        { status: 400 }
      );
    }

    const pool = getDbPool();
    
    // Create email_templates table if it doesn't exist
    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS email_templates (
          id VARCHAR(36) NOT NULL PRIMARY KEY,
          template_id VARCHAR(255) NOT NULL,
          html_content LONGTEXT NOT NULL,
          template_type VARCHAR(50) DEFAULT 'custom',
          saved_by VARCHAR(36),
          version BIGINT NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_template_id (template_id),
          INDEX idx_version (version)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    } catch (error: any) {
      // Table might already exist, that's fine
      if (!error.message.includes('already exists')) {
        console.error('[Save Template] Error creating table:', error);
      }
    }

    // Generate new version
    const version = Date.now();
    const templateUuid = require('crypto').randomBytes(16).toString('hex');

    // Save new version
    await pool.execute(
      `INSERT INTO email_templates (id, template_id, html_content, template_type, saved_by, version)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [templateUuid, templateId, html, templateType, access.userId, version]
    );

    // Also update the latest version marker (we'll use a special record with version 0)
    // First, delete any existing latest marker
    await pool.execute(
      `DELETE FROM email_templates WHERE template_id = ? AND version = 0`,
      [templateId]
    );

    // Insert latest marker pointing to the new version
    const latestUuid = require('crypto').randomBytes(16).toString('hex');
    await pool.execute(
      `INSERT INTO email_templates (id, template_id, html_content, template_type, saved_by, version)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [latestUuid, templateId, html, templateType, access.userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Template saved successfully',
      templateId,
      version,
    });
  } catch (error: any) {
    console.error('[Save Template] Error:', error);
    console.error('[Save Template] Error stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Failed to save template' },
      { status: 500 }
    );
  }
}

