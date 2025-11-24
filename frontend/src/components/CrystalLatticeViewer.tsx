import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import "./CrystalLatticeViewer.css";

interface ResolutionShell {
  resolution: number;
  i_over_sigma: number;
  completeness: number;
  n_reflections: number;
}

interface CrystalLatticeViewerProps {
  resolutionShells?: ResolutionShell[];
  currentFrame: number;
  isPlaying: boolean;
}

export default function CrystalLatticeViewer({
  resolutionShells,
  currentFrame,
  isPlaying,
}: CrystalLatticeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const reflectionPointsRef = useRef<THREE.Points[]>([]);
  const latticeRef = useRef<THREE.Group | null>(null);
  const energyFieldRef = useRef<THREE.Mesh | null>(null);
  const wireframeRef = useRef<THREE.Mesh | null>(null);
  const lightsRef = useRef<THREE.PointLight[]>([]);
  const animationFrameRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);
  const prevMetricsRef = useRef<{
    avgIntensity: number;
    avgCompleteness: number;
  }>({
    avgIntensity: 0,
    avgCompleteness: 0,
  });

  const [metrics, setMetrics] = useState({
    avgIntensity: 0,
    avgCompleteness: 0,
    totalReflections: 0,
    resolution: 0,
  });

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x000000, 0.008);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(25, 18, 25);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0x0a0a1a, 0.8);
    scene.add(ambientLight);

    const mainLight = new THREE.PointLight(0x00d9ff, 3, 150);
    mainLight.position.set(15, 15, 15);
    scene.add(mainLight);
    lightsRef.current.push(mainLight);

    const accentLight1 = new THREE.PointLight(0xff00ff, 2, 100);
    accentLight1.position.set(-15, 10, -15);
    scene.add(accentLight1);
    lightsRef.current.push(accentLight1);

    const accentLight2 = new THREE.PointLight(0x00ff88, 2, 100);
    accentLight2.position.set(15, -10, -15);
    scene.add(accentLight2);
    lightsRef.current.push(accentLight2);

    const latticeGroup = new THREE.Group();
    latticeRef.current = latticeGroup;
    scene.add(latticeGroup);

    const unitCellSize = 14;
    const tubeRadius = 0.05;
    const radialSegments = 6;

    const edges = [
      [0, 0, 0, unitCellSize, 0, 0],
      [0, 0, 0, 0, unitCellSize, 0],
      [0, 0, 0, 0, 0, unitCellSize],
      [unitCellSize, 0, 0, unitCellSize, unitCellSize, 0],
      [unitCellSize, 0, 0, unitCellSize, 0, unitCellSize],
      [0, unitCellSize, 0, unitCellSize, unitCellSize, 0],
      [0, unitCellSize, 0, 0, unitCellSize, unitCellSize],
      [0, 0, unitCellSize, unitCellSize, 0, unitCellSize],
      [0, 0, unitCellSize, 0, unitCellSize, unitCellSize],
      [unitCellSize, unitCellSize, 0, unitCellSize, unitCellSize, unitCellSize],
      [unitCellSize, 0, unitCellSize, unitCellSize, unitCellSize, unitCellSize],
      [0, unitCellSize, unitCellSize, unitCellSize, unitCellSize, unitCellSize],
    ];

    edges.forEach(([x1, y1, z1, x2, y2, z2]) => {
      const start = new THREE.Vector3(
        x1 - unitCellSize / 2,
        y1 - unitCellSize / 2,
        z1 - unitCellSize / 2
      );
      const end = new THREE.Vector3(
        x2 - unitCellSize / 2,
        y2 - unitCellSize / 2,
        z2 - unitCellSize / 2
      );

      const direction = new THREE.Vector3().subVectors(end, start);
      const length = direction.length();

      const tubeGeometry = new THREE.CylinderGeometry(
        tubeRadius,
        tubeRadius,
        length,
        radialSegments
      );

      const tubeMaterial = new THREE.MeshPhongMaterial({
        color: 0x00d9ff,
        emissive: 0x00d9ff,
        emissiveIntensity: 0.15,
        transparent: true,
        opacity: 0.25,
        shininess: 100,
      });

      const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
      tube.position.copy(start).add(direction.multiplyScalar(0.5));
      const axis = new THREE.Vector3(0, 1, 0);
      tube.quaternion.setFromUnitVectors(axis, direction.normalize());
      latticeGroup.add(tube);

      const sphereGeometry = new THREE.SphereGeometry(0.12, 12, 12);
      const sphereMaterial = new THREE.MeshPhongMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.3,
      });

      const startSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      startSphere.position.copy(start);
      latticeGroup.add(startSphere);
    });

    const energyFieldGeometry = new THREE.IcosahedronGeometry(12, 3);
    const energyFieldMaterial = new THREE.MeshPhongMaterial({
      color: 0x00d9ff,
      transparent: true,
      opacity: 0.03,
      wireframe: false,
      side: THREE.DoubleSide,
      emissive: 0x00d9ff,
      emissiveIntensity: 0.1,
    });

    const energyField = new THREE.Mesh(
      energyFieldGeometry,
      energyFieldMaterial
    );
    scene.add(energyField);
    energyFieldRef.current = energyField;

    const wireframeGeometry = new THREE.IcosahedronGeometry(12.5, 2);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x00d9ff,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });
    const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
    scene.add(wireframe);
    wireframeRef.current = wireframe;

    const gridHelper = new THREE.GridHelper(60, 60, 0x00d9ff, 0x002244);
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.06;
    gridHelper.position.y = -12;
    scene.add(gridHelper);

    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener("resize", handleResize);

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      const time = Date.now() * 0.001;

      if (latticeRef.current && isPlayingRef.current) {
        latticeRef.current.rotation.y += 0.003;
        latticeRef.current.rotation.x = Math.sin(time * 0.2) * 0.05;
      }

      if (energyFieldRef.current) {
        if (isPlayingRef.current) {
          energyFieldRef.current.rotation.x = time * 0.15;
          energyFieldRef.current.rotation.y = time * 0.25;
        }
        const breathe = 1 + Math.sin(time * 1.2) * 0.03;
        energyFieldRef.current.scale.set(breathe, breathe, breathe);
      }

      if (wireframeRef.current && isPlayingRef.current) {
        wireframeRef.current.rotation.x = time * -0.1;
        wireframeRef.current.rotation.y = time * 0.2;
      }

      reflectionPointsRef.current.forEach((points, index) => {
        if (points.material instanceof THREE.PointsMaterial) {
          const pulse = Math.sin(time * 1.5 + index * 0.3) * 0.2 + 0.8;
          const baseOpacity =
            (points.material as any).userData?.baseOpacity || 0.75;
          points.material.opacity = baseOpacity * pulse;
        }
        if (isPlayingRef.current) {
          points.rotation.y = time * 0.08 * (index + 1);
          points.rotation.x = Math.sin(time * 0.25 + index) * 0.08;
        }
      });

      if (cameraRef.current && isPlayingRef.current) {
        const radius = 32;
        cameraRef.current.position.x = Math.cos(time * 0.12) * radius;
        cameraRef.current.position.z = Math.sin(time * 0.12) * radius;
        cameraRef.current.position.y = 20 + Math.sin(time * 0.08) * 3;
        cameraRef.current.lookAt(0, 0, 0);
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current || !resolutionShells || resolutionShells.length === 0)
      return;

    const avgIntensity =
      resolutionShells.reduce((sum, s) => sum + s.i_over_sigma, 0) /
      resolutionShells.length;
    const avgCompleteness =
      resolutionShells.reduce((sum, s) => sum + s.completeness, 0) /
      resolutionShells.length;
    const totalReflections = resolutionShells.reduce(
      (sum, s) => sum + s.n_reflections,
      0
    );
    const bestResolution = Math.min(
      ...resolutionShells.map((s) => s.resolution)
    );

    setMetrics({
      avgIntensity,
      avgCompleteness,
      totalReflections,
      resolution: bestResolution,
    });

    const intensityNormalized = Math.min(avgIntensity / 30, 1);
    const completenessNormalized = avgCompleteness / 100;

    if (sceneRef.current) {
      let bgColor: THREE.Color;
      if (avgIntensity < 10) {
        bgColor = new THREE.Color(0x0a0000);
      } else if (avgIntensity < 15) {
        const t = (avgIntensity - 10) / 5;
        bgColor = new THREE.Color().lerpColors(
          new THREE.Color(0x0a0000),
          new THREE.Color(0x0a0500),
          t
        );
      } else if (avgIntensity < 20) {
        const t = (avgIntensity - 15) / 5;
        bgColor = new THREE.Color().lerpColors(
          new THREE.Color(0x0a0500),
          new THREE.Color(0x050a00),
          t
        );
      } else if (avgIntensity < 25) {
        const t = (avgIntensity - 20) / 5;
        bgColor = new THREE.Color().lerpColors(
          new THREE.Color(0x050a00),
          new THREE.Color(0x000a0a),
          t
        );
      } else {
        bgColor = new THREE.Color(0x00050a);
      }
      sceneRef.current.background = bgColor;
    }

    if (
      energyFieldRef.current &&
      energyFieldRef.current.material instanceof THREE.MeshPhongMaterial
    ) {
      let color: THREE.Color;
      let glowIntensity: number;

      if (avgIntensity < 10) {
        color = new THREE.Color(0xff0033);
        glowIntensity = 0.25;
      } else if (avgIntensity < 15) {
        const t = (avgIntensity - 10) / 5;
        color = new THREE.Color().lerpColors(
          new THREE.Color(0xff0033),
          new THREE.Color(0xff6600),
          t
        );
        glowIntensity = 0.2 + t * 0.05;
      } else if (avgIntensity < 20) {
        const t = (avgIntensity - 15) / 5;
        color = new THREE.Color().lerpColors(
          new THREE.Color(0xff6600),
          new THREE.Color(0xffcc00),
          t
        );
        glowIntensity = 0.15 + t * 0.05;
      } else if (avgIntensity < 25) {
        const t = (avgIntensity - 20) / 5;
        color = new THREE.Color().lerpColors(
          new THREE.Color(0xffcc00),
          new THREE.Color(0x00ffff),
          t
        );
        glowIntensity = 0.12 + t * 0.03;
      } else {
        const t = Math.min((avgIntensity - 25) / 10, 1);
        color = new THREE.Color().lerpColors(
          new THREE.Color(0x00ffff),
          new THREE.Color(0x0066ff),
          t
        );
        glowIntensity = 0.1 + t * 0.05;
      }

      energyFieldRef.current.material.color = color;
      energyFieldRef.current.material.emissive = color;
      energyFieldRef.current.material.emissiveIntensity = glowIntensity;
      energyFieldRef.current.material.opacity = 0.02 + glowIntensity * 0.15;
    }

    if (
      wireframeRef.current &&
      wireframeRef.current.material instanceof THREE.MeshBasicMaterial
    ) {
      let wireColor: THREE.Color;
      if (avgIntensity < 15) {
        wireColor = new THREE.Color(0xff3366);
      } else if (avgIntensity < 25) {
        wireColor = new THREE.Color(0xffaa00);
      } else {
        wireColor = new THREE.Color(0x00ddff);
      }
      wireframeRef.current.material.color = wireColor;
      wireframeRef.current.material.opacity =
        0.08 + completenessNormalized * 0.12;
    }

    if (lightsRef.current.length > 0) {
      lightsRef.current[0].intensity = 2.5 + intensityNormalized * 2;
      lightsRef.current[1].intensity = 1.5 + intensityNormalized * 1.5;
      lightsRef.current[2].intensity = 1.5 + completenessNormalized * 1.5;
    }

    if (latticeRef.current) {
      latticeRef.current.children.forEach((child) => {
        if (
          child instanceof THREE.Mesh &&
          child.material instanceof THREE.MeshPhongMaterial
        ) {
          if (child.geometry instanceof THREE.CylinderGeometry) {
            child.material.emissiveIntensity = 0.15 + intensityNormalized * 0.2;
            child.material.opacity = 0.2 + completenessNormalized * 0.15;
          } else if (child.geometry instanceof THREE.SphereGeometry) {
            child.material.emissiveIntensity = 0.2 + intensityNormalized * 0.25;
            const scale = 0.5 + intensityNormalized * 0.3;
            child.scale.set(scale, scale, scale);
          }
        }
      });
    }

    reflectionPointsRef.current.forEach((points) => {
      sceneRef.current?.remove(points);
      points.geometry.dispose();
      if (points.material instanceof THREE.Material) {
        points.material.dispose();
      }
    });
    reflectionPointsRef.current = [];

    resolutionShells.forEach((shell, shellIndex) => {
      const numPoints = Math.min(Math.floor(shell.n_reflections / 3), 3000);
      const positions = new Float32Array(numPoints * 3);
      const colors = new Float32Array(numPoints * 3);

      const shellRadius = 6 + shellIndex * 2.5;

      for (let i = 0; i < numPoints; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        positions[i * 3] = shellRadius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = shellRadius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = shellRadius * Math.cos(phi);

        const intensity = Math.min(shell.i_over_sigma / 35, 1);

        if (intensity < 0.3) {
          colors[i * 3] = 1;
          colors[i * 3 + 1] = intensity * 1.5;
          colors[i * 3 + 2] = intensity * 0.5;
        } else if (intensity < 0.5) {
          const t = (intensity - 0.3) / 0.2;
          colors[i * 3] = 1;
          colors[i * 3 + 1] = 0.45 + t * 0.55;
          colors[i * 3 + 2] = t * 0.3;
        } else if (intensity < 0.7) {
          const t = (intensity - 0.5) / 0.2;
          colors[i * 3] = 1 - t * 0.8;
          colors[i * 3 + 1] = 1;
          colors[i * 3 + 2] = 0.3 + t * 0.7;
        } else {
          const t = (intensity - 0.7) / 0.3;
          colors[i * 3] = 0.2 - t * 0.2;
          colors[i * 3 + 1] = 1 - t * 0.4;
          colors[i * 3 + 2] = 1;
        }
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
      );
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      const canvas = document.createElement("canvas");
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, 16, 16);
        ctx.fillStyle = "rgba(255,255,255,1)";
        ctx.fillRect(7, 7, 2, 2);
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.NearestFilter;
      texture.magFilter = THREE.NearestFilter;

      const material = new THREE.PointsMaterial({
        size: 1.6 + (shell.i_over_sigma / 30) * 0.8,
        vertexColors: true,
        transparent: true,
        opacity: 1.0,
        blending: THREE.NormalBlending,
        depthWrite: false,
        sizeAttenuation: true,
        map: texture,
      });

      (material as any).userData = {
        baseOpacity: 1.0,
        shellIndex: shellIndex,
      };

      const points = new THREE.Points(geometry, material);
      sceneRef.current?.add(points);
      reflectionPointsRef.current.push(points);
    });

    prevMetricsRef.current = { avgIntensity, avgCompleteness };
  }, [resolutionShells, currentFrame]);

  const getQualityLabel = () => {
    if (!resolutionShells || resolutionShells.length === 0) return "NO DATA";
    const avg =
      resolutionShells.reduce((s, sh) => s + sh.i_over_sigma, 0) /
      resolutionShells.length;
    if (avg < 10) return "CRITICAL";
    if (avg < 15) return "POOR";
    if (avg < 20) return "FAIR";
    if (avg < 25) return "GOOD";
    return "EXCELLENT";
  };

  const getQualityColor = () => {
    if (!resolutionShells || resolutionShells.length === 0) return "#666";
    const avg =
      resolutionShells.reduce((s, sh) => s + sh.i_over_sigma, 0) /
      resolutionShells.length;
    if (avg < 10) return "#ff0033";
    if (avg < 15) return "#ff6600";
    if (avg < 20) return "#ffcc00";
    if (avg < 25) return "#00ffff";
    return "#0066ff";
  };

  const MeterBar = ({
    label,
    value,
    maxValue,
    color,
  }: {
    label: string;
    value: number;
    maxValue: number;
    color: string;
  }) => {
    const percentage = Math.min((value / maxValue) * 100, 100);

    return (
      <div className="meter-bar">
        <div className="meter-label">
          {label}: {value.toFixed(1)}
        </div>
        <div className="meter-container">
          <div
            className="meter-fill"
            style={{
              width: `${percentage}%`,
              background: `linear-gradient(90deg, ${color}00, ${color})`,
              boxShadow: `0 0 8px ${color}`,
            }}
          />
          <div className="meter-grid" />
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="crystal-lattice-container">
      <div className="crystal-lattice-info">
        <div className="crystal-lattice-title">
          <span
            style={{ color: "#00d9ff", fontSize: "11px", letterSpacing: "2px" }}
          >
            ◆ RECIPROCAL SPACE ANALYSIS
          </span>
        </div>
        <div className="crystal-lattice-status">
          <div
            style={{
              fontSize: "10px",
              fontFamily: "monospace",
              letterSpacing: "1px",
              marginBottom: "6px",
            }}
          >
            FRAME:{" "}
            <span style={{ color: "#00d9ff" }}>
              {String(currentFrame).padStart(3, "0")}
            </span>{" "}
            │ STATUS:{" "}
            <span style={{ color: isPlaying ? "#00ff88" : "#ffaa00" }}>
              {isPlaying ? "◉ SCANNING" : "◎ PAUSED"}
            </span>
          </div>
          {resolutionShells && (
            <>
              <div
                style={{
                  fontSize: "11px",
                  marginTop: "4px",
                  padding: "4px 8px",
                  background: "rgba(0,217,255,0.05)",
                  borderLeft: `2px solid ${getQualityColor()}`,
                  fontFamily: "monospace",
                }}
              >
                <div style={{ marginBottom: "3px" }}>
                  I/σ:{" "}
                  <span
                    style={{ color: getQualityColor(), fontWeight: "bold" }}
                  >
                    {(
                      resolutionShells.reduce(
                        (s, sh) => s + sh.i_over_sigma,
                        0
                      ) / resolutionShells.length
                    ).toFixed(2)}
                  </span>{" "}
                  │ COMPL:{" "}
                  {(
                    resolutionShells.reduce((s, sh) => s + sh.completeness, 0) /
                    resolutionShells.length
                  ).toFixed(1)}
                  %
                </div>
                <div style={{ fontSize: "9px", opacity: 0.8 }}>
                  REFLECTIONS:{" "}
                  {resolutionShells
                    .reduce((s, sh) => s + sh.n_reflections, 0)
                    .toLocaleString()}
                </div>
              </div>
              <div
                style={{
                  marginTop: "6px",
                  fontSize: "10px",
                  fontWeight: "bold",
                  color: getQualityColor(),
                  letterSpacing: "2px",
                  fontFamily: "monospace",
                }}
              >
                ▸ {getQualityLabel()}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="metrics-panel">
        <div className="metrics-header">▸ METRICS</div>
        <MeterBar
          label="I/σ"
          value={metrics.avgIntensity}
          maxValue={40}
          color={getQualityColor()}
        />
        <MeterBar
          label="COMPL"
          value={metrics.avgCompleteness}
          maxValue={100}
          color="#00ffaa"
        />
        <MeterBar
          label="RES(Å)"
          value={metrics.resolution}
          maxValue={10}
          color="#ff00ff"
        />
      </div>
    </div>
  );
}
