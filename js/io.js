// Import/Export

import { state, saveState } from "./state.js";
import { updateCanvasBounds } from "./canvas.js";
import { renderAllBoxes } from "./box.js";
import { renderAllConnections } from "./connections.js";

let connectionsSvg, nameInput;

const initIO = (elements) => {
  connectionsSvg = elements.connectionsSvg;
  nameInput = elements.nameInput;
};

// Clear canvas
const clearCanvas = () => {
  document.querySelectorAll(".box").forEach((el) => el.remove());
  connectionsSvg.innerHTML = "";
};

// Render all content
const renderAll = () => {
  nameInput.value = state.name;
  renderAllBoxes();
  renderAllConnections();
  updateCanvasBounds();
};

// Export to JSON file
const exportState = () => {
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${state.name || "storyboard"}.json`;
  a.click();

  URL.revokeObjectURL(url);
};

// Import from JSON file
const importState = (file) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);

      if (!Array.isArray(imported.boxes) || !Array.isArray(imported.connections)) {
        alert("Invalid storyboard file: missing boxes or connections array");
        return;
      }

      clearCanvas();

      state.name = imported.name || "Imported Storyboard";
      state.boxes = imported.boxes;
      state.connections = imported.connections;

      renderAll();
      saveState();
    } catch (err) {
      alert("Failed to parse file: " + err.message);
    }
  };
  reader.readAsText(file);
};

export { initIO, clearCanvas, renderAll, exportState, importState };
