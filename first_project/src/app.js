import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { fogParticles } from './fogParticles'
import { Water } from 'three/addons/objects/Water.js';
import { Sky } from 'three/addons/objects/Sky.js';
import CSS3DRenderer from './CSS3DRenderer';

let water, sun, mesh;
let moveForward = false, moveBackward = false, rotateLeft = false, rotateRight = false;


const pirateShipThresholdDistance = 500;
let popupVisible = false;


const maxSpeed = 3;
const acceleration = 0.025;
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
let cameraX = -70;
let cameraY = 70;
let cameraZ = 70;



// Scene Setup
let lighthouse;
loadModel('./models/low_poly_lighthouse.glb', { x: 1100, y: -120, z: -100 }).then(loadedLighthouse => {
    lighthouse = loadedLighthouse;
    lighthouse.rotation.y = Math.PI * 0.8;
    lighthouse.scale.set(0.5, 0.5, 0.5);
});

let longBeach;
loadModel('./models/long_beach.glb', { x: -1300, y: 9, z: 720 }).then(loadedLongBeach => {
    longBeach = loadedLongBeach;
    longBeach.scale.set(3, 3, 3);
});

let islandRuins;
loadModel('./models/island_ruins.glb', { x: 820, y: -6, z: 1000 }).then(loadedIslandRuins => {
    islandRuins = loadedIslandRuins;
    islandRuins.scale.set(10, 10, 10);
});


let pirateShip;
loadModel('./models/pirate_ship.glb', { x: 1100, y: 12, z: 300 }).then(loadedPirateShip => {
    pirateShip = loadedPirateShip;
    pirateShip.scale.set(0.03, 0.03, 0.03);
});




// Boat setup
let boat;
loadModel('./models/fishing_boat_asset.glb', { x: 0, y: -0.5, z: 0 }).then(loadedBoat => {
    boat = loadedBoat;
});

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);






const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.screenSpacePanning = false;
controls.maxPolarAngle = Math.PI / 2;


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



scene.add(fogParticles());





// Create the popup element
const popup = document.getElementById('popup');
const cssRenderer = new CSS3DRenderer(popup);
cssRenderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(cssRenderer.domElement);









function showPopup() {
    const popup = document.getElementById('popup');
    if (popup) {
        popup.style.visibility = '';
    }
}

function hidePopup() {
    const popup = document.getElementById('popup');
    if (popup) {
        popup.style.visibility = 'hidden';
    }
}





const bounds = {
    minX: -1000,
    maxX: 1000,
    minZ: -350,
    maxZ: 1000
};

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
            speed = Math.min(speed + acceleration, maxSpeed);
        } else if (moveBackward) {
            speed = Math.max(speed - acceleration, -maxSpeed / 2);
        } else {
            speed *= 0.95;
            if (Math.abs(speed) < 0.001) speed = 0;
        }

        const potentialNewPosition = boat.position.clone().add(direction.clone().multiplyScalar(-speed));

        if (
            potentialNewPosition.x >= bounds.minX &&
            potentialNewPosition.x <= bounds.maxX &&
            potentialNewPosition.z >= bounds.minZ &&
            potentialNewPosition.z <= bounds.maxZ
        ) {
            boat.position.copy(potentialNewPosition);
        } else {
            speed = 0;
            console.log('Reached boundary limit!');
        }

        // Camera follows boat's position but remains static relative to it
        camera.position.lerp(
            new THREE.Vector3(boat.position.x + cameraX, boat.position.y + cameraY, boat.position.z + cameraZ),
            0.1
        );
        camera.lookAt(boat.position);
    }


    if (pirateShip) {
        const distance = boat.position.distanceTo(pirateShip.position);

        if (distance < pirateShipThresholdDistance) {
            if (!popupVisible) {
                showPopup();
            }
        } else {
            if (popupVisible) {
                hidePopup();
            }
        }
    }

    renderer.render(scene, camera);
    cssRenderer.render(scene, camera);
};


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


animate();
