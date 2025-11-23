import { useEffect, useRef } from "react";

interface ResolutionShell {
  resolution: number;
  i_over_sigma: number;
  completeness: number;
  n_reflections: number;
}

interface ResolutionShellChartProps {
  shells: ResolutionShell[];
}

export default function ResolutionShellChart({
  shells,
}: ResolutionShellChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || shells.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, width, height);

    const maxIoSigma = Math.max(...shells.map((s) => s.i_over_sigma)) * 1.1;
    const barWidth = plotWidth / shells.length;

    shells.forEach((shell, index) => {
      const x = padding.left + index * barWidth;
      const barHeight = (shell.i_over_sigma / maxIoSigma) * plotHeight;
      const y = padding.top + plotHeight - barHeight;

      let color = "#ff6b6b";
      if (shell.i_over_sigma >= 10) color = "#00ff88";
      else if (shell.i_over_sigma >= 2) color = "#00d9ff";

      ctx.fillStyle = color;
      ctx.fillRect(x + 2, y, barWidth - 4, barHeight);

      ctx.fillStyle = "#fff";
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        `${shell.resolution}Å`,
        x + barWidth / 2,
        height - padding.bottom + 15
      );

      ctx.fillStyle = color;
      ctx.font = "bold 10px monospace";
      ctx.fillText(shell.i_over_sigma.toFixed(1), x + barWidth / 2, y - 5);
    });

    ctx.strokeStyle = "#ff6b6b";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    const thresholdY = padding.top + plotHeight - (2 / maxIoSigma) * plotHeight;
    ctx.beginPath();
    ctx.moveTo(padding.left, thresholdY);
    ctx.lineTo(width - padding.right, thresholdY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 11px Arial";
    ctx.textAlign = "center";
    ctx.fillText("I/σ(I) per Resolution Shell", width / 2, 15);
  }, [shells]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={200}
      style={{
        width: "100%",
        height: "auto",
        maxHeight: "200px",
        marginTop: "1rem",
      }}
    />
  );
}
