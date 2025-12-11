#!/usr/bin/env tsx
// Скрипт для ручной отправки писем через Resend
// Использование: tsx scripts/send-manual-email.ts

import { Resend } from 'resend';
import { generatePartnerEmailHTML, generateSponsorshipProposalEmailHTML } from '../lib/resend-template-helper';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

async function sendEmail(options: EmailOptions) {
  const verifiedDomain = process.env.RESEND_FROM_DOMAIN || 'padelo2.com';
  let fromEmail = options.from || process.env.SMTP_FROM || `hello@${verifiedDomain}`;
  
  // Если указан Partner@padelO2.com, но домен не верифицирован, используем Resend домен для тестирования
  if (fromEmail.includes('@padelO2.com') || fromEmail.includes('@padelo2.com')) {
    // Проверяем, есть ли верифицированный домен
    if (!process.env.RESEND_FROM_DOMAIN) {
      console.warn('⚠️  ВНИМАНИЕ: Домен padelO2.com не верифицирован в Resend.');
      console.warn('   Для тестирования используется домен Resend.');
      console.warn('   Для продакшена нужно верифицировать домен на https://resend.com/domains');
      // Используем домен Resend для тестирования
      fromEmail = 'onboarding@resend.dev';
    }
  }
  
  // Формируем имя отправителя в зависимости от email
  let fromName: string;
  if (fromEmail.toLowerCase().includes('partner') || options.from?.toLowerCase().includes('partner')) {
    fromName = `Partner <${fromEmail}>`;
  } else {
    fromName = `PadelO2 <${fromEmail}>`;
  }

  console.log(`📧 Отправка письма...`);
  console.log(`   Кому: ${options.to}`);
  console.log(`   От: ${fromName}`);
  console.log(`   Тема: ${options.subject}`);

  try {
    const result = await resend.emails.send({
      from: fromName,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (result.error) {
      console.error('❌ Ошибка:', result.error);
      return false;
    }

    console.log('✅ Письмо отправлено успешно!');
    console.log('   ID:', result.data?.id);
    return true;
  } catch (error: any) {
    console.error('❌ Ошибка отправки:', error.message);
    return false;
  }
}

// Пример: Отправка письма партнеру
async function sendPartnerEmail() {
  const partnerEmail = process.argv[2] || 'partner@example.com';
  const partnerName = process.argv[3] || 'Партнер';
  const locale = process.argv[4] || 'ru';

  const message = `
Мы хотели бы обсудить возможности партнерства с вами.

PadelO₂ - это платформа для организации турниров по паделу, которая объединяет игроков, тренеров и клубы.

Мы заинтересованы в сотрудничестве и готовы обсудить взаимовыгодные условия.

С уважением,
Команда PadelO₂
  `.trim();

  const html = generatePartnerEmailHTML({
    partnerName,
    message,
    locale,
    buttonUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com'}/${locale}/contact`,
    buttonText: locale === 'ru' ? 'Связаться с нами' : 'Contact us',
  });

  await sendEmail({
    to: partnerEmail,
    subject: locale === 'ru' ? 'Партнерство с PadelO₂' : 'Partnership with PadelO₂',
    html,
  });
}

// Отправка письма о спонсорстве
async function sendSponsorshipEmail() {
  const partnerEmail = process.argv[3] || 'partner@example.com';
  const partnerCompany = process.argv[4] || '';
  const partnerName = process.argv[5] || '';
  const locale = process.argv[6] || 'en';

  console.log(`📧 Отправка письма о спонсорстве...`);
  console.log(`   Email: ${partnerEmail}`);
  console.log(`   Компания: ${partnerCompany || '(не указана)'}`);
  console.log(`   Имя: ${partnerName || '(не указано)'}`);

  const html = generateSponsorshipProposalEmailHTML({
    partnerName,
    partnerCompany,
    locale,
  });

  await sendEmail({
    to: partnerEmail,
    subject: 'Sponsorship Proposal – UA PADEL OPEN 2025 (Costa Brava)',
    html,
    from: 'Partner@padelO2.com',
  });
}

// Пример: Отправка произвольного письма
async function sendCustomEmail() {
  const to = process.argv[2];
  const subject = process.argv[3];
  const message = process.argv[4] || '';

  if (!to || !subject) {
    console.log(`
Использование:
  Отправка письма о спонсорстве UA PADEL OPEN:
    tsx scripts/send-manual-email.ts sponsorship <email> [компания] [имя] [locale]
  
  Отправка письма партнеру:
    tsx scripts/send-manual-email.ts <email> <имя> [locale]
  
  Отправка произвольного письма:
    tsx scripts/send-manual-email.ts custom <email> <тема> <сообщение>

Примеры:
  tsx scripts/send-manual-email.ts sponsorship partner@example.com "Acerko Telecom" "Иван" en
  tsx scripts/send-manual-email.ts partner@example.com "Иван Иванов" ru
  tsx scripts/send-manual-email.ts custom user@example.com "Привет" "Это тестовое сообщение"
    `);
    return;
  }

  if (to === 'sponsorship') {
    await sendSponsorshipEmail();
  } else if (to === 'custom') {
    const email = process.argv[3];
    const emailSubject = process.argv[4];
    const emailMessage = process.argv[5] || '';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
  </style>
</head>
<body>
  <div style="background: linear-gradient(145deg, #ffffff 0, #f4f7ff 60%, #edf7ff 100%); padding: 30px; border-radius: 24px;">
    <h1 style="color: #0f172a;">PadelO<span style="font-size:1.4em; vertical-align:-1px;">₂</span></h1>
    <div style="margin: 20px 0;">
      ${emailMessage.replace(/\n/g, '<br>')}
    </div>
    <p style="color: #666; font-size: 12px; margin-top: 30px;">
      С уважением,<br>
      Команда PadelO₂
    </p>
  </div>
</body>
</html>
    `.trim();

    await sendEmail({
      to: email,
      subject: emailSubject,
      html,
    });
  } else {
    await sendPartnerEmail();
  }
}

// Запуск
if (require.main === module) {
  sendCustomEmail().catch(console.error);
}

