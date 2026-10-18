// ============================================================================
// VECTR-8 // Thruster Allocation, Attitude Torques & Propellant Mass Flow
// ============================================================================

import { Vec3, Quat } from './math.js';

export function calculateThrusters(sim, dt, controls, euler, isAirborne, collective) {
  const forwardInput = controls.forward - controls.backward;
  const strafeInput = controls.right - controls.left;
  const yawInput = controls.yawRight - controls.yawLeft;
  const rollInput = controls.rollRight - controls.rollLeft;

  let pitchCmd = 0;
  let rollCmd = 0;
  let yawCmd = yawInput * 0.75;
  const thrustersActive = isAirborne || collective > 0.05 || controls.up > 0;

  if (sim.stabilizerEnabled && sim.sliderMode !== 'direct') {
    const targetPitch = isAirborne ? -forwardInput * 0.21 : 0;
    const targetRoll = rollInput * 0.28 - (isAirborne ? strafeInput * 0.08 : 0);
    pitchCmd = (targetPitch - euler.pitch) * 1.65 - (-sim.omega.x) * 0.55;
    rollCmd = (targetRoll - euler.roll) * 1.65 - sim.omega.z * 0.55;
    yawCmd = yawInput * 0.75 - (isAirborne ? sim.omega.y * 0.5 : 0);
  } else {
    pitchCmd = isAirborne ? -forwardInput * 0.35 : 0;
    rollCmd = -rollInput * 0.35;
    yawCmd = yawInput * 0.75;
  }

  const dThrottle = {
    D_FL: thrustersActive ? collective + pitchCmd - rollCmd : 0,
    D_FR: thrustersActive ? collective + pitchCmd + rollCmd : 0,
    D_RL: thrustersActive ? collective - pitchCmd - rollCmd : 0,
    D_RR: thrustersActive ? collective - pitchCmd + rollCmd : 0,
  };

  const strafeRight = isAirborne ? Math.max(0, strafeInput) : 0;
  const strafeLeft = isAirborne ? Math.max(0, -strafeInput) : 0;
  const yawCW = Math.max(0, yawCmd);
  const yawCCW = Math.max(0, -yawCmd);

  const sThrottle = {
    S_FL: strafeRight + yawCW,
    S_RL: strafeRight + yawCCW,
    S_FR: strafeLeft + yawCCW,
    S_RR: strafeLeft + yawCW,
  };

  const nozzleTiltZ = isAirborne ? forwardInput * 0.28 : 0;
  let thrustForceWorld = { x: 0, y: 0, z: 0 };
  let thrustTorqueBody = { x: 0, y: 0, z: 0 };
  let sumThrustMag = 0;

  // Cold Gas COPV Blowdown Pressure & Expansion Chill Dynamics
  const massRatio = Math.max(0, Math.min(1, sim.fuelMass / Math.max(1, sim.fuelCapacity)));
  // Polytropic blowdown pressure: P(t) = P_rated * (m / m_cap)^gamma (gamma ≈ 1.25 for blowdown with adiabatic chill)
  sim.tankPressureBar = sim.tankRatedPressureBar * Math.pow(massRatio, 1.25);
  // Adiabatic expansion cooling (Joule-Thomson / isentropic chill)
  sim.tankTemperatureK = 293.15 * Math.pow(Math.max(0.01, massRatio), 0.22);
  const pressureRatio = Math.max(0, sim.tankPressureBar / sim.tankRatedPressureBar);
  const tempRatio = Math.sqrt(Math.max(0.1, sim.tankTemperatureK / 293.15));

  // Exhaust velocity drops with gas stagnation temperature: v_e = v_e0 * sqrt(T/T0)
  sim.exhaustVelocity = sim.baseExhaustVelocity * tempRatio;
  const hasPressure = sim.tankPressureBar > 0.5 && massRatio > 0.001;

  for (const key of Object.keys(sim.thrusters)) {
    const t = sim.thrusters[key];
    const baseCap = t.group === 'down' ? sim.downMaxForce : sim.sideMaxForce;
    // Cold gas thruster maximum output decreases directly with remaining tank pressure!
    const maxCap = baseCap * pressureRatio;
    const sliderRatio = t.sliderPct / 100;
    let forceMag = 0;

    if (hasPressure) {
      if (sim.sliderMode === 'direct') {
        t.throttle = sliderRatio;
        forceMag = maxCap * sliderRatio;
      } else {
        const rawThrottle = t.group === 'down' ? dThrottle[key] : sThrottle[key];
        const clamped = Math.max(0, Math.min(1.0, rawThrottle));
        t.throttle = clamped * sliderRatio;
        forceMag = maxCap * sliderRatio * clamped;
      }
    } else {
      t.throttle = 0;
      forceMag = 0;
    }

    t.currentForce = forceMag;
    sumThrustMag += forceMag;

    let localDir = t.baseDir;
    let localPlume = t.plumeDir;
    if (t.group === 'down' && Math.abs(nozzleTiltZ) > 0.001) {
      localDir = Vec3.norm({ x: 0, y: Math.cos(nozzleTiltZ), z: Math.sin(nozzleTiltZ) });
      localPlume = Vec3.scale(localDir, -1);
    }

    const fBody = Vec3.scale(localDir, forceMag);
    const fWorld = Quat.rotate(sim.quat, fBody);
    const tauBody = Vec3.cross(t.pos, fBody);

    thrustForceWorld = Vec3.add(thrustForceWorld, fWorld);
    thrustTorqueBody = Vec3.add(thrustTorqueBody, tauBody);

    t.worldPos = Vec3.add(sim.pos, Quat.rotate(sim.quat, t.pos));
    t.worldForce = fWorld;
    t.worldPlumeDir = Quat.rotate(sim.quat, localPlume);
  }

  if (sumThrustMag > 1 && hasPressure) {
    sim.fuelBurnRate = sumThrustMag / Math.max(200, sim.exhaustVelocity);
    sim.fuelMass = Math.max(0, sim.fuelMass - sim.fuelBurnRate * dt);
    if (sim.fuelMass <= 0.001 || sim.tankPressureBar <= 1.0) {
      sim.fuelMass = 0;
      sim.tankPressureBar = 0;
      sim.lastEventMessage = 'COLD GAS COPV TANK DEPRESSURIZED (0 bar) — PRESS [T] TO RECHARGE!';
    }
  } else {
    sim.fuelBurnRate = 0;
    if (sim.fuelMass <= 0.001) sim.tankPressureBar = 0;
  }

  return { thrustForceWorld, thrustTorqueBody, sumThrustMag };
}
