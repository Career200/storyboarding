// State Management

const STORAGE_KEY = "storyboard-state";
const THEME_KEY = "storyboard-theme";

// Initialize theme immediately to prevent flash
const savedTheme = localStorage.getItem(THEME_KEY) || "dark";
document.documentElement.setAttribute("data-theme", savedTheme);

let state = {
  name: "Untitled Storyboard",
  boxes: [],
  connections: []
};

// ID Generation
const generateId = (prefix = "item") =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// State accessors
const getBox = (id) => state.boxes.find((b) => b.id === id);

// State mutations
const addBox = (box) => {
  state.boxes.push(box);
  saveState();
  return box;
};

const removeBox = (id) => {
  state.boxes = state.boxes.filter((b) => b.id !== id);
  state.connections = state.connections.filter(
    (c) => c.fromBox !== id && c.toBox !== id
  );
  saveState();
};

const addConnection = (conn) => {
  state.connections.push(conn);
  saveState();
  return conn;
};

const removeConnection = (id) => {
  state.connections = state.connections.filter((c) => c.id !== id);
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
      console.warn("Failed to parse saved state, using default");
    }
  }
  return state;
};

// Theme
const toggleTheme = () => {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem(THEME_KEY, next);
};

// Export for modules
export {
  state,
  generateId,
  getBox,
  addBox,
  removeBox,
  addConnection,
  removeConnection,
  saveState,
  loadState,
  toggleTheme
};
