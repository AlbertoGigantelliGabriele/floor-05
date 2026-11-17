// Independent pointer IDs allow walking and looking with two fingers.
export function installTouchControls(canvas,buttons,{look,jump,activate},host=window,doc=document){
  const held=new Map();let gaze=null;
  const paint=()=>buttons.forEach(b=>b.classList.toggle('pressed',[...held.values()].includes(b.dataset.action)));
  const capture=(el,e)=>{try{el.setPointerCapture(e.pointerId);}catch{}};
  const release=e=>{held.delete(e.pointerId);if(gaze?.id===e.pointerId)gaze=null;paint();};
  const reset=()=>{held.clear();gaze=null;paint();};
  for(const button of buttons){
    button.addEventListener('pointerdown',e=>{
      if(e.pointerType==='mouse'&&e.button!==0)return;
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
  return {reset,get forward(){return [...held.values()].some(v=>v==='walk'||v==='run');},get running(){return [...held.values()].includes('run');}};
}

export function createJump(){
  let height=0,velocity=0;
  return {
    start(){if(height===0&&velocity===0)velocity=3.6;},
    update(dt,ceiling){
      if(velocity!==0||height>0){velocity-=10*dt;height+=velocity*dt;}
      const max=Math.max(0,ceiling-1.66-.25);
      if(height>max){height=max;velocity=Math.min(0,velocity);}
      if(height<=0){height=0;velocity=0;}
      return height;
    }
  };
}
