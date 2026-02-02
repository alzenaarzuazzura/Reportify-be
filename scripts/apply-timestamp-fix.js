const prisma = require('../src/utils/prismaClient');

async function applyTimestampFix() {
  try {
    console.log('=== APPLYING TIMESTAMP FIX ===\n');
    console.log('This will modify all timestamp columns to use CURRENT_TIMESTAMP');
    console.log('MySQL will handle timestamps instead of Prisma\n');
    
    // Set timezone
    await prisma.$executeRawUnsafe(`SET time_zone = '+07:00'`);
    console.log('✅ Timezone set to +07:00\n');
    
    const tables = [
      'users', 'levels', 'majors', 'rombels', 'rooms', 'classes',
      'students', 'subjects', 'teaching_assignments', 'schedules',
      'attendances', 'assignments', 'announcements', 'student_assignments'
    ];
    
    console.log('Modifying tables...\n');
    
    for (const table of tables) {
      try {
        console.log(`  Processing ${table}...`);
        
        await prisma.$executeRawUnsafe(`
          ALTER TABLE ${table} 
          MODIFY created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          MODIFY updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        `);
        
        console.log(`  ✅ ${table} updated`);
      } catch (error) {
        console.log(`  ❌ ${table} failed:`, error.message);
      }
    }
    
    console.log('\n=== FIX APPLIED ===\n');
    console.log('NEXT STEPS:');
    console.log('1. Update Prisma schema (remove @default(now()) from created_at)');
    console.log('2. Run: npx prisma generate');
    console.log('3. Restart your application');
    console.log('4. Test create/update operations');
    console.log('\nNow timestamps will use Asia/Jakarta timezone (+07:00)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

applyTimestampFix();
