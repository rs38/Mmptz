// ============================================================================
// VECTR-8 // Vehicle Architecture, Thruster Geometry & Wheel Mount Configurations
// ============================================================================

export function createDefaultThrusters() {
  return {
    D_FL: {
      id: 'D_FL',
      name: 'Front-Left Down',
      group: 'down',
      pos: { x: -0.84, y: -0.42, z: 1.42 },
      baseDir: { x: 0, y: 1, z: 0 },
      plumeDir: { x: 0, y: -1, z: 0 },
      sliderPct: 100,
      throttle: 0,
      currentForce: 0,
      worldPos: { x: 0, y: 0, z: 0 },
      worldForce: { x: 0, y: 0, z: 0 },
      worldPlumeDir: { x: 0, y: -1, z: 0 },
    },
    D_FR: {
      id: 'D_FR',
      name: 'Front-Right Down',
      group: 'down',
      pos: { x: 0.84, y: -0.42, z: 1.42 },
      baseDir: { x: 0, y: 1, z: 0 },
      plumeDir: { x: 0, y: -1, z: 0 },
      sliderPct: 100,
      throttle: 0,
      currentForce: 0,
      worldPos: { x: 0, y: 0, z: 0 },
      worldForce: { x: 0, y: 0, z: 0 },
      worldPlumeDir: { x: 0, y: -1, z: 0 },
    },
    D_RL: {
      id: 'D_RL',
      name: 'Rear-Left Down',
      group: 'down',
      pos: { x: -0.84, y: -0.42, z: -1.42 },
      baseDir: { x: 0, y: 1, z: 0 },
      plumeDir: { x: 0, y: -1, z: 0 },
      sliderPct: 100,
      throttle: 0,
      currentForce: 0,
      worldPos: { x: 0, y: 0, z: 0 },
      worldForce: { x: 0, y: 0, z: 0 },
      worldPlumeDir: { x: 0, y: -1, z: 0 },
    },
    D_RR: {
      id: 'D_RR',
      name: 'Rear-Right Down',
      group: 'down',
      pos: { x: 0.84, y: -0.42, z: -1.42 },
      baseDir: { x: 0, y: 1, z: 0 },
      plumeDir: { x: 0, y: -1, z: 0 },
      sliderPct: 100,
      throttle: 0,
      currentForce: 0,
      worldPos: { x: 0, y: 0, z: 0 },
      worldForce: { x: 0, y: 0, z: 0 },
      worldPlumeDir: { x: 0, y: -1, z: 0 },
    },
    S_FL: {
      id: 'S_FL',
      name: 'Front-Left Side',
      group: 'side',
      pos: { x: -0.98, y: -0.08, z: 1.42 },
      baseDir: { x: 1, y: 0, z: 0 }, // Pushes car Right (+X)
      plumeDir: { x: -1, y: 0, z: 0 },
      sliderPct: 100,
      throttle: 0,
      currentForce: 0,
      worldPos: { x: 0, y: 0, z: 0 },
      worldForce: { x: 0, y: 0, z: 0 },
      worldPlumeDir: { x: -1, y: 0, z: 0 },
    },
    S_FR: {
      id: 'S_FR',
      name: 'Front-Right Side',
      group: 'side',
      pos: { x: 0.98, y: -0.08, z: 1.42 },
      baseDir: { x: -1, y: 0, z: 0 }, // Pushes car Left (-X)
      plumeDir: { x: 1, y: 0, z: 0 },
      sliderPct: 100,
      throttle: 0,
      currentForce: 0,
      worldPos: { x: 0, y: 0, z: 0 },
      worldForce: { x: 0, y: 0, z: 0 },
      worldPlumeDir: { x: 1, y: 0, z: 0 },
    },
    S_RL: {
      id: 'S_RL',
      name: 'Rear-Left Side',
      group: 'side',
      pos: { x: -0.98, y: -0.08, z: -1.42 },
      baseDir: { x: 1, y: 0, z: 0 }, // Pushes car Right (+X)
      plumeDir: { x: -1, y: 0, z: 0 },
      sliderPct: 100,
      throttle: 0,
      currentForce: 0,
      worldPos: { x: 0, y: 0, z: 0 },
      worldForce: { x: 0, y: 0, z: 0 },
      worldPlumeDir: { x: -1, y: 0, z: 0 },
    },
    S_RR: {
      id: 'S_RR',
      name: 'Rear-Right Side',
      group: 'side',
      pos: { x: 0.98, y: -0.08, z: -1.42 },
      baseDir: { x: -1, y: 0, z: 0 }, // Pushes car Left (-X)
      plumeDir: { x: 1, y: 0, z: 0 },
      sliderPct: 100,
      throttle: 0,
      currentForce: 0,
      worldPos: { x: 0, y: 0, z: 0 },
      worldForce: { x: 0, y: 0, z: 0 },
      worldPlumeDir: { x: 1, y: 0, z: 0 },
    },
  };
}

export function createDefaultWheels() {
  return [
    { id: 'W_FL', isFront: true, isRear: false, pos: { x: -0.92, y: -0.35, z: 1.38 }, compression: 0, ratio: 0, grounded: false, bottomedOut: false, wheelspin: false, normalForce: 0 },
    { id: 'W_FR', isFront: true, isRear: false, pos: { x: 0.92, y: -0.35, z: 1.38 }, compression: 0, ratio: 0, grounded: false, bottomedOut: false, wheelspin: false, normalForce: 0 },
    { id: 'W_RL', isFront: false, isRear: true, pos: { x: -0.92, y: -0.35, z: -1.38 }, compression: 0, ratio: 0, grounded: false, bottomedOut: false, wheelspin: false, normalForce: 0 },
    { id: 'W_RR', isFront: false, isRear: true, pos: { x: 0.92, y: -0.35, z: -1.38 }, compression: 0, ratio: 0, grounded: false, bottomedOut: false, wheelspin: false, normalForce: 0 },
  ];
}

export const HULL_CHECK_POINTS = [
  { id: 'FL', pos: { x: -0.88, y: -0.32, z: 2.15 } },
  { id: 'FR', pos: { x: 0.88, y: -0.32, z: 2.15 } },
  { id: 'RL', pos: { x: -0.88, y: -0.28, z: -2.15 } },
  { id: 'RR', pos: { x: 0.88, y: -0.28, z: -2.15 } },
  { id: 'ROOF_L', pos: { x: -0.70, y: 0.58, z: 0.2 } },
  { id: 'ROOF_R', pos: { x: 0.70, y: 0.58, z: 0.2 } },
];

export function calculateInertia(mass, dims) {
  return {
    x: (mass / 12) * (dims.h ** 2 + dims.l ** 2),
    y: (mass / 12) * (dims.w ** 2 + dims.l ** 2),
    z: (mass / 12) * (dims.w ** 2 + dims.h ** 2),
  };
}
