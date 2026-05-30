"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface VectorSpaceProps {
  queryActive: boolean;
  queryText?: string;
  results?: Array<{
    id: number;
    document: string;
    text: string;
    score: number;
    vector_coords: number[];
  }>;
}

export default function VectorSpace({ queryActive, results }: VectorSpaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLinesRef = useRef<THREE.LineSegments | null>(null);
  const activeQueryNodeRef = useRef<THREE.Mesh | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 1000);
    camera.position.set(0, 0, 180);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Vector Space Cloud Group
    const spaceGroup = new THREE.Group();
    scene.add(spaceGroup);

    // Grid helper in bottom plane to look high-tech
    const gridHelper = new THREE.GridHelper(200, 20, 0xa855f7, 0x3b0764); // neon purple
    gridHelper.position.y = -60;
    gridHelper.material.opacity = 0.2;
    gridHelper.material.transparent = true;
    spaceGroup.add(gridHelper);

    // Point Cloud
    const particleCount = 200;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const colorPurple = new THREE.Color("#c084fc"); // purple-400
    const colorTeal = new THREE.Color("#2dd4bf");   // teal-400

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = THREE.MathUtils.randFloat(-80, 80);
      positions[i * 3 + 1] = THREE.MathUtils.randFloat(-50, 50);
      positions[i * 3 + 2] = THREE.MathUtils.randFloat(-80, 80);

      // Random color blends between purple and teal
      const mix = Math.random();
      const color = new THREE.Color().copy(colorPurple).lerp(colorTeal, mix);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    // Custom circle particle texture
    const createPointsTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
        grad.addColorStop(0, "rgba(255, 255, 255, 1)");
        grad.addColorStop(0.2, "rgba(192, 132, 252, 0.8)"); // purple aura
        grad.addColorStop(1, "rgba(192, 132, 252, 0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 16, 16);
      }
      return new THREE.CanvasTexture(canvas);
    };

    const material = new THREE.PointsMaterial({
      size: 3.5,
      map: createPointsTexture(),
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const pointCloud = new THREE.Points(geometry, material);
    spaceGroup.add(pointCloud);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(50, 100, 50);
    scene.add(dirLight);

    // Mouse Drag/Rotate Logic (Simulating simple OrbitControls manually to avoid packages issues)
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const handleMouseDown = () => {
      isDragging = true;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const deltaMove = {
        x: e.clientX - previousMousePosition.x,
        y: e.clientY - previousMousePosition.y,
      };

      if (isDragging) {
        const deltaRotationQuaternion = new THREE.Quaternion()
          .setFromEuler(
            new THREE.Euler(
              THREE.MathUtils.degToRad(deltaMove.y * 0.2),
              THREE.MathUtils.degToRad(deltaMove.x * 0.2),
              0,
              "XYZ"
            )
          );

        spaceGroup.quaternion.multiplyQuaternions(deltaRotationQuaternion, spaceGroup.quaternion);
      }

      previousMousePosition = {
        x: e.clientX,
        y: e.clientY,
      };
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Rotate group slowly if not actively dragging
      if (!isDragging) {
        spaceGroup.rotation.y += 0.0015;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Effect to project the query vector search visual triggers
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // 1. Remove previous query projections
    if (activeLinesRef.current) {
      scene.remove(activeLinesRef.current);
      activeLinesRef.current = null;
    }
    if (activeQueryNodeRef.current) {
      scene.remove(activeQueryNodeRef.current);
      activeQueryNodeRef.current = null;
    }

    if (queryActive && results && results.length > 0) {
      // Create a Central glowing Query Node (Teal Sphere)
      const queryGeo = new THREE.SphereGeometry(3, 16, 16);
      const queryMat = new THREE.MeshBasicMaterial({
        color: 0x2dd4bf, // teal neon
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      });
      const queryMesh = new THREE.Mesh(queryGeo, queryMat);
      // Place query at vector space center
      queryMesh.position.set(0, 0, 0);
      scene.add(queryMesh);
      activeQueryNodeRef.current = queryMesh;

      // Draw connection lines to simulated matched vector points
      const linePositions: number[] = [];
      results.forEach((match) => {
        const x = match.vector_coords[0] * 70;
        const y = match.vector_coords[1] * 40;
        const z = match.vector_coords[2] * 70;

        // Query Point (0,0,0) -> Match Node Vector Coordinates
        linePositions.push(0, 0, 0);
        linePositions.push(x, y, z);

        // Put a mini highlighted matched particle node at destination
        const matchGeo = new THREE.SphereGeometry(1.5, 8, 8);
        const matchMat = new THREE.MeshBasicMaterial({
          color: 0xf43f5e, // rose neon matches RAG citation
          transparent: true,
          opacity: 0.8,
        });
        const matchMesh = new THREE.Mesh(matchGeo, matchMat);
        matchMesh.position.set(x, y, z);
        queryMesh.add(matchMesh); // Add as child so it moves together
      });

      const lineGeom = new THREE.BufferGeometry();
      lineGeom.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(linePositions, 3)
      );
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x2dd4bf,
        linewidth: 1.5,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
      });

      const connectionLines = new THREE.LineSegments(lineGeom, lineMat);
      scene.add(connectionLines);
      activeLinesRef.current = connectionLines;

      // Animate Camera zoom/shift to look directly at the cluster
      queryMesh.scale.set(0.1, 0.1, 0.1);
      let scaleVal = 0.1;
      const scaleInterval = setInterval(() => {
        scaleVal += 0.15;
        if (scaleVal >= 1.0) {
          queryMesh.scale.set(1, 1, 1);
          clearInterval(scaleInterval);
        } else {
          queryMesh.scale.set(scaleVal, scaleVal, scaleVal);
        }
      }, 30);
    }
  }, [queryActive, results]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full cursor-grab active:cursor-grabbing" />
      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-purple-500/20 text-xs px-3 py-1.5 rounded-md text-purple-300 pointer-events-none select-none">
        💡 Drag to rotate 3D Vector Space
      </div>
    </div>
  );
}
