import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Game state
const gameState = {
    fuel: 100,
    minerals: 0,
    maxFuel: 100,
    mineralsNeeded: 10,
    fuelConsumptionRate: 0.05,
    boostConsumptionRate: 0.15
};

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000011);
scene.fog = new THREE.FogExp2(0x000011, 0.0015);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(50, 50, 50);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

const pointLight = new THREE.PointLight(0x00ffff, 2, 50);
scene.add(pointLight);

// Create spaceship
const spaceshipGroup = new THREE.Group();

const bodyGeometry = new THREE.ConeGeometry(0.5, 2, 8);
const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x00aaff, shininess: 100 });
const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
body.rotation.x = Math.PI;
body.castShadow = true;
spaceshipGroup.add(body);

const cockpitGeometry = new THREE.SphereGeometry(0.3, 16, 16);
const cockpitMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x88ccff, 
    transparent: true, 
    opacity: 0.7,
    emissive: 0x004488
});
const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
cockpit.position.y = -0.5;
cockpit.castShadow = true;
spaceshipGroup.add(cockpit);

// Wings
const wingGeometry = new THREE.BoxGeometry(2, 0.1, 0.8);
const wingMaterial = new THREE.MeshPhongMaterial({ color: 0x0088cc });
const wings = new THREE.Mesh(wingGeometry, wingMaterial);
wings.position.y = 0.3;
wings.castShadow = true;
spaceshipGroup.add(wings);

// Engine glow
const engineGeometry = new THREE.CylinderGeometry(0.2, 0.3, 0.5, 8);
const engineMaterial = new THREE.MeshBasicMaterial({ color: 0xff6600, emissive: 0xff6600 });
const engine = new THREE.Mesh(engineGeometry, engineMaterial);
engine.position.y = 1.2;
spaceshipGroup.add(engine);

scene.add(spaceshipGroup);
pointLight.position.copy(spaceshipGroup.position);

// Create stars
const starsGeometry = new THREE.BufferGeometry();
const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
const starsVertices = [];
for (let i = 0; i < 10000; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;
    starsVertices.push(x, y, z);
}
starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
const stars = new THREE.Points(starsGeometry, starsMaterial);
scene.add(stars);

// Create asteroids with minerals
const asteroids = [];
function createAsteroid(x, y, z) {
    const size = Math.random() * 2 + 1;
    const geometry = new THREE.DodecahedronGeometry(size, 0);
    const material = new THREE.MeshPhongMaterial({ 
        color: 0x888888,
        flatShading: true
    });
    const asteroid = new THREE.Mesh(geometry, material);
    asteroid.position.set(x, y, z);
    asteroid.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    asteroid.castShadow = true;
    asteroid.receiveShadow = true;
    
    // Add glowing mineral
    const mineralGeometry = new THREE.OctahedronGeometry(size * 0.3, 0);
    const mineralMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffdd00,
        emissive: 0xffdd00
    });
    const mineral = new THREE.Mesh(mineralGeometry, mineralMaterial);
    mineral.position.y = size * 0.8;
    asteroid.add(mineral);
    
    asteroid.userData = { 
        hasMineral: true,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        mineral: mineral
    };
    
    asteroids.push(asteroid);
    scene.add(asteroid);
    return asteroid;
}

// Spawn asteroids
for (let i = 0; i < 15; i++) {
    const x = (Math.random() - 0.5) * 100;
    const y = (Math.random() - 0.5) * 100;
    const z = (Math.random() - 0.5) * 100;
    if (Math.sqrt(x*x + y*y + z*z) > 10) {
        createAsteroid(x, y, z);
    }
}

// Create planets
function createPlanet(x, y, z, size, color) {
    const geometry = new THREE.SphereGeometry(size, 32, 32);
    const material = new THREE.MeshPhongMaterial({ color: color });
    const planet = new THREE.Mesh(geometry, material);
    planet.position.set(x, y, z);
    planet.castShadow = true;
    planet.receiveShadow = true;
    scene.add(planet);
    
    // Add atmosphere
    const atmosphereGeometry = new THREE.SphereGeometry(size * 1.1, 32, 32);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({ 
        color: color,
        transparent: true,
        opacity: 0.2
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    planet.add(atmosphere);
    
    return planet;
}

createPlanet(-50, 20, -80, 8, 0x8844ff);
createPlanet(60, -30, 100, 10, 0xff4444);
createPlanet(-70, 50, 60, 6, 0x44ff44);

// Camera setup
camera.position.set(0, 5, 15);
camera.lookAt(spaceshipGroup.position);

// Controls
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
});
window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Spaceship movement
const velocity = new THREE.Vector3();
const acceleration = 0.1;
const maxSpeed = 0.5;
const drag = 0.98;

// UI Elements
const fuelFill = document.getElementById('fuel-fill');
const mineralsCount = document.getElementById('minerals-count');
const statusText = document.getElementById('status-text');

function updateHUD() {
    fuelFill.style.width = `${(gameState.fuel / gameState.maxFuel) * 100}%`;
    mineralsCount.textContent = gameState.minerals;
    
    if (gameState.minerals >= gameState.mineralsNeeded) {
        statusText.textContent = '🎉 Mission Complete! You collected all minerals!';
        statusText.style.color = '#00ff00';
    } else if (gameState.fuel <= 0) {
        statusText.textContent = '⚠️ Out of fuel! Game Over';
        statusText.style.color = '#ff0000';
    } else if (gameState.fuel < 20) {
        statusText.textContent = '⚠️ Fuel low! Collect minerals quickly!';
        statusText.style.color = '#ff6600';
    } else {
        statusText.textContent = 'Collect 10 minerals.';
        statusText.style.color = '#00ffff';
    }
}

function checkAsteroidCollision() {
    const shipPos = spaceshipGroup.position;
    
    for (let i = asteroids.length - 1; i >= 0; i--) {
        const asteroid = asteroids[i];
        if (!asteroid.userData.hasMineral) continue;
        
        const distance = shipPos.distanceTo(asteroid.position);
        
        if (distance < 3) {
            // Collect mineral
            gameState.minerals++;
            asteroid.userData.hasMineral = false;
            scene.remove(asteroid.userData.mineral);
            asteroids.splice(i, 1);
            scene.remove(asteroid);
            
            // Visual feedback
            const flash = new THREE.PointLight(0xffff00, 5, 20);
            flash.position.copy(asteroid.position);
            scene.add(flash);
            setTimeout(() => scene.remove(flash), 100);
            
            updateHUD();
        }
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Game over conditions
    if (gameState.fuel <= 0 || gameState.minerals >= gameState.mineralsNeeded) {
        renderer.render(scene, camera);
        return;
    }
    
    // Spaceship controls
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(spaceshipGroup.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(spaceshipGroup.quaternion);
    const up = new THREE.Vector3(0, 1, 0);
    
    let isMoving = false;
    let isBoosting = false;
    
    if (keys['w']) {
        velocity.add(forward.multiplyScalar(acceleration));
        isMoving = true;
    }
    if (keys['s']) {
        velocity.add(forward.multiplyScalar(-acceleration * 0.5));
        isMoving = true;
    }
    if (keys['a']) {
        spaceshipGroup.rotation.y += 0.05;
    }
    if (keys['d']) {
        spaceshipGroup.rotation.y -= 0.05;
    }
    if (keys[' ']) {
        velocity.add(forward.multiplyScalar(acceleration * 2));
        isMoving = true;
        isBoosting = true;
        engine.material.emissive.setHex(0xffff00);
        engine.scale.y = 1.5;
    } else {
        engine.material.emissive.setHex(0xff6600);
        engine.scale.y = 1;
    }
    
    // Consume fuel
    if (isMoving) {
        if (isBoosting) {
            gameState.fuel -= gameState.boostConsumptionRate;
        } else {
            gameState.fuel -= gameState.fuelConsumptionRate;
        }
        gameState.fuel = Math.max(0, gameState.fuel);
        updateHUD();
    }
    
    // Limit velocity
    if (velocity.length() > maxSpeed) {
        velocity.setLength(maxSpeed);
    }
    
    // Apply velocity and drag
    velocity.multiplyScalar(drag);
    spaceshipGroup.position.add(velocity);
    
    // Update camera
    const cameraOffset = new THREE.Vector3(0, 5, 15);
    cameraOffset.applyQuaternion(spaceshipGroup.quaternion);
    camera.position.copy(spaceshipGroup.position).add(cameraOffset);
    camera.lookAt(spaceshipGroup.position);
    
    // Update point light
    pointLight.position.copy(spaceshipGroup.position);
    
    // Rotate asteroids
    asteroids.forEach(asteroid => {
        asteroid.rotation.x += asteroid.userData.rotationSpeed;
        asteroid.rotation.y += asteroid.userData.rotationSpeed * 0.7;
        
        // Rotate mineral
        if (asteroid.userData.hasMineral && asteroid.userData.mineral) {
            asteroid.userData.mineral.rotation.y += 0.05;
        }
    });
    
    // Check collisions
    checkAsteroidCollision();
    
    // Rotate stars slowly
    stars.rotation.y += 0.0001;
    
    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start game
updateHUD();
animate();
