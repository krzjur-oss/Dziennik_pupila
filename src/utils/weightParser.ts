/**
 * Weight regex matching legacy representations:
 * Matches "waga: 14.5 kg", "waga 4,5 kg", "Waga: 950 g", "Waga: 6.2kg", "Szczepienie, waga 4,5 kg, za 3 tygodnie"
 * Does NOT match "Zjadł 200 g karmy", "Spacer 2 godziny", "Waga wzrosła", "Nadwaga: 3 kg", "Obwód szyi: 32 cm"
 */
export const WEIGHT_RE = /(?<![\p{L}\d])waga:?\s*(\d+(?:[.,]\d+)?)\s*(kg|g)(?![\p{L}\d])/iu;

export function parseLegacyWeightKg(text: string): number | null {
  if (!text) return null;
  const match = text.match(WEIGHT_RE);
  if (!match) return null;

  const num = parseFloat(match[1].replace(',', '.'));
  if (isNaN(num) || num <= 0) return null;

  const unit = match[2].toLowerCase();
  if (unit === 'g') {
    return Number((num / 1000).toFixed(4));
  }
  return num;
}
