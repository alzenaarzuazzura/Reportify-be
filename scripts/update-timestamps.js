const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateTimestamps() {
  console.log('Adding ON UPDATE CURRENT_TIMESTAMP to all updated_at columns...');
  
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
      const sql = `ALTER TABLE \`${table}\` MODIFY COLUMN \`updated_at\` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0)`;
      console.log(`Updating ${table}...`);
      await prisma.$executeRawUnsafe(sql);
      console.log(`✓ ${table} updated`);
    }
    
    console.log('\n✅ All tables updated successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateTimestamps();
