const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testTimezone() {
  console.log('🧪 Testing Timezone Configuration\n');
  console.log('='.repeat(50));

  try {
    // 1. Check MySQL timezone
    console.log('\n1️⃣  MySQL Timezone Settings:');
    const timezoneResult = await prisma.$queryRaw`
      SELECT 
        @@global.time_zone as global_tz,
        @@session.time_zone as session_tz,
        NOW() as mysql_now,
        UTC_TIMESTAMP() as mysql_utc
    `;
    console.log(timezoneResult[0]);

    // 2. Check Node.js timezone
    console.log('\n2️⃣  Node.js Timezone:');
    const nodeNow = new Date();
    console.log('Current Date:', nodeNow);
    console.log('ISO String:', nodeNow.toISOString());
    console.log('Locale String:', nodeNow.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }));
    console.log('Timezone Offset (minutes):', nodeNow.getTimezoneOffset());

    // 3. Test create and read
    console.log('\n3️⃣  Testing Create & Read:');
    const testName = `Test_${Date.now()}`;
    
    console.log('Creating test level...');
    const created = await prisma.levels.create({
      data: { name: testName }
    });
    
    console.log('Created at (from DB):', created.created_at);
    console.log('Current time (Node):', nodeNow);
    
    const timeDiff = Math.abs(created.created_at.getTime() - nodeNow.getTime());
    const diffSeconds = Math.floor(timeDiff / 1000);
    
    console.log(`Time difference: ${diffSeconds} seconds`);
    
    if (diffSeconds < 5) {
      console.log('✅ Timezone is correctly configured!');
    } else if (diffSeconds > 25000 && diffSeconds < 25400) {
      console.log('❌ Timezone issue detected! Difference is ~7 hours');
      console.log('   Please follow the TIMEZONE_FIX_GUIDE.md');
    } else {
      console.log('⚠️  Unexpected time difference');
    }

    // Cleanup
    console.log('\nCleaning up test data...');
    await prisma.levels.delete({
      where: { id: created.id }
    });
    console.log('✅ Test data deleted');

    console.log('\n' + '='.repeat(50));
    console.log('✨ Test completed!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testTimezone();
