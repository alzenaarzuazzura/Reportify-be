const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyStructure() {
  console.log('🔍 Verifying TIMESTAMP Structure\n');
  console.log('='.repeat(70));

  const tables = [
    'users',
    'levels',
    'majors',
    'rombels',
    'rooms',
    'classes',
    'students',
    'subjects',
    'teaching_assignments',
    'schedules',
    'attendances',
    'assignments',
    'announcements',
    'student_assignments'
  ];

  try {
    for (const table of tables) {
      console.log(`\n📋 Table: ${table}`);
      
      // Get column info for created_at
      const createdAtInfo = await prisma.$queryRawUnsafe(`
        SHOW FULL COLUMNS FROM \`${table}\` WHERE Field = 'created_at'
      `);
      
      // Get column info for updated_at
      const updatedAtInfo = await prisma.$queryRawUnsafe(`
        SHOW FULL COLUMNS FROM \`${table}\` WHERE Field = 'updated_at'
      `);

      if (createdAtInfo.length > 0) {
        const col = createdAtInfo[0];
        console.log(`   created_at: ${col.Type} | Default: ${col.Default || 'NULL'}`);
      }

      if (updatedAtInfo.length > 0) {
        const col = updatedAtInfo[0];
        const extra = col.Extra ? ` | Extra: ${col.Extra}` : '';
        console.log(`   updated_at: ${col.Type} | Default: ${col.Default || 'NULL'}${extra}`);
      }

      // Check if it's TIMESTAMP
      const isTimestamp = createdAtInfo[0]?.Type.toLowerCase().includes('timestamp');
      console.log(`   ✅ Type: ${isTimestamp ? 'TIMESTAMP' : 'DATETIME'}`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('✨ Verification completed!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyStructure();
