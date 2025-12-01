export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-left">
        <span className="footer-label">Light Source</span>
        <span className="separator">•</span>
        <span className="footer-label">Beamline I03</span>
        <span className="separator">•</span>
        <span className="footer-label">Macromolecular Crystallography</span>
      </div>

      <div className="footer-right">
        <div className="system-stats">
          <span className="stat-label">FPS:</span>
          <span className="stat-value">10</span>
          <span className="separator">|</span>
          <span className="stat-label">Latency:</span>
          <span className="stat-value">45ms</span>
        </div>
      </div>
    </footer>
  );
}
