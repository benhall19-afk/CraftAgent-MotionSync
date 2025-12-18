# Motion-Craft Sync Agent

Automated bidirectional sync agent between Motion (task management) and Craft Documents, running on Railway with scheduled cron jobs.

## Features

- **Bidirectional Sync**: Tasks sync between Motion and Craft with latest-wins conflict resolution
- **Project Mapping**: 12 pre-configured project mappings between Motion "Life" workspace and Craft Projects
- **Areas of Life**: Tasks in Motion "My Private Workspace" sync with Craft based on document locations
- **Label Inheritance**: Private workspace tasks automatically get labeled based on their Craft document location
- **Smart Scheduling**:
  - Active hours (6 AM - 11 PM GMT+7): Every 15 minutes
  - Off hours: Every 2 hours
- **Recurring Task Exclusion**: Skips recurring tasks (handled manually)
- **Auto-Schedule**: All synced tasks have Motion auto-schedule enabled with 15-minute default duration

## How It Works

This agent runs on **Railway** using a Docker container with:

1. **Ubuntu base** with Craft CLI installed
2. **Cron daemon** that runs on schedule
3. **Craft Agent execution** with full MCP tool access
4. **Motion API integration** for bidirectional sync
5. **Results posted** to Craft Notifications collection

## Railway Deployment

### Prerequisites

1. **Railway account** (https://railway.app)
2. **GitHub repository** (already at: `benhall19-afk/CraftAgent-MotionSync`)
3. **Anthropic API key** for Claude
4. **Craft MCP URL** for your workspace
5. **Motion API key**: `ScjduIb1fn8jvOVptMJGEa76E+THmWN4tnETFQFSLjc=`

### Setup Instructions

#### Step 1: Create Railway Project

1. Go to **Railway**: https://railway.app
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose: **benhall19-afk/CraftAgent-MotionSync**

#### Step 2: Add Environment Variables

In Railway dashboard → your project → **Variables** tab, add:

```
CRAFT_ANTHROPIC_API_KEY=<your-anthropic-api-key>
CRAFT_MCP_URL=craft://<your-workspace-id>
MOTION_API_KEY=ScjduIb1fn8jvOVptMJGEa76E+THmWN4tnETFQFSLjc=
TZ=Asia/Bangkok
```

**How to get CRAFT_MCP_URL:**
- Format: `craft://<workspace-id>`
- Find your workspace ID in Craft settings or from the Craft Agents setup

#### Step 3: Deploy

Railway will automatically:
- Detect the `Dockerfile`
- Build the Docker image
- Start the container with cron daemon
- Begin running syncs on schedule

#### Step 4: Monitor

Check Railway logs to see:
- Cron job executions
- Sync run outputs
- Any errors

Also check your Craft **Notifications** collection (ID: 2041) for sync summaries!

## Schedule

The cron jobs run on **Asia/Bangkok (GMT+7)** timezone:

### Active Hours (6 AM - 11 PM)
Runs every 15 minutes:
```
0,15,30,45 6-23 * * *
```

### Off Hours (11 PM - 6 AM)
Runs every 2 hours:
```
0 0,2,4 * * *
```

## Architecture

```
┌─────────────────┐
│ Railway Docker  │
│ Container       │
│                 │
│  ┌───────────┐  │
│  │   Cron    │  │
│  │  Daemon   │  │
│  └─────┬─────┘  │
│        │        │
│        ▼        │
│  ┌───────────┐  │
│  │ Craft CLI │  │
│  └─────┬─────┘  │
└────────┼────────┘
         │
         ▼
┌─────────────────┐         ┌──────────────────┐
│                 │         │                  │
│  Craft Agent    │◄────────│  Motion API      │
│  (MCP Tools)    │         │                  │
│                 │         │                  │
└────────┬────────┘         └──────────────────┘
         │
         ▼
┌─────────────────┐
│ Craft Documents │
│ - Projects      │
│ - Areas of Life │
│ - Collections   │
└─────────────────┘
```

## Cost Estimate

Railway Hobby Plan:
- **Base**: $5/month
- **Container usage**: ~$2-3/month (lightweight, minimal CPU)
- **Total**: ~$7-8/month

## Monitoring

### Check Sync Status

1. **Railway Logs**
   - Go to Railway dashboard → your service
   - View **Deployments** → **Logs**
   - See cron executions and sync outputs

2. **Craft Notifications** (Collection ID: 2041)
   - View sync run summaries
   - See tasks created/updated counts
   - Check for errors

3. **Sync Status Log** (Collection ID: 1942)
   - Detailed sync history
   - Full statistics per run

## Valid Labels (Areas of Life)

Tasks in Motion "My Private Workspace" sync to Craft based on these labels (must match exactly):

- ✍️ Learning the Thai Language
- 🏠 Rental Houses
- 💰️ Finances
- 📖 Bible and Prayer
- 📝 Blog Writing
- 🧘‍♂️ Health and Fitness
- 🎙️ Podcasting
- 👨‍👩‍👦 My Family

## Files

- **Dockerfile** - Container definition with Ubuntu, Craft CLI, and cron
- **sync-cron.sh** - Script that executes the Craft Agent
- **crontab** - Cron schedule configuration
- **railway.json** - Railway deployment configuration
- **.github/workflows/motion-sync.yml** - Alternative GitHub Actions option

## Troubleshooting

### Container keeps restarting
- Check Railway logs for errors
- Verify environment variables are set correctly
- Ensure CRAFT_MCP_URL format is correct: `craft://<workspace-id>`

### Cron not running
- Check if cron daemon started: Look for "Starting Motion-Craft sync..." in logs
- Verify timezone is set correctly (should be Asia/Bangkok)
- Check crontab syntax

### "Unauthorized" or MCP connection errors
- Verify `CRAFT_MCP_URL` is correct
- Check `CRAFT_ANTHROPIC_API_KEY` is valid
- Ensure workspace ID is correct in MCP URL

### Tasks not syncing
- Check Motion API key in Railway variables
- Review Craft Notifications collection for errors
- Check Railway logs for detailed error messages

### Labels not applying
- Ensure labels exist in Motion workspace
- Check task is in valid Areas of Life document
- Verify document name matches label exactly (including emojis)

## Manual Sync Trigger

To trigger a sync manually, you can:

1. **Restart Railway service** (forces immediate cron execution)
2. **Run locally** with Craft CLI:
   ```bash
   craft -w "craft://<workspace-id>" \
     -p "Run the Motion Sync Agent workflow" \
     -m claude-sonnet-4-20250514
   ```

## Alternative: GitHub Actions

This repository also includes a GitHub Actions workflow (`.github/workflows/motion-sync.yml`) as an alternative to Railway. GitHub Actions is free but requires your computer or a server to be the MCP host.

Railway is recommended for true 24/7 cloud execution.

## Support

For issues or questions:
- Check Railway logs for deployment/execution errors
- Review Craft Notifications collection (ID: 2041)
- Verify all environment variables are configured
- Check Motion Sync Agent document (ID: 1723) for configuration

## Repository

https://github.com/benhall19-afk/CraftAgent-MotionSync

## License

MIT
