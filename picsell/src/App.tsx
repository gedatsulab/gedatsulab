import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Crop,
  Download,
  ImagePlus,
  SlidersHorizontal,
  Type,
  Upload,
} from 'lucide-react';
import { CanvasPreview } from './components/CanvasPreview';
import { ExportPanel } from './components/ExportPanel';
import { FilterPanel } from './components/FilterPanel';
import { ResizePanel } from './components/ResizePanel';
import { TextPanel } from './components/TextPanel';
import { useI18n } from './i18n';
import {
  DEFAULT_FILTERS,
  DEFAULT_RESIZE,
  EditorTab,
  FilterSettings,
  LoadedImage,
  OUTPUT_SIZE,
  ResizeSettings,
  TextLayer,
} from './types';
import { loadAndDownsampleImage } from './utils/imageLoader';

export function App() {
  const { locale, setLocale, t } = useI18n();

  const tabs: { id: EditorTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'resize', label: t.tabResize, icon: Crop },
    { id: 'filter', label: t.tabFilter, icon: SlidersHorizontal },
    { id: 'text', label: t.tabText, icon: Type },
    { id: 'export', label: t.tabExport, icon: Download },
  ];
  const [loadedImage, setLoadedImage] = useState<LoadedImage | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDropActive, setIsDropActive] = useState(false);

  const [activeTab, setActiveTab] = useState<EditorTab>('resize');
  const [resize, setResize] = useState<ResizeSettings>(DEFAULT_RESIZE);
  const [filters, setFilters] = useState<FilterSettings>(DEFAULT_FILTERS);
  const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [fontsReadyTick, setFontsReadyTick] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    if ('fonts' in document) {
      document.fonts.ready.then(() => {
        if (!cancelled) setFontsReadyTick((t) => t + 1);
      });
      const onDone = () => {
        if (!cancelled) setFontsReadyTick((t) => t + 1);
      };
      document.fonts.addEventListener('loadingdone', onDone);
      return () => {
        cancelled = true;
        document.fonts.removeEventListener('loadingdone', onDone);
      };
    }
    return undefined;
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await loadAndDownsampleImage(file);
      setLoadedImage(result);
      setResize(DEFAULT_RESIZE);
      setFilters(DEFAULT_FILTERS);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t.loadError);
    } finally {
      setLoading(false);
    }
  }, [t.loadError]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    e.target.value = '';
  };

  const handleAddText = (initialText = t.defaultAddedText) => {
    const id = `txt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const offset = (textLayers.length % 4) * 55;
    const newLayer: TextLayer = {
      id,
      text: initialText,
      x: OUTPUT_SIZE / 2,
      y: Math.min(OUTPUT_SIZE - 120, 180 + offset),
      fontId: 'gothic',
      fontSize: 72,
      rotation: 0,
      color: '#FFFFFF',
      outlineEnabled: true,
      outlineColor: '#EF4444',
      outlineWidth: 12,
    };
    setTextLayers((prev) => [...prev, newLayer]);
    setSelectedTextId(id);
    setActiveTab('text');
  };

  const handleUpdateText = (id: string, patch: Partial<TextLayer>) => {
    setTextLayers((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const handleDeleteText = (id: string) => {
    setTextLayers((prev) => prev.filter((l) => l.id !== id));
    setSelectedTextId((curr) => (curr === id ? null : curr));
  };

  const handleSelectTextOnCanvas = (id: string | null) => {
    setSelectedTextId(id);
    if (id !== null) {
      setActiveTab('text');
    }
  };

  const handleMoveText = (id: string, x: number, y: number) => {
    setTextLayers((prev) => prev.map((l) => (l.id === id ? { ...l, x, y } : l)));
  };

  const handlePanCrop = (cropOffsetX: number, cropOffsetY: number) => {
    setResize((prev) => ({ ...prev, cropOffsetX, cropOffsetY }));
  };

  const iconSrc = `${import.meta.env.BASE_URL}icon.svg`;

  return (
    <div className="min-h-dvh flex flex-col bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <img src={iconSrc} alt="PicSell" className="h-8 w-8 rounded-lg shadow-xs" />
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-slate-900 leading-none">
                PicSell
              </h1>
              <p className="mt-0.5 text-[11px] font-medium text-slate-500 leading-none">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />

          <div className="flex items-center gap-2">
            {loadedImage && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
              >
                <ImagePlus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t.changePhoto}</span>
                <span className="sm:hidden">{locale === 'ja' ? '写真変更' : 'Change'}</span>
              </button>
            )}

            <div
              role="group"
              aria-label="Language"
              className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-0.5 text-[11px] font-bold"
            >
              <button
                type="button"
                onClick={() => setLocale('ja')}
                className={`rounded-full px-2.5 py-1 transition ${
                  locale === 'ja'
                    ? 'bg-white text-rose-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                JA
              </button>
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={`rounded-full px-2.5 py-1 transition ${
                  locale === 'en'
                    ? 'bg-white text-rose-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-3 py-4 sm:px-6 sm:py-6">
        {errorMsg && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {errorMsg}
          </div>
        )}

        {!loadedImage ? (
          <div className="mx-auto mt-4 max-w-xl sm:mt-10">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDropActive(true);
              }}
              onDragLeave={() => setIsDropActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDropActive(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleFile(file);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-3xl border-2 border-dashed p-8 text-center transition sm:p-12 ${
                isDropActive
                  ? 'border-rose-500 bg-rose-50/80'
                  : 'border-slate-300 bg-white hover:border-rose-400 hover:bg-rose-50/30'
              } shadow-sm`}
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-500">
                <Upload className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-extrabold text-slate-900">
                {loading ? t.optimizingImage : t.selectPhotoHeading}
              </h2>
              <p className="mt-2 text-sm text-slate-500">{t.selectPhotoSub}</p>

              <button
                type="button"
                disabled={loading}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-rose-500 px-6 py-3 text-sm font-bold text-white shadow-md shadow-rose-500/20 transition hover:bg-rose-600 disabled:opacity-50"
              >
                <ImagePlus className="h-4 w-4" />
                <span>{t.openFiles}</span>
              </button>

              <div className="mt-8 grid grid-cols-3 gap-2 border-t border-slate-100 pt-5 text-left text-[11px] text-slate-500">
                <div className="rounded-xl bg-slate-50 p-2.5">
                  <div className="font-bold text-slate-700">{t.featureLocalTitle}</div>
                  <div className="mt-0.5">{t.featureLocalDesc}</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5">
                  <div className="font-bold text-slate-700">{t.featureSquareTitle}</div>
                  <div className="mt-0.5">{t.featureSquareDesc}</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5">
                  <div className="font-bold text-slate-700">{t.featureTextTitle}</div>
                  <div className="mt-0.5">{t.featureTextDesc}</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-8">
            {/* Preview Canvas (Top on mobile, Left sticky on desktop) */}
            <div className="lg:sticky lg:top-20">
              <CanvasPreview
                loadedImage={loadedImage}
                resize={resize}
                filters={filters}
                textLayers={textLayers}
                selectedTextId={selectedTextId}
                fontsReadyTick={fontsReadyTick}
                onSelectText={handleSelectTextOnCanvas}
                onMoveText={handleMoveText}
                onPanCrop={handlePanCrop}
                onDropFile={handleFile}
              />
            </div>

            {/* Editor Controls */}
            <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80 overflow-hidden">
              {/* Tab Bar */}
              <div className="grid grid-cols-4 border-b border-slate-200 bg-slate-50/60">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex flex-col items-center justify-center gap-1 py-3 text-[11px] font-bold transition border-b-2 ${
                        active
                          ? 'border-rose-500 bg-white text-rose-600'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Active Tab Panel */}
              <div className="p-4 sm:p-5">
                {activeTab === 'resize' && (
                  <ResizePanel resize={resize} onChange={setResize} />
                )}
                {activeTab === 'filter' && (
                  <FilterPanel filters={filters} onChange={setFilters} />
                )}
                {activeTab === 'text' && (
                  <TextPanel
                    layers={textLayers}
                    selectedId={selectedTextId}
                    onSelect={setSelectedTextId}
                    onAdd={handleAddText}
                    onUpdate={handleUpdateText}
                    onDelete={handleDeleteText}
                  />
                )}
                {activeTab === 'export' && (
                  <ExportPanel
                    loadedImage={loadedImage}
                    resize={resize}
                    filters={filters}
                    textLayers={textLayers}
                  />
                )}
              </div>
            </section>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200/80 bg-white/70 py-3 text-center text-xs text-slate-500">
        Copyright 2026 Gedatsu Lab
      </footer>
    </div>
  );
}

export default App;
