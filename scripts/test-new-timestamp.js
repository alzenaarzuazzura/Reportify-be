const { PrismaClient } = require('@prisma/client');

// Create new Prisma client instance
const prisma = new PrismaClient();

async function testNewTimestamp() {
  try {
    console.log('=== TESTING NEW TIMESTAMP BEHAVIOR ===\n');
    
    // Set timezone
    await prisma.$executeRawUnsafe(`SET time_zone = '+07:00'`);
    
    const now = new Date();
    console.log('1. CURRENT TIME:');
    console.log('   Local time:', now.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }));
    console.log('');
    
    // Check DB time
    const dbTime = await prisma.$queryRawUnsafe('SELECT NOW() as curr_time');
    console.log('2. DATABASE TIME:');
    console.log('   DB NOW():', dbTime[0].curr_time);
    console.log('');
    
    // Create test data - MySQL will set created_at automatically
    console.log('3. CREATING TEST DATA...');
    console.log('   (MySQL will set created_at with CURRENT_TIMESTAMP)');
    
    const result = await prisma.$executeRawUnsafe(`
      INSERT INTO levels (name) VALUES ('Test Timezone ${Date.now()}')
    `);
    
    // Get the inserted data
    const inserted = await prisma.$queryRawUnsafe(`
      SELECT * FROM levels ORDER BY id DESC LIMIT 1
    `);
    
    console.log('   Created ID:', inserted[0].id);
    console.log('   Created At:', inserted[0].created_at);
    console.log('   Updated At:', inserted[0].updated_at);
    console.log('');
    
    // Check time difference
    const createdTime = new Date(inserted[0].created_at);
    const nowLocal = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    const diffMinutes = Math.abs(nowLocal - createdTime) / 1000 / 60;
    const diffHours = diffMinutes / 60;
    
    console.log('4. TIME DIFFERENCE CHECK:');
    console.log('   Local time:', nowLocal.toLocaleString('id-ID'));
    console.log('   Created time:', createdTime.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }));
    console.log('   Difference:', diffMinutes.toFixed(2), 'minutes');
    console.log('   Difference:', diffHours.toFixed(2), 'hours');
    console.log('');
    
    if (diffHours < 0.1) {
      console.log('✅ SUCCESS! Timestamps are now correct!');
      console.log('   Data di phpMyAdmin akan menampilkan waktu Asia/Jakarta yang benar.');
      console.log('   Tidak ada lagi perbedaan 7 jam!');
    } else if (diffHours >= 6 && diffHours <= 8) {
      console.log('❌ Still has 7 hour difference.');
      console.log('   Please restart your application and try again.');
    } else {
      console.log('⚠️  Unexpected time difference.');
    }
    console.log('');
    
    // Test UPDATE
    console.log('5. TESTING UPDATE...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await prisma.$executeRawUnsafe(`
      UPDATE levels SET name = 'Updated ${Date.now()}' WHERE id = ${inserted[0].id}
    `);
    
    const updated = await prisma.$queryRawUnsafe(`
      SELECT * FROM levels WHERE id = ${inserted[0].id}
    `);
    
    console.log('   Updated At:', updated[0].updated_at);
    console.log('   Created At:', updated[0].created_at);
    console.log('');
    
    // Check if updated_at changed
    if (updated[0].updated_at > updated[0].created_at) {
      console.log('✅ updated_at automatically updated by MySQL!');
    }
    console.log('');
    
    // Cleanup
    await prisma.$executeRawUnsafe(`DELETE FROM levels WHERE id = ${inserted[0].id}`);
    console.log('✅ Test data cleaned up');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testNewTimestamp();
