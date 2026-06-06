#!/bin/sh
set -e

# Prove env vars arrived
echo "=== ENV CHECK ==="
echo "DATABASE_URL=$DATABASE_URL"
echo "NODE_ENV=$NODE_ENV"
echo "================="

echo "→ Generating Prisma client..."
pnpm dlx prisma generate

echo "→ Running migrations..."
pnpm dlx prisma migrate deploy

echo "→ Starting app..."
exec npm run start:dev