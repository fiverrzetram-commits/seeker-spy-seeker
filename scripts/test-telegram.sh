#!/usr/bin/env bash
# scripts/test-telegram.sh
# Simple script to test Telegram notifications. Do not store tokens in the repo.

set -euo pipefail

# load .env if present
if [ -f .env ]; then
  # shellcheck disable=SC1091
  source .env
fi

if [ -z "${TELEGRAM_BOT_TOKEN-}" ] || [ -z "${TELEGRAM_CHAT_ID-}" ]; then
  echo "Error: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set in the environment or .env file"
  exit 1
fi

TEXT="Test message from seeker-spy-seeker at $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d "{\"chat_id\": \"${TELEGRAM_CHAT_ID}\", \"text\": \"${TEXT//"/\"}\" }"

echo "Sent test message (check Telegram)."
