import assert from 'node:assert/strict';
import {installTouchControls,createJump} from './controls.js';
class Surface extends EventTarget{
  constructor(action){super();this.dataset={action};this.classList={toggle(){}};}
  setPointerCapture(){}
  fire(type,id,x=0,y=0){const event=new Event(type,{cancelable:true});Object.assign(event,{pointerId:id,pointerType:'touch',clientX:x,clientY:y});this.dispatchEvent(event);}
}
const canvas=new Surface(),walk=new Surface('walk'),run=new Surface('run'),hop=new Surface('jump'),host=new Surface(),doc=new Surface();
let dx=0,dy=0,jumps=0,activations=0;
const input=installTouchControls(canvas,[walk,run,hop],{look:(x,y)=>{dx+=x;dy+=y;},jump:()=>jumps++,activate:()=>activations++},host,doc);
walk.fire('pointerdown',1);canvas.fire('pointerdown',2,100,100);canvas.fire('pointermove',2,150,80);
assert.equal(input.forward,true);assert.equal(dx,.2);assert.equal(dy,-.08);
run.fire('pointerdown',3);assert.equal(input.running,true);
host.fire('pointerup',1);assert.equal(input.forward,true);
hop.fire('pointerdown',4);assert.equal(jumps,1);assert.equal(input.running,true);
host.fire('pointercancel',3);assert.equal(input.forward,false);
canvas.fire('lostpointercapture',2);canvas.fire('pointermove',2,200,100);assert.equal(dx,.2);
for(const event of ['blur','orientationchange']){walk.fire('pointerdown',5);host.fire(event,0);assert.equal(input.forward,false);}
walk.fire('pointerdown',6);doc.fire('visibilitychange',0);assert.equal(input.forward,false);
walk.fire('pointerdown',7);walk.fire('lostpointercapture',7);assert.equal(input.forward,false);
assert.ok(activations>=4);
const jump=createJump();jump.start();let h=jump.update(.016,2.85);assert.ok(h>0);
jump.start();let peak=h;for(let i=0;i<100;i++){h=jump.update(.016,2.85);peak=Math.max(peak,h);}
assert.equal(h,0);assert.ok(peak>.5&&peak<.7);
jump.start();for(let i=0;i<100;i++)assert.ok(jump.update(.016,1.96)<=.05+1e-12);
console.log('PASS: simultaneous walk/look/run/jump, release, cancellation, lost capture, background/orientation reset, jump landing and ceiling.');
