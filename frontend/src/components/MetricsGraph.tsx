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
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 40, right: 30, bottom: 40, left: 60 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    const time = Date.now() * 0.001;
    const unit = metric === "overall_completeness" ? "%" : "";

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = `rgba(0, 217, 255, ${0.02 + Math.sin(time * 2) * 0.01})`;
    const scanlineY = (time * 50) % height;
    ctx.fillRect(0, scanlineY, width, 2);

    const values = data.map((d) => d[metric] || 0);
    const maxValue = Math.max(...values, threshold || 0) * 1.1;
    const minValue = Math.min(...values, 0) * 0.9;

    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (plotHeight / 5) * i;
      const fadeAmount = 1 - (i / 5) * 0.5;

      ctx.shadowColor = "#00d9ff";
      ctx.shadowBlur = 5;
      ctx.strokeStyle = `rgba(0, 217, 255, ${0.15 * fadeAmount})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      ctx.shadowBlur = 0;

      const value = maxValue - ((maxValue - minValue) / 5) * i;
      ctx.shadowColor = "#00d9ff";
      ctx.shadowBlur = 8;
      ctx.fillStyle = "#00d9ff";
      ctx.font = "bold 12px 'Courier New'";
      ctx.textAlign = "right";
      ctx.fillText(`${value.toFixed(1)}${unit}`, padding.left - 10, y + 4);
      ctx.shadowBlur = 0;
    }

    for (let i = 0; i <= 10; i++) {
      const x = padding.left + (plotWidth / 10) * i;
      ctx.strokeStyle = `rgba(255, 255, 255, 0.05)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, height - padding.bottom);
      ctx.stroke();

      if (i % 2 === 0) {
        const frameNum = Math.floor((data.length / 10) * i) + 1;
        ctx.fillStyle = "#666";
        ctx.font = "11px 'Courier New'";
        ctx.textAlign = "center";
        ctx.fillText(frameNum.toString(), x, height - padding.bottom + 20);
      }
    }

    if (threshold) {
      const thresholdY =
        padding.top +
        plotHeight -
        ((threshold - minValue) / (maxValue - minValue)) * plotHeight;

      const pulseIntensity = 0.5 + Math.sin(time * 3) * 0.3;
      ctx.shadowColor = "#ff3333";
      ctx.shadowBlur = 15 * pulseIntensity;
      ctx.strokeStyle = `rgba(255, 51, 51, ${0.7 + pulseIntensity * 0.3})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(padding.left, thresholdY);
      ctx.lineTo(width - padding.right, thresholdY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;

      ctx.shadowColor = "#ff3333";
      ctx.shadowBlur = 10;
      ctx.fillStyle = "rgba(255, 51, 51, 0.2)";
      ctx.fillRect(padding.left + 5, thresholdY - 20, 130, 16);
      ctx.fillStyle = "#ff3333";
      ctx.font = "bold 11px 'Courier New'";
      ctx.textAlign = "left";
      ctx.fillText(
        `THRESHOLD: ${threshold}${unit}`,
        padding.left + 10,
        thresholdY - 8
      );
      ctx.shadowBlur = 0;
    }

    const gradient = ctx.createLinearGradient(
      0,
      padding.top,
      0,
      height - padding.bottom
    );
    gradient.addColorStop(0, `${color}40`);
    gradient.addColorStop(1, `${color}00`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(padding.left, height - padding.bottom);

    data.forEach((point, index) => {
      const x = padding.left + (index / (data.length - 1 || 1)) * plotWidth;
      const value = point[metric] || 0;
      const y =
        padding.top +
        plotHeight -
        ((value - minValue) / (maxValue - minValue)) * plotHeight;
      ctx.lineTo(x, y);
    });

    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.closePath();
    ctx.fill();

    const lineGradient = ctx.createLinearGradient(
      padding.left,
      0,
      width - padding.right,
      0
    );
    lineGradient.addColorStop(0, color);
    lineGradient.addColorStop(0.5, "#ffffff");
    lineGradient.addColorStop(1, color);

    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
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

    ctx.shadowBlur = 5;
    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;

    data.forEach((point, index) => {
      const x = padding.left + (index / (data.length - 1 || 1)) * plotWidth;
      const value = point[metric] || 0;
      const y =
        padding.top +
        plotHeight -
        ((value - minValue) / (maxValue - minValue)) * plotHeight;

      if (index % 10 === 0) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = `${color}40`;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    const currentIndex = currentFrame - 1;
    if (currentIndex >= 0 && currentIndex < data.length) {
      const x =
        padding.left + (currentIndex / (data.length - 1 || 1)) * plotWidth;
      const value = data[currentIndex][metric] || 0;
      const y =
        padding.top +
        plotHeight -
        ((value - minValue) / (maxValue - minValue)) * plotHeight;

      const pulseSize = 8 + Math.sin(time * 5) * 2;
      ctx.shadowColor = color;
      ctx.shadowBlur = 20;
      ctx.strokeStyle = `${color}80`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, pulseSize, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.shadowBlur = 15;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
      ctx.shadowBlur = 0;

      const boxWidth = 80;
      const boxHeight = 30;
      const boxX = x > width / 2 ? x - boxWidth - 15 : x + 15;
      const boxY = y - 15;

      ctx.shadowColor = "#000";
      ctx.shadowBlur = 10;
      ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
      ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
      ctx.shadowBlur = 0;

      ctx.fillStyle = color;
      ctx.font = "bold 14px 'Courier New'";
      ctx.textAlign = "center";
      ctx.fillText(
        `${value.toFixed(1)}${unit}`,
        boxX + boxWidth / 2,
        boxY + boxHeight / 2 + 5
      );
    }

    const titleGradient = ctx.createLinearGradient(0, 15, 0, 35);
    titleGradient.addColorStop(0, "#00d9ff");
    titleGradient.addColorStop(0.5, "#ffffff");
    titleGradient.addColorStop(1, "#00d9ff");

    ctx.shadowColor = "#00d9ff";
    ctx.shadowBlur = 15;
    ctx.fillStyle = titleGradient;
    ctx.font = "bold 18px 'Courier New'";
    ctx.textAlign = "center";
    ctx.fillText(label, width / 2, 25);
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#666";
    ctx.font = "11px 'Courier New'";
    ctx.textAlign = "center";
    ctx.fillText("FRAME NUMBER", width / 2, height - 5);

    animationFrameRef.current = requestAnimationFrame(() => {
      if (canvas && ctx) {
        const event = new Event("render");
        canvas.dispatchEvent(event);
      }
    });
  }, [data, currentFrame, metric, color, threshold, label]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={180}
      style={{
        width: "100%",
        height: "auto",
        maxHeight: "270px",
        marginTop: "1rem",
      }}
    />
  );
}
