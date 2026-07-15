#!/bin/sh

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
while ! nc -z postgres 5432; do
  sleep 1
done
echo "PostgreSQL is ready!"

# Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate

# Check if migrations exist
if [ -z "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  echo "Creating initial migration..."
  npx prisma migrate dev --name init --skip-seed
else
  echo "Running Prisma migrations..."
  npx prisma migrate deploy || true
fi

# Run seed if exists
if [ -f "prisma/seed.ts" ]; then
  echo "Seeding database..."
  npx tsx prisma/seed.ts || true
fi

# Start development server
echo "Starting development server..."
npm run dev
