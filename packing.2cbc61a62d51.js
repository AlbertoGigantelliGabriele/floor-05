// Conservative triangle rasterization: every object rests above previous surfaces.
export function surfaceColumns(geometries,cell=.035){
  const columns=new Map();
  for(const geometry of geometries){
    const a=geometry.attributes.position;
    for(let i=0;i<a.count;i+=3){
      const tri=[0,1,2].map(k=>[a.getX(i+k),a.getY(i+k),a.getZ(i+k)]);
      const minX=Math.floor(Math.min(...tri.map(p=>p[0]))/cell),maxX=Math.floor(Math.max(...tri.map(p=>p[0]))/cell);
      const minZ=Math.floor(Math.min(...tri.map(p=>p[2]))/cell),maxZ=Math.floor(Math.max(...tri.map(p=>p[2]))/cell);
      for(let x=minX;x<=maxX;x++)for(let z=minZ;z<=maxZ;z++){
        let poly=tri;
        for(const [axis,bound,sign] of [[0,x*cell,1],[0,(x+1)*cell,-1],[2,z*cell,1],[2,(z+1)*cell,-1]]){
          const out=[];
          for(let j=0;j<poly.length;j++){
            const p=poly[j],q=poly[(j+1)%poly.length],dp=(p[axis]-bound)*sign,dq=(q[axis]-bound)*sign;
            if(dp>=0)out.push(p);
            if((dp>=0)!==(dq>=0)){const t=dp/(dp-dq);out.push(p.map((v,k)=>v+(q[k]-v)*t));}
          }
          poly=out;if(!poly.length)break;
        }
        if(!poly.length)continue;
        const key=x+','+z,lo=Math.min(...poly.map(p=>p[1])),hi=Math.max(...poly.map(p=>p[1])),old=columns.get(key);
        columns.set(key,{lo:Math.min(old?.lo??Infinity,lo),hi:Math.max(old?.hi??-Infinity,hi)});
      }
    }
  }
  return columns;
}
export function placementLift(columns,occupied){
  let lift=-Infinity;
  for(const [key,c] of columns)lift=Math.max(lift,(occupied.get(key)??0)-c.lo);
  return lift+.003;
}
export function settle(columns,occupied){
  const lift=placementLift(columns,occupied);
  for(const [key,c] of columns){
    if(c.lo+lift<(occupied.get(key)??0)-1e-6)throw new Error('Intersecting souvenirs');
    occupied.set(key,c.hi+lift);
  }
  return lift;
}
