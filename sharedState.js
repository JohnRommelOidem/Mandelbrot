import {clamp} from './shaderUtils.js'

const startUpValue = 2;
const startUpEndValue = 500;
const startUpDuration = 1000;

export const state = {
    escapeRadius:3,
    iterations:500,
    colorPeriod:20,
    color2:[0.8, 0.45, 0.3],
    color1:[0.0, 0.25, 0.4],
    juliaC:null,
    mandelbrotZ0:[0, 0]
}
const juliaCanvas = document.getElementById("julia-canvas");
const mandelbrotCanvas = document.getElementById("mandelbrot-canvas");

const sliderContainer = document.getElementById("slider-container")
const color1Picker = document.getElementById("picker-1");
const color2Picker = document.getElementById("picker-2");

function rgbToHex(r,g,b){
    function toHex(c){
        return Math.round(c*255).toString(16).padStart(2,'0').toUpperCase();
    }
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgb(hex){
    return [
        parseInt(hex.substring(1,3), 16)/255,
        parseInt(hex.substring(3,5), 16)/255,
        parseInt(hex.substring(5,7), 16)/255
    ]
}

const maxIterValue = 10000
const minIterValue = 2

function logScale(value, min=minIterValue, max=maxIterValue){
    return Math.round(min*Math.pow(max/min,value/max));
}
function inverseLogScale(iterations, min=minIterValue, max=maxIterValue) {
    return Math.round(max*Math.log(iterations/min)/Math.log(max/min));
}

function createSlider(sliderDetails){
    const sliderValue = state[sliderDetails.key]
    const input = document.createElement("input");
    input.style.flex="1"
    input.style.boxSizing = "border-box";
    input.style.minWidth = "0";
    input.style.border = "none";
    input.style.outline = "none";
    input.type = "text";
    input.value = sliderValue;
    const labelText = document.createElement("span");
    labelText.innerText = sliderDetails.name + ":";
    labelText.style.whiteSpace="nowrap";


    const slider = document.createElement("input");
    slider.type = "range";
    slider.min=String(sliderDetails.min);
    slider.max=String(sliderDetails.max);
    slider.value=String(sliderDetails.key==="iterations"?inverseLogScale(sliderValue):sliderValue);
    slider.step = sliderDetails.step? String(sliderDetails.step):"1"
    slider.style.marginLeft = "0.2rem";
    
    input.addEventListener("input", (e)=>{
        console.log(e.target.value);
        e.target.value = e.target.value.replace(/[^0-9.]/g,"");
    })
    input.addEventListener("keydown", (e)=>{if (
        e.key==="Enter") input.blur();
    })
    input.addEventListener("blur", (e)=>{
        const value = clamp(Number(e.target.value), sliderDetails.min, sliderDetails.max)
        input.value = value;
        state[sliderDetails.key] = value;
        slider.value = sliderDetails.key==="iterations"?inverseLogScale(value):value;
    })

    slider.addEventListener("input", (e)=>{
        const value = e.target.valueAsNumber;
        state[sliderDetails.key] = sliderDetails.key==="iterations"?logScale(value):value;
        input.value = sliderDetails.key==="iterations"?logScale(value):value;;
    });
    
    const labelTop = document.createElement("div");
    labelTop.style.display = "flex";
    labelTop.style.alignItems = "center";
    labelTop.style.width = "100%";
    labelTop.appendChild(labelText);
    labelTop.appendChild(input);

    const label = document.createElement("label"); 
    label.appendChild(labelTop);
    label.appendChild(slider);
    label.style.display="flex";
    label.style.flexDirection="column";
    label.style.width="10rem";
    sliderContainer.appendChild(label);
    return [slider, input];
}


const [iterationSlider, iterationInput] = createSlider({name:"Iterations", min:minIterValue, max:maxIterValue, key:"iterations", step:1})
createSlider({name:"Escape Radius", min:0.2, max:4, key:"escapeRadius", step:0.1})
createSlider({name:"Color Period", min:10, max:50, key:"colorPeriod", step:1})
color1Picker.value = rgbToHex(...state.color1);
color2Picker.value = rgbToHex(...state.color2);
color1Picker.addEventListener("input", ()=>{
    state.color1 = hexToRgb(color1Picker.value);
})
color2Picker.addEventListener("input", ()=>{
    state.color2 = hexToRgb(color2Picker.value);
})

let sliderRight = true;

function moveSliderToBotLeft(){
    if (!sliderRight) return;
    sliderContainer.classList.remove("slide-top-right");
    void sliderContainer.offsetWidth;
    sliderContainer.classList.add("slide-bot-left");
    sliderRight = false;
}
function moveSliderToTopRight(){
    if (sliderRight) return;
    sliderContainer.classList.remove("slide-bot-left");
    void sliderContainer.offsetWidth; 
    sliderContainer.classList.add("slide-top-right");
    sliderRight = true;
}

sliderContainer.classList.add("top-right")

juliaCanvas.addEventListener("mousedown", moveSliderToBotLeft)
juliaCanvas.addEventListener("wheel", moveSliderToBotLeft)
juliaCanvas.addEventListener("touchstart", moveSliderToBotLeft)
mandelbrotCanvas.addEventListener("mousedown", moveSliderToTopRight)
mandelbrotCanvas.addEventListener("wheel", moveSliderToTopRight)
mandelbrotCanvas.addEventListener("touchstart", moveSliderToTopRight)

if (window.innerHeight>window.innerWidth){
    juliaCanvas.style.width = "100vw";
    juliaCanvas.style.height = "50vh";
    mandelbrotCanvas.style.width = "100vw";
    mandelbrotCanvas.style.height = "50vh";
} else {
    juliaCanvas.style.width = "50vw";
    juliaCanvas.style.height = "100vh";
    mandelbrotCanvas.style.width = "50vw";
    mandelbrotCanvas.style.height = "100vh";
}

let startTime = null;

function animateEscape(timestamp){
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const t = Math.min(elapsed/startUpDuration, 1);
    const value = startUpValue*Math.pow(startUpEndValue/startUpValue, t);
    iterationSlider.value = inverseLogScale(value);
    iterationInput.value = value.toFixed(0);
    state.iterations = value;
    if (t<1){
        requestAnimationFrame(animateEscape);
    }
}

requestAnimationFrame(animateEscape);