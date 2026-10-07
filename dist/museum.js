import { planetArt, shipArt } from './art.js';

export const EXHIBITS = [
  {id:'earth',name:'The turning Earth',area:'The Orbitarium',x:1280,y:670,doorX:1290,doorY:830,type:'space'},
  {id:'moon',name:'The gravity garden',area:'The Orbitarium',x:1542,y:550,doorX:1510,doorY:785,type:'space'},
  {id:'mars',name:'The red planet',area:'The Orbitarium',x:1610,y:725,doorX:1510,doorY:825,type:'space'},
  {id:'flight',name:'Take the little ship',area:'The flight deck',x:1012,y:617,doorX:1070,doorY:817,type:'flight'},
  {id:'history',name:'Walk through time',area:'The Time Gallery',x:580,y:950,doorX:675,doorY:1040,type:'history'},
  {id:'weather',name:'Make a little weather',area:'The Weather Works',x:2080,y:965,doorX:1930,doorY:1090,type:'weather'},
  {id:'life',name:'Follow the energy',area:'The Living Room',x:1380,y:1430,doorX:1340,doorY:1400,type:'life'}
];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const ease=(a,b,dt)=>a+(b-a)*(1-Math.exp(-6*dt));

export class Museum {
  constructor(canvas,layer,{onEnter,onArea,onReady}){
    this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.layer=layer;this.onEnter=onEnter;this.onArea=onArea;this.onReady=onReady;
    this.position={x:1310,y:1060};this.camera={x:1310,y:990};this.zoom=.65;this.keys=new Set();this.target=null;this.route=[];this.time=0;this.calm=false;this.suspended=false;this.dirty=true;this.images={};this.exhibitState={history:0,weather:0,life:0};this.pointers=new Map();this.follow=false;
    this.world=document.createElement('canvas');this.world.width=2800;this.world.height=1850;this.w=this.world.getContext('2d');
    this.buttons=EXHIBITS.map(e=>{const b=document.createElement('button');b.className=`museum-hotspot ${e.type}`;b.setAttribute('aria-label',e.name);b.innerHTML=`<span class="hotspot-symbol" aria-hidden="true">${e.id==='flight'?'↗':'+'}</span><span class="hotspot-name">${e.name}</span>`;b.addEventListener('click',()=>this.visit(e.id));layer.append(b);return {e,b};});
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas);
    window.addEventListener('keydown',e=>{if(this.suspended||document.querySelector('dialog[open]')||e.target.closest('input,button'))return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D'].includes(e.key)){e.preventDefault();this.keys.add(e.key.toLowerCase());this.target=null;this.route=[];this.follow=true;this.interacted();this.wake();}if(e.key.toLowerCase()==='e'&&this.nearby)this.enter(this.nearby);});
    window.addEventListener('keyup',e=>this.keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{this.keys.clear();this.pointers.clear();});
    document.addEventListener('visibilitychange',()=>{this.keys.clear();if(document.hidden){cancelAnimationFrame(this.frame);this.frame=0;}else this.wake();});
    canvas.addEventListener('pointerdown',e=>{if(this.suspended)return;canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});this.drag={x:e.clientX,y:e.clientY,cx:this.camera.x,cy:this.camera.y,moved:false};this.interacted();});
    canvas.addEventListener('pointermove',e=>{if(!this.pointers.has(e.pointerId)||!this.drag)return;this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y;if(Math.hypot(dx,dy)>5)this.drag.moved=true;if(this.drag.moved){this.camera.x=clamp(this.drag.cx-dx/this.zoom,300,2450);this.camera.y=clamp(this.drag.cy-dy/this.zoom,320,1610);this.follow=false;this.dirty=true;this.wake();}});
    const release=(e,cancelled=false)=>{if(!this.pointers.has(e.pointerId))return;this.pointers.delete(e.pointerId);if(!cancelled&&this.drag&&!this.drag.moved){const rect=canvas.getBoundingClientRect(),p=this.toWorld(e.clientX-rect.left,e.clientY-rect.top);const exhibit=EXHIBITS.find(s=>Math.hypot(s.x-p.x,s.y-p.y)<100);if(exhibit)this.visit(exhibit.id);else{this.target={x:clamp(p.x,380,2300),y:clamp(p.y,700,1510)};this.route=[];this.arrival=null;this.follow=false;this.wake();}}this.drag=null;};
    canvas.addEventListener('pointerup',e=>release(e));canvas.addEventListener('pointercancel',e=>release(e,true));
    canvas.addEventListener('wheel',e=>{e.preventDefault();this.changeZoom(e.deltaY>0?-.08:.08);},{passive:false});
    this.ready=Promise.all([...['earth','moon','mars'].map(id=>[id,planetArt(id)]),['ship',shipArt()]].map(([id,svg])=>new Promise(resolve=>{const image=new Image(),url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));image.onload=()=>{this.images[id]=image;URL.revokeObjectURL(url);resolve();};image.onerror=()=>{URL.revokeObjectURL(url);resolve();};image.src=url;}))).then(()=>{this.paintWorld();this.resize();this.wake();onReady?.();});
  }
  interacted(){document.querySelector('#walk-hint')?.classList.add('quiet');}
  resize(){const r=this.canvas.getBoundingClientRect();if(!r.width||!r.height)return;this.width=r.width;this.height=r.height;const dpr=Math.min(devicePixelRatio||1,this.calm?1:1.5);this.canvas.width=Math.round(r.width*dpr);this.canvas.height=Math.round(r.height*dpr);this.ctx.setTransform(dpr,0,0,dpr,0,0);if(!this.initialised){this.zoom=r.width<650?.57:clamp(r.width/2070,.48,.86);this.initialised=true;}this.dirty=true;this.wake();}
  toWorld(x,y){return{x:(x-this.width/2)/this.zoom+this.camera.x,y:(y-this.height/2)/this.zoom+this.camera.y};}
  project(x,y){return{x:(x-this.camera.x)*this.zoom+this.width/2,y:(y-this.camera.y)*this.zoom+this.height/2};}
  changeZoom(delta){this.zoom=clamp(this.zoom+delta,.38,1.25);this.dirty=true;this.interacted();this.wake();document.querySelector('#zoom-value').textContent=`${Math.round(this.zoom*100)}%`;}
  recenter(){this.camera={x:1310,y:990};this.zoom=this.width<650?.57:clamp(this.width/2070,.48,.86);this.follow=false;this.dirty=true;this.wake();}
  setCalm(value){this.calm=value;this.resize();}
  setPaused(value){this.suspended=value;this.keys.clear();if(value){cancelAnimationFrame(this.frame);this.frame=0;}else this.wake();}
  setProgress(ids){this.completed=ids;for(const {e,b}of this.buttons)b.classList.toggle('found',ids.includes(e.id));}
  setExhibit(id,value){this.exhibitState[id]=value;this.paintWorld();this.dirty=true;this.wake();}
  visit(id){const exhibit=EXHIBITS.find(e=>e.id===id);if(!exhibit)return;this.interacted();this.arrival=id;this.route=[];const cross=Math.hypot(this.position.x-exhibit.doorX,this.position.y-exhibit.doorY)>470;if(cross)this.route.push({x:1310,y:1080});this.route.push({x:exhibit.doorX,y:exhibit.doorY});this.target=this.route.shift();this.follow=true;this.keys.clear();this.onArea(exhibit.area);this.wake();}
  enter(id){this.target=null;this.route=[];this.arrival=null;this.keys.clear();this.onEnter(id);}
  wake(){if(!this.frame&&!this.suspended&&!document.hidden)this.frame=requestAnimationFrame(t=>this.tick(t));}
  tick(t){this.frame=0;if(this.suspended||document.hidden)return;const dt=this.last?Math.min((t-this.last)/1000,.035):.016;this.last=t;this.time+=dt;let dx=0,dy=0;const has=(...v)=>v.some(k=>this.keys.has(k));if(has('arrowleft','a'))dx--;if(has('arrowright','d'))dx++;if(has('arrowup','w'))dy--;if(has('arrowdown','s'))dy++;
    if(this.target){const x=this.target.x-this.position.x,y=this.target.y-this.position.y,d=Math.hypot(x,y);if(d<8){this.target=this.route.shift()||null;if(!this.target&&this.arrival){const id=this.arrival;this.arrival=null;this.dirty=true;this.draw();this.enter(id);return;}}else{dx=x/d;dy=y/d;}}
    const mag=Math.hypot(dx,dy);if(mag){this.position.x=clamp(this.position.x+dx/Math.max(1,mag)*230*dt,330,2390);this.position.y=clamp(this.position.y+dy/Math.max(1,mag)*230*dt,700,1570);this.facing=dx<0?-1:1;this.dirty=true;}
    const tx=this.position.x,ty=this.position.y-80;let cameraMoving=false;if(this.follow){cameraMoving=Math.hypot(this.camera.x-tx,this.camera.y-ty)>1;this.camera.x=ease(this.camera.x,tx,dt);this.camera.y=ease(this.camera.y,ty,dt);if(cameraMoving)this.dirty=true;}
    const near=EXHIBITS.find(e=>Math.hypot(e.doorX-this.position.x,e.doorY-this.position.y)<110);if(this.nearby!==near?.id){this.nearby=near?.id;const button=document.querySelector('#nearby-exhibit');button.hidden=!near;button.textContent=near?`${near.name}  ↗`:'';if(near)this.onArea(near.area);else this.onArea('The Grand Concourse');}
    if(this.dirty){this.draw();this.dirty=false;}if(mag||this.target||cameraMoving||this.exhibitState.weather===2||this.exhibitState.weather===3){if(this.exhibitState.weather>=2&&!this.calm)this.dirty=true;this.wake();}else this.last=0;
  }
  draw(){if(!this.width)return;const c=this.ctx;c.fillStyle='#dce4da';c.fillRect(0,0,this.width,this.height);c.save();c.translate(this.width/2,this.height/2);c.scale(this.zoom,this.zoom);c.translate(-this.camera.x,-this.camera.y);c.drawImage(this.world,0,0);
    if(this.target){c.strokeStyle='#80998b';c.lineWidth=2;c.setLineDash([2,9]);c.beginPath();c.moveTo(this.position.x,this.position.y);for(const p of [this.target,...this.route])c.lineTo(p.x,p.y);c.stroke();c.setLineDash([]);c.strokeStyle='#b28c48';c.beginPath();c.ellipse(this.target.x,this.target.y,15,7,0,0,Math.PI*2);c.stroke();}
    if(this.exhibitState.weather===3&&!this.calm){c.strokeStyle='#8dbbb9';c.lineWidth=2;for(let i=0;i<30;i++){const x=1970+(i*47%218),y=734+((this.time*160+i*19)%190);c.beginPath();c.moveTo(x,y);c.lineTo(x-4,y+12);c.stroke();}}
    this.visitor(c,this.position.x,this.position.y,Math.hypot(...[this.keys.size,this.target?1:0])?Math.sin(this.time*14)*2:0);
    c.restore();for(const {e,b}of this.buttons){const p=this.project(e.x,e.y);b.style.transform=`translate(${Math.round(p.x)}px,${Math.round(p.y)}px) translate(-50%,-50%)`;b.hidden=p.x< -80||p.x>this.width+80||p.y< -80||p.y>this.height+50;}document.querySelector('#zoom-value').textContent=`${Math.round(this.zoom*100)}%`;
  }
  visitor(c,x,y,bob=0){c.save();c.translate(x,y);c.fillStyle='#567a6338';c.beginPath();c.ellipse(5,3,18,7,0,0,Math.PI*2);c.fill();c.translate(0,bob);c.strokeStyle='#2c4949';c.lineWidth=5;c.lineCap='round';c.beginPath();c.moveTo(-5,-13);c.lineTo(-7,0);c.moveTo(5,-13);c.lineTo(7,0);c.stroke();c.fillStyle='#d79257';c.beginPath();c.roundRect(-10,-33,20,23,7);c.fill();c.fillStyle='#f4eee0';c.beginPath();c.arc(0,-43,12,0,Math.PI*2);c.fill();c.fillStyle='#345e65';c.beginPath();c.roundRect(-9,-47,18,9,4);c.fill();c.fillStyle='#e8bb72';c.fillRect(-13,-29,5,14);c.restore();}

  paintWorld(){const c=this.w;c.clearRect(0,0,2800,1850);const ellipse=(x,y,rx,ry,fill,stroke)=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1.5;c.stroke();}};const path=(points,fill,stroke,width=1)=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}};const line=(points,stroke,width=1)=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=stroke;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.stroke();};const text=(label,x,y,size=14,fill='#61796f')=>{c.fillStyle=fill;c.font=`${size}px Trebuchet MS, Arial`;c.textAlign='center';c.fillText(label,x,y);};
    const deck=(x,y,rx,ry,color='#ecebde')=>{ellipse(x+10,y+27,rx+14,ry+12,'#77958a20');ellipse(x,y+17,rx,ry,'#b8c4b4');c.fillStyle='#b8c4b4';c.fillRect(x-rx,y,rx*2,17);ellipse(x,y,rx,ry,color);ellipse(x,y,rx-12,ry-8,null,'#d4d9c9');};
    const tree=(x,y,size=1,tone='#9bb49a')=>{ellipse(x+14*size,y+4*size,26*size,10*size,'#809a7b27');line([[x,y],[x,y-53*size]],'#8d9880',5*size);ellipse(x,y-59*size,23*size,29*size,tone);ellipse(x-12*size,y-43*size,20*size,22*size,tone);ellipse(x+13*size,y-40*size,15*size,18*size,tone);};
    const planter=(x,y)=>{deck(x,y,63,24,'#849e7b');tree(x-19,y-3,.9);tree(x+23,y+3,.65,'#c5c891');};
    const bench=(x,y)=>{path([[x-24,y-10],[x+23,y-17],[x+40,y-9],[x-8,y-1]],'#c0a078');line([[x-13,y],[x-13,y+11],[x+30,y+3],[x+30,y-6]],'#8b9280',4);};
    const bridge=(points)=>{line(points.map(([x,y])=>[x,y+14]),'#b9c8b8',88);line(points,'#f1edda',83);line(points,'#dbd9be',2);};
    // One connected sculpture garden, with raised paths joining the galleries.
    ellipse(1320,1080,1120,540,'#cddbc9');ellipse(1320,1070,1070,514,'#d5dfcc');
    for(let i=0;i<70;i++){const x=360+(i*193%1900),y=830+(i*71%690);ellipse(x,y,1.5,1,'#afc0ab');}
    bridge([[600,1050],[815,1050],[1060,1110],[1310,1080]]);bridge([[1310,1080],[1530,1130],[1830,1075],[2100,1100]]);bridge([[1310,1080],[1260,915],[1300,820]]);bridge([[1310,1080],[1220,1240],[1330,1410]]);
    deck(1310,1080,263,117,'#eeeadd');ellipse(1310,1080,210,91,null,'#d3c8a8');ellipse(1310,1080,203,87,null,'#d3c8a8');
    // The orbitarium: an open armillary gallery, not an enclosed building.
    deck(1320,793,369,154,'#e4e6d9');ellipse(1310,788,297,116,'#203f49');ellipse(1310,788,278,108,null,'#597c7d');
    for(let i=0;i<42;i++){ellipse(1050+(i*63%516),740+(i*31%101),1.3,1,'#b6c6b4');}
    c.save();c.translate(1300,735);c.rotate(-.18);c.strokeStyle='#a1b7a7';c.lineWidth=7;c.beginPath();c.ellipse(0,-20,203,184,0,Math.PI,Math.PI*2);c.stroke();c.restore();
    line([[1102,770],[1102,623]],'#91a99a',5);line([[1497,741],[1497,557]],'#91a99a',5);
    ellipse(1280,786,111,33,'#0e2b36');line([[1280,781],[1280,635]],'#7faaa1',12);
    if(this.images.earth)c.drawImage(this.images.earth,1154,517,252,252);
    c.save();c.translate(1280,645);c.rotate(-.35);c.strokeStyle='#e4c48b';c.lineWidth=2.5;c.beginPath();c.ellipse(0,0,166,54,0,0,Math.PI*2);c.stroke();c.restore();
    line([[1542,766],[1542,581]],'#a3b3a0',4);if(this.images.moon)c.drawImage(this.images.moon,1506,511,72,72);
    line([[1609,821],[1609,730]],'#a3b3a0',4);if(this.images.mars)c.drawImage(this.images.mars,1572,667,76,76);
    deck(1004,748,87,35,'#d7d9c6');ellipse(1004,743,67,23,'#526e6e');if(this.images.ship)c.drawImage(this.images.ship,950,605,108,108);
    text('O R B I T A R I U M',1307,888,18,'#607d70');text('01  /  LOOK UP',1307,911,9,'#859987');
    // The time gallery: sandstone, an impossible arch and a moving timeline.
    deck(577,1040,275,124,'#e9dcc1');ellipse(577,1024,221,90,'#d8bf93');
    for(let i=0;i<4;i++){const w=142-i*26;path([[452-w/2,1010-i*29],[452+54,1038-i*29],[452+w/2+90,996-i*29],[452+34,972-i*29]],i%2?'#c5a375':'#d4b183');}
    path([[377,966],[459,829],[514,956],[460,994]],'#dbb985');path([[459,829],[542,948],[460,994]],'#b98f63');
    c.fillStyle='#a88d6d';c.beginPath();c.roundRect(646,821,102,189,[50,50,0,0]);c.fill();c.fillStyle='#e9d7b4';c.beginPath();c.roundRect(636,807,102,189,[50,50,0,0]);c.fill();c.fillStyle='#446266';c.beginPath();c.roundRect(657,835,58,160,[29,29,0,0]);c.fill();
    for(let i=0;i<5;i++)line([[665,866+i*22],[704,866+i*22]],'#bdac7d',1);ellipse(686,918,18,29,null,'#d0ba85');
    deck(568,1032,54,24,'#f3e6c7');
    const era=this.exhibitState.history;if(era===1){c.fillStyle='#6c705c';c.fillRect(542,950,8,67);c.fillRect(591,950,8,67);c.fillRect(542,950,57,8);c.fillRect(554,977,33,8);line([[571,954],[571,988]],'#c0a174',5);path([[541,1000],[586,1000],[601,1009],[556,1009]],'#ece3c8');}else if(era===2&&this.images.ship){c.drawImage(this.images.ship,534,942,73,73);}else{ellipse(569,968,14,21,'#d2aa70');line([[554,943],[584,943],[554,995],[584,995]],'#6a7970',3);}
    text('T H E   T I M E   G A L L E R Y',577,1154,15,'#817451');text('02  /  LOOK BACK',577,1176,9,'#948a6b');
    // Weather works: a transparent climate engine over a pool.
    deck(2100,1080,284,131,'#e0e7d8');ellipse(2080,1060,208,88,'#83b0b0');ellipse(2080,1060,187,74,'#9ac3bd');
    for(let i=0;i<5;i++)ellipse(2080,1060,80+i*20,27+i*9,null,'#cee0cb');
    c.fillStyle='#c2d9c955';c.beginPath();c.roundRect(1928,796,304,256,[125,125,15,15]);c.fill();c.strokeStyle='#aec6b4';c.lineWidth=4;c.stroke();
    line([[1931,1033],[1931,846]],'#f1f1de',5);line([[2227,1033],[2227,846]],'#f1f1de',5);
    ellipse(2080,1009,151,53,null,'#dce7cc');
    const wet=this.exhibitState.weather;const cloudColor=wet===3?'#b6cad0':'#f8f5e8';
    ellipse(2080,816,117,36,'#718e8133');ellipse(2060,780,88,35,cloudColor);ellipse(2109,762,51,49,cloudColor);ellipse(2019,754,48,43,cloudColor);ellipse(2070,733,51,50,cloudColor);
    ellipse(2244,913,54,22,'#b9c7ac');line([[2244,908],[2244,685]],'#b4bd9c',7);ellipse(2244,686,15,15,'#b6c5a8');
    for(let i=0;i<3;i++){const a=i*Math.PI*2/3;path([[2244,686],[2244+Math.cos(a)*80,686+Math.sin(a)*80],[2244+Math.cos(a+.3)*30,686+Math.sin(a+.3)*30]],'#f1eed7');}
    if(wet===1){for(let i=0;i<7;i++)line([[2000+i*24,992],[1995+i*24,965],[2003+i*24,939]],'#eaf0d0',3);}if(wet===2){ellipse(2070,777,140,42,'#e8eee3');ellipse(2070,735,67,55,'#f8f5e8');}
    text('T H E   W E A T H E R   W O R K S',2100,1200,15,'#607e71');text('03  /  LOOK AROUND',2100,1222,9,'#829987');
    // A living gallery that spills out into the garden.
    deck(1394,1494,300,121,'#e1e7c9');ellipse(1394,1470,237,93,'#b1c2a0');ellipse(1415,1437,135,58,'#8da988');
    c.fillStyle='#dce9d044';c.beginPath();c.ellipse(1400,1409,150,193,0,Math.PI,0);c.lineTo(1550,1450);c.ellipse(1400,1450,150,54,0,0,Math.PI);c.closePath();c.fill();c.strokeStyle='#e8edd6';c.lineWidth=4;c.stroke();
    line([[1400,1443],[1400,1255]],'#6e8c5d',7);const leaf=(x,y,dir,size,color)=>{c.save();c.translate(x,y);c.rotate(dir);c.fillStyle=color;c.beginPath();c.ellipse(size*.5,0,size*.6,size*.22,0,0,Math.PI*2);c.fill();line([[0,0],[size,0]],'#7d985f',1);c.restore();};
    leaf(1400,1305,-.7,106,'#94ae69');leaf(1400,1353,-2.7,104,'#719361');leaf(1400,1378,-.5,123,'#a5bd78');leaf(1400,1420,-2.7,97,'#83a365');leaf(1400,1280,-1.8,69,'#9bbf79');
    tree(1254,1467,1.1,'#839e73');tree(1563,1500,.8,'#b5c486');
    ellipse(1244,1424,47,15,'#81976e');line([[1244,1420],[1244,1372]],'#e9ddbb',14);c.fillStyle='#c68e6b';c.beginPath();c.ellipse(1244,1378,40,32,0,Math.PI,0);c.fill();ellipse(1230,1361,5,3,'#f6dfb2');ellipse(1258,1370,7,4,'#f6dfb2');
    if(this.exhibitState.life===7){path([[1590,1195],[1370,1280],[1510,1440]],'#f2d58e50');ellipse(1590,1195,33,33,'#e9c56a');}
    text('T H E   L I V I N G   R O O M',1400,1602,16,'#71835b');text('04  /  LOOK CLOSER',1400,1624,9,'#8b9b6b');
    // Concourse furniture and the central wayfinding sculpture.
    deck(1310,1069,72,31,'#ddd3b4');line([[1310,1061],[1310,944]],'#647d6e',6);ellipse(1310,938,36,36,null,'#bc995b');ellipse(1310,938,12,36,null,'#bc995b');line([[1274,938],[1346,938]],'#bc995b',2);ellipse(1310,938,8,8,'#f0c775');
    text('A L M A N A C',1310,1150,17,'#89907a');text('A MUSEUM OF EVERYTHING',1310,1172,8,'#969d86');
    for(const [x,y]of [[850,921],[883,1222],[1727,994],[1720,1280],[1087,1482],[740,1390]])planter(x,y);
    for(const [x,y,s]of [[719,775,.9],[845,793,.65],[1811,823,1],[2378,1167,1],[2257,1323,.7],[991,1375,.8],[995,1192,.5],[1703,1519,.7],[468,1260,.9],[620,1310,.7],[1875,1400,.8]])tree(x,y,s);
    for(const [x,y]of [[1096,1160],[1506,1200],[770,1050],[1850,1130],[1190,1480]])bench(x,y);
    // Three museum visitors make scale legible without crowding the world.
    this.visitor(c,845,1059);this.visitor(c,1815,1064);this.visitor(c,1154,1451);
    for(const [x,y]of [[905,1128],[1760,1108],[1250,1270]]){ellipse(x,y,8,3,'#adbba3');line([[x,y],[x,y-34]],'#a2b198',3);ellipse(x,y-36,7,5,'#f3ddb2');}
  }
}
