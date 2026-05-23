import * as THREE from 'three';

class SciFiEye {
    constructor(container) {
        this.container = container;
        this.mouse = new THREE.Vector2();
        this.targetRotation = new THREE.Vector2();
        this.currentRotation = new THREE.Vector2();

        this.init();
        this.createEye();
        this.addEventListeners();
        this.animate();
    }

    init() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x0d0d0f, 0.03);

        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        this.camera.position.z = 5;

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            canvas: document.getElementById('eye-canvas')
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
    }

    createEye() {
        this.eyeGroup = new THREE.Group();
        this.scene.add(this.eyeGroup);

        const irisTexture = this.createIrisTexture();
        const scleraTexture = this.createScleraTexture();

        // Sclera - darker, more ominous
        const scleraGeometry = new THREE.SphereGeometry(1.2, 64, 64);
        const scleraMaterial = new THREE.MeshPhysicalMaterial({
            map: scleraTexture,
            color: 0xc8c0b8,
            roughness: 0.4,
            metalness: 0.15,
            clearcoat: 0.6,
            clearcoatRoughness: 0.3,
        });
        this.sclera = new THREE.Mesh(scleraGeometry, scleraMaterial);
        this.sclera.scale.set(1, 0.85, 0.9);
        this.eyeGroup.add(this.sclera);

        // Iris - deeper crimson
        const irisGeometry = new THREE.SphereGeometry(0.65, 64, 64);
        const irisMaterial = new THREE.MeshPhysicalMaterial({
            map: irisTexture,
            color: 0x8b1a1a,
            roughness: 0.35,
            metalness: 0.4,
            emissive: 0x2a0808,
            emissiveIntensity: 0.4,
            clearcoat: 0.8,
            clearcoatRoughness: 0.15,
        });
        this.iris = new THREE.Mesh(irisGeometry, irisMaterial);
        this.iris.position.z = 0.85;
        this.eyeGroup.add(this.iris);

        // Pupil - deeper black
        const pupilGeometry = new THREE.SphereGeometry(0.32, 64, 64);
        const pupilMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x030303,
            roughness: 0.05,
            metalness: 0.9,
            clearcoat: 1.0,
        });
        this.pupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        this.pupil.position.z = 1.15;
        this.eyeGroup.add(this.pupil);

        // Inner glow ring - muted crimson
        const glowRingGeometry = new THREE.RingGeometry(0.30, 0.34, 64);
        const glowRingMaterial = new THREE.MeshBasicMaterial({
            color: 0xb83030,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide,
        });
        this.glowRing = new THREE.Mesh(glowRingGeometry, glowRingMaterial);
        this.glowRing.position.z = 1.16;
        this.eyeGroup.add(this.glowRing);

        // Cornea
        const corneaGeometry = new THREE.SphereGeometry(1.22, 64, 64);
        const corneaMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.12,
            roughness: 0.0,
            metalness: 0.0,
            transmission: 0.9,
            thickness: 0.5,
            ior: 1.4,
        });
        this.cornea = new THREE.Mesh(corneaGeometry, corneaMaterial);
        this.cornea.scale.set(1, 0.85, 0.9);
        this.eyeGroup.add(this.cornea);

        // Sci-fi ring around iris
        const ringGeometry = new THREE.TorusGeometry(0.75, 0.015, 16, 100);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xb83030,
            transparent: true,
            opacity: 0.7,
        });
        this.ring = new THREE.Mesh(ringGeometry, ringMaterial);
        this.ring.position.z = 0.9;
        this.eyeGroup.add(this.ring);

        // Outer sci-fi rings - darker tones
        const outerRing1Geometry = new THREE.TorusGeometry(1.0, 0.008, 16, 100);
        const outerRing1Material = new THREE.MeshBasicMaterial({
            color: 0x8b1a1a,
            transparent: true,
            opacity: 0.35,
        });
        this.outerRing1 = new THREE.Mesh(outerRing1Geometry, outerRing1Material);
        this.outerRing1.position.z = 0.7;
        this.eyeGroup.add(this.outerRing1);

        const outerRing2Geometry = new THREE.TorusGeometry(1.15, 0.005, 16, 100);
        const outerRing2Material = new THREE.MeshBasicMaterial({
            color: 0x5c3a3a,
            transparent: true,
            opacity: 0.25,
        });
        this.outerRing2 = new THREE.Mesh(outerRing2Geometry, outerRing2Material);
        this.outerRing2.position.z = 0.5;
        this.eyeGroup.add(this.outerRing2);

        // Tech lines on sclera
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const lineGeometry = new THREE.TorusGeometry(1.0, 0.003, 8, 50, Math.PI / 6);
            const lineMaterial = new THREE.MeshBasicMaterial({
                color: 0xb83030,
                transparent: true,
                opacity: 0.25,
            });
            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            line.rotation.z = angle;
            line.position.z = 0.75;
            this.eyeGroup.add(line);
        }

        // Lighting - darker, more atmospheric
        const ambientLight = new THREE.AmbientLight(0x303030, 0.4);
        this.scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0xc8c0b8, 1.2);
        mainLight.position.set(5, 5, 5);
        this.scene.add(mainLight);

        const redLight = new THREE.PointLight(0x8b1a1a, 1.5, 10);
        redLight.position.set(-3, 2, 3);
        this.scene.add(redLight);

        const coolLight = new THREE.PointLight(0x4a5060, 0.8, 10);
        coolLight.position.set(3, -2, 3);
        this.scene.add(coolLight);

        const rimLight = new THREE.SpotLight(0xb83030, 2);
        rimLight.position.set(0, 0, -5);
        rimLight.lookAt(0, 0, 0);
        this.scene.add(rimLight);

        this.createParticles();
    }

    createIrisTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        const centerX = 256;
        const centerY = 256;

        // Base gradient - deeper, more muted reds
        const gradient = ctx.createRadialGradient(centerX, centerY, 50, centerX, centerY, 256);
        gradient.addColorStop(0, '#0a0202');
        gradient.addColorStop(0.3, '#2a0808');
        gradient.addColorStop(0.5, '#5c1010');
        gradient.addColorStop(0.7, '#8b1a1a');
        gradient.addColorStop(0.9, '#a02020');
        gradient.addColorStop(1, '#5c0f0f');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);

        // Fibers - more organic, less bright
        for (let i = 0; i < 200; i++) {
            const angle = Math.random() * Math.PI * 2;
            const startRadius = 60 + Math.random() * 40;
            const endRadius = 200 + Math.random() * 50;

            ctx.beginPath();
            ctx.moveTo(
                centerX + Math.cos(angle) * startRadius,
                centerY + Math.sin(angle) * startRadius
            );
            ctx.lineTo(
                centerX + Math.cos(angle) * endRadius,
                centerY + Math.sin(angle) * endRadius
            );
            ctx.strokeStyle = `rgba(160, 40, 40, ${0.08 + Math.random() * 0.2})`;
            ctx.lineWidth = 1 + Math.random() * 2;
            ctx.stroke();
        }

        // Concentric rings
        for (let r = 80; r < 240; r += 8) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(139, 26, 26, ${0.04 + Math.random() * 0.08})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    createScleraTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Base - warmer off-white
        ctx.fillStyle = '#d8d0c8';
        ctx.fillRect(0, 0, 512, 512);

        // Subtle veins - darker red
        for (let i = 0; i < 30; i++) {
            const startX = Math.random() * 512;
            const startY = Math.random() * 512;

            ctx.beginPath();
            ctx.moveTo(startX, startY);

            let x = startX;
            let y = startY;
            for (let j = 0; j < 5; j++) {
                x += (Math.random() - 0.5) * 80;
                y += (Math.random() - 0.5) * 80;
                ctx.lineTo(x, y);
            }

            ctx.strokeStyle = `rgba(120, 30, 30, ${0.02 + Math.random() * 0.04})`;
            ctx.lineWidth = 1 + Math.random();
            ctx.stroke();
        }

        // Tech pattern overlay
        ctx.strokeStyle = 'rgba(139, 26, 26, 0.03)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 512; i += 16) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, 512);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(512, i);
            ctx.stroke();
        }

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    createParticles() {
        const particleCount = 80;
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 8;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
        }

        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const particleMaterial = new THREE.PointsMaterial({
            color: 0xb83030,
            size: 0.018,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending,
        });

        this.particles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(this.particles);
    }

    addEventListeners() {
        window.addEventListener('mousemove', (e) => {
            const rect = this.container.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            this.mouse.x = Math.max(-1, Math.min(1, x));
            this.mouse.y = Math.max(-1, Math.min(1, y));
        });

        window.addEventListener('resize', () => {
            const width = this.container.clientWidth;
            const height = this.container.clientHeight;

            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const time = Date.now() * 0.001;

        // Smooth rotation towards mouse
        this.targetRotation.x = this.mouse.y * 0.5;
        this.targetRotation.y = this.mouse.x * 0.5;

        this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * 0.05;
        this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * 0.05;

        // Rotate eye group
        this.eyeGroup.rotation.x = this.currentRotation.x;
        this.eyeGroup.rotation.y = this.currentRotation.y;

        // Subtle idle animation
        this.eyeGroup.rotation.z = Math.sin(time * 0.5) * 0.02;

        // Animate rings
        this.ring.rotation.z = time * 0.3;
        this.outerRing1.rotation.z = -time * 0.2;
        this.outerRing2.rotation.z = time * 0.15;

        // Pulse glow ring
        this.glowRing.material.opacity = 0.3 + Math.sin(time * 2) * 0.15;

        // Animate particles
        if (this.particles) {
            this.particles.rotation.y = time * 0.05;
            this.particles.rotation.x = time * 0.03;
        }

        // Subtle pupil dilation
        const dilation = 0.32 + Math.sin(time * 0.8) * 0.02;
        this.pupil.scale.setScalar(dilation / 0.32);

        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.eye-container');
    if (container) {
        new SciFiEye(container);
    }
});
