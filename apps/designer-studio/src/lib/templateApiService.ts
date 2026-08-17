/**
 * Template API Gateway Service
 * ─────────────────────────────────────────────────────────────
 * Connects the 2D Vector Designer Studio with the API Gateway
 * Express + Prisma + PostgreSQL template endpoints (/api/templates).
 */

const API_BASE = 'http://localhost:4000';

export interface BackendTemplateRecord {
  id: string;
  name: string;
  eventType: string | null;
  canvasState: any;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublishTemplatePayload {
  templateId?: string | null;
  documentName: string;
  eventType: string;
  version: string;
  designerNotes: string;
  priceTier: 'Standard' | 'Premium' | 'Luxury';
  publishedAt: string;
  pages: any[];
  partialCuts: any[];
  materialConfig: any;
}

/**
 * Publishes or updates a template state in PostgreSQL via API Gateway.
 */
export async function publishTemplateToApi(payload: PublishTemplatePayload): Promise<{
  success: boolean;
  data?: BackendTemplateRecord;
  error?: string;
}> {
  try {
    const isUpdate = Boolean(payload.templateId);
    const url = isUpdate
      ? `${API_BASE}/api/templates/${payload.templateId}`
      : `${API_BASE}/api/templates`;
    const method = isUpdate ? 'PUT' : 'POST';

    const canvasState = {
      version: payload.version,
      designerNotes: payload.designerNotes,
      priceTier: payload.priceTier,
      publishedAt: payload.publishedAt,
      pages: payload.pages,
      partialCuts: payload.partialCuts,
      materialConfig: payload.materialConfig,
    };

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: payload.documentName,
        eventType: payload.eventType,
        status: 'PUBLISHED',
        canvasState,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const result = await response.json();
    return {
      success: true,
      data: result.data,
    };
  } catch (err: any) {
    console.error('[Template API] Failed to publish template:', err);
    return {
      success: false,
      error: err?.message || 'Failed to connect to API Gateway',
    };
  }
}

/**
 * Fetches all templates stored in PostgreSQL via API Gateway.
 */
export async function fetchTemplatesFromApi(): Promise<{
  success: boolean;
  templates: BackendTemplateRecord[];
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE}/api/templates`, {
      method: 'GET',
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const result = await response.json();
    return {
      success: true,
      templates: result.data || [],
    };
  } catch (err: any) {
    console.warn('[Template API] Failed to fetch templates from API Gateway:', err);
    return {
      success: false,
      templates: [],
      error: err?.message || 'API Gateway unreachable',
    };
  }
}

/**
 * Deletes a template from PostgreSQL via API Gateway.
 */
export async function deleteTemplateFromApi(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/templates/${id}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch (err) {
    console.error('[Template API] Failed to delete template:', err);
    return false;
  }
}
