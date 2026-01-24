import { NextRequest, NextResponse } from 'next/server';

/**
 * Health check endpoint для проверки доступности webhook
 * Используется Resend для проверки доступности endpoint перед отправкой webhook
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    service: 'incoming-emails-webhook',
    timestamp: new Date().toISOString(),
    message: 'Webhook endpoint is healthy and accessible',
  });
}

/**
 * Health check для POST запросов
 */
export async function POST(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    service: 'incoming-emails-webhook',
    timestamp: new Date().toISOString(),
    message: 'Webhook endpoint accepts POST requests',
  });
}
