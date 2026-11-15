export const OUTPUT_SIZE = 1080;
export const MAX_SOURCE_DIMENSION = 1500;

export type ResizeMode = 'fit' | 'crop';
export type EditorTab = 'resize' | 'filter' | 'text' | 'export';
export type ExportFormat = 'jpeg' | 'png';

export interface ResizeSettings {
  mode: ResizeMode;
  bgColor: string;
  cropZoom: number; // 1.0 to 3.0
  cropOffsetX: number; // -1.0 to 1.0
  cropOffsetY: number; // -1.0 to 1.0
}

export interface FilterSettings {
  brightness: number; // 50 to 150
  contrast: number; // 50 to 150
  saturation: number; // 0 to 150
}

export interface FontOption {
  id: string;
  label: string;
  labelEn: string;
  family: string;
  weight: string;
  sample: string;
  sampleEn: string;
}

export interface TextLayer {
  id: string;
  text: string;
  x: number; // 0 to 1080
  y: number; // 0 to 1080
  fontId: string;
  fontSize: number; // 24 to 160
  rotation: number; // -180 to 180 degrees
  color: string;
  outlineEnabled: boolean;
  outlineColor: string;
  outlineWidth: number; // 2 to 28
}

export interface LoadedImage {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  fileName: string;
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'gothic',
    label: 'ゴシック体',
    labelEn: 'Gothic (Sans)',
    family: '"Noto Sans JP", system-ui, -apple-system, sans-serif',
    weight: '700',
    sample: '即購入OK',
    sampleEn: 'BUY NOW',
  },
  {
    id: 'rounded',
    label: '丸ゴシック',
    labelEn: 'Rounded',
    family: '"M PLUS Rounded 1c", "Hiragino Maru Gothic ProN", sans-serif',
    weight: '800',
    sample: '美品です',
    sampleEn: 'Mint Cond.',
  },
  {
    id: 'mincho',
    label: '明朝体',
    labelEn: 'Mincho (Serif)',
    family: '"Noto Serif JP", "Hiragino Mincho ProN", serif',
    weight: '700',
    sample: '限定品',
    sampleEn: 'Limited',
  },
  {
    id: 'bold',
    label: '太字強調',
    labelEn: 'Heavy Display',
    family: '"Dela Gothic One", "Noto Sans JP", sans-serif',
    weight: '400',
    sample: '値下げ！',
    sampleEn: 'SALE!',
  },
];

export const TEXT_PRESETS = [
  '美品',
  '即購入OK',
  '値下げしました',
  '送料無料',
  '匿名配送',
  '未使用に近い',
];

export const TEXT_PRESETS_EN = [
  'Mint Cond.',
  'Buy Now',
  'Price Drop',
  'Free Shipping',
  'Like New',
  'Bundle Deal',
];

export const TEXT_QUICK_COLORS = [
  { label: '白', labelEn: 'White', value: '#FFFFFF' },
  { label: '黒', labelEn: 'Black', value: '#111827' },
  { label: '赤', labelEn: 'Red', value: '#EF4444' },
  { label: '黄', labelEn: 'Yellow', value: '#FACC15' },
  { label: '青', labelEn: 'Blue', value: '#2563EB' },
  { label: '緑', labelEn: 'Green', value: '#16A34A' },
  { label: 'グレー', labelEn: 'Gray', value: '#6B7280' },
  { label: 'ピンク', labelEn: 'Pink', value: '#EC4899' },
  { label: '紫', labelEn: 'Purple', value: '#9333EA' },
];

export const BG_QUICK_COLORS = [
  { label: '白', labelEn: 'White', value: '#FFFFFF' },
  { label: 'ライトグレー', labelEn: 'Light Gray', value: '#F3F4F6' },
  { label: 'クリーム', labelEn: 'Cream', value: '#FEFCE8' },
  { label: 'ピンク', labelEn: 'Pink', value: '#FFF1F2' },
  { label: 'ブルー', labelEn: 'Blue', value: '#EFF6FF' },
  { label: '黒', labelEn: 'Black', value: '#111827' },
];

export const DEFAULT_RESIZE: ResizeSettings = {
  mode: 'fit',
  bgColor: '#FFFFFF',
  cropZoom: 1,
  cropOffsetX: 0,
  cropOffsetY: 0,
};

export const DEFAULT_FILTERS: FilterSettings = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
};

export const AUTO_ENHANCE_FILTERS: FilterSettings = {
  brightness: 108,
  contrast: 112,
  saturation: 108,
};
