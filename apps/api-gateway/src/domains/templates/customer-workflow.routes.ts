import { Router, Request, Response } from 'express';
import crypto from 'crypto';

const router = Router();

// In-memory stores for Published Templates, Customer Sessions, Submissions, Orders & Production Snapshots
export interface PublishedTemplateRecord {
  templateId: string;
  templateVersion: string;
  publicToken: string;
  publishedAt: string;
  publishedBy: string;
  status: 'draft' | 'published' | 'unpublished' | 'archived';
  customerEditableFields: string[]; // e.g. ["bride_name", "groom_name", "wedding_date", "venue_name", "rsvp_phone"]
  protectedFields: string[];        // e.g. ["dieCutGeometry", "background", "gsm", "safeArea", "pageDimensions"]
  snapshot: any;                     // Full immutable canvas snapshot
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

// Global In-Memory Stores
export const publishedTemplatesStore: PublishedTemplateRecord[] = [
  {
    templateId: 'tmpl-royal-floral',
    templateVersion: 'v1.0',
    publicToken: 'pub_tok_royal_floral_123',
    publishedAt: new Date().toISOString(),
    publishedBy: 'Studio Designer',
    status: 'published',
    customerEditableFields: ['bride_name', 'groom_name', 'wedding_date', 'wedding_time', 'venue_name', 'rsvp_phone', 'host_family', 'blessing_deity'],
    protectedFields: ['dieCutGeometry', 'background', 'gsm', 'safeArea', 'pageDimensions', 'lockedArtwork'],
    snapshot: {
      name: 'Royal Floral Wedding',
      pages: [
        {
          id: 'p1',
          pageNumber: 1,
          pageType: 'front_cover',
          label: 'Front Cover',
          background: { type: 'color', color: '#FAF5EF' },
          cardShape: { shapeId: 'arch_top', archHeight: 180, cornerRadius: 16, cutOuts: [] },
          textBlocks: [
            { id: 'tb1', variableKey: 'bride_name', content: '{{bride_name}}', editableByCustomer: true },
            { id: 'tb2', variableKey: 'groom_name', content: '{{groom_name}}', editableByCustomer: true },
            { id: 'tb3', variableKey: 'wedding_date', content: '{{wedding_date}}', editableByCustomer: true },
            { id: 'tb4', variableKey: 'venue_name', content: '{{venue_name}}', editableByCustomer: true },
          ],
          elements: []
        }
      ]
    }
  }
];

export const customerSessionsStore: CustomerSessionRecord[] = [
  {
    customerSessionId: 'sess-001',
    publicToken: 'pub_tok_royal_floral_123',
    templateId: 'tmpl-royal-floral',
    templateVersion: 'v1.0',
    customerData: {
      bride_name: 'Ananya',
      groom_name: 'Arjun',
      wedding_date: '24 October 2026',
      wedding_time: '7:30 PM',
      venue_name: 'Sri Convention Hall',
      rsvp_phone: '+91 98765 43210'
    },
    customerImages: {},
    status: 'submitted',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const customerSubmissionsStore: CustomerSubmissionRecord[] = [
  {
    submissionId: 'sub-001',
    customerSessionId: 'sess-001',
    publicToken: 'pub_tok_royal_floral_123',
    templateId: 'tmpl-royal-floral',
    customerData: {
      bride_name: 'Ananya',
      groom_name: 'Arjun',
      wedding_date: '24 October 2026',
      wedding_time: '7:30 PM',
      venue_name: 'Sri Convention Hall',
      rsvp_phone: '+91 98765 43210'
    },
    status: 'submitted',
    submittedAt: new Date().toISOString()
  }
];

export const productionSnapshotsStore: ImmutableProductionSnapshot[] = [];

export const ordersStore: OrderRecord[] = [
  {
    orderId: 'RM-1001',
    submissionId: 'sub-001',
    publicToken: 'pub_tok_royal_floral_123',
    templateId: 'tmpl-royal-floral',
    customerNames: 'Ananya & Arjun',
    weddingDate: '24 October 2026',
    venue: 'Sri Convention Hall',
    status: 'submitted',
    productionStatus: 'not_started',
    createdAt: new Date().toISOString(),
    approvedAt: null
  }
];

// Audit trail store
export const auditTrailStore: Array<{ timestamp: string; event: string; details: any }> = [];

function logAuditEvent(event: string, details: any) {
  auditTrailStore.push({
    timestamp: new Date().toISOString(),
    event,
    details
  });
}

// ─── 1. PUBLISH TEMPLATE ────────────────────────────────────────────────────────
router.post('/publish', (req: Request, res: Response) => {
  try {
    const { templateId, templateVersion, name, pages, customerEditableFields, protectedFields, snapshot } = req.body;
    const publicToken = `pub_tok_${crypto.randomBytes(8).toString('hex')}`;

    const publishedRecord: PublishedTemplateRecord = {
      templateId: templateId || `tmpl-${Date.now()}`,
      templateVersion: templateVersion || 'v1.0',
      publicToken,
      publishedAt: new Date().toISOString(),
      publishedBy: 'Studio Designer',
      status: 'published',
      customerEditableFields: customerEditableFields || ['bride_name', 'groom_name', 'wedding_date', 'venue_name', 'rsvp_phone'],
      protectedFields: protectedFields || ['dieCutGeometry', 'background', 'gsm', 'safeArea', 'pageDimensions'],
      snapshot: snapshot || { name, pages }
    };

    publishedTemplatesStore.unshift(publishedRecord);
    logAuditEvent('template_published', { templateId: publishedRecord.templateId, publicToken });

    res.json({
      success: true,
      message: 'Template published and secure customer link generated!',
      data: {
        publicToken,
        customerLink: `/customize/${publicToken}`,
        publishedRecord
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to publish template', details: err.message });
  }
});

// ─── 2. GET PUBLISHED TEMPLATE BY PUBLIC TOKEN ──────────────────────────────
router.get('/published/:token', (req: Request, res: Response) => {
  const record = publishedTemplatesStore.find(t => t.publicToken === req.params.token);
  if (!record) {
    return res.status(404).json({ error: 'Published template link not found or expired' });
  }
  res.json({ success: true, data: record });
});

// ─── 3. CREATE OR GET CUSTOMER SESSION BY TOKEN ───────────────────────────────
router.post('/session', (req: Request, res: Response) => {
  try {
    const { publicToken } = req.body;
    const template = publishedTemplatesStore.find(t => t.publicToken === publicToken);
    if (!template) {
      return res.status(404).json({ error: 'Invalid or expired customer token' });
    }

    let session = customerSessionsStore.find(s => s.publicToken === publicToken && s.status !== 'approved');
    if (!session) {
      session = {
        customerSessionId: `sess-${crypto.randomBytes(6).toString('hex')}`,
        publicToken,
        templateId: template.templateId,
        templateVersion: template.templateVersion,
        customerData: {},
        customerImages: {},
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      customerSessionsStore.unshift(session);
      logAuditEvent('customer_session_created', { sessionId: session.customerSessionId, publicToken });
    }

    res.json({ success: true, data: { session, template } });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to initialize customer session', details: err.message });
  }
});

// ─── 4. PUT CUSTOMER SESSION DATA (STRICT SERVER-SIDE AUTHORIZATION) ────────
router.put('/session/:token/data', (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { customerData, tamperedFields } = req.body;

    const session = customerSessionsStore.find(s => s.publicToken === token);
    if (!session) {
      return res.status(404).json({ error: 'Customer session not found' });
    }

    if (session.status === 'approved') {
      return res.status(403).json({ error: 'IMMUTABLE_APPROVED_SESSION: Approved invitations cannot be edited by customers.' });
    }

    const template = publishedTemplatesStore.find(t => t.publicToken === token);
    if (!template) {
      return res.status(404).json({ error: 'Authoritative template record missing' });
    }

    // ─── SERVER-SIDE SECURITY CHECK: MUTATION AUTHORIZATION ─────────────────
    // Detect unauthorized attempts to mutate protected fields (e.g. dieCutGeometry, gsm, background, pageDimensions)
    const allowedKeys = new Set(template.customerEditableFields);
    const attemptedKeys = Object.keys(customerData || {});

    const unauthorizedKeys = attemptedKeys.filter(k => !allowedKeys.has(k));
    if (unauthorizedKeys.length > 0 || tamperedFields) {
      logAuditEvent('unauthorized_mutation_attempt', { token, unauthorizedKeys, tamperedFields });
      return res.status(403).json({
        error: 'UNAUTHORIZED_TEMPLATE_MUTATION',
        message: `Forbidden: Attempted to mutate protected template fields (${unauthorizedKeys.join(', ') || tamperedFields}). Customers may only edit approved fields.`,
        unauthorizedFields: unauthorizedKeys
      });
    }

    session.customerData = { ...session.customerData, ...customerData };
    session.updatedAt = new Date().toISOString();
    logAuditEvent('customer_updated', { sessionId: session.customerSessionId, updatedKeys: attemptedKeys });

    res.json({ success: true, data: session });
  } catch (err: any) {
    res.status(500).json({ error: 'Server error updating session data', details: err.message });
  }
});

// ─── 5. SUBMIT CUSTOMER PERSONALIZATION FOR REVIEW ───────────────────────────
router.post('/session/:token/submit', (req: Request, res: Response) => {
  try {
    const token = req.params.token as string;
    const session = customerSessionsStore.find(s => s.publicToken === token);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.status = 'submitted';
    session.updatedAt = new Date().toISOString();

    let submission: CustomerSubmissionRecord;
    const existingSub = customerSubmissionsStore.find(s => s.customerSessionId === session.customerSessionId);
    if (!existingSub) {
      submission = {
        submissionId: `sub-${crypto.randomBytes(6).toString('hex')}`,
        customerSessionId: session.customerSessionId,
        publicToken: token,
        templateId: session.templateId,
        customerData: session.customerData,
        status: 'submitted',
        submittedAt: new Date().toISOString()
      };
      customerSubmissionsStore.unshift(submission);
    } else {
      submission = existingSub;
      submission.status = 'submitted';
      submission.customerData = session.customerData;
      submission.submittedAt = new Date().toISOString();
    }

    let order: OrderRecord;
    const existingOrder = ordersStore.find(o => o.publicToken === token);
    if (!existingOrder) {
      order = {
        orderId: `RM-${Math.floor(1000 + Math.random() * 9000)}`,
        submissionId: submission.submissionId,
        publicToken: token,
        templateId: session.templateId,
        customerNames: `${session.customerData.bride_name || 'Bride'} & ${session.customerData.groom_name || 'Groom'}`,
        weddingDate: session.customerData.wedding_date || '24 October 2026',
        venue: session.customerData.venue_name || 'Sri Convention Hall',
        status: 'submitted',
        productionStatus: 'not_started',
        createdAt: new Date().toISOString(),
        approvedAt: null
      };
      ordersStore.unshift(order);
    } else {
      order = existingOrder;
      order.status = 'submitted';
    }

    logAuditEvent('customer_submitted', { submissionId: submission.submissionId, orderId: order.orderId });

    res.json({
      success: true,
      message: 'Invitation submitted for designer approval!',
      data: { session, submission, order }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to submit invitation', details: err.message });
  }
});

// ─── 6. DESIGNER LIST SUBMISSIONS ────────────────────────────────────────────
router.get('/designer/submissions', (req: Request, res: Response) => {
  res.json({ success: true, data: customerSubmissionsStore });
});

// ─── 7. DESIGNER REQUEST CHANGES ─────────────────────────────────────────────
router.post('/designer/submissions/:id/request-changes', (req: Request, res: Response) => {
  const { message } = req.body;
  const submission = customerSubmissionsStore.find(s => s.submissionId === req.params.id);
  if (!submission) {
    return res.status(404).json({ error: 'Submission not found' });
  }

  submission.status = 'changes_requested';
  submission.designerNotes = message;

  const session = customerSessionsStore.find(s => s.customerSessionId === submission.customerSessionId);
  if (session) session.status = 'changes_requested';

  const order = ordersStore.find(o => o.submissionId === submission.submissionId);
  if (order) order.status = 'changes_requested';

  logAuditEvent('changes_requested', { submissionId: submission.submissionId, message });

  res.json({ success: true, message: 'Requested changes sent to customer', data: submission });
});

// ─── 8. DESIGNER APPROVE SUBMISSION & CREATE IMMUTABLE SNAPSHOT ─────────────
router.post('/designer/submissions/:id/approve', (req: Request, res: Response) => {
  const submission = customerSubmissionsStore.find(s => s.submissionId === req.params.id);
  if (!submission) {
    return res.status(404).json({ error: 'Submission not found' });
  }

  submission.status = 'approved';

  const session = customerSessionsStore.find(s => s.customerSessionId === submission.customerSessionId);
  if (session) session.status = 'approved';

  const order = ordersStore.find(o => o.submissionId === submission.submissionId);
  if (order) {
    order.status = 'approved';
    order.productionStatus = 'ready';
    order.approvedAt = new Date().toISOString();

    // ─── CREATE IMMUTABLE PRODUCTION SNAPSHOT ─────────────────────────────
    const snapshotChecksum = crypto.createHash('sha256').update(JSON.stringify({
      orderId: order.orderId,
      customerData: submission.customerData,
      approvedAt: order.approvedAt
    })).digest('hex');

    const productionSnapshot: ImmutableProductionSnapshot = {
      snapshotId: `snap-${crypto.randomBytes(6).toString('hex')}`,
      orderId: order.orderId,
      submissionId: submission.submissionId,
      createdAt: new Date().toISOString(),
      pages: [
        {
          id: 'p1',
          pageNumber: 1,
          label: 'Front Cover',
          customerValues: submission.customerData,
          cardShape: { shapeId: 'arch_top', archHeight: 180, cornerRadius: 16, cutOuts: [] }
        }
      ],
      partialCuts: [],
      materialConfig: { gsm: 300, bleedMm: 3, safeAreaMm: 4 },
      manifestJson: {
        documentName: `${order.customerNames} Wedding Invitation`,
        approvedAt: order.approvedAt,
        snapshotChecksum,
        gsm: 300,
        status: 'IMMUTABLE_APPROVED'
      }
    };

    productionSnapshotsStore.unshift(productionSnapshot);
    order.productionSnapshotId = productionSnapshot.snapshotId;
    logAuditEvent('production_snapshot_created', { snapshotId: productionSnapshot.snapshotId, orderId: order.orderId });
  }

  logAuditEvent('designer_approved', { submissionId: submission.submissionId });

  res.json({ success: true, message: 'Submission approved and immutable production snapshot created!', data: { submission, order } });
});

// ─── 9. GET ORDERS LIST FOR ORDER DASHBOARD ──────────────────────────────────
router.get('/orders', (req: Request, res: Response) => {
  const { status } = req.query;
  let list = ordersStore;
  if (status && status !== 'All') {
    list = list.filter(o => o.status.toLowerCase() === (status as string).toLowerCase());
  }
  res.json({ success: true, data: list });
});

// ─── 10. GENERATE PRODUCTION PACKAGE FROM IMMUTABLE SNAPSHOT ───────────────
router.post('/orders/:id/production-package', (req: Request, res: Response) => {
  const order = ordersStore.find(o => o.orderId === req.params.id || o.submissionId === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const snapshot = productionSnapshotsStore.find(s => s.snapshotId === order.productionSnapshotId || s.orderId === order.orderId);

  const manifest = snapshot?.manifestJson || {
    orderId: order.orderId,
    customerNames: order.customerNames,
    weddingDate: order.weddingDate,
    venue: order.venue,
    approvedAt: order.approvedAt,
    paperGsm: 300,
    status: 'PRODUCTION_APPROVED'
  };

  logAuditEvent('production_package_generated', { orderId: order.orderId });

  res.json({
    success: true,
    message: 'Production manufacturing package generated successfully!',
    data: {
      orderId: order.orderId,
      manifestJson: manifest,
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
});

export default router;
