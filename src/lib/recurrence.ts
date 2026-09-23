import { RecurrenceFrequency, RecurrenceRule } from '../types';

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
 * Hard limit of 90 instances max to guarantee responsiveness and zero latency.
 */
export function generateRecurrenceDates(startDateStr: string, rule: RecurrenceRule): string[] {
  if (!rule || rule.frequency === 'none') {
    return [startDateStr];
  }

  const results: string[] = [];
  const start = parseYMDToDate(startDateStr);
  const maxInstances = rule.endType === 'count' && rule.endCount ? Math.min(rule.endCount, 90) : 90;
  
  const endLimitDate = rule.endType === 'until_date' && rule.endDate
    ? parseYMDToDate(rule.endDate)
    : null;

  // Default occurrences if 'forever'
  const foreverLimits: Record<RecurrenceFrequency, number> = {
    none: 1,
    daily: 30, // 30 days ahead
    weekdays: 25, // approx 5 weeks
    weekends: 16, // 8 weekends
    weekly: 16, // 16 weeks
    biweekly: 12, // 24 weeks
    every_3_weeks: 10, // 30 weeks
    every_4_weeks: 8,
    monthly: 12, // 1 year
    every_2_months: 6, // 1 year
    every_3_months: 6, // 1.5 year
    every_6_months: 4, // 2 years
    yearly: 3, // 3 years
    custom_days: 20
  };

  const targetCount = rule.endType === 'count'
    ? maxInstances
    : rule.endType === 'until_date'
    ? 90
    : foreverLimits[rule.frequency] || 30;

  const current = new Date(start);

  switch (rule.frequency) {
    case 'daily': {
      while (results.length < targetCount) {
        if (endLimitDate && current > endLimitDate) break;
        results.push(formatDateToYMD(current));
        current.setDate(current.getDate() + 1);
      }
      break;
    }

    case 'weekdays': {
      // Monday (1) to Friday (5)
      while (results.length < targetCount) {
        if (endLimitDate && current > endLimitDate) break;
        const dayOfWeek = current.getDay();
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          results.push(formatDateToYMD(current));
        }
        current.setDate(current.getDate() + 1);
        if (results.length >= 90) break;
      }
      break;
    }

    case 'weekends': {
      // Saturday (6) and Sunday (0)
      while (results.length < targetCount) {
        if (endLimitDate && current > endLimitDate) break;
        const dayOfWeek = current.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          results.push(formatDateToYMD(current));
        }
        current.setDate(current.getDate() + 1);
        if (results.length >= 90) break;
      }
      break;
    }

    case 'weekly': {
      const selectedDays = (rule.selectedDays && rule.selectedDays.length > 0)
        ? rule.selectedDays
        : [start.getDay()];

      while (results.length < targetCount) {
        if (endLimitDate && current > endLimitDate) break;
        const dayOfWeek = current.getDay();
        if (selectedDays.includes(dayOfWeek)) {
          results.push(formatDateToYMD(current));
        }
        current.setDate(current.getDate() + 1);
        // Safety bound: up to 365 days checked
        const diffDays = Math.round((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 365) break;
      }
      break;
    }

    case 'biweekly': {
      while (results.length < targetCount) {
        if (endLimitDate && current > endLimitDate) break;
        results.push(formatDateToYMD(current));
        current.setDate(current.getDate() + 14);
      }
      break;
    }

    case 'every_3_weeks': {
      while (results.length < targetCount) {
        if (endLimitDate && current > endLimitDate) break;
        results.push(formatDateToYMD(current));
        current.setDate(current.getDate() + 21);
      }
      break;
    }

    case 'every_4_weeks': {
      while (results.length < targetCount) {
        if (endLimitDate && current > endLimitDate) break;
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
        // Clamp to last day of month if necessary (e.g. 31 Jan -> 28 Feb)
        const daysInMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
        next.setDate(Math.min(anchorDay, daysInMonth));

        if (endLimitDate && next > endLimitDate) break;
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

        if (endLimitDate && next > endLimitDate) break;
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

        if (endLimitDate && next > endLimitDate) break;
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

        if (endLimitDate && next > endLimitDate) break;
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
        const next = new Date(start.getFullYear() + yearOffset, anchorMonth, anchorDay, 12, 0, 0);
        if (endLimitDate && next > endLimitDate) break;
        results.push(formatDateToYMD(next));
        yearOffset++;
      }
      break;
    }

    case 'custom_days': {
      const interval = Math.max(rule.interval || 2, 1);
      while (results.length < targetCount) {
        if (endLimitDate && current > endLimitDate) break;
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
 */
export function suggestRecurrenceFromTask(
  title: string,
  notes?: string,
  frequencyHint?: string
): RecurrenceRule {
  const text = `${title} ${notes || ''} ${frequencyHint || ''}`.toLowerCase();

  // High-confidence patterns
  if (text.includes('pazur') || text.includes('3-4 tyg') || text.includes('3–4 tyg') || text.includes('3 tygodn')) {
    return { frequency: 'every_3_weeks', endType: 'forever' };
  }
  if (text.includes('szczepien') || text.includes('wściekl') || text.includes('pomor') || text.includes('myksomatoz') || text.includes('rok') || text.includes('coroczn')) {
    return { frequency: 'yearly', endType: 'forever' };
  }
  if (text.includes('odrobacz') || text.includes('pasożyt') || text.includes('kleszcz') || text.includes('3 mies')) {
    return { frequency: 'every_3_months', endType: 'forever' };
  }
  if (text.includes('wag') || text.includes('ważeń') || text.includes('tydzień') || text.includes('tygodni')) {
    return { frequency: 'weekly', endType: 'forever' };
  }
  if (text.includes('robocz') || text.includes('poniedziałku do piątku') || text.includes('pn-pt')) {
    return { frequency: 'weekdays', endType: 'forever' };
  }
  if (text.includes('weekend')) {
    return { frequency: 'weekends', endType: 'forever' };
  }
  if (text.includes('codzien') || text.includes('woda') || text.includes('siano') || text.includes('witamina c') || text.includes('rano') || text.includes('wieczór') || text.includes('kuwet')) {
    return { frequency: 'daily', endType: 'forever' };
  }

  return { frequency: 'none', endType: 'forever' };
}
