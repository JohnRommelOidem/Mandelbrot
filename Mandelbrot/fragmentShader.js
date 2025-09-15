export default `#version 300 es

#define PI 3.1415962

precision highp float;
uniform vec2 u_resolution;
uniform vec2 u_zoomCenter;
uniform float u_zoomSize;
uniform int u_maxIterations;
uniform float u_escapeRadius;
uniform int u_colorPeriod;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec2 u_cursorPoint;
uniform vec2 u_mandelbrotPoint;
uniform bool u_lockC;

out vec4 outputColor;
const vec3 escapeColor = vec3(0.0,0.07,0.17);
const int N = 4;
vec3 colors[N];

vec2 f(vec2 z, vec2 c){
    return vec2(
        z.x*z.x-z.y*z.y+c.x,
        2.0*z.x*z.y+c.y
    );
}
vec3 palette(float iterations){
    float t = fract(iterations/float(u_colorPeriod));
    float idx = t*float(N);
    int i0 = int(floor(idx));
    int i1 = (i0+1)%N;
    float localT = fract(idx);
    return mix(colors[i0], colors[i1], 1.0-pow(cos(localT*PI*0.5),2.0));
}


void main(){
    colors[0] = u_color1;
    colors[1] = vec3(1.0,1.0,1.0);
    colors[2] = u_color2;
    colors[3] = vec3(0.0,0.0,0.0);
    vec2 uv = gl_FragCoord.xy/u_resolution;
    vec2 c = u_zoomCenter+(uv-vec2(0.75, 0.5))*u_zoomSize*vec2(u_resolution.x/u_resolution.y, 1.0);
    vec2 z = u_mandelbrotPoint;
    int iterations;
    bool escaped = false;
    for(int i=0;i<u_maxIterations;i++){
        iterations = i;
        z = f(z,c);
        if (length(z)>u_escapeRadius){
            escaped=true;
            break;
        }
    }
    outputColor = escaped?vec4(palette(float(iterations)-log2(log2(length(z)))-1.0), 1.0):vec4(escapeColor, 1.0);
    if (
        ((abs(gl_FragCoord.x-u_cursorPoint.x)<2.0&&abs(gl_FragCoord.y-u_cursorPoint.y)<50.0)||
        (abs(gl_FragCoord.x-u_cursorPoint.x)<50.0&&abs(gl_FragCoord.y-u_cursorPoint.y)<2.0)) &&
        !u_lockC
    ){
        outputColor.rgb = 1.0-outputColor.rgb;
    }
}`;