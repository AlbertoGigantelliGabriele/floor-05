import assert from 'node:assert/strict';
import * as THREE from './vendor/three.module.min.js';
import {mirrorCamera} from './reflections.js';
for(const yaw of [0,.7,-1.2])for(const pitch of [-.2,-.7]){
  const c=new THREE.PerspectiveCamera(74,1.5,.055,100);c.position.set(53,1.66,32);c.rotation.set(pitch,yaw,0,'YXZ');c.updateMatrixWorld();
  const {camera,matrix}=mirrorCamera(c);assert.ok(Math.abs(camera.position.y+2.1)<1e-8);
  for(const [x,z] of [[50,29],[54,27],[52,31]]){
    const p=new THREE.Vector3(x,-.22,z),a=p.clone().project(c),b=p.clone().project(camera);
    assert.ok(Math.abs(a.x+b.x)<1e-9&&Math.abs(a.y-b.y)<1e-9,'Mirrored projection preserves water height and reverses handedness');
    const uv=new THREE.Vector4(x,-.22,z,1).applyMatrix4(matrix);
    assert.ok(Math.abs(uv.x/uv.w-(b.x+1)/2)<1e-9);
  }
}
console.log('PASS: mirrored camera and water projection at six viewing angles.');
