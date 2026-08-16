import { Router } from 'express';
import prisma from '../../lib/prisma';

const router = Router();

// Get all print jobs (with order enrichment & auto-seeding if empty)
router.get('/', async (req, res) => {
  try {
    let jobs = await prisma.printJob.findMany({
      orderBy: { dueDate: 'asc' }
    });

    if (jobs.length === 0) {
      const orders = await prisma.order.findMany({ take: 3 });
      
      const seedJobs = [
        {
          orderId: orders[0]?.id || '',
          templateId: 'Royal Gold Foil Invitation',
          paperType: '350 GSM Textured Matte',
          finish: 'Gold Foil Stamping',
          status: 'QUEUE',
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
        },
        {
          orderId: orders[1]?.id || '',
          templateId: 'Heritage Botanical Card',
          paperType: '400 GSM Cotton Card',
          finish: 'Embossing & Die-cut',
          status: 'PRINTING',
          machineId: 'M-001',
          operatorId: 'Ravi Kumar',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        },
        {
          orderId: orders[2]?.id || '',
          templateId: 'Eco Seed Paper Keepsake Card',
          paperType: '300 GSM Recycled Seed Paper',
          finish: 'UV Spot Coating',
          status: 'COMPLETED',
          machineId: 'M-004',
          operatorId: 'Anil K.',
          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
        }
      ];

      await prisma.printJob.createMany({ data: seedJobs });

      jobs = await prisma.printJob.findMany({
        orderBy: { dueDate: 'asc' }
      });
    }

    // Attach real order numbers
    const orderIds = jobs.map(j => j.orderId).filter(Boolean);
    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      select: { id: true, orderNumber: true, status: true }
    });
    const orderMap = new Map(orders.map(o => [o.id, o]));

    const enriched = jobs.map(j => ({
      ...j,
      orderNumber: orderMap.get(j.orderId)?.orderNumber || `RM-2026-${j.id.slice(0, 5).toUpperCase()}`
    }));

    res.json({ data: enriched });
  } catch (error) {
    console.error('Fetch PrintJobs Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update Print Job Status & Sync Order Status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await prisma.printJob.update({
      where: { id: req.params.id },
      data: { status }
    });

    // Sync order status if order exists
    if (updated.orderId) {
      let newOrderStatus = 'PRINTING';
      if (status === 'COMPLETED') newOrderStatus = 'Assembly';
      else if (status === 'QUEUE') newOrderStatus = 'Approved';
      
      await prisma.order.update({
        where: { id: updated.orderId },
        data: { status: newOrderStatus }
      }).catch(console.error);
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update PrintJob Status Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update Print Job Machine Assignment
router.put('/:id/assignment', async (req, res) => {
  try {
    const { machineId, operatorId } = req.body;
    const updated = await prisma.printJob.update({
      where: { id: req.params.id },
      data: { 
        machineId: machineId || null, 
        operatorId: operatorId || null,
        status: machineId ? 'PRINTING' : 'QUEUE'
      }
    });

    if (updated.orderId && machineId) {
      await prisma.order.update({
        where: { id: updated.orderId },
        data: { status: 'Printing' }
      }).catch(console.error);
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Assign PrintJob Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
