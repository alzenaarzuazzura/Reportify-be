const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Set timezone untuk setiap koneksi
prisma.$connect().then(async () => {
  await prisma.$executeRawUnsafe(`SET time_zone = '+07:00'`);
  console.log('✅ Prisma connected with timezone Asia/Jakarta');
});

module.exports = prisma;
