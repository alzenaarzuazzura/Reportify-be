const prisma = require('../src/utils/prismaClient');

async function finalTest() {
  try {
    console.log('=== FINAL TIMEZONE TEST ===\n');
    
    const now = new Date();
    console.log('1. CURRENT TIME:');
    console.log('   Node.js time:', now.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }));
    console.log('   ISO:', now.toISOString());
    console.log('');
    
    // Check DB timezone
    const tzInfo = await prisma.$queryRawUnsafe(
      'SELECT NOW() as db_now, @@session.time_zone as tz'
    );
    console.log('2. DATABASE INFO:');
    console.log('   Timezone:', tzInfo[0].tz);
    console.log('   DB NOW():', tzInfo[0].db_now);
    console.log('');
    
    // Create test data
    console.log('3. CREATING TEST DATA...');
    const testData = await prisma.levels.create({
      data: {
        name: `Final Test ${Date.now()}`
      }
    });
    
    console.log('   Created ID:', testData.id);
    console.log('   Created At:', testData.created_at);
    console.log('');
    
    // Query raw from database
    const rawData = await prisma.$queryRawUnsafe(
      `SELECT id, name, created_at, updated_at FROM levels WHERE id = ${testData.id}`
    );
    
    console.log('4. RAW DATABASE VALUES:');
    console.log('   Created At (raw):', rawData[0].created_at);
    console.log('   Updated At (raw):', rawData[0].updated_at);
    console.log('');
    
    // Calculate difference
    const dbTime = new Date(rawData[0].created_at);
    const diffMinutes = Math.abs(now - dbTime) / 1000 / 60;
    const diffHours = diffMinutes / 60;
    
    console.log('5. TIME DIFFERENCE:');
    console.log('   Difference:', diffMinutes.toFixed(2), 'minutes');
    console.log('   Difference:', diffHours.toFixed(2), 'hours');
    console.log('');
    
    if (diffHours < 0.1) {
      console.log('✅ SUCCESS! Timestamps are correct!');
      console.log('   Data di phpMyAdmin sekarang akan menampilkan waktu yang benar.');
    } else if (diffHours >= 6 && diffHours <= 8) {
      console.log('❌ STILL HAS 7 HOUR DIFFERENCE!');
      console.log('   Masih ada perbedaan 7 jam. Perlu konfigurasi tambahan.');
      console.log('');
      console.log('SOLUSI:');
      console.log('1. Pastikan MySQL timezone sudah diset di my.ini:');
      console.log('   [mysqld]');
      console.log('   default-time-zone = \'+07:00\'');
      console.log('');
      console.log('2. Restart MySQL service');
      console.log('3. Restart aplikasi Node.js');
    } else {
      console.log('⚠️  Unexpected time difference:', diffHours.toFixed(2), 'hours');
    }
    console.log('');
    
    // Cleanup
    await prisma.levels.delete({
      where: { id: testData.id }
    });
    console.log('✅ Test data cleaned up');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

finalTest();
