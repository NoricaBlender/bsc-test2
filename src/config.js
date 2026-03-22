export const CONFIG = {
  water: {
    level: 0,
    density: 1000
  },
  voxel: {
    size: 1
  },
  physics: {
    gravity: 9.81,
    linearDamping: 0.75,
    angularDamping: 1.1,
    waterDrag: 2.35,
    maxDeltaTime: 1 / 30
  },
  ship: {
    spawnPosition: { x: 0, y: 1.65, z: 0 },
    structuralDensity: 600,
    decorativeDensity: 180,
    cargoDensity: 900,
    cargoSlots: [
      { x: -1, y: 3, z: 0 },
      { x: 0, y: 3, z: 0 },
      { x: 1, y: 3, z: 0 }
    ]
  },
  visuals: {
    skyColor: [0.82, 0.91, 1.0, 1.0],
    waterColor: [0.16, 0.45, 0.85],
    structuralColor: [0.56, 0.4, 0.3],
    decorativeColor: [0.72, 0.72, 0.76],
    submergedOverlayColor: [0.16, 0.9, 1.0]
  }
};
