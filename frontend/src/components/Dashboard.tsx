import { useState, useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import "./Header.css";
import "./Footer.css";
import "./Dashboard.css";

interface Metrics {
  current_frame: number;
  total_frames: number;
  status: string;
  resolution: number;
  completeness: number;
  i_over_sigma: number;
  r_merge: number;
  cc_half: number;
  mosaicity: number;
  space_group: string;
}

export default function Dashboard() {
  const [currentFrame, setCurrentFrame] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const datasetPath = "/static/data/lysozyme_good";

  // load metrics
  useEffect(() => {
    fetch(`${datasetPath}/metrics.json`)
      .then((res) => res.json())
      .then((data) => setMetrics(data))
      .catch((err) => console.error("Failed to load metrics:", err));
  }, []);

  //auto-play
  useEffect(() => {
    if (!isPlaying || !metrics) return;

    const interval = setInterval(() => {
      setCurrentFrame((prev) => {
        if (prev >= metrics.total_frames) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, metrics]);

  const frameUrl = `${datasetPath}/frame_${String(currentFrame).padStart(
    4,
    "0"
  )}.png`;
  const status = isPlaying ? "running" : "paused";

  return (
    <div className="dashboard-container">
      <Header status={status} datasetName="Lysozyme Crystal - Good Dataset" />

      <main className="dashboard-main">
        <div className="canvas-grid">
          <div className="canvas-panel canvas-large">
            <div className="panel-header">
              <h3>Live Diffraction Pattern</h3>
              <span className="frame-info">
                Frame {currentFrame} / {metrics?.total_frames || 360}
              </span>
            </div>
            <div className="canvas-content">
              <img
                src={frameUrl}
                alt={`Frame ${currentFrame}`}
                className="diffraction-image"
              />
            </div>
            <div className="canvas-controls">
              <input
                type="range"
                min="1"
                max={metrics?.total_frames || 360}
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

          <div className="canvas-panel canvas-medium">
            <div className="panel-header">
              <h3>Resolution Rings</h3>
            </div>
            <div className="canvas-content canvas-placeholder">
              <div className="placeholder-text">Resolution Ring Overlay</div>
              <canvas id="resolution-canvas" width="400" height="400"></canvas>
            </div>
          </div>

          <div className="canvas-panel canvas-medium">
            <div className="panel-header">
              <h3>Quality Metrics</h3>
            </div>
            <div className="canvas-content metrics-grid">
              {metrics && (
                <>
                  <div
                    className={`metric-card ${
                      metrics.resolution < 1.8 ? "good" : "warning"
                    }`}
                  >
                    <div className="metric-label">Resolution</div>
                    <div className="metric-value">
                      {metrics.resolution.toFixed(2)} Å
                    </div>
                  </div>
                  <div
                    className={`metric-card ${
                      metrics.i_over_sigma > 15 ? "good" : "warning"
                    }`}
                  >
                    <div className="metric-label">I/σ(I)</div>
                    <div className="metric-value">
                      {metrics.i_over_sigma.toFixed(1)}
                    </div>
                  </div>
                  <div
                    className={`metric-card ${
                      metrics.completeness > 98 ? "good" : "warning"
                    }`}
                  >
                    <div className="metric-label">Completeness</div>
                    <div className="metric-value">
                      {metrics.completeness.toFixed(1)}%
                    </div>
                  </div>
                  <div
                    className={`metric-card ${
                      metrics.r_merge < 0.12 ? "good" : "warning"
                    }`}
                  >
                    <div className="metric-label">R-merge</div>
                    <div className="metric-value">
                      {metrics.r_merge.toFixed(3)}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="canvas-panel canvas-large">
            <div className="panel-header">
              <h3>3D Reciprocal Lattice</h3>
            </div>
            <div className="canvas-content canvas-placeholder">
              <div className="placeholder-text">Three.js 3D Viewer</div>
              <canvas id="lattice-canvas"></canvas>
            </div>
          </div>

          <div className="canvas-panel canvas-wide">
            <div className="panel-header">
              <h3>Resolution Shell Statistics</h3>
            </div>
            <div className="canvas-content canvas-placeholder">
              <div className="placeholder-text">Recharts Plot</div>
              <canvas id="shell-plot-canvas"></canvas>
            </div>
          </div>

          <div className="canvas-panel canvas-medium">
            <div className="panel-header">
              <h3>Wilson Plot</h3>
            </div>
            <div className="canvas-content canvas-placeholder">
              <div className="placeholder-text">Intensity vs Resolution²</div>
              <canvas id="wilson-canvas"></canvas>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
