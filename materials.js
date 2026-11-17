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
      c.fillStyle='#c5bd7e';c.fillRect(0,0,512,512);
      // Faded woven chevrons and double vertical stripes, based on the supplied references.
      for(let x=0;x<512;x+=128){
        c.fillStyle='rgba(127,119,53,.22)';c.fillRect(x+5,0,18,512);
        c.fillStyle='rgba(233,222,151,.48)';c.fillRect(x+7,0,2,512);c.fillRect(x+20,0,2,512);
        c.fillStyle='rgba(117,109,45,.24)';c.fillRect(x+12,0,4,512);
        for(let y=-256;y<768;y+=256){
          for(const offset of [0,65,130]){
            c.fillStyle=offset===65?'rgba(143,132,62,.20)':'rgba(153,141,65,.28)';
            c.beginPath();
            // Jagged printed edges, rather than perfectly geometric arrows.
            for(let i=0;i<=80;i+=2){const yy=y+offset+Math.abs(i-40)*1.25+(random()-.5)*9;c.lineTo(x+34+i,yy);}
            for(let i=80;i>=0;i-=2){const yy=y+offset+Math.abs(i-40)*1.25+23+(random()-.5)*8;c.lineTo(x+34+i,yy);}
            c.closePath();c.fill();
          }
          c.fillStyle='rgba(231,221,148,.42)';
          c.beginPath();c.moveTo(x+14,y+70);c.lineTo(x+19,y+85);c.lineTo(x+14,y+100);c.lineTo(x+9,y+85);c.closePath();c.fill();
        }
      }
      stains(c,.07);noise(c,13);
      c.fillStyle='rgba(244,229,169,.07)';for(let y=0;y<512;y+=2)c.fillRect(0,y,512,.5);
    },anisotropy),
    yellowFloor:texture(c=>{
      c.fillStyle='#a49a73';c.fillRect(0,0,512,512);noise(c,27);
      for(let i=0;i<42000;i++){
        const x=random()*512,y=random()*512;
        c.strokeStyle=random()>.5?'rgba(66,57,32,.22)':'rgba(222,209,160,.30)';
        c.lineWidth=.65;c.beginPath();c.moveTo(x,y);c.lineTo(x+random()*2-1,y+1+random()*2);c.stroke();
      }
      stains(c,.045);
    },anisotropy),
    hospitalWall:texture(c=>{
      c.fillStyle='#b5beb0';c.fillRect(0,0,512,260);
      c.fillStyle='#427665';c.fillRect(0,260,512,252);
      c.fillStyle='#3d6d5c';c.fillRect(0,257,512,4);noise(c,6);stains(c,.055);
      for(let i=0;i<70;i++){c.fillStyle='rgba(32,54,43,.09)';c.fillRect(random()*512,350+random()*162,3+random()*12,.7);}
      c.fillStyle='rgba(222,231,218,.11)';c.fillRect(0,505,512,2);
    },anisotropy),
    hospitalFloor:texture(c=>{
      c.fillStyle='#678571';c.fillRect(0,0,512,512);noise(c,18);
      for(let i=0;i<4500;i++){c.fillStyle=random()>.5?'rgba(210,221,197,.13)':'rgba(33,67,48,.09)';c.fillRect(random()*512,random()*512,1.4,1.4);}
      c.fillStyle='rgba(35,62,48,.18)';c.fillRect(0,0,1,512);
      for(let i=0;i<32;i++){c.strokeStyle='rgba(35,53,43,.055)';c.lineWidth=1+random()*2;c.beginPath();const x=random()*512,y=random()*512;c.moveTo(x,y);c.lineTo(x+8+random()*30,y+random()*8);c.stroke();}
    },anisotropy),
    poolWall:texture(c=>{tiles(c,'#d3ded7','#8ba4a0',64);noise(c,4);},anisotropy),
    poolFloor:texture(c=>{tiles(c,'#c4d2cb','#7f9a96',64);noise(c,8);},anisotropy),
    poolBottom:texture(c=>{tiles(c,'#7daeb4','#507f88',32);noise(c,5);},anisotropy),
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
  uniform float atmosphere;
  uniform vec3 lamps[8];
  varying vec2 vUv;varying vec3 vLight;varying vec3 vWorld;varying vec3 vNormal;
  void main(){
    vec3 albedo=texture2D(map,vUv).rgb;
    vec3 color=albedo*vLight;
    if(atmosphere>.5 && atmosphere<1.5){
      float wear=.5+.5*sin(vWorld.x*.63+sin(vWorld.z*.41))*sin(vWorld.z*.74+vWorld.x*.16);
      color*=.91+.09*wear;
      // Slow, shallow light drift: no abrupt flashes, disabled for reduced motion.
      color*=.978+.022*sin(time*.64+vWorld.x*.21+vWorld.z*.18);
      if(abs(vNormal.y)<.5)color*=.86+.14*smoothstep(.0,.65,vWorld.y);
    }
    if(atmosphere>1.5 && atmosphere<2.5){
      float scuff=.5+.5*sin(vWorld.x*.8+vWorld.z*.33)*sin(vWorld.z*1.2);
      color*=.91+.09*scuff;
      if(abs(vNormal.y)<.5)color*=.83+.17*smoothstep(0.,.55,vWorld.y);
    }
    if(atmosphere>2.5){
      // Soft reflected ripples along the lower tiled walls.
      float wave=sin(vWorld.x*4.7+vWorld.z*3.8+sin(vWorld.y*5.+time*.5));
      float crossWave=sin(vWorld.x*2.6-vWorld.z*5.1+time*.42+vWorld.y*3.);
      float caustic=pow(max(0.,1.-abs(wave+crossWave)*.6),9.);
      color+=vec3(.035,.065,.07)*caustic*exp(-max(0.,vWorld.y)*.9);
    }
    vec3 view=normalize(cameraPosition-vWorld);
    if(gloss>0.0 && vNormal.y>.5){
      vec3 ray=reflect(-view,normalize(vNormal));
      if(ray.y>.025){
        for(int i=0;i<8;i++){
          float t=(lamps[i].y-vWorld.y)/ray.y;
          vec2 d=vWorld.xz+ray.xz*t-lamps[i].xz;
          float halo=exp(-pow(d.x*2.8,4.)-pow(d.y*1.6,4.))*.65+exp(-dot(d,d)*1.4)*.18;
          float falloff=1./(1.+t*.08);
          color+=vec3(.72,.82,.7)*halo*falloff*gloss;
        }
      }
    }
    if(emission>.0)color=albedo*vLight*emission*(.985+.015*sin(time*.7+vWorld.x));
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
    float caustic=pow(max(0.,1.-abs(sin(p.x*8.+sin(p.y*5.+time*.3))+cos(p.y*7.-time*.36))*.5),12.)*.085;
    vec3 color=mix(vec3(.085,.28,.32),vec3(.22,.40,.43),fresnel);
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
