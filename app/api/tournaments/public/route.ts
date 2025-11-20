import { NextResponse } from 'next/server';
import { getAllTournaments } from '@/lib/tournaments';

export const dynamic = 'force-dynamic';

/**
 * GET - получить публичные турниры (со статусами 'open' и 'soon')
 */
export async function GET() {
  try {
    const tournaments = await getAllTournaments();
    
    // Фильтруем только публичные турниры
    const publicTournaments = tournaments.filter(
      t => t.status === 'open' || t.status === 'soon'
    );

    return NextResponse.json({
      success: true,
      tournaments: publicTournaments,
    });
  } catch (error: any) {
    console.error('[GET /api/tournaments/public] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch tournaments' },
      { status: 500 }
    );
  }
}

