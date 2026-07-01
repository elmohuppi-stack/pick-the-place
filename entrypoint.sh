#!/bin/sh
set -e

echo "=== Running Prisma migrations ==="
prisma --config prisma.config.cjs migrate deploy

echo "=== Starting Next.js server ==="
exec node server.js
