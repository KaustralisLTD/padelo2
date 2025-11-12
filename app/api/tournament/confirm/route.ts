import { NextRequest, NextResponse } from 'next/server';
import { confirmRegistration } from '@/lib/tournament-storage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token required' },
        { status: 400 }
      );
    }
    
    const success = await confirmRegistration(token);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Registration confirmed',
    });
  } catch (error) {
    console.error('Confirmation error:', error);
    return NextResponse.json(
      { error: 'Failed to confirm registration' },
      { status: 500 }
    );
  }
}

