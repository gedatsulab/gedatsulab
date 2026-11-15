import React from 'react';
import { RotateCcw, Sparkles } from 'lucide-react';
import { useI18n } from '../i18n';
import {
  AUTO_ENHANCE_FILTERS,
  DEFAULT_FILTERS,
  FilterSettings,
} from '../types';

interface FilterPanelProps {
  filters: FilterSettings;
  onChange: (next: FilterSettings) => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onChange }) => {
  const { t } = useI18n();
  const isDefault =
    filters.brightness === 100 &&
    filters.contrast === 100 &&
    filters.saturation === 100;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => onChange({ ...AUTO_ENHANCE_FILTERS })}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-orange-400 px-3 py-2.5 text-sm font-bold text-white shadow-sm transition hover:brightness-105 active:scale-[0.99]"
        >
          <Sparkles className="h-4 w-4" />
          <span>{t.autoEnhance}</span>
        </button>

        <button
          type="button"
          disabled={isDefault}
          onClick={() => onChange({ ...DEFAULT_FILTERS })}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <RotateCcw className="h-4 w-4" />
          <span>{t.reset}</span>
        </button>
      </div>

      <div className="space-y-4 rounded-xl bg-slate-50 p-3.5 ring-1 ring-slate-200/80">
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>{t.brightness}</span>
            <span className="tabular-nums text-rose-600">{filters.brightness}%</span>
          </div>
          <input
            type="range"
            min={50}
            max={150}
            step={1}
            value={filters.brightness}
            onChange={(e) =>
              onChange({ ...filters, brightness: parseInt(e.target.value, 10) })
            }
            className="w-full"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>{t.contrast}</span>
            <span className="tabular-nums text-rose-600">{filters.contrast}%</span>
          </div>
          <input
            type="range"
            min={50}
            max={150}
            step={1}
            value={filters.contrast}
            onChange={(e) =>
              onChange({ ...filters, contrast: parseInt(e.target.value, 10) })
            }
            className="w-full"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>{t.saturation}</span>
            <span className="tabular-nums text-rose-600">{filters.saturation}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={150}
            step={1}
            value={filters.saturation}
            onChange={(e) =>
              onChange({ ...filters, saturation: parseInt(e.target.value, 10) })
            }
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};
