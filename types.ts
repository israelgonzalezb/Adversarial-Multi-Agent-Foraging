export interface SimulationConfig {
  pheromoneDecay: number;
  sensorAngle: number;
  sensorDist: number;
  rotationAngle: number;
  agentSpeed: number;
  adversarialPressure: number; // 0 to 1
  agentCount: number;
}

export interface Agent {
  x: number;
  y: number;
  angle: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface ResourceCluster {
  x: number;
  y: number;
  radius: number;
  intensity: number;
}

export interface Adversary {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
}
