import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetUser() {
  const email = 'gagangaganvb@gmail.com';
  const password = 'Password@123';
  const hashed = await bcrypt.hash(password, 10);
  
  await prisma.user.upsert({
    where: { email },
    update: { password: hashed, role: 'CUSTOMER', name: 'Gagan' },
    create: { email, password: hashed, role: 'CUSTOMER', name: 'Gagan' }
  });

  console.log(`Reset ${email} with password ${password}`);
}

resetUser().finally(() => prisma.$disconnect());
