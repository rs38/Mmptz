// ============================================================================
// VECTR-8 // 3D Rigid Body, 8-Thruster, 1000kW RWD & 60kW Fan Physics Engine
// ============================================================================

import { Vec3, Quat } from './src/math.js';
import { createArena, sampleSurface } from './src/terrain.js';
import {
  createDefaultThrusters,
  createDefaultWheels,
  HULL_CHECK_POINTS,
  calculateInertia,
} from './src/vehicle_config.js';
import { calculateFanSuction } from './src/fan_physics.js';
import { stepSuspension } from './src/suspension_physics.js';
import { calculateThrusters } from './src/thruster_physics.js';

// Re-export core math and world helpers for backwards compatibility
export { Vec3, Quat, createArena, sampleSurface };

export class RocketCarSim {
  constructor() {
    this.arena = createArena();

    // Vehicle Dry Mass + Cold Gas COPV Pressure Tank Parameters
    this.dryMass = 1400; // kg
    this.fuelCapacity = 200; // kg compressed gas capacity
    this.fuelMass = 200; // kg current propellant
    this.fuelBurnRate = 0; // kg/s current mass flow rate
    this.tankRatedPressureBar = 350; // bar (35 MPa full storage pressure)
    this.tankPressureBar = 350; // bar current pressure
    this.tankTemperatureK = 293.15; // K (20°C ambient)
    this.baseExhaustVelocity = 720; // m/s effective cold gas exhaust velocity
    this.exhaustVelocity = 720;

    this.dims = { w: 2.0, h: 1.15, l: 4.4 };
    this.gravity = 9.81;

    // Classic RWD Drivetrain (up to 1000 kW)
    this.rwdMaxPowerKW = 1000; // kW
    this.currentRwdForce = 0; // N
    this.currentSteerAngle = 0; // rad

    // Custom Suspension Ride Height (Rest Length: 0.22m to 0.90m)
    this.suspensionRestLength = 0.55; // m

    // 60 kW Underbody Suction Ventilator (Fan Car System)
    this.fanEnabled = false;
    this.fanPowerWatts = 60000; // 60 kW
    this.fanPlenumArea = 4.2; // m^2 sealed underbody plenum area
    this.fanPerimeter = 8.8; // m skirt perimeter
    this.skirtLength = 0.31; // m flexible skirt drop below chassis underbody
    this.suctionVacuumPa = 0; // Pa vacuum pressure
    this.suctionForceMag = 0; // N normal suction force
    this.sealGapMeters = 0; // m effective air gap under skirt
    this.suctionForceWorld = { x: 0, y: 0, z: 0 };

    // Master Thruster Capacities
    this.downMaxForce = 6500; // N per nozzle
    this.sideMaxForce = 4000; // N per nozzle
    this.hoverBaseThrottle = 0.0;
    this.sliderMode = 'scale'; // 'scale' or 'direct'

    // Flight Computer Assists (Stabilizer defaults to OFF for pure physics)
    this.stabilizerEnabled = false;
    this.autoHoverEnabled = false;
    this.targetHoverAltitude = 4.5;

    // 8 Rocket Thrusters in Body Coordinates (+X Right, +Y Up, +Z Forward)
    this.thrusters = createDefaultThrusters();

    // 4 Suspension Wheel Mounts in body space
    this.wheels = createDefaultWheels();

    this.crashEvents = [];
    this.reset();
  }

  get mass() {
    return this.dryMass + this.fuelMass;
  }

  get inertia() {
    return calculateInertia(this.mass, this.dims);
  }

  refuel() {
    this.fuelMass = this.fuelCapacity;
    this.tankPressureBar = this.tankRatedPressureBar;
    this.tankTemperatureK = 293.15;
    this.exhaustVelocity = this.baseExhaustVelocity;
    this.lastEventMessage = `COLD GAS COPV TANK RECHARGED TO ${this.tankRatedPressureBar} bar (100%)`;
  }

  reset() {
    this.pos = { x: 0, y: this.suspensionRestLength + 0.35, z: 0 };
    this.vel = { x: 0, y: 0, z: 0 };
    this.quat = Quat.identity();
    this.omega = { x: 0, y: 0, z: 0 };

    this.fuelMass = this.fuelCapacity;
    this.fuelBurnRate = 0;
    this.tankPressureBar = this.tankRatedPressureBar;
    this.tankTemperatureK = 293.15;
    this.exhaustVelocity = this.baseExhaustVelocity;

    this.netForceWorld = { x: 0, y: 0, z: 0 };
    this.netThrustForceWorld = { x: 0, y: 0, z: 0 };
    this.netTorqueBody = { x: 0, y: 0, z: 0 };
    this.totalThrustMag = 0;
    this.lastEventMessage = '';
    this.GroundedCount = 0;
    this.targetHoverAltitude = 4.5;
    this.stuntApexNotified = false;

    // Structural integrity & crash state
    this.chassisIntegrity = 100; // %
    this.lastCrashG = 0;
    this.crashCooldown = 0;
    this.cornerDamage = { FL: 0, FR: 0, RL: 0, RR: 0 };
    for (const w of this.wheels) {
      w.bottomedOut = false;
      w.compression = 0;
      w.ratio = 0;
    }
  }

  getEquilibriumHoverRatio() {
    const totalAvailableDown =
      this.downMaxForce *
      ((this.thrusters.D_FL.sliderPct +
        this.thrusters.D_FR.sliderPct +
        this.thrusters.D_RL.sliderPct +
        this.thrusters.D_RR.sliderPct) /
        100);
    if (totalAvailableDown < 1e-3) return 0;
    return Math.min(1, (this.mass * this.gravity) / totalAvailableDown);
  }

  update(dt, controls) {
    const clampedDt = Math.min(dt, 0.05);
    const substeps = 4;
    const subDt = clampedDt / substeps;

    if (this.crashCooldown > 0) {
      this.crashCooldown = Math.max(0, this.crashCooldown - clampedDt);
    }

    for (let i = 0; i < substeps; i++) {
      this.stepSub(subDt, controls);
    }

    this.checkObjectives();
  }

  stepSub(dt, controls) {
    const euler = Quat.toEuler(this.quat);
    const localVel = Quat.invRotate(this.quat, this.vel);
    const m = this.mass;
    const I = this.inertia;

    // 1. Steering and Hover Collective
    const targetSteer = (controls.left - controls.right) * 0.45;
    this.currentSteerAngle += (targetSteer - this.currentSteerAngle) * Math.min(1, dt * 14);

    let collective = this.hoverBaseThrottle;
    const isAirborne = this.GroundedCount === 0;

    if (this.autoHoverEnabled) {
      if (controls.up > 0) {
        this.targetHoverAltitude += 9.0 * dt;
      } else if (controls.down > 0) {
        this.targetHoverAltitude = Math.max(0.5, this.targetHoverAltitude - 9.0 * dt);
      }
      const altErr = this.targetHoverAltitude - this.pos.y;
      const vyErr = 0 - this.vel.y;
      const eqRatio = this.getEquilibriumHoverRatio();
      const cosTilt = Math.max(0.5, Math.cos(euler.pitch) * Math.cos(euler.roll));
      collective = (eqRatio + altErr * 0.22 + vyErr * 0.28) / cosTilt;
    } else {
      if (controls.up > 0) {
        collective = Math.max(collective, 0.88);
        if (this.hoverBaseThrottle > 0.2) {
          collective = Math.min(1.0, this.hoverBaseThrottle + 0.45);
        }
      }
      if (controls.down > 0) {
        collective = Math.max(0, collective - 0.65);
      }
    }

    // 2. Thruster Forces & Torques
    const thr = calculateThrusters(this, dt, controls, euler, isAirborne, collective);
    let totalForceWorld = Vec3.add({ x: 0, y: -m * this.gravity, z: 0 }, thr.thrustForceWorld);
    let totalTorqueBody = thr.thrustTorqueBody;

    // 3. 60 kW Fan Suction Dynamics
    const fan = calculateFanSuction(this);
    this.suctionVacuumPa = fan.suctionVacuumPa;
    this.suctionForceMag = fan.suctionForceMag;
    this.suctionForceWorld = fan.suctionForceWorld;
    this.sealGapMeters = fan.sealGapMeters;
    totalForceWorld = Vec3.add(totalForceWorld, fan.suctionForceWorld);
    totalForceWorld = Vec3.add(totalForceWorld, fan.skirtDragWorld);
    totalTorqueBody = Vec3.add(totalTorqueBody, fan.alignTorqueBody);

    // 4. Suspension, RWD & Tires
    const forwardInput = controls.forward - controls.backward;
    const susp = stepSuspension(this, localVel, forwardInput);
    totalForceWorld = Vec3.add(totalForceWorld, susp.totalForceWorld);
    totalTorqueBody = Vec3.add(totalTorqueBody, susp.totalTorqueBody);

    // 5. Aerodynamic Drag & Angular Damping
    const speed = Vec3.len(this.vel);
    totalForceWorld = Vec3.add(totalForceWorld, Vec3.scale(this.vel, -(0.45 * speed + 16.0)));

    const rotDamp = 32 + 14 * Vec3.len(this.omega);
    totalTorqueBody = Vec3.add(totalTorqueBody, {
      x: -this.omega.x * rotDamp,
      y: -this.omega.y * rotDamp,
      z: -this.omega.z * rotDamp,
    });

    // 6. Integrate Linear & Angular Motion
    this.vel = Vec3.addScaled(this.vel, Vec3.scale(totalForceWorld, 1 / m), dt);
    this.pos = Vec3.addScaled(this.pos, this.vel, dt);

    const Iw = { x: I.x * this.omega.x, y: I.y * this.omega.y, z: I.z * this.omega.z };
    const netRotTorque = Vec3.sub(totalTorqueBody, Vec3.cross(this.omega, Iw));
    const alpha = { x: netRotTorque.x / I.x, y: netRotTorque.y / I.y, z: netRotTorque.z / I.z };
    this.omega = Vec3.addScaled(this.omega, alpha, dt);

    const qDot = Quat.mul(this.quat, { x: this.omega.x, y: this.omega.y, z: this.omega.z, w: 0 });
    this.quat = Quat.norm({
      x: this.quat.x + 0.5 * qDot.x * dt,
      y: this.quat.y + 0.5 * qDot.y * dt,
      z: this.quat.z + 0.5 * qDot.z * dt,
      w: this.quat.w + 0.5 * qDot.w * dt,
    });

    // 7. Hull Corner Collision Checks
    for (const cp of HULL_CHECK_POINTS) {
      const worldPt = Vec3.add(this.pos, Quat.rotate(this.quat, cp.pos));
      const surf = sampleSurface(this.arena, worldPt.x, worldPt.y, worldPt.z);
      const distToSurf =
        (worldPt.x - surf.point.x) * surf.normal.x +
        (worldPt.y - surf.point.y) * surf.normal.y +
        (worldPt.z - surf.point.z) * surf.normal.z;

      if (distToSurf < 0) {
        const pen = -distToSurf;
        this.pos = Vec3.addScaled(this.pos, surf.normal, pen);
        const vPtWorld = Quat.rotate(this.quat, Vec3.add(localVel, Vec3.cross(this.omega, cp.pos)));
        const vNormal = Vec3.dot(vPtWorld, surf.normal);
        if (vNormal < -3.0 && this.crashCooldown <= 0) {
          this.recordCrash(worldPt, surf.normal, Math.min(50, Math.abs(vNormal) * 2.9), cp.id);
        }
        if (vNormal < 0) {
          this.vel = Vec3.addScaled(this.vel, surf.normal, -vNormal * 1.22);
          this.vel = Vec3.scale(this.vel, 0.94);
        }
        const impulseBody = Quat.invRotate(this.quat, Vec3.scale(surf.normal, pen * 28000));
        const crashTorque = Vec3.cross(cp.pos, impulseBody);
        this.omega.x += (crashTorque.x / I.x) * dt;
        this.omega.z += (crashTorque.z / I.z) * dt;
      }
    }

    this.netForceWorld = totalForceWorld;
    this.netThrustForceWorld = thr.thrustForceWorld;
    this.netTorqueBody = totalTorqueBody;
    this.totalThrustMag = thr.sumThrustMag;
  }

  recordCrash(worldPos, normal, gForce, locationId) {
    this.crashCooldown = 0.28;
    this.lastCrashG = gForce;
    const dmg = Math.min(35, Math.max(3, (gForce - 5) * 1.4));
    this.chassisIntegrity = Math.max(0, Math.round(this.chassisIntegrity - dmg));

    const deformAmt = Math.min(0.22, gForce * 0.006);
    if (locationId.includes('FL')) this.cornerDamage.FL = Math.min(0.28, this.cornerDamage.FL + deformAmt);
    else if (locationId.includes('FR')) this.cornerDamage.FR = Math.min(0.28, this.cornerDamage.FR + deformAmt);
    else if (locationId.includes('RL')) this.cornerDamage.RL = Math.min(0.28, this.cornerDamage.RL + deformAmt);
    else if (locationId.includes('RR')) this.cornerDamage.RR = Math.min(0.28, this.cornerDamage.RR + deformAmt);
    else {
      this.cornerDamage.FL = Math.min(0.28, this.cornerDamage.FL + deformAmt * 0.5);
      this.cornerDamage.FR = Math.min(0.28, this.cornerDamage.FR + deformAmt * 0.5);
    }

    this.crashEvents.push({
      pos: Vec3.clone(worldPos),
      normal: Vec3.clone(normal),
      gForce,
      locationId,
    });

    this.lastEventMessage = `CRASH IMPACT: ${gForce.toFixed(1)}G AT ${locationId.replace('_', '-')} — SUSPENSION BOTTOMED OUT!`;
  }

    for (const ring of this.arena.rings) {
      if (!ring.passed) {
        const dist = Math.hypot(this.pos.x - ring.x, this.pos.y - ring.y, this.pos.z - ring.z);
        if (dist < ring.r + 0.8) {
          ring.passed = true;
          this.lastEventMessage =
            ring.id === 8
              ? 'STUNT APEX CLEARED! 21m INVERTED CRESCENT LOOP CONQUERED!'
              : `WAYPOINT RING #${ring.id + 1} CLEARED!`;
        }
      }
    }

    const surf = sampleSurface(this.arena, this.pos.x, this.pos.y, this.pos.z);
    if (surf.pad && surf.pad.id === 'STUNT-LOOP' && surf.pad.theta > 2.0 && !this.stuntApexNotified) {
      this.stuntApexNotified = true;
      this.lastEventMessage = 'INVERTED CRESCENT CLIMB! 60kW VACUUM FAN HOLDING CHASSIS UPSIDE DOWN!';
    }

    if (this.GroundedCount >= 2 && Vec3.len(this.vel) < 2.2) {
      if (surf.pad && surf.pad.visited === false) {
        surf.pad.visited = true;
        this.lastEventMessage = `TOUCHDOWN CONFIRMED ON ${surf.pad.id}!`;
      }
    }
  }
}
