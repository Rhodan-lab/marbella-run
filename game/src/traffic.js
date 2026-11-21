import {grid,west,random,turn,clamp,distance} from './config.js';
import {green} from './city.js';
import {vehicle,drive} from './vehicles.js';

const directions=[[1,0],[0,1],[-1,0],[0,-1]];

function laneTarget(route) {
  const [dx,dy]=directions[route.dir];
  return {x:west+route.col*grid-dy*13,y:route.row*grid+dx*13};
}

export function seedTraffic() {
  const rng=random(481);
  const cars=[];
  for(let i=0;i<90;i++) {
    const dir=i%4;
    const [dx,dy]=directions[dir];
    const col=clamp(Math.floor(rng()*10)+1,dx===1?1:0,dx===-1?9:10);
    const row=clamp(Math.floor(rng()*12)+1,dy===1?1:0,dy===-1?11:12);
    const route={col,row,dir,legs:i};
    const target=laneTarget(route);
    const back=45+rng()*175;
    const car=vehicle(target.x-dx*back,target.y-dy*back,dir*Math.PI/2,[0,1,2,3,4,6][i%6],'traffic');
    car.route=route;
    car.cruise=57+rng()*42;
    cars.push(car);
  }
  for(let i=0;i<36;i++) {
    const col=i*7%10;
    const row=i*5%12;
    cars.push(vehicle(west+col*grid+87+(i%3)*50,row*grid+32,i%2*Math.PI,[0,1,2,3,4,6][i%6]));
  }
  return cars;
}

function nextTurn(route) {
  const opts=route.legs++%5===0?[1,0,-1,2]:route.legs%7===0?[-1,0,1,2]:[0,1,-1,2];
  for(const offset of opts) {
    const dir=(route.dir+offset+4)%4;
    const [dx,dy]=directions[dir];
    const col=route.col+dx;
    const row=route.row+dy;
    if(col<0||col>10||row<0||row>12) continue;
    Object.assign(route,{col,row,dir});
    return;
  }
}

export function updateTraffic(car,sim,dt) {
  if(car.kind!=='traffic'||!car.route||car.dead) return;
  const route=car.route;
  let target=laneTarget(route);
  let remaining=distance(car,target);
  if(remaining<25) {
    nextTurn(route);
    target=laneTarget(route);
    remaining=distance(car,target);
  }
  const angle=Math.atan2(target.y-car.y,target.x-car.x);
  const steer=clamp(turn(car.a,angle)*2.3,-1,1);
  let targetSpeed=car.cruise;
  if(remaining<105&&!green(route.col,route.row,route.dir%2,sim.time)) {
    targetSpeed=Math.max(0,(remaining-51)*1.7);
    if(remaining<26) targetSpeed=car.cruise;
  }
  for(const other of sim.cars) {
    if(other===car||other.dead) continue;
    const dx=other.x-car.x;
    const dy=other.y-car.y;
    if(Math.abs(dx)>55||Math.abs(dy)>55) continue;
    const forward=Math.cos(car.a)*dx+Math.sin(car.a)*dy;
    const side=Math.cos(car.a)*dy-Math.sin(car.a)*dx;
    if(forward>0&&Math.abs(side)<13) targetSpeed=Math.min(targetSpeed,Math.max(0,(forward-29)*2.8));
  }
  const gas=clamp((targetSpeed-car.speed)*.065,-.9,1);
  drive(car,gas,steer,false,dt,sim.city,sim.effects);
}
