// Script to distribute test participants to groups
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST before importing other modules
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function distributeTestParticipants() {
  if (!process.env.DATABASE_HOST || !process.env.DATABASE_USER || !process.env.DATABASE_PASSWORD || !process.env.DATABASE_NAME) {
    console.error('❌ Database credentials not configured');
    process.exit(1);
  }

  try {
    // Import modules AFTER env is loaded
    const { getDbPool } = await import('../lib/db');
    const { distributePlayersToGroups, autoCreateGroupsForCategory } = await import('../lib/tournaments');
    
    const pool = getDbPool();
    
    const [tournaments] = await pool.execute(
      'SELECT * FROM tournaments WHERE name = ?',
      ['TEST TOURNAMENT - Draft']
    ) as any[];

    if (tournaments.length === 0) {
      console.error('❌ Test tournament not found. Run create-test-tournament.ts first');
      process.exit(1);
    }

    const tournamentId = tournaments[0].id;
    console.log(`✅ Found test tournament ID: ${tournamentId}\n`);

    // Categories to process
    const categories = ['male1', 'male2', 'female1', 'female2', 'mixed1', 'mixed2'];
    
    // Groups configuration: { category: { numberOfGroups, pairsPerGroup } }
    const groupsConfig: Record<string, { numberOfGroups: number; pairsPerGroup: number }> = {
      male1: { numberOfGroups: 4, pairsPerGroup: 4 },    // 16 участников = 4 группы по 4 пары
      male2: { numberOfGroups: 6, pairsPerGroup: 4 },    // 24 участника = 6 групп по 4 пары
      female1: { numberOfGroups: 2, pairsPerGroup: 4 },  // 8 участников = 2 группы по 4 пары
      female2: { numberOfGroups: 6, pairsPerGroup: 4 },  // 24 участника = 6 групп по 4 пары
      mixed1: { numberOfGroups: 5, pairsPerGroup: 4 },   // ~38 участников = 5 групп по 4 пары
      mixed2: { numberOfGroups: 6, pairsPerGroup: 4 },   // ~42 участника = 6 групп по 4 пары
    };

    for (const category of categories) {
      console.log(`\n📋 Processing category: ${category}`);
      
      const config = groupsConfig[category];
      
      // Check if groups already exist
      const [existingGroups] = await pool.execute(
        'SELECT COUNT(*) as count FROM tournament_groups WHERE tournament_id = ? AND category = ?',
        [tournamentId, category]
      ) as any[];

      if (existingGroups[0].count === 0) {
        console.log(`   Creating ${config.numberOfGroups} groups with ${config.pairsPerGroup} pairs each...`);
        const { autoCreateGroupsForCategory } = await import('../lib/tournaments');
        await autoCreateGroupsForCategory(tournamentId, category, config.numberOfGroups, config.pairsPerGroup);
        console.log(`   ✅ Groups created`);
      } else {
        console.log(`   Groups already exist (${existingGroups[0].count} groups)`);
      }

      // Distribute players
      try {
        console.log(`   Distributing players...`);
        const { distributePlayersToGroups } = await import('../lib/tournaments');
        const result = await distributePlayersToGroups(tournamentId, category);
        console.log(`   ✅ Distributed ${result.distributed} players to ${result.groups.length} groups`);
      } catch (error: any) {
        console.log(`   ⚠️  ${error.message}`);
      }
    }

    console.log('\n✅ Distribution completed');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

distributeTestParticipants()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Script failed:', err);
    process.exit(1);
  });
