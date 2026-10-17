// ============================================================================
// VECTR-8 // Main Controller, UI Slider Sync, Keyboard Input & Audio Synth
// ============================================================================

import { RocketCarSim, Vec3, Quat } from './physics.js';
import { VectorRenderer } from './renderer.js';

const canvas = document.getElementById('sim-canvas');
const schematicCanvas = document.getElementById('schematic-canvas');
const fuelCanvas = document.getElementById('fuel-canvas');

const sim = new RocketCarSim();
const renderer = new VectorRenderer(canvas, schematicCanvas, fuelCanvas);

// ----------------------------------------------------------------------------
// Modern Web Guidance `slider` Sync Helper
// Syncs --attr-min, --attr-max, --control-value, and aria-valuetext
// ----------------------------------------------------------------------------
function syncSliderCSS(slider, formattedText) {
  slider.style.setProperty('--attr-min', slider.min || 0);
  slider.style.setProperty('--attr-max', slider.max || 100);
  slider.style.setProperty('--control-value', slider.value);
  if (formattedText) {
    slider.setAttribute('aria-valuetext', formattedText);
  }
}

// ----------------------------------------------------------------------------
// Bind Master, Drivetrain, Suspension, Fuel & Thruster Sliders
// ----------------------------------------------------------------------------
const sliderRwdPower = document.getElementById('slider-rwd-power');
const outRwdPower = document.getElementById('out-rwd-power');

const sliderSuspHeight = document.getElementById('slider-susp-height');
const outSuspHeight = document.getElementById('out-susp-height');

const sliderFuelCap = document.getElementById('slider-fuel-cap');
const outFuelCap = document.getElementById('out-fuel-cap');

const sliderDownMaster = document.getElementById('slider-down-master');
const outDownMaster = document.getElementById('out-down-master');

const sliderSideMaster = document.getElementById('slider-side-master');
const outSideMaster = document.getElementById('out-side-master');

const sliderHoverBase = document.getElementById('slider-hover-base');
const outHoverBase = document.getElementById('out-hover-base');

const sliderGravity = document.getElementById('slider-gravity');
const outGravity = document.getElementById('out-gravity');

function updateMasterSliders() {
  sim.rwdMaxPowerKW = parseFloat(sliderRwdPower.value);
  const rwdTxt = `${Math.round(sim.rwdMaxPowerKW)} kW`;
  outRwdPower.textContent = rwdTxt;
  syncSliderCSS(sliderRwdPower, rwdTxt);

  sim.suspensionRestLength = parseFloat(sliderSuspHeight.value);
  const suspTxt = `${sim.suspensionRestLength.toFixed(2)} m`;
  outSuspHeight.textContent = suspTxt;
  syncSliderCSS(sliderSuspHeight, suspTxt);

  const newCap = parseFloat(sliderFuelCap.value);
  if (newCap !== sim.fuelCapacity) {
    const ratio = sim.fuelMass / Math.max(1, sim.fuelCapacity);
    sim.fuelCapacity = newCap;
    sim.fuelMass = Math.min(newCap, ratio * newCap);
  }
  const fuelCapTxt = `${Math.round(sim.fuelCapacity)} kg`;
  outFuelCap.textContent = fuelCapTxt;
  syncSliderCSS(sliderFuelCap, fuelCapTxt);

  sim.downMaxForce = parseFloat(sliderDownMaster.value) * 1000;
  const downTxt = `${parseFloat(sliderDownMaster.value).toFixed(1)} kN`;
  outDownMaster.textContent = downTxt;
  syncSliderCSS(sliderDownMaster, downTxt);

  sim.sideMaxForce = parseFloat(sliderSideMaster.value) * 1000;
  const sideTxt = `${parseFloat(sliderSideMaster.value).toFixed(1)} kN`;
  outSideMaster.textContent = sideTxt;
  syncSliderCSS(sliderSideMaster, sideTxt);

  sim.hoverBaseThrottle = parseFloat(sliderHoverBase.value) / 100;
  const hoverTxt = `${Math.round(parseFloat(sliderHoverBase.value))}%`;
  outHoverBase.textContent = hoverTxt;
  syncSliderCSS(sliderHoverBase, hoverTxt);

  sim.gravity = parseFloat(sliderGravity.value);
  const gravTxt = `${sim.gravity.toFixed(2)} m/s²`;
  outGravity.textContent = gravTxt;
  syncSliderCSS(sliderGravity, gravTxt);
}

[
  sliderRwdPower,
  sliderSuspHeight,
  sliderFuelCap,
  sliderDownMaster,
  sliderSideMaster,
  sliderHoverBase,
  sliderGravity,
].forEach((s) => {
  s.addEventListener('input', updateMasterSliders);
});
updateMasterSliders();

// Individual 8 Thruster Sliders
const thrusterSliders = document.querySelectorAll('.thruster-slider');
const thrusterOutputs = {
  D_FL: { out: document.getElementById('out-d-fl'), live: document.getElementById('live-d-fl'), slider: document.getElementById('slider-d-fl') },
  D_FR: { out: document.getElementById('out-d-fr'), live: document.getElementById('live-d-fr'), slider: document.getElementById('slider-d-fr') },
  D_RL: { out: document.getElementById('out-d-rl'), live: document.getElementById('live-d-rl'), slider: document.getElementById('slider-d-rl') },
  D_RR: { out: document.getElementById('out-d-rr'), live: document.getElementById('live-d-rr'), slider: document.getElementById('slider-d-rr') },
  S_FL: { out: document.getElementById('out-s-fl'), live: document.getElementById('live-s-fl'), slider: document.getElementById('slider-s-fl') },
  S_FR: { out: document.getElementById('out-s-fr'), live: document.getElementById('live-s-fr'), slider: document.getElementById('slider-s-fr') },
  S_RL: { out: document.getElementById('out-s-rl'), live: document.getElementById('live-s-rl'), slider: document.getElementById('slider-s-rl') },
  S_RR: { out: document.getElementById('out-s-rr'), live: document.getElementById('live-s-rr'), slider: document.getElementById('slider-s-rr') },
};

function syncThrusterSliders() {
  thrusterSliders.forEach((slider) => {
    const id = slider.dataset.thruster;
    const val = parseFloat(slider.value);
    sim.thrusters[id].sliderPct = val;
    const txt = `${Math.round(val)}%`;
    thrusterOutputs[id].out.textContent = txt;
    syncSliderCSS(slider, txt);
  });
}

thrusterSliders.forEach((slider) => {
  slider.addEventListener('input', syncThrusterSliders);
});
syncThrusterSliders();

// ----------------------------------------------------------------------------
// Preset & Action Buttons
// ----------------------------------------------------------------------------
document.querySelectorAll('.susp-preset').forEach((btn) => {
  btn.addEventListener('click', () => {
    sliderSuspHeight.value = btn.dataset.h;
    updateMasterSliders();
    showStatus(`SUSPENSION RIDE HEIGHT SET TO ${btn.dataset.h}m`);
  });
});

// 1-Click Engage Suction Seal Mode (Lowers suspension to 0.27m and activates 60kW Fan)
const btnSealPreset = document.getElementById('btn-seal-preset');
btnSealPreset.addEventListener('click', () => {
  sliderSuspHeight.value = '0.27';
  updateMasterSliders();
  if (!sim.fanEnabled) {
    toggleFan();
  }
  showStatus('SKIRT SEAL MODE ENGAGED: SUSPENSION LOWERED TO 0.27m + 60kW SUCTION FAN ON!');
});

// Refuel Button
const btnRefuel = document.getElementById('btn-refuel');
btnRefuel.addEventListener('click', () => {
  sim.refuel();
  showStatus(sim.lastEventMessage);
  sim.lastEventMessage = '';
});

const btnEqualize = document.getElementById('btn-equalize');
btnEqualize.addEventListener('click', () => {
  const targetVal = sim.sliderMode === 'direct' ? 0 : 100;
  thrusterSliders.forEach((slider) => {
    slider.value = String(targetVal);
  });
  syncThrusterSliders();
  showStatus(
    sim.sliderMode === 'direct'
      ? 'ALL 8 THRUSTERS SET TO 0% DIRECT OUTPUT'
      : 'ALL 8 THRUSTER POWER SLIDERS BALANCED TO 100%'
  );
});

document.getElementById('btn-hover-0').addEventListener('click', () => {
  sliderHoverBase.value = '0';
  updateMasterSliders();
  showStatus('BASE HOVER THROTTLE SET TO 0%');
});

document.getElementById('btn-hover-eq').addEventListener('click', () => {
  const eqPct = Math.round(sim.getEquilibriumHoverRatio() * 100);
  sliderHoverBase.value = String(eqPct);
  updateMasterSliders();
  if (sim.pos.y < 1.1) {
    sim.vel.y = 2.0;
  }
  showStatus(`1.0G EQUILIBRIUM HOVER THROTTLE SET (${eqPct}% = ${((sim.mass * sim.gravity) / 1000).toFixed(1)} kN)`);
});

document.getElementById('btn-hover-lift').addEventListener('click', () => {
  const liftPct = Math.min(100, Math.round(sim.getEquilibriumHoverRatio() * 115));
  sliderHoverBase.value = String(liftPct);
  updateMasterSliders();
  showStatus(`1.15G CLIMB THROTTLE SET (${liftPct}%)`);
});

document.querySelectorAll('.g-preset').forEach((btn) => {
  btn.addEventListener('click', () => {
    sliderGravity.value = btn.dataset.g;
    updateMasterSliders();
    showStatus(`GRAVITY SET TO ${btn.textContent.toUpperCase()} (${btn.dataset.g} m/s²)`);
  });
});

// Slider Mode Switch ('scale' vs 'direct')
const modeScaleBtn = document.getElementById('mode-scale');
const modeDirectBtn = document.getElementById('mode-direct');

modeScaleBtn.addEventListener('click', () => {
  sim.sliderMode = 'scale';
  modeScaleBtn.classList.add('active');
  modeDirectBtn.classList.remove('active');
  thrusterSliders.forEach((s) => {
    s.value = '100';
  });
  syncThrusterSliders();
  showStatus('SLIDER MODE: MAX POWER SCALE (100% CAPACITY PER NOZZLE)');
});

modeDirectBtn.addEventListener('click', () => {
  sim.sliderMode = 'direct';
  modeDirectBtn.classList.add('active');
  modeScaleBtn.classList.remove('active');
  thrusterSliders.forEach((s) => {
    s.value = '0';
  });
  syncThrusterSliders();
  showStatus('DIRECT CONSTANT FIRE MODE: PURE UNASSISTED THRUST FROM SLIDERS (NO PID OVERRIDE)!');
});

// ----------------------------------------------------------------------------
// 60kW Suction Fan & Flight Computer Toggles
// ----------------------------------------------------------------------------
const btnFan = document.getElementById('btn-fan');
const fanStatus = document.getElementById('fan-status');
const btnStab = document.getElementById('btn-stab');
const stabStatus = document.getElementById('stab-status');
const btnHover = document.getElementById('btn-hover');
const hoverStatus = document.getElementById('hover-status');

function toggleFan() {
  sim.fanEnabled = !sim.fanEnabled;
  btnFan.classList.toggle('active', sim.fanEnabled);
  if (!sim.fanEnabled) {
    fanStatus.textContent = 'OFF · Lower Suspension to Seal Skirt';
  }
  showStatus(
    sim.fanEnabled
      ? '60kW UNDERBODY SUCTION FAN ACTIVE — LOWER SUSPENSION TO ~0.27m FOR MAX SEAL!'
      : '60kW UNDERBODY SUCTION FAN OFF'
  );
}

function toggleStabilizer() {
  sim.stabilizerEnabled = !sim.stabilizerEnabled;
  btnStab.classList.toggle('active', sim.stabilizerEnabled);
  stabStatus.textContent = sim.stabilizerEnabled
    ? 'PID Active (Auto-Level)'
    : 'OFF (Raw Unassisted Physics)';
  showStatus(
    sim.stabilizerEnabled
      ? 'GYRO ATTITUDE STABILIZER ENABLED'
      : 'GYRO STABILIZER OFF — PURE RAW RIGID-BODY TORQUE PHYSICS!'
  );
}

function toggleAutoHover() {
  sim.autoHoverEnabled = !sim.autoHoverEnabled;
  if (sim.autoHoverEnabled) {
    sim.targetHoverAltitude = Math.max(3.5, sim.pos.y);
  }
  btnHover.classList.toggle('active', sim.autoHoverEnabled);
  hoverStatus.textContent = sim.autoHoverEnabled
    ? `Holding Alt (${sim.targetHoverAltitude.toFixed(1)}m)`
    : 'Manual Collective';
  showStatus(
    sim.autoHoverEnabled
      ? `AUTO-HOVER ALTITUDE HOLD ENABLED (${sim.targetHoverAltitude.toFixed(1)}m)`
      : 'AUTO-HOVER DISABLED (MANUAL COLLECTIVE)'
  );
}

btnFan.addEventListener('click', toggleFan);
btnStab.addEventListener('click', toggleStabilizer);
btnHover.addEventListener('click', toggleAutoHover);

// Top Bar Action Buttons
const btnRenderMode = document.getElementById('btn-render-mode');
btnRenderMode.addEventListener('click', () => {
  const mode = renderer.toggleRenderMode();
  const isSolid = mode === 'solid';
  btnRenderMode.classList.toggle('active', isSolid);
  btnRenderMode.textContent = isSolid ? '3D: SOLID FLAT' : '3D: VECTOR WIRE';
  showStatus(isSolid ? 'VISUAL MODE: OLD-SCHOOL SOLID 3D FLAT SHADING' : 'VISUAL MODE: RETRO 3D VECTOR WIREFRAME');
});

const btnVectors = document.getElementById('btn-vectors');
btnVectors.addEventListener('click', () => {
  renderer.showVectors = !renderer.showVectors;
  btnVectors.classList.toggle('active', renderer.showVectors);
  btnVectors.textContent = `VECTORS: ${renderer.showVectors ? 'ON' : 'OFF'}`;
});

const btnCamera = document.getElementById('btn-camera');
btnCamera.addEventListener('click', () => {
  const modeName = renderer.cycleCameraMode();
  btnCamera.textContent = `CAM: ${modeName}`;
  showStatus(`CAMERA MODE: ${modeName}`);
});

const btnReset = document.getElementById('btn-reset');
btnReset.addEventListener('click', () => {
  sim.reset();
  showStatus('VEHICLE RESET, REPAIRED & REFUELED AT LAUNCHPAD-0');
});

// ----------------------------------------------------------------------------
// Procedural Web Audio API Rocket + 60kW Suction Fan Synthesizer
// ----------------------------------------------------------------------------
let audioCtx = null;
let noiseNode = null;
let filterNode = null;
let gainNode = null;
let fanOsc = null;
let fanGain = null;
let audioEnabled = false;

function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const bufferSize = audioCtx.sampleRate * 2;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  noiseNode = audioCtx.createBufferSource();
  noiseNode.buffer = buffer;
  noiseNode.loop = true;

  filterNode = audioCtx.createBiquadFilter();
  filterNode.type = 'lowpass';
  filterNode.frequency.value = 180;

  gainNode = audioCtx.createGain();
  gainNode.gain.value = 0.0;

  noiseNode.connect(filterNode);
  filterNode.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  noiseNode.start();

  // 60kW Turbine Whine Oscillator
  fanOsc = audioCtx.createOscillator();
  fanOsc.type = 'sawtooth';
  fanOsc.frequency.value = 260;
  fanGain = audioCtx.createGain();
  fanGain.gain.value = 0.0;
  fanOsc.connect(fanGain);
  fanGain.connect(audioCtx.destination);
  fanOsc.start();
}

const btnAudio = document.getElementById('btn-audio');
btnAudio.addEventListener('click', () => {
  initAudio();
  audioEnabled = !audioEnabled;
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  btnAudio.classList.toggle('active', audioEnabled);
  btnAudio.textContent = `AUDIO: ${audioEnabled ? 'ON' : 'OFF'}`;
  if (!audioEnabled && gainNode) {
    gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.05);
    fanGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.05);
  }
});

function updateAudio(sim) {
  if (!audioEnabled || !gainNode || !filterNode) return;
  const maxTotal = sim.downMaxForce * 4 + sim.sideMaxForce * 4;
  const ratio = Math.min(1, sim.totalThrustMag / Math.max(1000, maxTotal));
  gainNode.gain.setTargetAtTime(ratio * 0.26, audioCtx.currentTime, 0.04);
  filterNode.frequency.setTargetAtTime(110 + ratio * 750, audioCtx.currentTime, 0.04);

  if (sim.fanEnabled) {
    const sealBonus = Math.min(1, sim.suctionForceMag / 22000);
    fanOsc.frequency.setTargetAtTime(220 + sealBonus * 190, audioCtx.currentTime, 0.06);
    fanGain.gain.setTargetAtTime(0.05 + sealBonus * 0.04, audioCtx.currentTime, 0.06);
  } else {
    fanGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.06);
  }
}

// ----------------------------------------------------------------------------
// Keyboard Controls State
// ----------------------------------------------------------------------------
const controls = {
  up: 0,
  down: 0,
  forward: 0,
  backward: 0,
  left: 0,
  right: 0,
  yawLeft: 0,
  yawRight: 0,
  rollLeft: 0,
  rollRight: 0,
};

function handleKey(e, isDown) {
  if (e.target.tagName === 'INPUT' && e.code !== 'Space') return;

  const val = isDown ? 1 : 0;
  switch (e.code) {
    case 'Space':
      e.preventDefault();
      controls.up = val;
      break;
    case 'ShiftLeft':
    case 'ShiftRight':
      controls.down = val;
      break;
    case 'KeyW':
    case 'ArrowUp':
      controls.forward = val;
      break;
    case 'KeyS':
    case 'ArrowDown':
      controls.backward = val;
      break;
    case 'KeyA':
      controls.left = val;
      break;
    case 'KeyD':
      controls.right = val;
      break;
    case 'KeyQ':
      controls.yawLeft = val;
      break;
    case 'KeyE':
      controls.yawRight = val;
      break;
    case 'ArrowLeft':
    case 'KeyZ':
      controls.rollLeft = val;
      break;
    case 'ArrowRight':
    case 'KeyX':
      controls.rollRight = val;
      break;
    default:
      break;
  }

  if (isDown && !e.repeat) {
    if (e.code === 'KeyF') toggleFan();
    if (e.code === 'KeyB') btnRenderMode.click();
    if (e.code === 'KeyT') btnRefuel.click();
    if (e.code === 'KeyG') toggleStabilizer();
    if (e.code === 'KeyH') toggleAutoHover();
    if (e.code === 'KeyV') btnVectors.click();
    if (e.code === 'KeyC') btnCamera.click();
    if (e.code === 'KeyR') btnReset.click();
    if (e.code === 'KeyM') btnAudio.click();
  }
}

window.addEventListener('keydown', (e) => handleKey(e, true));
window.addEventListener('keyup', (e) => handleKey(e, false));

// ----------------------------------------------------------------------------
// Telemetry DOM Elements & Status Banner
// ----------------------------------------------------------------------------
const telAlt = document.getElementById('tel-alt');
const telSpeed = document.getElementById('tel-speed');
const telMass = document.getElementById('tel-mass');
const telThrust = document.getElementById('tel-thrust');
const telSuction = document.getElementById('tel-suction');
const telDamage = document.getElementById('tel-damage');
const telAttitude = document.getElementById('tel-attitude');
const fuelKgReadout = document.getElementById('fuel-kg-readout');
const fuelRateReadout = document.getElementById('fuel-rate-readout');
const fuelTimeReadout = document.getElementById('fuel-time-readout');
const statusBanner = document.getElementById('status-banner');

let bannerTimeout = null;
function showStatus(msg) {
  statusBanner.textContent = msg;
  clearTimeout(bannerTimeout);
  bannerTimeout = setTimeout(() => {
    statusBanner.innerHTML =
      'DRIVE <kbd>WASD</kbd> (1000kW RWD) · LAUNCH <kbd>SPACE</kbd> · 60kW FAN <kbd>F</kbd> · SOLID 3D <kbd>B</kbd> · REFUEL <kbd>T</kbd>';
  }, 4500);
}

function updateTelemetryHUD() {
  const clearance = Math.max(0, sim.pos.y - 0.35);
  const speedMs = Vec3.len(sim.vel);
  const speedKmh = speedMs * 3.6;
  const euler = Quat.toEuler(sim.quat);

  telAlt.innerHTML = `${clearance.toFixed(2)} <small>m</small>`;
  telSpeed.innerHTML = `${speedKmh.toFixed(1)} <small>km/h</small>`;
  telMass.innerHTML = `${Math.round(sim.mass)} <small>kg</small>`;
  telThrust.innerHTML = `${(sim.totalThrustMag / 1000).toFixed(1)} <small>kN</small>`;
  telSuction.innerHTML = `${(sim.suctionForceMag / 1000).toFixed(1)} <small>kN</small>`;

  if (sim.chassisIntegrity < 65) {
    telDamage.className = 'metric-value danger';
    telDamage.textContent = `${sim.chassisIntegrity}% DMG (${sim.lastCrashG.toFixed(0)}G)`;
  } else {
    telDamage.className = 'metric-value accent';
    telDamage.textContent = `${sim.chassisIntegrity}% OK`;
  }

  const pDeg = Math.round((euler.pitch * 180) / Math.PI);
  const rDeg = Math.round((euler.roll * 180) / Math.PI);
  const yDeg = Math.round((euler.yaw * 180) / Math.PI);
  telAttitude.textContent = `${pDeg}° / ${rDeg}° / ${yDeg}°`;

  // Update 60kW Suction Fan Live Telemetry
  if (sim.fanEnabled) {
    const gapMm = Math.round(sim.sealGapMeters * 1000);
    const kPa = (sim.suctionVacuumPa / 1000).toFixed(1);
    const kN = (sim.suctionForceMag / 1000).toFixed(1);
    fanStatus.textContent = `Gap: ${gapMm}mm · Vac: -${kPa}kPa · -${kN}kN`;
  }

  // Update Rocket Fuel Tank Readouts
  fuelKgReadout.textContent = `${sim.fuelMass.toFixed(1)} / ${Math.round(sim.fuelCapacity)} kg`;
  fuelRateReadout.textContent = `${sim.fuelBurnRate.toFixed(1)} kg/s`;
  if (sim.fuelBurnRate > 0.05) {
    const remSec = sim.fuelMass / sim.fuelBurnRate;
    fuelTimeReadout.textContent = `${remSec.toFixed(1)} s`;
  } else {
    fuelTimeReadout.textContent = sim.fuelMass > 0 ? '∞ (Idle)' : 'EMPTY';
  }

  if (sim.autoHoverEnabled) {
    hoverStatus.textContent = `Holding Alt (${sim.targetHoverAltitude.toFixed(1)}m)`;
  }

  for (const key of Object.keys(thrusterOutputs)) {
    const kN = sim.thrusters[key].currentForce / 1000;
    thrusterOutputs[key].live.textContent = `${kN.toFixed(1)} kN`;
  }

  if (sim.lastEventMessage) {
    showStatus(sim.lastEventMessage);
    sim.lastEventMessage = '';
  }
}

// ----------------------------------------------------------------------------
// Main Simulation & Render Loop
// ----------------------------------------------------------------------------
let lastTime = performance.now();

function animate(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  sim.update(dt, controls);
  renderer.render(sim, dt);
  updateTelemetryHUD();
  updateAudio(sim);

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
