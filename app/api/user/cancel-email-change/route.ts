import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const pool = getDbPool();

    // Find user with this cancel token
    const [users] = await pool.execute(
      'SELECT id FROM users WHERE email_change_cancel_token = ?',
      [token]
    ) as any[];

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    const userId = users[0].id;

    // Clear email change request
    await pool.execute(
      `UPDATE users 
       SET email_change_new_email = NULL, 
           email_change_cancel_token = NULL, 
           email_change_confirm_token = NULL, 
           email_change_requested_at = NULL,
           updated_at = NOW()
       WHERE id = ?`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Email change request cancelled',
    });
  } catch (error: any) {
    console.error('Error cancelling email change:', error);
    return NextResponse.json(
      { error: 'Failed to cancel email change' },
      { status: 500 }
    );
  }
}

