/**
 * Sync Engine - Core bidirectional sync logic
 */

import { config } from './config.js';
import { MotionAPI } from './motion-api.js';
import { CraftMCP } from './craft-mcp.js';

export class SyncEngine {
  constructor() {
    this.motion = new MotionAPI();
    this.craft = new CraftMCP();
    this.syncState = new Map(); // In-memory cache of sync mappings
  }

  /**
   * Initialize sync state from Craft collection
   */
  async loadSyncState() {
    try {
      const items = await this.craft.getCollectionItems(config.craft.collections.syncMappings);
      items.forEach(item => {
        const key = `${item.type}_${item.craftId}`;
        this.syncState.set(key, {
          craftId: item.craftId,
          motionId: item.motionId,
          type: item.type,
          workspace: item.workspace,
          lastSynced: item.lastSynced,
          craftUpdated: item.craftUpdated,
          motionUpdated: item.motionUpdated
        });
      });
      console.log(`Loaded ${this.syncState.size} sync mappings`);
    } catch (error) {
      console.error('Failed to load sync state:', error.message);
      // Start with empty state
    }
  }

  /**
   * Save sync state back to Craft collection
   */
  async saveSyncState() {
    const items = Array.from(this.syncState.values()).map(mapping => ({
      entity_name: mapping.craftId,
      craft_id: mapping.craftId,
      motion_id: mapping.motionId,
      type: mapping.type,
      workspace: mapping.workspace,
      last_synced: mapping.lastSynced,
      craft_updated: mapping.craftUpdated,
      motion_updated: mapping.motionUpdated,
      status: 'synced'
    }));

    // For initial implementation, this would update the collection
    console.log(`Saving ${items.length} sync mappings to Craft`);
  }

  /**
   * Map Craft task state to Motion task properties
   */
  craftStateToMotion(craftState) {
    const mapping = config.mapping.craftToMotion.state[craftState] || config.mapping.craftToMotion.state.todo;
    return mapping;
  }

  /**
   * Map Motion task to Craft state
   */
  motionStateToCraft(motionTask) {
    if (motionTask.completed) {
      return 'done';
    }
    if (motionTask.status?.name === 'Canceled') {
      return 'canceled';
    }
    return 'todo';
  }

  /**
   * Convert Craft task to Motion task format
   */
  craftToMotionTask(craftTask, motionProjectId = null) {
    const stateMapping = this.craftStateToMotion(craftTask.taskInfo?.state || 'todo');

    const motionTask = {
      name: craftTask.markdown || craftTask.title || 'Untitled',
      description: craftTask.description || '',
      workspaceId: motionProjectId ? config.motion.workspaces.life : config.motion.workspaces.private,
      ...stateMapping
    };

    if (craftTask.taskInfo?.scheduleDate) {
      motionTask.startOn = craftTask.taskInfo.scheduleDate;
    }

    if (craftTask.taskInfo?.deadlineDate) {
      motionTask.dueDate = new Date(craftTask.taskInfo.deadlineDate).toISOString();
    }

    if (motionProjectId) {
      motionTask.projectId = motionProjectId;
    }

    return motionTask;
  }

  /**
   * Convert Motion task to Craft task format
   */
  motionToCraftTask(motionTask, location) {
    const craftTask = {
      markdown: motionTask.name,
      location: location,
      taskInfo: {
        state: this.motionStateToCraft(motionTask)
      }
    };

    if (motionTask.startOn) {
      craftTask.taskInfo.scheduleDate = motionTask.startOn;
    }

    if (motionTask.dueDate) {
      const dueDate = new Date(motionTask.dueDate);
      craftTask.taskInfo.deadlineDate = dueDate.toISOString().split('T')[0];
    }

    return craftTask;
  }

  /**
   * Resolve conflict using latest-wins strategy
   */
  resolveConflict(craftUpdated, motionUpdated) {
    const craftTime = new Date(craftUpdated).getTime();
    const motionTime = new Date(motionUpdated).getTime();
    return motionTime > craftTime ? 'motion' : 'craft';
  }

  /**
   * Sync projects from Craft to Motion
   */
  async syncProjects() {
    console.log('[Sync] Starting project sync...');

    try {
      // Get all Craft documents in Projects - In Progress folder
      const craftDocs = await this.craft.getDocumentsInFolder(config.craft.folders.projectsInProgress);

      // Get all Motion projects in Life workspace
      const motionProjects = await this.motion.getProjects(config.motion.workspaces.life);

      // Create map of existing Motion projects by name
      const motionProjectMap = new Map();
      motionProjects.forEach(proj => motionProjectMap.set(proj.name, proj));

      // Process each Craft document
      for (const doc of craftDocs) {
        const mappingKey = `project_${doc.id}`;
        let mapping = this.syncState.get(mappingKey);

        if (!mapping) {
          // No mapping exists - check if Motion project exists by name
          const existingProject = motionProjectMap.get(doc.title);

          if (existingProject) {
            // Create mapping for existing project
            mapping = {
              craftId: doc.id,
              motionId: existingProject.id,
              type: 'project',
              workspace: 'Life',
              lastSynced: new Date().toISOString()
            };
            this.syncState.set(mappingKey, mapping);
          } else {
            // Create new Motion project
            const newProject = await this.motion.createProject({
              name: doc.title,
              workspaceId: config.motion.workspaces.life
            });

            mapping = {
              craftId: doc.id,
              motionId: newProject.id,
              type: 'project',
              workspace: 'Life',
              lastSynced: new Date().toISOString()
            };
            this.syncState.set(mappingKey, mapping);

            console.log(`✅ Created Motion project: ${doc.title}`);
          }
        }

        // Now sync tasks within this project
        await this.syncProjectTasks(doc.id, mapping.motionId);
      }

      console.log('[Sync] Project sync completed');
    } catch (error) {
      console.error('[Sync] Project sync failed:', error.message);
      throw error;
    }
  }

  /**
   * Sync tasks for a specific project
   */
  async syncProjectTasks(craftDocId, motionProjectId) {
    // This would get tasks from the Craft document and Motion project
    // Then perform bidirectional sync
    console.log(`[Sync] Syncing tasks for project: ${craftDocId} ↔ ${motionProjectId}`);

    // Implementation would:
    // 1. Get all tasks from Craft document
    // 2. Get all tasks from Motion project
    // 3. Compare and sync bidirectionally
  }

  /**
   * Sync Area of Life tasks
   */
  async syncAreas() {
    console.log('[Sync] Starting areas sync...');

    try {
      // Get all documents in Areas of Life folder
      const areaDocs = await this.craft.getDocumentsInFolder(config.craft.folders.areasOfLife);

      // Get all Motion tasks from Private workspace
      const motionTasks = await this.motion.getTasks(config.motion.workspaces.private);

      // Process each area document
      for (const doc of areaDocs) {
        // Skip the inbox document
        if (doc.id === config.craft.documents.motionInbox) {
          continue;
        }

        await this.syncAreaTasks(doc);
      }

      // Handle new Motion tasks → inbox
      await this.syncNewMotionTasksToInbox(motionTasks);

      console.log('[Sync] Areas sync completed');
    } catch (error) {
      console.error('[Sync] Areas sync failed:', error.message);
      throw error;
    }
  }

  /**
   * Sync tasks for a specific area document
   */
  async syncAreaTasks(areaDoc) {
    console.log(`[Sync] Syncing area: ${areaDoc.title}`);

    // Implementation would:
    // 1. Get all tasks from this area document
    // 2. Get corresponding Motion tasks (filtered by label)
    // 3. Perform bidirectional sync
  }

  /**
   * Sync new Motion tasks to Craft inbox
   */
  async syncNewMotionTasksToInbox(motionTasks) {
    // Find tasks in Motion that don't have a mapping
    const unmappedTasks = motionTasks.filter(task => {
      return !Array.from(this.syncState.values()).some(
        mapping => mapping.motionId === task.id
      );
    });

    if (unmappedTasks.length > 0) {
      console.log(`[Sync] Found ${unmappedTasks.length} new Motion tasks for inbox`);
      // Add them to the inbox document
    }
  }

  /**
   * Run complete sync cycle
   */
  async runSync() {
    console.log('=== Starting Sync Cycle ===');
    const startTime = Date.now();

    try {
      await this.loadSyncState();
      await this.syncProjects();
      await this.syncAreas();
      await this.saveSyncState();

      const duration = Date.now() - startTime;
      console.log(`=== Sync Completed in ${duration}ms ===`);

      return { success: true, duration };
    } catch (error) {
      console.error('=== Sync Failed ===', error);
      return { success: false, error: error.message };
    }
  }
}
