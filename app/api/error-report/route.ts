import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      url,
      userAgent,
      timestamp,
      errorMessage,
      stackTrace,
      userInfo,
      consoleLogs,
      networkLogs,
      localStorage,
      sessionStorage,
    } = body;

    // Collect all error information
    const errorReport = `
404 Error Report - PadelO₂

URL: ${url || 'Unknown'}
Timestamp: ${timestamp || new Date().toISOString()}
User Agent: ${userAgent || 'Unknown'}

Error Message:
${errorMessage || 'No error message provided'}

Stack Trace:
${stackTrace || 'No stack trace available'}

User Info:
${JSON.stringify(userInfo || {}, null, 2)}

Console Logs:
${consoleLogs ? consoleLogs.slice(0, 50).join('\n') : 'No console logs'}

Network Logs:
${networkLogs ? JSON.stringify(networkLogs.slice(0, 20), null, 2) : 'No network logs'}

Local Storage:
${localStorage ? JSON.stringify(localStorage, null, 2) : 'No local storage data'}

Session Storage:
${sessionStorage ? JSON.stringify(sessionStorage, null, 2) : 'No session storage data'}
    `.trim();

    // Send email to developers
    const developerEmail = process.env.DEVELOPER_EMAIL || 'dev@padelo2.com';
    const emailSent = await sendEmail({
      to: developerEmail,
      subject: `404 Error Report - ${url || 'Unknown URL'}`,
      html: `<pre style="font-family: monospace; white-space: pre-wrap; background: #f5f5f5; padding: 20px; border-radius: 8px;">${errorReport.replace(/\n/g, '<br>')}</pre>`,
      locale: 'en',
    });

    if (emailSent) {
      return NextResponse.json({
        success: true,
        message: 'Error report sent successfully',
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to send error report',
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error sending error report:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to send error report',
    }, { status: 500 });
  }
}

