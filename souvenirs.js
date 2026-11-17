import * as THREE from './vendor/three.module.min.js';
import {souvenirHeaps} from './souvenir-layout.js';
import {zoneAt} from './layout.js';

// Small low-poly souvenir models, merged into a single draw call.
export function buildSouvenirs(lightAt){
  const result={p:[],n:[],uv:[],light:[]};let seed=51005;
  const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const pieces=[];let current=[];
  function part(geometry,color,x=0,y=0,z=0,rx=0,ry=0,rz=0){
    const matrix=new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new THREE.Vector3(1,1,1));
    const g=geometry.index?geometry.toNonIndexed():geometry;g.applyMatrix4(matrix);current.push({g,color});
    if(g!==geometry)geometry.dispose();
  }
  const box=(w,h,d,c,x=0,y=0,z=0)=>part(new THREE.BoxGeometry(w,h,d),c,x,y,z);
  const cylinder=(top,bottom,h,c,x=0,y=0,z=0,n=10)=>part(new THREE.CylinderGeometry(top,bottom,h,n),c,x,y,z);
  function beam(a,b,r,c){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),g=new THREE.CylinderGeometry(r,r,av.distanceTo(bv),5);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),bv.clone().sub(av).normalize()));const mid=av.add(bv).multiplyScalar(.5);part(g,c,mid.x,mid.y,mid.z);}
  const brass='#94784b',stone='#d1c3a0',dark='#273b3b',red='#a43b2c';
  const models={
    paris(){
      for(const x of [-1,1])for(const z of [-1,1]){
        beam([x*.32,0,z*.32],[x*.1,.85,z*.1],.027,brass);
        beam([x*.3,.12,z*.3],[-x*.13,.64,z*.13],.012,brass);
      }
      box(.48,.055,.48,brass,0,.38);box(.29,.05,.29,brass,0,.76);
      cylinder(.018,.12,.5,brass,0,1.01,0,4);beam([0,1.26,0],[0,1.43,0],.012,brass);
    },
    london(){
      box(.95,.52,.36,red,0,.32);box(.82,.025,.38,'#742a25',0,.59);
      for(const x of [-.32,-.1,.12,.34])for(const y of [.26,.46])for(const z of [-.184,.184])box(.15,.12,.012,'#9baeb0',x,y,z);
      for(const x of [-.3,.3])for(const z of [-.19,.19])part(new THREE.CylinderGeometry(.085,.085,.045,10),'#292820',x,.085,z,Math.PI/2);
      box(.014,.14,.28,dark,.48,.44);box(.02,.05,.09,'#e1d4a2',.49,.16,.1);
    },
    oxford(){
      cylinder(.36,.39,.07,stone,0,.035);
      for(let i=0;i<10;i++){const a=i*Math.PI/5;cylinder(.027,.033,.4,stone,Math.cos(a)*.27,.27,Math.sin(a)*.27,6);}
      cylinder(.34,.34,.08,stone,0,.51);
      part(new THREE.SphereGeometry(.31,12,6,0,Math.PI*2,0,Math.PI/2),'#7b8d83',0,.55);
      cylinder(.025,.04,.14,stone,0,.93);
    },
    warsaw(){
      box(.65,.13,.44,stone,0,.065);box(.47,.28,.34,stone,0,.27);box(.25,.6,.25,stone,0,.69);
      box(.31,.06,.31,'#a99b7e',0,1.01);cylinder(.02,.11,.25,stone,0,1.16,0,4);beam([0,1.28,0],[0,1.56,0],.015,brass);
      for(const x of [-.075,.075])for(const y of [.5,.66,.82])box(.033,.075,.012,dark,x,y,.132);
    },
    milan(){
      box(.8,.08,.4,stone,0,.04);box(.7,.35,.28,'#c7bdb0',0,.25);
      for(let i=-2;i<=2;i++){const h=.31+(2-Math.abs(i))*.1;box(.095,h,.3,stone,i*.145,.42+h/2);cylinder(0,.06,.2,stone,i*.145,.52+h,0,4);box(.04,.15,.012,dark,i*.145,.28,.147);}
      cylinder(0,.025,.19,'#b69b4b',0,1.19,0,5);
    },
    civita(){
      cylinder(.13,.18,.08,stone,-.23,.04);cylinder(.075,.13,.7,'#d4cdb3',-.23,.43);
      cylinder(.12,.12,.045,red,-.23,.77);cylinder(.075,.075,.12,dark,-.23,.85);cylinder(0,.15,.14,red,-.23,.98);
      box(.58,.13,.27,'#d7d0bc',.19,.1);box(.34,.17,.2,'#ece6d7',.19,.25);box(.12,.13,.12,'#486e88',.22,.39);
      for(const x of [.03,.14,.25,.36])box(.05,.045,.015,dark,x,.27,.11);
    },
    rome(){
      for(let level=0;level<2;level++){
        for(let i=0;i<16;i++){const a=i*Math.PI/8;box(.065,.19,.065,stone,Math.cos(a)*.4,.14+level*.24,Math.sin(a)*.28);}
        const g=new THREE.TorusGeometry(.35,.035,4,24);g.rotateX(Math.PI/2);g.scale(1.22,1,.83);part(g,stone,0,.25+level*.24);
      }
      const g=new THREE.CylinderGeometry(.46,.48,.05,20);g.scale(1,1,.72);part(g,'#b9a582',0,.025);
    },
    napoli(){
      const path=new THREE.CatmullRomCurve3([new THREE.Vector3(-.22,.65,0),new THREE.Vector3(.02,.59,0),new THREE.Vector3(.15,.36,.02),new THREE.Vector3(.08,.12,.03)]);
      part(new THREE.TubeGeometry(path,10,.075,7,false),red);
      cylinder(0,.075,.24,red,.08,.025,.03,7);
      part(new THREE.TorusGeometry(.085,.018,5,10),brass,-.22,.75,0);
    }
  };
  for(const heap of souvenirHeaps){
    for(let i=0;i<heap.count;i++){
      current=[];models[heap.cities[i%heap.cities.length]]();
      const tier=i<Math.ceil(heap.count*.6)?0:i<heap.count-3?1:2;
      const angle=i*2.39996+rand()*.3,radius=(tier===0?.52:tier===1?.30:.10)*heap.r;
      const scale=(.53+rand()*.24)*Math.min(1,heap.r/1.35),rotation=new THREE.Quaternion().setFromEuler(new THREE.Euler((rand()-.5)*.95,rand()*Math.PI*2,(rand()-.5)*1.25));
      const matrix=new THREE.Matrix4().compose(new THREE.Vector3(heap.x+Math.cos(angle)*radius,0,heap.z+Math.sin(angle)*radius),rotation,new THREE.Vector3(scale,scale,scale));
      let minY=Infinity;
      for(const piece of current){piece.g.applyMatrix4(matrix);const a=piece.g.attributes.position;for(let j=0;j<a.count;j++)minY=Math.min(minY,a.getY(j));}
      const lift=tier*.26-minY;
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
