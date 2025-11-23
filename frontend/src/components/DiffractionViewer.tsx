import { useEffect, useState, useRef } from "react";
import ResolutionRings from "./ResolutionRings";
import "./DiffractionViewer.css";

interface ResolutionShell {
  resolution: number;
  i_over_sigma: number;
  completeness: number;
  n_reflections: number;
}

interface DiffractionViewerProps {
  imageUrl: string;
  frameNumber: number;
  totalFrames: number;
  onFrameChange?: (frame: number) => void;
  isPlaying: boolean;
  resolutionShells?: ResolutionShell[];
  overallResolution?: number;
}

export default function DiffractionViewer({
  imageUrl,
  frameNumber,
  totalFrames,
  onFrameChange,
  isPlaying,
  resolutionShells,
  overallResolution,
}: DiffractionViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showRings, setShowRings] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [imageUrl]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.0003;
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

  const handlePrevFrame = () => {
    if (frameNumber > 1 && onFrameChange) {
      onFrameChange(frameNumber - 1);
    }
  };

  const handleNextFrame = () => {
    if (frameNumber < totalFrames && onFrameChange) {
      onFrameChange(frameNumber + 1);
    }
  };

  const imageStyle = {
    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
    cursor: isDragging ? "grabbing" : "grab",
  };

  return (
    <div className="diffraction-viewer">
      <div className="viewer-controls">
        <button
          onClick={handlePrevFrame}
          disabled={frameNumber <= 1}
          style={{ opacity: frameNumber <= 1 ? 0.5 : 1 }}
        >
          ⏮ Prev
        </button>
        <button
          onClick={handleNextFrame}
          disabled={frameNumber >= totalFrames}
          style={{ opacity: frameNumber >= totalFrames ? 0.5 : 1 }}
        >
          Next ⏭
        </button>

        <div
          style={{ width: "1px", background: "#333", margin: "0 0.5rem" }}
        ></div>

        <button onClick={() => setZoom(Math.min(5, zoom + 0.2))}>🔍 +</button>
        <button onClick={() => setZoom(Math.max(0.5, zoom - 0.2))}>🔍 −</button>
        <button onClick={handleReset}>↺ Reset</button>

        <div
          style={{ width: "1px", background: "#333", margin: "0 0.5rem" }}
        ></div>

        <button onClick={() => setShowRings(!showRings)}>
          {showRings ? "🔴 Hide Rings" : "⭕ Show Rings"}
        </button>

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

        {showRings && (
          <ResolutionRings
            imageSize={2048}
            zoom={zoom}
            pan={pan}
            isPlaying={isPlaying}
            resolutionShells={resolutionShells}
            overallResolution={overallResolution}
          />
        )}

        <div className="frame-overlay">
          Frame {frameNumber} / {totalFrames}
        </div>
      </div>
    </div>
  );
}
