// Approved continuous floor plan. Coordinates and clearances are in metres.
import {souvenirHeaps} from './souvenir-layout.96b49d21ce7e.js';
export const WIDTH=64, DEPTH=69;
export const rooms=[
  {id:'entry',x:28,z:61,w:8,d:6},{id:'yellow',x:26,z:46,w:12,d:8},
  {id:'repeat1',x:14,z:46,w:8,d:7},{id:'repeat2',x:42,z:46,w:8,d:7},
  {id:'repeat3',x:15,z:57,w:8,d:7},{id:'repeat4',x:43,z:57,w:8,d:7},
  {id:'repeat5',x:2,z:57,w:8,d:7},{id:'repeat6',x:54,z:58,w:8,d:6},
  {id:'civita',x:4,z:44,w:7,d:9},{id:'napoli',x:54,z:45,w:7,d:9},
  {id:'heap',x:25,z:24,w:14,d:12},{id:'paris',x:5,z:25,w:10,d:8},
  {id:'milan',x:48,z:25,w:10,d:8},{id:'oxford',x:5,z:12,w:8,d:8},
  {id:'london',x:18,z:12,w:9,d:8},{id:'warsaw',x:31,z:12,w:8,d:8},
  {id:'rome',x:44,z:12,w:10,d:8},{id:'empty1',x:1,z:4,w:9,d:5},
  {id:'empty2',x:16,z:3,w:7,d:5},{id:'empty3',x:56,z:3,w:6,d:6},
  {id:'empty4',x:18,z:22,w:5,d:5},{id:'empty5',x:40,z:22,w:5,d:6},
  {id:'empty6',x:16,z:34,w:7,d:3},{id:'empty7',x:41,z:33,w:6,d:4},
  {id:'letter',x:27,z:2,w:10,d:6},{id:'box',x:43,z:2,w:8,d:6}
];
export const corridors=[
  [31,54,2,7],[22,49,4,2],[38,49,4,2],[18,53,2,4],[22,60,9,2],
  [46,53,2,4],[33,60,10,2],[31,40,2,6],[9,39,28,2],[35,39,2,5],
  [35,42,22,2],[31,36,2,3],[8,41,2,3],[55,44,2,1],[5,53,2,4],
  [10,60,5,2],[56,54,2,4],[51,60,3,2],[9,33,2,6],[9,20,2,5],
  [13,15,5,2],[27,15,4,2],[39,15,5,2],[51,20,2,5],[53,33,2,9],
  [15,29,10,2],[31,20,2,4],[7,9,2,3],[19,8,2,4],[58,9,2,8],
  [54,15,4,2],[20,20,2,2],[45,25,3,2],[19,37,2,2],[43,37,2,5],
  [2,22,2,5],[2,25,3,2],[31,8,2,4],[33,10,3,2],[34,11,2,1],[37,4,6,2],
  // Narrow passages traced on the annotated plan (one grid cell wide).
  [10,5,6,1],[23,5,4,1],[51,4,5,1],[48,8,1,4],[3,9,1,13],
  [23,25,2,1],[16,31,1,3],[42,28,1,5],[24,41,1,8],[50,48,4,1]
];
export const pools=[{x:46,z:13.5,w:5,d:5},{x:49.5,z:26.7,w:6,d:4},{x:57,z:4,w:3,d:3}];
export const columns=[
  [28,26,.7,.7],[35,26,.7,.7],[28,33,.7,.7],[35,33,.7,.7],
  [29,48,.55,2.8],[35,48,.55,2.8],[16,48,.55,2],[46,48,.55,2],
  [17,58,.55,2.7],[49,59,.55,2],[4,58,.55,2.7],[59,59,.55,2],
  [6,5,.5,2],[18,4,.5,2]
];
export const floor=Array.from({length:DEPTH},()=>Array(WIDTH).fill(false));
function carve(x,z,w,d){for(let j=z;j<z+d;j++)for(let i=x;i<x+w;i++)floor[j][i]=true;}
rooms.forEach(r=>carve(r.x,r.z,r.w,r.d));corridors.forEach(c=>carve(...c));
export const isFloor=(x,z)=>!!floor[Math.floor(z)]?.[Math.floor(x)];
export function zoneAt(x,z){
  if(z<12&&x>=27&&x<52)return 'yellow';
  if((x>=30&&z<24)||(x>=40&&z<38))return 'pool';
  if((x<25&&z<39)||(x<30&&z<22))return 'hospital';
  return 'yellow';
}
export const heights={yellow:2.85,hospital:3.05,pool:4.25};
export function poolAt(x,z){
  return pools.find(p=>x>=p.x && x<p.x+p.w && z>=p.z && z<p.z+p.d);
}
export function collides(x,z,r=.23,feet=0,basin=null){
  for(const heap of souvenirHeaps)if(Math.hypot(x-heap.x,z-heap.z)<heap.r+r)return true;
  for(let j=Math.floor(z-r);j<=Math.floor(z+r);j++)for(let i=Math.floor(x-r);i<=Math.floor(x+r);i++){
    if(floor[j]?.[i])continue;
    const dx=x-Math.max(i,Math.min(x,i+1)),dz=z-Math.max(j,Math.min(z,j+1));
    if(dx*dx+dz*dz<r*r)return true;
  }
  for(const [bx,bz,w,d] of columns){
    const dx=x-Math.max(bx,Math.min(x,bx+w)),dz=z-Math.max(bz,Math.min(z,bz+d));
    if(dx*dx+dz*dz<r*r)return true;
  }
  if(feet>.015)return false;
  if(basin)return x<basin.x+r || x>basin.x+basin.w-r || z<basin.z+r || z>basin.z+basin.d-r;
  for(const p of pools){
    const dx=x-Math.max(p.x,Math.min(x,p.x+p.w)),dz=z-Math.max(p.z,Math.min(z,p.z+p.d));
    if(dx*dx+dz*dz<r*r)return true;
  }
  return false;
}
export function movePlayer(state,dx,dz,feet=0){
  const basin=poolAt(state.x,state.z);
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.12));
  for(let n=0;n<steps;n++){
    if(!collides(state.x+dx/steps,state.z,.23,feet,basin))state.x+=dx/steps;
    if(!collides(state.x,state.z+dz/steps,.23,feet,basin))state.z+=dz/steps;
  }
}
export function lineOfSight(x,z,tx,tz){
  const steps=Math.ceil(Math.hypot(tx-x,tz-z)*2.5);
  for(let i=1;i<steps;i++){const f=i/steps;if(!isFloor(x+(tx-x)*f,z+(tz-z)*f))return false;}
  return true;
}
