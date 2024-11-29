import * as THREE from 'three';

export const fogParticles = () => {
    const fogParticles = new THREE.Group();
    const fogParticleCount = 2000;
    const fogGeometry = new THREE.SphereGeometry(30, 30, 30);
    const fogWallGeometry = new THREE.BoxGeometry(300, 200, 100);
    const fogWallMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1,
    });
    
    const fogMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.6,
    });


    var particles = new THREE.Mesh(fogWallGeometry, fogWallMaterial);
        
    particles.position.set(
        -35, -10, -35
    );
    
    fogParticles.add(particles);


    for (let i = 0; i < fogParticleCount; i++) {
        particles = new THREE.Mesh(fogGeometry, fogMaterial);
        
        particles.position.set(
            Math.random() * 2800, // x range
            Math.random() * 200, // y range
            Math.random() * 200  // z range
        );
        
        fogParticles.add(particles);
    }

    fogParticles.position.set(-1200,-10, -500); // Adjust position as needed

    return fogParticles;
}