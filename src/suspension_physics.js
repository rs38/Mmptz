// ============================================================================
// VECTR-8 // 4-Wheel Suspension Raycasts, 1000kW RWD & Coulomb Friction Circles
// ============================================================================

import { Vec3, Quat } from './math.js';
import { sampleSurface } from './terrain.js';

export function stepSuspension(sim, localVel, forwardInput) {
  const restLength = sim.suspensionRestLength;
  // Scale spring stiffness so equilibrium sag is ~32% of travel under 1G weight
  const baseSpringK = (1400 * 9.81) / (4 * Math.max(0.12, restLength * 0.34));
  const damperC = 4400;

  let totalForceWorld = { x: 0, y: 0, z: 0 };
  let totalTorqueBody = { x: 0, y: 0, z: 0 };
  let groundedWheels = 0;
  sim.currentRwdForce = 0;

  for (const w of sim.wheels) {
    const mountWorld = Vec3.add(sim.pos, Quat.rotate(sim.quat, w.pos));
    const surf = sampleSurface(sim.arena, mountWorld.x, mountWorld.y, mountWorld.z);
    const dist =
      (mountWorld.x - surf.point.x) * surf.normal.x +
      (mountWorld.y - surf.point.y) * surf.normal.y +
      (mountWorld.z - surf.point.z) * surf.normal.z;

    if (dist < restLength && dist > -1.2) {
      w.grounded = true;
      groundedWheels++;
      const rawCompression = restLength - dist;
      const clampedComp = Math.min(restLength, Math.max(0, rawCompression));
      w.compression = clampedComp;
      w.ratio = clampedComp / restLength;

      const rBody = w.pos;
      const vPointBody = Vec3.add(localVel, Vec3.cross(sim.omega, rBody));
      const vPointWorld = Quat.rotate(sim.quat, vPointBody);
      const vNormal = Vec3.dot(vPointWorld, surf.normal);

      // Normal suspension spring + damper force
      let springForceMag = Math.max(0, baseSpringK * clampedComp - damperC * vNormal);

      // Check if impact exceeds suspension travel (Bottoming Out!)
      if (rawCompression >= restLength) {
        w.bottomedOut = true;
        const overTravel = rawCompression - restLength;
        // Hard metal-on-metal bump stop impulse
        const bumpStopForce = overTravel * 185000 - Math.min(0, vNormal) * 19000;
        springForceMag += Math.max(0, bumpStopForce);

        // Trigger Crash Visualization if impact speed into bump-stop is severe
        if (vNormal < -3.1 && sim.crashCooldown <= 0) {
          const impactG = Math.min(45, Math.abs(vNormal) * 2.6 + overTravel * 35);
          sim.recordCrash(mountWorld, surf.normal, impactG, w.id);
        }
      } else {
        w.bottomedOut = false;
      }

      w.normalForce = springForceMag;
      const fSpringWorld = Vec3.scale(surf.normal, springForceMag);

      // Wheel coordinate frame (Front wheels rotate by currentSteerAngle)
      const steer = w.isFront ? sim.currentSteerAngle : 0;
      const wheelRightBody = { x: Math.cos(steer), y: 0, z: -Math.sin(steer) };
      const wheelFwdBody = { x: Math.sin(steer), y: 0, z: Math.cos(steer) };
      const wheelRightWorld = Quat.rotate(sim.quat, wheelRightBody);
      const wheelFwdWorld = Quat.rotate(sim.quat, wheelFwdBody);

      const vLat = Vec3.dot(vPointWorld, wheelRightWorld);
      const vLong = Vec3.dot(vPointWorld, wheelFwdWorld);

      // Tire grip limit (Coulomb friction circle: F_max = mu * N)
      const muTire = 1.32;
      const maxGripForce = muTire * springForceMag;

      // Lateral cornering force
      const rawLatForce = -vLat * 5200;
      const clampedLatForce = Math.max(-maxGripForce, Math.min(maxGripForce, rawLatForce));
      const fLatWorld = Vec3.scale(wheelRightWorld, clampedLatForce);

      // Classic RWD Longitudinal Drive (up to 1000 kW split across the 2 rear wheels!)
      let driveForce = -vLong * 140; // Rolling resistance
      w.wheelspin = false;

      if (w.isRear && Math.abs(forwardInput) > 0.01 && sim.rwdMaxPowerKW > 0) {
        const wheelPowerWatts = sim.rwdMaxPowerKW * 1000 * 0.5 * Math.abs(forwardInput);
        const effSpeed = Math.max(4.5, Math.abs(vLong)); // Low-speed torque plateau below 4.5 m/s
        const maxAxleTorqueForce = 14500 * (sim.rwdMaxPowerKW / 1000); // N per rear wheel
        const rawMotorForce = Math.min(maxAxleTorqueForce, wheelPowerWatts / effSpeed);

        // Remaining traction budget after lateral cornering
        const remGrip = Math.sqrt(Math.max(0, maxGripForce * maxGripForce - clampedLatForce * clampedLatForce));
        if (rawMotorForce > remGrip) {
          w.wheelspin = true;
        }
        const actualTireDrive = Math.min(rawMotorForce, remGrip) * Math.sign(forwardInput);
        driveForce += actualTireDrive;
        sim.currentRwdForce += actualTireDrive;
      } else if (w.isFront && forwardInput < -0.01 && vLong > 0.5) {
        // Front disc brakes assist when braking (pressing S while moving forward)
        const brakeForce = Math.min(maxGripForce * 0.7, 5500);
        driveForce -= brakeForce;
      }

      const fLongWorld = Vec3.scale(wheelFwdWorld, driveForce);
      const fWheelTotalWorld = Vec3.add(fSpringWorld, Vec3.add(fLatWorld, fLongWorld));
      const fWheelBody = Quat.invRotate(sim.quat, fWheelTotalWorld);
      const tauWheelBody = Vec3.cross(rBody, fWheelBody);

      totalForceWorld = Vec3.add(totalForceWorld, fWheelTotalWorld);
      totalTorqueBody = Vec3.add(totalTorqueBody, tauWheelBody);
    } else {
      w.grounded = false;
      w.bottomedOut = false;
      w.wheelspin = false;
      w.compression = 0;
      w.ratio = 0;
      w.normalForce = 0;
    }
  }

  sim.GroundedCount = groundedWheels;
  return { totalForceWorld, totalTorqueBody };
}
