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
  const GRID_ROWS = 21;
  const GRID_COLS = 10;
  const CELL_SIZE = 28;
  const CELL_GAP = 4;
  const SWATCH_W = 32;
  const SWATCH_H = 28;
  const COLORS = [
    "#D26064",
    "#F8961E",
    "#F9C74F",
    "#9BA65D",
    "#476E51",
    "#59829E",
    "#A6B8C7",
    "#B5A6C7",
    "#5B4977",
    "#7E7A84",
    "#F1EEE3",
  ];

  const createInitialGrid = (): string[][] =>
    Array(GRID_ROWS)
      .fill(null)
      .map(() => Array(GRID_COLS).fill("#171717"));

  const [grid, setGrid] = useState<string[][]>(createInitialGrid());
  const [currentColor, setCurrentColor] = useState("#F5f5f5");
  const [hasSelectedColor, setHasSelectedColor] = useState(false);
  const [isRubber, setIsRubber] = useState(false);
  const [history, setHistory] = useState<string[][][]>([createInitialGrid()]);
  const [currentStep, setCurrentStep] = useState(0);
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
    const cellWidth = rect.width / GRID_COLS;
    const cellHeight = rect.height / GRID_ROWS;
    const col = Math.floor(x / cellWidth);
    const row = Math.floor(y / cellHeight);
    if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return null;
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

  // Calculate grid total height to distribute swatches evenly
  const gridHeight = GRID_ROWS * CELL_SIZE + (GRID_ROWS - 1) * CELL_GAP;

  return (
    <div className="w-full min-h-screen bg-[#212121] flex flex-col">
      {/* Play/Pause button — top center */}
      <div className="flex justify-center" style={{ paddingTop: 22 }}>
        <button
          onClick={togglePlayback}
          className="flex items-center justify-center bg-[#171717] border border-[#515151] text-[#DBD2C9] hover:bg-[#262626] transition-colors"
          style={{ width: 124, height: 32, borderRadius: 20 }}
        >
          {isPlaying ? <PauseIcon size={16} weight="fill" /> : <PlayIcon size={16} weight="fill" />}
        </button>
      </div>

      {/* Color sidebar + Grid */}
      <div className="flex" style={{ paddingTop: 18 }}>
        {/* Color selection — flush left, only right corners rounded */}
        <div
          className="flex flex-col justify-between"
          style={{ height: gridHeight }}
        >
          {COLORS.map((color) => (
            <button
              key={color}
              className="transition-all"
              style={{
                backgroundColor: color,
                width: SWATCH_W,
                height: SWATCH_H,
                borderRadius: "0 4px 4px 0",
                outline: currentColor === color && hasSelectedColor && !isRubber
                  ? "2px solid white"
                  : "none",
                outlineOffset: "-1px",
              }}
              onClick={() => {
                setCurrentColor(color);
                setHasSelectedColor(true);
                setIsRubber(false);
              }}
            />
          ))}
        </div>

        {/* Spacer between palette and grid */}
        <div style={{ width: 16 }} />

        {/* Grid */}
        <div
          ref={gridRef}
          className="select-none"
          style={{
            touchAction: "none",
            display: "grid",
            gridTemplateColumns: `repeat(${GRID_COLS}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${GRID_ROWS}, ${CELL_SIZE}px)`,
            gap: CELL_GAP,
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {grid.map((row, rowIndex) =>
            row.map((color, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`${
                  currentCol === colIndex ? 'brightness-150' : ''
                }`}
                style={{
                  backgroundColor: color,
                  borderRadius: 4,
                }}
                onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
              />
            ))
          )}
        </div>
      </div>

      {/* Action Bar */}
      <div
        className="flex justify-between items-center"
        style={{ paddingLeft: 48, paddingRight: 48, paddingTop: 16 }}
      >
        {/* Undo / Redo / Clear */}
        <div className="flex gap-2">
          <button
            onClick={undo}
            disabled={currentStep === 0}
            className="flex items-center justify-center border border-[#515151] bg-[#171717] text-[#DBD2C9] hover:bg-[#262626] disabled:opacity-30 transition-colors"
            style={{ width: 60, height: 32, borderRadius: 20 }}
            title="Undo"
          >
            <ArrowCounterClockwiseIcon size={16} />
          </button>
          <button
            onClick={redo}
            disabled={currentStep >= history.length - 1}
            className="flex items-center justify-center border border-[#515151] bg-[#171717] text-[#DBD2C9] hover:bg-[#262626] disabled:opacity-30 transition-colors"
            style={{ width: 60, height: 32, borderRadius: 20 }}
            title="Redo"
          >
            <ArrowClockwiseIcon size={16} />
          </button>
        </div>

        {/* Clear canvas */}
        <button
          onClick={clearCanvas}
          className="flex items-center justify-center border border-[#515151] bg-[#171717] text-[#DBD2C9] hover:bg-[#262626] transition-colors"
          style={{ width: 60, height: 32, borderRadius: 20 }}
        >
          <TrashIcon size={16} />
        </button>
      </div>
    </div>
  );
}
