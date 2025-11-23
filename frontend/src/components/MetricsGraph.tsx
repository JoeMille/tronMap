import { useEffect, useRef } from "react";

interface FrameMetrics {
  frame: number;
  overall_i_over_sigma?: number;
  overall_completeness?: number;
}

interface MetricsGraphProps {
  data: FrameMetrics[];
  currentFrame: number;
  metric: "overall_i_over_sigma" | "overall_completeness";
  label: string;
  color: string;
  threshold?: number;
}

export default function MetricsGraph({
  data,
  currentFrame,
  metric,
  label,
  color,
  threshold,
}: MetricsGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    const values = data.map((d) => d[metric] || 0);
    const maxValue = Math.max(...values, threshold || 0) * 1.1;
    const minValue = Math.min(...values) * 0.9;

    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (plotHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      const value = maxValue - ((maxValue - minValue) / 5) * i;
      ctx.fillStyle = "#666";
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      ctx.fillText(value.toFixed(1), padding.left - 5, y + 3);
    }

    if (threshold) {
      const thresholdY =
        padding.top +
        plotHeight -
        ((threshold - minValue) / (maxValue - minValue)) * plotHeight;
      ctx.strokeStyle = "#ff6b6b";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(padding.left, thresholdY);
      ctx.lineTo(width - padding.right, thresholdY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#ff6b6b";
      ctx.font = "9px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`threshold: ${threshold}`, padding.left + 5, thresholdY - 5);
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((point, index) => {
      const x = padding.left + (index / (data.length - 1 || 1)) * plotWidth;
      const value = point[metric] || 0;
      const y =
        padding.top +
        plotHeight -
        ((value - minValue) / (maxValue - minValue)) * plotHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    const currentIndex = currentFrame - 1;
    if (currentIndex >= 0 && currentIndex < data.length) {
      const x =
        padding.left + (currentIndex / (data.length - 1 || 1)) * plotWidth;
      const value = data[currentIndex][metric] || 0;
      const y =
        padding.top +
        plotHeight -
        ((value - minValue) / (maxValue - minValue)) * plotHeight;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    }

    ctx.fillStyle = "#fff";
    ctx.font = "bold 11px Arial";
    ctx.textAlign = "center";
    ctx.fillText(label, width / 2, height - 5);

    ctx.fillStyle = "#888";
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    ctx.fillText("Frame", width / 2, height - 15);
  }, [data, currentFrame, metric, color, threshold, label]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={180}
      style={{
        width: "100%",
        height: "auto",
        maxHeight: "180px",
        marginTop: "1rem",
      }}
    />
  );
}
