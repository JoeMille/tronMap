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
  console.log(
    "CrystalLatticeViewer mounted, resolutionShells:",
    resolutionShells
  );
  console.log("currentFrame:", currentFrame);
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

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x000000, 0.01);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(18, 14, 18);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0x222244, 1.2);
    scene.add(ambientLight);

    const mainLight = new THREE.PointLight(0x00d9ff, 4, 100);
    mainLight.position.set(12, 12, 12);
    mainLight.castShadow = true;
    scene.add(mainLight);
    lightsRef.current.push(mainLight);

    const accentLight1 = new THREE.PointLight(0xff00ff, 2.5, 80);
    accentLight1.position.set(-12, 8, -12);
    scene.add(accentLight1);
    lightsRef.current.push(accentLight1);

    const accentLight2 = new THREE.PointLight(0x00ff88, 2.5, 80);
    accentLight2.position.set(12, -8, -12);
    scene.add(accentLight2);
    lightsRef.current.push(accentLight2);

    const latticeGroup = new THREE.Group();
    latticeRef.current = latticeGroup;
    scene.add(latticeGroup);

    const unitCellSize = 16;
    const tubeRadius = 0.12;
    const radialSegments = 8;

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
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.8,
        shininess: 100,
      });

      const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
      tube.position.copy(start).add(direction.multiplyScalar(0.5));
      const axis = new THREE.Vector3(0, 1, 0);
      tube.quaternion.setFromUnitVectors(axis, direction.normalize());
      latticeGroup.add(tube);

      const sphereGeometry = new THREE.SphereGeometry(0.2, 16, 16);
      const sphereMaterial = new THREE.MeshPhongMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.9,
      });

      const startSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      startSphere.position.copy(start);
      latticeGroup.add(startSphere);
    });

    const energyFieldGeometry = new THREE.IcosahedronGeometry(11, 2);
    const energyFieldMaterial = new THREE.MeshPhongMaterial({
      color: 0x00d9ff,
      transparent: true,
      opacity: 0.02,
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

    const wireframeGeometry = new THREE.IcosahedronGeometry(11.3, 2);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x00d9ff,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });
    const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
    scene.add(wireframe);
    wireframeRef.current = wireframe;

    const gridHelper = new THREE.GridHelper(50, 50, 0x00d9ff, 0x003344);
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.12;
    gridHelper.position.y = -10;
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
        latticeRef.current.rotation.y += 0.005;
        latticeRef.current.rotation.x = Math.sin(time * 0.3) * 0.08;
      }

      if (energyFieldRef.current) {
        energyFieldRef.current.rotation.x = time * 0.2;
        energyFieldRef.current.rotation.y = time * 0.3;
        const breathe = 1 + Math.sin(time * 1.5) * 0.05;
        energyFieldRef.current.scale.set(breathe, breathe, breathe);
      }

      if (wireframeRef.current) {
        wireframeRef.current.rotation.x = time * -0.15;
        wireframeRef.current.rotation.y = time * 0.25;
      }

      reflectionPointsRef.current.forEach((points, index) => {
        if (points.material instanceof THREE.PointsMaterial) {
          const pulse = Math.sin(time * 2 + index * 0.5) * 0.2 + 0.8;
          const baseOpacity =
            (points.material as any).userData?.baseOpacity || 0.8;
          points.material.opacity = baseOpacity * pulse;
        }
        points.rotation.y = time * 0.1 * (index + 1);
        points.rotation.x = Math.sin(time * 0.3 + index) * 0.1;
      });

      if (cameraRef.current) {
        const radius = 35;
        cameraRef.current.position.x = Math.cos(time * 0.15) * radius;
        cameraRef.current.position.z = Math.sin(time * 0.15) * radius;
        cameraRef.current.position.y = 16 + Math.sin(time * 0.1) * 4;
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

    const intensityNormalized = Math.min(avgIntensity / 30, 1);
    const completenessNormalized = avgCompleteness / 100;

    if (
      energyFieldRef.current &&
      energyFieldRef.current.material instanceof THREE.MeshPhongMaterial
    ) {
      const targetEmissive = 0.2 + intensityNormalized * 0.5;
      energyFieldRef.current.material.emissiveIntensity = targetEmissive;

      const targetOpacity = 0.05 + completenessNormalized * 0.12;
      energyFieldRef.current.material.opacity = targetOpacity;

      const hue = intensityNormalized * 0.5;
      const color = new THREE.Color().setHSL(hue, 1, 0.5);
      energyFieldRef.current.material.color = color;
      energyFieldRef.current.material.emissive = color;
    }

    if (
      wireframeRef.current &&
      wireframeRef.current.material instanceof THREE.MeshBasicMaterial
    ) {
      wireframeRef.current.material.opacity =
        0.15 + completenessNormalized * 0.25;
    }

    if (lightsRef.current.length > 0) {
      lightsRef.current[0].intensity = 3 + intensityNormalized * 2.5;
      lightsRef.current[1].intensity = 1.5 + intensityNormalized * 2;
      lightsRef.current[2].intensity = 1.5 + completenessNormalized * 2;
    }

    if (latticeRef.current) {
      latticeRef.current.children.forEach((child) => {
        if (
          child instanceof THREE.Mesh &&
          child.material instanceof THREE.MeshPhongMaterial
        ) {
          if (child.geometry instanceof THREE.CylinderGeometry) {
            child.material.emissiveIntensity = 0.3 + intensityNormalized * 0.5;
            child.material.opacity = 0.7 + completenessNormalized * 0.3;
          } else if (child.geometry instanceof THREE.SphereGeometry) {
            child.material.emissiveIntensity = 0.6 + intensityNormalized * 0.4;
            const scale = 0.8 + intensityNormalized * 0.4;
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
      const numPoints = Math.min(Math.floor(shell.n_reflections / 8), 1000);
      const positions = new Float32Array(numPoints * 3);
      const colors = new Float32Array(numPoints * 3);

      const shellRadius = 5 + shellIndex * 2.8;

      for (let i = 0; i < numPoints; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        positions[i * 3] = shellRadius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = shellRadius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = shellRadius * Math.cos(phi);

        const intensity = Math.min(shell.i_over_sigma / 25, 1);
        colors[i * 3] = intensity * 0.3;
        colors[i * 3 + 1] = intensity * 0.95;
        colors[i * 3 + 2] = 1;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
      );
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      const canvas = document.createElement("canvas");
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, "rgba(255,255,255,1)");
        gradient.addColorStop(0.5, "rgba(255,255,255,0.5)");
        gradient.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);
      }

      const texture = new THREE.CanvasTexture(canvas);

      const material = new THREE.PointsMaterial({
        size: 4.0,
        vertexColors: true,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: false,
        map: texture,
      });

      (material as any).userData = {
        baseOpacity: (shell.completeness / 100) * 0.9,
        shellIndex: shellIndex,
      };

      const points = new THREE.Points(geometry, material);
      sceneRef.current?.add(points);
      reflectionPointsRef.current.push(points);
    });

    const intensityChange = Math.abs(
      avgIntensity - prevMetricsRef.current.avgIntensity
    );
    if (intensityChange > 2 && latticeRef.current) {
      const shakeIntensity = Math.min(intensityChange / 10, 0.3);
      latticeRef.current.rotation.z =
        Math.sin(Date.now() * 0.05) * shakeIntensity;
      setTimeout(() => {
        if (latticeRef.current) latticeRef.current.rotation.z = 0;
      }, 200);
    }

    prevMetricsRef.current = { avgIntensity, avgCompleteness };
  }, [resolutionShells, currentFrame]);

  return (
    <div ref={containerRef} className="crystal-lattice-container">
      <div className="crystal-lattice-info">
        <div className="crystal-lattice-title">RECIPROCAL SPACE VIEWER</div>
        <div className="crystal-lattice-status">
          Frame: {currentFrame} | {isPlaying ? "ACTIVE SCAN" : "STANDBY"}
          {resolutionShells && (
            <>
              <div style={{ marginTop: "4px", fontSize: "10px" }}>
                Avg I/σ:{" "}
                {(
                  resolutionShells.reduce((s, sh) => s + sh.i_over_sigma, 0) /
                  resolutionShells.length
                ).toFixed(1)}{" "}
                | Completeness:{" "}
                {(
                  resolutionShells.reduce((s, sh) => s + sh.completeness, 0) /
                  resolutionShells.length
                ).toFixed(1)}
                %
              </div>
              <div style={{ fontSize: "10px" }}>
                Total Reflections:{" "}
                {resolutionShells
                  .reduce((s, sh) => s + sh.n_reflections, 0)
                  .toLocaleString()}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
