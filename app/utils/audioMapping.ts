// Music box model: each row is a fixed pitch (row 0 = highest, row 19 = lowest)
// Uses a pentatonic scale so any combination sounds harmonious

// 20 rows mapped to a pentatonic scale across 4 octaves (top = high, bottom = low)
const PENTATONIC_NOTES = [
  'B5', 'A5', 'G5', 'E5', 'D5',
  'B4', 'A4', 'G4', 'E4', 'D4',
  'B3', 'A3', 'G3', 'E3', 'D3',
  'B2', 'A2', 'G2', 'E2', 'D2',
];

/**
 * Get the note for a given row (row 0 = highest pitch)
 */
export function getNoteForRow(row: number): string {
  return PENTATONIC_NOTES[Math.min(row, PENTATONIC_NOTES.length - 1)];
}

// ---------- Instrument Configuration ----------

export interface InstrumentConfig {
  name: string;
  soundfontName: string;
  noteDuration: number; // seconds, calibrated at 120 BPM
}

export const INSTRUMENT_CONFIGS: Record<string, InstrumentConfig> = {
  '#D26064': {
    name: 'Muted Trumpet',
    soundfontName: 'trumpet',
    noteDuration: 0.25,
  },
  '#F8961E': {
    name: 'Rhodes Electric Piano',
    soundfontName: 'electric_piano_1',
    noteDuration: 0.25,
  },
  '#F9C74F': {
    name: 'Vibraphone',
    soundfontName: 'vibraphone',
    noteDuration: 0.25,
  },
  '#9BA65D': {
    name: 'Upright Bass',
    soundfontName: 'acoustic_bass',
    noteDuration: 0.125,
  },
  '#59829E': {
    name: 'Jazz Organ',
    soundfontName: 'drawbar_organ',
    noteDuration: 0.25,
  },
  '#A6B8C7': {
    name: 'Brushed Cymbal',
    soundfontName: 'woodblock',
    noteDuration: 0.0625,
  },
  '#B5A6C7': {
    name: 'Saxophone',
    soundfontName: 'alto_sax',
    noteDuration: 0.25,
  },
  '#7E7A84': {
    name: 'Acoustic Piano',
    soundfontName: 'acoustic_grand_piano',
    noteDuration: 0.25,
  },
};

/**
 * Resolve any color (palette or custom) to its InstrumentConfig.
 * Custom colors fall back to the closest palette color via RGB distance.
 */
export function getInstrumentConfig(color: string): InstrumentConfig {
  if (INSTRUMENT_CONFIGS[color]) return INSTRUMENT_CONFIGS[color];
  const closest = findClosestPaletteColor(color);
  return INSTRUMENT_CONFIGS[closest];
}

// ---------- Legacy exports (unchanged) ----------

export const COLOR_TO_NOTE_MAP: Record<string, string> = {
  '#D26064': 'C',
  '#F8961E': 'D',
  '#F9C74F': 'E',
  '#9BA65D': 'G',
  '#59829E': 'A',
  '#A6B8C7': 'C',
  '#B5A6C7': 'D',
  '#7E7A84': 'E',
};

export function findClosestPaletteColor(customColor: string): string {
  const paletteColors = Object.keys(INSTRUMENT_CONFIGS);
  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : [0, 0, 0];
  };
  const colorDistance = (c1: string, c2: string): number => {
    const [r1, g1, b1] = hexToRgb(c1);
    const [r2, g2, b2] = hexToRgb(c2);
    return Math.sqrt(
      Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2)
    );
  };
  let closest = paletteColors[0];
  let minDist = Infinity;
  for (const c of paletteColors) {
    const d = colorDistance(customColor, c);
    if (d < minDist) { minDist = d; closest = c; }
  }
  return closest;
}

export function getBaseNote(c: string): string {
  return COLOR_TO_NOTE_MAP[c] || COLOR_TO_NOTE_MAP[findClosestPaletteColor(c)] || 'C';
}

// Keep legacy export for compatibility
export function getNoteFromColor(_color: string, row: number): string {
  return getNoteForRow(row);
}
