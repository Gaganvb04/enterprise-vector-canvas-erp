import { create } from 'zustand';
import { ShapeData } from '../data/shapes';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type PageType = 'front_cover' | 'outer_back' | 'english_inner' | 'kannada_inner' | 'back_panel';
export type LayerCategory = 'background' | 'element' | 'textblock';
export type ElementCategory = 'floral' | 'deity' | 'frame' | 'divider' | 'badge' | 'border' | 'texture' | 'custom';
export type TextBlockType = 'invocation' | 'parent_names' | 'couple_names' | 'event_details' | 'venue' | 'timing' | 'free';
export type ActiveTool = 'select' | 'text' | 'element' | 'shape_cut' | 'pan' | 'pencil' | 'draw_shape';
export type ActivePanel = 'pages' | 'shapes' | 'colors' | 'elements' | 'text' | 'layers' | 'uploads' | 'diecut';

export interface UserUploadAsset {
  id: string;
  name: string;
  src: string;        // base64 data URL (local fallback) or S3 CDN URL
  type: 'svg' | 'image';
  createdAt: string;
  // AWS S3 metadata — present when uploaded via presigned URL
  s3Key?: string;     // S3 object key e.g. "vector-designs/1234-rose.svg"
  cdnUrl?: string;    // Public CDN/S3 URL
  uploadedToS3?: boolean;
}

export interface Background {
  type: 'color' | 'texture' | 'gradient' | 'image';
  color: string;
  textureId?: string;
  imageUrl?: string;
  gradient?: { from: string; to: string; angle: number };
}

import type {
  EdgeSide, CornerPosition,
  FourSideEdgeConfig, PartialCutObject, MaterialConfig, ValidationWarning
} from '../types/diecut';
import { PARTIAL_CUT_SHAPES } from '../utils/partialCutShapes';
import { publishTemplateToApi } from '../lib/templateApiService';
import type { InvitationVariable } from '../types/variable';
import { INITIAL_VARIABLES } from '../types/variable';
import type { StarterTemplate } from '../data/starterTemplates';

export interface CardShape {
  shapeId: string;        // 'rectangle' | 'arch_top' | 'scalloped' | 'custom' | ...
  clipPath?: string;      // SVG path for custom shape
  archHeight?: number;    // Arch curve height in px (50 - 400)
  cornerRadius?: number;  // Corner radius in px (0 - 100)
  flapDepth?: number;     // Envelope flap curve depth in px (50 - 300)
  cutOuts: CutOut[];      // die-cut holes
  fourSides?: FourSideEdgeConfig; // Die-Cut Engine V2 4-side edge configuration
}

export type CutMode = 'inner_hole' | 'outer_shape' | 'partial_popup';

export interface CutOut {
  id: string;
  name?: string;
  shape: string;
  cutMode: CutMode; // 'inner_hole' (removes inside part) | 'outer_shape' (trims outer card) | 'partial_popup' (3D pop-up lift)
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  svgPathD?: string;
  previewSvg?: string;
  clipPath?: string;
}

export type PrintFinish = 'none' | 'gold_foil' | 'silver_foil' | 'rose_gold' | 'copper_foil' | 'spot_uv' | 'emboss';
export type FoilMaskView = 'composite' | 'gold_foil' | 'silver_foil' | 'rose_gold' | 'copper_foil' | 'spot_uv' | 'emboss';
export type MachinePass = 'composite' | 'm1_diecut' | 'm2_design' | 'm3_text' | 'm4a_design_foil' | 'm4b_text_foil';

export interface DesignElement {
  id: string;
  elementId: string;
  name: string;
  category: ElementCategory;
  src: string;            // SVG markup or image URL
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  blendMode: string;
  printFinish?: PrintFinish;
  flipH: boolean;
  flipV: boolean;
  locked: boolean;
  visible: boolean;
  type?: 'image' | 'shape' | 'svg';
  editableByCustomer?: boolean;
}

export interface TextBlock {
  id: string;
  blockType: TextBlockType;
  name: string;
  content: string;
  language: 'en' | 'kn' | 'hi' | 'te';
  x: number;
  y: number;
  width: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  fontColor: string;
  textAlign: 'left' | 'center' | 'right';
  lineHeight: number;
  letterSpacing: number;
  printFinish?: PrintFinish;
  locked: boolean;
  visible: boolean;
  // Phase 9 Variable System Extensions
  variableKey?: string;         // e.g. "bride_name" if directly bound to variable
  isCustomizable?: boolean;     // true if customizable by customer, false if static text
  editableByCustomer?: boolean; // true if customer can edit in future Customer Mode
}

export interface InvitationPage {
  id: string;
  pageNumber: number;
  pageType: PageType;
  label: string;
  rotation?: number; // 0, 90, 180, 270 degrees
  // Layer 1 — background & shape
  background: Background;
  cardShape: CardShape;
  // Layer 2 — design elements (stickers)
  elements: DesignElement[];
  // Layer 3 — text blocks
  textBlocks: TextBlock[];
  // For pages 3-5: template
  templateId?: string;
}

export interface SelectedItem {
  layer: 'element' | 'textblock';
  id: string;
}

export interface ClipboardItem {
  layer: 'element' | 'textblock';
  data: DesignElement | TextBlock;
}

// ─── History Entry ──────────────────────────────────────────────────────────────
interface HistoryEntry {
  pages: InvitationPage[];
}

// ─── Store State ───────────────────────────────────────────────────────────────
export interface StudioState {
  // Document
  documentId: string;
  documentName: string;
  eventType: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'PRINT_APPROVED';

  // Phase 3 Versioning & Uploads
  version: string;
  designerNotes: string;
  publishedAt: string | null;
  priceTier: 'Standard' | 'Premium' | 'Luxury';
  userUploads: UserUploadAsset[];
  pencilStrokeColor: string;
  pencilStrokeWidth: number;

  // Phase 5 & Phase 9 Typography & Variable Engine
  previewVariables: boolean;
  showVariableHighlights: boolean;
  variables: InvitationVariable[];
  sampleCustomerData: Record<string, string>;
  customerVariables: Record<string, { label: string; value: string; category?: string }>;
  togglePreviewVariables: () => void;
  toggleVariableHighlights: () => void;
  updateVariableValue: (key: string, value: string) => void;
  addCustomVariable: (variable: Omit<InvitationVariable, 'id'>) => void;
  deleteCustomVariable: (key: string) => void;
  resetPreviewData: () => void;
  validateVariables: () => { isValid: boolean; missingFields: string[]; warnings: string[] };
  updateSampleCustomerData: (updates: Partial<Record<string, string>>) => void;
  resolveVariables: (content: string) => string;

  // Phase 6 Foil Engine & Page Actions
  activeFoilMaskView: FoilMaskView;
  setFoilMaskView: (view: FoilMaskView) => void;
  activeMachinePass: MachinePass;
  setMachinePass: (pass: MachinePass) => void;
  addPage: (pageType: PageType, label: string) => void;
  duplicatePage: (pageId: string) => void;
  deletePage: (pageId: string) => void;

  // Pages
  pages: InvitationPage[];
  activePageId: string;

  // Selection & Clipboard
  selected: SelectedItem | null;
  clipboard: ClipboardItem | null;
  toastMessage: string | null;

  // UI & Grid
  zoom: number;
  showGrid: boolean;
  activeTool: ActiveTool;
  activePanel: ActivePanel;

  // New Phase 1 UI Experience State
  uiMode: 'design' | 'production';
  showRulers: boolean;
  show3DModal: boolean;
  favorites: string[];
  recentShapes: string[];
  setUiMode: (mode: 'design' | 'production') => void;
  toggleRulers: () => void;
  setShow3DModal: (show: boolean) => void;
  toggleFavorite: (shapeId: string) => void;
  addRecentShape: (shapeId: string) => void;
  removeRecentShape: (shapeId: string) => void;
  clearRecentShapes: () => void;
  fitZoomToScreen: () => void;
  fitZoomToWidth: () => void;
  setZoomPreset: (pct: number) => void;

  // Paint-Style Shape Tool State
  selectedShapeForDrawing: any | null;
  setSelectedShapeForDrawing: (shape: any | null) => void;

  // Phase 8 Freehand & Custom Shape Cut Drawing State
  drawDieCutTool: 'freehand' | 'line' | 'curve' | 'rectangle' | 'circle' | 'polygon';
  drawDieCutOperation: 'cut' | 'partial_cut' | 'score' | 'perforation' | 'engrave';
  drawSmoothingLevel: 'low' | 'medium' | 'high';
  drawForceClose: boolean;
  drawBridgeCount: number;
  drawBridgeWidthMm: number;
  drawScoreFold: 'none' | 'vertical' | 'horizontal';
  setDrawDieCutTool: (tool: 'freehand' | 'line' | 'curve' | 'rectangle' | 'circle' | 'polygon') => void;
  setDrawDieCutOperation: (op: 'cut' | 'partial_cut' | 'score' | 'perforation' | 'engrave') => void;
  setDrawSmoothingLevel: (level: 'low' | 'medium' | 'high') => void;
  setDrawForceClose: (close: boolean) => void;
  setDrawBridgeCount: (count: number) => void;
  setDrawBridgeWidthMm: (width: number) => void;
  // Phase 10 & 11 Customer Mode & Review Workflow State
  currentStep: 1 | 2 | 3 | 4;
  templateGalleryOpen: boolean;
  approvalStatus: 'draft' | 'approved';
  appMode: 'designer' | 'customer';
  customerSubmissionStatus: 'draft' | 'ready' | 'submitted' | 'approved' | 'changes_requested';
  designerReviewNotes: string;
  setStep: (step: 1 | 2 | 3 | 4) => void;
  setTemplateGalleryOpen: (open: boolean) => void;
  setApprovalStatus: (status: 'draft' | 'approved') => void;
  setAppMode: (mode: 'designer' | 'customer') => void;
  setCustomerSubmissionStatus: (status: 'draft' | 'ready' | 'submitted' | 'approved' | 'changes_requested') => void;
  setDesignerReviewNotes: (notes: string) => void;
  toggleElementCustomerEditable: (pageId: string, elementId: string) => void;
  toggleTextBlockCustomerEditable: (pageId: string, blockId: string) => void;
  loadStarterTemplate: (template: StarterTemplate) => void;

  // Die-Cut Engine V2 State
  showProductionLines: boolean;
  selectedEdgeSide: EdgeSide;
  selectedPartialCutId: string | null;
  materialConfig: MaterialConfig;
  partialCuts: PartialCutObject[];
  validationWarnings: ValidationWarning[];

  // Die-Cut Engine V2 Actions
  setEdgeSide: (side: EdgeSide, shapeId: string) => void;
  setCornerSide: (corner: CornerPosition, shapeId: string) => void;
  setApplyAllEdges: (shapeId: string) => void;
  setMirrorEdges: () => void;
  resetEdges: () => void;
  setSelectedEdgeSide: (side: EdgeSide) => void;
  setSelectedPartialCutId: (id: string | null) => void;
  setMaterialGsm: (gsm: 180 | 220 | 250 | 300 | 350 | 400) => void;
  setBleedMm: (mm: number) => void;
  setSafeAreaMm: (mm: number) => void;
  addPartialCutObject: (obj: PartialCutObject) => void;
  updatePartialCutObject: (id: string, updates: Partial<PartialCutObject>) => void;
  removePartialCutObject: (id: string) => void;
  toggleProductionView: () => void;
  runProductionValidation: () => void;

  // History
  history: HistoryEntry[];
  historyIndex: number;

  // ─── Computed helpers ────────────────────────────────────────────────────────
  getActivePage: () => InvitationPage | undefined;

  templateDbId: string | null;
  createNewDesign: () => void;
  setDocumentName: (name: string) => void;
  setEventType: (type: string) => void;
  showToast: (msg: string) => void;
  saveDesign: () => void;
  loadDesign: () => void;
  loadButterflyTemplate: () => void;
  publishTemplate: (version: string, notes: string, priceTier: 'Standard' | 'Premium' | 'Luxury') => Promise<void>;
  loadTemplateFromRecord: (record: any) => void;

  // ─── Phase 3 Pencil & Upload Actions ─────────────────────────────────────────
  setPencilStrokeColor: (color: string) => void;
  setPencilStrokeWidth: (width: number) => void;
  addPencilElement: (pageId: string, pathD: string, bounds: { x: number; y: number; width: number; height: number }) => void;
  addUpload: (asset: Omit<UserUploadAsset, 'id' | 'createdAt'>) => void;
  removeUpload: (id: string) => void;

  // ─── Page actions ────────────────────────────────────────────────────────────
  setActivePage: (id: string) => void;
  reorderPages: (fromIndex: number, toIndex: number) => void;
  updatePage: (id: string, updates: Partial<InvitationPage>) => void;
  rotatePage: (pageId?: string, angleDelta?: number) => void;

  // ─── Layer 1 actions ─────────────────────────────────────────────────────────
  setBackground: (pageId: string, bg: Partial<Background>) => void;
  setCardShape: (pageId: string, shape: Partial<CardShape>) => void;
  applyPencilAsCardShape: (pageId: string, elementId: string) => void;
  applyPencilAsCutOut: (pageId: string, elementId: string) => void;
  addCutOut: (pageId: string, cutOut: CutOut) => void;
  updateCutOut: (pageId: string, cutOutId: string, updates: Partial<CutOut>) => void;
  setCutOutMode: (pageId: string, cutOutId: string, mode: CutMode) => void;
  removeCutOut: (pageId: string, cutOutId: string) => void;

  // ─── Layer 2 actions ─────────────────────────────────────────────────────────
  addElement: (pageId: string, element: Omit<DesignElement, 'id'>) => void;
  updateElement: (pageId: string, elementId: string, updates: Partial<DesignElement>) => void;
  deleteElement: (pageId: string, elementId: string) => void;
  reorderElements: (pageId: string, fromIndex: number, toIndex: number) => void;

  // ─── Layer 3 actions ─────────────────────────────────────────────────────────
  addTextBlock: (pageId: string, block: Omit<TextBlock, 'id'>) => void;
  updateTextBlock: (pageId: string, blockId: string, updates: Partial<TextBlock>) => void;
  deleteTextBlock: (pageId: string, blockId: string) => void;

  // ─── Selection, Rotation & Manipulation Actions ──────────────────────────────
  setSelected: (item: SelectedItem | null) => void;
  copySelected: () => void;
  cutSelected: () => void;
  pasteClipboard: () => void;
  duplicateSelected: () => void;
  nudgeSelected: (dx: number, dy: number) => void;
  rotateSelected: (angleDelta?: number) => void;
  flipSelectedH: () => void;
  flipSelectedV: () => void;
  toggleLockSelected: () => void;
  toggleVisibilitySelected: () => void;

  // ─── Layer Ordering & Alignment Actions ─────────────────────────────────────
  bringForward: () => void;
  sendBackward: () => void;
  bringToFront: () => void;
  sendToBack: () => void;
  alignSelected: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;

  // ─── UI & Grid ───────────────────────────────────────────────────────────────
  setZoom: (zoom: number) => void;
  toggleGrid: () => void;
  setActiveTool: (tool: ActiveTool) => void;
  setActivePanel: (panel: ActivePanel) => void;

  // ─── History ─────────────────────────────────────────────────────────────────
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
}

// ─── Default Pages ─────────────────────────────────────────────────────────────

const defaultBackground = (color = '#FAF0E8', textureId?: string): Background => ({
  type: textureId ? 'texture' : 'color',
  color,
  textureId,
});

const defaultShape: CardShape = {
  shapeId: 'rectangle',
  cornerRadius: 0,
  cutOuts: [],
};

const INITIAL_PAGES: InvitationPage[] = [
  {
    id: 'page-1',
    pageNumber: 1,
    pageType: 'front_cover',
    label: 'Front Cover',
    background: defaultBackground('#FAF0E8', 'marble_rose_gold'),
    cardShape: defaultShape,
    elements: [],
    textBlocks: [],
  },
  {
    id: 'page-2',
    pageNumber: 2,
    pageType: 'outer_back',
    label: 'Outer Back',
    background: defaultBackground('#F7EDE2', 'marble_rose_gold'),
    cardShape: defaultShape,
    elements: [],
    textBlocks: [],
  },
  {
    id: 'page-3',
    pageNumber: 3,
    pageType: 'english_inner',
    label: 'English Page',
    background: defaultBackground('#FFFDF9'),
    cardShape: defaultShape,
    elements: [],
    textBlocks: [
      {
        id: 'tb-en-invocation',
        blockType: 'invocation',
        name: 'Invocation',
        content: 'II Sri Lakshmi Narasimha Swamy Prasanna II',
        language: 'en',
        x: 40, y: 30, width: 420,
        fontFamily: 'Playfair Display', fontSize: 12, fontWeight: '600',
        fontStyle: 'normal', fontColor: '#5C1A1A',
        textAlign: 'center', lineHeight: 1.5, letterSpacing: 0.5,
        locked: false, visible: true,
      },
      {
        id: 'tb-en-couple',
        blockType: 'couple_names',
        name: 'Couple Names',
        content: 'Bhaskar V.V.\n&\nMeena C.D.',
        language: 'en',
        x: 40, y: 200, width: 420,
        fontFamily: 'Great Vibes', fontSize: 36, fontWeight: '400',
        fontStyle: 'normal', fontColor: '#7B1E1E',
        textAlign: 'center', lineHeight: 1.6, letterSpacing: 1,
        locked: false, visible: true,
      },
      {
        id: 'tb-en-venue',
        blockType: 'venue',
        name: 'Venue',
        content: 'Venue: S.L.V. Convention Hall\nBellutigate, Sidlaghatta',
        language: 'en',
        x: 40, y: 360, width: 420,
        fontFamily: 'Inter', fontSize: 13, fontWeight: '600',
        fontStyle: 'normal', fontColor: '#5C1A1A',
        textAlign: 'center', lineHeight: 1.6, letterSpacing: 0,
        locked: false, visible: true,
      },
    ],
  },
  {
    id: 'page-4',
    pageNumber: 4,
    pageType: 'kannada_inner',
    label: 'Kannada Page',
    background: defaultBackground('#FFFDF9'),
    cardShape: defaultShape,
    elements: [],
    textBlocks: [
      {
        id: 'tb-kn-invocation',
        blockType: 'invocation',
        name: 'ಆವಾಹನೆ',
        content: '॥ ಶ್ರೀ ಲಕ್ಷ್ಮೀ ನರಸಿಂಹ ಸ್ವಾಮಿ ಪ್ರಸನ್ನ ॥',
        language: 'kn',
        x: 40, y: 30, width: 420,
        fontFamily: 'Noto Serif Kannada', fontSize: 14, fontWeight: '600',
        fontStyle: 'normal', fontColor: '#5C1A1A',
        textAlign: 'center', lineHeight: 1.5, letterSpacing: 0,
        locked: false, visible: true,
      },
      {
        id: 'tb-kn-couple',
        blockType: 'couple_names',
        name: 'ದಂಪತಿ ಹೆಸರು',
        content: 'ಭಾಸ್ಕರ್ ವಿ.ವಿ.\nಮತ್ತು\nಮೀನಾ ಸಿ.ಡಿ.',
        language: 'kn',
        x: 40, y: 200, width: 420,
        fontFamily: 'Noto Serif Kannada', fontSize: 28, fontWeight: '700',
        fontStyle: 'normal', fontColor: '#7B1E1E',
        textAlign: 'center', lineHeight: 1.6, letterSpacing: 0,
        locked: false, visible: true,
      },
    ],
  },
  {
    id: 'page-5',
    pageNumber: 5,
    pageType: 'back_panel',
    label: 'Back Panel',
    background: defaultBackground('#F5EBE0', 'marble_rose_gold'),
    cardShape: defaultShape,
    elements: [],
    textBlocks: [],
  },
];

// ─── Store Implementation ──────────────────────────────────────────────────────

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

let toastTimer: any = null;

export const useStudioStore = create<StudioState>((set, get) => ({
  documentId: `doc-${uid()}`,
  documentName: 'Untitled Invitation',
  eventType: 'Wedding',
  status: 'DRAFT',
  templateDbId: null,

  // Phase 3 Versioning & Uploads
  version: 'v1.0',
  designerNotes: 'Initial production draft template.',
  publishedAt: null,
  priceTier: 'Premium',
  userUploads: [],
  pencilStrokeColor: '#5C1A1A',
  pencilStrokeWidth: 4,

  // Phase 5 & Phase 9 Typography & Variable Engine
  previewVariables: true,
  showVariableHighlights: false,
  variables: INITIAL_VARIABLES,
  sampleCustomerData: {
    groom_name: 'Rahul',
    bride_name: 'Priya',
    wedding_date: '24 October 2026',
    wedding_time: '7:30 PM',
    reception_time: '6:30 PM Onwards',
    venue_name: 'Sri Convention Hall',
    venue_address: 'Bengaluru',
    rsvp_phone: '+91 98765 43210',
    host_family: 'Smt. Sunita & Sri K. Sharma',
    blessing_deity: 'II Sri Ganeshaya Namah II'
  },
  customerVariables: {
    bride_name: { label: 'Bride Name', value: 'Priya', category: 'Couples' },
    groom_name: { label: 'Groom Name', value: 'Rahul', category: 'Couples' },
    wedding_date: { label: 'Wedding Date', value: '24 October 2026', category: 'Schedule' },
    wedding_time: { label: 'Wedding Time', value: '7:30 PM', category: 'Schedule' },
    reception_time: { label: 'Reception Time', value: '6:30 PM Onwards', category: 'Schedule' },
    venue_name: { label: 'Venue Name', value: 'Sri Convention Hall', category: 'Location' },
    venue_address: { label: 'Venue Address', value: 'Bengaluru', category: 'Location' },
    rsvp_phone: { label: 'RSVP Phone', value: '+91 98765 43210', category: 'Contacts' },
    host_family: { label: 'Host Family', value: 'Smt. Sunita & Sri K. Sharma', category: 'Family' },
    blessing_deity: { label: 'Deity Blessing', value: 'II Sri Ganeshaya Namah II', category: 'Invocation' }
  },
  togglePreviewVariables: () => set(state => ({ previewVariables: !state.previewVariables })),
  toggleVariableHighlights: () => set(state => ({ showVariableHighlights: !state.showVariableHighlights })),

  updateVariableValue: (key: string, value: string) => set(state => {
    const updatedVars = state.variables.map(v => v.key === key ? { ...v, value } : v);
    const updatedSampleData = { ...state.sampleCustomerData, [key]: value };
    const currCustVar = state.customerVariables[key] || { label: key, value: '', category: 'Custom' };
    const updatedCustomerVars = {
      ...state.customerVariables,
      [key]: { ...currCustVar, value }
    };
    return {
      variables: updatedVars,
      sampleCustomerData: updatedSampleData,
      customerVariables: updatedCustomerVars
    };
  }),

  addCustomVariable: (newVar) => set(state => {
    const varObj: InvitationVariable = {
      ...newVar,
      id: `v-custom-${Date.now()}`
    };
    return {
      variables: [...state.variables, varObj],
      sampleCustomerData: { ...state.sampleCustomerData, [varObj.key]: varObj.value }
    };
  }),

  deleteCustomVariable: (key: string) => set(state => {
    const nextVars = state.variables.filter(v => v.key !== key);
    const nextSampleData = { ...state.sampleCustomerData };
    delete nextSampleData[key];
    return {
      variables: nextVars,
      sampleCustomerData: nextSampleData
    };
  }),

  resetPreviewData: () => set(state => {
    const resetVars = state.variables.map(v => ({ ...v, value: v.defaultValue }));
    const resetSampleData: Record<string, string> = {};
    resetVars.forEach(v => { resetSampleData[v.key] = v.defaultValue; });
    return {
      variables: resetVars,
      sampleCustomerData: resetSampleData
    };
  }),

  validateVariables: () => {
    const { variables } = get();
    const missingFields: string[] = [];
    const warnings: string[] = [];

    variables.forEach(v => {
      if (v.required && (!v.value || v.value.trim() === '')) {
        missingFields.push(v.label);
      }
    });

    return {
      isValid: missingFields.length === 0,
      missingFields,
      warnings
    };
  },

  updateSampleCustomerData: (updates) => set(state => ({
    sampleCustomerData: { ...state.sampleCustomerData, ...(updates as Record<string, string>) }
  })),

  resolveVariables: (content: string) => {
    const { previewVariables, variables, sampleCustomerData } = get();
    if (!content) return content;

    let resolved = content;
    const varMap: Record<string, string> = {};

    variables.forEach(v => {
      const valToUse = previewVariables
        ? (v.value.trim() !== '' ? v.value : `[${v.label}]`)
        : `[${v.label}]`;
      varMap[v.key] = valToUse;
    });

    Object.entries(sampleCustomerData).forEach(([k, val]) => {
      if (val && !varMap[k]) {
        varMap[k] = val;
      }
    });

    Object.entries(varMap).forEach(([key, val]) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi');
      resolved = resolved.replace(regex, val);
    });

    return resolved;
  },

  // Phase 10 Saleable Workflow Implementation
  currentStep: 2,
  templateGalleryOpen: false,
  approvalStatus: 'draft',
  appMode: 'designer',
  customerSubmissionStatus: 'draft',
  designerReviewNotes: '',
  setStep: (step) => set({ currentStep: step }),
  setTemplateGalleryOpen: (open) => set({ templateGalleryOpen: open }),
  setApprovalStatus: (status) => set({ approvalStatus: status }),
  setAppMode: (mode) => set({ appMode: mode }),
  setCustomerSubmissionStatus: (status) => set({ customerSubmissionStatus: status }),
  setDesignerReviewNotes: (notes) => set({ designerReviewNotes: notes }),

  toggleElementCustomerEditable: (pageId, elementId) => set(state => ({
    pages: state.pages.map(p => p.id === pageId ? {
      ...p,
      elements: p.elements.map(el => el.id === elementId ? { ...el, editableByCustomer: !el.editableByCustomer } : el)
    } : p)
  })),

  toggleTextBlockCustomerEditable: (pageId, blockId) => set(state => ({
    pages: state.pages.map(p => p.id === pageId ? {
      ...p,
      textBlocks: p.textBlocks.map(tb => tb.id === blockId ? { ...tb, editableByCustomer: !tb.editableByCustomer, isCustomizable: !tb.editableByCustomer } : tb)
    } : p)
  })),

  loadStarterTemplate: (template: StarterTemplate) => {
    const pages = template.pages.map(p => ({
      ...p,
      cardShape: { ...template.cardShape, cutOuts: p.cardShape?.cutOuts || [] },
    }));

    set({
      documentName: template.name,
      pages,
      activePageId: pages[0]?.id || 'p1',
      partialCuts: template.partialCuts || [],
      selected: null,
      selectedPartialCutId: null,
      currentStep: 1,
      approvalStatus: 'draft',
    });
  },

  // Phase 6 Foil Engine & Page Actions
  activeFoilMaskView: 'composite',
  setFoilMaskView: (view) => set({ activeFoilMaskView: view }),
  activeMachinePass: 'composite',
  setMachinePass: (pass) => set({ activeMachinePass: pass }),

  addPage: (pageType, label) => set(state => {
    const newId = `page-${Date.now()}`;
    const newPage: InvitationPage = {
      id: newId,
      pageNumber: state.pages.length + 1,
      pageType,
      label,
      background: defaultBackground('#FAF0E8'),
      cardShape: defaultShape,
      elements: [],
      textBlocks: [],
    };
    return {
      pages: [...state.pages, newPage],
      activePageId: newId,
    };
  }),

  duplicatePage: (pageId) => set(state => {
    const target = state.pages.find(p => p.id === pageId);
    if (!target) return state;
    const newId = `page-${Date.now()}`;
    const dup: InvitationPage = JSON.parse(JSON.stringify(target));
    dup.id = newId;
    dup.label = `${target.label} (Copy)`;
    dup.pageNumber = state.pages.length + 1;

    return {
      pages: [...state.pages, dup],
      activePageId: newId,
    };
  }),

  deletePage: (pageId) => set(state => {
    if (state.pages.length <= 1) return state; // Keep at least 1 page
    const nextPages = state.pages.filter(p => p.id !== pageId).map((p, i) => ({ ...p, pageNumber: i + 1 }));
    return {
      pages: nextPages,
      activePageId: nextPages[0].id,
    };
  }),

  loadButterflyTemplate: () => set(() => {
    const butterflyPages: InvitationPage[] = [
      {
        id: 'page-bf-1',
        pageNumber: 1,
        pageType: 'front_cover',
        label: 'Front Envelope Flap',
        background: defaultBackground('#F4F4F6'),
        cardShape: defaultShape,
        elements: [
          {
            id: 'el-bf-flap',
            elementId: 'top-flap',
            name: 'Charcoal Envelope Top Flap',
            category: 'frame',
            src: `<svg viewBox="0 0 561 180" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><path d="M 0 0 L 561 0 L 561 70 Q 280 180 0 70 Z" fill="#3A3D42"/><rect x="270" y="110" width="20" height="40" rx="10" fill="#222225"/></svg>`,
            x: 0, y: 0, width: 561, height: 180,
            rotation: 0, opacity: 1, blendMode: 'normal',
            flipH: false, flipV: false, locked: false, visible: true,
          },
          {
            id: 'el-bf-clasp',
            elementId: 'butterfly-clasp',
            name: '3D Orange Butterfly Clasp',
            category: 'badge',
            src: `<svg viewBox="0 0 100 80" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bfGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FFD100"/><stop offset="50%" stop-color="#F58220"/><stop offset="100%" stop-color="#E63946"/></linearGradient></defs><path d="M 50 40 C 20 10, 0 15, 10 45 C 20 65, 45 50, 50 40 Z" fill="url(#bfGrad)" stroke="#FFFFFF" stroke-width="2"/><path d="M 50 40 C 80 10, 100 15, 90 45 C 80 65, 55 50, 50 40 Z" fill="url(#bfGrad)" stroke="#FFFFFF" stroke-width="2"/><ellipse cx="50" cy="40" rx="4" ry="20" fill="#3A3D42"/></svg>`,
            x: 235, y: 110, width: 90, height: 80,
            rotation: 0, opacity: 1, blendMode: 'normal',
            flipH: false, flipV: false, locked: false, visible: true,
          },
          {
            id: 'el-bf-crest',
            elementId: 'oval-frame',
            name: 'Baroque Oval Monogram Crest',
            category: 'frame',
            src: `<svg viewBox="0 0 300 350" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><ellipse cx="150" cy="175" rx="120" ry="145" fill="none" stroke="#C9956C" stroke-width="2.5" stroke-dasharray="8 4"/><path d="M 150 15 C 200 15, 270 60, 270 175 C 270 290, 200 335, 150 335 C 100 335, 30 290, 30 175 C 30 60, 100 15, 150 15 Z" fill="none" stroke="#C9956C" stroke-width="3"/><circle cx="150" cy="20" r="8" fill="#C9956C"/><circle cx="150" cy="330" r="8" fill="#C9956C"/><path d="M 140 25 Q 150 5 160 25" fill="none" stroke="#C9956C" stroke-width="2"/><path d="M 140 325 Q 150 345 160 325" fill="none" stroke="#C9956C" stroke-width="2"/></svg>`,
            x: 130, y: 310, width: 300, height: 350,
            rotation: 0, opacity: 1, blendMode: 'normal',
            printFinish: 'gold_foil',
            flipH: false, flipV: false, locked: false, visible: true,
          },
        ],
        textBlocks: [
          {
            id: 'tb-bf-wedding',
            blockType: 'free',
            name: 'Flap Left Text',
            content: 'Wedding',
            language: 'en',
            x: 80, y: 135, width: 140,
            fontFamily: 'Playfair Display', fontSize: 18, fontWeight: '600',
            fontStyle: 'normal', fontColor: '#FFFFFF',
            textAlign: 'center', lineHeight: 1.2, letterSpacing: 1,
            locked: false, visible: true,
          },
          {
            id: 'tb-bf-invitation',
            blockType: 'free',
            name: 'Flap Right Text',
            content: 'Invitation',
            language: 'en',
            x: 340, y: 135, width: 140,
            fontFamily: 'Playfair Display', fontSize: 18, fontWeight: '600',
            fontStyle: 'normal', fontColor: '#FFFFFF',
            textAlign: 'center', lineHeight: 1.2, letterSpacing: 1,
            locked: false, visible: true,
          },
          {
            id: 'tb-bf-monogram',
            blockType: 'couple_names',
            name: 'Monogram Logo (J A)',
            content: 'J  A',
            language: 'en',
            x: 180, y: 440, width: 200,
            fontFamily: 'Cinzel', fontSize: 48, fontWeight: '700',
            fontStyle: 'normal', fontColor: '#222222',
            printFinish: 'gold_foil',
            textAlign: 'center', lineHeight: 1.2, letterSpacing: 4,
            locked: false, visible: true,
          },
        ],
      },
      {
        id: 'page-bf-2',
        pageNumber: 2,
        pageType: 'english_inner',
        label: 'Inner Invitation Card',
        background: defaultBackground('#F5F5F7'),
        cardShape: defaultShape,
        elements: [
          {
            id: 'el-bf-header-crest',
            elementId: 'small-crest',
            name: 'Header Monogram Crest',
            category: 'frame',
            src: `<svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="none" stroke="#C9956C" stroke-width="2"/><text x="50" y="58" text-anchor="middle" fill="#C9956C" font-family="Cinzel" font-size="24" font-weight="bold">JA</text></svg>`,
            x: 230, y: 35, width: 100, height: 100,
            rotation: 0, opacity: 1, blendMode: 'normal',
            printFinish: 'gold_foil',
            flipH: false, flipV: false, locked: false, visible: true,
          },
        ],
        textBlocks: [
          {
            id: 'tb-bf-blessing',
            blockType: 'invocation',
            name: 'Blessing Invocation',
            content: 'With divine blessings of our beloved family',
            language: 'en',
            x: 50, y: 155, width: 460,
            fontFamily: 'Cormorant Garamond', fontSize: 13, fontWeight: '500',
            fontStyle: 'normal', fontColor: '#666666',
            textAlign: 'center', lineHeight: 1.5, letterSpacing: 0.5,
            locked: false, visible: true,
          },
          {
            id: 'tb-bf-couple-names',
            blockType: 'couple_names',
            name: 'Couple Names (Aleena & Jithin)',
            content: 'Aleena   &   Jithin',
            language: 'en',
            x: 40, y: 200, width: 480,
            fontFamily: 'Great Vibes', fontSize: 46, fontWeight: '400',
            fontStyle: 'normal', fontColor: '#B76E79',
            printFinish: 'gold_foil',
            textAlign: 'center', lineHeight: 1.5, letterSpacing: 1,
            locked: false, visible: true,
          },
          {
            id: 'tb-bf-invite-body',
            blockType: 'free',
            name: 'Invitation Body',
            content: 'invite you to join us in celebrating our\nbeautiful journey along with your family on',
            language: 'en',
            x: 50, y: 290, width: 460,
            fontFamily: 'Inter', fontSize: 12, fontWeight: '500',
            fontStyle: 'normal', fontColor: '#444444',
            textAlign: 'center', lineHeight: 1.6, letterSpacing: 0,
            locked: false, visible: true,
          },
          {
            id: 'tb-bf-date',
            blockType: 'event_details',
            name: 'Highlighted Date',
            content: 'FRIDAY    23    JANUARY 2026',
            language: 'en',
            x: 50, y: 375, width: 460,
            fontFamily: 'Playfair Display', fontSize: 18, fontWeight: '700',
            fontStyle: 'normal', fontColor: '#222222',
            printFinish: 'gold_foil',
            textAlign: 'center', lineHeight: 1.4, letterSpacing: 2,
            locked: false, visible: true,
          },
          {
            id: 'tb-bf-time',
            blockType: 'timing',
            name: 'Event Time',
            content: '05:00 PM - 08:00 PM',
            language: 'en',
            x: 50, y: 435, width: 460,
            fontFamily: 'Inter', fontSize: 13, fontWeight: '600',
            fontStyle: 'normal', fontColor: '#555555',
            textAlign: 'center', lineHeight: 1.4, letterSpacing: 0.5,
            locked: false, visible: true,
          },
          {
            id: 'tb-bf-venue',
            blockType: 'venue',
            name: 'Auditorium Venue',
            content: '@\nGolden Palace Auditorium\nGuruvayur, Choondal, Kerala - 680502',
            language: 'en',
            x: 50, y: 490, width: 460,
            fontFamily: 'Cinzel', fontSize: 14, fontWeight: '600',
            fontStyle: 'normal', fontColor: '#B76E79',
            printFinish: 'gold_foil',
            textAlign: 'center', lineHeight: 1.6, letterSpacing: 0.5,
            locked: false, visible: true,
          },
        ],
      },
      {
        id: 'page-bf-3',
        pageNumber: 3,
        pageType: 'back_panel',
        label: 'Lower Pocket & QR Panel',
        background: defaultBackground('#3A3D42'),
        cardShape: defaultShape,
        elements: [
          {
            id: 'el-bf-qr',
            elementId: 'qr-code',
            name: 'Location QR Code',
            category: 'badge',
            src: `<svg viewBox="0 0 90 90" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="90" height="90" rx="8" fill="#FFFFFF"/><rect x="10" y="10" width="25" height="25" fill="#111"/><rect x="55" y="10" width="25" height="25" fill="#111"/><rect x="10" y="55" width="25" height="25" fill="#111"/><rect x="45" y="45" width="15" height="15" fill="#111"/><rect x="65" y="65" width="15" height="15" fill="#111"/><text x="45" y="85" text-anchor="middle" fill="#111" font-size="8" font-weight="bold" font-family="monospace">LOCATION</text></svg>`,
            x: 235, y: 60, width: 90, height: 90,
            rotation: 0, opacity: 1, blendMode: 'normal',
            flipH: false, flipV: false, locked: false, visible: true,
          },
        ],
        textBlocks: [
          {
            id: 'tb-bf-qr-label',
            blockType: 'free',
            name: 'QR Location Label',
            content: 'SCAN FOR MAP LOCATION',
            language: 'en',
            x: 40, y: 165, width: 480,
            fontFamily: 'Inter', fontSize: 10, fontWeight: '700',
            fontStyle: 'normal', fontColor: '#CCCCCC',
            textAlign: 'center', lineHeight: 1.2, letterSpacing: 1.5,
            locked: false, visible: true,
          },
          {
            id: 'tb-bf-sign',
            blockType: 'couple_names',
            name: 'Pocket Cursive Signature',
            content: 'Aleena   &   Jithin',
            language: 'en',
            x: 40, y: 240, width: 480,
            fontFamily: 'Great Vibes', fontSize: 44, fontWeight: '400',
            fontStyle: 'normal', fontColor: '#FFFFFF',
            textAlign: 'center', lineHeight: 1.4, letterSpacing: 1,
            locked: false, visible: true,
          },
        ],
      },
    ];

    return {
      pages: butterflyPages,
      activePageId: 'page-bf-1',
      documentName: 'Aleena & Jithin Butterfly Luxury Invitation',
      toastMessage: 'Loaded Pinterest Butterfly Luxury Invitation Template!',
    };
  }),

  pages: INITIAL_PAGES,
  activePageId: 'page-1',
  selected: null,
  clipboard: null,
  toastMessage: null,

  // ─── UI & Grid ───────────────────────────────────────────────────────────────
  zoom: 0.9,
  showGrid: false,
  activeTool: 'select',
  activePanel: 'pages',

  history: [{ pages: JSON.parse(JSON.stringify(INITIAL_PAGES)) }],
  historyIndex: 0,

  // Phase 8 Freehand & Custom Shape Cut Drawing Initializers
  drawDieCutTool: 'freehand',
  drawDieCutOperation: 'cut',
  drawSmoothingLevel: 'medium',
  drawForceClose: true,
  drawBridgeCount: 2,
  drawBridgeWidthMm: 1.0,
  drawScoreFold: 'none',
  setDrawDieCutTool: (tool) => set({ drawDieCutTool: tool }),
  setDrawDieCutOperation: (op) => set({ drawDieCutOperation: op }),
  setDrawSmoothingLevel: (level) => set({ drawSmoothingLevel: level }),
  setDrawForceClose: (close) => set({ drawForceClose: close }),
  setDrawBridgeCount: (count) => set({ drawBridgeCount: count }),
  setDrawBridgeWidthMm: (width) => set({ drawBridgeWidthMm: width }),
  setDrawScoreFold: (fold: 'none' | 'vertical' | 'horizontal') => set({ drawScoreFold: fold }),

  // ─── Phase 1 UI Experience State Initializers & Actions ─────────────────────
  uiMode: 'design',
  showRulers: false,
  show3DModal: false,
  favorites: [],
  recentShapes: [],

  setUiMode: (mode) => set({ uiMode: mode, showProductionLines: mode === 'production' }),
  toggleRulers: () => set(s => ({ showRulers: !s.showRulers })),
  setShow3DModal: (show) => set({ show3DModal: show }),
  toggleFavorite: (shapeId) => {
    const { favorites, showToast } = get();
    const isFav = favorites.includes(shapeId);
    const updated = isFav ? favorites.filter(id => id !== shapeId) : [...favorites, shapeId];
    set({ favorites: updated });
    localStorage.setItem('rooted_studio_favorites_v1', JSON.stringify(updated));
    showToast(isFav ? 'Removed from Favorites' : 'Added to Favorites ★');
  },
  addRecentShape: (shapeId) => {
    if (!ShapeData.getShape(shapeId)) return;
    const { recentShapes } = get();
    const filtered = recentShapes.filter(id => id !== shapeId);
    const updated = [shapeId, ...filtered].slice(0, 16);
    set({ recentShapes: updated });
    localStorage.setItem('rooted_studio_recents_v1', JSON.stringify(updated));
  },
  removeRecentShape: (shapeId) => {
    const { recentShapes, showToast } = get();
    const updated = recentShapes.filter(id => id !== shapeId);
    set({ recentShapes: updated });
    localStorage.setItem('rooted_studio_recents_v1', JSON.stringify(updated));
    showToast('Removed item from history');
  },
  clearRecentShapes: () => {
    set({ recentShapes: [] });
    localStorage.removeItem('rooted_studio_recents_v1');
    get().showToast('Cleared shape history');
  },
  fitZoomToScreen: () => set({ zoom: 0.85 }),
  fitZoomToWidth: () => set({ zoom: 1.1 }),
  setZoomPreset: (pct) => set({ zoom: Math.max(0.25, Math.min(2.0, pct / 100)) }),

  getActivePage: () => {
    const { pages, activePageId } = get();
    return pages.find(p => p.id === activePageId);
  },

  showToast: (msg: string) => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toastMessage: msg });
    toastTimer = setTimeout(() => set({ toastMessage: null }), 2500);
  },

  saveDesign: () => {
    try {
      const { pages, documentName, eventType, version, designerNotes, priceTier, publishedAt, partialCuts, materialConfig, showToast } = get();
      const payload = JSON.stringify({
        pages, documentName, eventType, version, designerNotes, priceTier, publishedAt,
        partialCuts, materialConfig,
        savedAt: new Date().toISOString()
      });
      localStorage.setItem('rooted_studio_design_v3', payload);
      // Also keep v2 key for backward compat
      localStorage.setItem('rooted_studio_design_v2', payload);
      showToast('Design saved (Ctrl+S)');
    } catch (e) {
      get().showToast('Failed to save design');
    }
  },

  loadDesign: () => {
    try {
      // Try v3 first, fallback to v2
      const raw = localStorage.getItem('rooted_studio_design_v3') || localStorage.getItem('rooted_studio_design_v2');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.pages) {
          set({
            pages: parsed.pages,
            documentName: (parsed.documentName && parsed.documentName !== 'New Invitation Design') ? parsed.documentName : 'Untitled Invitation',
            eventType: parsed.eventType || get().eventType,
            version: parsed.version || 'v1.0',
            designerNotes: parsed.designerNotes || 'Initial production draft template.',
            priceTier: parsed.priceTier || 'Premium',
            publishedAt: parsed.publishedAt || null,
            status: parsed.publishedAt ? 'PRINT_APPROVED' : get().status,
            // Restore die-cut state
            partialCuts: parsed.partialCuts || [],
            materialConfig: parsed.materialConfig || get().materialConfig,
          });
        }
      }
      const rawUploads = localStorage.getItem('rooted_studio_uploads_v3');
      if (rawUploads) {
        set({ userUploads: JSON.parse(rawUploads) });
      }
      const rawFavs = localStorage.getItem('rooted_studio_favorites_v1');
      if (rawFavs) {
        set({ favorites: JSON.parse(rawFavs) });
      }
      const rawRecents = localStorage.getItem('rooted_studio_recents_v1');
      if (rawRecents) {
        const parsed: string[] = JSON.parse(rawRecents);
        const valid = parsed.filter(id => ShapeData.getShape(id) !== undefined);
        set({ recentShapes: valid });
      }
    } catch (e) {
      console.error('Error loading design', e);
    }
  },

  publishTemplate: async (version, notes, priceTier) => {
    const publishedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    set({
      status: 'PRINT_APPROVED',
      version,
      designerNotes: notes,
      priceTier,
      publishedAt: publishedDate,
    });
    get().saveDesign();

    // ── Sync with PostgreSQL via API Gateway ─────────────────────────────────
    const { documentName, eventType, pages, partialCuts, materialConfig, templateDbId } = get();
    const result = await publishTemplateToApi({
      templateId: templateDbId,
      documentName,
      eventType,
      version,
      designerNotes: notes,
      priceTier,
      publishedAt: publishedDate,
      pages,
      partialCuts,
      materialConfig,
    });

    if (result.success && result.data) {
      set({ templateDbId: result.data.id });
      get().showToast(`Published & synced to Cloud DB (ID: ${result.data.id.slice(0, 8)}…)!`);
    } else {
      get().showToast(`Published locally (API sync offline)`);
    }
  },

  loadTemplateFromRecord: (record: any) => {
    try {
      if (!record) return;
      const state = record.canvasState || {};
      set({
        templateDbId: record.id,
        documentName: record.name || get().documentName,
        eventType: record.eventType || get().eventType,
        status: record.status === 'PUBLISHED' ? 'PRINT_APPROVED' : 'DRAFT',
        version: state.version || 'v1.0',
        designerNotes: state.designerNotes || '',
        priceTier: state.priceTier || 'Premium',
        publishedAt: state.publishedAt || null,
        pages: state.pages || get().pages,
        partialCuts: state.partialCuts || [],
        materialConfig: state.materialConfig || get().materialConfig,
        activePageId: state.pages?.[0]?.id || get().activePageId,
      });
      get().showToast(`Loaded "${record.name}" from Cloud DB`);
    } catch (e) {
      console.error('Failed to load template record:', e);
    }
  },

  // Paint-Style Shape Tool State
  selectedShapeForDrawing: null,
  setSelectedShapeForDrawing: (shape) => set({
    selectedShapeForDrawing: shape,
    activeTool: shape ? 'draw_shape' : 'select',
  }),

  // ─── Die-Cut Engine V2 State & Actions ─────────────────────────────────────
  showProductionLines: false,
  selectedEdgeSide: 'top',
  selectedPartialCutId: null,
  materialConfig: {
    gsm: 300,
    paperType: 'Premium Cardstock',
    bleedMm: 3.0,
    safeAreaMm: 5.0,
    minCutWidthMm: 1.0,
    minBridgeWidthMm: 0.8,
    minGapMm: 0.8,
  },
  partialCuts: [],
  validationWarnings: [],

  setSelectedEdgeSide: (side) => set({ selectedEdgeSide: side }),
  setSelectedPartialCutId: (id) => set({ selectedPartialCutId: id }),

  setEdgeSide: (side, shapeId) => {
    const s = get();
    const activePage = s.getActivePage();
    if (!activePage) return;
    const currentFour = activePage.cardShape.fourSides || {
      topEdge: 'straight_edge',
      rightEdge: 'straight_edge',
      bottomEdge: 'straight_edge',
      leftEdge: 'straight_edge',
      topLeftCorner: 'square',
      topRightCorner: 'square',
      bottomLeftCorner: 'square',
      bottomRightCorner: 'square',
      params: { waveAmplitude: 2, waveFrequency: 8, scallopRadius: 5, notchDepth: 5, cornerRadius: 10 },
    };

    const updatedFour: FourSideEdgeConfig = {
      ...currentFour,
      [side === 'top' ? 'topEdge' : side === 'right' ? 'rightEdge' : side === 'bottom' ? 'bottomEdge' : 'leftEdge']: shapeId,
    };

    set({
      pages: s.pages.map(p => p.id === activePage.id ? { ...p, cardShape: { ...p.cardShape, fourSides: updatedFour } } : p),
    });
    s.pushHistory();
    s.runProductionValidation();
    s.showToast(`Set ${side.toUpperCase()} edge to ${shapeId}`);
  },

  setCornerSide: (corner, shapeId) => {
    const s = get();
    const activePage = s.getActivePage();
    if (!activePage) return;
    const currentFour = activePage.cardShape.fourSides || {
      topEdge: 'straight_edge',
      rightEdge: 'straight_edge',
      bottomEdge: 'straight_edge',
      leftEdge: 'straight_edge',
      topLeftCorner: 'square',
      topRightCorner: 'square',
      bottomLeftCorner: 'square',
      bottomRightCorner: 'square',
      params: { waveAmplitude: 2, waveFrequency: 8, scallopRadius: 5, notchDepth: 5, cornerRadius: 10 },
    };

    const updatedFour: FourSideEdgeConfig = {
      ...currentFour,
      [corner]: shapeId,
    };

    set({
      pages: s.pages.map(p => p.id === activePage.id ? { ...p, cardShape: { ...p.cardShape, fourSides: updatedFour } } : p),
    });
    s.pushHistory();
    s.runProductionValidation();
    s.showToast(`Set ${corner} corner to ${shapeId}`);
  },

  setApplyAllEdges: (shapeId) => {
    const s = get();
    const activePage = s.getActivePage();
    if (!activePage) return;
    const currentFour = activePage.cardShape.fourSides || {
      topEdge: shapeId, rightEdge: shapeId, bottomEdge: shapeId, leftEdge: shapeId,
      topLeftCorner: 'square', topRightCorner: 'square', bottomLeftCorner: 'square', bottomRightCorner: 'square',
      params: { waveAmplitude: 2, waveFrequency: 8, scallopRadius: 5, notchDepth: 5, cornerRadius: 10 },
    };

    const updatedFour: FourSideEdgeConfig = {
      ...currentFour,
      topEdge: shapeId,
      rightEdge: shapeId,
      bottomEdge: shapeId,
      leftEdge: shapeId,
    };

    set({
      pages: s.pages.map(p => p.id === activePage.id ? { ...p, cardShape: { ...p.cardShape, fourSides: updatedFour } } : p),
    });
    s.pushHistory();
    s.runProductionValidation();
    s.showToast(`Applied ${shapeId} to ALL 4 card edges!`);
  },

  setMirrorEdges: () => {
    const s = get();
    const activePage = s.getActivePage();
    if (!activePage) return;
    const currentFour = activePage.cardShape.fourSides;
    if (!currentFour) return;

    const updatedFour: FourSideEdgeConfig = {
      ...currentFour,
      bottomEdge: currentFour.topEdge,
      leftEdge: currentFour.rightEdge,
    };

    set({
      pages: s.pages.map(p => p.id === activePage.id ? { ...p, cardShape: { ...p.cardShape, fourSides: updatedFour } } : p),
    });
    s.pushHistory();
    s.runProductionValidation();
    s.showToast('Mirrored opposite card edges (Top=Bottom, Left=Right)');
  },

  resetEdges: () => {
    const s = get();
    const activePage = s.getActivePage();
    if (!activePage) return;

    const defaultFour: FourSideEdgeConfig = {
      topEdge: 'straight_edge',
      rightEdge: 'straight_edge',
      bottomEdge: 'straight_edge',
      leftEdge: 'straight_edge',
      topLeftCorner: 'square',
      topRightCorner: 'square',
      bottomLeftCorner: 'square',
      bottomRightCorner: 'square',
      params: { waveAmplitude: 2, waveFrequency: 8, scallopRadius: 5, notchDepth: 5, cornerRadius: 10 },
    };

    set({
      pages: s.pages.map(p =>
        p.id === activePage.id
          ? {
              ...p,
              cardShape: {
                ...p.cardShape,
                shapeId: 'rectangle',
                cornerRadius: 0,
                fourSides: defaultFour,
                cutOuts: [],
              },
            }
          : p
      ),
    });
    s.pushHistory();
    s.runProductionValidation();
    s.showToast('Reset card boundary to straight flat rectangle');
  },

  setMaterialGsm: (gsm) => {
    set(state => ({
      materialConfig: { ...state.materialConfig, gsm },
    }));
    get().runProductionValidation();
  },

  setBleedMm: (mm) => {
    set(state => ({
      materialConfig: { ...state.materialConfig, bleedMm: mm },
    }));
  },

  setSafeAreaMm: (mm) => {
    set(state => ({
      materialConfig: { ...state.materialConfig, safeAreaMm: mm },
    }));
  },

  addPartialCutObject: (obj) => {
    // Store original initial width and height for vector scaling
    const withOriginals = {
      ...obj,
      originalWidth: obj.originalWidth || obj.width,
      originalHeight: obj.originalHeight || obj.height,
    };
    set(state => ({
      partialCuts: [...state.partialCuts, withOriginals],
    }));
    get().pushHistory();
    get().runProductionValidation();
  },

  updatePartialCutObject: (id, updates) => {
    set(state => ({
      partialCuts: state.partialCuts.map(pc => {
        if (pc.id !== id) return pc;
        const newW = updates.width !== undefined ? updates.width : pc.width;
        const newH = updates.height !== undefined ? updates.height : pc.height;
        const sizeChanged = (updates.width !== undefined && updates.width !== pc.width) ||
                            (updates.height !== undefined && updates.height !== pc.height);

        let extraUpdates: Partial<PartialCutObject> = {};

        if (sizeChanged && pc.shapeId) {
          const shapeDef = PARTIAL_CUT_SHAPES.find(p => p.id === pc.shapeId);
          if (shapeDef) {
            const bridgePoints = pc.bridges?.bridgePoints ?? [
              { positionPct: 20, widthMm: pc.bridges?.widthMm || 1.0 },
              { positionPct: 80, widthMm: pc.bridges?.widthMm || 1.0 }
            ];
            const { cutPathD, scoreLines } = shapeDef.buildCutPath(newW, newH, bridgePoints);
            extraUpdates = { svgPathD: cutPathD, scoreLines };
          }
        }

        return { ...pc, ...updates, ...extraUpdates };
      }),
    }));
    get().runProductionValidation();
  },

  removePartialCutObject: (id) => {
    set(state => ({
      partialCuts: state.partialCuts.filter(pc => pc.id !== id),
    }));
    get().pushHistory();
    get().runProductionValidation();
  },

  toggleProductionView: () => {
    set(state => ({ showProductionLines: !state.showProductionLines }));
  },

  runProductionValidation: () => {
    const s = get();
    const warnings: ValidationWarning[] = [];

    // Check partial cut bridge widths
    s.partialCuts.forEach(pc => {
      if (pc.cutType === 'partial_cut' && pc.bridges.widthMm < 0.8) {
        warnings.push({
          id: `warn-bridge-${pc.id}`,
          severity: 'warning',
          category: 'bridge',
          message: `⚠ ${pc.name} attachment bridge (${pc.bridges.widthMm}mm) is thin for ${s.materialConfig.gsm} GSM paper. Recommend ≥0.8mm.`,
        });
      }
      if (pc.cutType === 'partial_cut' && pc.bridges.count === 0) {
        warnings.push({
          id: `err-bridge-${pc.id}`,
          severity: 'error',
          category: 'bridge',
          message: `❌ ${pc.name} has 0 attachment bridges and will fall out of card!`,
        });
      }
    });

    set({ validationWarnings: warnings });
  },

  // ─── Phase 3 Pencil & Upload Actions ─────────────────────────────────────────
  setPencilStrokeColor: (color) => set({ pencilStrokeColor: color }),
  setPencilStrokeWidth: (width) => set({ pencilStrokeWidth: width }),

  addPencilElement: (pageId, pathD, bounds) => {
    const { pencilStrokeColor, pencilStrokeWidth, addElement } = get();
    const svgContent = `<svg viewBox="0 0 ${bounds.width} ${bounds.height}" width="100%" height="100%"><path d="${pathD}" fill="none" stroke="${pencilStrokeColor}" stroke-width="${pencilStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    addElement(pageId, {
      elementId: `pencil-${uid()}`,
      name: 'Freehand Stroke',
      category: 'custom',
      src: svgContent,
      x: bounds.x,
      y: bounds.y,
      width: Math.max(20, bounds.width),
      height: Math.max(20, bounds.height),
      rotation: 0,
      opacity: 1,
      blendMode: 'normal',
      flipH: false,
      flipV: false,
      locked: false,
      visible: true,
    });
  },

  addUpload: (assetData) => {
    const asset: UserUploadAsset = {
      ...assetData,
      id: `up-${uid()}`,
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
    set(s => {
      const nextUploads = [asset, ...s.userUploads];
      try { localStorage.setItem('rooted_studio_uploads_v3', JSON.stringify(nextUploads)); } catch (e) {}
      return { userUploads: nextUploads };
    });
    get().showToast(`Uploaded ${asset.name}`);
  },

  removeUpload: (id) => {
    set(s => {
      const nextUploads = s.userUploads.filter(u => u.id !== id);
      try { localStorage.setItem('rooted_studio_uploads_v3', JSON.stringify(nextUploads)); } catch (e) {}
      return { userUploads: nextUploads };
    });
    get().showToast('Removed uploaded asset');
  },

  // ─── Document ────────────────────────────────────────────────────────────────
  createNewDesign: () => {
    set({
      documentId: `doc-${uid()}`,
      documentName: 'Untitled Invitation Design',
      eventType: 'Wedding',
      status: 'DRAFT',
      templateDbId: null,
      version: 'v1.0',
      designerNotes: '',
      publishedAt: null,
      pages: INITIAL_PAGES,
      activePageId: 'page-1',
      partialCuts: [],
      history: [],
      historyIndex: -1,
    });
    get().showToast('✨ Created New Blank Invitation Design');
  },
  setDocumentName: (name) => set({ documentName: name }),
  setEventType: (type) => set({ eventType: type }),

  // ─── Pages ──────────────────────────────────────────────────────────────────
  setActivePage: (id) => set({ activePageId: id, selected: null }),

  reorderPages: (fromIndex, toIndex) => {
    set(s => {
      const pages = [...s.pages];
      const [moved] = pages.splice(fromIndex, 1);
      pages.splice(toIndex, 0, moved);
      const reordered = pages.map((p, i) => ({ ...p, pageNumber: i + 1 }));
      return { pages: reordered };
    });
    get().pushHistory();
  },

  updatePage: (id, updates) => {
    set(s => ({
      pages: s.pages.map(p => p.id === id ? { ...p, ...updates } : p),
    }));
  },

  rotatePage: (targetPageId, angleDelta = 90) => {
    const { activePageId, showToast } = get();
    const pid = targetPageId || activePageId;
    set(s => ({
      pages: s.pages.map(p => {
        if (p.id !== pid) return p;
        const currentRot = p.rotation || 0;
        const nextRot = (currentRot + angleDelta) % 360;
        return { ...p, rotation: nextRot };
      }),
    }));
    get().pushHistory();
    const page = get().pages.find(p => p.id === pid);
    showToast(`Rotated ${page?.label || 'page'} to ${page?.rotation || 0}°`);
  },

  // ─── Layer 1: Background & Shape ────────────────────────────────────────────
  setBackground: (pageId, bg) => {
    set(s => ({
      pages: s.pages.map(p =>
        p.id === pageId ? { ...p, background: { ...p.background, ...bg } } : p
      ),
    }));
    get().pushHistory();
  },

  setCardShape: (pageId, shape) => {
    set(s => ({
      pages: s.pages.map(p =>
        p.id === pageId ? { ...p, cardShape: { ...p.cardShape, ...shape } } : p
      ),
    }));
    get().pushHistory();
  },

  applyPencilAsCardShape: (pageId, elementId) => {
    const s = get();
    const page = s.pages.find(p => p.id === pageId);
    if (!page) return;
    const el = page.elements.find(e => e.id === elementId);
    if (!el) return;

    let pathD = '';
    const match = el.src.match(/d="([^"]+)"/i);
    if (match && match[1]) {
      pathD = match[1];
    } else {
      pathD = `M 0 0 L ${el.width} 0 L ${el.width} ${el.height} L 0 ${el.height} Z`;
    }

    const clipPathStyle = `path('${pathD}')`;

    set({
      pages: s.pages.map(p => {
        if (p.id !== pageId) return p;
        return {
          ...p,
          cardShape: {
            ...p.cardShape,
            shapeId: 'custom',
            clipPath: clipPathStyle,
          },
          elements: p.elements.filter(e => e.id !== elementId),
        };
      }),
      selected: null,
      toastMessage: '✂ Applied drawn pencil path as Card Die-Cut Outer Shape!',
    });
    get().pushHistory();
  },

  applyPencilAsCutOut: (pageId, elementId) => {
    const s = get();
    const page = s.pages.find(p => p.id === pageId);
    if (!page) return;
    const el = page.elements.find(e => e.id === elementId);
    if (!el) return;

    const newCutOut: CutOut = {
      id: `cut-${Date.now()}`,
      name: 'Pencil Cut Window',
      shape: 'rectangle',
      cutMode: 'inner_hole',
      x: el.x,
      y: el.y,
      width: el.width,
      height: el.height,
    };

    set({
      pages: s.pages.map(p => {
        if (p.id !== pageId) return p;
        return {
          ...p,
          cardShape: {
            ...p.cardShape,
            cutOuts: [...p.cardShape.cutOuts, newCutOut],
          },
          elements: p.elements.filter(e => e.id !== elementId),
        };
      }),
      selected: null,
      toastMessage: '⭕ Applied drawn pencil bounds as Card CutOut Window Hole!',
    });
    get().pushHistory();
  },

  addCutOut: (pageId, cutOut) => {
    set(s => ({
      pages: s.pages.map(p =>
        p.id === pageId
          ? { ...p, cardShape: { ...p.cardShape, cutOuts: [...p.cardShape.cutOuts, cutOut] } }
          : p
      ),
    }));
    get().pushHistory();
  },

  updateCutOut: (pageId, cutOutId, updates) => {
    set(s => ({
      pages: s.pages.map(p =>
        p.id === pageId
          ? {
              ...p,
              cardShape: {
                ...p.cardShape,
                cutOuts: p.cardShape.cutOuts.map(c => c.id === cutOutId ? { ...c, ...updates } : c),
              },
            }
          : p
      ),
    }));
    get().pushHistory();
  },

  setCutOutMode: (pageId, cutOutId, mode) => {
    set(s => ({
      pages: s.pages.map(p =>
        p.id === pageId
          ? {
              ...p,
              cardShape: {
                ...p.cardShape,
                cutOuts: p.cardShape.cutOuts.map(c => c.id === cutOutId ? { ...c, cutMode: mode } : c),
              },
            }
          : p
      ),
    }));
    get().showToast(`Cut mode set to: ${mode === 'inner_hole' ? 'Remove Inside (Window Hole)' : mode === 'outer_shape' ? 'Cut Outer Edge' : '3D Pop-Up Lift Cut'}`);
    get().pushHistory();
  },

  removeCutOut: (pageId, cutOutId) => {
    set(s => ({
      pages: s.pages.map(p =>
        p.id === pageId
          ? { ...p, cardShape: { ...p.cardShape, cutOuts: p.cardShape.cutOuts.filter(c => c.id !== cutOutId) } }
          : p
      ),
    }));
    get().pushHistory();
  },

  // ─── Layer 2: Elements ───────────────────────────────────────────────────────
  addElement: (pageId, elementData) => {
    const element: DesignElement = { ...elementData, id: `el-${uid()}` };
    set(s => ({
      pages: s.pages.map(p =>
        p.id === pageId ? { ...p, elements: [...p.elements, element] } : p
      ),
      selected: { layer: 'element', id: element.id },
    }));
    get().pushHistory();
  },

  updateElement: (pageId, elementId, updates) => {
    set(s => ({
      pages: s.pages.map(p =>
        p.id === pageId
          ? { ...p, elements: p.elements.map(e => e.id === elementId ? { ...e, ...updates } : e) }
          : p
      ),
    }));
  },

  deleteElement: (pageId, elementId) => {
    set(s => ({
      pages: s.pages.map(p =>
        p.id === pageId
          ? { ...p, elements: p.elements.filter(e => e.id !== elementId) }
          : p
      ),
      selected: s.selected?.id === elementId ? null : s.selected,
    }));
    get().pushHistory();
  },

  reorderElements: (pageId, fromIndex, toIndex) => {
    set(s => ({
      pages: s.pages.map(p => {
        if (p.id !== pageId) return p;
        const els = [...p.elements];
        const [moved] = els.splice(fromIndex, 1);
        els.splice(toIndex, 0, moved);
        return { ...p, elements: els };
      }),
    }));
    get().pushHistory();
  },

  // ─── Layer 3: Text Blocks ────────────────────────────────────────────────────
  addTextBlock: (pageId, blockData) => {
    const block: TextBlock = { ...blockData, id: `tb-${uid()}` };
    set(s => ({
      pages: s.pages.map(p =>
        p.id === pageId ? { ...p, textBlocks: [...p.textBlocks, block] } : p
      ),
      selected: { layer: 'textblock', id: block.id },
    }));
    get().pushHistory();
  },

  updateTextBlock: (pageId, blockId, updates) => {
    set(s => ({
      pages: s.pages.map(p =>
        p.id === pageId
          ? { ...p, textBlocks: p.textBlocks.map(b => b.id === blockId ? { ...b, ...updates } : b) }
          : p
      ),
    }));
  },

  deleteTextBlock: (pageId, blockId) => {
    set(s => ({
      pages: s.pages.map(p =>
        p.id === pageId
          ? { ...p, textBlocks: p.textBlocks.filter(b => b.id !== blockId) }
          : p
      ),
      selected: s.selected?.id === blockId ? null : s.selected,
    }));
    get().pushHistory();
  },

  // ─── Selection & Shortcuts ───────────────────────────────────────────────────
  setSelected: (item) => set({ selected: item }),

  copySelected: () => {
    const { selected, getActivePage, showToast } = get();
    const page = getActivePage();
    if (!selected || !page) return;

    if (selected.layer === 'element') {
      const el = page.elements.find(e => e.id === selected.id);
      if (el) {
        set({ clipboard: { layer: 'element', data: JSON.parse(JSON.stringify(el)) } });
        showToast('Copied element to clipboard (Ctrl+C)');
      }
    } else if (selected.layer === 'textblock') {
      const tb = page.textBlocks.find(b => b.id === selected.id);
      if (tb) {
        set({ clipboard: { layer: 'textblock', data: JSON.parse(JSON.stringify(tb)) } });
        showToast('Copied text block to clipboard (Ctrl+C)');
      }
    }
  },

  cutSelected: () => {
    const { selected, activePageId, deleteElement, deleteTextBlock, copySelected, showToast } = get();
    if (!selected) return;
    copySelected();
    if (selected.layer === 'element') {
      deleteElement(activePageId, selected.id);
    } else if (selected.layer === 'textblock') {
      deleteTextBlock(activePageId, selected.id);
    }
    showToast('Cut selected item (Ctrl+X)');
  },

  pasteClipboard: () => {
    const { clipboard, activePageId, addElement, addTextBlock, showToast } = get();
    if (!clipboard) return;

    if (clipboard.layer === 'element') {
      const elData = clipboard.data as DesignElement;
      const { id, ...rest } = elData;
      addElement(activePageId, {
        ...rest,
        name: `${rest.name} (Copy)`,
        x: rest.x + 20,
        y: rest.y + 20,
      });
      showToast('Pasted element (Ctrl+V)');
    } else if (clipboard.layer === 'textblock') {
      const tbData = clipboard.data as TextBlock;
      const { id, ...rest } = tbData;
      addTextBlock(activePageId, {
        ...rest,
        name: `${rest.name} (Copy)`,
        x: rest.x + 20,
        y: rest.y + 20,
      });
      showToast('Pasted text block (Ctrl+V)');
    }
  },

  duplicateSelected: () => {
    const { selected, getActivePage, activePageId, addElement, addTextBlock, showToast } = get();
    const page = getActivePage();
    if (!selected || !page) return;

    if (selected.layer === 'element') {
      const el = page.elements.find(e => e.id === selected.id);
      if (el) {
        const { id, ...rest } = el;
        addElement(activePageId, {
          ...rest,
          name: `${rest.name} (Copy)`,
          x: rest.x + 20,
          y: rest.y + 20,
        });
        showToast('Duplicated element (Ctrl+D)');
      }
    } else if (selected.layer === 'textblock') {
      const tb = page.textBlocks.find(b => b.id === selected.id);
      if (tb) {
        const { id, ...rest } = tb;
        addTextBlock(activePageId, {
          ...rest,
          name: `${rest.name} (Copy)`,
          x: rest.x + 20,
          y: rest.y + 20,
        });
        showToast('Duplicated text block (Ctrl+D)');
      }
    }
  },

  nudgeSelected: (dx: number, dy: number) => {
    const { selected, activePageId, getActivePage, updateElement, updateTextBlock } = get();
    const page = getActivePage();
    if (!selected || !page) return;

    if (selected.layer === 'element') {
      const el = page.elements.find(e => e.id === selected.id);
      if (el) updateElement(activePageId, el.id, { x: el.x + dx, y: el.y + dy });
    } else if (selected.layer === 'textblock') {
      const tb = page.textBlocks.find(b => b.id === selected.id);
      if (tb) updateTextBlock(activePageId, tb.id, { x: tb.x + dx, y: tb.y + dy });
    }
  },

  rotateSelected: (angleDelta = 90) => {
    const { selected, activePageId, getActivePage, updateElement, showToast } = get();
    const page = getActivePage();
    if (!selected || !page) return;

    if (selected.layer === 'element') {
      const el = page.elements.find(e => e.id === selected.id);
      if (el) {
        const nextRot = (el.rotation + angleDelta) % 360;
        updateElement(activePageId, el.id, { rotation: nextRot });
        showToast(`Rotated element to ${nextRot}°`);
      }
    }
  },

  flipSelectedH: () => {
    const { selected, activePageId, getActivePage, updateElement, showToast } = get();
    const page = getActivePage();
    if (!selected || selected.layer !== 'element' || !page) return;
    const el = page.elements.find(e => e.id === selected.id);
    if (el) {
      updateElement(activePageId, el.id, { flipH: !el.flipH });
      showToast('Flipped horizontally (Shift+H)');
    }
  },

  flipSelectedV: () => {
    const { selected, activePageId, getActivePage, updateElement, showToast } = get();
    const page = getActivePage();
    if (!selected || selected.layer !== 'element' || !page) return;
    const el = page.elements.find(e => e.id === selected.id);
    if (el) {
      updateElement(activePageId, el.id, { flipV: !el.flipV });
      showToast('Flipped vertically (Shift+V)');
    }
  },

  toggleLockSelected: () => {
    const { selected, activePageId, getActivePage, updateElement, updateTextBlock, showToast } = get();
    const page = getActivePage();
    if (!selected || !page) return;

    if (selected.layer === 'element') {
      const el = page.elements.find(e => e.id === selected.id);
      if (el) {
        updateElement(activePageId, el.id, { locked: !el.locked });
        showToast(el.locked ? 'Unlocked element (Ctrl+L)' : 'Locked element (Ctrl+L)');
      }
    } else if (selected.layer === 'textblock') {
      const tb = page.textBlocks.find(b => b.id === selected.id);
      if (tb) {
        updateTextBlock(activePageId, tb.id, { locked: !tb.locked });
        showToast(tb.locked ? 'Unlocked text block (Ctrl+L)' : 'Locked text block (Ctrl+L)');
      }
    }
  },

  toggleVisibilitySelected: () => {
    const { selected, activePageId, getActivePage, updateElement, updateTextBlock, showToast } = get();
    const page = getActivePage();
    if (!selected || !page) return;

    if (selected.layer === 'element') {
      const el = page.elements.find(e => e.id === selected.id);
      if (el) {
        updateElement(activePageId, el.id, { visible: !el.visible });
        showToast(el.visible ? 'Hidden element (Ctrl+H)' : 'Shown element (Ctrl+H)');
      }
    } else if (selected.layer === 'textblock') {
      const tb = page.textBlocks.find(b => b.id === selected.id);
      if (tb) {
        updateTextBlock(activePageId, tb.id, { visible: !tb.visible });
        showToast(tb.visible ? 'Hidden text block (Ctrl+H)' : 'Shown text block (Ctrl+H)');
      }
    }
  },

  bringForward: () => {
    const { selected, activePageId, getActivePage, reorderElements, showToast } = get();
    const page = getActivePage();
    if (!selected || selected.layer !== 'element' || !page) return;
    const index = page.elements.findIndex(e => e.id === selected.id);
    if (index >= 0 && index < page.elements.length - 1) {
      reorderElements(activePageId, index, index + 1);
      showToast('Brought element forward (Ctrl+]');
    }
  },

  sendBackward: () => {
    const { selected, activePageId, getActivePage, reorderElements, showToast } = get();
    const page = getActivePage();
    if (!selected || selected.layer !== 'element' || !page) return;
    const index = page.elements.findIndex(e => e.id === selected.id);
    if (index > 0) {
      reorderElements(activePageId, index, index - 1);
      showToast('Sent element backward (Ctrl+[');
    }
  },

  bringToFront: () => {
    const { selected, activePageId, getActivePage, reorderElements, showToast } = get();
    const page = getActivePage();
    if (!selected || selected.layer !== 'element' || !page) return;
    const index = page.elements.findIndex(e => e.id === selected.id);
    if (index >= 0 && index < page.elements.length - 1) {
      reorderElements(activePageId, index, page.elements.length - 1);
      showToast('Brought element to front (Ctrl+Shift+]');
    }
  },

  sendToBack: () => {
    const { selected, activePageId, getActivePage, reorderElements, showToast } = get();
    const page = getActivePage();
    if (!selected || selected.layer !== 'element' || !page) return;
    const index = page.elements.findIndex(e => e.id === selected.id);
    if (index > 0) {
      reorderElements(activePageId, index, 0);
      showToast('Sent element to back (Ctrl+Shift+[');
    }
  },

  alignSelected: (alignment) => {
    const { selected, activePageId, getActivePage, updateElement, updateTextBlock, showToast } = get();
    const page = getActivePage();
    if (!selected || !page) return;
    const CARD_W = 561;
    const CARD_H = 794;

    if (selected.layer === 'element') {
      const el = page.elements.find(e => e.id === selected.id);
      if (!el) return;
      let newX = el.x;
      let newY = el.y;
      if (alignment === 'left') newX = 20;
      if (alignment === 'center') newX = (CARD_W - el.width) / 2;
      if (alignment === 'right') newX = CARD_W - el.width - 20;
      if (alignment === 'top') newY = 20;
      if (alignment === 'middle') newY = (CARD_H - el.height) / 2;
      if (alignment === 'bottom') newY = CARD_H - el.height - 20;
      updateElement(activePageId, el.id, { x: newX, y: newY });
      showToast(`Aligned ${alignment}`);
    } else if (selected.layer === 'textblock') {
      const tb = page.textBlocks.find(b => b.id === selected.id);
      if (!tb) return;
      let newX = tb.x;
      let newY = tb.y;
      if (alignment === 'left') newX = 20;
      if (alignment === 'center') newX = (CARD_W - tb.width) / 2;
      if (alignment === 'right') newX = CARD_W - tb.width - 20;
      if (alignment === 'top') newY = 20;
      if (alignment === 'middle') newY = 150;
      if (alignment === 'bottom') newY = CARD_H - 100;
      updateTextBlock(activePageId, tb.id, { x: newX, y: newY });
      showToast(`Aligned ${alignment}`);
    }
  },

  // ─── UI & Grid ───────────────────────────────────────────────────────────────
  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(4, zoom)) }),
  toggleGrid: () => set(s => {
    const next = !s.showGrid;
    s.showToast(next ? 'Grid overlay enabled (G)' : 'Grid overlay disabled (G)');
    return { showGrid: next };
  }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setActivePanel: (panel) => set({ activePanel: panel }),

  // ─── History ─────────────────────────────────────────────────────────────────
  pushHistory: () => {
    const { pages, history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ pages: JSON.parse(JSON.stringify(pages)) });
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  undo: () => {
    const { historyIndex, history, showToast } = get();
    if (historyIndex <= 0) return;
    const prev = history[historyIndex - 1];
    set({ pages: prev.pages, historyIndex: historyIndex - 1, selected: null });
    showToast('Undo (Ctrl+Z)');
  },

  redo: () => {
    const { historyIndex, history, showToast } = get();
    if (historyIndex >= history.length - 1) return;
    const next = history[historyIndex + 1];
    set({ pages: next.pages, historyIndex: historyIndex + 1, selected: null });
    showToast('Redo (Ctrl+Y)');
  },
}));
