"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowCounterClockwise,
  ArrowClockwise,
} from "@phosphor-icons/react";
import Link from "next/link";

interface StrokePoint {
  row: number;
  col: number;
  oldColor: string;
  newColor: string;
}

export default function VisitorsPage() {
  const GRID_SIZE = 23;
  const COLORS = [
    "#D26064", // Deep burgundy
    "#F8961E", // Coral red
    "#F9C74F", // Golden yellow
    "#9BA65D", // Teal
    "#59829E", // Forest green
    "#A6B8C7", // Steel blue
    "#B5A6C7", // Burnt orange
    "#7E7A84", // Terra cotta
    "#F1EEE3", // Olive green
  ];
  const MAX_VISITORS = 10;

  const createInitialGrid = (): string[][] =>
    Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill("#171717"));

  const [grid, setGrid] = useState<string[][]>(createInitialGrid());
  const [currentColor, setCurrentColor] = useState("#F5f5f5");
  const [hasSelectedColor, setHasSelectedColor] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isRubber, setIsRubber] = useState(false);
  const [history, setHistory] = useState<string[][][]>([createInitialGrid()]);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentStroke, setCurrentStroke] = useState<
    Array<{ row: number; col: number; prevColor: string }>
  >([]);
  // const [visitorCount, setVisitorCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Get or create visitor ID
  // const [visitorId] = useState(() => {
  //   const storedId =
  //     typeof localStorage !== "undefined"
  //       ? localStorage.getItem("visitorId")
  //       : null;
  //   const newId = storedId || `visitor-${Math.random().toString(36).slice(2)}`;
  //   if (typeof localStorage !== "undefined" && !storedId) {
  //     localStorage.setItem("visitorId", newId);
  //   }
  //   return newId;
  // });

  useEffect(() => {
    // trackVisitor();
    // loadCanvas();
  }, []);

  // Add keyboard event handler for delete/backspace key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent default behavior for these keys to avoid page navigation
      if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault();
        undo();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        undo();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        redo();
      } else if (event.key === 'Escape') {
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

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentStep, history]); // Dependencies for the effect

  const clearCanvas = () => {
    const emptyGrid = createInitialGrid();
    setGrid(emptyGrid);
    
    // Add to history
    const newHistory = history.slice(0, currentStep + 1);
    newHistory.push(emptyGrid.map((row) => [...row]));
    setHistory(newHistory);
    setCurrentStep(currentStep + 1);
    
    // Sync with backend
    // syncBackendWithCurrentState();
  };

  const colorPixel = (row: number, col: number) => {
    if (!hasSelectedColor && !isRubber) return;
    if (isRubber && grid[row][col] === "#171717") return; // Don't erase already canvas-colored pixels

    // Create new grid with the change
    const newGrid = grid.map((row) => [...row]);
    newGrid[row][col] = isRubber ? "#171717" : currentColor;
    setGrid(newGrid);

    // Update history
    const newHistory = history.slice(0, currentStep + 1);
    newHistory.push(newGrid.map((row) => [...row])); // Deep copy the new grid
    setHistory(newHistory);
    setCurrentStep(currentStep + 1);

    // Backend save
    // const pixelColor = isRubber ? "#171717" : currentColor;
    // const mutation = `mutation {
    //   addPixel(x: ${col}, y: ${row}, color: "${pixelColor}", visitorId: "${visitorId}") {
    //     x
    //     y
    //     color
    //   }
    // }`;

    // fetch('/api/graphql', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ query: mutation }),
    // }).catch(error => console.error('Error saving pixel:', error));
  };

  const syncBackendWithCurrentState = async () => {
    // if (!visitorId) return;
    
    // try {
    //     await fetch('/api/graphql', {
    //         method: 'POST',
    //         headers: { 'Content-Type': 'application/json' },
    //         body: JSON.stringify({
    //             query: `mutation { clearCanvas(visitorId: "${visitorId}") }`
    //         }),
    //     });

    //     const pixelPromises: Promise<Response>[] = [];
        
    //     for (let y = 0; y < grid.length; y++) {
    //         for (let x = 0; x < grid[y].length; x++) {
    //             if (grid[y][x] !== '#171717') {
    //                 const mutation = `mutation {
    //                     addPixel(x: ${x}, y: ${y}, color: "${grid[y][x]}", visitorId: "${visitorId}") {
    //                         x
    //                         y
    //                         color
    //                     }
    //                 }`;
    //                 
    //                 pixelPromises.push(
    //                     fetch("/api/graphql", {
    //                         method: "POST",
    //                         headers: { "Content-Type": "application/json" },
    //                         body: JSON.stringify({ query: mutation }),
    //                     })
    //                 );
    //             }
    //         }
    //     }
        
    //     await Promise.all(pixelPromises);
    // } catch (error) {
    //     console.error("Error syncing canvas:", error);
    //     throw error;
    // }
  };

  const publishCanvas = async () => {
    try {
        // Check if canvas is empty
        const hasPixels = grid.some(row => row.some(cell => cell !== '#171717'));
        
        if (!hasPixels) {
            alert('Please draw something before saving the canvas!');
            return;
        }
        
        setIsSaving(true);
        
        // Make sure backend is in sync with current state before publishing
        // await syncBackendWithCurrentState();
        
        // Save canvas to hall of fame
        // const mutation = `mutation {
        //     saveCanvas(visitorId: "${visitorId}", isCollaborative: true)
        // }`;
        
        // const response = await fetch("/api/graphql", {
        //     method: "POST",
        //     headers: { "Content-Type": "application/json" },
        //     body: JSON.stringify({ query: mutation }),
        // });
        
        // const result = await response.json();
        
        // if (result.data && result.data.saveCanvas) {
        //     alert('Canvas published successfully!');
        // } else {
        //     throw new Error('Failed to publish canvas');
        // }
        
        // Simple alert for now since backend is disabled
        alert('Canvas saved locally! (Backend disabled for simplicity)');
    } catch (error) {
        console.error("Error publishing canvas:", error);
        alert('Failed to publish. Please try again.');
    } finally {
        setIsSaving(false);
    }
  };

  const loadCanvas = async () => {
    try {
      const response = await fetch("/api/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            query {
              activeCanvas {
                id
                pixels {
                  x
                  y
                  color
                }
                visitorCount
              }
            }
          `,
        }),
      });

      const { data } = await response.json();
      if (data?.activeCanvas) {
        // Create fresh grid
        const newGrid = createInitialGrid();

        // Apply pixels from current canvas
        data.activeCanvas.pixels.forEach((pixel: any) => {
          if (pixel.y < GRID_SIZE && pixel.x < GRID_SIZE) {
            newGrid[pixel.y][pixel.x] = pixel.color;
          }
        });
        setGrid(newGrid);
        // setVisitorCount(data.activeCanvas.visitorCount);

        // Reset history when loading new canvas
        setHistory([newGrid]);
        setCurrentStep(0);
      }
    } catch (error) {
      console.error("Error loading canvas:", error);
    }
  };

  const trackVisitor = async () => {
    // try {
    //   const response = await fetch("/api/graphql", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({
    //       query: `
    //         mutation {
    //           trackVisitor(visitorId: "${visitorId}") {
    //             visitorCount
    //           }
    //         }
    //       `,
    //     }),
    //   });
    //   const { data } = await response.json();
    //   if (data?.trackVisitor?.visitorCount) {
    //     setVisitorCount(data.trackVisitor.visitorCount);
    //   }
    //   return data?.trackVisitor;
    // } catch (error) {
    //   console.error("Error tracking visitor:", error);
    //   return false;
    // }
  };

  const commitStroke = () => {
    if (currentStroke.length > 0) {
      const newHistory = history.slice(0, currentStep + 1);
      newHistory.push(grid.map((row) => [...row]));
      setHistory(newHistory);
      setCurrentStep((prev) => prev + 1);
      setCurrentStroke([]);
    }
    setIsDrawing(false);
  };

  const toggleDrawingMode = () => {
    if (isDrawingMode) {
      // Stop drawing mode
      setIsDrawingMode(false);
      setIsDrawing(false);
      commitStroke();
    } else {
      // Start drawing mode
      setIsDrawingMode(true);
      setIsDrawing(true);
    }
  };

  const undo = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      setGrid(history[prevStep].map((row) => [...row]));
      
      // Sync backend with current state after undo
      // syncBackendWithCurrentState();
    }
  };

  const redo = () => {
    if (currentStep < history.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setGrid(history[nextStep].map((row) => [...row]));
      
      // Sync backend with current state after redo
      // syncBackendWithCurrentState();
    }
  };

  const downloadCanvas = () => {
    // Check if canvas is empty
    const hasPixels = grid.some(row => row.some(cell => cell !== '#171717'));
    
    if (!hasPixels) {
      alert('Please draw something before downloading the canvas!');
      return;
    }

    // Create a canvas element to draw the grid
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      alert('Failed to create canvas context');
      return;
    }

    // Set canvas size (23x23 grid with 20px pixels = 460x460)
    const pixelSize = 20;
    const gridSize = 23;
    canvas.width = gridSize * pixelSize;
    canvas.height = gridSize * pixelSize;

    // Draw each pixel
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const color = grid[row][col];
        ctx.fillStyle = color;
        ctx.fillRect(col * pixelSize, row * pixelSize, pixelSize, pixelSize);
      }
    }

    // Convert to blob and download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `keyboard-canvas-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert('Failed to create image');
      }
    }, 'image/png');
  };

  return (
    <div className="w-full max-w-[555px] mx-auto">
      <h1 className="font-semibold mb-6 text-white">Keyboard Canvas</h1>

      <div className="text-gray-300 mb-4">
        {/* {visitorCount}/{MAX_VISITORS} artists have joined this canvas */}
      </div>

      {/* <div className="mb-4 text-gray-900">
        Welcome to the drawing canvas! Use the color palette and tools to create your artwork. 
        You can use keyboard shortcuts for quick access to tools and colors. 
        Ready to start drawing?
      </div> */}

      <div
        className="w-full flex flex-col items-start gap-4"
      >
        {/* Grid and Color Palette Container */}
        <div className="relative">
          {/* Image - Absolutely positioned to the left */}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-full pr-16">
            <img 
              src="/Group 7.png" 
              alt="Note paper" 
              className="w-[352px] h-auto opacity-90"
            />
          </div>

          <div className="flex flex-col gap-4">
            {/* Color Palette and Publish Button - Same line */}
            <div className="flex justify-between items-center">
              {/* Color Palette - Left side */}
              <div className="flex gap-2">
                {COLORS.map((color) => (
                  <div
                    key={color}
                    className={`w-6 h-6 cursor-pointer border border-[#262626] rounded relative ${
                      currentColor === color && hasSelectedColor && !isRubber ? "after:content-[''] after:absolute after:top-full after:left-0.5 after:right-0.5 after:h-0.5 after:bg-white after:mt-1" : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setCurrentColor(color);
                      setHasSelectedColor(true);
                      setIsRubber(false);
                    }}
                  />
                ))}
                <input
                  type="color"
                  value={currentColor}
                  onChange={(e) => {
                    setCurrentColor(e.target.value);
                    setHasSelectedColor(true);
                    setIsRubber(false);
                  }}
                  className="w-6 h-6 cursor-pointer"
                  style={{
                    paddingLeft: "2px",
                    paddingRight: "2px",
                    borderRadius: "0.25rem",
                    background: "#374151",
                    WebkitAppearance: "none",
                    MozAppearance: "none",
                    appearance: "none",
                  }}
                />
                {/* Rubber/Eraser Tool */}
                <div
                  className={`w-6 h-6 cursor-pointer flex items-center justify-center rounded ${
                    isRubber ? "border border-white" : ""
                  }`}
                  onClick={() => {
                    setIsRubber(true);
                    setHasSelectedColor(false);
                  }}
                  title="Eraser (0)"
                >
                  <img 
                    src="eraser.png" 
                    alt="Eraser" 
                    className="w-7 h-7 object-contain"
                  />
                </div>
              </div>

              {/* Download Button - Right side */}
              <button
                onClick={downloadCanvas}
                className="px-2 py-1 hover:bg-[#171717] text-white rounded-md transition-colors disabled:opacity-50 text-[12px] border border-gray-500"
                disabled={isSaving}
              >
                Download
              </button>
            </div>

            {/* Grid */}
            <div className="border-none">
              {grid.map((row, rowIndex) => (
                <div key={rowIndex} className="flex">
                  {row.map((color, colIndex) => (
                    <div
                      key={colIndex}
                      className="w-5 h-5 cursor-pointer  rounded m-[2px]"
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        if (isDrawingMode) {
                          // If in drawing mode, this click stops drawing
                          toggleDrawingMode();
                        } else {
                          // If not in drawing mode, this click starts drawing and colors the pixel
                          toggleDrawingMode();
                          colorPixel(rowIndex, colIndex);
                        }
                      }}
                      onMouseEnter={(e) => {
                        e.preventDefault();
                        if (isDrawingMode && isDrawing) {
                          colorPixel(rowIndex, colIndex);
                        }
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Infinite Ticker Gallery - Full webpage height, positioned outside canvas container */}
      <div className="fixed right-32 top-0 bottom-0 w-[250px] overflow-hidden pointer-events-none">
        <div className="animate-scroll h-full">
          <div className="space-y-12 py-4 px-4">
            {/* Pixel Art Images - alternating between the two images */}
            <img src="/pixel-art-1.png" alt="Pixel Art 1" className="w-full h-auto object-cover rounded-lg opacity-80" />
            <img src="/pixel-art-2.png" alt="Pixel Art 2" className="w-full h-auto object-cover rounded-lg opacity-80" />
            <img src="/pixel-art-3.png" alt="Pixel Art 1" className="w-full h-auto object-cover rounded-lg opacity-80" />
            <img src="/pixel-art-4.png" alt="Pixel Art 2" className="w-full h-auto object-cover rounded-lg opacity-80" />
            <img src="/pixel-art-1.png" alt="Pixel Art 1" className="w-full h-auto object-cover rounded-lg opacity-80" />
            <img src="/pixel-art-2.png" alt="Pixel Art 2" className="w-full h-auto object-cover rounded-lg opacity-80" />
            <img src="/pixel-art-3.png" alt="Pixel Art 1" className="w-full h-auto object-cover rounded-lg opacity-80" />
            <img src="/pixel-art-4.png" alt="Pixel Art 2" className="w-full h-auto object-cover rounded-lg opacity-80" />
 
          </div>
        </div>
      </div>
    </div>
  );
}