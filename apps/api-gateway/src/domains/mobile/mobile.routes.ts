import { Router } from 'express';
import prisma from '../../lib/prisma';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// Mobile-specific Authentication (often different token expiration or payload than web)
router.post('/auth/login', async (req, res) => {
  res.json({
    success: true,
    token: 'mock-mobile-jwt-token',
    user: { id: 'usr-1', name: 'Mobile User', email: 'mobile@rootedmemories.com' }
  });
});

// Fetch all active plants for the logged-in user
router.get('/plants', authenticate, async (req: any, res) => {
  try {
    const plants = await prisma.userPlant.findMany({
      where: { userId: req.user.id },
      orderBy: { registeredAt: 'desc' }
    });
    // Transform to mobile expected format
    const transformed = plants.map(p => ({
      id: p.id,
      type: p.plantName,
      status: 'Sprouting',
      lastWatered: p.registeredAt.toISOString()
    }));
    res.json({ data: transformed });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Scan a QR code on a delivered kit to activate tracking
router.post('/scan', authenticate, async (req: any, res) => {
  const { qrCode } = req.body;
  
  if (!qrCode) {
    return res.status(400).json({ error: 'QR Code is required' });
  }

  try {
    const plant = await prisma.userPlant.create({
      data: {
        userId: req.user.id,
        plantName: qrCode.includes('marigold') ? 'Marigold' : qrCode.includes('tulsi') ? 'Tulsi' : 'Money Plant',
      }
    });

    res.json({
      success: true,
      message: 'Kit activated successfully!',
      plant: { id: plant.id, type: plant.plantName, status: 'Just Planted' }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Fetch care instructions for a specific plant type
router.get('/care-guides/:type', async (req, res) => {
  const { type } = req.params;
  
  res.json({
    type,
    instructions: {
      water: 'Every 2 days',
      sunlight: 'Full Sun',
      notes: 'Keep soil moist but not waterlogged.'
    }
  });
});

export default router;
