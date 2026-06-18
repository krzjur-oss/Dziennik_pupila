import React, { useState, useEffect } from 'react';
import { Pet, DiaryEntry, HealthEvent } from './types';
import {
  getPets,
  savePet,
  deletePet,
  getEntries,
  getEntriesByPet,
  saveEntry,
  deleteEntry,
  exportDatabase,
  importDatabase,
} from './lib/db';
import { getSpeciesEmoji, calculateAgeInPolish } from './utils';
import PetManager from './components/PetManager';
import NoteEditor from './components/NoteEditor';
import NoteList from './components/NoteList';
import PhotoGallery from './components/PhotoGallery';
import WeightChart from './components/WeightChart';
import HealthCalendar from './components/HealthCalendar';
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
  Info,
  Sparkles,
  Mic,
  Activity,
  Image as ImageIcon,
} from 'lucide-react';

export default function App() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [activePetId, setActivePetId] = useState<string | undefined>(undefined);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [healthEvents, setHealthEvents] = useState<HealthEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'notes' | 'gallery'>('notes');

  // Regulamin i licencja - weryfikacja pierwszego uruchomienia
  const [termsAccepted, setTermsAccepted] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('DziennikPupila_termsAccepted') === 'true';
    }
    return true;
  });

  // View States
  const [isPetManagerOpen, setIsPetManagerOpen] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | 'new' | null>(null);

  // Backup state
  const [showSettings, setShowSettings] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load health events on mount
  useEffect(() => {
    const cachedEvents = localStorage.getItem('DziennikPupila_healthEvents');
    if (cachedEvents) {
      try {
        setHealthEvents(JSON.parse(cachedEvents));
      } catch (e) {
        console.error('Error loading health events:', e);
      }
    }
  }, []);

  const saveHealthEventsToStorage = (events: HealthEvent[]) => {
    setHealthEvents(events);
    localStorage.setItem('DziennikPupila_healthEvents', JSON.stringify(events));
  };

  const handleAddHealthEvent = (eventData: Omit<HealthEvent, 'id' | 'petId' | 'createdAt' | 'isCompleted'>) => {
    if (!activePetId) return;
    const newEvent: HealthEvent = {
      ...eventData,
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      petId: activePetId,
      isCompleted: false,
      createdAt: Date.now()
    };
    const updated = [...healthEvents, newEvent];
    saveHealthEventsToStorage(updated);
    triggerSuccessAlert(`Zaplanowano wydarzenie: ${newEvent.title}!`);
  };

  const handleToggleHealthEventComplete = (id: string) => {
    const updated = healthEvents.map(e => e.id === id ? { ...e, isCompleted: !e.isCompleted } : e);
    saveHealthEventsToStorage(updated);
    const found = updated.find(e => e.id === id);
    if (found) {
      if (found.isCompleted) {
        triggerSuccessAlert(`Wykonano wydarzenie: ${found.title}!`);
      } else {
        triggerSuccessAlert(`Oznaczono jako nadchodzące: ${found.title}`);
      }
    }
  };

  const handleDeleteHealthEvent = (id: string) => {
    const updated = healthEvents.filter(e => e.id !== id);
    saveHealthEventsToStorage(updated);
    triggerSuccessAlert('Usunięto wydarzenie z kalendarza.');
  };

  // Load pets on startup
  useEffect(() => {
    async function loadInitialData() {
      try {
        const loadedPets = await getPets();
        setPets(loadedPets);

        // Retrieve active pet from localStorage, fallback to first pet
        const cachedPetId = localStorage.getItem('DziennikPupila_activePetId');
        if (cachedPetId && loadedPets.some(p => p.id === cachedPetId)) {
          setActivePetId(cachedPetId);
        } else if (loadedPets.length > 0) {
          setActivePetId(loadedPets[0].id);
        } else {
          setActivePetId(undefined);
        }

      } catch (err) {
        console.error('Błąd inicjalizacji bazy danych offline:', err);
      }
    }

    loadInitialData();
  }, []);

  // Fetch entries when activePetId changes
  useEffect(() => {
    async function loadEntries() {
      if (!activePetId) return;
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
    // Close other panels
    setEditingEntry(null);
  };

  // Save pet actions
  const handleAddPet = async (petData: Omit<Pet, 'id' | 'createdAt'>) => {
    const newPet: Pet = {
      ...petData,
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      createdAt: Date.now(),
    };
    await savePet(newPet);
    const updatedPets = await getPets();
    setPets(updatedPets);
    setActivePetId(newPet.id);
    localStorage.setItem('DziennikPupila_activePetId', newPet.id);
    triggerSuccessAlert(`Dodano profil pupila: ${newPet.name}!`);
  };

  const handleUpdatePet = async (updatedPet: Pet) => {
    await savePet(updatedPet);
    const updatedPets = await getPets();
    setPets(updatedPets);
    triggerSuccessAlert(`Profil ${updatedPet.name} został zaktualizowany.`);
  };

  const handleDeletePet = async (id: string) => {
    await deletePet(id);
    const updatedPets = await getPets();
    setPets(updatedPets);
    triggerSuccessAlert('Profil zwierzaka i wszystkie jego notatki zostały skasowane.');
  };

  // Note actions
  const handleSaveEntry = async (entry: DiaryEntry) => {
    await saveEntry(entry);
    if (activePetId) {
      const updatedEntries = await getEntriesByPet(activePetId);
      setEntries(updatedEntries);
    }
    setEditingEntry(null);
    triggerSuccessAlert('Wpis został zapisany pomyślnie!');
  };

  const handleDeleteEntry = async (id: string) => {
    await deleteEntry(id);
    if (activePetId) {
      const updatedEntries = await getEntriesByPet(activePetId);
      setEntries(updatedEntries);
    }
    triggerSuccessAlert('Wpis został usunięty.');
  };

  // Database Backup / Restore Utilities
  const handleExportBackup = async () => {
    try {
      const jsonString = await exportDatabase();
      const backupObj = JSON.parse(jsonString);
      
      // Inject healthEvents
      const cachedEvents = localStorage.getItem('DziennikPupila_healthEvents') || '[]';
      backupObj.healthEvents = JSON.parse(cachedEvents);

      const mergedJson = JSON.stringify(backupObj, null, 2);
      const blob = new Blob([mergedJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dziennik_pupila_kopia_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      triggerSuccessAlert('Wyeksportowano kopię zapasową bazy danych!');
    } catch (err) {
      console.error('Błąd eksportu kopii zapasowej:', err);
      alert('Nie udało się wyeksportować danych.');
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = event.target?.result as string;
        const backupObj = JSON.parse(json);
        
        await importDatabase(json);

        // Restore healthEvents
        if (backupObj.healthEvents && Array.isArray(backupObj.healthEvents)) {
          localStorage.setItem('DziennikPupila_healthEvents', JSON.stringify(backupObj.healthEvents));
          setHealthEvents(backupObj.healthEvents);
        } else {
          localStorage.removeItem('DziennikPupila_healthEvents');
          setHealthEvents([]);
        }
        
        // Reload all
        const loadedPets = await getPets();
        setPets(loadedPets);
        if (loadedPets.length > 0) {
          setActivePetId(loadedPets[0].id);
          localStorage.setItem('DziennikPupila_activePetId', loadedPets[0].id);
        } else {
          setActivePetId(undefined);
        }
        setShowSettings(false);
        triggerSuccessAlert('Kopia zapasowa przywrócona pomyślnie!');
      } catch (err) {
        console.error('Błąd importu danych:', err);
        alert('Błąd podczas przywracania danych. Upewnij się, że załączasz poprawny plik JSON kopii.');
      }
    };
    reader.readAsText(file);
  };

  const activePet = pets.find((p) => p.id === activePetId);

  return (
    <div className="min-h-screen bg-natural-sand flex flex-col justify-between select-none">
      
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
            
            <button
              onClick={() => setIsPetManagerOpen(true)}
              className="px-3 py-1.5 border border-natural-border hover:bg-natural-highlight font-semibold text-xs text-natural-primary bg-natural-cream rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Zarządzaj zwierzakami"
            >
              <User size={14} className="text-natural-secondary" />
              <span className="hidden md:inline">Zarządzaj zwierzakami</span>
            </button>

            <button
              onClick={() => setShowHelpModal(true)}
              className="px-3 py-1.5 border border-natural-border hover:bg-natural-highlight font-semibold text-xs text-natural-primary bg-natural-cream rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Pomoc i o programie"
            >
              <HelpCircle size={14} className="text-natural-secondary" />
              <span className="hidden md:inline">Pomoc i opis</span>
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 border border-natural-border hover:bg-natural-highlight text-natural-primary bg-natural-cream rounded-xl transition shadow-xs cursor-pointer"
              title="Kopia zapasowa / Ustawienia"
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
          <div className="bg-natural-cream p-5 rounded-3xl border border-natural-border shadow-sm space-y-4 animate-in slide-in-from-top-4 duration-250">
            <div className="flex items-center justify-between border-b border-natural-border pb-2">
              <h3 className="text-sm font-bold text-natural-dark flex items-center gap-1.5">
                <FolderSync size={16} className="text-natural-secondary" />
                Dyrektor Kopia Zapasowa (Offline Backup)
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 rounded-lg text-natural-primary/50 hover:bg-natural-highlight hover:text-natural-dark transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            <p className="text-xs text-natural-primary/80 leading-relaxed max-w-2xl">
              Twój pamiętnik działa w 100% lokalnie w przeglądarce (bez wysyłania plików na zewnętrzne serwery). 
              Aby przenieść dziennik na inne urządzenie (np. z telefonu na tablet) lub zapisać na komputerze, pobierz plik kopii zapasowej.
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

              {/* Import backup simulation */}
              <label className="cursor-pointer px-4 py-2 border border-natural-border bg-natural-highlight hover:bg-natural-border text-natural-primary font-semibold text-xs rounded-xl shadow-xs transition inline-flex items-center gap-1.5">
                <Upload size={13} />
                Przywróć dane z pliku kopii
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>

            </div>
          </div>
        )}

        {/* Selected Active Pet Greeting Card Banner */}
        {activePet ? (
          <div className="bg-natural-olive text-natural-cream rounded-3xl p-6 shadow-sm overflow-hidden relative border border-natural-olive">
            {/* Decors */}
            <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-12 select-none pointer-events-none font-extrabold text-[120px]">
              {getSpeciesEmoji(activePet.species)}
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-center justify-between relative z-10">
              
              {/* Pet Bio representation */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5">
                
                {/* Large Pet Frame Avatar */}
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/10 flex items-center justify-center border-2 border-natural-secondary/40 shrink-0 shadow-md">
                  {activePet.avatar ? (
                    <img
                      src={activePet.avatar}
                      alt={activePet.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl">{getSpeciesEmoji(activePet.species)}</span>
                  )}
                </div>

                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h2 className="text-2xl font-serif font-bold text-white tracking-tight leading-none">
                      {activePet.name}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-natural-highlight border border-white/20 capitalize shrink-0">
                      {activePet.species === 'inne' && activePet.customSpecies
                        ? activePet.customSpecies
                        : `${getSpeciesEmoji(activePet.species)} ${activePet.species}`}
                    </span>
                  </div>

                  <p className="text-xs text-natural-highlight font-semibold flex items-center justify-center sm:justify-start gap-1">
                    <Calendar size={12} className="opacity-75" />
                    Wieki: {activePet.birthDate ? calculateAgeInPolish(activePet.birthDate) : 'Nie podano wieku'}
                    {activePet.birthDate && (
                      <span className="opacity-60 text-[10px] font-normal">({activePet.birthDate})</span>
                    )}
                  </p>

                  {activePet.notes && (
                    <p className="text-xs text-[#fbf8f3]/80 italic line-clamp-2 max-w-xl font-normal leading-relaxed">
                      „{activePet.notes}”
                    </p>
                  )}
                </div>
              </div>

              {/* Stats overview / triggers */}
              <div className="flex flex-col items-center sm:items-end gap-3 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t border-white/10 md:border-t-0 shrink-0">
                <div className="flex gap-4 text-center">
                  <div className="bg-natural-dark/25 px-4 py-2 rounded-2xl border border-white/15">
                    <p className="text-[10px] uppercase font-bold text-natural-highlight">Liczba wpisów</p>
                    <p className="text-xl font-extrabold text-white mt-0.5">{entries.length}</p>
                  </div>
                </div>

                <button
                  onClick={() => setEditingEntry('new')}
                  className="w-full sm:w-auto px-5 py-2.5 bg-natural-secondary hover:bg-natural-secondary/90 text-white text-xs font-bold rounded-2xl shadow-md cursor-pointer hover:shadow-lg transition flex items-center justify-center gap-1.5"
                >
                  <Plus size={15} />
                  Dodaj wpis do dziennika
                </button>
              </div>

            </div>
          </div>
        ) : (
          <div className="bg-natural-highlight border border-natural-border p-6 rounded-3xl text-center flex flex-col items-center justify-center space-y-3">
            <HeartCrack size={32} className="text-natural-secondary" />
            <div>
              <p className="text-sm font-bold text-natural-dark">Brak aktywnego profilu pupila</p>
              <p className="text-xs text-natural-primary/70 mt-1 max-w-sm">
                Dodaj nowego psa, kota, jaszczurkę lub chomika klikając panel zarządzania, aby odblokować pamiętnik.
              </p>
            </div>
            <button
              onClick={() => setIsPetManagerOpen(true)}
              className="px-4 py-2 bg-natural-secondary text-white rounded-xl text-xs font-bold shadow-sm transition hover:bg-natural-olive cursor-pointer"
            >
              Dodaj swojego pierwszego zwierzaka
            </button>
          </div>
        )}

        {/* Dashboard Grid split viewport */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: WeightChart, HealthCalendar & Note List */}
          <div className={`${editingEntry ? 'lg:col-span-4 hidden lg:block space-y-6' : 'lg:col-span-12 lg:grid lg:grid-cols-12 lg:gap-6 lg:items-start'} transition-all`}>
            {activePet && (
              <>
                {/* Sidebar Column: Weight Chart & Health Calendar */}
                <div className={`${editingEntry ? '' : 'lg:col-span-4'} space-y-6`}>
                  <WeightChart entries={entries} petName={activePet.name} />
                  
                  <HealthCalendar
                    activePet={activePet}
                    events={healthEvents}
                    onAddEvent={handleAddHealthEvent}
                    onToggleComplete={handleToggleHealthEventComplete}
                    onDeleteEvent={handleDeleteHealthEvent}
                  />
                </div>
                
                {/* Diary logs list section */}
                <div className={`${editingEntry ? '' : 'lg:col-span-8'} space-y-4`}>
                  <div className="flex items-center justify-between border-b border-natural-border/70 pb-1">
                    <div className="flex gap-4">
                      <button
                        onClick={() => setActiveTab('notes')}
                        className={`pb-2.5 px-1 text-xs sm:text-sm font-serif font-extrabold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
                          activeTab === 'notes'
                            ? 'border-natural-secondary text-natural-dark'
                            : 'border-transparent text-natural-primary/60 hover:text-natural-dark'
                        }`}
                      >
                        <FileText size={15} className={activeTab === 'notes' ? 'text-natural-secondary' : 'text-natural-primary/50'} />
                        Wpisy i Logi
                      </button>
                      <button
                        onClick={() => setActiveTab('gallery')}
                        className={`pb-2.5 px-1 text-xs sm:text-sm font-serif font-extrabold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
                          activeTab === 'gallery'
                            ? 'border-natural-secondary text-natural-dark'
                            : 'border-transparent text-natural-primary/60 hover:text-natural-dark'
                        }`}
                      >
                        <ImageIcon size={15} className={activeTab === 'gallery' ? 'text-natural-secondary animate-pulse' : 'text-natural-primary/50'} />
                        Galeria Zdjęć & Szkiców
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
                    <PhotoGallery
                      entries={entries}
                      onEditEntry={(entry) => setEditingEntry(entry)}
                      petName={activePet.name}
                    />
                  )}
                </div>
              </>
            )}
          </div>

          {/* Dynamic editor panel view: takes emphasis when active */}
          {editingEntry && activePetId && (
            <div className="lg:col-span-8 animate-in fade-in duration-200">
              <NoteEditor
                activePetId={activePetId}
                editingEntry={editingEntry === 'new' ? null : editingEntry}
                onSave={handleSaveEntry}
                onCancel={() => setEditingEntry(null)}
              />
            </div>
          )}

        </div>

      </main>

      {/* Footer layout credits */}
      <footer className="bg-natural-cream border-t border-natural-border py-6 mt-12 text-center text-natural-primary/50 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-medium text-natural-primary/80 flex items-center gap-1">
            <Heart size={12} className="fill-red-500 stroke-red-500" />
            W pełni lokalny Dziennik Pupila PWA • 2026
          </p>
          <div className="flex gap-4">
            <span className="text-[10px] bg-natural-highlight text-natural-secondary border border-natural-border px-2.5 py-0.5 rounded-full font-bold">
              IDB Storage: Bez limitu
            </span>
            <span className="text-[10px] bg-natural-highlight text-natural-secondary border border-natural-border px-2.5 py-0.5 rounded-full font-bold">
              PWA Ready
            </span>
          </div>
        </div>
      </footer>

      {/* Manage Pets modal drawer */}
      {isPetManagerOpen && (
        <div className="fixed inset-0 bg-natural-dark/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-natural-sand rounded-3xl w-full max-w-3xl overflow-hidden border border-natural-border shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
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
                <h2 className="text-xl font-serif font-extrabold text-natural-dark tracking-tight flex items-center gap-2">
                  <HelpCircle className="text-natural-secondary animate-bounce" size={24} />
                  Centrum Pomocy & Informacje o Programie
                </h2>
                <p className="text-xs text-natural-primary/75">
                  Dziennik Pupila PWA • Wersja 1.4 premium (Offline-First)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="p-1.5 border border-natural-border hover:bg-natural-cream text-natural-primary hover:text-natural-dark rounded-xl transition cursor-pointer shrink-0"
                title="Zamknij"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content Drawer (Scrollable) */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              
              {/* Premium Welcome Card */}
              <div className="bg-natural-olive text-natural-cream p-5 rounded-2xl border border-natural-olive/30 shadow-xs relative overflow-hidden">
                <div className="absolute right-0 bottom-0 opacity-10 translate-x-6 translate-y-6 font-extrabold text-9xl font-mono select-none pointer-events-none">
                  🐾
                </div>
                <h3 className="text-sm uppercase font-extrabold tracking-wider text-natural-highlight mb-1.5 flex items-center gap-1">
                  <Sparkles size={14} /> Cyfrowe Drzwiczki do Twojej Prywatności
                </h3>
                <p className="text-xs leading-relaxed font-normal text-white/90">
                  Witaj w cyfrowym pamiętniku, stworzonym z myślą o pełnej prywatności Twoich ukochanych podopiecznych. 
                  Aplikacja została zaprojektowana w architekturze <strong>Offline-First PWA</strong>. Wszystkie zapisy, 
                  plany, zdjęcia zwierząt oraz odręczne szkice są zapisywane wyłącznie w pamięci Twojego urządzenia (IndexedDB / localStorage). 
                  Dane nigdy nie są transferowane na serwery zewnętrzne, co gwarantuje 100% dyskrecji i pełne bezpieczeństwo.
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
                    Krzysztof Jureczek
                  </p>
                </div>
              </div>

              {/* Grid of Key Features & APIs */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-natural-dark uppercase tracking-wider font-serif">
                  🚀 Zastosowane nowoczesne systemy w wersji 1.4:
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
                      Zamiast pisać raporty o karmie lub wizycie u weterynarza ręcznie, kliknij przycisk <strong>„Dyktuj głosowo”</strong> w formularzu notatki. Wbudowany moduł zaawansowanego rozpoznawania mowy przetłumaczy Twój głos bezpośrednio na tekst po polsku.
                    </p>
                  </div>

                  {/* Notification API */}
                  <div className="bg-white p-4 rounded-xl border border-natural-border/60 shadow-2xs space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="p-1 px-1.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-xs font-bold flex items-center gap-1">
                        <Calendar size={12} /> Notification API
                      </div>
                      <span className="text-[10px] text-green-700 bg-green-50 border border-green-100 px-1.5 py-0.5 rounded-md font-bold">Aktywne</span>
                    </div>
                    <p className="text-xs font-semibold text-natural-dark">Terminarz i powiadomienia systemowe</p>
                    <p className="text-[11px] text-natural-primary/75 leading-relaxed">
                      Kalendarz zdrowia monitoruje nadchodzące odrobaczenia, szczepienia i podawanie leków. Po wyrażeniu zgody na powiadomienia, system wyśle natywne powiadomienie push bezpośrednio na Twój pulpit, aby nie umknął Ci żaden ważny termin!
                    </p>
                  </div>

                  {/* Offline engine */}
                  <div className="bg-white p-4 rounded-xl border border-natural-border/60 shadow-2xs space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="p-1 px-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-bold flex items-center gap-1">
                        <FolderSync size={12} /> IndexedDB Storage
                      </div>
                      <span className="text-[10px] text-green-700 bg-green-50 border border-green-100 px-1.5 py-0.5 rounded-md font-bold">Nielimitowane</span>
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
                      Wprowadź wage swojego pupila we wpisie z kategorii <strong>„Pomiary”</strong> (np. wpisując w tytule lub treści <em>„Waga: 6.2 kg”</em> lub <em>„przytył do 15kg”</em>). Nasz inteligentny parser wyciągnie dane i natychmiast uaktualni trend na interaktywnym wykresie.
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
                      Podczas dodawania lub edycji notatki w formularzu, znajdziesz sekcję <strong>„Rysuj szkic / Zaznacz na makiecie”</strong>. Po kliknięciu otworzy się interaktywne płótno, na którym za pomocą myszki, palca lub rysika możesz schematycznie naszkicować dowolną informację (np. miejsce otarcia skóry, nietypową sytuację czy po prostu zabawną chwilę). Zapisany szkic automatycznie zintegruje się z wpisem pamiętnika.
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
                      Dziennik działa lokalnie, więc profile zapisane na komputerze nie pojawią się automatycznie na telefonie. Aby to zrobić bez przesyłania danych do chmur korporacyjnych, kliknij ikonę <strong>„Koła zębatego (Ustawienia)”</strong> w prawym górnym rogu. Kliknij <strong>„Pobierz kopię zapasową (.json)”</strong>. Prześlij ten plik na drugie urządzenie, a tam w tym samym menu wybierz <strong>„Przywróć dane z pliku kopii”</strong>. Dane zostaną bezstratnie scalone.
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="border-t border-natural-border/70 pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <span className="text-[10px] text-natural-primary/60 font-semibold">
                Dziennik Pupila PWA • Zaprojektowane z myślą o miłośnikach zwierząt.
              </span>
              
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="w-full sm:w-auto px-5 py-2 bg-natural-secondary hover:bg-natural-olive text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition text-center cursor-pointer"
              >
                Rozumiem, zamknij pomoc
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pierwsze uruchomienie - wymóg akceptacji regulaminu i licencji osobistej */}
      {!termsAccepted && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-natural-sand rounded-3xl w-full max-w-xl border border-natural-border shadow-2xl p-6 flex flex-col space-y-5 animate-in zoom-in-95 duration-300 max-h-[92vh] overflow-hidden">
            
            {/* Header */}
            <div className="text-center space-y-2 border-b border-natural-border/70 pb-4 shrink-0">
              <span className="text-3xl animate-bounce inline-block">🐾</span>
              <h2 className="text-xl font-serif font-extrabold text-natural-dark tracking-tight leading-tight">
                Regulamin & Licencja Użytkowania
              </h2>
              <p className="text-[11px] text-natural-primary/75 font-semibold">
                Wymagana jednorazowa akceptacja przed pierwszym uruchomieniem
              </p>
            </div>

            {/* Scrollable Document Content */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs text-natural-primary/85 leading-relaxed bg-white/50 border border-natural-border/50 rounded-2xl p-4 shadow-2xs">
              <h3 className="font-extrabold text-natural-dark font-serif text-sm">Regulamin Korzystania z Programu „Dziennik Pupila”</h3>
              
              <p>
                Dziękujemy za wybranie „Dziennika Pupila” — Twojej bezpiecznej, osobistej bazy danych i pamiętnika dla ukochanych podopiecznych. Przed rozpoczęciem zapraszamy do zapoznania się z poniższymi zasadami korzystania.
              </p>

              <div className="space-y-3 pt-2">
                <div>
                  <h4 className="font-bold text-natural-secondary">§1. Bezpieczeństwo i Całkowita Prywatność (Offline-First)</h4>
                  <p className="text-[11px] mt-0.5">
                    Aplikacja zaprojektowana została w technologii Offline-First. Wszystkie wpisy, zdjęcia, odręczne rysunki oraz plany lekarskie i wagi są przechowywane na stałe wyłącznie w bezpiecznej bazie IndexedDB Twojej przeglądarki. Dane te nie są przekazywane na serwery – masz 100% kontroli i dyskrecji.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-natural-secondary">§2. Licencja na Użytek Osobisty i Niezarobkowy</h4>
                  <p className="text-[11px] mt-0.5">
                    Udziela się bezpłatnej, osobistej licencji na instalowanie i korzystanie z programu wyłącznie do celów prywatnych i rodzinnych związanych z opieką nad zwierzakami.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-natural-secondary">§3. Kategoryczny Zakaz Sprzedaży Oprogramowania</h4>
                  <p className="text-[11px] mt-0.5 font-bold text-natural-dark">
                    Zabrania się odsprzedaży, modyfikacji w celu odsprzedaży, licencjonowania, wynajmu oraz jakiejkolwiek formy odpłatnej dystrybucji kodu lub skompilowanego oprogramowania bez uprzedniej jednoznacznej pisemnej zgody autora.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-natural-secondary">§4. Odpowiedzialność Weterynaryjna</h4>
                  <p className="text-[11px] mt-0.5">
                    Moduł powiadomień oraz parser wykresów wagi stanowią funkcje pomocnicze. Nie służą jako wytyczna lekarska i nie zastępują opinii wykwalifikowanego weterynarza.
                  </p>
                </div>
              </div>
            </div>

            {/* Checkboxes block */}
            <div className="space-y-3 pt-1 shrink-0">
              <label className="flex items-start gap-2.5 cursor-pointer select-none text-[11px] font-semibold text-natural-primary/95">
                <input
                  type="checkbox"
                  id="agree-noncommercial"
                  required
                  className="rounded border-natural-border text-natural-secondary focus:ring-natural-secondary mt-0.5 h-3.5 w-3.5 shrink-0 cursor-pointer"
                />
                <span>
                  Oświadczam, że będę używać aplikacji wyłącznie do celów osobistych i niekomercyjnych (zgodnie z licencją).
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer select-none text-[11px] font-semibold text-natural-primary/95">
                <input
                  type="checkbox"
                  id="agree-nosell"
                  required
                  className="rounded border-natural-border text-natural-secondary focus:ring-natural-secondary mt-0.5 h-3.5 w-3.5 shrink-0 cursor-pointer"
                />
                <span>
                  Akceptuję bezwzględny zakaz komercyjnej odsprzedaży i dystrybucji bez pisemnej zgody autora.
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 shrink-0 border-t border-natural-border/70 flex flex-col space-y-2">
              <button
                type="button"
                onClick={() => {
                  const ch1 = document.getElementById('agree-noncommercial') as HTMLInputElement;
                  const ch2 = document.getElementById('agree-nosell') as HTMLInputElement;
                  
                  if (ch1 && ch2 && ch1.checked && ch2.checked) {
                    localStorage.setItem('DziennikPupila_termsAccepted', 'true');
                    setTermsAccepted(true);
                  } else {
                    alert('Proszę zaznaczyć obie wymagane zgody przed wejściem do programu!');
                  }
                }}
                className="w-full py-2.5 bg-natural-secondary hover:bg-natural-olive text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition text-center cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Akceptuję regulamin i wchodzę do pamiętnika 🐾</span>
              </button>
              <p className="text-[10px] text-center text-natural-primary/55 font-semibold">
                Dane są bezpiecznie składowane na Twoim urządzeniu. Modyfikuj i twórz bez obaw!
              </p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
