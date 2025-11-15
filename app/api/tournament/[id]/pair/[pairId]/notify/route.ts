import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import { getDbPool } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { sendWhatsApp } from '@/lib/whatsapp';

/**
 * POST - отправить уведомления участникам пары об изменениях
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pairId: string }> }
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

    const { id, pairId } = await params;
    const tournamentId = parseInt(id, 10);
    const pairIdNum = parseInt(pairId, 10);

    if (isNaN(tournamentId) || isNaN(pairIdNum)) {
      return NextResponse.json({ error: 'Invalid tournament or pair ID' }, { status: 400 });
    }

    const body = await request.json();
    const { player1RegistrationId, player2RegistrationId, partner1RegistrationId, partner2RegistrationId } = body;

    const pool = getDbPool();

    // Получаем информацию о турнире
    const [tournament] = await pool.execute(
      'SELECT name FROM tournaments WHERE id = ?',
      [tournamentId]
    ) as any[];

    if (tournament.length === 0) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const tournamentName = tournament[0].name;

    // Получаем информацию о регистрациях для отправки уведомлений
    const registrationIds: number[] = [];
    if (player1RegistrationId) registrationIds.push(player1RegistrationId);
    if (player2RegistrationId) registrationIds.push(player2RegistrationId);
    if (partner1RegistrationId) registrationIds.push(partner1RegistrationId);
    if (partner2RegistrationId) registrationIds.push(partner2RegistrationId);

    if (registrationIds.length === 0) {
      return NextResponse.json({ success: true, message: 'No participants to notify' });
    }

    const placeholders = registrationIds.map(() => '?').join(',');
    const [registrations] = await pool.execute(
      `SELECT id, first_name, last_name, email, phone FROM tournament_registrations WHERE id IN (${placeholders})`,
      registrationIds
    ) as any[];

    // Формируем сообщение
    const message = `Изменения в паре турнира "${tournamentName}". Пожалуйста, проверьте обновленную информацию на сайте.`;

    // Отправляем уведомления
    const emailPromises: Promise<boolean>[] = [];
    const whatsappPromises: Promise<boolean>[] = [];

    for (const reg of registrations) {
      if (reg.email) {
        emailPromises.push(
          sendEmail({
            to: reg.email,
            subject: `Изменения в паре - ${tournamentName}`,
            html: `
              <h2>Изменения в паре</h2>
              <p>Здравствуйте, ${reg.first_name} ${reg.last_name}!</p>
              <p>В вашей паре турнира "${tournamentName}" были внесены изменения.</p>
              <p>Пожалуйста, проверьте обновленную информацию на сайте.</p>
              <p>С уважением,<br>Команда PadelO₂</p>
            `,
          })
        );
      }

      if (reg.phone) {
        whatsappPromises.push(
          sendWhatsApp({
            phone: reg.phone,
            message: `Здравствуйте, ${reg.first_name}! ${message}`,
          })
        );
      }
    }

    // Ждем отправки всех уведомлений
    const emailResults = await Promise.allSettled(emailPromises);
    const whatsappResults = await Promise.allSettled(whatsappPromises);

    const emailSuccess = emailResults.filter(r => r.status === 'fulfilled' && r.value).length;
    const whatsappSuccess = whatsappResults.filter(r => r.status === 'fulfilled' && r.value).length;

    return NextResponse.json({
      success: true,
      notifications: {
        email: { sent: emailSuccess, total: emailPromises.length },
        whatsapp: { sent: whatsappSuccess, total: whatsappPromises.length },
      },
    });
  } catch (error: any) {
    console.error('Error sending notifications:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send notifications' },
      { status: 500 }
    );
  }
}

