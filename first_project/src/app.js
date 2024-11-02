import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Water } from 'three/addons/objects/Water.js';
import { Sky } from 'three/addons/objects/Sky.js';

let container, stats;
let water, sun, mesh;
let moveForward = false, moveBackward = false, rotateLeft = false, rotateRight = false;

const maxSpeed = 1;
const acceleration = 0.005;
let speed = 0;
let direction = new THREE.Vector3(0, 0, 1); 

const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Camera setup
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let cameraX = -50;
let cameraY = 50;
let cameraZ = 50;


// Boat setup
let boat;
loadModel('./models/fishing_boat_asset.glb', { x: 0, y: -0.5, z: 0 }).then(loadedBoat => {
    boat = loadedBoat;
});

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);


function loadModel(url, position) {
    const loader = new GLTFLoader();
    return new Promise((resolve, reject) => {
        loader.load(url, (gltf) => {
            gltf.scene.position.set(position.x, position.y, position.z);
            scene.add(gltf.scene);
            resolve(gltf.scene);
        }, undefined, reject);
    });
}

function onKeyDown(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            rotateLeft = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            rotateRight = true;
            break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            rotateLeft = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            rotateRight = false;
            break;
    }
}



// const controls = new OrbitControls(camera, renderer.domElement);
// controls.enableDamping = true;
// controls.dampingFactor = 0.25;
// controls.screenSpacePanning = false;
// controls.maxPolarAngle = Math.PI / 2;


sun = new THREE.Vector3();
const sky = new Sky();
sky.scale.setScalar( 10000 );
scene.add( sky );

const skyUniforms = sky.material.uniforms;

skyUniforms[ 'turbidity' ].value = 10;
skyUniforms[ 'rayleigh' ].value = 2;
skyUniforms[ 'mieCoefficient' ].value = 0.005;
skyUniforms[ 'mieDirectionalG' ].value = 0.8;





const waterGeometry = new THREE.PlaneGeometry( 10000, 10000 );

water = new Water(
    waterGeometry,
    {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: new THREE.TextureLoader().load( 'textures/waternormals.jpg', function ( texture ) {

            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

        } ),
        sunDirection: new THREE.Vector3(),
        sunColor: 0xffffff,
        waterColor: 0x001e0f,
        distortionScale: 3.7,
        fog: scene.fog !== undefined
    }
);

water.rotation.x = - Math.PI / 2;

scene.add( water );






const pmremGenerator = new THREE.PMREMGenerator(renderer);
const sceneEnv = new THREE.Scene();
let renderTarget;

// Set static values for the sun's position
const phi = THREE.MathUtils.degToRad(90 - 10); 
const theta = THREE.MathUtils.degToRad(180);

const sunPosition = new THREE.Vector3().setFromSphericalCoords(1, phi, theta);

sky.material.uniforms['sunPosition'].value.copy(sunPosition);
water.material.uniforms['sunDirection'].value.copy(sunPosition).normalize();

sceneEnv.add(sky);
renderTarget = pmremGenerator.fromScene(sceneEnv);
scene.add(sky);
scene.environment = renderTarget.texture;







const animate = function () {
    requestAnimationFrame(animate);

    if (boat) {
        // Rotation control
        if (rotateLeft) boat.rotation.y += 0.03;
        if (rotateRight) boat.rotation.y -= 0.03;

        // Update direction based on current rotation
        direction.set(Math.sin(boat.rotation.y), 0, Math.cos(boat.rotation.y)).normalize();

        // Acceleration control
        if (moveForward) {
            speed = Math.min(speed + acceleration, maxSpeed); // Accelerate forward to maxSpeed
        } else if (moveBackward) {
            speed = Math.max(speed - acceleration, -maxSpeed / 2); // Reverse at half max speed
        } else {
            // Gradual deceleration
            speed *= 0.98;
            if (Math.abs(speed) < 0.001) speed = 0; // Stop if speed is very low
        }

        // Update boat position based on direction and speed
        boat.position.add(direction.clone().multiplyScalar(-speed));

        // Camera follows boat's position but remains static relative to it
        camera.position.lerp(
            new THREE.Vector3(boat.position.x + cameraX, boat.position.y + cameraY, boat.position.z + cameraZ),
            0.1
        );
        camera.lookAt(boat.position);
    }

    renderer.render(scene, camera);
};

animate();
