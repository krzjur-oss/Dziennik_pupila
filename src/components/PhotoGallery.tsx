import React, { useState, useMemo } from 'react';
import { DiaryEntry, CategoryType } from '../types';
import { 
  Image as ImageIcon, 
  Palette, 
  Search, 
  Calendar, 
  Maximize2, 
  X, 
  Clock, 
  Edit2, 
  Download, 
  FileText,
  FileImage,
  Sparkles
} from 'lucide-react';
import { CATEGORIES } from '../utils';

interface PhotoGalleryProps {
  entries: DiaryEntry[];
  onEditEntry: (entry: DiaryEntry) => void;
  petName: string;
}

type MediaTypeFilter = 'all' | 'photo' | 'drawing';

export default function PhotoGallery({
  entries,
  onEditEntry,
  petName,
}: PhotoGalleryProps) {
  const [filterType, setFilterType] = useState<MediaTypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'all'>('all');
  const [fullscreenItem, setFullscreenItem] = useState<{ entry: DiaryEntry; type: 'photo' | 'drawing' } | null>(null);

  // Extract all files with media
  const galleryItems = useMemo(() => {
    const items: Array<{
      entry: DiaryEntry;
      id: string;
      src: string;
      type: 'photo' | 'drawing';
      title: string;
      date: string;
      time: string;
      category: CategoryType;
      content: string;
    }> = [];

    entries.forEach((entry) => {
      if (entry.photo) {
        items.push({
          entry,
          id: `${entry.id}-photo`,
          src: entry.photo,
          type: 'photo',
          title: entry.title,
          date: entry.date,
          time: entry.time,
          category: entry.category,
          content: entry.content || '',
        });
      }
      if (entry.drawing) {
        items.push({
          entry,
          id: `${entry.id}-drawing`,
          src: entry.drawing,
          type: 'drawing',
          title: entry.title,
          date: entry.date,
          time: entry.time,
          category: entry.category,
          content: entry.content || '',
        });
      }
    });

    // Chronological sorting (newest first)
    return items.sort((a, b) => {
      const dateTimeA = new Date(`${a.date}T${a.time || '12:00'}`).getTime();
      const dateTimeB = new Date(`${b.date}T${b.time || '12:00'}`).getTime();
      return dateTimeB - dateTimeA;
    });
  }, [entries]);

  // Filter gallery items
  const filteredItems = useMemo(() => {
    return galleryItems.filter((item) => {
      const matchesType =
        filterType === 'all' ||
        (filterType === 'photo' && item.type === 'photo') ||
        (filterType === 'drawing' && item.type === 'drawing');

      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.date.includes(searchQuery);

      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;

      return matchesType && matchesSearch && matchesCategory;
    });
  }, [galleryItems, filterType, searchQuery, selectedCategory]);

  const handleDownload = (src: string, title: string, type: string) => {
    const link = document.createElement('a');
    link.href = src;
    link.download = `${type}-${title.toLowerCase().replace(/\s+/g, '_')}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Controls & Mini Filters Panel */}
      <div className="bg-natural-cream rounded-2xl border border-natural-border p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Media Type Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-natural-sand/50 p-1 rounded-xl border border-natural-border/60 self-start">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                filterType === 'all'
                  ? 'bg-natural-secondary text-white shadow-xs'
                  : 'text-natural-primary/80 hover:bg-natural-highlight'
              }`}
            >
              <FileImage size={13} />
              Wszystkie ({galleryItems.length})
            </button>
            <button
              onClick={() => setFilterType('photo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                filterType === 'photo'
                  ? 'bg-natural-secondary text-white shadow-xs'
                  : 'text-natural-primary/80 hover:bg-natural-highlight'
              }`}
            >
              <ImageIcon size={13} />
              Zdjęcia ({galleryItems.filter(i => i.type === 'photo').length})
            </button>
            <button
              onClick={() => setFilterType('drawing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                filterType === 'drawing'
                  ? 'bg-natural-secondary text-white shadow-xs'
                  : 'text-natural-primary/80 hover:bg-natural-highlight'
              }`}
            >
              <Palette size={13} />
              Szkice ({galleryItems.filter(i => i.type === 'drawing').length})
            </button>
          </div>

          {/* Search bar & Category filter */}
          <div className="flex flex-wrap items-center gap-2 flex-1 md:justify-end">
            {/* Search inputs */}
            <div className="relative flex-1 max-w-xs min-w-[160px]">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-natural-primary/40">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Szukaj w galerii..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-natural-border hover:border-natural-clay/50 focus:border-natural-secondary focus:ring-1 focus:ring-natural-secondary/20 rounded-xl text-xs font-semibold placeholder-natural-primary/40 text-natural-dark outline-none transition shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-natural-primary/40 hover:text-natural-dark"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Category selection */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as CategoryType | 'all')}
              className="bg-white border border-natural-border text-natural-primary focus:border-natural-secondary focus:ring-1 focus:ring-natural-secondary/20 rounded-xl px-2.5 py-1.5 text-xs font-semibold outline-none transition shadow-2xs cursor-pointer min-w-[120px]"
            >
              <option value="all">Wszystkie kategorie</option>
              <option value="zdrowie">Zdrowie</option>
              <option value="jedzenie">Jedzenie</option>
              <option value="weterynarz">Weterynarz</option>
              <option value="aktywnosc">Aktywność</option>
              <option value="pielegnacja">Pielęgnacja</option>
              <option value="pomiary">Pomiary</option>
              <option value="notatka">Zwykła notatka</option>
            </select>
          </div>

        </div>
      </div>

      {/* Main Gallery Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const catInfo = CATEGORIES[item.category] || CATEGORIES.notatka;
            
            return (
              <div
                key={item.id}
                className="group relative bg-natural-cream rounded-2xl border border-natural-border overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-md flex flex-col justify-between"
              >
                {/* Image display container */}
                <div className="relative aspect-square w-full bg-natural-sand/30 overflow-hidden flex items-center justify-center">
                  <img
                    src={item.src}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Type Badge icon */}
                  <div className="absolute top-2 left-2 flex gap-1 items-center">
                    {item.type === 'photo' ? (
                      <span className="p-1 px-1.5 bg-natural-dark/70 text-white rounded-lg text-[9px] font-extrabold flex items-center gap-1 backdrop-blur-xs">
                        <ImageIcon size={10} /> Foto
                      </span>
                    ) : (
                      <span className="p-1 px-1.5 bg-natural-secondary/85 text-white rounded-lg text-[9px] font-extrabold flex items-center gap-1 backdrop-blur-xs">
                        <Palette size={10} /> Szkic
                      </span>
                    )}

                    <span className={`px-1.5 py-0.5 rounded-lg text-[8px] font-extrabold border bg-white/90 backdrop-blur-xs shadow-2xs text-natural-dark max-w-[80px] truncate capitalize`}>
                      {catInfo.label}
                    </span>
                  </div>

                  {/* Actions overlay visible on hover */}
                  <div className="absolute inset-0 bg-natural-dark/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setFullscreenItem({ entry: item.entry, type: item.type })}
                      className="p-2 bg-white/90 hover:bg-white text-natural-dark rounded-xl transition shadow-xs cursor-pointer"
                      title="Podgląd pełnoekranowy"
                    >
                      <Maximize2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDownload(item.src, item.title, item.type)}
                      className="p-2 bg-white/90 hover:bg-white text-natural-dark rounded-xl transition shadow-xs cursor-pointer"
                      title="Pobierz zdjęcie"
                    >
                      <Download size={14} />
                    </button>
                    <button
                      onClick={() => onEditEntry(item.entry)}
                      className="p-2 bg-natural-secondary text-white rounded-xl hover:bg-natural-olive transition shadow-xs cursor-pointer"
                      title="Edytuj wpis pamiętnika"
                    >
                      <Edit2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Brief Title and Info under Card */}
                <div className="p-3 space-y-1 bg-white border-t border-natural-border/45">
                  <h4 className="font-serif font-bold text-natural-dark text-xs truncate leading-snug">
                    {item.title || 'Bez tytułu'}
                  </h4>
                  
                  <div className="flex items-center justify-between text-[9px] text-[#867761] font-semibold">
                    <span className="flex items-center gap-0.5">
                      <Calendar size={10} className="shrink-0" />
                      {item.date}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Clock size={10} className="shrink-0" />
                      {item.time}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-natural-cream/65 border border-dashed border-natural-border p-12 rounded-3xl text-center space-y-3">
          <div className="w-12 h-12 bg-natural-highlight text-natural-primary/50 rounded-2xl flex items-center justify-center mx-auto">
            <ImageIcon size={22} />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-natural-dark">Brak dopasowanych zdjęć lub szkiców</p>
            <p className="text-[11px] text-natural-primary/70 max-w-sm mx-auto">
              {searchQuery || selectedCategory !== 'all' || filterType !== 'all'
                ? 'Spróbuj zmienić parametry filtrów i wyszukiwania lub zresetuj zapytanie.'
                : `W bazie nie ma jeszcze załączonych zdjęć ani rysunków odręcznych dla pupila ${petName}. Dodaj nową notatkę ze zdjęciem, aby je tu zobaczyć!`}
            </p>
          </div>
        </div>
      )}

      {/* Fullscreen Photo Viewer and Entry Details modal overlay */}
      {fullscreenItem && (
        <div
          className="fixed inset-0 bg-stone-950/95 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-[100] animate-in fade-in duration-200"
          onClick={() => setFullscreenItem(null)}
        >
          <div
            className="bg-natural-sand rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-hidden border border-natural-border shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Visual Screen section (7/12 width on desktop) */}
            <div className="relative bg-stone-900 flex-1 flex items-center justify-center min-h-[300px] md:min-h-0 md:w-3/5 overflow-hidden">
              <img
                src={fullscreenItem.type === 'photo' ? fullscreenItem.entry.photo : fullscreenItem.entry.drawing}
                alt={fullscreenItem.entry.title}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-[70vh] object-contain transition-all duration-300"
              />

              {/* Close button on image corner (mobile indicator) */}
              <button
                onClick={() => setFullscreenItem(null)}
                className="absolute top-4 right-4 p-2 bg-stone-950/80 text-white hover:text-stone-300 rounded-full transition cursor-pointer md:hidden"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sidebar Details section (5/12 width) */}
            <div className="w-full md:w-2/5 p-6 flex flex-col justify-between space-y-4 bg-natural-sand border-t md:border-t-0 md:border-l border-natural-border overflow-y-auto max-h-[45vh] md:max-h-full">
              
              {/* Context notes */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between shrink-0">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${CATEGORIES[fullscreenItem.entry.category]?.bg || 'bg-neutral-100'} capitalize`}>
                    {CATEGORIES[fullscreenItem.entry.category]?.label || 'Notatka'}
                  </span>
                  
                  <div className="hidden md:flex gap-1.5">
                    <button
                      onClick={() => handleDownload(
                        (fullscreenItem.type === 'photo' ? fullscreenItem.entry.photo : fullscreenItem.entry.drawing)!, 
                        fullscreenItem.entry.title, 
                        fullscreenItem.type
                      )}
                      className="p-1 px-2 border border-natural-border hover:bg-natural-highlight text-natural-primary hover:text-natural-dark text-[10px] font-bold rounded-lg transition cursor-pointer flex items-center gap-1 bg-white"
                      title="Pobierz ten plik"
                    >
                      <Download size={11} /> Pobierz
                    </button>
                    <button
                      onClick={() => setFullscreenItem(null)}
                      className="p-1 px-1.5 border border-natural-border hover:bg-natural-cream text-natural-primary hover:text-natural-dark rounded-lg transition cursor-pointer"
                      title="Zamknij"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-serif font-extrabold text-natural-dark text-base tracking-tight leading-snug">
                    {fullscreenItem.entry.title || 'Wpis bez tytułu'}
                  </h3>
                  
                  <p className="text-[10px] text-[#867761] font-bold flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {fullscreenItem.entry.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {fullscreenItem.entry.time}
                    </span>
                  </p>
                </div>

                <div className="border-t border-natural-border/50 pt-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#867761] mb-1 flex items-center gap-1 font-serif">
                    <FileText size={11} /> Treść wpisu z pamiętnika:
                  </h4>
                  {fullscreenItem.entry.content ? (
                    <p className="text-xs text-natural-primary leading-relaxed whitespace-pre-wrap max-h-[22vh] overflow-y-auto pr-1">
                      {fullscreenItem.entry.content}
                    </p>
                  ) : (
                    <p className="text-xs text-natural-primary/50 italic font-semibold">
                      Brak dodatkowego opisu tekstowego do tego załącznika.
                    </p>
                  )}
                </div>
              </div>

              {/* Interactive buttons */}
              <div className="border-t border-natural-border/50 pt-4 flex flex-col gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const entry = fullscreenItem.entry;
                    setFullscreenItem(null);
                    onEditEntry(entry);
                  }}
                  className="w-full py-2 bg-natural-secondary hover:bg-natural-olive text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Edit2 size={12} />
                  Edytuj ten pełny wpis
                </button>
                <button
                  type="button"
                  onClick={() => setFullscreenItem(null)}
                  className="w-full py-2 border border-natural-border bg-white text-natural-primary hover:text-natural-dark text-xs font-bold rounded-xl transition cursor-pointer md:hidden"
                >
                  Powrót do galerii
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
