import * as THREE from './vendor/three.module.min.js';
import {souvenirHeaps as originalHeaps} from './souvenir-layout.js';
import {zoneAt,souvenirHeaps} from './layout.js';
import {surfaceColumns,settle,placementLift} from './packing.js';
import {placements} from './souvenir-placements.js';
import {createEiffelStudy} from './eiffel-study.js';

// Small low-poly souvenir models, merged into a single draw call.
export function buildSouvenirs(lightAt,repack=false){
  const result={p:[],n:[],uv:[],light:[],placements:[]};let seed=51005;
  const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const pieces=[];let current=[];
  function part(geometry,color,x=0,y=0,z=0,rx=0,ry=0,rz=0){
    const matrix=new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new THREE.Vector3(1,1,1));
    const g=geometry.index?geometry.toNonIndexed():geometry;g.applyMatrix4(matrix);current.push({g,color});
    if(g!==geometry)geometry.dispose();
  }
  const box=(w,h,d,c,x=0,y=0,z=0)=>{
    const bevel=Math.min(.006,w/8,h/8,d/8),s=new THREE.Shape();
    s.moveTo(-w/2+bevel,-h/2+bevel);s.lineTo(w/2-bevel,-h/2+bevel);s.lineTo(w/2-bevel,h/2-bevel);s.lineTo(-w/2+bevel,h/2-bevel);s.closePath();
    const g=new THREE.ExtrudeGeometry(s,{depth:d-2*bevel,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:1,steps:1});
    g.translate(0,0,-d/2+bevel);part(g,c,x,y,z);
  };
  const cylinder=(top,bottom,h,c,x=0,y=0,z=0,n=24)=>part(new THREE.CylinderGeometry(top,bottom,h,n),c,x,y,z);
  function beam(a,b,r,c){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),g=new THREE.CylinderGeometry(r,r,av.distanceTo(bv),5);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),bv.clone().sub(av).normalize()));const mid=av.add(bv).multiplyScalar(.5);part(g,c,mid.x,mid.y,mid.z);}
  const brass='#94784b',stone='#d1c3a0',dark='#273b3b',red='#a43b2c';
  const models={
    paris(){
      for(const {geometry,color} of createEiffelStudy())part(geometry,color);
    },
    london(){
      box(.95,.52,.36,red,0,.32);box(.82,.025,.38,'#742a25',0,.59);
      for(const x of [-.32,-.1,.12,.34])for(const y of [.26,.46])for(const z of [-.184,.184])box(.15,.12,.012,'#9baeb0',x,y,z);
      for(const x of [-.3,.3])for(const z of [-.19,.19])part(new THREE.CylinderGeometry(.085,.085,.045,10),'#292820',x,.085,z,Math.PI/2);
      box(.014,.14,.28,dark,.48,.44);box(.02,.05,.09,'#e1d4a2',.49,.16,.1);
      box(.018,.07,.33,'#d5b884',.49,.085);box(.012,.06,.22,'#171c1c',.49,.555);
      for(const z of [-.11,.11])box(.018,.045,.055,'#fff1b8',.49,.18,z);
      for(const x of [-.3,.3])for(const z of [-.218,.218])part(new THREE.CylinderGeometry(.04,.04,.012,16),'#b6b5a6',x,.085,z,Math.PI/2);
      for(const z of [-.193,.193])box(.84,.012,.008,'#dec59a',0,.365,z);
    },
    oxford(){
      cylinder(.36,.39,.07,stone,0,.035);
      for(let i=0;i<10;i++){const a=i*Math.PI/5;cylinder(.027,.033,.4,stone,Math.cos(a)*.27,.27,Math.sin(a)*.27,6);}
      cylinder(.34,.34,.08,stone,0,.51);
      cylinder(.25,.25,.35,'#b9ac8c',0,.28);
      for(let i=0;i<10;i++){const a=i*Math.PI/5;part(new THREE.BoxGeometry(.08,.16,.016),dark,Math.cos(a)*.252,.3,Math.sin(a)*.252,0,Math.PI/2-a);}
      part(new THREE.SphereGeometry(.31,32,16,0,Math.PI*2,0,Math.PI/2),'#7b8d83',0,.55);
      for(let i=0;i<12;i++){const a=i*Math.PI/6;for(let j=0;j<7;j++){
        const t=j*Math.PI/14,u=(j+1)*Math.PI/14;
        beam([Math.cos(a)*.312*Math.cos(t),.55+.312*Math.sin(t),Math.sin(a)*.312*Math.cos(t)],[Math.cos(a)*.312*Math.cos(u),.55+.312*Math.sin(u),Math.sin(a)*.312*Math.cos(u)],.005,'#536d65');
      }}
      cylinder(.025,.04,.14,stone,0,.93);
    },
    warsaw(){
      box(.65,.13,.44,stone,0,.065);box(.47,.28,.34,stone,0,.27);box(.25,.6,.25,stone,0,.69);
      box(.31,.06,.31,'#a99b7e',0,1.01);cylinder(.02,.11,.25,stone,0,1.16,0,4);beam([0,1.28,0],[0,1.56,0],.015,brass);
      for(const x of [-.075,.075])for(const y of [.5,.66,.82])box(.033,.075,.012,dark,x,y,.132);
      for(const z of [-.08,.08])for(const y of [.5,.66,.82])box(.012,.075,.035,dark,.132,y,z);
      for(const x of [-.18,-.09,0,.09,.18])box(.035,.10,.012,dark,x,.29,.177);
      part(new THREE.CylinderGeometry(.052,.052,.015,24),'#f2ebd4',0,.93,.133,Math.PI/2);
      box(.008,.038,.016,dark,0,.943,.144);box(.03,.008,.016,dark,.012,.93,.144);
    },
    milan(){
      box(.8,.08,.4,stone,0,.04);box(.7,.35,.28,'#c7bdb0',0,.25);
      for(let i=-2;i<=2;i++){const h=.31+(2-Math.abs(i))*.1;box(.095,h,.3,stone,i*.145,.42+h/2);cylinder(0,.06,.2,stone,i*.145,.52+h,0,4);box(.04,.15,.012,dark,i*.145,.28,.147);}
      cylinder(0,.025,.19,'#b69b4b',0,1.19,0,5);
      for(const x of [-.3,-.15,0,.15,.3])for(const z of [-.10,.10]){cylinder(.018,.025,.24,stone,x,.62,z,12);cylinder(0,.035,.15,stone,x,.815,z,12);}
      part(new THREE.TorusGeometry(.065,.012,8,24),stone,0,.43,.16);
    },
    civita(){
      cylinder(.13,.18,.08,stone,-.23,.04);cylinder(.075,.13,.7,'#d4cdb3',-.23,.43);
      cylinder(.12,.12,.045,red,-.23,.77);cylinder(.075,.075,.12,dark,-.23,.85);cylinder(0,.15,.14,red,-.23,.98);
      box(.58,.13,.27,'#d7d0bc',.19,.1);box(.34,.17,.2,'#ece6d7',.19,.25);box(.12,.13,.12,'#486e88',.22,.39);
      for(const x of [.03,.14,.25,.36])box(.05,.045,.015,dark,x,.27,.11);
      for(const x of [-.02,.1,.22,.34,.43])for(const z of [-.14,.14])cylinder(.006,.006,.075,brass,x,.20,z,8);
      for(const z of [-.14,.14])beam([-.08,.235,z],[.47,.235,z],.006,brass);
      for(let i=0;i<8;i++){const a=i*Math.PI/4;beam([-.23+Math.cos(a)*.102,.79,Math.sin(a)*.102],[-.23+Math.cos(a)*.102,.93,Math.sin(a)*.102],.006,brass);}
    },
    rome(){
      for(let level=0;level<3;level++){
        for(let i=0;i<16;i++){const a=i*Math.PI/8;box(.045,.14,.045,stone,Math.cos(a)*.4,.10+level*.24,Math.sin(a)*.28);
          const mid=a+Math.PI/16;part(new THREE.TorusGeometry(.059,.018,6,12,Math.PI),stone,Math.cos(mid)*.4,.16+level*.24,Math.sin(mid)*.28,0,Math.PI/2-mid);
        }
        const g=new THREE.TorusGeometry(.35,.035,4,24);g.rotateX(Math.PI/2);g.scale(1.22,1,.83);part(g,stone,0,.25+level*.24);
      }
      const g=new THREE.CylinderGeometry(.46,.48,.05,20);g.scale(1,1,.72);part(g,'#b9a582',0,.025);
    },
    napoli(){
      const path=new THREE.CatmullRomCurve3([new THREE.Vector3(-.22,.65,0),new THREE.Vector3(.02,.59,0),new THREE.Vector3(.15,.36,.02),new THREE.Vector3(.08,.12,.03)]);
      const g=new THREE.TubeGeometry(path,32,.075,16,false),p=g.attributes.position;
      for(let j=0;j<=32;j++){const center=path.getPointAt(j/32),taper=1-j/32*.95;for(let k=0;k<=16;k++){const i=j*17+k;p.setXYZ(i,center.x+(p.getX(i)-center.x)*taper,center.y+(p.getY(i)-center.y)*taper,center.z+(p.getZ(i)-center.z)*taper);}}
      g.computeVertexNormals();part(g,red);
      part(new THREE.TorusGeometry(.085,.018,10,24),brass,-.22,.75,0);cylinder(.07,.09,.055,brass,-.22,.66);
    }
  };
  for(const heap of (repack?originalHeaps:souvenirHeaps)){
    const occupied=new Map();
    for(let i=0;i<heap.count;i++){
      current=[];models[heap.cities[i%heap.cities.length]]();
      const angle=i*2.39996+rand()*.3,radius=(i<6?.52:.22)*heap.r;
      const scale=(.48+rand()*.15)*Math.min(1,heap.r/1.3),rotation=new THREE.Quaternion().setFromEuler(new THREE.Euler(i%3===0?Math.PI/2:0,rand()*Math.PI*2,i%3===0?(rand()-.5)*.25:0));
      const matrix=new THREE.Matrix4().compose(new THREE.Vector3(heap.x+Math.cos(angle)*radius,0,heap.z+Math.sin(angle)*radius),rotation,new THREE.Vector3(scale,scale,scale));
      let minY=Infinity;
      for(const piece of current){piece.g.applyMatrix4(matrix);const a=piece.g.attributes.position;for(let j=0;j<a.count;j++)minY=Math.min(minY,a.getY(j));}
      const bounds=new THREE.Box3();for(const piece of current){piece.g.computeBoundingBox();bounds.union(piece.g.boundingBox);}
      const center=bounds.getCenter(new THREE.Vector3());
      for(const piece of current)piece.g.translate(heap.x+Math.cos(angle)*radius-center.x,0,heap.z+Math.sin(angle)*radius-center.z);
      const saved=!repack&&placements[result.placements.length];
      let dx=0,dz=0,lift=0;
      if(saved){({dx,dz,lift}=saved);for(const piece of current)piece.g.translate(dx,0,dz);}
      else{
      const original=surfaceColumns(current.map(p=>p.g));
      let best=null;
      // Try nearby resting positions; avoid balancing the next item on a tall spire.
      for(let trial=0;trial<64;trial++){
        const a=trial*2.39996,r=(trial===0?radius:Math.sqrt((trial%16)/15)*.62*heap.r);
        const sx=Math.round((heap.x+Math.cos(a)*r-(heap.x+Math.cos(angle)*radius))/.035);
        const sz=Math.round((heap.z+Math.sin(a)*r-(heap.z+Math.sin(angle)*radius))/.035);
        const shifted=new Map();let fits=true;
        for(const [key,c] of original){const [x,z]=key.split(',').map(Number),nx=x+sx,nz=z+sz;
          if(Math.hypot((nx+.5)*.035-heap.x,(nz+.5)*.035-heap.z)>heap.r-.025){fits=false;break;}
          shifted.set(nx+','+nz,c);
        }
        if(!fits)continue;
        const lift=placementLift(shifted,occupied),rise=lift+minY;
        let contacts=0;for(const [key,c] of shifted)if(c.lo+lift-(occupied.get(key)??0)<.018)contacts++;
        const score=rise+(rise>.04&&contacts<5?10:0)+r*.025;
        if(!best||score<best.score)best={sx,sz,columns:shifted,score};
      }
      if(!best)throw new Error('No collision-free placement in '+heap.id);
      dx=best.sx*.035;dz=best.sz*.035;
      for(const piece of current)piece.g.translate(dx,0,dz);
      lift=settle(best.columns,occupied);
      }
      result.placements.push({city:heap.id,dx,dz,lift});
      for(const piece of current){
        piece.g.translate(0,lift,0);
        const a=piece.g.attributes.position;
        for(let j=0;j<a.count;j++)if(Math.hypot(a.getX(j)-heap.x,a.getZ(j)-heap.z)>heap.r)throw new Error('Souvenir outside collider: '+heap.id);
        pieces.push(piece);
      }
    }
  }
  const p=new THREE.Vector3(),n=new THREE.Vector3();
  for(const {g,color} of pieces){
    const positions=g.attributes.position,normals=g.attributes.normal,c=new THREE.Color(color);
    for(let i=0;i<positions.count;i++){
      p.fromBufferAttribute(positions,i);n.fromBufferAttribute(normals,i);
      const lit=lightAt([p.x,p.y,p.z],[n.x,n.y,n.z],zoneAt(p.x,p.z),[p.x,p.y,p.z]);
      result.p.push(p.x,p.y,p.z);result.n.push(n.x,n.y,n.z);result.uv.push(0,0);result.light.push(lit[0]*c.r,lit[1]*c.g,lit[2]*c.b);
    }
    g.dispose();
  }
  return result;
}
