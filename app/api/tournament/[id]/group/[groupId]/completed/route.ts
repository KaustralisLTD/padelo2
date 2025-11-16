import { NextRequest, NextResponse } from 'next/server';
import { isGroupCompleted } from '@/lib/knockout';
import { getDbPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const groupIdNum = parseInt(groupId, 10);
    
    // Получаем детальную диагностическую информацию
    const pool = getDbPool();
    
    // Получаем информацию о группе
    const [groupInfo] = await pool.execute(
      `SELECT id, group_name, group_number, category, tournament_id 
       FROM tournament_groups 
       WHERE id = ?`,
      [groupIdNum]
    ) as any[];
    
    if (groupInfo.length === 0) {
      return NextResponse.json({ 
        completed: false, 
        error: 'Group not found',
        diagnostics: { groupId: groupIdNum }
      });
    }
    
    const group = groupInfo[0];
    
    // Получаем все пары в группе
    const [pairs] = await pool.execute(
      'SELECT id FROM tournament_group_pairs WHERE group_id = ?',
      [groupIdNum]
    ) as any[];
    
    const expectedMatches = pairs.length >= 2 ? (pairs.length * (pairs.length - 1)) / 2 : 0;
    
    // Получаем все матчи группы
    const [allMatches] = await pool.execute(
      `SELECT id, pair1_id, pair2_id, pair1_games, pair2_games, 
              pair1_set1, pair1_set2, pair2_set1, pair2_set2,
              pair1_set3, pair2_set3
       FROM tournament_matches 
       WHERE group_id = ?`,
      [groupIdNum]
    ) as any[];
    
    // Подсчитываем завершенные матчи
    const completedMatches = allMatches.filter((m: any) => {
      const hasGames = m.pair1_games !== null && m.pair2_games !== null && 
                       m.pair1_games >= 0 && m.pair2_games >= 0;
      const hasSets = m.pair1_set1 !== null && m.pair1_set2 !== null && 
                      m.pair2_set1 !== null && m.pair2_set2 !== null &&
                      m.pair1_set1 >= 0 && m.pair1_set2 >= 0 && 
                      m.pair2_set1 >= 0 && m.pair2_set2 >= 0;
      return hasGames || hasSets;
    });
    
    const completed = await isGroupCompleted(groupIdNum);
    
    // Детальная диагностика
    const diagnostics = {
      groupId: groupIdNum,
      groupName: group.group_name,
      category: group.category,
      pairsCount: pairs.length,
      expectedMatches,
      totalMatches: allMatches.length,
      completedMatches: completedMatches.length,
      matches: allMatches.map((m: any) => ({
        id: m.id,
        pair1_id: m.pair1_id,
        pair2_id: m.pair2_id,
        pair1_games: m.pair1_games,
        pair2_games: m.pair2_games,
        pair1_set1: m.pair1_set1,
        pair1_set2: m.pair1_set2,
        pair2_set1: m.pair2_set1,
        pair2_set2: m.pair2_set2,
        hasGames: m.pair1_games !== null && m.pair2_games !== null,
        hasSets: m.pair1_set1 !== null && m.pair1_set2 !== null && 
                 m.pair2_set1 !== null && m.pair2_set2 !== null,
        isCompleted: (m.pair1_games !== null && m.pair2_games !== null && 
                      m.pair1_games >= 0 && m.pair2_games >= 0) ||
                     (m.pair1_set1 !== null && m.pair1_set2 !== null && 
                      m.pair2_set1 !== null && m.pair2_set2 !== null &&
                      m.pair1_set1 >= 0 && m.pair1_set2 >= 0 && 
                      m.pair2_set1 >= 0 && m.pair2_set2 >= 0)
      }))
    };
    
    console.log(`[Group Completion API] Group ${groupIdNum} (${group.group_name}):`, JSON.stringify(diagnostics, null, 2));
    
    return NextResponse.json({ 
      completed,
      diagnostics 
    });
  } catch (error: any) {
    console.error('[Group Completion API] Error checking group completion:', error);
    console.error('[Group Completion API] Error stack:', error.stack);
    return NextResponse.json(
      { 
        completed: false,
        error: error.message || 'Failed to check group completion',
        diagnostics: null
      },
      { status: 500 }
    );
  }
}

