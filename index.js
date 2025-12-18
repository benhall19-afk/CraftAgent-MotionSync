const cron = require('node-cron');
const fetch = require('node-fetch');

// Environment variables from Railway
const MOTION_API_KEY = process.env.MOTION_API_KEY;
const CRAFT_API_TOKEN = process.env.CRAFT_API_TOKEN;
const CRAFT_SPACE_ID = process.env.CRAFT_SPACE_ID;

// Motion API Configuration
const MOTION_API_BASE = 'https://api.usemotion.com/v1';
const MOTION_HEADERS = {
  'X-API-Key': MOTION_API_KEY,
  'Content-Type': 'application/json'
};

// Workspace IDs
const LIFE_WORKSPACE_ID = 'wks_KVBQSwajvlUdRj0pXW36Xx';
const PRIVATE_WORKSPACE_ID = 'wks_FJI5I05AwNE52l31BKDFAH';

// Valid Areas of Life labels for Private workspace
const VALID_LABELS = [
  '✍️ Learning the Thai Language',
  '🏠 Rental Houses',
  '💰️ Finances',
  '📖 Bible and Prayer',
  '📝 Blog Writing',
  '🧘‍♂️ Health and Fitness',
  '🎙️ Podcasting',
  '👨‍👩‍👦 My Family'
];

// Helper to get current date in Bangkok timezone
function getTodayBangkok() {
  const now = new Date();
  const bangkokTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
  return bangkokTime.toISOString().split('T')[0];
}

// Helper to get current datetime in Bangkok timezone
function getNowBangkok() {
  const now = new Date();
  return now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' });
}

// Craft API Configuration
const CRAFT_API_BASE = 'https://api.craft.do/v1';
const CRAFT_HEADERS = {
  'Authorization': `Bearer ${CRAFT_API_TOKEN}`,
  'Content-Type': 'application/json'
};

// Craft API Helper - Call Craft REST API
async function callCraftAPI(endpoint, options = {}) {
  try {
    const url = `${CRAFT_API_BASE}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: { ...CRAFT_HEADERS, ...options.headers }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Craft API error: ${response.status} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Craft API call failed for ${endpoint}:`, error);
    throw error;
  }
}

// Motion API Helper
async function callMotionAPI(endpoint, options = {}) {
  try {
    const url = `${MOTION_API_BASE}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: { ...MOTION_HEADERS, ...options.headers }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Motion API error: ${response.status} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Motion API call failed for ${endpoint}:`, error);
    throw error;
  }
}

// Load all mappings from Craft collection
async function loadMappings() {
  console.log('Loading sync mappings from Craft...');
  const result = await callCraftAPI(`/spaces/${CRAFT_SPACE_ID}/collections/1619/items`);

  const taskMappings = result.items.filter(item =>
    item.properties.type === 'task'
  );

  const projectMappings = result.items.filter(item =>
    item.properties.type === 'project'
  );

  console.log(`Loaded ${taskMappings.length} task mappings and ${projectMappings.length} project mappings`);
  return { taskMappings, projectMappings };
}

// Get all Motion tasks for a workspace
async function getMotionTasks(workspaceId) {
  console.log(`Fetching Motion tasks for workspace ${workspaceId}...`);
  const data = await callMotionAPI(`/tasks?workspaceId=${workspaceId}`);
  return data.tasks || [];
}

// Get all Craft tasks for a scope
async function getCraftTasks(scope, documentId = null) {
  let endpoint = `/spaces/${CRAFT_SPACE_ID}/tasks?scope=${scope}`;

  if (documentId) {
    endpoint += `&documentId=${documentId}`;
  }

  const result = await callCraftAPI(endpoint);
  return result.tasks || [];
}

// Get document info for a task to determine label
async function getTaskDocument(taskId) {
  try {
    const result = await callCraftAPI(`/spaces/${CRAFT_SPACE_ID}/blocks/${taskId}`);

    // Check if task is in a document within Areas of Life
    const location = result.location || {};
    if (location.documentTitle && VALID_LABELS.includes(location.documentTitle)) {
      return location.documentTitle;
    }

    return null;
  } catch (error) {
    console.error(`Failed to get document for task ${taskId}:`, error);
    return null;
  }
}

// Create task in Motion
async function createMotionTask(task, workspaceId, projectId = null) {
  const today = getTodayBangkok();

  const payload = {
    name: task.markdown || task.title,
    workspaceId: workspaceId,
    startOn: task.taskInfo?.scheduleDate || today,
    dueDate: task.taskInfo?.deadlineDate,
    duration: 15,
    autoScheduled: {
      startDate: task.taskInfo?.scheduleDate || today
    }
  };

  if (projectId) {
    payload.projectId = projectId;
  }

  // Add label for Private workspace tasks
  if (workspaceId === PRIVATE_WORKSPACE_ID) {
    const label = await getTaskDocument(task.id);
    if (label) {
      payload.labels = [label];
    }
  }

  console.log(`Creating Motion task: ${payload.name}`);
  return await callMotionAPI('/tasks', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

// Create task in Craft
async function createCraftTask(task, location) {
  console.log(`Creating Craft task: ${task.name}`);

  const today = getTodayBangkok();

  const payload = {
    tasks: [{
      markdown: task.name,
      location: location,
      taskInfo: {
        state: task.completed ? 'done' : 'todo',
        scheduleDate: task.startOn || today,
        deadlineDate: task.dueDate
      }
    }]
  };

  const result = await callCraftAPI(`/spaces/${CRAFT_SPACE_ID}/tasks`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return result.tasks[0];
}

// Update Motion task
async function updateMotionTask(taskId, updates) {
  console.log(`Updating Motion task ${taskId}`);
  return await callMotionAPI(`/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  });
}

// Update Craft task
async function updateCraftTask(taskId, updates) {
  console.log(`Updating Craft task ${taskId}`);

  const payload = {
    tasksToUpdate: [{
      id: taskId,
      ...updates
    }]
  };

  return await callCraftAPI(`/spaces/${CRAFT_SPACE_ID}/tasks`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

// Create task mapping in Craft collection
async function createTaskMapping(craftId, motionId, taskName, workspace, startDate, deadlineDate) {
  const today = getTodayBangkok();

  const payload = {
    items: [{
      entity_name: taskName,
      properties: {
        craft_id: craftId,
        motion_id: motionId,
        type: 'task',
        workspace: workspace,
        start_date: startDate,
        deadline_date: deadlineDate,
        last_synced: today,
        status: 'synced'
      }
    }]
  };

  return await callCraftAPI(`/spaces/${CRAFT_SPACE_ID}/collections/1619/items`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

// Post notification to Craft
async function postNotification(message, type, details) {
  const today = getTodayBangkok();
  const now = new Date().toLocaleTimeString('en-US', {
    timeZone: 'Asia/Bangkok',
    hour12: false
  });

  const payload = {
    items: [{
      notification: message,
      properties: {
        date: today,
        time: now.substring(0, 5), // HH:MM format
        type: type,
        projects: details.projects || 0,
        tasks_created: details.tasksCreated || 0,
        tasks_updated: details.tasksUpdated || 0,
        conflicts: details.conflicts || 0,
        notes: details.notes || ''
      }
    }]
  };

  return await callCraftAPI(`/spaces/${CRAFT_SPACE_ID}/collections/2041/items`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

// Main sync function
async function runSync() {
  const startTime = Date.now();
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[${getNowBangkok()}] Starting Motion-Craft sync...`);
  console.log(`${'='.repeat(60)}\n`);

  const stats = {
    projects: 0,
    tasksCreated: 0,
    tasksUpdated: 0,
    conflicts: 0,
    errors: []
  };

  try {
    // Load existing mappings
    const { taskMappings, projectMappings } = await loadMappings();
    stats.projects = projectMappings.length;

    // Create lookup maps
    const craftToMotion = new Map();
    const motionToCraft = new Map();

    taskMappings.forEach(mapping => {
      const craftId = mapping.properties.craft_id;
      const motionId = mapping.properties.motion_id;
      craftToMotion.set(craftId, { motionId, mapping });
      motionToCraft.set(motionId, { craftId, mapping });
    });

    console.log(`Loaded ${taskMappings.length} existing task mappings\n`);

    // Sync Life Workspace (Projects)
    console.log('--- Syncing Life Workspace (Projects) ---');
    const lifeMotionTasks = await getMotionTasks(LIFE_WORKSPACE_ID);
    const lifeUnmapped = lifeMotionTasks.filter(t =>
      !motionToCraft.has(t.id) &&
      !t.completed &&
      !t.parentRecurringTaskId // Exclude recurring tasks
    );

    console.log(`Found ${lifeUnmapped.length} unmapped Life workspace tasks`);

    for (const motionTask of lifeUnmapped) {
      try {
        // Find corresponding Craft project
        const projectMapping = projectMappings.find(pm =>
          pm.properties.motion_id === motionTask.project?.id
        );

        if (!projectMapping) {
          console.log(`Skipping task "${motionTask.name}" - no project mapping`);
          continue;
        }

        const craftDocId = projectMapping.properties.craft_id;

        // Create in Craft
        const craftTask = await createCraftTask(motionTask, {
          type: 'document',
          documentId: craftDocId
        });

        // Create mapping
        await createTaskMapping(
          craftTask.id,
          motionTask.id,
          motionTask.name,
          'Life',
          motionTask.startOn,
          motionTask.dueDate
        );

        stats.tasksCreated++;
        console.log(`✓ Created and mapped: ${motionTask.name}`);

      } catch (error) {
        console.error(`✗ Failed to sync Life task "${motionTask.name}":`, error.message);
        stats.errors.push(`Life: ${motionTask.name} - ${error.message}`);
      }
    }

    // Sync Private Workspace (Areas of Life)
    console.log('\n--- Syncing Private Workspace (Areas of Life) ---');
    const privateMotionTasks = await getMotionTasks(PRIVATE_WORKSPACE_ID);
    const privateUnmapped = privateMotionTasks.filter(t =>
      !motionToCraft.has(t.id) &&
      !t.completed &&
      !t.parentRecurringTaskId // Exclude recurring tasks
    );

    console.log(`Found ${privateUnmapped.length} unmapped Private workspace tasks`);

    for (const motionTask of privateUnmapped) {
      try {
        // Create in Craft Inbox (no label matching here - just inbox)
        const craftTask = await createCraftTask(motionTask, {
          type: 'inbox'
        });

        // Create mapping
        await createTaskMapping(
          craftTask.id,
          motionTask.id,
          motionTask.name,
          'Private',
          motionTask.startOn,
          motionTask.dueDate
        );

        stats.tasksCreated++;
        console.log(`✓ Created and mapped: ${motionTask.name}`);

      } catch (error) {
        console.error(`✗ Failed to sync Private task "${motionTask.name}":`, error.message);
        stats.errors.push(`Private: ${motionTask.name} - ${error.message}`);
      }
    }

    // Check for location/label changes on existing mappings
    console.log('\n--- Checking task locations for label updates ---');
    const privateMappings = taskMappings.filter(m =>
      m.properties.workspace === 'Private'
    );

    for (const mapping of privateMappings) {
      try {
        const craftId = mapping.properties.craft_id;
        const motionId = mapping.properties.motion_id;

        // Get current label based on document location
        const currentLabel = await getTaskDocument(craftId);

        // Get Motion task to check current labels
        const motionTask = await callMotionAPI(`/tasks/${motionId}`);
        const motionLabels = motionTask.labels || [];

        // If label changed, update Motion
        if (currentLabel && !motionLabels.includes(currentLabel)) {
          await updateMotionTask(motionId, {
            labels: [currentLabel]
          });
          stats.tasksUpdated++;
          console.log(`✓ Updated label for "${motionTask.name}" to "${currentLabel}"`);
        } else if (!currentLabel && motionLabels.length > 0) {
          // Task moved out of Areas of Life - remove label
          await updateMotionTask(motionId, {
            labels: []
          });
          stats.tasksUpdated++;
          console.log(`✓ Removed label from "${motionTask.name}"`);
        }

      } catch (error) {
        console.error(`✗ Failed to update label for mapping ${mapping.id}:`, error.message);
        stats.errors.push(`Label update: ${mapping.entity_name} - ${error.message}`);
      }
    }

    // Post notification
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const notesArr = [];

    if (stats.tasksCreated > 0) {
      notesArr.push(`Created ${stats.tasksCreated} new tasks`);
    }
    if (stats.tasksUpdated > 0) {
      notesArr.push(`Updated ${stats.tasksUpdated} tasks`);
    }
    if (stats.errors.length > 0) {
      notesArr.push(`${stats.errors.length} errors occurred`);
    }
    if (stats.tasksCreated === 0 && stats.tasksUpdated === 0) {
      notesArr.push('No changes needed');
    }

    await postNotification(
      'Sync completed',
      stats.errors.length > 0 ? 'Warning' : 'Success',
      {
        projects: stats.projects,
        tasksCreated: stats.tasksCreated,
        tasksUpdated: stats.tasksUpdated,
        conflicts: stats.conflicts,
        notes: notesArr.join('. ') + `. Duration: ${duration}s`
      }
    );

    console.log(`\n${'='.repeat(60)}`);
    console.log(`Sync completed in ${duration}s`);
    console.log(`Tasks created: ${stats.tasksCreated}`);
    console.log(`Tasks updated: ${stats.tasksUpdated}`);
    console.log(`Errors: ${stats.errors.length}`);
    console.log(`${'='.repeat(60)}\n`);

  } catch (error) {
    console.error('\n✗ SYNC FAILED:', error);

    // Post error notification
    await postNotification(
      'Sync failed',
      'Error',
      {
        projects: stats.projects,
        tasksCreated: stats.tasksCreated,
        tasksUpdated: stats.tasksUpdated,
        conflicts: stats.conflicts,
        notes: `Error: ${error.message}`
      }
    );
  }
}

// Schedule sync jobs
console.log('Motion-Craft Sync Agent starting...');
console.log(`Timezone: Asia/Bangkok (GMT+7)`);
console.log(`Active hours (6 AM - 11 PM): Every 15 minutes`);
console.log(`Off hours (11 PM - 6 AM): Every 2 hours\n`);

// Active hours: Every 15 minutes from 6 AM - 11 PM GMT+7 (23:00-16:00 UTC)
cron.schedule('*/15 23-23,0-16 * * *', () => {
  runSync().catch(err => console.error('Cron job error:', err));
}, {
  timezone: 'Asia/Bangkok'
});

// Off hours: Every 2 hours from 11 PM - 6 AM GMT+7 (16:00-23:00 UTC)
cron.schedule('0 */2 * * *', () => {
  const hour = new Date().getHours();
  // Only run during off-hours (16-23 UTC which is 23-6 Bangkok)
  if (hour >= 16 || hour < 23) {
    runSync().catch(err => console.error('Cron job error:', err));
  }
}, {
  timezone: 'Asia/Bangkok'
});

// Run immediately on startup
console.log('Running initial sync...');
runSync().catch(err => {
  console.error('Initial sync error:', err);
  process.exit(1);
});

// Keep process alive
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});
