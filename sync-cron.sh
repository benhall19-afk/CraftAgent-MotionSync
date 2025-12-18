#!/bin/bash

# Log start time
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting Motion-Craft sync..." >> /var/log/cron.log

# Run Craft CLI with the Motion Sync Agent
craft \
  -w "$CRAFT_MCP_URL" \
  -p "Run the Motion Sync Agent workflow. Execute the full bidirectional sync between Craft and Motion as documented in the Motion Sync Agent document (ID: 1723). This is an automated scheduled run." \
  --output-format stream-json \
  -m claude-sonnet-4-20250514 \
  >> /var/log/cron.log 2>&1

# Log completion
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Sync completed" >> /var/log/cron.log
