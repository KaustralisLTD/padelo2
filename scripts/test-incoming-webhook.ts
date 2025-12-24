#!/usr/bin/env tsx
/**
 * Скрипт для тестирования webhook получения входящих писем
 * 
 * Использование:
 *   tsx scripts/test-incoming-webhook.ts
 * 
 * Или с параметрами:
 *   tsx scripts/test-incoming-webhook.ts "test@example.com" "partner@padelo2.com" "Test Subject"
 */

import 'dotenv/config';

const WEBHOOK_URL = process.env.NEXT_PUBLIC_SITE_URL 
  ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/partner-emails/incoming`
  : 'http://localhost:3000/api/admin/partner-emails/incoming';

const fromEmail = process.argv[2] || 'test@example.com';
const toEmail = process.argv[3] || 'partner@padelo2.com';
const subject = process.argv[4] || 'Test Email from Script';

const testEmail = {
  id: `test-${Date.now()}`,
  from: fromEmail,
  to: toEmail,
  subject: subject,
  html: `
    <html>
      <body>
        <h1>Тестовое письмо</h1>
        <p>Это тестовое письмо для проверки webhook получения входящих писем.</p>
        <p>От: ${fromEmail}</p>
        <p>Кому: ${toEmail}</p>
        <p>Дата: ${new Date().toLocaleString('ru-RU')}</p>
      </body>
    </html>
  `,
  text: `Тестовое письмо\n\nОт: ${fromEmail}\nКому: ${toEmail}\nДата: ${new Date().toLocaleString('ru-RU')}`,
  created_at: new Date().toISOString(),
};

async function testWebhook() {
  console.log('🧪 Тестирование webhook для входящих писем');
  console.log('📧 URL:', WEBHOOK_URL);
  console.log('📨 Данные:', JSON.stringify(testEmail, null, 2));
  console.log('');

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testEmail),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Успешно!');
      console.log('📋 Ответ:', JSON.stringify(data, null, 2));
      console.log('');
      console.log('💡 Теперь проверьте:');
      console.log('   1. База данных: SELECT * FROM incoming_emails ORDER BY received_at DESC LIMIT 1;');
      console.log('   2. Админ панель: /admin/partner-emails → вкладка "Входящие"');
    } else {
      console.error('❌ Ошибка:', response.status, response.statusText);
      console.error('📋 Ответ:', JSON.stringify(data, null, 2));
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Исключение:', error.message);
    console.error('💡 Убедитесь, что:');
    console.error('   - Сервер запущен (npm run dev)');
    console.error('   - URL правильный');
    console.error('   - База данных доступна');
    process.exit(1);
  }
}

// Также тестируем формат с оберткой (как Resend может отправлять)
async function testWrappedFormat() {
  console.log('\n🧪 Тестирование webhook в формате с оберткой (Resend format)');
  
  const wrappedEmail = {
    type: 'email.received',
    data: testEmail,
  };

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(wrappedEmail),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Успешно!');
      console.log('📋 Ответ:', JSON.stringify(data, null, 2));
    } else {
      console.error('❌ Ошибка:', response.status, response.statusText);
      console.error('📋 Ответ:', JSON.stringify(data, null, 2));
    }
  } catch (error: any) {
    console.error('❌ Исключение:', error.message);
  }
}

// Запуск тестов
testWebhook().then(() => {
  return testWrappedFormat();
}).then(() => {
  console.log('\n✨ Тестирование завершено!');
  process.exit(0);
});

