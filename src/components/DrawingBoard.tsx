import React, { useRef, useEffect, useState } from 'react';
import { Palette, Play, Square, RotateCcw, Trash2, Edit3, Eraser } from 'lucide-react';

interface DrawingBoardProps {
  initialData?: string; // base64 / dataUrl
  onChange: (dataUrl: string | undefined) => void;
  height?: number;
}

export default function DrawingBoard({ initialData, onChange, height = 300 }: DrawingBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#43403a');
  const [lineWidth, setLineWidth] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [hasContent, setHasContent] = useState(false);

  // Predefined gorgeous natural colors
  const colors = [
    { value: '#43403a', name: 'Głęboka ziemia' },
    { value: '#7d8461', name: 'Szałwiowa zieleń' },
    { value: '#5a5a40', name: 'Zgniła oliwka' },
    { value: '#9a9282', name: 'Ciepła glina' },
    { value: '#ae5c3e', name: 'Terakota' },
    { value: '#3a506b', name: 'Głęboka woda' },
    { value: '#caa14d', name: 'Ciepła ochra' },
  ];

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle resizing to parent width
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      // Save current content
      const tempImage = new Image();
      const currentData = canvas.toDataURL();
      
      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = height;

      // Set initial context values
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Restore content after resize
      tempImage.onload = () => {
        ctx.drawImage(tempImage, 0, 0);
      };
      tempImage.src = currentData;
    };

    resizeCanvas();

    // If initial drawing exists, draw it
    if (initialData) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        setHasContent(true);
        // Put in initial history
        setHistory([initialData]);
      };
      img.src = initialData;
    }

    // Set up resize observer to keep canvas responsive without stretching
    const observer = new ResizeObserver(() => {
      resizeCanvas();
    });
    if (canvas.parentElement) {
      observer.observe(canvas.parentElement);
    }

    return () => {
      observer.disconnect();
    };
  }, [height]);

  // Handle drawings
  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);

    // Dynamic stylus configuration
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = lineWidth * 3; // Wider eraser for usability
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
    }

    // Draw single dot on tap
    ctx.lineTo(x, y);
    ctx.stroke();

    setIsDrawing(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check if canvas has actually been drawn on
    const dataUrl = canvas.toDataURL();
    
    // Save to history
    setHistory((prev) => {
      const nextHistory = [...prev, dataUrl];
      // Limit history to 20 states to prevent memory leaks
      if (nextHistory.length > 20) {
        nextHistory.shift();
      }
      return nextHistory;
    });

    setHasContent(true);
    onChange(dataUrl);
  };

  // Undo action
  const handleUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const nextHistory = [...history];
    nextHistory.pop(); // Remove current state

    if (nextHistory.length === 0) {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHistory([]);
      setHasContent(false);
      onChange(undefined);
    } else {
      const previousState = nextHistory[nextHistory.length - 1];
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over'; // Temporarily resets global composite
        ctx.drawImage(img, 0, 0);
        onChange(previousState);
      };
      img.src = previousState;
      setHistory(nextHistory);
    }
  };

  // Clear canvas
  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHistory([]);
    setHasContent(false);
    onChange(undefined);
  };

  return (
    <div ref={containerRef} className="flex flex-col bg-natural-sand rounded-2xl border border-natural-border overflow-hidden shadow-sm">
      {/* Drawing Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-natural-cream border-b border-natural-border">
        
        {/* Draw / Erase Selection */}
        <div className="flex items-center gap-1.5 bg-natural-highlight p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setIsEraser(false)}
            className={`p-1.5 rounded-lg flex items-center gap-1 text-xs font-semibold transition ${
              !isEraser ? 'bg-natural-cream text-natural-dark border border-natural-border/60 shadow-xs' : 'text-natural-primary/70 hover:text-natural-dark'
            }`}
            title="Pióro/Rysik"
          >
            <Edit3 size={14} />
            <span className="hidden sm:inline">Pióro</span>
          </button>
          
          <button
            type="button"
            onClick={() => setIsEraser(true)}
            className={`p-1.5 rounded-lg flex items-center gap-1 text-xs font-semibold transition ${
              isEraser ? 'bg-natural-cream text-destructive border border-natural-border/60 shadow-xs' : 'text-natural-primary/70 hover:text-natural-dark'
            }`}
            title="Gumka"
          >
            <Eraser size={14} />
            <span className="hidden sm:inline">Gumka</span>
          </button>
        </div>

        {/* Thickness */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-natural-primary/70 hidden md:inline">Grubość:</span>
          <div className="flex items-center gap-1">
            {[2, 4, 8, 16].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setLineWidth(size)}
                className={`w-7 h-7 flex items-center justify-center rounded-lg border text-natural-primary transition ${
                  lineWidth === size
                    ? 'border-natural-olive bg-natural-olive text-white font-bold'
                    : 'border-natural-border bg-natural-cream hover:bg-natural-highlight text-xs'
                }`}
              >
                <span
                  className="rounded-full bg-current"
                  style={{ width: `${Math.max(2, size / 1.5)}px`, height: `${Math.max(2, size / 1.5)}px` }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length === 0}
            className="p-1.5 rounded-lg border border-natural-border bg-natural-cream text-natural-primary hover:bg-natural-highlight disabled:opacity-40 disabled:hover:bg-natural-cream transition"
            title="Cofnij ostatnie pociągnięcie (Undo)"
          >
            <RotateCcw size={15} />
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={!hasContent}
            className="p-1.5 rounded-lg border border-natural-border bg-natural-cream text-destructive hover:bg-destructive/5 disabled:opacity-40 disabled:hover:bg-natural-cream transition"
            title="Wyczyść szkicownik"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Colors List (hidden if eraser active) */}
      {!isEraser && (
        <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-natural-highlight/50 border-b border-natural-border/50 overflow-x-auto">
          <span className="text-xs font-medium text-natural-primary/70 mr-1 hidden sm:inline">Kolory:</span>
          <div className="flex items-center gap-1.5 py-0.5">
            {colors.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                className={`w-6 h-6 rounded-full border transition flex items-center justify-center relative ${
                  color === c.value
                    ? 'border-natural-dark scale-110 shadow-sm ring-1 ring-natural-clay'
                    : 'border-natural-border hover:scale-105'
                }`}
                style={{ backgroundColor: c.value }}
                title={c.name}
              >
                {color === c.value && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white block shadow-sm mix-blend-difference" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Canvas Drawing Stage with a high-fidelity visual grid book theme */}
      <div 
        className="relative bg-white touch-none cursor-crosshair select-none"
        style={{
          backgroundImage: 'radial-gradient(#e8e2d9 1.5px, transparent 1.5px)',
          backgroundSize: '20px 20px',
        }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
          className="block w-full"
          style={{ height: `${height}px` }}
        />
        {!hasContent && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-natural-primary/50 px-4 text-center">
            <Edit3 size={28} className="stroke-[1.5] mb-2 opacity-55 animate-pulse text-natural-secondary" />
            <p className="text-sm font-medium text-natural-dark">Szkicownik odręczny</p>
            <p className="text-xs opacity-75 mt-0.5">Rysuj rysikiem, palcem lub myszką bezpośrednio w tym polu</p>
          </div>
        )}
      </div>
    </div>
  );
}
