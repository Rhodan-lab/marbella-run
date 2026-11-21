import {distance,rect,disk} from './config.js';
import {solid} from './city.js';
import {hurt} from './player.js';

export const weapons=[
  {name:'Fists',damage:34,delay:.42,speed:0},
  {name:'Pistol',damage:36,delay:.31,speed:610},
  {name:'SMG',damage:22,delay:.11,speed:660},
  {name:'Rifle',damage:51,delay:.2,speed:800}
];

function hitTarget(sim,target,weapon) {
  target.hp-=weapon.damage;
  if('panic' in target) target.panic=4;
  sim.effects.burst(target.x,target.y,'#f9b582',6);
  sim.raise(target.kind==='cop'?21:11);
}

export function fire(sim,from,a,friendly,index) {
  const w=weapons[index];
  if(!index) {
    const target=sim.people.find(p=>p.hp>0&&distance(from,p)<24&&Math.cos(Math.atan2(p.y-from.y,p.x-from.x)-a)>.1);
    if(target) hitTarget(sim,target,w);
    sim.audio.hit('tap');
    return;
  }
  const x=from.x+Math.cos(a)*(friendly?10:22);
  const y=from.y+Math.sin(a)*(friendly?10:22);
  sim.bullets.push({x,y,vx:Math.cos(a)*w.speed,vy:Math.sin(a)*w.speed,life:.51,friendly,weapon:w,from});
  sim.effects.burst(x,y,'#ffdb84',4,.17);
  if(friendly||distance(sim.player,from)<170) sim.audio.hit('shot');
  if(friendly) {
    sim.raise(2.4);
    for(const p of sim.people) if(distance(p,from)<140) p.panic=4;
  }
}

export function updateCombat(sim,dt) {
  const p=sim.player;
  for(let i=0;i<4;i++) if(sim.input.tap('Digit'+(i+1))&&i<=p.unlock) p.weapon=i;
  p.cooldown-=dt;
  if(!p.car&&sim.input.mouse.down&&p.cooldown<=0) {
    fire(sim,p,p.a,true,p.weapon);
    p.cooldown=weapons[p.weapon].delay;
  }
  for(const bullet of sim.bullets) {
    bullet.life-=dt;
    for(let step=0;step<4&&bullet.life>0;step++) {
      bullet.x+=bullet.vx*dt/4;
      bullet.y+=bullet.vy*dt/4;
      if(solid(sim.city,bullet.x,bullet.y)) {
        bullet.life=0;
        sim.effects.burst(bullet.x,bullet.y,'#fee2ae',4);
        break;
      }
      if(bullet.friendly) {
        const target=sim.people.find(t=>t.hp>0&&distance(t,bullet)<8)
          ??sim.cars.find(t=>t!==bullet.from&&!t.dead&&!t.stunt&&distance(t,bullet)<13);
        if(target) {
          hitTarget(sim,target,bullet.weapon);
          bullet.life=0;
        }
      } else if(distance(p,bullet)<(p.car?15:9)) {
        if(!p.car) hurt(p,11);
        else if(!p.car.stunt) p.car.hp-=4;
        bullet.life=0;
      }
    }
  }
  sim.bullets=sim.bullets.filter(b=>b.life>0);
  for(const item of sim.pickups) {
    if(item.next>sim.time||distance(item,p)>24) continue;
    if(item.kind==='armor') p.armor=Math.min(100,p.armor+45);
    if(item.kind==='health') p.hp=Math.min(100,p.hp+50);
    item.next=sim.time+45;
    sim.audio.hit('tap');
  }
}

export function drawCombat(c,sim) {
  for(const b of sim.bullets) {
    c.strokeStyle=b.friendly?'#ffe6a3':'#ff9985';
    c.lineWidth=1.5;
    c.beginPath();
    c.moveTo(b.x,b.y);
    c.lineTo(b.x-b.vx*.021,b.y-b.vy*.021);
    c.stroke();
  }
  for(const item of sim.pickups) {
    if(item.next>sim.time) continue;
    const y=item.y+Math.sin(sim.time*4)*3;
    disk(c,'#172a3f80',item.x,item.y+4,9);
    rect(c,item.kind==='armor'?'#69c7e2':'#6ad9a8',item.x-6,y-6,12,12);
    rect(c,'#ecffeb',item.x-4,y-1,8,2);
    rect(c,'#ecffeb',item.x-1,y-4,2,8);
  }
}
