import React, { useState, useEffect } from 'react';
import {
  Shield,
  FileText,
  Scale,
  Lock,
  X,
  User,
  AlertCircle,
  Sparkles,
  Camera,
  Mic,
  Bell,
  HardDrive
} from 'lucide-react';
import { APP_LEGAL, PERMISSIONS_EXPLANATION, TERMS_AND_CONDITIONS, SOFTWARE_LICENSE } from '../data/legalDocs';
import { checkPermissionsStatus, PermissionStatusSummary } from '../utils/permissionUtils';

interface LegalModalProps {
  isOpen: boolean;
  isFirstRun?: boolean;
  onAccept?: () => void;
  onClose?: () => void;
}

export default function LegalModal({
  isOpen,
  isFirstRun = false,
  onAccept,
  onClose
}: LegalModalProps) {
  const [activeTab, setActiveTab] = useState<'permissions' | 'terms' | 'license' | 'author'>('permissions');
  const [agreeNonCommercial, setAgreeNonCommercial] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [permStatus, setPermStatus] = useState<PermissionStatusSummary | null>(null);

  useEffect(() => {
    if (isOpen) {
      checkPermissionsStatus().then(setPermStatus);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isFirstRun && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFirstRun, onClose]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!agreeNonCommercial || !agreeTerms) {
      setErrorMessage('Proszę zaznaczyć obie wymagane zgody przed wejściem do programu.');
      return;
    }
    setErrorMessage('');
    if (onAccept) {
      onAccept();
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-300">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-title"
        className="bg-natural-sand rounded-3xl w-full max-w-2xl border border-natural-border shadow-2xl p-4 sm:p-6 flex flex-col space-y-4 animate-in zoom-in-95 duration-300 max-h-[94vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-natural-border/70 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl sm:text-3xl" aria-hidden="true">🐾</span>
            <div>
              <h2
                id="legal-modal-title"
                className="text-base sm:text-lg font-serif font-extrabold text-natural-dark tracking-tight leading-tight"
              >
                {APP_LEGAL.appName} • Regulamin & Licencja
              </h2>
              <p className="text-[10px] sm:text-[11px] text-natural-primary/75 font-semibold">
                {isFirstRun ? 'Wymagana akceptacja warunków przy pierwszym uruchomieniu' : 'Dokumentacja prawna i licencja oprogramowania'}
              </p>
            </div>
          </div>

          {!isFirstRun && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-natural-highlight text-natural-primary hover:text-natural-dark transition cursor-pointer"
              title="Zamknij"
              aria-label="Zamknij okno regulaminu"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Tab navigation */}
        <div className="flex p-1 bg-natural-highlight/80 rounded-2xl border border-natural-border/70 text-[11px] font-bold shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('permissions')}
            className={`flex-1 py-1.5 px-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'permissions'
                ? 'bg-white text-natural-dark shadow-2xs font-extrabold border border-natural-border/40'
                : 'text-natural-primary hover:text-natural-dark'
            }`}
          >
            <Shield size={13} className={activeTab === 'permissions' ? 'text-amber-600' : 'opacity-60'} />
            <span>Moduły i prywatność</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`flex-1 py-1.5 px-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'terms'
                ? 'bg-white text-natural-dark shadow-2xs font-extrabold border border-natural-border/40'
                : 'text-natural-primary hover:text-natural-dark'
            }`}
          >
            <FileText size={13} className={activeTab === 'terms' ? 'text-natural-secondary' : 'opacity-60'} />
            <span>Regulamin i RODO</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('license')}
            className={`flex-1 py-1.5 px-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'license'
                ? 'bg-white text-natural-dark shadow-2xs font-extrabold border border-natural-border/40'
                : 'text-natural-primary hover:text-natural-dark'
            }`}
          >
            <Scale size={13} className={activeTab === 'license' ? 'text-indigo-600' : 'opacity-60'} />
            <span>Licencja WLUP</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('author')}
            className={`py-1.5 px-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'author'
                ? 'bg-white text-natural-dark shadow-2xs font-extrabold border border-natural-border/40'
                : 'text-natural-primary hover:text-natural-dark'
            }`}
          >
            <User size={13} className={activeTab === 'author' ? 'text-emerald-700' : 'opacity-60'} />
            <span>Autor</span>
          </button>
        </div>

        {/* Scrollable Tab Content */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 bg-white/70 border border-natural-border/60 rounded-2xl p-4 shadow-2xs text-xs text-natural-primary/90">
          
          {/* TAB 1: PERMISSIONS & PRIVACY */}
          {activeTab === 'permissions' && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              
              {/* Privacy statement banner */}
              <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-serif font-bold text-natural-dark text-xs sm:text-sm flex items-center gap-1.5 text-amber-950">
                    <Shield size={16} className="text-amber-700 shrink-0" />
                    <span>{PERMISSIONS_EXPLANATION.title}</span>
                  </h3>
                  <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full font-bold shrink-0">
                    {PERMISSIONS_EXPLANATION.badge}
                  </span>
                </div>
                <p className="text-[11px] text-amber-950/85 leading-relaxed">
                  {PERMISSIONS_EXPLANATION.intro}
                </p>
              </div>

              {/* Grid of hardware and storage modules */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PERMISSIONS_EXPLANATION.items.map((item) => {
                  let statusText = item.badge;
                  if (item.id === 'camera' && permStatus) {
                    statusText = permStatus.camera === 'granted' ? 'Aktywne' : permStatus.camera === 'denied' ? 'Zablokowane' : 'Na żądanie';
                  } else if (item.id === 'microphone' && permStatus) {
                    statusText = permStatus.microphone === 'granted' ? 'Aktywne' : permStatus.microphone === 'denied' ? 'Zablokowane' : 'Na żądanie';
                  } else if (item.id === 'notifications' && permStatus) {
                    statusText = permStatus.notifications === 'granted' ? 'Włączone' : permStatus.notifications === 'denied' ? 'Zablokowane' : 'Opcjonalne';
                  }

                  return (
                    <div key={item.id} className="bg-white p-3 rounded-xl border border-natural-border/80 shadow-2xs space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-extrabold text-natural-dark text-[11px] flex items-center gap-1.5">
                          <span className="text-sm">{item.icon}</span>
                          <span>{item.name}</span>
                        </p>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-natural-highlight text-natural-dark border border-natural-border/50">
                          {statusText}
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-natural-dark/90 leading-tight pt-0.5">
                        {item.purpose}
                      </p>
                      <p className="text-[10px] text-natural-primary/75 leading-relaxed">
                        {item.details}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-natural-highlight/60 rounded-xl border border-natural-border/70 flex items-center gap-2 text-[10px] text-natural-dark font-medium">
                <Lock size={14} className="text-emerald-700 shrink-0" />
                <span>
                  Dane dziennika są zapisane wyłącznie na Twoim urządzeniu; sama aplikacja (jej pliki) jest pobierana z hostingu jak każda strona WWW.
                </span>
              </div>

              <p className="text-[10px] text-natural-primary/60 italic text-center">
                {PERMISSIONS_EXPLANATION.footer}
              </p>
            </div>
          )}

          {/* TAB 2: TERMS AND PRIVACY */}
          {activeTab === 'terms' && (
            <div className="space-y-3 font-sans leading-relaxed text-[11px] animate-in fade-in duration-200">
              <div className="border-b border-natural-border/70 pb-2">
                <h3 className="font-serif font-extrabold text-natural-dark text-sm">
                  Regulamin i Polityka Prywatności aplikacji „{APP_LEGAL.appName}”
                </h3>
                <p className="text-[10px] text-natural-primary/70">
                  Wersja {APP_LEGAL.version} • obowiązuje od {APP_LEGAL.effectiveDate}
                </p>
              </div>

              <div className="space-y-3 whitespace-pre-wrap font-sans text-natural-dark">
                {TERMS_AND_CONDITIONS.replace(/^#.*\n\n\*\*.*\*\*\n\n---\n\n/, '')}
              </div>
            </div>
          )}

          {/* TAB 3: SOFTWARE LICENSE WLUP */}
          {activeTab === 'license' && (
            <div className="space-y-3 font-sans leading-relaxed text-[11px] animate-in fade-in duration-200">
              <div className="border-b border-natural-border/70 pb-2 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                <h3 className="font-serif font-extrabold text-indigo-950 text-sm">
                  Wolna Licencja Użytku Prywatnego (Zastrzeżona) — WLUP
                </h3>
                <p className="text-[10px] text-indigo-800 font-semibold mt-0.5">
                  Projekt: {APP_LEGAL.appName} • Właściciel praw autorskich: {APP_LEGAL.author}
                </p>
                <p className="text-[9px] text-indigo-700/80 mt-0.5">
                  Copyright © {APP_LEGAL.year} {APP_LEGAL.author}. Wszelkie prawa zastrzeżone.
                </p>
              </div>

              <div className="space-y-3 whitespace-pre-wrap font-sans text-natural-dark">
                {SOFTWARE_LICENSE.replace(/^#.*\n##.*\n\n###.*\n\n\*\*.*\n\*\*.*\n\*.*\n\nKontakt.*\n\n---\n\n/, '')}
              </div>
            </div>
          )}

          {/* TAB 4: ABOUT AUTHOR */}
          {activeTab === 'author' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-base">
                    KJ
                  </div>
                  <div>
                    <h4 className="font-serif font-extrabold text-natural-dark text-sm">
                      {APP_LEGAL.author}
                    </h4>
                    <p className="text-[10px] text-natural-primary/75">
                      Autor i twórca projektu „Dziennik Pupila”
                    </p>
                  </div>
                </div>
                <p className="text-xs text-natural-primary leading-relaxed pt-1">
                  Aplikacja została zaprojektowana z miłości do zwierząt i szacunku do prywatności opiekunów, 
                  jako bezpłatne narzędzie offline chroniące dane przed komercyjnym profilowaniem.
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-natural-border space-y-1.5 text-xs text-natural-dark">
                <div className="flex justify-between items-center py-1 border-b border-natural-border/50">
                  <span className="text-natural-primary/70">Kontakt e-mail:</span>
                  <a href={`mailto:${APP_LEGAL.email}`} className="font-bold text-natural-secondary hover:underline">
                    {APP_LEGAL.email}
                  </a>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-natural-primary/70">Profil GitHub:</span>
                  <a href={`https://${APP_LEGAL.github}`} target="_blank" rel="noopener noreferrer" className="font-bold text-natural-secondary hover:underline">
                    {APP_LEGAL.github}
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer / First run acceptance checkboxes */}
        {isFirstRun ? (
          <div className="border-t border-natural-border/80 pt-3 space-y-3 shrink-0">
            {errorMessage && (
              <div className="p-2.5 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
                <AlertCircle size={14} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-2 bg-natural-highlight/60 p-3 rounded-2xl border border-natural-border/70 text-xs">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeNonCommercial}
                  onChange={(e) => setAgreeNonCommercial(e.target.checked)}
                  className="mt-0.5 rounded border-natural-border text-natural-secondary focus:ring-natural-sage cursor-pointer"
                />
                <span className="text-natural-dark font-medium leading-tight">
                  Oświadczam, że będę korzystać z programu <strong>wyłącznie w celach prywatnych i osobistych</strong> (opieka nad własnymi zwierzętami), zgodnie z Wolną Licencją Użytku Prywatnego (WLUP).
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded border-natural-border text-natural-secondary focus:ring-natural-sage cursor-pointer"
                />
                <span className="text-natural-dark font-medium leading-tight">
                  Zapoznałem(-am) się z <strong>Regulaminem, Polityką Prywatności oraz Licencją WLUP</strong> i akceptuję ich warunki w całości.
                </span>
              </label>
            </div>

            <button
              type="button"
              onClick={handleConfirm}
              className="w-full py-3 bg-natural-secondary hover:bg-natural-olive text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles size={14} />
              <span>Akceptuję warunki i przechodzę do Dziennika Pupila</span>
            </button>
          </div>
        ) : (
          <div className="border-t border-natural-border/80 pt-2 flex justify-end shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-natural-secondary hover:bg-natural-olive text-white rounded-xl text-xs font-bold shadow-2xs hover:shadow transition cursor-pointer"
            >
              Zamknij
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
