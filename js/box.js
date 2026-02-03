// Box Management

import { state, getBox, addBox, removeBox, generateId, saveState } from "./state.js";
import { updateCanvasBounds } from "./canvas.js";
import { updateConnectionsForBox, removeConnectionElement, startDragConnection } from "./connections.js";

let canvas, canvasContainer;

const initBox = (elements) => {
  canvas = elements.canvas;
  canvasContainer = elements.canvasContainer;
};

// Default box properties
const DEFAULT_BOX = {
  width: 200,
  height: 150,
  title: "",
  text: "",
  borderColor: "#3498db"
};

// Create a new box at position
const createBox = (x, y, centered = false) => {
  const box = {
    id: generateId("box"),
    x: centered ? x - DEFAULT_BOX.width / 2 : x,
    y: centered ? y - DEFAULT_BOX.height / 2 : y,
    ...DEFAULT_BOX
  };
  addBox(box);
  renderBox(box);
  updateCanvasBounds();
  return box;
};

// Create box in visible area
const createBoxInView = () => {
  const x = canvasContainer.scrollLeft + 100 + Math.random() * 200;
  const y = canvasContainer.scrollTop + 100 + Math.random() * 200;
  return createBox(x, y);
};

// Delete box and its connections
const deleteBox = (boxId) => {
  const connIds = state.connections
    .filter((c) => c.fromBox === boxId || c.toBox === boxId)
    .map((c) => c.id);

  removeBox(boxId);
  document.querySelector(`[data-id="${boxId}"]`)?.remove();
  connIds.forEach(removeConnectionElement);
  updateCanvasBounds();
};

// Make element draggable
const makeDraggable = (element, box) => {
  element.style.cursor = "grab";

  element.onpointerdown = (e) => {
    if (e.target.hasAttribute("contenteditable")) return;
    if (e.target.closest(".box-controls")) return;

    // Don't drag from resize handle area
    const rect = element.getBoundingClientRect();
    if (e.clientX > rect.right - 16 && e.clientY > rect.bottom - 16) return;

    element.setPointerCapture(e.pointerId);
    element.style.cursor = "grabbing";

    const startX = e.clientX - element.offsetLeft;
    const startY = e.clientY - element.offsetTop;

    element.onpointermove = (e) => {
      box.x = Math.max(0, e.clientX - startX);
      box.y = Math.max(0, e.clientY - startY);
      element.style.left = `${box.x}px`;
      element.style.top = `${box.y}px`;
      updateConnectionsForBox(box.id);
    };

    element.onpointerup = () => {
      element.style.cursor = "grab";
      element.onpointermove = null;
      updateCanvasBounds();
      saveState();
    };
  };
};

// Render a box element
const renderBox = (box) => {
  const boxEl = document.createElement("div");
  boxEl.className = "box";
  boxEl.dataset.id = box.id;
  Object.assign(boxEl.style, {
    left: `${box.x}px`,
    top: `${box.y}px`,
    width: `${box.width}px`,
    height: `${box.height}px`,
    borderColor: box.borderColor
  });

  // Controls
  const controls = document.createElement("div");
  controls.className = "box-controls";

  const colorInput = document.createElement("input");
  colorInput.type = "color";
  colorInput.className = "box-color";
  colorInput.value = box.borderColor;
  colorInput.onchange = () => {
    box.borderColor = colorInput.value;
    boxEl.style.borderColor = colorInput.value;
    saveState();
  };

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "box-delete";
  deleteBtn.textContent = "x";
  deleteBtn.onclick = (e) => {
    e.stopPropagation();
    deleteBox(box.id);
  };

  controls.append(colorInput, deleteBtn);

  // Title
  const title = document.createElement("div");
  title.className = "box-title";
  title.contentEditable = true;
  title.textContent = box.title || "";
  title.setAttribute("placeholder", "Title");
  title.onblur = () => {
    box.title = title.textContent;
    title.scrollLeft = 0;
    saveState();
  };

  // Text
  const text = document.createElement("div");
  text.className = "box-text";
  text.contentEditable = true;
  text.textContent = box.text;
  text.setAttribute("placeholder", "Enter text...");
  text.onblur = () => {
    box.text = text.textContent;
    saveState();
  };

  // Connection handle
  const handle = document.createElement("div");
  handle.className = "box-connect-handle";
  handle.title = "Drag to connect";
  handle.onpointerdown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    startDragConnection(box.id);
  };

  boxEl.append(controls, title, text, handle);
  makeDraggable(boxEl, box);

  // Track resize
  const resizeObserver = new ResizeObserver(() => {
    const newW = boxEl.offsetWidth;
    const newH = boxEl.offsetHeight;
    if (Math.abs(box.width - newW) > 1 || Math.abs(box.height - newH) > 1) {
      box.width = newW;
      box.height = newH;
      updateConnectionsForBox(box.id);
      updateCanvasBounds();
      saveState();
    }
  });
  resizeObserver.observe(boxEl);

  canvas.appendChild(boxEl);
  return boxEl;
};

// Render all boxes
const renderAllBoxes = () => {
  state.boxes.forEach(renderBox);
};

export {
  initBox,
  createBox,
  createBoxInView,
  deleteBox,
  renderBox,
  renderAllBoxes
};
