import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.catalogItem.deleteMany({ where: { type: 'DELIVERY' } });
  await prisma.catalogItem.createMany({
    data: [
      { type: 'DELIVERY', name: 'Standard (5-7 days)', price: 0 },
      { type: 'DELIVERY', name: 'On Function Day', price: 0 },
    ]
  });
  console.log('Done Delivery update');
}
main().finally(() => prisma.$disconnect());
