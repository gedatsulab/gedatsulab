import React, { useState } from 'react';
import { Palette, Plus, Sliders, Trash2, Type } from 'lucide-react';
import { useI18n } from '../i18n';
import {
  FONT_OPTIONS,
  TEXT_PRESETS,
  TEXT_PRESETS_EN,
  TEXT_QUICK_COLORS,
  TextLayer,
} from '../types';

type TextSubTab = 'content' | 'font' | 'transform' | 'style';

interface TextPanelProps {
  layers: TextLayer[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: (initialText?: string) => void;
  onUpdate: (id: string, patch: Partial<TextLayer>) => void;
  onDelete: (id: string) => void;
}

export const TextPanel: React.FC<TextPanelProps> = ({
  layers,
  selectedId,
  onSelect,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const { locale, t } = useI18n();
  const [subTab, setSubTab] = useState<TextSubTab>('content');
  const selectedLayer = layers.find((l) => l.id === selectedId) ?? null;
  const presets = locale === 'ja' ? TEXT_PRESETS : TEXT_PRESETS_EN;

  const subTabs: {
    id: TextSubTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'content', label: t.subTabContent, icon: Type },
    { id: 'font', label: t.subTabFont, icon: Type },
    { id: 'transform', label: t.subTabTransform, icon: Sliders },
    { id: 'style', label: t.subTabStyle, icon: Palette },
  ];

  return (
    <div className="space-y-3">
      {/* Compact single-row layer switcher + Add button */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => onAdd()}
          className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-rose-500 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-rose-600 active:scale-[0.98]"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="whitespace-nowrap">{t.addText}</span>
        </button>

        {layers.map((layer, index) => {
          const active = layer.id === selectedId;
          const preview =
            layer.text.replace(/\n/g, ' ').slice(0, 10) ||
            t.textFallbackName(index + 1);
          return (
            <div
              key={layer.id}
              className={`inline-flex shrink-0 items-center gap-0.5 rounded-lg border pl-2 pr-0.5 py-0.5 text-xs font-semibold transition ${
                active
                  ? 'border-rose-500 bg-rose-50 text-rose-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(layer.id)}
                className="max-w-[96px] truncate py-0.5 text-left"
              >
                {preview}
              </button>
              <button
                type="button"
                aria-label={t.deleteTextAria}
                onClick={() => onDelete(layer.id)}
                className="rounded p-1 text-slate-400 hover:bg-rose-100 hover:text-rose-600"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Single-row horizontally scrollable preset chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onAdd(preset)}
            className="shrink-0 whitespace-nowrap rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
          >
            + {preset}
          </button>
        ))}
      </div>

      {/* Selected layer editor with 4 mini-tabs */}
      {selectedLayer ? (
        <div className="space-y-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200/80">
          {/* 4-segment mini-tab bar */}
          <div className="grid grid-cols-4 gap-1 rounded-xl bg-slate-200/70 p-1">
            {subTabs.map((tab) => {
              const Icon = tab.icon;
              const active = subTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSubTab(tab.id)}
                  className={`flex flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 text-[10px] font-bold transition ${
                    active
                      ? 'bg-white text-rose-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="truncate max-w-full px-0.5">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mini-tab 1: Content */}
          {subTab === 'content' && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  {t.textContentLabel}
                </label>
                <button
                  type="button"
                  onClick={() => onDelete(selectedLayer.id)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t.delete}
                </button>
              </div>
              <textarea
                rows={2}
                value={selectedLayer.text}
                onChange={(e) => onUpdate(selectedLayer.id, { text: e.target.value })}
                placeholder={t.textPlaceholder}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>
          )}

          {/* Mini-tab 2: Font */}
          {subTab === 'font' && (
            <div className="grid grid-cols-2 gap-2">
              {FONT_OPTIONS.map((font) => {
                const active = selectedLayer.fontId === font.id;
                return (
                  <button
                    key={font.id}
                    type="button"
                    onClick={() => onUpdate(selectedLayer.id, { fontId: font.id })}
                    className={`rounded-lg border px-2.5 py-2 text-left transition ${
                      active
                        ? 'border-rose-500 bg-rose-50 text-rose-700 ring-1 ring-rose-500'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-[11px] font-semibold opacity-75">
                      {locale === 'ja' ? font.label : font.labelEn}
                    </div>
                    <div
                      className="truncate text-sm"
                      style={{ fontFamily: font.family, fontWeight: font.weight }}
                    >
                      {locale === 'ja' ? font.sample : font.sampleEn}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Mini-tab 3: Size & Tilt */}
          {subTab === 'transform' && (
            <div className="space-y-3.5">
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>{t.fontSize}</span>
                  <span className="tabular-nums text-rose-600">{selectedLayer.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min={24}
                  max={160}
                  step={2}
                  value={selectedLayer.fontSize}
                  onChange={(e) =>
                    onUpdate(selectedLayer.id, { fontSize: parseInt(e.target.value, 10) })
                  }
                  className="w-full"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>{t.angleLabel}</span>
                  <div className="flex items-center gap-1.5">
                    {([-15, 0, 15] as const).map((deg) => (
                      <button
                        key={deg}
                        type="button"
                        onClick={() => onUpdate(selectedLayer.id, { rotation: deg })}
                        className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold transition ${
                          (selectedLayer.rotation ?? 0) === deg
                            ? 'border-rose-500 bg-rose-50 text-rose-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {deg > 0 ? `+${deg}°` : `${deg}°`}
                      </button>
                    ))}
                    <span className="ml-1 w-10 text-right tabular-nums text-rose-600">
                      {selectedLayer.rotation ?? 0}°
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  step={1}
                  value={selectedLayer.rotation ?? 0}
                  onChange={(e) =>
                    onUpdate(selectedLayer.id, { rotation: parseInt(e.target.value, 10) })
                  }
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Mini-tab 4: Color & Outline */}
          {subTab === 'style' && (
            <div className="space-y-3">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">{t.textColor}</span>
                  <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-600">
                    <input
                      type="color"
                      value={selectedLayer.color}
                      onChange={(e) => onUpdate(selectedLayer.id, { color: e.target.value })}
                      className="h-4 w-4 cursor-pointer rounded border-0 bg-transparent p-0"
                    />
                    <span className="font-mono uppercase">{selectedLayer.color}</span>
                  </label>
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {TEXT_QUICK_COLORS.map((c) => {
                    const active = selectedLayer.color.toLowerCase() === c.value.toLowerCase();
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => onUpdate(selectedLayer.id, { color: c.value })}
                        className={`flex shrink-0 whitespace-nowrap items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                          active
                            ? 'border-rose-500 bg-rose-50 text-rose-700 ring-1 ring-rose-500'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span
                          className="h-3.5 w-3.5 rounded-full border border-slate-300"
                          style={{ backgroundColor: c.value }}
                        />
                        <span>{locale === 'ja' ? c.label : c.labelEn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2.5 border-t border-slate-200 pt-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">{t.outlineLabel}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={selectedLayer.outlineEnabled}
                    onClick={() =>
                      onUpdate(selectedLayer.id, {
                        outlineEnabled: !selectedLayer.outlineEnabled,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      selectedLayer.outlineEnabled ? 'bg-rose-500' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                        selectedLayer.outlineEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {selectedLayer.outlineEnabled && (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-1 gap-1.5 overflow-x-auto pb-1">
                        {TEXT_QUICK_COLORS.map((c) => {
                          const active =
                            selectedLayer.outlineColor.toLowerCase() === c.value.toLowerCase();
                          return (
                            <button
                              key={c.value}
                              type="button"
                              onClick={() =>
                                onUpdate(selectedLayer.id, { outlineColor: c.value })
                              }
                              className={`flex shrink-0 whitespace-nowrap items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${
                                active
                                  ? 'border-rose-500 bg-rose-50 text-rose-700'
                                  : 'border-slate-200 bg-white text-slate-700'
                              }`}
                            >
                              <span
                                className="h-3 w-3 rounded-full border border-slate-300"
                                style={{ backgroundColor: c.value }}
                              />
                              <span>{locale === 'ja' ? c.label : c.labelEn}</span>
                            </button>
                          );
                        })}
                      </div>
                      <input
                        type="color"
                        aria-label={t.outlineColorAria}
                        value={selectedLayer.outlineColor}
                        onChange={(e) =>
                          onUpdate(selectedLayer.id, { outlineColor: e.target.value })
                        }
                        className="h-7 w-7 shrink-0 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
                      />
                    </div>

                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-700">
                        <span>{t.outlineWidth}</span>
                        <span className="tabular-nums text-rose-600">
                          {selectedLayer.outlineWidth}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min={2}
                        max={28}
                        step={1}
                        value={selectedLayer.outlineWidth}
                        onChange={(e) =>
                          onUpdate(selectedLayer.id, {
                            outlineWidth: parseInt(e.target.value, 10),
                          })
                        }
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-5 text-center text-xs text-slate-500">
          <Type className="mb-1.5 h-5 w-5 text-slate-400" />
          <p>{t.textEmpty1}</p>
          <p>{t.textEmpty2}</p>
        </div>
      )}
    </div>
  );
};
