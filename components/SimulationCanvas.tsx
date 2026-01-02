import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SimulationConfig, Agent, ResourceCluster, Adversary } from '../types';
import { GRID_SIZE, COLOR_AGENT, COLOR_RESOURCE, COLOR_ADVERSARY } from '../constants';

interface SimulationCanvasProps {
  config: SimulationConfig;
  onFpsUpdate: (fps: number) => void;
}

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({ config, onFpsUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Physics State (Refs for mutable performance)
  const agentsRef = useRef<Float32Array>(new Float32Array(0)); // [x, y, angle] stride 3
  const pheromoneGridRef = useRef<Float32Array>(new Float32Array(GRID_SIZE * GRID_SIZE));
  const resourcesRef = useRef<ResourceCluster[]>([]);
  const adversariesRef = useRef<Adversary[]>([]);
  const reqIdRef = useRef<number>(0);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(0);
  
  // Initialize World
  const initWorld = useCallback(() => {
    // Generate Resources (Target Manifold)
    const clusters: ResourceCluster[] = [];
    for (let i = 0; i < 5; i++) {
      clusters.push({
        x: Math.random() * GRID_SIZE,
        y: Math.random() * GRID_SIZE,
        radius: 10 + Math.random() * 20,
        intensity: 0.5 + Math.random() * 0.5
      });
    }
    resourcesRef.current = clusters;

    // Generate Adversaries
    const advs: Adversary[] = [];
    for (let i = 0; i < 3; i++) {
      advs.push({
        x: Math.random() * GRID_SIZE,
        y: Math.random() * GRID_SIZE,
        radius: 8,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5
      });
    }
    adversariesRef.current = advs;

    // Reset Pheromones
    pheromoneGridRef.current.fill(0);
  }, []);

  // Initialize Agents (Resize buffer if needed)
  useEffect(() => {
    const count = config.agentCount;
    const currentSize = agentsRef.current.length / 3;
    
    if (count !== currentSize) {
      const newAgents = new Float32Array(count * 3);
      // Copy old agents if they exist, randomly init new ones
      for (let i = 0; i < count; i++) {
        if (i < currentSize) {
          newAgents[i * 3] = agentsRef.current[i * 3];
          newAgents[i * 3 + 1] = agentsRef.current[i * 3 + 1];
          newAgents[i * 3 + 2] = agentsRef.current[i * 3 + 2];
        } else {
          newAgents[i * 3] = Math.random() * GRID_SIZE;
          newAgents[i * 3 + 1] = Math.random() * GRID_SIZE;
          newAgents[i * 3 + 2] = Math.random() * Math.PI * 2;
        }
      }
      agentsRef.current = newAgents;
    }
  }, [config.agentCount]);

  useEffect(() => {
    initWorld();
  }, [initWorld]);

  // Main Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Offscreen buffer for pheromones visualization
    const gridImage = ctx.createImageData(GRID_SIZE, GRID_SIZE);
    const gridData = gridImage.data; // Uint8ClampedArray

    const animate = (time: number) => {
      // FPS Calculation
      frameCountRef.current++;
      if (time - lastTimeRef.current >= 1000) {
        onFpsUpdate(frameCountRef.current);
        frameCountRef.current = 0;
        lastTimeRef.current = time;
      }

      const agents = agentsRef.current;
      const pheromones = pheromoneGridRef.current;
      const resources = resourcesRef.current;
      const adversaries = adversariesRef.current;
      const count = config.agentCount;

      // --- 1. Update Adversaries ---
      for (const adv of adversaries) {
        adv.x += adv.vx;
        adv.y += adv.vy;
        // Bounce
        if (adv.x < 0 || adv.x >= GRID_SIZE) adv.vx *= -1;
        if (adv.y < 0 || adv.y >= GRID_SIZE) adv.vy *= -1;
      }

      // --- 2. Update Agents & Deposit ---
      for (let i = 0; i < count; i++) {
        const idx = i * 3;
        let x = agents[idx];
        let y = agents[idx + 1];
        let angle = agents[idx + 2];

        // Sensors
        const sensorDist = config.sensorDist;
        const sensorAngle = config.sensorAngle;

        // Helper to sample field (Pheromone + Resource - Adversary)
        const sample = (sx: number, sy: number) => {
          let ix = Math.floor(sx);
          let iy = Math.floor(sy);
          
          // Wrap coords
          if (ix < 0) ix += GRID_SIZE;
          if (ix >= GRID_SIZE) ix -= GRID_SIZE;
          if (iy < 0) iy += GRID_SIZE;
          if (iy >= GRID_SIZE) iy -= GRID_SIZE;

          const gridIdx = iy * GRID_SIZE + ix;
          
          let val = pheromones[gridIdx]; // Stigmergic trace

          // Add Resource pull
          for (const res of resources) {
            const dx = ix - res.x;
            const dy = iy - res.y;
            const distSq = dx*dx + dy*dy;
            if (distSq < res.radius * res.radius) {
              val += res.intensity * 5; // Strong attraction
            }
          }

          // Subtract Adversary push
          for (const adv of adversaries) {
            const dx = ix - adv.x;
            const dy = iy - adv.y;
            const distSq = dx*dx + dy*dy;
            const repRad = adv.radius * (1 + config.adversarialPressure * 2); 
            if (distSq < repRad * repRad) {
              val -= 10 * config.adversarialPressure; // Strong repulsion
            }
          }
          return val;
        };

        const leftX = x + Math.cos(angle + sensorAngle) * sensorDist;
        const leftY = y + Math.sin(angle + sensorAngle) * sensorDist;
        const centerX = x + Math.cos(angle) * sensorDist;
        const centerY = y + Math.sin(angle) * sensorDist;
        const rightX = x + Math.cos(angle - sensorAngle) * sensorDist;
        const rightY = y + Math.sin(angle - sensorAngle) * sensorDist;

        const lVal = sample(leftX, leftY);
        const cVal = sample(centerX, centerY);
        const rVal = sample(rightX, rightY);

        // Turn
        if (cVal > lVal && cVal > rVal) {
          // Keep straight
        } else if (cVal < lVal && cVal < rVal) {
           // Rotate randomly
           angle += (Math.random() - 0.5) * 2 * config.rotationAngle;
        } else if (lVal > rVal) {
          angle += config.rotationAngle;
        } else if (rVal > lVal) {
          angle -= config.rotationAngle;
        }

        // Move
        x += Math.cos(angle) * config.agentSpeed;
        y += Math.sin(angle) * config.agentSpeed;

        // Wrap World
        if (x < 0) x += GRID_SIZE;
        if (x >= GRID_SIZE) x -= GRID_SIZE;
        if (y < 0) y += GRID_SIZE;
        if (y >= GRID_SIZE) y -= GRID_SIZE;

        // Deposit Pheromone
        const ix = Math.floor(x);
        const iy = Math.floor(y);
        pheromones[iy * GRID_SIZE + ix] = Math.min(1, pheromones[iy * GRID_SIZE + ix] + 0.5);

        // Update Ref
        agents[idx] = x;
        agents[idx + 1] = y;
        agents[idx + 2] = angle;
      }

      // --- 3. Diffuse & Decay Pheromones (Box Blur) ---
      // We do a simplified in-place diffusion for speed (The "Exploit")
      // Normally we need a swap buffer, but for pheromones, slight errors are organic.
      const decay = config.pheromoneDecay;
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          const i = y * GRID_SIZE + x;
          
          // Simple 3x3 Average (Cross only for speed)
          //   U
          // L C R
          //   D
          
          const u = (y - 1 < 0 ? GRID_SIZE - 1 : y - 1) * GRID_SIZE + x;
          const d = (y + 1 >= GRID_SIZE ? 0 : y + 1) * GRID_SIZE + x;
          const l = y * GRID_SIZE + (x - 1 < 0 ? GRID_SIZE - 1 : x - 1);
          const r = y * GRID_SIZE + (x + 1 >= GRID_SIZE ? 0 : x + 1);

          const sum = pheromones[i] + pheromones[u] + pheromones[d] + pheromones[l] + pheromones[r];
          pheromones[i] = (sum / 5) * decay;

          // Render to ImageData buffer directly here to save a loop
          // Pheromones (Green Trace)
          const alpha = Math.min(255, Math.floor(pheromones[i] * 255));
          const pixelIdx = i * 4;
          
          // Base background
          gridData[pixelIdx] = 10;     // R
          gridData[pixelIdx + 1] = 10; // G
          gridData[pixelIdx + 2] = 15; // B
          gridData[pixelIdx + 3] = 255;

          // Add Pheromone trace
          if (alpha > 5) {
            gridData[pixelIdx + 1] += alpha; 
          }
        }
      }

      // --- 4. Render to Canvas ---
      
      // A. Draw Resources directly into ImageData
      for (const res of resources) {
        // Optimization: Bounding box only
        const r = Math.floor(res.radius);
        const startX = Math.max(0, Math.floor(res.x - r));
        const endX = Math.min(GRID_SIZE, Math.ceil(res.x + r));
        const startY = Math.max(0, Math.floor(res.y - r));
        const endY = Math.min(GRID_SIZE, Math.ceil(res.y + r));

        for (let yy = startY; yy < endY; yy++) {
          for (let xx = startX; xx < endX; xx++) {
            const dx = xx - res.x;
            const dy = yy - res.y;
            if (dx*dx + dy*dy < r*r) {
              const pIdx = (yy * GRID_SIZE + xx) * 4;
              gridData[pIdx] = Math.min(255, gridData[pIdx] + COLOR_RESOURCE[0]);
              gridData[pIdx+1] = Math.min(255, gridData[pIdx+1] + COLOR_RESOURCE[1]);
              gridData[pIdx+2] = Math.min(255, gridData[pIdx+2] + COLOR_RESOURCE[2]);
            }
          }
        }
      }

      // B. Draw Adversaries directly into ImageData
      for (const adv of adversaries) {
         const r = Math.floor(adv.radius * (1 + config.adversarialPressure));
         const startX = Math.max(0, Math.floor(adv.x - r));
         const endX = Math.min(GRID_SIZE, Math.ceil(adv.x + r));
         const startY = Math.max(0, Math.floor(adv.y - r));
         const endY = Math.min(GRID_SIZE, Math.ceil(adv.y + r));

        for (let yy = startY; yy < endY; yy++) {
          for (let xx = startX; xx < endX; xx++) {
            const dx = xx - adv.x;
            const dy = yy - adv.y;
            if (dx*dx + dy*dy < r*r) {
              const pIdx = (yy * GRID_SIZE + xx) * 4;
              gridData[pIdx] = Math.min(255, gridData[pIdx] + COLOR_ADVERSARY[0]);
              gridData[pIdx+1] = 0; // Kill green
              gridData[pIdx+2] = Math.min(255, gridData[pIdx+2] + COLOR_ADVERSARY[2]);
            }
          }
        }
      }

      // C. Draw Agents
      for (let i = 0; i < count; i++) {
        const ix = Math.floor(agents[i * 3]);
        const iy = Math.floor(agents[i * 3 + 1]);
        if (ix >= 0 && ix < GRID_SIZE && iy >= 0 && iy < GRID_SIZE) {
            const pIdx = (iy * GRID_SIZE + ix) * 4;
            gridData[pIdx] = 255;
            gridData[pIdx+1] = 255;
            gridData[pIdx+2] = 255;
        }
      }

      // Put image data
      ctx.putImageData(gridImage, 0, 0);

      reqIdRef.current = requestAnimationFrame(animate);
    };

    reqIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
    };
  }, [config, onFpsUpdate]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-black">
      <canvas
        ref={canvasRef}
        width={GRID_SIZE}
        height={GRID_SIZE}
        className="w-full h-full object-contain image-pixelated"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
};