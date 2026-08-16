/// <reference types="node" />
/**
 * Admin Password Reset Script
 * Run: npx ts-node reset-admin.ts
 * OR:  node -e "require('ts-node').register(); require('./reset-admin.ts')"
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import process from 'process';

const prisma = new PrismaClient();

async function resetAdmin() {
  const EMAIL    = 'admin@rootedmemories.com';
  const PASSWORD = 'Admin@RootedMemoirs2026';
  const ROLE     = 'ADMIN';

  console.log(`\n🔧  Resetting admin: ${EMAIL}`);

  const hashed = await bcrypt.hash(PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: {
      password: hashed,
      role:     ROLE,
      name:     'System Admin',
    },
    create: {
      email:    EMAIL,
      password: hashed,
      role:     ROLE,
      name:     'System Admin',
    },
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
