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

    canvas.width = imageSize;
    canvas.height = imageSize;

    let startTime = Date.now();

    const draw = (timestamp?: number) => {
      const elapsed = isPlaying ? (timestamp || Date.now()) - startTime : 0;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(pan.x / zoom, pan.y / zoom);

      const centerX = 0;
      const centerY = 0;

      resolutionShells.forEach((shell) => {
        const radius = getRadiusForResolution(shell.resolution);

        const isGoodData = shell.i_over_sigma >= 2;
        const isExcellent = shell.i_over_sigma >= 10;

        let color: string;
        let alpha: number;

        if (isExcellent) {
          color = "#00ff88";
          const pulse = isPlaying ? Math.sin(elapsed / 400) * 0.2 + 0.8 : 1;
          alpha = pulse;
        } else if (isGoodData) {
          color = "#00d9ff";
          alpha = 0.9;
        } else {
          color = "#ff6b6b";
          alpha = 0.7;
        }

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.globalAlpha = alpha;
        ctx.stroke();

        ctx.font = `bold 18px Arial`;
        ctx.fillStyle = color;
        ctx.globalAlpha = 1;
        ctx.textAlign = "center";
        ctx.fillText(`${shell.resolution}Å`, centerX, centerY - radius - 10);

        ctx.font = `14px Arial`;
        ctx.fillStyle = "#ffffff";
        ctx.fillText(
          `I/σ: ${shell.i_over_sigma.toFixed(1)}`,
          centerX,
          centerY - radius - 30
        );
      });

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

  return <canvas ref={canvasRef} className="resolution-rings-canvas" />;
}

function getRadiusForResolution(angstrom: number): number {
  const resolutionMap: { [key: number]: number } = {
    8.0: 120,
    4.0: 220,
    2.5: 360,
    2.0: 520,
    1.7: 680,
    1.5: 820,
  };
  return resolutionMap[angstrom] || 850 / angstrom;
}
