import * as THREE from './vendor/three.module.min.js';
import {floor, isFloor, columns, lineOfSight} from './layout.597fdb523c66.js';

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
  const projected = new THREE.Vector3();
  function visible(camera,spot,limit) {
    const p = spot.point, dx = camera.position.x-p.x, dz = camera.position.z-p.z;
    if (dx*spot.nx+dz*spot.nz <= 0) return false;
    projected.copy(p).project(camera);
    if (projected.z < -1 || projected.z > 1 || Math.abs(projected.x)>limit || Math.abs(projected.y)>limit) return false;
    if (!lineOfSight(p.x,p.z,camera.position.x,camera.position.z)) return false;
    // Interior pillars also block sight, although their floor cells are open.
    for (const [x,z,w,d] of columns) {
      const a=(x-p.x)/(dx||1e-9), b=(x+w-p.x)/(dx||1e-9);
      const c=(z-p.z)/(dz||1e-9), e=(z+d-p.z)/(dz||1e-9);
      if(Math.max(0,Math.min(a,b),Math.min(c,e)) < Math.min(1,Math.max(a,b),Math.max(c,e))) return false;
    }
    return true;
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
    if(active){
      if(visible(camera,active,1.02)) return;
      previous=active;active=null;print.visible=false;material.map=null;texture.dispose();texture=null;
      distance=7+Math.random()*12;preload();return;
    }
    distance-=travel;
    if(distance>0 || !travel) return;
    distance=1;
    const candidates=spots.filter(s=>{
      const range=camera.position.distanceTo(s.point);
      return range>1.5 && range<8 && (!previous || previous.point.distanceTo(s.point)>2) && visible(camera,s,.8);
    });
    if(!candidates.length) return;
    active=candidates[Math.floor(Math.random()*candidates.length)];
    const aspect=texture.image.width/texture.image.height;
    print.scale.set(.84*Math.min(1,aspect),.84*Math.min(1,1/aspect),1);
    print.position.copy(active.point);print.rotation.y=Math.atan2(active.nx,active.nz);
    material.map=texture;material.needsUpdate=true;print.visible=true;
  };
}
