import React, { useState, useMemo } from 'react';
import { DiaryEntry, CategoryType } from '../types';
import { Search, Calendar, ChevronDown, ChevronUp, Edit2, Trash2, BookOpen, Clock, Heart, Filter, Maximize2, X, Ruler } from 'lucide-react';
import { CATEGORIES } from '../utils';

interface NoteListProps {
  entries: DiaryEntry[];
  onEditEntry: (entry: DiaryEntry) => void;
  onDeleteEntry: (id: string) => Promise<void>;
  onAddNewClick: () => void;
  petName: string;
}

export default function NoteList({
  entries,
  onEditEntry,
  onDeleteEntry,
  onAddNewClick,
  petName,
}: NoteListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [sortMode, setSortMode] = useState<'newest' | 'oldest' | 'category'>('newest');
  
  // Track expanded cards (by entry id)
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  
  // Safety confirmation
  const [showDeleteConfirmId, setShowDeleteConfirmId] = useState<string | null>(null);

  // Active full-screen modal preview
  const [activeModalEntry, setActiveModalEntry] = useState<DiaryEntry | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Filter notes
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesSearch =
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.content.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || entry.category === selectedCategory;
      const matchesDate = !selectedDate || entry.date === selectedDate;

      return matchesSearch && matchesCategory && matchesDate;
    });
  }, [entries, searchQuery, selectedCategory, selectedDate]);

  // Sort chronological / reverse chronological
  const sortedEntries = useMemo(() => {
    if (sortMode === 'newest') {
      return [...filteredEntries].sort((a, b) => {
        const dateTimeA = new Date(`${a.date}T${a.time || '12:00'}`).getTime();
        const dateTimeB = new Date(`${b.date}T${b.time || '12:00'}`).getTime();
        return dateTimeB - dateTimeA;
      });
    } else if (sortMode === 'oldest') {
      return [...filteredEntries].sort((a, b) => {
        const dateTimeA = new Date(`${a.date}T${a.time || '12:00'}`).getTime();
        const dateTimeB = new Date(`${b.date}T${b.time || '12:00'}`).getTime();
        return dateTimeA - dateTimeB;
      });
    }
    return filteredEntries;
  }, [filteredEntries, sortMode]);

  // Grouped by Category logic
  const groupedEntriesObj = useMemo(() => {
    if (sortMode !== 'category') return null;
    
    const groups: Record<CategoryType, DiaryEntry[]> = {} as any;
    
    filteredEntries.forEach((entry) => {
      if (!groups[entry.category]) {
        groups[entry.category] = [];
      }
      groups[entry.category].push(entry);
    });
    
    // Sort chronological descending within each group
    Object.keys(groups).forEach((key) => {
      groups[key as CategoryType].sort((a, b) => {
        const dateTimeA = new Date(`${a.date}T${a.time || '12:00'}`).getTime();
        const dateTimeB = new Date(`${b.date}T${b.time || '12:00'}`).getTime();
        return dateTimeB - dateTimeA;
      });
    });
    
    return groups;
  }, [filteredEntries, sortMode]);

  const renderEntryCard = (entry: DiaryEntry) => {
    const catInfo = CATEGORIES[entry.category] || CATEGORIES.notatka;
    const isExpanded = !!expandedIds[entry.id];
    
    return (
      <div
        key={entry.id}
        className={`bg-natural-cream rounded-2xl border transition-all duration-300 overflow-hidden ${
          isExpanded
            ? 'border-natural-sage shadow-sm ring-1 ring-natural-sage/10 bg-natural-sand/30'
            : 'border-natural-border hover:border-natural-clay/50 hover:shadow-xs'
        }`}
      >
        {/* Compact Item Header */}
        <div
          onClick={() => toggleExpand(entry.id)}
          className="p-4 flex justify-between items-start gap-4 cursor-pointer select-none"
        >
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              {/* Category Badge */}
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${catInfo.bg} capitalize`}>
                {catInfo.label}
              </span>
              {/* Date Indicator */}
              <span className="text-[11px] font-semibold text-natural-primary/80 flex items-center gap-1 bg-natural-highlight px-1.5 py-0.5 rounded-md">
                <Calendar size={11} className="text-natural-secondary shrink-0" />
                {entry.date}
              </span>
              <span className="text-[11px] font-semibold text-natural-primary/80 flex items-center gap-1 bg-natural-highlight px-1.5 py-0.5 rounded-md">
                <Clock size={11} className="text-natural-secondary shrink-0" />
                {entry.time}
              </span>
            </div>

            <h3 className="font-serif font-bold text-natural-dark text-sm leading-snug truncate">
              {entry.title}
            </h3>

            {/* Excerpt of note text if closed */}
            {!isExpanded && entry.content && (
              <p className="text-xs text-natural-primary/70 line-clamp-1 mt-1 font-normal leading-normal select-none">
                {entry.content}
              </p>
            )}

            {/* Miniature thumbnail labels for attachments */}
            {!isExpanded && (entry.photo || entry.drawing) && (
              <div className="flex items-center gap-2 mt-2">
                {entry.photo && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-natural-olive bg-natural-highlight px-1.5 py-0.5 rounded border border-natural-border">
                    📷 Zdjęcie
                  </span>
                )}
                {entry.drawing && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-natural-secondary bg-natural-highlight px-1.5 py-0.5 rounded border border-natural-border">
                    ✏️ Rysunek
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Actions & expand triggers */}
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setActiveModalEntry(entry)}
              className="p-1.5 text-natural-primary/50 hover:text-natural-dark hover:bg-natural-highlight/80 rounded-xl transition cursor-pointer flex items-center justify-center"
              title="Pełny ekran (modal)"
            >
              <Maximize2 size={15} />
            </button>
            <div
              onClick={() => toggleExpand(entry.id)}
              className="text-natural-primary/50 hover:text-natural-dark p-1.5 flex items-center cursor-pointer"
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>
        </div>

        {/* Expanded Details Section */}
        {isExpanded && (
          <div className="px-4 pb-4 border-t border-natural-border bg-natural-highlight/30 pt-3.5 space-y-4 animate-in slide-in-from-top-1 duration-200">
            
            {/* Dimensions structured display if vorhanden */}
            {entry.category === 'pomiary' && entry.dimensions && (entry.dimensions.neck || entry.dimensions.chest || entry.dimensions.length || entry.dimensions.height) && (
              <div className="bg-white/80 p-3.5 rounded-xl border border-natural-border/60 space-y-2">
                <h4 className="text-[10px] font-bold text-[#867761] uppercase tracking-wider flex items-center gap-1 font-serif">
                  <Ruler size={11} className="text-natural-secondary" /> Ustalone Wymiary Ciała Pupila
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {entry.dimensions.neck && (
                    <div className="p-2 bg-natural-cream/50 rounded-lg border border-natural-border/50 flex flex-col">
                      <span className="text-[9px] font-bold text-natural-primary/65 uppercase">Szyja</span>
                      <span className="text-xs font-serif font-extrabold text-natural-dark mt-0.5">{entry.dimensions.neck} cm</span>
                    </div>
                  )}
                  {entry.dimensions.chest && (
                    <div className="p-2 bg-natural-cream/50 rounded-lg border border-natural-border/50 flex flex-col">
                      <span className="text-[9px] font-bold text-natural-primary/65 uppercase">Klatka piersiowa</span>
                      <span className="text-xs font-serif font-extrabold text-natural-dark mt-0.5">{entry.dimensions.chest} cm</span>
                    </div>
                  )}
                  {entry.dimensions.length && (
                    <div className="p-2 bg-natural-cream/50 rounded-lg border border-natural-border/50 flex flex-col">
                      <span className="text-[9px] font-bold text-natural-primary/65 uppercase">Długość ciała</span>
                      <span className="text-xs font-serif font-extrabold text-natural-dark mt-0.5">{entry.dimensions.length} cm</span>
                    </div>
                  )}
                  {entry.dimensions.height && (
                    <div className="p-2 bg-natural-cream/50 rounded-lg border border-natural-border/50 flex flex-col">
                      <span className="text-[9px] font-bold text-natural-primary/65 uppercase">Wysokość</span>
                      <span className="text-xs font-serif font-extrabold text-natural-dark mt-0.5">{entry.dimensions.height} cm</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes Content */}
            {entry.content && (
              <div className="text-xs leading-relaxed text-natural-primary bg-white p-3.5 rounded-xl border border-natural-border whitespace-pre-wrap font-serif">
                {entry.content}
              </div>
            )}

            {/* Photo & Drawing Media Grid */}
            {(entry.photo || entry.drawing) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Attached Photo */}
                {entry.photo && (
                  <div className="flex flex-col bg-white border border-natural-border rounded-xl overflow-hidden shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-natural-primary/50 px-3 py-1.5 border-b border-natural-border bg-natural-cream">
                      Załączone zdjęcie
                    </span>
                    <div className="p-2 flex justify-center bg-natural-highlight/60">
                      <img
                        src={entry.photo}
                        alt="Załączone zdjęcie"
                        referrerPolicy="no-referrer"
                        className="max-h-[220px] max-w-full object-contain rounded-lg border border-natural-border"
                      />
                    </div>
                  </div>
                )}

                {/* Hand Written Drawing */}
                {entry.drawing && (
                  <div className="flex flex-col bg-white border border-natural-border rounded-xl overflow-hidden shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-natural-primary/50 px-3 py-1.5 border-b border-natural-border bg-natural-cream">
                      Odręczny szkic/pismo
                    </span>
                    <div className="p-2 flex justify-center bg-natural-highlight/30">
                      <img
                        src={entry.drawing}
                        alt="Odręczny szkic"
                        referrerPolicy="no-referrer"
                        className="max-h-[220px] max-w-full object-contain rounded-lg border border-natural-border bg-white"
                        style={{
                          backgroundImage: 'radial-gradient(#e8e2d9 1.5px, transparent 1.5px)',
                          backgroundSize: '16px 16px',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions and Utilities bar */}
            <div className="flex items-center justify-between pt-3 border-t border-natural-border text-natural-primary">
              <span className="text-[10px] font-medium text-natural-primary/55">
                Utworzono: {new Date(entry.createdAt).toLocaleDateString('pl-PL')} o {new Date(entry.createdAt).toLocaleTimeString('pl-PL', {hour: '2-digit', minute:'2-digit'})}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModalEntry(entry)}
                  className="px-3 py-1.5 inline-flex items-center gap-1.5 rounded-lg border border-natural-border hover:bg-natural-highlight text-natural-primary hover:text-natural-dark bg-natural-cream text-xs font-semibold transition shadow-xs cursor-pointer"
                  title="Otwórz w trybie czytania"
                >
                  <Maximize2 size={13} />
                  Pełny ekran
                </button>
                <button
                  type="button"
                  onClick={() => onEditEntry(entry)}
                  className="px-3 py-1.5 inline-flex items-center gap-1.5 rounded-lg border border-natural-border hover:bg-natural-highlight text-natural-primary hover:text-natural-dark bg-natural-cream text-xs font-semibold transition shadow-xs cursor-pointer"
                >
                  <Edit2 size={13} />
                  Edytuj
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirmId(entry.id)}
                  className="px-3 py-1.5 inline-flex items-center gap-1.5 rounded-lg border border-destructive/20 text-destructive bg-natural-cream hover:bg-destructive/5 text-xs font-semibold transition shadow-xs cursor-pointer"
                >
                  <Trash2 size={13} />
                  Usuń
                </button>
              </div>
            </div>

            {/* Inline Delete Safety verification */}
            {showDeleteConfirmId === entry.id && (
              <div className="p-3 bg-red-50/50 border border-red-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-150">
                <div className="text-center sm:text-left">
                  <p className="text-xs font-bold text-red-900">Czy na pewno usunąć ten wpis z dziennika?</p>
                  <p className="text-[10px] text-red-700">Tej operacji nie da się cofnąć.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirmId(null)}
                    className="px-2.5 py-1 text-[10px] font-bold bg-white text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-50 transition cursor-pointer"
                  >
                    Anuluj
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await onDeleteEntry(entry.id);
                      setShowDeleteConfirmId(null);
                    }}
                    className="px-2.5 py-1 text-[10px] font-bold bg-destructive text-white rounded-lg hover:bg-destructive-hover transition cursor-pointer"
                  >
                    Usuń wpis
                  </button>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      
      {/* Filtering Header */}
      <div className="bg-natural-cream p-4 rounded-2xl border border-natural-border shadow-xs space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-natural-secondary" size={17} />
          <input
            type="text"
            placeholder={`Szukaj we wpisach dla ${petName}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-natural-border rounded-xl focus:border-natural-sage focus:outline-none focus:ring-1 focus:ring-natural-sage/20 text-xs text-natural-primary transition font-medium"
          />
        </div>

        {/* Categories & Date Filter */}
        <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center">
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all border cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-natural-olive border-natural-olive text-white shadow-sm'
                  : 'bg-white border-natural-border text-natural-primary hover:bg-natural-highlight'
              }`}
            >
              Wszystkie
            </button>
            {Object.entries(CATEGORIES).map(([key, value]) => {
              const count = entries.filter((e) => e.category === key).length;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedCategory(key as CategoryType)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all border flex items-center gap-1 cursor-pointer ${
                    selectedCategory === key
                      ? 'bg-natural-olive border-natural-olive text-white shadow-sm'
                      : 'bg-white border-natural-border text-natural-primary hover:bg-natural-highlight'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: value.color }} />
                  {value.label}
                  {count > 0 && <span className="opacity-60 text-[10px]">({count})</span>}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-natural-border">
            <span className="text-[10px] uppercase font-bold text-natural-primary/50">Dzień:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2 py-1 bg-white border border-natural-border rounded-lg text-xs text-natural-primary font-medium focus:outline-none focus:border-natural-sage focus:ring-1 focus:ring-natural-sage/10"
            />
            {selectedDate && (
              <button
                type="button"
                onClick={() => setSelectedDate('')}
                className="text-xs text-natural-clay hover:text-natural-dark hover:underline cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Sorting Toggles */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2.5 border-t border-natural-border/50 justify-between items-start sm:items-center">
          <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-natural-primary/55">
            <span>Uporządkuj według:</span>
          </div>
          <div className="flex items-center gap-1 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setSortMode('newest')}
              className={`flex-1 sm:flex-none px-2.5 py-1.5 sm:py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer text-center ${
                sortMode === 'newest'
                  ? 'bg-natural-highlight border-natural-sage text-natural-dark shadow-xs'
                  : 'bg-white border-natural-border text-natural-primary hover:bg-natural-highlight'
              }`}
            >
              📅 Najnowsze
            </button>
            <button
              type="button"
              onClick={() => setSortMode('oldest')}
              className={`flex-1 sm:flex-none px-2.5 py-1.5 sm:py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer text-center ${
                sortMode === 'oldest'
                  ? 'bg-natural-highlight border-natural-sage text-natural-dark shadow-xs'
                  : 'bg-white border-natural-border text-natural-primary hover:bg-natural-highlight'
              }`}
            >
              ⏳ Najstarsze
            </button>
            <button
              type="button"
              onClick={() => setSortMode('category')}
              className={`flex-1 sm:flex-none px-2.5 py-1.5 sm:py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer text-center ${
                sortMode === 'category'
                  ? 'bg-natural-highlight border-natural-sage text-natural-dark shadow-xs'
                  : 'bg-white border-natural-border text-natural-primary hover:bg-natural-highlight'
              }`}
            >
              🗂️ Grupy kategorii
            </button>
          </div>
        </div>
      </div>

      {/* Diary Entry Lists */}
      <div className="flex-1 space-y-3 overflow-y-auto max-h-[60vh] md:max-h-[500px] pr-1">
        {filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-natural-cream rounded-3xl border border-natural-border text-center space-y-3 shadow-inner">
            <BookOpen size={40} className="w-12 h-12 text-natural-clay stroke-[1.25]" />
            <div>
              <p className="text-sm font-serif font-bold text-natural-dark">
                {entries.length === 0 ? 'Brak wpisów w pamiętniku' : 'Nie znaleziono wpisów'}
              </p>
              <p className="text-xs text-natural-primary/60 mt-1 max-w-sm mx-auto">
                {entries.length === 0
                  ? `Dziennik pupila ${petName} jest jeszcze pusty! Kliknij przycisk „Dodaj wpis”, aby rozpocząć prowadzenie notatek.`
                  : 'Spróbuj wyczyścić wyszukiwarkę lub zmień ustawienia filtrów.'}
              </p>
            </div>
            {entries.length === 0 && (
              <button
                type="button"
                onClick={onAddNewClick}
                className="px-4 py-2 bg-natural-secondary hover:bg-natural-olive text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition cursor-pointer"
              >
                Dodaj pierwszy wpis
              </button>
            )}
          </div>
        ) : sortMode === 'category' ? (
          <div className="space-y-6">
            {Object.entries(CATEGORIES).map(([catKey, catMeta]) => {
              const groupItems = (groupedEntriesObj as any)?.[catKey] || [];
              if (groupItems.length === 0) return null;
              
              return (
                <div key={catKey} className="space-y-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-natural-border/40">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: catMeta.color }} />
                    <h4 className="text-xs font-serif font-extrabold text-natural-dark uppercase tracking-wider">
                      {catMeta.label} <span className="text-natural-primary/50 text-[10px] font-sans font-medium">({groupItems.length})</span>
                    </h4>
                  </div>
                  <div className="space-y-3">
                    {groupItems.map((entry: DiaryEntry) => renderEntryCard(entry))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedEntries.map((entry) => renderEntryCard(entry))}
          </div>
        )}
      </div>

      {/* Modal View for full screen note */}
      {activeModalEntry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setActiveModalEntry(null)}
        >
          <div
            className="bg-natural-sand max-w-4xl w-full max-h-[90vh] rounded-3xl border border-natural-border shadow-2xl overflow-y-auto flex flex-col p-6 space-y-6 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-natural-border/70 pb-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${CATEGORIES[activeModalEntry.category]?.bg || 'bg-stone-50 border-stone-200 text-stone-800'} capitalize`}>
                    {CATEGORIES[activeModalEntry.category]?.label || activeModalEntry.category}
                  </span>
                  <span className="text-xs font-semibold text-natural-primary/80 flex items-center gap-1">
                    <Calendar size={13} className="text-natural-secondary" />
                    {activeModalEntry.date}
                  </span>
                  <span className="text-xs font-semibold text-natural-primary/80 flex items-center gap-1">
                    <Clock size={13} className="text-natural-secondary" />
                    {activeModalEntry.time}
                  </span>
                </div>
                <h2 className="text-xl font-serif font-extrabold text-natural-dark tracking-tight leading-tight">
                  {activeModalEntry.title}
                </h2>
                <p className="text-xs font-semibold text-natural-primary/60">
                  Wpis dla: <span className="font-extrabold text-natural-dark">{petName}</span>
                </p>
              </div>
              
              <button
                type="button"
                onClick={() => setActiveModalEntry(null)}
                className="p-2 border border-natural-border hover:bg-natural-cream text-natural-primary hover:text-natural-dark rounded-xl transition cursor-pointer shrink-0"
                title="Zamknij"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content - Expanded & Premium Readable font size / leading */}
            <div className="flex-1 space-y-6">
              
              {/* Dimensions structured display in Modal */}
              {activeModalEntry.category === 'pomiary' && activeModalEntry.dimensions && (activeModalEntry.dimensions.neck || activeModalEntry.dimensions.chest || activeModalEntry.dimensions.length || activeModalEntry.dimensions.height) && (
                <div className="bg-white/80 p-4 rounded-xl border border-natural-border/70 space-y-2.5 shadow-2xs">
                  <h4 className="text-xs font-bold text-[#867761] uppercase tracking-wider flex items-center gap-1.5 font-serif border-b border-natural-border/30 pb-2">
                    <Ruler size={13} className="text-natural-secondary" /> Ustalone Wymiary Ciała Pupila
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {activeModalEntry.dimensions.neck && (
                      <div className="p-3 bg-natural-cream/50 rounded-xl border border-natural-border/40 flex flex-col">
                        <span className="text-[10px] font-bold text-natural-primary/65 uppercase">Obwód szyi</span>
                        <span className="text-sm font-serif font-extrabold text-natural-dark mt-1">{activeModalEntry.dimensions.neck} cm</span>
                      </div>
                    )}
                    {activeModalEntry.dimensions.chest && (
                      <div className="p-3 bg-natural-cream/50 rounded-xl border border-natural-border/40 flex flex-col">
                        <span className="text-[10px] font-bold text-natural-primary/65 uppercase">Obwód klatki</span>
                        <span className="text-sm font-serif font-extrabold text-natural-dark mt-1">{activeModalEntry.dimensions.chest} cm</span>
                      </div>
                    )}
                    {activeModalEntry.dimensions.length && (
                      <div className="p-3 bg-natural-cream/50 rounded-xl border border-natural-border/40 flex flex-col">
                        <span className="text-[10px] font-bold text-natural-primary/65 uppercase">Długość ciała</span>
                        <span className="text-sm font-serif font-extrabold text-natural-dark mt-1">{activeModalEntry.dimensions.length} cm</span>
                      </div>
                    )}
                    {activeModalEntry.dimensions.height && (
                      <div className="p-3 bg-natural-cream/50 rounded-xl border border-natural-border/40 flex flex-col">
                        <span className="text-[10px] font-bold text-natural-primary/65 uppercase">Wysokość w kłębie</span>
                        <span className="text-sm font-serif font-extrabold text-natural-dark mt-1">{activeModalEntry.dimensions.height} cm</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeModalEntry.content && (
                <div className="bg-white rounded-2xl border border-natural-border p-6 shadow-xs text-sm leading-relaxed text-natural-primary whitespace-pre-wrap font-serif min-h-[120px]">
                  {activeModalEntry.content}
                </div>
              )}

              {/* Photo & Drawing Media Grid - Larger Formats */}
              {(activeModalEntry.photo || activeModalEntry.drawing) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Attached Photo */}
                  {activeModalEntry.photo && (
                    <div className="flex flex-col bg-white border border-natural-border rounded-2xl overflow-hidden shadow-xs">
                      <span className="text-xs uppercase font-extrabold text-natural-primary/60 px-4 py-2.5 border-b border-natural-border bg-natural-cream select-none">
                        📷 Pełnowymiarowe Zdjęcie
                      </span>
                      <div className="p-4 flex justify-center bg-natural-highlight/60">
                        <img
                          src={activeModalEntry.photo}
                          alt="Załączone zdjęcie"
                          referrerPolicy="no-referrer"
                          className="max-h-[480px] w-full object-contain rounded-xl border border-natural-border shadow-xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* Hand Written Drawing / Sketch */}
                  {activeModalEntry.drawing && (
                    <div className="flex flex-col bg-white border border-natural-border rounded-2xl overflow-hidden shadow-xs">
                      <span className="text-xs uppercase font-extrabold text-natural-primary/60 px-4 py-2.5 border-b border-natural-border bg-natural-cream select-none">
                        ✏️ Odręczny Szkic / Notatka
                      </span>
                      <div className="p-4 flex justify-center bg-natural-highlight/35">
                        <img
                          src={activeModalEntry.drawing}
                          alt="Odręczny szkic"
                          referrerPolicy="no-referrer"
                          className="max-h-[480px] w-full object-contain rounded-xl border border-natural-border shadow-xs bg-white"
                          style={{
                            backgroundImage: 'radial-gradient(#e8e2d9 1.5px, transparent 1.5px)',
                            backgroundSize: '16px 16px',
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="border-t border-natural-border/70 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-natural-primary/55">
                Utworzono wpis: {new Date(activeModalEntry.createdAt).toLocaleString('pl-PL')}
              </span>
              
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    onEditEntry(activeModalEntry);
                    setActiveModalEntry(null);
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 inline-flex items-center justify-center gap-2 rounded-xl border border-natural-border hover:bg-natural-highlight text-natural-primary hover:text-natural-dark bg-natural-cream text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Edit2 size={14} />
                  Edytuj wpis
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModalEntry(null)}
                  className="flex-1 sm:flex-none px-5 py-2 bg-natural-secondary hover:bg-natural-olive text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition text-center cursor-pointer"
                >
                  Zamknij podgląd
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
