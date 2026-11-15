import React, { createContext, useContext, useEffect, useState } from 'react';

export type Locale = 'ja' | 'en';

const STORAGE_KEY = 'picsell-lang';

export function getInitialLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'ja' || saved === 'en') {
      return saved;
    }
  } catch {
    // Ignore storage access errors
  }

  if (typeof navigator !== 'undefined') {
    const lang = (navigator.languages?.[0] || navigator.language || '').toLowerCase();
    return lang.startsWith('ja') ? 'ja' : 'en';
  }

  return 'en';
}

export interface Messages {
  pageTitle: string;
  appSubtitle: string;
  changePhoto: string;
  optimizingImage: string;
  selectPhotoHeading: string;
  selectPhotoSub: string;
  openFiles: string;
  featureLocalTitle: string;
  featureLocalDesc: string;
  featureSquareTitle: string;
  featureSquareDesc: string;
  featureTextTitle: string;
  featureTextDesc: string;
  loadError: string;
  defaultAddedText: string;
  tabResize: string;
  tabFilter: string;
  tabText: string;
  tabExport: string;
  dropToSwitch: string;
  outputLabel: string;
  originalOptimized: (w: number, h: number) => string;
  hintDragText: string;
  hintDragCrop: string;
  resizeMode: string;
  modeFit: string;
  modeCrop: string;
  bgColor: string;
  fitHint: string;
  cropDragHint: string;
  reset: string;
  zoom: string;
  posX: string;
  posY: string;
  autoEnhance: string;
  brightness: string;
  contrast: string;
  saturation: string;
  addText: string;
  placedTexts: (n: number) => string;
  textFallbackName: (n: number) => string;
  deleteTextAria: string;
  textContentLabel: string;
  delete: string;
  textPlaceholder: string;
  fontLabel: string;
  fontSize: string;
  angleLabel: string;
  textColor: string;
  outlineLabel: string;
  outlineColorAria: string;
  outlineWidth: string;
  textEmpty1: string;
  textEmpty2: string;
  exportFormatLabel: string;
  jpegTitle: string;
  jpegDesc: string;
  pngTitle: string;
  pngDesc: string;
  downloadBtn: string;
  shareBtn: string;
  shareHint: string;
  exportError: string;
  savedMsg: (name: string) => string;
  saveError: string;
  shareUnsupported: string;
  shareOpened: string;
  shareFailed: string;
}

const MESSAGES: Record<Locale, Messages> = {
  ja: {
    pageTitle: 'PicSell — フリマ出品画像エディタ',
    appSubtitle: 'フリマ出品画像エディタ',
    changePhoto: '別の写真を選ぶ',
    optimizingImage: '画像を最適化中...',
    selectPhotoHeading: '出品する写真を選択',
    selectPhotoSub: 'タップして写真を選ぶか、ここに画像をドラッグ＆ドロップ',
    openFiles: '写真ライブラリ / ファイルを開く',
    featureLocalTitle: '完全ブラウザ処理',
    featureLocalDesc: '画像は外部送信されません',
    featureSquareTitle: '1:1 正方形',
    featureSquareDesc: '余白フィット・切り抜き対応',
    featureTextTitle: '文字入れ・補正',
    featureTextDesc: '指ドラッグで直感配置',
    loadError: '画像の読み込みに失敗しました。',
    defaultAddedText: '美品・即購入OK',
    tabResize: 'リサイズ',
    tabFilter: 'フィルタ',
    tabText: 'テキスト',
    tabExport: '保存',
    dropToSwitch: 'ドロップして画像を切り替え',
    outputLabel: '出力',
    originalOptimized: (w: number, h: number) => `(元画像 ${w}×${h} → 最適化済)`,
    hintDragText: 'テキストをドラッグで移動',
    hintDragCrop: '画像をドラッグで位置調整',
    resizeMode: 'リサイズモード',
    modeFit: '余白フィット',
    modeCrop: '中央切り抜き',
    bgColor: '余白の背景色',
    fitHint: '商品全体が切れないように1:1の正方形に収めます。',
    cropDragHint: 'キャンバスを直接ドラッグしても移動できます',
    reset: 'リセット',
    zoom: '拡大率 (ズーム)',
    posX: '左右位置 (X)',
    posY: '上下位置 (Y)',
    autoEnhance: '自動補正',
    brightness: '明るさ (Brightness)',
    contrast: 'コントラスト (Contrast)',
    saturation: '彩度 (Saturation)',
    addText: '新しいテキストを追加',
    placedTexts: (n: number) => `配置中のテキスト (${n})`,
    textFallbackName: (n: number) => `テキスト ${n}`,
    deleteTextAria: 'テキストを削除',
    textContentLabel: 'テキスト内容（改行可）',
    delete: '削除',
    textPlaceholder: 'テキストを入力...',
    fontLabel: 'フォント',
    fontSize: '文字サイズ',
    angleLabel: '角度（傾き）',
    textColor: '文字色',
    outlineLabel: '縁取り（アウトライン）',
    outlineColorAria: '縁取り色',
    outlineWidth: '縁取りの太さ',
    textEmpty1: '上のボタンまたはプリセットからテキストを追加するか、',
    textEmpty2: 'キャンバス上のテキストをタップして編集してください。',
    exportFormatLabel: '保存フォーマット (1080×1080px)',
    jpegTitle: 'JPEG (品質90%)',
    jpegDesc: '軽量・フリマ出品向け',
    pngTitle: 'PNG',
    pngDesc: '文字くっきり・無劣化',
    downloadBtn: '画像を保存（ダウンロード）',
    shareBtn: '共有 / カメラロールに保存',
    shareHint:
      'iPhone・Androidでは「共有 / カメラロールに保存」から共有シートを開き、「画像を保存」を選ぶと写真アプリに直接保存できます。',
    exportError: '画像の書き出しに失敗しました。',
    savedMsg: (name: string) => `${name} を保存しました`,
    saveError: '保存に失敗しました',
    shareUnsupported:
      'このブラウザはファイルの共有に対応していません。「画像を保存（ダウンロード）」をご利用ください。',
    shareOpened: '共有シートを開きました',
    shareFailed:
      '共有に失敗しました。「画像を保存（ダウンロード）」をお試しください。',
  },
  en: {
    pageTitle: 'PicSell — Listing Photo Editor',
    appSubtitle: 'Listing Photo Editor',
    changePhoto: 'Change Photo',
    optimizingImage: 'Optimizing image...',
    selectPhotoHeading: 'Select a Photo to Edit',
    selectPhotoSub: 'Tap to choose a photo or drag & drop an image here',
    openFiles: 'Open Photo Library / Files',
    featureLocalTitle: '100% Browser-Based',
    featureLocalDesc: 'Images stay on your device',
    featureSquareTitle: '1:1 Square',
    featureSquareDesc: 'Fit with padding or crop',
    featureTextTitle: 'Text & Filters',
    featureTextDesc: 'Drag freely with touch or mouse',
    loadError: 'Failed to load the image.',
    defaultAddedText: 'Great Condition',
    tabResize: 'Resize',
    tabFilter: 'Filters',
    tabText: 'Text',
    tabExport: 'Export',
    dropToSwitch: 'Drop to replace image',
    outputLabel: 'Output',
    originalOptimized: (w: number, h: number) => `(Original ${w}×${h} → Optimized)`,
    hintDragText: 'Drag text to move',
    hintDragCrop: 'Drag image to reposition',
    resizeMode: 'Resize Mode',
    modeFit: 'Fit with Padding',
    modeCrop: 'Center Crop',
    bgColor: 'Background Color',
    fitHint: 'Fits the entire item inside a 1:1 square without cropping.',
    cropDragHint: 'You can also drag directly on the canvas',
    reset: 'Reset',
    zoom: 'Zoom',
    posX: 'Position X',
    posY: 'Position Y',
    autoEnhance: 'Auto Enhance',
    brightness: 'Brightness',
    contrast: 'Contrast',
    saturation: 'Saturation',
    addText: 'Add New Text',
    placedTexts: (n: number) => `Placed Text (${n})`,
    textFallbackName: (n: number) => `Text ${n}`,
    deleteTextAria: 'Delete text',
    textContentLabel: 'Text Content (multiline)',
    delete: 'Delete',
    textPlaceholder: 'Enter text...',
    fontLabel: 'Font',
    fontSize: 'Font Size',
    angleLabel: 'Rotation / Tilt',
    textColor: 'Text Color',
    outlineLabel: 'Outline',
    outlineColorAria: 'Outline color',
    outlineWidth: 'Outline Width',
    textEmpty1: 'Add text using the button or presets above,',
    textEmpty2: 'or tap any text on the canvas to edit it.',
    exportFormatLabel: 'Export Format (1080×1080px)',
    jpegTitle: 'JPEG (90% Quality)',
    jpegDesc: 'Compact • Best for listings',
    pngTitle: 'PNG',
    pngDesc: 'Lossless • Crisp text',
    downloadBtn: 'Save Image (Download)',
    shareBtn: 'Share / Save to Photos',
    shareHint:
      'On iPhone & Android, tap "Share / Save to Photos" and choose "Save Image" in the share sheet to save directly to your Photos app.',
    exportError: 'Failed to export image.',
    savedMsg: (name: string) => `Saved ${name}`,
    saveError: 'Failed to save image',
    shareUnsupported:
      'File sharing is not supported in this browser. Please use "Save Image (Download)".',
    shareOpened: 'Share sheet opened',
    shareFailed: 'Sharing failed. Please try "Save Image (Download)".',
  },
};

interface I18nContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: Messages;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => getInitialLocale());

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore storage access errors
    }
  };

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = MESSAGES[locale].pageTitle;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: MESSAGES[locale] }}>
      {children}
    </I18nContext.Provider>
  );
};

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}
