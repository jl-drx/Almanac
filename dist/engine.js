import { STOPS } from './content.js';
import { planetArt, shipArt } from './art.js';
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
export class SpaceEngine {
  constructor(canvas,{onNearby,onArrive,onStatus}) {
    this.canvas=canvas; this.ctx=canvas.getContext('2d',{alpha:false}); this.callbacks={onNearby,onArrive,onStatus};
    this.keys=new Set();this.running=false;this.frame=0;this.active=false;this.paused=false;this.calm=false;this.completed=[];this.target=null;this.nearby=null;this.images={};this.angle=-.7;this.vx=0;this.vy=0;
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas);
    this.visibility=()=>this.syncLoop();document.addEventListener('visibilitychange',this.visibility);
    this.blur=()=>this.keys.clear();window.addEventListener('blur',this.blur);
    this.keydown=e=>{if(!this.running || document.activeElement?.closest('button,input'))return;const key=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(key)){e.preventDefault();this.keys.add(key);this.target=null;}if(key==='e'&&this.nearby){e.preventDefault();this.callbacks.onArrive(this.nearby);}};
    this.keyup=e=>this.keys.delete(e.key.toLowerCase());window.addEventListener('keydown',this.keydown);window.addEventListener('keyup',this.keyup);
    this.pointer=e=>{if(!this.running)return;const rect=canvas.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;const found=this.bodies.find(b=>Math.hypot(x-b.x,y-b.y)<b.r+28);if(found)this.flyTo(found.id);else{this.target={x:clamp(x,25,this.width-25),y:clamp(y,180,this.height-130)};this.callbacks.onStatus('On our way. Tap a world to investigate.');}canvas.focus({preventScroll:true});};canvas.addEventListener('pointerdown',this.pointer);
    this.ready=Promise.all([...STOPS.map(s=>[s.id,planetArt(s.id)]),['ship',shipArt()]].map(([id,svg])=>new Promise(resolve=>{const img=new Image();const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));img.onload=()=>{this.images[id]=img;URL.revokeObjectURL(url);this.draw();resolve();};img.onerror=()=>{URL.revokeObjectURL(url);resolve();};img.src=url;})));
  }
  resize(){const rect=this.canvas.getBoundingClientRect();if(rect.width<1||rect.height<1)return;const oldWidth=this.width||rect.width,oldHeight=this.height||rect.height;this.width=rect.width;this.height=rect.height;this.dpr=Math.min(window.devicePixelRatio||1,this.calm?1:1.5);this.canvas.width=Math.round(this.width*this.dpr);this.canvas.height=Math.round(this.height*this.dpr);this.ctx.setTransform(this.dpr,0,0,this.dpr,0,0);this.x=this.x?this.x/oldWidth*this.width:this.width*.12;this.y=this.y?this.y/oldHeight*this.height:this.height*.69;const small=this.width<760;this.bodies=STOPS.map(s=>({...s,x:s.x*this.width,y:small?(s.id==='moon'?.37:.58)*this.height:s.y*this.height,r:clamp(this.width*(s.id==='earth'?.078:s.id==='moon'?.036:.057),s.id==='moon'?24:38,s.id==='earth'?108:78)}));this.stars=Array.from({length:small?45:95},(_,i)=>({x:((i*73.137+17)%997)/997*this.width,y:((i*127.53+51)%991)/991*this.height,r:i%5===0?1.6:.8}));this.draw();}
  start(completed,calm){this.active=true;this.paused=false;this.completed=completed;this.calm=calm;this.resize();this.syncLoop();}
  stop(){this.active=false;this.keys.clear();this.syncLoop();}
  setPaused(value){this.paused=value;this.keys.clear();this.syncLoop();}
  setCalm(value){this.calm=value;this.resize();}
  syncLoop(){const shouldRun=this.active&&!this.paused&&!document.hidden;if(shouldRun===this.running)return;this.running=shouldRun;cancelAnimationFrame(this.frame);this.frame=0;this.last=0;this.keys.clear();if(shouldRun)this.frame=requestAnimationFrame(t=>this.tick(t));}
  flyTo(id){if(!this.running)return;this.target=id;this.keys.clear();this.callbacks.onStatus(`Flying to ${STOPS.find(s=>s.id===id).name}…`);this.canvas.focus({preventScroll:true});}
  tick(t){if(!this.running)return;const dt=this.last?Math.min((t-this.last)/1000,.035):0;this.last=t;this.update(dt);this.draw();if(this.running)this.frame=requestAnimationFrame(time=>this.tick(time));}
  update(dt){let ax=0,ay=0;const key=(...keys)=>keys.some(k=>this.keys.has(k));if(key('arrowleft','a'))ax--;if(key('arrowright','d'))ax++;if(key('arrowup','w'))ay--;if(key('arrowdown','s'))ay++;
    if(this.target){const target=typeof this.target==='string'?this.bodies.find(b=>b.id===this.target):this.target;const dx=target.x-this.x,dy=target.y-this.y,distance=Math.hypot(dx,dy);const stop=target.r?target.r+36:8;if(distance<stop){this.target=null;this.vx=0;this.vy=0;if(target.id){this.setNearby(target.id);this.callbacks.onArrive(target.id);return;}}else{ax=dx/distance;ay=dy/distance;}}
    const magnitude=Math.hypot(ax,ay);if(magnitude>1){ax/=magnitude;ay/=magnitude;}const speed=clamp(this.width*.29,165,340);const blend=1-Math.exp(-7*dt);this.vx+=(ax*speed-this.vx)*blend;this.vy+=(ay*speed-this.vy)*blend;this.x=clamp(this.x+this.vx*dt,23,this.width-23);this.y=clamp(this.y+this.vy*dt,Math.min(this.width<760?185:140,this.height*.3),Math.max(this.height*.3,this.height-130));if(Math.hypot(this.vx,this.vy)>3)this.angle=Math.atan2(this.vy,this.vx);const near=this.bodies.find(b=>Math.hypot(b.x-this.x,b.y-this.y)<b.r+65);this.setNearby(near?.id||null);
  }
  setNearby(id){if(id===this.nearby)return;this.nearby=id;this.callbacks.onNearby(id);}
  draw(){if(!this.width||!this.ctx)return;const c=this.ctx,w=this.width,h=this.height;c.fillStyle='#142e39';c.fillRect(0,0,w,h);c.fillStyle='#b2c8b9';for(const s of this.stars||[]){c.globalAlpha=.45;c.beginPath();c.arc(s.x,s.y,s.r,0,Math.PI*2);c.fill();}c.globalAlpha=1;
    c.lineWidth=1;c.strokeStyle='#30505a';c.beginPath();c.ellipse(w*.51,h*.54,w*.37,h*.25,-.17,0,Math.PI*2);c.stroke();c.setLineDash([3,9]);c.beginPath();c.ellipse(w*.51,h*.54,w*.42,h*.30,-.17,0,Math.PI*2);c.stroke();c.setLineDash([]);
    for(const b of this.bodies||[]){if(b.id===this.nearby||b.id===this.target){c.strokeStyle='#d5c17a';c.lineWidth=1;c.setLineDash([4,7]);c.beginPath();c.arc(b.x,b.y,b.r+17,0,Math.PI*2);c.stroke();c.setLineDash([]);}if(this.images[b.id])c.drawImage(this.images[b.id],b.x-b.r,b.y-b.r,b.r*2,b.r*2);else{c.fillStyle=b.color;c.beginPath();c.arc(b.x,b.y,b.r,0,Math.PI*2);c.fill();}c.textAlign='center';c.font='12px Trebuchet MS, Arial';c.fillStyle='#d8e1cb';c.fillText(b.name.toUpperCase()+(this.completed.includes(b.id)?'  ✓':''),b.x,b.y+b.r+25);c.font='9px Arial';c.fillStyle='#8daaa5';c.fillText(b.subtitle,b.x,b.y+b.r+42);}
    if(this.target){const b=typeof this.target==='string'?this.bodies.find(b=>b.id===this.target):this.target;c.strokeStyle='#aaad79';c.setLineDash([3,8]);c.beginPath();c.moveTo(this.x,this.y);c.lineTo(b.x,b.y);c.stroke();c.setLineDash([]);}
    if(Number.isFinite(this.x)){c.save();c.translate(this.x,this.y);c.rotate(this.angle+Math.PI/4);const size=w<760?48:61;if(this.images.ship)c.drawImage(this.images.ship,-size/2,-size/2,size,size);c.restore();}
  }
}
