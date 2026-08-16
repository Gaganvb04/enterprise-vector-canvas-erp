const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetUser() {
  const EMAIL    = 'gagangaganvb@gmail.com';
  const PASSWORD = 'Password@123';
  const ROLE     = 'CUSTOMER';

  console.log(`\n🔧  Resetting user: ${EMAIL}`);

  const hashed = await bcrypt.hash(PASSWORD, 10);

  const user = await prisma.user.upsert({
    where:  { email: EMAIL },
    update: { password: hashed, role: ROLE, name: 'Gagan', phone: '8310732684' },
    create: { email: EMAIL, password: hashed, role: ROLE, name: 'Gagan', phone: '8310732684' },
  });

  console.log(`✅  Done!`);
  console.log(`    Email:    ${user.email}`);
  console.log(`    Role:     ${user.role}`);
  console.log(`    Password: ${PASSWORD}`);

  await prisma.$disconnect();
}

resetUser().catch(async (e) => {
  console.error('❌  Error:', e.message);
  await prisma.$disconnect();
  process.exit(1);
});
