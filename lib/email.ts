// Centralized email sending utility
// Uses Resend service

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

/**
 * Send email using Resend service
 * Falls back to console.log if Resend is not configured
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const { to, subject, html, from, replyTo } = options;
  const fromEmail = from || process.env.SMTP_FROM || 'noreply@padelo2.com';
  const recipients = Array.isArray(to) ? to : [to];

  try {
    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      await resend.emails.send({
        from: fromEmail,
        to: recipients,
        subject,
        html,
        reply_to: replyTo,
      });
      console.log(`✅ Email sent via Resend to ${recipients.join(', ')}`);
      return true;
    }
    
    // Fallback: log to console (development only)
    console.log(`[Email] Would send email to ${recipients.join(', ')}`);
    console.log(`[Email] Subject: ${subject}`);
    console.log(`[Email] From: ${fromEmail}`);
    console.log(`[Email] Configure RESEND_API_KEY to enable email sending`);
    return true; // Return true even in fallback mode
  } catch (error) {
    console.error('❌ Email sending error:', error);
    // Don't fail the request if email fails
    return false;
  }
}

/**
 * Send contact form notification to admin
 */
export async function sendContactFormEmail(
  name: string,
  email: string,
  message: string,
  topic?: string
): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@padelo2.com';
  const subject = topic ? `New Contact Form: ${topic}` : 'New Contact Form Submission';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">
        New Contact Form Submission
      </h2>
      ${topic ? `<p><strong>Topic:</strong> ${topic}</p>` : ''}
      <p><strong>From:</strong> ${name} (${email})</p>
      <p><strong>Message:</strong></p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
        ${message.replace(/\n/g, '<br>')}
      </div>
      <p style="color: #666; font-size: 12px; margin-top: 20px;">
        You can reply directly to: <a href="mailto:${email}">${email}</a>
      </p>
    </div>
  `;

  return await sendEmail({
    to: adminEmail,
    subject,
    html,
    replyTo: email,
  });
}

/**
 * Send investment request notification to admin
 */
export async function sendInvestmentRequestEmail(
  name: string,
  email: string,
  company: string,
  investmentSize: string,
  message?: string
): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@padelo2.com';
  const subject = 'New Investment Request';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">
        New Investment Request
      </h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      ${company ? `<p><strong>Company:</strong> ${company}</p>` : ''}
      <p><strong>Investment Size:</strong> ${investmentSize}</p>
      ${message ? `
        <p><strong>Message:</strong></p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          ${message.replace(/\n/g, '<br>')}
        </div>
      ` : ''}
      <p style="color: #666; font-size: 12px; margin-top: 20px;">
        You can reply directly to: <a href="mailto:${email}">${email}</a>
      </p>
    </div>
  `;

  return await sendEmail({
    to: adminEmail,
    subject,
    html,
    replyTo: email,
  });
}

