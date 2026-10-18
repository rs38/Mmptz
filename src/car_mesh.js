// ============================================================================
// VECTR-8 // 3D Chassis Mesh Geometry, Outward Normals & Vertex Corner Maps
// ============================================================================

export function buildCarMesh() {
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

  // Vertex order defines outward normal via right-hand rule for Solid 3D shading
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
