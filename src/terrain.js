// ============================================================================
// VECTR-8 // Simulation World Arena, Pads, Ramps, Stunt Loop & Surface Sampling
// ============================================================================

import { Vec3 } from './math.js';

export function createArena() {
  return {
    pads: [
      { id: 'PAD-0 (LAUNCH)', x: 0, y: 0, z: 0, w: 14, d: 16, h: 0.25, color: '#00e5ff', visited: true },
      { id: 'PAD-ALPHA', x: 0, y: 7.5, z: 42, w: 14, d: 14, h: 0.8, color: '#00ff9d', visited: false },
      { id: 'PAD-BETA', x: -36, y: 15.0, z: 72, w: 14, d: 14, h: 0.8, color: '#ff7b29', visited: false },
      { id: 'PAD-GAMMA', x: 38, y: 22.0, z: 54, w: 14, d: 14, h: 0.8, color: '#c864ff', visited: false },
    ],
    ramps: [
      { x: 0, zStart: 13, zEnd: 27, w: 9, yStart: 0, yEnd: 4.4 },
      { x: -19, zStart: 14, zEnd: 30, w: 9, yStart: 0, yEnd: 5.8 },
    ],
    // Giant Inverted Stunt Loop & Wall-Climb (Crescent Fan Car Test Structure)
    stuntLoop: {
      id: 'STUNT-CRESCENT-LOOP',
      x: -26,
      w: 10.5,
      zStart: 10,
      r: 12.0,
      maxTheta: 2.41, // ~138 degrees (curves past 90° into inverted overhang)
      entryZStart: -8,
      entryZEnd: 10,
    },
    rings: [
      { id: 0, x: 0, y: 4.8, z: 20, r: 4.3, normal: { x: 0, y: 0, z: 1 }, passed: false },
      { id: 1, x: 0, y: 10.8, z: 42, r: 4.3, normal: { x: 0, y: 0, z: 1 }, passed: false },
      { id: 2, x: -18, y: 14.0, z: 57, r: 4.5, normal: { x: -0.5, y: 0, z: 0.866 }, passed: false },
      { id: 3, x: -36, y: 18.5, z: 72, r: 4.3, normal: { x: 0, y: 0, z: 1 }, passed: false },
      { id: 4, x: 0, y: 21.0, z: 66, r: 4.6, normal: { x: 1, y: 0, z: 0 }, passed: false },
      { id: 5, x: 38, y: 25.5, z: 54, r: 4.3, normal: { x: 0, y: 0, z: -1 }, passed: false },
      { id: 6, x: 24, y: 15.0, z: 24, r: 4.5, normal: { x: 0, y: 0, z: -1 }, passed: false },
      { id: 7, x: 0, y: 7.0, z: 0, r: 4.5, normal: { x: 0, y: 0, z: -1 }, passed: false },
      // Apex Inverted Stunt Ring
      { id: 8, x: -26, y: 18.6, z: 20.0, r: 4.5, normal: { x: 0, y: 0.835, z: -0.55 }, passed: false },
    ],
  };
}

export function sampleSurface(arena, x, y, z) {
  let bestY = 0.0;
  let normal = { x: 0, y: 1, z: 0 };
  let point = { x, y: 0.0, z };
  let padHit = null;

  // 1. Landing Pads
  for (const pad of arena.pads) {
    const halfW = pad.w * 0.5;
    const halfD = pad.d * 0.5;
    if (
      x >= pad.x - halfW &&
      x <= pad.x + halfW &&
      z >= pad.z - halfD &&
      z <= pad.z + halfD &&
      y >= pad.y - 1.5
    ) {
      if (pad.y >= bestY) {
        bestY = pad.y;
        normal = { x: 0, y: 1, z: 0 };
        point = { x, y: pad.y, z };
        padHit = pad;
      }
    }
  }

  // 2. Linear Ramps
  for (const ramp of arena.ramps) {
    const halfW = ramp.w * 0.5;
    if (x >= ramp.x - halfW && x <= ramp.x + halfW && z >= ramp.zStart && z <= ramp.zEnd) {
      const t = (z - ramp.zStart) / (ramp.zEnd - ramp.zStart);
      const ry = ramp.yStart + t * (ramp.yEnd - ramp.yStart);
      if (y >= ry - 1.5 && ry > bestY) {
        bestY = ry;
        const dz = ramp.zEnd - ramp.zStart;
        const dy = ramp.yEnd - ramp.yStart;
        normal = Vec3.norm({ x: 0, y: dz, z: -dy });
        point = { x, y: ry, z };
        padHit = null;
      }
    }
  }

  // 3. Giant Inverted Crescent Stunt Loop & Vertical Wall
  const loop = arena.stuntLoop;
  if (loop) {
    const halfW = loop.w * 0.5;
    if (x >= loop.x - halfW && x <= loop.x + halfW) {
      // Approach flat runway
      if (z >= loop.entryZStart && z < loop.zStart) {
        if (bestY <= 0.05) {
          bestY = 0.0;
          normal = { x: 0, y: 1, z: 0 };
          point = { x, y: 0.0, z };
        }
      } else if (z >= loop.zStart - 1.0) {
        // Cylindrical arc in the (Z, Y) plane
        const Zc = loop.zStart;
        const Yc = loop.r;
        const dz = z - Zc;
        const dy = y - Yc;
        const theta = Math.atan2(dz, -dy);

        if (theta >= -0.05 && theta <= loop.maxTheta + 0.08) {
          const rCur = Math.hypot(dz, dy);
          const distToArc = loop.r - rCur; // >0 inside cylinder, <0 outside
          const surfY = Yc - loop.r * Math.cos(theta);
          const surfZ = Zc + loop.r * Math.sin(theta);
          const surfNormal = { x: 0, y: Math.cos(theta), z: -Math.sin(theta) };

          // If query point is near the curved track surface
          if (Math.abs(distToArc) < 3.2 || y > 1.0) {
            bestY = surfY;
            normal = surfNormal;
            point = { x, y: surfY, z: surfZ };
            padHit = { id: 'STUNT-LOOP', theta };
          }
        }
      }
    }
  }

  return { y: bestY, normal, point, pad: padHit };
}
