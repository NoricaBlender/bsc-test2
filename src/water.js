import * as BABYLON from "@babylonjs/core";

export function createWater(scene, config) {
  const water = BABYLON.MeshBuilder.CreateGround(
    "waterPlane",
    { width: 300, height: 300, subdivisions: 2 },
    scene
  );

  water.position.y = config.water.level;

  const material = new BABYLON.StandardMaterial("waterMaterial", scene);
  material.diffuseColor = new BABYLON.Color3(...config.visuals.waterColor);
  material.alpha = 0.55;
  material.specularColor = new BABYLON.Color3(0.6, 0.7, 0.9);
  water.material = material;

  return {
    mesh: water,
    waterY: config.water.level
  };
}
