FROM ubuntu:22.04

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    cron \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

# Set timezone to Bangkok
ENV TZ=Asia/Bangkok
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Install Craft CLI
RUN curl -fsSL https://agents.craft.do/install.sh | bash

# Copy cron job script
COPY sync-cron.sh /usr/local/bin/sync-cron.sh
RUN chmod +x /usr/local/bin/sync-cron.sh

# Copy crontab file
COPY crontab /etc/cron.d/motion-sync
RUN chmod 0644 /etc/cron.d/motion-sync
RUN crontab /etc/cron.d/motion-sync

# Create log file
RUN touch /var/log/cron.log

# Start cron in foreground
CMD cron && tail -f /var/log/cron.log
