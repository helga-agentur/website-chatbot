FROM node:22.15.1-bookworm-slim

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy application source
COPY . .

# Build TypeScript sources
RUN npm run build

# Install cron and shell utilities
RUN apt-get update && apt-get install -y cron dumb-init bash && apt-get clean

# Run fetchWebsite via cron at 00:00, 08:00, and 16:00 every day and log output to /var/log/cron.log
RUN echo "# fetchWebsite runs at 00:00, 08:00, and 16:00 daily" > /etc/cron.d/fetch-job \
  && echo "0 0,8,16 * * * cd /app && npm run fetchWebsite >> /var/log/cron.log 2>&1" >> /etc/cron.d/fetch-job \
  && chmod 0644 /etc/cron.d/fetch-job \
  && crontab /etc/cron.d/fetch-job

# Copy and prepare entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose application port (if applicable)
EXPOSE 3000

# Use dumb-init to handle PID 1 signals and process reaping
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start container with the entrypoint script
CMD ["sh", "/usr/local/bin/docker-entrypoint.sh"]
