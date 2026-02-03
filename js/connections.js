// Connection Management

import { state, getBox, addConnection, removeConnection, generateId, saveState, isTouchDevice } from "./state.js";
import { getCanvasPosition } from "./canvas.js";

let connectionsSvg, canvas, canvasContainer;
let activePopover = null;

// Drag-to-connect state
let dragConnection = {
  active: false,
  fromBoxId: null,
  tempLine: null
};

const initConnections = (elements) => {
  connectionsSvg = elements.connectionsSvg;
  canvas = elements.canvas;
  canvasContainer = elements.canvasContainer;

  document.addEventListener("pointermove", handleDragMove);
  document.addEventListener("pointerup", handleDragEnd);
};

// SVG namespace helper
const createSvgElement = (tag) =>
  document.createElementNS("http://www.w3.org/2000/svg", tag);

// Get box bottom center (connection handle position)
const getBoxBottomCenter = (box) => ({
  x: box.x + box.width / 2,
  y: box.y + box.height
});

// Update connection path
const updateConnectionPath = (conn) => {
  const fromBox = getBox(conn.fromBox);
  const toBox = getBox(conn.toBox);
  if (!fromBox || !toBox) return;

  const path = document.getElementById(`conn-${conn.id}`);
  if (!path) return;

  const x1 = fromBox.x + fromBox.width / 2;
  const y1 = fromBox.y + fromBox.height / 2;
  const x2 = toBox.x + toBox.width / 2;
  const y2 = toBox.y + toBox.height / 2;
  const d = `M ${x1} ${y1} L ${x2} ${y2}`;

  path.setAttribute("d", d);

  const innerPath = document.getElementById(`conn-${conn.id}-inner`);
  if (innerPath) innerPath.setAttribute("d", d);
};

// Update all connections for a box
const updateConnectionsForBox = (boxId) => {
  state.connections
    .filter((c) => c.fromBox === boxId || c.toBox === boxId)
    .forEach(updateConnectionPath);
};

// Apply style to path
const applyConnectionStyle = (path, style) => {
  path.removeAttribute("stroke-dasharray");
  const touch = isTouchDevice();

  switch (style) {
    case "dashed":
      path.setAttribute("stroke-dasharray", touch ? "12,6" : "8,4");
      path.setAttribute("stroke-width", touch ? "4" : "2");
      break;
    case "double":
      path.setAttribute("stroke-width", touch ? "10" : "6");
      path.setAttribute("stroke-dasharray", "0");
      path.style.strokeLinecap = "butt";
      break;
    default:
      path.setAttribute("stroke-width", touch ? "4" : "2");
  }
};

// Create inner path for double style
const createInnerPath = (conn, d) => {
  const innerPath = createSvgElement("path");
  innerPath.id = `conn-${conn.id}-inner`;
  innerPath.setAttribute("stroke", "var(--bg-tertiary)");
  innerPath.setAttribute("stroke-width", isTouchDevice() ? "6" : "3");
  innerPath.setAttribute("fill", "none");
  innerPath.setAttribute("d", d);
  innerPath.style.pointerEvents = "none";
  connectionsSvg.appendChild(innerPath);
  return innerPath;
};

// Render connection
const renderConnection = (conn) => {
  const path = createSvgElement("path");
  path.id = `conn-${conn.id}`;
  path.setAttribute("stroke", conn.color);
  path.setAttribute("fill", "none");
  applyConnectionStyle(path, conn.style || "solid");

  if (conn.style === "double") {
    createInnerPath(conn, "");
  }

  path.onclick = (e) => {
    e.stopPropagation();
    const pos = getCanvasPosition(e);
    showPopover(conn, path, pos.x, pos.y);
  };

  connectionsSvg.appendChild(path);
  updateConnectionPath(conn);
};

// Render all connections
const renderAllConnections = () => {
  state.connections.forEach(renderConnection);
};

// Remove connection from DOM
const removeConnectionElement = (id) => {
  document.getElementById(`conn-${id}`)?.remove();
  document.getElementById(`conn-${id}-inner`)?.remove();
};

// Popover management
const closePopover = () => {
  if (activePopover) {
    activePopover.remove();
    activePopover = null;
    document.removeEventListener("pointerdown", handleOutsideClick);
  }
};

const handleOutsideClick = (e) => {
  if (activePopover && !activePopover.contains(e.target)) {
    closePopover();
  }
};

const showPopover = (conn, path, x, y) => {
  closePopover();

  const popover = document.createElement("div");
  popover.className = "connection-popover";
  popover.style.left = `${x}px`;
  popover.style.top = `${y}px`;

  // Color picker
  const colorRow = document.createElement("div");
  colorRow.className = "popover-row";
  colorRow.innerHTML = `<span class="popover-label">Color</span>`;

  const colorInput = document.createElement("input");
  colorInput.type = "color";
  colorInput.className = "popover-color";
  colorInput.value = conn.color;
  colorInput.oninput = () => {
    conn.color = colorInput.value;
    path.setAttribute("stroke", colorInput.value);
    saveState();
  };
  colorRow.appendChild(colorInput);

  // Style selector
  const styleRow = document.createElement("div");
  styleRow.className = "popover-row";
  styleRow.innerHTML = `<span class="popover-label">Style</span>`;

  const styleSelect = document.createElement("select");
  styleSelect.className = "popover-select";
  styleSelect.innerHTML = `
    <option value="solid">Solid</option>
    <option value="dashed">Dashed</option>
    <option value="double">Double</option>
  `;
  styleSelect.value = conn.style || "solid";
  styleSelect.onchange = () => {
    conn.style = styleSelect.value;
    document.getElementById(`conn-${conn.id}-inner`)?.remove();
    applyConnectionStyle(path, conn.style);
    if (conn.style === "double") {
      createInnerPath(conn, path.getAttribute("d"));
    }
    saveState();
  };
  styleRow.appendChild(styleSelect);

  // Delete button
  const deleteBtn = document.createElement("button");
  deleteBtn.className = "popover-delete";
  deleteBtn.textContent = "Delete connection";
  deleteBtn.onclick = () => {
    removeConnection(conn.id);
    removeConnectionElement(conn.id);
    closePopover();
  };

  popover.append(colorRow, styleRow, deleteBtn);
  canvas.appendChild(popover);
  activePopover = popover;

  setTimeout(() => document.addEventListener("pointerdown", handleOutsideClick), 0);
};

// Drag-to-connect
const startDragConnection = (boxId) => {
  const box = getBox(boxId);
  if (!box) return;

  dragConnection.active = true;
  dragConnection.fromBoxId = boxId;

  const touch = isTouchDevice();
  const line = createSvgElement("path");
  line.setAttribute("stroke", "#2c3e50");
  line.setAttribute("stroke-width", touch ? "4" : "2");
  line.setAttribute("stroke-dasharray", touch ? "8,8" : "5,5");
  line.setAttribute("fill", "none");
  line.classList.add("temp-connection");
  connectionsSvg.appendChild(line);
  dragConnection.tempLine = line;

  const start = getBoxBottomCenter(box);
  line.setAttribute("d", `M ${start.x} ${start.y} L ${start.x} ${start.y}`);

  document.querySelector(`[data-id="${boxId}"]`)?.classList.add("connecting-source");
};

const handleDragMove = (e) => {
  if (!dragConnection.active) return;

  const box = getBox(dragConnection.fromBoxId);
  if (!box) return;

  const start = getBoxBottomCenter(box);
  const end = getCanvasPosition(e);
  dragConnection.tempLine.setAttribute("d", `M ${start.x} ${start.y} L ${end.x} ${end.y}`);

  // Highlight target
  document.querySelectorAll(".box.connect-target").forEach((el) => el.classList.remove("connect-target"));
  const targetId = findBoxAtPoint(e.clientX, e.clientY, dragConnection.fromBoxId);
  if (targetId) {
    document.querySelector(`[data-id="${targetId}"]`)?.classList.add("connect-target");
  }
};

const handleDragEnd = (e) => {
  if (!dragConnection.active) return;

  dragConnection.tempLine?.remove();
  document.querySelectorAll(".box.connecting-source, .box.connect-target")
    .forEach((el) => el.classList.remove("connecting-source", "connect-target"));

  const targetId = findBoxAtPoint(e.clientX, e.clientY, dragConnection.fromBoxId);
  if (targetId && dragConnection.fromBoxId) {
    const exists = state.connections.some(
      (c) =>
        (c.fromBox === dragConnection.fromBoxId && c.toBox === targetId) ||
        (c.fromBox === targetId && c.toBox === dragConnection.fromBoxId)
    );

    if (!exists) {
      const conn = {
        id: generateId("conn"),
        fromBox: dragConnection.fromBoxId,
        toBox: targetId,
        color: "#2c3e50",
        style: "solid"
      };
      addConnection(conn);
      renderConnection(conn);
    }
  }

  dragConnection.active = false;
  dragConnection.fromBoxId = null;
  dragConnection.tempLine = null;
};

// Find box at screen coordinates
const findBoxAtPoint = (x, y, excludeId) => {
  for (const boxEl of document.querySelectorAll(".box")) {
    if (boxEl.dataset.id === excludeId) continue;
    const rect = boxEl.getBoundingClientRect();
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      return boxEl.dataset.id;
    }
  }
  return null;
};

export {
  initConnections,
  renderConnection,
  renderAllConnections,
  updateConnectionsForBox,
  removeConnectionElement,
  startDragConnection
};
