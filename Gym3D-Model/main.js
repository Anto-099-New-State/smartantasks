import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.153.0/build/three.module.js';

let scene, camera, renderer;
let weightBlocks = [], rod, stackGroup = new THREE.Group();
let handle, cable;
let repCount = 0, setCount = 0, repsPerSet = 10;
let isPullingDown = false;
let inRep = false;

initScene();
animate();
simulateBackendPoll();

function initScene() {
  scene = new THREE.Scene();

  const loader = new THREE.TextureLoader();
  loader.load('./gym-bg.jpg', function (texture) {
    scene.background = texture;
  });

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 5, 15);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const light = new THREE.PointLight(0xffffff, 1);
  light.position.set(5, 10, 10);
  scene.add(light);

  createMachineFrame();
  createWeightStack();
  createSelectorRod();
  createPulleySystem();
}

function createMachineFrame() {
  const mat = new THREE.MeshStandardMaterial({ color: 0x888888 });
  const baseGeo = new THREE.BoxGeometry(0.5, 10, 0.5);
  const topBarGeo = new THREE.BoxGeometry(5, 0.5, 0.5);

  const left = new THREE.Mesh(baseGeo, mat);
  left.position.set(-2, 5, 0);
  const right = new THREE.Mesh(baseGeo, mat);
  right.position.set(2, 5, 0);
  const top = new THREE.Mesh(topBarGeo, mat);
  top.position.set(0, 10, 0);

  scene.add(left, right, top);
}

function createWeightStack() {
  const geo = new THREE.BoxGeometry(4, 0.6, 2);
  const mat = new THREE.MeshStandardMaterial({ color: 0x222222 });

  for (let i = 0; i < 10; i++) {
    const block = new THREE.Mesh(geo, mat);
    block.position.y = i * 0.65 + 0.3;
    stackGroup.add(block);
    weightBlocks.push(block);
  }
  scene.add(stackGroup);
}

function createSelectorRod() {
  const geo = new THREE.CylinderGeometry(0.15, 0.15, 4, 32);
  const mat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  rod = new THREE.Mesh(geo, mat);
  rod.rotation.z = Math.PI / 2;
  rod.position.set(-2, weightBlocks[0].position.y, 0);
  scene.add(rod);
}

function updateRodPosition(weight) {
  const index = weight / 10 - 1;
  if (index >= 0 && index < weightBlocks.length) {
    rod.position.y = weightBlocks[index].position.y;
  }
}

function createPulleySystem() {
  const handleGeo = new THREE.BoxGeometry(2, 0.3, 0.3);
  const handleMat = new THREE.MeshStandardMaterial({ color: 0x00ffff });
  handle = new THREE.Mesh(handleGeo, handleMat);
  handle.position.set(0, 8, 0);
  scene.add(handle);

  const cableMat = new THREE.LineBasicMaterial({ color: 0xffffff });
  const cableGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 8, 0),
    new THREE.Vector3(0, 5, 0)
  ]);
  cable = new THREE.Line(cableGeo, cableMat);
  scene.add(cable);
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') isPullingDown = true;
});
document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowDown') isPullingDown = false;
});

function animate() {
  requestAnimationFrame(animate);

  // Handle motion
  if (isPullingDown && handle.position.y > 4) {
    handle.position.y -= 0.05;
    stackGroup.position.y += 0.05;
  } else if (!isPullingDown && handle.position.y < 8) {
    handle.position.y += 0.05;
    stackGroup.position.y -= 0.05;
  }

  // Cable update
  cable.geometry.setFromPoints([
    new THREE.Vector3(0, handle.position.y, 0),
    new THREE.Vector3(0, 5, 0)
  ]);

  // Rep and set logic (down + up = 1 rep)
  const downThreshold = 5.2;
  const upThreshold = 7.9;

  if (!inRep && handle.position.y <= downThreshold) {
    inRep = true;
  }

  if (inRep && handle.position.y >= upThreshold) {
    repCount++;
    document.getElementById('rep').innerText = repCount;

    if (repCount % repsPerSet === 0) {
      setCount++;
      document.getElementById('set').innerText = setCount;
    }

    inRep = false;
  }

  renderer.render(scene, camera);
}

// Simulate backend weight updates
async function fetchMockData() {
  const weights = [10, 20, 30, 40, 50];
  const random = Math.floor(Math.random() * weights.length);
  return { selectedWeight: weights[random] };
}

function simulateBackendPoll() {
  setInterval(async () => {
    const data = await fetchMockData();
    updateRodPosition(data.selectedWeight);
    console.log("📦 Backend weight:", data.selectedWeight, "kg");
  }, 5000);
}
