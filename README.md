# Mmptz — VECTR-8 // 3D Rocket & Fan Car Physics Simulator

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-brightgreen?style=for-the-badge)](https://rs38.github.io/Mmptz/)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero%20(Pure%20ES6)-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/License-MIT-orange?style=for-the-badge)](#)

A real-time 3D rigid-body vehicle physics simulator and browser game featuring a futuristic wedge coupe with hybrid electric rear-wheel drive, 8 configurable rocket nozzles, an active 60 kW underbody vacuum fan (fan car), variable propellant slosh dynamics, and a custom 3D software rendering engine built purely on HTML5 2D Canvas.

**Live Interactive Demo:** [https://rs38.github.io/Mmptz/](https://rs38.github.io/Mmptz/)

---

## Highlights & Features

* **Dual 3D Software Graphics Engine**: Built from scratch on the HTML5 2D Canvas API without Three.js or WebGL. Defaults to **Old-School Solid 3D Flat Shading** with dynamic directional sun lighting and Painter's algorithm face-sorting, with instant toggle to **Retro 3D Vector Wireframe** (`[B]`).
* **8 Configurable Rocket Thrusters**:
  * 4 downward corner thrusters (`D_FL`, `D_FR`, `D_RL`, `D_RR`) for vertical lift, rocket jumps, and hover.
  * 4 lateral side thrusters (`S_FL`, `S_FR`, `S_RL`, `S_RR`) for strafing, drift stabilization, and yaw torque.
  * Individual nozzle percentage sliders and master power multipliers.
* **1000 kW Classic RWD Drivetrain**: Adjustable rear-wheel electric drive (`0–1000 kW`) with slip ratio and Coulomb traction circles ($F_{\text{friction}} \le \mu \cdot F_N$).
* **60 kW Underbody Suction Ventilator (Fan Car)**: Inspired by the Brabham BT46B and McMurtry Spéirling. Models perimeter skirt gap leakage ($A_{\text{leak}}$) and plenum vacuum downforce ($\Delta P \cdot A_{\text{plenum}}$) when the suspension ride height is lowered to seal the underbody.
* **Giant 21m Inverted Crescent Stunt Loop (Wall-Climb)**: A towering vertical wall and inverted overhang loop structure with glowing red neon borders and steel truss scaffolding — test your 60 kW vacuum fan and 1000 kW RWD drivetrain by driving 90° up the vertical wall and hanging upside down on the ceiling!
* **Dynamic Mass & Propellant Sloshing**: Variable propellant consumption ($dm/dt = \Sigma F / v_e$) alters vehicle weight and moment of inertia. Features a 3D internal fuel cell and a 2D dynamic fluid slosh gauge.
* **Realistic Raycast Suspension & Crash Damage**: 4-corner independent spring-damper struts with adjustable rest length (`0.22–0.90 m`), G-load telemetry, bottom-out crash shard particles, shockwaves, and permanent mesh corner deformation.
* **Flight Computer & Gyro Assists**: Toggleable Gyro Attitude PID Stabilizer (`[G]`, defaults to OFF for pure raw unassisted torque physics) and Auto-Hover Altitude Hold (`[H]`).
* **Procedural Web Audio API Sound**: Synthesized engine roars, thruster noise, and high-frequency vacuum turbine whining without external audio assets.

---

## Controls & Keybindings

| Key | Action | Details |
| :---: | :--- | :--- |
| <kbd>W</kbd> / <kbd>▲</kbd> | **Throttle** | Applies 1000 kW RWD drivetrain power |
| <kbd>S</kbd> / <kbd>▼</kbd> | **Brake / Reverse** | Braking torque and reverse drive |
| <kbd>A</kbd> / <kbd>◄</kbd> | **Steer Left** | Front steering rack angle |
| <kbd>D</kbd> / <kbd>►</kbd> | **Steer Right** | Front steering rack angle |
| <kbd>Space</kbd> | **Vertical Thrusters** | Fires downward rocket nozzles (`D1`–`D4`) |
| <kbd>Q</kbd> / <kbd>E</kbd> | **Lateral Thrusters** | Fires left / right side nozzles for translation |
| <kbd>F</kbd> | **60 kW Suction Fan** | Toggles underbody vacuum fan |
| <kbd>G</kbd> | **Gyro Stabilizer** | Toggles Attitude PID stabilization (Default: OFF) |
| <kbd>H</kbd> | **Auto-Hover** | Toggles altitude hold collective control |
| <kbd>B</kbd> | **Render Mode** | Toggles Solid 3D Flat Shading vs Vector Wireframe |
| <kbd>V</kbd> | **Force Vectors** | Toggles 3D force vector visualization |
| <kbd>C</kbd> | **Camera View** | Cycles Chase $\rightarrow$ Hood $\rightarrow$ Free Orbit |
| <kbd>T</kbd> | **Refuel** | Instantly replenishes rocket propellant tank to 100% |
| <kbd>R</kbd> | **Reset & Repair** | Resets vehicle position, repairs chassis damage, and refuels |
| <kbd>M</kbd> | **Audio Toggle** | Enables / disables procedural Web Audio synthesis |
| **Mouse Drag** | **Orbit Camera** | Click and drag on viewport to rotate free camera |
| **Mouse Wheel** | **Zoom Camera** | Zoom in and out |

---

## Physics & Engineering Principles

### 1. Ground-Effect Fan Vacuum Downforce
The underbody suction ventilator expels air to generate low pressure beneath the chassis:
$$\Delta P = \frac{1}{2} \rho v_{\text{fan}}^2 \cdot \left(1 - \frac{A_{\text{leak}}}{A_{\text{fan}}}\right)$$
$$F_{\text{downforce}} = \Delta P \cdot A_{\text{plenum}}$$
When the suspension ride height is lowered to $\approx 0.27\,\text{m}$, the perimeter skirt seals with the ground, creating massive instantaneous cornering grip regardless of forward velocity.

### 2. Cold Gas Thrusters & COPV Tank Blowdown Physics
The thrusters are fed by a 350-bar composite overwrapped pressure vessel (COPV). As compressed gas empties, tank stagnation pressure drops polytropically:
$$P(t) = P_{\text{rated}} \cdot \left(\frac{m_{\text{gas}}(t)}{m_{\text{capacity}}}\right)^\gamma, \quad T(t) = T_0 \cdot \left(\frac{m_{\text{gas}}(t)}{m_{\text{capacity}}}\right)^{\gamma - 1}$$
$$F_{\text{max}, i}(t) = F_{\text{rated}, i} \cdot \frac{P(t)}{P_{\text{rated}}}, \quad \frac{dm}{dt} = \frac{\sum \|\vec{F}_i\|}{v_e(T)}$$
As tank pressure bleeds down from 350 bar to 0 bar, available thruster authority, cold gas vapor plume length, and synthesized jet frequency smoothly decrease.

### 3. Coulomb Traction Circle
Tire grip is bounded by normal load, combining gravity, suspension spring forces, aerodynamic downforce, and fan vacuum:
$$F_{\text{traction, max}} = \mu \cdot F_N$$
$$(F_{\text{longitudinal}})^2 + (F_{\text{lateral}})^2 \le (\mu F_N)^2$$

---

## Quickstart & Local Development

Because VECTR-8 uses native browser ES modules, serve the folder via any local HTTP server rather than opening `index.html` via `file:///`:

```bash
# Clone the repository
git clone https://github.com/rs38/Mmptz.git
cd Mmptz

# Start a local static server
npx serve .
# Or using Python:
# python -m http.server 8000
```

Open `http://localhost:3000` (or `http://localhost:8000`) in any modern web browser.

No build step, npm install, or compilation is required!

---

## Codebase Architecture

```
.
├── index.html              # HUD layout, telemetry panels, control sliders, and canvas viewports
├── style.css               # Cyberpunk aesthetics, responsive layout, custom range slider tracks
├── main.js                 # Main event loop & lifecycle entry point (<50 lines)
├── physics.js              # Rigid-body equations & simulation facade (<260 lines)
├── renderer.js             # 3D software rasterizer orchestrator (<120 lines)
├── src/                    # Subsystems & physics components (all maintained <270 lines)
│   ├── math.js             # Vec3 & Quat 3D math library
│   ├── terrain.js          # Ramps, landing pads, waypoint rings & surface sampling
│   ├── vehicle_config.js   # Vehicle geometry, thruster positions & inertia
│   ├── fan_physics.js      # 60kW vacuum suction fan dynamics & skirt seal model
│   ├── suspension_physics.js # 4-corner suspension & Coulomb friction tire circle
│   ├── thruster_physics.js # Thruster force allocation & propellant mass flow rate
│   ├── car_mesh.js         # 3D wedge coupe mesh definition & face normals
│   ├── camera.js           # 3D projection, camera orbit, screen shake & drawing helpers
│   ├── particles.js        # Crash shockwave rings, 3D debris shards & tire smoke
│   ├── render_env.js       # Gradients, floor grid, solid/wireframe ramps & shadows
│   ├── render_stunt_loop.js # Inverted crescent loop, red neon edges & truss tower
│   ├── render_car.js       # Flat-shaded car body, internal fuel cell, struts & plumes
│   ├── render_hud.js       # 2D propellant sloshing gauge & thruster schematic canvas
│   ├── audio.js            # Procedural Web Audio API sound generator
│   ├── input.js            # Keyboard mapping, state tracking & action dispatch
│   └── ui.js               # Slider bindings, CSS variable sync & live telemetry
└── AGENTS.md               # Technical guidelines & architecture map for AI agents
```

For detailed contributor guidelines, coordinate system conventions, and module internals, refer to [AGENTS.md](AGENTS.md).

---

## License

MIT License — feel free to explore, fork, and hack!
