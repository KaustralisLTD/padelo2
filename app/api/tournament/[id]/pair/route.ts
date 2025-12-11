import { NextRequest, NextResponse } from 'next/server';
import { getSession, findUserById } from '@/lib/users';
import { getDbPool } from '@/lib/db';
import { updateGroupPair } from '@/lib/tournaments';
import { logAction, getIpAddress, getUserAgent } from '@/lib/audit-log';

/**
 * PUT - обновить пару (переместить участника)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let body: any = {};
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (session?.role !== 'superadmin' && session?.role !== 'staff') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { pairId, player1RegistrationId, player2RegistrationId, partner1RegistrationId, partner2RegistrationId } = body;

    if (!pairId) {
      return NextResponse.json(
        { error: 'pairId is required' },
        { status: 400 }
      );
    }

    const updated = await updateGroupPair(pairId, {
      player1RegistrationId: player1RegistrationId || null,
      player2RegistrationId: player2RegistrationId || null,
      partner1RegistrationId: partner1RegistrationId || null,
      partner2RegistrationId: partner2RegistrationId || null,
    });

    // Получаем email пользователя для логирования
    const user = await findUserById(session.userId);
    const userEmail = user?.email || 'unknown';

    // Получаем информацию о пользователях, чьи пары обновляются
    const pool = getDbPool();
    const affectedUserIds: string[] = [];
    const affectedUserEmails: string[] = [];
    
    const registrationIds = [
      player1RegistrationId,
      player2RegistrationId,
      partner1RegistrationId,
      partner2RegistrationId,
    ].filter(Boolean) as number[];
    
    if (registrationIds.length > 0) {
      const placeholders = registrationIds.map(() => '?').join(',');
      const [registrations] = await pool.execute(
        `SELECT DISTINCT user_id, email FROM tournament_registrations WHERE id IN (${placeholders}) AND user_id IS NOT NULL`,
        registrationIds
      ) as any[];
      
      registrations.forEach((reg: any) => {
        if (reg.user_id && !affectedUserIds.includes(reg.user_id)) {
          affectedUserIds.push(reg.user_id);
        }
        if (reg.email && !affectedUserEmails.includes(reg.email)) {
          affectedUserEmails.push(reg.email);
        }
      });
    }

    // Логируем действие
    await logAction('update', 'pair', {
      userId: session.userId,
      userEmail: userEmail,
      userRole: session.role,
      entityId: pairId,
      details: {
        tournamentId: id,
        player1RegistrationId: player1RegistrationId || null,
        player2RegistrationId: player2RegistrationId || null,
        partner1RegistrationId: partner1RegistrationId || null,
        partner2RegistrationId: partner2RegistrationId || null,
        affectedUserIds: affectedUserIds.length > 0 ? affectedUserIds : null,
        affectedUserEmails: affectedUserEmails.length > 0 ? affectedUserEmails : null,
      },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ pair: updated });
  } catch (error: any) {
    console.error('Error updating pair:', error);
    
    // Логируем ошибку
    try {
      const session = await getSession(request.headers.get('authorization')?.replace('Bearer ', '') || '');
      if (session) {
        const user = await findUserById(session.userId);
        const userEmail = user?.email || 'unknown';
        
        await logAction('error', 'pair', {
          userId: session.userId,
          userEmail: userEmail,
          userRole: session.role,
          entityId: body?.pairId || 'unknown',
          details: {
            error: error.message,
            stack: error.stack,
            action: 'update_pair',
          },
          ipAddress: getIpAddress(request),
          userAgent: getUserAgent(request),
        });
      }
    } catch (logError) {
      // Игнорируем ошибки логирования
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update pair' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - удалить участника из пары
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (session?.role !== 'superadmin' && session?.role !== 'staff') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const pairId = searchParams.get('pairId');
    const field = searchParams.get('field'); // 'player1', 'player2', 'partner1', 'partner2'

    if (!pairId || !field) {
      return NextResponse.json(
        { error: 'pairId and field are required' },
        { status: 400 }
      );
    }

    const updates: any = {};
    if (field === 'player1') updates.player1RegistrationId = null;
    if (field === 'player2') updates.player2RegistrationId = null;
    if (field === 'partner1') updates.partner1RegistrationId = null;
    if (field === 'partner2') updates.partner2RegistrationId = null;

    const updated = await updateGroupPair(parseInt(pairId, 10), updates);

    return NextResponse.json({ pair: updated });
  } catch (error: any) {
    console.error('Error deleting pair player:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete pair player' },
      { status: 500 }
    );
  }
}

