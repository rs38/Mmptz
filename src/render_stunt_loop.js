// ============================================================================
// VECTR-8 // Stunt Crescent Loop Renderer (Curved Wall, Red Neon Rims & Truss Tower)
// ============================================================================

import { Vec3 } from './math.js';

export function renderStuntLoop(camera, ctx, sim, renderMode) {
  const loop = sim.arena.stuntLoop;
  if (!loop) return;

  const isSolid = renderMode === 'solid';
  const hw = loop.w * 0.5;
  const Zc = loop.zStart;
  const Yc = loop.r;
  const segs = 24;

  // 1. Approach Flat Runway (leading from flat arena ground into loop base)
  const appP0 = { x: loop.x - hw, y: 0.02, z: loop.entryZStart };
  const appP1 = { x: loop.x + hw, y: 0.02, z: loop.entryZStart };
  const appP2 = { x: loop.x + hw, y: 0.02, z: loop.zStart };
  const appP3 = { x: loop.x - hw, y: 0.02, z: loop.zStart };

  if (isSolid) {
    camera.drawPoly3D([appP0, appP1, appP2, appP3], 'rgb(48, 62, 78)', '#88c5f0', 1.0);
  } else {
    camera.drawLine3D(appP0, appP1, '#00e5ff', 1.5);
    camera.drawLine3D(appP1, appP2, '#00e5ff', 1.5);
    camera.drawLine3D(appP2, appP3, '#00e5ff', 1.5);
    camera.drawLine3D(appP3, appP0, '#00e5ff', 1.5);
  }

  // Approach Centerline & Chevrons
  camera.drawLine3D(
    { x: loop.x, y: 0.03, z: loop.entryZStart },
    { x: loop.x, y: 0.03, z: loop.zStart },
    '#ffffff',
    2.0,
    [8, 8]
  );

  // 2. Generate Curved Track Ribs & Edge Points
  const ribs = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const theta = t * loop.maxTheta;
    const y = Yc - loop.r * Math.cos(theta);
    const z = Zc + loop.r * Math.sin(theta);
    const normal = { x: 0, y: Math.cos(theta), z: -Math.sin(theta) };

    ribs.push({
      theta,
      left: { x: loop.x - hw, y, z },
      right: { x: loop.x + hw, y, z },
      center: { x: loop.x, y, z },
      normal,
    });
  }

  // 3. Render Curved Road Surface Polygons
  for (let i = 0; i < segs; i++) {
    const r0 = ribs[i];
    const r1 = ribs[i + 1];

    if (isSolid) {
      // Flat-shaded solid road segment with directional lighting
      const roadColor = camera.shadeRGB([210, 222, 235], r0.normal);
      camera.drawPoly3D(
        [r0.left, r0.right, r1.right, r1.left],
        roadColor,
        'rgba(20, 35, 55, 0.45)',
        1.0
      );
    } else {
      camera.drawLine3D(r0.left, r1.left, 'rgba(0, 229, 255, 0.45)', 1.2);
      camera.drawLine3D(r0.right, r1.right, 'rgba(0, 229, 255, 0.45)', 1.2);
      camera.drawLine3D(r0.left, r0.right, 'rgba(0, 229, 255, 0.35)', 1.0);
    }

    // White Center Stripe
    if (i % 2 === 0) {
      camera.drawLine3D(r0.center, r1.center, '#ffffff', 2.2);
    }
  }

  // 4. Glowing Red/Neon Edge Barriers (Signature Crescent Glow from Photo)
  const neonGlowColor = '#ff2848';
  for (let i = 0; i < segs; i++) {
    const r0 = ribs[i];
    const r1 = ribs[i + 1];
    // Left glowing rim
    camera.drawLine3D(r0.left, r1.left, neonGlowColor, 3.8);
    // Right glowing rim
    camera.drawLine3D(r0.right, r1.right, neonGlowColor, 3.8);

    // Lateral safety curb posts every 3 segments
    if (i % 3 === 0) {
      const curbUp0 = Vec3.addScaled(r0.left, r0.normal, 0.35);
      const curbUp1 = Vec3.addScaled(r0.right, r0.normal, 0.35);
      camera.drawLine3D(r0.left, curbUp0, neonGlowColor, 2.0);
      camera.drawLine3D(r0.right, curbUp1, neonGlowColor, 2.0);
    }
  }

  // 5. Extended Horizontal Inverted Ceiling Road Track
  const apexY = 2 * loop.r;
  const ceilingZEnd = loop.zStart - loop.ceilingLength;
  const cSegs = 8;
  const cRibs = [];
  for (let i = 0; i <= cSegs; i++) {
    const t = i / cSegs;
    const z = loop.zStart - t * loop.ceilingLength;
    cRibs.push({
      left: { x: loop.x - hw, y: apexY, z },
      right: { x: loop.x + hw, y: apexY, z },
      center: { x: loop.x, y: apexY, z },
      normal: { x: 0, y: -1, z: 0 },
    });
  }

  for (let i = 0; i < cSegs; i++) {
    const cr0 = cRibs[i];
    const cr1 = cRibs[i + 1];

    if (isSolid) {
      const roadColor = camera.shadeRGB([200, 215, 230], cr0.normal);
      camera.drawPoly3D([cr0.left, cr0.right, cr1.right, cr1.left], roadColor, 'rgba(20, 35, 55, 0.45)', 1.0);
    } else {
      camera.drawLine3D(cr0.left, cr1.left, 'rgba(0, 229, 255, 0.45)', 1.2);
      camera.drawLine3D(cr0.right, cr1.right, 'rgba(0, 229, 255, 0.45)', 1.2);
      camera.drawLine3D(cr0.left, cr0.right, 'rgba(0, 229, 255, 0.35)', 1.0);
    }

    // White Centerline on ceiling
    if (i % 2 === 0) {
      camera.drawLine3D(cr0.center, cr1.center, '#ffffff', 2.2);
    }

    // Glowing Neon Red Rims on Ceiling
    camera.drawLine3D(cr0.left, cr1.left, neonGlowColor, 3.8);
    camera.drawLine3D(cr0.right, cr1.right, neonGlowColor, 3.8);
  }

  // End Stop / Caution Marker at end of ceiling
  const endCeiling = cRibs[cSegs];
  camera.drawLine3D(endCeiling.left, endCeiling.right, '#ffd564', 3.5, [4, 4]);

  // 6. Heavy Steel Lattice Truss Scaffolding Tower (Backing Framework)
  const towerZFront = Zc + loop.r + 0.3; // Just behind the 90° vertical wall (Z = 22.3)
  const towerZBack = towerZFront + 3.8;   // Rear pillar line (Z = 26.1)
  const towerHeight = apexY + 0.5;        // Matching full 24m apex height
  const towerLevels = [0, 4.8, 9.6, 14.4, 19.2, towerHeight];
  const steelCol = isSolid ? 'rgba(215, 230, 245, 0.85)' : 'rgba(120, 195, 255, 0.65)';
  const braceCol = isSolid ? 'rgba(150, 180, 210, 0.55)' : 'rgba(0, 229, 255, 0.35)';

  // 4 Main Vertical Steel Support Columns
  const cols = [
    { x: loop.x - hw, z: towerZFront },
    { x: loop.x + hw, z: towerZFront },
    { x: loop.x - hw, z: towerZBack },
    { x: loop.x + hw, z: towerZBack },
  ];

  for (const c of cols) {
    camera.drawLine3D({ x: c.x, y: 0, z: c.z }, { x: c.x, y: towerHeight, z: c.z }, steelCol, 2.8);
  }

  // Horizontal Cross Beams & Diagonal X-Braces at Each Level
  for (let l = 0; l < towerLevels.length - 1; l++) {
    const y0 = towerLevels[l];
    const y1 = towerLevels[l + 1];

    camera.drawLine3D({ x: cols[0].x, y: y1, z: cols[0].z }, { x: cols[1].x, y: y1, z: cols[1].z }, steelCol, 2.0);
    camera.drawLine3D({ x: cols[2].x, y: y1, z: cols[2].z }, { x: cols[3].x, y: y1, z: cols[3].z }, steelCol, 2.0);
    camera.drawLine3D({ x: cols[0].x, y: y1, z: cols[0].z }, { x: cols[2].x, y: y1, z: cols[2].z }, steelCol, 2.0);
    camera.drawLine3D({ x: cols[1].x, y: y1, z: cols[1].z }, { x: cols[3].x, y: y1, z: cols[3].z }, steelCol, 2.0);

    camera.drawLine3D({ x: cols[0].x, y: y0, z: cols[0].z }, { x: cols[2].x, y: y1, z: cols[2].z }, braceCol, 1.4);
    camera.drawLine3D({ x: cols[0].x, y: y1, z: cols[0].z }, { x: cols[2].x, y: y0, z: cols[2].z }, braceCol, 1.4);
    camera.drawLine3D({ x: cols[1].x, y: y0, z: cols[1].z }, { x: cols[3].x, y: y1, z: cols[3].z }, braceCol, 1.4);
    camera.drawLine3D({ x: cols[1].x, y: y1, z: cols[1].z }, { x: cols[3].x, y: y0, z: cols[3].z }, braceCol, 1.4);
    camera.drawLine3D({ x: cols[2].x, y: y0, z: cols[2].z }, { x: cols[3].x, y: y1, z: cols[3].z }, braceCol, 1.4);
    camera.drawLine3D({ x: cols[2].x, y: y1, z: cols[2].z }, { x: cols[3].x, y: y0, z: cols[3].z }, braceCol, 1.4);
  }

  // 7. Cantilever Overhang Trusses Holding the Inverted Ceiling
  for (let i = 0; i <= cSegs; i += 2) {
    const cr = cRibs[i];
    const topColL = { x: loop.x - hw, y: towerHeight + 0.3, z: cr.left.z };
    const topColR = { x: loop.x + hw, y: towerHeight + 0.3, z: cr.right.z };
    camera.drawLine3D(cr.left, topColL, steelCol, 2.0);
    camera.drawLine3D(cr.right, topColR, steelCol, 2.0);
    camera.drawLine3D(topColL, topColR, steelCol, 2.0);
    if (i > 0) {
      const prevCr = cRibs[i - 2];
      camera.drawLine3D(topColL, { x: loop.x - hw, y: towerHeight + 0.3, z: prevCr.left.z }, steelCol, 2.0);
      camera.drawLine3D(topColR, { x: loop.x + hw, y: towerHeight + 0.3, z: prevCr.right.z }, steelCol, 2.0);
    }
  }

  // 8. Ground Floodlights Beaming Up at the Vertical Climb
  for (const lx of [loop.x - hw - 1.5, loop.x + hw + 1.5]) {
    camera.drawLine3D({ x: lx, y: 0, z: loop.zStart + 2 }, { x: lx, y: 0.5, z: loop.zStart + 2 }, '#ffd564', 3.0);
    camera.drawLine3D({ x: lx, y: 0.5, z: loop.zStart + 2 }, { x: loop.x, y: 12.0, z: Zc + loop.r }, 'rgba(255, 240, 160, 0.18)', 1.2, [6, 8]);
  }

  // 9. 3D Text Banner at Inverted Ceiling
  const bannerPos = camera.project({ x: loop.x, y: apexY + 1.8, z: loop.zStart - loop.ceilingLength * 0.5 });
  if (bannerPos && bannerPos.depth < 120) {
    ctx.save();
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#ff2848';
    ctx.textAlign = 'center';
    ctx.fillText('INVERTED FAN-CAR CEILING TRACK [24m]', bannerPos.x, bannerPos.y);
    ctx.restore();
  }
}
