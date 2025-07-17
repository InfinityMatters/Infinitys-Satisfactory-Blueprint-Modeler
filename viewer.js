import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/loaders/GLTFLoader.js';
import { parseBlueprint } from './parser.js';

let scene, camera, renderer, controls, loader;
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
      console.warn(`⚠️ Missing model for ${key}`);
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
  for (const obj of objects) {
    const mesh = (await loadGLB(obj.typePath)).clone();
    mesh.position.set(obj.position.x, obj.position.y, obj.position.z);
    mesh.quaternion.set(obj.rotation.x, obj.rotation.y, obj.rotation.z, obj.rotation.w);
    scene.add(mesh);
  }
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
