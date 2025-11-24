import { useState, useEffect, useRef } from "react";
import Header from "./Header";
import Footer from "./Footer";
import DiffractionViewer from "./DiffractionViewer";
import MetricsGraph from "./MetricsGraph";
import CrystalLatticeViewer from "./CrystalLatticeViewer";
import RMergeGauge from "./RMergeGauge";
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
      }, 150);
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

  // Calculate frame-specific quality metrics based on I/sigma
  const frameRMerge =
    metricsData && currentFrameMetrics
      ? metricsData.overall_statistics.r_merge *
        (25 / currentFrameMetrics.overall_i_over_sigma)
      : metricsData?.overall_statistics.r_merge || 0;

  const frameCCHalf =
    metricsData && currentFrameMetrics
      ? Math.max(
          0.95,
          metricsData.overall_statistics.cc_half -
            (25 - currentFrameMetrics.overall_i_over_sigma) * 0.002
        )
      : metricsData?.overall_statistics.cc_half || 0;

  const frameMosaicity =
    metricsData && currentFrameMetrics
      ? metricsData.overall_statistics.mosaicity *
        (1 + (25 - currentFrameMetrics.overall_i_over_sigma) * 0.01)
      : metricsData?.overall_statistics.mosaicity || 0;

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
            <div className="analytics-container">
              <div className="graphs-section">
                <MetricsGraph
                  data={historicalData}
                  currentFrame={currentFrame}
                  metric="overall_i_over_sigma"
                  label="I/σ(I) Signal Quality"
                  color="#00d9ff"
                  threshold={15}
                />
                <MetricsGraph
                  data={historicalData}
                  currentFrame={currentFrame}
                  metric="overall_completeness"
                  label="Data Completeness"
                  color="#00ff88"
                  threshold={95}
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

          <div className="canvas-panel canvas-panel-lattice">
            <div className="panel-header">
              <h3>3D Reciprocal Space Lattice</h3>
            </div>
            <div className="canvas-content" style={{ padding: 0 }}>
              <CrystalLatticeViewer
                resolutionShells={currentFrameMetrics?.resolution_shells}
                currentFrame={currentFrame}
                isPlaying={isPlaying}
              />
            </div>
          </div>

          <div className="canvas-panel canvas-panel-gauge">
            <div className="canvas-content" style={{ padding: 0 }}>
              {metricsData?.overall_statistics && currentFrameMetrics && (
                <RMergeGauge
                  rMerge={frameRMerge}
                  ccHalf={frameCCHalf}
                  mosaicity={frameMosaicity}
                  frameIOverSigma={currentFrameMetrics.overall_i_over_sigma}
                  frameCompleteness={currentFrameMetrics.overall_completeness}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
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
