// ============================================================================
// VECTR-8 // Particle Engine, 3D Crash Shockwaves, Debris Shards & Tire Smoke
// ============================================================================

import { Vec3, Quat } from './math.js';
import { sampleSurface } from './terrain.js';

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.crashShards = [];
    this.crashRings = [];
  }

  process(sim, dt, camera) {
    // 1. Process newly triggered Crash Events from physics engine
    while (sim.crashEvents.length > 0) {
      const ev = sim.crashEvents.shift();
      camera.shakeIntensity = Math.min(0.95, 0.15 + ev.gForce * 0.025);

      const crashOverlay = document.getElementById('crash-overlay');
      if (crashOverlay) {
        crashOverlay.style.opacity = String(Math.min(1, 0.35 + ev.gForce * 0.03));
        setTimeout(() => {
          crashOverlay.style.opacity = '0';
        }, 180);
      }

      this.crashRings.push({
        pos: Vec3.clone(ev.pos),
        r: 0.35,
        maxR: Math.min(6.5, 1.8 + ev.gForce * 0.14),
        life: 1.0,
        gForce: ev.gForce,
        locationId: ev.locationId,
      });

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

    // 2. Plume ground wash particles
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

    // 3. RWD Wheelspin tire smoke
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

  render(camera, ctx) {
    for (const p of this.particles) {
      const proj = camera.project(p);
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
        if (prev) camera.drawLine3D(prev, pt, col, 2.4);
        prev = pt;
      }

      const tagProj = camera.project({ x: r.pos.x, y: r.pos.y + 0.8 + (1 - r.life) * 1.4, z: r.pos.z });
      if (tagProj) {
        ctx.save();
        ctx.font = 'bold 12px monospace';
        ctx.fillStyle = `rgba(255, 70, 100, ${r.life.toFixed(2)})`;
        ctx.textAlign = 'center';
        ctx.fillText(`IMPACT ${r.gForce.toFixed(1)}G!`, tagProj.x, tagProj.y);
        ctx.restore();
      }
    }

    for (const s of this.crashShards) {
      const c = Math.cos(s.rot) * s.size;
      const sn = Math.sin(s.rot) * s.size;
      const p0 = { x: s.x - c, y: s.y - sn, z: s.z };
      const p1 = { x: s.x + c, y: s.y - sn, z: s.z + sn };
      const p2 = { x: s.x, y: s.y + c, z: s.z - c };
      camera.drawLine3D(p0, p1, s.color, 1.8);
      camera.drawLine3D(p1, p2, s.color, 1.8);
      camera.drawLine3D(p2, p0, s.color, 1.8);
    }
  }
}
