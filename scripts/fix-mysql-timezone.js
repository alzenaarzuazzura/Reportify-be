const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixMySQLTimezone() {
  try {
    console.log('=== FIXING MYSQL TIMEZONE ===\n');
    
    // Check current timezone
    console.log('1. Checking current timezone...');
    const before = await prisma.$queryRawUnsafe(
      'SELECT @@global.time_zone as global_tz, @@session.time_zone as session_tz, NOW() as curr_time'
    );
    console.log('   Global TZ:', before[0].global_tz);
    console.log('   Session TZ:', before[0].session_tz);
    console.log('   Current Time:', before[0].curr_time);
    console.log('');
    
    // Try to set global timezone
    console.log('2. Setting global timezone to +07:00...');
    try {
      await prisma.$executeRawUnsafe(`SET GLOBAL time_zone = '+07:00'`);
      await prisma.$executeRawUnsafe(`SET time_zone = '+07:00'`);
      console.log('   ✅ Global timezone set successfully!');
    } catch (error) {
      console.log('   ❌ Failed to set global timezone:', error.message);
      console.log('   ⚠️  You need SUPER privilege. Try running MySQL as admin or edit my.ini');
      console.log('');
      console.log('   MANUAL FIX REQUIRED:');
      console.log('   1. Open MySQL as admin/root');
      console.log('   2. Run: SET GLOBAL time_zone = \'+07:00\';');
      console.log('   OR');
      console.log('   3. Edit my.ini file and add under [mysqld]:');
      console.log('      default-time-zone = \'+07:00\'');
      console.log('   4. Restart MySQL service');
      return;
    }
    
    // Verify
    console.log('');
    console.log('3. Verifying...');
    const after = await prisma.$queryRawUnsafe(
      'SELECT @@global.time_zone as global_tz, @@session.time_zone as session_tz, NOW() as curr_time'
    );
    console.log('   Global TZ:', after[0].global_tz);
    console.log('   Session TZ:', after[0].session_tz);
    console.log('   Current Time:', after[0].curr_time);
    console.log('');
    console.log('✅ TIMEZONE FIX COMPLETE!');
    console.log('');
    console.log('NEXT STEPS:');
    console.log('1. Restart your Node.js application');
    console.log('2. Test create/update operations');
    console.log('3. Check timestamps in phpMyAdmin');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixMySQLTimezone();
