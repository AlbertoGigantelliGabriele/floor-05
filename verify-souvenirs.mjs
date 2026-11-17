import assert from 'node:assert/strict';
import * as THREE from './vendor/three.module.min.js';
import {rooms,pools} from './layout.js';
import {souvenirHeaps} from './souvenir-layout.js';
import {surfaceColumns,settle} from './packing.js';
for(const h of souvenirHeaps){
  const room=rooms.find(r=>r.id===h.id);assert.ok(room);
  assert.deepEqual(h.cities,[h.id]);
  assert.ok(h.x-h.r>room.x&&h.x+h.r<room.x+room.w&&h.z-h.r>room.z&&h.z+h.r<room.z+room.d,`Heap outside ${h.id}`);
  for(const p of pools){const dx=h.x-Math.max(p.x,Math.min(h.x,p.x+p.w)),dz=h.z-Math.max(p.z,Math.min(h.z,p.z+p.d));assert.ok(Math.hypot(dx,dz)>h.r,`Heap enters pool: ${h.id}`);}
}
const occupied=new Map(),box=new THREE.BoxGeometry(1,1,1).toNonIndexed();
const a=surfaceColumns([box]);assert.ok(Math.abs(settle(a,occupied)-.503)<.001);
assert.ok(Math.abs(settle(a,occupied)-1.506)<.001,'Second object rests above first');
box.translate(2,0,0);assert.ok(Math.abs(settle(surfaceColumns([box]),occupied)-.503)<.001,'Separate object rests on floor');
console.log('PASS: eight city-room assignments, heaps inside rooms and outside basins, stacking separation and ground contact.');
