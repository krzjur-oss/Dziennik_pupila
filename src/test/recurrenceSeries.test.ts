import { describe, it, expect } from 'vitest';
import {
  generateRecurrenceDates,
  extendForeverSeries,
  formatDateToYMD,
  parseYMDToDate,
} from '../lib/recurrence';
import { HealthEvent, RecurrenceRule } from '../types';

describe('Etap 3 / Poprawka W2: Realne bezterminowo w modelu reguły serii + okno przesuwne', () => {
  it('generateRecurrenceDates dla forever generuje co najmniej 90 dni w przód', () => {
    const todayStr = '2026-09-24';
    const rule: RecurrenceRule = {
      frequency: 'daily',
      endType: 'forever',
    };

    const dates = generateRecurrenceDates(todayStr, rule);
    expect(dates.length).toBeGreaterThanOrEqual(90);
    expect(dates[0]).toBe('2026-09-24');
    expect(dates[89]).toBe('2026-12-22');
  });

  it('odrzuca lub respektuje endCount do 366 bez cichego obcinania do 90', () => {
    const todayStr = '2026-01-01';
    const rule: RecurrenceRule = {
      frequency: 'daily',
      endType: 'count',
      endCount: 120, // Więcej niż poprzedni sztywny limit 90
    };

    const dates = generateRecurrenceDates(todayStr, rule);
    expect(dates.length).toBe(120);
  });

  it('Wymóg A.5: Seria dzienna forever utworzona dzisiaj -> upływ 60 dni -> dogenerowanie -> wystąpienia na kolejne >= 30 dni', () => {
    const startDate = '2026-09-24';
    const rule: RecurrenceRule = {
      frequency: 'daily',
      endType: 'forever',
    };

    // 1. Początkowe utworzenie serii
    const initialDates = generateRecurrenceDates(startDate, rule);
    expect(initialDates.length).toBe(91); // 2026-09-24 + 90 dni = 2026-12-23

    const groupId = 'group_series_test_1';
    const initialEvents: HealthEvent[] = initialDates.map((d, idx) => ({
      id: `ev_${idx}`,
      petId: 'pet_burek',
      date: d,
      type: 'leki',
      title: 'Podanie witaminy',
      isCompleted: idx < 60,
      recurrence: rule,
      recurrenceGroupId: groupId,
      recurrenceLabel: 'Codziennie',
      createdAt: 1000,
    }));

    // 2. Symulujemy upływ 60 dni
    // 2026-09-24 + 60 dni:
    const simulatedDate = parseYMDToDate(startDate);
    simulatedDate.setDate(simulatedDate.getDate() + 60);
    const simulatedDateStr = formatDateToYMD(simulatedDate); // 2026-11-23

    // 3. Wywołanie mechanizmu dogenerowania brakujących wystąpień (okno przesuwne 90 dni)
    const newEvents = extendForeverSeries(initialEvents, simulatedDateStr, 90);
    expect(newEvents.length).toBeGreaterThan(0);

    // Połączenie istniejących i nowo wygenerowanych zdarzeń
    const combinedEvents = [...initialEvents, ...newEvents];
    const combinedDates = combinedEvents.map((e) => e.date).sort();

    // Sprawdzamy czy najdalsza data sięga co najmniej 90 dni od symulowanego dnia (2026-11-23 + 90 = 2027-02-21)
    const targetMinDate = parseYMDToDate(simulatedDateStr);
    targetMinDate.setDate(targetMinDate.getDate() + 30); // wymagane >= 30 dni od simulatedDate
    const targetMinDateStr = formatDateToYMD(targetMinDate);

    const maxGeneratedDate = combinedDates[combinedDates.length - 1];
    expect(maxGeneratedDate >= targetMinDateStr).toBe(true);

    // Brak duplikatów dla tego samego dnia
    const uniqueDates = new Set(combinedDates);
    expect(uniqueDates.size).toBe(combinedDates.length);
  });
});
