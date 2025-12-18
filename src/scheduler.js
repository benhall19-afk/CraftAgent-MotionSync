/**
 * Sync Scheduler - Manages timing of sync operations
 */

import { config } from './config.js';

export class SyncScheduler {
  constructor(syncEngine) {
    this.syncEngine = syncEngine;
    this.timerId = null;
    this.isRunning = false;
  }

  /**
   * Check if current time is within active hours (6 AM - 11 PM GMT+7)
   */
  isActiveHours() {
    const now = new Date();
    const bangkokTime = new Date(now.toLocaleString('en-US', { timeZone: config.sync.timezone }));
    const hour = bangkokTime.getHours();

    return hour >= config.sync.activeHours.start && hour < config.sync.activeHours.end;
  }

  /**
   * Get next sync interval based on time of day
   */
  getNextInterval() {
    return this.isActiveHours()
      ? config.sync.activeHours.interval
      : config.sync.offHours.interval;
  }

  /**
   * Schedule next sync
   */
  scheduleNext() {
    if (!this.isRunning) return;

    const interval = this.getNextInterval();
    const minutes = Math.floor(interval / 60000);

    console.log(`[Scheduler] Next sync in ${minutes} minutes`);

    this.timerId = setTimeout(async () => {
      await this.executeSyncCycle();
      this.scheduleNext();
    }, interval);
  }

  /**
   * Execute a sync cycle
   */
  async executeSyncCycle() {
    console.log(`\n[Scheduler] Sync triggered at ${new Date().toISOString()}`);

    try {
      const result = await this.syncEngine.runSync();

      if (result.success) {
        console.log(`[Scheduler] ✅ Sync completed successfully`);
      } else {
        console.error(`[Scheduler] ❌ Sync failed: ${result.error}`);
      }
    } catch (error) {
      console.error(`[Scheduler] Unexpected error:`, error);
    }
  }

  /**
   * Start the scheduler
   */
  async start() {
    if (this.isRunning) {
      console.log('[Scheduler] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[Scheduler] Starting Motion-Craft sync scheduler');
    console.log(`[Scheduler] Active hours: ${config.sync.activeHours.start}:00 - ${config.sync.activeHours.end}:00 GMT+7`);
    console.log(`[Scheduler] Active interval: ${config.sync.activeHours.interval / 60000} minutes`);
    console.log(`[Scheduler] Off-hours interval: ${config.sync.offHours.interval / 60000} minutes`);

    // Run first sync immediately
    await this.executeSyncCycle();

    // Schedule subsequent syncs
    this.scheduleNext();
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }

    this.isRunning = false;
    console.log('[Scheduler] Stopped');
  }

  /**
   * Force an immediate sync
   */
  async forceSyncNow() {
    console.log('[Scheduler] Force sync requested');
    await this.executeSyncCycle();
  }
}
