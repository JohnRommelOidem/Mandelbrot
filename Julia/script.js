import vertexShaderSource from './vertexShader.js';
import fragmentShaderSource from './fragmentShader.js';
import {createShader, createProgram, setGeometry} from '../shaderUtils.js'
import {state} from '../sharedState.js'


const canvas = document.getElementById("julia-canvas");
const lockZ0btn = document.getElementById("lock-z0")
const gl = canvas.getContext("webgl2");

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

const program = createProgram(gl, vertexShader, fragmentShader);

const positionLocation = gl.getAttribLocation(program, "a_position");
const resLocation = gl.getUniformLocation(program, "u_resolution");
const centerLocation = gl.getUniformLocation(program, "u_zoomCenter");
const sizeLocation = gl.getUniformLocation(program, "u_zoomSize");
const maxLocation = gl.getUniformLocation(program, "u_maxIterations");
const escapeLocation = gl.getUniformLocation(program, "u_escapeRadius");
const periodLocation = gl.getUniformLocation(program, "u_colorPeriod");
const colorNumLocation = gl.getUniformLocation(program, "u_numColors");
const color1Location = gl.getUniformLocation(program, "u_color1");
const color2Location = gl.getUniformLocation(program, "u_color2");
const cursorLocation = gl.getUniformLocation(program, "u_cursorPoint");
const juliaLocation = gl.getUniformLocation(program, "u_juliaPoint");
const lockLocation = gl.getUniformLocation(program, "u_lockZ");

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

canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

var zoomCenter = [0, 0];
var zoomSize = 3.5;
var cursorPosition = [canvas.width/2, canvas.height/2];
drawScene();
canvas.style.opacity = "1";
function drawScene(){
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.clearColor(0.15, 0.15, 0.15, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindVertexArray(vao);
    gl.uniform2f(resLocation,  canvas.width, canvas.height);
    gl.uniform2f(centerLocation, ...zoomCenter);
    gl.uniform1f(sizeLocation, zoomSize);
    gl.uniform1f(escapeLocation, state.escapeRadius);
    gl.uniform1i(maxLocation, state.maxIter);
    gl.uniform1i(periodLocation, state.colorPeriod);
    gl.uniform1i(colorNumLocation, 4);
    gl.uniform3f(color1Location, ...state.color1);
    gl.uniform3f(color2Location, ...state.color2);
    gl.uniform2f(cursorLocation, ...cursorPosition);
    gl.uniform2f(juliaLocation, ...state.juliaC);
    gl.uniform1i(lockLocation, lockZ0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (!lockZ0){
        state.mandelbrotZ0 = [
            zoomCenter[0]+(cursorPosition[0]/canvas.width-0.5)*zoomSize*canvas.width/canvas.height,
            zoomCenter[1]+(cursorPosition[1]/canvas.height-0.5)*zoomSize
        ]
    }
    requestAnimationFrame(drawScene);
}

var isDraggingCanvas = false;
var isDraggingCursor = false;
var lastX = 0;
var lastY = 0;
var initialZoom;
var lockZ0 = true;
const MIN_ZOOM = 0.00003;
const MAX_ZOOM = 4;
const CENTER_X_BOUNDS = [-2, 2];
const CENTER_Y_BOUNDS = [-3, 3];

function getClientCoords(e){
    return e.touches?.[0] ? [e.touches[0].clientX, e.touches[0].clientY] : [e.clientX, e.clientY];
}

function clickEvent(e){
    [lastX, lastY] = getClientCoords(e);
    const rect = canvas.getBoundingClientRect();
    if (
        Math.sqrt((lastX-rect.left-cursorPosition[0])**2+(canvas.height-(lastY-rect.top)-cursorPosition[1])**2)<=5*2&&!lockZ0
    ){
        isDraggingCursor=true;
        canvas.style.cursor = "none"
    } else {
        isDraggingCanvas=true;
        canvas.style.cursor = "grabbing";
    }
}

function dragEvent(e){
    e.preventDefault();
    const [clientX, clientY] = getClientCoords(e)
    if(isDraggingCanvas){
        canvas.style.cursor = "grabbing";
        zoomCenter[0] -= (clientX-lastX)/canvas.width*zoomSize*canvas.width/canvas.height;
        zoomCenter[1] += (clientY-lastY)/canvas.height*zoomSize;
        [lastX, lastY] = getClientCoords(e);
        zoomCenter[0] = Math.max(CENTER_X_BOUNDS[0]+0.5*zoomSize*canvas.width/canvas.height, Math.min(CENTER_X_BOUNDS[1]-0.5*zoomSize*canvas.width/canvas.height, zoomCenter[0]));
        zoomCenter[1] = Math.max(CENTER_Y_BOUNDS[0]+0.5*zoomSize, Math.min(CENTER_Y_BOUNDS[1]-0.5*zoomSize, zoomCenter[1]));
    } else if (isDraggingCursor){
        const rect = canvas.getBoundingClientRect();
        cursorPosition[0] = (clientX-rect.left);
        cursorPosition[1] = canvas.height-(clientY-rect.top);
    }
}

function releaseEvent(e){
    e.preventDefault();
    canvas.style.cursor = "default"
    isDraggingCanvas=false;
    isDraggingCursor = false;
}

function zoomEvent(e){
    e.preventDefault();
    const [clientX, clientY] = getClientCoords(e)
    initialZoom = zoomSize;
    const zoomFactor = 1.15;
    var newZoom = zoomSize * (e.deltaY<0?1/zoomFactor:zoomFactor);
    zoomSize =Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
    const rect = canvas.getBoundingClientRect();
    zoomCenter[0] += ((clientX-rect.left)/rect.width-0.5)*(initialZoom-zoomSize)*canvas.width/canvas.height;
    zoomCenter[1] += (1-(clientY-rect.top)/rect.height-0.5)*(initialZoom-zoomSize);
    zoomCenter[0] = Math.max(CENTER_X_BOUNDS[0]+0.5*zoomSize*canvas.width/canvas.height, Math.min(CENTER_X_BOUNDS[1]-0.5*zoomSize*canvas.width/canvas.height, zoomCenter[0]));
    zoomCenter[1] = Math.max(CENTER_Y_BOUNDS[0]+0.5*zoomSize, Math.min(CENTER_Y_BOUNDS[1]-0.5*zoomSize, zoomCenter[1]));
}

canvas.addEventListener("mousedown", clickEvent)
canvas.addEventListener("mousemove", dragEvent)
canvas.addEventListener("mouseup", releaseEvent);
canvas.addEventListener("mouseleave", releaseEvent)
canvas.addEventListener("wheel", zoomEvent)

lockZ0btn.addEventListener("click", ()=>{
    lockZ0 = !lockZ0
    if (lockZ0){
        lockZ0btn.innerText = "Unlock Z0";
    } else {
        lockZ0btn.innerText = "Lock Z0";
    }
})

canvas.addEventListener("touchstart", (e)=>{
    console.log(e.touches.length);
    clickEvent(e);
    document.body.style.overscrollBehavior = "contain";
}, {passive:false})

canvas.addEventListener("touchend", (e)=>{
    releaseEvent(e);
    document.body.style.overscrollBehavior = "";
}, {passive:false});

canvas.addEventListener("touchmove",dragEvent, {passive:false});