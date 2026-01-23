// Balatro Background Shader Implementation
class BalatroBG {
    constructor() {
        this.canvas = document.getElementById('backgroundCanvas');
        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        
        if (!this.gl) {
            console.error('WebGL not supported, using fallback background');
            this.useFallback();
            return;
        }
        
        this.time = 0;
        this.spin_time = 0;
        
        // Balatro 绿色扑克桌背景
        this.colours = {
            colour_1: [0.15, 0.35, 0.25, 1.0], // 深绿色
            colour_2: [0.25, 0.45, 0.35, 1.0], // 中绿色  
            colour_3: [0.35, 0.55, 0.45, 1.0], // 浅绿色
        };
        
        this.contrast = 2.5; // 原版对比度
        this.spin_amount = 0.1; // 原版旋转量
        
        this.initShader();
        this.initBuffers();
        this.resize();
        this.startRender();
        
        // Handle resize
        window.addEventListener('resize', () => this.resize());
    }
    
    initShader() {
        const vertexEl = document.getElementById('vertex-shader');
        const fragmentEl = document.getElementById('fragment-shader');

        const vertexShaderSource = (vertexEl && vertexEl.textContent) ? vertexEl.textContent : BalatroBG.DEFAULT_VERTEX_SHADER;
        const fragmentShaderSource = (fragmentEl && fragmentEl.textContent) ? fragmentEl.textContent : BalatroBG.DEFAULT_FRAGMENT_SHADER;
        
        this.program = this.createProgram(
            this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource),
            this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource)
        );
        
        // Get attribute and uniform locations
        this.locations = {
            attributes: {
                position: this.gl.getAttribLocation(this.program, 'a_position'),
                texCoord: this.gl.getAttribLocation(this.program, 'a_texCoord')
            },
            uniforms: {
                time: this.gl.getUniformLocation(this.program, 'u_time'),
                spin_time: this.gl.getUniformLocation(this.program, 'u_spin_time'),
                colour_1: this.gl.getUniformLocation(this.program, 'u_colour_1'),
                colour_2: this.gl.getUniformLocation(this.program, 'u_colour_2'),
                colour_3: this.gl.getUniformLocation(this.program, 'u_colour_3'),
                contrast: this.gl.getUniformLocation(this.program, 'u_contrast'),
                spin_amount: this.gl.getUniformLocation(this.program, 'u_spin_amount'),
                resolution: this.gl.getUniformLocation(this.program, 'u_resolution')
            }
        };
    }
    
    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }
    
    createProgram(vertexShader, fragmentShader) {
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Program link error:', this.gl.getProgramInfoLog(program));
            return null;
        }
        
        return program;
    }
    
    initBuffers() {
        // Create full-screen quad
        const positions = new Float32Array([
            -1, -1,  // bottom left
             1, -1,  // bottom right
            -1,  1,  // top left
             1,  1   // top right
        ]);
        
        const texCoords = new Float32Array([
            0, 0,
            1, 0,
            0, 1,
            1, 1
        ]);
        
        // Position buffer
        this.positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);
        
        // Texture coordinate buffer
        this.texCoordBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, texCoords, this.gl.STATIC_DRAW);
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
    
    render(currentTime) {
        currentTime *= 0.001; // Convert to seconds
        this.time = currentTime;
        this.spin_time = currentTime * 0.5;
        
        this.gl.clearColor(0.22, 0.31, 0.33, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        
        this.gl.useProgram(this.program);
        
        // Set uniforms
        this.gl.uniform1f(this.locations.uniforms.time, this.time);
        this.gl.uniform1f(this.locations.uniforms.spin_time, this.spin_time);
        this.gl.uniform4fv(this.locations.uniforms.colour_1, this.colours.colour_1);
        this.gl.uniform4fv(this.locations.uniforms.colour_2, this.colours.colour_2);
        this.gl.uniform4fv(this.locations.uniforms.colour_3, this.colours.colour_3);
        this.gl.uniform1f(this.locations.uniforms.contrast, this.contrast);
        this.gl.uniform1f(this.locations.uniforms.spin_amount, this.spin_amount);
        this.gl.uniform2f(this.locations.uniforms.resolution, this.canvas.width, this.canvas.height);
        
        // Set up attributes
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.enableVertexAttribArray(this.locations.attributes.position);
        this.gl.vertexAttribPointer(this.locations.attributes.position, 2, this.gl.FLOAT, false, 0, 0);
        
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
        this.gl.enableVertexAttribArray(this.locations.attributes.texCoord);
        this.gl.vertexAttribPointer(this.locations.attributes.texCoord, 2, this.gl.FLOAT, false, 0, 0);
        
        // Draw
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
    
    startRender() {
        const renderLoop = (time) => {
            this.render(time);
            requestAnimationFrame(renderLoop);
        };
        requestAnimationFrame(renderLoop);
    }
    
    useFallback() {
        // 如果WebGL不支持，使用CSS背景
        document.body.style.background = 'linear-gradient(135deg, #1a2b28 0%, #2a4b38 50%, #1a3b28 100%)';
        this.canvas.style.display = 'none';
    }
}

BalatroBG.DEFAULT_VERTEX_SHADER = `
attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;
varying vec2 v_screenCoord;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
  v_screenCoord = (a_position + 1.0) * 0.5;
}
`;

BalatroBG.DEFAULT_FRAGMENT_SHADER = `
precision mediump float;

uniform float u_time;
uniform float u_spin_time;
uniform vec4 u_colour_1;
uniform vec4 u_colour_2;
uniform vec4 u_colour_3;
uniform float u_contrast;
uniform float u_spin_amount;
uniform vec2 u_resolution;

varying vec2 v_texCoord;
varying vec2 v_screenCoord;

#define PIXEL_SIZE_FAC 700.0
#define SPIN_EASE 0.5

void main() {
  // Convert to UV coords (0-1) and floor for pixel effect
  float pixel_size = length(u_resolution) / PIXEL_SIZE_FAC;
  vec2 uv = (floor(v_screenCoord * u_resolution / pixel_size) * pixel_size - 0.5 * u_resolution) / length(u_resolution) - vec2(0.12, 0.0);
  float uv_len = length(uv);

  // Adding in a center swirl, changes with time
  float speed = (u_spin_time * SPIN_EASE * 0.2) + 302.2;
  float new_pixel_angle = atan(uv.y, uv.x) + speed - SPIN_EASE * 20.0 * (1.0 * u_spin_amount * uv_len + (1.0 - 1.0 * u_spin_amount));
  vec2 mid = (u_resolution / length(u_resolution)) / 2.0;
  uv = vec2(uv_len * cos(new_pixel_angle) + mid.x, uv_len * sin(new_pixel_angle) + mid.y) - mid;

  // Now add the paint effect to the swirled UV
  uv *= 30.0;
  speed = u_time * 2.0;
  vec2 uv2 = vec2(uv.x + uv.y);

  for(int i = 0; i < 5; i++) {
    uv2 += sin(max(uv.x, uv.y)) + uv;
    uv += 0.5 * vec2(cos(5.1123314 + 0.353 * uv2.y + speed * 0.131121), sin(uv2.x - 0.113 * speed));
    uv -= 1.0 * cos(uv.x + uv.y) - 1.0 * sin(uv.x * 0.711 - uv.y);
  }

  // Make the paint amount range from 0 - 2
  float contrast_mod = (0.25 * u_contrast + 0.5 * u_spin_amount + 1.2);
  float paint_res = min(2.0, max(0.0, length(uv) * 0.035 * contrast_mod));
  float c1p = max(0.0, 1.0 - contrast_mod * abs(1.0 - paint_res));
  float c2p = max(0.0, 1.0 - contrast_mod * abs(paint_res));
  float c3p = 1.0 - min(1.0, c1p + c2p);

  vec4 ret_col = (0.3 / u_contrast) * u_colour_1 + (1.0 - 0.3 / u_contrast) * (u_colour_1 * c1p + u_colour_2 * c2p + vec4(c3p * u_colour_3.rgb, c3p * u_colour_1.a));

  gl_FragColor = ret_col;
}
`;

function getOrientationCopy() {
    const lang = (document.documentElement.lang || '').toLowerCase();
    const isZh = lang.startsWith('zh');
    if (isZh) {
        return {
            title: '请将设备旋转至横屏',
            desc: '移动端请使用横屏以获得更好体验。',
            close: '关闭提示'
        };
    }
    return {
        title: 'Rotate to landscape',
        desc: 'Use landscape on mobile for the best experience.',
        close: 'Dismiss'
    };
}

function setupOrientationNotice() {
    const hasCalculatorLayout = document.getElementById('containerLeft') && document.getElementById('containerRight');
    if (!hasCalculatorLayout) {
        return;
    }

    document.body.classList.add('calculator-layout');

    let overlay = document.getElementById('orientationLock');
    const storageKey = 'balatro_orientation_notice_dismissed';

    const readDismissed = () => {
        try {
            return localStorage.getItem(storageKey) === '1';
        } catch (err) {
            return false;
        }
    };

    const writeDismissed = () => {
        try {
            localStorage.setItem(storageKey, '1');
        } catch (err) {
            // Ignore storage errors.
        }
    };

    if (!overlay) {
        const copy = getOrientationCopy();
        overlay = document.createElement('div');
        overlay.id = 'orientationLock';
        overlay.setAttribute('role', 'status');
        overlay.setAttribute('aria-live', 'polite');
        overlay.setAttribute('aria-hidden', 'true');
        overlay.innerHTML = `
            <div class="orientationLock__inner">
                <div class="orientationLock__text">
                    <div class="orientationLock__title">${copy.title}</div>
                    <div class="orientationLock__desc">${copy.desc}</div>
                </div>
                <button type="button" class="orientationLock__close" aria-label="${copy.close}">X</button>
            </div>
        `;
        document.body.appendChild(overlay);

        const closeBtn = overlay.querySelector('.orientationLock__close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                writeDismissed();
                overlay.classList.remove('is-visible');
                overlay.setAttribute('aria-hidden', 'true');
            });
        }
    }

    const update = () => {
        const isPortrait = window.matchMedia('(orientation: portrait)').matches;
        const isMobile = window.matchMedia('(pointer: coarse)').matches && window.matchMedia('(max-width: 900px)').matches;
        const shouldShow = isMobile && isPortrait && !readDismissed();
        overlay.classList.toggle('is-visible', shouldShow);
        overlay.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BalatroBG();
    setupOrientationNotice();
});
