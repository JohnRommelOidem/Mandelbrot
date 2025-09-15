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
    console.log(gl.getProgramInfoLog(program));
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