interface HeaderProps {
  status?: "running" | "paused" | "syncing" | "idle";
  datasetName?: string;
}

export default function Header({
  status = "idle",
  datasetName = "Lysozyme Crystal",
}: HeaderProps) {
  const statusConfig = {
    running: { text: "RUNNING", color: "#00ff00", pulse: true },
    paused: { text: "PAUSED", color: "#ffaa00", pulse: false },
    syncing: { text: "SYNCING", color: "#00d9ff", pulse: true },
    idle: { text: "IDLE", color: "#666", pulse: false },
  };

  const config = statusConfig[status];

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="logo">
          <div className="logo-icon"></div>
          <span className="logo-text">SYNCHROTRON</span>
        </div>
        <div className="dataset-info">
          <span className="label">DATASET:</span>
          <span className="dataset-name">{datasetName}</span>
        </div>
      </div>

      <div className="header-right">
        <div className="status-indicator">
          <div
            className={`status-dot ${config.pulse ? "pulse" : ""}`}
            style={{ backgroundColor: config.color }}
          ></div>
          <span className="status-text" style={{ color: config.color }}>
            {config.text}
          </span>
        </div>
        <div className="timestamp" id="header-timestamp">
          {new Date().toLocaleTimeString()}
        </div>
      </div>
    </header>
  );
}
