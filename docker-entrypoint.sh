#!/bin/sh

# We can do all sorts of housekeeping here before we launch the app
# if necessary

# Create yarn cache directory if it doesn't exist
mkdir -p /app/.yarn
chown -R nextjs:nodejs /app/.yarn

exec /sbin/pid1 -u nextjs -g nodejs "$@"
