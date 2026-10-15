import * as THREE from 'three';

const canvas = document.querySelector('#world');
const countLabel = document.querySelector('#block-count');
const joystick = document.querySelector('#joystick');
const joystickKnob = document.querySelector('#joystick-knob');
const actionButton = document.querySelector('#action');
const actionLabel = document.querySelector('#action-label');
const actionIcon = document.querySelector('#action-icon');
const toast = document.querySelector('#toast');

const scene = new THREE.Scene();
scene.background = new THREE.Color('#a7e5de');
scene.fog = new THREE.Fog('#a7e5de', 35, 82);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 120);
camera.position.set(8, 10, 13);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

scene.add(new THREE.HemisphereLight('#e7fff6', '#65785b', 2.1));
const sun = new THREE.DirectionalLight('#fff5d7', 3.1);
sun.position.set(-12, 20, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -25;
sun.shadow.camera.right = 25;
sun.shadow.camera.top = 25;
sun.shadow.camera.bottom = -25;
scene.add(sun);

const island = new THREE.Mesh(
  new THREE.CylinderGeometry(23, 20.5, 2.6, 12),
  new THREE.MeshStandardMaterial({ color: '#639e61', roughness: 1, flatShading: true }),
);
island.position.y = -1.35;
island.receiveShadow = true;
scene.add(island);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(44, 44),
  new THREE.MeshStandardMaterial({ color: '#92c878', roughness: 1 }),
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0.01;
ground.receiveShadow = true;
scene.add(ground);

const grid = new THREE.GridHelper(44, 44, '#83b76a', '#83b76a');
grid.position.y = 0.025;
grid.material.transparent = true;
grid.material.opacity = 0.2;
scene.add(grid);

const scenery = new THREE.Group();
scene.add(scenery);

function addTree(x, z, scale = 1) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22 * scale, 0.32 * scale, 1.55 * scale, 6),
    new THREE.MeshStandardMaterial({ color: '#9e6849', roughness: 1, flatShading: true }),
  );
  trunk.position.set(x, 0.77 * scale, z);
  trunk.castShadow = true;
  scenery.add(trunk);

  const crown = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.08 * scale, 1),
    new THREE.MeshStandardMaterial({ color: scale > 1 ? '#4e9b70' : '#70b874', roughness: 1, flatShading: true }),
  );
  crown.position.set(x, 1.95 * scale, z);
  crown.castShadow = true;
  scenery.add(crown);
}

function addRock(x, z, scale, color) {
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(scale, 0),
    new THREE.MeshStandardMaterial({ color, roughness: 1, flatShading: true }),
  );
  rock.position.set(x, scale * 0.48, z);
  rock.scale.y = 0.7;
  rock.castShadow = true;
  scenery.add(rock);
}

addTree(-8, -7, 1.1);
addTree(10, -6, 0.85);
addTree(-11, 5, 0.8);
addTree(12, 7, 1.15);
addTree(-4, 13, 0.72);
addTree(7, 13, 0.9);
addRock(-5, -12, 0.9, '#e2b98b');
addRock(5, -13, 0.68, '#d5a98a');
addRock(13, 2, 0.62, '#e2bd8c');

const cloudMaterial = new THREE.MeshStandardMaterial({ color: '#f2fff3', roughness: 1, flatShading: true });
function addCloud(x, y, z, scale) {
  const cloud = new THREE.Group();
  for (const [offsetX, offsetY, radius] of [[0, 0, 1], [0.9, 0.15, 0.7], [-0.85, 0.05, 0.72], [0.2, 0.45, 0.67]]) {
    const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(radius * scale, 1), cloudMaterial);
    puff.position.set(offsetX * scale, offsetY * scale, 0);
    cloud.add(puff);
  }
  cloud.position.set(x, y, z);
  scenery.add(cloud);
}

addCloud(-19, 13, -21, 1.3);
addCloud(18, 16, -25, 1.6);
addCloud(25, 12, 8, 1.1);

const player = new THREE.Group();
scene.add(player);
const avatar = new THREE.Group();
player.add(avatar);

const materials = {
  body: new THREE.MeshStandardMaterial({ color: '#ff8069', roughness: 0.8, flatShading: true }),
  head: new THREE.MeshStandardMaterial({ color: '#f2c39d', roughness: 0.9, flatShading: true }),
  shirt: new THREE.MeshStandardMaterial({ color: '#f4f3df', roughness: 0.8, flatShading: true }),
  pants: new THREE.MeshStandardMaterial({ color: '#4d7183', roughness: 0.9, flatShading: true }),
  face: new THREE.MeshStandardMaterial({ color: '#243c39', roughness: 0.8 }),
};

function makePart(size, material, position, parent = avatar) {
  const part = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  part.position.set(...position);
  part.castShadow = true;
  part.receiveShadow = true;
  parent.add(part);
  return part;
}

makePart([0.86, 0.9, 0.48], materials.shirt, [0, 1.25, 0]);
makePart([0.67, 0.67, 0.65], materials.head, [0, 2.1, 0]);
makePart([0.13, 0.14, 0.07], materials.face, [-0.16, 2.15, 0.34]);
makePart([0.13, 0.14, 0.07], materials.face, [0.16, 2.15, 0.34]);
const leftArm = makePart([0.28, 0.82, 0.38], materials.body, [-0.6, 1.27, 0]);
const rightArm = makePart([0.28, 0.82, 0.38], materials.body, [0.6, 1.27, 0]);
const leftLeg = makePart([0.34, 0.72, 0.38], materials.pants, [-0.23, 0.43, 0]);
const rightLeg = makePart([0.34, 0.72, 0.38], materials.pants, [0.23, 0.43, 0]);
player.position.set(0, 0, 3);

const blockGeometry = new THREE.BoxGeometry(0.98, 0.98, 0.98);
const placedBlocks = new Map();
let selectedColor = '#b9f36c';
let selectedName = 'Лайм';
let mode = 'build';
let toastTimeout;

function blockKey(x, y, z) {
  return `${x}:${y}:${z}`;
}

function announce(message) {
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => { toast.hidden = true; }, 1400);
}

function getTargetCell() {
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const hits = raycaster.intersectObjects([...placedBlocks.values()], false);
  if (hits.length > 0) {
    const { object, face } = hits[0];
    const target = object.position.clone().add(face.normal);
    return {
      x: Math.round(target.x),
      y: Math.round(target.y - 0.5),
      z: Math.round(target.z),
      hit: object,
    };
  }

  const groundHit = new THREE.Vector3();
  const floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  if (!raycaster.ray.intersectPlane(floor, groundHit)) return null;
  if (Math.abs(groundHit.x) > 17 || Math.abs(groundHit.z) > 17) return null;
  return { x: Math.round(groundHit.x), y: 0, z: Math.round(groundHit.z), hit: null };
}

function buildAtTarget() {
  const target = getTargetCell();
  if (!target) {
    announce('Наведи метку на землю');
    return;
  }
  if (mode === 'erase') {
    if (!target.hit) {
      announce('Наведи метку на свой блок');
      return;
    }
    scene.remove(target.hit);
    placedBlocks.delete(target.hit.userData.key);
  } else {
    const key = blockKey(target.x, target.y, target.z);
    if (placedBlocks.has(key)) {
      announce('Тут уже есть блок');
      return;
    }
    const block = new THREE.Mesh(
      blockGeometry,
      new THREE.MeshStandardMaterial({ color: selectedColor, roughness: 0.74, flatShading: true }),
    );
    block.position.set(target.x, target.y + 0.5, target.z);
    block.castShadow = true;
    block.receiveShadow = true;
    block.userData.key = key;
    scene.add(block);
    placedBlocks.set(key, block);
  }
  countLabel.textContent = String(placedBlocks.size);
}

document.querySelectorAll('.swatch').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelector('.swatch.selected')?.classList.remove('selected');
    button.classList.add('selected');
    selectedColor = button.dataset.color;
    selectedName = button.dataset.name;
    document.querySelector('#selected-name').textContent = selectedName;
  });
});

document.querySelectorAll('.mode').forEach((button) => {
  button.addEventListener('click', () => {
    mode = button.dataset.mode;
    document.querySelectorAll('.mode').forEach((item) => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    const erasing = mode === 'erase';
    actionLabel.textContent = erasing ? 'Убрать' : 'Поставить';
    actionButton.setAttribute('aria-label', erasing ? 'Убрать блок' : 'Поставить блок');
    actionIcon.innerHTML = erasing
      ? '<path d="m5 12 14 0M7 9l-2 3 2 3h10l2-3-2-3H7Z" />'
      : '<path d="M12 5v14M5 12h14" />';
  });
});

actionButton.addEventListener('click', buildAtTarget);

const input = { x: 0, y: 0, pointerId: null };
function moveJoystick(event) {
  const bounds = joystick.getBoundingClientRect();
  const maxDistance = 28;
  const dx = event.clientX - (bounds.left + bounds.width / 2);
  const dy = event.clientY - (bounds.top + 51);
  const distance = Math.hypot(dx, dy);
  const scale = distance > maxDistance ? maxDistance / distance : 1;
  const x = dx * scale;
  const y = dy * scale;
  input.x = x / maxDistance;
  input.y = y / maxDistance;
  joystickKnob.style.transform = `translate(${x}px, ${y}px)`;
}

joystick.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  input.pointerId = event.pointerId;
  joystick.setPointerCapture(event.pointerId);
  moveJoystick(event);
});
joystick.addEventListener('pointermove', (event) => {
  if (event.pointerId === input.pointerId) moveJoystick(event);
});
function releaseJoystick(event) {
  if (event.pointerId !== input.pointerId) return;
  input.pointerId = null;
  input.x = 0;
  input.y = 0;
  joystickKnob.style.transform = 'translate(0, 0)';
}
joystick.addEventListener('pointerup', releaseJoystick);
joystick.addEventListener('pointercancel', releaseJoystick);

const keys = new Set();
window.addEventListener('keydown', (event) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) event.preventDefault();
  keys.add(event.key.toLowerCase());
  if (event.code === 'Space' && !event.repeat) jump();
  if (event.key.toLowerCase() === 'e' && !event.repeat) buildAtTarget();
});
window.addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());

let verticalSpeed = 0;
let grounded = true;
function jump() {
  if (!grounded) return;
  verticalSpeed = 7.3;
  grounded = false;
}
document.querySelector('#jump').addEventListener('click', jump);

const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const movement = new THREE.Vector3();
const targetCamera = new THREE.Vector3();
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.04);
  let axisX = input.x;
  let axisY = input.y;
  if (keys.has('a') || keys.has('arrowleft')) axisX -= 1;
  if (keys.has('d') || keys.has('arrowright')) axisX += 1;
  if (keys.has('w') || keys.has('arrowup')) axisY -= 1;
  if (keys.has('s') || keys.has('arrowdown')) axisY += 1;

  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();
  right.set(-forward.z, 0, forward.x);
  movement.set(0, 0, 0).addScaledVector(forward, -axisY).addScaledVector(right, axisX);
  const isMoving = movement.lengthSq() > 0.025;
  if (isMoving) {
    movement.normalize();
    player.position.addScaledVector(movement, 5.3 * delta);
    player.position.x = THREE.MathUtils.clamp(player.position.x, -17, 17);
    player.position.z = THREE.MathUtils.clamp(player.position.z, -17, 17);
    avatar.rotation.y = Math.atan2(movement.x, movement.z);
  }

  if (isMoving && grounded) {
    const step = Math.sin(clock.elapsedTime * 12) * 0.42;
    leftLeg.rotation.x = step;
    rightLeg.rotation.x = -step;
    leftArm.rotation.x = -step * 0.72;
    rightArm.rotation.x = step * 0.72;
  } else {
    leftLeg.rotation.x = THREE.MathUtils.damp(leftLeg.rotation.x, 0, 10, delta);
    rightLeg.rotation.x = THREE.MathUtils.damp(rightLeg.rotation.x, 0, 10, delta);
    leftArm.rotation.x = THREE.MathUtils.damp(leftArm.rotation.x, 0, 10, delta);
    rightArm.rotation.x = THREE.MathUtils.damp(rightArm.rotation.x, 0, 10, delta);
  }

  if (!grounded || player.position.y > 0) {
    verticalSpeed -= 18 * delta;
    player.position.y += verticalSpeed * delta;
    if (player.position.y <= 0) {
      player.position.y = 0;
      verticalSpeed = 0;
      grounded = true;
    }
  }

  targetCamera.set(player.position.x + 8.6, player.position.y + 10.7, player.position.z + 12.3);
  camera.position.lerp(targetCamera, 1 - Math.exp(-3.6 * delta));
  camera.lookAt(player.position.x, player.position.y + 0.8, player.position.z - 0.25);
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();