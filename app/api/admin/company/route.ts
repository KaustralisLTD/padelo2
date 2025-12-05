import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { getSession, findUserById } from '@/lib/users';
import { logAction, getIpAddress, getUserAgent } from '@/lib/audit-log';

export const dynamic = 'force-dynamic';

// GET - получить информацию о компании
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (!session || (session.role !== 'superadmin' && session.role !== 'tournament_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const pool = getDbPool();
    const [company] = await pool.execute(
      'SELECT id, name, description, email, phone, address, logo_url, website, iban, swift, bank_name, bank_address, tax_id, vat_number, currency, account_holder, created_at, updated_at FROM company_info ORDER BY id DESC LIMIT 1'
    ) as any[];

    if (company.length === 0) {
      return NextResponse.json({ company: null });
    }

    return NextResponse.json({ company: company[0] });
  } catch (error: any) {
    console.error('Error fetching company info:', error);
    return NextResponse.json({ error: 'Failed to fetch company info' }, { status: 500 });
  }
}

// POST - создать или обновить информацию о компании
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (!session || session.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden. Only superadmin can manage company info.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, email, phone, address, logoUrl, website, iban, swift, bankName, bankAddress, taxId, vatNumber, currency, accountHolder } = body;

    if (!name) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }

    const pool = getDbPool();
    
    // Проверяем, есть ли уже запись
    const [existing] = await pool.execute(
      'SELECT id FROM company_info ORDER BY id DESC LIMIT 1'
    ) as any[];

    let companyId: number;

    if (existing.length > 0) {
      // Обновляем существующую запись
      companyId = existing[0].id;
      await pool.execute(
        `UPDATE company_info 
         SET name = ?, description = ?, email = ?, phone = ?, address = ?, logo_url = ?, website = ?, 
             iban = ?, swift = ?, bank_name = ?, bank_address = ?, tax_id = ?, vat_number = ?, currency = ?, account_holder = ?, updated_at = NOW()
         WHERE id = ?`,
        [
          name,
          description || null,
          email || null,
          phone || null,
          address || null,
          logoUrl || null,
          website || null,
          iban || null,
          swift || null,
          bankName || null,
          bankAddress || null,
          taxId || null,
          vatNumber || null,
          currency || 'EUR',
          accountHolder || null,
          companyId,
        ]
      );
    } else {
      // Создаем новую запись
      const [result] = await pool.execute(
        `INSERT INTO company_info (name, description, email, phone, address, logo_url, website, iban, swift, bank_name, bank_address, tax_id, vat_number, currency, account_holder, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          name,
          description || null,
          email || null,
          phone || null,
          address || null,
          logoUrl || null,
          website || null,
          iban || null,
          swift || null,
          bankName || null,
          bankAddress || null,
          taxId || null,
          vatNumber || null,
          currency || 'EUR',
          accountHolder || null,
        ]
      ) as any[];
      companyId = (result as any).insertId;
    }

    const currentUser = await findUserById(session.userId);

    await logAction(existing.length > 0 ? 'update' : 'create', 'company_info', {
      userId: session.userId,
      userEmail: currentUser?.email,
      userRole: session.role,
      entityId: companyId.toString(),
      details: { name, email, phone },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    }).catch(() => {});

    return NextResponse.json({ success: true, companyId });
  } catch (error: any) {
    console.error('Error saving company info:', error);
    return NextResponse.json({ error: 'Failed to save company info' }, { status: 500 });
  }
}

