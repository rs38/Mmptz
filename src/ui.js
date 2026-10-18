// ============================================================================
// VECTR-8 // UI Sliders Two-Way Binding, Flight Controls & Live Telemetry HUD
// ============================================================================

import { Vec3, Quat } from './math.js';
import { toggleAudio } from './audio.js';

export function syncSliderCSS(slider, formattedText) {
  slider.style.setProperty('--attr-min', slider.min || 0);
  slider.style.setProperty('--attr-max', slider.max || 100);
  slider.style.setProperty('--control-value', slider.value);
  if (formattedText) {
    slider.setAttribute('aria-valuetext', formattedText);
  }
}

let statusBanner = null;
let bannerTimeout = null;

export function showStatus(msg) {
  if (!statusBanner) statusBanner = document.getElementById('status-banner');
  if (!statusBanner) return;
  statusBanner.textContent = msg;
  clearTimeout(bannerTimeout);
  bannerTimeout = setTimeout(() => {
    statusBanner.innerHTML =
      'DRIVE <kbd>WASD</kbd> (1000kW RWD) · LAUNCH <kbd>SPACE</kbd> · 60kW FAN <kbd>F</kbd> · SOLID 3D <kbd>B</kbd> · REFUEL <kbd>T</kbd>';
  }, 4500);
}

export function initUI(sim, renderer) {
  statusBanner = document.getElementById('status-banner');

  // Master Sliders
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

    sim.fuelCapacity = parseFloat(sliderFuelCap.value);
    sim.fuelMass = Math.min(sim.fuelMass, sim.fuelCapacity);
    const fuelTxt = `${Math.round(sim.fuelCapacity)} kg`;
    outFuelCap.textContent = fuelTxt;
    syncSliderCSS(sliderFuelCap, fuelTxt);

    sim.downMaxForce = parseFloat(sliderDownMaster.value) * 1000;
    const downTxt = `${parseFloat(sliderDownMaster.value).toFixed(1)} kN`;
    outDownMaster.textContent = downTxt;
    syncSliderCSS(sliderDownMaster, downTxt);

    sim.sideMaxForce = parseFloat(sliderSideMaster.value) * 1000;
    const sideTxt = `${parseFloat(sliderSideMaster.value).toFixed(1)} kN`;
    outSideMaster.textContent = sideTxt;
    syncSliderCSS(sliderSideMaster, sideTxt);

    sim.hoverBaseThrottle = parseFloat(sliderHoverBase.value) / 100;
    const hovTxt = `${Math.round(sim.hoverBaseThrottle * 100)}%`;
    outHoverBase.textContent = hovTxt;
    syncSliderCSS(sliderHoverBase, hovTxt);

    sim.gravity = parseFloat(sliderGravity.value);
    const gravTxt = `${sim.gravity.toFixed(1)} m/s²`;
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
  ].forEach((s) => s.addEventListener('input', updateMasterSliders));
  updateMasterSliders();

  // Thruster Sliders
  const thrusterOutputs = {};
  const thrusterKeys = ['D_FL', 'D_FR', 'D_RL', 'D_RR', 'S_FL', 'S_FR', 'S_RL', 'S_RR'];

  function syncThrusterSliders() {
    for (const key of thrusterKeys) {
      const slug = key.toLowerCase().replace('_', '-');
      const slider = document.getElementById(`slider-${slug}`);
      const valOut = document.getElementById(`out-${slug}`);
      const liveOut = document.getElementById(`live-${slug}`);
      thrusterOutputs[key] = { slider, val: valOut, live: liveOut };

      if (slider) {
        slider.addEventListener('input', () => {
          const pct = parseInt(slider.value, 10);
          sim.thrusters[key].sliderPct = pct;
          const txt = `${pct}%`;
          if (valOut) valOut.textContent = txt;
          syncSliderCSS(slider, txt);
        });
        syncSliderCSS(slider, `${slider.value}%`);
      }
    }
  }
  syncThrusterSliders();

  // Slider Mode Toggle
  document.querySelectorAll('input[name="slider-mode"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
      sim.sliderMode = e.target.value;
      showStatus(
        sim.sliderMode === 'direct'
          ? 'THRUSTER DIRECT MANUAL FIRE: Slider overrides active flight computer'
          : 'THRUSTER SCALING MODE: Multiplies automatic flight computer throttle'
      );
    });
  });

  // Action Buttons
  const btnFan = document.getElementById('btn-fan');
  const fanStatus = document.getElementById('fan-status');
  const btnStab = document.getElementById('btn-stab');
  const stabStatus = document.getElementById('stab-status');
  const btnHover = document.getElementById('btn-hover');
  const hoverStatus = document.getElementById('hover-status');
  const btnRefuel = document.getElementById('btn-refuel');
  const btnRenderMode = document.getElementById('btn-render-mode');
  const btnVectors = document.getElementById('btn-vectors');
  const btnCamera = document.getElementById('btn-camera');
  const btnAudio = document.getElementById('btn-audio');
  const btnReset = document.getElementById('btn-reset');

  function toggleFanAction() {
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

  function toggleStabilizerAction() {
    sim.stabilizerEnabled = !sim.stabilizerEnabled;
    btnStab.classList.toggle('active', sim.stabilizerEnabled);
    stabStatus.textContent = sim.stabilizerEnabled ? 'PID Active (Auto-Level)' : 'OFF (Raw Unassisted Physics)';
    showStatus(
      sim.stabilizerEnabled
        ? 'GYRO ATTITUDE STABILIZER ENABLED'
        : 'GYRO STABILIZER OFF — PURE RAW RIGID-BODY TORQUE PHYSICS!'
    );
  }

  function toggleAutoHoverAction() {
    sim.autoHoverEnabled = !sim.autoHoverEnabled;
    if (sim.autoHoverEnabled) {
      sim.targetHoverAltitude = Math.max(3.5, sim.pos.y);
    }
    btnHover.classList.toggle('active', sim.autoHoverEnabled);
    hoverStatus.textContent = sim.autoHoverEnabled ? `Holding Alt (${sim.targetHoverAltitude.toFixed(1)}m)` : 'Manual Collective';
    showStatus(
      sim.autoHoverEnabled
        ? `AUTO-HOVER ALTITUDE HOLD ENABLED (${sim.targetHoverAltitude.toFixed(1)}m)`
        : 'AUTO-HOVER DISABLED (MANUAL COLLECTIVE)'
    );
  }

  function toggleRenderModeAction() {
    const mode = renderer.toggleRenderMode();
    const isSolid = mode === 'solid';
    btnRenderMode.classList.toggle('active', isSolid);
    btnRenderMode.textContent = isSolid ? '3D: SOLID FLAT' : '3D: VECTOR WIRE';
    showStatus(isSolid ? 'VISUAL MODE: OLD-SCHOOL SOLID 3D FLAT SHADING' : 'VISUAL MODE: RETRO 3D VECTOR WIREFRAME');
  }

  function toggleVectorsAction() {
    renderer.showVectors = !renderer.showVectors;
    btnVectors.classList.toggle('active', renderer.showVectors);
    btnVectors.textContent = `VECTORS: ${renderer.showVectors ? 'ON' : 'OFF'}`;
  }

  function cycleCameraAction() {
    const modeName = renderer.cycleCameraMode();
    btnCamera.textContent = `CAM: ${modeName}`;
    showStatus(`CAMERA MODE: ${modeName}`);
  }

  function toggleAudioAction() {
    const isAudioOn = toggleAudio();
    btnAudio.classList.toggle('active', isAudioOn);
    btnAudio.textContent = `AUDIO: ${isAudioOn ? 'ON' : 'OFF'}`;
  }

  function resetAction() {
    sim.reset();
    showStatus('VEHICLE RESET, REPAIRED & REFUELED AT LAUNCHPAD-0');
  }

  btnFan.addEventListener('click', toggleFanAction);
  btnStab.addEventListener('click', toggleStabilizerAction);
  btnHover.addEventListener('click', toggleAutoHoverAction);
  btnRefuel.addEventListener('click', () => {
    sim.refuel();
    showStatus(`ROCKET TANK INSTANTLY REFUELED TO ${sim.fuelCapacity} kg`);
  });
  btnRenderMode.addEventListener('click', toggleRenderModeAction);
  btnVectors.addEventListener('click', toggleVectorsAction);
  btnCamera.addEventListener('click', cycleCameraAction);
  btnAudio.addEventListener('click', toggleAudioAction);
  btnReset.addEventListener('click', resetAction);

  return {
    thrusterOutputs,
    actions: {
      toggleFan: toggleFanAction,
      toggleStabilizer: toggleStabilizerAction,
      toggleAutoHover: toggleAutoHoverAction,
      toggleRenderMode: toggleRenderModeAction,
      toggleVectors: toggleVectorsAction,
      cycleCamera: cycleCameraAction,
      toggleAudio: toggleAudioAction,
      reset: resetAction,
      refuel: () => btnRefuel.click(),
    },
  };
}

// Live Telemetry Readouts
export function updateTelemetry(sim, thrusterOutputs) {
  const clearance = Math.max(0, sim.pos.y - 0.35);
  const speedKmh = Vec3.len(sim.vel) * 3.6;
  const euler = Quat.toEuler(sim.quat);

  document.getElementById('tel-alt').innerHTML = `${clearance.toFixed(2)} <small>m</small>`;
  document.getElementById('tel-speed').innerHTML = `${speedKmh.toFixed(1)} <small>km/h</small>`;
  document.getElementById('tel-mass').innerHTML = `${Math.round(sim.mass)} <small>kg</small>`;
  document.getElementById('tel-thrust').innerHTML = `${(sim.totalThrustMag / 1000).toFixed(1)} <small>kN</small>`;
  document.getElementById('tel-suction').innerHTML = `${(sim.suctionForceMag / 1000).toFixed(1)} <small>kN</small>`;

  const telDamage = document.getElementById('tel-damage');
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
  document.getElementById('tel-attitude').textContent = `${pDeg}° / ${rDeg}° / ${yDeg}°`;

  if (sim.fanEnabled) {
    const gapMm = Math.round(sim.sealGapMeters * 1000);
    const kPa = (sim.suctionVacuumPa / 1000).toFixed(1);
    const kN = (sim.suctionForceMag / 1000).toFixed(1);
    document.getElementById('fan-status').textContent = `Gap: ${gapMm}mm · Vac: -${kPa}kPa · -${kN}kN`;
  }

  const pressOut = document.getElementById('fuel-pressure-readout');
  if (pressOut) {
    pressOut.textContent = `${Math.round(sim.tankPressureBar)} bar`;
  }
  document.getElementById('fuel-kg-readout').textContent = `${sim.fuelMass.toFixed(1)} / ${Math.round(sim.fuelCapacity)} kg`;
  document.getElementById('fuel-rate-readout').textContent = `${sim.fuelBurnRate.toFixed(1)} kg/s`;
  const fuelTime = document.getElementById('fuel-time-readout');
  if (sim.fuelBurnRate > 0.05) {
    fuelTime.textContent = `${(sim.fuelMass / sim.fuelBurnRate).toFixed(1)} s`;
  } else {
    fuelTime.textContent = sim.fuelMass > 0 ? '∞ (Idle)' : 'EMPTY';
  }

  if (sim.autoHoverEnabled) {
    document.getElementById('hover-status').textContent = `Holding Alt (${sim.targetHoverAltitude.toFixed(1)}m)`;
  }

  if (thrusterOutputs) {
    for (const key of Object.keys(thrusterOutputs)) {
      const kN = sim.thrusters[key].currentForce / 1000;
      thrusterOutputs[key].live.textContent = `${kN.toFixed(1)} kN`;
    }
  }

  if (sim.lastEventMessage) {
    showStatus(sim.lastEventMessage);
    sim.lastEventMessage = '';
  }
}
