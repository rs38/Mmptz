// ============================================================================
// VECTR-8 // 3D Rigid Body, 8-Thruster, 1000kW RWD & 60kW Fan Physics Engine
// ============================================================================

export const Vec3 = {
  create(x = 0, y = 0, z = 0) {
    return { x, y, z };
  },
  clone(v) {
    return { x: v.x, y: v.y, z: v.z };
  },
  add(a, b) {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
  },
  sub(a, b) {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  },
  scale(v, s) {
    return { x: v.x * s, y: v.y * s, z: v.z * s };
  },
  addScaled(a, b, s) {
    return { x: a.x + b.x * s, y: a.y + b.y * s, z: a.z + b.z * s };
  },
  dot(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  },
  cross(a, b) {
    return {
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x,
    };
  },
  lenSq(v) {
    return v.x * v.x + v.y * v.y + v.z * v.z;
  },
  len(v) {
    return Math.hypot(v.x, v.y, v.z);
  },
  norm(v) {
    const l = Math.hypot(v.x, v.y, v.z);
    return l > 1e-8 ? { x: v.x / l, y: v.y / l, z: v.z / l } : { x: 0, y: 0, z: 0 };
  },
};

export const Quat = {
  identity() {
    return { x: 0, y: 0, z: 0, w: 1 };
  },
  norm(q) {
    const l = Math.hypot(q.x, q.y, q.z, q.w);
    if (l < 1e-8) return { x: 0, y: 0, z: 0, w: 1 };
    return { x: q.x / l, y: q.y / l, z: q.z / l, w: q.w / l };
  },
  mul(a, b) {
    return {
      w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
      x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
      y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
      z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
    };
  },
  conjugate(q) {
    return { x: -q.x, y: -q.y, z: -q.z, w: q.w };
  },
  rotate(q, v) {
    const tx = 2 * (q.y * v.z - q.z * v.y);
    const ty = 2 * (q.z * v.x - q.x * v.z);
    const tz = 2 * (q.x * v.y - q.y * v.x);
    return {
      x: v.x + q.w * tx + (q.y * tz - q.z * ty),
      y: v.y + q.w * ty + (q.z * tx - q.x * tz),
      z: v.z + q.w * tz + (q.x * ty - q.y * tx),
    };
  },
  invRotate(q, v) {
    return Quat.rotate(Quat.conjugate(q), v);
  },
  toEuler(q) {
    const forward = Quat.rotate(q, { x: 0, y: 0, z: 1 });
    const right = Quat.rotate(q, { x: 1, y: 0, z: 0 });
    const up = Quat.rotate(q, { x: 0, y: 1, z: 0 });

    const pitch = Math.asin(Math.max(-1, Math.min(1, forward.y))); // +pitch = nose up
    const yaw = Math.atan2(forward.x, forward.z);
    const roll = Math.atan2(right.y, up.y); // +roll = right side up (bank left)
    return { pitch, roll, yaw };
  },
};

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
    rings: [
      { id: 0, x: 0, y: 4.8, z: 20, r: 4.3, normal: { x: 0, y: 0, z: 1 }, passed: false },
      { id: 1, x: 0, y: 10.8, z: 42, r: 4.3, normal: { x: 0, y: 0, z: 1 }, passed: false },
      { id: 2, x: -18, y: 14.0, z: 57, r: 4.5, normal: { x: -0.5, y: 0, z: 0.866 }, passed: false },
      { id: 3, x: -36, y: 18.5, z: 72, r: 4.3, normal: { x: 0, y: 0, z: 1 }, passed: false },
      { id: 4, x: 0, y: 21.0, z: 66, r: 4.6, normal: { x: 1, y: 0, z: 0 }, passed: false },
      { id: 5, x: 38, y: 25.5, z: 54, r: 4.3, normal: { x: 0, y: 0, z: -1 }, passed: false },
      { id: 6, x: 24, y: 15.0, z: 24, r: 4.5, normal: { x: 0, y: 0, z: -1 }, passed: false },
      { id: 7, x: 0, y: 7.0, z: 0, r: 4.5, normal: { x: 0, y: 0, z: -1 }, passed: false },
    ],
  };
}

export function sampleSurface(arena, x, y, z) {
  let bestY = 0.0;
  let normal = { x: 0, y: 1, z: 0 };
  let padHit = null;

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
        padHit = pad;
      }
    }
  }

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
        padHit = null;
      }
    }
  }

  return { y: bestY, normal, pad: padHit };
}

export class RocketCarSim {
  constructor() {
    this.arena = createArena();

    // Vehicle Dry Mass + Rocket Fuel Tank Parameters
    this.dryMass = 1400; // kg
    this.fuelCapacity = 200; // kg (configurable 40..800 kg)
    this.fuelMass = 200; // kg current propellant
    this.fuelBurnRate = 0; // kg/s current flow rate
    this.exhaustVelocity = 1650; // m/s effective rocket exhaust velocity (I_sp * g0)

    this.dims = { w: 2.0, h: 1.15, l: 4.4 };
    this.gravity = 9.81;

    // Classic RWD Drivetrain (up to 1000 kW = 1,000,000 W)
    this.rwdMaxPowerKW = 1000; // kW
    this.currentRwdForce = 0; // N
    this.currentSteerAngle = 0; // rad

    // Custom Suspension Ride Height (Rest Length in meters: 0.22m to 0.90m)
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

    // Flight Computer Assists
    this.stabilizerEnabled = true;
    this.autoHoverEnabled = false;
    this.targetHoverAltitude = 4.5;

    // 8 Rocket Thrusters in Body Coordinates (+X Right, +Y Up, +Z Forward)
    this.thrusters = {
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

    // 4 Suspension Wheel Mounts in body space
    this.wheels = [
      { id: 'W_FL', isFront: true, isRear: false, pos: { x: -0.92, y: -0.35, z: 1.38 }, compression: 0, ratio: 0, grounded: false, bottomedOut: false, wheelspin: false, normalForce: 0 },
      { id: 'W_FR', isFront: true, isRear: false, pos: { x: 0.92, y: -0.35, z: 1.38 }, compression: 0, ratio: 0, grounded: false, bottomedOut: false, wheelspin: false, normalForce: 0 },
      { id: 'W_RL', isFront: false, isRear: true, pos: { x: -0.92, y: -0.35, z: -1.38 }, compression: 0, ratio: 0, grounded: false, bottomedOut: false, wheelspin: false, normalForce: 0 },
      { id: 'W_RR', isFront: false, isRear: true, pos: { x: 0.92, y: -0.35, z: -1.38 }, compression: 0, ratio: 0, grounded: false, bottomedOut: false, wheelspin: false, normalForce: 0 },
    ];

    this.crashEvents = [];
    this.reset();
  }

  get mass() {
    return this.dryMass + this.fuelMass;
  }

  get inertia() {
    const m = this.mass;
    return {
      x: (m / 12) * (this.dims.h ** 2 + this.dims.l ** 2),
      y: (m / 12) * (this.dims.w ** 2 + this.dims.l ** 2),
      z: (m / 12) * (this.dims.w ** 2 + this.dims.h ** 2),
    };
  }

  refuel() {
    this.fuelMass = this.fuelCapacity;
    this.lastEventMessage = `ROCKET TANK REFUELED TO ${this.fuelCapacity} kg (100%)`;
  }

  reset() {
    this.pos = { x: 0, y: this.suspensionRestLength + 0.35, z: 0 };
    this.vel = { x: 0, y: 0, z: 0 };
    this.quat = Quat.identity();
    this.omega = { x: 0, y: 0, z: 0 };

    this.fuelMass = this.fuelCapacity;
    this.fuelBurnRate = 0;

    this.netForceWorld = { x: 0, y: 0, z: 0 };
    this.netThrustForceWorld = { x: 0, y: 0, z: 0 };
    this.netTorqueBody = { x: 0, y: 0, z: 0 };
    this.totalThrustMag = 0;
    this.lastEventMessage = '';
    this.GroundedCount = 0;
    this.targetHoverAltitude = 4.5;

    // Structural integrity & crash state
    this.chassisIntegrity = 100; // %
    this.lastCrashG = 0;
    this.crashCooldown = 0;
    // Per-corner structural deformation offsets (FL, FR, RL, RR)
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

    // ------------------------------------------------------------------------
    // 1. Determine Thruster Throttles (No Stabilizer Leak in Direct Mode!)
    // ------------------------------------------------------------------------
    const forwardInput = controls.forward - controls.backward; // W/S
    const strafeInput = controls.right - controls.left; // D/A
    const yawInput = controls.yawRight - controls.yawLeft; // E/Q
    const rollInput = controls.rollRight - controls.rollLeft; // Arrows

    // Smooth steering angle for front wheels when driving on ground
    const targetSteer = (controls.left - controls.right) * 0.45; // +/- 26 deg
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

    let pitchCmd = 0;
    let rollCmd = 0;
    let yawCmd = yawInput * 0.75;

    // Only apply flight-computer attitude commands when airborne OR thrusters active
    const thrustersActive = isAirborne || collective > 0.05 || controls.up > 0;

    if (this.stabilizerEnabled && this.sliderMode !== 'direct') {
      const targetPitch = isAirborne ? -forwardInput * 0.21 : 0;
      const targetRoll = rollInput * 0.28 - (isAirborne ? strafeInput * 0.08 : 0);

      const pitchAngle = euler.pitch;
      const pitchRate = -this.omega.x;
      const yawRate = this.omega.y;
      const rollAngle = euler.roll;
      const rollRate = this.omega.z;

      const pitchErr = targetPitch - pitchAngle;
      const rollErr = targetRoll - rollAngle;

      pitchCmd = pitchErr * 1.65 - pitchRate * 0.55;
      rollCmd = rollErr * 1.65 - rollRate * 0.55;
      yawCmd = yawInput * 0.75 - (isAirborne ? yawRate * 0.5 : 0);
    } else {
      // Raw Unassisted Physics Mode: No automatic counter-torque!
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

    // Side thrusters fire for strafing (when airborne) or yawing (Q/E)
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

    // ------------------------------------------------------------------------
    // 2. Accumulate Rocket Thruster Forces, Torques & Propellant Burn
    // ------------------------------------------------------------------------
    let totalForceWorld = { x: 0, y: -m * this.gravity, z: 0 };
    let thrustForceWorld = { x: 0, y: 0, z: 0 };
    let totalTorqueBody = { x: 0, y: 0, z: 0 };
    let sumThrustMag = 0;

    const hasFuel = this.fuelMass > 0.001;

    for (const key of Object.keys(this.thrusters)) {
      const t = this.thrusters[key];
      const maxCap = t.group === 'down' ? this.downMaxForce : this.sideMaxForce;
      const sliderRatio = t.sliderPct / 100;

      let forceMag = 0;
      if (hasFuel) {
        if (this.sliderMode === 'direct') {
          // Pure Direct Constant Fire mode: 100% controlled by individual slider (no stabilizer override!)
          t.throttle = sliderRatio;
          forceMag = maxCap * sliderRatio;
        } else {
          const rawThrottle = t.group === 'down' ? dThrottle[key] : sThrottle[key];
          const clampedThrottle = Math.max(0, Math.min(1.0, rawThrottle));
          t.throttle = clampedThrottle * sliderRatio;
          forceMag = maxCap * sliderRatio * clampedThrottle;
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
      const fWorld = Quat.rotate(this.quat, fBody);
      const tauBody = Vec3.cross(t.pos, fBody);

      thrustForceWorld = Vec3.add(thrustForceWorld, fWorld);
      totalForceWorld = Vec3.add(totalForceWorld, fWorld);
      totalTorqueBody = Vec3.add(totalTorqueBody, tauBody);

      t.worldPos = Vec3.add(this.pos, Quat.rotate(this.quat, t.pos));
      t.worldForce = fWorld;
      t.worldPlumeDir = Quat.rotate(this.quat, localPlume);
    }

    // Consume Rocket Propellant based on Specific Impulse (dm/dt = F_total / v_exhaust)
    if (sumThrustMag > 1 && hasFuel) {
      this.fuelBurnRate = sumThrustMag / this.exhaustVelocity;
      const burned = this.fuelBurnRate * dt;
      this.fuelMass = Math.max(0, this.fuelMass - burned);
      if (this.fuelMass === 0) {
        this.lastEventMessage = 'ROCKET PROPELLANT DEPLETED — PRESS [T] OR CLICK REFUEL!';
      }
    } else {
      this.fuelBurnRate = 0;
    }

    // ------------------------------------------------------------------------
    // 3. 60 kW Underbody Suction Ventilator (Fluid Seal & Vacuum Downforce)
    // ------------------------------------------------------------------------
    this.suctionVacuumPa = 0;
    this.suctionForceMag = 0;
    this.suctionForceWorld = { x: 0, y: 0, z: 0 };

    const surfUnder = sampleSurface(this.arena, this.pos.x, this.pos.y, this.pos.z);
    const carUpWorld = Quat.rotate(this.quat, { x: 0, y: 1, z: 0 });
    const alignmentCos = Vec3.dot(carUpWorld, surfUnder.normal);
    const underbodyClearance = (this.pos.y - surfUnder.y) * Math.max(0.2, alignmentCos) - 0.35;

    // Skirt extends `this.skirtLength` (0.31m) below chassis underbody
    const rawGap = underbodyClearance - this.skirtLength;
    const tiltLeakPenalty = Math.max(0, (1 - alignmentCos) * 0.65);
    this.sealGapMeters = Math.max(0.0025, Math.max(0, rawGap) + tiltLeakPenalty);

    if (this.fanEnabled && alignmentCos > 0.45 && underbodyClearance < 1.2) {
      // Leakage orifice area around perimeter skirt: A_leak = Cd * Perimeter * h_gap
      const cd = 0.65;
      const rhoAir = 1.225;
      const aLeak = cd * this.fanPerimeter * this.sealGapMeters;
      const fanEfficiency = 0.74;
      const maxStallVacuumPa = 5900; // ~5.9 kPa max vacuum at 60 kW

      // P_fan * eta = dP * Q = dP * A_leak * sqrt(2 * dP / rho)
      // => dP = ( (P_fan * eta) / (A_leak * sqrt(2 / rho)) )^(2/3)
      const numerator = this.fanPowerWatts * fanEfficiency;
      const denom = aLeak * Math.sqrt(2 / rhoAir);
      const dP = Math.min(maxStallVacuumPa, Math.pow(numerator / Math.max(1e-5, denom), 2 / 3));

      this.suctionVacuumPa = dP;
      this.suctionForceMag = dP * this.fanPlenumArea; // Up to ~24.7 kN when sealed!

      // Suction pulls the car perpendicular into the flat surface (-surfUnder.normal)
      this.suctionForceWorld = Vec3.scale(surfUnder.normal, -this.suctionForceMag);
      totalForceWorld = Vec3.add(totalForceWorld, this.suctionForceWorld);

      // Self-aligning suction skirt torque when close to surface
      if (this.sealGapMeters < 0.09) {
        const alignAxisWorld = Vec3.cross(carUpWorld, surfUnder.normal);
        const alignTorqueBody = Vec3.scale(
          Quat.invRotate(this.quat, alignAxisWorld),
          this.suctionForceMag * 0.45
        );
        totalTorqueBody = Vec3.add(totalTorqueBody, alignTorqueBody);
      }

      // Skirt rubbing drag if skirt physically contacts surface (rawGap < 0)
      if (rawGap < 0) {
        const skirtDrag = Vec3.scale(this.vel, -140);
        totalForceWorld = Vec3.add(totalForceWorld, skirtDrag);
      }
    }

    // ------------------------------------------------------------------------
    // 4. 4-Wheel Adjustable Suspension, 1000kW RWD & Bottom-Out Crash Physics
    // ------------------------------------------------------------------------
    const restLength = this.suspensionRestLength;
    // Scale spring stiffness so equilibrium sag is ~32% of travel under 1G weight,
    // plus progressive bump-stop stiffness near 90-100% travel
    const baseSpringK = (1400 * 9.81) / (4 * Math.max(0.12, restLength * 0.34));
    const damperC = 4400;
    let groundedWheels = 0;
    this.currentRwdForce = 0;

    for (const w of this.wheels) {
      const mountWorld = Vec3.add(this.pos, Quat.rotate(this.quat, w.pos));
      const surf = sampleSurface(this.arena, mountWorld.x, mountWorld.y, mountWorld.z);
      const dist = mountWorld.y - surf.y;

      if (dist < restLength && dist > -1.2) {
        w.grounded = true;
        groundedWheels++;
        const rawCompression = restLength - dist;
        const clampedComp = Math.min(restLength, Math.max(0, rawCompression));
        w.compression = clampedComp;
        w.ratio = clampedComp / restLength;

        const rBody = w.pos;
        const vPointBody = Vec3.add(localVel, Vec3.cross(this.omega, rBody));
        const vPointWorld = Quat.rotate(this.quat, vPointBody);
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
          if (vNormal < -3.1 && this.crashCooldown <= 0) {
            const impactG = Math.min(45, Math.abs(vNormal) * 2.6 + (overTravel * 35));
            this.recordCrash(mountWorld, surf.normal, impactG, w.id);
          }
        } else {
          w.bottomedOut = false;
        }

        w.normalForce = springForceMag;
        const fSpringWorld = Vec3.scale(surf.normal, springForceMag);

        // Wheel coordinate frame (Front wheels rotate by currentSteerAngle)
        const steer = w.isFront ? this.currentSteerAngle : 0;
        const wheelRightBody = { x: Math.cos(steer), y: 0, z: -Math.sin(steer) };
        const wheelFwdBody = { x: Math.sin(steer), y: 0, z: Math.cos(steer) };
        const wheelRightWorld = Quat.rotate(this.quat, wheelRightBody);
        const wheelFwdWorld = Quat.rotate(this.quat, wheelFwdBody);

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

        if (w.isRear && Math.abs(forwardInput) > 0.01 && this.rwdMaxPowerKW > 0) {
          const wheelPowerWatts = (this.rwdMaxPowerKW * 1000 * 0.5) * Math.abs(forwardInput);
          const effSpeed = Math.max(4.5, Math.abs(vLong)); // Low-speed torque plateau below 4.5 m/s
          const maxAxleTorqueForce = 14500 * (this.rwdMaxPowerKW / 1000); // N per rear wheel
          const rawMotorForce = Math.min(maxAxleTorqueForce, wheelPowerWatts / effSpeed);

          // Remaining traction budget after lateral cornering
          const remGrip = Math.sqrt(Math.max(0, maxGripForce * maxGripForce - clampedLatForce * clampedLatForce));
          if (rawMotorForce > remGrip) {
            w.wheelspin = true;
          }
          const actualTireDrive = Math.min(rawMotorForce, remGrip) * Math.sign(forwardInput);
          driveForce += actualTireDrive;
          this.currentRwdForce += actualTireDrive;
        } else if (w.isFront && forwardInput < -0.01 && vLong > 0.5) {
          // Front disc brakes assist when braking (pressing S while moving forward)
          const brakeForce = Math.min(maxGripForce * 0.7, 5500);
          driveForce -= brakeForce;
        }

        const fLongWorld = Vec3.scale(wheelFwdWorld, driveForce);

        const fWheelTotalWorld = Vec3.add(fSpringWorld, Vec3.add(fLatWorld, fLongWorld));
        const fWheelBody = Quat.invRotate(this.quat, fWheelTotalWorld);
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
    this.GroundedCount = groundedWheels;

    // ------------------------------------------------------------------------
    // 5. Realistic Aerodynamic Drag (Low Rotational Air Damping!)
    // ------------------------------------------------------------------------
    const speed = Vec3.len(this.vel);
    const dragCoeff = 0.45 * speed + 16.0;
    const fDragWorld = Vec3.scale(this.vel, -dragCoeff);
    totalForceWorld = Vec3.add(totalForceWorld, fDragWorld);

    // Realistic low rotational air damping (32 N*m/(rad/s) + quadratic omega drag)
    const omegaMag = Vec3.len(this.omega);
    const rotDamp = 32 + 14 * omegaMag;
    const angDrag = {
      x: -this.omega.x * rotDamp,
      y: -this.omega.y * rotDamp,
      z: -this.omega.z * rotDamp,
    };
    totalTorqueBody = Vec3.add(totalTorqueBody, angDrag);

    // ------------------------------------------------------------------------
    // 6. Integrate Linear & Angular Equations of Motion
    // ------------------------------------------------------------------------
    const accel = Vec3.scale(totalForceWorld, 1 / m);
    this.vel = Vec3.addScaled(this.vel, accel, dt);
    this.pos = Vec3.addScaled(this.pos, this.vel, dt);

    const Iw = {
      x: I.x * this.omega.x,
      y: I.y * this.omega.y,
      z: I.z * this.omega.z,
    };
    const gyro = Vec3.cross(this.omega, Iw);
    const netRotTorque = Vec3.sub(totalTorqueBody, gyro);

    const alpha = {
      x: netRotTorque.x / I.x,
      y: netRotTorque.y / I.y,
      z: netRotTorque.z / I.z,
    };

    this.omega = Vec3.addScaled(this.omega, alpha, dt);

    const omegaQuat = { x: this.omega.x, y: this.omega.y, z: this.omega.z, w: 0 };
    const qDot = Quat.mul(this.quat, omegaQuat);
    this.quat = Quat.norm({
      x: this.quat.x + 0.5 * qDot.x * dt,
      y: this.quat.y + 0.5 * qDot.y * dt,
      z: this.quat.z + 0.5 * qDot.z * dt,
      w: this.quat.w + 0.5 * qDot.w * dt,
    });

    // ------------------------------------------------------------------------
    // 7. 3D Chassis Corner Collision & Hard Impact Detection
    // ------------------------------------------------------------------------
    const hullCheckPoints = [
      { id: 'FL', pos: { x: -0.88, y: -0.32, z: 2.15 } },
      { id: 'FR', pos: { x: 0.88, y: -0.32, z: 2.15 } },
      { id: 'RL', pos: { x: -0.88, y: -0.28, z: -2.15 } },
      { id: 'RR', pos: { x: 0.88, y: -0.28, z: -2.15 } },
      { id: 'ROOF_L', pos: { x: -0.70, y: 0.58, z: 0.2 } },
      { id: 'ROOF_R', pos: { x: 0.70, y: 0.58, z: 0.2 } },
    ];

    for (const cp of hullCheckPoints) {
      const worldPt = Vec3.add(this.pos, Quat.rotate(this.quat, cp.pos));
      const surf = sampleSurface(this.arena, worldPt.x, worldPt.y, worldPt.z);
      if (worldPt.y < surf.y) {
        const pen = surf.y - worldPt.y;
        this.pos.y += pen;

        const vPtBody = Vec3.add(localVel, Vec3.cross(this.omega, cp.pos));
        const vPtWorld = Quat.rotate(this.quat, vPtBody);

        if (vPtWorld.y < -3.0 && this.crashCooldown <= 0) {
          const impactG = Math.min(50, Math.abs(vPtWorld.y) * 2.9);
          this.recordCrash(worldPt, surf.normal, impactG, cp.id);
        }

        if (this.vel.y < 0) {
          this.vel.y = -this.vel.y * 0.22;
          this.vel.x *= 0.88;
          this.vel.z *= 0.88;
        }
        // Apply collision impulse torque when roof or nose hits ground
        const impulseBody = Quat.invRotate(this.quat, { x: 0, y: pen * 28000, z: 0 });
        const crashTorque = Vec3.cross(cp.pos, impulseBody);
        this.omega.x += (crashTorque.x / I.x) * dt;
        this.omega.z += (crashTorque.z / I.z) * dt;
      }
    }

    this.netForceWorld = totalForceWorld;
    this.netThrustForceWorld = thrustForceWorld;
    this.netTorqueBody = totalTorqueBody;
    this.totalThrustMag = sumThrustMag;
  }

  recordCrash(worldPos, normal, gForce, locationId) {
    this.crashCooldown = 0.28;
    this.lastCrashG = gForce;
    const dmg = Math.min(35, Math.max(3, (gForce - 5) * 1.4));
    this.chassisIntegrity = Math.max(0, Math.round(this.chassisIntegrity - dmg));

    // Deform nearest corner on the 3D car mesh
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

  checkObjectives() {
    for (const ring of this.arena.rings) {
      if (!ring.passed) {
        const dist = Math.hypot(this.pos.x - ring.x, this.pos.y - ring.y, this.pos.z - ring.z);
        if (dist < ring.r + 0.8) {
          ring.passed = true;
          this.lastEventMessage = `WAYPOINT RING #${ring.id + 1} CLEARED!`;
        }
      }
    }

    if (this.GroundedCount >= 2 && Vec3.len(this.vel) < 2.2) {
      const surf = sampleSurface(this.arena, this.pos.x, this.pos.y, this.pos.z);
      if (surf.pad && !surf.pad.visited) {
        surf.pad.visited = true;
        this.lastEventMessage = `TOUCHDOWN CONFIRMED ON ${surf.pad.id}!`;
      }
    }
  }
}
