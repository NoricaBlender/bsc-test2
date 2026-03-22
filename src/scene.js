import * as BABYLON from "@babylonjs/core";
import { CONFIG } from "./config.js";
import { createWater } from "./water.js";
import { VoxelShip } from "./voxelShip.js";
import { BuoyancyController } from "./buoyancy.js";
import { setupInputHandlers } from "./input.js";
import { createUI } from "./ui.js";

export function createGame(engine, canvas) {
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(...CONFIG.visuals.skyColor);

  const camera = new BABYLON.ArcRotateCamera(
    "orbitCamera",
    -Math.PI / 2,
    1.05,
    20,
    new BABYLON.Vector3(0, 1.6, 0),
    scene
  );
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 8;
  camera.upperRadiusLimit = 45;
  camera.wheelDeltaPercentage = 0.01;
  camera.panningSensibility = 0;

  const hemiLight = new BABYLON.HemisphericLight(
    "hemiLight",
    new BABYLON.Vector3(0.1, 1, 0.2),
    scene
  );
  hemiLight.intensity = 0.95;

  const dirLight = new BABYLON.DirectionalLight(
    "dirLight",
    new BABYLON.Vector3(-0.4, -1, -0.35),
    scene
  );
  dirLight.position = new BABYLON.Vector3(20, 30, 20);
  dirLight.intensity = 0.75;

  const ground = BABYLON.MeshBuilder.CreateGround(
    "seaFloorReference",
    { width: 300, height: 300, subdivisions: 2 },
    scene
  );
  ground.position.y = -12;

  const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
  groundMaterial.diffuseColor = new BABYLON.Color3(0.42, 0.54, 0.41);
  groundMaterial.specularColor = BABYLON.Color3.Black();
  ground.material = groundMaterial;

  const water = createWater(scene, CONFIG);
  const ship = new VoxelShip(scene, CONFIG);
  const buoyancy = new BuoyancyController(ship, water, CONFIG.physics);

  const comMarker = BABYLON.MeshBuilder.CreateSphere(
    "centerOfMassMarker",
    { diameter: 0.35, segments: 12 },
    scene
  );
  const comMarkerMaterial = new BABYLON.StandardMaterial("comMarkerMaterial", scene);
  comMarkerMaterial.emissiveColor = new BABYLON.Color3(1, 0.25, 0.2);
  comMarkerMaterial.diffuseColor = new BABYLON.Color3(1, 0.25, 0.2);
  comMarker.material = comMarkerMaterial;
  comMarker.isPickable = false;

  const submergedOverlayColor = new BABYLON.Color3(...CONFIG.visuals.submergedOverlayColor);

  const ui = createUI({
    reset: () => buoyancy.resetPose(),
    addCargo: () => {
      if (ship.addCargoBlock()) {
        buoyancy.onMassChanged();
      }
    },
    removeCargo: () => {
      if (ship.removeCargoBlock()) {
        buoyancy.onMassChanged();
      }
    },
    setSubmergedEnabled: (enabled) => ship.setSubmergedHighlightEnabled(enabled),
    setComEnabled: (enabled) => {
      comMarker.setEnabled(enabled);
    }
  });

  const input = setupInputHandlers({
    reset: () => buoyancy.resetPose(),
    addCargo: () => {
      if (ship.addCargoBlock()) {
        buoyancy.onMassChanged();
      }
    },
    removeCargo: () => {
      if (ship.removeCargoBlock()) {
        buoyancy.onMassChanged();
      }
    },
    toggleSubmerged: () => ui.toggleSubmergedCheckbox(),
    toggleCom: () => ui.toggleComCheckbox()
  });

  scene.onBeforeRenderObservable.add(() => {
    const dt = engine.getDeltaTime() / 1000;
    buoyancy.update(dt);
    ship.updateVoxelDebugVisuals(submergedOverlayColor);

    comMarker.position.copyFrom(ship.root.position);

    ui.updateStats({
      shipStats: ship.getStats(),
      buoyancyMetrics: buoyancy.getMetrics(),
      waterLevel: water.waterY
    });
  });

  scene.onDisposeObservable.add(() => {
    input.dispose();
  });

  return { scene };
}
