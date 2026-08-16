import { Router } from 'express';
import prisma from '../../lib/prisma';

const router = Router();

// Get config
router.get('/', async (req, res) => {
  try {
    const configs = await prisma.systemConfig.findMany();
    // Default config if DB is empty
    const defaultConfig = {
      VIP_CAR_RATE_PER_KM: 120,
      VIP_CAR_BASE_FEE: 500,
      VIP_LOCATION_FEE: 50,
      VIP_BIKE_RATE_PER_KM: 40,
      VIP_BIKE_BASE_FEE: 150,
      VIP_BIKE_LOCATION_FEE: 20,
      FASTEST_DELIVERY_SURCHARGE: 500,
      GST_RATE_PERCENT: 18,
      SUPPORT_PHONE_NUMBER: '8310732684',
      SUPPORT_EMAIL: 'support@rootedmemories.com'
    };
    
    const mapped = configs.reduce((acc: any, c) => {
      acc[c.key] = c.value;
      return acc;
    }, defaultConfig);

    res.json({ success: true, config: mapped });
  } catch (error) {
    console.error('Fetch Config Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Batch Update Configurations
router.put('/', async (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Settings object is required' });
    }

    const updates = Object.entries(settings).map(([key, value]) => {
      return prisma.systemConfig.upsert({
        where: { key },
        update: { value: value as any },
        create: { key, value: value as any }
      });
    });

    await prisma.$transaction(updates);
    res.json({ success: true });
  } catch (error) {
    console.error('Batch Update Config Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
