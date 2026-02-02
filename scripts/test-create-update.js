const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCreateUpdate() {
  console.log('🧪 Testing Create & Update with TIMESTAMP\n');
  console.log('='.repeat(70));

  try {
    // Test 1: Create
    console.log('\n1️⃣  Testing CREATE:');
    const beforeCreate = new Date();
    console.log(`   Current time: ${beforeCreate.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`);
    
    const testLevel = await prisma.levels.create({
      data: { name: `Test_${Date.now()}` }
    });
    
    console.log(`   Created at:   ${testLevel.created_at.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`);
    console.log(`   Updated at:   ${testLevel.updated_at.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`);
    
    const createDiff = Math.abs(testLevel.created_at.getTime() - beforeCreate.getTime());
    console.log(`   Time diff:    ${Math.floor(createDiff / 1000)} seconds`);
    
    if (createDiff < 5000) {
      console.log('   ✅ CREATE timestamp is correct!');
    } else {
      console.log('   ❌ CREATE timestamp has issue!');
    }

    // Wait 2 seconds
    console.log('\n   Waiting 2 seconds before update...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Update
    console.log('\n2️⃣  Testing UPDATE:');
    const beforeUpdate = new Date();
    console.log(`   Current time: ${beforeUpdate.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`);
    
    const updatedLevel = await prisma.levels.update({
      where: { id: testLevel.id },
      data: { name: `Updated_${Date.now()}` }
    });
    
    console.log(`   Created at:   ${updatedLevel.created_at.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} (unchanged)`);
    console.log(`   Updated at:   ${updatedLevel.updated_at.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} (changed)`);
    
    const updateDiff = Math.abs(updatedLevel.updated_at.getTime() - beforeUpdate.getTime());
    console.log(`   Time diff:    ${Math.floor(updateDiff / 1000)} seconds`);
    
    if (updateDiff < 5000) {
      console.log('   ✅ UPDATE timestamp is correct!');
    } else {
      console.log('   ❌ UPDATE timestamp has issue!');
    }

    // Test 3: Verify created_at didn't change
    console.log('\n3️⃣  Verifying created_at unchanged:');
    const createdDiff = updatedLevel.created_at.getTime() - testLevel.created_at.getTime();
    console.log(`   Difference: ${createdDiff}ms`);
    
    if (createdDiff === 0) {
      console.log('   ✅ created_at remained unchanged!');
    } else {
      console.log('   ❌ created_at changed (should not happen)!');
    }

    // Test 4: Verify updated_at changed
    console.log('\n4️⃣  Verifying updated_at changed:');
    const updatedDiff = updatedLevel.updated_at.getTime() - testLevel.updated_at.getTime();
    console.log(`   Difference: ${updatedDiff}ms (${Math.floor(updatedDiff / 1000)} seconds)`);
    
    if (updatedDiff >= 2000) {
      console.log('   ✅ updated_at changed correctly!');
    } else {
      console.log('   ❌ updated_at did not change enough!');
    }

    // Cleanup
    console.log('\n5️⃣  Cleaning up:');
    await prisma.levels.delete({
      where: { id: testLevel.id }
    });
    console.log('   ✅ Test data deleted');

    console.log('\n' + '='.repeat(70));
    console.log('✨ All tests completed successfully!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testCreateUpdate();
