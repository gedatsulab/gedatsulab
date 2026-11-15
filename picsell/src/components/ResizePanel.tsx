import React from 'react';
import { Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import { useI18n } from '../i18n';
import { BG_QUICK_COLORS, ResizeSettings } from '../types';

interface ResizePanelProps {
  resize: ResizeSettings;
  onChange: (next: ResizeSettings) => void;
}

export const ResizePanel: React.FC<ResizePanelProps> = ({ resize, onChange }) => {
  const { locale, t } = useI18n();

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
          {t.resizeMode}
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => onChange({ ...resize, mode: 'fit' })}
            className={`flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-bold transition ${
              resize.mode === 'fit'
                ? 'border-rose-500 bg-rose-50 text-rose-600 shadow-sm'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
            }`}
          >
            <Minimize2 className="h-4 w-4 shrink-0" />
            <span>{t.modeFit}</span>
          </button>

          <button
            type="button"
            onClick={() => onChange({ ...resize, mode: 'crop' })}
            className={`flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-bold transition ${
              resize.mode === 'crop'
                ? 'border-rose-500 bg-rose-50 text-rose-600 shadow-sm'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
            }`}
          >
            <Maximize2 className="h-4 w-4 shrink-0" />
            <span>{t.modeCrop}</span>
          </button>
        </div>
      </div>

      {resize.mode === 'fit' ? (
        <div className="space-y-3 rounded-xl bg-slate-50 p-3.5 ring-1 ring-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">{t.bgColor}</span>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-xs">
              <input
                type="color"
                value={resize.bgColor}
                onChange={(e) => onChange({ ...resize, bgColor: e.target.value })}
                className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0"
              />
              <span className="font-mono uppercase">{resize.bgColor}</span>
            </label>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {BG_QUICK_COLORS.map((swatch) => {
              const active = resize.bgColor.toLowerCase() === swatch.value.toLowerCase();
              const label = locale === 'ja' ? swatch.label : swatch.labelEn;
              return (
                <button
                  key={swatch.value}
                  type="button"
                  title={label}
                  onClick={() => onChange({ ...resize, bgColor: swatch.value })}
                  className={`flex shrink-0 whitespace-nowrap items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium transition ${
                    active
                      ? 'border-rose-500 bg-rose-50 text-rose-700 ring-1 ring-rose-500'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span
                    className="h-3.5 w-3.5 rounded-full border border-slate-300"
                    style={{ backgroundColor: swatch.value }}
                  />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-slate-500">{t.fitHint}</p>
        </div>
      ) : (
        <div className="space-y-4 rounded-xl bg-slate-50 p-3.5 ring-1 ring-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">{t.cropDragHint}</span>
            <button
              type="button"
              onClick={() =>
                onChange({ ...resize, cropZoom: 1, cropOffsetX: 0, cropOffsetY: 0 })
              }
              className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t.reset}
            </button>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>{t.zoom}</span>
              <span className="tabular-nums text-rose-600">
                {resize.cropZoom.toFixed(2)}×
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={resize.cropZoom}
              onChange={(e) =>
                onChange({ ...resize, cropZoom: parseFloat(e.target.value) })
              }
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>{t.posX}</span>
                <span className="tabular-nums text-slate-500">
                  {Math.round(resize.cropOffsetX * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={-1}
                max={1}
                step={0.01}
                value={resize.cropOffsetX}
                onChange={(e) =>
                  onChange({ ...resize, cropOffsetX: parseFloat(e.target.value) })
                }
                className="w-full"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>{t.posY}</span>
                <span className="tabular-nums text-slate-500">
                  {Math.round(resize.cropOffsetY * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={-1}
                max={1}
                step={0.01}
                value={resize.cropOffsetY}
                onChange={(e) =>
                  onChange({ ...resize, cropOffsetY: parseFloat(e.target.value) })
                }
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
