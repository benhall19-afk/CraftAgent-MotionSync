/**
 * Motion-Craft Sync Configuration
 */

export const config = {
  motion: {
    apiKey: 'ScjduIb1fn8jvOVptMJGEa76E+THmWN4tnETFQFSLjc=',
    baseUrl: 'https://api.usemotion.com/v1',
    workspaces: {
      life: '8mJDMG2yFPcYNdokn7_w4',
      private: 'etHAsyJBqUWBPD6ZFPr7o'
    }
  },

  craft: {
    folders: {
      projectsInProgress: '1390',
      areasOfLife: '1361'
    },
    documents: {
      motionInbox: '1399',
      syncConfig: '1586'
    },
    collections: {
      syncMappings: '1619'
    }
  },

  sync: {
    activeHours: {
      start: 6,  // 6 AM GMT+7
      end: 23,   // 11 PM GMT+7
      interval: 15 * 60 * 1000  // 15 minutes
    },
    offHours: {
      interval: 2 * 60 * 60 * 1000  // 2 hours
    },
    timezone: 'Asia/Bangkok'
  },

  mapping: {
    craftToMotion: {
      state: {
        todo: { completed: false, statusName: 'Todo' },
        done: { completed: true, statusName: 'Completed' },
        canceled: { completed: false, statusName: 'Canceled' }
      }
    },
    motionToCraft: {
      completed: 'done',
      canceled: 'canceled',
      default: 'todo'
    }
  }
};
