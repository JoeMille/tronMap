import { useEffect, useRef } from "react";
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
  const latticeRef = useRef<THREE.LineSegments | null>(null);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(15, 15, 15);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x00d9ff, 2, 100);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    const unitCellSize = 10;
    const latticeGeometry = new THREE.BufferGeometry();
    const latticeVertices = [];

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
      latticeVertices.push(
        x1 - unitCellSize / 2,
        y1 - unitCellSize / 2,
        z1 - unitCellSize / 2
      );
      latticeVertices.push(
        x2 - unitCellSize / 2,
        y2 - unitCellSize / 2,
        z2 - unitCellSize / 2
      );
    });

    latticeGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(latticeVertices, 3)
    );

    const latticeMaterial = new THREE.LineBasicMaterial({
      color: 0x00d9ff,
      linewidth: 2,
      transparent: true,
      opacity: 0.8,
    });

    const lattice = new THREE.LineSegments(latticeGeometry, latticeMaterial);
    scene.add(lattice);
    latticeRef.current = lattice;

    const gridHelper = new THREE.GridHelper(20, 20, 0x00d9ff, 0x003344);
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.2;
    scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(12);
    scene.add(axesHelper);

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

      if (latticeRef.current && isPlaying) {
        latticeRef.current.rotation.y += 0.005;
      }

      reflectionPointsRef.current.forEach((points, index) => {
        if (points.material instanceof THREE.PointsMaterial) {
          const pulse = Math.sin(Date.now() * 0.003 + index) * 0.3 + 0.7;
          points.material.opacity = pulse;
        }
      });

      if (cameraRef.current && !isPlaying) {
        cameraRef.current.position.x = Math.cos(Date.now() * 0.0005) * 15;
        cameraRef.current.position.z = Math.sin(Date.now() * 0.0005) * 15;
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
  }, [isPlaying]);

  useEffect(() => {
    if (!sceneRef.current || !resolutionShells) return;

    reflectionPointsRef.current.forEach((points) => {
      sceneRef.current?.remove(points);
      points.geometry.dispose();
      if (points.material instanceof THREE.Material) {
        points.material.dispose();
      }
    });
    reflectionPointsRef.current = [];

    resolutionShells.forEach((shell, shellIndex) => {
      const numPoints = Math.floor(shell.n_reflections / 20);
      const positions = new Float32Array(numPoints * 3);
      const colors = new Float32Array(numPoints * 3);

      const shellRadius = 3 + shellIndex * 1.5;

      for (let i = 0; i < numPoints; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        positions[i * 3] = shellRadius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = shellRadius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = shellRadius * Math.cos(phi);

        const intensity = shell.i_over_sigma / 30;
        colors[i * 3] = 0;
        colors[i * 3 + 1] = Math.min(intensity, 1);
        colors[i * 3 + 2] = 1;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
      );
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      const material = new THREE.PointsMaterial({
        size: 0.3,
        vertexColors: true,
        transparent: true,
        opacity: shell.completeness / 100,
        blending: THREE.AdditiveBlending,
      });

      const points = new THREE.Points(geometry, material);
      sceneRef.current?.add(points);
      reflectionPointsRef.current.push(points);
    });
  }, [resolutionShells, currentFrame]);

  return (
    <div ref={containerRef} className="crystal-lattice-container">
      <div className="crystal-lattice-info">
        <div className="crystal-lattice-title">RECIPROCAL SPACE VIEWER</div>
        <div className="crystal-lattice-status">
          Frame: {currentFrame} | {isPlaying ? "ACTIVE" : "PAUSED"}
        </div>
      </div>
    </div>
  );
}
