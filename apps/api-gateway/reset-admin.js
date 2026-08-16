// Admin Password Reset — Pure JS version
// Run: node reset-admin.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAdmin() {
  const EMAIL    = 'admin@rootedmemories.com';
  const PASSWORD = 'Admin@RootedMemoirs2026';
  const ROLE     = 'ADMIN';

  console.log(`\n🔧  Resetting admin: ${EMAIL}`);

  const hashed = await bcrypt.hash(PASSWORD, 10);

  const user = await prisma.user.upsert({
    where:  { email: EMAIL },
    update: { password: hashed, role: ROLE, name: 'System Admin', phone: '8310732684' },
    create: { email: EMAIL, password: hashed, role: ROLE, name: 'System Admin', phone: '8310732684' },
  });

  console.log(`✅  Done!`);
  console.log(`    Email:    ${user.email}`);
  console.log(`    Role:     ${user.role}`);
  console.log(`    Password: ${PASSWORD}`);
  console.log(`\n🌐  Login at: http://localhost:5174/login\n`);

  await prisma.$disconnect();
}

resetAdmin().catch(async (e) => {
  console.error('❌  Error:', e.message);
  await prisma.$disconnect();
  process.exit(1);
});
