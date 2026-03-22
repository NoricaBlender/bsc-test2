function formatNumber(value, digits = 2) {
  return Number(value).toFixed(digits);
}

function formatVector(vector, digits = 2) {
  return `(${formatNumber(vector.x, digits)}, ${formatNumber(vector.y, digits)}, ${formatNumber(vector.z, digits)})`;
}

export function createUI(actions) {
  const elements = {
    resetShipBtn: document.getElementById("resetShipBtn"),
    addCargoBtn: document.getElementById("addCargoBtn"),
    removeCargoBtn: document.getElementById("removeCargoBtn"),
    showSubmergedToggle: document.getElementById("showSubmergedToggle"),
    showComToggle: document.getElementById("showComToggle"),
    massValue: document.getElementById("massValue"),
    voxelCountValue: document.getElementById("voxelCountValue"),
    waterLevelValue: document.getElementById("waterLevelValue"),
    comValue: document.getElementById("comValue"),
    stabilityValue: document.getElementById("stabilityValue"),
    cargoValue: document.getElementById("cargoValue")
  };

  elements.resetShipBtn.addEventListener("click", actions.reset);
  elements.addCargoBtn.addEventListener("click", actions.addCargo);
  elements.removeCargoBtn.addEventListener("click", actions.removeCargo);
  elements.showSubmergedToggle.addEventListener("change", () => {
    actions.setSubmergedEnabled(elements.showSubmergedToggle.checked);
  });
  elements.showComToggle.addEventListener("change", () => {
    actions.setComEnabled(elements.showComToggle.checked);
  });

  return {
    get showSubmergedEnabled() {
      return elements.showSubmergedToggle.checked;
    },

    get showComEnabled() {
      return elements.showComToggle.checked;
    },

    toggleSubmergedCheckbox() {
      elements.showSubmergedToggle.checked = !elements.showSubmergedToggle.checked;
      actions.setSubmergedEnabled(elements.showSubmergedToggle.checked);
    },

    toggleComCheckbox() {
      elements.showComToggle.checked = !elements.showComToggle.checked;
      actions.setComEnabled(elements.showComToggle.checked);
    },

    updateStats({ shipStats, buoyancyMetrics, waterLevel }) {
      elements.massValue.textContent = `${formatNumber(shipStats.totalMass, 0)} kg`;
      elements.voxelCountValue.textContent = `${shipStats.voxelCount}`;
      elements.waterLevelValue.textContent = `${formatNumber(waterLevel, 2)} m`;
      elements.comValue.textContent = formatVector(shipStats.centerOfMassWorld);
      elements.stabilityValue.textContent = buoyancyMetrics.stateLabel;
      elements.cargoValue.textContent = `${shipStats.cargoCount}`;
    }
  };
}
