// main.js - Complete Fitness Tracker with MySQL Export

// Color palette for plates
const plateBaseColors = [
  0xffffff, 0x2ecc40, 0xffe066, 0x3498db, 0xe74c3c, 0x9b59b6, 0xf39c12, 0x16a085, 0x34495e, 0xf1c40f,
  0x1abc9c, 0xe67e22, 0x8e44ad, 0x27ae60, 0xd35400, 0xc0392b, 0x2980b9, 0x7f8c8d, 0xbdc3c7, 0x222222
];

// Helper functions
function hexToRgbObj(hex) {
  return { r: ((hex >> 16) & 0xff) / 255, g: ((hex >> 8) & 0xff) / 255, b: (hex & 0xff) / 255 };
}

function brighten(color, factor = 1.5) {
  return { r: Math.min(color.r * factor, 1), g: Math.min(color.g * factor, 1), b: Math.min(color.b * factor, 1) };
}

function dim(color, factor = 0.5) {
  return { r: color.r * factor, g: color.g * factor, b: color.b * factor };
}

// Global variables
let plates = [];
let plateLabels = [];
let rods = [];
let fitnessData = [];

// Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.zIndex = '1';
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Base platform
const baseGeometry = new THREE.BoxGeometry(2.5, 0.2, 1);
const baseMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
const base = new THREE.Mesh(baseGeometry, baseMaterial);
base.position.y = -1.1;
scene.add(base);

// Constants
const TOTAL_RODS = 20;
const TOTAL_PLATES = 20;
const PLATE_HEIGHT = 0.15;
const PLATE_RADIUS = 0.6;
const PLATE_SPACING = 0.22;

// Weight display
const weightDisplay = document.createElement('div');
weightDisplay.style.cssText = `
  position: absolute; top: 20px; right: 20px; padding: 20px 40px;
  background: rgba(0,0,0,0.8); border-radius: 15px; color: white;
  font: bold 2.5rem 'Segoe UI', Arial; text-align: center;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2); z-index: 1000;
`;
weightDisplay.innerHTML = '<span>0</span><span style="font-size: 1.5rem; margin-left: 5px;">kg</span>';
document.body.appendChild(weightDisplay);

// Update weight display
function updateWeightDisplay(weight) {
  const span = weightDisplay.querySelector('span');
  gsap.to(span, { innerHTML: Math.round(weight), duration: 0.5, snap: { innerHTML: 1 }, ease: 'power2.out' });
}

// Create rod stack
function createRodStack() {
  rods.forEach(r => scene.remove(r.mesh));
  rods = [];
  
  const rodGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2, 32);
  
  for (let i = 0; i < TOTAL_RODS; i++) {
    const rodMaterial = new THREE.MeshPhongMaterial({ color: 0x888888, emissive: 0x000000 });
    const rod = new THREE.Mesh(rodGeometry, rodMaterial);
    rod.position.set(0, -1 + i * 0.11, 0);
    scene.add(rod);
    rods.push({ mesh: rod, material: rodMaterial });
  }
}

// Create plate stack
function createPlateStack() {
  plates.forEach(p => scene.remove(p.mesh));
  plates = [];
  plateLabels.forEach(label => label.remove());
  plateLabels = [];

  for (let i = 0; i < TOTAL_PLATES; i++) {
    const baseColor = hexToRgbObj(plateBaseColors[i % plateBaseColors.length]);
    const plateMaterial = new THREE.MeshPhongMaterial({
      color: plateBaseColors[i % plateBaseColors.length],
      emissive: 0x000000,
      shininess: 30,
      specular: 0x444444
    });
    const plate = new THREE.Mesh(
      new THREE.CylinderGeometry(PLATE_RADIUS, PLATE_RADIUS, PLATE_HEIGHT, 64),
      plateMaterial
    );
    plate.position.set(0, -1 + i * PLATE_SPACING, 0);
    scene.add(plate);
    plates.push({ mesh: plate, material: plateMaterial, baseColor });

    // Label
    const label = document.createElement('div');
    label.className = 'plate-label';
    label.textContent = `${(i + 1) * 5}kg`;
    label.style.cssText = `
      position: absolute; font: bold 1.3rem 'Segoe UI', Arial;
      color: #888; text-shadow: 0 2px 8px rgba(255,255,255,0.5);
      pointer-events: none; transition: all 0.3s ease; z-index: 10;
    `;
    document.body.appendChild(label);
    plateLabels.push(label);
  }
}

// Animate plates
function animatePlateGlow(weight) {
  const glowingCount = Math.max(0, Math.min(TOTAL_PLATES, Math.round(weight / 5)));
  updateWeightDisplay(weight);

  plates.forEach((plateObj, i) => {
    const label = plateLabels[i];
    const base = plateObj.baseColor;
    
    if (i < glowingCount) {
      if (i === glowingCount - 1) {
        // Top plate - gold glow
        const bright = brighten(base, 2);
        gsap.to(plateObj.material.color, { r: bright.r, g: bright.g, b: bright.b, duration: 0.5 });
        gsap.to(plateObj.material.emissive, { r: 1, g: 0.8, b: 0.2, duration: 0.5 });
        label.style.color = '#ffdd00';
        label.style.textShadow = '0 0 20px rgba(255,221,0,0.8)';
        label.style.transform = 'scale(1.2)';
      } else {
        // Active plates
        const bright = brighten(base, 1.5);
        gsap.to(plateObj.material.color, { r: bright.r, g: bright.g, b: bright.b, duration: 0.5 });
        gsap.to(plateObj.material.emissive, { r: bright.r * 0.5, g: bright.g * 0.5, b: bright.b * 0.5, duration: 0.5 });
        label.style.color = '#fff';
        label.style.transform = 'scale(1.1)';
      }
    } else {
      // Inactive plates
      const dimmed = dim(base, 0.5);
      gsap.to(plateObj.material.color, { r: dimmed.r, g: dimmed.g, b: dimmed.b, duration: 0.5 });
      gsap.to(plateObj.material.emissive, { r: 0, g: 0, b: 0, duration: 0.5 });
      label.style.color = '#888';
      label.style.transform = 'scale(1)';
    }
  });
}

// Update label positions
function updateLabelPositions() {
  plates.forEach((plateObj, i) => {
    const vector = plateObj.mesh.position.clone().project(camera);
    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;
    plateLabels[i].style.left = `${x - 30}px`;
    plateLabels[i].style.top = `${y - 18}px`;
  });
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  updateLabelPositions();
}

// Reps display
function updateRepsDisplay(reps) {
  let repsDiv = document.getElementById('reps-display');
  if (!repsDiv) {
    repsDiv = document.createElement('div');
    repsDiv.id = 'reps-display';
    repsDiv.style.cssText = `
      position: absolute; top: 20px; left: 20px; font-size: 2rem;
      color: #222; background: rgba(255,255,255,0.7); padding: 10px 20px;
      border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    `;
    document.body.appendChild(repsDiv);
  }
  repsDiv.textContent = `Reps: ${reps}`;
}

// ===== SQL DATA MANAGEMENT =====

// Save data with auto-cleanup
function saveToSQL(uid, weight, reps) {
  const record = {
    id: Date.now(),
    uid: uid,
    weight: weight,
    reps: reps,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
  };
  
  fitnessData.push(record);
  
  // Auto-delete oldest entries if exceeds 1000
  if (fitnessData.length > 1000) {
    const deletedCount = fitnessData.length - 1000;
    fitnessData = fitnessData.slice(-1000); // Keep only last 1000 entries
    console.log(`🗑️ Auto-deleted ${deletedCount} old entries. Keeping latest 1000.`);
  }
  
  console.log('✅ Saved:', record);
  updateStatus(`💾 ${fitnessData.length}/1000 records`);
  saveToLocalStorage();
}

// Export to MySQL script
function exportToMySQL() {
  if (fitnessData.length === 0) {
    alert('No data to export');
    return;
  }

  let sql = `-- Fitness Data Export (${new Date().toISOString()})
CREATE DATABASE IF NOT EXISTS fitness_db;
USE fitness_db;

CREATE TABLE IF NOT EXISTS fitness_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uid VARCHAR(50) NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  reps INT NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  INDEX idx_uid (uid),
  INDEX idx_timestamp (timestamp)
);

INSERT INTO fitness_data (uid, weight, reps, timestamp) VALUES
`;

  const values = fitnessData.map(r => 
    `('${r.uid}', ${r.weight}, ${r.reps}, '${r.timestamp}')`
  ).join(',\n');

  sql += values + ';\n\n-- Total records: ' + fitnessData.length;

  const blob = new Blob([sql], { type: 'text/sql' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fitness_data_${new Date().toISOString().split('T')[0]}.sql`;
  a.click();
  URL.revokeObjectURL(url);
  
  alert('✅ SQL exported! Import in MySQL Workbench.');
}

// LocalStorage backup
function saveToLocalStorage() {
  try {
    localStorage.setItem('fitness_data', JSON.stringify(fitnessData));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

function loadSavedData() {
  try {
    const saved = localStorage.getItem('fitness_data');
    if (saved) {
      fitnessData = JSON.parse(saved);
      updateStatus(`📱 Loaded ${fitnessData.length} records`);
    }
  } catch (error) {
    console.error('Error loading saved data:', error);
  }
}

// Status display
function updateStatus(message) {
  let status = document.getElementById('sql-status');
  if (!status) {
    status = document.createElement('div');
    status.id = 'sql-status';
    status.style.cssText = `
      position: fixed; bottom: 20px; left: 20px; padding: 8px 16px;
      background: rgba(0,0,0,0.8); color: white; border-radius: 8px;
      font-size: 12px; z-index: 9999; transition: opacity 0.3s;
    `;
    document.body.appendChild(status);
  }
  status.textContent = message;
  status.style.opacity = '1';
  setTimeout(() => status.style.opacity = '0.5', 2000);
}

// Control buttons
function createControls() {
  const controlsDiv = document.createElement('div');
  controlsDiv.style.cssText = `
    position: fixed; top: 120px; left: 20px; display: flex;
    flex-direction: column; gap: 5px; z-index: 9999;
  `;

  const buttons = [
    { text: '🗄️ Export SQL', bg: '#e67e22', action: exportToMySQL },
    { text: '👁️ View Data', bg: '#3498db', action: () => console.table(fitnessData.slice(-10)) },
    { text: '🧪 Test Save', bg: '#9b59b6', action: () => saveToSQL('user_001', Math.random() * 80 + 20, Math.floor(Math.random() * 12) + 1) },
    { text: '🗑️ Clear', bg: '#e74c3c', action: () => confirm('Delete all data?') && (fitnessData = [], updateStatus('🗑️ Cleared')) }
  ];

  buttons.forEach(btn => {
    const button = document.createElement('button');
    button.textContent = btn.text;
    button.style.cssText = `
      padding: 6px 12px; background: ${btn.bg}; color: white;
      border: none; border-radius: 6px; cursor: pointer; font-size: 11px;
    `;
    button.onclick = btn.action;
    controlsDiv.appendChild(button);
  });

  document.body.appendChild(controlsDiv);
}

// ===== MQTT INTEGRATION =====
const mqttUrl = 'wss://broker.hivemq.com:8884/mqtt';
const mqttClient = mqtt.connect(mqttUrl);

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
  mqttClient.subscribe('iot/fitness/data');
});

mqttClient.on('message', (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    animatePlateGlow(data.weight);
    updateRepsDisplay(data.reps);
    saveToSQL('user_001', data.weight, data.reps); // Auto-save to SQL
  } catch (e) {
    console.error('Invalid MQTT message', e);
  }
});

// ===== INITIALIZATION =====
camera.position.z = 5;
createRodStack();
createPlateStack();
createControls();
loadSavedData();
animate();

// Add CSS
const style = document.createElement('style');
style.textContent = `
.plate-label {
  font-family: 'Segoe UI', Arial, sans-serif;
  letter-spacing: 1px;
  user-select: none;
  transition: all 0.3s ease;
}
`;
document.head.appendChild(style);