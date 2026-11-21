import {grid,west,east,south,clamp,distance,turn} from './config.js';
import {solid} from './city.js';
import {vehicle,drive} from './vehicles.js';
import {hurt} from './player.js';

export function makeDispatch() {
  return {heat:0,stars:0,seen:0,spawn:0,arrest:0};
}

export function clearDispatch(sim) {
  sim.cars=sim.cars.filter(c=>c.kind!=='cop');
  Object.assign(sim.dispatch,makeDispatch());
}

export function visibleFrom(city,a,b) {
  const steps=Math.ceil(distance(a,b)/18);
  for(let i=1;i<steps;i++) {
    const t=i/steps;
    if(solid(city,a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t)) return false;
  }
  return true;
}

function spawnUnit(sim) {
  const p=sim.player;
  const options=[];
  const baseCol=Math.round((p.x-west)/grid);
  const baseRow=Math.round(p.y/grid);
  for(let i=-2;i<=2;i++) {
    for(let j=-2;j<=2;j++) {
      const x=clamp(west+(baseCol+i)*grid,west,east);
      const y=clamp((baseRow+j)*grid,0,south);
      const d=distance(p,{x,y});
      if(d>280&&d<660&&!sim.cars.some(c=>distance(c,{x,y})<40)) options.push({x,y,d});
    }
  }
  options.sort((a,b)=>a.d-b.d);
  if(!options.length) return;
  const site=options[Math.min(options.length-1,Math.floor(Math.random()*4))];
  const unit=vehicle(site.x,site.y,Math.atan2(p.y-site.y,p.x-site.x),5,'cop');
  unit.shot=1;
  sim.cars.push(unit);
}

function pursuitTarget(unit,p,city,box) {
  const lead=box&&p.car? .45 : .18;
  const predicted={x:p.x+(p.car?.vx??0)*lead,y:p.y+(p.car?.vy??0)*lead};
  if(visibleFrom(city,unit,predicted)) return predicted;
  const col=Math.round((unit.x-west)/grid);
  const row=Math.round(unit.y/grid);
  const x=west+col*grid;
  const y=row*grid;
  if(Math.hypot(x-unit.x,y-unit.y)>52) return {x,y};
  const targetCol=Math.round((p.x-west)/grid);
  const targetRow=Math.round(p.y/grid);
  if(Math.abs(targetCol-col)>=Math.abs(targetRow-row)&&targetCol!==col) return {x:x+Math.sign(targetCol-col)*grid,y};
  if(targetRow!==row) return {x,y:y+Math.sign(targetRow-row)*grid};
  return p;
}

export function updatePolice(sim,dt) {
  const d=sim.dispatch;
  const p=sim.player;
  d.stars=Math.ceil(d.heat/38);
  let close=false;
  let spotted=false;
  let active=0;
  for(const unit of sim.cars) {
    if(unit.kind!=='cop'||unit.dead) continue;
    active++;
    const range=distance(unit,p);
    const sight=range<265&&visibleFrom(sim.city,unit,p);
    if(sight) spotted=true;
    if(range<42&&sight) close=true;
    const target=pursuitTarget(unit,p,sim.city,d.stars>=3&&active%2===0);
    const angle=Math.atan2(target.y-unit.y,target.x-unit.x);
    const delta=turn(unit.a,angle);
    const steer=clamp(delta*2.4,-1,1);
    const gas=p.car?Math.abs(delta)>1.4?.19:1:range<37?-.2:.65;
    drive(unit,gas,steer,Math.abs(delta)>1.25,dt,sim.city,sim.effects);
    unit.shot=(unit.shot??1)-dt;
    if(d.stars>=3&&sight&&range<142&&unit.shot<0) {
      unit.shot=1.7-active*.08;
      sim.fire(unit,Math.atan2(p.y-unit.y,p.x-unit.x)+Math.sin(sim.time*8)*.033,false,1);
    }
  }
  d.seen=spotted?0:d.seen+dt;
  if(d.seen>5) d.heat=Math.max(0,d.heat-dt*(d.seen>16?15:8));
  d.spawn-=dt;
  if(d.stars&&active<d.stars+1&&d.spawn<=0) {
    spawnUnit(sim);
    d.spawn=4;
  }
  if(!d.stars&&active) clearDispatch(sim);
  d.arrest=clamp(d.arrest+(close&&(!p.car||Math.abs(p.car.speed)<17)?dt:-2*dt),0,2.6);
  if(d.arrest>=2.6) sim.finish('busted');
}
