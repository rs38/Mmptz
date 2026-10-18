// ============================================================================
// VECTR-8 // Environment Rendering (Sky/Ground Gradients, Grid, Ramps, Pads & Shadows)
// ============================================================================

import { Vec3, Quat } from './math.js';
import { sampleSurface } from './terrain.js';
import { renderStuntLoop } from './render_stunt_loop.js';

export function renderSkyAndGround(camera, ctx, renderMode) {
  if (renderMode === 'solid') {
    const horizonPt = camera.project(
      Vec3.addScaled(camera.camPos, { x: camera.camForward.x, y: 0, z: camera.camForward.z }, 200)
    );
    const horizonY = horizonPt ? Math.max(0, Math.min(camera.height, horizonPt.y)) : camera.height * 0.45;

    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGrad.addColorStop(0, '#0a1936');
    skyGrad.addColorStop(1, '#1e3f6e');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, camera.width, horizonY);

    const gndGrad = ctx.createLinearGradient(0, horizonY, 0, camera.height);
    gndGrad.addColorStop(0, '#14261d');
    gndGrad.addColorStop(1, '#0c1712');
    ctx.fillStyle = gndGrad;
    ctx.fillRect(0, horizonY, camera.width, camera.height - horizonY);
  } else {
    const bgGrad = ctx.createRadialGradient(
      camera.width * 0.5,
      camera.height * 0.5,
      40,
      camera.width * 0.5,
      camera.height * 0.5,
      Math.max(camera.width, camera.height) * 0.75
    );
    bgGrad.addColorStop(0, '#081221');
    bgGrad.addColorStop(1, '#03060c');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, camera.width, camera.height);
  }
}

export function renderFloorGrid(camera, sim, renderMode) {
  const gridSpacing = 4;
  const halfSpan = 60;
  const centerX = Math.floor(sim.pos.x / gridSpacing) * gridSpacing;
  const centerZ = Math.floor(sim.pos.z / gridSpacing) * gridSpacing;
  const isSolid = renderMode === 'solid';

  for (let x = centerX - halfSpan; x <= centerX + halfSpan; x += gridSpacing) {
    const isMajor = Math.abs(x % 16) === 0;
    const color = isSolid
      ? isMajor ? 'rgba(120, 210, 160, 0.28)' : 'rgba(120, 210, 160, 0.1)'
      : isMajor ? 'rgba(0, 229, 255, 0.22)' : 'rgba(0, 229, 255, 0.08)';
    camera.drawLine3D({ x, y: 0, z: centerZ - halfSpan }, { x, y: 0, z: centerZ + halfSpan }, color, isMajor ? 1.2 : 0.8);
  }

  for (let z = centerZ - halfSpan; z <= centerZ + halfSpan; z += gridSpacing) {
    const isMajor = Math.abs(z % 16) === 0;
    const color = isSolid
      ? isMajor ? 'rgba(120, 210, 160, 0.28)' : 'rgba(120, 210, 160, 0.1)'
      : isMajor ? 'rgba(0, 229, 255, 0.22)' : 'rgba(0, 229, 255, 0.08)';
    camera.drawLine3D({ x: centerX - halfSpan, y: 0, z }, { x: centerX + halfSpan, y: 0, z }, color, isMajor ? 1.2 : 0.8);
  }
}

export function renderArena(camera, ctx, sim, renderMode) {
  const isSolid = renderMode === 'solid';

  // 1. Ramps
  for (const ramp of sim.arena.ramps) {
    const hw = ramp.w * 0.5;
    const p0 = { x: ramp.x - hw, y: ramp.yStart, z: ramp.zStart };
    const p1 = { x: ramp.x + hw, y: ramp.yStart, z: ramp.zStart };
    const p2 = { x: ramp.x + hw, y: ramp.yEnd, z: ramp.zEnd };
    const p3 = { x: ramp.x - hw, y: ramp.yEnd, z: ramp.zEnd };
    const b2 = { x: ramp.x + hw, y: 0, z: ramp.zEnd };
    const b3 = { x: ramp.x - hw, y: 0, z: ramp.zEnd };

    if (isSolid) {
      camera.drawPoly3D([p0, p3, b3], 'rgb(52, 85, 115)', '#88c5f0', 1);
      camera.drawPoly3D([p1, b2, p2], 'rgb(42, 70, 96)', '#88c5f0', 1);
      camera.drawPoly3D([p3, p2, b2, b3], 'rgb(36, 58, 82)', '#88c5f0', 1);
      camera.drawPoly3D([p0, p1, p2, p3], 'rgb(75, 130, 175)', '#b6e3ff', 1.5);
    } else {
      camera.drawLine3D(p0, p1, '#00e5ff', 1.8);
      camera.drawLine3D(p1, p2, '#00e5ff', 1.8);
      camera.drawLine3D(p2, p3, '#00e5ff', 1.8);
      camera.drawLine3D(p3, p0, '#00e5ff', 1.8);
      camera.drawLine3D(p2, b2, 'rgba(0, 229, 255, 0.45)', 1.2);
      camera.drawLine3D(p3, b3, 'rgba(0, 229, 255, 0.45)', 1.2);
    }

    for (let s = 0.2; s < 1.0; s += 0.2) {
      const y = ramp.yStart + s * (ramp.yEnd - ramp.yStart);
      const z = ramp.zStart + s * (ramp.zEnd - ramp.zStart);
      camera.drawLine3D(
        { x: ramp.x - hw, y, z },
        { x: ramp.x + hw, y, z },
        isSolid ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 229, 255, 0.35)',
        1.0
      );
    }
  }

  // 2. Landing Pads
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
      const legColor = isSolid ? '#466c8c' : 'rgba(0, 229, 255, 0.25)';
      const legW = isSolid ? 2.5 : 1.2;
      camera.drawLine3D(c0, { x: c0.x, y: 0, z: c0.z }, legColor, legW);
      camera.drawLine3D(c1, { x: c1.x, y: 0, z: c1.z }, legColor, legW);
      camera.drawLine3D(c2, { x: c2.x, y: 0, z: c2.z }, legColor, legW);
      camera.drawLine3D(c3, { x: c3.x, y: 0, z: c3.z }, legColor, legW);
    }

    if (isSolid) {
      const yBot = Math.max(0, y - pad.h);
      camera.drawPoly3D([c0, c1, { x: c1.x, y: yBot, z: c1.z }, { x: c0.x, y: yBot, z: c0.z }], 'rgb(42, 60, 82)', col, 1);
      camera.drawPoly3D([c1, c2, { x: c2.x, y: yBot, z: c2.z }, { x: c1.x, y: yBot, z: c1.z }], 'rgb(52, 74, 98)', col, 1);
      camera.drawPoly3D([c0, c1, c2, c3], 'rgb(64, 90, 118)', col, 2);
    } else {
      camera.drawLine3D(c0, c1, col, 2.2);
      camera.drawLine3D(c1, c2, col, 2.2);
      camera.drawLine3D(c2, c3, col, 2.2);
      camera.drawLine3D(c3, c0, col, 2.2);
    }

    const iw = hw * 0.55;
    const id = hd * 0.55;
    camera.drawLine3D({ x: pad.x - iw, y: y + 0.02, z: pad.z - id }, { x: pad.x + iw, y: y + 0.02, z: pad.z - id }, col, 1.2);
    camera.drawLine3D({ x: pad.x + iw, y: y + 0.02, z: pad.z - id }, { x: pad.x + iw, y: y + 0.02, z: pad.z + id }, col, 1.2);
    camera.drawLine3D({ x: pad.x + iw, y: y + 0.02, z: pad.z + id }, { x: pad.x - iw, y: y + 0.02, z: pad.z + id }, col, 1.2);
    camera.drawLine3D({ x: pad.x - iw, y: y + 0.02, z: pad.z + id }, { x: pad.x - iw, y: y + 0.02, z: pad.z - id }, col, 1.2);

    const labelPos = camera.project({ x: pad.x, y: pad.y + 1.4, z: pad.z });
    if (labelPos && labelPos.depth < 95) {
      ctx.save();
      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = col;
      ctx.textAlign = 'center';
      ctx.fillText(`${pad.id} [${pad.y.toFixed(0)}m]`, labelPos.x, labelPos.y);
      ctx.restore();
    }
  }

  // 3. Waypoint Rings
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
      const pt = {
        x: ring.x + u.x * Math.cos(a) * ring.r + v.x * Math.sin(a) * ring.r,
        y: ring.y + u.y * Math.cos(a) * ring.r + v.y * Math.sin(a) * ring.r,
        z: ring.z + u.z * Math.cos(a) * ring.r + v.z * Math.sin(a) * ring.r,
      };
      if (prev) camera.drawLine3D(prev, pt, col, ring.passed ? 1.4 : 2.5);
      prev = pt;
    }
  }

  // 4. Stunt Crescent Loop (Curved Wall, Red Neon Rims & Truss Framework)
  renderStuntLoop(camera, ctx, sim, renderMode);
}

export function renderDropShadowAndSuction(camera, sim, renderMode, fanAngle, time) {
  const surf = sampleSurface(sim.arena, sim.pos.x, sim.pos.y, sim.pos.z);
  camera.drawLine3D(sim.pos, { x: sim.pos.x, y: surf.y, z: sim.pos.z }, 'rgba(0, 229, 255, 0.35)', 1.0, [4, 4]);

  const corners = [
    { x: -0.95, y: 0, z: 2.1 },
    { x: 0.95, y: 0, z: 2.1 },
    { x: 0.95, y: 0, z: -2.1 },
    { x: -0.95, y: 0, z: -2.1 },
  ].map((c) => {
    const rw = Quat.rotate(sim.quat, c);
    return { x: sim.pos.x + rw.x, y: surf.y + 0.02, z: sim.pos.z + rw.z };
  });

  if (renderMode === 'solid') {
    camera.drawPoly3D(corners, 'rgba(0, 0, 0, 0.42)', 'rgba(0, 229, 255, 0.25)', 1);
  } else {
    for (let i = 0; i < 4; i++) {
      camera.drawLine3D(corners[i], corners[(i + 1) % 4], 'rgba(0, 229, 255, 0.25)', 1.2);
    }
  }

  // 60 kW Suction Fan Vortex & Turbine
  if (sim.fanEnabled) {
    const sealRatio = Math.min(1, sim.suctionForceMag / 22000);
    const vortexColor = sealRatio > 0.35 ? '#c864ff' : 'rgba(200, 100, 255, 0.45)';

    const blades = 6;
    for (let i = 0; i < blades; i++) {
      const a = fanAngle + (i / blades) * Math.PI * 2;
      const bTipLocal = { x: Math.cos(a) * 0.32, y: -0.22 + Math.sin(a) * 0.32, z: -2.16 };
      const bCenterWorld = Vec3.add(sim.pos, Quat.rotate(sim.quat, { x: 0, y: -0.22, z: -2.16 }));
      const bTipWorld = Vec3.add(sim.pos, Quat.rotate(sim.quat, bTipLocal));
      camera.drawLine3D(bCenterWorld, bTipWorld, '#c864ff', 2.0);
    }

    const rays = 8;
    const phase = (time * 3.5) % 1;
    for (let i = 0; i < rays; i++) {
      const ang = (i / rays) * Math.PI * 2 + time * 1.5;
      const outerR = 1.65 * (1 - phase * 0.65);
      const innerR = Math.max(0.2, outerR - 0.55);
      const pOuter = { x: sim.pos.x + Math.cos(ang) * outerR, y: surf.y + 0.04, z: sim.pos.z + Math.sin(ang) * outerR };
      const pInner = { x: sim.pos.x + Math.cos(ang) * innerR, y: surf.y + 0.14, z: sim.pos.z + Math.sin(ang) * innerR };
      camera.drawLine3D(pOuter, pInner, vortexColor, 1.5 + sealRatio * 1.2);
    }
  }
}
