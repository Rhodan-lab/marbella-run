import {distance} from './config.js';
import {solid} from './city.js';
import {drive} from './vehicles.js';

export function makePlayer(saved) {
  return {x:300,y:539,a:0,phase:0,id:1,shirt:'#ffd784',hp:100,armor:saved.armor,money:saved.money,
    car:null,cooldown:0,damageFlash:0,weapon:0,unlock:saved.unlock,enterLock:0};
}

export function hurt(player,amount) {
  const shield=Math.min(player.armor,amount*.7);
  player.armor-=shield;
  player.hp=Math.max(0,player.hp-amount+shield);
  player.damageFlash=.65;
}

export function updatePlayer(sim,dt) {
  const p=sim.player;
  const input=sim.input;
  p.enterLock=Math.max(0,p.enterLock-dt);
  p.damageFlash=Math.max(0,p.damageFlash-dt);
  const x=Number(input.has('KeyD','ArrowRight'))-Number(input.has('KeyA','ArrowLeft'));
  const y=Number(input.has('KeyS','ArrowDown'))-Number(input.has('KeyW','ArrowUp'));
  if(input.tap('KeyE')&&p.enterLock===0) {
    if(p.car) {
      const c=p.car;
      for(const side of [1,-1]) {
        const bx=c.x-Math.sin(c.a)*side*22;
        const by=c.y+Math.cos(c.a)*side*22;
        if(!solid(sim.city,bx,by,7)) {
          p.x=bx;
          p.y=by;
          p.car=null;
          break;
        }
      }
    } else {
      const c=sim.cars.filter(c=>!c.dead&&distance(c,p)<43).sort((a,b)=>distance(a,p)-distance(b,p))[0];
      if(c) {
        if(!c.claimed) sim.raise(c.kind==='cop'?64:25);
        c.claimed=true;
        c.kind='player';
        p.car=c;
      }
    }
    p.enterLock=.35;
  }
  if(p.car) {
    drive(p.car,-y,x,input.has('Space'),dt,sim.city,sim.effects);
    p.x=p.car.x;
    p.y=p.car.y;
    p.a=p.car.a;
    if(p.car.dead) hurt(p,100);
    return;
  }
  const speed=input.has('ShiftLeft','ShiftRight')?143:98;
  const divisor=Math.hypot(x,y)||1;
  const dx=x*speed*dt/divisor;
  const dy=y*speed*dt/divisor;
  if(!solid(sim.city,p.x+dx,p.y,6)) p.x+=dx;
  if(!solid(sim.city,p.x,p.y+dy,6)) p.y+=dy;
  if(dx||dy) p.phase+=dt*speed*.16;
  const pointer=input.scaledMouse??input.mouse;
  const aim=sim.camera.world(pointer.x,pointer.y);
  p.a=Math.atan2(aim.y-p.y,aim.x-p.x);
}
