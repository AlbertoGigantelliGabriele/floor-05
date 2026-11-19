import assert from 'node:assert/strict';
import {spawn,corridors,rooms,collides,movePlayer,WIDTH,DEPTH,pools,zoneAt} from './layout.js';
// Flood fill uses player clearance, not just adjacent floor tiles.
const resolution=4,w=WIDTH*resolution,d=DEPTH*resolution;
const seen=new Uint8Array(w*d),queue=[[Math.round(spawn.x*resolution),Math.round(spawn.z*resolution)]];let cursor=0;
while(cursor<queue.length){
  const [ix,iz]=queue[cursor++];if(ix<0||iz<0||ix>=w||iz>=d)continue;
  const k=iz*w+ix;if(seen[k]||collides(ix/resolution,iz/resolution))continue;
  seen[k]=1;queue.push([ix+1,iz],[ix-1,iz],[ix,iz+1],[ix,iz-1]);
}
for(const room of rooms){
  let reached=false;
  for(let z=room.z+1;z<room.z+room.d-1;z+=.25)for(let x=room.x+1;x<room.x+room.w-1;x+=.25)
    if(seen[Math.round(z*resolution)*w+Math.round(x*resolution)])reached=true;
  assert.ok(reached,`Room inaccessible with player clearance: ${room.id}`);
}
const zones=new Set();for(let z=0;z<d;z++)for(let x=0;x<w;x++)if(seen[z*w+x])zones.add(zoneAt(x/resolution,z/resolution));
assert.deepEqual([...zones].sort(),['hospital','pool','yellow']);
assert.equal(collides(spawn.x,spawn.z),false,'Spawn must be clear');
const player={...spawn};movePlayer(player,100,0);
assert.ok(player.x<spawn.x+4&&player.x>spawn.x+3,'Large movement cannot cross east wall');
assert.ok(!collides(player.x,player.z),'Wall sliding ends outside geometry');
for(const p of pools)assert.ok(collides(p.x+p.w/2,p.z+p.d/2),'Pool boundary prevents falling');
console.log(`PASS: ${rooms.length} rooms reachable with radius 0.23m; all three zones connected; wall and basin collisions; safe spawn.`);

for(const [x,z,w,d] of corridors){assert.equal(Math.min(w,d),1);assert.ok(Math.max(w,d)>=6);assert.ok(seen[Math.round((z+d/2)*resolution)*WIDTH*resolution+Math.round((x+w/2)*resolution)]);}
