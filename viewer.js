let scene, camera, renderer, controls;
function initScene() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 10000);
  renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  camera.position.set(0, 300, 800);
  const light = new THREE.HemisphereLight(0xffffff, 0x444444);
  scene.add(light);
}
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
function loadBlueprint() {
  const sbpFile = document.getElementById('sbp').files[0];
  const cfgFile = document.getElementById('sbpcfg').files[0];
  if (!sbpFile || !cfgFile) {
    alert('Please upload both files.');
    return;
  }
  const reader1 = new FileReader(), reader2 = new FileReader();
  let sbpBuf = null, cfgBuf = null;
  reader1.onload = (e) => { sbpBuf = e.target.result; if (cfgBuf) showMock(); };
  reader2.onload = (e) => { cfgBuf = e.target.result; if (sbpBuf) showMock(); };
  reader1.readAsArrayBuffer(sbpFile);
  reader2.readAsArrayBuffer(cfgFile);
}
function showMock() {
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(100,100,100),
    new THREE.MeshStandardMaterial({color:0x66ccff})
  );
  scene.add(box);
}
window.onload = () => {
  initScene();
  animate();
};
