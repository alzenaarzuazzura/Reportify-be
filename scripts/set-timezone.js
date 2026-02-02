const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setTimezone() {
  try {
    console.log('Setting MySQL timezone to Asia/Jakarta (+07:00)...');
    
    // Set session timezone
    await prisma.$executeRawUnsafe(`SET time_zone = '+07:00'`);
    
    // Verify
    const result = await prisma.$queryRawUnsafe(`SELECT @@session.time_zone as session_tz, NOW() as current_time`);
    
    console.log('✅ Timezone set successfully!');
    console.log('Session timezone:', result[0].session_tz);
    console.log('Current time:', result[0].current_time);
    
    // Try to set global timezone (requires SUPER privilege)
    try {
      await prisma.$executeRawUnsafe(`SET GLOBAL time_zone = '+07:00'`);
      console.log('✅ Global timezone also set!');
    } catch (err) {
      console.log('⚠️  Could not set global timezone (requires SUPER privilege)');
      console.log('   You need to set it manually in MySQL config or run as admin');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setTimezone();
