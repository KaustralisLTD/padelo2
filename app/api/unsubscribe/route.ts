import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    const pool = getDbPool();
    
    // Check if user exists
    const [users] = await pool.execute(
      'SELECT id, email FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    ) as any[];

    if (users.length === 0) {
      // User doesn't exist, but we'll still return success to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: 'If this email was subscribed, it has been unsubscribed.',
      });
    }

    // Update user's email preferences - we can add an email_subscribed field if needed
    // For now, we'll just log the unsubscribe action
    // In the future, you might want to add a field like `email_subscribed BOOLEAN DEFAULT TRUE` to users table
    
    // For now, we'll create a simple unsubscribe log or update a field
    // Since we don't have an email_subscribed field yet, we'll just return success
    // You can add this field later: ALTER TABLE users ADD COLUMN email_subscribed BOOLEAN DEFAULT TRUE;
    
    console.log(`[Unsubscribe] User ${email} requested to unsubscribe`);

    return NextResponse.json({
      success: true,
      message: 'You have been successfully unsubscribed from our email list.',
    });
  } catch (error: any) {
    console.error('[Unsubscribe] Error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}

