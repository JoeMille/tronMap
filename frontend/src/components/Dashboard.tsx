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
      }, 150); //ms playback!
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

          <div className="canvas-panel canvas-medium">
            <div className="panel-header">
              <h3>Quality Metrics</h3>
            </div>
            <div className="canvas-content metrics-grid">
              {currentFrameMetrics && metricsData && (
                <>
                  <div
                    className={`metric-card ${
                      metricsData.overall_statistics.resolution < 1.8
                        ? "good"
                        : "warning"
                    }`}
                  >
                    <div className="metric-label">Resolution</div>
                    <div className="metric-value">
                      {metricsData.overall_statistics.resolution.toFixed(2)} Å
                    </div>
                  </div>
                  <div
                    className={`metric-card ${
                      currentFrameMetrics.overall_i_over_sigma > 15
                        ? "good"
                        : "warning"
                    }`}
                  >
                    <div className="metric-label">I/σ(I)</div>
                    <div className="metric-value">
                      {currentFrameMetrics.overall_i_over_sigma.toFixed(1)}
                    </div>
                  </div>
                  <div
                    className={`metric-card ${
                      currentFrameMetrics.overall_completeness > 98
                        ? "good"
                        : "warning"
                    }`}
                  >
                    <div className="metric-label">Completeness</div>
                    <div className="metric-value">
                      {currentFrameMetrics.overall_completeness.toFixed(1)}%
                    </div>
                  </div>
                  <div
                    className={`metric-card ${
                      metricsData.overall_statistics.r_merge < 0.12
                        ? "good"
                        : "warning"
                    }`}
                  >
                    <div className="metric-label">R-merge</div>
                    <div className="metric-value">
                      {metricsData.overall_statistics.r_merge.toFixed(3)}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
