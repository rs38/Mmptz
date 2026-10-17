# Mmptz — VECTR-8 // 3D Rocket & Fan Car Physics Simulator

Live Demo on GitHub Pages: **https://rs38.github.io/Mmptz/**

A 3D vector-based and flat-shaded browser game & rigid-body physics simulator featuring a futuristic wedge coupe equipped with:
- **8 Configurable Rocket Thrusters**: 4 downward corner thrusters (`D1`–`D4`) + 4 lateral side thrusters (`S1`–`S4`, 2 on left, 2 on right) with individual & master thrust sliders (`F = ma`, `τ = r × F`).
- **1000 kW Classic RWD Drivetrain**: Adjustable rear-wheel power (`0–1000 kW`) bounded by real tire normal load and Coulomb traction circle.
- **60 kW Underbody Suction Ventilator (Fan Car)**: Models perimeter skirt gap leakage (`A_leak`) and plenum vacuum downforce (`ΔP · A_plenum`) when the suspension ride height is lowered to seal the underbody.
- **Rocket Propellant Tank & Dynamic Mass**: Real-time fuel burn (`dm/dt = ΣF / v_e`), 3D internal tank & 2D sloshing gauge, tank capacity slider (`40–800 kg`), and instant refuel (`[T]`).
- **Custom Suspension Height & Crash Visualization**: Adjustable suspension travel (`0.22–0.90 m`) with 3D crash shards, shockwaves, G-load telemetry, and corner mesh deformation when an impact bottoms out the suspension.
- **Dual 3D Render Modes**: Toggle between **Retro 3D Vector Wireframe** and **Old-School Solid 3D Flat Shading** (`[B]`).
