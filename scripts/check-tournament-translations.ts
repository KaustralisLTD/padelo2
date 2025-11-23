// Script to check tournament translations in database

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { getDbPool } from '../lib/db';

async function checkTournamentTranslations() {
  try {
    const pool = getDbPool();
    
    // Find all tournaments with UA PADEL OPEN
    const [tournaments] = await pool.execute(
      `SELECT id, name, description, event_schedule, translations 
       FROM tournaments 
       WHERE name LIKE '%UA PADEL OPEN%'
       ORDER BY id DESC`
    ) as any[];

    if (tournaments.length === 0) {
      console.error('❌ No tournaments found');
      return;
    }

    console.log(`✅ Found ${tournaments.length} tournament(s):\n`);

    for (const tournament of tournaments) {
      console.log(`📋 Tournament: ${tournament.name} (ID: ${tournament.id})`);
      console.log(`   Description: ${tournament.description?.substring(0, 50)}...`);
      
      // Parse translations
      let translations: any = {};
      if (tournament.translations) {
        try {
          translations = typeof tournament.translations === 'string' 
            ? JSON.parse(tournament.translations) 
            : tournament.translations;
        } catch (e) {
          console.log('   ⚠️  Could not parse translations');
          continue;
        }
      }

      // Check description translations
      if (translations.description) {
        console.log('\n   📝 Description translations:');
        const descKeys = Object.keys(translations.description);
        for (const key of descKeys) {
          const preview = translations.description[key]?.substring(0, 60) || '';
          console.log(`      ${key}: ${preview}...`);
        }
      } else {
        console.log('   📝 Description translations: ❌ None');
      }

      // Check event schedule translations
      if (translations.eventSchedule) {
        console.log('\n   📅 EventSchedule translations:');
        const scheduleKeys = Object.keys(translations.eventSchedule);
        for (const key of scheduleKeys) {
          const events = translations.eventSchedule[key];
          if (Array.isArray(events) && events.length > 0) {
            console.log(`      ${key}: ${events.length} events`);
            console.log(`         First event: ${events[0]?.title}`);
            if (events[0]?.description) {
              console.log(`         Description: ${events[0].description.substring(0, 50)}...`);
            }
          }
        }
      } else {
        console.log('   📅 EventSchedule translations: ❌ None');
      }

      console.log('\n' + '='.repeat(60) + '\n');
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

checkTournamentTranslations();
