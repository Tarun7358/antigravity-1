const { PrismaClient } = require('@prisma/client');

let prisma;

if (process.env.DATABASE_URL) {
  prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
  console.log('[Prisma] PostgreSQL client initialized');
} else {
  // Stub — prevents crash when DATABASE_URL is not set (Render free tier without Postgres)
  console.warn('[Prisma] DATABASE_URL not set — Prisma is disabled. Using Firebase fallback.');
  prisma = null;
}

module.exports = prisma;
