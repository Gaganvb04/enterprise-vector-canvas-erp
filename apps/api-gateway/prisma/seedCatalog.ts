import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const catalogItems = [
  // Invitations
  { type: 'INVITATION', name: 'Spring Blossom', description: 'Floral', price: 2.5, metadata: { category: 'Floral' } },
  { type: 'INVITATION', name: 'Ivory Grace', description: 'Minimalist', price: 3.0, metadata: { category: 'Minimalist' } },
  { type: 'INVITATION', name: 'Royal Garden', description: 'Luxe', price: 4.5, metadata: { category: 'Luxe' } },
  { type: 'INVITATION', name: 'Rustic Charm', description: 'Earthy', price: 2.0, metadata: { category: 'Earthy' } },
  { type: 'INVITATION', name: 'Little Star', description: 'Cute', price: 2.5, metadata: { category: 'Naming Ceremony' } },
  
  // Print Finishes
  { type: 'PRINT_FINISH', name: 'Matte Finish', price: 0, metadata: { icon: '◻' } },
  { type: 'PRINT_FINISH', name: 'Gold Foil', price: 15, metadata: { icon: '✨' } },
  { type: 'PRINT_FINISH', name: 'Embossing', price: 12, metadata: { icon: '⬡' } },

  // Packaging
  { type: 'PACKAGING', name: 'Standard Box', price: 0 },
  { type: 'PACKAGING', name: 'Jute Bag', price: 25 },
  { type: 'PACKAGING', name: 'Premium Gift Box', price: 50 },

  // Delivery


  // Grow Kits
  { 
    type: 'GROW_KIT', 
    name: 'Bloom Kit', 
    description: 'Simple. Affordable. Green.', 
    price: 30, 
    metadata: { 
      slug: 'bloom',
      tagline: 'Simple. Affordable. Green.',
      badge: 'Best Value',
      imageUrl: '/bloom-indoor.jpg',
      watering: 'Every 7-10 days (Low maintenance)',
      sunlight: 'Bright Indirect Light',
      difficulty: 'Easy / Beginner Friendly',
      items: ['Premium Plant Variety', 'Biodegradable Coir Pot', 'Organic Coco Peat Disk', 'Physical Gift Tag with Live QR Code', 'Event Care Instruction Guide']
    } 
  },
  { 
    type: 'GROW_KIT', 
    name: 'Celebrate Kit', 
    description: 'Thoughtful. Elegant. Memorable.', 
    price: 45, 
    metadata: { 
      slug: 'celebrate',
      tagline: 'Thoughtful. Elegant. Memorable.',
      badge: 'Most Popular',
      imageUrl: '/celebrate-indoor.jpg',
      watering: 'Once a week or when top soil is dry',
      sunlight: 'Bright Indirect Exposure',
      difficulty: 'Beginner Friendly',
      items: ['Curated Indoor/Outdoor Plant', 'Elegant Decorative Pot', 'Nutrient-Rich Potting Soil Mix', 'Custom Event Blessing Tag', 'Interactive QR Care Portal Link', 'Eco-friendly Gift Bag']
    } 
  },
  { 
    type: 'GROW_KIT', 
    name: 'Legacy Kit', 
    description: 'Premium. Luxurious. Lasting.', 
    price: 80, 
    metadata: { 
      slug: 'legacy',
      tagline: 'Premium. Luxurious. Lasting.',
      badge: 'Premium',
      imageUrl: '/legacy-indoor.jpg',
      watering: '2-3 times a week depending on season',
      sunlight: 'Full Sun / Bright Exposure',
      difficulty: 'Moderate / Enthusiast',
      items: ['Exotic Bonsai / Fruit Sapling', 'Luxe Ceramic or Wood Craft Pot', 'Organic Slow-release Bio-fertilizer', 'Personalized Wood-engraved Emblem', 'Direct Botanical Consultation Access', 'Deluxe Jute Gifting Tote']
    } 
  },
  { type: 'DELIVERY', name: 'Standard (5-7 days)', price: 0 },
  { type: 'DELIVERY', name: 'Fastest (3-5 days)', price: 500 },
  { type: 'DELIVERY', name: 'On Function Day', price: 0 },
];

async function main() {
  console.log('Clearing Catalog...');
  await prisma.catalogItem.deleteMany();
  console.log('Seeding Catalog...');
  for (const item of catalogItems) {
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
  console.log('Done!');
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
