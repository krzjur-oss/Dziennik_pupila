import React, { useState, useMemo, useEffect, useRef } from 'react';
import { HealthEvent, HealthEventType, Pet } from '../types';
import {
  Calendar,
  Clock,
  Plus,
  X,
  Check,
  Trash2,
  AlertTriangle,
  Bell,
  CheckCircle,
  Circle,
  ChevronDown,
  ChevronUp,
  Info,
  Sparkles,
  CheckCheck,
  ListTodo,
  ClipboardCheck
} from 'lucide-react';
import { getCarePlanForPet, ChecklistTaskItem } from '../data/careChecklists';

interface HealthCalendarProps {
  activePet: Pet;
  events: HealthEvent[];
  onAddEvent: (eventData: Omit<HealthEvent, 'id' | 'petId' | 'createdAt' | 'isCompleted'>) => void;
  onToggleComplete: (id: string) => void;
  onDeleteEvent: (id: string) => void;
}

const EVENT_TYPES: Record<HealthEventType, { label: string; icon: string; bg: string; text: string; border: string }> = {
  szczepienie: {
    label: 'Szczepienie',
    icon: '💉',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200'
  },
  wizyta: {
    label: 'Wizyta',
    icon: '🩺',
    bg: 'bg-teal-50',
    text: 'text-teal-800',
    border: 'border-teal-200'
  },
  odrobaczanie: {
    label: 'Odrobaczanie',
    icon: '💊',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200'
  },
  leki: {
    label: 'Leki',
    icon: '💊',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200'
  },
  pielegnacja: {
    label: 'Pielęgnacja',
    icon: '✂️',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200'
  },
  inne: {
    label: 'Inne',
    icon: '🗓️',
    bg: 'bg-stone-50',
    text: 'text-stone-800',
    border: 'border-stone-200'
  }
};

const WEEK_DAYS = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];

export default function HealthCalendar({
  activePet,
  events,
  onAddEvent,
  onToggleComplete,
  onDeleteEvent
}: HealthCalendarProps) {
  // Main view tab: 'todos' or 'checklist'
  const [activeTab, setActiveTab] = useState<'todos' | 'checklist'>('todos');
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('upcoming');
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState<HealthEventType>('pielegnacja');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Expand notes state
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  // Care plan specific to active pet
  const carePlan = useMemo(() => {
    return getCarePlanForPet(activePet.species, activePet.customSpecies, activePet.notes);
  }, [activePet.species, activePet.customSpecies, activePet.notes]);

  // Saved cleaning days for this pet (e.g. ['Śr', 'Sob'])
  const [cleaningDays, setCleaningDays] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(`cleaning_days_${activePet.id}`);
      return stored ? JSON.parse(stored) : ['Sob'];
    } catch {
      return ['Sob'];
    }
  });

  const toggleCleaningDay = (day: string) => {
    const updated = cleaningDays.includes(day)
      ? cleaningDays.filter(d => d !== day)
      : [...cleaningDays, day];
    setCleaningDays(updated);
    try {
      localStorage.setItem(`cleaning_days_${activePet.id}`, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save cleaning days:', e);
    }
  };

  // Notification states
  const notificationsSupported = useMemo(() => {
    return typeof window !== 'undefined' && 'Notification' in window;
  }, []);

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  const requestNotificationPermission = async () => {
    if (!notificationsSupported) return;
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        new Notification("Dziennik Pupila", {
          body: "Powiadomienia systemowe zostały pomyślnie włączone!",
          icon: "/favicon.ico"
        });
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    }
  };

  const triggerTestNotification = () => {
    if (notificationsSupported && notificationPermission === 'granted') {
      try {
        new Notification(`Test powiadomień: ${activePet.name}`, {
          body: `Przypomnienie dla pupila ${activePet.name} jest aktywne!`,
          icon: activePet.avatar || "/favicon.ico"
        });
      } catch (err) {
        console.warn("Notification error:", err);
      }
    }
  };

  // Filter events for the active pet
  const petEvents = useMemo(() => {
    return events.filter(e => e.petId === activePet.id);
  }, [events, activePet.id]);

  // Today string YYYY-MM-DD
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Alert/Reminders check (within nearest 7 days, and not completed)
  const alertReminders = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return petEvents
      .filter((e) => !e.isCompleted)
      .map((e) => {
        const eventDate = new Date(e.date);
        eventDate.setHours(0, 0, 0, 0);
        const diffTime = eventDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return { event: e, diffDays };
      })
      .filter((item) => item.diffDays <= 7)
      .sort((a, b) => a.diffDays - b.diffDays);
  }, [petEvents]);

  // Filtered lists shown in the calendar list
  const filteredEvents = useMemo(() => {
    let list = [...petEvents];
    
    // Sort chronological ascending (nearest events on top)
    list.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
      const dateB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
      return dateA - dateB;
    });

    if (filter === 'upcoming') {
      return list.filter((e) => !e.isCompleted);
    }
    if (filter === 'completed') {
      return list.filter((e) => e.isCompleted);
    }
    return list;
  }, [petEvents, filter]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Nazwa wydarzenia jest wymagana.');
      return;
    }
    if (!date) {
      setFormError('Data jest wymagana.');
      return;
    }

    onAddEvent({
      title: title.trim(),
      type,
      date,
      time: time || undefined,
      notes: notes.trim() || undefined
    });

    // Reset Form
    setTitle('');
    setType('pielegnacja');
    setDate('');
    setTime('');
    setNotes('');
    setFormError('');
    setIsFormOpen(false);
  };

  // Add a task directly from checklist or presets
  const handleAddDirectTask = (item: { title: string; type: HealthEventType; time?: string; notes?: string }, targetDate?: string) => {
    const scheduledDate = targetDate || todayStr;
    onAddEvent({
      title: item.title,
      type: item.type,
      date: scheduledDate,
      time: item.time,
      notes: item.notes
    });
  };

  // Batch plan today's routine tasks from care plan (morning, day, evening)
  const handlePlanDailyRoutine = () => {
    const dailySections = carePlan.sections.filter(s => s.id === 'morning' || s.id === 'day' || s.id === 'evening');
    let addedCount = 0;

    dailySections.forEach(section => {
      section.items.forEach(task => {
        // Check if task with similar title already exists for today
        const alreadyExists = petEvents.some(
          e => e.date === todayStr && e.title.toLowerCase().includes(task.title.toLowerCase().substring(0, 15))
        );

        if (!alreadyExists) {
          handleAddDirectTask({
            title: task.title,
            type: task.type,
            time: task.time,
            notes: task.notes || task.warning
          }, todayStr);
          addedCount++;
        }
      });
    });

    // Switch to todos tab to show the freshly planned items
    setActiveTab('todos');
  };

  const getDayLabel = (diffDays: number) => {
    if (diffDays < 0) return `Zaległe (${Math.abs(diffDays)}d)!`;
    if (diffDays === 0) return 'Dzisiaj!';
    if (diffDays === 1) return 'Jutro!';
    if (diffDays > 1) return `Za ${diffDays} dni`;
    return 'Nadchodzące';
  };

  return (
    <div className="bg-natural-sand rounded-3xl border border-natural-border p-5 space-y-4 shadow-xs">
      
      {/* Header and Add button */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-serif font-bold text-natural-dark uppercase tracking-wider flex items-center gap-1.5">
            <span className="text-base">{carePlan.emoji}</span>
            Zadania i Terminarz (To-Do)
          </h3>
          <p className="text-[10px] text-natural-primary/70">
            Dostosowane do: <strong className="text-natural-dark font-semibold">{carePlan.speciesName}</strong>
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setIsFormOpen(!isFormOpen);
              setFormError('');
              if (!date) setDate(todayStr);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs ${
              isFormOpen
                ? 'bg-natural-highlight border border-natural-border text-natural-dark hover:bg-natural-border'
                : 'bg-natural-sage hover:bg-natural-olive text-white'
            }`}
          >
            {isFormOpen ? <X size={13} /> : <Plus size={13} />}
            {isFormOpen ? 'Anuluj' : 'Dodaj zadanie'}
          </button>
        </div>
      </div>

      {/* Primary View Switcher: To-Do List vs Species Care Checklist */}
      <div className="flex p-1 bg-natural-highlight/80 rounded-2xl border border-natural-border/70 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('todos')}
          className={`flex-1 py-1.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'todos'
              ? 'bg-white text-natural-dark shadow-2xs font-extrabold border border-natural-border/40'
              : 'text-natural-primary hover:text-natural-dark'
          }`}
        >
          <ListTodo size={14} className={activeTab === 'todos' ? 'text-natural-secondary' : 'opacity-60'} />
          <span>Moje Zadania</span>
          <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-natural-sand text-natural-dark font-mono">
            {petEvents.filter(e => !e.isCompleted).length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('checklist')}
          className={`flex-1 py-1.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'checklist'
              ? 'bg-white text-natural-dark shadow-2xs font-extrabold border border-natural-border/40'
              : 'text-natural-primary hover:text-natural-dark'
          }`}
        >
          <ClipboardCheck size={14} className={activeTab === 'checklist' ? 'text-natural-secondary' : 'opacity-60'} />
          <span>Checklista opieki</span>
          <span className="text-xs">{carePlan.emoji}</span>
        </button>
      </div>

      {/* Dynamic system notifications toggle/badge */}
      {notificationsSupported && (
        <div className="bg-white/80 border border-natural-border/60 rounded-2xl p-2.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm shrink-0">
              {notificationPermission === 'granted' ? '🔔' : notificationPermission === 'denied' ? '🔕' : '💡'}
            </span>
            <div className="min-w-0">
              <p className="font-bold text-natural-dark text-[11px] leading-tight">
                Powiadomienia Push
              </p>
              <p className="text-[9px] text-natural-primary/75 truncate leading-tight mt-0.5">
                {notificationPermission === 'granted' 
                  ? 'Włączone (otrzymasz przypomnienia na pulpicie i w telefonie)'
                  : notificationPermission === 'denied'
                  ? 'Zablokowane w uprawnieniach przeglądarki'
                  : 'Kliknij, aby włączyć powiadomienia'}
              </p>
            </div>
          </div>
          {notificationPermission === 'default' && (
            <button
              type="button"
              onClick={requestNotificationPermission}
              className="px-2.5 py-1 bg-natural-sage hover:bg-natural-olive text-white rounded-lg text-[10px] font-bold transition shrink-0 cursor-pointer shadow-2xs"
            >
              Włącz
            </button>
          )}
          {notificationPermission === 'granted' && (
            <button
              type="button"
              onClick={triggerTestNotification}
              className="px-2 py-1 bg-natural-highlight border border-natural-border text-natural-dark rounded-lg text-[10px] font-semibold hover:bg-natural-border transition shrink-0 cursor-pointer"
              title="Wyślij testowe powiadomienie"
            >
              Przetestuj
            </button>
          )}
        </div>
      )}

      {/* Alert Reminders Section */}
      {alertReminders.length > 0 && (
        <div className="bg-amber-50 border border-amber-200/70 rounded-2xl p-3 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-1.5 text-amber-900 font-extrabold text-xs">
            <Bell size={13} className="text-amber-600 animate-bounce shrink-0" />
            <span>Zbliżające się przypomnienia ({alertReminders.length}):</span>
          </div>
          <div className="space-y-1.5 max-h-[130px] overflow-y-auto pr-1">
            {alertReminders.map(({ event, diffDays }) => {
              const info = EVENT_TYPES[event.type] || EVENT_TYPES.inne;
              return (
                <div
                  key={event.id}
                  className="bg-white border border-amber-200 rounded-xl p-2 flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm shrink-0">{info.icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-natural-dark truncate leading-tight">
                        {event.title}
                      </p>
                      <p className="text-[10px] text-natural-primary/75 leading-tight flex items-center gap-1 flex-wrap mt-0.5">
                        <span>{event.date}</span>
                        {event.time && <span>• {event.time}</span>}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shrink-0 border uppercase text-center ${
                      diffDays < 0
                        ? 'bg-red-100 border-red-300 text-red-800'
                        : diffDays === 0
                        ? 'bg-amber-100 border-amber-300 text-amber-800'
                        : 'bg-amber-50 border-amber-200 text-amber-700'
                    }`}
                  >
                    {getDayLabel(diffDays)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Event Form View */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-natural-border p-4 space-y-3.5 animate-in slide-in-from-top-3 duration-200">
          <div className="border-b border-natural-border/60 pb-1.5 flex items-center justify-between">
            <h4 className="text-xs font-serif font-extrabold text-natural-dark uppercase tracking-wider flex items-center gap-1.5">
              <span>{carePlan.emoji}</span>
              Zaplanuj zadanie dla: {activePet.name}
            </h4>
          </div>

          {/* Quick presets dynamically tailored to activePet.species */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-bold text-natural-primary/80 uppercase">
                Szablony zadań dla {carePlan.speciesName}:
              </label>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-1">
              {carePlan.quickPresets.map((preset) => (
                <button
                  key={preset.title}
                  type="button"
                  onClick={() => {
                    setTitle(preset.title);
                    setType(preset.type);
                    if (preset.time) setTime(preset.time);
                    if (preset.notes) setNotes(preset.notes);
                    if (!date) setDate(todayStr);
                  }}
                  className="text-[10px] px-2 py-1 rounded-lg bg-natural-highlight hover:bg-natural-sand text-natural-dark border border-natural-border font-medium transition cursor-pointer text-left flex items-center gap-1"
                >
                  <span className="text-[10px]">{EVENT_TYPES[preset.type]?.icon || '📌'}</span>
                  <span>+ {preset.title}</span>
                </button>
              ))}
            </div>
          </div>

          {formError && (
            <p className="text-[10px] font-bold text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
              ⚠️ {formError}
            </p>
          )}

          <div className="grid grid-cols-1 gap-3">
            {/* Title */}
            <div>
              <label className="block text-[10px] font-bold text-natural-primary/80 uppercase mb-1">
                Nazwa zadania / wydarzenia *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="np. Podaj witaminę C, Obcięcie pazurów"
                className="w-full px-3 py-2 bg-natural-sand/30 border border-natural-border focus:border-natural-sage focus:outline-none rounded-xl text-xs text-natural-dark"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Type Category */}
              <div>
                <label className="block text-[10px] font-bold text-natural-primary/80 uppercase mb-1">
                  Kategoria
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as HealthEventType)}
                  className="w-full px-2 py-2 bg-natural-sand/30 border border-natural-border focus:border-natural-sage focus:outline-none rounded-xl text-xs text-natural-dark cursor-pointer font-medium"
                >
                  {Object.entries(EVENT_TYPES).map(([key, meta]) => (
                    <option key={key} value={key}>
                      {meta.icon} {meta.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-[10px] font-bold text-natural-primary/80 uppercase mb-1">
                  Data *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-2 py-1.5 bg-natural-sand/30 border border-natural-border focus:border-natural-sage focus:outline-none rounded-xl text-xs text-natural-dark"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 items-end">
              {/* Time */}
              <div>
                <label className="block text-[10px] font-bold text-natural-primary/80 uppercase mb-1">
                  Godzina (opcjonalnie)
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-2 py-1.5 bg-natural-sand/30 border border-natural-border focus:border-natural-sage focus:outline-none rounded-xl text-xs text-natural-dark"
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="w-full py-2 bg-natural-secondary hover:bg-natural-olive text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition flex items-center justify-center gap-1 cursor-pointer"
              >
                Zapisz zadanie
              </button>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[10px] font-bold text-natural-primary/80 uppercase mb-1">
                Wskazówki / Notatka (opcjonalnie)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="np. Podać z plasterkiem czerwonej papryki"
                rows={2}
                className="w-full px-3 py-2 bg-natural-sand/30 border border-natural-border focus:border-natural-sage focus:outline-none rounded-xl text-xs text-natural-dark font-sans resize-none"
              />
            </div>
          </div>
        </form>
      )}

      {/* TAB 1: TO-DO LIST VIEW */}
      {activeTab === 'todos' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          {/* Filter toggle */}
          <div className="flex border border-natural-border rounded-xl overflow-hidden bg-white">
            <button
              type="button"
              onClick={() => setFilter('upcoming')}
              className={`flex-1 py-1.5 text-center text-[10px] font-bold transition-all cursor-pointer border-r border-natural-border/30 ${
                filter === 'upcoming'
                  ? 'bg-natural-highlight text-natural-dark'
                  : 'text-natural-primary hover:bg-natural-cream'
              }`}
            >
              ⏳ Nadchodzące
            </button>
            <button
              type="button"
              onClick={() => setFilter('completed')}
              className={`flex-1 py-1.5 text-center text-[10px] font-bold transition-all cursor-pointer border-r border-natural-border/30 ${
                filter === 'completed'
                  ? 'bg-natural-highlight text-natural-dark'
                  : 'text-natural-primary hover:bg-natural-cream'
              }`}
            >
              ✅ Wykonane
            </button>
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`flex-1 py-1.5 text-center text-[10px] font-bold transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-natural-highlight text-natural-dark'
                  : 'text-natural-primary hover:bg-natural-cream'
              }`}
            >
              📋 Wszystkie
            </button>
          </div>

          {/* Events List */}
          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-6 px-4 border border-dashed border-natural-border rounded-2xl bg-white/40 space-y-2">
                <Calendar className="mx-auto text-natural-primary/30 shrink-0 w-8 h-8 stroke-[1.25]" />
                <p className="text-[11px] font-serif font-bold text-natural-primary/60">
                  {filter === 'upcoming'
                    ? 'Brak zaplanowanych zadań'
                    : filter === 'completed'
                    ? 'Brak wykonanych zadań'
                    : 'Brak zadań w terminarzu'}
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('checklist')}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-natural-secondary hover:text-natural-dark px-3 py-1 rounded-xl bg-natural-highlight border border-natural-border transition cursor-pointer"
                  >
                    <Sparkles size={12} />
                    Otwórz checklistę opieki dla {activePet.name}
                  </button>
                </div>
              </div>
            ) : (
              filteredEvents.map((event) => {
                const info = EVENT_TYPES[event.type] || EVENT_TYPES.inne;
                const isExpanded = !!expandedIds[event.id];

                return (
                  <div
                    key={event.id}
                    className={`bg-white border rounded-2xl transition-all duration-200 overflow-hidden ${
                      event.isCompleted
                        ? 'border-natural-border opacity-65'
                        : 'border-natural-border hover:border-natural-clay/35 shadow-2xs'
                    }`}
                  >
                    <div className="p-3 flex items-start gap-2 justify-between">
                      {/* Checkbox button */}
                      <button
                        type="button"
                        onClick={() => onToggleComplete(event.id)}
                        className="p-1 text-natural-secondary hover:text-natural-olive transition shrink-0 cursor-pointer"
                        title={event.isCompleted ? 'Oznacz jako niewykonane' : 'Oznacz jako wykonane'}
                      >
                        {event.isCompleted ? (
                          <CheckCircle size={16} className="text-natural-secondary fill-natural-sage/20" />
                        ) : (
                          <Circle size={16} className="text-natural-primary/60" />
                        )}
                      </button>

                      {/* Event Meta info */}
                      <div className="flex-1 min-w-0" onClick={() => toggleExpand(event.id)}>
                        <div className="flex flex-wrap items-center gap-1 mb-1">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${info.bg} ${info.text} ${info.border}`}>
                            {info.icon} {info.label}
                          </span>
                          <span className="text-[10px] font-semibold text-natural-primary/70 flex items-center gap-0.5 bg-natural-highlight px-1.5 py-0.5 rounded">
                            <Calendar size={10} className="text-natural-secondary shrink-0" />
                            {event.date === todayStr ? 'Dzisiaj' : event.date}
                          </span>
                          {event.time && (
                            <span className="text-[10px] font-semibold text-natural-primary/70 flex items-center gap-0.5 bg-natural-highlight px-1.5 py-0.5 rounded">
                              <Clock size={10} className="text-natural-secondary shrink-0" />
                              {event.time}
                            </span>
                          )}
                        </div>

                        <h4
                          className={`text-xs font-bold text-natural-dark leading-snug cursor-pointer flex items-center gap-1.5 select-none ${
                            event.isCompleted ? 'line-through text-natural-primary/60' : ''
                          }`}
                        >
                          {event.title}
                          {event.notes && (
                            <span className="text-[10px] text-natural-primary/50 shrink-0 font-normal">
                              {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                            </span>
                          )}
                        </h4>
                      </div>

                      {/* Trash Button */}
                      <button
                        type="button"
                        onClick={() => onDeleteEvent(event.id)}
                        className="p-1 hover:bg-red-50 text-natural-primary/45 hover:text-destructive rounded-lg transition shrink-0 cursor-pointer"
                        title="Usuń zadanie"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* Expanded Notes Section */}
                    {isExpanded && event.notes && (
                      <div className="px-3 pb-3 pt-1 border-t border-natural-border/50 bg-natural-highlight/15 text-[11px] leading-relaxed text-natural-primary/90 whitespace-pre-wrap font-sans">
                        <div className="bg-white border rounded-lg p-2 flex items-start gap-1">
                          <Info size={11} className="text-natural-secondary shrink-0 mt-0.5" />
                          <span className="flex-1 italic">{event.notes}</span>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SPECIES CARE CHECKLIST VIEW (e.g. Świnka morska checklist from PDF) */}
      {activeTab === 'checklist' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          
          {/* Header Card with Care Intro & Golden Rule */}
          <div className="bg-white rounded-2xl border border-natural-border p-3.5 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{carePlan.emoji}</span>
                <div>
                  <h4 className="font-serif font-bold text-natural-dark text-xs leading-tight">
                    Checklista opieki: {carePlan.speciesName}
                  </h4>
                  <p className="text-[10px] text-natural-primary/70 leading-tight mt-0.5">
                    {carePlan.intro}
                  </p>
                </div>
              </div>

              {/* Quick Batch Button: Plan today's routine */}
              <button
                type="button"
                onClick={handlePlanDailyRoutine}
                className="px-2.5 py-1.5 bg-natural-secondary hover:bg-natural-olive text-white rounded-xl text-[10px] font-bold shadow-xs hover:shadow transition flex items-center gap-1 cursor-pointer shrink-0"
                title="Dodaj zestaw zadań codziennych (Rano, Dzień, Wieczór) do terminarza na dziś"
              >
                <Sparkles size={12} />
                Zaplanuj rutynę na dziś
              </button>
            </div>

            {carePlan.goldenRule && (
              <div className="p-2 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[10px] text-amber-900 leading-relaxed font-medium">
                {carePlan.goldenRule}
              </div>
            )}
          </div>

          {/* Checklist Sections (Rano, W ciągu dnia, Wieczorem, Sprzątanie, Zadania cykliczne) */}
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {carePlan.sections.map((section) => (
              <div key={section.id} className="bg-white rounded-2xl border border-natural-border overflow-hidden shadow-2xs">
                
                {/* Section Header */}
                <div className="px-3.5 py-2.5 bg-natural-highlight/50 border-b border-natural-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{section.icon}</span>
                    <div>
                      <h5 className="font-serif font-bold text-natural-dark text-xs uppercase tracking-wide">
                        {section.title}
                      </h5>
                      <p className="text-[9px] text-natural-primary/70">
                        {section.subtitle}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section specific content: cleaning days picker for cage cleaning */}
                {section.id === 'cleaning' && (
                  <div className="px-3 py-2 bg-natural-sand/30 border-b border-natural-border/50">
                    <p className="text-[10px] font-bold text-natural-dark mb-1.5 flex items-center justify-between">
                      <span>Dni pełnego sprzątania w tygodniu:</span>
                      <span className="text-[9px] text-natural-primary/60 font-normal">zaznacz dni</span>
                    </p>
                    <div className="grid grid-cols-7 gap-1">
                      {WEEK_DAYS.map((day) => {
                        const isSelected = cleaningDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleCleaningDay(day)}
                            className={`py-1 rounded-lg text-[10px] font-bold transition text-center cursor-pointer border ${
                              isSelected
                                ? 'bg-natural-olive text-white border-natural-olive shadow-2xs'
                                : 'bg-white text-natural-primary/80 border-natural-border hover:bg-natural-highlight'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tasks List in this Section */}
                <div className="p-2 space-y-1.5">
                  {section.items.map((task) => {
                    // Check if already planned for today
                    const existingToday = petEvents.find(
                      e => e.date === todayStr && e.title.toLowerCase().includes(task.title.toLowerCase().substring(0, 15))
                    );

                    return (
                      <div
                        key={task.id}
                        className={`p-2.5 rounded-xl border transition flex items-start gap-2 justify-between ${
                          existingToday?.isCompleted
                            ? 'bg-emerald-50/50 border-emerald-200'
                            : existingToday
                            ? 'bg-natural-highlight/40 border-natural-secondary/30'
                            : 'bg-natural-sand/20 border-natural-border/60 hover:border-natural-border'
                        }`}
                      >
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          <span className="text-base shrink-0 mt-0.5">{task.icon}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className={`text-xs font-bold text-natural-dark leading-snug ${
                                existingToday?.isCompleted ? 'line-through text-natural-primary/60' : ''
                              }`}>
                                {task.title}
                              </p>
                            </div>

                            {task.warning && (
                              <p className="text-[10px] text-amber-800 font-medium mt-0.5 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/50 inline-block">
                                ⚠️ {task.warning}
                              </p>
                            )}

                            {task.notes && (
                              <p className="text-[10px] text-natural-primary/75 mt-0.5 leading-relaxed">
                                {task.notes}
                              </p>
                            )}

                            <div className="flex items-center gap-2 mt-1 text-[9px] text-natural-primary/60 font-medium">
                              {task.frequency && <span>🔄 {task.frequency}</span>}
                              {task.time && <span>⏰ sugerowana: {task.time}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="shrink-0 flex items-center gap-1">
                          {existingToday ? (
                            <button
                              type="button"
                              onClick={() => onToggleComplete(existingToday.id)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer ${
                                existingToday.isCompleted
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                              }`}
                              title={existingToday.isCompleted ? 'Oznacz jako do zrobienia' : 'Kliknij, aby oznaczyć jako wykonane'}
                            >
                              {existingToday.isCompleted ? (
                                <>
                                  <CheckCheck size={12} />
                                  <span>Zrobione!</span>
                                </>
                              ) : (
                                <>
                                  <Clock size={12} />
                                  <span>Na dziś</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddDirectTask({
                                title: task.title,
                                type: task.type,
                                time: task.time,
                                notes: task.notes || task.warning
                              }, todayStr)}
                              className="px-2 py-1 bg-natural-highlight hover:bg-natural-sand text-natural-dark border border-natural-border rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="Dodaj to zadanie do terminarza na dzisiaj"
                            >
                              <Plus size={11} />
                              <span>+ Na dziś</span>
                            </button>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
}
