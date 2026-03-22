# Voxel Buoyancy Demo

A modular Babylon.js + Vite prototype based on the provided voxel buoyancy specification.

## Tech stack

- HTML
- CSS
- JavaScript (ES modules)
- Babylon.js
- Vite

## Included features

- Flat water plane with constant water level
- Voxel ship built from cube blocks in a 3D grid
- Custom buoyancy using submerged volume per voxel
- Custom rigid-body style motion with gravity, damping, torque, and drag
- Orbit camera and zoom
- Reset button and keyboard shortcut
- Cargo add/remove buttons to test balance changes
- UI stats panel
- Debug highlight for submerged voxels
- Centre of mass marker

## Project structure

```text
voxel-buoyancy-demo/
  index.html
  package.json
  vite.config.js
  src/
    main.js
    scene.js
    water.js
    voxelShip.js
    buoyancy.js
    input.js
    ui.js
    config.js
    style.css
```

## Run locally

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal.

## Build for static hosting

```bash
npm run build
npm run preview
```

## Controls

- Mouse drag: orbit camera
- Mouse wheel / pinch: zoom
- `R`: reset ship
- `E`: add cargo block
- `Q`: remove cargo block
- `H`: toggle submerged highlight
- `M`: toggle centre of mass marker

## Notes

- Water is flat and infinite-looking for the first version.
- Buoyancy is computed from submerged volume, water density, and gravity.
- Heavier cargo changes the ship behaviour by changing total mass and mass distribution.
- This is intentionally a clean first version that leaves room for future extensions like waves, flooding, propulsion, and editable ship building.
