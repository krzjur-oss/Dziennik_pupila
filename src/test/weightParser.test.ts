import { describe, it, expect } from 'vitest';
import { parseLegacyWeightKg } from '../utils/weightParser';

describe('Etap 2: parseLegacyWeightKg - precyzyjne dopasowanie wzorca', () => {
  const cases: Array<[string, number | null]> = [
    ['Waga: 14.5 kg', 14.5],
    ['waga 4,5 kg', 4.5],
    ['Waga: 950 g', 0.95],
    ['Waga: 6.2kg', 6.2],
    ['Szczepienie, waga 4,5 kg, za 3 tygodnie', 4.5],
    ['Zjadł 200 g karmy', null],
    ['Spacer 2 godziny w parku', null],
    ['Waga wzrosła, kontrola za 2 tygodnie', null],
    ['Nadwaga: 3 kg', null],
    ['Obwód szyi: 32 cm', null],
  ];

  for (const [text, expected] of cases) {
    it(`parsuje "${text}" -> ${expected}`, () => {
      expect(parseLegacyWeightKg(text)).toBe(expected);
    });
  }
});
