import { useEffect, useRef } from "react";
import "./ResolutionRings.css";

interface ResolutionShell {
  resolution: number;
  i_over_sigma: number;
  completeness: number;
  n_reflections: number;
}

interface ResolutionRingsProps {
  imageSize: number;
  zoom: number;
  pan: { x: number; y: number };
  isPlaying: boolean;
  resolutionShells?: ResolutionShell[];
  overallResolution?: number;
}

const ICE_RINGS = [3.9, 3.7, 3.4];

export default function ResolutionRings({
  imageSize,
  zoom,
  pan,
  isPlaying,
  resolutionShells = [],
  overallResolution = 10,
}: ResolutionRingsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let startTime = Date.now();

    const draw = (timestamp?: number) => {
      const elapsed = isPlaying ? (timestamp || Date.now()) - startTime : 0;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      const centerX = 0;
      const centerY = 0;
      const K = 850;

      resolutionShells.forEach((shell, index) => {
        const radius = K / shell.resolution;

        const isReachable = shell.resolution >= overallResolution;
        const isGoodData = shell.i_over_sigma >= 2;
        const isExcellent = shell.i_over_sigma >= 10 && shell.completeness > 95;

        let color: string;
        let alpha: number;
        let lineWidth: number;
        let shouldFill = false;

        if (!isReachable) {
          color = "#444";
          alpha = 0.15;
          lineWidth = 1 / zoom;
        } else if (isExcellent) {
          const hue = 120 + index * 10;
          color = `hsl(${hue}, 100%, 50%)`;
          const pulse = isPlaying
            ? Math.sin(elapsed / 300 + index * 0.5) * 0.3 + 0.7
            : 0.9;
          alpha = pulse;
          lineWidth = 4 / zoom;
          shouldFill = true;
        } else if (isGoodData) {
          color = "#00d9ff";
          alpha = 0.7;
          lineWidth = 2.5 / zoom;
          shouldFill = true;
        } else {
          color = "#ff6b6b";
          alpha = 0.3;
          lineWidth = 1.5 / zoom;
        }

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.globalAlpha = alpha;
        ctx.stroke();

        if (shouldFill) {
          ctx.fillStyle = color;
          ctx.globalAlpha = isExcellent ? alpha * 0.2 : 0.08;
          ctx.fill();
        }

        ctx.font = `bold ${16 / zoom}px "Courier New", monospace`;
        ctx.fillStyle = color;
        ctx.globalAlpha = isReachable ? 1 : 0.3;
        ctx.textAlign = "center";
        ctx.fillText(
          `${shell.resolution}Å`,
          centerX,
          centerY - radius - 15 / zoom
        );

        if (isReachable) {
          ctx.font = `${10 / zoom}px "Courier New", monospace`;
          ctx.fillStyle = isGoodData ? "#00ff00" : "#ff6b6b";
          ctx.globalAlpha = 0.9;
          const status = isExcellent
            ? "★ EXCELLENT"
            : isGoodData
            ? "✓ GOOD"
            : "✗ WEAK";
          ctx.fillText(status, centerX, centerY - radius - 30 / zoom);

          ctx.font = `${9 / zoom}px "Courier New", monospace`;
          ctx.fillStyle = "#fff";
          ctx.globalAlpha = 0.7;
          ctx.fillText(
            `I/σ: ${shell.i_over_sigma.toFixed(1)}`,
            centerX,
            centerY - radius - 45 / zoom
          );
        }
      });

      ICE_RINGS.forEach((iceRes) => {
        const radius = K / iceRes;
        const pulse = isPlaying ? Math.sin(elapsed / 200) * 0.3 + 0.5 : 0.5;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = "#ff0000";
        ctx.lineWidth = 2 / zoom;
        ctx.globalAlpha = pulse * 0.6;
        ctx.setLineDash([10 / zoom, 5 / zoom]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = `${10 / zoom}px "Courier New", monospace`;
        ctx.fillStyle = "#ff0000";
        ctx.globalAlpha = 0.8;
        ctx.textAlign = "center";
        ctx.fillText("❄️ ICE", centerX + radius / 1.4, centerY - radius / 1.4);
      });

      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2 / zoom;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.moveTo(centerX - 30, centerY);
      ctx.lineTo(centerX + 30, centerY);
      ctx.moveTo(centerX, centerY - 30);
      ctx.lineTo(centerX, centerY + 30);
      ctx.stroke();

      ctx.restore();

      if (isPlaying) {
        animationRef.current = requestAnimationFrame(draw);
      }
    };

    draw();

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(draw);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [imageSize, zoom, pan, isPlaying, resolutionShells, overallResolution]);

  return (
    <canvas
      ref={canvasRef}
      className="resolution-rings-canvas"
      width={imageSize}
      height={imageSize}
    />
  );
}
