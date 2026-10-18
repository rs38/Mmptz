// ============================================================================
// VECTR-8 // Vehicle Rendering (Chassis, Struts, Wheels, 3D Fuel Cell, Plumes & Vectors)
// ============================================================================

import { Vec3, Quat } from './math.js';
import { sampleSurface } from './terrain.js';

export function renderCar(camera, ctx, sim, carMesh, renderMode) {
  const isSolid = renderMode === 'solid';

  // 1. Underbody Flexible Suction Skirt
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
    if (wp.y < surf.y + 0.02) wp.y = surf.y + 0.02;
    return wp;
  });

  const isSealed = sim.fanEnabled && sim.sealGapMeters < 0.06;
  const skirtStroke = isSealed ? '#c864ff' : 'rgba(200, 100, 255, 0.38)';
  for (let i = 0; i < 4; i++) {
    const next = (i + 1) % 4;
    camera.drawLine3D(skirtCornersLocal[i + 4], skirtCornersLocal[next + 4], skirtStroke, isSealed ? 2.2 : 1.2);
    camera.drawLine3D(skirtCornersLocal[i], skirtCornersLocal[i + 4], skirtStroke, 1.2);
    if (isSolid || sim.fanEnabled) {
      camera.drawPoly3D(
        [skirtCornersLocal[i], skirtCornersLocal[next], skirtCornersLocal[next + 4], skirtCornersLocal[i + 4]],
        isSealed ? 'rgba(200, 100, 255, 0.25)' : 'rgba(40, 25, 55, 0.35)',
        skirtStroke,
        1.0
      );
    }
  }

  // 2. 4 Suspension Struts & Aero Disc Wheels
  const wheelRadius = 0.37;
  const wheelSegs = 14;
  for (const w of sim.wheels) {
    const sideOffset = w.pos.x < 0 ? -0.06 : 0.06;
    const wheelDropY = w.pos.y - (sim.suspensionRestLength - w.compression) + wheelRadius * 0.45;
    const wheelCenterLocal = { x: w.pos.x + sideOffset, y: wheelDropY, z: w.pos.z };
    const mountWorld = Vec3.add(sim.pos, Quat.rotate(sim.quat, w.pos));
    const wheelCenterWorld = Vec3.add(sim.pos, Quat.rotate(sim.quat, wheelCenterLocal));

    const strutCol = w.bottomedOut ? '#ff3860' : w.ratio > 0.75 ? '#ffae00' : '#00ff9d';
    camera.drawLine3D(mountWorld, wheelCenterWorld, strutCol, w.bottomedOut ? 3.2 : 2.0);

    const steer = w.isFront ? sim.currentSteerAngle : 0;
    const cosS = Math.cos(steer);
    const sinS = Math.sin(steer);

    if (isSolid) {
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
      camera.drawPoly3D(discPts, 'rgb(38, 46, 56)', '#9be2ff', 1.6);
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
            camera.drawLine3D(prevPt, rimWorld, rimCol, rScale === 1.0 ? 1.8 : 1.1);
          }
          prevPt = rimWorld;
        }
      }
    }
  }

  // 3. 3D Internal Rocket Fuel Tank
  render3DFuelTankInsideCar(camera, sim);

  // 4. Transform Car Mesh Vertices with Corner Crash Deformation
  const worldVerts = carMesh.v.map((lv) => {
    let dy = 0;
    let dz = 0;
    if (lv.corner && sim.cornerDamage[lv.corner] > 0) {
      const dmg = sim.cornerDamage[lv.corner];
      dy = dmg * 0.85;
      dz = lv.z > 0 ? -dmg * 0.45 : dmg * 0.45;
    }
    return Vec3.add(sim.pos, Quat.rotate(sim.quat, { x: lv.x, y: lv.y + dy, z: lv.z + dz }));
  });

  // Painter's Algorithm Depth-Sorting
  const sortedFaces = carMesh.faces
    .map((face) => {
      let sumDepth = 0;
      const projPts = [];
      for (const vi of face.idx) {
        const p = camera.project(worldVerts[vi]);
        if (!p) return null;
        sumDepth += p.depth;
        projPts.push(p);
      }
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
      ctx.fillStyle = face.isGlass ? 'rgba(32, 75, 118, 0.82)' : camera.shadeRGB(face.baseRGB, normal);
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

  // 5. Thruster Ports
  for (const key of Object.keys(sim.thrusters)) {
    const t = sim.thrusters[key];
    const pProj = camera.project(t.worldPos);
    if (!pProj) continue;
    ctx.save();
    ctx.fillStyle = t.group === 'down' ? '#00e5ff' : '#ff7b29';
    ctx.beginPath();
    ctx.arc(pProj.x, pProj.y, Math.max(2.5, 0.09 * pProj.scale), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function render3DFuelTankInsideCar(camera, sim) {
  const ratio = Math.max(0, Math.min(1, sim.fuelMass / Math.max(1, sim.fuelCapacity)));
  const x0 = -0.46, x1 = 0.46;
  const y0 = -0.22, y1 = 0.22;
  const z0 = -0.92, z1 = -0.05;
  const yFill = y0 + (y1 - y0) * ratio;

  const box = [
    { x: x0, y: y0, z: z0 }, { x: x1, y: y0, z: z0 },
    { x: x1, y: y0, z: z1 }, { x: x0, y: y0, z: z1 },
    { x: x0, y: y1, z: z0 }, { x: x1, y: y1, z: z0 },
    { x: x1, y: y1, z: z1 }, { x: x0, y: y1, z: z1 },
  ].map((p) => Vec3.add(sim.pos, Quat.rotate(sim.quat, p)));

  for (let i = 0; i < 4; i++) {
    const n = (i + 1) % 4;
    camera.drawLine3D(box[i], box[n], 'rgba(0, 255, 157, 0.35)', 1.0);
    camera.drawLine3D(box[i + 4], box[n + 4], 'rgba(0, 255, 157, 0.35)', 1.0);
    camera.drawLine3D(box[i], box[i + 4], 'rgba(0, 255, 157, 0.35)', 1.0);
  }

  if (ratio > 0.01) {
    const liqColor = ratio < 0.2 ? 'rgba(255, 56, 96, 0.65)' : 'rgba(0, 255, 157, 0.55)';
    const liqStroke = ratio < 0.2 ? '#ff3860' : '#00ff9d';
    const topSurf = [
      { x: x0, y: yFill, z: z0 },
      { x: x1, y: yFill, z: z0 },
      { x: x1, y: yFill, z: z1 },
      { x: x0, y: yFill, z: z1 },
    ].map((p) => Vec3.add(sim.pos, Quat.rotate(sim.quat, p)));
    camera.drawPoly3D(topSurf, liqColor, liqStroke, 1.5);
  }
}

export function renderThrusterPlumes(camera, sim, time) {
  if (sim.fuelMass <= 0.001 || sim.tankPressureBar <= 0.5) return;

  const pressFactor = Math.max(0.12, sim.tankPressureBar / Math.max(1, sim.tankRatedPressureBar));

  for (const key of Object.keys(sim.thrusters)) {
    const t = sim.thrusters[key];
    if (t.currentForce < 20) continue;

    const isDown = t.group === 'down';
    const maxRef = isDown ? sim.downMaxForce : sim.sideMaxForce;
    const ratio = Math.min(1.5, t.currentForce / Math.max(1000, maxRef));
    const flicker = 0.92 + 0.16 * Math.sin(time * 65 + key.length * 7);
    const plumeLen = (isDown ? 2.1 : 1.45) * ratio * pressFactor * flicker;

    const nozzle = t.worldPos;
    const tip = Vec3.addScaled(nozzle, t.worldPlumeDir, plumeLen);
    const ref = Math.abs(t.worldPlumeDir.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
    const u = Vec3.norm(Vec3.cross(t.worldPlumeDir, ref));
    const v = Vec3.cross(t.worldPlumeDir, u);

    const outerColor = isDown ? 'rgba(0, 229, 255, 0.88)' : 'rgba(255, 123, 41, 0.9)';
    const coneRad = (isDown ? 0.18 : 0.13) * Math.min(1.2, 0.5 + ratio * 0.6);
    const midPt = Vec3.addScaled(nozzle, t.worldPlumeDir, plumeLen * 0.42);

    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2 + time * 8;
      const rimOffset = Vec3.addScaled(Vec3.scale(u, Math.cos(ang) * coneRad), v, Math.sin(ang) * coneRad);
      camera.drawLine3D(nozzle, Vec3.add(midPt, rimOffset), outerColor, 2.0);
      camera.drawLine3D(Vec3.add(midPt, rimOffset), tip, outerColor, 1.6);
    }
    camera.drawLine3D(nozzle, Vec3.addScaled(nozzle, t.worldPlumeDir, plumeLen * 0.78), '#ffffff', 3.2);
  }
}

export function renderForceVectors(camera, sim) {
  for (const key of Object.keys(sim.thrusters)) {
    const t = sim.thrusters[key];
    if (t.currentForce > 80) {
      const kN = (t.currentForce / 1000).toFixed(1);
      const col = t.group === 'down' ? '#00e5ff' : '#ff7b29';
      camera.drawVectorArrow3D(t.worldPos, t.worldForce, 0.00038, col, `${t.id.replace('_', '-')}: ${kN}kN`);
    }
  }

  const fg = { x: 0, y: -sim.mass * sim.gravity, z: 0 };
  if (sim.gravity > 0.05) {
    camera.drawVectorArrow3D(sim.pos, fg, 0.00014, '#ff3860', `mg (${((sim.mass * sim.gravity) / 1000).toFixed(1)}kN)`);
  }

  if (sim.suctionForceMag > 200) {
    camera.drawVectorArrow3D(sim.pos, sim.suctionForceWorld, 0.00016, '#c864ff', `F_fan (-${(sim.suctionForceMag / 1000).toFixed(1)}kN)`);
  }

  if (Vec3.len(sim.netThrustForceWorld) > 200) {
    camera.drawVectorArrow3D(sim.pos, sim.netThrustForceWorld, 0.00014, '#00ff9d', `ΣF_thrust`);
  }

  if (Vec3.len(sim.vel) > 0.4) {
    camera.drawVectorArrow3D(sim.pos, sim.vel, 0.22, '#ffea00', `v (${Vec3.len(sim.vel).toFixed(1)}m/s)`);
  }
}
