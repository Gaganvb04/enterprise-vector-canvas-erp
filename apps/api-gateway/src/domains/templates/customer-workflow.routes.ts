import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../../lib/prisma';

const router = Router();

// ═══════════════════════════════════════════════════════════════════════════════
// PRISMA-BACKED CUSTOMER WORKFLOW ROUTES
// ═══════════════════════════════════════════════════════════════════════════════
// This module has been migrated from in-memory storage to PostgreSQL via Prisma.
// All customer workflow data is now persisted in the database.
// The database is the authoritative source of truth.
// ═══════════════════════════════════════════════════════════════════════════════

// TypeScript interfaces for clarity (matches Prisma schema)
export interface PublishedTemplateRecord {
  templateId: string;
  templateVersion: string;
  publicToken: string;
  publishedAt: string;
  publishedBy: string;
  status: 'draft' | 'published' | 'unpublished' | 'archived';
  customerEditableFields: string[];
  protectedFields: string[];
  snapshot: any;
}

export interface CustomerSessionRecord {
  customerSessionId: string;
  publicToken: string;
  templateId: string;
  templateVersion: string;
  customerData: Record<string, string>;
  customerImages: Record<string, string>;
  status: 'draft' | 'ready' | 'submitted' | 'changes_requested' | 'approved';
  createdAt: string;
  updatedAt: string;
}

export interface CustomerSubmissionRecord {
  submissionId: string;
  customerSessionId: string;
  publicToken: string;
  templateId: string;
  customerData: Record<string, string>;
  status: 'submitted' | 'changes_requested' | 'approved';
  submittedAt: string;
  designerNotes?: string;
}

export interface ImmutableProductionSnapshot {
  snapshotId: string;
  snapshotChecksum?: string;
  orderId: string;
  submissionId: string;
  createdAt: string;
  pages: any[];
  partialCuts: any[];
  materialConfig: any;
  manifestJson: any;
}

export interface OrderRecord {
  orderId: string;
  submissionId: string;
  publicToken: string;
  templateId: string;
  customerNames: string;
  weddingDate: string;
  venue: string;
  status: 'draft' | 'awaiting_customer' | 'submitted' | 'changes_requested' | 'approved' | 'production' | 'completed' | 'cancelled';
  productionStatus: 'not_started' | 'preflight' | 'ready' | 'in_production' | 'completed';
  createdAt: string;
  approvedAt: string | null;
  productionSnapshotId?: string;
}

// Audit logging helper
async function logAuditEvent(event: string, details: any) {
  console.log(`[AUDIT] ${event}`, JSON.stringify(details));
}

// ─── 1. PUBLISH TEMPLATE ────────────────────────────────────────────────────────
router.post('/publish', async (req: Request, res: Response) => {
  try {
    const { templateId, templateVersion, name, pages, customerEditableFields, protectedFields, snapshot } = req.body;
    const publicToken = `pub_tok_${crypto.randomBytes(8).toString('hex')}`;

    const publishedRecord = await prisma.publishedTemplateRecord.create({
      data: {
        templateId: templateId || `tmpl-${Date.now()}`,
        templateVersion: templateVersion || 'v1.0',
        publicToken,
        publishedAt: new Date(),
        publishedBy: 'Studio Designer',
        status: 'published',
        customerEditableFields: customerEditableFields || ['bride_name', 'groom_name', 'wedding_date', 'venue_name', 'rsvp_phone'],
        protectedFields: protectedFields || ['dieCutGeometry', 'background', 'gsm', 'safeArea', 'pageDimensions'],
        snapshot: snapshot || { name, pages }
      }
    });

    await logAuditEvent('template_published', { templateId: publishedRecord.templateId, publicToken });

    res.json({
      success: true,
      message: 'Template published and secure customer link generated!',
      data: {
        publicToken,
        customerLink: `/customize/${publicToken}`,
        publishedRecord: {
          ...publishedRecord,
          publishedAt: publishedRecord.publishedAt.toISOString()
        }
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to publish template', details: err.message });
  }
});

// ─── 2. GET PUBLISHED TEMPLATE BY PUBLIC TOKEN ──────────────────────────────
router.get('/published/:token', async (req: Request, res: Response) => {
  try {
    const token = String(req.params.token);
    const record = await prisma.publishedTemplateRecord.findUnique({
      where: { publicToken: token }
    });
    
    if (!record) {
      return res.status(404).json({ error: 'Published template link not found or expired' });
    }
    
    res.json({ 
      success: true, 
      data: {
        ...record,
        publishedAt: record.publishedAt.toISOString()
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve template', details: err.message });
  }
});

// ─── 3. CREATE OR GET CUSTOMER SESSION BY TOKEN ───────────────────────────────
router.post('/session', async (req: Request, res: Response) => {
  try {
    const { publicToken } = req.body;
    
    const template = await prisma.publishedTemplateRecord.findUnique({
      where: { publicToken }
    });
    
    if (!template) {
      return res.status(404).json({ error: 'Invalid or expired customer token' });
    }

    // Find existing non-approved session or create new one
    let session = await prisma.customerWorkflowSession.findFirst({
      where: { 
        publicToken,
        status: { not: 'approved' }
      }
    });
    
    if (!session) {
      const customerSessionId = `sess-${crypto.randomBytes(6).toString('hex')}`;
      session = await prisma.customerWorkflowSession.create({
        data: {
          customerSessionId,
          publicToken,
          templateId: template.templateId,
          templateVersion: template.templateVersion,
          customerData: {},
          customerImages: {},
          status: 'draft'
        }
      });
      await logAuditEvent('customer_session_created', { sessionId: session.customerSessionId, publicToken });
    }

    res.json({ 
      success: true, 
      data: { 
        session: {
          ...session,
          createdAt: session.createdAt.toISOString(),
          updatedAt: session.updatedAt.toISOString()
        },
        template: {
          ...template,
          publishedAt: template.publishedAt.toISOString()
        }
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to initialize customer session', details: err.message });
  }
});

// ─── 4. PUT CUSTOMER SESSION DATA (STRICT SERVER-SIDE AUTHORIZATION) ────────
router.put('/session/:token/data', async (req: Request, res: Response) => {
  try {
    const token = String(req.params.token);
    const { customerData, tamperedFields } = req.body;

    const session = await prisma.customerWorkflowSession.findFirst({
      where: { publicToken: token }
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Customer session not found' });
    }

    if (session.status === 'approved') {
      return res.status(403).json({ error: 'IMMUTABLE_APPROVED_SESSION: Approved invitations cannot be edited by customers.' });
    }

    const template = await prisma.publishedTemplateRecord.findUnique({
      where: { publicToken: token }
    });
    
    if (!template) {
      return res.status(404).json({ error: 'Authoritative template record missing' });
    }

    // ─── SERVER-SIDE SECURITY CHECK: MUTATION AUTHORIZATION ─────────────────
    // Detect unauthorized attempts to mutate protected fields (e.g. dieCutGeometry, gsm, background, pageDimensions)
    const allowedKeys = new Set(template.customerEditableFields as string[]);
    const attemptedKeys = Object.keys(customerData || {});

    const unauthorizedKeys = attemptedKeys.filter(k => !allowedKeys.has(k));
    if (unauthorizedKeys.length > 0 || tamperedFields) {
      await logAuditEvent('unauthorized_mutation_attempt', { token, unauthorizedKeys, tamperedFields });
      return res.status(403).json({
        error: 'UNAUTHORIZED_TEMPLATE_MUTATION',
        message: `Forbidden: Attempted to mutate protected template fields (${unauthorizedKeys.join(', ') || tamperedFields}). Customers may only edit approved fields.`,
        unauthorizedFields: unauthorizedKeys
      });
    }

    const existingData = session.customerData as Record<string, any>;
    const updatedSession = await prisma.customerWorkflowSession.update({
      where: { customerSessionId: session.customerSessionId },
      data: {
        customerData: { ...existingData, ...customerData },
        updatedAt: new Date()
      }
    });
    
    await logAuditEvent('customer_updated', { sessionId: session.customerSessionId, updatedKeys: attemptedKeys });

    res.json({ 
      success: true, 
      data: {
        ...updatedSession,
        createdAt: updatedSession.createdAt.toISOString(),
        updatedAt: updatedSession.updatedAt.toISOString()
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Server error updating session data', details: err.message });
  }
});

// ─── 5. SUBMIT CUSTOMER PERSONALIZATION FOR REVIEW ───────────────────────────
router.post('/session/:token/submit', async (req: Request, res: Response) => {
  try {
    const token = String(req.params.token);
    
    const session = await prisma.customerWorkflowSession.findFirst({
      where: { publicToken: token }
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Update session status
    const updatedSession = await prisma.customerWorkflowSession.update({
      where: { customerSessionId: session.customerSessionId },
      data: {
        status: 'submitted',
        updatedAt: new Date()
      }
    });

    // Create or update submission
    let submission = await prisma.customerSubmissionRecord.findUnique({
      where: { submissionId: `sub-${session.customerSessionId}` }
    });
    
    if (!submission) {
      const submissionId = `sub-${crypto.randomBytes(6).toString('hex')}`;
      submission = await prisma.customerSubmissionRecord.create({
        data: {
          submissionId,
          customerSessionId: session.customerSessionId,
          publicToken: token,
          templateId: session.templateId,
          customerData: session.customerData as any,
          status: 'submitted',
          submittedAt: new Date()
        }
      });
    } else {
      submission = await prisma.customerSubmissionRecord.update({
        where: { submissionId: submission.submissionId },
        data: {
          status: 'submitted',
          customerData: session.customerData as any,
          submittedAt: new Date()
        }
      });
    }

    // Create or update order
    let order = await prisma.workflowOrderRecord.findFirst({
      where: { publicToken: token }
    });
    
    const customerData = session.customerData as Record<string, string>;
    
    if (!order) {
      const orderId = `RM-${Math.floor(1000 + Math.random() * 9000)}`;
      order = await prisma.workflowOrderRecord.create({
        data: {
          orderId,
          submissionId: submission.submissionId,
          publicToken: token,
          templateId: session.templateId,
          customerNames: `${customerData.bride_name || 'Bride'} & ${customerData.groom_name || 'Groom'}`,
          weddingDate: customerData.wedding_date || '24 October 2026',
          venue: customerData.venue_name || 'Sri Convention Hall',
          status: 'submitted',
          productionStatus: 'not_started'
        }
      });
    } else {
      order = await prisma.workflowOrderRecord.update({
        where: { orderId: order.orderId },
        data: {
          status: 'submitted'
        }
      });
    }

    await logAuditEvent('customer_submitted', { submissionId: submission.submissionId, orderId: order.orderId });

    res.json({
      success: true,
      message: 'Invitation submitted for designer approval!',
      data: { 
        session: {
          ...updatedSession,
          createdAt: updatedSession.createdAt.toISOString(),
          updatedAt: updatedSession.updatedAt.toISOString()
        }, 
        submission: {
          ...submission,
          submittedAt: submission.submittedAt.toISOString()
        },
        order: {
          ...order,
          createdAt: order.createdAt.toISOString(),
          approvedAt: order.approvedAt?.toISOString() || null
        }
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to submit invitation', details: err.message });
  }
});

// ─── 6. DESIGNER LIST SUBMISSIONS ────────────────────────────────────────────
router.get('/designer/submissions', async (req: Request, res: Response) => {
  try {
    const submissions = await prisma.customerSubmissionRecord.findMany({
      orderBy: {
        submittedAt: 'desc'
      }
    });
    
    const formattedSubmissions = submissions.map(s => ({
      ...s,
      submittedAt: s.submittedAt.toISOString()
    }));
    
    res.json({ success: true, data: formattedSubmissions });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve submissions', details: err.message });
  }
});

// ─── 7. DESIGNER REQUEST CHANGES ─────────────────────────────────────────────
router.post('/designer/submissions/:id/request-changes', async (req: Request, res: Response) => {
  try {
    const submissionId = String(req.params.id);
    const { message } = req.body;
    
    const submission = await prisma.customerSubmissionRecord.findUnique({
      where: { submissionId }
    });
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Update submission
    const updatedSubmission = await prisma.customerSubmissionRecord.update({
      where: { submissionId: submission.submissionId },
      data: {
        status: 'changes_requested',
        designerNotes: message
      }
    });

    // Update session
    await prisma.customerWorkflowSession.updateMany({
      where: { customerSessionId: submission.customerSessionId },
      data: { status: 'changes_requested' }
    });

    // Update order
    await prisma.workflowOrderRecord.updateMany({
      where: { submissionId: submission.submissionId },
      data: { status: 'changes_requested' }
    });

    await logAuditEvent('changes_requested', { submissionId: submission.submissionId, message });

    res.json({ 
      success: true, 
      message: 'Requested changes sent to customer', 
      data: {
        ...updatedSubmission,
        submittedAt: updatedSubmission.submittedAt.toISOString()
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to request changes', details: err.message });
  }
});

// ─── 8. DESIGNER APPROVE SUBMISSION & CREATE IMMUTABLE SNAPSHOT ─────────────
router.post('/designer/submissions/:id/approve', async (req: Request, res: Response) => {
  try {
    const submissionId = String(req.params.id);
    
    const submission = await prisma.customerSubmissionRecord.findUnique({
      where: { submissionId }
    });
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Update submission
    const updatedSubmission = await prisma.customerSubmissionRecord.update({
      where: { submissionId: submission.submissionId },
      data: { status: 'approved' }
    });

    // Update session
    await prisma.customerWorkflowSession.updateMany({
      where: { customerSessionId: submission.customerSessionId },
      data: { status: 'approved' }
    });

    // Update order and create immutable snapshot
    const order = await prisma.workflowOrderRecord.findFirst({
      where: { submissionId: submission.submissionId }
    });

    if (order) {
      const approvedAt = new Date();
      
      // ─── CREATE IMMUTABLE PRODUCTION SNAPSHOT ─────────────────────────────
      const snapshotData = {
        orderId: order.orderId,
        customerData: submission.customerData,
        approvedAt: approvedAt.toISOString()
      };
      
      const snapshotChecksum = crypto.createHash('sha256')
        .update(JSON.stringify(snapshotData))
        .digest('hex');

      const snapshotId = `snap-${crypto.randomBytes(6).toString('hex')}`;
      
      const customerData = submission.customerData as Record<string, string>;
      
      const productionSnapshot = await prisma.immutableProductionSnapshotRecord.create({
        data: {
          snapshotId,
          snapshotChecksum,
          orderId: order.orderId,
          submissionId: submission.submissionId,
          pages: [
            {
              id: 'p1',
              pageNumber: 1,
              label: 'Front Cover',
              customerValues: customerData,
              cardShape: { shapeId: 'arch_top', archHeight: 180, cornerRadius: 16, cutOuts: [] }
            }
          ] as any,
          partialCuts: [] as any,
          materialConfig: { gsm: 300, bleedMm: 3, safeAreaMm: 4 } as any,
          manifestJson: {
            documentName: `${order.customerNames} Wedding Invitation`,
            approvedAt: approvedAt.toISOString(),
            snapshotChecksum,
            gsm: 300,
            status: 'IMMUTABLE_APPROVED'
          } as any
        }
      });

      // Update order with snapshot reference
      const updatedOrder = await prisma.workflowOrderRecord.update({
        where: { orderId: order.orderId },
        data: {
          status: 'approved',
          productionStatus: 'ready',
          approvedAt,
          productionSnapshotId: productionSnapshot.snapshotId
        }
      });

      await logAuditEvent('production_snapshot_created', { 
        snapshotId: productionSnapshot.snapshotId, 
        orderId: order.orderId,
        checksum: snapshotChecksum
      });

      res.json({ 
        success: true, 
        message: 'Submission approved and immutable production snapshot created!', 
        data: { 
          submission: {
            ...updatedSubmission,
            submittedAt: updatedSubmission.submittedAt.toISOString()
          }, 
          order: {
            ...updatedOrder,
            createdAt: updatedOrder.createdAt.toISOString(),
            approvedAt: updatedOrder.approvedAt?.toISOString() || null
          },
          snapshot: {
            snapshotId: productionSnapshot.snapshotId,
            checksum: snapshotChecksum
          }
        }
      });
    } else {
      res.json({ 
        success: true, 
        message: 'Submission approved!', 
        data: { 
          submission: {
            ...updatedSubmission,
            submittedAt: updatedSubmission.submittedAt.toISOString()
          }
        }
      });
    }

    await logAuditEvent('designer_approved', { submissionId: submission.submissionId });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to approve submission', details: err.message });
  }
});

// ─── 9. GET ORDERS LIST FOR ORDER DASHBOARD ──────────────────────────────────
router.get('/orders', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    
    let orders;
    if (status && status !== 'All') {
      orders = await prisma.workflowOrderRecord.findMany({
        where: {
          status: (status as string).toLowerCase()
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } else {
      orders = await prisma.workflowOrderRecord.findMany({
        orderBy: {
          createdAt: 'desc'
        }
      });
    }
    
    const formattedOrders = orders.map(o => ({
      ...o,
      createdAt: o.createdAt.toISOString(),
      approvedAt: o.approvedAt?.toISOString() || null
    }));
    
    res.json({ success: true, data: formattedOrders });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve orders', details: err.message });
  }
});

// ─── 10. GENERATE PRODUCTION PACKAGE FROM IMMUTABLE SNAPSHOT ───────────────
router.post('/orders/:id/production-package', async (req: Request, res: Response) => {
  try {
    const orderId = String(req.params.id);
    
    const order = await prisma.workflowOrderRecord.findFirst({
      where: {
        OR: [
          { orderId },
          { submissionId: orderId }
        ]
      }
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Read from immutable snapshot (authoritative production source)
    let snapshot = null;
    if (order.productionSnapshotId) {
      snapshot = await prisma.immutableProductionSnapshotRecord.findUnique({
        where: { snapshotId: order.productionSnapshotId }
      });
    }
    
    if (!snapshot) {
      snapshot = await prisma.immutableProductionSnapshotRecord.findFirst({
        where: { orderId: order.orderId }
      });
    }

    const manifest = snapshot?.manifestJson || {
      orderId: order.orderId,
      customerNames: order.customerNames,
      weddingDate: order.weddingDate,
      venue: order.venue,
      approvedAt: order.approvedAt?.toISOString() || null,
      paperGsm: 300,
      status: 'PRODUCTION_APPROVED'
    };

    await logAuditEvent('production_package_generated', { orderId: order.orderId });

    res.json({
      success: true,
      message: 'Production manufacturing package generated successfully!',
      data: {
        orderId: order.orderId,
        manifestJson: manifest,
        snapshotChecksum: snapshot?.snapshotChecksum || null,
        files: [
          'Production_MultiLayer.svg',
          'Cut_Plate.svg',
          'PartialCut_Plate.svg',
          'Score_Plate.svg',
          'Perforation_Plate.svg',
          'Engrave_Plate.svg',
          'Production_Manifest.json'
        ]
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate production package', details: err.message });
  }
});

export default router;
