// Review model only; not yet substituted into the Paris heap.
import * as THREE from './vendor/three.module.min.js';
export function createEiffelStudy(){
  const pieces=[],metal='#616965';
  function rod(points,r=.006){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));pieces.push({geometry:new THREE.TubeGeometry(curve,Math.max(1,points.length-1)*5,r,6,false),color:metal});}
  const levels=[[0,.25],[.18,.19],[.43,.115],[.58,.09],[.83,.065],[1.04,.046],[1.27,.021],[1.40,.013]];
  for(const sx of [-1,1])for(const sz of [-1,1])rod(levels.map(([y,w])=>[sx*w,y,sz*w]),.009);
  for(const axis of [0,2])for(const sign of [-1,1]){
    const point=(x,y,w)=>axis===0?[x,y,sign*w]:[sign*w,y,x];
    // Curved arch between the two feet on every face.
    rod([point(-.24,.035,.24),point(-.17,.19,.19),point(0,.30,.16),point(.17,.19,.19),point(.24,.035,.24)],.010);
    for(let j=1;j<levels.length-1;j++){
      const [y,w]=levels[j],[yn,wn]=levels[j+1];
      rod([point(-w,y,w),point(wn,yn,wn)],.0045);
      rod([point(w,y,w),point(-wn,yn,wn)],.0045);
      rod([point(-w,y,w),point(w,y,w)],.005);
    }
  }
  for(const [y,w] of [[.43,.14],[.83,.085],[1.30,.035]]){
    for(const sign of [-1,1]){
      rod([[-w,y,sign*w],[w,y,sign*w]],.012);rod([[sign*w,y,-w],[sign*w,y,w]],.012);
      rod([[-w,y+.035,sign*w],[w,y+.035,sign*w]],.004);rod([[sign*w,y+.035,-w],[sign*w,y+.035,w]],.004);
      for(let i=-3;i<=3;i++){rod([[i*w/3,y,sign*w],[i*w/3,y+.035,sign*w]],.0025);rod([[sign*w,y,i*w/3],[sign*w,y+.035,i*w/3]],.0025);}
    }
  }
  rod([[0,1.4,0],[0,1.58,0]],.005);
  return pieces;
}
