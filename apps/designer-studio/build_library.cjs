const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, 'src/data/diecutLibraryData.json');
const rawItems = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const fileHeader = `// Auto-generated Rooted Memoirs Vector Die-Cut Library (388 Shapes)
import type { DieCutShapeDef, DieCutCategory, CutLineType } from '../types/diecut';

export interface LibraryShapeItem {
  id: string;
  numId: number;
  name: string;
  category: string;
  subCategory: string;
  operation: string;
  pathD: string;
  svgFile: string;
  defaultWidthMm: number;
  defaultHeightMm: number;
  viewBox: string;
}

export const VECTOR_DIE_CUT_LIBRARY: LibraryShapeItem[] = ${JSON.stringify(rawItems, null, 2)};

export class DieCutLibraryRegistry {
  private static itemMap = new Map<string, LibraryShapeItem>(
    VECTOR_DIE_CUT_LIBRARY.map(item => [item.id, item])
  );
  private static numIdMap = new Map<number, LibraryShapeItem>(
    VECTOR_DIE_CUT_LIBRARY.map(item => [item.numId, item])
  );
  private static nameMap = new Map<string, LibraryShapeItem>(
    VECTOR_DIE_CUT_LIBRARY.map(item => [item.name.toLowerCase(), item])
  );

  public static getAll(): LibraryShapeItem[] {
    return VECTOR_DIE_CUT_LIBRARY;
  }

  public static getById(id: string | number): LibraryShapeItem | undefined {
    if (typeof id === 'number') return this.numIdMap.get(id);
    if (typeof id === 'string' && id.startsWith('lib-')) return this.itemMap.get(id);
    const parsedNum = typeof id === 'number' ? id : parseInt(id, 10);
    if (!isNaN(parsedNum)) return this.numIdMap.get(parsedNum);
    return this.nameMap.get(String(id).toLowerCase());
  }

  public static getByCategory(category: string): LibraryShapeItem[] {
    const catLower = category.toLowerCase();
    return VECTOR_DIE_CUT_LIBRARY.filter(item => item.category.toLowerCase().includes(catLower));
  }

  public static getBySubCategory(subCat: string): LibraryShapeItem[] {
    const subLower = subCat.toLowerCase();
    if (subLower === 'all') return VECTOR_DIE_CUT_LIBRARY;
    return VECTOR_DIE_CUT_LIBRARY.filter(item => 
      item.subCategory.toLowerCase() === subLower || 
      item.category.toLowerCase().includes(subLower)
    );
  }

  public static search(query: string): LibraryShapeItem[] {
    if (!query || query.trim() === '') return VECTOR_DIE_CUT_LIBRARY;
    const q = query.toLowerCase().trim();
    return VECTOR_DIE_CUT_LIBRARY.filter(item => 
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.subCategory.toLowerCase().includes(q) ||
      item.numId.toString() === q
    );
  }

  public static toShapeDef(item: LibraryShapeItem): DieCutShapeDef {
    let cat: DieCutCategory = 'edge';
    const cLower = item.category.toLowerCase();
    if (cLower.includes('edge')) cat = 'edge';
    else if (cLower.includes('corner')) cat = 'corner';
    else if (cLower.includes('partial')) cat = 'partial';
    else if (cLower.includes('aperture')) cat = 'aperture';
    else if (cLower.includes('technical')) cat = 'technical';

    let defaultCutType: CutLineType = 'cut';
    const opUpper = item.operation.toUpperCase();
    if (opUpper.includes('PARTIAL')) defaultCutType = 'partial_cut';
    else if (opUpper.includes('SCORE')) defaultCutType = 'score';
    else if (opUpper.includes('PERFORATION')) defaultCutType = 'perforation';
    else if (opUpper.includes('ENGRAVE')) defaultCutType = 'engrave';

    const mmToPx = 3.78;
    const defaultWidth = item.defaultWidthMm * mmToPx;
    const defaultHeight = item.defaultHeightMm * mmToPx;

    const colorMap = {
      cut: '#FF0000',
      partial_cut: '#FF00FF',
      score: '#0000FF',
      perforation: '#00AA00',
      engrave: '#CCAA00',
      print: '#9E9E9E'
    };

    return {
      id: item.id,
      name: item.name,
      category: cat,
      operation: defaultCutType as any,
      defaultCutType,
      svgPathD: item.pathD,
      previewSvg: '<path d="' + item.pathD + '" fill="none" stroke="currentColor" stroke-width="1.5" />',
      defaultWidth,
      defaultHeight,
      supportsRotation: true,
      supportsScaling: true,
      supportsBridges: cat === 'partial',
      supports3D: cat === 'partial',
      supportsFold: cat === 'partial',
      description: 'Vector ' + item.category + ' (' + item.name + ')',
      productionColor: colorMap[defaultCutType] || '#FF0000'
    };
  }
}
`;

fs.writeFileSync(path.join(__dirname, 'src/data/diecutLibrary.ts'), fileHeader);
console.log('diecutLibrary.ts generated successfully with 388 shapes!');
