// Phase 1.2 - Minimal Three.js setup with rotating cube
import * as THREE from 'three';

// Scene, Camera, Renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000011);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 15;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Test object - rotating cube
const geometry = new THREE.BoxGeometry(5, 5, 5);
const material = new THREE.MeshStandardMaterial({ 
    color: 0x00ffff,
    metalness: 0.3,
    roughness: 0.4
});
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// HUD Elements
const fuelFillEl = document.getElementById('fuel-fill');
const mineralsEl = document.getElementById('minerals');
const statusTextEl = document.getElementById('status-text');

// Update HUD
function updateHUD() {
    fuelFillEl.style.width = '100%';
    mineralsEl.textContent = 'Minerals: 0/10';
    statusTextEl.textContent = 'Phase 1.2 - Basic Three.js Setup Complete';
}

// Resize handling
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Rotate cube to show it's 3D
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    
    updateHUD();
    renderer.render(scene, camera);
}

animate();
