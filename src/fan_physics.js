// ============================================================================
// VECTR-8 // 60 kW Underbody Suction Ventilator (Fan Car Fluid Dynamics & Skirt Seal)
// ============================================================================

import { Vec3, Quat } from './math.js';
import { sampleSurface } from './terrain.js';

export function calculateFanSuction(sim) {
  const surfUnder = sampleSurface(sim.arena, sim.pos.x, sim.pos.y, sim.pos.z);
  const carUpWorld = Quat.rotate(sim.quat, { x: 0, y: 1, z: 0 });
  const alignmentCos = Vec3.dot(carUpWorld, surfUnder.normal);
  const distNorm =
    (sim.pos.x - surfUnder.point.x) * surfUnder.normal.x +
    (sim.pos.y - surfUnder.point.y) * surfUnder.normal.y +
    (sim.pos.z - surfUnder.point.z) * surfUnder.normal.z;
  const underbodyClearance = distNorm * Math.max(0.2, alignmentCos) - 0.35;

  // Skirt extends `sim.skirtLength` (0.31m) below chassis underbody
  const rawGap = underbodyClearance - sim.skirtLength;
  const tiltLeakPenalty = Math.max(0, (1 - alignmentCos) * 0.65);
  const sealGapMeters = Math.max(0.0025, Math.max(0, rawGap) + tiltLeakPenalty);

  let suctionVacuumPa = 0;
  let suctionForceMag = 0;
  let suctionForceWorld = { x: 0, y: 0, z: 0 };
  let alignTorqueBody = { x: 0, y: 0, z: 0 };
  let skirtDragWorld = { x: 0, y: 0, z: 0 };

  if (sim.fanEnabled && alignmentCos > 0.45 && underbodyClearance < 1.2) {
    // Leakage orifice area around perimeter skirt: A_leak = Cd * Perimeter * h_gap
    const cd = 0.65;
    const rhoAir = 1.225;
    const aLeak = cd * sim.fanPerimeter * sealGapMeters;
    const fanEfficiency = 0.74;
    const maxStallVacuumPa = 5900; // ~5.9 kPa max vacuum at 60 kW

    // P_fan * eta = dP * Q = dP * A_leak * sqrt(2 * dP / rho)
    // => dP = ( (P_fan * eta) / (A_leak * sqrt(2 / rho)) )^(2/3)
    const numerator = sim.fanPowerWatts * fanEfficiency;
    const denom = aLeak * Math.sqrt(2 / rhoAir);
    const dP = Math.min(maxStallVacuumPa, Math.pow(numerator / Math.max(1e-5, denom), 2 / 3));

    suctionVacuumPa = dP;
    suctionForceMag = dP * sim.fanPlenumArea; // Up to ~24.7 kN when sealed!

    // Suction pulls the car perpendicular into the flat surface (-surfUnder.normal)
    suctionForceWorld = Vec3.scale(surfUnder.normal, -suctionForceMag);

    // Self-aligning suction skirt torque when close to surface
    if (sealGapMeters < 0.09) {
      const alignAxisWorld = Vec3.cross(carUpWorld, surfUnder.normal);
      alignTorqueBody = Vec3.scale(
        Quat.invRotate(sim.quat, alignAxisWorld),
        suctionForceMag * 0.45
      );
    }

    // Skirt rubbing drag if skirt physically contacts surface (rawGap < 0)
    if (rawGap < 0) {
      skirtDragWorld = Vec3.scale(sim.vel, -140);
    }
  }

  return {
    suctionVacuumPa,
    suctionForceMag,
    suctionForceWorld,
    alignTorqueBody,
    skirtDragWorld,
    sealGapMeters,
  };
}
