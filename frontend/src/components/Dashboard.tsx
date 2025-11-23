import { useState, useEffect } from "react";

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

  useEffect(() => {
    fetch(`${datasetPath}/metrics.json`)
      .then((res) => res.json())
      .then((data) => setMetrics(data))
      .catch((err) => console.error("Failed to load metrics:", err));
  }, []);

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
    }, 100); //10 fps

    return () => clearInterval(interval);
  }, [isPlaying, metrics]);

  const frameUrl = `${datasetPath}/frame_${String(currentFrame).padStart(
    4,
    "0"
  )}.png`;

  return (
    <div className="min-h-screen bg-black text-[#00d9ff] p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">SYNCHROTRON VISUALIZER</h1>
        <p className="text-[#00d9ff]/60">Lysozyme Crystal</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8">
          <div className="border border-[#00d9ff]/30 rounded-lg p-4 bg-black/50">
            <h2 className="text-xl font-bold mb-4">Live Diffraction Pattern</h2>

            <div className="relative bg-black border border-[#00d9ff]/20 rounded aspect-square">
              <img
                src={frameUrl}
                alt={`Frame ${currentFrame}`}
                className="w-full h-full object-contain"
                onError={(e) => {
                  console.error("Image load error:", frameUrl);
                  e.currentTarget.src =
                    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"%3E%3C/svg%3E';
                }}
              />

              <div className="absolute top-4 right-4 bg-black/80 px-3 py-1 rounded border border-[#00d9ff]/50">
                Frame {currentFrame} / {metrics?.total_frames || 360}
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <input
                type="range"
                min="1"
                max={metrics?.total_frames || 360}
                value={currentFrame}
                onChange={(e) => setCurrentFrame(Number(e.target.value))}
                className="w-full accent-[#00d9ff]"
              />

              <div className="flex gap-4">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-6 py-2 bg-[#00d9ff]/20 hover:bg-[#00d9ff]/30 border border-[#00d9ff] rounded font-bold transition-colors"
                >
                  {isPlaying ? "⏸ PAUSE" : "▶ PLAY"}
                </button>

                <button
                  onClick={() => setCurrentFrame(1)}
                  className="px-4 py-2 bg-[#00d9ff]/10 hover:bg-[#00d9ff]/20 border border-[#00d9ff]/50 rounded transition-colors"
                >
                  ⏮ RESET
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-4 space-y-4">
          <div className="border border-[#00d9ff]/30 rounded-lg p-4 bg-black/50">
            <div className="text-sm text-[#00d9ff]/60 mb-1">STATUS</div>
            <div className="text-2xl font-bold uppercase">
              {metrics?.status || "Loading..."}
            </div>
          </div>

          {metrics && (
            <>
              <MetricCard
                label="Resolution"
                value={metrics.resolution.toFixed(2)}
                unit="Å"
                isGood={metrics.resolution < 1.8}
              />

              <MetricCard
                label="I/σ(I)"
                value={metrics.i_over_sigma.toFixed(1)}
                unit=""
                isGood={metrics.i_over_sigma > 15}
              />

              <MetricCard
                label="Completeness"
                value={metrics.completeness.toFixed(1)}
                unit="%"
                isGood={metrics.completeness > 98}
              />

              <MetricCard
                label="R-merge"
                value={metrics.r_merge.toFixed(3)}
                unit=""
                isGood={metrics.r_merge < 0.12}
              />

              <MetricCard
                label="CC½"
                value={metrics.cc_half.toFixed(3)}
                unit=""
                isGood={metrics.cc_half > 0.95}
              />

              <MetricCard
                label="Mosaicity"
                value={metrics.mosaicity.toFixed(2)}
                unit="°"
                isGood={metrics.mosaicity < 0.5}
              />

              <div className="border border-[#00d9ff]/30 rounded-lg p-4 bg-black/50">
                <div className="text-sm text-[#00d9ff]/60 mb-1">
                  SPACE GROUP
                </div>
                <div className="text-xl font-mono">{metrics.space_group}</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  unit,
  isGood,
}: {
  label: string;
  value: string;
  unit: string;
  isGood: boolean;
}) {
  const color = isGood ? "#00ff00" : "#ffaa00";

  return (
    <div className="border border-[#00d9ff]/30 rounded-lg p-4 bg-black/50">
      <div className="text-sm text-[#00d9ff]/60 mb-1">
        {label.toUpperCase()}
      </div>
      <div className="text-3xl font-bold" style={{ color }}>
        {value} <span className="text-xl">{unit}</span>
      </div>
    </div>
  );
}
