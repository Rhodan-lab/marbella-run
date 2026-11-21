import {clamp,distance,rect,polygon} from './config.js';
import {solid} from './city.js';

export const models=[
  ['Cabrio','#ff526d',225,175,2.9,1,39,19],
  ['Taxi','#ffcb57',173,125,2.4,1.2,39,20],
  ['Scout','#78b998',162,105,2.1,1.5,43,22],
  ['Comet','#4ddbd5',259,184,2.6,.9,40,19],
  ['Courier','#dbc9ad',145,91,1.9,1.9,48,22],
  ['Metro','#dedfe5',222,145,2.5,1.5,43,20],
  ['Classic','#b690d5',190,112,2.7,1.3,42,20]
];

export function vehicle(x,y,a,type=0,kind='parked') {
  const [name,color,top,power,steer,mass,length,width]=models[type];
  return {x,y,a,type,kind,name,color,top,power,steer,mass,length,width,
    vx:0,vy:0,speed:0,hp:100,fire:0,dead:false,lights:true};
}

export function drive(car,gas,steering,brake,dt,city,effects) {
  if(car.dead) return;
  const cx=Math.cos(car.a);
  const cy=Math.sin(car.a);
  const forward=car.vx*cx+car.vy*cy;
  car.a+=steering*car.steer*clamp(forward/90,-.8,1.2)*(brake?1.4:1)*dt;
  const speed=clamp((forward+gas*car.power*dt)*Math.exp(-(gas?.48:1.12)*dt),-car.top*.34,car.top);
  const drift=(car.vy*cx-car.vx*cy)*Math.exp(-(brake?1.5:9)*dt);
  const nx=Math.cos(car.a);
  const ny=Math.sin(car.a);
  car.vx=nx*speed-ny*drift;
  car.vy=ny*speed+nx*drift;
  car.speed=speed;
  if(!Number.isFinite(car.vx+car.vy+car.a)) {
    car.vx=car.vy=car.a=car.speed=0;
    return;
  }
  if(brake&&Math.abs(speed)>48) {
    for(const side of [-1,1]) {
      effects.mark(car.x-nx*13-ny*side*7,car.y-ny*13+nx*side*7,car.a);
    }
  }
  const x=car.x+car.vx*dt;
  const y=car.y+car.vy*dt;
  if(solid(city,x,y,11)||solid(city,x+nx*13,y+ny*13,7)||solid(city,x-nx*13,y-ny*13,7)) {
    if(!car.stunt) car.hp-=Math.abs(speed)*.095;
    car.vx*=-.3;
    car.vy*=-.3;
    if(Math.abs(speed)>38) effects.burst(x,y,'#ffd08d',8);
  } else {
    car.x=x;
    car.y=y;
  }
}

export function collideCars(cars,effects,player) {
  let playerCollision=false;
  for(let i=0;i<cars.length;i++) {
    const a=cars[i];
    if(a.dead) continue;
    for(let j=i+1;j<cars.length;j++) {
      const b=cars[j];
      if(b.dead) continue;
      const dx=b.x-a.x;
      const dy=b.y-a.y;
      if(Math.abs(dx)>26||Math.abs(dy)>26) continue;
      const d=Math.hypot(dx,dy)||.01;
      if(d>=25) continue;
      const nx=dx/d;
      const ny=dy/d;
      const depth=(25-d)*.46;
      a.x-=nx*depth;
      a.y-=ny*depth;
      b.x+=nx*depth;
      b.y+=ny*depth;
      const push=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;
      if(push<7) continue;
      a.vx-=nx*push/a.mass*.65;
      a.vy-=ny*push/a.mass*.65;
      b.vx+=nx*push/b.mass*.65;
      b.vy+=ny*push/b.mass*.65;
      if(push>35) {
        if(!a.stunt) a.hp-=push*.085;
        if(!b.stunt) b.hp-=push*.085;
        effects.burst((a.x+b.x)/2,(a.y+b.y)/2,'#ffbb74',7);
        if(player.car===a||player.car===b) playerCollision=true;
      }
    }
  }
  return playerCollision;
}

export function updateDamage(car,dt,effects,audio) {
  if(car.dead||car.stunt||car.hp>45) return;
  if(Math.random()<dt*19) effects.burst(car.x,car.y,'#51505c',2,1.4);
  if(car.hp<=14) {
    car.fire+=dt;
    if(Math.random()<dt*24) effects.burst(car.x+6,car.y,'#ff8551',3);
    if(car.fire>3.8) {
      car.dead=true;
      car.speed=car.vx=car.vy=0;
      effects.burst(car.x,car.y,'#ff935b',58,1.8);
      audio.hit('boom');
    }
  }
}

export function drawCar(c,car,time) {
  c.save();
  c.translate(car.x,car.y);
  c.rotate(car.a);
  const l=car.length;
  const w=car.width;
  rect(c,'#1b253880',-l/2+3,-w/2+4,l+4,w+4);
  for(const x of [-l*.31,l*.25]) {
    for(const y of [-w*.54,w*.34]) rect(c,'#202432',x,y,8,4);
  }
  polygon(c,car.dead?'#393240':car.color,[[-l/2,-w*.38],[-l*.4,-w/2],[l*.38,-w/2],[l/2,-w*.3],[l/2,w*.3],[l*.38,w/2],[-l*.4,w/2],[-l/2,w*.38]]);
  polygon(c,'#263949',[[-11,-w*.34],[8,-w*.35],[14,0],[8,w*.35],[-11,w*.34],[-15,0]]);
  rect(c,car.dead?'#3b3741':car.kind==='cop'?'#48536a':car.color,-7,-w*.31,13,w*.62);
  rect(c,'#e9fff28d',-l*.39,-w*.41,l*.75,1.3);
  for(const y of [-w*.39,w*.22]) {
    rect(c,'#ff526e',-l/2,y,2.5,3.8);
    rect(c,'#fff2c6',l/2-2,y,2.5,3.8);
  }
  if(car.kind==='cop') {
    rect(c,'#263047',-4,-8,5,16);
    const flash=Math.floor(time*9)%2===0;
    rect(c,flash?'#ff476f':'#791f59',-3,-7,3,6);
    rect(c,flash?'#285ca2':'#76dfff',-3,1,3,6);
  }
  if(car.type===1) rect(c,'#fff2b2',-3,-4,5,8);
  c.restore();
}
