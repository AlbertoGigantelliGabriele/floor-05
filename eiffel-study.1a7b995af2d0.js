import * as THREE from './vendor/three.module.min.js';

// Four arched feet, three narrow decks and an aerial; open metal lattice.
export function createEiffelStudy(){
  const pieces=[],metal='#746d5c',shade='#514f49',edge='#9b9380';
  function rod(points,r=.0035,color=metal){
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    pieces.push({geometry:new THREE.TubeGeometry(curve,Math.max(2,points.length*2),r,4,false),color});
  }
  function bar(a,b,r=.004,color=metal){rod([a,b],r,color);}
  function deck(y,w,depth=.019){
    const g=new THREE.BoxGeometry(w*2,depth,w*2);g.translate(0,y,0);pieces.push({geometry:g,color:shade});
    for(const side of [-1,1]){
      bar([-w,y+.055,side*w],[w,y+.055,side*w],.003,edge);
      bar([side*w,y+.055,-w],[side*w,y+.055,w],.003,edge);
      for(let j=-4;j<=4;j++){
        bar([j*w/4,y+.012,side*w],[j*w/4,y+.055,side*w],.0025);
        bar([side*w,y+.012,j*w/4],[side*w,y+.055,j*w/4],.0025);
      }
    }
  }
  const levels=[[.015,.34],[.12,.31],[.26,.245],[.44,.16],[.58,.13],[.73,.105],[.84,.085],[1.04,.058],[1.23,.038]];
  for(const sx of [-1,1])for(const sz of [-1,1]){
    rod(levels.map(([y,w])=>[sx*w,y,sz*w]),.0085);
    rod(levels.slice(1,-1).map(([y,w])=>[sx*(w-.020),y,sz*(w-.020)]),.0035,edge);
  }
  for(const axis of [0,2])for(const sign of [-1,1]){
    const point=(x,y,w)=>axis===0?[x,y,sign*w]:[sign*w,y,x];
    rod([point(-.34,.02,.34),point(-.26,.13,.265),point(-.16,.245,.23),point(0,.30,.20),point(.16,.245,.23),point(.26,.13,.265),point(.34,.02,.34)],.0085,edge);
    for(let j=2;j<levels.length-1;j++){
      const [y,w]=levels[j],[next,nw]=levels[j+1];
      bar(point(-w,y,w),point(nw,next,nw),.0032);
      bar(point(w,y,w),point(-nw,next,nw),.0032);
      bar(point(-w,y,w),point(w,y,w),.0032);
    }
  }
  deck(.44,.183,.026);deck(.84,.101,.021);deck(1.235,.049,.014);
  for(const sx of [-1,1])for(const sz of [-1,1])bar([sx*.036,1.25,sz*.036],[sx*.019,1.37,sz*.019],.004);
  const cap=new THREE.CylinderGeometry(.025,.033,.025,8);cap.translate(0,1.38,0);pieces.push({geometry:cap,color:shade});
  bar([0,1.39,0],[0,1.51,0],.003,edge);
  return pieces;
}
