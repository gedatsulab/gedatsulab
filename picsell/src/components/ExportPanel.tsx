import React, { useMemo, useState } from 'react';
import { CheckCircle2, Download, Share2 } from 'lucide-react';
import { useI18n } from '../i18n';
import {
  ExportFormat,
  FilterSettings,
  LoadedImage,
  OUTPUT_SIZE,
  ResizeSettings,
  TextLayer,
} from '../types';
import { renderComposition } from '../utils/canvasRenderer';

interface ExportPanelProps {
  loadedImage: LoadedImage;
  resize: ResizeSettings;
  filters: FilterSettings;
  textLayers: TextLayer[];
}

function buildExportFileName(format: ExportFormat): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(
    now.getHours(),
  )}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `picsell-${stamp}.${format === 'jpeg' ? 'jpg' : 'png'}`;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({
  loadedImage,
  resize,
  filters,
  textLayers,
}) => {
  const { t } = useI18n();
  const [format, setFormat] = useState<ExportFormat>('jpeg');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const canWebShare = useMemo(() => {
    return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  }, []);

  const renderExportBlob = (): Promise<{ blob: Blob; mimeType: string; fileName: string }> => {
    return new Promise((resolve, reject) => {
      const offscreen = document.createElement('canvas');
      offscreen.width = OUTPUT_SIZE;
      offscreen.height = OUTPUT_SIZE;
      renderComposition(offscreen, loadedImage.canvas, resize, filters, textLayers, {
        showSelection: false,
      });

      const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
      const quality = format === 'jpeg' ? 0.9 : undefined;
      offscreen.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error(t.exportError));
            return;
          }
          resolve({
            blob,
            mimeType,
            fileName: buildExportFileName(format),
          });
        },
        mimeType,
        quality,
      );
    });
  };

  const handleDownload = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      const { blob, fileName } = await renderExportBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setFeedback(t.savedMsg(fileName));
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : t.saveError);
    } finally {
      setBusy(false);
    }
  };

  const handleShare = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      const { blob, mimeType, fileName } = await renderExportBlob();
      const file = new File([blob], fileName, { type: mimeType });

      if (navigator.canShare && !navigator.canShare({ files: [file] })) {
        setFeedback(t.shareUnsupported);
        return;
      }

      await navigator.share({
        files: [file],
        title: 'PicSell',
      });
      setFeedback(t.shareOpened);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // User cancelled share sheet
        return;
      }
      setFeedback(err instanceof Error ? err.message : t.shareFailed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
          {t.exportFormatLabel}
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setFormat('jpeg')}
            className={`rounded-xl border-2 px-3 py-2.5 text-left transition ${
              format === 'jpeg'
                ? 'border-rose-500 bg-rose-50 text-rose-700'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
            }`}
          >
            <div className="text-sm font-bold">{t.jpegTitle}</div>
            <div className="text-[11px] opacity-75">{t.jpegDesc}</div>
          </button>

          <button
            type="button"
            onClick={() => setFormat('png')}
            className={`rounded-xl border-2 px-3 py-2.5 text-left transition ${
              format === 'png'
                ? 'border-rose-500 bg-rose-50 text-rose-700'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
            }`}
          >
            <div className="text-sm font-bold">{t.pngTitle}</div>
            <div className="text-[11px] opacity-75">{t.pngDesc}</div>
          </button>
        </div>
      </div>

      <div className="space-y-2.5">
        <button
          type="button"
          disabled={busy}
          onClick={handleDownload}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-rose-600 active:scale-[0.99] disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          <span>{t.downloadBtn}</span>
        </button>

        {canWebShare && (
          <button
            type="button"
            disabled={busy}
            onClick={handleShare}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-800 bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99] disabled:opacity-50"
          >
            <Share2 className="h-4 w-4" />
            <span>{t.shareBtn}</span>
          </button>
        )}
      </div>

      {canWebShare && (
        <p className="text-xs leading-relaxed text-slate-500">{t.shareHint}</p>
      )}

      {feedback && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}
    </div>
  );
};
