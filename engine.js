import * as THREE from './vendor/three.module.min.js';
import {createTextures} from './materials.js?v=raw-1';
import {buildArchitecture} from './architecture.js?v=raw-1';
import {zoneAt,movePlayer} from './layout.js';

const canvas=document.getElementById('world');
const failure=document.getElementById('failure');
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}
catch(error){failure.hidden=false;throw error;}
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(74,1,.055,100);
camera.rotation.order='YXZ';
const uniforms={
  time:{value:0},fogColor:{value:new THREE.Color('#68684d')},fogDensity:{value:.023},
  lamps:{value:Array.from({length:8},()=>new THREE.Vector3(1000,1000,1000))}
};
const textures=createTextures(Math.min(8,renderer.capabilities.getMaxAnisotropy()));
const building=buildArchitecture(scene,textures,uniforms);
const player={x:32,z:65.2,yaw:0,pitch:-.015};
const keys=new Set();
let last=performance.now(),time=0,steps=0,lampTimer=1,dragging=false,muted=false;
let audio=null,humGain=null,noiseGain=null,filter=null;
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const moods={yellow:{fog:'#797653',density:.021},hospital:{fog:'#45675b',density:.025},pool:{fog:'#8aada5',density:.023}};
const fogTarget=new THREE.Color();

function resize(){
  const w=innerWidth,h=innerHeight;
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5,Math.sqrt(2100000/(w*h))));
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
}
resize();addEventListener('resize',resize);

function startAudio(){
  if(audio){if(audio.state==='suspended')audio.resume().catch(()=>{});return;}
  const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return;
  audio=new Context();
  humGain=audio.createGain();humGain.gain.value=.011;humGain.connect(audio.destination);
  for(const hz of [50,100]){const osc=audio.createOscillator();osc.type='sine';osc.frequency.value=hz;osc.connect(humGain);osc.start();}
  const buffer=audio.createBuffer(1,audio.sampleRate*3,audio.sampleRate),data=buffer.getChannelData(0);
  let previous=0;for(let i=0;i<data.length;i++){previous=(previous+Math.random()*.03-.015)*.98;data[i]=previous;}
  const source=audio.createBufferSource();source.buffer=buffer;source.loop=true;
  filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=850;
  noiseGain=audio.createGain();noiseGain.gain.value=.07;
  source.connect(filter);filter.connect(noiseGain);noiseGain.connect(audio.destination);source.start();
  audio.resume().catch(()=>{});
}
canvas.addEventListener('click',()=>{
  canvas.focus({preventScroll:true});startAudio();
  if(document.pointerLockElement!==canvas&&canvas.requestPointerLock){
    try{const lock=canvas.requestPointerLock();if(lock?.catch)lock.catch(()=>{});}catch{}
  }
});
canvas.addEventListener('mousedown',e=>{if(e.button===0)dragging=true;});
addEventListener('mouseup',()=>{dragging=false;});
addEventListener('mousemove',e=>{
  if(document.pointerLockElement!==canvas&&!dragging)return;
  player.yaw-=e.movementX*.0020;
  player.pitch=Math.max(-1.25,Math.min(1.25,player.pitch-e.movementY*.0018));
});
document.addEventListener('pointerlockchange',()=>{keys.clear();dragging=false;});
addEventListener('keydown',e=>{
  if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight'].includes(e.code)){
    e.preventDefault();keys.add(e.code);
  }
  if(e.code==='KeyM'&&!e.repeat){muted=!muted;}
});
addEventListener('keyup',e=>keys.delete(e.code));
addEventListener('blur',()=>{keys.clear();dragging=false;if(audio)audio.suspend().catch(()=>{});});
document.addEventListener('visibilitychange',()=>{
  keys.clear();if(document.hidden&&audio)audio.suspend().catch(()=>{});last=performance.now();
});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();keys.clear();failure.textContent='La scena ha perso il contesto grafico. Ricarica la pagina per riprendere.';failure.hidden=false;});

function animate(now){
  requestAnimationFrame(animate);
  if(document.hidden)return;
  const dt=Math.min(.05,(now-last)/1000);last=now;time+=dt;
  let forward=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'));
  let sideways=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
  const length=Math.hypot(forward,sideways);
  if(length){
    forward/=length;sideways/=length;
    const speed=(keys.has('ShiftLeft')||keys.has('ShiftRight')?3.8:2.35)*dt;
    movePlayer(player,(-Math.sin(player.yaw)*forward+Math.cos(player.yaw)*sideways)*speed,
      (-Math.cos(player.yaw)*forward-Math.sin(player.yaw)*sideways)*speed);
    steps+=speed;
  }
  camera.position.set(player.x,1.66+(length&&!reduceMotion?Math.sin(steps*8)*.012:0),player.z);
  camera.rotation.set(player.pitch,player.yaw,0,'YXZ');
  const zone=zoneAt(player.x,player.z),mood=moods[zone];
  fogTarget.set(mood.fog);uniforms.fogColor.value.lerp(fogTarget,1-Math.exp(-dt*2));
  uniforms.fogDensity.value+=(mood.density-uniforms.fogDensity.value)*Math.min(1,dt*2);
  uniforms.time.value=time;scene.background=uniforms.fogColor.value;
  lampTimer+=dt;
  if(lampTimer>.25){
    lampTimer=0;
    const near=[...building.lamps].sort((a,b)=>(a.x-player.x)**2+(a.z-player.z)**2-(b.x-player.x)**2-(b.z-player.z)**2).slice(0,8);
    near.forEach((l,i)=>uniforms.lamps.value[i].set(l.x,l.y,l.z));
  }
  if(audio&&audio.state==='running'){
    humGain.gain.setTargetAtTime(muted?0:zone==='pool'?.003:.011,audio.currentTime,.4);
    noiseGain.gain.setTargetAtTime(muted?0:zone==='pool'?.14:.055,audio.currentTime,.4);
    filter.frequency.setTargetAtTime(zone==='pool'?1400:650,audio.currentTime,.5);
  }
  renderer.render(scene,camera);
}
// Non-interactive diagnostics for QA; no teleport controls or debug interface.
canvas.dataset.ready='true';canvas.dataset.rooms=String(building.roomCount);
canvas.dataset.renderer='webgl';
requestAnimationFrame(animate);
