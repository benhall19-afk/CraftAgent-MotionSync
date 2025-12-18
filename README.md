# Motion-Craft Sync Agent

Automated bidirectional sync agent between Motion (task management) and Craft Documents using GitHub Actions.

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

This agent runs as a **Craft Agent workflow** triggered by **GitHub Actions** on a schedule. The workflow:

1. Installs Craft CLI in GitHub Actions runner
2. Connects to your Craft workspace via MCP
3. Executes the Motion Sync Agent (document ID: 1723)
4. Agent has full access to Craft MCP tools and Motion API
5. Posts results to Craft Notifications collection

## Deployment

### Prerequisites

1. **GitHub repository** (already created: `benhall19-afk/CraftAgent-MotionSync`)
2. **Craft workspace** with Motion Sync Agent configured
3. **Anthropic API key** for Claude
4. **Motion API key**: `ScjduIb1fn8jvOVptMJGEa76E+THmWN4tnETFQFSLjc=`

### Setup Instructions

#### Step 1: Add GitHub Secrets

Go to your repository → **Settings** → **Secrets and variables** → **Actions**

Add these secrets:

1. **CRAFT_ANTHROPIC_API_KEY**
   - Your Anthropic API key
   - Get from: https://console.anthropic.com/

2. **CRAFT_MCP_URL**
   - Your Craft workspace MCP URL
   - Format: `craft://<workspace-id>`
   - Find in Craft Agents setup

3. **MOTION_API_KEY**
   - Value: `ScjduIb1fn8jvOVptMJGEa76E+THmWN4tnETFQFSLjc=`

#### Step 2: Push Workflow to GitHub

The workflow file is already in `.github/workflows/motion-sync.yml`

```bash
cd /Users/benhpro/motion-craft-sync
git add .github/workflows/motion-sync.yml
git commit -m "Add GitHub Actions workflow for scheduled sync"
git push origin main
```

#### Step 3: Enable Actions

1. Go to your repository on GitHub
2. Click **Actions** tab
3. If prompted, enable GitHub Actions for this repository

#### Step 4: Test Manual Run

1. Go to **Actions** tab
2. Select **Motion-Craft Sync Agent** workflow
3. Click **Run workflow** → **Run workflow**
4. Watch the logs to verify it works

### Schedule

The workflow runs automatically:

- **Every 15 minutes**: 6:00 AM - 11:45 PM GMT+7 (active hours)
- **Every 2 hours**: 11:00 PM - 6:00 AM GMT+7 (off-hours)

GitHub Actions uses UTC time. The cron expressions are pre-configured for GMT+7 (Bangkok timezone).

## Monitoring

### Check Sync Status

1. **Craft Notifications Collection** (ID: 2041)
   - View sync run summaries
   - See tasks created/updated counts
   - Check for errors

2. **GitHub Actions Logs**
   - Go to repository → Actions tab
   - Click on any workflow run
   - View detailed execution logs

3. **Sync Status Log Collection** (ID: 1942)
   - Detailed sync history in Craft
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

## Cost

GitHub Actions is **free** for public repositories with generous limits:

- 2,000 minutes/month free for private repos
- Each sync run takes ~1-2 minutes
- ~45 runs per day = ~1,350 minutes/month
- **Total cost: $0** (well within free tier)

## Architecture

```
┌─────────────────┐
│ GitHub Actions  │
│ (Scheduled)     │
└────────┬────────┘
         │ Triggers every 15 min
         │
         ▼
┌─────────────────┐
│  Craft CLI      │
│  Installs       │
└────────┬────────┘
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

## Troubleshooting

### Workflow fails with "Craft CLI not found"
- Check the install step completed successfully
- Verify the curl command ran without errors

### "Unauthorized" or MCP connection errors
- Verify `CRAFT_MCP_URL` is correct in GitHub Secrets
- Check `CRAFT_ANTHROPIC_API_KEY` is valid
- Ensure MCP URL format: `craft://<workspace-id>`

### Tasks not syncing
- Check Motion API key is valid in GitHub Secrets
- Review Craft Notifications collection for error details
- Check GitHub Actions logs for detailed error messages

### Labels not applying
- Ensure labels exist in Motion workspace first
- Check task is in a valid Areas of Life document
- Verify document name matches label exactly (including emojis)

## Manual Execution

To run the sync manually without waiting for the schedule:

1. Go to GitHub repository → **Actions** tab
2. Select **Motion-Craft Sync Agent** workflow
3. Click **Run workflow**
4. Select branch: **main**
5. Click **Run workflow**

Or use Craft Agents CLI locally:

```bash
craft -w "craft://<workspace-id>" \
  -p "Run the Motion Sync Agent workflow" \
  -m claude-sonnet-4-20250514
```

## Support

For issues or questions:
- Check Craft Notifications collection (ID: 2041)
- Review GitHub Actions logs
- Verify all GitHub Secrets are configured
- Check Motion Sync Agent document (ID: 1723) for configuration

## License

MIT
