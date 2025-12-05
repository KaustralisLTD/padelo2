import { NextRequest, NextResponse } from 'next/server';
import { getSession, findUserById } from '@/lib/users';
import {
  getAllTournaments,
  getTournament,
  createTournament,
  updateTournament,
  type Tournament,
} from '@/lib/tournaments';
import { logAction, getIpAddress, getUserAgent } from '@/lib/audit-log';

export const dynamic = 'force-dynamic';

const parseDemoParticipantsCount = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return null;
    const parsed = parseInt(trimmed, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

// GET - получить все турниры
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (!session || (session.role !== 'superadmin' && session.role !== 'staff')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tournaments = await getAllTournaments();
    console.log(`[GET /api/admin/tournaments] Found ${tournaments.length} tournaments`);
    return NextResponse.json({ tournaments });
  } catch (error: any) {
    console.error('Error getting tournaments:', error);
    return NextResponse.json({ error: 'Failed to get tournaments' }, { status: 500 });
  }
}

// POST - создать новый турнир
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (session?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      startDate,
      endDate,
      registrationDeadline,
      location,
      locationAddress,
      locationCoordinates,
      eventSchedule,
      maxParticipants,
      priceSingleCategory,
      priceDoubleCategory,
      status = 'draft',
      demoParticipantsCount,
      registrationSettings,
      customCategories,
      guestTicket,
    } = body;

    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Name, startDate, and endDate are required' },
        { status: 400 }
      );
    }

    const normalizedDemoCount = parseDemoParticipantsCount(demoParticipantsCount);

    // Auto-translate description and eventSchedule if provided
    let translatedDescription: Record<string, string> | undefined;
    let translatedEventSchedule: Record<string, any> | undefined;
    
    if (description || eventSchedule) {
      const sourceLocale = body.sourceLocale || 'en';
      const { translateTournamentDescription, translateEventSchedule, storeTournamentTranslations } = await import('@/lib/translation-utils');
      
      if (description) {
        translatedDescription = await translateTournamentDescription(description, sourceLocale);
      }
      
      if (eventSchedule && Array.isArray(eventSchedule) && eventSchedule.length > 0) {
        translatedEventSchedule = await translateEventSchedule(eventSchedule, sourceLocale);
      }
    }

    const tournament = await createTournament({
      name,
      description,
      startDate,
      endDate,
      registrationDeadline,
      location,
      locationAddress,
      locationCoordinates,
      eventSchedule,
      maxParticipants,
      priceSingleCategory,
      priceDoubleCategory,
      status,
      demoParticipantsCount: normalizedDemoCount,
      registrationSettings,
      customCategories,
      guestTicket,
    });

    // Store translations in database
    if (translatedDescription || translatedEventSchedule) {
      const { storeTournamentTranslations } = await import('@/lib/translation-utils');
      await storeTournamentTranslations(tournament.id, {
        description: translatedDescription,
        eventSchedule: translatedEventSchedule,
      });
    }

    // Логируем создание турнира
    const user = await findUserById(session.userId);
    await logAction('create', 'tournament', {
      userId: session.userId,
      userEmail: user?.email,
      userRole: session.role,
      entityId: tournament.id,
      details: { name: tournament.name, status: tournament.status },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    }).catch(() => {}); // Игнорируем ошибки логирования

    return NextResponse.json({ tournament }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating tournament:', error);
    return NextResponse.json({ error: error.message || 'Failed to create tournament' }, { status: 500 });
  }
}

// PUT - обновить турнир
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (session?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, demoParticipantsCount, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 });
    }

    const hasDemoCountField = Object.prototype.hasOwnProperty.call(body, 'demoParticipantsCount');
    const normalizedDemoCount = hasDemoCountField ? parseDemoParticipantsCount(demoParticipantsCount) : undefined;

    // Auto-translate description and eventSchedule if updated
    let translatedDescription: Record<string, string> | undefined;
    let translatedEventSchedule: Record<string, any> | undefined;
    
    if (updates.description || updates.eventSchedule) {
      const sourceLocale = body.sourceLocale || 'en';
      const { translateTournamentDescription, translateEventSchedule, storeTournamentTranslations } = await import('@/lib/translation-utils');
      
      if (updates.description) {
        translatedDescription = await translateTournamentDescription(updates.description, sourceLocale);
      }
      
      if (updates.eventSchedule && Array.isArray(updates.eventSchedule) && updates.eventSchedule.length > 0) {
        translatedEventSchedule = await translateEventSchedule(updates.eventSchedule, sourceLocale);
      }
    }

    const tournament = await updateTournament(id, {
      ...updates,
      ...(hasDemoCountField ? { demoParticipantsCount: normalizedDemoCount ?? null } : {}),
    });

    // Store translations in database
    if (translatedDescription || translatedEventSchedule) {
      const { storeTournamentTranslations } = await import('@/lib/translation-utils');
      await storeTournamentTranslations(tournament.id, {
        description: translatedDescription,
        eventSchedule: translatedEventSchedule,
      });
    }

    // Логируем обновление турнира
    const user = await findUserById(session.userId);
    await logAction('update', 'tournament', {
      userId: session.userId,
      userEmail: user?.email,
      userRole: session.role,
      entityId: tournament.id,
      details: { name: tournament.name, updatedFields: Object.keys(updates) },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    }).catch(() => {}); // Игнорируем ошибки логирования

    return NextResponse.json({ tournament });
  } catch (error: any) {
    console.error('Error updating tournament:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      error: error.message || 'Failed to update tournament',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// DELETE - удалить турнир
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (session?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 });
    }

    // Получаем информацию о турнире перед удалением для логирования
    const tournament = await getTournament(parseInt(id, 10));

    const archived = await updateTournament(parseInt(id, 10), { status: 'archived' });

    // Логируем удаление (архивирование) турнира
    const user = await findUserById(session.userId);
    await logAction('delete', 'tournament', {
      userId: session.userId,
      userEmail: user?.email,
      userRole: session.role,
      entityId: tournament?.id,
      details: { name: tournament?.name, status: 'archived' },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    }).catch(() => {}); // Игнорируем ошибки логирования

    return NextResponse.json({ success: true, tournament: archived });
  } catch (error: any) {
    console.error('Error deleting tournament:', error);
    return NextResponse.json({ error: 'Failed to delete tournament' }, { status: 500 });
  }
}

