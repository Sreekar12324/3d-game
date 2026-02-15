// Phase 6 - Polish & Game Feel Improvements
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

// ==== TUNABLE PHYSICS CONSTANTS ====
const PHYSICS = {
    normalThrust: 60,
    boostThrust: 120,
    rotationSpeed: 2,
    linearDamping: 0.1,
    angularDamping: 0.6,
    gravityStrength: 2000,
    fuelConsumption: 10,
    boostFuelConsumption: 20
};

const CAMERA = {
    normalDistance: 20,
    boostDistance: 25,
    normalFOV: 75,
    boostFOV: 85,
    lerpSpeed: 0.1,
    fovLerpSpeed: 0.05
};

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000005);
const camera = new THREE.PerspectiveCamera(CAMERA.normalFOV, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);
const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
sunLight.position.set(100, 100, 50);
scene.add(sunLight);

// Add rim light for ship
const rimLight = new THREE.DirectionalLight(0x4444ff, 0.8);
rimLight.position.set(-50, 0, -50);
scene.add(rimLight);

// Physics setup
const world = new CANNON.World();
world.gravity.set(0, 0, 0);

// Game variables
const gameState = { fuel: 100, minerals: 0, crashed: false };
const keys = {};
const inputState = { pitch: 0, yaw: 0, thrust: 0 }; // For smoothing

window.addEventListener('keydown', (e) => keys[e.code] = true);
window.addEventListener('keyup', (e) => keys[e.code] = false);

// HUD targeting
const fuelFill = document.getElementById('fuel-fill');
const mineralsCount = document.getElementById('minerals-count');
const statusText = document.getElementById('status-text');

// Start screen management
const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('start-button');
const hud = document.getElementById('hud');

// Initially hide HUD
if (hud) hud.style.display = 'none';

startButton.addEventListener('click', () => {
    startScreen.style.display = 'none';
    if (hud) hud.style.display = 'block';
});

// Starfield with depth
const starGeo = new THREE.BufferGeometry();
const starPos = new Float32Array(8000 * 3);
for(let i=0; i<24000; i++) starPos[i] = (Math.random()-0.5)*2000;
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({color: 0xffffff, size: 1.5})));

// Planet with improved materials
const planetRadius = 40;
const planet = new THREE.Mesh(
    new THREE.SphereGeometry(planetRadius, 64, 64),
    new THREE.MeshStandardMaterial({ 
        color: 0x2244ff, 
        roughness: 0.7,
        metalness: 0.2,
        emissive: 0x001133,
        emissiveIntensity: 0.2
    })
);
scene.add(planet);

const planetBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Sphere(planetRadius)
});
world.addBody(planetBody);

// Asteroids
const asteroids = [];
for (let i = 0; i < 60; i++) {
    const r = 1 + Math.random() * 3;
    const mesh = new THREE.Mesh(
        new THREE.IcosahedronGeometry(r, 1),
        new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 })
    );
    const dist = 80 + Math.random() * 150;
    const angle = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    mesh.position.set(
        dist * Math.sin(phi) * Math.cos(angle),
        dist * Math.sin(phi) * Math.sin(angle),
        dist * Math.cos(phi)
    );
    scene.add(mesh);
    
    const body = new CANNON.Body({ mass: 10, shape: new CANNON.Sphere(r) });
    body.position.copy(mesh.position);
    body.isAsteroid = true;
    world.addBody(body);
    asteroids.push({ mesh, body });
}

// Ship with better materials
const shipGroup = new THREE.Group();
const bodyMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.8, 3, 16), 
    new THREE.MeshStandardMaterial({color:0xcccccc, metalness: 0.6, roughness: 0.4})
);
bodyMesh.rotation.x = Math.PI / 2;
shipGroup.add(bodyMesh);

const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.6, 1.5, 16), 
    new THREE.MeshStandardMaterial({color:0xff3333, metalness: 0.7, roughness: 0.3})
);
nose.position.z = 2.25;
nose.rotation.x = Math.PI / 2;
shipGroup.add(nose);

const engine = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.4, 0.5), 
    new THREE.MeshBasicMaterial({color:0x00ffff})
);
engine.position.z = -1.75;
engine.rotation.x = Math.PI / 2;
shipGroup.add(engine);

scene.add(shipGroup);

const shipBody = new CANNON.Body({
    mass: 5,
    shape: new CANNON.Sphere(1.5),
    linearDamping: PHYSICS.linearDamping,
    angularDamping: PHYSICS.angularDamping
});
shipBody.position.set(0, 0, 100);
world.addBody(shipBody);

shipBody.addEventListener('collide', (e) => {
    const v = Math.abs(e.contact.getImpactVelocityAlongNormal());
    const otherBody = e.body === shipBody ? e.target : e.body;
    
    if (v > 8) {
        gameState.crashed = true;
        statusText.innerText = "CRASHED! Press R to reload.";
        statusText.style.color = "red";
    } else if (otherBody.isAsteroid && v < 5) {
        const index = asteroids.findIndex(a => a.body === otherBody);
        if (index !== -1) {
            scene.remove(asteroids[index].mesh);
            world.removeBody(asteroids[index].body);
            asteroids.splice(index, 1);
            gameState.minerals++;
            if (mineralsCount) mineralsCount.innerText = "Minerals: " + gameState.minerals + " / 10";
            
            if (gameState.minerals >= 10) {
                statusText.innerText = "MISSION COMPLETE! 10 Minerals Collected.";
                statusText.style.color = "#00ff00";
            }
        }
    }
});

// Camera state for smooth lerping
let targetCameraDistance = CAMERA.normalDistance;
let currentCameraDistance = CAMERA.normalDistance;
let targetFOV = CAMERA.normalFOV;
let currentFOV = CAMERA.normalFOV;

// Loop
let lastTime = performance.now();
let pitch = 0, yaw = 0;

function animate() {
    requestAnimationFrame(animate);
    const now = performance.now();
    let dt = (now - lastTime) / 1000;
    lastTime = now;
    if (dt > 0.1) dt = 0.1;
    
    if (gameState.crashed) {
        if (keys['KeyR']) location.reload();
        return;
    }
    
    world.step(1/60, dt);
    
    // Gravity
    const diff = new CANNON.Vec3();
    planetBody.position.vsub(shipBody.position, diff);
    const d2 = diff.lengthSquared();
    const forceMag = (PHYSICS.gravityStrength * shipBody.mass) / d2;
    const force = diff.clone();
    force.normalize();
    force.scale(forceMag, force);
    shipBody.applyForce(force, shipBody.position);
    
    // Input smoothing
    const targetPitchInput = (keys['KeyW'] ? 1 : 0) - (keys['KeyS'] ? 1 : 0);
    const targetYawInput = (keys['KeyA'] ? 1 : 0) - (keys['KeyD'] ? 1 : 0);
    const targetThrustInput = keys['Space'] ? 1 : 0;
    
    // Smooth ramp
    const rampSpeed = 8;
    inputState.pitch += (targetPitchInput - inputState.pitch) * rampSpeed * dt;
    inputState.yaw += (targetYawInput - inputState.yaw) * rampSpeed * dt;
    inputState.thrust += (targetThrustInput - inputState.thrust) * rampSpeed * dt;
    
    // Apply smoothed rotation
    pitch += inputState.pitch * PHYSICS.rotationSpeed * dt;
    yaw += inputState.yaw * PHYSICS.rotationSpeed * dt;
    
    const q = new CANNON.Quaternion();
    q.setFromEuler(pitch, yaw, 0);
    shipBody.quaternion.copy(q);
    
    // Boost mechanics with camera effects
    const isBoosting = keys['ShiftLeft'] || keys['ShiftRight'];
    
    if (keys['Space'] && gameState.fuel > 0) {
        const dir = new CANNON.Vec3(0, 0, 1);
        shipBody.quaternion.vmult(dir, dir);
        
        const thrustForce = isBoosting ? PHYSICS.boostThrust : PHYSICS.normalThrust;
        const fuelCost = isBoosting ? PHYSICS.boostFuelConsumption : PHYSICS.fuelConsumption;
        
        shipBody.applyForce(dir.scale(thrustForce * inputState.thrust), shipBody.position);
        gameState.fuel -= fuelCost * dt;
        
        engine.scale.set(1.5, 1.5, 1.5);
        
        // Camera boost effects
        if (isBoosting) {
            targetCameraDistance = CAMERA.boostDistance;
            targetFOV = CAMERA.boostFOV;
        } else {
            targetCameraDistance = CAMERA.normalDistance;
            targetFOV = CAMERA.normalFOV;
        }
    } else {
        engine.scale.set(1, 1, 1);
        targetCameraDistance = CAMERA.normalDistance;
        targetFOV = CAMERA.normalFOV;
    }
    
    // Smooth camera transitions
    currentCameraDistance += (targetCameraDistance - currentCameraDistance) * CAMERA.lerpSpeed;
    currentFOV += (targetFOV - currentFOV) * CAMERA.fovLerpSpeed;
    camera.fov = currentFOV;
    camera.updateProjectionMatrix();
    
    // Sync
    shipGroup.position.copy(shipBody.position);
    shipGroup.quaternion.copy(shipBody.quaternion);
    
    asteroids.forEach(a => {
        a.mesh.position.copy(a.body.position);
        a.mesh.quaternion.copy(a.body.quaternion);
    });
    
    // HUD
    if (fuelFill) fuelFill.style.width = Math.max(0, gameState.fuel) + "%";
    
    // Smooth camera follow
    const camOffset = new THREE.Vector3(0, 8, -currentCameraDistance).applyQuaternion(shipGroup.quaternion);
    const targetCamPos = new THREE.Vector3().copy(shipGroup.position).add(camOffset);
    camera.position.lerp(targetCamPos, CAMERA.lerpSpeed);
    camera.lookAt(shipGroup.position);
    
    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
