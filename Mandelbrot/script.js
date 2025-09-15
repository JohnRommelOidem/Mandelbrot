import vertexShaderSource from './vertexShader.js';
import fragmentShaderSource from './fragmentShader.js';
import {createShader, createProgram, setGeometry} from '../shaderUtils.js'
import {state} from '../sharedState.js'


const canvas = document.getElementById("mandelbrot-canvas");
const lockCbtn = document.getElementById("lock-c");
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
const mandelbrotLocation = gl.getUniformLocation(program, "u_mandelbrotPoint");
const lockLocation = gl.getUniformLocation(program, "u_lockC");

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
var zoomSize = 2.5;
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
    gl.uniform2f(mandelbrotLocation, ...state.mandelbrotZ0);
    gl.uniform1i(lockLocation, lockC);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (!lockC){
        state.juliaC = [
            zoomCenter[0]+(cursorPosition[0]/canvas.width-0.75)*zoomSize*canvas.width/canvas.height,
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
var lockC = false;
var lastTouchDistance = null;
const MIN_ZOOM = 0.00001;
const MAX_ZOOM = 3;
const CENTER_X_BOUNDS = [-3.0, 1.0];
const CENTER_Y_BOUNDS = [-3, 3];

function getClientCoords(e){
    return e.touches?.[0] ? [e.touches[0].clientX, e.touches[0].clientY] : [e.clientX, e.clientY];
}

function clickEvent(e){
    [lastX, lastY] = getClientCoords(e);
    const rect = canvas.getBoundingClientRect();
    if (
        Math.sqrt((lastX-rect.left-cursorPosition[0])**2+(canvas.height-(lastY-rect.top)-cursorPosition[1])**2)<=5*2&&!lockC
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
        zoomCenter[0] = Math.max(CENTER_X_BOUNDS[0]+0.75*zoomSize*canvas.width/canvas.height, Math.min(CENTER_X_BOUNDS[1]-0.25*zoomSize*canvas.width/canvas.height, zoomCenter[0]));
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
    isDraggingCanvas = false;
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
    zoomCenter[0] += ((clientX-rect.left)/rect.width-0.75)*(initialZoom-zoomSize)*canvas.width/canvas.height;
    zoomCenter[1] += (1-(clientY-rect.top)/rect.height-0.5)*(initialZoom-zoomSize);
    zoomCenter[0] = Math.max(CENTER_X_BOUNDS[0]+0.75*zoomSize*canvas.width/canvas.height, Math.min(CENTER_X_BOUNDS[1]-0.25*zoomSize*canvas.width/canvas.height, zoomCenter[0]));
    zoomCenter[1] = Math.max(CENTER_Y_BOUNDS[0]+0.5*zoomSize, Math.min(CENTER_Y_BOUNDS[1]-0.5*zoomSize, zoomCenter[1]));
}

canvas.addEventListener("mousedown", clickEvent)
canvas.addEventListener("mousemove", dragEvent)
canvas.addEventListener("mouseup", releaseEvent);
canvas.addEventListener("mouseleave", releaseEvent)
canvas.addEventListener("wheel", zoomEvent)
lockCbtn.addEventListener("click", ()=>{
    lockC = !lockC
    if (lockC){
        lockCbtn.innerText = "Unlock C";
    } else {
        lockCbtn.innerText = "Lock C";
    }
})
//TODO: Add touch zoom functionality, Add a reset button;
canvas.addEventListener("touchstart", (e)=>{
    clickEvent(e);
    document.body.style.overscrollBehavior = "contain";
}, {passive:false})

canvas.addEventListener("touchend", (e)=>{
    releaseEvent(e);
    document.body.style.overscrollBehavior = "";
}, {passive:false});

function screenToFractal(x, y, rect, zoomCenter, zoomSize){
    return [
        zoomCenter[0] + (x/rect.width-0.75)*zoomSize*canvas.width/canvas.height,
        zoomCenter[1] + (1-y/rect.height-0.5)*zoomSize
    ]
}
canvas.addEventListener("touchmove",(e)=>{
    if (e.touches.length == 1){
        dragEvent(e);
    } else if (e.touches.length == 2) {
        e.preventDefault();
        const dist = Math.sqrt((e.touches[0].clientX-e.touches[1].clientX)**2+(e.touches[0].clientY-e.touches[1].clientY)**2)
        if (lastTouchDistance != null){
            const rect = canvas.getBoundingClientRect();
            const midX = (e.touches[0].clientX+e.touches[1].clientX)/2-rect.left;
            const midY = (e.touches[0].clientY+e.touches[1].clientY)/2-rect.top;
            const before = screenToFractal(midX, midY, rect, zoomCenter, zoomSize);
            zoomSize =Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomSize*lastTouchDistance/dist));
            const after = screenToFractal(midX, midY, rect, zoomCenter, zoomSize);
            zoomCenter[0]+=before[0]-after[0];
            zoomCenter[1]+=before[1]-after[1];
        }
        lastTouchDistance = dist;
    }
}, {passive:false});
