import { NextRequest, NextResponse } from 'next/server';
import { getSession, findUserById } from '@/lib/users';
import { getDbPool } from '@/lib/db';
import { logAction } from '@/lib/audit-log';
import { createMissingMatchesForGroup } from '@/lib/matches';

/**
 * PUT - переместить пару в другую группу
 */
export async function PUT(
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

    const body = await request.json();
    const { pairId, targetGroupId } = body;

    if (!pairId || !targetGroupId) {
      return NextResponse.json(
        { error: 'pairId and targetGroupId are required' },
        { status: 400 }
      );
    }

    const pool = getDbPool();
    
    // Получаем информацию о перемещаемой паре (сохраняем оригинальный pair_number)
    const [currentPairInfo] = await pool.execute(
      'SELECT pair_number, group_id FROM tournament_group_pairs WHERE id = ?',
      [pairId]
    ) as any[];
    
    if (!currentPairInfo || currentPairInfo.length === 0) {
      return NextResponse.json({ error: 'Pair not found' }, { status: 404 });
    }
    
    const originalPairNumber = currentPairInfo[0].pair_number;
    const sourceGroupId = currentPairInfo[0].group_id;
    
    // Проверяем, свободен ли оригинальный номер в целевой группе
    const [existingPair] = await pool.execute(
      'SELECT id FROM tournament_group_pairs WHERE group_id = ? AND pair_number = ?',
      [targetGroupId, originalPairNumber]
    ) as any[];
    
    let newPairNumber = originalPairNumber;
    
    // Если номер занят, находим следующий свободный номер
    if (existingPair && existingPair.length > 0) {
      // Находим максимальный номер в целевой группе
    const [maxPair] = await pool.execute(
      'SELECT COALESCE(MAX(pair_number), 0) as max_num FROM tournament_group_pairs WHERE group_id = ?',
      [targetGroupId]
    ) as any[];
    
      newPairNumber = maxPair[0].max_num + 1;
    }
    
    // Удаляем старые матчи, связанные с этой парой в исходной группе
    // (матчи, где эта пара была pair1_id или pair2_id)
    await pool.execute(
      `DELETE FROM tournament_matches 
       WHERE group_id = ? AND (pair1_id = ? OR pair2_id = ?)`,
      [sourceGroupId, pairId, pairId]
    );
    
    console.log(`[Move Pair] Deleted matches for pair ${pairId} from source group ${sourceGroupId}`);

    // Обновляем пару (сохраняем уникальный id, меняем только group_id и pair_number)
    await pool.execute(
      'UPDATE tournament_group_pairs SET group_id = ?, pair_number = ? WHERE id = ?',
      [targetGroupId, newPairNumber, pairId]
    );

    // Пересоздаем матчи для исходной группы (без перемещенной пары)
    try {
      const sourceResult = await createMissingMatchesForGroup(sourceGroupId);
      console.log(`[Move Pair] Recreated ${sourceResult.created} matches for source group ${sourceGroupId}`);
    } catch (error) {
      console.error(`[Move Pair] Error recreating matches for source group ${sourceGroupId}:`, error);
    }

    // Пересоздаем матчи для целевой группы (с перемещенной парой)
    try {
      const targetResult = await createMissingMatchesForGroup(targetGroupId);
      console.log(`[Move Pair] Recreated ${targetResult.created} matches for target group ${targetGroupId}`);
    } catch (error) {
      console.error(`[Move Pair] Error recreating matches for target group ${targetGroupId}:`, error);
    }

    // Логируем перемещение пары
    const user = await findUserById(session.userId);
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await logAction('update', 'pair', {
      userId: session.userId,
      userEmail: user?.email,
      userRole: session.role,
      entityId: pairId,
      details: { 
        action: 'move',
        sourceGroupId,
        targetGroupId,
        originalPairNumber,
        newPairNumber,
        pairId: pairId, // Сохраняем уникальный ID пары
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error moving pair:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to move pair' },
      { status: 500 }
    );
  }
}

