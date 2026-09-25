import { RecurrenceFrequency, RecurrenceRule, HealthEvent } from '../types';

export const RECURRENCE_OPTIONS: Array<{
  value: RecurrenceFrequency;
  label: string;
  badge: string;
  icon: string;
  description: string;
}> = [
  { value: 'none', label: 'Jednorazowo (nie powtarzaj)', badge: 'Jednorazowo', icon: '📌', description: 'Tylko w wybranym dniu' },
  { value: 'daily', label: 'Codziennie', badge: 'Codziennie', icon: '☀️', description: 'Każdego dnia bez wyjątku' },
  { value: 'weekdays', label: 'Od poniedziałku do piątku (Dni robocze)', badge: 'Pn–Pt', icon: '💼', description: 'Od poniedziałku do piątku' },
  { value: 'weekends', label: 'W weekendy (Sobota i niedziela)', badge: 'Weekendy', icon: '🏖️', description: 'Tylko w soboty i niedziele' },
  { value: 'weekly', label: 'Co tydzień (w wybrane dni)', badge: 'Co tydzień', icon: '📅', description: 'Raz lub w wybrane dni tygodnia' },
  { value: 'biweekly', label: 'Co 2 tygodnie', badge: 'Co 2 tyg.', icon: '⏳', description: 'Co czternaście dni' },
  { value: 'every_3_weeks', label: 'Co 3 tygodnie (np. pazurki, higiena)', badge: 'Co 3 tyg.', icon: '✂️', description: 'Cykl pielęgnacyjny co 21 dni' },
  { value: 'every_4_weeks', label: 'Co 4 tygodnie', badge: 'Co 4 tyg.', icon: '🗓️', description: 'Co dwadzieścia osiem dni' },
  { value: 'monthly', label: 'Co miesiąc (ten sam dzień miesiąca)', badge: 'Co miesiąc', icon: '🌙', description: 'Raz w miesiącu o stałej dacie' },
  { value: 'every_2_months', label: 'Co 2 miesiące', badge: 'Co 2 mies.', icon: '🔄', description: 'Co dwa miesiące' },
  { value: 'every_3_months', label: 'Co 3 miesiące (kwartalnie / odrobaczanie)', badge: 'Co 3 mies.', icon: '💊', description: 'Profilaktyka p/pasożytnicza' },
  { value: 'every_6_months', label: 'Co 6 miesięcy (półrocznie)', badge: 'Co 6 mies.', icon: '🩺', description: 'Przeglądy okresowe' },
  { value: 'yearly', label: 'Co rok (rocznie / szczepienia)', badge: 'Co rok', icon: '💉', description: 'Coroczne szczepienia i bilans' },
  { value: 'custom_days', label: 'Niestandardowo: Co określoną liczbę dni', badge: 'Co X dni', icon: '⚙️', description: 'Własny odstęp w dniach (np. co 2, 3 lub 5 dni)' }
];

export const POLISH_WEEK_DAYS = [
  { index: 1, label: 'Pon', fullName: 'Poniedziałek' },
  { index: 2, label: 'Wt', fullName: 'Wtorek' },
  { index: 3, label: 'Śr', fullName: 'Środa' },
  { index: 4, label: 'Czw', fullName: 'Czwartek' },
  { index: 5, label: 'Pt', fullName: 'Piątek' },
  { index: 6, label: 'Sob', fullName: 'Sobota' },
  { index: 0, label: 'Nd', fullName: 'Niedziela' }
];

// Helper to format Date to YYYY-MM-DD local time string
export function formatDateToYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Parse YYYY-MM-DD into a local Date object (ignoring timezone drift)
export function parseYMDToDate(ymd: string): Date {
  const parts = ymd.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return new Date(y, m, d, 12, 0, 0); // midday to avoid daylight saving issues
  }
  return new Date();
}

/**
 * Generates an array of YYYY-MM-DD dates based on a recurrence rule.
 * Supports sliding window for 'forever' series (minimum 90 days ahead) and up to 366 instances.
 */
export function generateRecurrenceDates(
  startDateStr: string,
  rule: RecurrenceRule,
  options?: { horizonDays?: number; targetDate?: string }
): string[] {
  if (!rule || rule.frequency === 'none') {
    return [startDateStr];
  }

  const results: string[] = [];
  const start = parseYMDToDate(startDateStr);
  
  // Maximum allowed instances: up to 366
  const maxInstances = rule.endType === 'count' && rule.endCount
    ? Math.min(rule.endCount, 366)
    : 366;

  let endLimitDate: Date | null = null;
  if (rule.endType === 'until_date' && rule.endDate) {
    endLimitDate = parseYMDToDate(rule.endDate);
  } else if (options?.targetDate) {
    endLimitDate = parseYMDToDate(options.targetDate);
  } else if (rule.endType === 'forever') {
    const horizonDays = Math.max(options?.horizonDays ?? 90, 90);
    const horizon = new Date(start);
    horizon.setDate(horizon.getDate() + horizonDays);
    endLimitDate = horizon;
  }

  // Minimum occurrences guaranteed for 'forever' even if horizon is short
  const minOccurrencesForForever: Record<RecurrenceFrequency, number> = {
    none: 1,
    daily: 90,
    weekdays: 65,
    weekends: 26,
    weekly: 13,
    biweekly: 7,
    every_3_weeks: 5,
    every_4_weeks: 4,
    monthly: 4,
    every_2_months: 2,
    every_3_months: 2,
    every_6_months: 2,
    yearly: 2,
    custom_days: 30
  };

  const targetCount = rule.endType === 'count'
    ? maxInstances
    : 366;

  const minForeverCount = rule.endType === 'forever'
    ? (minOccurrencesForForever[rule.frequency] || 1)
    : 0;

  const current = new Date(start);

  switch (rule.frequency) {
    case 'daily': {
      while (results.length < targetCount) {
        if (endLimitDate && current > endLimitDate && results.length >= minForeverCount) break;
        results.push(formatDateToYMD(current));
        current.setDate(current.getDate() + 1);
      }
      break;
    }

    case 'weekdays': {
      while (results.length < targetCount) {
        if (endLimitDate && current > endLimitDate && results.length >= minForeverCount) break;
        const dayOfWeek = current.getDay();
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          results.push(formatDateToYMD(current));
        }
        current.setDate(current.getDate() + 1);
      }
      break;
    }

    case 'weekends': {
      while (results.length < targetCount) {
        if (endLimitDate && current > endLimitDate && results.length >= minForeverCount) break;
        const dayOfWeek = current.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          results.push(formatDateToYMD(current));
        }
        current.setDate(current.getDate() + 1);
      }
      break;
    }

    case 'weekly': {
      const selectedDays = (rule.selectedDays && rule.selectedDays.length > 0)
        ? rule.selectedDays
        : [start.getDay()];

      while (results.length < targetCount) {
        if (endLimitDate && current > endLimitDate && results.length >= minForeverCount) break;
        const dayOfWeek = current.getDay();
        if (selectedDays.includes(dayOfWeek)) {
          results.push(formatDateToYMD(current));
        }
        current.setDate(current.getDate() + 1);
        const diffDays = Math.round((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 730) break;
      }
      break;
    }

    case 'biweekly': {
      while (results.length < targetCount) {
        if (endLimitDate && current > endLimitDate && results.length >= minForeverCount) break;
        results.push(formatDateToYMD(current));
        current.setDate(current.getDate() + 14);
      }
      break;
    }

    case 'every_3_weeks': {
      while (results.length < targetCount) {
        if (endLimitDate && current > endLimitDate && results.length >= minForeverCount) break;
        results.push(formatDateToYMD(current));
        current.setDate(current.getDate() + 21);
      }
      break;
    }

    case 'every_4_weeks': {
      while (results.length < targetCount) {
        if (endLimitDate && current > endLimitDate && results.length >= minForeverCount) break;
        results.push(formatDateToYMD(current));
        current.setDate(current.getDate() + 28);
      }
      break;
    }

    case 'monthly': {
      const anchorDay = start.getDate();
      let monthIndex = 0;
      while (results.length < targetCount) {
        const next = new Date(start.getFullYear(), start.getMonth() + monthIndex, 1, 12, 0, 0);
        const daysInMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
        next.setDate(Math.min(anchorDay, daysInMonth));

        if (endLimitDate && next > endLimitDate && results.length >= minForeverCount) break;
        results.push(formatDateToYMD(next));
        monthIndex++;
      }
      break;
    }

    case 'every_2_months': {
      const anchorDay = start.getDate();
      let monthIndex = 0;
      while (results.length < targetCount) {
        const next = new Date(start.getFullYear(), start.getMonth() + (monthIndex * 2), 1, 12, 0, 0);
        const daysInMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
        next.setDate(Math.min(anchorDay, daysInMonth));

        if (endLimitDate && next > endLimitDate && results.length >= minForeverCount) break;
        results.push(formatDateToYMD(next));
        monthIndex++;
      }
      break;
    }

    case 'every_3_months': {
      const anchorDay = start.getDate();
      let monthIndex = 0;
      while (results.length < targetCount) {
        const next = new Date(start.getFullYear(), start.getMonth() + (monthIndex * 3), 1, 12, 0, 0);
        const daysInMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
        next.setDate(Math.min(anchorDay, daysInMonth));

        if (endLimitDate && next > endLimitDate && results.length >= minForeverCount) break;
        results.push(formatDateToYMD(next));
        monthIndex++;
      }
      break;
    }

    case 'every_6_months': {
      const anchorDay = start.getDate();
      let monthIndex = 0;
      while (results.length < targetCount) {
        const next = new Date(start.getFullYear(), start.getMonth() + (monthIndex * 6), 1, 12, 0, 0);
        const daysInMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
        next.setDate(Math.min(anchorDay, daysInMonth));

        if (endLimitDate && next > endLimitDate && results.length >= minForeverCount) break;
        results.push(formatDateToYMD(next));
        monthIndex++;
      }
      break;
    }

    case 'yearly': {
      const anchorMonth = start.getMonth();
      const anchorDay = start.getDate();
      let yearOffset = 0;
      while (results.length < targetCount) {
        const targetYear = start.getFullYear() + yearOffset;
        const daysInTargetMonth = new Date(targetYear, anchorMonth + 1, 0).getDate();
        const clampedDay = Math.min(anchorDay, daysInTargetMonth);
        const next = new Date(targetYear, anchorMonth, clampedDay, 12, 0, 0);

        if (endLimitDate && next > endLimitDate && results.length >= minForeverCount) break;
        results.push(formatDateToYMD(next));
        yearOffset++;
      }
      break;
    }

    case 'custom_days': {
      const interval = Math.max(rule.interval || 2, 1);
      while (results.length < targetCount) {
        if (endLimitDate && current > endLimitDate && results.length >= minForeverCount) break;
        results.push(formatDateToYMD(current));
        current.setDate(current.getDate() + interval);
      }
      break;
    }

    default:
      results.push(startDateStr);
  }

  // Ensure first date is always in results
  if (results.length === 0) {
    results.push(startDateStr);
  }

  return results;
}

/**
 * Extends all active 'forever' recurring series to ensure there are instances
 * planned at least `lookaheadDays` (default 90) into the future from `fromDateStr`.
 * Returns newly generated HealthEvent instances that need to be saved to DB.
 */
export function extendForeverSeries(
  existingEvents: HealthEvent[],
  fromDateStr: string = formatDateToYMD(new Date()),
  lookaheadDays: number = 90
): HealthEvent[] {
  const fromDate = parseYMDToDate(fromDateStr);
  const targetHorizon = new Date(fromDate);
  targetHorizon.setDate(targetHorizon.getDate() + lookaheadDays);
  const targetHorizonStr = formatDateToYMD(targetHorizon);

  // Group events by recurrenceGroupId
  const groups = new Map<string, HealthEvent[]>();
  for (const ev of existingEvents) {
    if (ev.recurrenceGroupId) {
      const list = groups.get(ev.recurrenceGroupId) || [];
      list.push(ev);
      groups.set(ev.recurrenceGroupId, list);
    }
  }

  const newEventsToCreate: HealthEvent[] = [];

  for (const [groupId, groupList] of groups.entries()) {
    const template = groupList.find(e => e.recurrence && e.recurrence.endType === 'forever');
    if (!template || !template.recurrence) continue;

    // Existing dates set for deduplication
    const existingDates = new Set(groupList.map(e => e.date));
    const sortedDates = Array.from(existingDates).sort();
    const minDateStr = sortedDates[0];
    const maxDateStr = sortedDates[sortedDates.length - 1];

    if (!maxDateStr || !minDateStr) continue;

    // If maxDateStr is already >= targetHorizonStr, series is already sufficiently planned
    if (maxDateStr >= targetHorizonStr) {
      continue;
    }

    // Generate dates from the anchor start date up to targetHorizonStr
    const ruleWithUntil: RecurrenceRule = {
      ...template.recurrence,
      endType: 'until_date',
      endDate: targetHorizonStr,
    };

    const allDates = generateRecurrenceDates(minDateStr, ruleWithUntil, {
      targetDate: targetHorizonStr,
    });

    const now = Date.now();
    let addIndex = 0;
    for (const d of allDates) {
      if (!existingDates.has(d) && d <= targetHorizonStr) {
        existingDates.add(d);
        newEventsToCreate.push({
          id: `ext_${now.toString(36)}_${addIndex++}_${Math.random().toString(36).substring(2, 6)}`,
          petId: template.petId,
          date: d,
          time: template.time,
          type: template.type,
          title: template.title,
          notes: template.notes,
          isCompleted: false,
          recurrence: template.recurrence,
          recurrenceGroupId: groupId,
          recurrenceLabel: template.recurrenceLabel,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  }

  return newEventsToCreate;
}

/**
 * Returns a readable Polish label for a recurrence rule
 */
export function formatRecurrenceLabel(rule: RecurrenceRule): string {
  if (!rule || rule.frequency === 'none') {
    return 'Jednorazowo';
  }

  switch (rule.frequency) {
    case 'daily':
      return 'Codziennie';
    case 'weekdays':
      return 'Od pon. do pt.';
    case 'weekends':
      return 'W weekendy';
    case 'weekly': {
      if (rule.selectedDays && rule.selectedDays.length > 0 && rule.selectedDays.length < 7) {
        const dayLabels = rule.selectedDays
          .map(d => POLISH_WEEK_DAYS.find(pwd => pwd.index === d)?.label || '')
          .filter(Boolean);
        return `Co tydzień (${dayLabels.join(', ')})`;
      }
      return 'Co tydzień';
    }
    case 'biweekly':
      return 'Co 2 tygodnie';
    case 'every_3_weeks':
      return 'Co 3 tygodnie';
    case 'every_4_weeks':
      return 'Co 4 tygodnie';
    case 'monthly':
      return 'Co miesiąc';
    case 'every_2_months':
      return 'Co 2 miesiące';
    case 'every_3_months':
      return 'Co 3 miesiące';
    case 'every_6_months':
      return 'Co 6 miesięcy';
    case 'yearly':
      return 'Co rok';
    case 'custom_days':
      return `Co ${rule.interval || 2} dni`;
    default:
      return 'Cyklicznie';
  }
}

/**
 * Smart suggestion of recurrence rule based on task title, notes, or frequency hints
 * Uses word-boundary matching so words like "Krok" don't trigger "rok" and "za tydzień" doesn't trigger "weekly".
 */
export function suggestRecurrenceFromTask(
  title: string,
  notes?: string,
  frequencyHint?: string
): RecurrenceRule {
  const text = `${title} ${notes || ''} ${frequencyHint || ''}`.toLowerCase();

  // Explicit non-recurring phrases
  if (/\bza tydzień\b|\bza 2 tygodnie\b|\bza miesiąc\b|\bza rok\b/.test(text)) {
    return { frequency: 'none', endType: 'forever' };
  }

  // 3-4 weeks (nails, grooming cycle)
  if (/\bpazur\w*/.test(text) || text.includes('3-4 tyg') || text.includes('3–4 tyg') || /\bco 3 tygodn\w*/.test(text)) {
    return { frequency: 'every_3_weeks', endType: 'forever' };
  }

  // Yearly (vaccines, rabies, annual checkups) - note \brok\b or \broczn\w* avoiding "krok", "wyrok", etc.
  if (
    /\bszczepien\w*/.test(text) ||
    /\bwściekli\w*/.test(text) ||
    /\bpomor\w*/.test(text) ||
    /\bmyksomatoz\w*/.test(text) ||
    /\broczn\w*/.test(text) ||
    /\bco rok\b/.test(text)
  ) {
    return { frequency: 'yearly', endType: 'forever' };
  }

  // 3 months (deworming, anti-parasitic)
  if (
    /\bodrobacz\w*/.test(text) ||
    /\bpasożyt\w*/.test(text) ||
    /\bkleszcz\w*/.test(text) ||
    text.includes('3 mies') ||
    text.includes('kwartal')
  ) {
    return { frequency: 'every_3_months', endType: 'forever' };
  }

  // Weekly (weight control, weekly cleaning) - requires "co tydzień" or "ważenie" or "waga"
  if (
    /\bco tydzień\b|\bco tydzien\b|\btygodniow\w*/.test(text) ||
    /\bważeni\w*/.test(text) ||
    /\bkontrola wagi\b/.test(text)
  ) {
    return { frequency: 'weekly', endType: 'forever' };
  }

  // Weekdays
  if (/\brobocz\w*/.test(text) || text.includes('poniedziałku do piątku') || text.includes('pn-pt')) {
    return { frequency: 'weekdays', endType: 'forever' };
  }

  // Weekends
  if (/\bweekend\w*/.test(text)) {
    return { frequency: 'weekends', endType: 'forever' };
  }

  // Daily
  if (
    /\bcodzien\w*/.test(text) ||
    /\bświeża woda\b/.test(text) ||
    /\bsiano\b/.test(text) ||
    /\bwitamina c\b/.test(text) ||
    /\bkuwet\w*/.test(text)
  ) {
    return { frequency: 'daily', endType: 'forever' };
  }

  return { frequency: 'none', endType: 'forever' };
}
