import * as BABYLON from "@babylonjs/core";

function createDefaultHullLayout() {
  const voxels = [];

  // Bottom hull plate.
  for (let x = -4; x <= 4; x += 1) {
    for (let z = -2; z <= 2; z += 1) {
      voxels.push({ x, y: 0, z, structural: true, type: "structural" });
    }
  }

  // Side walls.
  for (let x = -4; x <= 4; x += 1) {
    for (let y = 1; y <= 2; y += 1) {
      voxels.push({ x, y, z: -2, structural: true, type: "structural" });
      voxels.push({ x, y, z: 2, structural: true, type: "structural" });
    }
  }

  // Bow and stern walls.
  for (let z = -1; z <= 1; z += 1) {
    voxels.push({ x: -4, y: 1, z, structural: true, type: "structural" });
    voxels.push({ x: 4, y: 1, z, structural: true, type: "structural" });
  }

  // Internal deck support beam.
  for (let x = -2; x <= 2; x += 1) {
    voxels.push({ x, y: 1, z: 0, structural: true, type: "structural" });
  }

  // Small cabin / raised deck.
  for (let x = -1; x <= 1; x += 1) {
    for (let z = -1; z <= 1; z += 1) {
      voxels.push({ x, y: 2, z, structural: false, type: "decorative" });
    }
  }

  return voxels;
}

function createVoxelKey(x, y, z) {
  return `${x},${y},${z}`;
}

export class VoxelShip {
  constructor(scene, config) {
    this.scene = scene;
    this.config = config;
    this.root = new BABYLON.TransformNode("shipRoot", scene);
    this.root.rotationQuaternion = BABYLON.Quaternion.Identity();

    this.structuralMaterial = new BABYLON.StandardMaterial("structuralVoxelMat", scene);
    this.structuralMaterial.diffuseColor = new BABYLON.Color3(...config.visuals.structuralColor);
    this.structuralMaterial.specularColor = new BABYLON.Color3(0.15, 0.15, 0.15);

    this.decorativeMaterial = new BABYLON.StandardMaterial("decorativeVoxelMat", scene);
    this.decorativeMaterial.diffuseColor = new BABYLON.Color3(...config.visuals.decorativeColor);
    this.decorativeMaterial.specularColor = new BABYLON.Color3(0.15, 0.15, 0.15);

    this.cargoSlots = [...config.ship.cargoSlots];
    this.activeCargoCount = 0;
    this.highlightSubmerged = true;

    this.baseLayout = createDefaultHullLayout();
    this.voxels = [];
    this.totalMass = 0;
    this.totalVolume = 0;
    this.centerOfMassLocal = BABYLON.Vector3.Zero();
    this.inertia = new BABYLON.Vector3(1, 1, 1);
    this.inverseInertia = new BABYLON.Vector3(1, 1, 1);

    this.rebuild();
    this.resetPose();
  }

  resetPose() {
    const spawn = this.config.ship.spawnPosition;
    this.root.position.copyFromFloats(spawn.x, spawn.y, spawn.z);
    this.root.rotationQuaternion = BABYLON.Quaternion.Identity();
  }

  addCargoBlock() {
    if (this.activeCargoCount >= this.cargoSlots.length) {
      return false;
    }

    this.activeCargoCount += 1;
    this.rebuild();
    return true;
  }

  removeCargoBlock() {
    if (this.activeCargoCount <= 0) {
      return false;
    }

    this.activeCargoCount -= 1;
    this.rebuild();
    return true;
  }

  rebuild() {
    const currentPosition = this.root.position.clone();
    const currentRotation = this.root.rotationQuaternion?.clone() ?? BABYLON.Quaternion.Identity();

    this.disposeVoxelMeshes();

    const layout = [...this.baseLayout];
    for (let index = 0; index < this.activeCargoCount; index += 1) {
      const slot = this.cargoSlots[index];
      layout.push({
        x: slot.x,
        y: slot.y,
        z: slot.z,
        structural: false,
        type: "cargo"
      });
    }

    const rawVoxels = [];
    const voxelSize = this.config.voxel.size;
    const volume = voxelSize ** 3;

    for (const entry of layout) {
      const density = this.getDensityForType(entry.type);
      const mass = density * volume;

      rawVoxels.push({
        key: createVoxelKey(entry.x, entry.y, entry.z),
        gridPosition: new BABYLON.Vector3(entry.x, entry.y, entry.z),
        rawLocalPosition: new BABYLON.Vector3(entry.x * voxelSize, entry.y * voxelSize, entry.z * voxelSize),
        localPosition: BABYLON.Vector3.Zero(),
        size: voxelSize,
        volume,
        density,
        mass,
        structural: entry.structural,
        type: entry.type,
        submergedRatio: 0,
        mesh: null
      });
    }

    this.computeMassProperties(rawVoxels);
    this.createVoxelMeshes(rawVoxels);

    this.voxels = rawVoxels;
    this.root.position.copyFrom(currentPosition);
    this.root.rotationQuaternion = currentRotation;
  }

  disposeVoxelMeshes() {
    for (const voxel of this.voxels) {
      if (voxel.mesh) {
        voxel.mesh.dispose();
      }
    }
  }

  getDensityForType(type) {
    if (type === "cargo") {
      return this.config.ship.cargoDensity;
    }

    if (type === "decorative") {
      return this.config.ship.decorativeDensity;
    }

    return this.config.ship.structuralDensity;
  }

  computeMassProperties(voxels) {
    let totalMass = 0;
    let totalVolume = 0;
    const weightedPositionSum = BABYLON.Vector3.Zero();

    for (const voxel of voxels) {
      totalMass += voxel.mass;
      totalVolume += voxel.volume;
      weightedPositionSum.addInPlace(voxel.rawLocalPosition.scale(voxel.mass));
    }

    const centerOfMass =
      totalMass > 0 ? weightedPositionSum.scale(1 / totalMass) : BABYLON.Vector3.Zero();

    const inertia = new BABYLON.Vector3(0, 0, 0);

    for (const voxel of voxels) {
      voxel.localPosition = voxel.rawLocalPosition.subtract(centerOfMass);

      const { x, y, z } = voxel.localPosition;
      inertia.x += voxel.mass * (y * y + z * z);
      inertia.y += voxel.mass * (x * x + z * z);
      inertia.z += voxel.mass * (x * x + y * y);
    }

    this.totalMass = totalMass;
    this.totalVolume = totalVolume;
    this.centerOfMassLocal = BABYLON.Vector3.Zero();
    this.inertia = new BABYLON.Vector3(
      Math.max(inertia.x, 0.001),
      Math.max(inertia.y, 0.001),
      Math.max(inertia.z, 0.001)
    );
    this.inverseInertia = new BABYLON.Vector3(
      1 / this.inertia.x,
      1 / this.inertia.y,
      1 / this.inertia.z
    );
  }

  createVoxelMeshes(voxels) {
    for (const voxel of voxels) {
      const mesh = BABYLON.MeshBuilder.CreateBox(
        `voxel_${voxel.key}`,
        { size: voxel.size * 0.96 },
        this.scene
      );

      mesh.parent = this.root;
      mesh.position.copyFrom(voxel.localPosition);
      mesh.material = voxel.type === "structural" ? this.structuralMaterial : this.decorativeMaterial;
      mesh.receiveShadows = false;
      mesh.renderOverlay = false;

      voxel.mesh = mesh;
    }
  }

  getWorldVoxelPosition(voxel) {
    const rotationMatrix = BABYLON.Matrix.FromQuaternion(this.root.rotationQuaternion);
    return BABYLON.Vector3.TransformCoordinates(voxel.localPosition, rotationMatrix).add(this.root.position);
  }

  getPointVelocity(worldPoint, linearVelocity, angularVelocity) {
    const offset = worldPoint.subtract(this.root.position);
    return linearVelocity.add(BABYLON.Vector3.Cross(angularVelocity, offset));
  }

  setSubmergedHighlightEnabled(enabled) {
    this.highlightSubmerged = enabled;

    if (!enabled) {
      for (const voxel of this.voxels) {
        voxel.mesh.renderOverlay = false;
      }
    }
  }

  updateVoxelDebugVisuals(overlayColor) {
    for (const voxel of this.voxels) {
      const shouldHighlight = this.highlightSubmerged && voxel.submergedRatio > 0.001;

      voxel.mesh.renderOverlay = shouldHighlight;
      if (shouldHighlight) {
        voxel.mesh.overlayColor = overlayColor;
        voxel.mesh.overlayAlpha = Math.min(0.85, 0.18 + voxel.submergedRatio * 0.45);
      }
    }
  }

  getStats() {
    return {
      totalMass: this.totalMass,
      totalVolume: this.totalVolume,
      voxelCount: this.voxels.length,
      centerOfMassWorld: this.root.position.clone(),
      cargoCount: this.activeCargoCount
    };
  }
}
