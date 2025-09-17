export function createShader(gl, type, source){
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
        return shader;
    }
    gl.deleteShader(shader);
}
export function createProgram(gl, vertexShader, fragmentShader){
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (gl.getProgramParameter(program, gl.LINK_STATUS)){
        return program;
    }
    gl.deleteProgram(program);
}

export function setGeometry(gl){
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        1, 1,
        -1, 1,
        1, -1,
        -1, -1
    ]),gl.STATIC_DRAW)
}

export function initGl(canvas, uniforms, vertexShaderSource, fragmentShaderSource){
    const gl = canvas.getContext("webgl2");
    
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    const program = createProgram(gl, vertexShader, fragmentShader);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    for (const [name, uniform] of Object.entries(uniforms)){
        if (name.startsWith("u_")){
            uniform.location = gl.getUniformLocation(program, name)
        }
    }
    const positionBuffer = gl.createBuffer();
    var vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.enableVertexAttribArray(positionLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    setGeometry(gl);
    gl.vertexAttribPointer(
        positionLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0
    );
    function initScene(){
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0.15, 0.15, 0.15, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(program);
        gl.bindVertexArray(vao);
        for (const[_, {location, type, value}] of Object.entries(uniforms)){
            switch (type){
                case "1f": gl.uniform1f(location, value); break;
                case "2f": gl.uniform2f(location, ...value); break;
                case "3f": gl.uniform3f(location, ...value); break;
                case "1i": gl.uniform1i(location, value); break;
            }
        }
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    return canvas, initScene;    
}