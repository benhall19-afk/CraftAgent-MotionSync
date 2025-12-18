# Local Cron Job Setup for Motion-Craft Sync

## Option 1: Crontab (Simplest)

### Step 1: Edit Your API Key

Open `run-sync.sh` and replace `your-api-key-here` with your actual Anthropic API key:

```bash
nano /Users/benhpro/motion-craft-sync/run-sync.sh
```

### Step 2: Add Cron Jobs

Open your crontab:

```bash
crontab -e
```

Add these lines:

```bash
# Motion-Craft Sync - Active hours (every 15 min, 6 AM - 11 PM)
0,15,30,45 6-23 * * * /Users/benhpro/motion-craft-sync/run-sync.sh

# Motion-Craft Sync - Off hours (every 2 hours, midnight - 6 AM)
0 0,2,4 * * * /Users/benhpro/motion-craft-sync/run-sync.sh
```

Save and exit (`:wq` in vim, or `Ctrl+X` then `Y` in nano).

### Step 3: Verify

Check your crontab:

```bash
crontab -l
```

### Step 4: View Logs

Logs are saved to `~/Library/Logs/motion-craft-sync/`

```bash
# View today's log
tail -f ~/Library/Logs/motion-craft-sync/sync-$(date +%Y%m%d).log
```

## Option 2: macOS launchd (More Reliable)

### Step 1: Edit API Key (same as above)

### Step 2: Load the Launch Agent

```bash
launchctl load ~/Library/LaunchAgents/com.motioncraft.sync.plist
```

### Step 3: Check Status

```bash
launchctl list | grep motioncraft
```

### Step 4: Unload (if needed)

```bash
launchctl unload ~/Library/LaunchAgents/com.motioncraft.sync.plist
```

## Testing

Run the script manually first to make sure it works:

```bash
/Users/benhpro/motion-craft-sync/run-sync.sh
```

Check the log file:

```bash
cat ~/Library/Logs/motion-craft-sync/sync-$(date +%Y%m%d).log
```

## Benefits of Local Cron

✅ **Free** - No cloud costs
✅ **Simple** - Just cron on your Mac
✅ **Fast** - Direct access to Craft
✅ **Private** - All on your machine

## Drawbacks

⚠️ **Computer must be on** - Won't run if Mac is off/sleeping
⚠️ **Manual updates** - Need to update script for changes

## Alternative: Railway

If you want 24/7 cloud execution even when your Mac is off, use the Railway deployment instead (costs ~$7-8/month).

## Which Should You Use?

- **Local cron**: If your Mac is usually on and you want free automation
- **Railway**: If you want true 24/7 operation regardless of your Mac's state
