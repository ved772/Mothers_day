export const tunnelVertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const tunnelFragmentShader = `
uniform sampler2D tDiffuse;
uniform float uTime;
uniform vec2 uResolution;
uniform float uVignetteStrength;
uniform float uWarmth;
uniform float uDistortion;

varying vec2 vUv;

void main() {
    // 1. Distortion (Lens effect)
    vec2 uv = vUv;
    vec2 center = vec2(0.5, 0.52); // Focus slightly below middle
    vec2 dist = uv - center;
    float r2 = dot(dist, dist);
    float f = 1.0 + r2 * (uDistortion + 0.1 * sin(uTime * 0.5)); // Breathing zoom
    
    // Distorted UV
    vec2 dUv = center + (dist / f);

    // 2. Texture Sample with slight offset/zoom
    vec4 color = texture2D(tDiffuse, dUv);

    // 3. Warmth / Golden Hour Filter
    // Boost red/green slightly, lower blue
    vec3 warmColor = vec3(1.0, 0.95, 0.8); 
    color.rgb = mix(color.rgb, color.rgb * warmColor, uWarmth);

    // 4. Vignette
    // Distance from center
    float d = distance(uv, center);
    // Smoothstep for soft edge
    float vignette = smoothstep(0.8, 0.2, d * uVignetteStrength);
    
    color.rgb *= vignette;

    // 5. Output
    gl_FragColor = color;
}
`;
