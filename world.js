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
  function sign(x,y,z,w,h,label,color='#d8c49b',ink='#3e3b31') {
    quad([[x-w/2,y,z],[x+w/2,y,z],[x+w/2,y+h,z],[x-w/2,y+h,z]],color,'sign',{label,ink});
  }
  function suitcase(x,y,z,w,h,d,color) {
    box(x,y,z,w,h,d,color,'luggage');
    box(x-w*.32,y+.03,z+d/2+.018,.055,h-.08,.025,'#a99774','strap');
    box(x+w*.32,y+.03,z+d/2+.018,.055,h-.08,.025,'#a99774','strap');
    box(x,y+h,z,.4,.16,.13,'#6a5236','handle');
    box(x-w*.38,y+.06,z+d/2+.022,.12,.12,.025,'#b8a267','latch');
  }
  function eiffel(x,y,z) {
    const iron='#877959',h=1.78,w=.92;
    for(const side of [-1,1]) {
      const foot=x+side*w/2,top=x+side*.055;
      quad([[foot-.075,y,z+.27],[foot+.075,y,z+.27],[top+.045,y+h,z+.12],[top-.045,y+h,z+.12]],iron,'iron');
      quad([[foot-.075,y,z-.27],[foot+.075,y,z-.27],[top+.045,y+h,z-.12],[top-.045,y+h,z-.12]],shade(iron,.9),'iron');
    }
    for(const level of [.25,.72,1.17,1.47]) box(x,y+level,z+.28,w*(1-level/h)*.9,.075,.12,'#a3916a','iron');
    box(x,y+1.73,z,.045,.25,.045,'#8b7b59','iron');
  }
  function phoneBooth(x,y,z) {
    box(x,y,z,1.04,1.86,.72,'#9d473a','souvenir');
    box(x,y+.21,z+.37,.79,1.34,.018,'#394d4b','glass');
    for(const dx of [-.36,0,.36])box(x+dx,y+.2,z+.4,.055,1.33,.025,'#ad4d3c','souvenir');
    for(const dy of [.53,.95,1.31])box(x,y+dy,z+.4,.77,.055,.025,'#ad4d3c','souvenir');
    sign(x,y+1.64,z+.39,.78,.16,'LONDON','#d8ccad','#493c37');
  }
  function warsawTower(x,y,z) {
    box(x,y,z,.96,1.12,.63,'#b3a58a','stone');
    box(x,y+1.12,z,.69,.48,.55,'#a99980','stone');
    box(x,y+1.6,z,.42,.35,.4,'#9f9076','stone');
    box(x,y+1.95,z,.18,.43,.18,'#8c816b','stone');
    box(x,y+2.38,z,.04,.17,.04,'#8c816b','stone');
    sign(x,y+1.28,z+.29,.27,.22,'◷','#e1d8bc','#4b493c');
    for(const dx of [-.3,0,.3])box(x+dx,y+.2,z+.33,.08,.75,.02,'#7b7865','window');
  }
  function tram(x,y,z) {
    box(x,y,z,2.2,.75,.72,'#b89e51','tram');
    box(x,y+.7,z,2.14,.1,.74,'#d5c38c','tram');
    for(let i=0;i<5;i++)box(x-.86+i*.43,y+.32,z+.37,.3,.31,.02,'#536566','glass');
    box(x-.66,y-.05,z+.2,.28,.2,.1,'#3f4036','wheel');
    box(x+.68,y-.05,z+.2,.28,.2,.1,'#3f4036','wheel');
    sign(x,y+.03,z+.39,.59,.18,'MILANO','#dbc484','#423e2f');
  }
  function boat(x,y,z) {
    quad([[x-1,y+.32,z+.45],[x+1,y+.32,z+.45],[x+.67,y,z+.45],[x-.7,y,z+.45]],'#e5ddc7','boat');
    box(x,y+.31,z,.99,.37,.64,'#d1c7ae','boat');
    box(x-.2,y+.68,z,.46,.24,.43,'#dad2bb','boat');
    for(const dx of [-.25,0,.25])box(x+dx,y+.43,z+.34,.14,.11,.02,'#5b7776','glass');
    box(x-.55,y+.32,z+.47,.25,.07,.02,'#a95d48','boat');
  }
  function colosseum(x,y,z) {
    box(x,y,z,1.45,.94,.6,'#b7a17d','stone');
    for(const dx of [-.48,-.16,.16,.48]) {
      box(x+dx,y+.17,z+.32,.2,.56,.025,'#675c49','arch');
      box(x+dx,y+.61,z+.34,.22,.13,.025,'#b7a17d','stone');
    }
    box(x,y+.91,z,1.51,.13,.65,'#a58f6c','stone');
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
    // A heap of travel objects: luggage as structure, landmarks and scraps wedged in.
    suitcase(-4.2,0,-6.3,2.05,1.16,1.15,'#80634c');
    suitcase(-2.2,0,-7.0,2.35,1.32,1.32,'#716b55');
    suitcase(.2,0,-6.7,2.3,1.12,1.4,'#806b4e');
    suitcase(2.55,0,-6.7,2.15,1.28,1.1,'#5c6661');
    suitcase(4.6,0,-7.6,1.75,1.03,1.03,'#796751');
    suitcase(-5.45,0,-8.0,1.4,.8,.9,'#9a8563');
    suitcase(5.55,0,-5.8,1.18,.81,.72,'#987852');
    suitcase(-1.15,1.2,-7.6,1.64,.65,.76,'#a07555');
    suitcase(2.85,1.26,-7.2,1.49,.62,.81,'#8b745c');
    // London and Paris are tangled into the same precarious stack.
    phoneBooth(-3.75,1.18,-6.55);
    eiffel(-1.95,1.37,-7.13);
    sign(-5.52,.85,-5.7,.8,.18,'OXFORD','#d0bf90','#594f3d');
    // Warsaw's skyline rises behind a Milan tram and a Roman amphitheatre.
    warsawTower(.45,1.16,-8.7);
    tram(2.25,1.28,-6.0);
    colosseum(-.65,1.12,-5.3);
    // An Oxford book pile, a Civitavecchia ferry, a Naples pizza box.
    for(const [i,color] of ['#504f43','#7f6652','#5b5c50','#94785e'].entries())
      box(-5.23,.78+i*.16,-7.35,1.28,.15,.73,color,'book');
    box(-5.23,1.44,-7.35,.12,.46,.13,'#a39b7e','spire');
    box(-5.23,1.84,-7.35,.045,.3,.045,'#a39b7e','spire');
    boat(4.25,1.04,-8.2);
    box(3.55,.03,-4.85,1.45,.19,1.02,'#b68f63','cardboard');
    sign(3.55,.06,-4.32,1.15,.1,'NAPOLI','#d8b78b','#8e4b3a');
    box(4.75,.12,-5.0,.3,.32,.27,'#c9b994','cup');
    box(4.75,.42,-5.0,.26,.035,.25,'#ede0bd','cup');
    // Tickets, postcards and maps spill out around the base.
    box(-4.9,.03,-4.45,.9,.035,.48,'#c5b891','paper');
    sign(-4.9,.04,-4.2,.62,.16,'TUBE','#c5b891','#694b40');
    box(-2.8,.025,-4.27,.85,.03,.48,'#c7b58f','paper');
    sign(-2.8,.035,-4.01,.6,.14,'PARIS','#c7b58f','#5c5542');
    box(.85,.02,-4.16,1.25,.035,.63,'#b4a884','map');
    sign(.85,.04,-3.83,.8,.17,'ROMA','#b4a884','#665545');
    box(5.23,.025,-4.48,.9,.03,.5,'#d1c19e','paper');
    sign(5.23,.04,-4.2,.7,.15,'PORTO','#d1c19e','#5a6156');
    // Two photographs sit in ordinary paper frames among the souvenirs.
    box(-2.92,1.39,-5.68,.63,.54,.055,'#dfd3af','frame');
    box(-2.92,1.49,-5.64,.48,.34,.012,'#687369','picture');
    box(1.35,1.13,-5.62,.62,.54,.055,'#ded2ae','frame');
    box(1.35,1.23,-5.58,.48,.34,.012,'#667469','picture');
    box(0,0,-27.8,2.2,3.25,.13,'#7e7750','door');
    box(0,0,-27.66,1.84,2.95,.08,'#4b503d','door');
    box(.66,1.43,-27.58,.09,.09,.09,'#dad4a2','knob');
    marks.push(
      {x:-3.8,z:-4.8,kicker:'TRA LE VALIGIE',title:'Londra e Parigi',body:'Una cabina rossa, una piccola Tour Eiffel e vecchi biglietti sono finiti nello stesso mucchio.'},
      {x:.3,z:-3.5,kicker:'UN FOGLIO PIEGATO',title:'Città sovrapposte',body:'Varsavia, Milano e Roma. Gli oggetti dei viaggi si sostengono a vicenda in modo improbabile.'},
      {x:4.8,z:-4.6,kicker:'AI PIEDI DEL MUCCHIO',title:'Dal porto a Napoli',body:'Un traghetto di Civitavecchia spunta dietro una scatola da pizza. Più in là, alcuni libri ricordano Oxford.'},
      {x:-2.9,z:-4.7,kicker:'TRA I RICORDI',title:'Qualcosa affiora',body:'Una foto è rimasta qui.',photo:0},
      {x:1.4,z:-4.5,kicker:'UNA CORNICE',title:'Una foto dimenticata',body:'Un ricordo nascosto nel mucchio.',photo:1},
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
      if(item.face.kind==='sign' && pts.length===4) {
        const x=pts.reduce((sum,p)=>sum+p[0],0)/4, y=pts.reduce((sum,p)=>sum+p[1],0)/4;
        const span=Math.max(...pts.map(p=>p[0]))-Math.min(...pts.map(p=>p[0]));
        if(span>22) {
          ctx.fillStyle=item.face.detail.ink;
          ctx.font=`bold ${Math.min(17,Math.max(8,span/(item.face.detail.label.length*.74)))}px Arial`;
          ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(item.face.detail.label,x,y,span*.88);
        }
      }
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
      const pile=Math.hypot(nx,nz+6.6);
      if(nx>-17.15&&nx<17.15&&nz>-26.9&&nz<22.9&&pile>5.8) {state.x=nx;state.z=nz;}
      if(state.keys.has('ArrowLeft'))state.yaw-=dt*1.25;
      if(state.keys.has('ArrowRight'))state.yaw+=dt*1.25;
      $('#prompt').hidden=!currentMark();
      $('#mobile-interact').hidden=!currentMark();
      $('#position').textContent=state.z>-12?'SALA 01 / PROTOTIPO':'FONDO SALA / PROTOTIPO';
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
