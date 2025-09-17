import vertexShaderSource from './vertexShader.js';
import fragmentShaderSource from './fragmentShader.js';
import {initGl} from '../shaderUtils.js'
import {state} from '../sharedState.js'

const canvas = document.getElementById("mandelbrot-canvas");
const lockCbtn = document.getElementById("lock-c");

canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

var zoomCenter = [0, 0];
var zoomSize = 2.5;
var cursorPosition = [canvas.width/2, canvas.height/2];
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

const uniforms = {
    u_resolution:{
        type: "2f",
        value: [canvas.width, canvas.height]
    },
    u_zoomCenter:{
        type: "2f",
        value: zoomCenter
    },
    u_zoomSize:{
        type: "1f",
        value: zoomSize
    },
    u_escapeRadius:{
        type: "1f",
        value: state.escapeRadius
    },
    u_maxIterations:{
        type: "1i",
        value: state.maxIter
    },
    u_colorPeriod:{
        type: "1i",
        value: state.colorPeriod
    },
    u_numColors:{
        type: "1i",
        value: 4
    },
    u_color1:{
        type: "3f",
        value: state.color1
    },
    u_color2:{
        type: "3f",
        value: state.color2
    },
    u_cursorPoint:{
        type: "2f",
        value: cursorPosition
    },
    u_mandelbrotPoint:{
        type: "2f",
        value: state.mandelbrotZ0
    },
    u_lockC:{
        type: "1i",
        value: lockC
    },
}

const initScene = initGl(canvas, uniforms, vertexShaderSource, fragmentShaderSource);

drawScene();
canvas.style.opacity = "1";

function clientToCanvas([clientX, clientY], rect){
    return[
        (clientX-rect.left)/rect.width,
        (clientY-rect.top)/rect.height
    ]
}

function canvasToComplex([canvasX, canvasY], [offSetX, offSetY], zoomCenter, zoomSize){
    return [
        zoomCenter[0]+(canvasX-offSetX)*zoomSize*canvas.width/canvas.height,
        zoomCenter[1]+(1-canvasY-offSetY)*zoomSize
    ]
}

function clientToComplex(clientCoords, rect, [offSetX, offSetY], zoomCenter, zoomSize){
    const canvasCoords = clientToCanvas(clientCoords, rect);
    return canvasToComplex(canvasCoords, [offSetX, offSetY], zoomCenter, zoomSize);
}

function drawScene(){
    uniforms.u_mandelbrotPoint.value = state.mandelbrotZ0;
    initScene();
    if (!uniforms.u_lockC.value){
        state.juliaC = [
            uniforms.u_zoomCenter.value[0]+(cursorPosition[0]/canvas.width-0.75)*uniforms.u_zoomSize.value*canvas.width/canvas.height,
            uniforms.u_zoomCenter.value[1]+(cursorPosition[1]/canvas.height-0.5)*uniforms.u_zoomSize.value
        ]
    }
    requestAnimationFrame(drawScene);
}


function getClientCoords(e){
    return e.touches?.[0] ? [e.touches[0].clientX, e.touches[0].clientY] : [e.clientX, e.clientY];
}

function clickEvent(e){
    [lastX, lastY] = getClientCoords(e);
    const rect = canvas.getBoundingClientRect();
    if (
        Math.sqrt((lastX-rect.left-cursorPosition[0])**2+(canvas.height-(lastY-rect.top)-cursorPosition[1])**2)<=5*5&&!uniforms.u_lockC.value
    ){
        isDraggingCursor=true;
        canvas.style.cursor = "none"
    } else {
        isDraggingCanvas=true;
        canvas.style.cursor = "grabbing";
    }
}

function clamp(value, min, max){
    return Math.max(min, Math.min(max, value))
}


function dragEvent(e){
    e.preventDefault();
    const [clientX, clientY] = getClientCoords(e)
    const rect = canvas.getBoundingClientRect();
    if(isDraggingCanvas){
        canvas.style.cursor = "grabbing";
        uniforms.u_zoomCenter.value = canvasToComplex([(lastX-clientX)/rect.width, (lastY-clientY)/rect.height], [0, 1], uniforms.u_zoomCenter.value, uniforms.u_zoomSize.value);
        const minCenter = canvasToComplex([0.75, -0.5], [0, 1], [CENTER_X_BOUNDS[0], CENTER_Y_BOUNDS[0]], uniforms.u_zoomSize.value)
        const maxCenter = canvasToComplex([-0.25, 0.5], [0, 1], [CENTER_X_BOUNDS[1], CENTER_Y_BOUNDS[1]], uniforms.u_zoomSize.value)
        uniforms.u_zoomCenter.value[0] = clamp(uniforms.u_zoomCenter.value[0], minCenter[0], maxCenter[0])
        uniforms.u_zoomCenter.value[1] = clamp(uniforms.u_zoomCenter.value[1], minCenter[1], maxCenter[1]);
        [lastX, lastY] = getClientCoords(e);
    } else if (isDraggingCursor){
        cursorPosition[0] = (clientX-rect.left);
        cursorPosition[1] = rect.height-(clientY-rect.top);
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
    const clientCoords = getClientCoords(e)
    initialZoom = uniforms.u_zoomSize.value;
    const zoomFactor = 1.15;
    var newZoom = uniforms.u_zoomSize.value * (e.deltaY<0?1/zoomFactor:zoomFactor);
    uniforms.u_zoomSize.value = clamp(newZoom, MIN_ZOOM, MAX_ZOOM);
    const rect = canvas.getBoundingClientRect();
    uniforms.u_zoomCenter.value = clientToComplex(clientCoords, rect, [0.75, 0.5], uniforms.u_zoomCenter.value, initialZoom-uniforms.u_zoomSize.value);
    const minCenter = canvasToComplex([0.75, -0.5], [0, 1], [CENTER_X_BOUNDS[0], CENTER_Y_BOUNDS[0]], uniforms.u_zoomSize.value)
    const maxCenter = canvasToComplex([-0.25, 0.5], [0, 1], [CENTER_X_BOUNDS[1], CENTER_Y_BOUNDS[1]], uniforms.u_zoomSize.value)
    uniforms.u_zoomCenter.value[0] = clamp(uniforms.u_zoomCenter.value[0], minCenter[0], maxCenter[0])
    uniforms.u_zoomCenter.value[1] = clamp(uniforms.u_zoomCenter.value[1], minCenter[1], maxCenter[1]);}

canvas.addEventListener("mousedown", clickEvent)
canvas.addEventListener("mousemove", dragEvent)
canvas.addEventListener("mouseup", releaseEvent);
canvas.addEventListener("mouseleave", releaseEvent)
canvas.addEventListener("wheel", zoomEvent)
lockCbtn.addEventListener("click", ()=>{
    uniforms.u_lockC.value = !uniforms.u_lockC.value
    if (uniforms.u_lockC.value){
        lockCbtn.innerText = "Unlock C";
    } else {
        lockCbtn.innerText = "Lock C";
    }
})
//TODO: Add a reset button,  hide panel;
canvas.addEventListener("touchstart", (e)=>{
    clickEvent(e);
    document.body.style.overscrollBehavior = "contain";
}, {passive:false})

canvas.addEventListener("touchend", (e)=>{
    releaseEvent(e);
    document.body.style.overscrollBehavior = "";
    lastTouchDistance = null;
}, {passive:false});

canvas.addEventListener("touchmove",(e)=>{
    if (e.touches.length == 1){
        dragEvent(e);
    } else if (e.touches.length == 2) {
        e.preventDefault();
        const dist = Math.sqrt((e.touches[0].clientX-e.touches[1].clientX)**2+(e.touches[0].clientY-e.touches[1].clientY)**2)
        if (lastTouchDistance != null){
            const rect = canvas.getBoundingClientRect();
            const midPoint = [
                ((e.touches[0].clientX+e.touches[1].clientX)/2-rect.left)/rect.width,
                ((e.touches[0].clientY+e.touches[1].clientY)/2-rect.top)/rect.height
            ]
            const offSet = [0.75, 0.5]
            const before = canvasToComplex(midPoint, offSet, uniforms.u_zoomCenter.value, uniforms.u_zoomSize.value);
            uniforms.u_zoomSize.value = clamp(uniforms.u_zoomSize.value*lastTouchDistance/dist, MIN_ZOOM, MAX_ZOOM);
            const after = canvasToComplex(midPoint, offSet, uniforms.u_zoomCenter.value, uniforms.u_zoomSize.value);
            uniforms.u_zoomCenter.value[0]+=before[0]-after[0];
            uniforms.u_zoomCenter.value[1]+=before[1]-after[1];
        }
        lastTouchDistance = dist;
    }
}, {passive:false});
