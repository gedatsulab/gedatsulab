import React, { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import {
  FilterSettings,
  LoadedImage,
  OUTPUT_SIZE,
  ResizeSettings,
  TextLayer,
} from '../types';
import {
  getCropMetrics,
  hitTestTextLayer,
  renderComposition,
} from '../utils/canvasRenderer';

interface CanvasPreviewProps {
  loadedImage: LoadedImage;
  resize: ResizeSettings;
  filters: FilterSettings;
  textLayers: TextLayer[];
  selectedTextId: string | null;
  fontsReadyTick: number;
  onSelectText: (id: string | null) => void;
  onMoveText: (id: string, x: number, y: number) => void;
  onPanCrop: (offsetX: number, offsetY: number) => void;
  onDropFile: (file: File) => void;
}

type DragState =
  | { kind: 'text'; id: string; startCanvasX: number; startCanvasY: number; origX: number; origY: number }
  | { kind: 'crop'; startCanvasX: number; startCanvasY: number; origOffsetX: number; origOffsetY: number }
  | null;

export const CanvasPreview: React.FC<CanvasPreviewProps> = ({
  loadedImage,
  resize,
  filters,
  textLayers,
  selectedTextId,
  fontsReadyTick,
  onSelectText,
  onMoveText,
  onPanCrop,
  onDropFile,
}) => {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragRef = useRef<DragState>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderComposition(canvas, loadedImage.canvas, resize, filters, textLayers, {
      selectedTextId,
      showSelection: true,
    });
  }, [loadedImage, resize, filters, textLayers, selectedTextId, fontsReadyTick]);

  const toCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * OUTPUT_SIZE,
      y: ((e.clientY - rect.top) / rect.height) * OUTPUT_SIZE,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = toCanvasCoords(e);
    const hitLayer = hitTestTextLayer(ctx, textLayers, x, y);

    if (hitLayer) {
      onSelectText(hitLayer.id);
      dragRef.current = {
        kind: 'text',
        id: hitLayer.id,
        startCanvasX: x,
        startCanvasY: y,
        origX: hitLayer.x,
        origY: hitLayer.y,
      };
      canvas.setPointerCapture(e.pointerId);
      return;
    }

    onSelectText(null);
    if (resize.mode === 'crop') {
      dragRef.current = {
        kind: 'crop',
        startCanvasX: x,
        startCanvasY: y,
        origOffsetX: resize.cropOffsetX,
        origOffsetY: resize.cropOffsetY,
      };
      canvas.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!drag) return;

    const { x, y } = toCanvasCoords(e);
    const dx = x - drag.startCanvasX;
    const dy = y - drag.startCanvasY;

    if (drag.kind === 'text') {
      const nextX = Math.max(0, Math.min(OUTPUT_SIZE, Math.round(drag.origX + dx)));
      const nextY = Math.max(0, Math.min(OUTPUT_SIZE, Math.round(drag.origY + dy)));
      onMoveText(drag.id, nextX, nextY);
    } else if (drag.kind === 'crop') {
      const { maxPanX, maxPanY } = getCropMetrics(
        loadedImage.width,
        loadedImage.height,
        OUTPUT_SIZE,
        resize.cropZoom,
      );
      const nextOffsetX =
        maxPanX > 0 ? Math.max(-1, Math.min(1, drag.origOffsetX + dx / maxPanX)) : 0;
      const nextOffsetY =
        maxPanY > 0 ? Math.max(-1, Math.min(1, drag.origOffsetY + dy / maxPanY)) : 0;
      onPanCrop(nextOffsetX, nextOffsetY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
    dragRef.current = null;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = () => {
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onDropFile(file);
  };

  return (
    <div
      className="relative mx-auto w-full max-w-[min(100%,42dvh)] sm:max-w-[420px] lg:max-w-[540px]"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-200 shadow-lg ring-1 ring-slate-900/10">
        <canvas
          ref={canvasRef}
          width={OUTPUT_SIZE}
          height={OUTPUT_SIZE}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="h-full w-full touch-none select-none cursor-grab active:cursor-grabbing"
        />

        {isDraggingFile && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-rose-500/20 backdrop-blur-[2px] border-4 border-dashed border-rose-500 rounded-2xl">
            <span className="rounded-full bg-white/95 px-4 py-2 text-sm font-bold text-rose-600 shadow">
              {t.dropToSwitch}
            </span>
          </div>
        )}
      </div>

      <div className="mt-1 flex items-center justify-between px-1 text-[10px] text-slate-500">
        <span>
          {t.outputLabel}: {OUTPUT_SIZE}×{OUTPUT_SIZE}px
          {loadedImage.originalWidth > loadedImage.width && (
            <span className="ml-1.5 text-slate-400">
              {t.originalOptimized(loadedImage.originalWidth, loadedImage.originalHeight)}
            </span>
          )}
        </span>
        <span className="hidden sm:inline">
          {textLayers.length > 0
            ? t.hintDragText
            : resize.mode === 'crop'
              ? t.hintDragCrop
              : ''}
        </span>
      </div>
    </div>
  );
};
