// ============================================================================
// VECTR-8 // Procedural Web Audio API Rocket + 60kW Suction Fan Synthesizer
// ============================================================================

let audioCtx = null;
let noiseNode = null;
let filterNode = null;
let gainNode = null;
let fanOsc = null;
let fanGain = null;
let audioEnabled = false;

export function initAudio() {
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

export function toggleAudio() {
  initAudio();
  audioEnabled = !audioEnabled;
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  if (!audioEnabled && gainNode) {
    gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.05);
    fanGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.05);
  }
  return audioEnabled;
}

export function updateAudio(sim) {
  if (!audioEnabled || !gainNode || !filterNode) return;
  const pressRatio = Math.max(0, (sim.tankPressureBar || 0) / Math.max(1, sim.tankRatedPressureBar || 350));
  const maxTotal = sim.downMaxForce * 4 + sim.sideMaxForce * 4;
  const ratio = Math.min(1, sim.totalThrustMag / Math.max(1000, maxTotal));
  gainNode.gain.setTargetAtTime(ratio * pressRatio * 0.28, audioCtx.currentTime, 0.04);
  filterNode.frequency.setTargetAtTime(140 + ratio * pressRatio * 950, audioCtx.currentTime, 0.04);

  if (sim.fanEnabled) {
    const sealBonus = Math.min(1, sim.suctionForceMag / 22000);
    fanOsc.frequency.setTargetAtTime(220 + sealBonus * 190, audioCtx.currentTime, 0.06);
    fanGain.gain.setTargetAtTime(0.05 + sealBonus * 0.04, audioCtx.currentTime, 0.06);
  } else {
    fanGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.06);
  }
}
