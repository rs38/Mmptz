# AGENTS.md — Contributor & AI Agent Guide for VECTR-8

Welcome to the **VECTR-8 / Mmptz** codebase. This document is written for AI coding assistants and human developers taking over further development, feature additions, physics tuning, or bug fixes.

---

## 1. Project Overview & Philosophy

**VECTR-8** is a real-time 3D rigid-body vehicle simulation and browser game built with **zero external libraries or build tools**. It renders directly to HTML5 2D Canvas elements using a custom software 3D pipeline and simulates authentic multi-physics:

* **8 Cold Gas Thrusters & COPV Pressure Vessel**: 4 downward corner nozzles (`D_FL`, `D_FR`, `D_RL`, `D_RR`) and 4 lateral side nozzles (`S_FL`, `S_FR`, `S_RL`, `S_RR`) fed by a 350 bar compressed gas tank with authentic blowdown pressure drop ($P(t) \propto m^\gamma$) and expansion chilling, dynamically scaling available thrust and plume size as the tank empties.
* **1000 kW RWD Drivetrain**: Rear-wheel propulsion bounded by dynamic normal load and Coulomb friction traction circles.
* **60 kW Underbody Fan Car (Vacuum Downforce)**: Ground-effect skirt leakage model ($\Delta P \cdot A_{\text{plenum}}$) generating massive grip when suspension is lowered.
* **Dynamic Mass & Propellant Tank**: Variable mass compressed gas consumption ($dm/dt = \Sigma F / v_e$) that dynamically alters the vehicle's center of gravity and moment of inertia.
* **Dual 3D Render Engines**: Software-based **Old-School Solid 3D Flat Shading** (active by default) and **Retro 3D Vector Wireframe**.
* **Zero Dependencies**: Pure HTML5, CSS3, and ES6 JavaScript modules (`import`/`export`).

---

## 2. Default Configuration & Invariants

Ensure any future modifications adhere to these established defaults and invariants:

| Parameter | Default Value | Notes |
| :--- | :--- | :--- |
| **Visual Render Mode** | `'solid'` (Solid 3D Flat Shading) | Toggleable with `[B]` or top HUD button |
| **Gyro Attitude Stabilizer** | `false` (OFF — Raw Physics) | Toggleable with `[G]` or flight panel button |
| **Auto-Hover** | `false` (OFF — Manual Collective) | Toggleable with `[H]` |
| **60kW Suction Fan** | `false` (OFF) | Toggleable with `[F]` |
| **Coordinate System** | Right-Handed: $+X$ Right, $+Y$ Up, $+Z$ Forward | Standard aerospace/vehicle convention |
| **Physical Units** | SI (MKS): meters, seconds, kg, Newtons, Pascals, Watts | Never hardcode arbitrary scale multipliers into physics calculations |

---

## 3. Architecture & File Structure

```
.
├── index.html              # Semantic HTML5 layout, HUD overlays, SVG schematics, and control sliders
├── style.css               # Retro-futuristic cyberpunk styling, responsive panels, CSS custom variables
├── main.js                 # Simulation game loop entry point (<50 lines)
├── physics.js              # Rigid-body dynamics orchestrator & facade (<260 lines)
├── renderer.js             # 3D software rasterizer orchestrator & facade (<120 lines)
├── src/                    # Modular engine subsystems (all maintained below ~270 lines)
│   ├── math.js             # Vec3 & Quat 3D math utility library
│   ├── terrain.js          # Arena world pads, ramps, waypoint rings & surface sampling
│   ├── vehicle_config.js   # Vehicle geometry, thruster layout, wheel mounts & inertia
│   ├── fan_physics.js      # 60kW vacuum suction fan dynamics & skirt seal leakage model
│   ├── suspension_physics.js # 4-corner raycast suspension & Coulomb friction tire circles
│   ├── thruster_physics.js # Thruster throttle allocation & propellant mass flow rate
│   ├── car_mesh.js         # 3D wedge coupe vertices & right-hand normal face definitions
│   ├── camera.js           # Projection matrix, camera orbit, shake & 3D drawing primitives
│   ├── particles.js        # Crash shockwave rings, 3D debris shards & tire smoke particles
│   ├── render_env.js       # Floor grid, solid/wireframe arena ramps & drop shadows
│   ├── render_stunt_loop.js # Crescent stunt loop, red neon edge rims & truss tower
│   ├── render_car.js       # Car body rasterization, 3D fuel cell, struts & plumes
│   ├── render_hud.js       # 2D propellant sloshing gauge & thruster schematic canvas
│   ├── audio.js            # Procedural Web Audio API synthesizer for thrusters & 60kW fan
│   ├── input.js            # Keyboard mapping, state tracking & action dispatch
│   └── ui.js               # HUD slider bindings, syncSliderCSS & live telemetry HUD
├── .nojekyll               # Ensures GitHub Pages serves files with raw underscore/dot names without Jekyll
└── .github/workflows/
    └── pages.yml           # Automated GitHub Pages CI/CD deployment on push to `main`
```

### Module Responsibilities

All modules follow a strict size discipline, staying below ~200–300 lines each:

* **`physics.js` & `src/*_physics.js`**:
  * `src/math.js`: High-performance 3D vector and quaternion math utility libraries.
  * `src/terrain.js`: Terrain height and surface normal evaluation (`sampleSurface`).
  * `src/vehicle_config.js`: Default vehicle dimensions, thruster positions, wheel mounts, and moment of inertia.
  * `src/fan_physics.js`: 60 kW vacuum fan ground-effect skirt leakage ($A_{\text{leak}}$) and plenum downforce ($\Delta P \cdot A_{\text{plenum}}$).
  * `src/suspension_physics.js`: 4 independent suspension raycasts, bump-stops, and Coulomb tire friction circles ($\mu \cdot F_N$).
  * `src/thruster_physics.js`: Thruster force allocation, attitude torques, and propellant mass flow ($dm/dt = \Sigma F / v_e$).
  * `physics.js`: Rigid-body equations of motion integration, collision handling, and public export facade.

* **`renderer.js` & `src/render_*.js`**:
  * `src/car_mesh.js`: 3D wedge car vertices and polygon faces.
  * `src/camera.js`: Projection math, camera modes (chase, side, orbit), screen shake, and 3D drawing primitives.
  * `src/particles.js`: Particle emissions, 3D crash shockwave rings, and debris shards.
  * `src/render_env.js`: Sky/ground gradients, floor grid, ramps, pads, and drop shadows.
  * `src/render_car.js`: Solid 3D flat shading (Painter's algorithm), wireframe mode, 3D internal fuel cell, struts, wheels, and rocket plumes.
  * `src/render_hud.js`: 2D fuel tank fluid slosh gauge and top-down thruster schematic canvas.
  * `renderer.js`: Coordinates rendering passes and viewport sizing.

* **`main.js`, `src/audio.js`, `src/input.js` & `src/ui.js`**:
  * `src/audio.js`: Procedural Web Audio API pink noise thruster rumble and fan oscillation.
  * `src/input.js`: Keyboard state tracker and hotkey dispatcher.
  * `src/ui.js`: DOM slider two-way binding (`syncSliderCSS`), flight toggles, status banner, and live telemetry.
  * `main.js`: Compact game loop (`requestAnimationFrame`).

---

## 4. Local Development & Testing

Because the codebase uses native browser ES modules (`import { RocketCarSim } from './physics.js'`), modern browsers enforce CORS security and block module loading when opening `index.html` via `file:///`.

### Running Locally

Run a simple local HTTP server from the project root:

```bash
# Using Node / npx:
npx serve .

# Or using Python 3:
python -m http.server 8000

# Or using PHP:
php -S localhost:8000
```

Open `http://localhost:8000` in Chrome, Firefox, Safari, or Edge.

### Verification Checklist for New Features

When making changes, always test:
1. **Console Integrity**: Open Developer Tools (`F12`) to ensure no uncaught exceptions or module loading errors.
2. **Drive & Physics**: Drive with `WASD`, launch with `Space`, lower suspension, toggle 60kW Fan (`F`), and ensure vehicle remains stable or reacts physically realistically.
3. **Render Modes**: Toggle `[B]` between Solid 3D Flat Shading and Vector Wireframe; verify no flickering faces or broken depth-sorting.
4. **Thruster & Gyro**: Test with Gyro Stabilizer OFF (default) and ON (`[G]`). Test individual nozzle sliders on the right-hand HUD.
5. **Refuel & Reset**: Press `[T]` to refuel; press `[R]` to reset position and verify all states (mass, damage, velocities) reset cleanly.

---

## 5. Controls & Keybindings Reference

| Key / Control | Function | System Affected |
| :--- | :--- | :--- |
| `W` / `Up` | Throttle (1000 kW RWD drivetrain) | Wheels / Acceleration |
| `S` / `Down` | Brakes / Reverse | Wheels / Deceleration |
| `A` / `Left` | Steer Left | Front Wheel Angle |
| `D` / `Right` | Steer Right | Front Wheel Angle |
| `Space` | Fire Downward Thrusters (Vertical Lift) | Rocket Thrusters `D1`–`D4` |
| `Q` / `E` | Lateral Translation (Left / Right) | Side Thrusters `S1`–`S4` |
| `F` | Toggle 60kW Underbody Suction Fan | Ground-Effect Fan Vacuum |
| `G` | Toggle Gyro Attitude PID Stabilizer | Flight Computer Assist |
| `H` | Toggle Auto-Hover Altitude Hold | Flight Computer Assist |
| `B` | Toggle Solid 3D Flat Shading vs Wireframe | Graphics Renderer |
| `V` | Toggle 3D Force Vectors Display | Visual HUD Overlays |
| `C` | Cycle Camera Mode (Chase / Hood / Free) | Viewport Camera |
| `T` | Instant Refuel Propellant Tank | Rocket Mass System |
| `R` | Reset Car & Repair at Launchpad-0 | Simulation Reset |
| `M` | Toggle Audio (Procedural Web Audio) | Sound Synthesizer |
| `Left Mouse Drag` | Orbit Free Camera (yaw / pitch) | Viewport Camera |
| `Mouse Wheel` | Zoom Camera In / Out | Viewport Camera |

---

## 6. Coding Guidelines & Best Practices

1. **No External Dependencies**: Keep the application 100% dependency-free and lightweight. Do not add heavy npm bundlers, frameworks (React, Vue), or large 3D libraries (Three.js, Babylon.js) without explicit instructions.
2. **Deterministic & Frame-Independent Physics**: Always multiply rates by `dt` within `physics.js`. Use sub-stepping if adding stiff collision or complex constraint solvers.
3. **Consistent Slider Styling**: Keep UI controls aligned with the custom range styling pattern:
   ```javascript
   function syncSliderCSS(slider, formattedText) {
     slider.style.setProperty('--attr-min', slider.min || 0);
     slider.style.setProperty('--attr-max', slider.max || 100);
     slider.style.setProperty('--control-value', slider.value);
     if (formattedText) slider.setAttribute('aria-valuetext', formattedText);
   }
   ```
4. **Responsive HUD & Canvas Resizing**: Keep `window.addEventListener('resize', resizeCanvas)` active to ensure high-DPI crisp rendering on retina displays.
5. **Git Workflow**: Commits on branch `main` automatically deploy to GitHub Pages via the workflow in `.github/workflows/pages.yml`. Ensure `main` remains production-ready.
