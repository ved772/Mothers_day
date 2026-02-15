import { ScrubEngine } from './scrubEngine.js';
import { tunnelVertexShader, tunnelFragmentShader } from './tunnelShader.js';

// Access global THREE and GSAP
const THREE = window.THREE;
const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;

// --- Config ---
const CONFIG = {
    totalFrames: 190,
    framesPath: 'Family Photos', // Path relative to root
    frameExt: 'png',
    scrollDuration: '150%', // Height
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    gsap.registerPlugin(ScrollTrigger);

    initTunnel();
    initInteractions();
    playAnimations();
    setDate();
});

// --- Tunnel Sequence ---
function initTunnel() {
    const container = document.getElementById('webgl-container');
    if (!container) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); // Full screen quad
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Scrub Engine
    const scrubEngine = new ScrubEngine(CONFIG.totalFrames, CONFIG.framesPath, CONFIG.frameExt);

    // 3. Shader Setup
    const uniforms = {
        tDiffuse: { value: null }, // Will be updated by scrubEngine
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uVignetteStrength: { value: 1.2 }, // Soft vignette
        uWarmth: { value: 0.1 }, // Subtle gold
        uDistortion: { value: 0.02 }, // Subtle lens
    };

    const material = new THREE.ShaderMaterial({
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `, // Using inline simplest vertex shader
        fragmentShader: `
            uniform sampler2D tDiffuse;
            uniform float uTime;
            uniform float uVignetteStrength;
            uniform float uWarmth;
            uniform float uDistortion;
            varying vec2 vUv;
            
            void main() {
                vec2 center = vec2(0.5, 0.52);
                vec2 uv = vUv;
                
                // Lens Distortion
                vec2 dist = uv - center;
                float r2 = dot(dist, dist);
                float f = 1.0 + r2 * (uDistortion + 0.05 * sin(uTime * 0.5));
                vec2 dUv = center + (dist / f);
                
                vec4 color = texture2D(tDiffuse, dUv);
                
                // Warmth
                vec3 warmFilter = vec3(1.0, 0.95, 0.85);
                color.rgb = mix(color.rgb, color.rgb * warmFilter, uWarmth);
                
                // Vignette
                float d = distance(uv, center);
                float vign = smoothstep(1.0, 0.2, d * uVignetteStrength);
                color.rgb *= vign;
                
                gl_FragColor = color;
            }
        `,
        uniforms: uniforms
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // 4. Loading & Updating
    // Start with loading
    scrubEngine.load(() => {
        // Initial render
        const firstFrame = scrubEngine.getFrame(0);
        if (firstFrame) {
            const tex = new THREE.Texture(firstFrame);
            tex.needsUpdate = true;
            uniforms.tDiffuse.value = tex;
        }
    });

    // 5. ScrollTrigger Logic
    // Pin the hero section while scrubbing
    ScrollTrigger.create({
        trigger: '#hero',
        start: 'top top',
        end: `+=${CONFIG.scrollDuration}`,
        scrub: 1, // Smooth catchup
        pin: true,
        onUpdate: (self) => {
            const progress = self.progress;

            // Get frame based on progress
            const frameImg = scrubEngine.getFrame(progress);

            if (frameImg && uniforms.tDiffuse.value) {
                // Determine if we need to update texture
                // Optimized: Reuse texture object if possible or just update image
                // Assuming efficient texture reuse isn't critical for < 200 frames if simply swapping image source
                // For best performance: update image on existing texture
                uniforms.tDiffuse.value.image = frameImg;
                uniforms.tDiffuse.value.needsUpdate = true;
            } else if (frameImg && !uniforms.tDiffuse.value) {
                const tex = new THREE.Texture(frameImg);
                tex.needsUpdate = true;
                uniforms.tDiffuse.value = tex;
            }

            // Animate tags based on progress
            animateTags(progress);
        }
    });

    // 6. Animation Loop
    const clock = new THREE.Clock();
    function animate() {
        requestAnimationFrame(animate);
        uniforms.uTime.value = clock.getElapsedTime();
        renderer.render(scene, camera);
    }
    animate();

    // Resize
    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    });
}

// --- Helper: Animate Tags ---
function animateTags(progress) {
    // Show tags at specific intervals
    const tags = document.querySelectorAll('.floating-tag');
    // progress 0 -> child, 1 -> hug
    // Tag 1: "My First Hero" (0.1 - 0.25)
    // Tag 2: "My Safe Place" (0.3 - 0.45)
    // Tag 3: "My Biggest Support" (0.5 - 0.65)
    // Tag 4: "My Forever Friend" (0.7 - 0.85)
    // Tag 5: "My Strength" (0.9 - 1.0)

    const ranges = [
        { el: tags[0], start: 0.05, end: 0.2 },
        { el: tags[1], start: 0.25, end: 0.4 },
        { el: tags[2], start: 0.45, end: 0.6 },
        { el: tags[3], start: 0.65, end: 0.8 },
        { el: tags[4], start: 0.85, end: 1.0 },
    ];

    ranges.forEach((range, i) => {
        if (!range.el) return;

        // Custom fade logic
        if (progress >= range.start && progress <= range.end) {
            gsap.to(range.el, { opacity: 1, y: -20, duration: 0.5, overwrite: 'auto' });

            // Random positioning if not set
            if (!range.el.dataset.positioned) {
                range.el.style.left = `${10 + Math.random() * 60}%`;
                range.el.style.top = `${20 + Math.random() * 40}%`;
                range.el.dataset.positioned = 'true';
            }
        } else {
            gsap.to(range.el, { opacity: 0, y: 0, duration: 0.5, overwrite: 'auto' });
        }
    });
}

// --- Interactions ---
function initInteractions() {
    // Light a Candle
    const candleBtn = document.getElementById('candleBtn');
    const candleOverlay = document.getElementById('candleOverlay');
    const bellSound = document.getElementById('bellSound');

    if (candleBtn) {
        candleBtn.addEventListener('click', () => {
            // Show overlay
            candleOverlay.style.display = 'block';
            gsap.fromTo(candleOverlay, { opacity: 0 }, { opacity: 1, duration: 1 });

            // Play Sound
            bellSound.volume = 0.5;
            bellSound.currentTime = 0;
            bellSound.play().catch(e => console.log('Audio play failed', e));

            // Hide after 4 seconds
            setTimeout(() => {
                gsap.to(candleOverlay, {
                    opacity: 0,
                    duration: 1,
                    onComplete: () => { candleOverlay.style.display = 'none'; }
                });
            }, 4000);
        });
    }

    // Music Toggle
    const musicBtn = document.getElementById('musicToggle');
    const bgMusic = document.getElementById('bgMusic');

    // Show music button after user interaction
    document.addEventListener('click', () => {
        musicBtn.classList.remove('hidden');
        gsap.to(musicBtn, { opacity: 1, duration: 1 });
    }, { once: true });

    let isPlaying = false;
    musicBtn.addEventListener('click', () => {
        if (isPlaying) {
            bgMusic.pause();
            musicBtn.innerHTML = '<span class="icon">🔇</span>';
        } else {
            bgMusic.volume = 0.3;
            bgMusic.play().catch(e => console.log('Music play failed', e));
            musicBtn.innerHTML = '<span class="icon">🎵</span>';
        }
        isPlaying = !isPlaying;
    });
}

// --- General Animations ---
function playAnimations() {
    // Grid fade-in
    const cards = document.querySelectorAll('.memory-card');
    cards.forEach((card, i) => {
        gsap.to(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none reverse'
            },
            opacity: 1,
            y: 0,
            duration: 0.8,
            delay: i * 0.1
        });
    });

    // Letter Typewriter
    const letterText = `Mom,

You have been my first home,
my first teacher,
my first protector,
and my forever strength.

Every step I take has your love behind it.
Every dream I chase has your blessing in it.

Today is your day.
And I just want you to know…

I am who I am because of you.

Happy Birthday, Mom.
I love you always.`;

    const typeEl = document.getElementById('typewriter-text');

    ScrollTrigger.create({
        trigger: '#letter',
        start: 'top 60%',
        onEnter: () => {
            // Simple Typewriter logic
            if (typeEl.innerText.length > 5) return; // Already typed
            typeWriter(typeEl, letterText, 0);
        }
    });
}

function typeWriter(element, text, i) {
    if (i < text.length) {
        element.textContent += text.charAt(i);
        setTimeout(() => typeWriter(element, text, i + 1), 40); // speed
    }
}

function setDate() {
    const dateEl = document.getElementById('current-date');
    if (dateEl) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        dateEl.textContent = new Date().toLocaleDateString('en-US', options);
    }
}
