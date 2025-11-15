import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import { getAuditLogs } from '@/lib/audit-log';

export const dynamic = 'force-dynamic';

/**
 * GET - получить логи аудита с фильтрацией (только для superadmin)
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (!session || session.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;
    const userEmail = searchParams.get('userEmail') || undefined;
    const action = searchParams.get('action') || undefined;
    const entityType = searchParams.get('entityType') || undefined;
    const entityId = searchParams.get('entityId') || undefined;
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
    const searchQuery = searchParams.get('searchQuery') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = (page - 1) * limit;

    // Получаем логи с фильтрами
    // Сначала получаем больше записей для фильтрации по userEmail и searchQuery
    let logs = await getAuditLogs({
      userId,
      action,
      entityType,
      entityId,
      startDate,
      endDate,
      limit: 1000, // Получаем больше для фильтрации на сервере
      offset: 0,
    });

    // Логируем для отладки
    console.log(`📋 Fetched ${logs.length} audit logs from database`);

    // Фильтруем по userEmail и searchQuery на сервере
    if (userEmail) {
      logs = logs.filter(log => 
        log.userEmail?.toLowerCase().includes(userEmail.toLowerCase())
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      logs = logs.filter(log => 
        log.userEmail?.toLowerCase().includes(query) ||
        log.action?.toLowerCase().includes(query) ||
        log.entityType?.toLowerCase().includes(query) ||
        log.entityId?.toString().toLowerCase().includes(query) ||
        JSON.stringify(log.details || {}).toLowerCase().includes(query) ||
        log.ipAddress?.toLowerCase().includes(query) ||
        log.userRole?.toLowerCase().includes(query)
      );
    }

    // Подсчитываем общее количество после фильтрации
    const total = logs.length;

    // Применяем пагинацию
    const startIndex = offset;
    const endIndex = startIndex + limit;
    logs = logs.slice(startIndex, endIndex);

    const hasNextPage = endIndex < total;

    return NextResponse.json({
      logs,
      total,
      page,
      limit,
      hasNextPage,
    });
  } catch (error: any) {
    console.error('❌ Error fetching audit logs:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch logs',
        logs: [],
        total: 0,
        page: 1,
        limit: 50,
        hasNextPage: false
      },
      { status: 500 }
    );
  }
}

