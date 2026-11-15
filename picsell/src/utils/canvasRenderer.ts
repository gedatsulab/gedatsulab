import {
  FONT_OPTIONS,
  FilterSettings,
  OUTPUT_SIZE,
  ResizeSettings,
  TextLayer,
} from '../types';

export interface CropMetrics {
  scaledW: number;
  scaledH: number;
  maxPanX: number;
  maxPanY: number;
}

export function getCropMetrics(
  srcW: number,
  srcH: number,
  size: number,
  cropZoom: number,
): CropMetrics {
  const baseScale = Math.max(size / srcW, size / srcH);
  const scale = baseScale * cropZoom;
  const scaledW = srcW * scale;
  const scaledH = srcH * scale;
  return {
    scaledW,
    scaledH,
    maxPanX: Math.max(0, (scaledW - size) / 2),
    maxPanY: Math.max(0, (scaledH - size) / 2),
  };
}

function getFontString(layer: TextLayer): string {
  const fontOpt = FONT_OPTIONS.find((f) => f.id === layer.fontId) ?? FONT_OPTIONS[0];
  return `${fontOpt.weight} ${layer.fontSize}px ${fontOpt.family}`;
}

export interface TextBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function measureTextLayerBounds(
  ctx: CanvasRenderingContext2D,
  layer: TextLayer,
): TextBounds {
  ctx.save();
  ctx.font = getFontString(layer);
  const lines = (layer.text || ' ').split('\n');
  const lineHeight = layer.fontSize * 1.25;
  let maxWidth = 0;
  for (const line of lines) {
    const metrics = ctx.measureText(line || ' ');
    if (metrics.width > maxWidth) {
      maxWidth = metrics.width;
    }
  }
  ctx.restore();

  const padX = 20;
  const padY = 14;
  const width = Math.max(48, maxWidth + padX * 2);
  const height = lines.length * lineHeight + padY * 2;
  return {
    left: layer.x - width / 2,
    top: layer.y - height / 2,
    width,
    height,
  };
}

export function hitTestTextLayer(
  ctx: CanvasRenderingContext2D,
  layers: TextLayer[],
  x: number,
  y: number,
): TextLayer | null {
  for (let i = layers.length - 1; i >= 0; i--) {
    const layer = layers[i];
    const bounds = measureTextLayerBounds(ctx, layer);
    const rad = -((layer.rotation || 0) * Math.PI) / 180;
    const dx = x - layer.x;
    const dy = y - layer.y;
    const localX = dx * Math.cos(rad) - dy * Math.sin(rad) + layer.x;
    const localY = dx * Math.sin(rad) + dy * Math.cos(rad) + layer.y;
    if (
      localX >= bounds.left &&
      localX <= bounds.left + bounds.width &&
      localY >= bounds.top &&
      localY <= bounds.top + bounds.height
    ) {
      return layer;
    }
  }
  return null;
}

/**
 * Fallback pixel-level filter for browsers without CanvasRenderingContext2D.filter support.
 */
function applyPixelFiltersFallback(
  ctx: CanvasRenderingContext2D,
  size: number,
  filters: FilterSettings,
) {
  const { brightness, contrast, saturation } = filters;
  if (brightness === 100 && contrast === 100 && saturation === 100) return;

  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;
  const bFactor = brightness / 100;
  const cFactor = contrast / 100;
  const sFactor = saturation / 100;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i] * bFactor;
    let g = data[i + 1] * bFactor;
    let b = data[i + 2] * bFactor;

    r = (r - 128) * cFactor + 128;
    g = (g - 128) * cFactor + 128;
    b = (b - 128) * cFactor + 128;

    const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    r = gray + (r - gray) * sFactor;
    g = gray + (g - gray) * sFactor;
    b = gray + (b - gray) * sFactor;

    data[i] = r < 0 ? 0 : r > 255 ? 255 : r;
    data[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
    data[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
  }
  ctx.putImageData(imageData, 0, 0);
}

export interface RenderOptions {
  selectedTextId?: string | null;
  showSelection?: boolean;
}

export function renderComposition(
  targetCanvas: HTMLCanvasElement,
  sourceCanvas: HTMLCanvasElement,
  resize: ResizeSettings,
  filters: FilterSettings,
  textLayers: TextLayer[],
  options: RenderOptions = {},
) {
  const size = OUTPUT_SIZE;
  if (targetCanvas.width !== size || targetCanvas.height !== size) {
    targetCanvas.width = size;
    targetCanvas.height = size;
  }

  const ctx = targetCanvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, size, size);

  // 1. Background
  ctx.fillStyle = resize.mode === 'fit' ? resize.bgColor : '#FFFFFF';
  ctx.fillRect(0, 0, size, size);

  // 2. Image with filters
  const srcW = sourceCanvas.width;
  const srcH = sourceCanvas.height;
  const supportsFilter = typeof ctx.filter === 'string';

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (supportsFilter) {
    ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%)`;
  }

  if (resize.mode === 'fit') {
    const scale = Math.min(size / srcW, size / srcH);
    const drawW = srcW * scale;
    const drawH = srcH * scale;
    const drawX = (size - drawW) / 2;
    const drawY = (size - drawH) / 2;
    ctx.drawImage(sourceCanvas, drawX, drawY, drawW, drawH);
  } else {
    const { scaledW, scaledH, maxPanX, maxPanY } = getCropMetrics(
      srcW,
      srcH,
      size,
      resize.cropZoom,
    );
    const drawX = (size - scaledW) / 2 + resize.cropOffsetX * maxPanX;
    const drawY = (size - scaledH) / 2 + resize.cropOffsetY * maxPanY;
    ctx.drawImage(sourceCanvas, drawX, drawY, scaledW, scaledH);
  }

  ctx.restore();

  if (!supportsFilter) {
    applyPixelFiltersFallback(ctx, size, filters);
  }

  // 3. Text layers
  for (const layer of textLayers) {
    if (!layer.text) continue;
    const lines = layer.text.split('\n');
    const lineHeight = layer.fontSize * 1.25;
    const totalHeight = lines.length * lineHeight;
    const rotationRad = ((layer.rotation || 0) * Math.PI) / 180;

    ctx.save();
    ctx.translate(layer.x, layer.y);
    ctx.rotate(rotationRad);
    ctx.font = getFontString(layer);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineY = -(totalHeight - lineHeight) / 2 + i * lineHeight;

      if (layer.outlineEnabled && layer.outlineWidth > 0) {
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.strokeStyle = layer.outlineColor;
        ctx.lineWidth = layer.outlineWidth;
        ctx.strokeText(line, 0, lineY);
      }

      ctx.fillStyle = layer.color;
      ctx.fillText(line, 0, lineY);
    }
    ctx.restore();

    // 4. Selection bounding box (preview only)
    if (options.showSelection && layer.id === options.selectedTextId) {
      const bounds = measureTextLayerBounds(ctx, layer);
      ctx.save();
      ctx.translate(layer.x, layer.y);
      ctx.rotate(rotationRad);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.setLineDash([12, 8]);
      ctx.strokeRect(-bounds.width / 2, -bounds.height / 2, bounds.width, bounds.height);

      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2.5;
      ctx.lineDashOffset = 10;
      ctx.strokeRect(-bounds.width / 2, -bounds.height / 2, bounds.width, bounds.height);
      ctx.restore();
    }
  }
}
