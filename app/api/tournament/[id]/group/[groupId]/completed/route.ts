import { NextRequest, NextResponse } from 'next/server';
import { isGroupCompleted } from '@/lib/knockout';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const completed = await isGroupCompleted(parseInt(groupId, 10));
    return NextResponse.json({ completed });
  } catch (error: any) {
    console.error('Error checking group completion:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check group completion' },
      { status: 500 }
    );
  }
}

