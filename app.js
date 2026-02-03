// Storyboard App - State Management

const STORAGE_KEY = 'storyboard-state';
const THEME_KEY = 'storyboard-theme';

// Theme Management (initialize immediately to prevent flash)
const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(THEME_KEY, next);
}

let state = {
  name: 'Untitled Storyboard',
  boxes: [],
  connections: []
};

// ID Generation
const generateId = (prefix = 'item') => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// State Operations
const getBox = (id) => state.boxes.find(b => b.id === id);
const getConnection = (id) => state.connections.find(c => c.id === id);

const addBox = (box) => {
  state.boxes.push(box);
  saveState();
  return box;
};

const removeBox = (id) => {
  state.boxes = state.boxes.filter(b => b.id !== id);
  state.connections = state.connections.filter(c => c.fromBox !== id && c.toBox !== id);
  saveState();
};

const addConnection = (conn) => {
  state.connections.push(conn);
  saveState();
  return conn;
};

const removeConnection = (id) => {
  state.connections = state.connections.filter(c => c.id !== id);
  saveState();
};

// Persistence
const saveState = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const loadState = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      state = JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved state, using default');
    }
  }
  return state;
};

// DOM Elements
const canvas = document.getElementById('canvas');
const nameInput = document.getElementById('storyboard-name');
const addBoxBtn = document.getElementById('add-box-btn');
const connectionsSvg = document.getElementById('connections-svg');
const importBtn = document.getElementById('import-btn');
const exportBtn = document.getElementById('export-btn');
const importInput = document.getElementById('import-input');

// Drag-to-connect state
let dragConnection = {
  active: false,
  fromBoxId: null,
  tempLine: null
};

// Update SVG path for a connection
function updateConnectionPath(conn) {
  const fromBox = getBox(conn.fromBox);
  const toBox = getBox(conn.toBox);
  if (!fromBox || !toBox) return;

  const path = document.getElementById(`conn-${conn.id}`);
  if (!path) return;

  // Calculate center points
  const x1 = fromBox.x + fromBox.width / 2;
  const y1 = fromBox.y + fromBox.height / 2;
  const x2 = toBox.x + toBox.width / 2;
  const y2 = toBox.y + toBox.height / 2;

  path.setAttribute('d', `M ${x1} ${y1} L ${x2} ${y2}`);
}

// Connection popover management
let activePopover = null;

function closeConnectionPopover() {
  if (activePopover) {
    activePopover.remove();
    activePopover = null;
  }
}

function showConnectionPopover(conn, path, x, y) {
  // Close any existing popover
  closeConnectionPopover();

  const popover = document.createElement('div');
  popover.className = 'connection-popover';
  popover.style.left = `${x}px`;
  popover.style.top = `${y}px`;

  // Color picker
  const colorWrapper = document.createElement('div');
  colorWrapper.className = 'popover-row';

  const colorLabel = document.createElement('span');
  colorLabel.textContent = 'Color';
  colorLabel.className = 'popover-label';

  const colorInput = document.createElement('input');
  colorInput.type = 'color';
  colorInput.className = 'popover-color';
  colorInput.value = conn.color;
  colorInput.oninput = () => {
    conn.color = colorInput.value;
    path.setAttribute('stroke', colorInput.value);
    saveState();
  };

  colorWrapper.appendChild(colorLabel);
  colorWrapper.appendChild(colorInput);

  // Delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'popover-delete';
  deleteBtn.textContent = 'Delete connection';
  deleteBtn.onclick = () => {
    removeConnection(conn.id);
    path.remove();
    closeConnectionPopover();
  };

  popover.appendChild(colorWrapper);
  popover.appendChild(deleteBtn);

  // Close when clicking outside
  setTimeout(() => {
    document.addEventListener('pointerdown', handlePopoverOutsideClick);
  }, 0);

  canvas.appendChild(popover);
  activePopover = popover;
}

function handlePopoverOutsideClick(e) {
  if (activePopover && !activePopover.contains(e.target)) {
    closeConnectionPopover();
    document.removeEventListener('pointerdown', handlePopoverOutsideClick);
  }
}

// Render a connection as SVG path
function renderConnection(conn) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.id = `conn-${conn.id}`;
  path.setAttribute('stroke', conn.color);
  path.setAttribute('stroke-width', '2');
  path.setAttribute('fill', 'none');

  // Click to show popover
  path.onclick = (e) => {
    e.stopPropagation();
    const canvasRect = canvas.getBoundingClientRect();
    const x = e.clientX - canvasRect.left + canvas.scrollLeft;
    const y = e.clientY - canvasRect.top + canvas.scrollTop;
    showConnectionPopover(conn, path, x, y);
  };

  connectionsSvg.appendChild(path);
  updateConnectionPath(conn);
}

// Update all connections for a box
function updateConnectionsForBox(boxId) {
  state.connections
    .filter(c => c.fromBox === boxId || c.toBox === boxId)
    .forEach(c => updateConnectionPath(c));
}

// Get box center coordinates
function getBoxCenter(box) {
  return {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2
  };
}

// Get box bottom center (where connection handle is)
function getBoxBottomCenter(box) {
  return {
    x: box.x + box.width / 2,
    y: box.y + box.height
  };
}

// Create temporary line for drag-to-connect
function createTempLine() {
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  line.setAttribute('stroke', '#2c3e50');
  line.setAttribute('stroke-width', '2');
  line.setAttribute('stroke-dasharray', '5,5');
  line.setAttribute('fill', 'none');
  line.classList.add('temp-connection');
  connectionsSvg.appendChild(line);
  return line;
}

// Update temporary line position
function updateTempLine(fromX, fromY, toX, toY) {
  if (dragConnection.tempLine) {
    dragConnection.tempLine.setAttribute('d', `M ${fromX} ${fromY} L ${toX} ${toY}`);
  }
}

// Find box element at coordinates
function findBoxAtPoint(x, y, excludeId) {
  const boxes = document.querySelectorAll('.box');
  for (const boxEl of boxes) {
    const boxId = boxEl.dataset.id;
    if (boxId === excludeId) continue;

    const rect = boxEl.getBoundingClientRect();
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      return boxId;
    }
  }
  return null;
}

// Start drag-to-connect
function startDragConnection(boxId, e) {
  const box = getBox(boxId);
  if (!box) return;

  dragConnection.active = true;
  dragConnection.fromBoxId = boxId;
  dragConnection.tempLine = createTempLine();

  const start = getBoxBottomCenter(box);
  updateTempLine(start.x, start.y, start.x, start.y);

  // Add highlight to source box
  const boxEl = document.querySelector(`[data-id="${boxId}"]`);
  if (boxEl) boxEl.classList.add('connecting-source');
}

// Handle drag-to-connect move
function handleDragConnectionMove(e) {
  if (!dragConnection.active) return;

  const box = getBox(dragConnection.fromBoxId);
  if (!box) return;

  const start = getBoxBottomCenter(box);
  const canvasRect = canvas.getBoundingClientRect();
  const endX = e.clientX - canvasRect.left + canvas.scrollLeft;
  const endY = e.clientY - canvasRect.top + canvas.scrollTop;

  updateTempLine(start.x, start.y, endX, endY);

  // Highlight target box if hovering
  const targetId = findBoxAtPoint(e.clientX, e.clientY, dragConnection.fromBoxId);
  document.querySelectorAll('.box.connect-target').forEach(el => el.classList.remove('connect-target'));
  if (targetId) {
    const targetEl = document.querySelector(`[data-id="${targetId}"]`);
    if (targetEl) targetEl.classList.add('connect-target');
  }
}

// End drag-to-connect
function endDragConnection(e) {
  if (!dragConnection.active) return;

  // Remove temp line
  if (dragConnection.tempLine) {
    dragConnection.tempLine.remove();
  }

  // Remove highlights
  document.querySelectorAll('.box.connecting-source, .box.connect-target').forEach(el => {
    el.classList.remove('connecting-source', 'connect-target');
  });

  // Check if dropped on a valid target
  const targetId = findBoxAtPoint(e.clientX, e.clientY, dragConnection.fromBoxId);
  if (targetId && dragConnection.fromBoxId) {
    // Check if connection already exists
    const exists = state.connections.some(c =>
      (c.fromBox === dragConnection.fromBoxId && c.toBox === targetId) ||
      (c.fromBox === targetId && c.toBox === dragConnection.fromBoxId)
    );

    if (!exists) {
      const conn = {
        id: generateId('conn'),
        fromBox: dragConnection.fromBoxId,
        toBox: targetId,
        color: '#2c3e50'
      };
      addConnection(conn);
      renderConnection(conn);
    }
  }

  // Reset state
  dragConnection.active = false;
  dragConnection.fromBoxId = null;
  dragConnection.tempLine = null;
}

// Global listeners for drag-to-connect
document.addEventListener('pointermove', handleDragConnectionMove);
document.addEventListener('pointerup', endDragConnection);

// Render all connections from state
function renderAllConnections() {
  state.connections.forEach(conn => renderConnection(conn));
}

// Make element draggable using Pointer Events API
function makeDraggable(element, box) {
  element.style.cursor = 'grab';

  element.onpointerdown = (e) => {
    // Don't drag when clicking on editable text or controls
    if (e.target.hasAttribute('contenteditable')) return;
    if (e.target.closest('.box-controls')) return;

    // Don't drag when clicking on resize handle (bottom-right 16x16 area)
    const rect = element.getBoundingClientRect();
    const isInResizeArea = (e.clientX > rect.right - 16) && (e.clientY > rect.bottom - 16);
    if (isInResizeArea) return;

    element.setPointerCapture(e.pointerId);
    element.style.cursor = 'grabbing';

    const startX = e.clientX - element.offsetLeft;
    const startY = e.clientY - element.offsetTop;

    element.onpointermove = (e) => {
      const newX = Math.max(0, e.clientX - startX);
      const newY = Math.max(0, e.clientY - startY);
      element.style.left = `${newX}px`;
      element.style.top = `${newY}px`;
      // Update state
      box.x = newX;
      box.y = newY;
      // Update connections
      updateConnectionsForBox(box.id);
    };

    element.onpointerup = () => {
      element.style.cursor = 'grab';
      element.onpointermove = null;
      saveState();
    };
  };
}

// Delete a box and its connections from DOM and state
function deleteBox(boxId) {
  // Get connection IDs before removing from state
  const connIds = state.connections
    .filter(c => c.fromBox === boxId || c.toBox === boxId)
    .map(c => c.id);

  // Remove from state
  removeBox(boxId);

  // Remove box element
  const boxEl = document.querySelector(`[data-id="${boxId}"]`);
  if (boxEl) boxEl.remove();

  // Remove connection elements
  connIds.forEach(id => {
    const pathEl = document.getElementById(`conn-${id}`);
    if (pathEl) pathEl.remove();
  });
}

// Render a box element
function renderBox(box) {
  const boxEl = document.createElement('div');
  boxEl.className = 'box';
  boxEl.dataset.id = box.id;
  boxEl.style.left = `${box.x}px`;
  boxEl.style.top = `${box.y}px`;
  boxEl.style.width = `${box.width}px`;
  boxEl.style.height = `${box.height}px`;
  boxEl.style.borderColor = box.borderColor;

  // Controls container (delete button + color picker)
  const controlsEl = document.createElement('div');
  controlsEl.className = 'box-controls';

  // Color picker
  const colorInput = document.createElement('input');
  colorInput.type = 'color';
  colorInput.className = 'box-color';
  colorInput.value = box.borderColor;
  colorInput.onchange = () => {
    box.borderColor = colorInput.value;
    boxEl.style.borderColor = colorInput.value;
    saveState();
  };

  // Delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'box-delete';
  deleteBtn.textContent = 'x';
  deleteBtn.onclick = (e) => {
    e.stopPropagation();
    deleteBox(box.id);
  };

  controlsEl.appendChild(colorInput);
  controlsEl.appendChild(deleteBtn);

  // Title (optional)
  const titleEl = document.createElement('div');
  titleEl.className = 'box-title';
  titleEl.contentEditable = true;
  titleEl.textContent = box.title || '';
  titleEl.setAttribute('placeholder', 'Title (optional)');

  // Save title on blur
  titleEl.onblur = () => {
    box.title = titleEl.textContent;
    saveState();
  };

  // Text content
  const textEl = document.createElement('div');
  textEl.className = 'box-text';
  textEl.contentEditable = true;
  textEl.textContent = box.text;

  // Save text on blur
  textEl.onblur = () => {
    box.text = textEl.textContent;
    saveState();
  };

  // Connection handle at bottom
  const handleEl = document.createElement('div');
  handleEl.className = 'box-connect-handle';
  handleEl.title = 'Drag to connect';

  // Handle drag-to-connect
  handleEl.onpointerdown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    startDragConnection(box.id, e);
  };

  boxEl.appendChild(controlsEl);
  boxEl.appendChild(titleEl);
  boxEl.appendChild(textEl);
  boxEl.appendChild(handleEl);

  // Make box draggable
  makeDraggable(boxEl, box);

  // Track resize
  const resizeObserver = new ResizeObserver(() => {
    const newWidth = boxEl.offsetWidth;
    const newHeight = boxEl.offsetHeight;
    if (Math.abs(box.width - newWidth) > 1 || Math.abs(box.height - newHeight) > 1) {
      box.width = newWidth;
      box.height = newHeight;
      updateConnectionsForBox(box.id);
      saveState();
    }
  });
  resizeObserver.observe(boxEl);

  canvas.appendChild(boxEl);
  return boxEl;
}

// Render all boxes from state
function renderAllBoxes() {
  state.boxes.forEach(box => renderBox(box));
}

// Clear canvas (remove all boxes and connections)
function clearCanvas() {
  document.querySelectorAll('.box').forEach(el => el.remove());
  connectionsSvg.innerHTML = '';
}

// Render everything from state
function renderAll() {
  nameInput.value = state.name;
  renderAllBoxes();
  renderAllConnections();
}

// Export state to JSON file
function exportState() {
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${state.name || 'storyboard'}.json`;
  a.click();

  URL.revokeObjectURL(url);
}

// Import state from JSON file
function importState(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);

      // Validate structure
      if (!Array.isArray(imported.boxes) || !Array.isArray(imported.connections)) {
        alert('Invalid storyboard file: missing boxes or connections array');
        return;
      }

      // Clear current canvas
      clearCanvas();

      // Load imported state
      state = {
        name: imported.name || 'Imported Storyboard',
        boxes: imported.boxes,
        connections: imported.connections
      };

      // Re-render everything
      renderAll();
      saveState();
    } catch (err) {
      alert('Failed to parse file: ' + err.message);
    }
  };
  reader.readAsText(file);
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  loadState();

  // Initialize name input
  nameInput.value = state.name;

  // Render existing boxes and connections
  renderAllBoxes();
  renderAllConnections();

  // Wire up name input
  nameInput.addEventListener('input', () => {
    state.name = nameInput.value;
    saveState();
  });

  // Wire up Add Box button
  addBoxBtn.addEventListener('click', () => {
    const box = {
      id: generateId('box'),
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      width: 200,
      height: 150,
      title: '',
      text: 'New box',
      borderColor: '#3498db'
    };
    addBox(box);
    renderBox(box);
  });

  // Right-click on canvas to add a new box
  canvas.addEventListener('contextmenu', (e) => {
    // Don't create box if clicking on an existing box or its children
    if (e.target.closest('.box')) return;
    // Don't create box if clicking on a connection popover
    if (e.target.closest('.connection-popover')) return;

    e.preventDefault();

    const canvasRect = canvas.getBoundingClientRect();
    const x = e.clientX - canvasRect.left + canvas.scrollLeft;
    const y = e.clientY - canvasRect.top + canvas.scrollTop;

    const box = {
      id: generateId('box'),
      x: x - 100, // Center the box on click position
      y: y - 75,
      width: 200,
      height: 150,
      title: '',
      text: 'New box',
      borderColor: '#3498db'
    };
    addBox(box);
    renderBox(box);
  });

  // Wire up Export button
  exportBtn.addEventListener('click', exportState);

  // Wire up Import button
  importBtn.addEventListener('click', () => {
    importInput.click();
  });

  importInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      importState(file);
      importInput.value = ''; // Reset for re-import
    }
  });

  // Wire up theme toggle
  const themeSwitch = document.getElementById('theme-switch');
  themeSwitch.addEventListener('click', toggleTheme);
});
