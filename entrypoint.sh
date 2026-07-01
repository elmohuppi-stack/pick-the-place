#!/bin/sh
set -e

echo "=== Running Prisma migrations ==="
prisma migrate deploy --config=prisma.config.cjs

echo "=== Starting Next.js server ==="
exec node server.js
