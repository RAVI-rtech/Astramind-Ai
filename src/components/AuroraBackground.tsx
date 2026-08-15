import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface PlanetDef {
  name: string;
  radius: number;        // 3D sphere size
  distance: number;      // Orbit radius from Sun
  speed: number;         // Orbital speed
  rotationSpeed: number; // Self spin speed
  color: number;         // Base color
  emissive?: number;
  roughness?: number;
  metalness?: number;
  hasRings?: boolean;
  ringInnerRadius?: number;
  ringOuterRadius?: number;
  ringColor?: number;
  hasMoon?: boolean;
  moonRadius?: number;
  moonDistance?: number;
  moonSpeed?: number;
}

const PLANET_CONFIGS: PlanetDef[] = [
  {
    name: "Mercury",
    radius: 2.2,
    distance: 45,
    speed: 0.025,
    rotationSpeed: 0.01,
    color: 0x8c7c6d,
    roughness: 0.9,
  },
  {
    name: "Venus",
    radius: 4.2,
    distance: 70,
    speed: 0.018,
    rotationSpeed: -0.005,
    color: 0xe3bb76,
    roughness: 0.6,
  },
  {
    name: "Earth",
    radius: 4.8,
    distance: 105,
    speed: 0.012,
    rotationSpeed: 0.02,
    color: 0x2277ff,
    roughness: 0.4,
    hasMoon: true,
    moonRadius: 1.1,
    moonDistance: 9,
    moonSpeed: 0.05,
  },
  {
    name: "Mars",
    radius: 3.2,
    distance: 140,
    speed: 0.009,
    rotationSpeed: 0.018,
    color: 0xcc4422,
    roughness: 0.8,
  },
  {
    name: "Jupiter",
    radius: 12.0,
    distance: 200,
    speed: 0.005,
    rotationSpeed: 0.04,
    color: 0xd4a373,
    roughness: 0.5,
  },
  {
    name: "Saturn",
    radius: 9.5,
    distance: 260,
    speed: 0.0035,
    rotationSpeed: 0.035,
    color: 0xe6c875,
    roughness: 0.5,
    hasRings: true,
    ringInnerRadius: 13,
    ringOuterRadius: 22,
    ringColor: 0xd4b26f,
  },
  {
    name: "Uranus",
    radius: 6.8,
    distance: 310,
    speed: 0.0025,
    rotationSpeed: -0.025,
    color: 0x66ccff,
    roughness: 0.4,
    hasRings: true,
    ringInnerRadius: 8.5,
    ringOuterRadius: 12,
    ringColor: 0x88ddff,
  },
  {
    name: "Neptune",
    radius: 6.5,
    distance: 360,
    speed: 0.0018,
    rotationSpeed: 0.028,
    color: 0x3344ff,
    roughness: 0.4,
  },
];

interface AuroraBackgroundProps {
  isLightMode?: boolean;
}

export default function AuroraBackground({ isLightMode = false }: AuroraBackgroundProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // 1. SCENE & CAMERA
    const scene = new THREE.Scene();
    const fogColor = isLightMode ? 0xf1f5f9 : 0x030614;
    scene.fog = new THREE.FogExp2(fogColor, 0.0008);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
    // Initial camera placement for dramatic 3D perspective looking down at solar plane
    camera.position.set(0, 180, 420);
    camera.lookAt(0, -20, 0);

    // 2. RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isLightMode ? 1.0 : 1.2;
    container.appendChild(renderer.domElement);

    // 3. LIGHTING
    // Ambient dark universe fill
    const ambientColor = isLightMode ? 0x99aacc : 0x222244;
    const ambientLight = new THREE.AmbientLight(ambientColor, isLightMode ? 1.2 : 0.8);
    scene.add(ambientLight);

    // Sun Point Light
    const sunLight = new THREE.PointLight(0xfffaed, 3.5, 1200, 0.5);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    // Secondary subtle directional fill for high contrast shadows
    const dirLight = new THREE.DirectionalLight(0x445588, 0.4);
    dirLight.position.set(100, 300, 200);
    scene.add(dirLight);

    // 4. STARFIELD BACKGROUND (3D Particles)
    const starCount = 3500;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    const palette = [
      new THREE.Color(0xffffff),
      new THREE.Color(0xaaccff),
      new THREE.Color(0xffeeda),
      new THREE.Color(0xb388ff),
    ];

    for (let i = 0; i < starCount; i++) {
      // Radius distribution in large sphere around scene
      const r = 400 + Math.random() * 800;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = r * Math.cos(phi);

      const color = palette[Math.floor(Math.random() * palette.length)];
      starColors[i * 3] = color.r;
      starColors[i * 3 + 1] = color.g;
      starColors[i * 3 + 2] = color.b;
    }

    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute("color", new THREE.BufferAttribute(starColors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 1.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    // 5. THE SUN (3D Sphere + Glow Coronas)
    const sunGroup = new THREE.Group();
    
    // Core Mesh
    const sunGeo = new THREE.SphereGeometry(24, 64, 64);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xffcc33,
    });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunGroup.add(sunMesh);

    // Sun Inner Glow Atmosphere
    const glowGeo = new THREE.SphereGeometry(26.5, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xff9900,
      transparent: true,
      opacity: 0.35,
      side: THREE.BackSide,
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    sunGroup.add(glowMesh);

    // Outer Corona Halo
    const haloGeo = new THREE.SphereGeometry(32, 32, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    sunGroup.add(haloMesh);

    scene.add(sunGroup);

    // 6. ASTEROID BELT (Particles between Mars & Jupiter, distance 160 to 185)
    const asteroidCount = 1800;
    const asteroidGeo = new THREE.BufferGeometry();
    const asteroidPositions = new Float32Array(asteroidCount * 3);

    for (let i = 0; i < asteroidCount; i++) {
      const radius = 162 + Math.random() * 24;
      const angle = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 8; // slight inclination variance

      asteroidPositions[i * 3] = Math.cos(angle) * radius;
      asteroidPositions[i * 3 + 1] = y;
      asteroidPositions[i * 3 + 2] = Math.sin(angle) * radius;
    }

    asteroidGeo.setAttribute("position", new THREE.BufferAttribute(asteroidPositions, 3));
    const asteroidMat = new THREE.PointsMaterial({
      size: 1.2,
      color: 0xaa9988,
      transparent: true,
      opacity: 0.6,
    });
    const asteroidBelt = new THREE.Points(asteroidGeo, asteroidMat);
    scene.add(asteroidBelt);

    // 7. PLANETS & ORBITS
    interface PlanetNode {
      def: PlanetDef;
      mesh: THREE.Mesh;
      pivot: THREE.Group;
      angle: number;
      moonMesh?: THREE.Mesh;
      moonPivot?: THREE.Group;
      moonAngle?: number;
    }

    const planetNodes: PlanetNode[] = [];

    PLANET_CONFIGS.forEach((p) => {
      // Create Orbit Ring
      const orbitCurve = new THREE.EllipseCurve(0, 0, p.distance, p.distance, 0, 2 * Math.PI, false, 0);
      const points = orbitCurve.getPoints(128);
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(
        points.map((pt) => new THREE.Vector3(pt.x, 0, pt.y))
      );
      const orbitMat = new THREE.LineBasicMaterial({
        color: 0x7755aa,
        transparent: true,
        opacity: 0.18,
      });
      const orbitLine = new THREE.LineLoop(orbitGeo, orbitMat);
      scene.add(orbitLine);

      // Pivot group at Sun center for easy orbital rotation
      const pivot = new THREE.Group();
      scene.add(pivot);

      // Planet Sphere Geometry & Material
      const planetGeo = new THREE.SphereGeometry(p.radius, 32, 32);
      const planetMat = new THREE.MeshStandardMaterial({
        color: p.color,
        roughness: p.roughness ?? 0.6,
        metalness: p.metalness ?? 0.1,
      });
      const planetMesh = new THREE.Mesh(planetGeo, planetMat);

      // Position along orbit
      const initialAngle = Math.random() * Math.PI * 2;
      planetMesh.position.set(Math.cos(initialAngle) * p.distance, 0, Math.sin(initialAngle) * p.distance);
      pivot.add(planetMesh);

      // Rings (Saturn / Uranus)
      if (p.hasRings && p.ringInnerRadius && p.ringOuterRadius) {
        const ringGeo = new THREE.RingGeometry(p.ringInnerRadius, p.ringOuterRadius, 64);
        // Rotate ring to align horizontally with planet plane
        ringGeo.rotateX(Math.PI / 2.3);
        const ringMat = new THREE.MeshStandardMaterial({
          color: p.ringColor || p.color,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8,
          roughness: 0.3,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        planetMesh.add(ringMesh);
      }

      // Moon (Earth)
      let moonMesh: THREE.Mesh | undefined;
      let moonPivot: THREE.Group | undefined;
      if (p.hasMoon && p.moonRadius && p.moonDistance) {
        moonPivot = new THREE.Group();
        planetMesh.add(moonPivot);

        const moonGeo = new THREE.SphereGeometry(p.moonRadius, 16, 16);
        const moonMat = new THREE.MeshStandardMaterial({
          color: 0xdddddd,
          roughness: 0.9,
        });
        moonMesh = new THREE.Mesh(moonGeo, moonMat);
        moonMesh.position.set(p.moonDistance, 0, 0);
        moonPivot.add(moonMesh);
      }

      planetNodes.push({
        def: p,
        mesh: planetMesh,
        pivot,
        angle: initialAngle,
        moonMesh,
        moonPivot,
        moonAngle: 0,
      });
    });

    // 8. MOUSE INTERACTION & SMOOTH CAMERA PARALLAX
    let targetX = 0;
    let targetY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX - width / 2) / (width / 2); // -1 to 1
      mouseY = (e.clientY - height / 2) / (height / 2); // -1 to 1
    };

    window.addEventListener("mousemove", handleMouseMove);

    // 9. ANIMATION LOOP
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Sun self-rotation & subtle pulsing core glow
      sunMesh.rotation.y += 0.003;
      glowMesh.rotation.y -= 0.002;
      const pulse = 1 + Math.sin(elapsedTime * 1.5) * 0.03;
      glowMesh.scale.set(pulse, pulse, pulse);

      // Rotate Asteroid Belt
      asteroidBelt.rotation.y += 0.0004;

      // Rotate Starfield gently
      starField.rotation.y += 0.0001;

      // Update Planet Orbits and Rotations
      planetNodes.forEach((node) => {
        // Orbit around Sun
        node.angle += node.def.speed * delta * 15;
        node.mesh.position.x = Math.cos(node.angle) * node.def.distance;
        node.mesh.position.z = Math.sin(node.angle) * node.def.distance;

        // Self rotation on axis
        node.mesh.rotation.y += node.def.rotationSpeed;

        // Moon orbit
        if (node.moonPivot && node.def.moonSpeed) {
          node.moonAngle = (node.moonAngle || 0) + node.def.moonSpeed;
          node.moonPivot.rotation.y = node.moonAngle;
        }
      });

      // Smooth camera interpolation (Lerp) towards mouse offset
      targetX += (mouseX * 80 - targetX) * 0.03;
      targetY += (mouseY * 40 - targetY) * 0.03;

      camera.position.x = targetX;
      camera.position.y = 180 - targetY;
      camera.lookAt(0, -15, 0);

      renderer.render(scene, camera);
    };

    animate();

    // 10. RESIZE HANDLER
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;

      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(newWidth, newHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener("resize", handleResize);

    // CLEANUP
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }

      // Dispose geometries & materials
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.LineLoop) {
          object.geometry?.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((m) => m.dispose());
          } else {
            object.material?.dispose();
          }
        }
      });
      renderer.dispose();
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#030614]">
      {/* ThreeJS WebGL Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Subtle Radial Vignette for Content Readability */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(3,6,20,0.85)_100%)] pointer-events-none" />
    </div>
  );
}
