import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Pet, DiaryEntry, HealthEvent } from './types';
import {
  getPets,
  savePet,
  deletePet,
  getEntriesByPet,
  saveEntry,
  deleteEntry,
  getHealthEvents,
  saveHealthEvent,
  saveHealthEventsBatch,
  deleteHealthEvent as deleteHealthEventDB,
  deleteHealthEventsByGroup,
  exportDatabase,
  getStorageEstimate,
  ImportResult,
} from './lib/db';
import { getSpeciesEmoji, calculateAgeInPolish, getSpeciesLabel } from './utils';
import { extendForeverSeries, formatDateToYMD } from './lib/recurrence';
import { APP_LEGAL } from './data/legalDocs';
import { safeStorage } from './lib/storage';
import PetManager from './components/PetManager';
import NoteEditor from './components/NoteEditor';
import NoteList from './components/NoteList';
import {
  Heart,
  Plus,
  Settings,
  Download,
  Upload,
  BookOpen,
  Calendar,
  AlertCircle,
  FolderSync,
  X,
  FileText,
  User,
  HeartCrack,
  HelpCircle,
  Sparkles,
  Mic,
  Activity,
  Image as ImageIcon,
  Camera,
  Bell,
  Shield,
  DownloadCloud
} from 'lucide-react';

// Lazy-loaded components for optimal bundle size and zero Rollup warnings
const HealthCalendar = lazy(() => import('./components/HealthCalendar'));
const WeightChart = lazy(() => import('./components/WeightChart'));
const LegalModal = lazy(() => import('./components/LegalModal'));
const PhotoGallery = lazy(() => import('./components/PhotoGallery'));
const ImportConfirmModal = lazy(() => import('./components/ImportConfirmModal'));

export default function App() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [activePetId, setActivePetId] = useState<string | undefined>(undefined);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [healthEvents, setHealthEvents] = useState<HealthEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'notes' | 'gallery'>('notes');

  // Storage estimation state
  const [storageEstimate, setStorageEstimate] = useState<{
    usageMB: number;
    quotaMB: number;
  } | null>(null);

  // PWA install prompt & update available states
  const [pwaUpdateAvailable, setPwaUpdateAvailable] = useState<(() => void) | null>(null);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);

  // Regulamin i licencja - weryfikacja wersji zgody
  const [termsAccepted, setTermsAccepted] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('DziennikPupila_termsAccepted');
      if (!stored) return false;
      try {
        const parsed = JSON.parse(stored);
        return parsed.version === APP_LEGAL.version;
      } catch {
        return false;
      }
    }
    return true;
  });

  // View States
  const [isPetManagerOpen, setIsPetManagerOpen] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | 'new' | null>(null);

  // Backup & Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Refresh storage estimate
  const refreshStorage = async () => {
    try {
      const est = await getStorageEstimate();
      setStorageEstimate(est);
    } catch {
      // ignore
    }
  };

  // Sync active forever series and dispatch reminders
  const handleSyncAndReminders = async (currentEvents: HealthEvent[]) => {
    try {
      // 1. Extend active forever series (sliding window 90 days ahead)
      const todayStr = formatDateToYMD(new Date());
      const newEvents = extendForeverSeries(currentEvents, todayStr, 90);
      let allEvents = currentEvents;
      if (newEvents.length > 0) {
        await saveHealthEventsBatch(newEvents);
        allEvents = await getHealthEvents();
        setHealthEvents(allEvents);
      }

      // 2. Check and trigger local SW notifications for today / overdue tasks
      if (
        typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        const cacheKey = `DziennikPupila_notified_${todayStr}`;
        const notifiedRaw = safeStorage.getItem(cacheKey);
        const notifiedIds = new Set<string>(notifiedRaw ? JSON.parse(notifiedRaw) : []);

        const pendingEvents = allEvents.filter((e) => !e.isCompleted && e.date <= todayStr);
        for (const ev of pendingEvents) {
          if (notifiedIds.has(ev.id)) continue;
          try {
            const reg = await navigator.serviceWorker.ready;
            const isOverdue = ev.date < todayStr;
            const title = isOverdue
              ? `⚠️ Zaległe zadanie: ${ev.title}`
              : `🔔 Przypomnienie na dziś: ${ev.title}`;
            const body = ev.time
              ? `Godzina: ${ev.time}${ev.notes ? ` • ${ev.notes}` : ''}`
              : ev.notes || 'Sprawdź szczegóły w terminarzu zdrowia.';

            await reg.showNotification(title, {
              body,
              icon: './pwa-192.png',
              badge: './pwa-192.png',
              tag: `pupil_reminder_${ev.id}_${todayStr}`,
              data: { eventId: ev.id, date: ev.date },
            });
            notifiedIds.add(ev.id);
          } catch (notifErr) {
            console.warn('Błąd powiadomienia SW:', notifErr);
          }
        }
        safeStorage.setItem(cacheKey, JSON.stringify(Array.from(notifiedIds)));
      }
    } catch (err) {
      console.warn('Błąd synchronizacji serii lub powiadomień:', err);
    }
  };

  // Load pets and initial data on startup
  useEffect(() => {
    async function loadInitialData() {
      try {
        const loadedPets = await getPets();
        setPets(loadedPets);

        // Retrieve active pet from localStorage, fallback to first pet
        const cachedPetId = localStorage.getItem('DziennikPupila_activePetId');
        if (cachedPetId && loadedPets.some((p) => p.id === cachedPetId)) {
          setActivePetId(cachedPetId);
        } else if (loadedPets.length > 0) {
          setActivePetId(loadedPets[0].id);
        } else {
          setActivePetId(undefined);
        }

        const events = await getHealthEvents();
        setHealthEvents(events);
        await handleSyncAndReminders(events);
        await refreshStorage();
      } catch (err) {
        console.error('Błąd inicjalizacji bazy danych offline:', err);
      }
    }

    loadInitialData();
  }, []);

  // Listen to visibilitychange (tab foregrounded) and update SW / reminders
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        getHealthEvents().then((evs) => handleSyncAndReminders(evs));
        refreshStorage();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // PWA update prompt listener
  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<{ reload: () => void }>;
      if (custom.detail && typeof custom.detail.reload === 'function') {
        setPwaUpdateAvailable(() => custom.detail.reload);
      }
    };
    window.addEventListener('pwa-update-available', handler);
    return () => window.removeEventListener('pwa-update-available', handler);
  }, []);

  // In-app PWA install prompt handler
  useEffect(() => {
    const handleInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setDeferredInstallPrompt(null);
    }
  };

  // Keyboard Esc listener for dialog accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showHelpModal) setShowHelpModal(false);
        else if (showSettings) setShowSettings(false);
        else if (isPetManagerOpen) setIsPetManagerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showHelpModal, showSettings, isPetManagerOpen]);

  // Fetch entries when activePetId changes
  useEffect(() => {
    async function loadEntries() {
      if (!activePetId) {
        setEntries([]);
        return;
      }
      try {
        const loadedEntries = await getEntriesByPet(activePetId);
        setEntries(loadedEntries);
      } catch (err) {
        console.error('Błąd ładowania wpisów:', err);
      }
    }

    loadEntries();
  }, [activePetId]);

  // Quick flash triggers for success messages
  const triggerSuccessAlert = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3500);
  };

  // Switch pet
  const handleSelectPet = (id: string) => {
    setActivePetId(id);
    localStorage.setItem('DziennikPupila_activePetId', id);
    setEditingEntry(null);
  };

  // Pet CRUD Operations
  const handleAddPet = async (petData: Omit<Pet, 'id' | 'createdAt'>) => {
    const now = Date.now();
    const newPet: Pet = {
      ...petData,
      id: `${now.toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
    };
    await savePet(newPet);
    const updatedPets = await getPets();
    setPets(updatedPets);
    setActivePetId(newPet.id);
    localStorage.setItem('DziennikPupila_activePetId', newPet.id);
    setIsPetManagerOpen(false);
    triggerSuccessAlert(`Dodano profil zwierzaka: ${newPet.name}!`);
    refreshStorage();
  };

  const handleUpdatePet = async (pet: Pet) => {
    await savePet(pet);
    const updatedPets = await getPets();
    setPets(updatedPets);
    setIsPetManagerOpen(false);
    triggerSuccessAlert(`Zaktualizowano profil: ${pet.name}!`);
    refreshStorage();
  };

  const handleDeletePet = async (id: string) => {
    const petToDelete = pets.find((p) => p.id === id);
    await deletePet(id);
    const updatedPets = await getPets();
    setPets(updatedPets);

    if (activePetId === id) {
      if (updatedPets.length > 0) {
        setActivePetId(updatedPets[0].id);
        localStorage.setItem('DziennikPupila_activePetId', updatedPets[0].id);
      } else {
        setActivePetId(undefined);
        localStorage.removeItem('DziennikPupila_activePetId');
      }
    }

    const updatedEvents = await getHealthEvents();
    setHealthEvents(updatedEvents);
    triggerSuccessAlert(`Usunięto profil: ${petToDelete?.name || ''}`);
    refreshStorage();
  };

  // Diary Entry CRUD
  const handleSaveEntry = async (entryData: DiaryEntry) => {
    await saveEntry(entryData);
    if (activePetId) {
      const loadedEntries = await getEntriesByPet(activePetId);
      setEntries(loadedEntries);
    }
    setEditingEntry(null);
    triggerSuccessAlert('Wpis został bezpiecznie zapisany w pamięci urządzenia!');
    refreshStorage();
  };

  const handleDeleteEntry = async (id: string) => {
    await deleteEntry(id);
    if (activePetId) {
      const loadedEntries = await getEntriesByPet(activePetId);
      setEntries(loadedEntries);
    }
    triggerSuccessAlert('Wpis został usunięty.');
    refreshStorage();
  };

  // Health Event CRUD
  const handleAddHealthEvents = async (
    eventsData: Array<Omit<HealthEvent, 'id' | 'petId' | 'createdAt' | 'isCompleted'>>
  ) => {
    if (!activePetId || eventsData.length === 0) return;
    const now = Date.now();
    const newEvents: HealthEvent[] = eventsData.map((data, idx) => ({
      ...data,
      id: `${now.toString(36)}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      petId: activePetId,
      isCompleted: false,
      createdAt: now + idx,
    }));
    await saveHealthEventsBatch(newEvents);
    const updated = await getHealthEvents();
    setHealthEvents(updated);
    if (newEvents.length > 1) {
      triggerSuccessAlert(`Zaplanowano ${newEvents.length} powtórzeń zadania: ${newEvents[0].title}!`);
    } else {
      triggerSuccessAlert(`Zaplanowano zadanie: ${newEvents[0].title}!`);
    }
    refreshStorage();
  };

  const handleAddHealthEvent = async (eventData: Omit<HealthEvent, 'id' | 'petId' | 'createdAt' | 'isCompleted'>) => {
    await handleAddHealthEvents([eventData]);
  };

  const handleToggleHealthEventComplete = async (id: string) => {
    const target = healthEvents.find((e) => e.id === id);
    if (!target) return;
    const updatedEvent: HealthEvent = { ...target, isCompleted: !target.isCompleted };
    await saveHealthEvent(updatedEvent);
    const updatedList = await getHealthEvents();
    setHealthEvents(updatedList);
    if (updatedEvent.isCompleted) {
      triggerSuccessAlert(`Wykonano wydarzenie: ${target.title}!`);
    } else {
      triggerSuccessAlert(`Oznaczono jako nadchodzące: ${target.title}`);
    }
  };

  const handleDeleteHealthEvent = async (id: string, deleteSeries = false) => {
    const targetEvent = healthEvents.find((e) => e.id === id);
    if (!targetEvent) return;

    if (deleteSeries && targetEvent.recurrenceGroupId) {
      const count = await deleteHealthEventsByGroup(targetEvent.recurrenceGroupId);
      const updatedList = await getHealthEvents();
      setHealthEvents(updatedList);
      triggerSuccessAlert(`Usunięto całą serię powtórzeń (${count} zadań).`);
    } else {
      await deleteHealthEventDB(id);
      const updatedList = await getHealthEvents();
      setHealthEvents(updatedList);
      triggerSuccessAlert('Usunięto zadanie z terminarza.');
    }
    refreshStorage();
  };

  // Export full JSON Backup
  const handleExportBackup = async () => {
    try {
      const jsonString = await exportDatabase();
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dziennik-pupila-kopia-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      triggerSuccessAlert('Kopia zapasowa pobrana pomyślnie!');
    } catch (e) {
      console.error('Błąd eksportu bazy:', e);
      triggerSuccessAlert('Nie udało się wyeksportować kopii.');
    }
  };

  // Handle successful import from ImportConfirmModal
  const handleImportSuccess = async (result: ImportResult) => {
    try {
      const loadedPets = await getPets();
      setPets(loadedPets);

      if (loadedPets.length > 0) {
        if (activePetId && loadedPets.some((p) => p.id === activePetId)) {
          // preserve active pet
        } else {
          setActivePetId(loadedPets[0].id);
          localStorage.setItem('DziennikPupila_activePetId', loadedPets[0].id);
        }
      } else {
        setActivePetId(undefined);
      }

      const loadedEvents = await getHealthEvents();
      setHealthEvents(loadedEvents);

      if (activePetId) {
        const loadedEntries = await getEntriesByPet(activePetId);
        setEntries(loadedEntries);
      }

      setShowSettings(false);
      triggerSuccessAlert(result.message || 'Kopia zapasowa przywrócona pomyślnie!');
      refreshStorage();
    } catch (e) {
      console.error('Błąd po imporcie bazy:', e);
      triggerSuccessAlert('Zaimportowano dane, odśwież widok.');
    }
  };

  const activePet = pets.find((p) => p.id === activePetId);

  return (
    <div className="min-h-screen bg-natural-sand flex flex-col justify-between select-none">
      
      {/* PWA Update Notification Banner */}
      {pwaUpdateAvailable && (
        <div className="bg-emerald-700 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between shadow-md sticky top-0 z-50 animate-in slide-in-from-top">
          <span>Dostępna nowa wersja aplikacji — zaktualizuj, aby cieszyć się nowymi funkcjami!</span>
          <button
            type="button"
            onClick={() => pwaUpdateAvailable()}
            className="ml-3 px-3 py-1 bg-white text-emerald-900 rounded-lg text-xs font-extrabold hover:bg-natural-highlight transition cursor-pointer shrink-0"
          >
            Odśwież
          </button>
        </div>
      )}

      {/* Top Header Navbar */}
      <header className="bg-natural-cream border-b border-natural-border sticky top-0 z-40 px-4 py-3 sm:px-6 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo & Headline */}
          <div className="flex items-center gap-2">
            <div className="bg-natural-sage p-2 rounded-2xl text-white shadow-sm">
              <Heart size={20} className="fill-white" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-serif font-bold text-natural-dark tracking-tight leading-none flex items-center gap-1.5">
                Pamiętnik Pupila
                <span className="text-[10px] bg-natural-highlight text-natural-secondary font-bold px-1.5 py-0.5 rounded-full uppercase border border-natural-border font-mono">
                  Offline
                </span>
              </h1>
              <p className="text-[10px] sm:text-xs text-natural-primary/70 font-medium">Cyfrowy dziennik Twoich zwierzaków</p>
            </div>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center gap-2">
            
            {deferredInstallPrompt && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 font-semibold text-xs text-white rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Zainstaluj aplikację na urządzeniu"
                aria-label="Zainstaluj aplikację na urządzeniu"
              >
                <DownloadCloud size={14} />
                <span className="hidden sm:inline">Zainstaluj aplikację</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsPetManagerOpen(true)}
              className="px-3 py-1.5 border border-natural-border hover:bg-natural-highlight font-semibold text-xs text-natural-primary bg-natural-cream rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Zarządzaj zwierzakami"
              aria-label="Zarządzaj zwierzakami"
            >
              <User size={14} className="text-natural-secondary" />
              <span className="hidden md:inline">Zarządzaj zwierzakami</span>
            </button>

            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="px-3 py-1.5 border border-natural-border hover:bg-natural-highlight font-semibold text-xs text-natural-primary bg-natural-cream rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Pomoc i o programie"
              aria-label="Centrum pomocy i informacje o programie"
            >
              <HelpCircle size={14} className="text-natural-secondary" />
              <span className="hidden md:inline">Pomoc i opis</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowSettings(!showSettings);
                refreshStorage();
              }}
              className="p-2 border border-natural-border hover:bg-natural-highlight text-natural-primary bg-natural-cream rounded-xl transition shadow-xs cursor-pointer"
              title="Kopia zapasowa / Ustawienia"
              aria-label="Ustawienia i kopia zapasowa"
            >
              <Settings size={15} />
            </button>

          </div>

        </div>
      </header>

      {/* Main Viewport Content Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 space-y-6">
        
        {/* Real-time Toast Notify */}
        {successMessage && (
          <div className="bg-natural-dark text-natural-cream px-4 py-3 rounded-2xl shadow-lg border border-natural-olive/30 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-3 max-w-md mx-auto sticky top-16 z-50">
            <span className="text-natural-secondary">●</span>
            {successMessage}
          </div>
        )}

        {/* Dynamic settings container (backup manager) */}
        {showSettings && (
          <section
            role="region"
            aria-labelledby="settings-drawer-title"
            className="bg-natural-cream p-5 rounded-3xl border border-natural-border shadow-sm space-y-4 animate-in slide-in-from-top-4 duration-250"
          >
            <div className="flex items-center justify-between border-b border-natural-border pb-2">
              <h3 id="settings-drawer-title" className="text-sm font-bold text-natural-dark flex items-center gap-1.5">
                <FolderSync size={16} className="text-natural-secondary" />
                Dyrektor Kopia Zapasowa (Offline Backup)
              </h3>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="p-1 rounded-lg text-natural-primary/50 hover:bg-natural-highlight hover:text-natural-dark transition cursor-pointer"
                aria-label="Zamknij ustawienia"
              >
                <X size={16} />
              </button>
            </div>
            
            <p className="text-xs text-natural-primary/80 leading-relaxed max-w-2xl">
              Twój pamiętnik działa w 100% lokalnie w przeglądarce. Dane dziennika są zapisane wyłącznie na Twoim urządzeniu; sama aplikacja (jej pliki) jest pobierana z hostingu jak każda strona WWW. Aby przenieść dziennik na inne urządzenie (np. z telefonu na tablet) lub zapisać na komputerze, pobierz plik kopii zapasowej.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              
              {/* Export backup button */}
              <button
                type="button"
                onClick={handleExportBackup}
                className="px-4 py-2 bg-natural-sage hover:bg-natural-olive text-white rounded-xl text-xs font-bold shadow-sm hover:shadow transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={13} />
                Pobierz kopię zapasową (.json)
              </button>

              {/* Import backup button */}
              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                className="cursor-pointer px-4 py-2 border border-natural-border bg-natural-highlight hover:bg-natural-border text-natural-primary font-semibold text-xs rounded-xl shadow-xs transition inline-flex items-center gap-1.5"
              >
                <Upload size={13} />
                Przywróć dane z pliku kopii
              </button>

            </div>

            {/* Permissions & Privacy Card */}
            <div className="pt-2 border-t border-natural-border/70 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-natural-dark flex items-center gap-1.5">
                  <Shield size={14} className="text-natural-secondary" />
                  Moduły urządzenia i pamięć lokalna
                </h4>
                <span className="text-[10px] text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full font-bold">
                  {storageEstimate && storageEstimate.quotaMB > 0
                    ? `IDB: ${storageEstimate.usageMB} MB z ~${storageEstimate.quotaMB} MB`
                    : 'IDB Storage: dostępne'}
                </span>
              </div>
              <p className="text-[11px] text-natural-primary/80 leading-relaxed">
                Aplikacja korzysta z modułów urządzenia wyłącznie lokalnie w celu usprawnienia opieki nad pupilem:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-white rounded-xl border border-natural-border/70 space-y-0.5">
                  <div className="flex items-center gap-1.5 font-bold text-natural-dark text-[11px]">
                    <Camera size={13} className="text-natural-secondary" />
                    <span>Aparat fotograficzny</span>
                  </div>
                  <p className="text-[10px] text-natural-primary/75 leading-tight">
                    Robienie zdjęć pupila na żywo, fotografowanie karmy, objawów, wagi i zaleceń weterynaryjnych.
                  </p>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-natural-border/70 space-y-0.5">
                  <div className="flex items-center gap-1.5 font-bold text-natural-dark text-[11px]">
                    <Mic size={13} className="text-red-600" />
                    <span>Mikrofon (Web Speech)</span>
                  </div>
                  <p className="text-[10px] text-natural-primary/75 leading-tight">
                    Dyktowanie głosowe wpisów po polsku bez dotykania klawiatury. Mowa jest zamieniana na tekst przez wbudowany mechanizm przeglądarki. W niektórych przeglądarkach (np. Chrome) to przetwarzanie może odbywać się w chmurze dostawcy przeglądarki, a nie lokalnie na urządzeniu — to nie jest serwer aplikacji ani jej autora.
                  </p>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-natural-border/70 space-y-0.5">
                  <div className="flex items-center gap-1.5 font-bold text-natural-dark text-[11px]">
                    <Bell size={13} className="text-amber-600" />
                    <span>Przypomnienia lokalne</span>
                  </div>
                  <p className="text-[10px] text-natural-primary/75 leading-tight">
                    Przypomnienia o lekach, szczepieniach, odrobaczeniach i obowiązkach z terminarza po otwarciu aplikacji.
                  </p>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-natural-border/70 space-y-0.5">
                  <div className="flex items-center gap-1.5 font-bold text-natural-dark text-[11px]">
                    <FolderSync size={13} className="text-blue-600" />
                    <span>Baza danych IndexedDB</span>
                  </div>
                  <p className="text-[10px] text-natural-primary/75 leading-tight">
                    Trwały i prywatny zapis wpisów, profili oraz rysunków w pamięci Twojego komputera lub telefonu.
                  </p>
                </div>
              </div>

              {/* View Legal modal trigger from settings */}
              <div className="pt-2 flex justify-between items-center text-xs">
                <span className="text-[11px] text-natural-primary/70">
                  Dokumenty prawne i licencja WLUP:
                </span>
                <button
                  type="button"
                  onClick={() => setShowLegalModal(true)}
                  className="text-xs font-bold text-natural-secondary hover:underline cursor-pointer flex items-center gap-1"
                >
                  <FileText size={12} />
                  <span>Zobacz Regulamin i Licencję WLUP</span>
                </button>
              </div>

            </div>

          </section>
        )}

        {/* Pet Profiles Bar - Multi-pet Switcher */}
        {pets.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {pets.map((p) => {
              const isSelected = p.id === activePetId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPet(p.id)}
                  aria-pressed={isSelected}
                  className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border transition-all shrink-0 cursor-pointer shadow-2xs ${
                    isSelected
                      ? 'bg-natural-cream border-natural-sage ring-2 ring-natural-sage/20 font-bold'
                      : 'bg-white border-natural-border hover:bg-natural-highlight text-natural-primary/80 font-medium'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-natural-border bg-natural-sand flex items-center justify-center shrink-0">
                    {p.avatar ? (
                      <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs">{getSpeciesEmoji(p.species)}</span>
                    )}
                  </div>
                  <span className="text-xs text-natural-dark">{p.name}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setIsPetManagerOpen(true)}
              className="p-2 border border-dashed border-natural-border hover:border-natural-sage text-natural-primary/70 hover:text-natural-dark bg-transparent rounded-2xl transition cursor-pointer shrink-0"
              title="Dodaj kolejnego zwierzaka"
              aria-label="Dodaj kolejnego zwierzaka"
            >
              <Plus size={15} />
            </button>
          </div>
        )}

        {/* Selected Pet Bio & Primary Actions */}
        {activePet ? (
          <div className="space-y-6">
            
            {/* Pet Quick Overview Card */}
            <div className="bg-natural-cream p-5 rounded-3xl border border-natural-border shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-natural-border bg-natural-sand flex items-center justify-center shrink-0 shadow-sm">
                  {activePet.avatar ? (
                    <img
                      src={activePet.avatar}
                      alt={activePet.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl">{getSpeciesEmoji(activePet.species)}</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-serif font-bold text-natural-dark leading-tight">{activePet.name}</h2>
                    <span className="text-xs bg-natural-sand border border-natural-border text-natural-primary font-medium px-2 py-0.5 rounded-full capitalize">
                      {`${getSpeciesEmoji(activePet.species)} ${getSpeciesLabel(activePet.species, activePet.customSpecies)}`}
                    </span>
                  </div>
                  <p className="text-xs text-natural-primary/70 mt-1 flex items-center gap-1.5">
                    <Calendar size={12} />
                    {activePet.birthDate ? `Wiek: ${calculateAgeInPolish(activePet.birthDate)}` : 'Wiek nie został podany'}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setEditingEntry('new')}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-natural-secondary hover:bg-natural-olive text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Nowa notatka</span>
                </button>
              </div>
            </div>

            {/* Interactive Weight Chart with historical metrics */}
            <Suspense fallback={<div className="p-6 bg-natural-cream rounded-3xl border border-natural-border text-center text-xs text-natural-primary/60">Ładowanie wykresu wagi...</div>}>
              <WeightChart entries={entries} petName={activePet.name} />
            </Suspense>

            {/* Health Calendar & Scheduled reminders */}
            <Suspense fallback={<div className="p-6 bg-natural-cream rounded-3xl border border-natural-border text-center text-xs text-natural-primary/60">Ładowanie terminarza zdrowia...</div>}>
              <HealthCalendar
                activePet={activePet}
                events={healthEvents}
                onAddEvent={handleAddHealthEvent}
                onAddEvents={handleAddHealthEvents}
                onToggleComplete={handleToggleHealthEventComplete}
                onDeleteEvent={handleDeleteHealthEvent}
              />
            </Suspense>

            {/* Note list vs Media gallery toggle */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-natural-border pb-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('notes')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'notes'
                        ? 'bg-natural-secondary text-white shadow-2xs'
                        : 'text-natural-primary hover:bg-natural-highlight'
                    }`}
                  >
                    <BookOpen size={13} />
                    <span>Wpisy pamiętnika ({entries.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('gallery')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'gallery'
                        ? 'bg-natural-secondary text-white shadow-2xs'
                        : 'text-natural-primary hover:bg-natural-highlight'
                    }`}
                  >
                    <ImageIcon size={13} />
                    <span>Galeria zdjęć & szkiców</span>
                  </button>
                </div>
              </div>

              {activeTab === 'notes' ? (
                <NoteList
                  entries={entries}
                  onEditEntry={(entry) => setEditingEntry(entry)}
                  onDeleteEntry={handleDeleteEntry}
                  onAddNewClick={() => setEditingEntry('new')}
                  petName={activePet.name}
                />
              ) : (
                <Suspense fallback={<div className="p-8 text-center text-xs text-natural-primary/60">Ładowanie galerii...</div>}>
                  <PhotoGallery
                    entries={entries}
                    onEditEntry={(entry) => setEditingEntry(entry)}
                    petName={activePet.name}
                  />
                </Suspense>
              )}
            </div>

          </div>
        ) : (
          /* Empty State: Prompt to add first pet */
          <div className="bg-natural-cream rounded-3xl border-2 border-dashed border-natural-border p-12 text-center max-w-lg mx-auto space-y-4 my-8">
            <div className="w-14 h-14 rounded-full bg-natural-sage/20 text-natural-secondary mx-auto flex items-center justify-center">
              <HeartCrack size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif font-bold text-natural-dark text-lg">Brak profili zwierzaków</h3>
              <p className="text-xs text-natural-primary/75 max-w-xs mx-auto">
                Aby zacząć prowadzić pamiętnik zdrowia, dodaj swojego pierwszego pupila.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsPetManagerOpen(true)}
              className="px-5 py-2.5 bg-natural-secondary hover:bg-natural-olive text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus size={14} />
              <span>Dodaj pierwszego pupila</span>
            </button>
          </div>
        )}

      </main>

      {/* Footer Branding & Disclaimer */}
      <footer className="border-t border-natural-border py-4 px-4 sm:px-6 bg-natural-cream mt-8 text-xs text-natural-primary/70">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-medium text-natural-primary/80 flex items-center gap-1">
            <Heart size={12} className="fill-red-500 stroke-red-500" />
            W pełni lokalny Dziennik Pupila PWA • 2026
          </p>
          <div className="flex gap-4">
            <span className="text-[10px] bg-natural-highlight text-natural-secondary border border-natural-border px-2.5 py-0.5 rounded-full font-bold">
              IDB Storage: {storageEstimate && storageEstimate.quotaMB > 0 ? `${storageEstimate.usageMB} MB z ~${storageEstimate.quotaMB} MB` : 'dostępne'}
            </span>
            <span className="text-[10px] bg-natural-highlight text-natural-secondary border border-natural-border px-2.5 py-0.5 rounded-full font-bold">
              PWA Ready
            </span>
          </div>
        </div>
      </footer>

      {/* Manage Pets modal drawer */}
      {isPetManagerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pet-manager-dialog-title"
          className="fixed inset-0 bg-natural-dark/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
        >
          <div className="bg-natural-sand rounded-3xl w-full max-w-3xl overflow-hidden border border-natural-border shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <h2 id="pet-manager-dialog-title" className="sr-only">Zarządzaj zwierzakami</h2>
            <PetManager
              currentPets={pets}
              selectedPetId={activePetId}
              onSelectPet={handleSelectPet}
              onAddPet={handleAddPet}
              onUpdatePet={handleUpdatePet}
              onDeletePet={handleDeletePet}
              onClose={() => setIsPetManagerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Help & Information Modal */}
      {showHelpModal && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-modal-title"
          className="fixed inset-0 bg-natural-dark/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
          onClick={() => setShowHelpModal(false)}
        >
          <div 
            className="bg-natural-sand rounded-3xl w-full max-w-4xl overflow-hidden border border-natural-border shadow-2xl p-6 relative max-h-[92vh] flex flex-col space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-natural-border/70 pb-3 shrink-0">
              <div className="space-y-1">
                <h2 id="help-modal-title" className="text-xl font-serif font-extrabold text-natural-dark tracking-tight flex items-center gap-2">
                  <HelpCircle className="text-natural-secondary animate-bounce" size={24} />
                  Centrum Pomocy & Informacje o Programie
                </h2>
                <p className="text-xs text-natural-primary/75">
                  Dziennik Pupila PWA • Wersja {APP_LEGAL.version} (Offline-First)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="p-1.5 border border-natural-border hover:bg-natural-cream text-natural-primary hover:text-natural-dark rounded-xl transition cursor-pointer shrink-0"
                title="Zamknij"
                aria-label="Zamknij centrum pomocy"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body Scrollable */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs text-natural-primary leading-relaxed font-sans">
              
              {/* Privacy statement banner */}
              <div className="bg-linear-to-r from-natural-secondary/90 via-natural-secondary to-natural-olive text-white p-4 rounded-2xl shadow-xs relative overflow-hidden">
                <div className="absolute right-2 -bottom-4 opacity-10 pointer-events-none">
                  <Shield size={120} />
                </div>
                <h3 className="text-sm uppercase font-extrabold tracking-wider text-natural-highlight mb-1.5 flex items-center gap-1">
                  <Sparkles size={14} /> Cyfrowe Drzwiczki do Twojej Prywatności
                </h3>
                <p className="text-xs leading-relaxed font-normal text-white/90">
                  Witaj w cyfrowym pamiętniku, stworzonym z myślą o pełnej prywatności Twoich ukochanych podopiecznych. 
                  Aplikacja została zaprojektowana w architekturze <strong>Offline-First PWA</strong>. Wszystkie zapisy, 
                  plany, zdjęcia zwierząt oraz odręczne szkice są zapisywane wyłącznie w pamięci Twojego urządzenia (IndexedDB / localStorage). 
                  Dane dziennika są zapisane wyłącznie na Twoim urządzeniu; sama aplikacja (jej pliki) jest pobierana z hostingu jak każda strona WWW.
                </p>
              </div>

              {/* Informacje o Autorze */}
              <div className="bg-white p-4 rounded-xl border border-natural-border/60 shadow-2xs flex items-center gap-3">
                <div className="p-2.5 bg-natural-sage/20 text-natural-secondary rounded-lg shrink-0">
                  <User size={18} />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-natural-primary/70 uppercase tracking-widest font-serif">
                    Autor i twórca oprogramowania
                  </h4>
                  <p className="text-sm font-extrabold text-natural-dark">
                    {APP_LEGAL.author}
                  </p>
                </div>
              </div>

              {/* Grid of Key Features & APIs */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-natural-dark uppercase tracking-wider font-serif">
                  🚀 Zastosowane nowoczesne systemy w wersji {APP_LEGAL.version}:
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Speech API */}
                  <div className="bg-white p-4 rounded-xl border border-natural-border/60 shadow-2xs space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="p-1 px-1.5 bg-red-50 text-red-700 border border-red-100 rounded-lg text-xs font-bold flex items-center gap-1">
                        <Mic size={12} /> Web Speech API
                      </div>
                      <span className="text-[10px] text-green-700 bg-green-50 border border-green-100 px-1.5 py-0.5 rounded-md font-bold">Aktywne</span>
                    </div>
                    <p className="text-xs font-semibold text-natural-dark">Głosowe dyktowanie notatek</p>
                    <p className="text-[11px] text-natural-primary/75 leading-relaxed">
                      Zamiast pisać raporty o karmie lub wizycie u weterynarza ręcznie, kliknij przycisk <strong>„Dyktuj głosowo”</strong> w formularzu notatki. Mowa jest zamieniana na tekst przez wbudowany mechanizm przeglądarki. W niektórych przeglądarkach (np. Chrome) to przetwarzanie może odbywać się w chmurze dostawcy przeglądarki, a nie lokalnie na urządzeniu — to nie jest serwer aplikacji ani jej autora.
                    </p>
                  </div>

                  {/* Notification API */}
                  <div className="bg-white p-4 rounded-xl border border-natural-border/60 shadow-2xs space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="p-1 px-1.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-xs font-bold flex items-center gap-1">
                        <Calendar size={12} /> Przypomnienia lokalne
                      </div>
                      <span className="text-[10px] text-green-700 bg-green-50 border border-green-100 px-1.5 py-0.5 rounded-md font-bold">Aktywne</span>
                    </div>
                    <p className="text-xs font-semibold text-natural-dark">Terminarz i powiadomienia lokalne</p>
                    <p className="text-[11px] text-natural-primary/75 leading-relaxed">
                      Kalendarz zdrowia monitoruje nadchodzące odrobaczenia, szczepienia i podawanie leków. Po wyrażeniu zgody na powiadomienia, aplikacja pokaże przypomnienie po jej otwarciu lub powrocie do niej — działa tylko wtedy, gdy przeglądarka jest uruchomiona.
                    </p>
                  </div>

                  {/* Offline engine */}
                  <div className="bg-white p-4 rounded-xl border border-natural-border/60 shadow-2xs space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="p-1 px-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-bold flex items-center gap-1">
                        <FolderSync size={12} /> IndexedDB Storage
                      </div>
                      <span className="text-[10px] text-green-700 bg-green-50 border border-green-100 px-1.5 py-0.5 rounded-md font-bold">
                        {storageEstimate && storageEstimate.quotaMB > 0 ? `${storageEstimate.usageMB} MB z ~${storageEstimate.quotaMB} MB` : 'Dostępne'}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-natural-dark">Szybka baza danych w przeglądarce</p>
                    <p className="text-[11px] text-natural-primary/75 leading-relaxed">
                      Nie obawiaj się utraty danych przy wyczyszczeniu pamięci cache. Dzięki użyciu silnika IndexedDB, Twoje zdjęcia, profile, historia wagi oraz rysunki odręczne są trwale zapisane na dysku i mogą być eksportowane jednym kliknięciem.
                    </p>
                  </div>

                  {/* Auto weights parser */}
                  <div className="bg-white p-4 rounded-xl border border-natural-border/60 shadow-2xs space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="p-1 px-1.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-lg text-xs font-bold flex items-center gap-1">
                        <Activity size={12} /> Automatyczny Parser
                      </div>
                      <span className="text-[10px] text-green-700 bg-green-50 border border-green-100 px-1.5 py-0.5 rounded-md font-bold">Działa</span>
                    </div>
                    <p className="text-xs font-semibold text-natural-dark">Generowanie wykresów na żywo</p>
                    <p className="text-[11px] text-natural-primary/75 leading-relaxed">
                      Wprowadź wagę swojego pupila we wpisie z kategorii <strong>„Pomiary”</strong> (np. wpisując w tytule lub treści <em>„Waga: 6.2 kg”</em> lub <em>„waga 4,5 kg”</em>). Nasz dedykowany parser wyciągnie dane i natychmiast uaktualni trend na interaktywnym wykresie.
                    </p>
                  </div>

                  {/* Camera & Media Capture */}
                  <div className="bg-white p-4 rounded-xl border border-natural-border/60 shadow-2xs space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="p-1 px-1.5 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg text-xs font-bold flex items-center gap-1">
                        <Camera size={12} /> Media & Camera API
                      </div>
                      <span className="text-[10px] text-green-700 bg-green-50 border border-green-100 px-1.5 py-0.5 rounded-md font-bold">Lokalne</span>
                    </div>
                    <p className="text-xs font-semibold text-natural-dark">Aparat fotograficzny i zdjęcia</p>
                    <p className="text-[11px] text-natural-primary/75 leading-relaxed">
                      Wygodne fotografowanie aparatem telefonu lub kamerą komputera: uwiecznianie pupila, karmy, wagi, zaleceń lekarskich oraz stanu skóry. Zdjęcia są optymalizowane i zachowywane lokalnie w pamięci urządzenia.
                    </p>
                  </div>
                </div>
              </div>

              {/* Informative Step-by-Step Help Guide Block */}
              <div className="space-y-4 pt-1">
                <h4 className="text-xs font-bold text-natural-dark uppercase tracking-wider font-serif">
                  📋 Poradnik użytkownika i rozwiązywanie problemów:
                </h4>

                <div className="space-y-3.5">
                  <div className="bg-natural-highlight/40 border border-natural-border/50 rounded-xl p-3.5 text-xs text-natural-dark space-y-1.5">
                    <span className="font-extrabold text-natural-secondary block">1. Jak dodać pierwszego zwierzaka i zarządzać nim?</span>
                    <p className="text-natural-primary leading-relaxed text-[11px]">
                      Kliknij przycisk <strong>„Zarządzaj zwierzakami”</strong> w pasku nagłówka. Otworzy to panel, w którym możesz określić imię zwierzaka, datę urodzenia, wybrać gatunek (pies, kot, gryzoń, jaszczurka i inne) oraz przeskakiwać między profilami. Możesz też usunąć zbędny profil lub dokonać edycji.
                    </p>
                  </div>

                  <div className="bg-natural-highlight/40 border border-natural-border/50 rounded-xl p-3.5 text-xs text-natural-dark space-y-1.5">
                    <span className="font-extrabold text-natural-secondary block">2. Jak dołączyć odręczny rysunek na żywo?</span>
                    <p className="text-natural-primary leading-relaxed text-[11px]">
                      Podczas dodawania lub edycji notatki w formularzu, znajdziesz sekcję <strong>„Rysuj szkic / Zaznacz na makiecie”</strong>. Po kliknięciu otworzy się interaktywne płótno, na którym za pomocą myszki, palca lub rysika możesz schematycznie naszkicować dowolną informację. Zapisany szkic automatycznie zintegruje się z wpisem pamiętnika.
                    </p>
                  </div>

                  <div className="bg-natural-highlight/40 border border-natural-border/50 rounded-xl p-3.5 text-xs text-natural-dark space-y-1.5">
                    <span className="font-extrabold text-natural-secondary block">3. Powiadomienia o wydarzeniach zdrowotnych nie docierają?</span>
                    <p className="text-natural-primary leading-relaxed text-[11px]">
                      Upewnij się, że wyraziłeś zgodę na powiadomienia w oknie przeglądarki. W sekcji <em>„Kalendarz zdrowia”</em> u dołu znajduje się dynamiczny panel ułatwiający konfigurację tego systemu. Kliknij <strong>„Włącz”</strong>, a następnie przycisk <strong>„Przetestuj”</strong>, aby natychmiast zweryfikować czy system powiadomień bezbłędnie komunikuje się z Twoją platformą.
                    </p>
                  </div>

                  <div className="bg-natural-highlight/40 border border-natural-border/50 rounded-xl p-3.5 text-xs text-natural-dark space-y-1.5">
                    <span className="font-extrabold text-natural-secondary block">4. Praca na kilku urządzeniach i kopie zapasowe danych</span>
                    <p className="text-natural-primary leading-relaxed text-[11px]">
                      Dziennik działa lokalnie, więc profile zapisane na komputerze nie pojawią się automatycznie na telefonie. Aby to zrobić bez przesyłania danych do chmur korporacyjnych, kliknij ikonę <strong>„Koła zębatego (Ustawienia)”</strong> w prawym górnym rogu. Kliknij <strong>„Pobierz kopię zapasową (.json)”</strong>. Prześlij ten plik na drugie urządzenie, a tam w tym samym menu wybierz <strong>„Przywróć dane z pliku kopii”</strong>. Dane zostaną scalone (tryb domyślny) lub zastąpione (jeśli wybierzesz tę opcję) — wybór trybu pojawi się w oknie importu.
                    </p>
                  </div>

                  <div className="bg-natural-highlight/40 border border-natural-border/50 rounded-xl p-3.5 text-xs text-natural-dark space-y-1.5">
                    <span className="font-extrabold text-indigo-700 block">5. Planowanie cykliczne zadań i checklista opieki</span>
                    <p className="text-natural-primary leading-relaxed text-[11px]">
                      W sekcji <strong>„Zadania i Terminarz”</strong> możesz zaplanować dowolne zadanie jednorazowo lub cyklicznie. Zaznaczając <strong>„Planowanie cykliczne”</strong>, wybierzesz częstotliwość oraz czas trwania (do 366 powtórzeń, do daty lub bezterminowo z automatycznym uzupełnianiem kalendarza).
                    </p>
                  </div>

                  <div className="bg-natural-highlight/40 border border-natural-border/50 rounded-xl p-3.5 text-xs text-natural-dark space-y-1.5">
                    <span className="font-extrabold text-emerald-800 block">6. Uprawnienia urządzenia (Aparat, Mikrofon, Przypomnienia, Pamięć) – w jakim celu?</span>
                    <p className="text-natural-primary leading-relaxed text-[11px]">
                      Aplikacja korzysta z uprawnień urządzenia wyłącznie w celu realizacji kluczowych funkcji wspomagających opiekę nad pupilem:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-[11px] text-natural-primary/85 mt-1">
                      <li><strong>Aparat (Camera):</strong> Do robienia zdjęć pupila na żywo, fotografowania zaleceń weterynarza, karmy, wagi oraz ustawiania zdjęcia profilowego. Aparat uruchamia się wyłącznie wtedy, gdy sam klikniesz przycisk aparatu.</li>
                      <li><strong>Mikrofon (Microphone):</strong> Do dyktowania notatek głosem po polsku (Web Speech API). Pozwala błyskawicznie zapisać obserwację, gdy trzymasz zwierzę obiema rękami. Mikrofon działa wyłącznie po kliknięciu ikony „Dyktuj głosowo”. Mowa jest zamieniana na tekst przez wbudowany mechanizm przeglądarki. W niektórych przeglądarkach (np. Chrome) to przetwarzanie może odbywać się w chmurze dostawcy przeglądarki, a nie lokalnie na urządzeniu — to nie jest serwer aplikacji ani jej autora.</li>
                      <li><strong>Powiadomienia (Notification API):</strong> Opcjonalne przypomnienia lokalne o zbliżających się lub zaległych lekach, szczepieniach i wizytach z terminarza.</li>
                      <li><strong>Pamięć lokalna (IndexedDB Storage):</strong> 100% Offline-First. Wszystkie wpisy, zdjęcia, historia wagi i szkice są bezpiecznie przechowywane na Twoim dysku z gwarancją prywatności.</li>
                    </ul>
                    <p className="text-[10px] text-natural-primary/70 italic mt-1">
                      💡 Uprawnieniami możesz w dowolnym momencie zarządzać w przeglądarce, klikając ikonę kłódki 🔒 lub suwaków obok paska adresu.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom footer button for viewing formal Terms */}
              <div className="pt-2 border-t border-natural-border/60 flex flex-col sm:flex-row justify-between items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowHelpModal(false);
                    setShowLegalModal(true);
                  }}
                  className="w-full sm:w-auto px-4 py-2 border border-natural-border bg-white hover:bg-natural-highlight text-natural-dark rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <FileText size={13} className="text-natural-secondary" />
                  <span>Regulamin & Licencja WLUP</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowHelpModal(false)}
                  className="w-full sm:w-auto px-5 py-2 bg-natural-secondary hover:bg-natural-olive text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition text-center cursor-pointer"
                >
                  Zamknij pomoc
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Note Editor Drawer / Modal */}
      {editingEntry && activePetId && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="note-editor-title"
          className="fixed inset-0 bg-natural-dark/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200"
        >
          <div className="bg-natural-sand rounded-3xl w-full max-w-2xl overflow-hidden border border-natural-border shadow-2xl p-6 relative max-h-[92vh] overflow-y-auto">
            <h2 id="note-editor-title" className="sr-only">Formularz notatki pamiętnika</h2>
            <NoteEditor
              activePetId={activePetId}
              editingEntry={editingEntry === 'new' ? null : editingEntry}
              onSave={handleSaveEntry}
              onCancel={() => setEditingEntry(null)}
            />
          </div>
        </div>
      )}

      {/* Modal potwierdzenia importu bazy z kopią ratunkową */}
      <Suspense fallback={null}>
        <ImportConfirmModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSuccess={handleImportSuccess}
          onError={(msg) => triggerSuccessAlert(msg)}
        />
      </Suspense>

      {/* Pierwsze uruchomienie - wymóg akceptacji regulaminu i licencji WLUP */}
      <Suspense fallback={null}>
        <LegalModal
          isOpen={!termsAccepted}
          isFirstRun={true}
          onAccept={() => {
            localStorage.setItem(
              'DziennikPupila_termsAccepted',
              JSON.stringify({
                version: APP_LEGAL.version,
                acceptedAt: Date.now(),
              })
            );
            setTermsAccepted(true);
          }}
        />
      </Suspense>

      {/* Przeglądanie regulaminu i licencji w dowolnym momencie (z Ustawień lub Pomocy) */}
      <Suspense fallback={null}>
        <LegalModal
          isOpen={showLegalModal}
          isFirstRun={false}
          onClose={() => setShowLegalModal(false)}
        />
      </Suspense>

    </div>
  );
}
