import { NextRequest, NextResponse } from 'next/server';
import { checkTournamentAccess } from '@/lib/tournament-access';

// GET - проверить доступ пользователя к конкретному турниру
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const tournamentId = parseInt(id, 10);

    if (isNaN(tournamentId)) {
      return NextResponse.json({ error: 'Invalid tournament ID' }, { status: 400 });
    }

    // Проверяем доступ к турниру (для просмотра участников достаточно canViewRegistrations)
    const access = await checkTournamentAccess(token, tournamentId, 'canViewRegistrations');

    if (access.authorized) {
      return NextResponse.json({ hasAccess: true });
    }

    return NextResponse.json({ hasAccess: false }, { status: 403 });
  } catch (error: any) {
    console.error('Error checking tournament access:', error);
    return NextResponse.json({ error: 'Failed to check access' }, { status: 500 });
  }
}

