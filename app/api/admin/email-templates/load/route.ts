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

  if (session.role !== 'superadmin') {
    return { authorized: false };
  }

  return { authorized: true, userId: session.userId, role: session.role };
}

export async function GET(request: NextRequest) {
  const access = await checkAdminAccess(request);
  if (!access.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    const pool = getDbPool();
    
    // Get the latest saved template (version 0 is the latest marker)
    const [templates] = await pool.execute(
      `SELECT html_content, version, created_at, updated_at 
       FROM email_templates 
       WHERE template_id = ? AND version = 0 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [templateId]
    ) as any[];

    if (templates.length === 0) {
      return NextResponse.json({ 
        html: null,
        message: 'No saved template found' 
      });
    }

    return NextResponse.json({
      html: templates[0].html_content,
      version: templates[0].version,
      savedAt: templates[0].updated_at || templates[0].created_at,
    });
  } catch (error: any) {
    console.error('[Load Template] Error:', error);
    console.error('[Load Template] Error stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Failed to load template' },
      { status: 500 }
    );
  }
}

