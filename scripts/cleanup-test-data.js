const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanup() {
  try {
    console.log('Cleaning up test data...\n');
    
    await prisma.$executeRawUnsafe(`
      DELETE FROM levels WHERE name = 'VERIFIKASI TIMEZONE'
    `);
    
    console.log('✅ Test data cleaned up!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
