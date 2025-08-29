"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface Pixel {
  x: number;
  y: number;
  color: string;
}

interface Canvas {
  id: string;
  pixels: Pixel[];
  visitorCount: number;
  createdAt: string;
}

export default function HallOfFamePage() {
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCanvases();
  }, []);

  const loadCanvases = async () => {
    try {
      const response = await fetch("/api/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            query {
              canvases {
                id
                pixels {
                  x
                  y
                  color
                }
                visitorCount
                createdAt
              }
            }
          `,
        }),
      });

      const { data } = await response.json();
      if (data?.canvases) {
        setCanvases(data.canvases.reverse()); // Show newest first
      }
    } catch (error) {
      console.error("Error loading canvases:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderCanvas = (canvas: Canvas) => {
    const GRID_SIZE = 23;
    const grid = Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill("#FFFFFF"));

    // Apply pixels to grid
    canvas.pixels.forEach((pixel) => {
      if (pixel.y < GRID_SIZE && pixel.x < GRID_SIZE) {
        grid[pixel.y][pixel.x] = pixel.color;
      }
    });

    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <div className="mb-3">
          <div className="text-sm text-gray-600">
            {canvas.visitorCount} artists • {new Date(canvas.createdAt).toLocaleDateString()}
          </div>
        </div>
        
        <div className="flex justify-center">
          <div className="inline-block">
            {grid.map((row, rowIndex) => (
              <div key={rowIndex} className="flex">
                {row.map((color, colIndex) => (
                  <div
                    key={colIndex}
                    className="w-3 h-3 border-[0.5px] border-gray-100 rounded-sm"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back to Canvas
          </Link>
        </div>
        <h1 className="font-semibold mb-6">Canvas Hall of Fame</h1>
        <div className="text-gray-600">Loading canvases...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Back to Canvas
        </Link>
      </div>

      <h1 className="font-semibold mb-6">Canvas Hall of Fame</h1>

      {canvases.length === 0 ? (
        <div className="text-gray-600">
          No completed canvases yet. Be the first to publish one!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {canvases.map((canvas) => (
            <div key={canvas.id}>
              {renderCanvas(canvas)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}