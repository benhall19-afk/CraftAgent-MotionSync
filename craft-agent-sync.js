#!/usr/bin/env node

/**
 * Motion-Craft Sync - Craft Agent Edition
 *
 * This version is designed to be called FROM Craft Agent (not standalone)
 * It receives MCP tool functions as parameters from the Craft Agent environment
 */

import { config } from './src/config.js';
import { MotionAPI } from './src/motion-api.js';

export class CraftAgentSync {
  /**
   * @param {Object} mcpTools - MCP tool functions passed from Craft Agent
   */
  constructor(mcpTools) {
    this.mcp = mcpTools;
    this.motion = new MotionAPI();
    this.syncState = new Map();
  }

  /**
   * Load sync state from Craft collection
   */
  async loadSyncState() {
    try {
      const result = await this.mcp.collectionItems_get({
        collectionBlockId: config.craft.collections.syncMappings,
        _intent: 'Loading sync state mappings from Craft collection'
      });

      if (result.items) {
        result.items.forEach(item => {
          const key = `${item.properties.type}_${item.properties.craft_id}`;
          this.syncState.set(key, {
            craftId: item.properties.craft_id,
            motionId: item.properties.motion_id,
            type: item.properties.type,
            workspace: item.properties.workspace,
            lastSynced: item.properties.last_synced,
            itemId: item.id
          });
        });
      }

      console.log(`✅ Loaded ${this.syncState.size} sync mappings`);
      return this.syncState.size;
    } catch (error) {
      console.error('Failed to load sync state:', error.message);
      return 0;
    }
  }

  /**
   * Save sync state back to Craft collection
   */
  async saveSyncMapping(mapping) {
    try {
      const item = {
        entity_name: mapping.entityName || mapping.craftId,
        craft_id: mapping.craftId,
        motion_id: mapping.motionId,
        type: mapping.type,
        workspace: mapping.workspace,
        last_synced: new Date().toISOString().split('T')[0],
        status: 'synced'
      };

      if (mapping.itemId) {
        // Update existing mapping
        await this.mcp.collectionItems_update({
          collectionBlockId: config.craft.collections.syncMappings,
          itemsToUpdate: [{
            id: mapping.itemId,
            ...item
          }],
          _intent: `Updating sync mapping for ${mapping.craftId}`
        });
      } else {
        // Create new mapping
        await this.mcp.collectionItems_add({
          collectionBlockId: config.craft.collections.syncMappings,
          items: [item],
          _intent: `Creating new sync mapping for ${mapping.craftId}`
        });
      }

      console.log(`✅ Saved mapping: ${mapping.craftId} ↔ ${mapping.motionId}`);
    } catch (error) {
      console.error('Failed to save mapping:', error.message);
    }
  }

  /**
   * Get documents from a folder
   */
  async getDocumentsInFolder(folderId) {
    const result = await this.mcp.documents_list({
      folderIds: [folderId],
      _intent: `Getting documents in folder ${folderId}`
    });

    return result.documents || [];
  }

  /**
   * Get tasks from a document
   */
  async getTasksFromDocument(documentId) {
    const result = await this.mcp.tasks_get({
      scope: 'document',
      documentId: documentId,
      _intent: `Getting tasks from document ${documentId}`
    });

    return result.tasks || [];
  }

  /**
   * Sync projects from Craft to Motion
   */
  async syncProjects() {
    console.log('\n[Sync] Starting project sync...');

    try {
      // Get all Craft documents in Projects - In Progress folder
      const craftDocs = await this.getDocumentsInFolder(config.craft.folders.projectsInProgress);
      console.log(`Found ${craftDocs.length} projects in Craft`);

      // Get all Motion projects in Life workspace
      const motionProjects = await this.motion.getProjects(config.motion.workspaces.life);
      console.log(`Found ${motionProjects.length} projects in Motion`);

      // Create map of existing Motion projects by name
      const motionProjectMap = new Map();
      motionProjects.forEach(proj => motionProjectMap.set(proj.name, proj));

      // Process each Craft document
      for (const doc of craftDocs) {
        console.log(`\nProcessing project: ${doc.title}`);

        const mappingKey = `project_${doc.id}`;
        let mapping = this.syncState.get(mappingKey);

        if (!mapping) {
          // No mapping exists - check if Motion project exists by name
          const existingProject = motionProjectMap.get(doc.title);

          if (existingProject) {
            console.log(`  ↔ Found existing Motion project: ${doc.title}`);

            // Create mapping for existing project
            mapping = {
              entityName: doc.title,
              craftId: doc.id,
              motionId: existingProject.id,
              type: 'project',
              workspace: 'Life'
            };

            await this.saveSyncMapping(mapping);
            this.syncState.set(mappingKey, mapping);
          } else {
            console.log(`  ⊕ Creating new Motion project: ${doc.title}`);

            // Create new Motion project
            const newProject = await this.motion.createProject({
              name: doc.title,
              workspaceId: config.motion.workspaces.life
            });

            mapping = {
              entityName: doc.title,
              craftId: doc.id,
              motionId: newProject.id,
              type: 'project',
              workspace: 'Life'
            };

            await this.saveSyncMapping(mapping);
            this.syncState.set(mappingKey, mapping);

            console.log(`  ✅ Created Motion project: ${doc.title} (${newProject.id})`);
          }
        } else {
          console.log(`  ↔ Existing mapping found`);
        }

        // Sync tasks within this project
        await this.syncProjectTasks(doc.id, doc.title, mapping.motionId);
      }

      console.log('\n✅ Project sync completed');
      return { success: true, projectsProcessed: craftDocs.length };
    } catch (error) {
      console.error('\n❌ Project sync failed:', error.message);
      throw error;
    }
  }

  /**
   * Sync tasks for a specific project
   */
  async syncProjectTasks(craftDocId, projectName, motionProjectId) {
    console.log(`  📋 Syncing tasks for: ${projectName}`);

    try {
      // Get tasks from Craft document
      const craftTasks = await this.getTasksFromDocument(craftDocId);
      console.log(`    Found ${craftTasks.length} tasks in Craft`);

      // Get tasks from Motion project
      const allMotionTasks = await this.motion.getTasks(config.motion.workspaces.life);
      const motionTasks = allMotionTasks.filter(t => t.project?.id === motionProjectId);
      console.log(`    Found ${motionTasks.length} tasks in Motion`);

      // For initial sync, just report what we found
      // Full bidirectional sync would be implemented here

      return { craftTasks: craftTasks.length, motionTasks: motionTasks.length };
    } catch (error) {
      console.error(`    ❌ Task sync failed: ${error.message}`);
      return { craftTasks: 0, motionTasks: 0 };
    }
  }

  /**
   * Run complete sync cycle
   */
  async runSync() {
    console.log('\n' + '='.repeat(60));
    console.log('Motion-Craft Sync - Starting Sync Cycle');
    console.log(new Date().toISOString());
    console.log('='.repeat(60));

    const startTime = Date.now();

    try {
      await this.loadSyncState();
      const result = await this.syncProjects();

      const duration = Date.now() - startTime;
      console.log('\n' + '='.repeat(60));
      console.log(`✅ Sync Completed in ${duration}ms`);
      console.log('='.repeat(60));

      return { success: true, duration, ...result };
    } catch (error) {
      console.error('\n' + '='.repeat(60));
      console.error('❌ Sync Failed:', error.message);
      console.error('='.repeat(60));
      return { success: false, error: error.message };
    }
  }
}
