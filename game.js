// Phase 2 - Space environment with planet, starfield, and ship
import * as THREE from 'three';

// Scene, Camera, Renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000011);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 30, 70);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting - Enhanced for space feel
const ambientLight = new THREE.AmbientLight(0x202040, 0.3);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
directionalLight.position.set(50, 60, 30);
scene.add(directionalLight);

// Starfield Background
function createStarfield() {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 3000;
    const positions = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 800;
        positions[i + 1] = (Math.random() - 0.5) * 800;
        positions[i + 2] = (Math.random() - 0.5) * 800;
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.8,
        sizeAttenuation: true
    });
    
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
    return stars;
}

const starfield = createStarfield();

// Planet - Sphere at origin with proper scale
const planetGeometry = new THREE.SphereGeometry(20, 64, 64);
const planetMaterial = new THREE.MeshStandardMaterial({
    color: 0x3366aa,
    roughness: 0.7,
    metalness: 0.2
});
const planet = new THREE.Mesh(planetGeometry, planetMaterial);
planet.position.set(0, 0, 0);
scene.add(planet);

// Ship Placeholder - Simple geometric ship
function createShip() {
    const shipGroup = new THREE.Group();
    
    // Main body
    const bodyGeometry = new THREE.CylinderGeometry(0.8, 1.2, 4, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        metalness: 0.7,
        roughness: 0.3
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = Math.PI / 2;
    shipGroup.add(body);
    
    // Nose cone
    const noseGeometry = new THREE.ConeGeometry(0.8, 2, 8);
    const noseMaterial = new THREE.MeshStandardMaterial({
        color: 0xff5533,
        metalness: 0.6,
        roughness: 0.4
    });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.rotation.x = Math.PI / 2;
    nose.position.z = 3;
    shipGroup.add(nose);
    
    // Engine glow
    const engineGeometry = new THREE.CylinderGeometry(0.5, 0.6, 1, 8);
    const engineMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.8
    });
    const engine = new THREE.Mesh(engineGeometry, engineMaterial);
    engine.rotation.x = Math.PI / 2;
    engine.position.z = -2.5;
    shipGroup.add(engine);
    
    return shipGroup;
}

const ship = createShip();
ship.position.set(0, 25, 40);
ship.rotation.x = -0.3;
scene.add(ship);

// HUD Elements
const fuelFillEl = document.getElementById('fuel-fill');
const mineralsEl = document.getElementById('minerals');
const statusTextEl = document.getElementById('status-text');

// Update HUD
function updateHUD() {
    fuelFillEl.style.width = '100%';
    mineralsEl.textContent = 'Minerals: 0/10';
    statusTextEl.textContent = 'Phase 2 - Space Environment Ready';
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
    
    // Slow planet rotation
    planet.rotation.y += 0.002;
    
    // Subtle starfield rotation
    starfield.rotation.y += 0.0001;
    
    // Gentle ship bobbing
    ship.position.y = 25 + Math.sin(Date.now() * 0.001) * 0.5;
    
    updateHUD();
    renderer.render(scene, camera);
}

animate();
