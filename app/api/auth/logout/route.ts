import { NextRequest, NextResponse } from 'next/server';
import { getSession, deleteSession, findUserById } from '@/lib/users';
import { logAction } from '@/lib/audit-log';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Token required' },
        { status: 401 }
      );
    }

    // Verify session exists
    const session = await getSession(token);
    if (!session) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Получаем информацию о пользователе для логирования
    const user = await findUserById(session.userId);

    // Delete session
    await deleteSession(token);

    // Логируем выход
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    await logAction('logout', 'user', {
      userId: session.userId,
      userEmail: user?.email,
      userRole: session.role,
      entityId: session.userId,
      details: { success: true },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}

