import {west,east,south,rect,disk,polygon,districtAt,mix} from './config.js';
import {objective,cast,drawPortrait} from './missions.js';
import {weapons} from './combat.js';

export function text(c,value,x,y,size=13,color='#fff0ce',weight=700) {
  c.font=weight+' '+size+'px system-ui,sans-serif';
  c.fillStyle=color;
  c.fillText(value,x,y);
}

export function panel(c,x,y,w,h) {
  rect(c,'#12192be8',x,y,w,h);
  c.strokeStyle='#f2c7a34c';
  c.lineWidth=1;
  c.strokeRect(x+.5,y+.5,w-1,h-1);
  rect(c,'#ffab8a',x,y,22,2);
}

function star(c,x,y,r,color) {
  polygon(c,color,Array.from({length:10},(_,i)=>{
    const a=i*Math.PI/5-Math.PI/2;
    const d=i%2?r*.45:r;
    return [x+Math.cos(a)*d,y+Math.sin(a)*d];
  }));
}

export function makeMap(city) {
  const canvas=document.createElement('canvas');
  canvas.width=348;
  canvas.height=390;
  const c=canvas.getContext('2d');
  rect(c,'#243248',0,0,348,390);
  rect(c,'#287985',0,0,36,390);
  for(const lot of city.lots) rect(c,lot.park?'#456e68':lot.dock?'#746277':'#46536a',lot.x/8+5,lot.y/8+5,22,22);
  for(const b of city.buildings) rect(c,'#8b8191',b.x/8,b.y/8,b.w/8,b.h/8);
  return canvas;
}

function minimap(c,sim,map,x,y) {
  const w=182;
  const h=144;
  panel(c,x,y,w,h+30);
  c.save();
  c.beginPath();
  c.rect(x+5,y+5,w-10,h-5);
  c.clip();
  const p=sim.player;
  const px=x+w/2;
  const py=y+h/2;
  const scale=.25;
  const ox=px-p.x*scale;
  const oy=py-p.y*scale;
  rect(c,'#274655',x,y,w,h);
  c.drawImage(map,ox,oy,map.width*2,map.height*2);
  for(const unit of sim.cars) {
    if(unit.kind==='cop'&&!unit.dead) disk(c,Math.floor(sim.time*5)%2?'#ff6984':'#68d7ff',ox+unit.x*scale,oy+unit.y*scale,3);
  }
  const target=objective(sim);
  if(target) {
    const tx=Math.min(x+w-12,Math.max(x+12,ox+target.x*scale));
    const ty=Math.min(y+h-8,Math.max(y+12,oy+target.y*scale));
    polygon(c,'#ffe39b',[[tx,ty-6],[tx+6,ty],[tx,ty+6],[tx-6,ty]]);
  }
  c.translate(px,py);
  c.rotate(p.a);
  polygon(c,'#fef1d4',[[10,0],[-6,-5],[-3,0],[-6,5]]);
  c.restore();
  text(c,districtAt(p.x,p.y).toUpperCase(),x+11,y+h+19,11,'#ffcfab',800);
  text(c,'N',x+w-21,y+20,11,'#e7ddd1');
}

function meter(c,x,y,w,ratio,color) {
  rect(c,'#ffffff20',x,y,w,5);
  rect(c,color,x,y,w*Math.max(0,Math.min(1,ratio)),5);
}

function speedometer(c,car,w,h) {
  const x=w-203;
  const y=h-113;
  panel(c,x,y,177,87);
  const speed=Math.round(Math.abs(car.speed)*.82);
  text(c,String(speed).padStart(3,'0'),x+12,y+47,35,'#fff2d3',850);
  text(c,'KM/H',x+85,y+45,11,'#b5cbd1');
  text(c,car.name.toUpperCase(),x+12,y+68,11,'#ffad97');
  meter(c,x+101,y+63,64,car.hp/100,'#7ddec9');
}

export function drawHud(c,sim,map,w,h) {
  const p=sim.player;
  const m=sim.missions;
  panel(c,25,23,191,58);
  text(c,'M A R B E L L A',37,45,14,'#fff0cd',900);
  text(c,'R U N   /   C O A S T A L   ' ,38,65,9,'#ffae93',800);
  panel(c,w-217,23,192,96);
  const flash=sim.dispatch.seen>5&&Math.floor(sim.time*4)%2===0;
  for(let i=0;i<5;i++) star(c,w-193+i*34,45,11,i<sim.dispatch.stars?(flash?'#ffe1b88c':'#ffbd74'):'#586071');
  p.shownMoney=mix(p.shownMoney??p.money,p.money,.11);
  text(c,'$'+Math.round(p.shownMoney).toLocaleString('en-US'),w-201,79,19,'#b8f0c8',850);
  text(c,weapons[p.weapon].name.toUpperCase(),w-118,78,11,'#d4dfdc');
  meter(c,w-201,95,157,p.hp/100,'#fa8b89');
  meter(c,w-201,104,157,p.armor/100,'#83d6ef');
  minimap(c,sim,map,25,h-199);
  if(p.car) speedometer(c,p.car,w,h);
  const target=objective(sim);
  if(m.active&&target) {
    const x=w/2-178;
    panel(c,x,23,356,61);
    text(c,m.active.name.toUpperCase(),x+13,45,12,'#ffad91',850);
    text(c,target.label,x+13,67,15);
    const left=Math.max(0,Math.ceil(m.left));
    const stamp=Math.floor(left/60)+':'+String(left%60).padStart(2,'0');
    text(c,stamp,x+296,61,22,left<15?'#ff8a87':'#ffe0a4',850);
    meter(c,x+13,78,327,m.left/m.active.time,'#ffbd81');
  }
  if(m.dialog) {
    const x=w/2-222;
    const y=h-108;
    const person=cast[m.dialog.who];
    panel(c,x,y,444,69);
    c.save();
    c.beginPath();
    c.rect(x+8,y+7,52,55);
    c.clip();
    drawPortrait(c,person,x+8,y+7);
    c.restore();
    text(c,person.name+'   /   '+person.role,x+71,y+24,11,'#ffb193',850);
    c.font='600 12px system-ui';
    c.fillStyle='#fff0ce';
    c.fillText(m.dialog.line,x+71,y+47,356);
  } else if(m.banner) {
    const x=w/2-130;
    panel(c,x,h-96,260,61);
    text(c,m.banner.title,x+14,h-71,16,m.banner.failed?'#ff8780':'#b1e8bf',900);
    text(c,m.banner.failed?'F  /  Retry job':m.banner.detail,x+14,h-51,12);
  } else if(!sim.shot) {
    const nearby=sim.cars.some(v=>!v.dead&&Math.hypot(v.x-p.x,v.y-p.y)<43);
    const prompt=p.car?'E  EXIT   /   SPACE  DRIFT':nearby?'E  TAKE VEHICLE   /   SHIFT  RUN':'F  JOBS   /   SHIFT  RUN   /   ESC  PAUSE';
    text(c,prompt,w/2-122,h-33,11,'#f4e9d2',800);
  }
  if(p.damageFlash) {
    const vignette=c.createRadialGradient(w/2,h/2,h*.18,w/2,h/2,w*.53);
    vignette.addColorStop(0,'#99243100');
    vignette.addColorStop(1,'rgba(188,28,56,'+p.damageFlash*.58+')');
    rect(c,vignette,0,0,w,h);
  }
}
