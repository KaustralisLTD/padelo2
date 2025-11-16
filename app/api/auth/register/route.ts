import { NextRequest, NextResponse } from 'next/server';
import { createUser, createSession, initializeDefaultAdmin } from '@/lib/users';
import { initDatabase } from '@/lib/db';
import { sendEmailVerification } from '@/lib/email';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Initialize database and default admin on first import
let initialized = false;
async function ensureInitialized() {
  if (initialized) return;
  try {
    await initDatabase();
    await initializeDefaultAdmin();
    initialized = true;
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureInitialized();
    
    const body = await request.json();
    const { email, password, firstName, lastName } = body;

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'All fields required' },
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

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // Create new user (default role: participant) with verification token
    const user = await createUser({
      email,
      password,
      firstName,
      lastName,
      role: 'participant',
      emailVerificationToken: verificationToken,
    });

    // Send email verification
    const locale = request.headers.get('accept-language')?.split(',')[0]?.split('-')[0] || 'en';
    await sendEmailVerification(email, firstName, verificationToken, locale);

    // Don't create session until email is verified
    // User needs to verify email first

    return NextResponse.json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerified: false,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    
    if (error.message === 'User with this email already exists') {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to register' },
      { status: 500 }
    );
  }
}


