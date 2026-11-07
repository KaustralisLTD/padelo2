import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { directEmailLimits, isSingleEmail } from '@/lib/direct-email';
import { ensureSentEmailsTable } from '@/lib/sent-emails';
import { getSession } from '@/lib/users';

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.match(/^Bearer (\S+)$/i)?.[1];
  const session = token ? await getSession(token) : null;
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (session.role !== 'superadmin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const to = typeof body?.to === 'string' ? body.to.trim() : '';
  const subject = typeof body?.subject === 'string' ? body.subject.trim() : '';
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  const draftId = typeof body?.draftId === 'string' ? body.draftId : '';
  if (
    !isSingleEmail(to) || !subject || subject.length > directEmailLimits.subject || /[\r\n\u0000]/.test(subject)
    || !message || message.length > directEmailLimits.message || message.includes('\u0000')
    || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(draftId)
  ) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = `hello@${process.env.RESEND_FROM_DOMAIN || 'padelo2.com'}`;
  const replyTo = process.env.PADELO2_REPLY_TO_EMAIL || 'admin@padelo2.com';
  if (!apiKey || !isSingleEmail(from) || !isSingleEmail(replyTo)) {
    return NextResponse.json({ error: 'unconfigured' }, { status: 503 });
  }

  const payload = JSON.stringify({
    from: `PadelO2 <${from}>`,
    to: [to],
    reply_to: replyTo,
    subject,
    text: message,
  });
  const idempotencyKey = createHash('sha256').update(JSON.stringify([session.userId, draftId, payload])).digest('hex');

  try {
    const pool = getDbPool();
    await ensureSentEmailsTable(pool);

    // The installed Resend SDK does not expose request-level idempotency headers.
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `padelo2-direct/${idempotencyKey}`,
      },
      body: payload,
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      console.error('[Direct email] Resend rejected the request:', response.status);
      return NextResponse.json({ error: 'unconfirmed' }, { status: 502 });
    }

    const { id } = await response.json();
    if (typeof id !== 'string' || !id) throw new Error('Missing Resend email ID');

    const escapedMessage = message.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    await pool.execute(
      `INSERT INTO sent_emails (resend_id, from_email, to_email, subject, html_content, text_content)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE resend_id = VALUES(resend_id)`,
      [id, from, to, subject, `<div style="white-space:pre-wrap">${escapedMessage}</div>`, message],
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Direct email] Could not confirm send or save history:', error instanceof Error ? error.name : 'Unknown error');
    return NextResponse.json({ error: 'unconfirmed' }, { status: 503 });
  }
}
