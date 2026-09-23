import React, { useState, useEffect } from 'react';
import {
  Shield,
  FileText,
  Scale,
  Camera,
  Mic,
  Bell,
  HardDrive,
  Lock,
  Check,
  X,
  ExternalLink,
  User,
  Heart,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { APP_LEGAL, PERMISSIONS_EXPLANATION, TERMS_AND_CONDITIONS, SOFTWARE_LICENSE } from '../data/legalDocs';
import { checkPermissionsStatus, requestAllPermissions, PermissionStatusSummary } from '../utils/permissionUtils';

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
  
  // Permission grant state
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);
  const [permissionSuccessNotice, setPermissionSuccessNotice] = useState<string | null>(null);
  const [permStatus, setPermStatus] = useState<PermissionStatusSummary | null>(null);

  useEffect(() => {
    if (isOpen) {
      checkPermissionsStatus().then(setPermStatus);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGrantPermissions = async () => {
    setIsRequestingPermissions(true);
    setPermissionSuccessNotice(null);
    try {
      const result = await requestAllPermissions();
      const updated = await checkPermissionsStatus();
      setPermStatus(updated);
      setPermissionSuccessNotice(result.message);
    } catch (e) {
      setPermissionSuccessNotice('Wystąpił problem przy wywołaniu zapytania o uprawnienia.');
    } finally {
      setIsRequestingPermissions(false);
    }
  };

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
      <div className="bg-natural-sand rounded-3xl w-full max-w-2xl border border-natural-border shadow-2xl p-4 sm:p-6 flex flex-col space-y-4 animate-in zoom-in-95 duration-300 max-h-[94vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-natural-border/70 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl sm:text-3xl">🐾</span>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-extrabold text-natural-dark tracking-tight leading-tight">
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
            <span>Uprawnienia urządzenia</span>
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
          
          {/* TAB 1: PERMISSIONS */}
          {activeTab === 'permissions' && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              
              {/* Sekcja aktywnego nadawania uprawnień jednym kliknięciem */}
              <div className="bg-linear-to-r from-emerald-50 via-teal-50 to-amber-50 border border-emerald-200/90 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-2xs">
                      <Sparkles size={14} />
                    </span>
                    <div>
                      <h4 className="font-serif font-extrabold text-xs sm:text-sm text-emerald-950">
                        Automatyczne nadanie uprawnień
                      </h4>
                      <p className="text-[10px] text-emerald-800">
                        Kliknij poniższy przycisk, aby przeglądarka wyświetliła zapytania i odblokowała moduły programu.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGrantPermissions}
                    disabled={isRequestingPermissions}
                    className="flex-1 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isRequestingPermissions ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Oczekiwanie na decyzję w oknie przeglądarki...</span>
                      </>
                    ) : (
                      <>
                        <Shield size={14} />
                        <span>Nadaj potrzebne uprawnienia (Aparat, Mikrofon, Powiadomienia)</span>
                      </>
                    )}
                  </button>
                </div>

                {permissionSuccessNotice && (
                  <div className="p-2.5 bg-white/90 border border-emerald-300 rounded-xl text-[10px] font-semibold text-emerald-900 flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                    <span>{permissionSuccessNotice}</span>
                  </div>
                )}
              </div>

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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PERMISSIONS_EXPLANATION.items.map((item) => (
                  <div key={item.id} className="bg-white p-3 rounded-xl border border-natural-border/80 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-extrabold text-natural-dark text-[11px] flex items-center gap-1.5">
                        <span className="text-sm">{item.icon}</span>
                        <span>{item.name}</span>
                      </p>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-natural-highlight text-natural-dark border border-natural-border/50">
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-natural-dark/90 leading-tight pt-0.5">
                      {item.purpose}
                    </p>
                    <p className="text-[10px] text-natural-primary/75 leading-relaxed">
                      {item.details}
                    </p>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-natural-highlight/60 rounded-xl border border-natural-border/70 flex items-center gap-2 text-[10px] text-natural-dark font-medium">
                <Lock size={14} className="text-emerald-700 shrink-0" />
                <span>
                  Żadne zdjęcia, notatki ani nagrania mowy <strong>nigdy nie opuszczają Twojego urządzenia</strong>. Aplikacja nie łączy się z serwerami chmurowymi.
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
                    <p className="text-[10px] text-emerald-800 font-semibold">
                      Twórca, autor i wyłączny dysponent praw autorskich
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-natural-dark leading-relaxed pt-1">
                  Program „{APP_LEGAL.appName}” został stworzony jako bezpłatne, bezpieczne narzędzie do wyłącznego użytku prywatnego dla opiekunów zwierząt domowych.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-white rounded-xl border border-natural-border/70 space-y-1">
                  <span className="text-[10px] font-bold text-natural-primary uppercase">Kontakt bezpośredni:</span>
                  <p className="font-mono text-[11px] text-natural-dark font-bold">
                    {APP_LEGAL.email}
                  </p>
                  <p className="text-[9px] text-natural-primary/70">W sprawach zapytań licencyjnych i uwag</p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-natural-border/70 space-y-1">
                  <span className="text-[10px] font-bold text-natural-primary uppercase">Profil GitHub:</span>
                  <a
                    href={`https://${APP_LEGAL.github}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-[11px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1"
                  >
                    <span>{APP_LEGAL.github}</span>
                    <ExternalLink size={11} />
                  </a>
                  <p className="text-[9px] text-natural-primary/70">Otwarte projekty i repozytoria autora</p>
                </div>
              </div>

              <div className="p-3 bg-natural-highlight/50 rounded-xl border border-natural-border/60 text-[10px] text-natural-dark flex items-center gap-2">
                <Heart size={14} className="text-red-500 shrink-0" />
                <span>
                  Dziękujemy za korzystanie z aplikacji i dbałość o zdrowie oraz szczęście Waszych czworonożnych, skrzydlatych i łuskowatych przyjaciół!
                </span>
              </div>
            </div>
          )}

        </div>

        {/* First Run Checkboxes & Validation */}
        {isFirstRun && (
          <div className="space-y-2.5 pt-1 shrink-0 border-t border-natural-border/70">
            {errorMessage && (
              <p className="text-[10px] font-bold text-red-600 bg-red-50 p-2 rounded-xl border border-red-200 flex items-center gap-1.5 animate-shake">
                <AlertCircle size={13} className="shrink-0" />
                <span>{errorMessage}</span>
              </p>
            )}

            {/* Szybki przycisk nadania uprawnień również bezpośrednio w stopce przed zatwierdzeniem */}
            <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-xl p-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-950">
                <Shield size={14} className="text-emerald-700 shrink-0" />
                <span>Nadaj uprawnienia (Aparat, Mikrofon, Alert):</span>
              </div>
              <button
                type="button"
                onClick={handleGrantPermissions}
                disabled={isRequestingPermissions}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0 disabled:opacity-50"
              >
                {isRequestingPermissions ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    <span>Zezwól w oknie...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={12} />
                    <span>Kliknij, aby nadać uprawnienia</span>
                  </>
                )}
              </button>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer select-none text-[11px] font-semibold text-natural-dark">
              <input
                type="checkbox"
                checked={agreeNonCommercial}
                onChange={(e) => {
                  setAgreeNonCommercial(e.target.checked);
                  if (errorMessage) setErrorMessage('');
                }}
                className="rounded border-natural-border text-natural-secondary focus:ring-natural-secondary mt-0.5 h-4 w-4 shrink-0 cursor-pointer"
              />
              <span className="leading-snug">
                Oświadczam, że będę używać aplikacji wyłącznie do osobistego użytku prywatnego, z poszanowaniem praw autorskich mgr. Krzysztofa Jureczka.
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer select-none text-[11px] font-semibold text-natural-dark">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => {
                  setAgreeTerms(e.target.checked);
                  if (errorMessage) setErrorMessage('');
                }}
                className="rounded border-natural-border text-natural-secondary focus:ring-natural-secondary mt-0.5 h-4 w-4 shrink-0 cursor-pointer"
              />
              <span className="leading-snug">
                Zapoznałem(-am) się i akceptuję Regulamin, Politykę Prywatności oraz warunki Wolnej Licencji Użytku Prywatnego (Zastrzeżonej) — WLUP.
              </span>
            </label>

            <div className="pt-2 flex flex-col space-y-1.5">
              <button
                type="button"
                onClick={handleConfirm}
                className="w-full py-2.5 sm:py-3 bg-natural-secondary hover:bg-natural-olive text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow transition text-center cursor-pointer flex items-center justify-center gap-2"
              >
                <Check size={16} />
                <span>Akceptuję warunki i przechodzę do programu 🐾</span>
              </button>
              <p className="text-[10px] text-center text-natural-primary/60 font-medium">
                Wszystkie dane pozostają wyłącznie w Twoim urządzeniu. Prywatność i bezpieczeństwo w 100% Offline-First.
              </p>
            </div>
          </div>
        )}

        {/* Normal View Modal Close Button */}
        {!isFirstRun && onClose && (
          <div className="pt-2 shrink-0 border-t border-natural-border/70 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-natural-secondary hover:bg-natural-olive text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Zamknij
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
