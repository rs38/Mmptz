// ============================================================================
// VECTR-8 // 3D Vector Wireframe & Old-School Solid 3D Flat-Shaded Renderer
// Includes 60kW Suction Fan, 3D/2D Fuel Tank, Suspension Struts & Crash FX
// ============================================================================

import { Vec3, Quat, sampleSurface } from './physics.js';

function buildCarMesh() {
  const v = [
    // 0..3: Front Nose Tip & Lower Splitter (z = +2.20, corner: FL/FR)
    { x: -0.78, y: -0.26, z: 2.20, corner: 'FL' },
    { x: 0.78, y: -0.26, z: 2.20, corner: 'FR' },
    { x: -0.82, y: 0.02, z: 2.16, corner: 'FL' },
    { x: 0.82, y: 0.02, z: 2.16, corner: 'FR' },

    // 4..7: Front Fender / Base of Windshield (z = +1.15)
    { x: -0.98, y: -0.32, z: 1.15, corner: 'FL' },
    { x: 0.98, y: -0.32, z: 1.15, corner: 'FR' },
    { x: -0.92, y: 0.22, z: 1.10, corner: 'FL' },
    { x: 0.92, y: 0.22, z: 1.10, corner: 'FR' },

    // 8..9: Canopy Peak (z = +0.25)
    { x: -0.72, y: 0.58, z: 0.25 },
    { x: 0.72, y: 0.58, z: 0.25 },

    // 10..13: Mid-Rear Quarter / B-Pillar (z = -0.85)
    { x: -0.98, y: -0.32, z: -0.85, corner: 'RL' },
    { x: 0.98, y: -0.32, z: -0.85, corner: 'RR' },
    { x: -0.94, y: 0.30, z: -0.85, corner: 'RL' },
    { x: 0.94, y: 0.30, z: -0.85, corner: 'RR' },

    // 14..15: Fastback Rear Glass Base (z = -1.35)
    { x: -0.70, y: 0.44, z: -1.35 },
    { x: 0.70, y: 0.44, z: -1.35 },

    // 16..19: Rear Tail & Diffuser (z = -2.18)
    { x: -0.86, y: 0.26, z: -2.18, corner: 'RL' },
    { x: 0.86, y: 0.26, z: -2.18, corner: 'RR' },
    { x: -0.80, y: -0.18, z: -2.14, corner: 'RL' },
    { x: 0.80, y: -0.18, z: -2.14, corner: 'RR' },
  ];

  // Note: Vertex order defines outward normal via right-hand rule for Solid 3D shading
  const faces = [
    // Hood & Nose
    { idx: [0, 1, 3, 2], fill: 'rgba(18, 28, 42, 0.84)', stroke: '#e8f9ff', baseRGB: [215, 230, 245] },
    { idx: [2, 3, 7, 6], fill: 'rgba(24, 38, 56, 0.82)', stroke: '#e8f9ff', baseRGB: [230, 242, 255] },
    // Windshield & Canopy Roof (translucent in vector mode so 3D fuel tank is visible inside!)
    { idx: [6, 7, 9, 8], fill: 'rgba(6, 16, 30, 0.68)', stroke: '#00e5ff', baseRGB: [40, 85, 130], isGlass: true },
    { idx: [8, 9, 15, 14], fill: 'rgba(8, 20, 36, 0.62)', stroke: '#00e5ff', baseRGB: [45, 95, 140], isGlass: true },
    { idx: [14, 15, 17, 16], fill: 'rgba(20, 32, 48, 0.82)', stroke: '#e8f9ff', baseRGB: [200, 218, 238] },
    // Left Side Body Panels
    { idx: [0, 2, 6, 4], fill: 'rgba(28, 44, 64, 0.88)', stroke: '#ffffff', baseRGB: [235, 245, 255] },
    { idx: [4, 6, 12, 10], fill: 'rgba(32, 50, 72, 0.88)', stroke: '#ffffff', baseRGB: [240, 248, 255] },
    { idx: [10, 12, 16, 18], fill: 'rgba(26, 42, 62, 0.88)', stroke: '#ffffff', baseRGB: [220, 234, 248] },
    // Side Left Window
    { idx: [6, 8, 14, 12], fill: 'rgba(5, 14, 26, 0.65)', stroke: '#00e5ff', baseRGB: [35, 75, 115], isGlass: true },
    // Right Side Body Panels
    { idx: [1, 5, 7, 3], fill: 'rgba(28, 44, 64, 0.88)', stroke: '#ffffff', baseRGB: [235, 245, 255] },
    { idx: [5, 11, 13, 7], fill: 'rgba(32, 50, 72, 0.88)', stroke: '#ffffff', baseRGB: [240, 248, 255] },
    { idx: [11, 19, 17, 13], fill: 'rgba(26, 42, 62, 0.88)', stroke: '#ffffff', baseRGB: [220, 234, 248] },
    // Side Right Window
    { idx: [7, 13, 15, 9], fill: 'rgba(5, 14, 26, 0.65)', stroke: '#00e5ff', baseRGB: [35, 75, 115], isGlass: true },
    // Rear Tail Panel (Glowing Red Lightbar)
    { idx: [16, 17, 19, 18], fill: 'rgba(42, 12, 24, 0.95)', stroke: '#ff3860', baseRGB: [225, 45, 75], isTail: true },
    // Undercarriage Floor
    { idx: [0, 4, 10, 18, 19, 11, 5, 1], fill: 'rgba(8, 12, 18, 0.92)', stroke: '#3b698a', baseRGB: [45, 55, 70] },
  ];

  return { v, faces };
}

export class VectorRenderer {
  constructor(canvas, schematicCanvas, fuelCanvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.schCanvas = schematicCanvas;
    this.schCtx = schematicCanvas.getContext('2d');
    this.fuelCanvas = fuelCanvas;
    this.fuelCtx = fuelCanvas.getContext('2d');

    this.carMesh = buildCarMesh();
    this.showVectors = true;
    this.renderMode = 'vector'; // 'vector' or 'solid' (Old-School Solid 3D)

    this.cameraMode = 'chase';
    this.camYaw = -0.52;
    this.camPitch = 0.24;
    this.camDist = 10.5;
    this.camPos = { x: -6, y: 3.2, z: -9 };
    this.camTarget = { x: 0, y: 1.2, z: 0 };

    // Directional Sun Light for Old-School Solid 3D mode
    this.lightDir = Vec3.norm({ x: 0.45, y: 0.82, z: -0.35 });

    // Particles, Crash Shards & Shockwaves
    this.particles = [];
    this.crashShards = [];
    this.crashRings = [];
    this.shakeIntensity = 0;
    this.fanAngle = 0;
    this.time = 0;

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initMouseOrbit();
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  initMouseOrbit() {
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    this.canvas.addEventListener('pointerdown', (e) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      this.canvas.setPointerCapture(e.pointerId);
    });

    this.canvas.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      this.camYaw += dx * 0.007;
      this.camPitch = Math.max(-0.15, Math.min(1.35, this.camPitch + dy * 0.007));
    });

    this.canvas.addEventListener('pointerup', () => {
      dragging = false;
    });

    this.canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        this.camDist = Math.max(4.5, Math.min(32, this.camDist + e.deltaY * 0.01));
      },
      { passive: false }
    );
  }

  toggleRenderMode() {
    this.renderMode = this.renderMode === 'vector' ? 'solid' : 'vector';
    return this.renderMode;
  }

  cycleCameraMode() {
    const modes = ['chase', 'side', 'orbit'];
    const idx = (modes.indexOf(this.cameraMode) + 1) % modes.length;
    this.cameraMode = modes[idx];
    if (this.cameraMode === 'side') {
      this.camPitch = 0.06;
      this.camDist = 8.2;
    } else if (this.cameraMode === 'chase') {
      this.camPitch = 0.24;
      this.camDist = 10.5;
    }
    return this.cameraMode.toUpperCase();
  }

  updateCamera(sim, dt) {
    const euler = Quat.toEuler(sim.quat);
    let desiredPos;

    if (this.cameraMode === 'chase') {
      const heading = euler.yaw + this.camYaw;
      const horiz = this.camDist * Math.cos(this.camPitch);
      const vert = this.camDist * Math.sin(this.camPitch);
      desiredPos = {
        x: sim.pos.x - Math.sin(heading) * horiz,
        y: Math.max(0.42, sim.pos.y + vert),
        z: sim.pos.z - Math.cos(heading) * horiz,
      };
    } else if (this.cameraMode === 'side') {
      const sideAngle = euler.yaw - Math.PI * 0.52;
      desiredPos = {
        x: sim.pos.x + Math.sin(sideAngle) * this.camDist,
        y: Math.max(0.5, sim.pos.y + 0.15),
        z: sim.pos.z + Math.cos(sideAngle) * this.camDist,
      };
    } else {
      const horiz = this.camDist * Math.cos(this.camPitch);
      const vert = this.camDist * Math.sin(this.camPitch);
      desiredPos = {
        x: sim.pos.x + Math.sin(this.camYaw) * horiz,
        y: Math.max(0.42, sim.pos.y + vert),
        z: sim.pos.z + Math.cos(this.camYaw) * horiz,
      };
    }

    const lerp = Math.min(1, dt * 10);
    this.camPos.x += (desiredPos.x - this.camPos.x) * lerp;
    this.camPos.y += (desiredPos.y - this.camPos.y) * lerp;
    this.camPos.z += (desiredPos.z - this.camPos.z) * lerp;

    // Apply camera screen shake on crash impact
    let shakeX = 0;
    let shakeY = 0;
    if (this.shakeIntensity > 0.01) {
      shakeX = (Math.random() - 0.5) * this.shakeIntensity;
      shakeY = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 2.2);
    }

    this.camTarget = {
      x: sim.pos.x + shakeX,
      y: sim.pos.y + 0.15 + shakeY,
      z: sim.pos.z,
    };

    this.camForward = Vec3.norm(Vec3.sub(this.camTarget, this.camPos));
    const worldUp = { x: 0, y: 1, z: 0 };
    this.camRight = Vec3.norm(Vec3.cross(this.camForward, worldUp));
    this.camUp = Vec3.cross(this.camRight, this.camForward);
    this.focalLength = Math.min(this.width, this.height) * 0.95;
  }

  project(p) {
    const rel = Vec3.sub(p, this.camPos);
    const cz = Vec3.dot(rel, this.camForward);
    if (cz <= 0.15) return null;
    const cx = Vec3.dot(rel, this.camRight);
    const cy = Vec3.dot(rel, this.camUp);
    const scale = this.focalLength / cz;
    return {
      x: this.width * 0.5 + cx * scale,
      y: this.height * 0.5 - cy * scale,
      depth: cz,
      scale,
    };
  }

  drawLine3D(p1, p2, color, width = 1.5, dash = null) {
    const rel1 = Vec3.sub(p1, this.camPos);
    const rel2 = Vec3.sub(p2, this.camPos);
    const z1 = Vec3.dot(rel1, this.camForward);
    const z2 = Vec3.dot(rel2, this.camForward);
    const near = 0.2;

    if (z1 < near && z2 < near) return;

    let a = p1;
    let b = p2;
    if (z1 < near) {
      const t = (near - z1) / (z2 - z1);
      a = Vec3.addScaled(p1, Vec3.sub(p2, p1), t);
    } else if (z2 < near) {
      const t = (near - z2) / (z1 - z2);
      b = Vec3.addScaled(p2, Vec3.sub(p1, p2), t);
    }

    const s1 = this.project(a);
    const s2 = this.project(b);
    if (!s1 || !s2) return;

    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(s1.x, s1.y);
    ctx.lineTo(s2.x, s2.y);
    ctx.stroke();
    ctx.restore();
  }

  drawPoly3D(ptsWorld, fillStyle, strokeStyle = null, lineWidth = 1.2) {
    const proj = [];
    for (const p of ptsWorld) {
      const pr = this.project(p);
      if (!pr) return;
      proj.push(pr);
    }
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(proj[0].x, proj[0].y);
    for (let i = 1; i < proj.length; i++) {
      ctx.lineTo(proj[i].x, proj[i].y);
    }
    ctx.closePath();
    if (fillStyle) {
      ctx.fillStyle = fillStyle;
      ctx.fill();
    }
    if (strokeStyle) {
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
    ctx.restore();
  }

  shadeRGB(rgb, normal) {
    const dot = Math.abs(Vec3.dot(normal, this.lightDir));
    const intensity = 0.38 + 0.62 * dot;
    const r = Math.min(255, Math.round(rgb[0] * intensity));
    const g = Math.min(255, Math.round(rgb[1] * intensity));
    const b = Math.min(255, Math.round(rgb[2] * intensity));
    return `rgb(${r}, ${g}, ${b})`;
  }

  drawVectorArrow3D(origin, vec, scaleFactor, color, label = '') {
    const mag = Vec3.len(vec);
    if (mag < 0.05) return;

    const len = Math.min(5.5, mag * scaleFactor);
    if (len < 0.15) return;

    const dir = Vec3.norm(vec);
    const tip = Vec3.addScaled(origin, dir, len);

    this.drawLine3D(origin, tip, color, 2.2);

    const ref = Math.abs(dir.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
    const perp1 = Vec3.norm(Vec3.cross(dir, ref));
    const perp2 = Vec3.cross(dir, perp1);
    const headLen = Math.min(0.45, len * 0.28);
    const headBase = Vec3.addScaled(tip, dir, -headLen);
    const headRadius = headLen * 0.45;

    this.drawLine3D(tip, Vec3.addScaled(headBase, perp1, headRadius), color, 2.0);
    this.drawLine3D(tip, Vec3.addScaled(headBase, perp1, -headRadius), color, 2.0);
    this.drawLine3D(tip, Vec3.addScaled(headBase, perp2, headRadius), color, 2.0);
    this.drawLine3D(tip, Vec3.addScaled(headBase, perp2, -headRadius), color, 2.0);

    if (label) {
      const tipProj = this.project(tip);
      if (tipProj) {
        const ctx = this.ctx;
        ctx.save();
        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = color;
        ctx.fillText(label, tipProj.x + 6, tipProj.y - 4);
        ctx.restore();
      }
    }
  }

  processParticlesAndCrashes(sim, dt) {
    // 1. Process newly triggered Crash Events from physics engine
    while (sim.crashEvents.length > 0) {
      const ev = sim.crashEvents.shift();
      this.shakeIntensity = Math.min(0.95, 0.15 + ev.gForce * 0.025);

      // Flash HUD overlay
      const crashOverlay = document.getElementById('crash-overlay');
      if (crashOverlay) {
        crashOverlay.style.opacity = String(Math.min(1, 0.35 + ev.gForce * 0.03));
        setTimeout(() => {
          crashOverlay.style.opacity = '0';
        }, 180);
      }

      // Spawn expanding 3D crash shockwave ring
      this.crashRings.push({
        pos: Vec3.clone(ev.pos),
        r: 0.35,
        maxR: Math.min(6.5, 1.8 + ev.gForce * 0.14),
        life: 1.0,
        gForce: ev.gForce,
        locationId: ev.locationId,
      });

      // Spawn 3D vector debris shards & collision sparks
      const shardCount = Math.min(32, Math.floor(8 + ev.gForce * 0.7));
      for (let i = 0; i < shardCount; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 3.0 + Math.random() * (4.0 + ev.gForce * 0.25);
        this.crashShards.push({
          x: ev.pos.x,
          y: ev.pos.y + 0.1,
          z: ev.pos.z,
          vx: Math.cos(ang) * spd,
          vy: 2.0 + Math.random() * 5.5,
          vz: Math.sin(ang) * spd,
          size: 0.12 + Math.random() * 0.22,
          rot: Math.random() * Math.PI,
          vRot: (Math.random() - 0.5) * 14,
          life: 1.0,
          color: i % 2 === 0 ? '#ff3860' : '#ffae00',
        });
      }
    }

    // 2. Plume ground wash & 1000kW RWD tire slip smoke
    for (const key of ['D_FL', 'D_FR', 'D_RL', 'D_RR']) {
      const t = sim.thrusters[key];
      if (t.currentForce > 250 && sim.fuelMass > 0) {
        const surf = sampleSurface(sim.arena, t.worldPos.x, t.worldPos.y, t.worldPos.z);
        const heightAbove = t.worldPos.y - surf.y;

        if (heightAbove > 0 && heightAbove < 6.5 && Math.random() < 0.6) {
          const angle = Math.random() * Math.PI * 2;
          const speed = (1.5 + (t.currentForce / 3000) * 3.5) * (1 - heightAbove / 7.5);
          this.particles.push({
            x: t.worldPos.x,
            y: surf.y + 0.08,
            z: t.worldPos.z,
            vx: Math.cos(angle) * speed,
            vy: 0.4 + Math.random() * 0.8,
            vz: Math.sin(angle) * speed,
            r: 0.22 + Math.random() * 0.25,
            life: 1.0,
            decay: 1.5 + Math.random() * 0.8,
            color: Math.random() < 0.35 ? '255, 140, 120' : '140, 235, 255',
          });
        }
      }
    }

    // RWD Wheelspin tire smoke
    for (const w of sim.wheels) {
      if (w.wheelspin && w.grounded && Math.random() < 0.65) {
        const wWorld = Vec3.add(sim.pos, Quat.rotate(sim.quat, { x: w.pos.x, y: w.pos.y - 0.2, z: w.pos.z }));
        this.particles.push({
          x: wWorld.x,
          y: wWorld.y,
          z: wWorld.z,
          vx: (Math.random() - 0.5) * 1.4,
          vy: 0.5 + Math.random() * 0.6,
          vz: (Math.random() - 0.5) * 1.4,
          r: 0.2 + Math.random() * 0.2,
          life: 0.9,
          decay: 1.8,
          color: '220, 235, 245',
        });
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.r += 1.4 * dt;
      p.life -= p.decay * dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // Update 3D crash shards
    for (let i = this.crashShards.length - 1; i >= 0; i--) {
      const s = this.crashShards[i];
      s.vy -= sim.gravity * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.z += s.vz * dt;
      s.rot += s.vRot * dt;
      if (s.y < 0.05) {
        s.y = 0.05;
        s.vy = -s.vy * 0.45;
        s.vx *= 0.8;
        s.vz *= 0.8;
      }
      s.life -= dt * 0.85;
      if (s.life <= 0) this.crashShards.splice(i, 1);
    }

    // Update 3D crash rings
    for (let i = this.crashRings.length - 1; i >= 0; i--) {
      const r = this.crashRings[i];
      r.r += (r.maxR - r.r) * dt * 5.5;
      r.life -= dt * 0.9;
      if (r.life <= 0) this.crashRings.splice(i, 1);
    }
  }

  render(sim, dt) {
    this.time += dt;
    if (sim.fanEnabled) {
      this.fanAngle += dt * 42;
    }
    this.updateCamera(sim, dt);
    this.processParticlesAndCrashes(sim, dt);

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    if (this.renderMode === 'solid') {
      // Old-School Solid 3D Horizon Sky & Ground Shading
      const horizonPt = this.project(Vec3.addScaled(this.camPos, { x: this.camForward.x, y: 0, z: this.camForward.z }, 200));
      const horizonY = horizonPt ? Math.max(0, Math.min(this.height, horizonPt.y)) : this.height * 0.45;

      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      skyGrad.addColorStop(0, '#0a1936');
      skyGrad.addColorStop(1, '#1e3f6e');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, this.width, horizonY);

      const gndGrad = ctx.createLinearGradient(0, horizonY, 0, this.height);
      gndGrad.addColorStop(0, '#14261d');
      gndGrad.addColorStop(1, '#0c1712');
      ctx.fillStyle = gndGrad;
      ctx.fillRect(0, horizonY, this.width, this.height - horizonY);
    } else {
      // Vector Wireframe dark background vignette
      const bgGrad = ctx.createRadialGradient(
        this.width * 0.5,
        this.height * 0.5,
        40,
        this.width * 0.5,
        this.height * 0.5,
        Math.max(this.width, this.height) * 0.75
      );
      bgGrad.addColorStop(0, '#081221');
      bgGrad.addColorStop(1, '#03060c');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // 1. Floor Grid
    this.renderFloorGrid(sim);

    // 2. Arena Ramps, Landing Pads, and Rings
    this.renderArena(sim);

    // 3. Drop Shadow & Suction Vortex
    this.renderDropShadowAndSuction(sim);

    // 4. Particles & Crash Shards
    this.renderParticlesAndCrashFX();

    // 5. Car Body, 3D Fuel Tank, Suspension, Wheels & Underbody Skirt
    this.renderCar(sim);

    // 6. 8 Thruster Plumes
    this.renderThrusterPlumes(sim);

    // 7. 3D Force Vectors Overlay
    if (this.showVectors) {
      this.renderForceVectors(sim);
    }

    // 8. 2D HUD Canvases (Schematic & Fuel Tank Gauge)
    this.renderSchematic(sim);
    this.renderFuelTankHUD(sim);
  }

  renderFloorGrid(sim) {
    const gridSpacing = 4;
    const halfSpan = 60;
    const centerX = Math.floor(sim.pos.x / gridSpacing) * gridSpacing;
    const centerZ = Math.floor(sim.pos.z / gridSpacing) * gridSpacing;
    const isSolid = this.renderMode === 'solid';

    for (let x = centerX - halfSpan; x <= centerX + halfSpan; x += gridSpacing) {
      const isMajor = Math.abs(x % 16) === 0;
      const color = isSolid
        ? isMajor ? 'rgba(120, 210, 160, 0.28)' : 'rgba(120, 210, 160, 0.1)'
        : isMajor ? 'rgba(0, 229, 255, 0.22)' : 'rgba(0, 229, 255, 0.08)';
      this.drawLine3D(
        { x, y: 0, z: centerZ - halfSpan },
        { x, y: 0, z: centerZ + halfSpan },
        color,
        isMajor ? 1.2 : 0.8
      );
    }

    for (let z = centerZ - halfSpan; z <= centerZ + halfSpan; z += gridSpacing) {
      const isMajor = Math.abs(z % 16) === 0;
      const color = isSolid
        ? isMajor ? 'rgba(120, 210, 160, 0.28)' : 'rgba(120, 210, 160, 0.1)'
        : isMajor ? 'rgba(0, 229, 255, 0.22)' : 'rgba(0, 229, 255, 0.08)';
      this.drawLine3D(
        { x: centerX - halfSpan, y: 0, z },
        { x: centerX + halfSpan, y: 0, z },
        color,
        isMajor ? 1.2 : 0.8
      );
    }
  }

  renderArena(sim) {
    const isSolid = this.renderMode === 'solid';

    // Ramps
    for (const ramp of sim.arena.ramps) {
      const hw = ramp.w * 0.5;
      const p0 = { x: ramp.x - hw, y: ramp.yStart, z: ramp.zStart };
      const p1 = { x: ramp.x + hw, y: ramp.yStart, z: ramp.zStart };
      const p2 = { x: ramp.x + hw, y: ramp.yEnd, z: ramp.zEnd };
      const p3 = { x: ramp.x - hw, y: ramp.yEnd, z: ramp.zEnd };
      const b2 = { x: ramp.x + hw, y: 0, z: ramp.zEnd };
      const b3 = { x: ramp.x - hw, y: 0, z: ramp.zEnd };

      if (isSolid) {
        // Old-school flat-shaded solid ramp polygons
        this.drawPoly3D([p0, p3, b3], 'rgb(52, 85, 115)', '#88c5f0', 1);
        this.drawPoly3D([p1, b2, p2], 'rgb(42, 70, 96)', '#88c5f0', 1);
        this.drawPoly3D([p3, p2, b2, b3], 'rgb(36, 58, 82)', '#88c5f0', 1);
        this.drawPoly3D([p0, p1, p2, p3], 'rgb(75, 130, 175)', '#b6e3ff', 1.5);
      } else {
        this.drawLine3D(p0, p1, '#00e5ff', 1.8);
        this.drawLine3D(p1, p2, '#00e5ff', 1.8);
        this.drawLine3D(p2, p3, '#00e5ff', 1.8);
        this.drawLine3D(p3, p0, '#00e5ff', 1.8);
        this.drawLine3D(p2, b2, 'rgba(0, 229, 255, 0.45)', 1.2);
        this.drawLine3D(p3, b3, 'rgba(0, 229, 255, 0.45)', 1.2);
      }

      for (let s = 0.2; s < 1.0; s += 0.2) {
        const y = ramp.yStart + s * (ramp.yEnd - ramp.yStart);
        const z = ramp.zStart + s * (ramp.zEnd - ramp.zStart);
        this.drawLine3D(
          { x: ramp.x - hw, y, z },
          { x: ramp.x + hw, y, z },
          isSolid ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 229, 255, 0.35)',
          1.0
        );
      }
    }

    // Landing Pads
    for (const pad of sim.arena.pads) {
      const hw = pad.w * 0.5;
      const hd = pad.d * 0.5;
      const y = pad.y;
      const col = pad.visited ? '#00ff9d' : pad.color;

      const c0 = { x: pad.x - hw, y, z: pad.z - hd };
      const c1 = { x: pad.x + hw, y, z: pad.z - hd };
      const c2 = { x: pad.x + hw, y, z: pad.z + hd };
      const c3 = { x: pad.x - hw, y, z: pad.z + hd };

      if (pad.y > 0.5) {
        this.drawLine3D(c0, { x: c0.x, y: 0, z: c0.z }, isSolid ? '#466c8c' : 'rgba(0, 229, 255, 0.25)', isSolid ? 2.5 : 1.2);
        this.drawLine3D(c1, { x: c1.x, y: 0, z: c1.z }, isSolid ? '#466c8c' : 'rgba(0, 229, 255, 0.25)', isSolid ? 2.5 : 1.2);
        this.drawLine3D(c2, { x: c2.x, y: 0, z: c2.z }, isSolid ? '#466c8c' : 'rgba(0, 229, 255, 0.25)', isSolid ? 2.5 : 1.2);
        this.drawLine3D(c3, { x: c3.x, y: 0, z: c3.z }, isSolid ? '#466c8c' : 'rgba(0, 229, 255, 0.25)', isSolid ? 2.5 : 1.2);
      }

      if (isSolid) {
        const yBot = Math.max(0, y - pad.h);
        const b0 = { x: c0.x, y: yBot, z: c0.z };
        const b1 = { x: c1.x, y: yBot, z: c1.z };
        const b2 = { x: c2.x, y: yBot, z: c2.z };
        const b3 = { x: c3.x, y: yBot, z: c3.z };
        this.drawPoly3D([c0, c1, b1, b0], 'rgb(42, 60, 82)', col, 1);
        this.drawPoly3D([c1, c2, b2, b1], 'rgb(52, 74, 98)', col, 1);
        this.drawPoly3D([c0, c1, c2, c3], 'rgb(64, 90, 118)', col, 2);
      } else {
        this.drawLine3D(c0, c1, col, 2.2);
        this.drawLine3D(c1, c2, col, 2.2);
        this.drawLine3D(c2, c3, col, 2.2);
        this.drawLine3D(c3, c0, col, 2.2);
      }

      const iw = hw * 0.55;
      const id = hd * 0.55;
      this.drawLine3D({ x: pad.x - iw, y: y + 0.02, z: pad.z - id }, { x: pad.x + iw, y: y + 0.02, z: pad.z - id }, col, 1.2);
      this.drawLine3D({ x: pad.x + iw, y: y + 0.02, z: pad.z - id }, { x: pad.x + iw, y: y + 0.02, z: pad.z + id }, col, 1.2);
      this.drawLine3D({ x: pad.x + iw, y: y + 0.02, z: pad.z + id }, { x: pad.x - iw, y: y + 0.02, z: pad.z + id }, col, 1.2);
      this.drawLine3D({ x: pad.x - iw, y: y + 0.02, z: pad.z + id }, { x: pad.x - iw, y: y + 0.02, z: pad.z - id }, col, 1.2);

      const labelPos = this.project({ x: pad.x, y: pad.y + 1.4, z: pad.z });
      if (labelPos && labelPos.depth < 95) {
        this.ctx.save();
        this.ctx.font = 'bold 11px monospace';
        this.ctx.fillStyle = col;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${pad.id} [${pad.y.toFixed(0)}m]`, labelPos.x, labelPos.y);
        this.ctx.restore();
      }
    }

    // Waypoint Rings
    for (const ring of sim.arena.rings) {
      const col = ring.passed ? 'rgba(0, 255, 157, 0.45)' : '#ff7b29';
      const segs = 16;
      const n = Vec3.norm(ring.normal);
      const upRef = Math.abs(n.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
      const u = Vec3.norm(Vec3.cross(n, upRef));
      const v = Vec3.cross(n, u);

      let prev = null;
      for (let i = 0; i <= segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        const cos = Math.cos(a) * ring.r;
        const sin = Math.sin(a) * ring.r;
        const pt = {
          x: ring.x + u.x * cos + v.x * sin,
          y: ring.y + u.y * cos + v.y * sin,
          z: ring.z + u.z * cos + v.z * sin,
        };
        if (prev) {
          this.drawLine3D(prev, pt, col, ring.passed ? 1.4 : 2.5);
        }
        prev = pt;
      }
    }
  }

  renderDropShadowAndSuction(sim) {
    const surf = sampleSurface(sim.arena, sim.pos.x, sim.pos.y, sim.pos.z);
    this.drawLine3D(
      sim.pos,
      { x: sim.pos.x, y: surf.y, z: sim.pos.z },
      'rgba(0, 229, 255, 0.35)',
      1.0,
      [4, 4]
    );

    const corners = [
      { x: -0.95, y: 0, z: 2.1 },
      { x: 0.95, y: 0, z: 2.1 },
      { x: 0.95, y: 0, z: -2.1 },
      { x: -0.95, y: 0, z: -2.1 },
    ].map((c) => {
      const rw = Quat.rotate(sim.quat, c);
      return { x: sim.pos.x + rw.x, y: surf.y + 0.02, z: sim.pos.z + rw.z };
    });

    if (this.renderMode === 'solid') {
      this.drawPoly3D(corners, 'rgba(0, 0, 0, 0.42)', 'rgba(0, 229, 255, 0.25)', 1);
    } else {
      for (let i = 0; i < 4; i++) {
        this.drawLine3D(corners[i], corners[(i + 1) % 4], 'rgba(0, 229, 255, 0.25)', 1.2);
      }
    }

    // 60kW Suction Ventilator Ground Vortex & Inward Airflow Lines
    if (sim.fanEnabled) {
      const fanWorld = Vec3.add(sim.pos, Quat.rotate(sim.quat, { x: 0, y: -0.25, z: -1.85 }));
      const sealRatio = Math.min(1, sim.suctionForceMag / 22000);
      const vortexColor = sealRatio > 0.35 ? '#c864ff' : 'rgba(200, 100, 255, 0.45)';

      // Draw spinning turbine blades on rear diffuser
      const blades = 6;
      for (let i = 0; i < blades; i++) {
        const a = this.fanAngle + (i / blades) * Math.PI * 2;
        const bTipLocal = { x: Math.cos(a) * 0.32, y: -0.22 + Math.sin(a) * 0.32, z: -2.16 };
        const bCenterWorld = Vec3.add(sim.pos, Quat.rotate(sim.quat, { x: 0, y: -0.22, z: -2.16 }));
        const bTipWorld = Vec3.add(sim.pos, Quat.rotate(sim.quat, bTipLocal));
        this.drawLine3D(bCenterWorld, bTipWorld, '#c864ff', 2.0);
      }

      // Draw inward ground suction streamlines under the plenum
      const rays = 8;
      const phase = (this.time * 3.5) % 1;
      for (let i = 0; i < rays; i++) {
        const ang = (i / rays) * Math.PI * 2 + this.time * 1.5;
        const outerR = 1.65 * (1 - phase * 0.65);
        const innerR = Math.max(0.2, outerR - 0.55);
        const pOuter = {
          x: sim.pos.x + Math.cos(ang) * outerR,
          y: surf.y + 0.04,
          z: sim.pos.z + Math.sin(ang) * outerR,
        };
        const pInner = {
          x: sim.pos.x + Math.cos(ang) * innerR,
          y: surf.y + 0.14,
          z: sim.pos.z + Math.sin(ang) * innerR,
        };
        this.drawLine3D(pOuter, pInner, vortexColor, 1.5 + sealRatio * 1.2);
      }
    }
  }

  renderParticlesAndCrashFX() {
    const ctx = this.ctx;

    // Ground plume & tire smoke particles
    for (const p of this.particles) {
      const proj = this.project(p);
      if (!proj) continue;
      const rad = Math.max(2, p.r * proj.scale);
      ctx.save();
      ctx.strokeStyle = `rgba(${p.color}, ${p.life * 0.55})`;
      ctx.fillStyle = `rgba(${p.color}, ${p.life * 0.18})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 3D Crash Shockwave Rings & G-Force Callouts
    for (const r of this.crashRings) {
      const segs = 16;
      const col = `rgba(255, 56, 96, ${r.life.toFixed(2)})`;
      let prev = null;
      for (let i = 0; i <= segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        const pt = {
          x: r.pos.x + Math.cos(a) * r.r,
          y: r.pos.y + 0.05,
          z: r.pos.z + Math.sin(a) * r.r,
        };
        if (prev) this.drawLine3D(prev, pt, col, 2.4);
        prev = pt;
      }

      const tagProj = this.project({ x: r.pos.x, y: r.pos.y + 0.8 + (1 - r.life) * 1.4, z: r.pos.z });
      if (tagProj) {
        ctx.save();
        ctx.font = 'bold 12px monospace';
        ctx.fillStyle = `rgba(255, 70, 100, ${r.life.toFixed(2)})`;
        ctx.textAlign = 'center';
        ctx.fillText(`IMPACT ${r.gForce.toFixed(1)}G!`, tagProj.x, tagProj.y);
        ctx.restore();
      }
    }

    // 3D Vector Crash Shards
    for (const s of this.crashShards) {
      const c = Math.cos(s.rot) * s.size;
      const sn = Math.sin(s.rot) * s.size;
      const p0 = { x: s.x - c, y: s.y - sn, z: s.z };
      const p1 = { x: s.x + c, y: s.y - sn, z: s.z + sn };
      const p2 = { x: s.x, y: s.y + c, z: s.z - c };
      this.drawLine3D(p0, p1, s.color, 1.8);
      this.drawLine3D(p1, p2, s.color, 1.8);
      this.drawLine3D(p2, p0, s.color, 1.8);
    }
  }

  renderCar(sim) {
    const ctx = this.ctx;
    const isSolid = this.renderMode === 'solid';

    // 1. Render Underbody Flexible Suction Skirt (extends below chassis sill)
    const skirtDrop = -0.32 - sim.skirtLength;
    const skirtCornersLocal = [
      { x: -0.92, y: -0.32, z: 1.35 },
      { x: 0.92, y: -0.32, z: 1.35 },
      { x: 0.92, y: -0.32, z: -1.35 },
      { x: -0.92, y: -0.32, z: -1.35 },
      { x: -0.92, y: skirtDrop, z: 1.35 },
      { x: 0.92, y: skirtDrop, z: 1.35 },
      { x: 0.92, y: skirtDrop, z: -1.35 },
      { x: -0.92, y: skirtDrop, z: -1.35 },
    ].map((p) => {
      const wp = Vec3.add(sim.pos, Quat.rotate(sim.quat, p));
      const surf = sampleSurface(sim.arena, wp.x, wp.y, wp.z);
      // Skirt flexes against flat surface instead of penetrating it
      if (wp.y < surf.y + 0.02) wp.y = surf.y + 0.02;
      return wp;
    });

    const isSealed = sim.fanEnabled && sim.sealGapMeters < 0.06;
    const skirtStroke = isSealed ? '#c864ff' : 'rgba(200, 100, 255, 0.38)';
    for (let i = 0; i < 4; i++) {
      const next = (i + 1) % 4;
      this.drawLine3D(skirtCornersLocal[i + 4], skirtCornersLocal[next + 4], skirtStroke, isSealed ? 2.2 : 1.2);
      this.drawLine3D(skirtCornersLocal[i], skirtCornersLocal[i + 4], skirtStroke, 1.2);
      if (isSolid || sim.fanEnabled) {
        this.drawPoly3D(
          [skirtCornersLocal[i], skirtCornersLocal[next], skirtCornersLocal[next + 4], skirtCornersLocal[i + 4]],
          isSealed ? 'rgba(200, 100, 255, 0.25)' : 'rgba(40, 25, 55, 0.35)',
          skirtStroke,
          1.0
        );
      }
    }

    // 2. Render 4 Suspension Struts & Aero Disc Wheels
    const wheelRadius = 0.37;
    const wheelSegs = 14;
    for (const w of sim.wheels) {
      const sideOffset = w.pos.x < 0 ? -0.06 : 0.06;
      // Wheel vertical offset reflects custom suspension restLength and live compression!
      const wheelDropY = w.pos.y - (sim.suspensionRestLength - w.compression) + wheelRadius * 0.45;
      const wheelCenterLocal = {
        x: w.pos.x + sideOffset,
        y: wheelDropY,
        z: w.pos.z,
      };
      const mountWorld = Vec3.add(sim.pos, Quat.rotate(sim.quat, w.pos));
      const wheelCenterWorld = Vec3.add(sim.pos, Quat.rotate(sim.quat, wheelCenterLocal));

      // Draw 3D Suspension Strut (Turns bright red when bottomed out!)
      const strutCol = w.bottomedOut ? '#ff3860' : w.ratio > 0.75 ? '#ffae00' : '#00ff9d';
      this.drawLine3D(mountWorld, wheelCenterWorld, strutCol, w.bottomedOut ? 3.2 : 2.0);

      // Front wheels steer visually by currentSteerAngle
      const steer = w.isFront ? sim.currentSteerAngle : 0;
      const cosS = Math.cos(steer);
      const sinS = Math.sin(steer);

      if (isSolid) {
        // Solid flat-shaded wheel disc
        const discPts = [];
        for (let i = 0; i < wheelSegs; i++) {
          const ang = (i / wheelSegs) * Math.PI * 2;
          const dy = Math.sin(ang) * wheelRadius;
          const dz = Math.cos(ang) * wheelRadius;
          const rimLocal = {
            x: wheelCenterLocal.x + dz * sinS,
            y: wheelCenterLocal.y + dy,
            z: wheelCenterLocal.z + dz * cosS,
          };
          discPts.push(Vec3.add(sim.pos, Quat.rotate(sim.quat, rimLocal)));
        }
        this.drawPoly3D(discPts, 'rgb(38, 46, 56)', '#9be2ff', 1.6);
      } else {
        for (const rScale of [1.0, 0.72, 0.22]) {
          let prevPt = null;
          for (let i = 0; i <= wheelSegs; i++) {
            const ang = (i / wheelSegs) * Math.PI * 2;
            const dy = Math.sin(ang) * wheelRadius * rScale;
            const dz = Math.cos(ang) * wheelRadius * rScale;
            const rimLocal = {
              x: wheelCenterLocal.x + dz * sinS,
              y: wheelCenterLocal.y + dy,
              z: wheelCenterLocal.z + dz * cosS,
            };
            const rimWorld = Vec3.add(sim.pos, Quat.rotate(sim.quat, rimLocal));
            if (prevPt) {
              const rimCol = w.wheelspin && rScale === 1.0 ? '#00ff9d' : rScale === 1.0 ? '#e6f7ff' : 'rgba(0, 229, 255, 0.55)';
              this.drawLine3D(prevPt, rimWorld, rimCol, rScale === 1.0 ? 1.8 : 1.1);
            }
            prevPt = rimWorld;
          }
        }
      }
    }

    // 3. Render 3D Internal Rocket Fuel Tank inside the Mid-Rear Chassis Bay
    this.render3DFuelTankInsideCar(sim);

    // 4. Transform Car Mesh Vertices (Applying Corner Structural Crash Deformation!)
    const worldVerts = this.carMesh.v.map((lv) => {
      let dy = 0;
      let dz = 0;
      if (lv.corner && sim.cornerDamage[lv.corner] > 0) {
        const dmg = sim.cornerDamage[lv.corner];
        dy = dmg * 0.85; // Bent upward/inward from bottom-out impact
        dz = lv.z > 0 ? -dmg * 0.45 : dmg * 0.45;
      }
      return Vec3.add(
        sim.pos,
        Quat.rotate(sim.quat, { x: lv.x, y: lv.y + dy, z: lv.z + dz })
      );
    });

    // Sort faces back-to-front (Painter's Algorithm)
    const sortedFaces = this.carMesh.faces
      .map((face) => {
        let sumDepth = 0;
        const projPts = [];
        for (const vi of face.idx) {
          const p = this.project(worldVerts[vi]);
          if (!p) return null;
          sumDepth += p.depth;
          projPts.push(p);
        }
        // Compute world face normal for Solid 3D flat shading
        const v0 = worldVerts[face.idx[0]];
        const v1 = worldVerts[face.idx[1]];
        const v2 = worldVerts[face.idx[2]];
        const normal = Vec3.norm(Vec3.cross(Vec3.sub(v1, v0), Vec3.sub(v2, v0)));
        return {
          face,
          projPts,
          normal,
          avgDepth: sumDepth / face.idx.length,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.avgDepth - a.avgDepth);

    for (const item of sortedFaces) {
      const { face, projPts, normal } = item;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(projPts[0].x, projPts[0].y);
      for (let i = 1; i < projPts.length; i++) {
        ctx.lineTo(projPts[i].x, projPts[i].y);
      }
      ctx.closePath();

      if (isSolid) {
        ctx.fillStyle = face.isGlass
          ? 'rgba(32, 75, 118, 0.82)'
          : this.shadeRGB(face.baseRGB, normal);
        ctx.fill();
        ctx.strokeStyle = face.isTail ? '#ff3860' : 'rgba(15, 25, 38, 0.65)';
        ctx.lineWidth = face.isTail ? 2.2 : 1.0;
        ctx.stroke();
      } else {
        ctx.fillStyle = face.fill;
        ctx.fill();
        ctx.strokeStyle = face.stroke;
        ctx.lineWidth = face.isTail ? 2.4 : 1.65;
        if (face.isTail) {
          ctx.shadowColor = '#ff3860';
          ctx.shadowBlur = 10;
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    // Draw Thruster Nozzle Ports
    for (const key of Object.keys(sim.thrusters)) {
      const t = sim.thrusters[key];
      const pProj = this.project(t.worldPos);
      if (!pProj) continue;
      ctx.save();
      ctx.fillStyle = t.group === 'down' ? '#00e5ff' : '#ff7b29';
      ctx.beginPath();
      ctx.arc(pProj.x, pProj.y, Math.max(2.5, 0.09 * pProj.scale), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  render3DFuelTankInsideCar(sim) {
    // 3D Propellant Tank located in the mid-rear bay (x: -0.48..0.48, y: -0.22..0.24, z: -0.95..-0.05)
    const ratio = Math.max(0, Math.min(1, sim.fuelMass / Math.max(1, sim.fuelCapacity)));
    const x0 = -0.46, x1 = 0.46;
    const y0 = -0.22, y1 = 0.22;
    const z0 = -0.92, z1 = -0.05;
    const yFill = y0 + (y1 - y0) * ratio;

    // Tank outer wireframe box
    const box = [
      { x: x0, y: y0, z: z0 }, { x: x1, y: y0, z: z0 },
      { x: x1, y: y0, z: z1 }, { x: x0, y: y0, z: z1 },
      { x: x0, y: y1, z: z0 }, { x: x1, y: y1, z: z0 },
      { x: x1, y: y1, z: z1 }, { x: x0, y: y1, z: z1 },
    ].map((p) => Vec3.add(sim.pos, Quat.rotate(sim.quat, p)));

    for (let i = 0; i < 4; i++) {
      const n = (i + 1) % 4;
      this.drawLine3D(box[i], box[n], 'rgba(0, 255, 157, 0.35)', 1.0);
      this.drawLine3D(box[i + 4], box[n + 4], 'rgba(0, 255, 157, 0.35)', 1.0);
      this.drawLine3D(box[i], box[i + 4], 'rgba(0, 255, 157, 0.35)', 1.0);
    }

    // 3D Liquid Level Surface inside tank
    if (ratio > 0.01) {
      const liqColor = ratio < 0.2 ? 'rgba(255, 56, 96, 0.65)' : 'rgba(0, 255, 157, 0.55)';
      const liqStroke = ratio < 0.2 ? '#ff3860' : '#00ff9d';
      const topSurf = [
        { x: x0, y: yFill, z: z0 },
        { x: x1, y: yFill, z: z0 },
        { x: x1, y: yFill, z: z1 },
        { x: x0, y: yFill, z: z1 },
      ].map((p) => Vec3.add(sim.pos, Quat.rotate(sim.quat, p)));

      this.drawPoly3D(topSurf, liqColor, liqStroke, 1.5);
    }
  }

  renderThrusterPlumes(sim) {
    if (sim.fuelMass <= 0.001) return;

    for (const key of Object.keys(sim.thrusters)) {
      const t = sim.thrusters[key];
      if (t.currentForce < 30) continue;

      const isDown = t.group === 'down';
      const maxRef = isDown ? sim.downMaxForce : sim.sideMaxForce;
      const ratio = Math.min(1.5, t.currentForce / Math.max(1000, maxRef));

      const flicker = 0.92 + 0.16 * Math.sin(this.time * 65 + key.length * 7);
      const plumeLen = (isDown ? 2.1 : 1.45) * ratio * flicker;

      const nozzle = t.worldPos;
      const tip = Vec3.addScaled(nozzle, t.worldPlumeDir, plumeLen);

      const ref = Math.abs(t.worldPlumeDir.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
      const u = Vec3.norm(Vec3.cross(t.worldPlumeDir, ref));
      const v = Vec3.cross(t.worldPlumeDir, u);

      const outerColor = isDown ? 'rgba(0, 229, 255, 0.88)' : 'rgba(255, 123, 41, 0.9)';
      const coneRad = (isDown ? 0.18 : 0.13) * Math.min(1.2, 0.5 + ratio * 0.6);
      const midPt = Vec3.addScaled(nozzle, t.worldPlumeDir, plumeLen * 0.42);

      for (let i = 0; i < 4; i++) {
        const ang = (i / 4) * Math.PI * 2 + this.time * 8;
        const rimOffset = Vec3.addScaled(
          Vec3.scale(u, Math.cos(ang) * coneRad),
          v,
          Math.sin(ang) * coneRad
        );
        const midRim = Vec3.add(midPt, rimOffset);
        this.drawLine3D(nozzle, midRim, outerColor, 2.0);
        this.drawLine3D(midRim, tip, outerColor, 1.6);
      }

      this.drawLine3D(
        nozzle,
        Vec3.addScaled(nozzle, t.worldPlumeDir, plumeLen * 0.78),
        '#ffffff',
        3.2
      );
    }
  }

  renderForceVectors(sim) {
    // 1. Individual Thruster Force Vectors F_i
    for (const key of Object.keys(sim.thrusters)) {
      const t = sim.thrusters[key];
      if (t.currentForce > 80) {
        const kN = (t.currentForce / 1000).toFixed(1);
        const col = t.group === 'down' ? '#00e5ff' : '#ff7b29';
        this.drawVectorArrow3D(
          t.worldPos,
          t.worldForce,
          0.00038,
          col,
          `${t.id.replace('_', '-')}: ${kN}kN`
        );
      }
    }

    // 2. Gravity Vector m*g (Red)
    const fg = { x: 0, y: -sim.mass * sim.gravity, z: 0 };
    if (sim.gravity > 0.05) {
      this.drawVectorArrow3D(
        sim.pos,
        fg,
        0.00014,
        '#ff3860',
        `mg (${((sim.mass * sim.gravity) / 1000).toFixed(1)}kN)`
      );
    }

    // 3. 60kW Suction Fan Downforce Vector (Purple)
    if (sim.suctionForceMag > 200) {
      this.drawVectorArrow3D(
        sim.pos,
        sim.suctionForceWorld,
        0.00016,
        '#c864ff',
        `F_fan (-${(sim.suctionForceMag / 1000).toFixed(1)}kN)`
      );
    }

    // 4. Net Thrust Vector (Green)
    if (Vec3.len(sim.netThrustForceWorld) > 200) {
      this.drawVectorArrow3D(
        sim.pos,
        sim.netThrustForceWorld,
        0.00014,
        '#00ff9d',
        `ΣF_thrust`
      );
    }

    // 5. Velocity Vector v (Yellow)
    if (Vec3.len(sim.vel) > 0.4) {
      this.drawVectorArrow3D(
        sim.pos,
        sim.vel,
        0.22,
        '#ffea00',
        `v (${Vec3.len(sim.vel).toFixed(1)}m/s)`
      );
    }
  }

  renderFuelTankHUD(sim) {
    if (!this.fuelCtx) return;
    const ctx = this.fuelCtx;
    const w = this.fuelCanvas.width;
    const h = this.fuelCanvas.height;
    ctx.clearRect(0, 0, w, h);

    const ratio = Math.max(0, Math.min(1, sim.fuelMass / Math.max(1, sim.fuelCapacity)));
    const euler = Quat.toEuler(sim.quat);
    const padX = 10;
    const padY = 10;
    const tankW = w - padX * 2;
    const tankH = h - padY * 2;

    // Tank capsule background
    ctx.save();
    ctx.strokeStyle = ratio < 0.2 ? '#ff3860' : '#00ff9d';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(padX, padY, tankW, tankH, 8);
    ctx.stroke();
    ctx.clip();

    // Animated sloshing propellant level inside the tank
    if (ratio > 0.002) {
      const fillTop = padY + tankH * (1 - ratio);
      const sloshTilt = Math.max(-10, Math.min(10, euler.roll * 18));
      const wave = Math.sin(this.time * 6) * (sim.fuelBurnRate > 0 ? 2.5 : 1.0);

      const grad = ctx.createLinearGradient(0, fillTop, 0, padY + tankH);
      if (ratio < 0.2) {
        grad.addColorStop(0, 'rgba(255, 56, 96, 0.85)');
        grad.addColorStop(1, 'rgba(140, 20, 45, 0.9)');
      } else {
        grad.addColorStop(0, 'rgba(0, 255, 157, 0.82)');
        grad.addColorStop(1, 'rgba(0, 140, 180, 0.88)');
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(padX, padY + tankH);
      ctx.lineTo(padX, fillTop - sloshTilt + wave);
      ctx.lineTo(padX + tankW * 0.5, fillTop - wave);
      ctx.lineTo(padX + tankW, fillTop + sloshTilt + wave);
      ctx.lineTo(padX + tankW, padY + tankH);
      ctx.closePath();
      ctx.fill();
    }

    // Graduation tick marks
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = 1;
    for (let t = 0.25; t < 1.0; t += 0.25) {
      const ty = padY + tankH * t;
      ctx.beginPath();
      ctx.moveTo(padX, ty);
      ctx.lineTo(padX + 8, ty);
      ctx.moveTo(padX + tankW - 8, ty);
      ctx.lineTo(padX + tankW, ty);
      ctx.stroke();
    }

    ctx.restore();

    // Overlay percentage text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(ratio * 100)}%`, w * 0.5, h * 0.5 + 4);
  }

  renderSchematic(sim) {
    const ctx = this.schCtx;
    const w = this.schCanvas.width;
    const h = this.schCanvas.height;
    ctx.clearRect(0, 0, w, h);

    const cx = w * 0.5;
    const cy = h * 0.5;

    ctx.strokeStyle = 'rgba(0, 229, 255, 0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, 6);
    ctx.lineTo(cx, h - 6);
    ctx.moveTo(10, cy);
    ctx.lineTo(w - 10, cy);
    ctx.stroke();

    // 60kW Suction Plenum Zone
    if (sim.fanEnabled) {
      ctx.fillStyle = 'rgba(200, 100, 255, 0.16)';
      ctx.strokeStyle = '#c864ff';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(cx - 28, cy - 38, 56, 78);
      ctx.fillRect(cx - 28, cy - 38, 56, 78);
    }

    // Car Wedge Outline
    ctx.strokeStyle = '#e6f7ff';
    ctx.fillStyle = 'rgba(0, 229, 255, 0.06)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 25, cy - 64);
    ctx.lineTo(cx + 25, cy - 64);
    ctx.lineTo(cx + 33, cy - 30);
    ctx.lineTo(cx + 33, cy + 50);
    ctx.lineTo(cx + 27, cy + 65);
    ctx.lineTo(cx - 27, cy + 65);
    ctx.lineTo(cx - 33, cy + 50);
    ctx.lineTo(cx - 33, cy - 30);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // RWD Rear Axle Torque Bar (Green)
    if (Math.abs(sim.currentRwdForce) > 50) {
      const rwdRatio = Math.min(1, Math.abs(sim.currentRwdForce) / 22000);
      ctx.fillStyle = '#00ff9d';
      ctx.fillRect(cx - 26 * rwdRatio, cy + 40, 52 * rwdRatio, 4);
    }

    // 4 Downward Corner Thrusters + Suspension Compression Rings
    const downCoords = [
      { id: 'D_FL', wIdx: 0, label: 'D1', x: cx - 23, y: cy - 40 },
      { id: 'D_FR', wIdx: 1, label: 'D2', x: cx + 23, y: cy - 40 },
      { id: 'D_RL', wIdx: 2, label: 'D3', x: cx - 23, y: cy + 40 },
      { id: 'D_RR', wIdx: 3, label: 'D4', x: cx + 23, y: cy + 40 },
    ];

    for (const dc of downCoords) {
      const t = sim.thrusters[dc.id];
      const wheel = sim.wheels[dc.wIdx];
      const ratio = Math.min(1.2, t.currentForce / Math.max(1000, sim.downMaxForce));

      ctx.strokeStyle = wheel.bottomedOut ? '#ff3860' : '#00e5ff';
      ctx.lineWidth = wheel.bottomedOut ? 2.2 : 1.4;
      ctx.beginPath();
      ctx.arc(dc.x, dc.y, 9, 0, Math.PI * 2);
      ctx.stroke();

      if (ratio > 0.01) {
        ctx.fillStyle = 'rgba(0, 229, 255, 0.78)';
        ctx.beginPath();
        ctx.arc(dc.x, dc.y, Math.min(9, 9 * ratio), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#e6f7ff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(dc.label, dc.x, dc.y - 12);
    }

    // 4 Side Lateral Thrusters
    const sideCoords = [
      { id: 'S_FL', label: 'S1', x: cx - 33, y: cy - 40, dir: -1 },
      { id: 'S_FR', label: 'S2', x: cx + 33, y: cy - 40, dir: 1 },
      { id: 'S_RL', label: 'S3', x: cx - 33, y: cy + 40, dir: -1 },
      { id: 'S_RR', label: 'S4', x: cx + 33, y: cy + 40, dir: 1 },
    ];

    for (const sc of sideCoords) {
      const t = sim.thrusters[sc.id];
      const ratio = Math.min(1.4, t.currentForce / Math.max(1000, sim.sideMaxForce));
      const barLen = ratio * 36;

      ctx.fillStyle = '#ff7b29';
      ctx.fillRect(sc.x - 2, sc.y - 4, 4, 8);

      if (barLen > 0.5) {
        ctx.fillStyle = 'rgba(255, 123, 41, 0.85)';
        ctx.fillRect(sc.dir < 0 ? sc.x - barLen : sc.x, sc.y - 3, barLen, 6);
      }

      ctx.fillStyle = '#ffae78';
      ctx.font = '9px monospace';
      ctx.textAlign = sc.dir < 0 ? 'right' : 'left';
      ctx.fillText(
        `${sc.label} ${(t.currentForce / 1000).toFixed(1)}kN`,
        sc.x + sc.dir * 6,
        sc.y + 15
      );
    }
  }
}
