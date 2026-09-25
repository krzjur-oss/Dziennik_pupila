import React, { useState, useMemo, useEffect } from 'react';
import { HealthEvent, HealthEventType, Pet, RecurrenceFrequency, RecurrenceRule } from '../types';
import {
  Calendar,
  Clock,
  Plus,
  X,
  Check,
  Trash2,
  Bell,
  CheckCircle,
  Circle,
  ChevronDown,
  ChevronUp,
  Info,
  Sparkles,
  CheckCheck,
  ListTodo,
  ClipboardCheck,
  Repeat,
  CalendarDays,
  CalendarCheck,
  AlertCircle
} from 'lucide-react';
import { getCarePlanForPet, ChecklistTaskItem } from '../data/careChecklists';
import {
  RECURRENCE_OPTIONS,
  POLISH_WEEK_DAYS,
  generateRecurrenceDates,
  formatRecurrenceLabel,
  suggestRecurrenceFromTask,
  formatDateToYMD,
  parseYMDToDate
} from '../lib/recurrence';

interface HealthCalendarProps {
  activePet: Pet;
  events: HealthEvent[];
  onAddEvent: (eventData: Omit<HealthEvent, 'id' | 'petId' | 'createdAt' | 'isCompleted'>) => void;
  onAddEvents?: (eventsData: Array<Omit<HealthEvent, 'id' | 'petId' | 'createdAt' | 'isCompleted'>>) => void;
  onToggleComplete: (id: string) => void;
  onDeleteEvent: (id: string, deleteSeries?: boolean) => void;
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
  onAddEvents,
  onToggleComplete,
  onDeleteEvent
}: HealthCalendarProps) {
  // Main view tab: 'todos' or 'checklist'
  const [activeTab, setActiveTab] = useState<'todos' | 'checklist'>('todos');
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'recurring' | 'completed'>('upcoming');
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Basic Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState<HealthEventType>('pielegnacja');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Recurrence Form State
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri default
  const [customInterval, setCustomInterval] = useState<number>(2);
  const [endType, setEndType] = useState<'forever' | 'count' | 'until_date'>('forever');
  const [endCount, setEndCount] = useState<number>(10);
  const [endDate, setEndDate] = useState<string>('');
  const [showPreviewList, setShowPreviewList] = useState(false);

  // Deletion Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
    date: string;
    recurrenceGroupId?: string;
    seriesCount: number;
  } | null>(null);

  // Expand notes state
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  // Care plan specific to active pet
  const carePlan = useMemo(() => {
    return getCarePlanForPet(activePet.species, activePet.customSpecies, activePet.notes);
  }, [activePet.species, activePet.customSpecies, activePet.notes]);

  // Today string YYYY-MM-DD
  const todayStr = useMemo(() => {
    return formatDateToYMD(new Date());
  }, []);

  // Saved cleaning days for this pet (e.g. ['Śr', 'Sob'])
  const [cleaningDays, setCleaningDays] = useState<string[]>(() => {
    try {
      if (activePet.cleaningDays && Array.isArray(activePet.cleaningDays)) {
        return activePet.cleaningDays;
      }
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
          icon: "./app_icon.png"
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
          icon: activePet.avatar || "./app_icon.png"
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

  // Recurrence rule built from current form state
  const currentRecurrenceRule: RecurrenceRule | null = useMemo(() => {
    if (!isRecurring || frequency === 'none') return null;
    return {
      frequency,
      interval: frequency === 'custom_days' ? Math.max(customInterval || 2, 1) : undefined,
      selectedDays: frequency === 'weekly' ? selectedDays : undefined,
      endType,
      endCount: endType === 'count' ? Math.max(endCount || 5, 1) : undefined,
      endDate: endType === 'until_date' ? endDate : undefined,
    };
  }, [isRecurring, frequency, selectedDays, customInterval, endType, endCount, endDate]);

  // Preview generated dates for live feedback in form
  const previewDates = useMemo(() => {
    if (!currentRecurrenceRule || !date) return [];
    return generateRecurrenceDates(date, currentRecurrenceRule);
  }, [currentRecurrenceRule, date]);

  // Alert/Reminders check (within nearest 7 days, and not completed)
  const alertReminders = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return petEvents
      .filter((e) => !e.isCompleted)
      .map((e) => {
        const eventDate = parseYMDToDate(e.date);
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
    if (filter === 'recurring') {
      return list.filter((e) => !!e.recurrenceGroupId || (e.recurrence && e.recurrence.frequency !== 'none'));
    }
    if (filter === 'completed') {
      return list.filter((e) => e.isCompleted);
    }
    return list;
  }, [petEvents, filter]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleResetForm = () => {
    setTitle('');
    setType('pielegnacja');
    setDate('');
    setTime('');
    setNotes('');
    setIsRecurring(false);
    setFrequency('daily');
    setSelectedDays([1, 2, 3, 4, 5]);
    setCustomInterval(2);
    setEndType('forever');
    setEndCount(10);
    setEndDate('');
    setShowPreviewList(false);
    setFormError('');
    setIsFormOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Nazwa wydarzenia jest wymagana.');
      return;
    }
    if (!date) {
      setFormError('Data początkowa jest wymagana.');
      return;
    }

    if (isRecurring && frequency !== 'none' && currentRecurrenceRule) {
      if (currentRecurrenceRule.endType === 'count' && (currentRecurrenceRule.endCount ?? 0) > 366) {
        setFormError('Liczba powtórzeń nie może przekraczać 366.');
        return;
      }
      if (currentRecurrenceRule.frequency === 'weekly' && (!selectedDays || selectedDays.length === 0)) {
        setFormError('Wybierz przynajmniej jeden dzień tygodnia dla cyklu tygodniowego.');
        return;
      }
      if (currentRecurrenceRule.endType === 'until_date' && !endDate) {
        setFormError('Wybierz datę zakończenia powtarzania.');
        return;
      }
      if (previewDates.length === 0) {
        setFormError('Dla wybranych ustawień nie wygenerowano żadnych dat.');
        return;
      }

      const recurrenceGroupId = 'rec_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
      const recurrenceLabel = formatRecurrenceLabel(currentRecurrenceRule);

      const batch = previewDates.map(d => ({
        title: title.trim(),
        type,
        date: d,
        time: time || undefined,
        notes: notes.trim() || undefined,
        recurrence: currentRecurrenceRule,
        recurrenceGroupId,
        recurrenceLabel
      }));

      if (onAddEvents) {
        onAddEvents(batch);
      } else {
        batch.forEach(item => onAddEvent(item));
      }
    } else {
      // Single event
      onAddEvent({
        title: title.trim(),
        type,
        date,
        time: time || undefined,
        notes: notes.trim() || undefined
      });
    }

    handleResetForm();
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

  // Open recurrence modal prefilled for a checklist task
  const handleOpenRecurringForTask = (task: ChecklistTaskItem) => {
    const suggested = suggestRecurrenceFromTask(task.title, task.notes || task.warning, task.frequency);
    setTitle(task.title);
    setType(task.type);
    setTime(task.time || '');
    setNotes(task.notes || task.warning || '');
    setDate(todayStr);
    setIsRecurring(true);
    setFrequency(suggested.frequency !== 'none' ? suggested.frequency : 'daily');
    setEndType(suggested.endType || 'forever');

    if (suggested.frequency === 'weekly') {
      if (task.id.includes('clean') && cleaningDays.length > 0) {
        const dayIndices = cleaningDays.map(name => {
          const found = POLISH_WEEK_DAYS.find(pwd => pwd.label === name);
          return found ? found.index : 6;
        });
        setSelectedDays(dayIndices);
      } else {
        const currentDay = parseYMDToDate(todayStr).getDay();
        setSelectedDays([currentDay]);
      }
    }

    setIsFormOpen(true);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // Batch plan today's routine tasks from care plan (morning, day, evening)
  const handlePlanDailyRoutine = () => {
    const dailySections = carePlan.sections.filter(s => s.id === 'morning' || s.id === 'day' || s.id === 'evening');
    const batchToAdd: Array<Omit<HealthEvent, 'id' | 'petId' | 'createdAt' | 'isCompleted'>> = [];

    dailySections.forEach(section => {
      section.items.forEach(task => {
        const alreadyExists = petEvents.some(
          e => e.date === todayStr && e.title.toLowerCase().includes(task.title.toLowerCase().substring(0, 15))
        );

        if (!alreadyExists) {
          batchToAdd.push({
            title: task.title,
            type: task.type,
            date: todayStr,
            time: task.time,
            notes: task.notes || task.warning
          });
        }
      });
    });

    if (batchToAdd.length > 0) {
      if (onAddEvents) {
        onAddEvents(batchToAdd);
      } else {
        batchToAdd.forEach(item => onAddEvent(item));
      }
    }

    setActiveTab('todos');
  };

  // Batch plan routine for 30 days
  const handlePlanMonthRoutine = () => {
    const dailySections = carePlan.sections.filter(s => s.id === 'morning' || s.id === 'day' || s.id === 'evening');
    const rule: RecurrenceRule = {
      frequency: 'daily',
      endType: 'count',
      endCount: 30
    };
    const dates = generateRecurrenceDates(todayStr, rule);
    const allBatch: Array<Omit<HealthEvent, 'id' | 'petId' | 'createdAt' | 'isCompleted'>> = [];

    dailySections.forEach(section => {
      section.items.forEach(task => {
        const groupId = 'routine_' + task.id + '_' + Date.now().toString(36);
        dates.forEach(d => {
          allBatch.push({
            title: task.title,
            type: task.type,
            date: d,
            time: task.time,
            notes: task.notes || task.warning,
            recurrence: rule,
            recurrenceGroupId: groupId,
            recurrenceLabel: 'Codziennie (Rutyna 30 dni)'
          });
        });
      });
    });

    if (allBatch.length > 0) {
      if (onAddEvents) {
        onAddEvents(allBatch);
      } else {
        allBatch.forEach(item => onAddEvent(item));
      }
    }

    setActiveTab('todos');
  };

  // Handle clicking delete button on event
  const handleDeleteClick = (event: HealthEvent) => {
    if (event.recurrenceGroupId) {
      const seriesCount = petEvents.filter(e => e.recurrenceGroupId === event.recurrenceGroupId).length;
      setDeleteTarget({
        id: event.id,
        title: event.title,
        date: event.date,
        recurrenceGroupId: event.recurrenceGroupId,
        seriesCount
      });
    } else {
      onDeleteEvent(event.id, false);
    }
  };

  const toggleDaySelection = (dayIndex: number) => {
    if (selectedDays.includes(dayIndex)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter(d => d !== dayIndex));
      }
    } else {
      setSelectedDays([...selectedDays, dayIndex].sort());
    }
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
              if (isFormOpen) {
                handleResetForm();
              } else {
                setIsFormOpen(true);
                setFormError('');
                if (!date) setDate(todayStr);
              }
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
                        {event.recurrenceLabel && (
                          <span className="text-[9px] bg-indigo-50 text-indigo-700 font-semibold px-1 rounded border border-indigo-200/60">
                            🔁 {event.recurrenceLabel}
                          </span>
                        )}
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

                    // Suggest recurrence for preset
                    const suggested = suggestRecurrenceFromTask(preset.title, preset.notes);
                    if (suggested.frequency !== 'none') {
                      setIsRecurring(true);
                      setFrequency(suggested.frequency);
                    }
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
            <p className="text-[10px] font-bold text-red-600 bg-red-50 p-2 rounded-lg border border-red-200 flex items-center gap-1.5">
              <AlertCircle size={13} className="shrink-0" />
              <span>{formError}</span>
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
                placeholder="np. Podaj witaminę C, Obcięcie pazurków, Sprzątanie klatki"
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
                  Data początkowa *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-2 py-1.5 bg-natural-sand/30 border border-natural-border focus:border-natural-sage focus:outline-none rounded-xl text-xs text-natural-dark"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 items-center">
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

              {/* Recurrence Toggle Switch */}
              <div className="pt-3">
                <label
                  onClick={() => setIsRecurring(!isRecurring)}
                  className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer select-none transition ${
                    isRecurring
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-950 font-bold'
                      : 'bg-natural-sand/30 border-natural-border text-natural-primary hover:bg-natural-highlight'
                  }`}
                >
                  <div className={`p-1 rounded-lg ${isRecurring ? 'bg-indigo-600 text-white' : 'bg-stone-200 text-stone-600'}`}>
                    <Repeat size={13} />
                  </div>
                  <div className="leading-tight">
                    <span className="text-[11px] block">Planowanie cykliczne</span>
                    <span className="text-[9px] font-normal opacity-80 block">
                      {isRecurring ? 'Włączone (powtarzaj)' : 'Wyłączone (jednorazowo)'}
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* EXPANDABLE RECURRENCE OPTIONS */}
            {isRecurring && (
              <div className="p-3.5 bg-indigo-50/50 border border-indigo-200/80 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between border-b border-indigo-200/60 pb-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                    <Repeat size={13} className="text-indigo-600" />
                    <span>Ustawienia powtarzania (cyklu)</span>
                  </div>
                  <span className="text-[10px] font-semibold text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-200">
                    {formatRecurrenceLabel(currentRecurrenceRule || { frequency: 'daily', endType: 'forever' })}
                  </span>
                </div>

                {/* Frequency Selector */}
                <div>
                  <label className="block text-[10px] font-bold text-indigo-900 uppercase mb-1">
                    Częstotliwość powtarzania:
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => {
                      const newFreq = e.target.value as RecurrenceFrequency;
                      setFrequency(newFreq);
                      // Set default days for weekly if none
                      if (newFreq === 'weekly' && date) {
                        const day = parseYMDToDate(date).getDay();
                        setSelectedDays([day]);
                      }
                    }}
                    className="w-full px-2.5 py-2 bg-white border border-indigo-200 focus:border-indigo-400 focus:outline-none rounded-xl text-xs text-natural-dark font-medium cursor-pointer shadow-2xs"
                  >
                    {RECURRENCE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.icon} {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sub-selector for WEEKLY: Select days of week */}
                {frequency === 'weekly' && (
                  <div className="p-2.5 bg-white rounded-xl border border-indigo-200/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-indigo-900 uppercase">
                        Dni tygodnia:
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedDays([1, 2, 3, 4, 5])}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 cursor-pointer font-medium"
                        >
                          Pn–Pt
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedDays([6, 0])}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 cursor-pointer font-medium"
                        >
                          Weekend
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedDays([1, 2, 3, 4, 5, 6, 0])}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 cursor-pointer font-medium"
                        >
                          Wszystkie
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {POLISH_WEEK_DAYS.map((day) => {
                        const isSelected = selectedDays.includes(day.index);
                        return (
                          <button
                            key={day.index}
                            type="button"
                            onClick={() => toggleDaySelection(day.index)}
                            className={`py-1.5 rounded-lg text-[10px] font-bold transition text-center cursor-pointer border ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-indigo-50'
                            }`}
                          >
                            {day.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sub-selector for CUSTOM_DAYS: Interval */}
                {frequency === 'custom_days' && (
                  <div className="p-2.5 bg-white rounded-xl border border-indigo-200/80 flex items-center gap-2">
                    <span className="text-[10px] font-bold text-indigo-900 uppercase">
                      Powtarzaj co:
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={customInterval}
                      onChange={(e) => setCustomInterval(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-16 px-2 py-1 bg-stone-50 border border-stone-300 rounded-lg text-xs font-bold text-center"
                    />
                    <span className="text-xs text-natural-dark font-medium">dni</span>
                    <div className="ml-auto flex gap-1">
                      {[2, 3, 5, 10].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setCustomInterval(val)}
                          className={`text-[10px] px-1.5 py-0.5 rounded border ${
                            customInterval === val ? 'bg-indigo-600 text-white' : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          co {val}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* End Condition (Kiedy zakończyć powtarzanie) */}
                <div className="p-2.5 bg-white rounded-xl border border-indigo-200/80 space-y-2">
                  <label className="block text-[10px] font-bold text-indigo-900 uppercase">
                    Zakończenie cyklu:
                  </label>
                  
                  <div className="space-y-1.5 text-xs">
                    {/* Option 1: Forever / Horizon */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="endType"
                        value="forever"
                        checked={endType === 'forever'}
                        onChange={() => setEndType('forever')}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-[11px] font-medium text-natural-dark">
                        Bezterminowo (kalendarz uzupełnia się automatycznie)
                      </span>
                    </label>

                    {/* Option 2: Count */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="endType"
                          value="count"
                          checked={endType === 'count'}
                          onChange={() => setEndType('count')}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-[11px] font-medium text-natural-dark">
                          Po liczbie powtórzeń:
                        </span>
                      </label>
                      {endType === 'count' && (
                        <div className="flex items-center gap-1 ml-4 sm:ml-0">
                          <input
                            type="number"
                            min={1}
                            max={366}
                            value={endCount}
                            onChange={(e) => setEndCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                            className="w-14 px-2 py-0.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-bold text-center"
                          />
                          <span className="text-[10px] text-natural-primary/70">razy</span>
                          <div className="flex gap-1 ml-1">
                            {[5, 7, 10, 14, 30].map(cnt => (
                              <button
                                key={cnt}
                                type="button"
                                onClick={() => setEndCount(cnt)}
                                className={`text-[9px] px-1 py-0.5 rounded border ${
                                  endCount === cnt ? 'bg-indigo-600 text-white' : 'bg-stone-50 text-stone-600'
                                }`}
                              >
                                {cnt}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Option 3: Until Date */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="endType"
                          value="until_date"
                          checked={endType === 'until_date'}
                          onChange={() => setEndType('until_date')}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-[11px] font-medium text-natural-dark">
                          Do wyznaczonej daty:
                        </span>
                      </label>
                      {endType === 'until_date' && (
                        <input
                          type="date"
                          value={endDate}
                          min={date || todayStr}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="px-2 py-0.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Real-time schedule preview badge */}
                {previewDates.length > 0 && (
                  <div className="p-2.5 bg-indigo-100/70 border border-indigo-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold text-indigo-950 flex items-center gap-1.5">
                        <CalendarCheck size={13} className="text-indigo-700" />
                        <span>Zaplanuje <strong>{previewDates.length}</strong> zadań: od {previewDates[0]} do {previewDates[previewDates.length - 1]}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowPreviewList(!showPreviewList)}
                        className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer underline"
                      >
                        {showPreviewList ? 'Ukryj daty' : 'Pokaż daty'}
                      </button>
                    </div>

                    {showPreviewList && (
                      <div className="pt-1.5 flex flex-wrap gap-1 max-h-[100px] overflow-y-auto">
                        {previewDates.map((d, idx) => (
                          <span key={d} className="text-[9px] px-1.5 py-0.5 bg-white border border-indigo-200 rounded text-indigo-900 font-mono">
                            #{idx + 1}: {d}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-[10px] font-bold text-natural-primary/80 uppercase mb-1">
                Wskazówki / Notatka (opcjonalnie)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="np. Podać z plasterkiem czerwonej papryki, sprawdzić uszka"
                rows={2}
                className="w-full px-3 py-2 bg-natural-sand/30 border border-natural-border focus:border-natural-sage focus:outline-none rounded-xl text-xs text-natural-dark font-sans resize-none"
              />
            </div>

            {/* Form actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleResetForm}
                className="py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Anuluj
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-natural-secondary hover:bg-natural-olive text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isRecurring ? (
                  <>
                    <Repeat size={13} />
                    <span>Zapisz serię cykliczną ({previewDates.length || 1} zadań)</span>
                  </>
                ) : (
                  <>
                    <Check size={13} />
                    <span>Zapisz zadanie</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </form>
      )}

      {/* TAB 1: TO-DO LIST VIEW */}
      {activeTab === 'todos' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          
          {/* Filter toggle bar */}
          <div className="flex border border-natural-border rounded-xl overflow-hidden bg-white text-[10px] font-bold shadow-2xs">
            <button
              type="button"
              onClick={() => setFilter('upcoming')}
              className={`flex-1 py-2 text-center transition-all cursor-pointer border-r border-natural-border/30 ${
                filter === 'upcoming'
                  ? 'bg-natural-highlight text-natural-dark font-extrabold'
                  : 'text-natural-primary hover:bg-natural-cream'
              }`}
            >
              ⏳ Nadchodzące
            </button>
            <button
              type="button"
              onClick={() => setFilter('recurring')}
              className={`flex-1 py-2 text-center transition-all cursor-pointer border-r border-natural-border/30 flex items-center justify-center gap-1 ${
                filter === 'recurring'
                  ? 'bg-indigo-50 text-indigo-900 font-extrabold'
                  : 'text-natural-primary hover:bg-natural-cream'
              }`}
            >
              <Repeat size={11} className="text-indigo-600" />
              <span>Cykliczne</span>
            </button>
            <button
              type="button"
              onClick={() => setFilter('completed')}
              className={`flex-1 py-2 text-center transition-all cursor-pointer border-r border-natural-border/30 ${
                filter === 'completed'
                  ? 'bg-natural-highlight text-natural-dark font-extrabold'
                  : 'text-natural-primary hover:bg-natural-cream'
              }`}
            >
              ✅ Wykonane
            </button>
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`flex-1 py-2 text-center transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-natural-highlight text-natural-dark font-extrabold'
                  : 'text-natural-primary hover:bg-natural-cream'
              }`}
            >
              📋 Wszystkie
            </button>
          </div>

          {/* Events List */}
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-6 px-4 border border-dashed border-natural-border rounded-2xl bg-white/40 space-y-2">
                <Calendar className="mx-auto text-natural-primary/30 shrink-0 w-8 h-8 stroke-[1.25]" />
                <p className="text-[11px] font-serif font-bold text-natural-primary/60">
                  {filter === 'upcoming'
                    ? 'Brak zaplanowanych zadań'
                    : filter === 'recurring'
                    ? 'Brak zaplanowanych zadań cyklicznych'
                    : filter === 'completed'
                    ? 'Brak wykonanych zadań'
                    : 'Brak zadań w terminarzu'}
                </p>
                <div className="pt-1 flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormOpen(true);
                      setIsRecurring(true);
                      if (!date) setDate(todayStr);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 px-3 py-1 rounded-xl bg-indigo-50 border border-indigo-200 transition cursor-pointer"
                  >
                    <Repeat size={12} />
                    Zaplanuj zadanie cykliczne
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('checklist')}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-natural-secondary hover:text-natural-dark px-3 py-1 rounded-xl bg-natural-highlight border border-natural-border transition cursor-pointer"
                  >
                    <Sparkles size={12} />
                    Checklista opieki
                  </button>
                </div>
              </div>
            ) : (
              filteredEvents.map((event) => {
                const info = EVENT_TYPES[event.type] || EVENT_TYPES.inne;
                const isExpanded = !!expandedIds[event.id];
                const isItemRecurring = !!event.recurrenceGroupId || (event.recurrence && event.recurrence.frequency !== 'none');

                return (
                  <div
                    key={event.id}
                    className={`bg-white border rounded-2xl transition-all duration-200 overflow-hidden ${
                      event.isCompleted
                        ? 'border-natural-border opacity-65'
                        : isItemRecurring
                        ? 'border-natural-border hover:border-indigo-300 shadow-2xs'
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

                          {isItemRecurring && (
                            <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-1.5 py-0.5 rounded flex items-center gap-1" title="Zadanie powtarzające się cyklicznie">
                              <Repeat size={9} />
                              <span>{event.recurrenceLabel || 'Cykliczne'}</span>
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
                        onClick={() => handleDeleteClick(event)}
                        className="p-1 hover:bg-red-50 text-natural-primary/45 hover:text-destructive rounded-lg transition shrink-0 cursor-pointer"
                        title={isItemRecurring ? "Usuń zadanie lub serię cykliczną" : "Usuń zadanie"}
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

      {/* TAB 2: SPECIES CARE CHECKLIST VIEW (e.g. Świnka morska checklist) */}
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

              {/* Quick Batch Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={handlePlanDailyRoutine}
                  className="px-2.5 py-1.5 bg-natural-secondary hover:bg-natural-olive text-white rounded-xl text-[10px] font-bold shadow-xs hover:shadow transition flex items-center gap-1 cursor-pointer shrink-0"
                  title="Dodaj zestaw zadań codziennych (Rano, Dzień, Wieczór) do terminarza na dziś"
                >
                  <Sparkles size={11} />
                  <span>Rutyna na dziś</span>
                </button>

                <button
                  type="button"
                  onClick={handlePlanMonthRoutine}
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold shadow-xs hover:shadow transition flex items-center gap-1 cursor-pointer shrink-0"
                  title="Zaplanuj rutynę codzienną (Rano, Dzień, Wieczór) codziennie przez najbliższe 30 dni"
                >
                  <Repeat size={11} />
                  <span>Rutyna cykliczna (30 dni)</span>
                </button>
              </div>
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

                            <div className="flex items-center gap-2 mt-1 text-[9px] text-natural-primary/60 font-medium flex-wrap">
                              {task.frequency && <span className="bg-white/80 px-1 py-0.5 rounded border border-natural-border/50">🔄 {task.frequency}</span>}
                              {task.time && <span>⏰ {task.time}</span>}
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

                          {/* Quick Plan Recurrence button */}
                          <button
                            type="button"
                            onClick={() => handleOpenRecurringForTask(task)}
                            className="p-1 hover:bg-indigo-50 text-indigo-700 rounded-lg transition border border-transparent hover:border-indigo-200 cursor-pointer"
                            title="Zaplanuj to zadanie cyklicznie (codziennie, co tydzień, co miesiąc itp.)"
                          >
                            <Repeat size={13} />
                          </button>
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

      {/* SERIES DELETION CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-natural-border p-5 max-w-sm w-full space-y-4 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 shrink-0">
                <Repeat size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-serif font-bold text-natural-dark text-sm leading-tight">
                  Usuwanie zadania cyklicznego
                </h4>
                <p className="text-[11px] text-natural-primary/75 mt-1">
                  To zadanie należy do serii <strong>{deleteTarget.seriesCount} powtórzeń</strong>:
                </p>
                <p className="text-xs font-bold text-indigo-950 bg-indigo-50/50 p-2 rounded-xl mt-1.5 border border-indigo-100">
                  {deleteTarget.title} ({deleteTarget.date})
                </p>
              </div>
            </div>

            <p className="text-[11px] text-natural-primary/80">
              Co chcesz zrobić?
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  onDeleteEvent(deleteTarget.id, false);
                  setDeleteTarget(null);
                }}
                className="w-full py-2.5 px-3 bg-natural-highlight hover:bg-natural-sand border border-natural-border text-natural-dark rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-left"
              >
                <span>Tylko to jedno wystąpienie ({deleteTarget.date})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onDeleteEvent(deleteTarget.id, true);
                  setDeleteTarget(null);
                }}
                className="w-full py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Trash2 size={13} />
                <span>Usuń całą serię cykliczną ({deleteTarget.seriesCount} zadań)</span>
              </button>

              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="w-full py-2 px-3 text-stone-600 hover:text-stone-900 rounded-xl text-xs font-medium transition cursor-pointer text-center"
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
