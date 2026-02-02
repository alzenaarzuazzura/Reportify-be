const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTimestamps() {
  console.log('Checking updated_at column configuration...\n');
  
  const tables = [
    'users',
    'levels', 
    'rooms',
    'students'
  ];

  try {
    for (const table of tables) {
      const result = await prisma.$queryRawUnsafe(`
        SHOW FULL COLUMNS FROM \`${table}\` WHERE Field = 'updated_at'
      `);
      
      console.log(`Table: ${table}`);
      console.log('Column info:', JSON.stringify(result[0], null, 2));
      console.log('---\n');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTimestamps();
