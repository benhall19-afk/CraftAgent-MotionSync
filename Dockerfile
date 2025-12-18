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

# Create startup script that exports env vars to cron
RUN echo '#!/bin/bash\n\
printenv | grep -v "no_proxy" >> /etc/environment\n\
cron\n\
tail -f /var/log/cron.log' > /start.sh && chmod +x /start.sh

# Start with env vars exported
CMD ["/start.sh"]
