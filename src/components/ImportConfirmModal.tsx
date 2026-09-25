import React, { useState } from 'react';
import { Download, Upload, AlertCircle, RefreshCw, X, ShieldAlert } from 'lucide-react';
import { exportDatabase, importDatabase, ImportResult } from '../lib/db';

interface ImportConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: ImportResult) => void;
  onError: (errorMsg: string) => void;
}

export default function ImportConfirmModal({
  isOpen,
  onClose,
  onSuccess,
  onError,
}: ImportConfirmModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [summaryInfo, setSummaryInfo] = useState<{ pets: number; entries: number; events: number } | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [isProcessing, setIsProcessing] = useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        setFileContent(text);
        const parsed = JSON.parse(text);
        setSummaryInfo({
          pets: Array.isArray(parsed.pets) ? parsed.pets.length : 0,
          entries: Array.isArray(parsed.entries) ? parsed.entries.length : 0,
          events: Array.isArray(parsed.healthEvents) ? parsed.healthEvents.length : 0,
        });
      } catch {
        onError('Wybrany plik nie jest poprawnym plikiem JSON.');
        setSelectedFile(null);
        setFileContent(null);
        setSummaryInfo(null);
      }
    };
    reader.readAsText(file);
  };

  const handleProceedImport = async () => {
    if (!fileContent) return;
    setIsProcessing(true);

    try {
      // 1. Zrób automatyczną kopię ratunkową obecnego stanu
      try {
        const rescueJson = await exportDatabase();
        const rescueBlob = new Blob([rescueJson], { type: 'application/json' });
        const rescueUrl = URL.createObjectURL(rescueBlob);
        const a = document.createElement('a');
        a.href = rescueUrl;
        a.download = `dziennik-pupila-kopia-ratunkowa-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(rescueUrl);
      } catch (backupErr) {
        console.warn('Nie udało się utworzyć kopii ratunkowej:', backupErr);
      }

      // 2. Wykonaj import
      const result = await importDatabase(fileContent, importMode);
      onSuccess(result);
      onClose();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Wystąpił błąd podczas importu danych.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-modal-title"
        className="bg-natural-cream max-w-lg w-full rounded-3xl border border-natural-border shadow-2xl p-6 space-y-5"
      >
        <div className="flex items-center justify-between border-b border-natural-border/70 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-natural-sage/20 text-natural-secondary flex items-center justify-center">
              <Upload size={18} />
            </div>
            <h3 id="import-modal-title" className="text-base font-serif font-bold text-natural-dark">
              Przywracanie kopii zapasowej
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-natural-primary/50 hover:bg-natural-highlight hover:text-natural-dark transition cursor-pointer"
            aria-label="Zamknij okno importu"
          >
            <X size={18} />
          </button>
        </div>

        {!selectedFile ? (
          <div className="space-y-4">
            <p className="text-xs text-natural-primary/80 leading-relaxed">
              Wybierz plik kopii zapasowej (format <code>.json</code>) pobrany wcześniej z tej aplikacji lub z innego urządzenia.
            </p>
            <label className="border-2 border-dashed border-natural-border hover:border-natural-sage rounded-2xl p-8 flex flex-col items-center justify-center gap-2 bg-white cursor-pointer transition group">
              <Upload size={28} className="text-natural-secondary group-hover:scale-110 transition" />
              <span className="text-xs font-bold text-natural-dark">Kliknij, aby wybrać plik .json</span>
              <span className="text-[10px] text-natural-primary/60">Maksymalny rozmiar zalecany do kilkunastu megabajtów</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3.5 bg-white rounded-2xl border border-natural-border space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-natural-dark truncate">{selectedFile.name}</span>
                <span className="text-[10px] text-natural-primary/60 font-mono">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </span>
              </div>
              {summaryInfo && (
                <p className="text-[11px] text-natural-primary/75">
                  Wykryto: <strong>{summaryInfo.pets}</strong> zwierząt, <strong>{summaryInfo.entries}</strong> wpisów, <strong>{summaryInfo.events}</strong> zdarzeń kalendarza.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-serif font-bold text-natural-dark">
                Wybierz tryb przywracania:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setImportMode('merge')}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    importMode === 'merge'
                      ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950'
                      : 'bg-white border-natural-border text-natural-primary hover:bg-natural-highlight'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    <span>Scal z obecnymi danymi</span>
                  </div>
                  <p className="text-[10px] opacity-75 mt-1 leading-snug">
                    Zalecane. Nie usuwa Twoich obecnych zwierząt ani wpisów, dopisuje nowe i aktualizuje istniejące.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setImportMode('replace')}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    importMode === 'replace'
                      ? 'bg-red-50/80 border-red-500 ring-2 ring-red-500/20 text-red-950'
                      : 'bg-white border-natural-border text-natural-primary hover:bg-natural-highlight'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5 text-red-800">
                    <ShieldAlert size={14} className="shrink-0" />
                    <span>Zastąp całą bazę</span>
                  </div>
                  <p className="text-[10px] opacity-75 mt-1 leading-snug">
                    Usuwa dotychczasowe dane i wgrywa dokładnie stan z pliku.
                  </p>
                </button>
              </div>
            </div>

            <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-start gap-2 text-[11px] text-amber-900">
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-700" />
              <p className="leading-relaxed">
                Przed zaimportowaniem aplikacja automatycznie pobierze na Twój dysk <strong>kopię ratunkową</strong> obecnych danych na wypadek, gdybyś chciał cofnąć operację.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setFileContent(null);
                  setSummaryInfo(null);
                }}
                disabled={isProcessing}
                className="flex-1 py-2.5 px-4 border border-natural-border hover:bg-natural-highlight rounded-xl text-xs font-semibold text-natural-primary transition cursor-pointer disabled:opacity-50"
              >
                Wybierz inny plik
              </button>
              <button
                type="button"
                onClick={handleProceedImport}
                disabled={isProcessing}
                className="flex-1 py-2.5 px-4 bg-natural-secondary hover:bg-natural-olive text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Importowanie...</span>
                  </>
                ) : (
                  <>
                    <Upload size={13} />
                    <span>Potwierdź import</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
