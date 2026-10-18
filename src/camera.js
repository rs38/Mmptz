// ============================================================================
// VECTR-8 // Camera Pipeline, Projection Matrix, Mouse Orbit & 3D Drawing Primitives
// ============================================================================

import { Vec3, Quat } from './math.js';

export class Camera {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.cameraMode = 'chase';
    this.camYaw = -0.52;
    this.camPitch = 0.24;
    this.camDist = 10.5;
    this.camPos = { x: -6, y: 3.2, z: -9 };
    this.camTarget = { x: 0, y: 1.2, z: 0 };
    this.camForward = { x: 0, y: 0, z: 1 };
    this.camRight = { x: 1, y: 0, z: 0 };
    this.camUp = { x: 0, y: 1, z: 0 };
    this.focalLength = 800;

    this.shakeIntensity = 0;
    this.lightDir = Vec3.norm({ x: 0.45, y: 0.82, z: -0.35 });

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

  update(sim, dt) {
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
}
