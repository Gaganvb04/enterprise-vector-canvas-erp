import type { InvitationPage, CardShape } from '../store/studioStore';
import type { PartialCutObject } from '../types/diecut';

export type TemplateCategory =
  | 'Wedding'
  | 'Engagement'
  | 'Reception'
  | 'Birthday'
  | 'Baby Shower'
  | 'Housewarming'
  | 'Anniversary'
  | 'Naming Ceremony'
  | 'Traditional'
  | 'Minimal'
  | 'Luxury'
  | 'Floral'
  | 'Indian Traditional';

export interface StarterTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  style: string;
  description: string;
  pageCount: number;
  bgTexture: string;
  primaryColor: string;
  accentColor: string;
  fontPairing: string;
  previewSvg: string;
  pages: InvitationPage[];
  cardShape: CardShape;
  partialCuts?: PartialCutObject[];
}

export const STARTER_TEMPLATES: StarterTemplate[] = [
  // 1. ROYAL FLORAL WEDDING
  {
    id: 'tmpl-royal-floral',
    name: 'Royal Floral Wedding',
    category: 'Wedding',
    style: 'Luxury Floral',
    description: 'Ornate Mughal floral arch invitation with gold foil borders and dual page layout.',
    pageCount: 2,
    bgTexture: '#FAF5EF',
    primaryColor: '#7B1E1E',
    accentColor: '#C9956C',
    fontPairing: 'Playfair Display + Cormorant',
    previewSvg: `<svg viewBox="0 0 300 420" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="420" rx="16" fill="#FAF5EF" stroke="#C9956C" stroke-width="3"/>
      <path d="M 50,0 Q 150,80 250,0" fill="none" stroke="#C9956C" stroke-width="2.5"/>
      <text x="150" y="80" text-anchor="middle" fill="#7B1E1E" font-family="serif" font-size="14" font-weight="bold">॥ श्री गणेशाय नमः ॥</text>
      <text x="150" y="140" text-anchor="middle" fill="#7B1E1E" font-family="serif" font-size="28" font-weight="bold">Priya</text>
      <text x="150" y="175" text-anchor="middle" fill="#C9956C" font-family="serif" font-size="20">&amp;</text>
      <text x="150" y="210" text-anchor="middle" fill="#7B1E1E" font-family="serif" font-size="28" font-weight="bold">Rahul</text>
      <line x1="80" y1="240" x2="220" y2="240" stroke="#C9956C" stroke-width="1.5"/>
      <text x="150" y="270" text-anchor="middle" fill="#5C5248" font-size="11" font-weight="600">24 OCTOBER 2026</text>
      <text x="150" y="300" text-anchor="middle" fill="#8C8073" font-size="10">Sri Convention Hall, Bengaluru</text>
    </svg>`,
    cardShape: {
      shapeId: 'arch_top',
      archHeight: 180,
      cornerRadius: 16,
      cutOuts: [],
      fourSides: {
        topEdge: 'lib-5',
        rightEdge: 'straight',
        bottomEdge: 'straight',
        leftEdge: 'straight',
        topLeftCorner: 'straight',
        topRightCorner: 'straight',
        bottomLeftCorner: 'straight',
        bottomRightCorner: 'straight',
        params: {},
      },
    },
    pages: [
      {
        id: 'p-rfw-1',
        pageNumber: 1,
        pageType: 'front_cover',
        label: 'Front Cover (Invocation)',
        cardShape: {
          shapeId: 'arch_top',
          archHeight: 180,
          cornerRadius: 16,
          cutOuts: [],
        },
        background: { type: 'color', color: '#FAF5EF' },
        elements: [],
        textBlocks: [
          {
            id: 'tb-invocation',
            blockType: 'invocation',
            name: 'Deity Blessing',
            content: '{{blessing_deity}}',
            language: 'hi',
            x: 50, y: 70, width: 461,
            fontFamily: 'Playfair Display', fontSize: 18, fontWeight: '700', fontStyle: 'normal',
            fontColor: '#7B1E1E', textAlign: 'center', lineHeight: 1.4, letterSpacing: 1,
            locked: false, visible: true, variableKey: 'blessing_deity', isCustomizable: true, editableByCustomer: true,
          },
          {
            id: 'tb-invitation-title',
            blockType: 'free',
            name: 'Invitation Request',
            content: 'Together with their families\nrequest the honor of your presence at the wedding of',
            language: 'en',
            x: 40, y: 140, width: 481,
            fontFamily: 'Cormorant Garamond', fontSize: 16, fontWeight: '500', fontStyle: 'italic',
            fontColor: '#5C5248', textAlign: 'center', lineHeight: 1.5, letterSpacing: 0,
            locked: false, visible: true, isCustomizable: false, editableByCustomer: false,
          },
          {
            id: 'tb-bride',
            blockType: 'couple_names',
            name: 'Bride Name',
            content: '{{bride_name}}',
            language: 'en',
            x: 30, y: 230, width: 501,
            fontFamily: 'Playfair Display', fontSize: 44, fontWeight: '700', fontStyle: 'normal',
            fontColor: '#7B1E1E', textAlign: 'center', lineHeight: 1.2, letterSpacing: 1,
            locked: false, visible: true, variableKey: 'bride_name', isCustomizable: true, editableByCustomer: true,
          },
          {
            id: 'tb-ampersand',
            blockType: 'free',
            name: 'Ampersand',
            content: '&',
            language: 'en',
            x: 200, y: 295, width: 161,
            fontFamily: 'Great Vibes', fontSize: 36, fontWeight: '400', fontStyle: 'normal',
            fontColor: '#C9956C', textAlign: 'center', lineHeight: 1, letterSpacing: 0,
            locked: false, visible: true, isCustomizable: false, editableByCustomer: false,
          },
          {
            id: 'tb-groom',
            blockType: 'couple_names',
            name: 'Groom Name',
            content: '{{groom_name}}',
            language: 'en',
            x: 30, y: 350, width: 501,
            fontFamily: 'Playfair Display', fontSize: 44, fontWeight: '700', fontStyle: 'normal',
            fontColor: '#7B1E1E', textAlign: 'center', lineHeight: 1.2, letterSpacing: 1,
            locked: false, visible: true, variableKey: 'groom_name', isCustomizable: true, editableByCustomer: true,
          },
          {
            id: 'tb-date',
            blockType: 'event_details',
            name: 'Wedding Date',
            content: '{{wedding_date}} • {{wedding_time}}',
            language: 'en',
            x: 50, y: 460, width: 461,
            fontFamily: 'Montserrat', fontSize: 16, fontWeight: '600', fontStyle: 'normal',
            fontColor: '#161412', textAlign: 'center', lineHeight: 1.5, letterSpacing: 2,
            locked: false, visible: true, variableKey: 'wedding_date', isCustomizable: true, editableByCustomer: true,
          },
          {
            id: 'tb-venue',
            blockType: 'venue',
            name: 'Venue Name',
            content: '{{venue_name}}\n{{venue_address}}',
            language: 'en',
            x: 50, y: 530, width: 461,
            fontFamily: 'Cormorant Garamond', fontSize: 18, fontWeight: '600', fontStyle: 'normal',
            fontColor: '#5C5248', textAlign: 'center', lineHeight: 1.5, letterSpacing: 0,
            locked: false, visible: true, variableKey: 'venue_name', isCustomizable: true, editableByCustomer: true,
          },
          {
            id: 'tb-rsvp',
            blockType: 'timing',
            name: 'RSVP Contact',
            content: 'RSVP: {{rsvp_phone}}',
            language: 'en',
            x: 60, y: 640, width: 441,
            fontFamily: 'Montserrat', fontSize: 12, fontWeight: '500', fontStyle: 'normal',
            fontColor: '#8C8073', textAlign: 'center', lineHeight: 1.4, letterSpacing: 1,
            locked: false, visible: true, variableKey: 'rsvp_phone', isCustomizable: true, editableByCustomer: true,
          },
        ],
      },
      {
        id: 'p-rfw-2',
        pageNumber: 2,
        pageType: 'english_inner',
        label: 'Reception & Family Details',
        cardShape: {
          shapeId: 'rectangle',
          cornerRadius: 0,
          cutOuts: [],
        },
        background: { type: 'color', color: '#FAF5EF' },
        elements: [],
        textBlocks: [
          {
            id: 'tb-p2-header',
            blockType: 'free',
            name: 'Family Blessing Header',
            content: 'RECEPTION & BLESSINGS',
            language: 'en',
            x: 50, y: 100, width: 461,
            fontFamily: 'Playfair Display', fontSize: 22, fontWeight: '700', fontStyle: 'normal',
            fontColor: '#7B1E1E', textAlign: 'center', lineHeight: 1.4, letterSpacing: 2,
            locked: false, visible: true, isCustomizable: false, editableByCustomer: false,
          },
          {
            id: 'tb-p2-host',
            blockType: 'parent_names',
            name: 'Host Family Line',
            content: 'Hosted with love by\n{{host_family}}',
            language: 'en',
            x: 50, y: 220, width: 461,
            fontFamily: 'Cormorant Garamond', fontSize: 20, fontWeight: '600', fontStyle: 'normal',
            fontColor: '#161412', textAlign: 'center', lineHeight: 1.5, letterSpacing: 0,
            locked: false, visible: true, variableKey: 'host_family', isCustomizable: true, editableByCustomer: true,
          },
        ],
      },
    ],
  },

  // 2. LUXURY GOLD ARCH ENGAGEMENT
  {
    id: 'tmpl-luxury-gold',
    name: 'Royal Gold Arch Engagement',
    category: 'Engagement',
    style: 'Luxury Gold Foil',
    description: 'Deep crimson background with golden arch embellishment and regal calligraphy.',
    pageCount: 1,
    bgTexture: '#2A080C',
    primaryColor: '#D4AF37',
    accentColor: '#E5D7C5',
    fontPairing: 'Cinzel + Playfair',
    previewSvg: `<svg viewBox="0 0 300 420" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="420" rx="16" fill="#2A080C" stroke="#D4AF37" stroke-width="3"/>
      <path d="M 40,30 A 110,110 0 0,1 260,30 L 260,390 L 40,390 Z" fill="none" stroke="#D4AF37" stroke-width="1.5" stroke-dasharray="4,2"/>
      <text x="150" y="110" text-anchor="middle" fill="#D4AF37" font-family="serif" font-size="12" letter-spacing="3">ENGAGEMENT CEREMONY</text>
      <text x="150" y="170" text-anchor="middle" fill="#E5D7C5" font-family="serif" font-size="26" font-weight="bold">Priya &amp; Rahul</text>
      <text x="150" y="240" text-anchor="middle" fill="#D4AF37" font-size="12">24 OCT 2026 • 7:30 PM</text>
      <text x="150" y="290" text-anchor="middle" fill="#A89F91" font-size="10">Grand Palace, Bengaluru</text>
    </svg>`,
    cardShape: {
      shapeId: 'scalloped',
      cornerRadius: 20,
      cutOuts: [],
      fourSides: {
        topEdge: 'lib-12',
        rightEdge: 'straight',
        bottomEdge: 'lib-12',
        leftEdge: 'straight',
        topLeftCorner: 'straight',
        topRightCorner: 'straight',
        bottomLeftCorner: 'straight',
        bottomRightCorner: 'straight',
        params: {},
      },
    },
    pages: [
      {
        id: 'p-lge-1',
        pageNumber: 1,
        pageType: 'front_cover',
        label: 'Engagement Card',
        cardShape: {
          shapeId: 'scalloped',
          cornerRadius: 20,
          cutOuts: [],
        },
        background: { type: 'color', color: '#2A080C' },
        elements: [],
        textBlocks: [
          {
            id: 'tb-eng-header',
            blockType: 'free',
            name: 'Engagement Header',
            content: 'ENGAGEMENT CEREMONY',
            language: 'en',
            x: 40, y: 100, width: 481,
            fontFamily: 'Cinzel', fontSize: 18, fontWeight: '700', fontStyle: 'normal',
            fontColor: '#D4AF37', textAlign: 'center', lineHeight: 1.4, letterSpacing: 4,
            locked: false, visible: true, isCustomizable: false, editableByCustomer: false,
          },
          {
            id: 'tb-eng-couple',
            blockType: 'couple_names',
            name: 'Couple Names',
            content: '{{bride_name}} & {{groom_name}}',
            language: 'en',
            x: 30, y: 220, width: 501,
            fontFamily: 'Playfair Display', fontSize: 40, fontWeight: '700', fontStyle: 'normal',
            fontColor: '#E5D7C5', textAlign: 'center', lineHeight: 1.3, letterSpacing: 1,
            printFinish: 'gold_foil',
            locked: false, visible: true, variableKey: 'bride_name', isCustomizable: true, editableByCustomer: true,
          },
          {
            id: 'tb-eng-date',
            blockType: 'event_details',
            name: 'Event Date',
            content: '{{wedding_date}}',
            language: 'en',
            x: 50, y: 360, width: 461,
            fontFamily: 'Cinzel', fontSize: 16, fontWeight: '600', fontStyle: 'normal',
            fontColor: '#D4AF37', textAlign: 'center', lineHeight: 1.5, letterSpacing: 2,
            locked: false, visible: true, variableKey: 'wedding_date', isCustomizable: true, editableByCustomer: true,
          },
          {
            id: 'tb-eng-venue',
            blockType: 'venue',
            name: 'Venue',
            content: '{{venue_name}}, {{venue_address}}',
            language: 'en',
            x: 50, y: 440, width: 461,
            fontFamily: 'Montserrat', fontSize: 14, fontWeight: '400', fontStyle: 'normal',
            fontColor: '#A89F91', textAlign: 'center', lineHeight: 1.5, letterSpacing: 1,
            locked: false, visible: true, variableKey: 'venue_name', isCustomizable: true, editableByCustomer: true,
          },
        ],
      },
    ],
  },

  // 3. MINIMAL BOTANICAL RECEPTION
  {
    id: 'tmpl-minimal-botanical',
    name: 'Minimal Botanical Reception',
    category: 'Minimal',
    style: 'Modern Minimalist',
    description: 'Clean ivory card with subtle sage green typography and elegant borders.',
    pageCount: 1,
    bgTexture: '#F5F7F4',
    primaryColor: '#2D4A3E',
    accentColor: '#8C9A8E',
    fontPairing: 'Montserrat + Cormorant',
    previewSvg: `<svg viewBox="0 0 300 420" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="420" rx="12" fill="#F5F7F4" stroke="#8C9A8E" stroke-width="2"/>
      <text x="150" y="120" text-anchor="middle" fill="#8C9A8E" font-size="10" letter-spacing="4">JOIN US FOR THE RECEPTION OF</text>
      <text x="150" y="180" text-anchor="middle" fill="#2D4A3E" font-family="serif" font-size="28" font-weight="bold">Priya &amp; Rahul</text>
      <text x="150" y="240" text-anchor="middle" fill="#2D4A3E" font-size="12" font-weight="600">SATURDAY • 24 OCT 2026</text>
      <text x="150" y="290" text-anchor="middle" fill="#718075" font-size="10">Bengaluru Club, MG Road</text>
    </svg>`,
    cardShape: {
      shapeId: 'rectangle',
      cornerRadius: 12,
      cutOuts: [],
    },
    pages: [
      {
        id: 'p-mbr-1',
        pageNumber: 1,
        pageType: 'front_cover',
        label: 'Reception Card',
        cardShape: {
          shapeId: 'rectangle',
          cornerRadius: 12,
          cutOuts: [],
        },
        background: { type: 'color', color: '#F5F7F4' },
        elements: [],
        textBlocks: [
          {
            id: 'tb-min-header',
            blockType: 'free',
            name: 'Reception Invitation Header',
            content: 'JOIN US FOR THE RECEPTION CELEBRATION OF',
            language: 'en',
            x: 40, y: 110, width: 481,
            fontFamily: 'Montserrat', fontSize: 12, fontWeight: '600', fontStyle: 'normal',
            fontColor: '#8C9A8E', textAlign: 'center', lineHeight: 1.5, letterSpacing: 3,
            locked: false, visible: true, isCustomizable: false, editableByCustomer: false,
          },
          {
            id: 'tb-min-couple',
            blockType: 'couple_names',
            name: 'Couple Names',
            content: '{{bride_name}} & {{groom_name}}',
            language: 'en',
            x: 30, y: 210, width: 501,
            fontFamily: 'Cormorant Garamond', fontSize: 42, fontWeight: '700', fontStyle: 'normal',
            fontColor: '#2D4A3E', textAlign: 'center', lineHeight: 1.3, letterSpacing: 1,
            locked: false, visible: true, variableKey: 'bride_name', isCustomizable: true, editableByCustomer: true,
          },
          {
            id: 'tb-min-time',
            blockType: 'event_details',
            name: 'Reception Time',
            content: '{{reception_time}}',
            language: 'en',
            x: 50, y: 340, width: 461,
            fontFamily: 'Montserrat', fontSize: 14, fontWeight: '600', fontStyle: 'normal',
            fontColor: '#2D4A3E', textAlign: 'center', lineHeight: 1.5, letterSpacing: 2,
            locked: false, visible: true, variableKey: 'reception_time', isCustomizable: true, editableByCustomer: true,
          },
          {
            id: 'tb-min-venue',
            blockType: 'venue',
            name: 'Venue Address',
            content: '{{venue_name}}\n{{venue_address}}',
            language: 'en',
            x: 50, y: 430, width: 461,
            fontFamily: 'Cormorant Garamond', fontSize: 18, fontWeight: '500', fontStyle: 'normal',
            fontColor: '#718075', textAlign: 'center', lineHeight: 1.5, letterSpacing: 0,
            locked: false, visible: true, variableKey: 'venue_name', isCustomizable: true, editableByCustomer: true,
          },
        ],
      },
    ],
  },

  // 4. TRADITIONAL KANNADA MUHURTHAM
  {
    id: 'tmpl-kannada-traditional',
    name: 'Traditional Kannada Muhurtham',
    category: 'Indian Traditional',
    style: 'Heritage Traditional',
    description: 'Deep maroon and golden motif card with authentic Kannada multilingual typography.',
    pageCount: 1,
    bgTexture: '#3D0C10',
    primaryColor: '#F5D061',
    accentColor: '#FFFFFF',
    fontPairing: 'Playfair Display + Noto Serif Kannada',
    previewSvg: `<svg viewBox="0 0 300 420" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="420" rx="16" fill="#3D0C10" stroke="#F5D061" stroke-width="3"/>
      <circle cx="150" cy="75" r="30" fill="none" stroke="#F5D061" stroke-width="2"/>
      <text x="150" y="80" text-anchor="middle" fill="#F5D061" font-size="20">🐘</text>
      <text x="150" y="130" text-anchor="middle" fill="#F5D061" font-family="serif" font-size="14">॥ ಶ್ರೀ ಲಕ್ಷ್ಮೀಪ್ರಸನ್ನ ॥</text>
      <text x="150" y="190" text-anchor="middle" fill="#FFFFFF" font-family="serif" font-size="24" font-weight="bold">Priya &amp; Rahul</text>
      <text x="150" y="250" text-anchor="middle" fill="#F5D061" font-size="12">ಶುಭ ಮುಹೂರ್ತ: 7:30 PM</text>
      <text x="150" y="300" text-anchor="middle" fill="#E5C378" font-size="10">ಶ್ರೀ ಕನ್ವೆನ್ಷನ್ ಹಾಲ್, ಬೆಂಗಳೂರು</text>
    </svg>`,
    cardShape: {
      shapeId: 'arch_top',
      archHeight: 160,
      cornerRadius: 16,
      cutOuts: [],
      fourSides: {
        topEdge: 'lib-8',
        rightEdge: 'straight',
        bottomEdge: 'straight',
        leftEdge: 'straight',
        topLeftCorner: 'straight',
        topRightCorner: 'straight',
        bottomLeftCorner: 'straight',
        bottomRightCorner: 'straight',
        params: {},
      },
    },
    pages: [
      {
        id: 'p-tkm-1',
        pageNumber: 1,
        pageType: 'kannada_inner',
        label: 'Kannada Muhurtham Cover',
        cardShape: {
          shapeId: 'arch_top',
          archHeight: 160,
          cornerRadius: 16,
          cutOuts: [],
        },
        background: { type: 'color', color: '#3D0C10' },
        elements: [],
        textBlocks: [
          {
            id: 'tb-kan-deity',
            blockType: 'invocation',
            name: 'Kannada Blessing Line',
            content: '॥ ಶ್ರೀ ಲಕ್ಷ್ಮೀನರಸಿಂಹ ಸ್ವಾಮಿ ಪ್ರಸನ್ನ ॥',
            language: 'kn',
            x: 50, y: 70, width: 461,
            fontFamily: 'Playfair Display', fontSize: 18, fontWeight: '700', fontStyle: 'normal',
            fontColor: '#F5D061', textAlign: 'center', lineHeight: 1.4, letterSpacing: 1,
            locked: false, visible: true, variableKey: 'blessing_deity', isCustomizable: true, editableByCustomer: true,
          },
          {
            id: 'tb-kan-couple',
            blockType: 'couple_names',
            name: 'Couple Names',
            content: '{{bride_name}}\n& {{groom_name}}',
            language: 'en',
            x: 30, y: 180, width: 501,
            fontFamily: 'Playfair Display', fontSize: 40, fontWeight: '700', fontStyle: 'normal',
            fontColor: '#FFFFFF', textAlign: 'center', lineHeight: 1.3, letterSpacing: 1,
            printFinish: 'gold_foil',
            locked: false, visible: true, variableKey: 'bride_name', isCustomizable: true, editableByCustomer: true,
          },
          {
            id: 'tb-kan-time',
            blockType: 'timing',
            name: 'Muhurtham Timing',
            content: 'ಶುಭ ಮುಹೂರ್ತ: {{wedding_time}}',
            language: 'kn',
            x: 50, y: 350, width: 461,
            fontFamily: 'Montserrat', fontSize: 16, fontWeight: '600', fontStyle: 'normal',
            fontColor: '#F5D061', textAlign: 'center', lineHeight: 1.5, letterSpacing: 1,
            locked: false, visible: true, variableKey: 'wedding_time', isCustomizable: true, editableByCustomer: true,
          },
          {
            id: 'tb-kan-venue',
            blockType: 'venue',
            name: 'Venue',
            content: '{{venue_name}}\n{{venue_address}}',
            language: 'en',
            x: 50, y: 440, width: 461,
            fontFamily: 'Cormorant Garamond', fontSize: 18, fontWeight: '600', fontStyle: 'normal',
            fontColor: '#E5C378', textAlign: 'center', lineHeight: 1.5, letterSpacing: 0,
            locked: false, visible: true, variableKey: 'venue_name', isCustomizable: true, editableByCustomer: true,
          },
        ],
      },
    ],
  },
];
