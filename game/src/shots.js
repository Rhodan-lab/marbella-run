import {vehicle} from './vehicles.js';
import {pedestrian} from './peds.js';
import {story,beginMission} from './missions.js';

const scenes={
  chase:{x:309,y:730,zoom:1.55,hour:17.8,frameX:251,frameY:679},
  street:{x:411,y:574,zoom:2.08,hour:15.3,frameX:423,frameY:557},
  night:{x:510,y:1052,zoom:1.85,hour:23.2,frameX:557,frameY:1050},
  mission:{x:300,y:2190,zoom:1.58,hour:17,frameX:290,frameY:2211}
};

function add(sim,x,y,a,type,kind='parked') {
  const car=vehicle(x,y,a,type,kind);
  car.stunt=true;
  sim.cars.push(car);
  return car;
}

export function stage(sim,name) {
  const shot=scenes[name];
  if(!shot) return false;
  sim.shot=shot;
  sim.mode='playing';
  sim.time=name==='chase'?17.4:28.6;
  sim.cars=sim.cars.filter(c=>Math.hypot(c.x-shot.x,c.y-shot.y)>165);
  const p=sim.player;
  p.x=shot.x;
  p.y=shot.y;
  p.a=-Math.PI/2;
  p.phase=1.3;
  p.unlock=2;
  p.weapon=1;
  p.money=2480;
  p.armor=38;
  if(name==='chase') {
    p.car=add(sim,p.x,p.y,-1.45,0,'player');
    p.car.speed=173;
    add(sim,318,759,-1.88,5,'cop');
    add(sim,280,828,-1.49,5,'cop');
    add(sim,364,771,2.86,5,'cop');
    add(sim,286,652,1.57,1);
    add(sim,405,793,.05,3);
    add(sim,451,767,3.14,2);
    for(let i=0;i<13;i++) {
      sim.effects.mark(316+i*.6,741+i*3,-1.47);
      sim.effects.mark(325+i*.6,741+i*3,-1.47);
    }
    sim.effects.burst(320,746,'#ffe098',34,.63);
    sim.effects.burst(309,756,'#d4d8d5',14,.72);
    sim.effects.update(.12);
    sim.dispatch.heat=111;
    sim.dispatch.stars=3;
    p.hp=78;
    beginMission(sim,story[3]);
    sim.missions.left=49;
    sim.missions.dialog=null;
  } else if(name==='street') {
    p.a=.22;
    add(sim,371,531,0,1);
    add(sim,454,507,Math.PI,3);
    add(sim,519,551,Math.PI,6);
    add(sim,313,634,1.57,2);
    add(sim,568,649,1.57,4);
    for(let i=0;i<19;i++) {
      sim.people.push(pedestrian(344+i*10,568+Math.sin(i*1.7)*8,i%3?0:Math.PI,300+i));
    }
    for(let i=0;i<8;i++) sim.people.push(pedestrian(350+i*20,727+Math.sin(i)*5,Math.PI,360+i));
  } else if(name==='night') {
    p.a=0;
    p.car=add(sim,p.x,p.y,0,3,'player');
    p.car.speed=112;
    add(sim,601,1023,Math.PI,1);
    add(sim,572,1110,Math.PI/2,5,'cop');
    add(sim,684,1053,0,6);
    add(sim,558,950,Math.PI/2,0);
    sim.dispatch.stars=1;
  } else {
    p.a=Math.PI/2;
    beginMission(sim,story[1]);
    sim.missions.left=72;
    add(sim,316,2162,1.57,2);
    add(sim,366,2086,0,4);
    add(sim,530,2070,Math.PI,1);
  }
  Object.assign(sim.camera,{x:shot.frameX,y:shot.frameY,zoom:shot.zoom});
  return true;
}
