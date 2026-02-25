import { useState, useRef, useCallback, useEffect } from 'react';
import Soundfont from 'soundfont-player';
import {
  getNoteForRow,
  INSTRUMENT_CONFIGS,
  findClosestPaletteColor,
  InstrumentConfig,
} from '../utils/audioMapping';

const BACKGROUND_COLOR = '#171717';

// How far ahead (in seconds) to schedule notes into the Web Audio clock.
// Larger = more stable timing, slightly more latency on pause.
const LOOKAHEAD_S = 0.15;
// How often (ms) the scheduler wakes up to fill the lookahead window.
const SCHEDULER_INTERVAL_MS = 50;

interface InstrumentEntry {
  player: any;
  config: InstrumentConfig;
}

interface UseAudioPlaybackReturn {
  isPlaying: boolean;
  currentCol: number | null;
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  initAudio: () => Promise<void>;
}

export function useAudioPlayback(grid: string[][], tempo: number = 80): UseAudioPlaybackReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentCol, setCurrentCol] = useState<number | null>(null);

  const instrumentMapRef = useRef<Map<string, InstrumentEntry>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const isInitializedRef = useRef(false);

  // Scheduler state
  const schedulerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextColRef = useRef(0);          // which column to schedule next
  const nextColTimeRef = useRef(0);      // ac.currentTime when that column should play
  const activeRef = useRef(false);

  const initAudio = useCallback(async () => {
    if (typeof window === 'undefined') throw new Error('Audio not available');

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
    const ac = audioContextRef.current;
    if (ac.state === 'suspended') await ac.resume();

    if (!isInitializedRef.current) {
      const entries = Object.entries(INSTRUMENT_CONFIGS);
      const players = await Promise.all(
        entries.map(([, config]) =>
          Soundfont.instrument(ac, config.soundfontName as any, { soundfont: 'MusyngKite' } as any)
        )
      );
      entries.forEach(([color, config], i) => {
        instrumentMapRef.current.set(color, { player: players[i], config });
      });
      isInitializedRef.current = true;
    }
  }, []);

  const stopPlayback = useCallback(() => {
    activeRef.current = false;
    if (schedulerRef.current !== null) {
      clearInterval(schedulerRef.current);
      schedulerRef.current = null;
    }
    setIsPlaying(false);
    setCurrentCol(null);
  }, []);

  const play = useCallback(async () => {
    await initAudio();
    if (instrumentMapRef.current.size === 0) throw new Error('Instruments not initialized');

    const hasPixels = grid.some(row => row.some(cell => cell !== BACKGROUND_COLOR));
    if (!hasPixels) {
      alert('Canvas is empty. Draw something to hear it play!');
      return;
    }

    stopPlayback();

    const ac = audioContextRef.current!;
    const GRID_COLS = grid[0].length;
    const secPerCol = 60 / tempo;  // seconds between columns

    // Note duration: slightly longer than one column so notes blend into each other
    // Bass is shorter (plucky), cymbal is very short
    const getDuration = (config: InstrumentConfig) => {
      if (config.soundfontName === 'acoustic_bass') return secPerCol * 0.6;
      if (config.soundfontName === 'woodblock') return secPerCol * 0.2;
      return secPerCol * 1.1; // slight overlap → smooth legato feel
    };

    activeRef.current = true;
    nextColRef.current = 0;
    nextColTimeRef.current = ac.currentTime + 0.05; // small start delay
    setIsPlaying(true);

    const tick = () => {
      if (!activeRef.current) return;
      const ac = audioContextRef.current!;

      // Schedule every column whose time falls within the lookahead window
      while (nextColTimeRef.current < ac.currentTime + LOOKAHEAD_S) {
        const col = nextColRef.current % GRID_COLS;
        const when = nextColTimeRef.current;

        // Update UI column indicator (approximate — runs slightly ahead of audio)
        const msUntil = (when - ac.currentTime) * 1000;
        setTimeout(() => {
          if (activeRef.current) setCurrentCol(col);
        }, Math.max(0, msUntil));

        // Collect notes for this column grouped by instrument
        const notesByInstrument = new Map<string, string[]>();
        for (let row = 0; row < grid.length; row++) {
          const cellColor = grid[row][col];
          if (cellColor === BACKGROUND_COLOR) continue;
          const paletteColor = INSTRUMENT_CONFIGS[cellColor]
            ? cellColor
            : findClosestPaletteColor(cellColor);
          const note = getNoteForRow(row);
          if (!notesByInstrument.has(paletteColor)) notesByInstrument.set(paletteColor, []);
          notesByInstrument.get(paletteColor)!.push(note);
        }

        // Fire into Web Audio clock at the exact scheduled time
        notesByInstrument.forEach((notes, paletteColor) => {
          const entry = instrumentMapRef.current.get(paletteColor);
          if (!entry) return;
          const { player, config } = entry;
          const duration = getDuration(config);
          notes.forEach((note: string) => {
            try {
              player.play(note, when, { duration, gain: 0.85 });
            } catch (e) {
              console.error(`play error [${config.name}]:`, e);
            }
          });
        });

        nextColRef.current++;
        nextColTimeRef.current += secPerCol;
      }
    };

    // Run scheduler immediately then on interval
    tick();
    schedulerRef.current = setInterval(tick, SCHEDULER_INTERVAL_MS);
  }, [grid, tempo, initAudio, stopPlayback]);

  const pause = useCallback(() => stopPlayback(), [stopPlayback]);

  useEffect(() => {
    return () => {
      stopPlayback();
      instrumentMapRef.current.forEach(({ player }) => {
        try { player.stop(); } catch (_) {}
      });
      instrumentMapRef.current.clear();
      if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch (_) {}
        audioContextRef.current = null;
      }
    };
  }, []);

  return { isPlaying, currentCol, play, pause, stop: stopPlayback, initAudio };
}
