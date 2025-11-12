import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { saveRegistration } from '@/lib/tournament-storage';

// Helper function to send confirmation email
async function sendConfirmationEmail(email: string, confirmationUrl: string, tournamentName: string, locale: string = 'en') {
  try {
    // Try Resend first
    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      await resend.emails.send({
        from: process.env.SMTP_FROM || 'noreply@padelo2.com',
        to: email,
        subject: `Confirm your registration for ${tournamentName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Tournament Registration Confirmation</h2>
            <p>Thank you for registering for ${tournamentName}!</p>
            <p>Please confirm your registration by clicking the link below:</p>
            <p><a href="${confirmationUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Confirm Registration</a></p>
            <p>Or copy this link: ${confirmationUrl}</p>
            <p>If you did not register for this tournament, please ignore this email.</p>
          </div>
        `,
      });
      return;
    }
    
    // Try SendGrid
    if (process.env.SENDGRID_API_KEY) {
      const sgMail = await import('@sendgrid/mail');
      sgMail.default.setApiKey(process.env.SENDGRID_API_KEY);
      
      await sgMail.default.send({
        from: process.env.SMTP_FROM || 'noreply@padelo2.com',
        to: email,
        subject: `Confirm your registration for ${tournamentName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Tournament Registration Confirmation</h2>
            <p>Thank you for registering for ${tournamentName}!</p>
            <p>Please confirm your registration by clicking the link below:</p>
            <p><a href="${confirmationUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Confirm Registration</a></p>
            <p>Or copy this link: ${confirmationUrl}</p>
          </div>
        `,
      });
      return;
    }
    
    // Try SMTP
    if (process.env.SMTP_HOST) {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
      
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: `Confirm your registration for ${tournamentName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Tournament Registration Confirmation</h2>
            <p>Thank you for registering for ${tournamentName}!</p>
            <p>Please confirm your registration by clicking the link below:</p>
            <p><a href="${confirmationUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Confirm Registration</a></p>
            <p>Or copy this link: ${confirmationUrl}</p>
          </div>
        `,
      });
      return;
    }
    
    // Fallback: log to console (development only)
    console.log(`[Email] Would send confirmation to ${email} for ${tournamentName}`);
    console.log(`[Email] Confirmation URL: ${confirmationUrl}`);
    console.log(`[Email] Configure RESEND_API_KEY, SENDGRID_API_KEY, or SMTP settings to enable email sending`);
  } catch (error) {
    console.error('Email sending error:', error);
    // Don't fail the registration if email fails
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Generate a unique token for confirmation
    const token = crypto.randomBytes(32).toString('hex');
    
    // Store registration data
    const registrationData = {
      ...body,
      token,
      createdAt: new Date().toISOString(),
      confirmed: false,
    };
    
    await saveRegistration(token, registrationData);
    
    // In production, you would:
    // 1. Save to database
    // 2. Send confirmation email with link
    // 3. Use email service (SendGrid, Resend, etc.)
    
    const confirmationUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com'}/${body.locale || 'en'}/tournament/confirmation?token=${token}`;
    
    // Send confirmation email
    await sendConfirmationEmail(body.email, confirmationUrl, body.tournamentName, body.locale || 'en');
    
    return NextResponse.json({
      success: true,
      token,
      message: 'Registration submitted successfully. Please check your email for confirmation.',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process registration' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');
  
  if (!token) {
    return NextResponse.json(
      { error: 'Token required' },
      { status: 400 }
    );
  }
  
  const { getRegistration } = await import('@/lib/tournament-storage');
  const registration = await getRegistration(token);
  
  if (!registration) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 404 }
    );
  }
  
  return NextResponse.json({ registration });
}

