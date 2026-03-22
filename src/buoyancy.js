import * as BABYLON from "@babylonjs/core";

export class BuoyancyController {
  constructor(ship, water, config) {
    this.ship = ship;
    this.water = water;
    this.config = config;

    this.velocity = BABYLON.Vector3.Zero();
    this.angularVelocity = BABYLON.Vector3.Zero();

    this.lastStateLabel = "Settling";
    this.tiltRadians = { pitch: 0, roll: 0 };
  }

  resetMotion() {
    this.velocity.copyFromFloats(0, 0, 0);
    this.angularVelocity.copyFromFloats(0, 0, 0);
  }

  resetPose() {
    this.ship.resetPose();
    this.resetMotion();
  }

  onMassChanged() {
    this.resetMotion();
  }

  update(deltaTime) {
    const dt = Math.min(deltaTime, this.config.maxDeltaTime);
    if (dt <= 0) {
      return;
    }

    const gravityForce = new BABYLON.Vector3(
      0,
      -this.ship.totalMass * this.config.gravity,
      0
    );

    const totalForce = gravityForce.clone();
    const totalTorque = BABYLON.Vector3.Zero();

    for (const voxel of this.ship.voxels) {
      const worldPosition = this.ship.getWorldVoxelPosition(voxel);
      const submergedRatio = this.calculateSubmergedRatio(worldPosition.y, voxel.size);
      voxel.submergedRatio = submergedRatio;

      if (submergedRatio <= 0) {
        continue;
      }

      const submergedVolume = voxel.volume * submergedRatio;
      const buoyantMagnitude =
        this.waterDensity() * this.config.gravity * submergedVolume;
      const buoyancyForce = new BABYLON.Vector3(0, buoyantMagnitude, 0);

      const pointVelocity = this.ship.getPointVelocity(
        worldPosition,
        this.velocity,
        this.angularVelocity
      );
      const dragForce = pointVelocity.scale(-this.config.waterDrag * submergedRatio);

      const netLocalForce = buoyancyForce.add(dragForce);

      totalForce.addInPlace(netLocalForce);

      const leverArm = worldPosition.subtract(this.ship.root.position);
      totalTorque.addInPlace(BABYLON.Vector3.Cross(leverArm, netLocalForce));
    }

    const acceleration = totalForce.scale(1 / this.ship.totalMass);
    this.velocity.addInPlace(acceleration.scale(dt));
    this.velocity.scaleInPlace(Math.exp(-this.config.linearDamping * dt));
    this.ship.root.position.addInPlace(this.velocity.scale(dt));

    const angularAcceleration = this.calculateAngularAccelerationWorld(totalTorque);
    this.angularVelocity.addInPlace(angularAcceleration.scale(dt));
    this.angularVelocity.scaleInPlace(Math.exp(-this.config.angularDamping * dt));
    this.integrateRotation(dt);

    this.updateStateLabel();
  }

  waterDensity() {
    return this.ship.config.water.density;
  }

  calculateSubmergedRatio(worldY, size) {
    const halfSize = size * 0.5;
    const bottom = worldY - halfSize;
    const top = worldY + halfSize;
    const depth = this.water.waterY - bottom;

    if (depth <= 0) {
      return 0;
    }

    if (top <= this.water.waterY) {
      return 1;
    }

    return BABYLON.Scalar.Clamp(depth / size, 0, 1);
  }

  calculateAngularAccelerationWorld(worldTorque) {
    const inverseRotation = BABYLON.Quaternion.Conjugate(this.ship.root.rotationQuaternion);
    const torqueBody = BABYLON.Vector3.TransformCoordinates(
      worldTorque,
      BABYLON.Matrix.FromQuaternion(inverseRotation)
    );

    const angularAccelerationBody = new BABYLON.Vector3(
      torqueBody.x * this.ship.inverseInertia.x,
      torqueBody.y * this.ship.inverseInertia.y,
      torqueBody.z * this.ship.inverseInertia.z
    );

    return BABYLON.Vector3.TransformCoordinates(
      angularAccelerationBody,
      BABYLON.Matrix.FromQuaternion(this.ship.root.rotationQuaternion)
    );
  }

  integrateRotation(dt) {
    const angularSpeed = this.angularVelocity.length();
    if (angularSpeed < 1e-5) {
      return;
    }

    const axis = this.angularVelocity.clone().normalize();
    const deltaRotation = BABYLON.Quaternion.RotationAxis(axis, angularSpeed * dt);
    this.ship.root.rotationQuaternion = deltaRotation
      .multiply(this.ship.root.rotationQuaternion)
      .normalize();
  }

  updateStateLabel() {
    const euler = this.ship.root.rotationQuaternion.toEulerAngles();
    const pitch = euler.x;
    const roll = euler.z;
    const angularSpeed = this.angularVelocity.length();

    this.tiltRadians.pitch = pitch;
    this.tiltRadians.roll = roll;

    const absoluteTilt = Math.max(Math.abs(pitch), Math.abs(roll));

    if (absoluteTilt < 0.08 && angularSpeed < 0.08) {
      this.lastStateLabel = "Stable";
      return;
    }

    if (absoluteTilt < 0.22 && angularSpeed < 0.45) {
      this.lastStateLabel = "Settling";
      return;
    }

    this.lastStateLabel = "Tilting";
  }

  getMetrics() {
    return {
      stateLabel: this.lastStateLabel,
      pitchRadians: this.tiltRadians.pitch,
      rollRadians: this.tiltRadians.roll
    };
  }
}
