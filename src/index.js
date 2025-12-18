#!/usr/bin/env node

/**
 * Motion-Craft Sync Service
 * Main entry point for the background sync service
 */

import { SyncEngine } from './sync-engine.js';
import { SyncScheduler } from './scheduler.js';

async function main() {
  console.log('='.repeat(60));
  console.log('Motion-Craft Sync Service v1.0.0');
  console.log('='.repeat(60));
  console.log('');

  const syncEngine = new SyncEngine();
  const scheduler = new SyncScheduler(syncEngine);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n[Main] Received SIGINT, shutting down...');
    scheduler.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n[Main] Received SIGTERM, shutting down...');
    scheduler.stop();
    process.exit(0);
  });

  // Start the scheduler
  await scheduler.start();

  console.log('\n[Main] Service running. Press Ctrl+C to stop.\n');
}

main().catch(error => {
  console.error('[Main] Fatal error:', error);
  process.exit(1);
});
