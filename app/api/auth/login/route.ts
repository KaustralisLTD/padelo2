import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, createSession, getSession, initializeDefaultAdmin } from '@/lib/users';
import { initDatabase } from '@/lib/db';

// Initialize database and default admin on first import
let initialized = false;
async function ensureInitialized() {
  if (initialized) return;
  try {
    await initDatabase();
    await initializeDefaultAdmin();
    initialized = true;
    console.log('✅ Database and admin initialization completed');
  } catch (error: any) {
    console.error('❌ Database initialization error:', error.message);
    // Still try to initialize admin in memory
    try {
      await initializeDefaultAdmin();
    } catch (adminError) {
      console.error('❌ Admin initialization error:', adminError);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureInitialized();
    
    // Ensure admin exists before login attempt
    await initializeDefaultAdmin();
    
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    // Verify password and get user
    const user = await verifyPassword(email, password);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

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
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureInitialized();
    
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Token required' },
        { status: 401 }
      );
    }

    const session = await getSession(token);

    if (!session) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      session: {
        userId: session.userId,
        role: session.role,
      },
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { error: 'Failed to verify session' },
      { status: 500 }
    );
  }
}


