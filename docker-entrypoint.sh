#!/bin/sh

# We can do all sorts of housekeeping here before we launch the app
# if necessary

exec /sbin/pid1 -u nextjs -g nodejs "$@"
