// Box Management

import { state, getBox, addBox, removeBox, generateId, saveState } from "./state.js";
import { updateCanvasBounds } from "./canvas.js";
import { updateConnectionsForBox, removeConnectionElement, startDragConnection } from "./connections.js";

let canvas;

const initBox = (elements) => {
  canvas = elements.canvas;
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
  element.style.touchAction = "none"; // Prevent browser touch gestures

  element.onpointerdown = (e) => {
    if (e.target.hasAttribute("contenteditable")) return;
    if (e.target.closest(".box-controls, .box-resize-handle")) return;

    e.preventDefault();
    e.stopPropagation();
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

  // Resize handle
  const resizeHandle = document.createElement("div");
  resizeHandle.className = "box-resize-handle";
  resizeHandle.onpointerdown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    resizeHandle.setPointerCapture(e.pointerId);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = boxEl.offsetWidth;
    const startHeight = boxEl.offsetHeight;

    resizeHandle.onpointermove = (e) => {
      const newWidth = Math.max(200, startWidth + e.clientX - startX);
      const newHeight = Math.max(150, startHeight + e.clientY - startY);
      boxEl.style.width = `${newWidth}px`;
      boxEl.style.height = `${newHeight}px`;
      box.width = newWidth;
      box.height = newHeight;
      updateConnectionsForBox(box.id);
    };

    resizeHandle.onpointerup = () => {
      resizeHandle.onpointermove = null;
      updateCanvasBounds();
      saveState();
    };
  };

  boxEl.append(controls, title, text, handle, resizeHandle);
  makeDraggable(boxEl, box);

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
  deleteBox,
  renderBox,
  renderAllBoxes
};
