// Approved continuous floor plan. Coordinates and clearances are in metres.
import {souvenirHeaps as originalHeaps} from './souvenir-layout.js';
export const WIDTH=102, DEPTH=116;
const templates=[
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
const originalPools=[{x:46,z:13.5,w:5,d:5},{x:49.5,z:26.7,w:6,d:4},{x:57,z:4,w:3,d:3}];
const originalColumns=[
  [28,26,.7,.7],[35,26,.7,.7],[28,33,.7,.7],[35,33,.7,.7],
  [29,48,.55,2.8],[35,48,.55,2.8],[16,48,.55,2],[46,48,.55,2],
  [17,58,.55,2.7],[49,59,.55,2],[4,58,.55,2.7],[59,59,.55,2],
  [6,5,.5,2],[18,4,.5,2]
];
// Shuffle complete room interiors once per page load. All measurements are metres.
const shuffled=templates.slice(1);
for(let i=shuffled.length-1;i>0;i--){
  const j=Math.floor(Math.random()*(i+1));
  [shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];
}
function styleOf(room){
  const x=room.x+room.w/2,z=room.z+room.d/2;
  if(z<12 && x>=27 && x<52)return 'yellow';
  if((x>=30 && z<24)||(x>=40 && z<38))return 'pool';
  return ((x<25 && z<39)||(x<30 && z<22))?'hospital':'yellow';
}
function place(source,cx,cz){
  const x=cx-Math.floor(source.w/2),z=cz-Math.floor(source.d/2);
  return {...source,x,z,dx:x-source.x,dz:z-source.z,style:styleOf(source)};
}
const grid=shuffled.map((room,i)=>place(room,10+(i%5)*20,10+Math.floor(i/5)*20));
const entry=place(templates[0],50,110);
export const spawn={x:50,z:111.2};
export const rooms=[entry,...grid];
function owner(x,z){
  const source=templates.find(r=>x>=r.x && x<r.x+r.w && z>=r.z && z<r.z+r.d);
  return rooms.find(r=>r.id===source.id);
}
export const pools=originalPools.map(p=>{
  const r=owner(p.x,p.z);return {...p,x:p.x+r.dx,z:p.z+r.dz};
});
export const columns=originalColumns.map(([x,z,w,d])=>{
  const r=owner(x,z);return [x+r.dx,z+r.dz,w,d];
});
export const souvenirHeaps=originalHeaps.map(h=>{
  const r=rooms.find(r=>r.id===h.id);return {...h,x:h.x+r.dx,z:h.z+r.dz};
});
export const corridors=[];
const floorStyles=Array.from({length:DEPTH},()=>Array(WIDTH).fill(null));
function carve(x,z,w,d,style){
  for(let j=z;j<z+d;j++)for(let i=x;i<x+w;i++)floorStyles[j][i]=style;
}
for(const r of rooms)carve(r.x,r.z,r.w,r.d,r.style);
function connect(a,b,horizontal){
  const low=Math.max(horizontal?a.z:a.x,horizontal?b.z:b.x);
  const high=Math.min(horizontal?a.z+a.d:a.x+a.w,horizontal?b.z+b.d:b.x+b.w);
  // Offset entrances towards one side so the opening can hide behind a corner.
  const lane=Math.random()<.5?low:high-1;
  const start=horizontal?a.x+a.w:a.z+a.d;
  const length=(horizontal?b.x:b.z)-start;
  const rect=horizontal?[start,lane,length,1]:[lane,start,1,length];
  corridors.push(rect);carve(...rect,a.style);
}
for(let i=0;i<grid.length;i++){
  if(i%5<4)connect(grid[i],grid[i+1],true);
  if(i<20)connect(grid[i],grid[i+5],false);
}
connect(grid[22],entry,false);
export const floor=floorStyles.map(row=>row.map(Boolean));
export const isFloor=(x,z)=>!!floor[Math.floor(z)]?.[Math.floor(x)];
export const zoneAt=(x,z)=>floorStyles[Math.floor(z)]?.[Math.floor(x)]||'yellow';
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
