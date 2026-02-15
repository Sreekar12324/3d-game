// Phase 3 - Physics engine basics with Cannon-es
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

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

// Ship placeholder (visual only, no physics yet)
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

shipGroup.position.set(0, 35, 40);
scene.add(shipGroup);

// TEST ASTEROID with physics (Phase 3 focus)
const testAsteroidGeometry = new THREE.IcosahedronGeometry(2, 1);
const testAsteroidMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x888888,
    roughness: 1.0,
    metalness: 0.0
});
const testAsteroid = new THREE.Mesh(testAsteroidGeometry, testAsteroidMaterial);
scene.add(testAsteroid);

// Test asteroid physics body (dynamic)
const testAsteroidShape = new CANNON.Sphere(2);
const testAsteroidBody = new CANNON.Body({ 
    mass: 5, 
    shape: testAsteroidShape,
    linearDamping: 0.05,
    angularDamping: 0.1
});
testAsteroidBody.position.set(30, 20, 10);
testAsteroidBody.velocity.set(-2, 1, -0.5); // Initial drift velocity
testAsteroidBody.angularVelocity.set(0.5, 0.3, 0.2); // Initial spin
world.addBody(testAsteroidBody);

// Clock for delta time
const clock = new THREE.Clock();

// Animation variables
let planetRotation = 0;
let starfieldRotation = 0;
let shipBob = 0;

// HUD elements
const fuelFill = document.getElementById('fuel-fill');
const mineralsCount = document.getElementById('minerals-count');
const statusText = document.getElementById('status-text');

// Update status for Phase 3
statusText.textContent = 'Phase 3: Physics test asteroid drifting (top right)';

function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    accumulator += delta;
    
    // Fixed timestep physics updates
    while (accumulator >= fixedTimeStep) {
        world.step(fixedTimeStep);
        accumulator -= fixedTimeStep;
    }
    
    // Sync test asteroid mesh from physics body
    testAsteroid.position.copy(testAsteroidBody.position);
    testAsteroid.quaternion.copy(testAsteroidBody.quaternion);
    
    // Planet slow rotation (visual only)
    planetRotation += 0.002;
    planet.rotation.y = planetRotation;
    
    // Starfield subtle rotation
    starfieldRotation += 0.0001;
    starfield.rotation.y = starfieldRotation;
    
    // Ship gentle bobbing (visual only)
    shipBob += delta;
    shipGroup.position.y = 35 + Math.sin(shipBob * 0.5) * 0.3;
    
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
