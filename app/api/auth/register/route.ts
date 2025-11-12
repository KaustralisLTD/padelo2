import { NextRequest, NextResponse } from 'next/server';
import { createUser, createSession, initializeDefaultAdmin } from '@/lib/users';
import { initDatabase } from '@/lib/db';

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

    // Create new user (default role: participant)
    const user = await createUser({
      email,
      password,
      firstName,
      lastName,
      role: 'participant',
    });

    // Create session
    const token = await createSession(user.id, 7); // 7 days

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
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


