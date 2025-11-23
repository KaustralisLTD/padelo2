// Script to fix Ukrainian translations for existing tournament
// This script will re-translate description and eventSchedule to Ukrainian using correct locale mapping

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { getDbPool } from '../lib/db';
import { translateTournamentDescription, translateEventSchedule, storeTournamentTranslations } from '../lib/translation-utils';

async function fixTournamentUATranslations() {
  try {
    const pool = getDbPool();
    
    // Find tournament by name
    const [tournaments] = await pool.execute(
      `SELECT id, name, description, event_schedule, translations 
       FROM tournaments 
       WHERE name LIKE '%UA PADEL OPEN%' OR name LIKE '%Winter 2025%'
       ORDER BY id DESC
       LIMIT 1`
    ) as any[];

    if (tournaments.length === 0) {
      console.error('❌ Tournament not found');
      return;
    }

    const tournament = tournaments[0];
    console.log(`✅ Found tournament: ${tournament.name} (ID: ${tournament.id})`);

    // Parse existing translations
    let existingTranslations: any = {};
    if (tournament.translations) {
      try {
        existingTranslations = typeof tournament.translations === 'string' 
          ? JSON.parse(tournament.translations) 
          : tournament.translations;
      } catch (e) {
        console.warn('⚠️  Could not parse existing translations, starting fresh');
      }
    }

    // Parse event schedule
    let eventSchedule: any[] = [];
    if (tournament.event_schedule) {
      try {
        eventSchedule = typeof tournament.event_schedule === 'string'
          ? JSON.parse(tournament.event_schedule)
          : tournament.event_schedule;
      } catch (e) {
        console.error('❌ Could not parse event_schedule:', e);
      }
    }

    console.log('\n📝 Current translations status:');
    console.log('  Description UA:', existingTranslations.description?.ua ? '✅ Exists' : '❌ Missing');
    console.log('  EventSchedule UA:', existingTranslations.eventSchedule?.ua ? '✅ Exists' : '❌ Missing');
    
    if (existingTranslations.description?.ua) {
      console.log('  Description UA preview:', existingTranslations.description.ua.substring(0, 50) + '...');
    }
    if (existingTranslations.eventSchedule?.ua && existingTranslations.eventSchedule.ua.length > 0) {
      console.log('  EventSchedule UA first event:', existingTranslations.eventSchedule.ua[0]?.title);
    }

    // Translate description to Ukrainian
    console.log('\n🌐 Translating description to Ukrainian...');
    const descriptionTranslations = await translateTournamentDescription(
      tournament.description || '',
      'en' // source locale
    );

    // Translate event schedule to Ukrainian
    let eventScheduleTranslations: any = {};
    if (eventSchedule && eventSchedule.length > 0) {
      console.log('🌐 Translating event schedule to Ukrainian...');
      eventScheduleTranslations = await translateEventSchedule(
        eventSchedule,
        'en' // source locale
      ) || {};
    }

    // Merge with existing translations (preserve other languages)
    const updatedTranslations = {
      description: {
        ...existingTranslations.description,
        ua: descriptionTranslations.ua, // This will use the correct 'uk' mapping
      },
      eventSchedule: {
        ...existingTranslations.eventSchedule,
        ua: eventScheduleTranslations.ua, // This will use the correct 'uk' mapping
      },
    };

    console.log('\n✅ New Ukrainian translations:');
    console.log('  Description UA:', updatedTranslations.description.ua?.substring(0, 100) + '...');
    if (updatedTranslations.eventSchedule.ua && updatedTranslations.eventSchedule.ua.length > 0) {
      console.log('  EventSchedule UA first event:', updatedTranslations.eventSchedule.ua[0]?.title);
      console.log('  EventSchedule UA first description:', updatedTranslations.eventSchedule.ua[0]?.description?.substring(0, 50) + '...');
    }

    // Store updated translations
    console.log('\n💾 Storing updated translations to database...');
    await storeTournamentTranslations(tournament.id, updatedTranslations);

    console.log('\n✅ Successfully updated Ukrainian translations for tournament', tournament.id);
    console.log('   Tournament name:', tournament.name);
    
  } catch (error: any) {
    console.error('❌ Error fixing translations:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Run the script
fixTournamentUATranslations();

