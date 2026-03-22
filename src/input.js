export function setupInputHandlers(actions) {
  const onKeyDown = (event) => {
    const key = event.key.toLowerCase();

    if (key === "r") {
      actions.reset();
    }

    if (key === "e") {
      actions.addCargo();
    }

    if (key === "q") {
      actions.removeCargo();
    }

    if (key === "h") {
      actions.toggleSubmerged();
    }

    if (key === "m") {
      actions.toggleCom();
    }
  };

  window.addEventListener("keydown", onKeyDown);

  return {
    dispose() {
      window.removeEventListener("keydown", onKeyDown);
    }
  };
}
