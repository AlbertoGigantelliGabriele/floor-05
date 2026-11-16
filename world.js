/* FLOOR 05 — dependency-free perspective renderer and exploration prototype. */
(() => {
  const canvas = document.querySelector('#world');
  const ctx = canvas.getContext('2d', { alpha: false });
  const $ = selector => document.querySelector(selector);
  const state = { x: 0, z: 11, y: 1.64, yaw: 0, pitch: 0, active: false, modal: false,
    keys: new Set(), dragging: false, lastX: 0, lastY: 0, audio: false, found: new Set() };
  const faces = [];
  const marks = [];
  const palette = {
    wall: '#b5ae72', side: '#a9a166', far: '#aea66a', floor: '#b9b58a', ceiling: '#b8b279',
    wood: '#977347', sofa: '#b1a891', pale: '#c4bc9c', dark: '#565744', luggage: '#343d3e'
  };
  let width = 0, height = 0, scale = 0, lastFrame = 0, flash = 0, sound = null, currentPhotoUrl = null;

  const shade = (hex, factor) => {
    const n = parseInt(hex.slice(1), 16);
    return `rgb(${Math.min(255, Math.round((n >> 16) * factor))},${Math.min(255, Math.round(((n >> 8) & 255) * factor))},${Math.min(255, Math.round((n & 255) * factor))})`;
  };
  function quad(points, color, kind = '', detail = '') { faces.push({ points, color, kind, detail }); }
  function box(x, y, z, w, h, d, color, kind = '') {
    const a = x - w / 2, b = x + w / 2, c = z - d / 2, e = z + d / 2, t = y + h;
    quad([[a,y,e],[b,y,e],[b,t,e],[a,t,e]], shade(color,.88), kind, 'front');
    quad([[b,y,c],[a,y,c],[a,t,c],[b,t,c]], shade(color,.72), kind, 'back');
    quad([[a,y,c],[a,y,e],[a,t,e],[a,t,c]], shade(color,.78), kind, 'left');
    quad([[b,y,e],[b,y,c],[b,t,c],[b,t,e]], shade(color,.84), kind, 'right');
    quad([[a,t,e],[b,t,e],[b,t,c],[a,t,c]], shade(color,1.11), kind, 'top');
  }
  function chair(x, z, angle = 0, tint = '#806942') {
    // Slightly different sizes and lean make the heap feel accidental.
    box(x,.67,z,.68,.16,.66,tint,'wood');
    box(x,.78,z-.29,.65,.89,.12,tint,'wood');
    for (const dx of [-.25,.25]) for (const dz of [-.24,.24]) box(x+dx,.04,z+dz,.09,.67,.09,shade(tint,.76),'wood');
    if (angle) box(x+.19,.86,z+.17,.08,.55,.08,shade(tint,.75),'wood');
  }
  function couch(x, y, z, w, tint = '#b0a88c') {
    box(x,y,z,w,.45,1.25,tint,'upholstery');
    box(x,y+.4,z-.47,w,.83,.3,shade(tint,.83),'upholstery');
    box(x-w/2+.16,y+.26,z,.32,.53,1.12,shade(tint,.86),'upholstery');
    box(x+w/2-.16,y+.26,z,.32,.53,1.12,shade(tint,.86),'upholstery');
    const count = w > 2.1 ? 3 : 2;
    for (let i=0;i<count;i++) box(x-w/2+(i+.5)*w/count,y+.43,z+.16,w/count-.1,.16,.73,shade(tint,1.04),'upholstery');
  }
  function buildScene() {
    // Floor and ceiling tiles, every one a real world plane.
    for (let x=-18;x<18;x+=2) for (let z=-28;z<24;z+=2) {
      const n = (Math.sin(x*6.7+z*3.1)+1)*.5;
      quad([[x,0,z],[x+2,0,z],[x+2,0,z+2],[x,0,z+2]],shade(palette.floor,.91+n*.055),'floor');
      quad([[x,4.05,z+2],[x+2,4.05,z+2],[x+2,4.05,z],[x,4.05,z]],shade(palette.ceiling,.91+n*.075),'ceiling');
    }
    // Long, empty walls and recesses. The heap is the only dense point.
    for(let z=-28;z<24;z+=4) {
      quad([[-18,0,z],[-18,0,z+4],[-18,4.05,z+4],[-18,4.05,z]],palette.side,'wall');
      quad([[18,0,z+4],[18,0,z],[18,4.05,z],[18,4.05,z+4]],palette.wall,'wall');
      if(z%8===-4) {box(-17.72,0,z+.2,.24,4.05,.36,'#a49b60','pillar');box(17.72,0,z+.2,.24,4.05,.36,'#aaa367','pillar');}
    }
    quad([[-18,0,-28],[18,0,-28],[18,4.05,-28],[-18,4.05,-28]],palette.far,'wall');
    quad([[18,0,24],[-18,0,24],[-18,4.05,24],[18,4.05,24]],palette.side,'wall');
    for(let x=-18;x<18;x+=4) {
      box(x+.03,0,-27.85,.21,4.05,.25,'#a59c63','pillar');
      box(x+.03,0,23.85,.21,4.05,.25,'#aaa36b','pillar');
    }
    // Fluorescent rectangles: clinical and repetitive, with uneven brightness.
    for(let x=-14;x<=14;x+=7) for(let z=-24;z<=20;z+=7.5) {
      const lit = Math.sin(x*17+z*11) > -.7;
      quad([[x-.35,4.035,z-1.45],[x+.35,4.035,z-1.45],[x+.35,4.035,z+1.45],[x-.35,4.035,z+1.45]],lit?'#e8e3b4':'#999669',lit?'light':'dead-light');
    }
    // The unplanned, physically ridiculous mountain of ordinary furniture.
    box(-.5,0,-6.1,2.5,1.27,1.8,'#977b50','wood');
    box(1.65,0,-6.5,1.8,1.45,1.15,'#a28655','wood');
    box(-2.8,0,-5.2,1.1,1.63,1.3,'#8d6f47','wood');
    box(2.7,0,-4.5,1.2,.92,1.35,'#82744e','wood');
    couch(-1.5,.9,-6.2,3.65,'#aaa087');
    couch(-2.7,0,-3.75,2.05,'#beb392');
    couch(3.4,0,-6.1,1.55,'#9ea596');
    box(.95,1.48,-6.25,1.3,.95,1.12,'#5d5d4d','screen');
    box(.95,1.65,-5.64,.96,.65,.025,'#202b2a','glass');
    box(.95,1.7,-5.62,.67,.42,.025,'#31463d','monitor-glow');
    box(2.05,1.47,-7.2,2.65,.48,1.09,'#98917b','upholstery');
    box(-3.9,.05,-7.4,1.2,1.33,1.06,'#b0a68b','upholstery');
    box(3.25,.74,-6.8,1.12,1.14,.96,'#987c51','wood');
    box(-.2,1.79,-7.3,1.7,.56,.52,'#96784a','wood');
    box(-4.1,0,-5.4,.93,.56,.62,'#776044','wood');
    box(4.25,0,-4.55,.8,.9,.51,palette.luggage,'luggage');
    chair(-4.35,-3.0,1);
    chair(4.52,-7.1,1,'#735d3d');
    chair(-.33,-3.66,1,'#8c7042');
    chair(2.84,-8.55,1,'#76603e');
    chair(-3.8,-8.65,0,'#907749');
    // Furniture legs and slats peek out from odd positions.
    box(-4.8,.1,-4.7,.14,1.55,.13,'#725a37','wood');
    box(-5.0,.74,-4.7,.56,.08,.13,'#80663f','wood');
    box(4.9,.07,-5.1,.13,1.9,.11,'#705e43','wood');
    box(4.5,1.48,-7.5,.12,.75,.11,'#826a3e','wood');
    box(-1.8,2.06,-7.53,.14,.55,.12,'#856d48','wood');
    box(-1.78,2.47,-7.55,1.01,.1,.13,'#856d48','wood');
    // Uneven piles of cartons, one faded rug and a remote door.
    box(-6.1,0,-6.8,.9,.6,1.03,'#9b8763','cardboard');
    box(5.4,0,-8.4,1.05,.79,.75,'#9f8963','cardboard');
    box(-6.25,0,-7.92,.68,.46,.65,'#8d805f','cardboard');
    box(1.15,.02,-3.56,1.15,.25,.82,'#9b8a64','cardboard');
    box(0,0,-27.8,2.2,3.25,.13,'#7e7750','door');
    box(0,0,-27.66,1.84,2.95,.08,'#4b503d','door');
    box(.66,1.43,-27.58,.09,.09,.09,'#dad4a2','knob');

    // Tiny personal clues are mixed through the heap, never arranged by destination.
    box(-3.16,1.67,-5.31,.11,.43,.11,'#bbb18a','souvenir'); // Eiffel silhouette
    box(-3.16,1.97,-5.31,.23,.05,.13,'#bbb18a','souvenir');
    box(1.26,1.27,-3.55,.5,.035,.29,'#e0cba0','paper');
    box(4.12,1.65,-6.8,.42,.29,.22,'#944c3e','souvenir');
    box(-4.12,1.36,-7.3,.46,.04,.32,'#d3c39c','paper');
    box(2.92,.95,-4.32,.2,.24,.17,'#b6a476','souvenir');
    box(-5.22,.6,-6.93,.56,.08,.38,'#c6b994','paper');
    // Several dark frames wait for encrypted images in the completed project.
    for(const [x,y,z] of [[-1.6,1.62,-5.43],[2.35,1.34,-6.0],[-4.06,.88,-3.05]]) {
      box(x,y,z,.68,.54,.06,'#4a402e','frame');
      box(x,y+.055,z+.04,.54,.39,.015,'#6b705e','picture');
    }
    marks.push(
      {x:-3.65,z:-4.6,kicker:'TRA GLI OGGETTI',title:'Una piccola torre',body:'Una mini Tour Eiffel è rimasta incastrata qui, come se qualcuno avesse svuotato una valigia in mezzo alla stanza.'},
      {x:1.4,z:-2.7,kicker:'UN FOGLIO PIEGATO',title:'Una mappa consumata',body:'Londra, Varsavia, Milano. I nomi delle città sembrano annotati in ordine sparso, senza una logica.'},
      {x:4.9,z:-5.2,kicker:'UNA SCATOLA',title:'Da qualche viaggio',body:'Dentro, oggetti di Roma, Napoli e Civitavecchia si mescolano a un biglietto di Oxford.'},
      {x:-1.8,z:-3.95,kicker:'UNO SCHERMO',title:'Qualcosa affiora',body:'Una foto è rimasta qui.',photo:0},
      {x:3.35,z:-3.6,kicker:'TRA I CUSCINI',title:'Una foto dimenticata',body:'Un ricordo nascosto nel mucchio.',photo:1},
      {x:0,z:-26.4,kicker:'UNA PORTA LONTANA',title:'Non ancora',body:'Oltre questa porta costruiremo il percorso dei cinque anni, la lettera e lo scatolino finale.'}
    );
  }

  function resize() {
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    width = canvas.clientWidth; height = canvas.clientHeight;
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio,0,0,ratio,0,0);
    scale = width / (2 * Math.tan(Math.PI * 72 / 360));
  }
  function cameraPoint(p) {
    const dx=p[0]-state.x, dz=p[2]-state.z, s=Math.sin(state.yaw), c=Math.cos(state.yaw);
    return { x:dx*c+dz*s, y:p[1]-state.y, z:dx*s-dz*c };
  }
  function clipNear(poly) {
    const out=[], near=.075;
    for(let i=0;i<poly.length;i++) {
      const a=poly[i], b=poly[(i+1)%poly.length], ai=a.z>near, bi=b.z>near;
      if(ai) out.push(a);
      if(ai!==bi) { const t=(near-a.z)/(b.z-a.z); out.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:near}); }
    }
    return out;
  }
  function project(v) {return [width/2+v.x*scale/v.z,height/2-(v.y-v.z*Math.tan(state.pitch))*scale/v.z];}
  function draw() {
    if (!width || !height) return;
    ctx.fillStyle='#a8a16d';ctx.fillRect(0,0,width,height);
    const rendered=[];
    for(const face of faces) {
      const coords=face.points.map(cameraPoint), clipped=clipNear(coords);
      if(clipped.length<3) continue;
      const depth=coords.reduce((a,v)=>a+v.z,0)/coords.length;
      if(depth>70) continue;
      rendered.push({face,coords:clipped,depth});
    }
    rendered.sort((a,b)=>b.depth-a.depth);
    for(const item of rendered) {
      const pts=item.coords.map(project);
      ctx.beginPath();ctx.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)ctx.lineTo(...pts[i]);ctx.closePath();
      ctx.fillStyle=item.face.color;
      if(item.face.kind==='light') {ctx.shadowColor='#f5edbb';ctx.shadowBlur=17;}
      ctx.fill();ctx.shadowBlur=0;
      if(['floor','ceiling','wood','upholstery','cardboard','wall','door'].includes(item.face.kind)) {
        ctx.strokeStyle=item.face.kind==='wood'?'rgba(35,29,17,.22)':'rgba(45,43,27,.10)';ctx.lineWidth=1;ctx.stroke();
      }
      if(item.face.kind==='picture') {
        ctx.strokeStyle='rgba(215,211,177,.35)';ctx.lineWidth=1;ctx.stroke();
      }
      if(item.face.kind==='monitor-glow') {ctx.shadowColor='#9bb9a2';ctx.shadowBlur=11;ctx.strokeStyle='rgba(194,218,184,.5)';ctx.stroke();ctx.shadowBlur=0;}
    }
    // Haze and lamp glare mute the far edges.
    const haze=ctx.createLinearGradient(0,0,0,height);
    haze.addColorStop(0,'rgba(238,224,155,.045)');haze.addColorStop(.5,'rgba(221,212,156,.055)');haze.addColorStop(1,'rgba(90,88,57,.08)');
    ctx.fillStyle=haze;ctx.fillRect(0,0,width,height);
    if(flash>0) {ctx.fillStyle=`rgba(238,232,178,${flash*.055})`;ctx.fillRect(0,0,width,height);}
  }
  function currentMark() {
    let best=null, score=Infinity;
    for(const mark of marks) {
      const dx=mark.x-state.x,dz=mark.z-state.z,dist=Math.hypot(dx,dz);
      if(dist>4.2) continue;
      const forward=dx*Math.sin(state.yaw)-dz*Math.cos(state.y);
      const side=dx*Math.cos(state.yaw)+dz*Math.sin(state.yaw);
      if(forward<.2 || Math.abs(Math.atan2(side,forward))>.48) continue;
      if(dist<score) {best=mark;score=dist;}
    }
    return best;
  }
  async function openMark(mark) {
    if(!mark)return;
    state.modal=true;state.found.add(mark.title);
    $('#note-kicker').textContent=mark.kicker;
    $('#note-title').textContent=mark.title;
    $('#note-body').textContent=mark.body;
    $('#photo-slot').hidden=mark.photo===undefined;
    $('#memory-image').hidden=true;
    $('#photo-placeholder').hidden=false;
    $('#photo-caption').textContent='Qui comparirà una foto cifrata.';
    $('#note').hidden=false;$('#prompt').hidden=true;
    if(document.pointerLockElement===canvas) document.exitPointerLock();
    $('#close-note').focus();
    if(mark.photo!==undefined && FloorVault.unlocked) {
      try {
        const memory=await FloorVault.photo(mark.photo);
        if(!state.modal || !memory)return;
        if(currentPhotoUrl) URL.revokeObjectURL(currentPhotoUrl);
        currentPhotoUrl=memory.url;
        $('#memory-image').src=memory.url;
        $('#memory-image').hidden=false;
        $('#photo-placeholder').hidden=true;
        $('#photo-caption').textContent=memory.caption;
      } catch(error) { $('#photo-caption').textContent='Impossibile aprire questa foto.'; }
    }
  }
  function closeMark() {
    $('#note').hidden=true;state.modal=false;canvas.focus();
    if(currentPhotoUrl) {URL.revokeObjectURL(currentPhotoUrl);currentPhotoUrl=null;$('#memory-image').removeAttribute('src');}
  }
  function step(ts) {
    const dt=Math.min((ts-lastFrame)/1000 || 0,.05);lastFrame=ts;
    if(state.active&&!state.modal) {
      const speed=(state.keys.has('Shift')?4.5:2.65)*dt;
      let f=Number(state.keys.has('w')||state.keys.has('ArrowUp')||state.keys.has('forward'))-Number(state.keys.has('s')||state.keys.has('ArrowDown')||state.keys.has('back'));
      let side=Number(state.keys.has('d')||state.keys.has('right'))-Number(state.keys.has('a')||state.keys.has('left'));
      const norm=Math.max(1,Math.hypot(f,side));f/=norm;side/=norm;
      const nx=state.x+(Math.sin(state.yaw)*f+Math.cos(state.yaw)*side)*speed;
      const nz=state.z+(-Math.cos(state.yaw)*f+Math.sin(state.yaw)*side)*speed;
      const pile=Math.hypot(nx,nz+5.8);
      if(nx>-17.15&&nx<17.15&&nz>-26.9&&nz<22.9&&pile>3.15) {state.x=nx;state.z=nz;}
      if(state.keys.has('ArrowLeft'))state.yaw-=dt*1.25;
      if(state.keys.has('ArrowRight'))state.yaw+=dt*1.25;
      $('#prompt').hidden=!currentMark();
      $('#mobile-interact').hidden=!currentMark();
      $('#position').textContent=state.z>-12?'ZONE 01 / 05':'ZONE 02 / 05';
      flash=Math.max(0,flash-dt*4);
      if(Math.random()<dt*.09) flash=1;
    }
    draw();requestAnimationFrame(step);
  }
  let soundTimer;
  function toggleSound() {
    if(state.audio) {state.audio=false;clearInterval(soundTimer);sound?.suspend();$('#sound').textContent='AUDIO OFF';return;}
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC)return;
    sound ||= new AC();sound.resume();state.audio=true;$('#sound').textContent='AUDIO ON';
    function buzz() {if(!state.audio)return;const osc=sound.createOscillator(),gain=sound.createGain();osc.type='sine';osc.frequency.value=55;gain.gain.setValueAtTime(.0001,sound.currentTime);gain.gain.exponentialRampToValueAtTime(.012,sound.currentTime+.08);gain.gain.exponentialRampToValueAtTime(.0001,sound.currentTime+2);osc.connect(gain).connect(sound.destination);osc.start();osc.stop(sound.currentTime+2.05);}
    buzz();soundTimer=setInterval(buzz,2200);
  }
  function enterWorld() {
    $('#intro').hidden=true;$('#hud').hidden=false;$('#reticle').hidden=false;$('#controls').hidden=false;
    $('#instructions').hidden=false;state.active=true;setTimeout(()=>$('#instructions').hidden=true,6500);
    canvas.setAttribute('tabindex','0');canvas.focus();
  }
  FloorVault.load().then(hasArchive=>{
    $('#enter').hidden=hasArchive;
    $('#demo-notice').hidden=hasArchive;
    $('#unlock-form').hidden=!hasArchive;
  });
  $('#enter').addEventListener('click',enterWorld);
  $('#unlock-form').addEventListener('submit',async event=>{
    event.preventDefault();
    const button=$('#unlock-form button');button.disabled=true;
    $('#unlock-error').hidden=true;
    try {await FloorVault.unlock($('#passphrase').value);$('#passphrase').value='';enterWorld();}
    catch(error) {$('#unlock-error').hidden=false;$('#passphrase').select();}
    finally {button.disabled=false;}
  });
  $('#sound').addEventListener('click',toggleSound);
  $('#close-note').addEventListener('click',closeMark);
  $('#note-continue').addEventListener('click',closeMark);
  $('#mobile-interact').addEventListener('click',()=>openMark(currentMark()));
  window.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&state.modal) {closeMark();return;}
    if(!state.active||state.modal)return;
    if(['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();
    state.keys.add(e.key);
    if(e.key.toLowerCase()==='e')openMark(currentMark());
  });
  window.addEventListener('keyup',e=>state.keys.delete(e.key));
  window.addEventListener('blur',()=>state.keys.clear());
  canvas.addEventListener('click',()=>{if(state.active&&!state.modal&&window.matchMedia('(pointer:fine)').matches)canvas.requestPointerLock?.();});
  canvas.addEventListener('pointerdown',e=>{state.dragging=true;state.lastX=e.clientX;state.lastY=e.clientY;});
  window.addEventListener('pointerup',()=>state.dragging=false);
  window.addEventListener('pointermove',e=>{
    if(!state.active||state.modal)return;
    if(document.pointerLockElement===canvas){state.yaw+=e.movementX*.0023;state.pitch=Math.max(-.38,Math.min(.38,state.pitch-e.movementY*.0018));}
    else if(state.dragging){state.yaw+=(e.clientX-state.lastX)*.006;state.pitch=Math.max(-.38,Math.min(.38,state.pitch-(e.clientY-state.lastY)*.003));state.lastX=e.clientX;state.lastY=e.clientY;}
  });
  document.querySelectorAll('[data-move]').forEach(btn=>{
    const key=btn.dataset.move;
    btn.addEventListener('pointerdown',e=>{e.preventDefault();state.keys.add(key);btn.setPointerCapture(e.pointerId);});
    btn.addEventListener('pointerup',()=>state.keys.delete(key));
    btn.addEventListener('pointercancel',()=>state.keys.delete(key));
  });
  window.addEventListener('resize',resize);
  buildScene();resize();requestAnimationFrame(step);
})();
