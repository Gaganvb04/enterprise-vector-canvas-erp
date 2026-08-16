import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('hashed_password_123', 10);

  // 1. Seed Catalog Items (from seedCatalog.ts)
  const catalogItems = [
    { type: 'INVITATION', name: 'Spring Blossom', description: 'Floral', price: 2.5, metadata: { category: 'Floral' } },
    { type: 'INVITATION', name: 'Ivory Grace', description: 'Minimalist', price: 3.0, metadata: { category: 'Minimalist' } },
    { type: 'INVITATION', name: 'Royal Garden', description: 'Luxe', price: 4.5, metadata: { category: 'Luxe' } },
    { type: 'INVITATION', name: 'Rustic Charm', description: 'Earthy', price: 2.0, metadata: { category: 'Earthy' } },
    { type: 'INVITATION', name: 'Little Star', description: 'Cute', price: 2.5, metadata: { category: 'Naming Ceremony' } },
    { type: 'PRINT_FINISH', name: 'Matte Finish', price: 0, metadata: { icon: '◻' } },
    { type: 'PRINT_FINISH', name: 'Gold Foil', price: 15, metadata: { icon: '✨' } },
    { type: 'PRINT_FINISH', name: 'Embossing', price: 12, metadata: { icon: '⬡' } },
    { type: 'PACKAGING', name: 'Standard Box', price: 0 },
    { type: 'PACKAGING', name: 'Jute Bag', price: 25 },
    { type: 'PACKAGING', name: 'Premium Gift Box', price: 50 },
    { type: 'DELIVERY', name: 'Standard (5-7 days)', price: 0 },
    { type: 'DELIVERY', name: 'On Function Day', price: 0 },
  ];

  for (const item of catalogItems) {
    const exists = await prisma.catalogItem.findFirst({ where: { name: item.name } });
    if (!exists) {
      await prisma.catalogItem.create({
        data: {
          type: item.type,
          name: item.name,
          description: item.description || null,
          price: item.price,
          metadata: item.metadata || {},
        }
      });
    }
  }
  console.log('Created Catalog Items');

  // 2. Seed Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@rootedmemories.com' },
    update: { password: hashedPassword },
    create: {
      email: 'admin@rootedmemories.com',
      name: 'System Admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@rootedmemories.com' },
    update: { password: hashedPassword },
    create: {
      email: 'customer@rootedmemories.com',
      name: 'Priya Sharma',
      password: hashedPassword,
      role: 'CUSTOMER',
    },
  });

  const ops = await prisma.user.upsert({
    where: { email: 'ops@rootedmemories.com' },
    update: { password: hashedPassword },
    create: {
      email: 'ops@rootedmemories.com',
      name: 'Factory Supervisor',
      password: hashedPassword,
      role: 'OPS',
    },
  });

  console.log('Created Users');

  // 2. Seed Inventory
  const inventoryItems = [
    { sku: 'RM-350-MATTE', name: '350 GSM Matte Cardstock', category: 'Paper', stockLevel: 12500, minThreshold: 5000, unit: 'Sheets' },
    { sku: 'RM-FOIL-GOLD', name: 'Premium Gold Foil Roll', category: 'Printing', stockLevel: 2, minThreshold: 5, unit: 'Rolls' },
    { sku: 'GW-TULSI-SD', name: 'Holy Basil (Tulsi) Seeds', category: 'Grow Kit', stockLevel: 850, minThreshold: 1000, unit: 'Packets' },
    { sku: 'GW-COIR-POT', name: 'Biodegradable Coir Pots', category: 'Grow Kit', stockLevel: 4200, minThreshold: 2000, unit: 'Units' },
    { sku: 'PKG-BOX-PRM', name: 'Premium Gift Boxes', category: 'Packaging', stockLevel: 150, minThreshold: 500, unit: 'Units' },
  ];

  for (const item of inventoryItems) {
    await prisma.inventoryItem.upsert({
      where: { sku: item.sku },
      update: {},
      create: item,
    });
  }

  console.log('Created Inventory Items');

  // 3. Seed Orders
  const order1 = await prisma.order.upsert({
    where: { orderNumber: 'RM-2026-00147' },
    update: {},
    create: {
      orderNumber: 'RM-2026-00147',
      userId: customer.id,
      status: 'PROCESSING',
      totalAmount: 15000,
      paymentStatus: 'PAID',
      items: {
        create: [
          {
            productType: 'INVITATION',
            productId: 'TMP-SPRING-BLOSSOM',
            quantity: 100,
            price: 7500,
            metadata: { paper: '350 GSM Matte', finish: 'Matte Lamination' }
          },
          {
            productType: 'GROW_KIT',
            productId: 'KIT-SACRED',
            quantity: 100,
            price: 7500,
            metadata: { seeds: 'Tulsi', pot: 'Coir' }
          }
        ]
      }
    },
  });

  console.log('Created Orders');

  // 4. Seed Print Jobs
  await prisma.printJob.create({
    data: {
      orderId: order1.id,
      templateId: 'TMP-SPRING-BLOSSOM',
      paperType: '350 GSM Matte',
      finish: 'Matte Lamination',
      machineId: 'M-001',
      operatorId: ops.id,
      status: 'PRINTING',
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    }
  });

  console.log('Created Print Jobs');

  // 5. Seed Templates
  const templateExists = await prisma.template.findFirst({ where: { name: 'Spring Blossom Master' } });
  if (!templateExists) {
    await prisma.template.create({
      data: {
        name: 'Spring Blossom Master',
        eventType: 'Wedding',
        canvasState: { layers: [{ type: 'text', content: 'You are invited', x: 50, y: 50 }] },
        status: 'PUBLISHED'
      }
    });
  }
  console.log('Created Templates');
  
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
