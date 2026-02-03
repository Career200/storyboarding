// Main Entry Point

import { state, loadState, saveState, clearState, toggleTheme } from "./state.js";
import { initCanvas, updateCanvasBounds, getCanvasPosition } from "./canvas.js";
import { initConnections, renderAllConnections } from "./connections.js";
import { initBox, createBox, renderAllBoxes } from "./box.js";
import { initIO, clearCanvas, exportState, importState } from "./io.js";

document.addEventListener("DOMContentLoaded", () => {
  // Get DOM elements
  const elements = {
    canvasContainer: document.getElementById("canvas-container"),
    canvas: document.getElementById("canvas"),
    connectionsSvg: document.getElementById("connections-svg"),
    nameInput: document.getElementById("storyboard-name"),
    clearAllBtn: document.getElementById("clear-all-btn"),
    importBtn: document.getElementById("import-btn"),
    exportBtn: document.getElementById("export-btn"),
    importInput: document.getElementById("import-input"),
    backToOriginBtn: document.getElementById("back-to-origin"),
    themeSwitch: document.getElementById("theme-switch"),
    fabAddBox: document.getElementById("fab-add-box"),
    menuToggle: document.getElementById("menu-toggle"),
    headerButtons: document.getElementById("header-buttons")
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

  // Clear all button
  elements.clearAllBtn.addEventListener("click", () => {
    if (state.boxes.length === 0) return;
    if (confirm("Clear all boxes and connections?")) {
      clearCanvas();
      clearState();
      elements.nameInput.value = state.name;
      updateCanvasBounds();
    }
  });

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

  // FAB button for adding boxes (touch devices)
  elements.fabAddBox.addEventListener("click", () => {
    // Create box at center of visible viewport
    const rect = elements.canvasContainer.getBoundingClientRect();
    const x = elements.canvasContainer.scrollLeft + rect.width / 2;
    const y = elements.canvasContainer.scrollTop + rect.height / 2;
    createBox(x, y, true);
  });

  // Mobile menu toggle
  const closeMenu = () => {
    elements.menuToggle.classList.remove("open");
    elements.headerButtons.classList.remove("open");
  };

  elements.menuToggle.addEventListener("click", () => {
    elements.menuToggle.classList.toggle("open");
    elements.headerButtons.classList.toggle("open");
  });

  // Close menu when clicking outside
  document.addEventListener("pointerdown", (e) => {
    if (!e.target.closest(".header-buttons, .menu-toggle")) {
      closeMenu();
    }
  });

  // Close menu after button click
  elements.headerButtons.addEventListener("click", (e) => {
    if (e.target.closest(".btn")) {
      closeMenu();
    }
  });
});
