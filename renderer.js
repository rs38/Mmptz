// ============================================================================
// VECTR-8 // 3D Vector Wireframe & Old-School Solid 3D Flat-Shaded Renderer
// ============================================================================

import { buildCarMesh } from './src/car_mesh.js';
import { Camera } from './src/camera.js';
import { ParticleSystem } from './src/particles.js';
import {
  renderSkyAndGround,
  renderFloorGrid,
  renderArena,
  renderDropShadowAndSuction,
} from './src/render_env.js';
import {
  renderCar,
  render3DFuelTankInsideCar,
  renderThrusterPlumes,
  renderForceVectors,
} from './src/render_car.js';
import { renderFuelTankHUD, renderSchematic } from './src/render_hud.js';

export class VectorRenderer {
  constructor(canvas, schematicCanvas, fuelCanvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.schCanvas = schematicCanvas;
    this.schCtx = schematicCanvas ? schematicCanvas.getContext('2d') : null;
    this.fuelCanvas = fuelCanvas;
    this.fuelCtx = fuelCanvas ? fuelCanvas.getContext('2d') : null;

    this.carMesh = buildCarMesh();
    this.showVectors = true;
    this.renderMode = 'solid'; // 'solid' (Default) or 'vector'

    this.camera = new Camera(canvas);
    this.particles = new ParticleSystem();

    this.fanAngle = 0;
    this.time = 0;
  }

  // Camera proxy getters/setters for backwards compatibility
  get cameraMode() {
    return this.camera.cameraMode;
  }
  set cameraMode(val) {
    this.camera.cameraMode = val;
  }
  get camYaw() {
    return this.camera.camYaw;
  }
  set camYaw(val) {
    this.camera.camYaw = val;
  }
  get camPitch() {
    return this.camera.camPitch;
  }
  set camPitch(val) {
    this.camera.camPitch = val;
  }
  get camDist() {
    return this.camera.camDist;
  }
  set camDist(val) {
    this.camera.camDist = val;
  }
  get camPos() {
    return this.camera.camPos;
  }
  get camTarget() {
    return this.camera.camTarget;
  }
  get width() {
    return this.camera.width;
  }
  get height() {
    return this.camera.height;
  }

  resize() {
    this.camera.resize();
  }

  toggleRenderMode() {
    this.renderMode = this.renderMode === 'vector' ? 'solid' : 'vector';
    return this.renderMode;
  }

  cycleCameraMode() {
    return this.camera.cycleCameraMode();
  }

  render(sim, dt) {
    this.time += dt;
    if (sim.fanEnabled) {
      this.fanAngle += dt * 42;
    }

    this.camera.update(sim, dt);
    this.particles.process(sim, dt, this.camera);

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Sky and Ground Shading
    renderSkyAndGround(this.camera, ctx, this.renderMode);

    // 2. Floor Grid
    renderFloorGrid(this.camera, sim, this.renderMode);

    // 3. Arena Ramps, Landing Pads & Waypoints
    renderArena(this.camera, ctx, sim, this.renderMode);

    // 4. Drop Shadow & Suction Vortex
    renderDropShadowAndSuction(this.camera, sim, this.renderMode, this.fanAngle, this.time);

    // 5. Particles & Crash Shards
    this.particles.render(this.camera, ctx);

    // 6. Car Body, 3D Fuel Cell, Suspension, Wheels & Skirt
    renderCar(this.camera, ctx, sim, this.carMesh, this.renderMode);

    // 7. 8 Thruster Plumes
    renderThrusterPlumes(this.camera, sim, this.time);

    // 8. 3D Force Vectors Overlay
    if (this.showVectors) {
      renderForceVectors(this.camera, sim);
    }

    // 9. 2D HUD Canvases (Schematic & Fuel Tank Gauge)
    if (this.schCtx) renderSchematic(this.schCtx, this.schCanvas, sim);
    if (this.fuelCtx) renderFuelTankHUD(this.fuelCtx, this.fuelCanvas, sim, this.time);
  }
}
