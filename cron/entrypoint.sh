#!/bin/sh
set -e

# Substitute the real CRON_SECRET into the crontab template
sed "s|CRON_SECRET_PLACEHOLDER|${CRON_SECRET}|g" /etc/crontabs/app > /tmp/crontab
crontab /tmp/crontab

echo "[cron] Registered cron jobs:"
crontab -l

# Start crond in the foreground
exec crond -f -l 2
