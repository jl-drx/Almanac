import test from 'node:test';
import assert from 'node:assert/strict';
import { SpaceEngine } from '../dist/engine.js';
function fixture(width=1000,height=650){
 const frames=new Map();let frameId=0;const handlers={};
 globalThis.requestAnimationFrame=fn=>{frames.set(++frameId,fn);return frameId;};
 globalThis.cancelAnimationFrame=id=>frames.delete(id);
 globalThis.window={devicePixelRatio:3,addEventListener(){}};
 globalThis.document={hidden:false,activeElement:null,addEventListener:(name,fn)=>handlers[name]=fn};
 globalThis.ResizeObserver=class{observe(){}};
 globalThis.Image=class{set src(value){queueMicrotask(()=>this.onload());}};
 const context=new Proxy({}, {get:(obj,key)=>obj[key]??(()=>{}),set:(obj,key,value)=>(obj[key]=value,true)});
 const canvas={getContext:()=>context,getBoundingClientRect:()=>({width,height}),addEventListener(){},focus(){}};
 const arrivals=[],engine=new SpaceEngine(canvas,{onNearby(){},onArrive:id=>{arrivals.push(id);engine.setPaused(true);},onStatus(){}});
 engine.start([],false);return {engine,frames,handlers,arrivals};
}
test('animation stops for pause, hidden documents and base camp, without duplicate loops',async()=>{
 const {engine,frames,handlers}=fixture();await engine.ready;
 assert.equal(frames.size,1);engine.start([],false);assert.equal(frames.size,1);
 engine.setPaused(true);assert.equal(frames.size,0);
 engine.setPaused(false);assert.equal(frames.size,1);
 document.hidden=true;handlers.visibilitychange();assert.equal(frames.size,0);
 document.hidden=false;handlers.visibilitychange();assert.equal(frames.size,1);
 engine.stop();assert.equal(frames.size,0);assert.equal(engine.running,false);
});
test('assisted travel can reach every world on desktop, phone and short landscape',async()=>{
 for(const dimensions of [[1280,648],[390,784],[667,315]])for(const id of ['earth','moon','mars']){
   const {engine,arrivals}=fixture(...dimensions);await engine.ready;engine.flyTo(id);
   for(let frame=0;frame<1200&&!arrivals.length;frame++)engine.update(1/60);
   assert.deepEqual(arrivals,[id],`${dimensions}: ${id} reachable`);engine.stop();
 }
});
test('keyboard input moves the ship and respects scene boundaries',async()=>{
 const {engine}=fixture();await engine.ready;const start=engine.x;engine.keys.add('d');for(let i=0;i<60;i++)engine.update(1/60);assert.ok(engine.x>start+100);
 for(let i=0;i<500;i++)engine.update(1/60);assert.ok(engine.x<=engine.width-23);engine.stop();assert.equal(engine.keys.size,0);
});
test('calm mode limits render pixel density',async()=>{const {engine}=fixture();await engine.ready;assert.equal(engine.dpr,1.5);engine.setCalm(true);assert.equal(engine.dpr,1);engine.stop();});
