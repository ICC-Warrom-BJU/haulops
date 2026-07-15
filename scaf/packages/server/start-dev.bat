@echo off
echo "Waiting for PostgreSQL..."
:waitloop
timeout /t 1 /nobreak >nul
echo "Checking PostgreSQL connection..."
if not exist "test.tmp" (
    echo "Still waiting..."
    goto waitloop
)
del test.tmp
echo "PostgreSQL is ready!"

echo "Running Prisma migrations..."
npx prisma migrate dev --name init --preview-feature || true

if exist "prisma\seed.ts" (
    echo "Seeding database..."
    npx tsx prisma\seed.ts || true
)

echo "Starting development server..."
npm run dev
