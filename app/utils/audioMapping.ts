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

/**
 * Shift a note string by octaves, e.g. shiftOctave('B5', -2) => 'B3'
 * Clamps to octave 1-7 range.
 */
export function shiftOctave(note: string, offset: number): string {
  const match = note.match(/^([A-G]#?)(\d+)$/);
  if (!match) return note;
  const name = match[1];
  const octave = Math.max(1, Math.min(7, parseInt(match[2]) + offset));
  return `${name}${octave}`;
}

// ---------- Instrument Configuration ----------

export interface InstrumentConfig {
  name: string;
  soundfontName: string;
  noteDuration: number; // seconds, calibrated at 120 BPM
  octaveOffset: number; // shift notes up/down by octaves
}

// All colors use piano, each in a different register (octave offset)
// Ordered from palette top to bottom: highest register → lowest register
export const INSTRUMENT_CONFIGS: Record<string, InstrumentConfig> = {
  '#D26064': {
    name: 'Piano +3',
    soundfontName: 'acoustic_grand_piano',
    noteDuration: 0.25,
    octaveOffset: 3,
  },
  '#F8961E': {
    name: 'Piano +2',
    soundfontName: 'acoustic_grand_piano',
    noteDuration: 0.25,
    octaveOffset: 2,
  },
  '#F9C74F': {
    name: 'Piano +1',
    soundfontName: 'acoustic_grand_piano',
    noteDuration: 0.25,
    octaveOffset: 1,
  },
  '#9BA65D': {
    name: 'Piano 0',
    soundfontName: 'acoustic_grand_piano',
    noteDuration: 0.25,
    octaveOffset: 0,
  },
  '#476E51': {
    name: 'Piano -1',
    soundfontName: 'acoustic_grand_piano',
    noteDuration: 0.25,
    octaveOffset: -1,
  },
  '#59829E': {
    name: 'Piano -2',
    soundfontName: 'acoustic_grand_piano',
    noteDuration: 0.25,
    octaveOffset: -2,
  },
  '#A6B8C7': {
    name: 'Piano -3',
    soundfontName: 'acoustic_grand_piano',
    noteDuration: 0.25,
    octaveOffset: -3,
  },
  '#B5A6C7': {
    name: 'Piano -4',
    soundfontName: 'acoustic_grand_piano',
    noteDuration: 0.25,
    octaveOffset: -4,
  },
  '#5B4977': {
    name: 'Piano -5',
    soundfontName: 'acoustic_grand_piano',
    noteDuration: 0.25,
    octaveOffset: -5,
  },
  '#7E7A84': {
    name: 'Piano -6',
    soundfontName: 'acoustic_grand_piano',
    noteDuration: 0.25,
    octaveOffset: -6,
  },
  '#F1EEE3': {
    name: 'Piano -7',
    soundfontName: 'acoustic_grand_piano',
    noteDuration: 0.25,
    octaveOffset: -7,
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
