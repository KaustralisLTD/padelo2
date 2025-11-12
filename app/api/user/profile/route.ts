import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import { getDbPool } from '@/lib/db';

// GET - получить профиль пользователя
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getDbPool();
    const [rows] = await pool.execute(
      `SELECT id, email, first_name, last_name, role, phone, telegram, date_of_birth, tshirt_size, photo_name, photo_data, created_at, updated_at
       FROM users WHERE id = ?`,
      [session.userId]
    ) as any[];

    if (rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = rows[0];
    return NextResponse.json({
      profile: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        phone: user.phone,
        telegram: user.telegram,
        dateOfBirth: user.date_of_birth ? user.date_of_birth.toISOString().split('T')[0] : null,
        tshirtSize: user.tshirt_size,
        photoName: user.photo_name,
        photoData: user.photo_data,
        createdAt: user.created_at.toISOString(),
        updatedAt: user.updated_at ? user.updated_at.toISOString() : null,
      },
    });
  } catch (error: any) {
    console.error('Error getting profile:', error);
    return NextResponse.json({ error: 'Failed to get profile' }, { status: 500 });
  }
}

// PUT - обновить профиль пользователя
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      phone,
      telegram,
      dateOfBirth,
      tshirtSize,
      photoName,
      photoData,
    } = body;

    const pool = getDbPool();
    const updates: string[] = [];
    const values: any[] = [];

    if (firstName !== undefined) {
      updates.push('first_name = ?');
      values.push(firstName);
    }
    if (lastName !== undefined) {
      updates.push('last_name = ?');
      values.push(lastName);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone || null);
    }
    if (telegram !== undefined) {
      updates.push('telegram = ?');
      values.push(telegram || null);
    }
    if (dateOfBirth !== undefined) {
      updates.push('date_of_birth = ?');
      values.push(dateOfBirth || null);
    }
    if (tshirtSize !== undefined) {
      updates.push('tshirt_size = ?');
      values.push(tshirtSize || null);
    }
    if (photoName !== undefined) {
      updates.push('photo_name = ?');
      values.push(photoName || null);
    }
    if (photoData !== undefined) {
      updates.push('photo_data = ?');
      values.push(photoData || null);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    values.push(session.userId);
    console.log('Updating profile for user:', session.userId, 'Updates:', updates.length);
    await pool.execute(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );
    console.log('Profile updated successfully');

    // Get updated profile
    const [rows] = await pool.execute(
      `SELECT id, email, first_name, last_name, role, phone, telegram, date_of_birth, tshirt_size, photo_name, photo_data, created_at, updated_at
       FROM users WHERE id = ?`,
      [session.userId]
    ) as any[];

    const user = rows[0];
    return NextResponse.json({
      profile: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        phone: user.phone,
        telegram: user.telegram,
        dateOfBirth: user.date_of_birth ? user.date_of_birth.toISOString().split('T')[0] : null,
        tshirtSize: user.tshirt_size,
        photoName: user.photo_name,
        photoData: user.photo_data,
        createdAt: user.created_at.toISOString(),
        updatedAt: user.updated_at ? user.updated_at.toISOString() : null,
      },
    });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

