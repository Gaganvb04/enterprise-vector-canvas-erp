import { Router } from 'express';
import prisma from '../../lib/prisma';

const router = Router();

// Get all assembly tasks with auto-seeding if empty
router.get('/', async (req, res) => {
  try {
    let tasks = await prisma.assemblyTask.findMany({
      include: {
        order: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (tasks.length === 0) {
      const orders = await prisma.order.findMany({ take: 3 });

      const seedTasks = [
        {
          orderId: orders[0]?.id ?? '',
          type: 'Grow Kit',
          status: 'New',
          assignedTo: 'Ananya R.',
          department: 'Grow Kit',
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          notes: 'Standard Bloom Grow Kit (100 units) for wedding event',
          checklist: [
            { label: 'Check pot stock (Coco peat & Terracotta)', done: true },
            { label: 'Sort plant saplings', done: true },
            { label: 'Attach customized event QR code tags', done: false },
            { label: 'Quality inspection', done: false },
            { label: 'Box & secure for dispatch', done: false }
          ]
        },
        {
          orderId: orders[1]?.id ?? '',
          type: 'Combo',
          status: 'In Progress',
          assignedTo: 'Vikram S.',
          department: 'General',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          notes: 'Combo Set: Gold Foil Card + Legacy Oak Kit',
          checklist: [
            { label: 'Match printed cards with kit batch', done: true },
            { label: 'Assemble keepsake gift box', done: true },
            { label: 'Insert printed invitation & care card', done: false },
            { label: 'Quality inspection', done: false },
            { label: 'Apply ribbon seal', done: false }
          ]
        },
        {
          orderId: orders[2]?.id ?? '',
          type: 'Grow Kit',
          status: 'Assembly',
          assignedTo: 'Priya K.',
          department: 'Grow Kit',
          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
          notes: 'Celebrate Kit - 50 units Assorted Mix',
          checklist: [
            { label: 'Verify plant quantities', done: true },
            { label: 'Pack organic soil pod', done: true },
            { label: 'Place seed paper envelope', done: true },
            { label: 'Perform final QC check', done: false },
            { label: 'Seal box', done: false }
          ]
        }
      ];

      await prisma.assemblyTask.createMany({ data: seedTasks });

      tasks = await prisma.assemblyTask.findMany({
        include: {
          order: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                  phone: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Fetch Assembly Tasks Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update task status (drag & drop) & sync linked order
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const task = await prisma.assemblyTask.update({
      where: { id: req.params.id },
      data: { status },
      include: { order: true }
    });

    // Sync status back to main Order table
    if (task.orderId) {
      let orderStatus = 'Assembly';
      if (status === 'Assembly') orderStatus = 'Assembly';
      else if (status === 'Packaging') orderStatus = 'Packaging';
      else if (status === 'Dispatch') orderStatus = 'Dispatched';
      
      await prisma.order.update({
        where: { id: task.orderId },
        data: { status: orderStatus }
      }).catch(console.error);
    }

    res.json({ success: true, data: task });
  } catch (error) {
    console.error('Update Assembly Status Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update task checklist state
router.put('/:id/checklist', async (req, res) => {
  try {
    const { checklist } = req.body;
    const task = await prisma.assemblyTask.update({
      where: { id: req.params.id },
      data: { checklist }
    });
    res.json({ success: true, data: task });
  } catch (error) {
    console.error('Update Assembly Checklist Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
