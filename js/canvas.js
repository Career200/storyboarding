// Canvas Management

import { state } from "./state.js";

const CANVAS_PADDING = 500;
const SCROLL_THRESHOLD = 100;

let canvasContainer, canvas, connectionsSvg, backToOriginBtn;

// Drag-to-scroll state
let canvasDrag = {
  active: false,
  startX: 0,
  startY: 0,
  scrollLeft: 0,
  scrollTop: 0
};

const initCanvas = (elements) => {
  canvasContainer = elements.canvasContainer;
  canvas = elements.canvas;
  connectionsSvg = elements.connectionsSvg;
  backToOriginBtn = elements.backToOriginBtn;

  setupDragScroll();
  setupBackToOrigin();
};

// Update canvas size to fit content
const updateCanvasBounds = () => {
  if (state.boxes.length === 0) {
    canvas.style.width = "";
    canvas.style.height = "";
    connectionsSvg.setAttribute("width", "100%");
    connectionsSvg.setAttribute("height", "100%");
    return;
  }

  let maxX = 0, maxY = 0;
  state.boxes.forEach((box) => {
    maxX = Math.max(maxX, box.x + box.width);
    maxY = Math.max(maxY, box.y + box.height);
  });

  const width = maxX + CANVAS_PADDING;
  const height = maxY + CANVAS_PADDING;

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  connectionsSvg.setAttribute("width", width);
  connectionsSvg.setAttribute("height", height);
};

// Drag-to-scroll setup
const setupDragScroll = () => {
  canvasContainer.addEventListener("pointerdown", (e) => {
    const isMiddleMouse = e.button === 1;
    const isEmptyArea =
      e.target === canvas ||
      e.target === canvasContainer ||
      e.target.classList.contains("canvas-inner") ||
      e.target.classList.contains("canvas-hint");

    if (!isMiddleMouse && !isEmptyArea) return;
    if (e.target.closest(".box, .connection-popover, .back-to-origin, .fab-add-box")) return;
    if (e.button === 2) return; // Don't intercept right-click

    e.preventDefault(); // Prevent default touch scrolling
    canvasDrag.active = true;
    canvasDrag.startX = e.clientX;
    canvasDrag.startY = e.clientY;
    canvasDrag.scrollLeft = canvasContainer.scrollLeft;
    canvasDrag.scrollTop = canvasContainer.scrollTop;

    canvasContainer.classList.add("dragging-canvas");
    canvasContainer.setPointerCapture(e.pointerId);
  });

  canvasContainer.addEventListener("pointermove", (e) => {
    if (!canvasDrag.active) return;
    canvasContainer.scrollLeft = canvasDrag.scrollLeft - (e.clientX - canvasDrag.startX);
    canvasContainer.scrollTop = canvasDrag.scrollTop - (e.clientY - canvasDrag.startY);
  });

  const endDrag = () => {
    if (canvasDrag.active) {
      canvasDrag.active = false;
      canvasContainer.classList.remove("dragging-canvas");
    }
  };

  canvasContainer.addEventListener("pointerup", endDrag);
  canvasContainer.addEventListener("pointercancel", endDrag);
};

// Back-to-origin button
const setupBackToOrigin = () => {
  const updateVisibility = () => {
    const isScrolled =
      canvasContainer.scrollLeft > SCROLL_THRESHOLD ||
      canvasContainer.scrollTop > SCROLL_THRESHOLD;
    backToOriginBtn.classList.toggle("visible", isScrolled);
  };

  backToOriginBtn.addEventListener("click", () => {
    canvasContainer.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  });

  canvasContainer.addEventListener("scroll", updateVisibility);
  updateVisibility();
};

// Get position relative to canvas from mouse event
const getCanvasPosition = (e) => {
  const rect = canvasContainer.getBoundingClientRect();
  return {
    x: e.clientX - rect.left + canvasContainer.scrollLeft,
    y: e.clientY - rect.top + canvasContainer.scrollTop
  };
};

// Getters for elements (since they're initialized after import)
const getCanvasContainer = () => canvasContainer;
const getCanvas = () => canvas;
const getConnectionsSvg = () => connectionsSvg;

export {
  initCanvas,
  updateCanvasBounds,
  getCanvasPosition,
  getCanvasContainer,
  getCanvas,
  getConnectionsSvg
};
