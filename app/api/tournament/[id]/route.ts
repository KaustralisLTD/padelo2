import { NextRequest, NextResponse } from 'next/server';
import { getTournament } from '@/lib/tournaments';

// GET - получить детали турнира (публичный endpoint)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tournamentId = parseInt(id, 10);

    if (isNaN(tournamentId)) {
      return NextResponse.json(
        { error: 'Invalid tournament ID' },
        { status: 400 }
      );
    }

    const tournament = await getTournament(tournamentId);

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ tournament });
  } catch (error: any) {
    console.error('Error getting tournament:', error);
    return NextResponse.json(
      { error: 'Failed to get tournament' },
      { status: 500 }
    );
  }
}

