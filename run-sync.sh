#!/bin/bash

# Motion-Craft Sync Agent Runner
# This script runs the Craft Agent for syncing Motion and Craft

# Set your environment variables
export CRAFT_ANTHROPIC_API_KEY="your-api-key-here"
export MOTION_API_KEY="ScjduIb1fn8jvOVptMJGEa76E+THmWN4tnETFQFSLjc="

# Log file location
LOG_DIR="$HOME/Library/Logs/motion-craft-sync"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/sync-$(date +%Y%m%d).log"

# Log start
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting Motion-Craft sync..." >> "$LOG_FILE"

# Run Craft Agent
craft \
  -p "Run the Motion Sync Agent workflow. Execute the full bidirectional sync between Craft and Motion as documented in the Motion Sync Agent document (ID: 1723). This is an automated scheduled run." \
  -m claude-sonnet-4-20250514 \
  >> "$LOG_FILE" 2>&1

# Log completion
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Sync completed" >> "$LOG_FILE"
