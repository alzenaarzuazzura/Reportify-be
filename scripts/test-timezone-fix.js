const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function testTimezoneFix() {
  try {
    console.log('=== TESTING TIMEZONE FIX ===\n');
    
    // Set timezone
    await prisma.$executeRawUnsafe(`SET time_zone = '+07:00'`);
    
    // Check current timezone and time
    const tzCheck = await prisma.$queryRawUnsafe(
      'SELECT @@session.time_zone as session_tz, @@global.time_zone as global_tz, NOW() as db_time, UTC_TIMESTAMP() as utc_tm'
    );
    
    console.log('1. TIMEZONE INFO:');
    console.log('   Session TZ:', tzCheck[0].session_tz);
    console.log('   Global TZ:', tzCheck[0].global_tz);
    console.log('   DB Time:', tzCheck[0].db_time);
    console.log('   UTC Time:', tzCheck[0].utc_tm);
    console.log('   Node.js Time:', new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }));
    console.log('');
    
    // Test CREATE
    console.log('2. TESTING CREATE:');
    const testLevel = await prisma.levels.create({
      data: {
        name: `Test Timezone ${Date.now()}`
      }
    });
    
    console.log('   Created ID:', testLevel.id);
    console.log('   Created At (from Prisma):', testLevel.created_at);
    console.log('   Updated At (from Prisma):', testLevel.updated_at);
    
    // Query directly from DB to see raw value
    const rawData = await prisma.$queryRawUnsafe(`
      SELECT id, name, created_at, updated_at 
      FROM levels 
      WHERE id = ${testLevel.id}
    `);
    
    console.log('   Created At (raw from DB):', rawData[0].created_at);
    console.log('   Updated At (raw from DB):', rawData[0].updated_at);
    console.log('');
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test UPDATE
    console.log('3. TESTING UPDATE:');
    const updatedLevel = await prisma.levels.update({
      where: { id: testLevel.id },
      data: {
        name: `Updated ${Date.now()}`
      }
    });
    
    console.log('   Updated At (from Prisma):', updatedLevel.updated_at);
    
    const rawDataAfterUpdate = await prisma.$queryRawUnsafe(`
      SELECT id, name, created_at, updated_at 
      FROM levels 
      WHERE id = ${testLevel.id}
    `);
    
    console.log('   Updated At (raw from DB):', rawDataAfterUpdate[0].updated_at);
    console.log('');
    
    // Compare times
    const now = new Date();
    const createdDiff = Math.abs(now - new Date(testLevel.created_at)) / 1000 / 60; // minutes
    const updatedDiff = Math.abs(now - new Date(updatedLevel.updated_at)) / 1000 / 60; // minutes
    
    console.log('4. TIME DIFFERENCE CHECK:');
    console.log('   Current time:', now.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }));
    console.log('   Created time diff:', createdDiff.toFixed(2), 'minutes');
    console.log('   Updated time diff:', updatedDiff.toFixed(2), 'minutes');
    
    if (createdDiff < 5 && updatedDiff < 5) {
      console.log('   ✅ TIMEZONE FIX WORKING! Time difference is acceptable.');
    } else {
      console.log('   ❌ TIMEZONE ISSUE STILL EXISTS! Time difference too large.');
    }
    console.log('');
    
    // Cleanup
    console.log('5. CLEANUP:');
    await prisma.levels.delete({
      where: { id: testLevel.id }
    });
    console.log('   ✅ Test data deleted');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testTimezoneFix();
