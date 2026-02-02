const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyPhpMyAdmin() {
  try {
    console.log('=== VERIFIKASI UNTUK PHPMYADMIN ===\n');
    
    await prisma.$executeRawUnsafe(`SET time_zone = '+07:00'`);
    
    console.log('Membuat data test...\n');
    
    // Create test data
    await prisma.$executeRawUnsafe(`
      INSERT INTO levels (name) VALUES ('VERIFIKASI TIMEZONE')
    `);
    
    const data = await prisma.$queryRawUnsafe(`
      SELECT id, name, created_at, updated_at 
      FROM levels 
      WHERE name = 'VERIFIKASI TIMEZONE'
      ORDER BY id DESC 
      LIMIT 1
    `);
    
    console.log('DATA YANG TERSIMPAN DI DATABASE:');
    console.log('================================');
    console.log('ID:', data[0].id);
    console.log('Name:', data[0].name);
    console.log('Created At:', data[0].created_at);
    console.log('Updated At:', data[0].updated_at);
    console.log('');
    
    console.log('INSTRUKSI:');
    console.log('1. Buka phpMyAdmin');
    console.log('2. Pilih database: db_reportify');
    console.log('3. Buka tabel: levels');
    console.log('4. Cari row dengan name = "VERIFIKASI TIMEZONE"');
    console.log('5. Lihat kolom created_at dan updated_at');
    console.log('');
    console.log('HASIL YANG DIHARAPKAN:');
    console.log('- created_at dan updated_at harus menunjukkan waktu saat ini');
    console.log('- TIDAK ADA perbedaan 7 jam lagi');
    console.log('- Waktu yang ditampilkan adalah waktu Asia/Jakarta');
    console.log('');
    console.log('Jika sudah selesai verifikasi, jalankan script ini lagi untuk cleanup:');
    console.log('node scripts/cleanup-test-data.js');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyPhpMyAdmin();
