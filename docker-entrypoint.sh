#!/bin/sh

# Run fetchWebsite once at startup (non-blocking)
echo "[INFO] Running initial website fetch..."
npm run fetchWebsiteProduction &

# Start cron service for periodic fetches
echo "[INFO] Starting cron..."
cron

# Start the main chatbot server in the foreground
echo "[INFO] Starting chatbot server..."
exec npm run startChatbotServerProduction
