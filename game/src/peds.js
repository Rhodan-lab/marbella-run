import {grid,west,random,clamp,distance,disk,rect} from './config.js';
import {solid} from './city.js';

export function pedestrian(x,y,a,id) {
  return {x,y,a,id,panic:0,hp:100,pace:21+id%15,phase:id*.8,shirt:['#ef8b80','#f3ca7c','#69d1ba','#a898d7','#e5dada','#6599bd'][id%6]};
}

export function seedPeds() {
  const rng=random(195);
  const people=[];
  for(let i=0;i<240;i++) {
    const col=Math.floor(rng()*10);
    const row=Math.floor(rng()*12);
    const x=west+col*grid+52+rng()*145;
    const y=row*grid+(i%2?52:207);
    people.push(pedestrian(x,y,i%4<2?0:Math.PI,i));
  }
  return people;
}

export function updatePeds(sim,dt) {
  for(const p of sim.people) {
    if(p.hp<=0) continue;
    p.panic=Math.max(0,p.panic-dt);
    let angle=p.a;
    let speed=p.pace;
    if(p.panic) {
      angle=Math.atan2(p.y-sim.player.y,p.x-sim.player.x);
      speed=69;
    }
    const next={x:p.x+Math.cos(angle)*speed*dt,y:p.y+Math.sin(angle)*speed*dt};
    if(solid(sim.city,next.x,next.y,5)) p.a+=Math.PI;
    else {
      p.x=next.x;
      p.y=next.y;
      p.a=angle;
      p.phase+=dt*(p.panic?15:9);
    }
    for(const car of sim.cars) {
      if(Math.abs(car.speed)<51||Math.abs(car.x-p.x)>18||Math.abs(car.y-p.y)>18) continue;
      if(distance(car,p)<16) {
        p.panic=3;
        p.hp-=clamp(Math.abs(car.speed)*.68,0,100);
        p.x+=Math.cos(car.a)*14;
        p.y+=Math.sin(car.a)*14;
        if(sim.player.car===car) sim.raise(29);
      }
    }
  }
}

export function drawPerson(c,p,controlled=false) {
  c.save();
  c.translate(p.x,p.y);
  c.rotate(p.a);
  if(p.hp<=0) {
    rect(c,'#29253995',-7,-4,17,9);
    rect(c,p.shirt??'#f2cc87',-5,-3,9,6);
    disk(c,'#c69277',6,0,3);
    c.restore();
    return;
  }
  disk(c,'#24294070',2,3,7);
  const stride=Math.sin(p.phase)*3;
  rect(c,'#272c3b',-5+stride,-4,5,2.8);
  rect(c,'#272c3b',-5-stride,1,5,2.8);
  rect(c,p.shirt??'#f3cd85',-4,-5,7,10);
  disk(c,p.id%3===0?'#92634f':'#e8b28e',2,0,3.4);
  if(controlled) rect(c,'#232d40',4,-1,8,2);
  c.restore();
}
