import { Router } from 'express';
import prisma from '../../lib/prisma';

const router = Router();

// In-memory fallback templates store when PostgreSQL database is offline or not connected
let inMemoryTemplates: any[] = [
  {
    id: 'tmpl-001',
    name: 'Scalloped Die-Cut Wedding Card',
    eventType: 'Wedding',
    status: 'PUBLISHED',
    canvasState: {
      cardType: 'diecut',
      cutProfile: 'scalloped',
      dimensions: { width: 5, height: 7, unit: 'in' },
      layers: []
    },
    createdAt: new Date().toISOString()
  },
  {
    id: 'tmpl-002',
    name: 'Arch Cut Invitation & Merge Variables',
    eventType: 'Invitation',
    status: 'PUBLISHED',
    canvasState: {
      cardType: 'arch',
      cutProfile: 'arch_top',
      dimensions: { width: 4, height: 6, unit: 'in' },
      layers: []
    },
    createdAt: new Date().toISOString()
  }
];

router.get('/', async (req, res) => {
  try {
    const templates = await prisma.template.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ data: templates });
  } catch (error) {
    console.warn('[DB Fallback] PostgreSQL database offline. Serving in-memory templates store.');
    res.json({ data: inMemoryTemplates });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, eventType, canvasState, status } = req.body;
    
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
    console.warn('[DB Fallback] PostgreSQL database offline. Saving template to in-memory store.');
    const { name, eventType, canvasState, status } = req.body;
    const newTemplate = {
      id: `tmpl-${Date.now()}`,
      name: name || 'Untitled Template',
      eventType: eventType || 'General',
      canvasState: canvasState || {},
      status: status || 'DRAFT',
      createdAt: new Date().toISOString()
    };
    inMemoryTemplates.unshift(newTemplate);
    res.json({ success: true, data: newTemplate });
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
    console.warn('[DB Fallback] PostgreSQL database offline. Updating in-memory template.');
    const idx = inMemoryTemplates.findIndex((t) => t.id === req.params.id);
    if (idx !== -1) {
      inMemoryTemplates[idx] = { ...inMemoryTemplates[idx], ...req.body };
      res.json({ success: true, data: inMemoryTemplates[idx] });
    } else {
      res.json({ success: true, data: { id: req.params.id, ...req.body } });
    }
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.template.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.warn('[DB Fallback] PostgreSQL database offline. Deleting from in-memory template store.');
    inMemoryTemplates = inMemoryTemplates.filter((t) => t.id !== req.params.id);
    res.json({ success: true });
  }
});

export default router;
