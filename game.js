// Phase 5 - Planet Gravity, Asteroid Fi
// Force update Phase 5
eld, and Crash States
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

// Scene, Camera, Renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000008); // Darker space

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(100, 100, 50);
scene.add(directionalLight);

// Physics World
const world = new CANNON.World();
world.gravity.set(0, 0, 0); 
const fixedTimeStep = 1/60;
let accumulator = 0;

// Game State
const gameState = {
    minerals: 0,
    fuel: 100,
    isCrashed: false,
    isLanded: false
};

// Starfield
function createStarfield() {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 5000;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) positions[i] = (Math.random() - 0.5) * 1500;
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 1.2 });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
}
createStarfield();

// Planet with Gravity
const planetRadius = 30;
const planetGeometry = new THREE.SphereGeometry(planetRadius, 64, 64);
const planetMaterial = new THREE.MeshStandardMaterial({
    color: 0x1133ff,
    roughness: 0.7,
    metalness: 0.3
});
const planet = new THREE.Mesh(planetGeometry, planetMaterial);
scene.add(planet);

const planetShape = new CANNON.Sphere(planetRadius);
const planetBody = new CANNON.Body({ mass: 0, shape: planetShape });
world.addBody(planetBody);

// Asteroid Field
const asteroids = [];
function createAsteroidField() {
    for (let i = 0; i < 40; i++) {
        const size = 1 + Math.random() * 3;
        const geo = new THREE.IcosahedronGeometry(size, 1);
        const mat = new THREE.MeshStandardMaterial({ color: 0x888888 });
        const mesh = new THREE.Mesh(geo, mat);
        
        // Random position in a shell around planet
        const dist = 60 + Math.random() * 100;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        mesh.position.set(
            dist * Math.sin(phi) * Math.cos(theta),
            dist * Math.sin(phi) * Math.sin(theta),
            dist * Math.cos(phi)
        );
        scene.add(mesh);
        
        const shape = new CANNON.Sphere(size);
        const body = new CANNON.Body({ mass: size * 10, shape: shape });
        body.position.copy(mesh.position);
        world.addBody(body);
        asteroids.push({ mesh, body });
    }
}
createAsteroidField();

// Ship
const shipGroup = new THREE.Group();
const shipBodyGeo = new THREE.CylinderGeometry(0.5, 0.8, 3, 16);
const shipBodyMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
const shipBodyMesh = new THREE.Mesh(shipBodyGeo, shipBodyMat);
shipGroup.add(shipBodyMesh);

const shipNoseGeo = new THREE.ConeGeometry(0.6, 1.5, 16);
const shipNoseMat = new THREE.MeshStandardMaterial({ color: 0xff3333 });
const shipNoseMesh = new THREE.Mesh(shipNoseGeo, shipNoseMat);
shipNoseMesh.position.y = 2.25;
shipGroup.add(shipNoseMesh);

const engineGeo = new THREE.CylinderGeometry(0.25, 0.35, 0.8, 12);
const engineMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.7 });
const engineMesh = new THREE.Mesh(engineGeo, engineMat);
engineMesh.position.y = -1.9;
shipGroup.add(engineMesh);

shipGroup.position.set(0, 0, 80);
scene.add(shipGroup);

const shipShape = new CANNON.Sphere(1.5);
const shipPhysicsBody = new CANNON.Body({
    mass: 5,
    shape: shipShape,
    linearDamping: 0.2,
    angularDamping: 0.5
});
shipPhysicsBody.position.set(0, 0, 80);
world.addBody(shipPhysicsBody);

// Controls
const keys = {};
window.addEventListener('keydown', (e) => keys[e.code] = true);
window.addEventListener('keyup', (e) => keys[e.code] = false);

let shipPitch = 0, shipYaw = 0;
const config = { thrust: 50, rotation: 2, gravity: 2000 };

// Collision Detection
shipPhysicsBody.addEventListener('collide', (e) => {
    const relativeVelocity = e.contact.getImpactVelocityAlongNormal();
    if (relativeVelocity > 10) {
        gameState.isCrashed = true;
        document.getElementById('status').innerText = 'CRASHED! Press R to Restart';
    } else if (e.body === planetBody) {
        gameState.isLanded = true;
    }
});

// HUD
const hud = document.createElement('div');
hud.style.position = 'absolute';
hud.style.top = '10px';
hud.style.left = '10px';
hud.style.color = 'white';
hud.style.fontFamily = 'monospace';
hud.innerHTML = `
    <div style="font-size: 20px;">Fuel: <span id="fuel">100</span>%</div>
    <div style="font-size: 20px;">Minerals: <span id="minerals">0</span>/10</div>
    <div id="status" style="font-size: 24px; color: red; margin-top: 10px;"></div>
`;
document.body.appendChild(hud);

// Animation
let lastTime = performance.now();
function animate() {
    requestAnimationFrame(animate);
    const time = performance.now();
    let dt = (time - lastTime) / 1000;
    lastTime = time;
    if (dt > 0.1) dt = 0.1;

    if (gameState.isCrashed) {
        if (keys['KeyR']) location.reload();
        return;
    }

    accumulator += dt;
    while (accumulator >= fixedTimeStep) {
        world.step(fixedTimeStep);
        accumulator -= fixedTimeStep;
    }

    // Gravity
    const distVec = new CANNON.Vec3();
    planetBody.position.vsub(shipPhysicsBody.position, distVec);
    const distSq = distVec.lengthSquared();
    const gravityForce = distVec.unit().scale(config.gravity * shipPhysicsBody.mass / distSq);
    shipPhysicsBody.applyForce(gravityForce, shipPhysicsBody.position);

    // Rotation
    if (keys['KeyW']) shipPitch += config.rotation * dt;
    if (keys['KeyS']) shipPitch -= config.rotation * dt;
    if (keys['KeyA']) shipYaw += config.rotation * dt;
    if (keys['KeyD']) shipYaw -= config.rotation * dt;

    const q = new CANNON.Quaternion();
    q.setFromEuler(shipPitch, shipYaw, Math.PI);
    shipPhysicsBody.quaternion.copy(q);

    // Thrust
    if (keys['Space'] && gameState.fuel > 0) {
        const force = new CANNON.Vec3(0, 1, 0);
        shipPhysicsBody.quaternion.vmult(force, force);
        shipPhysicsBody.applyForce(force.scale(config.thrust), shipPhysicsBody.position);
        gameState.fuel -= 5 * dt;
        document.getElementById('fuel').innerText = Math.max(0, Math.floor(gameState.fuel));
        engineMesh.scale.set(1.5, 1.5, 1.5);
    } else {
        engineMesh.scale.set(1, 1, 1);
    }

    // Sync
    shipGroup.position.copy(shipPhysicsBody.position);
    shipGroup.quaternion.copy(shipPhysicsBody.quaternion);
    
    asteroids.forEach(a => {
        a.mesh.position.copy(a.body.position);
        a.mesh.quaternion.copy(a.body.quaternion);
    });

    // Camera
    const offset = new THREE.Vector3(0, -12, -20).applyQuaternion(shipGroup.quaternion);
    camera.position.copy(shipGroup.position).add(offset);
    camera.lookAt(shipGroup.position);

    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
