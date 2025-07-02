let scene, camera, renderer, model;
let keyframes = [];
let currentFrame = 0;

init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x202020);

  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 1.5, 3);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
  scene.add(light);

  // Load the character model
  const loader = new THREE.GLTFLoader();
  loader.load('character.glb', function (gltf) {
    model = gltf.scene;
    scene.add(model);

    // Log bone names for debugging
    model.traverse(obj => {
      if (obj.isBone) {
        console.log("Bone:", obj.name);
      }
    });

    // Load keypoints after model
    fetch('Jumping_jacks_keypoints.json')
      .then(res => res.json())
      .then(data => {
        keyframes = data;
        console.log("Keyframes loaded:", keyframes.length);
      });
  });
}

function animate() {
  requestAnimationFrame(animate);

  if (model && keyframes.length > 0) {
    const frame = keyframes[currentFrame];
    applyPoseToModel(frame);
    currentFrame = (currentFrame + 1) % keyframes.length;
  }

  renderer.render(scene, camera);
}

function applyPoseToModel(frame) {
  const boneMap = {
    'leftShoulder': 'LeftShoulder',
    'rightShoulder': 'RightShoulder',
    'leftHip': 'LeftUpLeg',
    'rightHip': 'RightUpLeg',
    // Add more if needed
  };

  model.traverse(obj => {
    if (obj.isBone) {
      for (const key in boneMap) {
        if (obj.name === boneMap[key] && frame[key]) {
          const pos = frame[key];
          obj.position.set(pos.x * 0.01, pos.y * 0.01, 0);
        }
      }
    }
  });
}
