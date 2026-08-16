import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.catalogItem.create({
    data: {
      type: 'INVITATION',
      name: 'Spring Blossom',
      description: 'An elegant and timeless design featuring delicate floral motifs.',
      price: 250,
      metadata: { category: 'Wedding', isBestseller: true }
    }
  });
  
  await prisma.catalogItem.create({
    data: {
      type: 'INVITATION',
      name: 'Rustic Charm',
      description: 'A beautiful rustic design perfect for outdoor celebrations.',
      price: 200,
      metadata: { category: 'Wedding', isBestseller: false }
    }
  });

  await prisma.catalogItem.create({
    data: {
      type: 'INVITATION',
      name: 'Ivory Grace',
      description: 'Minimalist and clean design on premium ivory cardstock.',
      price: 300,
      metadata: { category: 'Engagement', isBestseller: true }
    }
  });

  console.log('Added catalog items');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
