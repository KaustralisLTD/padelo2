import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import { UserRole } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';

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

    // For now, we'll save custom templates to a custom-templates directory
    // This allows preserving original templates while allowing customizations
    const templatesDir = path.join(process.cwd(), 'custom-email-templates');
    
    // Ensure directory exists
    try {
      await fs.mkdir(templatesDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, that's fine
    }

    // Save the custom template
    const templateFileName = `${templateId}-${Date.now()}.html`;
    const templatePath = path.join(templatesDir, templateFileName);
    
    await fs.writeFile(templatePath, html, 'utf-8');

    // Also save as the latest version (overwrite)
    const latestTemplatePath = path.join(templatesDir, `${templateId}-latest.html`);
    await fs.writeFile(latestTemplatePath, html, 'utf-8');

    // Save metadata about the template
    const metadataPath = path.join(templatesDir, `${templateId}-metadata.json`);
    const metadata = {
      templateId,
      savedAt: new Date().toISOString(),
      savedBy: access.userId,
      templateType,
      version: Date.now(),
    };
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'Template saved successfully',
      templatePath: templateFileName,
    });
  } catch (error: any) {
    console.error('[Save Template] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save template' },
      { status: 500 }
    );
  }
}

