import * as THREE from './vendor/three.module.min.js';
import {buildSouvenirs} from './souvenirs.ba5d425d903d.js';
import {floor,WIDTH,DEPTH,rooms,corridors,pools,columns,isFloor,zoneAt,heights,lineOfSight} from './layout.669b18472e97.js';
import {vertexShader,fragmentShader,waterVertex,waterFragment} from './materials.a4209af545bd.js';

export function buildArchitecture(scene,textures,shared){
  const lamps=[];
  const waterMeshes=[];
  shared.reflectionPass??={value:0};
  const lightColors={yellow:[1,.95,.75],hospital:[.70,.92,.86],pool:[.83,.96,1]};
  function lamp(x,z){
    if(!isFloor(x,z)||lamps.some(l=>Math.hypot(l.x-x,l.z-z)<2.65))return;
    const zone=zoneAt(x,z);
    const variation=(Math.sin(x*12.9898+z*78.233)*43758.5453)%1;
    const power=zone==='yellow'?.38+.85*Math.abs(variation):zone==='hospital'?.65+.5*Math.abs(variation):.9+.2*Math.abs(variation);
    lamps.push({x,z,y:heights[zone]-.09,zone,power,color:lightColors[zone]});
  }
  rooms.forEach(r=>{
    const nx=Math.max(1,Math.floor(r.w/4)),nz=Math.max(1,Math.floor(r.d/4));
    for(let j=0;j<nz;j++)for(let i=0;i<nx;i++)lamp(r.x+(i+.5)*r.w/nx,r.z+(j+.5)*r.d/nz);
  });
  corridors.forEach(([x,z,w,d])=>{
    const n=Math.max(1,Math.ceil(Math.max(w,d)/4.8));
    for(let i=0;i<n;i++)lamp(w>d?x+(i+.5)*w/n:x+w/2,d>w?z+(i+.5)*d/n:z+d/2);
  });
  const buckets=new Map();
  for(const l of lamps){const key=`${Math.floor(l.x/8)},${Math.floor(l.z/8)}`;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(l);}
  const candidates=new Map(),lightCache=new Map();
  function bakedLight(p,n,zone,center){
    const key=p.map(v=>v.toFixed(3)).join(',')+n.join(',')+zone;
    if(lightCache.has(key))return lightCache.get(key);
    const px=p[0]+n[0]*.035+(center[0]-p[0])*.016,pz=p[2]+n[2]*.035+(center[2]-p[2])*.016;
    const bx=Math.floor(px/8),bz=Math.floor(pz/8),bk=bx+','+bz;
    if(!candidates.has(bk)){
      const list=[];for(let z=bz-1;z<=bz+1;z++)for(let x=bx-1;x<=bx+1;x++)list.push(...(buckets.get(x+','+z)||[]));candidates.set(bk,list);
    }
    const ambient=zone==='hospital'?.18:zone==='pool'?.29:.19;
    const color=[ambient,ambient,ambient*.94];
    for(const l of candidates.get(bk)){
      const dx=l.x-px,dy=l.y-p[1],dz=l.z-pz,d2=dx*dx+dy*dy+dz*dz;
      if(d2>95)continue;
      const dot=(dx*n[0]+dy*n[1]+dz*n[2])/Math.sqrt(Math.max(.01,d2));
      if(dot<-.1||!lineOfSight(px,pz,l.x,l.z))continue;
      const power=l.power*(zone==='hospital'?.75:1.02)*(.16+.84*Math.max(0,dot))/(1+d2*.24);
      for(let i=0;i<3;i++)color[i]+=l.color[i]*power;
    }
    // Contact shade along floor/wall and ceiling junctions.
    let shade=1;
    if(Math.abs(n[1])<.5)shade=.78+.22*Math.sin(Math.PI*Math.min(1,Math.max(0,p[1]/heights[zone])));
    else {
      let near=0;for(const [dx,dz] of [[.25,0],[-.25,0],[0,.25],[0,-.25]])if(!isFloor(px+dx,pz+dz))near++;
      shade=1-near*.065;
    }
    const result=color.map(v=>Math.min(1.9,v*shade));lightCache.set(key,result);return result;
  }
  const groups={};
  function quad(material,points,normal,uv,zone='yellow',tint=[1,1,1]){
    if(!groups[material])groups[material]={p:[],n:[],uv:[],light:[]};
    const g=groups[material],center=[0,0,0];points.forEach(p=>p.forEach((v,k)=>center[k]+=v/4));
    const colors=points.map(p=>material==='light'?tint:bakedLight(p,normal,zone,center));
    for(const i of [0,1,2,0,2,3]){g.p.push(...points[i]);g.n.push(...normal);g.uv.push(...uv[i]);g.light.push(...colors[i]);}
  }
  function horizontal(material,x,z,w,d,y,up,zone){
    let pts=[[x,y,z+d],[x+w,y,z+d],[x+w,y,z],[x,y,z]];
    const scale=material==='ceiling'?1.2:material==='yellowFloor'?2:material==='poolFloor'?1.6:2.4;
    let uv=pts.map(p=>[p[0]/scale,p[2]/scale]);
    if(!up){pts=pts.reverse();uv=uv.reverse();}
    quad(material,pts,[0,up?1:-1,0],uv,zone);
  }
  function wall(material,ax,az,bx,bz,low,high,zone,offset=0){
    const len=Math.hypot(bx-ax,bz-az),n=[-(bz-az)/len,0,(bx-ax)/len];
    const scale=material==='yellowWall'?1.7:material==='hospitalWall'?heights.hospital:material==='poolWall'?1.2:2.4;
    const u0=Math.abs(bx-ax)>.01?ax:az,u1=Math.abs(bx-ax)>.01?bx:bz;
    const count=Math.ceil((high-low)/.6);
    for(let i=0;i<count;i++){
      const a=low+(high-low)*i/count,b=low+(high-low)*(i+1)/count;
      const pts=[[ax+n[0]*offset,a,az+n[2]*offset],[bx+n[0]*offset,a,bz+n[2]*offset],[bx+n[0]*offset,b,bz+n[2]*offset],[ax+n[0]*offset,b,az+n[2]*offset]];
      quad(material,pts,n,[[u0/scale,a/scale],[u1/scale,a/scale],[u1/scale,b/scale],[u0/scale,b/scale]],zone);
    }
  }
  function wallWithTrim(ax,az,bx,bz,h,zone){
    wall(zone+'Wall',ax,az,bx,bz,0,h,zone);
    const trim='trim'+zone[0].toUpperCase()+zone.slice(1);
    if(zone!=='pool')wall(trim,ax,az,bx,bz,.005,.105,zone,.007);
  }
  function floorPieces(x,z){
    let parts=[[x,z,1,1]];
    for(const p of pools){
      const next=[];
      for(const [a,b,w,d] of parts){
        const l=Math.max(a,p.x),r=Math.min(a+w,p.x+p.w),t=Math.max(b,p.z),bot=Math.min(b+d,p.z+p.d);
        if(l>=r||t>=bot){next.push([a,b,w,d]);continue;}
        if(t>b)next.push([a,b,w,t-b]);if(bot<b+d)next.push([a,bot,w,b+d-bot]);
        if(l>a)next.push([a,t,l-a,bot-t]);if(r<a+w)next.push([r,t,a+w-r,bot-t]);
      }
      parts=next;
    }
    return parts;
  }
  for(let z=0;z<DEPTH;z++)for(let x=0;x<WIDTH;x++)if(floor[z][x]){
    const zone=zoneAt(x+.5,z+.5),h=heights[zone];
    for(const [a,b,w,d]of floorPieces(x,z))horizontal(zone+'Floor',a,b,w,d,0,true,zone);
    horizontal(zone==='pool'?'plaster':'ceiling',x,z,1,1,h,false,zone);
    const sides=[{dx:0,dz:-1,a:[x,z],b:[x+1,z]},{dx:0,dz:1,a:[x+1,z+1],b:[x,z+1]},
      {dx:-1,dz:0,a:[x,z+1],b:[x,z]},{dx:1,dz:0,a:[x+1,z],b:[x+1,z+1]}];
    for(const s of sides){
      if(!floor[z+s.dz]?.[x+s.dx])wallWithTrim(...s.a,...s.b,h,zone);
      else{
        const other=heights[zoneAt(x+.5+s.dx,z+.5+s.dz)];
        if(other<h)wall(zone+'Wall',...s.a,...s.b,other,h,zone);
      }
    }
  }
  for(const[x,z,w,d]of columns){
    const zone=zoneAt(x,z),h=heights[zone];
    // Reverse the boundary winding: columns face outwards into the room.
    wallWithTrim(x+w,z,x,z,h,zone);wallWithTrim(x,z,x,z+d,h,zone);
    wallWithTrim(x,z+d,x+w,z+d,h,zone);wallWithTrim(x+w,z+d,x+w,z,h,zone);
  }
  for(const p of pools){
    horizontal('poolBottom',p.x,p.z,p.w,p.d,-.72,true,'pool');
    wall('poolBottom',p.x,p.z,p.x+p.w,p.z,-.72,0,'pool');
    wall('poolBottom',p.x+p.w,p.z+p.d,p.x,p.z+p.d,-.72,0,'pool');
    wall('poolBottom',p.x,p.z+p.d,p.x,p.z,-.72,0,'pool');
    wall('poolBottom',p.x+p.w,p.z,p.x+p.w,p.z+p.d,-.72,0,'pool');
    // A narrow tiled coping visibly marks the basin edge without closing the path.
    horizontal('plaster',p.x-.09,p.z-.09,p.w+.18,.09,.012,true,'pool');
    horizontal('plaster',p.x-.09,p.z+p.d,p.w+.18,.09,.012,true,'pool');
    horizontal('plaster',p.x-.09,p.z,.09,p.d,.012,true,'pool');
    horizontal('plaster',p.x+p.w,p.z,.09,p.d,.012,true,'pool');
  }
  for(const l of lamps){
    const w=l.zone==='hospital'?.6:.56,d=l.zone==='hospital'?.6:1.18;
    horizontal('trim'+l.zone[0].toUpperCase()+l.zone.slice(1),l.x-w/2-.035,l.z-d/2-.035,w+.07,d+.07,l.y+.055,false,l.zone);
    quad('light',[[l.x-w/2,l.y+.04,l.z-d/2],[l.x+w/2,l.y+.04,l.z-d/2],[l.x+w/2,l.y+.04,l.z+d/2],[l.x-w/2,l.y+.04,l.z+d/2]],[0,-1,0],[[0,0],[1,0],[1,1],[0,1]],l.zone,l.zone==='yellow'?l.color.map(v=>v*l.power):[1,1,1]);
  }
  let triangles=0;
  groups.souvenir=buildSouvenirs(bakedLight);
  for(const [name,g] of Object.entries(groups)){
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(g.p,3));
    geo.setAttribute('normal',new THREE.Float32BufferAttribute(g.n,3));
    geo.setAttribute('uv',new THREE.Float32BufferAttribute(g.uv,2));
    geo.setAttribute('light',new THREE.Float32BufferAttribute(g.light,3));geo.computeBoundingSphere();
    const material=new THREE.ShaderMaterial({
      vertexShader,fragmentShader:name==='souvenir'?fragmentShader.replace('texture2D(map,vUv).rgb','vec3(1.)'):fragmentShader,uniforms:{...shared,map:{value:textures[name]},atmosphere:{value:name.startsWith('yellow')?1:name.startsWith('hospital')?2:name==='poolWall'?3:0},gloss:{value:name==='hospitalFloor'?.23:0},emission:{value:name==='light'?2.6:0}}
    });
    const mesh=new THREE.Mesh(geo,material);scene.add(mesh);triangles+=g.p.length/9;
  }
  for(const p of pools){
    // Reflections use only lamps visible from this basin, not lamps behind walls.
    const cx=p.x+p.w/2,cz=p.z+p.d/2;
    const visible=lamps.filter(l=>l.zone==='pool'&&lineOfSight(cx,cz,l.x,l.z))
      .sort((a,b)=>Math.hypot(a.x-cx,a.z-cz)-Math.hypot(b.x-cx,b.z-cz)).slice(0,8);
    const localLamps=Array.from({length:8},(_,i)=>visible[i]?new THREE.Vector3(visible[i].x,visible[i].y,visible[i].z):new THREE.Vector3(1000,1000,1000));
    const waterMaterial=new THREE.ShaderMaterial({vertexShader:waterVertex,fragmentShader:waterFragment,uniforms:{...shared,basinBounds:{value:new THREE.Vector4(p.x,p.z,p.x+p.w,p.z+p.d)},reflectionReady:{value:0},reflectionMap:{value:null},reflectionMatrix:{value:new THREE.Matrix4()},lamps:{value:localLamps}}});
    const geo=new THREE.PlaneGeometry(p.w,p.d);geo.rotateX(-Math.PI/2);
    const mesh=new THREE.Mesh(geo,waterMaterial);mesh.position.set(p.x+p.w/2,-.22,p.z+p.d/2);scene.add(mesh);
    waterMeshes.push(mesh);
  }
  return {lamps,triangles,roomCount:rooms.length,waterMeshes};
}
