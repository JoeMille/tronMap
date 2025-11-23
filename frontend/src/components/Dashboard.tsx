import { useState, useEffect, useRef } from "react";
import Header from "./Header";
import Footer from "./Footer";
import DiffractionViewer from "./DiffractionViewer";
import "./Header.css";
import "./Footer.css";
import "./Dashboard.css";

interface ResolutionShell {
  resolution: number;
  i_over_sigma: number;
  completeness: number;
  n_reflections: number;
}

interface FrameMetrics {
  frame: number;
  resolution_shells: ResolutionShell[];
  overall_i_over_sigma: number;
  overall_completeness: number;
}

interface MetricsData {
  dataset: string;
  total_frames: number;
  frames: FrameMetrics[];
  overall_statistics: {
    resolution: number;
    space_group: string;
    unit_cell: string;
    completeness: number;
    i_over_sigma: number;
    r_merge: number;
    cc_half: number;
    mosaicity: number;
  };
}

export default function Dashboard() {
  const [currentFrame, setCurrentFrame] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null);
  const datasetPath = "/static/data/lysozyme_good";
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch(`${datasetPath}/metrics.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setMetricsData(data))
      .catch((err) => console.error("Failed to load metrics:", err));
  }, []);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isPlaying && metricsData) {
      intervalRef.current = setInterval(() => {
        setCurrentFrame((prev) => {
          if (prev >= metricsData.total_frames) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 100);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, metricsData]);

  const frameUrl = `${datasetPath}/frame_${String(currentFrame).padStart(
    4,
    "0"
  )}.png`;
  const status = isPlaying ? "running" : "paused";
  const currentFrameMetrics = metricsData?.frames[currentFrame - 1];
  const historicalData = metricsData?.frames.slice(0, currentFrame) || [];

  return (
    <div className="dashboard-container">
      <Header status={status} datasetName="Lysozyme Crystal - Good Dataset" />

      <main className="dashboard-main">
        <div className="canvas-grid">
          <div className="canvas-panel canvas-large">
            <div className="panel-header">
              <h3>Live Diffraction Pattern</h3>
            </div>

            <div className="canvas-content">
              <DiffractionViewer
                imageUrl={frameUrl}
                frameNumber={currentFrame}
                totalFrames={metricsData?.total_frames || 360}
                onFrameChange={setCurrentFrame}
                isPlaying={isPlaying}
                resolutionShells={currentFrameMetrics?.resolution_shells}
                overallResolution={metricsData?.overall_statistics.resolution}
              />
            </div>

            <div className="canvas-controls">
              <input
                type="range"
                min="1"
                max={metricsData?.total_frames || 360}
                value={currentFrame}
                onChange={(e) => setCurrentFrame(Number(e.target.value))}
                className="frame-slider"
              />
              <div className="button-group">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="btn-primary"
                >
                  {isPlaying ? "⏸ PAUSE" : "▶ PLAY"}
                </button>
                <button
                  onClick={() => setCurrentFrame(1)}
                  className="btn-secondary"
                >
                  ⏮ RESET
                </button>
              </div>
            </div>
          </div>

          <div className="canvas-panel canvas-analytics">
            <div className="panel-header">
              <h3>Real-Time Analytics</h3>
            </div>
            <div className="analytics-container">
              <div className="graphs-section">
                <TechnicalGraph
                  data={historicalData}
                  currentFrame={currentFrame}
                  metric="overall_i_over_sigma"
                  label="I/σ(I)"
                  color="#00d9ff"
                  threshold={15}
                  unit=""
                />
                <TechnicalGraph
                  data={historicalData}
                  currentFrame={currentFrame}
                  metric="overall_completeness"
                  label="Completeness"
                  color="#00ff88"
                  threshold={95}
                  unit="%"
                />
              </div>

              <div className="data-output-section">
                <DataOutput
                  currentFrame={currentFrame}
                  metrics={currentFrameMetrics}
                  overallStats={metricsData?.overall_statistics}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function TechnicalGraph({
  data,
  currentFrame,
  metric,
  label,
  color,
  threshold,
  unit,
}: {
  data: FrameMetrics[];
  currentFrame: number;
  metric: "overall_i_over_sigma" | "overall_completeness";
  label: string;
  color: string;
  threshold: number;
  unit: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);

    const values = data.map((d) => d[metric] || 0);
    const maxValue = Math.max(...values, threshold) * 1.1;
    const minValue = Math.min(...values, 0) * 0.9;

    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (plotHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      const value = maxValue - ((maxValue - minValue) / 5) * i;
      ctx.fillStyle = "#00d9ff";
      ctx.font = "12px 'Courier New'";
      ctx.textAlign = "right";
      ctx.fillText(`${value.toFixed(1)}${unit}`, padding.left - 10, y + 4);
    }

    for (let i = 0; i <= 10; i++) {
      const x = padding.left + (plotWidth / 10) * i;
      ctx.strokeStyle = "#222";
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
      ctx.strokeStyle = "#ff3333";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(padding.left, thresholdY);
      ctx.lineTo(width - padding.right, thresholdY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#ff3333";
      ctx.font = "bold 11px 'Courier New'";
      ctx.textAlign = "left";
      ctx.fillText(
        `THRESHOLD: ${threshold}${unit}`,
        padding.left + 10,
        thresholdY - 8
      );
    }

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
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fill();

      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.fillStyle = "#00d9ff";
    ctx.font = "bold 16px 'Courier New'";
    ctx.textAlign = "center";
    ctx.fillText(label, width / 2, 25);

    ctx.fillStyle = "#666";
    ctx.font = "11px 'Courier New'";
    ctx.textAlign = "center";
    ctx.fillText("FRAME NUMBER", width / 2, height - 5);
  }, [data, currentFrame, metric, color, threshold, label, unit]);

  return <canvas ref={canvasRef} className="technical-graph" />;
}

function DataOutput({
  currentFrame,
  metrics,
  overallStats,
}: {
  currentFrame: number;
  metrics?: FrameMetrics;
  overallStats?: MetricsData["overall_statistics"];
}) {
  return (
    <div className="data-terminal">
      <div className="terminal-header">RAW DATA OUTPUT</div>
      <div className="terminal-content">
        <div className="data-line">
          <span className="data-label">FRAME:</span>
          <span className="data-value">
            {currentFrame.toString().padStart(4, "0")}
          </span>
        </div>

        {metrics && (
          <>
            <div className="data-line">
              <span className="data-label">I/σ(I):</span>
              <span className="data-value highlight-cyan">
                {metrics.overall_i_over_sigma.toFixed(2)}
              </span>
            </div>

            <div className="data-line">
              <span className="data-label">COMPLETENESS:</span>
              <span className="data-value highlight-green">
                {metrics.overall_completeness.toFixed(1)}%
              </span>
            </div>

            <div className="data-section-title">RESOLUTION SHELLS</div>
            {metrics.resolution_shells.slice(0, 4).map((shell) => (
              <div key={shell.resolution} className="data-line shell-data">
                <span className="data-label">{shell.resolution}Å:</span>
                <span className="data-value">
                  I/σ={shell.i_over_sigma.toFixed(1)} |{" "}
                  {shell.completeness.toFixed(0)}%
                </span>
              </div>
            ))}
          </>
        )}

        {overallStats && (
          <>
            <div className="data-section-title">OVERALL STATISTICS</div>
            <div className="data-line">
              <span className="data-label">RESOLUTION:</span>
              <span className="data-value">{overallStats.resolution}Å</span>
            </div>
            <div className="data-line">
              <span className="data-label">SPACE GROUP:</span>
              <span className="data-value">{overallStats.space_group}</span>
            </div>
            <div className="data-line">
              <span className="data-label">R-MERGE:</span>
              <span className="data-value">
                {overallStats.r_merge.toFixed(3)}
              </span>
            </div>
            <div className="data-line">
              <span className="data-label">CC½:</span>
              <span className="data-value">
                {overallStats.cc_half.toFixed(3)}
              </span>
            </div>
            <div className="data-line">
              <span className="data-label">MOSAICITY:</span>
              <span className="data-value">
                {overallStats.mosaicity.toFixed(2)}°
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
