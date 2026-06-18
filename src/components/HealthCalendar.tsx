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
  Info
} from 'lucide-react';

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
  inne: {
    label: 'Inne',
    icon: '🗓️',
    bg: 'bg-stone-50',
    text: 'text-stone-800',
    border: 'border-stone-200'
  }
};

export default function HealthCalendar({
  activePet,
  events,
  onAddEvent,
  onToggleComplete,
  onDeleteEvent
}: HealthCalendarProps) {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('upcoming');
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState<HealthEventType>('szczepienie');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Expand notes state
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  // Notification states
  const notificationsSupported = useMemo(() => {
    return typeof window !== 'undefined' && 'Notification' in window;
  }, []);

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  // A ref to keep track of already notified events in this browser session to avoid duplicate alerts
  const notifiedEventIdsRef = useRef<Set<string>>(new Set());

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
          body: `Szczepienie dla pupila ${activePet.name} zbliża się! (Przypomnienie testowe)`,
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
      .filter((item) => item.diffDays <= 7) // Approaching within 7 days, or overdue (diffDays < 0)
      .sort((a, b) => a.diffDays - b.diffDays);
  }, [petEvents]);

  // Automatically trigger developer system notifications for approaching events
  useEffect(() => {
    if (notificationsSupported && notificationPermission === 'granted' && alertReminders.length > 0) {
      alertReminders.forEach(({ event, diffDays }) => {
        if (!notifiedEventIdsRef.current.has(event.id)) {
          notifiedEventIdsRef.current.add(event.id);

          let dayMsg = '';
          if (diffDays === 0) dayMsg = 'dzisiaj!';
          else if (diffDays === 1) dayMsg = 'jutro!';
          else if (diffDays > 1) dayMsg = `za ${diffDays} dni`;
          else dayMsg = `zaległe o ${Math.abs(diffDays)} dni!`;

          const typeLabel = EVENT_TYPES[event.type]?.label || 'Wydarzenie';

          try {
            new Notification(`Przypomnienie: ${activePet.name}`, {
              body: `${typeLabel}: ${event.title} (${dayMsg})`,
              icon: activePet.avatar || "/favicon.ico",
              tag: event.id
            });
          } catch (err) {
            console.warn("Notification error:", err);
          }
        }
      });
    }
  }, [alertReminders, notificationPermission, notificationsSupported, activePet.name, activePet.avatar]);

  // Filtered lists shown in the calendar list
  const filteredEvents = useMemo(() => {
    let list = [...petEvents];
    
    // Sort chronological ascending (so nearest events are on top)
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
    setType('szczepienie');
    setDate('');
    setTime('');
    setNotes('');
    setFormError('');
    setIsFormOpen(false);
  };

  const getDayLabel = (diffDays: number) => {
    if (diffDays === 0) return 'Dzisiaj!';
    if (diffDays === 1) return 'Jutro!';
    if (diffDays > 1) return `Za ${diffDays} dni`;
    return `Zaległe o ${Math.abs(diffDays)} dni!`;
  };

  return (
    <div className="bg-natural-sand rounded-3xl border border-natural-border p-5 space-y-5 shadow-xs">
      
      {/* Header and Add button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-serif font-bold text-natural-dark uppercase tracking-wider flex items-center gap-1.5">
          <Calendar size={16} className="text-natural-secondary" />
          Kalendarz Zdrowia
        </h3>
        <button
          type="button"
          onClick={() => {
            setIsFormOpen(!isFormOpen);
            setFormError('');
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs ${
            isFormOpen
              ? 'bg-natural-highlight border border-natural-border text-natural-dark hover:bg-natural-border'
              : 'bg-natural-sage hover:bg-natural-olive text-white'
          }`}
        >
          {isFormOpen ? <X size={13} /> : <Plus size={13} />}
          {isFormOpen ? 'Anuluj' : 'Dodaj'}
        </button>
      </div>

      {/* Dynamic system notifications toggle/badge */}
      {notificationsSupported && (
        <div className="bg-white/80 border border-natural-border/60 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm shrink-0">
              {notificationPermission === 'granted' ? '🔔' : notificationPermission === 'denied' ? '🔕' : '💡'}
            </span>
            <div className="min-w-0">
              <p className="font-bold text-natural-dark leading-tight">
                Powiadomienia PWA
              </p>
              <p className="text-[10px] text-natural-primary/75 truncate leading-tight mt-0.5">
                {notificationPermission === 'granted' 
                  ? 'Włączone (otrzymasz przypomnienia na pulpicie)'
                  : notificationPermission === 'denied'
                  ? 'Zablokowane w ustawieniach przeglądarki'
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
        <div className="bg-amber-50 border border-amber-200/70 rounded-2xl p-3.5 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-1.5 text-amber-900 font-extrabold text-xs">
            <Bell size={14} className="text-amber-600 animate-bounce shrink-0" />
            <span>Zbliżające się przypomnienia ({alertReminders.length}):</span>
          </div>
          <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
            {alertReminders.map(({ event, diffDays }) => {
              const info = EVENT_TYPES[event.type];
              return (
                <div
                  key={event.id}
                  className="bg-white border border-amber-200 rounded-xl p-2 flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base shrink-0">{info?.icon || '🗓️'}</span>
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
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md shrink-0 border uppercase text-center ${
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
          <div className="border-b border-natural-border/60 pb-1.5">
            <h4 className="text-xs font-serif font-extrabold text-natural-dark uppercase tracking-wider">
              Zaplanuj nowe zdarzenie
            </h4>
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
                Nazwa wydarzenia *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="np. Szczepienie p/wściekliźnie, Wizyta kontrolna"
                className="w-full px-3 py-2 bg-natural-sand/30 border border-natural-border focus:border-natural-sage focus:outline-none rounded-xl text-xs text-natural-dark"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Type Category */}
              <div>
                <label className="block text-[10px] font-bold text-natural-primary/80 uppercase mb-1">
                  Typ wydarzenia
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
                  Data wydarzenia *
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
                Zaplanuj
              </button>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[10px] font-bold text-natural-primary/80 uppercase mb-1">
                Notatki / Lekarz / Szczegóły (opcjonalnie)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="np. Dr. Malinowski, zabrać książeczkę zdrowia"
                rows={2}
                className="w-full px-3 py-2 bg-natural-sand/30 border border-natural-border focus:border-natural-sage focus:outline-none rounded-xl text-xs text-natural-dark font-sans resize-none"
              />
            </div>
          </div>
        </form>
      )}

      {/* Filter and Events List */}
      <div className="space-y-3">
        {/* Toggle list filter */}
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

        {/* Existing Events List Layout */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-6 px-4 border border-dashed border-natural-border rounded-2xl bg-white/40">
              <Calendar className="mx-auto text-natural-primary/30 shrink-0 w-8 h-8 stroke-[1.25]" />
              <p className="text-[11px] font-serif font-bold text-natural-primary/60 mt-1.5">
                {filter === 'upcoming'
                  ? 'Brak zaplanowanych wydarzeń'
                  : filter === 'completed'
                  ? 'Brak wykonanych wydarzeń'
                  : 'Brak wydarzeń zdrowotnych'}
              </p>
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
                    {/* Event Status Checkbox */}
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

                    {/* Meta info of event */}
                    <div className="flex-1 min-w-0" onClick={() => toggleExpand(event.id)}>
                      <div className="flex flex-wrap items-center gap-1 mb-1">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${info.bg} ${info.text} ${info.border}`}>
                          {info.icon} {info.label}
                        </span>
                        <span className="text-[10px] font-semibold text-natural-primary/70 flex items-center gap-0.5 bg-natural-highlight px-1 py-0.5 rounded">
                          <Calendar size={10} className="text-natural-secondary shrink-0" />
                          {event.date}
                        </span>
                        {event.time && (
                          <span className="text-[10px] font-semibold text-natural-primary/70 flex items-center gap-0.5 bg-natural-highlight px-1 py-0.5 rounded">
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
                      title="Usuń wydarzenie"
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

    </div>
  );
}
