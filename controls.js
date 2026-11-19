// Independent pointer IDs allow walking and looking with two fingers.
export function installTouchControls(canvas,buttons,{look,jump,activate},host=window,doc=document){
  const held=new Map();let gaze=null, stick=null, horizontal=0, vertical=0;
  const pad=buttons.find(b=>b.dataset.action==='stick');
  function steer(e){
    const box=pad.getBoundingClientRect(),radius=box.width*.36;
    const x=(e.clientX-box.left-box.width/2)/radius,y=(e.clientY-box.top-box.height/2)/radius;
    const length=Math.hypot(x,y), divisor=Math.max(1,length);
    horizontal=length>.13?x/divisor:0;vertical=length>.13?-y/divisor:0;
    pad.style.setProperty('--x',horizontal*radius+'px');pad.style.setProperty('--y',-vertical*radius+'px');
  }
  function center(){stick=null;horizontal=vertical=0;pad?.style.removeProperty('--x');pad?.style.removeProperty('--y');}
  pad?.addEventListener('pointermove',e=>{if(stick===e.pointerId)steer(e);});
  const paint=()=>buttons.forEach(b=>b.classList.toggle('pressed',[...held.values()].includes(b.dataset.action)));
  const capture=(el,e)=>{try{el.setPointerCapture(e.pointerId);}catch{}};
  const release=e=>{if(stick===e.pointerId)center();held.delete(e.pointerId);if(gaze?.id===e.pointerId)gaze=null;paint();};
  const reset=()=>{center();held.clear();gaze=null;paint();};
  for(const button of buttons){
    button.addEventListener('pointerdown',e=>{
      if(e.pointerType==='mouse'&&e.button!==0)return;
      if(button===pad){if(stick!==null)return;stick=e.pointerId;steer(e);}
      e.preventDefault();activate();capture(button,e);
      held.set(e.pointerId,button.dataset.action);paint();
      if(button.dataset.action==='jump')jump();
    });
    button.addEventListener('lostpointercapture',release);
    button.addEventListener('contextmenu',e=>e.preventDefault());
    button.addEventListener('click',e=>{if(e.detail===0&&button.dataset.action==='jump'){activate();jump();}});
  }
  canvas.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse')return;
    e.preventDefault();activate();
    if(gaze)return;
    gaze={id:e.pointerId,x:e.clientX,y:e.clientY};capture(canvas,e);
  });
  canvas.addEventListener('pointermove',e=>{
    if(gaze?.id!==e.pointerId)return;
    look((e.clientX-gaze.x)*.004,(e.clientY-gaze.y)*.004);
    gaze.x=e.clientX;gaze.y=e.clientY;
  });
  canvas.addEventListener('lostpointercapture',release);
  for(const event of ['pointerup','pointercancel'])host.addEventListener(event,release);
  for(const event of ['blur','orientationchange'])host.addEventListener(event,reset);
  doc.addEventListener('visibilitychange',reset);
  return {reset,get x(){return horizontal;},get y(){return vertical;},get forward(){return [...held.values()].some(v=>v==='walk'||v==='run');},get running(){return Math.hypot(horizontal,vertical)>.85 || [...held.values()].includes('run');}};
}

export function createJump(){
  let height=0,velocity=0,ground=0;
  return {
    start(){if(height===ground&&velocity===0)velocity=ground<0?4.9:3.6;},
    get feet(){return height;},
    update(dt,ceiling,floorHeight=0){
      ground=floorHeight;
      if(velocity!==0||height>ground){velocity-=10*dt;height+=velocity*dt;}
      const max=Math.max(0,ceiling-1.66-.25);
      if(height>max){height=max;velocity=Math.min(0,velocity);}
      if(height<=ground){height=ground;velocity=0;}
      return height;
    }
  };
}
