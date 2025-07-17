import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/loaders/GLTFLoader.js';
import { parseBlueprint } from './parser.js';

let scene, camera, renderer, controls, loader, blueprintGroup;
const modelCache = new Map();
const sidebar = document.getElementById('sidebar') || createSidebar();

function createSidebar() {
  const div = document.createElement('div');
  div.id = 'sidebar';
  div.style.position = 'absolute';
  div.style.top = '10px';
  div.style.right = '10px';
  div.style.background = 'rgba(255,255,255,0.95)';
  div.style.padding = '10px';
  div.style.borderRadius = '8px';
  div.style.maxHeight = '90vh';
  div.style.overflowY = 'auto';
  div.style.boxShadow = '0 0 5px #000';
  div.innerHTML = '<h4>Blueprint Parts</h4><ul id="partList" style="list-style:none;padding-left:0"></ul>';
  document.body.appendChild(div);
  return div;
}

function updateSidebar(objects) {
  const list = document.getElementById('partList');
  list.innerHTML = '';
  objects.forEach((obj, index) => {
    const li = document.createElement('li');
    li.textContent = `${index + 1}: ${obj.typePath.split('/').pop()}`;
    li.style.cursor = 'pointer';
    li.onclick = () => {
      const target = blueprintGroup.children[index];
      const box = new THREE.Box3().setFromObject(target);
      const center = box.getCenter(new THREE.Vector3());
      controls.target.copy(center);
    };
    list.appendChild(li);
  });
}

function initScene() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  camera.position.set(0, 300, 800);
  controls.enableDamping = true;

  const light = new THREE.HemisphereLight(0xffffff, 0x444444);
  scene.add(light);

  loader = new GLTFLoader();
}

function loadGLB(typePath) {
  const key = typePath.split('/').pop();
  if (modelCache.has(key)) return Promise.resolve(modelCache.get(key));

  return loader.loadAsync(`models/${key}.glb`)
    .then(gltf => {
      modelCache.set(key, gltf.scene);
      return gltf.scene;
    })
    .catch(() => {
      window.appendLog?.(`⚠️ Missing model for ${key}`);
      return new THREE.Mesh(
        new THREE.BoxGeometry(100, 100, 100),
        new THREE.MeshStandardMaterial({ color: 0xff8888 })
      );
    });
}

export function loadBlueprint() {
  console.log('[viewer.js] loadBlueprint called');

  const sbpFile = document.getElementById('sbp').files[0];
  const cfgFile = document.getElementById('sbpcfg').files[0];
  if (!sbpFile || !cfgFile) {
    alert('Please upload both .sbp and .sbpcfg files.');
    return;
  }

  const r1 = new FileReader(), r2 = new FileReader();
  let sbpBuf = null, cfgBuf = null;

  r1.onload = e => { sbpBuf = e.target.result; if (cfgBuf) parseAndRender(sbpBuf); };
  r2.onload = e => { cfgBuf = e.target.result; if (sbpBuf) parseAndRender(sbpBuf); };

  r1.readAsArrayBuffer(sbpFile);
  r2.readAsArrayBuffer(cfgFile);
}

async function parseAndRender(sbpBuffer) {
  const objects = parseBlueprint(sbpBuffer);
  console.log(`[viewer.js] Parsed ${objects.length} objects`);
  window.setProgress?.(0, objects.length);
  let loaded = 0;

  if (blueprintGroup) scene.remove(blueprintGroup);
  blueprintGroup = new THREE.Group();
  scene.add(blueprintGroup);

  for (const obj of objects) {
    const mesh = (await loadGLB(obj.typePath)).clone();
    mesh.position.set(obj.position.x, obj.position.y, obj.position.z);
    mesh.quaternion.set(obj.rotation.x, obj.rotation.y, obj.rotation.z, obj.rotation.w);
    blueprintGroup.add(mesh);
    loaded++;
    window.setProgress?.(loaded, objects.length);
  }

  updateSidebar(objects);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

window.onload = () => {
  initScene();
  animate();
};
