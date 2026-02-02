const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Script untuk memperbaiki timestamp yang sudah tersimpan
 * Menambahkan 7 jam ke semua created_at dan updated_at yang ada
 */

async function fixTimestamps() {
  console.log('🔧 Memperbaiki timestamp yang sudah ada...\n');

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
      console.log(`📋 Processing table: ${table}`);
      
      // Update created_at dan updated_at dengan menambah 7 jam
      const result = await prisma.$executeRawUnsafe(`
        UPDATE \`${table}\`
        SET 
          created_at = DATE_ADD(created_at, INTERVAL 7 HOUR),
          updated_at = DATE_ADD(updated_at, INTERVAL 7 HOUR)
      `);
      
      console.log(`   ✅ Updated ${result} rows\n`);
    }

    console.log('✨ Selesai! Semua timestamp telah diperbaiki.');
    console.log('⚠️  PENTING: Script ini hanya perlu dijalankan SEKALI.');
    console.log('⚠️  Jangan jalankan lagi atau timestamp akan bertambah 7 jam lagi!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Konfirmasi sebelum menjalankan
console.log('⚠️  WARNING: Script ini akan menambahkan 7 jam ke SEMUA timestamp!');
console.log('⚠️  Pastikan Anda sudah backup database terlebih dahulu.');
console.log('⚠️  Script ini hanya boleh dijalankan SEKALI.\n');

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('Lanjutkan? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes') {
    fixTimestamps();
  } else {
    console.log('Dibatalkan.');
    process.exit(0);
  }
  readline.close();
});
