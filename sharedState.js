const startValue = 0.2;
const endValue = 3;
const duration = 900;

export const state = {
    iterations:500,
    escapeRadius:startValue,
    maxIter:500,
    colorPeriod:50,
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

function createSlider(sliderDetails, sliderFunction){
    const label = document.createElement("label"); 
    const text = document.createElement("span");
    text.innerText = sliderDetails.name + ":" + sliderDetails.value;
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min=String(sliderDetails.min);
    slider.max=String(sliderDetails.max);
    slider.value=String(sliderDetails.value);
    slider.step = sliderDetails.step? String(sliderDetails.step):"1"
    slider.style.marginLeft = "0.2rem";
    label.appendChild(text);
    label.appendChild(slider);
    slider.addEventListener("input", (e)=>{
        text.innerText = sliderDetails.name + ":" + e.target.valueAsNumber;
        sliderFunction(e);
    });
    label.style.display="flex";
    label.style.flexDirection="column";
    sliderContainer.appendChild(label);
    return [slider, text];
}



createSlider({name:"Iterations", min:2, max:3000, value:state.maxIter, step:1}, (e)=>{
    state.maxIter = e.target.valueAsNumber;
})
const [escapeSlider, escapeText] = createSlider({name:"Escape Radius", min:0.2, max:4, value:state.escapeRadius, step:0.1}, (e)=>{
    state.escapeRadius = e.target.valueAsNumber;
})
createSlider({name:"Color Period", min:20, max:100, value:state.colorPeriod, step:1}, (e)=>{
    state.colorPeriod = e.target.valueAsNumber;
})
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
    const t = Math.min(elapsed/duration, 1);
    const value = startValue+t*(endValue-startValue);
    escapeSlider.value = value;
    state.escapeRadius = value;
    escapeText.innerText = `Escape Radius:${value.toFixed(1)}`;
    if (t<1){
        requestAnimationFrame(animateEscape);
        console.log("asdf");
    }
}

requestAnimationFrame(animateEscape);