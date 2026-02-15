// Phase 5 - Planet Gravity, Asteroids, and Mining Logic
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000005);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);
const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
sunLight.position.set(100, 100, 50);
scene.add(sunLight);

// Physics setup
const world = new CANNON.World();
world.gravity.set(0, 0, 0);

// Game variables
const gameState = { fuel: 100, minerals: 0, crashed: false };
const keys = {};
window.addEventListener('keydown', (e) => keys[e.code] = true);
window.addEventListener('keyup', (e) => keys[e.code] = false);

// HUD targeting
const fuelFill = document.getElementById('fuel-fill');
const mineralsCount = document.getElementById('minerals-count');
const statusText = document.getElementById('status-text');

// Starfield
const starGeo = new THREE.BufferGeometry();
const starPos = new Float32Array(6000 * 3);
for(let i=0; i<18000; i++) starPos[i] = (Math.random()-0.5)*1500;
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({color: 0xffffff, size: 1})));

// Planet
const planetRadius = 40;
const planet = new THREE.Mesh(
    new THREE.SphereGeometry(planetRadius, 64, 64),
    new THREE.MeshStandardMaterial({ color: 0x2244ff, roughness: 0.8 })
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
        new THREE.MeshStandardMaterial({ color: 0x888888 })
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

// Ship
const shipGroup = new THREE.Group();
const bodyMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 3, 16), new THREE.MeshStandardMaterial({color:0xaaaaaa}));
bodyMesh.rotation.x = Math.PI / 2;
shipGroup.add(bodyMesh);
const nose = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.5, 16), new THREE.MeshStandardMaterial({color:0xff0000}));
nose.position.z = 2.25;
nose.rotation.x = Math.PI / 2;
shipGroup.add(nose);
const engine = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.5), new THREE.MeshBasicMaterial({color:0x00ffff}));
engine.position.z = -1.75;
engine.rotation.x = Math.PI / 2;
shipGroup.add(engine);
scene.add(shipGroup);

const shipBody = new CANNON.Body({
    mass: 5,
    shape: new CANNON.Sphere(1.5),
    linearDamping: 0.1,
    angularDamping: 0.5
});
shipBody.position.set(0, 0, 100);
world.addBody(shipBody);

shipBody.addEventListener('collide', (e) => {
    const v = e.contact.getImpactVelocityAlongNormal();
    const otherBody = e.body === shipBody ? e.target : e.body;
    
    if (v > 8) {
        gameState.crashed = true;
        statusText.innerText = \"CRASHED! Press R to reload.\";
        statusText.style.color = \"red\";
    } else if (otherBody.isAsteroid && v < 5) {
        const index = asteroids.findIndex(a => a.body === otherBody);
        if (index !== -1) {
            scene.remove(asteroids[index].mesh);
            world.removeBody(asteroids[index].body);
            asteroids.splice(index, 1);
            gameState.minerals++;
            if (mineralsCount) mineralsCount.innerText = \"Minerals: \" + gameState.minerals + \" / 10\";
            
            if (gameState.minerals >= 10) {
                statusText.innerText = \"MISSION COMPLETE! 10 Minerals Collected.\";
                statusText.style.color = \"#00ff00\";
            }
        }
    }
});

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
    const forceMag = (2000 * shipBody.mass) / d2;
    const force = diff.clone();
    force.normalize();
    force.scale(forceMag, force);
    shipBody.applyForce(force, shipBody.position);

    // Input
    if (keys['KeyW']) pitch += 2 * dt;
    if (keys['KeyS']) pitch -= 2 * dt;
    if (keys['KeyA']) yaw += 2 * dt;
    if (keys['KeyD']) yaw -= 2 * dt;

    const q = new CANNON.Quaternion();
    q.setFromEuler(pitch, yaw, 0);
    shipBody.quaternion.copy(q);

    if (keys['Space'] && gameState.fuel > 0) {
        const dir = new CANNON.Vec3(0, 0, 1);
        shipBody.quaternion.vmult(dir, dir);
        shipBody.applyForce(dir.scale(60), shipBody.position);
        gameState.fuel -= 10 * dt;
        engine.scale.set(1.5, 1.5, 1.5);
    } else {
        engine.scale.set(1, 1, 1);
    }

    // Sync
    shipGroup.position.copy(shipBody.position);
    shipGroup.quaternion.copy(shipBody.quaternion);
    asteroids.forEach(a => {
        a.mesh.position.copy(a.body.position);
        a.mesh.quaternion.copy(a.body.quaternion);
    });

    // HUD
    if (fuelFill) fuelFill.style.width = gameState.fuel + \"%\";
    
    // Camera
    const camOffset = new THREE.Vector3(0, 8, -20).applyQuaternion(shipGroup.quaternion);
    camera.position.copy(shipGroup.position).add(camOffset);
    camera.lookAt(shipGroup.position);

    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
