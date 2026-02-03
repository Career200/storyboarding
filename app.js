// Storyboard App - State Management

const STORAGE_KEY = 'storyboard-state';

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

// Placeholder for connection updates (implemented in Step 5)
function updateConnectionsForBox(boxId) {
  // Will update SVG paths when box moves
}

// Make element draggable using Pointer Events API
function makeDraggable(element, box) {
  element.style.cursor = 'grab';

  element.onpointerdown = (e) => {
    // Don't drag when clicking on editable text
    if (e.target.hasAttribute('contenteditable')) return;

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

  const textEl = document.createElement('div');
  textEl.className = 'box-text';
  textEl.contentEditable = true;
  textEl.textContent = box.text;

  // Save text on blur
  textEl.onblur = () => {
    box.text = textEl.textContent;
    saveState();
  };

  boxEl.appendChild(textEl);

  // Make box draggable
  makeDraggable(boxEl, box);

  canvas.appendChild(boxEl);
  return boxEl;
}

// Render all boxes from state
function renderAllBoxes() {
  state.boxes.forEach(box => renderBox(box));
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  loadState();

  // Initialize name input
  nameInput.value = state.name;

  // Render existing boxes
  renderAllBoxes();

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
      text: 'New box',
      borderColor: '#3498db'
    };
    addBox(box);
    renderBox(box);
  });
});
