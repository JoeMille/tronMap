import { useEffect, useState, useRef } from "react";
import "./DiffractionViewer.css";

interface DiffractionViewerProps {
  imageUrl: string;
  frameNumber: number;
  totalFrames: number;
}

export default function DiffractionViewer({
  imageUrl,
  frameNumber,
  totalFrames,
}: DiffractionViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [imageUrl]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001; // Fixed: was 'deltay'
    const newZoom = Math.min(5, Math.max(0.5, zoom + delta));

    setZoom(newZoom);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - pan.x,
      y: e.clientY - pan.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const imageStyle = {
    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
    cursor: isDragging ? "grabbing" : "grab",
  };

  return (
    <div className="diffraction-viewer">
      <div className="viewer-controls">
        <button onClick={() => setZoom(Math.min(5, zoom + 0.5))}>
          🔍 Zoom In
        </button>
        <button onClick={() => setZoom(Math.max(0.5, zoom - 0.5))}>
          🔍 Zoom Out
        </button>
        <button onClick={handleReset}>↺ Reset View</button>
        <span className="zoom-indicator">{Math.round(zoom * 100)}%</span>
      </div>

      <div
        ref={containerRef}
        className="viewer-container"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt={`Diffraction pattern frame ${frameNumber}`}
          style={imageStyle}
          className="diffraction-image-zoomable"
          draggable={false}
        />

        <div className="frame-overlay">
          Frame {frameNumber} / {totalFrames}
        </div>
      </div>
    </div>
  );
}
