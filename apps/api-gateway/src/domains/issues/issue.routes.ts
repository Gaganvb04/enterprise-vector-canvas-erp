import { Router } from 'express';
import prisma from '../../lib/prisma';

const router = Router();

// Get all issues
router.get('/', async (req, res) => {
  try {
    let issues = await prisma.issue.findMany({
      orderBy: { reportedAt: 'desc' }
    });
    
    // Seed some data if empty
    if (issues.length === 0) {
      const seedIssues = [
        { issueNumber: 'ISS-091', type: 'Breakdown', title: 'Heidelberg Press Jam', machine: 'M-01', priority: 'High', status: 'In Progress', assigned: 'Tech Team' },
        { issueNumber: 'ISS-092', type: 'Shortage', title: 'Low Gold Foil Stock', machine: 'N/A', priority: 'Medium', status: 'Open', assigned: 'Inventory Dept' },
        { issueNumber: 'ISS-093', type: 'QC Reject', title: 'Color Mismatch on ORD-8812', machine: 'M-02', priority: 'High', status: 'Resolved', assigned: 'Operator John' },
        { issueNumber: 'ISS-094', type: 'Return', title: 'Damaged in transit (ORD-8750)', machine: 'N/A', priority: 'Low', status: 'Open', assigned: 'Customer Support' },
      ];
      
      await prisma.issue.createMany({ data: seedIssues });
      
      issues = await prisma.issue.findMany({
        orderBy: { reportedAt: 'desc' }
      });
    }

    res.json({ data: issues });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new issue
router.post('/', async (req, res) => {
  try {
    const { title, type, machine, priority } = req.body;
    
    if (!title || !type) {
      return res.status(400).json({ error: 'Title and Type are required' });
    }

    const issueNumber = `ISS-${Math.floor(1000 + Math.random() * 9000)}`;

    const newIssue = await prisma.issue.create({
      data: {
        issueNumber,
        title,
        type,
        machine: machine || 'N/A',
        priority: priority || 'Medium',
        status: 'Open',
        assigned: 'Unassigned',
      }
    });

    res.json({ success: true, data: newIssue });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update issue status / assignment
router.put('/:id', async (req, res) => {
  try {
    const { status, assigned } = req.body;
    const updated = await prisma.issue.update({
      where: { id: req.params.id },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(assigned !== undefined ? { assigned } : {}),
      }
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update custom design request status
export default router;

