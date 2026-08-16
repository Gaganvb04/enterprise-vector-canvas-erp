import { Router } from 'express';
import prisma from '../../lib/prisma';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const showAll = req.query.all === 'true';
    const whereClause = showAll ? {} : { isActive: true };
    const items = await prisma.catalogItem.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' }
    });

    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Fetch Catalog Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Create Catalog Item
router.post('/', async (req, res) => {
  try {
    const { type, name, description, price, metadata, isActive } = req.body;
    const item = await prisma.catalogItem.create({
      data: {
        type,
        name,
        description,
        price: Number(price),
        metadata: metadata || {},
        isActive: isActive !== undefined ? isActive : true
      }
    });
    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Create Catalog Item Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Update Catalog Item
router.put('/:id', async (req, res) => {
  try {
    const { name, description, price, metadata, isActive } = req.body;
    const updated = await prisma.catalogItem.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        price: price !== undefined ? Number(price) : undefined,
        metadata: metadata || undefined,
        isActive: isActive !== undefined ? isActive : undefined
      }
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update Catalog Item Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
