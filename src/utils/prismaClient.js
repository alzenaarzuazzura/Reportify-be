const { PrismaClient } = require('@prisma/client');

// Create Prisma client with timezone handling
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// Set timezone on connection
prisma.$connect().then(async () => {
  try {
    await prisma.$executeRawUnsafe(`SET time_zone = '+07:00'`);
    await prisma.$executeRawUnsafe(`SET SESSION time_zone = '+07:00'`);
    const result = await prisma.$queryRawUnsafe(`SELECT NOW() as curr_time, @@session.time_zone as tz`);
    console.log('✅ Database connected');
    console.log('   Timezone:', result[0].tz);
    console.log('   DB Time:', result[0].curr_time);
  } catch (error) {
    console.warn('⚠️  Could not verify timezone:', error.message);
  }
});

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
