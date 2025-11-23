// Script to check tournament translations in database
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(__dirname, '../.env.local') });

import { getDbPool } from '../lib/db';

async function checkTournamentTranslations() {
  try {
    const pool = getDbPool();
    
    // Get all tournaments
    const [tournaments] = await pool.execute(
      'SELECT id, name, translations FROM tournaments WHERE translations IS NOT NULL'
    ) as any[];
    
    console.log(`\nFound ${tournaments.length} tournaments with translations:\n`);
    
    for (const tournament of tournaments) {
      let translations;
      try {
        translations = typeof tournament.translations === 'string' 
          ? JSON.parse(tournament.translations) 
          : tournament.translations;
      } catch (e) {
        console.error(`Error parsing translations for tournament ${tournament.id}:`, e);
        continue;
      }
      
      console.log(`\nTournament ID: ${tournament.id}`);
      console.log(`Name: ${tournament.name}`);
      console.log(`\nDescription translations:`);
      if (translations.description) {
        const descKeys = Object.keys(translations.description);
        console.log(`  Available locales: ${descKeys.join(', ')}`);
        console.log(`  Has 'ua': ${!!translations.description['ua']}`);
        console.log(`  Has 'uk': ${!!translations.description['uk']}`);
        console.log(`  Has 'ru': ${!!translations.description['ru']}`);
        console.log(`  Has 'en': ${!!translations.description['en']}`);
      } else {
        console.log(`  No description translations`);
      }
      
      console.log(`\nEvent Schedule translations:`);
      if (translations.eventSchedule) {
        const scheduleKeys = Object.keys(translations.eventSchedule);
        console.log(`  Available locales: ${scheduleKeys.join(', ')}`);
        console.log(`  Has 'ua': ${!!translations.eventSchedule['ua']}`);
        console.log(`  Has 'uk': ${!!translations.eventSchedule['uk']}`);
        console.log(`  Has 'ru': ${!!translations.eventSchedule['ru']}`);
        console.log(`  Has 'en': ${!!translations.eventSchedule['en']}`);
        
        // Show sample for ua if exists
        if (translations.eventSchedule['ua']) {
          console.log(`  Sample 'ua' eventSchedule:`, JSON.stringify(translations.eventSchedule['ua'][0], null, 2));
        }
        if (translations.eventSchedule['uk']) {
          console.log(`  Sample 'uk' eventSchedule:`, JSON.stringify(translations.eventSchedule['uk'][0], null, 2));
        }
      } else {
        console.log(`  No eventSchedule translations`);
      }
      
      console.log(`\n${'='.repeat(60)}`);
    }
    
    process.exit(0);
  } catch (error: any) {
    console.error('Error checking translations:', error);
    process.exit(1);
  }
}

checkTournamentTranslations();

