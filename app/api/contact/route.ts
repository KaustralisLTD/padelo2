import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, message, topic, to } = body;

    // В реальном приложении здесь будет отправка email через сервис (SendGrid, Resend, etc.)
    // Для демо просто логируем данные
    console.log('Contact form submission:', {
      to,
      from: email,
      name,
      topic,
      message,
    });

    // TODO: Интегрировать с email сервисом
    // Пример с Resend:
    // await resend.emails.send({
    //   from: 'noreply@padelo2.com',
    //   to: to,
    //   subject: `New contact: ${topic}`,
    //   html: `<p>From: ${name} (${email})</p><p>${message}</p>`,
    // });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

