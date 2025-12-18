# Motion-Craft Sync Agent

Automated bidirectional sync agent between Motion (task management) and Craft Documents.

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

## Workspace Structure

### Life Workspace (Projects)
Tasks in Motion "Life" workspace are synced to corresponding Craft project documents based on 12 project mappings.

### Private Workspace (Areas of Life)
Tasks in Motion "My Private Workspace" sync to Craft Inbox. When tasks are moved to specific Areas of Life documents in Craft, they inherit that document's label in Motion.

**Valid Labels (must match Craft document titles exactly)**:
- ✍️ Learning the Thai Language
- 🏠 Rental Houses
- 💰️ Finances
- 📖 Bible and Prayer
- 📝 Blog Writing
- 🧘‍♂️ Health and Fitness
- 🎙️ Podcasting
- 👨‍👩‍👦 My Family

## Deployment to Railway

### Prerequisites

1. **Motion API Key**: Already have: `ScjduIb1fn8jvOVptMJGEa76E+THmWN4tnETFQFSLjc=`
2. **Craft API Token**: Get from Craft Settings → API Access
3. **Craft Space ID**: Your Craft workspace ID
4. **GitHub Account**: To deploy via GitHub integration

### Step 1: Push to GitHub

```bash
cd /Users/benhpro/motion-craft-sync

# Initialize git repository
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Motion-Craft Sync Agent"

# Create GitHub repository (via GitHub CLI or web interface)
gh repo create motion-craft-sync --public --source=. --remote=origin

# Push to GitHub
git push -u origin main
```

### Step 2: Deploy to Railway

1. **Go to Railway**: https://railway.app
2. **New Project** → **Deploy from GitHub repo**
3. **Select**: `motion-craft-sync` repository
4. **Add Environment Variables**:
   ```
   MOTION_API_KEY=ScjduIb1fn8jvOVptMJGEa76E+THmWN4tnETFQFSLjc=
   CRAFT_API_TOKEN=<your-craft-api-token>
   CRAFT_SPACE_ID=<your-craft-space-id>
   TZ=Asia/Bangkok
   NODE_ENV=production
   ```
5. **Deploy**: Railway will automatically detect `package.json` and deploy

### Step 3: Get Craft API Credentials

1. **Open Craft** → **Settings** → **API Access**
2. **Create new API token** (if you don't have one)
3. **Copy the token** - this is your `CRAFT_API_TOKEN`
4. **Find your Space ID**: Check the URL when viewing your space (e.g., `craft.do/s/abc123` → Space ID is `abc123`)

### Step 4: Monitor

Railway provides:
- **Logs**: View sync runs and any errors
- **Metrics**: CPU, memory, network usage
- **Deployments**: Automatic deployments on git push

Check the **Notifications** collection in Craft (ID: 2041) to see sync status.

## Local Development

```bash
# Install dependencies
npm install

# Set environment variables
export MOTION_API_KEY="ScjduIb1fn8jvOVptMJGEa76E+THmWN4tnETFQFSLjc="
export CRAFT_API_TOKEN="your_craft_api_token"
export CRAFT_SPACE_ID="your_space_id"
export TZ="Asia/Bangkok"

# Run
npm start
```

## Architecture

```
┌─────────────────┐         ┌──────────────────┐
│                 │         │                  │
│  Motion API     │◄────────│  Sync Agent      │
│  (2 workspaces) │         │  (Railway)       │
│                 │         │                  │
└─────────────────┘         └────────┬─────────┘
                                     │
                                     │
                                     ▼
                            ┌──────────────────┐
                            │                  │
                            │  Craft MCP       │
                            │  Server          │
                            │                  │
                            └────────┬─────────┘
                                     │
                                     ▼
                            ┌──────────────────┐
                            │                  │
                            │  Craft Documents │
                            │  - Projects      │
                            │  - Areas of Life │
                            │  - Task Inbox    │
                            │  - Collections   │
                            │                  │
                            └──────────────────┘
```

## Cost Estimate

Railway pricing:
- **Hobby Plan**: $5/month + usage
- **Estimated usage**: ~$0-2/month (very light workload)
- **Total**: ~$5-7/month

## Sync Collections

The agent uses three Craft collections for coordination:

1. **Sync Mappings** (ID: 1619): Tracks all Craft-Motion ID mappings
2. **Notifications** (ID: 2041): Sync run summaries and status
3. **Sync Status Log** (ID: 1942): Detailed sync history

## Troubleshooting

### Logs show "Craft API error"
- Check `CRAFT_API_TOKEN` is valid
- Verify `CRAFT_SPACE_ID` is correct
- Ensure API token has proper permissions

### Tasks not syncing
- Check Motion API key is valid
- Verify workspace IDs haven't changed
- Review Notifications collection for error details

### Labels not applying
- Ensure labels exist in Motion workspace first
- Check task is in a valid Areas of Life document
- Verify document name matches label exactly (including emojis)

## Support

For issues or questions:
- Check Craft Notifications collection (ID: 2041)
- Review Railway logs
- Verify Motion API key and Craft API credentials

## License

MIT
