const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testUpdate() {
  try {
    // Get first room
    const room = await prisma.rooms.findFirst();
    
    if (!room) {
      console.log('No room found');
      return;
    }
    
    console.log('Before update:');
    console.log('ID:', room.id);
    console.log('Name:', room.name);
    console.log('Updated at:', room.updated_at);
    console.log('---\n');
    
    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update room
    const updated = await prisma.rooms.update({
      where: { id: room.id },
      data: { name: room.name } // Update with same value to trigger updated_at
    });
    
    console.log('After update:');
    console.log('ID:', updated.id);
    console.log('Name:', updated.name);
    console.log('Updated at:', updated.updated_at);
    console.log('---\n');
    
    if (room.updated_at.getTime() === updated.updated_at.getTime()) {
      console.log('❌ updated_at NOT changed!');
    } else {
      console.log('✅ updated_at changed successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testUpdate();
