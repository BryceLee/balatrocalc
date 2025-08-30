// Balatro Background Shader Implementation
class BalatroBG {
    constructor() {
        this.canvas = document.getElementById('backgroundCanvas');
        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        
        if (!this.gl) {
            console.error('WebGL not supported');
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
        const vertexShaderSource = document.getElementById('vertex-shader').textContent;
        const fragmentShaderSource = document.getElementById('fragment-shader').textContent;
        
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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BalatroBG();
});