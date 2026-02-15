// Phase 4 - Physics-driven ship with thrust and rotation controls
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

// Scene, Camera, Renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000011);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 30, 70);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting - Enhanced for space feel
const ambientLight = new THREE.AmbientLight(0x202040, 0.3);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
directionalLight.position.set(50, 60, 30);
scene.add(directionalLight);

// Physics World (Cannon-es)
const world = new CANNON.World();
world.gravity.set(0, 0, 0); // Zero gravity for space
world.broadphase = new CANNON.SAPBroadphase(world);
const fixedTimeStep = 1/60;
let accumulator = 0;

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
        size: 1.5,
        sizeAttenuation: true
    });
    
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
    return stars;
}

const starfield = createStarfield();

// Planet (visual + static physics body)
const planetGeometry = new THREE.SphereGeometry(20, 64, 64);
const planetMaterial = new THREE.MeshStandardMaterial({
    color: 0x2244aa,
    roughness: 0.8,
    metalness: 0.2
});
const planet = new THREE.Mesh(planetGeometry, planetMaterial);
planet.position.set(0, 0, 0);
scene.add(planet);

// Planet physics body (static)
const planetShape = new CANNON.Sphere(20);
const planetBody = new CANNON.Body({ mass: 0, shape: planetShape });
planetBody.position.set(0, 0, 0);
world.addBody(planetBody);

// Ship (NOW WITH PHYSICS)
const shipGroup = new THREE.Group();

const shipBodyGeometry = new THREE.CylinderGeometry(0.5, 0.8, 3, 16);
const shipBodyMaterial = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    roughness: 0.3,
    metalness: 0.7
});
const shipBody = new THREE.Mesh(shipBodyGeometry, shipBodyMaterial);
shipGroup.add(shipBody);

const shipNoseGeometry = new THREE.ConeGeometry(0.6, 1.5, 16);
const shipNoseMaterial = new THREE.MeshStandardMaterial({
    color: 0xff3333,
    roughness: 0.4,
    metalness: 0.6
});
const shipNose = new THREE.Mesh(shipNoseGeometry, shipNoseMaterial);
shipNose.position.y = 2.25;
shipGroup.add(shipNose);

const engineGeometry = new THREE.CylinderGeometry(0.25, 0.35, 0.8, 12);
const engineMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.7
});
const engine = new THREE.Mesh(engineGeometry, engineMaterial);
engine.position.y = -1.9;
shipGroup.add(engine);

// Position ship near planet
shipGroup.position.set(0, 35, 40);
shipGroup.rotation.z = Math.PI; // Point forward
scene.add(shipGroup);

// Ship physics body (dynamic!)
const shipShape = new CANNON.Sphere(1.5); // Approximate collider
const shipPhysicsBody = new CANNON.Body({
    mass: 5,
    shape: shipShape,
    linearDamping: 0.1,
    angularDamping: 0.3
});
shipPhysicsBody.position.set(0, 35, 40);
world.addBody(shipPhysicsBody);

// Ship control parameters
const shipControls = {
    rotationSpeed: 1.5,
    thrustForce: 40,
    boostMultiplier: 2.0
};

// Keyboard input tracking
const keys = {};
window.addEventListener('keydown', (e) => { keys[e.code] = true; });
window.addEventListener('keyup', (e) => { keys[e.code] = false; });

// Ship orientation (Euler angles)
let shipPitch = 0;
let shipYaw = 0;

// TEST ASTEROID with physics (keeping from Phase 3)
const testAsteroidGeometry = new THREE.IcosahedronGeometry(2, 1);
const testAsteroidMaterial = new THREE.MeshStandardMaterial({
    color: 0x888888,
    roughness: 0.9,
    metalness: 0.1
});
const testAsteroid = new THREE.Mesh(testAsteroidGeometry, testAsteroidMaterial);
testAsteroid.position.set(-15, 25, 20);
scene.add(testAsteroid);

const asteroidShape = new CANNON.Sphere(2);
const asteroidBody = new CANNON.Body({ mass: 0, shape: asteroidShape });
asteroidBody.position.set(-15, 25, 20);
world.addBody(asteroidBody);

// HUD Elements
const hudDiv = document.createElement('div');
hudDiv.style.position = 'absolute';
hudDiv.style.top = '20px';
hudDiv.style.right = '20px';
hudDiv.style.color = 'yellow';
hudDiv.style.fontFamily = 'monospace';
hudDiv.style.fontSize = '24px';
hudDiv.style.border = '2px solid yellow';
hudDiv.style.padding = '10px';
hudDiv.style.borderRadius = '10px';
hudDiv.innerHTML = 'Minerals: 0 / 10';
document.body.appendChild(hudDiv);

const fuelDiv = document.createElement('div');
fuelDiv.style.position = 'absolute';
fuelDiv.style.top = '20px';
fuelDiv.style.left = '20px';
fuelDiv.style.color = 'cyan';
fuelDiv.style.fontFamily = 'monospace';
fuelDiv.style.fontSize = '20px';
fuelDiv.style.border = '2px solid cyan';
fuelDiv.style.padding = '10px';
fuelDiv.style.borderRadius = '10px';
fuelDiv.innerHTML = '<div>Fuel</div><div id="fuelBar" style="width:200px;height:20px;background:linear-gradient(to right, red, yellow, lime);border:2px solid white;margin-top:5px;"></div>';
document.body.appendChild(fuelDiv);

const instructionsDiv = document.createElement('div');
instructionsDiv.style.position = 'absolute';
instructionsDiv.style.bottom = '20px';
instructionsDiv.style.left = '50%';
instructionsDiv.style.transform = 'translateX(-50%)';
instructionsDiv.style.color = 'cyan';
instructionsDiv.style.fontFamily = 'monospace';
instructionsDiv.style.fontSize = '18px';
instructionsDiv.style.border = '2px solid cyan';
instructionsDiv.style.padding = '15px';
instructionsDiv.style.borderRadius = '10px';
instructionsDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
instructionsDiv.style.textAlign = 'center';
instructionsDiv.innerHTML = 'WASD = rotate, Space = thrust, Shift = boost';
document.body.appendChild(instructionsDiv);

// Animation Loop
let lastTime = performance.now();

function animate() {
    requestAnimationFrame(animate);
    
    const currentTime = performance.now();
    let deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    // Limit deltaTime to prevent physics explosions
    if (deltaTime > 0.1) deltaTime = 0.1;
    
    // Fixed timestep physics
    accumulator += deltaTime;
    while (accumulator >= fixedTimeStep) {
        world.step(fixedTimeStep);
        accumulator -= fixedTimeStep;
    }
    
    // Handle ship rotation controls (A/D for yaw, W/S for pitch)
    if (keys['KeyA']) shipYaw += shipControls.rotationSpeed * deltaTime;
    if (keys['KeyD']) shipYaw -= shipControls.rotationSpeed * deltaTime;
    if (keys['KeyW']) shipPitch += shipControls.rotationSpeed * deltaTime;
    if (keys['KeyS']) shipPitch -= shipControls.rotationSpeed * deltaTime;
    
    // Clamp pitch to avoid flipping
    shipPitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, shipPitch));
    
    // Apply rotation to physics body using quaternion
    const quaternion = new CANNON.Quaternion();
    quaternion.setFromEuler(shipPitch, shipYaw, Math.PI);
    shipPhysicsBody.quaternion.copy(quaternion);
    
    // Handle thrust (Space = forward thrust)
    if (keys['Space']) {
        const thrustMagnitude = keys['ShiftLeft'] || keys['ShiftRight'] ? 
            shipControls.thrustForce * shipControls.boostMultiplier : 
            shipControls.thrustForce;
        
        // Calculate forward direction from ship's current rotation
        const forward = new CANNON.Vec3(0, 1, 0);
        shipPhysicsBody.quaternion.vmult(forward, forward);
        forward.scale(thrustMagnitude, forward);
        
        shipPhysicsBody.applyForce(forward, shipPhysicsBody.position);
        
        // Visual: Make engine glow brighter
        engine.material.opacity = 0.9;
        engine.scale.set(1.2, 1.2, 1.2);
    } else {
        engine.material.opacity = 0.7;
        engine.scale.set(1, 1, 1);
    }
    
    // Sync visual ship with physics body
    shipGroup.position.copy(shipPhysicsBody.position);
    shipGroup.quaternion.copy(shipPhysicsBody.quaternion);
    
    // Camera follows ship from behind
    const cameraOffset = new THREE.Vector3(0, -15, -25);
    cameraOffset.applyQuaternion(shipGroup.quaternion);
    camera.position.copy(shipGroup.position).add(cameraOffset);
    camera.lookAt(shipGroup.position);
    
    // Rotate planet slowly
    planet.rotation.y += 0.001;
    
    renderer.render(scene, camera);
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
