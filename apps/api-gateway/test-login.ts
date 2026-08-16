import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testLogin() {
  const user = await prisma.user.findUnique({ where: { email: 'gagangaganvb@gmail.com' } });
  console.log('User found:', !!user);
  if (user) {
    const match = await bcrypt.compare('Password@123', user.password);
    console.log('Password match:', match);
  }

  const admin = await prisma.user.findUnique({ where: { email: 'admin@rootedmemories.com' } });
  console.log('Admin found:', !!admin);
  if (admin) {
    const adminMatch = await bcrypt.compare('Admin@RootedMemoirs2026', admin.password);
    console.log('Admin Password match:', adminMatch);
  }
}

testLogin().finally(() => prisma.$disconnect());
