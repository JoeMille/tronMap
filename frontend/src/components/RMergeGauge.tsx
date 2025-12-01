import { useEffect, useRef } from "react";
import "./RMergeGauge.css";

interface RMergeGaugeProps {
  rMerge: number;
  ccHalf: number;
  mosaicity: number;
  frameIOverSigma?: number;
  frameCompleteness?: number;
}

export default function RMergeGauge({
  rMerge,
  ccHalf,
  mosaicity,
  frameIOverSigma,
  frameCompleteness,
}: RMergeGaugeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getQualityLevel = (rMerge: number) => {
    if (rMerge < 0.05)
      return { label: "EXCELLENT", color: "#00ff88", level: 4 };
    if (rMerge < 0.1) return { label: "GOOD", color: "#00d9ff", level: 3 };
    if (rMerge < 0.15)
      return { label: "ACCEPTABLE", color: "#ffaa00", level: 2 };
    if (rMerge < 0.25) return { label: "POOR", color: "#ff6600", level: 1 };
    return { label: "CRITICAL", color: "#ff0033", level: 0 };
  };

  const getCCHalfQuality = (ccHalf: number) => {
    if (ccHalf > 0.995) return { label: "EXCELLENT", color: "#00ff88" };
    if (ccHalf > 0.99) return { label: "GOOD", color: "#00d9ff" };
    if (ccHalf > 0.95) return { label: "ACCEPTABLE", color: "#ffaa00" };
    return { label: "POOR", color: "#ff6600" };
  };

  const getMosaicityQuality = (mosaicity: number) => {
    if (mosaicity < 0.2) return { label: "EXCELLENT", color: "#00ff88" };
    if (mosaicity < 0.5) return { label: "GOOD", color: "#00d9ff" };
    if (mosaicity < 1.0) return { label: "ACCEPTABLE", color: "#ffaa00" };
    return { label: "POOR", color: "#ff6600" };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 150;

    ctx.clearRect(0, 0, width, height);

    const quality = getQualityLevel(rMerge);
    const startAngle = Math.PI * 0.75;
    const endAngle = Math.PI * 2.25;
    const totalAngle = endAngle - startAngle;

    ctx.strokeStyle = "rgba(0, 217, 255, 0.1)";
    ctx.lineWidth = 32;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.stroke();

    const segments = [
      { end: 0.05, color: "#00ff88" },
      { end: 0.1, color: "#00d9ff" },
      { end: 0.15, color: "#ffaa00" },
      { end: 0.25, color: "#ff6600" },
      { end: 0.3, color: "#ff0033" },
    ];

    segments.forEach((segment, index) => {
      const prevEnd = index > 0 ? segments[index - 1].end : 0;
      const segmentStart = startAngle + (prevEnd / 0.3) * totalAngle;
      const segmentEnd = startAngle + (segment.end / 0.3) * totalAngle;

      ctx.strokeStyle = segment.color + "40";
      ctx.lineWidth = 30;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, segmentStart, segmentEnd);
      ctx.stroke();
    });

    const needleAngle = startAngle + Math.min(rMerge / 0.3, 1) * totalAngle;

    ctx.strokeStyle = quality.color;
    ctx.lineWidth = 36;
    ctx.lineCap = "round";
    ctx.shadowBlur = 30;
    ctx.shadowColor = quality.color;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, needleAngle);
    ctx.stroke();
    ctx.shadowBlur = 0;

    const needleLength = radius - 15;
    const needleStartRadius = 40; // Start needle further from center
    const needleX = centerX + Math.cos(needleAngle) * needleLength;
    const needleY = centerY + Math.sin(needleAngle) * needleLength;
    const needleStartX = centerX + Math.cos(needleAngle) * needleStartRadius;
    const needleStartY = centerY + Math.sin(needleAngle) * needleStartRadius;

    ctx.strokeStyle = quality.color;
    ctx.lineWidth = 5;
    ctx.shadowBlur = 22;
    ctx.shadowColor = quality.color;
    ctx.beginPath();
    ctx.moveTo(needleStartX, needleStartY);
    ctx.lineTo(needleX, needleY);
    ctx.stroke();

    const tickAngles = [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3];
    tickAngles.forEach((value) => {
      const angle = startAngle + (value / 0.3) * totalAngle;
      const innerRadius = radius - 25;
      const outerRadius = radius - 10;

      const x1 = centerX + Math.cos(angle) * innerRadius;
      const y1 = centerY + Math.sin(angle) * innerRadius;
      const x2 = centerX + Math.cos(angle) * outerRadius;
      const y2 = centerY + Math.sin(angle) * outerRadius;

      ctx.strokeStyle = "rgba(0, 217, 255, 0.6)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      const labelRadius = radius - 48;
      const labelX = centerX + Math.cos(angle) * labelRadius;
      const labelY = centerY + Math.sin(angle) * labelRadius;

      ctx.fillStyle = "rgba(0, 217, 255, 0.7)";
      ctx.font = "13px monospace";
      ctx.textAlign = "center";
      ctx.fillText(value.toFixed(2), labelX, labelY + 4);
    });
  }, [rMerge]);

  const quality = getQualityLevel(rMerge);
  const ccQuality = getCCHalfQuality(ccHalf);
  const mosaicityQuality = getMosaicityQuality(mosaicity);

  return (
    <div className="rmerge-gauge-container">
      <div className="gauge-top-section">
        <div className="gauge-canvas-wrapper">
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            className="gauge-canvas"
          />
          <div className="gauge-center-display">
            <div className="gauge-value" style={{ color: quality.color }}>
              {rMerge.toFixed(3)}
            </div>
            <div className="gauge-label">R-MERGE</div>
            <div className="gauge-status" style={{ color: quality.color }}>
              {quality.label}
            </div>
          </div>
        </div>

        <div className="gauge-legend">
          <div className="legend-item">
            <div className="legend-color" style={{ background: "#00ff88" }} />
            <span>&lt; 0.05 EXCELLENT</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: "#00d9ff" }} />
            <span>0.05-0.10 GOOD</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: "#ffaa00" }} />
            <span>0.10-0.15 ACCEPTABLE</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: "#ff6600" }} />
            <span>0.15-0.25 POOR</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: "#ff0033" }} />
            <span>&gt; 0.25 CRITICAL</span>
          </div>
        </div>
      </div>

      <div className="supplementary-metrics">
        {frameIOverSigma && (
          <div
            className="metric-card"
            style={{
              borderColor: frameIOverSigma > 15 ? "#00ff88" : "#ff6600",
            }}
          >
            <div className="metric-label">CURRENT FRAME I/σ</div>
            <div
              className="metric-value"
              style={{ color: frameIOverSigma > 15 ? "#00ff88" : "#ff6600" }}
            >
              {frameIOverSigma.toFixed(2)}
            </div>
            <div
              className="metric-status"
              style={{ color: frameIOverSigma > 15 ? "#00ff88" : "#ff6600" }}
            >
              {frameIOverSigma > 20
                ? "EXCELLENT"
                : frameIOverSigma > 15
                ? "GOOD"
                : "POOR"}
            </div>
          </div>
        )}

        {frameCompleteness && (
          <div
            className="metric-card"
            style={{
              borderColor: frameCompleteness > 90 ? "#00ff88" : "#ff6600",
            }}
          >
            <div className="metric-label">CURRENT COMPLETENESS</div>
            <div
              className="metric-value"
              style={{ color: frameCompleteness > 90 ? "#00ff88" : "#ff6600" }}
            >
              {frameCompleteness.toFixed(1)}%
            </div>
            <div
              className="metric-status"
              style={{ color: frameCompleteness > 90 ? "#00ff88" : "#ff6600" }}
            >
              {frameCompleteness > 95
                ? "EXCELLENT"
                : frameCompleteness > 90
                ? "GOOD"
                : "FAIR"}
            </div>
          </div>
        )}

        <div className="metric-card">
          <div className="metric-label">CC½</div>
          <div className="metric-value" style={{ color: ccQuality.color }}>
            {ccHalf.toFixed(4)}
          </div>
          <div className="metric-status" style={{ color: ccQuality.color }}>
            {ccQuality.label}
          </div>
          <div className="metric-description">
            Half-dataset correlation coefficient. Measures internal consistency
            of merged reflections. Values &gt; 0.99 indicate excellent data.
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">MOSAICITY</div>
          <div
            className="metric-value"
            style={{ color: mosaicityQuality.color }}
          >
            {mosaicity.toFixed(2)}°
          </div>
          <div
            className="metric-status"
            style={{ color: mosaicityQuality.color }}
          >
            {mosaicityQuality.label}
          </div>
          <div className="metric-description">
            Crystal disorder parameter. Lower values indicate better crystal
            quality. Ideal range: 0.1-0.5°.
          </div>
        </div>
      </div>
    </div>
  );
}
