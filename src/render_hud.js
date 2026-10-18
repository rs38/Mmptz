// ============================================================================
// VECTR-8 // 2D HUD Canvas Renderers (Propellant Slosh Gauge & Thruster Schematic)
// ============================================================================

import { Quat } from './math.js';

export function renderFuelTankHUD(fuelCtx, fuelCanvas, sim, time) {
  if (!fuelCtx || !fuelCanvas) return;
  const ctx = fuelCtx;
  const w = fuelCanvas.width;
  const h = fuelCanvas.height;
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
    const wave = Math.sin(time * 6) * (sim.fuelBurnRate > 0 ? 2.5 : 1.0);

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

  // Overlay pressure and percentage text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.round(sim.tankPressureBar)} bar`, w * 0.5, h * 0.5 - 2);
  ctx.font = '9px monospace';
  ctx.fillStyle = ratio < 0.2 ? '#ff3860' : '#7aa2bd';
  ctx.fillText(`${Math.round(ratio * 100)}%`, w * 0.5, h * 0.5 + 11);
}

export function renderSchematic(schCtx, schCanvas, sim) {
  if (!schCtx || !schCanvas) return;
  const ctx = schCtx;
  const w = schCanvas.width;
  const h = schCanvas.height;
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
    ctx.fillText(`${sc.label} ${(t.currentForce / 1000).toFixed(1)}kN`, sc.x + sc.dir * 6, sc.y + 15);
  }
}
