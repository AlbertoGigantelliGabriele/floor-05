import * as THREE from './vendor/three.module.min.js';
import {floor, isFloor, columns, lineOfSight} from './layout.0ecfd01fb8df.js';

const samples = ['docs/previews/yellow.jpg', 'docs/previews/hospital.jpg', 'docs/previews/pool.jpg'];

function wallSpots() {
  const spots = [];
  floor.forEach((row,z) => row.forEach((open,x) => {
    if (!open) return;
    for (const [nx,nz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      if (isFloor(x+.5-nx,z+.5-nz)) continue;
      const point = new THREE.Vector3(x+.5-.49*nx,1.52,z+.5-.49*nz);
      spots.push({point,nx,nz});
    }
  }));
  return spots;
}

export function createApparitions(scene) {
  const spots = wallSpots(), loader = new THREE.TextureLoader();
  const material = new THREE.MeshBasicMaterial({color:0xeeeeea});
  const print = new THREE.Mesh(new THREE.PlaneGeometry(1,1),material);
  print.visible = false;
  scene.add(print);
  function unobstructed(camera,p) {
    const dx=camera.position.x-p.x, dz=camera.position.z-p.z;
    if (!lineOfSight(p.x,p.z,camera.position.x,camera.position.z)) return false;
    // Interior pillars also block sight, although their floor cells are open.
    for (const [x,z,w,d] of columns) {
      const a=(x-p.x)/(dx||1e-9), b=(x+w-p.x)/(dx||1e-9);
      const c=(z-p.z)/(dz||1e-9), e=(z+d-p.z)/(dz||1e-9);
      if(Math.max(0,Math.min(a,b),Math.min(c,e)) < Math.min(1,Math.max(a,b),Math.max(c,e))) return false;
    }
    return true;
  }
  const frustum=new THREE.Frustum(), projection=new THREE.Matrix4();
  const bounds=new THREE.Sphere(new THREE.Vector3(),.60);
  let seen=false;
  // Clip the actual print against the camera planes, including at oblique angles.
  function visiblePrint(camera,spot){
    const {point,nx,nz}=spot;
    if((camera.position.x-point.x)*nx+(camera.position.z-point.z)*nz<=0)return false;
    const halfWidth=print.scale.x/2, halfHeight=print.scale.y/2;
    let polygon=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>
      new THREE.Vector3(point.x+nz*x*halfWidth,point.y+y*halfHeight,point.z-nx*x*halfWidth));
    for(const plane of frustum.planes){
      const clipped=[];
      let prev=polygon[polygon.length-1], a=plane.distanceToPoint(prev);
      for(const next of polygon){
        const b=plane.distanceToPoint(next);
        if((a>=0)!==(b>=0))clipped.push(prev.clone().lerp(next,a/(a-b)));
        if(b>=0)clipped.push(next);
        prev=next;a=b;
      }
      if(!clipped.length)return false;
      polygon=clipped;
    }
    const center=new THREE.Vector3();
    for(const vertex of polygon)center.add(vertex);
    center.divideScalar(polygon.length);
    return unobstructed(camera,center)||polygon.some(vertex=>unobstructed(camera,vertex));
  }
  const direction=new THREE.Vector3(), ahead=new THREE.Vector3();
  function onScreen(spot){
    bounds.center.copy(spot.point);
    return frustum.intersectsSphere(bounds);
  }
  let count=0, privateAlbum=false, texture=null, active=null, previous=null, bag=[];
  let distance=4+Math.random()*3;
  async function preload() {
    if (!bag.length) {
      bag=Array.from({length:count},(_,i)=>i);
      for(let i=bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}
    }
    let url;
    try {
      const index=bag.pop();
      url=privateAlbum?(await window.FloorVault.photo(index)).url:samples[index];
      texture=await loader.loadAsync(url);
      texture.colorSpace=THREE.SRGBColorSpace;
    } catch {setTimeout(preload,4000);}
    finally {if(url?.startsWith('blob:')) URL.revokeObjectURL(url);}
  }
  async function init() {
    privateAlbum=await window.FloorVault.load();
    if(privateAlbum){
      const dialog=document.querySelector('#album-lock'), form=dialog.querySelector('form');
      dialog.showModal();
      count=await new Promise(resolve=>{
        form.onsubmit=async event=>{
          event.preventDefault();
          try {const total=await window.FloorVault.unlock(form.elements.pass.value);form.reset();dialog.close();resolve(total);}
          catch {form.querySelector('output').textContent='Password errata o archivio illeggibile.';}
        };
      });
    } else count=samples.length;
    if(count) preload();
  }
  init();
  return (camera,travel)=>{
    if(!texture) return;
    camera.updateMatrixWorld();
    frustum.setFromProjectionMatrix(projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
    if(active){
      if(visiblePrint(camera,active)){seen=true;return;}
      if(seen){
        previous=active;active=null;print.visible=false;material.map=null;texture.dispose();texture=null;
        distance=5+Math.random()*8;preload();return;
      }
      // Keep the same photograph available if the player takes a different route.
      if(camera.position.distanceTo(active.point)<10)return;
      active=null;print.visible=false;distance=0;
    }
    distance-=travel;
    if(distance>0 || !travel) return;
    distance=1;
    camera.getWorldDirection(direction);
    ahead.copy(camera.position);
    // Look for a wall accessible from the current path, including the next doorway.
    for(let i=0;i<20;i++){
      const x=ahead.x+direction.x*.25,z=ahead.z+direction.z*.25;
      if(!isFloor(x,z))break;
      ahead.x=x;ahead.z=z;
    }
    const candidates=spots.filter(s=>{
      const range=camera.position.distanceTo(s.point);
      if(range<1.6 || range>9 || (previous && previous.point.distanceTo(s.point)<2))return false;
      if((ahead.x-s.point.x)*s.nx+(ahead.z-s.point.z)*s.nz<.4)return false;
      if(!lineOfSight(ahead.x,ahead.z,s.point.x,s.point.z))return false;
      if(!onScreen(s))return true;
      return [-.45,0,.45].every(offset=>!lineOfSight(camera.position.x,camera.position.z,s.point.x+offset*s.nz,s.point.z-offset*s.nx));
    });
    if(!candidates.length)return;
    candidates.sort((a,b)=>a.point.distanceToSquared(ahead)-b.point.distanceToSquared(ahead));
    seen=false;active=candidates[Math.floor(Math.random()*Math.min(8,candidates.length))];
    const aspect=texture.image.width/texture.image.height;
    print.scale.set(.84*Math.min(1,aspect),.84*Math.min(1,1/aspect),1);
    print.position.copy(active.point);print.rotation.y=Math.atan2(active.nx,active.nz);
    material.map=texture;material.needsUpdate=true;print.visible=true;
  };
}
