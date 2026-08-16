import { Router } from 'express';
import prisma from '../../lib/prisma';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const templates = await prisma.template.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ data: templates });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, eventType, canvasState, status } = req.body;
    
    // In a real app we'd validate the payload here
    const template = await prisma.template.create({
      data: {
        name: name || 'Untitled Template',
        eventType: eventType || 'General',
        canvasState: canvasState || {},
        status: status || 'DRAFT'
      }
    });

    res.json({ success: true, data: template });
  } catch (error) {
    console.error('Error saving template:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, eventType, status, canvasState } = req.body;
    const updated = await prisma.template.update({
      where: { id: req.params.id },
      data: {
        ...(name        !== undefined ? { name }        : {}),
        ...(eventType   !== undefined ? { eventType }   : {}),
        ...(status      !== undefined ? { status }      : {}),
        ...(canvasState !== undefined ? { canvasState } : {}),
      }
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.template.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

