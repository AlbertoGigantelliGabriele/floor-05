import {createApparitions} from './apparitions.js';
import * as THREE from './vendor/three.module.min.js';
import {createTextures} from './materials.js?v=seam-fix-5';
import {buildArchitecture} from './architecture.js?v=seam-fix-5';
import {zoneAt,poolAt,movePlayer,heights} from './layout.js';
import {installTouchControls,createJump} from './controls.js?v=touch-1';
import {createGait,createFootsteps} from './footsteps.js';
import {createReflections} from './reflections.js';

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
const reflections=createReflections(renderer,scene,building.waterMeshes,uniforms);
const updatePhotos=createApparitions(scene);
const player={x:32,z:65.2,yaw:0,pitch:-.015};
const keys=new Set();
const jump=createJump();
const gait=createGait();
const touch=installTouchControls(canvas,[...document.querySelectorAll('#touch-controls button')],{
  look:(x,y)=>{player.yaw-=x;player.pitch=Math.max(-1.25,Math.min(1.25,player.pitch-y));},
  jump:()=>jump.start(),activate:()=>startAudio()
});
document.body.classList.toggle('has-touch',navigator.maxTouchPoints>0);
let last=performance.now(),time=0,steps=0,lampTimer=1,dragging=false,muted=false;
let audio=null,humGain=null,noiseGain=null,filter=null,poolGain=null,echo=null;
let nextDrip=3;
let footsteps=null, splashBuffer=null, splashGain=null;
const splashBytes=fetch(new URL('./audio/pool-entry-soft.mp3',import.meta.url))
  .then(response=>response.ok?response.arrayBuffer():null).catch(()=>null);
function playSplash(speed){
  if(!splashBuffer)return;
  const source=audio.createBufferSource(),level=audio.createGain();
  source.buffer=splashBuffer;
  source.playbackRate.value=.94+Math.random()*.12;
  level.gain.value=Math.min(.72,.33+.055*speed);
  source.connect(level);level.connect(splashGain);
  source.onended=()=>{source.disconnect();level.disconnect();};
  source.start();
}
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
  const master=audio.createGain(),limiter=audio.createDynamicsCompressor();master.gain.value=2.8;
  limiter.threshold.value=-8;limiter.knee.value=6;limiter.ratio.value=8;limiter.attack.value=.003;limiter.release.value=.15;
  master.connect(limiter);limiter.connect(audio.destination);
  humGain=audio.createGain();humGain.gain.value=.011;humGain.connect(master);
  for(const hz of [100,150,201]){const osc=audio.createOscillator();osc.type='sine';osc.frequency.value=hz;osc.connect(humGain);osc.start();}
  const buffer=audio.createBuffer(1,audio.sampleRate*3,audio.sampleRate),data=buffer.getChannelData(0);
  let previous=0;for(let i=0;i<data.length;i++){previous=(previous+Math.random()*.10-.05)*.98;data[i]=previous;}
  const source=audio.createBufferSource();source.buffer=buffer;source.loop=true;
  filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=850;
  noiseGain=audio.createGain();noiseGain.gain.value=.07;
  source.connect(filter);filter.connect(noiseGain);noiseGain.connect(master);source.start();
  // Short feedback echo gives the tiled rooms a different acoustic space.
  poolGain=audio.createGain();poolGain.gain.value=0;poolGain.connect(master);
  echo=audio.createDelay(1);echo.delayTime.value=.23;
  const feedback=audio.createGain();feedback.gain.value=.32;
  const damping=audio.createBiquadFilter();damping.type='lowpass';damping.frequency.value=1800;
  echo.connect(damping);damping.connect(feedback);feedback.connect(echo);damping.connect(poolGain);
  footsteps=createFootsteps(audio,echo,master);
  splashGain=audio.createGain();splashGain.connect(master);
  splashBytes.then(bytes=>bytes && audio.decodeAudioData(bytes)).then(buffer=>{splashBuffer=buffer;}).catch(()=>{});
  audio.resume().catch(()=>{});
}
function waterDrop(){
  const now=audio.currentTime,osc=audio.createOscillator(),gain=audio.createGain();
  osc.type='sine';osc.frequency.setValueAtTime(950,now);osc.frequency.exponentialRampToValueAtTime(380,now+.12);
  gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.022,now+.006);gain.gain.exponentialRampToValueAtTime(.0001,now+.23);
  osc.connect(gain);gain.connect(poolGain);gain.connect(echo);osc.start(now);osc.stop(now+.25);
  osc.onended=()=>{osc.disconnect();gain.disconnect();};
}
canvas.addEventListener('pointerdown',e=>{
  if(e.pointerType!=='mouse'||e.button!==0)return;
  canvas.focus({preventScroll:true});startAudio();
  if(document.pointerLockElement!==canvas&&canvas.requestPointerLock){
    try{const lock=canvas.requestPointerLock();if(lock?.catch)lock.catch(()=>{});}catch{}
  }
});
canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button===0)dragging=true;});
addEventListener('pointerup',()=>{dragging=false;});
addEventListener('pointercancel',()=>{dragging=false;});
addEventListener('mousemove',e=>{
  if(e.sourceCapabilities?.firesTouchEvents)return;
  if(document.pointerLockElement!==canvas&&!dragging)return;
  player.yaw-=e.movementX*.0020;
  player.pitch=Math.max(-1.25,Math.min(1.25,player.pitch-e.movementY*.0018));
});
document.addEventListener('pointerlockchange',()=>{keys.clear();dragging=false;});
addEventListener('keydown',e=>{
  if(document.querySelector('#album-lock').open)return;
  if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight'].includes(e.code)){
    e.preventDefault();keys.add(e.code);
  }
  if(e.code==='KeyM'&&!e.repeat){muted=!muted;footsteps?.mute(muted);if(splashGain)splashGain.gain.setTargetAtTime(muted?0:1,audio.currentTime,.012);}
  if(e.code==='Space'){e.preventDefault();if(!e.repeat)jump.start();}
});
addEventListener('keyup',e=>keys.delete(e.code));
addEventListener('blur',()=>{keys.clear();dragging=false;gait.reset();if(audio)audio.suspend().catch(()=>{});});
document.addEventListener('visibilitychange',()=>{
  keys.clear();gait.reset();if(document.hidden&&audio)audio.suspend().catch(()=>{});last=performance.now();
});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();keys.clear();touch.reset();document.body.classList.remove('scene-ready');failure.textContent='La scena ha perso il contesto grafico. Ricarica la pagina per riprendere.';failure.hidden=false;});

function animate(now){
  requestAnimationFrame(animate);
  if(document.hidden)return;
  const dt=Math.min(.05,(now-last)/1000);last=now;time+=dt;
  let forward=touch.y+Number(touch.forward||keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'));
  let sideways=touch.x+Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
  const length=Math.hypot(forward,sideways);
  const running=touch.running||keys.has('ShiftLeft')||keys.has('ShiftRight');
  const oldX=player.x,oldZ=player.z;
  if(length){
    forward/=Math.max(1,length);sideways/=Math.max(1,length);
    const speed=(running?3.8:2.35)*dt;
    movePlayer(player,(-Math.sin(player.yaw)*forward+Math.cos(player.yaw)*sideways)*speed,
      (-Math.cos(player.yaw)*forward-Math.sin(player.yaw)*sideways)*speed,jump.feet);
  }
  const travel=Math.hypot(player.x-oldX,player.z-oldZ);
  const basin=poolAt(player.x,player.z), ground=basin?-.72:0, before=jump.feet;
  const elevation=jump.update(dt,heights[zoneAt(player.x,player.z)],ground);
  if(basin && before>-.22 && elevation<=-.22 && audio?.state==='running' && !muted)playSplash((before-elevation)/dt);
  if(elevation===ground)steps+=travel;
  camera.position.set(player.x,1.66+elevation+(travel>.0001&&!elevation&&!reduceMotion?Math.sin(steps*8)*.012:0),player.z);
  camera.rotation.set(player.pitch,player.yaw,0,'YXZ');
  const zone=zoneAt(player.x,player.z),mood=moods[zone];
  const footfall=gait.update(travel,elevation-ground,running);
  if(footfall&&audio?.state==='running'&&!muted)footsteps.play(basin?'water':zone,running,footfall==='land');
  fogTarget.set(mood.fog);uniforms.fogColor.value.lerp(fogTarget,1-Math.exp(-dt*2));
  uniforms.fogDensity.value+=(mood.density-uniforms.fogDensity.value)*Math.min(1,dt*2);
  uniforms.time.value=reduceMotion?0:time;scene.background=uniforms.fogColor.value;
  lampTimer+=dt;
  if(lampTimer>.25){
    lampTimer=0;
    const near=[...building.lamps].sort((a,b)=>(a.x-player.x)**2+(a.z-player.z)**2-(b.x-player.x)**2-(b.z-player.z)**2).slice(0,8);
    near.forEach((l,i)=>uniforms.lamps.value[i].set(l.x,l.y,l.z));
  }
  if(audio&&audio.state==='running'){
    const closest=uniforms.lamps.value[0];
    const proximity=1/(1+Math.hypot(closest.x-player.x,closest.z-player.z)*.6);
    const buzz=zone==='yellow'?.005+proximity*.009*(.92+.08*Math.sin(time*.64)):zone==='pool'?.002:.008;
    humGain.gain.setTargetAtTime(muted?0:buzz*2.6,audio.currentTime,.4);
    noiseGain.gain.setTargetAtTime(muted?0:zone==='pool'?.11*(.88+.12*Math.sin(time*.37)):zone==='hospital'?.04:.055,audio.currentTime,.4);
    filter.frequency.setTargetAtTime(zone==='pool'?1100:zone==='hospital'?340:650,audio.currentTime,.5);
    poolGain.gain.setTargetAtTime(muted||zone!=='pool'?0:.45,audio.currentTime,.3);
    if(zone==='pool'&&!muted){nextDrip-=dt;if(nextDrip<=0){waterDrop();nextDrip=3.5+Math.random()*4.5;}}
  }
  updatePhotos(camera,travel);
  reflections.update(camera,time);
  renderer.render(scene,camera);
}
// Non-interactive diagnostics for QA; no teleport controls or debug interface.
canvas.dataset.ready='true';canvas.dataset.rooms=String(building.roomCount);
canvas.dataset.renderer='webgl';
document.body.classList.add('scene-ready');
requestAnimationFrame(animate);
