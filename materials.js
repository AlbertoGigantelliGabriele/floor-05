import * as THREE from './vendor/three.module.min.js';

let seed=50317;
function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
function noise(ctx,n=12){
  const im=ctx.getImageData(0,0,512,512);
  for(let i=0;i<im.data.length;i+=4){const v=(random()-.5)*n;for(let k=0;k<3;k++)im.data[i+k]+=v;}
  ctx.putImageData(im,0,0);
}
function stains(c,amount){for(let i=0;i<22;i++){
  const x=random()*512,y=random()*512,r=30+random()*150;
  const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(52,49,26,${random()*amount})`);g.addColorStop(1,'rgba(52,49,26,0)');
  c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
}}
function tiles(c,base,grout,tileSize){
  c.fillStyle=grout;c.fillRect(0,0,512,512);
  for(let y=0;y<512;y+=tileSize)for(let x=0;x<512;x+=tileSize){
    c.fillStyle=base;c.fillRect(x+1,y+1,tileSize-2,tileSize-2);
    c.fillStyle=`rgba(255,255,255,${random()*.055})`;c.fillRect(x+2,y+2,tileSize-4,tileSize-4);
    c.strokeStyle='rgba(255,255,255,.13)';c.strokeRect(x+2,y+2,tileSize-4,tileSize-4);
  }
}
function texture(paint,anisotropy){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
  const c=canvas.getContext('2d');paint(c);
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
  tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.anisotropy=anisotropy;
  return tex;
}
export function createTextures(anisotropy){
  return {
    yellowWall:texture(c=>{
      c.fillStyle='#b6ad75';c.fillRect(0,0,512,512);
      // Woven, vertically repeating, slightly odd 1970s wallpaper.
      c.lineWidth=2;c.strokeStyle='rgba(101,94,53,.27)';
      for(let x=-32;x<550;x+=64){
        c.beginPath();c.moveTo(x,0);c.lineTo(x,512);c.stroke();
        for(let y=-64;y<576;y+=128){
          c.beginPath();c.moveTo(x+8,y);c.lineTo(x+28,y+35);c.lineTo(x+8,y+64);c.lineTo(x+28,y+99);c.lineTo(x+8,y+128);c.stroke();
          c.beginPath();c.moveTo(x+44,y);c.lineTo(x+24,y+35);c.lineTo(x+44,y+64);c.lineTo(x+24,y+99);c.lineTo(x+44,y+128);c.stroke();
          c.strokeRect(x+20,y+27,12,16);c.strokeRect(x+20,y+91,12,16);
        }
      }
      stains(c,.11);noise(c,9);
    },anisotropy),
    yellowFloor:texture(c=>{
      c.fillStyle='#9a936e';c.fillRect(0,0,512,512);noise(c,35);
      for(let i=0;i<24000;i++){const x=random()*512,y=random()*512;c.fillStyle=random()>.5?'rgba(54,52,29,.13)':'rgba(207,200,151,.18)';c.fillRect(x,y,1,2+random()*2);}
      stains(c,.06);
    },anisotropy),
    hospitalWall:texture(c=>{
      c.fillStyle='#b3c2b4';c.fillRect(0,0,512,260);
      c.fillStyle='#507f6b';c.fillRect(0,260,512,252);
      c.fillStyle='#4a7765';c.fillRect(0,257,512,4);noise(c,4);stains(c,.035);
      c.fillStyle='rgba(222,231,218,.11)';c.fillRect(0,505,512,2);
    },anisotropy),
    hospitalFloor:texture(c=>{
      c.fillStyle='#6e8e79';c.fillRect(0,0,512,512);noise(c,14);
      for(let i=0;i<4500;i++){c.fillStyle=random()>.5?'rgba(210,221,197,.13)':'rgba(33,67,48,.09)';c.fillRect(random()*512,random()*512,1.4,1.4);}
      c.fillStyle='rgba(35,62,48,.09)';c.fillRect(0,0,1,512);c.fillRect(0,0,512,1);
    },anisotropy),
    poolWall:texture(c=>{tiles(c,'#c8d7cc','#9daea4',64);noise(c,3);},anisotropy),
    poolFloor:texture(c=>{tiles(c,'#c5d2c4','#8caaa0',64);noise(c,5);},anisotropy),
    poolBottom:texture(c=>{tiles(c,'#76a7a4','#668f8d',32);noise(c,5);},anisotropy),
    ceiling:texture(c=>{
      tiles(c,'#c4c5b1','#8f9587',256);noise(c,12);
      c.fillStyle='rgba(54,59,43,.22)';for(let i=0;i<5400;i++)c.fillRect(random()*512,random()*512,1,1);
    },anisotropy),
    plaster:texture(c=>{c.fillStyle='#d2dcd3';c.fillRect(0,0,512,512);noise(c,6);},anisotropy),
    trimYellow:texture(c=>{c.fillStyle='#777147';c.fillRect(0,0,512,512);noise(c,7);},anisotropy),
    trimHospital:texture(c=>{c.fillStyle='#3b6350';c.fillRect(0,0,512,512);noise(c,5);},anisotropy),
    trimPool:texture(c=>{c.fillStyle='#577f7b';c.fillRect(0,0,512,512);noise(c,4);},anisotropy),
    light:texture(c=>{
      c.fillStyle='#fffce9';c.fillRect(0,0,512,512);
      c.fillStyle='rgba(161,174,156,.24)';for(let x=0;x<512;x+=8)c.fillRect(x,0,1,512);
    },anisotropy)
  };
}

export const vertexShader=`
  attribute vec3 light;
  varying vec2 vUv;
  varying vec3 vLight;
  varying vec3 vWorld;
  varying vec3 vNormal;
  void main(){
    vUv=uv;vLight=light;
    vWorld=(modelMatrix*vec4(position,1.)).xyz;
    vNormal=normalize(mat3(modelMatrix)*normal);
    gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);
  }
`;
export const fragmentShader=`
  uniform sampler2D map;
  uniform vec3 fogColor;
  uniform float fogDensity;
  uniform float gloss;
  uniform float emission;
  uniform float time;
  uniform vec3 lamps[8];
  varying vec2 vUv;varying vec3 vLight;varying vec3 vWorld;varying vec3 vNormal;
  void main(){
    vec3 albedo=texture2D(map,vUv).rgb;
    vec3 color=albedo*vLight;
    vec3 view=normalize(cameraPosition-vWorld);
    if(gloss>0.0 && vNormal.y>.5){
      vec3 ray=reflect(-view,normalize(vNormal));
      if(ray.y>.025){
        for(int i=0;i<8;i++){
          float t=(lamps[i].y-vWorld.y)/ray.y;
          vec2 d=vWorld.xz+ray.xz*t-lamps[i].xz;
          float halo=exp(-dot(d,d)*2.5);
          float falloff=1./(1.+t*.08);
          color+=vec3(.72,.82,.7)*halo*falloff*gloss;
        }
      }
    }
    if(emission>.0)color=albedo*emission*(.985+.015*sin(time*.7+vWorld.x));
    float distanceToEye=length(cameraPosition-vWorld);
    float fog=1.-exp(-fogDensity*fogDensity*distanceToEye*distanceToEye);
    color=mix(color,fogColor,min(.84,fog));
    gl_FragColor=vec4(color,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const waterVertex=`
  varying vec3 vWorld;
  void main(){vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}
`;
export const waterFragment=`
  uniform float time;uniform vec3 lamps[8];uniform vec3 fogColor;uniform float fogDensity;
  varying vec3 vWorld;
  void main(){
    vec2 p=vWorld.xz;
    float a=sin(p.x*3.4+p.y*2.3+time*.65), b=cos(p.x*2.1-p.y*3.8+time*.48);
    vec3 n=normalize(vec3(a*.027,1.,b*.027));
    vec3 v=normalize(cameraPosition-vWorld);
    float fresnel=pow(1.-max(dot(n,v),0.),3.);
    vec2 uv=p*4.2+vec2(a,b)*.065;
    vec2 tile=abs(fract(uv)-.5);
    float grout=smoothstep(.47,.49,max(tile.x,tile.y));
    float caustic=pow(.5+.5*sin(p.x*9.+sin(p.y*7.+time*.3)+time*.36),14.)*.04;
    vec3 color=mix(vec3(.105,.31,.30),vec3(.19,.39,.38),fresnel);
    color*=1.-grout*.22;color+=caustic;
    vec3 ray=reflect(-v,n);
    if(ray.y>.01)for(int i=0;i<8;i++){
      float t=(lamps[i].y-vWorld.y)/ray.y;
      vec2 d=p+ray.xz*t-lamps[i].xz;
      float patch=exp(-pow(d.x*2.3,4.)-pow(d.y*1.6,4.));
      color+=vec3(.65,.79,.72)*patch*(.25+.65*fresnel);
    }
    float dist=length(cameraPosition-vWorld);
    color=mix(color,fogColor,min(.7,1.-exp(-fogDensity*fogDensity*dist*dist)));
    gl_FragColor=vec4(color,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
