const prisma = require('../src/utils/prismaClient');

async function testPrismaCreate() {
  try {
    console.log('=== TEST CREATE DENGAN PRISMA ORM ===\n');
    
    console.log('Waktu sekarang:', new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }));
    console.log('');
    
    // Test create dengan Prisma
    console.log('Creating data dengan Prisma...');
    const testData = await prisma.levels.create({
      data: {
        name: `Test Prisma ${Date.now()}`
      }
    });
    
    console.log('✅ Data created!');
    console.log('   ID:', testData.id);
    console.log('');
    
    // Query raw untuk melihat nilai sebenarnya di database
    const rawData = await prisma.$queryRawUnsafe(`
      SELECT id, name, created_at, updated_at 
      FROM levels 
      WHERE id = ${testData.id}
    `);
    
    console.log('DATA DI DATABASE (raw):');
    console.log('   Created At:', rawData[0].created_at);
    console.log('   Updated At:', rawData[0].updated_at);
    console.log('');
    
    console.log('INSTRUKSI VERIFIKASI:');
    console.log('1. Buka phpMyAdmin');
    console.log('2. Lihat tabel levels, ID:', testData.id);
    console.log('3. Periksa apakah created_at menunjukkan waktu saat ini (Asia/Jakarta)');
    console.log('4. Jika benar, masalah timezone sudah teratasi! ✅');
    console.log('');
    
    // Wait for user to verify
    console.log('Tekan Ctrl+C untuk keluar tanpa cleanup, atau tunggu 10 detik untuk auto cleanup...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Cleanup
    await prisma.levels.delete({
      where: { id: testData.id }
    });
    
    console.log('✅ Test data cleaned up');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testPrismaCreate();
