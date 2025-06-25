#!/bin/sh

# Start cron service for periodic fetches
echo "[INFO] Starting cron..."
cron

# Start the main chatbot server in the foreground
echo "[INFO] Starting chatbot server..."
exec npm run startChatbotServerProduction
