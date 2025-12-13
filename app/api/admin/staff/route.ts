import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import {
  getStaffTournamentAccess,
  createStaffTournamentAccess,
  updateStaffTournamentAccess,
  deleteStaffTournamentAccess,
  type StaffTournamentAccess,
} from '@/lib/tournaments';
import { getAllUsers } from '@/lib/users';
import { getAllTournaments } from '@/lib/tournaments';

// GET - получить доступы сотрудников
export async function GET(request: NextRequest) {
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
    const tournamentId = searchParams.get('tournamentId');
    const userId = searchParams.get('userId');

    const access = await getStaffTournamentAccess(
      tournamentId ? parseInt(tournamentId) : undefined,
      userId || undefined
    );

    // Если нужны полные данные, получаем пользователей и турниры
    if (searchParams.get('includeDetails') === 'true') {
      const users = await getAllUsers();
      const tournaments = await getAllTournaments();

      const accessWithDetails = access.map((a) => {
        const user = users.find((u) => u.id === a.userId);
        const tournament = tournaments.find((t) => t.id === a.tournamentId);
        return {
          ...a,
          userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
          userEmail: user?.email || 'Unknown',
          tournamentName: tournament?.name || 'Unknown',
        };
      });

      return NextResponse.json({ access: accessWithDetails, users, tournaments });
    }

    return NextResponse.json({ access });
  } catch (error: any) {
    console.error('Error getting staff access:', error);
    return NextResponse.json({ error: 'Failed to get staff access' }, { status: 500 });
  }
}

// POST - создать доступ сотрудника к турниру
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
      userId,
      tournamentId,
      userRole, // Добавляем поддержку роли из запроса
      canManageGroups = true,
      canManageMatches = true,
      canViewRegistrations = true,
      canManageUsers = false,
      canManageLogs = false,
      canManageTournaments = false,
      canSendEmails = false,
    } = body;

    if (!userId || !tournamentId) {
      return NextResponse.json(
        { error: 'userId and tournamentId are required' },
        { status: 400 }
      );
    }

    // Обновляем роль пользователя в таблице users, если она указана
    if (userRole) {
      try {
        const { updateUser } = await import('@/lib/users');
        await updateUser(userId, { role: userRole as any }, false); // false = не отправлять email уведомление
        console.log(`[Staff Access] Updated user role to ${userRole} for user ${userId}`);
      } catch (roleError: any) {
        console.error('[Staff Access] Error updating user role:', roleError);
        // Не прерываем создание доступа, если обновление роли не удалось
      }
    }

    const access = await createStaffTournamentAccess({
      userId,
      tournamentId,
      canManageGroups,
      canManageMatches,
      canViewRegistrations,
      canManageUsers,
      canManageLogs,
      canManageTournaments,
      canSendEmails,
    });

    // Send email notification to the staff member
    try {
      const { findUserById } = await import('@/lib/users');
      const { getTournament } = await import('@/lib/tournaments');
      const { sendEmail } = await import('@/lib/email');
      const { generateEmailTemplateHTML } = await import('@/lib/email-template-generator');
      
      const user = await findUserById(userId);
      const tournament = await getTournament(tournamentId);
      
      if (user && tournament && user.email) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com';
        const userLocale = (user as any).preferredLanguage || 'en';
        const adminPanelUrl = `${siteUrl}/${userLocale}/admin/dashboard`;
        
        const emailHTML = await generateEmailTemplateHTML({
          templateId: 'staff-access-granted',
          data: {
            firstName: user.firstName,
            lastName: user.lastName,
            tournamentName: tournament.name,
            permissions: {
              canManageGroups,
              canManageMatches,
              canViewRegistrations,
              canManageUsers,
              canManageLogs,
              canManageTournaments,
              canSendEmails,
            },
            adminPanelUrl,
            locale: userLocale,
          },
          locale: userLocale,
        });
        
        const emailSubject = userLocale === 'en' 
          ? `Admin Access Granted - ${tournament.name}`
          : userLocale === 'ru'
          ? `Предоставлен доступ к админ-панели - ${tournament.name}`
          : userLocale === 'ua'
          ? `Надано доступ до адмін-панелі - ${tournament.name}`
          : `Admin Access Granted - ${tournament.name}`;
        
        await sendEmail({
          to: user.email,
          subject: emailSubject,
          html: emailHTML,
          locale: userLocale,
        });
        
        console.log(`[Staff Access] Email notification sent to ${user.email}`);
      }
    } catch (emailError) {
      // Log error but don't fail the request
      console.error('[Staff Access] Error sending email notification:', emailError);
    }

    return NextResponse.json({ access }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating staff access:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create staff access' },
      { status: 500 }
    );
  }
}

// PUT - обновить доступ сотрудника
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
    const { userId, tournamentId, ...updates } = body;

    if (!userId || !tournamentId) {
      return NextResponse.json(
        { error: 'userId and tournamentId are required' },
        { status: 400 }
      );
    }

    const access = await updateStaffTournamentAccess(userId, tournamentId, updates);
    return NextResponse.json({ access });
  } catch (error: any) {
    console.error('Error updating staff access:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update staff access' },
      { status: 500 }
    );
  }
}

// DELETE - удалить доступ сотрудника
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
    const userId = searchParams.get('userId');
    const tournamentId = searchParams.get('tournamentId');

    if (!userId || !tournamentId) {
      return NextResponse.json(
        { error: 'userId and tournamentId are required' },
        { status: 400 }
      );
    }

    const success = await deleteStaffTournamentAccess(userId, parseInt(tournamentId));
    if (!success) {
      return NextResponse.json({ error: 'Access not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting staff access:', error);
    return NextResponse.json({ error: 'Failed to delete staff access' }, { status: 500 });
  }
}

