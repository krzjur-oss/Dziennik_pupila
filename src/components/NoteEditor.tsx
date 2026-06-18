import React, { useState, useEffect, useRef } from 'react';
import { DiaryEntry, CategoryType } from '../types';
import { Camera, Calendar, Clock, Sparkles, X, ChevronRight, Edit3, Image as ImageIcon, Save, Check, Plus, Mic, MicOff } from 'lucide-react';
import { compressImageToBase64, CATEGORIES, extractWeight, extractWeightWithUnit } from '../utils';
import DrawingBoard from './DrawingBoard';

interface NoteEditorProps {
  activePetId: string;
  editingEntry?: DiaryEntry | null; // If passed, editing mode. If null, creating new.
  onSave: (entry: DiaryEntry) => Promise<void>;
  onCancel: () => void;
}

export default function NoteEditor({
  activePetId,
  editingEntry,
  onSave,
  onCancel,
}: NoteEditorProps) {
  // Pre-fill fields
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [category, setCategory] = useState<CategoryType>('notatka');
  const [content, setContent] = useState('');
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [drawing, setDrawing] = useState<string | undefined>(undefined);
  const [weightInput, setWeightInput] = useState('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'g'>('kg');
  const [lengthInput, setLengthInput] = useState('');
  const [chestInput, setChestInput] = useState('');
  const [neckInput, setNeckInput] = useState('');
  const [heightInput, setHeightInput] = useState('');

  // Drawing Canvas Toggle State
  const [showDrawingBoard, setShowDrawingBoard] = useState(false);
  const [loading, setLoading] = useState(false);

  // Web Speech API Voice Dictation State
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'pl-PL';

      rec.onstart = () => {
        setIsListening(true);
        isListeningRef.current = true;
        setSpeechError(null);
      };

      rec.onresult = (event: any) => {
        const lastResultIndex = event.resultIndex;
        for (let i = lastResultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const transcript = event.results[i][0].transcript;
            if (transcript) {
              setContent(prev => {
                const trimmed = prev.trim();
                return trimmed ? `${trimmed} ${transcript.trim()}` : transcript.trim();
              });
            }
          }
        }
      };

      rec.onerror = (event: any) => {
        console.error('Błąd rozpoznawania mowy:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Brak uprawnień do mikrofonu. Zezwól na dostęp do mikrofonu w ustawieniach przeglądarki.');
        } else if (event.error === 'service-not-allowed') {
          setSpeechError('Usługa rozpoznawania mowy jest obecnie niedostępna.');
        } else if (event.error === 'audio-capture') {
          setSpeechError('Nie wykryto mikrofonu lub wystąpił błąd zapisu.');
        } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setSpeechError(`Błąd mowy: ${event.error}`);
        }
        setIsListening(false);
        isListeningRef.current = false;
      };

      rec.onend = () => {
        setIsListening(false);
        isListeningRef.current = false;
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    setSpeechError(null);

    if (isListeningRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn('Speech recognition stop error:', err);
      }
      setIsListening(false);
      isListeningRef.current = false;
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        isListeningRef.current = true;
      } catch (err: any) {
        console.warn('Speech start error:', err);
        if (err.message && err.message.includes('already started')) {
          setIsListening(true);
          isListeningRef.current = true;
        } else {
          setSpeechError('Nie udało się uruchomić dyktowania. Spróbuj ponownie.');
        }
      }
    }
  };

  // Initialize form options
  useEffect(() => {
    if (editingEntry) {
      setTitle(editingEntry.title);
      setDate(editingEntry.date);
      setTime(editingEntry.time);
      setCategory(editingEntry.category);
      setContent(editingEntry.content);
      setPhoto(editingEntry.photo);
      setDrawing(editingEntry.drawing);
      if (editingEntry.drawing) {
        setShowDrawingBoard(true);
      } else {
        setShowDrawingBoard(false);
      }
      const parsed = extractWeightWithUnit(editingEntry);
      if (parsed) {
        setWeightInput(String(parsed.value));
        setWeightUnit(parsed.unit);
      } else {
        setWeightInput('');
        setWeightUnit('kg');
      }

      if (editingEntry.dimensions) {
        setLengthInput(editingEntry.dimensions.length ? String(editingEntry.dimensions.length) : '');
        setChestInput(editingEntry.dimensions.chest ? String(editingEntry.dimensions.chest) : '');
        setNeckInput(editingEntry.dimensions.neck ? String(editingEntry.dimensions.neck) : '');
        setHeightInput(editingEntry.dimensions.height ? String(editingEntry.dimensions.height) : '');
      } else {
        const contentText = editingEntry.content || '';
        const neckMatch = contentText.match(/obwód szyi:\s*(\d+(?:[.,]\d+)?)/i) || contentText.match(/szyja:\s*(\d+(?:[.,]\d+)?)/i);
        const chestMatch = contentText.match(/obwód klatki(?:\s*piersiowej)?:\s*(\d+(?:[.,]\d+)?)/i) || contentText.match(/klatka:\s*(\d+(?:[.,]\d+)?)/i);
        const lengthMatch = contentText.match(/długość(?: tułowia)?:\s*(\d+(?:[.,]\d+)?)/i) || contentText.match(/długość:\s*(\d+(?:[.,]\d+)?)/i);
        const heightMatch = contentText.match(/wysokość:\s*(\d+(?:[.,]\d+)?)/i);

        setNeckInput(neckMatch ? neckMatch[1] : '');
        setChestInput(chestMatch ? chestMatch[1] : '');
        setLengthInput(lengthMatch ? lengthMatch[1] : '');
        setHeightInput(heightMatch ? heightMatch[1] : '');
      }
    } else {
      // Create mode
      setTitle('');
      // Locale-adjusted current date and time
      const today = new Date();
      const yr = today.getFullYear();
      const mo = String(today.getMonth() + 1).padStart(2, '0');
      const dy = String(today.getDate()).padStart(2, '0');
      setDate(`${yr}-${mo}-${dy}`);

      const h = String(today.getHours()).padStart(2, '0');
      const m = String(today.getMinutes()).padStart(2, '0');
      setTime(`${h}:${m}`);

      setCategory('notatka');
      setContent('');
      setPhoto(undefined);
      setDrawing(undefined);
      setShowDrawingBoard(false);
      setWeightInput('');
      setWeightUnit('kg');
      setLengthInput('');
      setChestInput('');
      setNeckInput('');
      setHeightInput('');
    }
  }, [editingEntry, activePetId]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      // Compress note image to larger threshold
      const base64 = await compressImageToBase64(file, 900);
      setPhoto(base64);
    } catch (err) {
      console.error('Błąd wczytywania zdjęcia:', err);
      alert('Nie udało się zapisać zdjęcia. Spróbuj mniejszego pliku.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrawingChange = (dataUrl: string | undefined) => {
    setDrawing(dataUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      let finalContent = content.trim();
      let finalTitle = title.trim();

      const lengthVal = parseFloat(lengthInput.replace(',', '.'));
      const chestVal = parseFloat(chestInput.replace(',', '.'));
      const neckVal = parseFloat(neckInput.replace(',', '.'));
      const heightVal = parseFloat(heightInput.replace(',', '.'));

      const dimensionsObj = category === 'pomiary' ? {
        length: !isNaN(lengthVal) ? lengthVal : undefined,
        chest: !isNaN(chestVal) ? chestVal : undefined,
        neck: !isNaN(neckVal) ? neckVal : undefined,
        height: !isNaN(heightVal) ? heightVal : undefined,
      } : undefined;

      if ((category === 'pomiary' || category === 'weterynarz') && weightInput.trim()) {
        const weightVal = parseFloat(weightInput.replace(',', '.'));
        if (!isNaN(weightVal)) {
          const weightLine = `Waga: ${weightVal} ${weightUnit}`;
          const weightRegex = /waga:?\s*(?:\d+(?:[.,]\d+)?)\s*(?:kg|g|kilogram[a-z]*|gram[a-z]*)?/i;
          if (weightRegex.test(finalContent)) {
            finalContent = finalContent.replace(weightRegex, weightLine);
          } else {
            finalContent = finalContent ? `${weightLine}\n${finalContent}` : weightLine;
          }

          // Automatically construct a beautiful title if blank or placeholder-like
          if (!finalTitle || finalTitle.toLowerCase() === 'kontrola wagi' || finalTitle.toLowerCase() === 'nowy pomiar' || finalTitle === '' || finalTitle.startsWith('Waga:') || finalTitle.startsWith('Pomiar:')) {
            const hasDims = !isNaN(lengthVal) || !isNaN(chestVal) || !isNaN(neckVal) || !isNaN(heightVal);
            if (hasDims) {
              finalTitle = `Waga: ${weightVal} ${weightUnit} + Wymiary`;
            } else {
              finalTitle = `Waga: ${weightVal} ${weightUnit}`;
            }
          }
        }
      }

      if (category === 'pomiary') {
        const dimLines: string[] = [];
        if (!isNaN(neckVal)) dimLines.push(`Obwód szyi: ${neckVal} cm`);
        if (!isNaN(chestVal)) dimLines.push(`Obwód klatki piersiowej: ${chestVal} cm`);
        if (!isNaN(lengthVal)) dimLines.push(`Długość tułowia: ${lengthVal} cm`);
        if (!isNaN(heightVal)) dimLines.push(`Wysokość: ${heightVal} cm`);

        if (dimLines.length > 0) {
          const dimSection = `Wymiary:\n- ` + dimLines.join('\n- ');
          const dimRegex = /Wymiary:[\s\S]*?(?:\n\n|\n$|$)/i;
          if (dimRegex.test(finalContent)) {
            finalContent = finalContent.replace(dimRegex, dimSection + '\n\n');
          } else {
            finalContent = finalContent ? `${finalContent}\n\n${dimSection}` : dimSection;
          }
        }

        if (!weightInput.trim()) {
          const hasDims = !isNaN(lengthVal) || !isNaN(chestVal) || !isNaN(neckVal) || !isNaN(heightVal);
          if (hasDims && (!finalTitle || finalTitle.toLowerCase() === 'kontrola wagi' || finalTitle.toLowerCase() === 'nowy pomiar' || finalTitle === '' || finalTitle.startsWith('Waga:'))) {
            finalTitle = 'Kontrola wymiarów';
          }
        }
      }

      const entryPayload: DiaryEntry = {
        id: editingEntry?.id || Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
        petId: activePetId,
        date,
        time,
        category,
        title: finalTitle,
        content: finalContent,
        photo,
        drawing: showDrawingBoard ? drawing : undefined, // respect canvas closure
        dimensions: dimensionsObj,
        createdAt: editingEntry?.createdAt || Date.now(),
      };

      await onSave(entryPayload);
    } catch (err) {
      console.error('Błąd podczas zapisywania wpisu:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (newCat: CategoryType) => {
    setCategory(newCat);
    if (newCat === 'pomiary' && (!title || title.trim() === '')) {
      setTitle('Kontrola wagi');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-natural-cream rounded-3xl border border-natural-border shadow-xs overflow-hidden animate-in fade-in duration-200">
      
      {/* Editor Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-natural-border bg-natural-highlight/60">
        <div>
          <h2 className="text-base font-serif font-bold text-natural-dark flex items-center gap-1.5">
            <Sparkles size={16} className="text-natural-secondary fill-natural-secondary/30" />
            {editingEntry ? 'Edycja wpisu' : 'Nowy wpis w dzienniku'}
          </h2>
          <p className="text-natural-primary/70 text-xs mt-0.5">Dodaj szczegóły, zdjęcia oraz opcjonalne odręczne rysunki</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 px-3 border border-natural-border hover:bg-natural-highlight rounded-xl text-xs font-semibold text-natural-primary transition cursor-pointer"
        >
          Anuluj
        </button>
      </div>

      {/* Editor Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        
        {/* Title */}
        <div>
          <label className="block text-xs font-serif font-bold text-natural-dark uppercase tracking-wider mb-1.5">
            Tytuł wpisu <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="np. Podanie witamin, Pierwszy spacer, Kontrola wagi..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-natural-border rounded-xl focus:border-natural-sage focus:outline-none focus:ring-1 focus:ring-natural-sage/20 transition text-natural-primary text-sm font-medium"
          />
        </div>

        {/* Date, Time & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Date */}
          <div>
            <label className="block text-xs font-serif font-bold text-natural-dark uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Calendar size={13} className="text-natural-secondary" />
              Data
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-natural-border rounded-xl text-xs text-natural-primary font-medium focus:outline-none focus:border-natural-sage focus:ring-1 focus:ring-natural-sage/20"
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-xs font-serif font-bold text-natural-dark uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Clock size={13} className="text-natural-secondary" />
              Godzina
            </label>
            <input
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-natural-border rounded-xl text-xs text-natural-primary font-medium focus:outline-none focus:border-natural-sage focus:ring-1 focus:ring-natural-sage/20"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-serif font-bold text-natural-dark uppercase tracking-wider mb-1.5">Kategoria</label>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value as CategoryType)}
              className="w-full px-3 py-1.5 bg-white border border-natural-border rounded-xl text-xs text-natural-primary font-medium focus:outline-none focus:border-natural-sage focus:ring-1 focus:ring-natural-sage/20 capitalize"
            >
              {Object.entries(CATEGORIES).map(([key, value]) => (
                <option key={key} value={key} className="capitalize text-natural-primary bg-natural-cream">
                  {value.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dedicated Weight assistant input for 'pomiary' or 'weterynarz' category */}
        {(category === 'pomiary' || category === 'weterynarz') && (
          <div className="bg-natural-highlight/80 border border-natural-border/70 rounded-2xl p-4 animate-in fade-in duration-200 space-y-4">
            
            {/* Waga Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-natural-border/40 pb-3 last:border-b-0 last:pb-0">
              <div>
                <h4 className="text-xs font-serif font-bold text-natural-dark uppercase tracking-wider flex items-center gap-1.5">
                  ⚖️ Kontrola Wagi Pupila
                </h4>
                <p className="text-[10px] text-natural-primary/70 mt-0.5">
                  Wprowadź wagę w kilogramach (kg) lub gramach (g), aby automatycznie narysować wykres w profilu zwierzaka.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder={weightUnit === 'kg' ? 'np. 14.5' : 'np. 450'}
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  className="w-24 px-3 py-1.5 bg-white border border-natural-border rounded-xl text-xs text-natural-dark font-bold focus:outline-none focus:border-natural-sage text-center"
                />
                <select
                  value={weightUnit}
                  onChange={(e) => setWeightUnit(e.target.value as 'kg' | 'g')}
                  className="px-2 py-1.5 bg-white border border-natural-border rounded-xl text-xs text-natural-dark font-bold focus:outline-none focus:border-natural-sage cursor-pointer"
                >
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                </select>
              </div>
            </div>

            {/* Wymiary Grid (Only for category 'pomiary') */}
            {category === 'pomiary' && (
              <div className="pt-1.5 space-y-3">
                <div>
                  <h4 className="text-xs font-serif font-bold text-natural-dark uppercase tracking-wider flex items-center gap-1.5">
                    📏 Kontrola Wymiarów Pupila (cm)
                  </h4>
                  <p className="text-[10px] text-natural-primary/70 mt-0.5">
                    Podaj wymiary ciała zwierzaka w centymetrach (cm) dla lepszego monitorowania rozwoju.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* Obwód Szyi */}
                  <div className="bg-white/80 p-2 rounded-xl border border-natural-border/60 space-y-1">
                    <label className="block text-[9px] font-bold text-[#867761] uppercase">Obwód szyi</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="np. 24"
                        value={neckInput}
                        onChange={(e) => setNeckInput(e.target.value)}
                        className="w-full bg-transparent text-xs font-bold text-natural-dark focus:outline-none placeholder-natural-primary/30"
                      />
                      <span className="text-[10px] font-bold text-natural-primary/50">cm</span>
                    </div>
                  </div>

                  {/* Obwód Klatki */}
                  <div className="bg-white/80 p-2 rounded-xl border border-natural-border/60 space-y-1">
                    <label className="block text-[9px] font-bold text-[#867761] uppercase">Obwód klatki</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="np. 45"
                        value={chestInput}
                        onChange={(e) => setChestInput(e.target.value)}
                        className="w-full bg-transparent text-xs font-bold text-natural-dark focus:outline-none placeholder-natural-primary/30"
                      />
                      <span className="text-[10px] font-bold text-natural-primary/50">cm</span>
                    </div>
                  </div>

                  {/* Długość ciała */}
                  <div className="bg-white/80 p-2 rounded-xl border border-natural-border/60 space-y-1">
                    <label className="block text-[9px] font-bold text-[#867761] uppercase">Długość ciała</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="np. 38"
                        value={lengthInput}
                        onChange={(e) => setLengthInput(e.target.value)}
                        className="w-full bg-transparent text-xs font-bold text-natural-dark focus:outline-none placeholder-natural-primary/30"
                      />
                      <span className="text-[10px] font-bold text-natural-primary/50">cm</span>
                    </div>
                  </div>

                  {/* Wysokość */}
                  <div className="bg-white/80 p-2 rounded-xl border border-natural-border/60 space-y-1">
                    <label className="block text-[9px] font-bold text-[#867761] uppercase">Wysokość</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="np. 32"
                        value={heightInput}
                        onChange={(e) => setHeightInput(e.target.value)}
                        className="w-full bg-transparent text-xs font-bold text-natural-dark focus:outline-none placeholder-natural-primary/30"
                      />
                      <span className="text-[10px] font-bold text-natural-primary/50">cm</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Text Area */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-serif font-bold text-natural-dark uppercase tracking-wider">
              Treść notatki
            </label>
            {speechSupported && (
              <button
                type="button"
                onClick={toggleListening}
                className={`px-3 py-1 rounded-xl text-[10px] font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs border ${
                  isListening
                    ? 'bg-red-50 border-red-200 text-red-700 animate-pulse'
                    : 'bg-white border-natural-border hover:bg-natural-highlight text-natural-primary hover:text-natural-dark'
                }`}
              >
                {isListening ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse shrink-0" />
                    <Mic size={11} className="text-red-600 animate-bounce" />
                    <span>Słucham... (kliknij by zatrzymać)</span>
                  </>
                ) : (
                  <>
                    <Mic size={11} className="text-natural-secondary" />
                    <span>Dyktuj głosowo (PL)</span>
                  </>
                )}
              </button>
            )}
          </div>
          <div className="relative">
            <textarea
              placeholder="Opisz co się wydarzyło, zachowanie zwierzątka, podane jedzenie, zalecenia weterynarza..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className={`w-full px-4 py-3 bg-white border rounded-xl focus:border-natural-sage focus:outline-none focus:ring-1 focus:ring-natural-sage/20 transition text-natural-primary text-sm ${
                isListening ? 'border-red-200 bg-red-50/10 focus:border-red-200 focus:ring-red-200/20' : 'border-natural-border'
              }`}
            />
            {isListening && (
              <div className="absolute bottom-3 right-3 text-[9px] font-bold text-red-600 flex items-center gap-1.5 bg-red-50/80 px-2 py-1 rounded-lg border border-red-100 backdrop-blur-xs pointer-events-none select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping shrink-0" />
                Dyktowanie włączone
              </div>
            )}
          </div>
          {speechError && (
            <div className="mt-1.5 text-xs text-red-600 font-semibold flex items-center gap-1 bg-red-50 border border-red-100 px-3 py-1.5 rounded-xl animate-in fade-in slide-in-from-top-1 duration-150">
              <span className="text-sm shrink-0">⚠️</span>
              <p>{speechError}</p>
            </div>
          )}
        </div>

        {/* Photo Upload with camera option */}
        <div className="border border-natural-border rounded-2xl p-4 bg-natural-highlight/40">
          <label className="block text-xs font-serif font-bold text-natural-dark uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ImageIcon size={14} className="text-natural-secondary" />
            Załącznik: Zdjęcie (np. z aparatu)
          </label>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            
            {/* Upload labels */}
            <div className="flex-1 flex gap-2">
              <label className="cursor-pointer flex-1 flex items-center justify-center gap-1.5 px-4 py-2 border border-natural-border bg-white hover:bg-natural-highlight text-natural-primary text-xs font-semibold rounded-xl shadow-xs transition">
                <Camera size={14} className="text-natural-secondary" />
                Wybierz plik / Aparat
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>

              {photo && (
                <button
                  type="button"
                  onClick={() => setPhoto(undefined)}
                  className="px-3 py-2 border border-destructive/20 text-destructive bg-white hover:bg-destructive/5 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Usuń
                </button>
              )}
            </div>

            {/* Photo preview bubble */}
            {photo && (
              <div className="relative w-24 h-16 rounded-xl border border-natural-border overflow-hidden shrink-0 shadow-sm self-center">
                <img src={photo} alt="Załącznik" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              </div>
            )}
            
          </div>
        </div>

        {/* Stylus Sketch / Handwritten canvas switch */}
        <div className="border border-natural-border rounded-2xl p-4 bg-natural-highlight/40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Edit3 size={15} className="text-natural-olive" />
              <div>
                <h4 className="text-xs font-serif font-bold text-natural-dark uppercase tracking-wider">
                  Notatnik odręczny / Szkic rysikiem
                </h4>
                <p className="text-[10px] text-natural-primary/60 font-medium">Zapisz odręczny rysunek za pomocą rysika lub palca</p>
              </div>
            </div>

            {/* Toggle switch */}
            <button
              type="button"
              onClick={() => {
                setShowDrawingBoard(!showDrawingBoard);
                if (showDrawingBoard) {
                  setDrawing(undefined); // discard drawing if turning off
                }
              }}
              className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                showDrawingBoard
                  ? 'bg-natural-secondary text-white shadow-sm'
                  : 'bg-natural-cream border border-natural-border text-natural-primary hover:bg-natural-highlight'
              }`}
            >
              {showDrawingBoard ? (
                <>
                  <X size={12} /> Descyduj wyłączyć rysik
                </>
              ) : (
                <>
                  <Plus size={12} /> Aktywuj panel pisma
                </>
              )}
            </button>
          </div>

          {/* Embedded Drawing Canvas */}
          {showDrawingBoard && (
            <div className="mt-3 animate-in fade-in duration-250">
              <DrawingBoard
                initialData={drawing}
                onChange={handleDrawingChange}
                height={260}
              />
            </div>
          )}
        </div>

      </div>

      {/* Editor Footer / Submit */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-natural-border bg-natural-highlight/60">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-semibold text-natural-primary/70 hover:text-natural-dark hover:bg-natural-highlight px-3 py-2 rounded-xl transition cursor-pointer"
        >
          Sprawdź bez zmian
        </button>

        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="px-6 py-2.5 rounded-xl text-xs font-bold bg-natural-olive text-white hover:bg-natural-dark disabled:opacity-50 hover:shadow-md transition flex items-center gap-1.5 cursor-pointer"
        >
          <Save size={14} />
          {loading ? 'Zapisywanie...' : 'Zapisz wpis'}
        </button>
      </div>

    </form>
  );
}
