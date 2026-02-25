"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowCounterClockwiseIcon,
  ArrowClockwiseIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { useAudioPlayback } from "./hooks/useAudioPlayback";

interface StrokePoint {
  row: number;
  col: number;
  oldColor: string;
  newColor: string;
}

export default function VisitorsPage() {
  const GRID_SIZE = 20;
  const COLORS = [
    "#D26064",
    "#F8961E",
    "#F9C74F",
    "#9BA65D",
    "#59829E",
    "#A6B8C7",
    "#B5A6C7",
    "#7E7A84",
  ];

  const createInitialGrid = (): string[][] =>
    Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill("#171717"));

  const [grid, setGrid] = useState<string[][]>(createInitialGrid());
  const [currentColor, setCurrentColor] = useState("#F5f5f5");
  const [hasSelectedColor, setHasSelectedColor] = useState(false);
  const [isRubber, setIsRubber] = useState(false);
  const [history, setHistory] = useState<string[][][]>([createInitialGrid()]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [tempo] = useState(200);

  // Track whether a touch/mouse draw session is active
  const isDrawingRef = useRef(false);
  // Ref to grid DOM element for touch coordinate calculations
  const gridRef = useRef<HTMLDivElement>(null);
  // Keep latest grid/color state accessible in touch handlers without stale closure
  const gridStateRef = useRef({ grid, currentColor, hasSelectedColor, isRubber, history, currentStep });
  useEffect(() => {
    gridStateRef.current = { grid, currentColor, hasSelectedColor, isRubber, history, currentStep };
  });

  const { isPlaying, currentCol, play, pause, stop } = useAudioPlayback(grid, tempo);

  useEffect(() => {}, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Backspace' || event.key === 'Delete' || event.key === 'ArrowLeft') {
        event.preventDefault();
        undo();
      } else if (event.key === 'ArrowRight' || event.key === 'Escape') {
        event.preventDefault();
        redo();
      } else if (event.key === ' ') {
        event.preventDefault();
        clearCanvas();
      } else if (/^[1-9]$/.test(event.key)) {
        event.preventDefault();
        const colorIndex = parseInt(event.key) - 1;
        if (colorIndex < COLORS.length) {
          setCurrentColor(COLORS[colorIndex]);
          setHasSelectedColor(true);
          setIsRubber(false);
        }
      } else if (event.key === '0') {
        event.preventDefault();
        setIsRubber(true);
        setHasSelectedColor(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, history]);

  const clearCanvas = () => {
    if (isPlaying) stop();
    const emptyGrid = createInitialGrid();
    setGrid(emptyGrid);
    const newHistory = history.slice(0, currentStep + 1);
    newHistory.push(emptyGrid.map((row) => [...row]));
    setHistory(newHistory);
    setCurrentStep(currentStep + 1);
  };

  // Paint a single pixel, committing to history immediately (one entry per pixel for undo granularity on touch)
  const paintPixel = useCallback((row: number, col: number) => {
    const { grid, currentColor, hasSelectedColor, isRubber, history, currentStep } = gridStateRef.current;
    if (!hasSelectedColor && !isRubber) return;
    if (isRubber && grid[row][col] === "#171717") return;
    if (!isRubber && grid[row][col] === currentColor) return; // already this color
    if (isPlaying) stop();

    const newGrid = grid.map((r) => [...r]);
    newGrid[row][col] = isRubber ? "#171717" : currentColor;

    const newHistory = history.slice(0, currentStep + 1);
    newHistory.push(newGrid.map((r) => [...r]));

    // Batch state updates together
    setGrid(newGrid);
    setHistory(newHistory);
    setCurrentStep(currentStep + 1);

    // Keep ref in sync immediately so next touch event sees latest state
    gridStateRef.current = {
      ...gridStateRef.current,
      grid: newGrid,
      history: newHistory,
      currentStep: currentStep + 1,
    };
  }, [isPlaying, stop]);

  // Given a touch clientX/clientY, figure out which grid cell it lands on
  const getCellFromTouch = (clientX: number, clientY: number): { row: number; col: number } | null => {
    if (!gridRef.current) return null;
    const rect = gridRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const cellWidth = rect.width / GRID_SIZE;
    const cellHeight = rect.height / GRID_SIZE;
    const col = Math.floor(x / cellWidth);
    const row = Math.floor(y / cellHeight);
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return null;
    return { row, col };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    isDrawingRef.current = true;
    const touch = e.touches[0];
    const cell = getCellFromTouch(touch.clientX, touch.clientY);
    if (cell) paintPixel(cell.row, cell.col);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawingRef.current) return;
    const touch = e.touches[0];
    const cell = getCellFromTouch(touch.clientX, touch.clientY);
    if (cell) paintPixel(cell.row, cell.col);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    isDrawingRef.current = false;
  };

  // Mouse handlers (desktop)
  const handleMouseDown = (row: number, col: number) => {
    isDrawingRef.current = true;
    paintPixel(row, col);
  };

  const handleMouseEnter = (row: number, col: number) => {
    if (isDrawingRef.current) paintPixel(row, col);
  };

  const handleMouseUp = () => {
    isDrawingRef.current = false;
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const undo = () => {
    if (currentStep > 0) {
      if (isPlaying) stop();
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      setGrid(history[prevStep].map((row) => [...row]));
    }
  };

  const redo = () => {
    if (currentStep < history.length - 1) {
      if (isPlaying) stop();
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setGrid(history[nextStep].map((row) => [...row]));
    }
  };

  const downloadCanvas = () => {
    const hasPixels = grid.some(row => row.some(cell => cell !== '#171717'));
    if (!hasPixels) {
      alert('Please draw something before downloading!');
      return;
    }
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pixelSize = 20;
    canvas.width = GRID_SIZE * pixelSize;
    canvas.height = GRID_SIZE * pixelSize;
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        ctx.fillStyle = grid[row][col];
        ctx.fillRect(col * pixelSize, row * pixelSize, pixelSize, pixelSize);
      }
    }
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `keyboard-canvas-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  const togglePlayback = async () => {
    if (isPlaying) {
      pause();
    } else {
      try {
        await play();
      } catch (error) {
        console.error('Playback error:', error);
        alert('Failed to play audio: ' + (error as Error).message);
      }
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center px-2 py-6">
      {/* Constrain to square-ish area: full width on portrait, capped by height on landscape/desktop */}
      <div className="w-full max-w-[min(100vw,75vh)] flex flex-col gap-3">
        <h1 className="font-semibold text-white px-1">Keyboard Canvas</h1>

        {/* Color Palette — single row, evenly spaced */}
        <div className="w-full flex items-center justify-between gap-1 px-1">
          {COLORS.map((color) => (
            <button
              key={color}
              className="flex-1 aspect-square flex items-center justify-center min-w-0"
              onClick={() => {
                setCurrentColor(color);
                setHasSelectedColor(true);
                setIsRubber(false);
              }}
            >
              <div
                className={`w-[75%] h-[75%] rounded-sm transition-all ${
                  currentColor === color && hasSelectedColor && !isRubber
                    ? "ring-2 ring-white"
                    : ""
                }`}
                style={{ backgroundColor: color }}
              />
            </button>
          ))}

          {/* Custom color picker — color wheel from current palette */}
          <div className="relative flex-1 aspect-square min-w-0">
            <input
              type="color"
              value={currentColor}
              onChange={(e) => {
                setCurrentColor(e.target.value);
                setHasSelectedColor(true);
                setIsRubber(false);
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div
              className={`w-full h-full rounded-md border-2 flex items-center justify-center pointer-events-none ${
                hasSelectedColor && !isRubber && !COLORS.includes(currentColor)
                  ? "border-white"
                  : "border-transparent"
              }`}
            >
              <svg viewBox="0 0 32 32" width="80%" height="80%">
                {COLORS.map((color, i) => {
                  const total = COLORS.length;
                  const angle = (2 * Math.PI) / total;
                  const startAngle = i * angle - Math.PI / 2;
                  const endAngle = startAngle + angle;
                  const r = 16;
                  const cx = 16, cy = 16;
                  const x1 = cx + r * Math.cos(startAngle);
                  const y1 = cy + r * Math.sin(startAngle);
                  const x2 = cx + r * Math.cos(endAngle);
                  const y2 = cy + r * Math.sin(endAngle);
                  return (
                    <path
                      key={color}
                      d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`}
                      fill={color}
                    />
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Eraser */}
          <button
            className="flex-1 aspect-square min-w-0 flex items-center justify-center"
            onClick={() => {
              setIsRubber(true);
              setHasSelectedColor(false);
            }}
          >
            <div
              className={`w-[75%] h-[75%] rounded-sm flex items-center justify-center transition-all ${
                isRubber ? "ring-2 ring-white" : ""
              }`}
              style={{ backgroundColor: "#262626" }}
            >
              <img src="eraser.png" alt="Eraser" className="w-4/5 h-4/5 object-contain" />
            </div>
          </button>
        </div>

        {/* Grid */}
        <div
          ref={gridRef}
          className="w-full aspect-square select-none"
          style={{ touchAction: "none" }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {grid.map((row, rowIndex) => (
            <div key={rowIndex} className="flex" style={{ height: `${100 / GRID_SIZE}%` }}>
              {row.map((color, colIndex) => (
                <div
                  key={colIndex}
                  className={`flex-1 rounded-sm ${
                    currentCol === colIndex ? 'brightness-150' : ''
                  }`}
                  style={{ backgroundColor: color, margin: "1.5px" }}
                  onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                  onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Action Bar */}
        <div className="w-full flex justify-between items-center px-1">
          {/* Undo / Redo / Clear */}
          <div className="flex gap-2">
            <button
              onClick={undo}
              disabled={currentStep === 0}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-[#515151] text-[#DBD2C9] hover:bg-[#262626] disabled:opacity-30 transition-colors"
              title="Undo"
            >
              <ArrowCounterClockwiseIcon size={18} />
            </button>
            <button
              onClick={redo}
              disabled={currentStep >= history.length - 1}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-[#515151] text-[#DBD2C9] hover:bg-[#262626] disabled:opacity-30 transition-colors"
              title="Redo"
            >
              <ArrowClockwiseIcon size={18} />
            </button>
            <button
              onClick={clearCanvas}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-[#515151] text-[#DBD2C9] hover:bg-[#262626] transition-colors"
              title="Clear"
            >
              <TrashIcon size={18} />
            </button>
          </div>

{/* Play / Download */}
          <div className="flex gap-2">
            <button
              onClick={togglePlayback}
              className="h-10 px-3 flex items-center gap-1.5 rounded-lg border border-[#515151] text-[#DBD2C9] hover:bg-[#262626] transition-colors text-sm"
            >
              {isPlaying ? <><PauseIcon size={14} weight="fill" /><span>Pause</span></> : <><PlayIcon size={14} weight="fill" /><span>Play</span></>}
            </button>
            <button
              onClick={downloadCanvas}
              disabled={isSaving}
              className="h-10 px-3 flex items-center rounded-lg border border-[#515151] text-[#DBD2C9] hover:bg-[#262626] disabled:opacity-50 transition-colors text-sm"
            >
              Download
            </button>
          </div>
        </div>{/* end action bar */}
      </div>{/* end max-w wrapper */}
    </div>
  );
}
