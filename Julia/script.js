import vertexShaderSource from './vertexShader.js';
import fragmentShaderSource from './fragmentShader.js';
import {initGl} from '../shaderUtils.js'
import {state} from '../sharedState.js'

const canvas = document.getElementById("julia-canvas");
const lockZ0btn = document.getElementById("lock-z0")

canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

var zoomCenter = [0, 0];
var zoomSize = 3.5;
var cursorPosition = [canvas.width/2, canvas.height/2];
var isDraggingCanvas = false;
var isDraggingCursor = false;
var lastX = 0;
var lastY = 0;
var initialZoom;
var lockZ0 = true;
var lastTouchDistance = null;
const MIN_ZOOM = 0.00003;
const MAX_ZOOM = 4;
const CENTER_X_BOUNDS = [-2, 2];
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
    u_juliaPoint:{
        type: "2f",
        value: state.juliaC
    },
    u_lockZ:{
        type: "1i",
        value: lockZ0
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
    uniforms.u_color1.value = state.color1;
    uniforms.u_color2.value = state.color2;
    uniforms.u_maxIterations.value = state.maxIter;
    uniforms.u_escapeRadius.value = state.escapeRadius;
    uniforms.u_colorPeriod.value = state.colorPeriod;
    uniforms.u_juliaPoint.value = state.juliaC;
    initScene();
    if (!uniforms.u_lockZ.value){
        state.mandelbrotZ0 = [
            uniforms.u_zoomCenter.value[0]+(uniforms.u_cursorPoint.value[0]/canvas.width-0.5)*uniforms.u_zoomSize.value*canvas.width/canvas.height,
            uniforms.u_zoomCenter.value[1]+(uniforms.u_cursorPoint.value[1]/canvas.height-0.5)*uniforms.u_zoomSize.value
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
        Math.sqrt((lastX-rect.left-uniforms.u_cursorPoint.value[0])**2+(canvas.height-(lastY-rect.top)-uniforms.u_cursorPoint.value[1])**2)<=5*5&&!uniforms.u_lockZ.value
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
        const minCenter = canvasToComplex([0.5, -0.5], [0, 1], [CENTER_X_BOUNDS[0], CENTER_Y_BOUNDS[0]], uniforms.u_zoomSize.value)
        const maxCenter = canvasToComplex([-0.5, 0.5], [0, 1], [CENTER_X_BOUNDS[1], CENTER_Y_BOUNDS[1]], uniforms.u_zoomSize.value)
        uniforms.u_zoomCenter.value[0] = clamp(uniforms.u_zoomCenter.value[0], minCenter[0], maxCenter[0])
        uniforms.u_zoomCenter.value[1] = clamp(uniforms.u_zoomCenter.value[1], minCenter[1], maxCenter[1]);
        [lastX, lastY] = getClientCoords(e);
    } else if (isDraggingCursor){
        uniforms.u_cursorPoint.value[0] = (clientX-rect.left);
        uniforms.u_cursorPoint.value[1] = rect.height-(clientY-rect.top);
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
    uniforms.u_zoomCenter.value = clientToComplex(clientCoords, rect, [0.5, 0.5], uniforms.u_zoomCenter.value, initialZoom-uniforms.u_zoomSize.value);
    const minCenter = canvasToComplex([0.5, -0.5], [0, 1], [CENTER_X_BOUNDS[0], CENTER_Y_BOUNDS[0]], uniforms.u_zoomSize.value)
    const maxCenter = canvasToComplex([-0.5, 0.5], [0, 1], [CENTER_X_BOUNDS[1], CENTER_Y_BOUNDS[1]], uniforms.u_zoomSize.value)
    uniforms.u_zoomCenter.value[0] = clamp(uniforms.u_zoomCenter.value[0], minCenter[0], maxCenter[0])
    uniforms.u_zoomCenter.value[1] = clamp(uniforms.u_zoomCenter.value[1], minCenter[1], maxCenter[1]);}

canvas.addEventListener("mousedown", clickEvent)
canvas.addEventListener("mousemove", dragEvent)
canvas.addEventListener("mouseup", releaseEvent);
canvas.addEventListener("mouseleave", releaseEvent)
canvas.addEventListener("wheel", zoomEvent)
lockZ0btn.addEventListener("click", ()=>{
    uniforms.u_lockZ.value = !uniforms.u_lockZ.value
    if (uniforms.u_lockZ.value){
        lockZ0btn.innerText = "Unlock Z0";
    } else {
        lockZ0btn.innerText = "Lock Z0";
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
            const offSet = [0.5, 0.5]
            const before = canvasToComplex(midPoint, offSet, uniforms.u_zoomCenter.value, uniforms.u_zoomSize.value);
            uniforms.u_zoomSize.value = clamp(uniforms.u_zoomSize.value*lastTouchDistance/dist, MIN_ZOOM, MAX_ZOOM);
            const after = canvasToComplex(midPoint, offSet, uniforms.u_zoomCenter.value, uniforms.u_zoomSize.value);
            uniforms.u_zoomCenter.value[0]+=before[0]-after[0];
            uniforms.u_zoomCenter.value[1]+=before[1]-after[1];
        }
        lastTouchDistance = dist;
    }
}, {passive:false});
