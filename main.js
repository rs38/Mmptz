// ============================================================================
// VECTR-8 // Main Simulation Loop & Systems Entry Point
// ============================================================================

import { RocketCarSim } from './physics.js';
import { VectorRenderer } from './renderer.js';
import { initUI, updateTelemetry } from './src/ui.js';
import { controls, initInput } from './src/input.js';
import { updateAudio } from './src/audio.js';

const canvas = document.getElementById('sim-canvas');
const schematicCanvas = document.getElementById('schematic-canvas');
const fuelCanvas = document.getElementById('fuel-canvas');

const sim = new RocketCarSim();
const renderer = new VectorRenderer(canvas, schematicCanvas, fuelCanvas);

// Bind Sliders, Toggles, and Keybindings
const { thrusterOutputs, actions } = initUI(sim, renderer);
initInput(actions);

// ----------------------------------------------------------------------------
// Main Simulation & Render Loop
// ----------------------------------------------------------------------------
let lastTime = performance.now();

function animate(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  sim.update(dt, controls);
  renderer.render(sim, dt);
  updateTelemetry(sim, thrusterOutputs);
  updateAudio(sim);

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
