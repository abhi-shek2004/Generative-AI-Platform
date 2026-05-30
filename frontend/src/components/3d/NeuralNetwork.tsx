"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function NeuralNetwork() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 250;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Particle Group
    const group = new THREE.Group();
    scene.add(group);

    // Create Particles (Neural Nodes)
    const particleCount = 120;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities: { x: number; y: number; z: number }[] = [];

    const minRange = -180;
    const maxRange = 180;

    for (let i = 0; i < particleCount; i++) {
      const x = THREE.MathUtils.randFloat(minRange, maxRange);
      const y = THREE.MathUtils.randFloat(minRange, maxRange);
      const z = THREE.MathUtils.randFloat(minRange, maxRange);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      velocities.push({
        x: THREE.MathUtils.randFloat(-0.2, 0.2),
        y: THREE.MathUtils.randFloat(-0.2, 0.2),
        z: THREE.MathUtils.randFloat(-0.2, 0.2),
      });
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    // Custom glowing particle canvas texture
    const createCircleTexture = () => {
      const matCanvas = document.createElement("canvas");
      matCanvas.width = 16;
      matCanvas.height = 16;
      const ctx = matCanvas.getContext("2d");
      if (ctx) {
        const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
        grad.addColorStop(0, "rgba(56, 189, 248, 1)"); // sky-400
        grad.addColorStop(0.3, "rgba(56, 189, 248, 0.8)");
        grad.addColorStop(1, "rgba(56, 189, 248, 0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 16, 16);
      }
      const texture = new THREE.CanvasTexture(matCanvas);
      return texture;
    };

    const material = new THREE.PointsMaterial({
      size: 4,
      map: createCircleTexture(),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, material);
    group.add(particles);

    // Neural connections (Dynamic Lines)
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
    });

    // Mouse Interaction
    const mouse = new THREE.Vector2(0, 0);
    const targetMouse = new THREE.Vector2(0, 0);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      targetMouse.x = ((e.clientX - rect.left) / width) * 2 - 1;
      targetMouse.y = -((e.clientY - rect.top) / height) * 2 + 1;
    };

    window.addEventListener("mousemove", handleMouseMove);

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
    const tempPosition = new THREE.Vector3();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth mouse lag
      mouse.x += (targetMouse.x - mouse.x) * 0.05;
      mouse.y += (targetMouse.y - mouse.y) * 0.05;

      // Slow idle group rotation
      group.rotation.y += 0.001;
      group.rotation.x += 0.0005;

      // Mouse attraction pull
      const posArray = geometry.attributes.position.array as Float32Array;

      // Dynamic line builder array
      const linePositions: number[] = [];

      for (let i = 0; i < particleCount; i++) {
        // Move particles based on velocities
        posArray[i * 3] += velocities[i].x;
        posArray[i * 3 + 1] += velocities[i].y;
        posArray[i * 3 + 2] += velocities[i].z;

        // Boundary checks
        if (posArray[i * 3] < minRange || posArray[i * 3] > maxRange) velocities[i].x *= -1;
        if (posArray[i * 3 + 1] < minRange || posArray[i * 3 + 1] > maxRange) velocities[i].y *= -1;
        if (posArray[i * 3 + 2] < minRange || posArray[i * 3 + 2] > maxRange) velocities[i].z *= -1;

        // Mouse gravity influence
        tempPosition.set(posArray[i * 3], posArray[i * 3 + 1], posArray[i * 3 + 2]);
        tempPosition.applyMatrix4(group.matrixWorld); // project particle to absolute space

        const mouseWorld = new THREE.Vector3(mouse.x * 200, mouse.y * 200, 0);
        const dist = tempPosition.distanceTo(mouseWorld);

        if (dist < 100) {
          const force = (100 - dist) * 0.003;
          const pull = new THREE.Vector3()
            .subVectors(mouseWorld, tempPosition)
            .normalize()
            .multiplyScalar(force);
            
          // De-project back to group space to apply delta
          const invMatrix = new THREE.Matrix4().copy(group.matrixWorld).invert();
          pull.applyMatrix4(invMatrix);
          
          posArray[i * 3] += pull.x;
          posArray[i * 3 + 1] += pull.y;
          posArray[i * 3 + 2] += pull.z;
        }

        // Connect near particles
        for (let j = i + 1; j < particleCount; j++) {
          const dx = posArray[i * 3] - posArray[j * 3];
          const dy = posArray[i * 3 + 1] - posArray[j * 3 + 1];
          const dz = posArray[i * 3 + 2] - posArray[j * 3 + 2];
          const d = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (d < 65) {
            linePositions.push(posArray[i * 3], posArray[i * 3 + 1], posArray[i * 3 + 2]);
            linePositions.push(posArray[j * 3], posArray[j * 3 + 1], posArray[j * 3 + 2]);
          }
        }
      }

      geometry.attributes.position.needsUpdate = true;

      // Update Lines
      scene.remove(scene.getObjectByName("connections")!);
      if (linePositions.length > 0) {
        const lineGeom = new THREE.BufferGeometry();
        lineGeom.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(linePositions, 3)
        );
        const lineMesh = new THREE.LineSegments(lineGeom, lineMaterial);
        lineMesh.name = "connections";
        scene.add(lineMesh);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 -z-10 h-full w-full pointer-events-none" />;
}
