// State Management

const STORAGE_KEY = "storyboard-state";
const THEME_KEY = "storyboard-theme";

// Initialize theme immediately to prevent flash
const savedTheme = localStorage.getItem(THEME_KEY) || "dark";
document.documentElement.setAttribute("data-theme", savedTheme);

// Default example story
const DEFAULT_STATE = {
  name: "Story title",
  boxes: [
    {
      id: "box-1770138458043-nmcfo",
      x: 435, y: 27, width: 534, height: 150,
      title: "Premise",
      text: "A young cargo pilot finds an ancient control device that can awaken hidden space defense weapons from a long-forgotten war. The device imprints and ties itself to her for good.\n",
      borderColor: "#3498db"
    },
    {
      id: "box-1770135209917-7u3e9",
      x: 543, y: 215, width: 321, height: 153,
      title: "Initial challenge",
      text: "She learns an invading empire fleet is on its way to attack a nearby colony, and only those old weapons could stop them.",
      borderColor: "#3498db"
    },
    {
      id: "box-1770137669195-2xg70",
      x: 594, y: 437, width: 220, height: 216,
      title: "Guaranteed outcome",
      text: "She hesitates too long, and the empire tracks the device's signal to her ship. Now she's forced into conflict anyway.",
      borderColor: "#3498db"
    },
    {
      id: "box-1770135171097-lmw2d",
      x: 185, y: 618, width: 326, height: 150,
      title: "FAIL",
      text: "She ignores it and flies away, not wanting trouble. The colony is destroyed, the empire grows stronger and begins tracking her.",
      borderColor: "#f80d3c"
    },
    {
      id: "box-1770134809821-dz3ni",
      x: 889, y: 620, width: 339, height: 150,
      title: "SUCCESS",
      text: "She activates the device and calls the ancient weapons. They power up and drive the empire fleet back. She is on the radar for the empire now.",
      borderColor: "#33db36"
    },
    {
      id: "box-1770136727073-cviex",
      x: 511, y: 846, width: 403, height: 164,
      title: "Finale",
      text: "She accepts that having the device means she can't stay neutral. Whether to run, hide and get rid of the device, or to face the empire, the parts are moving now.",
      borderColor: "#3498db"
    }
  ],
  connections: [
    { id: "conn-1770138478457-ve43o", fromBox: "box-1770138458043-nmcfo", toBox: "box-1770135209917-7u3e9", color: "#2c3e50", style: "double" },
    { id: "conn-1770135329620-whtzn", fromBox: "box-1770135209917-7u3e9", toBox: "box-1770135171097-lmw2d", color: "#2c3e50", style: "solid" },
    { id: "conn-1770136597298-g6l41", fromBox: "box-1770135209917-7u3e9", toBox: "box-1770134809821-dz3ni", color: "#2c3e50", style: "dashed" },
    { id: "conn-1770137671625-9jtar", fromBox: "box-1770137669195-2xg70", toBox: "box-1770135209917-7u3e9", color: "#2c3e50", style: "double" },
    { id: "conn-1770138396175-l5ujb", fromBox: "box-1770137669195-2xg70", toBox: "box-1770135171097-lmw2d", color: "#ff0000", style: "double" },
    { id: "conn-1770138340780-dn4eu", fromBox: "box-1770137669195-2xg70", toBox: "box-1770134809821-dz3ni", color: "#71b8fe", style: "dashed" },
    { id: "conn-1770136749933-jpzgm", fromBox: "box-1770135171097-lmw2d", toBox: "box-1770136727073-cviex", color: "#ff0f0f", style: "double" },
    { id: "conn-1770136747391-2mg5f", fromBox: "box-1770134809821-dz3ni", toBox: "box-1770136727073-cviex", color: "#0fff57", style: "dashed" }
  ]
};

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

// Clear all state
const clearState = () => {
  state.name = "Untitled Storyboard";
  state.boxes = [];
  state.connections = [];
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
      state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
  } else {
    // No saved state - load default example
    state = JSON.parse(JSON.stringify(DEFAULT_STATE));
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

export {
  state,
  generateId,
  getBox,
  addBox,
  removeBox,
  addConnection,
  removeConnection,
  clearState,
  saveState,
  loadState,
  toggleTheme
};
