// Main Entry Point

import { state, loadState, saveState, toggleTheme } from "./state.js";
import { initCanvas, updateCanvasBounds, getCanvasPosition } from "./canvas.js";
import { initConnections, renderAllConnections } from "./connections.js";
import { initBox, createBox, createBoxInView, renderAllBoxes } from "./box.js";
import { initIO, exportState, importState } from "./io.js";

document.addEventListener("DOMContentLoaded", () => {
  // Get DOM elements
  const elements = {
    canvasContainer: document.getElementById("canvas-container"),
    canvas: document.getElementById("canvas"),
    connectionsSvg: document.getElementById("connections-svg"),
    nameInput: document.getElementById("storyboard-name"),
    addBoxBtn: document.getElementById("add-box-btn"),
    importBtn: document.getElementById("import-btn"),
    exportBtn: document.getElementById("export-btn"),
    importInput: document.getElementById("import-input"),
    backToOriginBtn: document.getElementById("back-to-origin"),
    themeSwitch: document.getElementById("theme-switch")
  };

  // Initialize modules
  initCanvas(elements);
  initConnections(elements);
  initBox(elements);
  initIO(elements);

  // Load state and render
  loadState();
  elements.nameInput.value = state.name;
  renderAllBoxes();
  renderAllConnections();
  updateCanvasBounds();

  // Storyboard name
  elements.nameInput.addEventListener("input", () => {
    state.name = elements.nameInput.value;
    saveState();
  });

  // Add box button
  elements.addBoxBtn.addEventListener("click", createBoxInView);

  // Right-click to add box
  elements.canvasContainer.addEventListener("contextmenu", (e) => {
    if (e.target.closest(".box, .connection-popover")) return;
    e.preventDefault();
    const pos = getCanvasPosition(e);
    createBox(pos.x, pos.y, true);
  });

  // Import/Export
  elements.exportBtn.addEventListener("click", exportState);
  elements.importBtn.addEventListener("click", () => elements.importInput.click());
  elements.importInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      importState(file);
      e.target.value = "";
    }
  });

  // Theme toggle
  elements.themeSwitch.addEventListener("click", toggleTheme);
});
