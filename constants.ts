export const GRID_SIZE = 200; // Logical resolution for physics
export const CANVAS_SCALE = 1; // Will scale visually via CSS/Transform

export const DEFAULT_CONFIG = {
  pheromoneDecay: 0.92,
  sensorAngle: Math.PI / 4,
  sensorDist: 9,
  rotationAngle: Math.PI / 4,
  agentSpeed: 1.5,
  adversarialPressure: 0.5,
  agentCount: 1500,
};

export const COLOR_AGENT = [100, 255, 150]; // Green
export const COLOR_RESOURCE = [50, 150, 255]; // Blue
export const COLOR_ADVERSARY = [255, 50, 80]; // Red
