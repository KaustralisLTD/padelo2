import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { sendInvestmentRequestEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, company, investmentSize, message } = body;

    // Validate required fields
    if (!name || !email || !investmentSize) {
      return NextResponse.json(
        { error: 'Name, email, and investment size are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate investment size
    const validSizes = ['small', 'medium', 'large', 'enterprise'];
    if (!validSizes.includes(investmentSize)) {
      return NextResponse.json(
        { error: 'Invalid investment size' },
        { status: 400 }
      );
    }

    // Try to save to database
    let savedToDb = false;
    try {
      const pool = getDbPool();
      await pool.execute(
        `INSERT INTO investment_requests (name, email, company, investment_size, message, status)
         VALUES (?, ?, ?, ?, ?, 'pending')`,
        [name, email, company || null, investmentSize, message || null]
      );
      savedToDb = true;
      console.log('✅ Investment request saved to database');
    } catch (dbError: any) {
      // If database is not configured or table doesn't exist, continue without saving
      if (dbError.code === 'ECONNREFUSED' || dbError.message?.includes('not configured')) {
        console.log('⚠️  Database not available, skipping database save');
      } else {
        console.error('❌ Database error saving investment request:', dbError);
        // Continue anyway - email is more important
      }
    }

    // Send email to admin
    const emailSent = await sendInvestmentRequestEmail(
      name,
      email,
      company || '',
      investmentSize,
      message
    );

    if (!emailSent) {
      console.warn('⚠️ Email sending failed, but request was processed');
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Your investment request has been submitted successfully. We will contact you soon!',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Investment request error:', error);
    return NextResponse.json(
      { error: 'Failed to submit investment request' },
      { status: 500 }
    );
  }
}

