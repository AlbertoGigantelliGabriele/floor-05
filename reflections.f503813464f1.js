import * as THREE from './vendor/three.module.min.js';
export function mirrorCamera(source,height=-.22){
  source.updateMatrixWorld();
  const camera=source.clone(),target=new THREE.Vector3();
  source.getWorldDirection(target).add(source.position);
  camera.position.y=2*height-source.position.y;target.y=2*height-target.y;
  camera.up.set(0,-1,0);camera.lookAt(target);camera.updateMatrixWorld();
  const matrix=new THREE.Matrix4().set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1);
  matrix.multiply(camera.projectionMatrix).multiply(camera.matrixWorldInverse);
  return {camera,matrix};
}
export function createReflections(renderer,scene,waterMeshes,shared){
  const target=new THREE.WebGLRenderTarget(512,512,{type:THREE.HalfFloatType,depthBuffer:true});
  const enabled={value:0},matrix={value:new THREE.Matrix4()};
  for(const mesh of waterMeshes)Object.assign(mesh.material.uniforms,{reflectionMap:{value:target.texture},reflectionMatrix:matrix,reflectionReady:enabled});
  let last=-Infinity;
  return {update(camera,now){
    if(!waterMeshes.some(m=>Math.hypot(m.position.x-camera.position.x,m.position.z-camera.position.z)<13)){enabled.value=0;return;}
    if(now-last<1/30)return;last=now;
    const mirror=mirrorCamera(camera);matrix.value.copy(mirror.matrix);
    const old=renderer.getRenderTarget(),tone=renderer.toneMapping;
    waterMeshes.forEach(m=>m.visible=false);shared.reflectionPass.value=1;
    try{renderer.toneMapping=THREE.NoToneMapping;renderer.setRenderTarget(target);renderer.render(scene,mirror.camera);enabled.value=1;}
    finally{renderer.setRenderTarget(old);renderer.toneMapping=tone;shared.reflectionPass.value=0;waterMeshes.forEach(m=>m.visible=true);}
  }};
}
