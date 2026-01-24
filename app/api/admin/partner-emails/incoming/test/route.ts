import { NextRequest, NextResponse } from 'next/server';

/**
 * Тестовый endpoint для проверки доступности webhook
 * Используется для диагностики проблем с получением входящих писем
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Webhook endpoint is accessible',
    timestamp: new Date().toISOString(),
    webhookUrl: `${request.nextUrl.origin}/api/admin/partner-emails/incoming`,
    instructions: {
      step1: 'Проверьте, что в Resend Dashboard настроен webhook на этот URL',
      step2: 'URL должен быть: https://padelo2.com/api/admin/partner-emails/incoming',
      step3: 'Событие должно быть: email.received',
      step4: 'Отправьте тестовое письмо на partner@padelo2.com',
      step5: 'Проверьте логи в Vercel Dashboard для запросов с [Incoming Emails Webhook]',
    },
  });
}

/**
 * Тестовый POST endpoint для симуляции webhook от Resend
 * Можно использовать для проверки обработки данных
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    return NextResponse.json({
      success: true,
      message: 'Test webhook received',
      receivedData: body,
      timestamp: new Date().toISOString(),
      note: 'Это тестовый endpoint. Реальный webhook должен идти на /api/admin/partner-emails/incoming',
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 400 });
  }
}
