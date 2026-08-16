import { Router } from 'express';
import prisma from '../../lib/prisma';

const router = Router();

// Get inventory with auto-seeding if empty
router.get('/', async (req, res) => {
  try {
    let items = await prisma.inventoryItem.findMany({
      orderBy: { category: 'asc' }
    });

    if (items.length === 0) {
      const seedItems = [
        { sku: 'RM-PAP-01', name: '350 GSM Textured Matte Paper', category: 'Paper', stockLevel: 4500, minThreshold: 1000, unit: 'Sheets' },
        { sku: 'RM-PAP-02', name: '400 GSM Cotton Card Stock', category: 'Paper', stockLevel: 1200, minThreshold: 800, unit: 'Sheets' },
        { sku: 'RM-PAP-03', name: '300 GSM Organic Seed Paper', category: 'Paper', stockLevel: 350, minThreshold: 500, unit: 'Sheets' },
        { sku: 'RM-INK-01', name: 'Gold Metallic Foil Rolls (120m)', category: 'Printing', stockLevel: 14, minThreshold: 10, unit: 'Rolls' },
        { sku: 'RM-INK-02', name: 'UV Spot Gloss Resin Fluid', category: 'Printing', stockLevel: 8, minThreshold: 15, unit: 'Liters' },
        { sku: 'RM-KIT-01', name: 'Terracotta Eco Pots (Small)', category: 'Grow Kit', stockLevel: 2400, minThreshold: 500, unit: 'Pots' },
        { sku: 'RM-KIT-02', name: 'Compressed Organic Coco Peat Pods', category: 'Grow Kit', stockLevel: 3100, minThreshold: 600, unit: 'Pods' },
        { sku: 'RM-KIT-03', name: 'Assorted Herbal & Floral Seeds Mix', category: 'Grow Kit', stockLevel: 180, minThreshold: 400, unit: 'Packs' },
        { sku: 'RM-PKG-01', name: 'Premium Satin Gold Ribbons', category: 'Packaging', stockLevel: 45, minThreshold: 20, unit: 'Spools' },
        { sku: 'RM-PKG-02', name: 'Heavy Duty Corrugated Gift Boxes', category: 'Packaging', stockLevel: 850, minThreshold: 300, unit: 'Boxes' }
      ];

      await prisma.inventoryItem.createMany({ data: seedItems });

      items = await prisma.inventoryItem.findMany({
        orderBy: { category: 'asc' }
      });
    }

    res.json({ data: items });
  } catch (error) {
    console.error('Fetch Inventory Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new inventory item
router.post('/', async (req, res) => {
  try {
    const { sku, name, category, stockLevel, minThreshold, unit } = req.body;
    const item = await prisma.inventoryItem.create({
      data: {
        sku: sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        name,
        category: category || 'General',
        stockLevel: Number(stockLevel) || 0,
        minThreshold: Number(minThreshold) || 10,
        unit: unit || 'Units'
      }
    });
    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Create Inventory Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update inventory stock level or details
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { stockLevel, name, minThreshold, category, unit } = req.body;
    
    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: {
        ...(stockLevel !== undefined ? { stockLevel: Number(stockLevel) } : {}),
        ...(name !== undefined ? { name } : {}),
        ...(minThreshold !== undefined ? { minThreshold: Number(minThreshold) } : {}),
        ...(category !== undefined ? { category } : {}),
        ...(unit !== undefined ? { unit } : {})
      }
    });
    
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update Inventory Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete inventory item
router.delete('/:id', async (req, res) => {
  try {
    await prisma.inventoryItem.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete Inventory Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
