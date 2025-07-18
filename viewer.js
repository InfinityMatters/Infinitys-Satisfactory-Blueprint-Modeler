// ✅ Browser-ready imports from CDN
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/loaders/GLTFLoader.js';
import { parseBlueprint } from './parser.js';

let scene, camera, renderer, controls, loader, blueprintGroup;
const modelCache = new Map();

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

  const grid = new THREE.GridHelper(5000, 50);
  scene.add(grid);

  loader = new GLTFLoader();
  blueprintGroup = new THREE.Group();
  scene.add(blueprintGroup);
}

function clearScene() {
  blueprintGroup.clear();
  const log = document.getElementById('log');
  if (log) log.innerHTML = '';
}

function updateSidebar(objects) {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  sidebar.innerHTML = `<button id="clearBtn">🗑 Clear Scene</button><h4>Blueprint Parts</h4><ul id="partList"></ul>`;

  document.getElementById('clearBtn').onclick = () => {
    if (confirm('Clear the scene?')) clearScene();
  };

  const list = document.getElementById('partList');
  const countByType = {};
  objects.forEach((obj, i) => {
    const type = obj.typePath.split('/').pop();
    countByType[type] = (countByType[type] || 0) + 1;

    const li = document.createElement('li');
    li.textContent = `${i + 1}: ${type}`;
    li.style.cursor = 'pointer';
    li.onclick = () => {
      const target = blueprintGroup.children[i];
      const box = new THREE.Box3().setFromObject(target);
      controls.target.copy(box.getCenter(new THREE.Vector3()));
    };
    list.appendChild(li);
  });

  const summary = document.createElement('div');
  summary.innerHTML = '<strong>🧩 Part Count:</strong><br>' + Object.entries(countByType).map(([k, v]) => `${k}: ${v}`).join('<br>');
  sidebar.insertBefore(summary, list);
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
  clearScene();
  const objects = parseBlueprint(sbpBuffer);
  window.setProgress?.(0, objects.length);

  let loaded = 0;
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
