import {grid,west} from './config.js';
import {buildCity,drawGround,drawArchitecture} from './city.js';
import {vehicle,drawCar,updateDamage,collideCars} from './vehicles.js';
import {seedTraffic,updateTraffic} from './traffic.js';
import {seedPeds,updatePeds,drawPerson} from './peds.js';
import {makePlayer,updatePlayer} from './player.js';
import {makeDispatch,clearDispatch,updatePolice} from './police.js';
import {fire,updateCombat,drawCombat} from './combat.js';
import {makeMissionState,failMission,updateMissions,drawObjectives} from './missions.js';
import {loadCareer,saveCareer} from './save.js';
import {bindInput} from './input.js';
import {makeCamera} from './camera.js';
import {createEffects} from './particles.js';
import {createAudio} from './audio.js';
import {atmosphere,drawTint,drawLights,drawRain} from './weather.js';
import {drawHud,makeMap} from './hud.js';
import {drawTitle,drawOverlay} from './menus.js';
import {stage} from './shots.js';

const timestep=1/60;

export function createGame(input) {
  const city=buildCity();
  const saved=loadCareer();
  const sim={
    city,input,time:0,mode:'title',camera:makeCamera(),effects:createEffects(),audio:createAudio(),
    player:makePlayer(saved),missions:makeMissionState(saved),dispatch:makeDispatch(),
    cars:seedTraffic(),people:seedPeds(),bullets:[],pickups:[],muted:false,
    raise(amount) {
      this.dispatch.heat=Math.min(190,this.dispatch.heat+amount);
      this.dispatch.seen=0;
    },
    fire(...args) {
      fire(this,...args);
    },
    finish(mode) {
      if(this.mode!=='playing') return;
      this.mode=mode;
      failMission(this);
      this.player.money=Math.max(0,this.player.money-100);
      saveCareer(this);
    }
  };
  sim.cars.push(vehicle(315,573,Math.PI/2));
  sim.cars.push(vehicle(810,2630,0,3));
  sim.cars.push(vehicle(1100,1072,0,4));
  sim.cars.push(vehicle(840,812,0,3));
  for(let i=0;i<18;i++) {
    sim.pickups.push({x:west+grid*(i%9)+52,y:grid*(i*7%12)+51,kind:i%2?'armor':'health',next:0});
  }
  sim.weather=atmosphere(sim);
  return sim;
}

function recover(sim) {
  sim.player=makePlayer(sim.player);
  sim.player.armor=0;
  clearDispatch(sim);
  sim.bullets=[];
  sim.mode='playing';
  sim.camera.x=sim.player.x;
  sim.camera.y=sim.player.y;
  if(!sim.cars.some(c=>!c.dead&&Math.hypot(c.x-315,c.y-573)<42)) sim.cars.push(vehicle(315,573,Math.PI/2));
}

export function stepGame(sim,dt) {
  if(sim.shot) return;
  const input=sim.input;
  if(input.tap('KeyM')) sim.muted=sim.audio.toggle();
  if(sim.mode==='title') {
    if(input.tap('Enter')||input.tap('Mouse')) {
      sim.audio.start();
      sim.mode='playing';
    }
  } else if(sim.mode==='paused') {
    if(input.tap('Escape')) sim.mode='playing';
    else if(input.tap('KeyQ')) {
      saveCareer(sim);
      sim.mode='title';
    }
  } else if(sim.mode==='busted'||sim.mode==='wasted') {
    if(input.tap('Enter')) recover(sim);
  } else if(input.tap('Escape')) {
    sim.mode='paused';
  } else {
    sim.time+=dt;
    sim.weather=atmosphere(sim);
    updatePlayer(sim,dt);
    for(const car of sim.cars) {
      updateTraffic(car,sim,dt);
      updateDamage(car,dt,sim.effects,sim.audio);
    }
    if(collideCars(sim.cars,sim.effects,sim.player)) sim.raise(4);
    if(sim.player.car) {
      sim.player.x=sim.player.car.x;
      sim.player.y=sim.player.car.y;
    }
    updatePeds(sim,dt);
    updatePolice(sim,dt);
    updateCombat(sim,dt);
    if(sim.mode==='playing') updateMissions(sim,dt);
    sim.effects.update(dt);
    sim.camera.update(sim.player,dt);
    if(sim.player.hp<=0) sim.finish('wasted');
  }
  input.clear();
}

export function paint(c,sim,map,w,h) {
  if(sim.mode==='title') {
    drawTitle(c,w,h,sim);
    return;
  }
  const camera=sim.camera;
  const v=camera.frame();
  const {night,rain}=sim.weather;
  const visible=actor=>actor.x>v.left-60&&actor.x<v.right+60&&actor.y>v.top-60&&actor.y<v.bottom+60;
  c.save();
  camera.apply(c);
  drawGround(c,sim.city,v,sim.time,night);
  sim.effects.ground(c);
  drawArchitecture(c,sim.city,v,night);
  drawTint(c,v,sim.weather);
  drawLights(c,sim.cars,v,night,sim.time);
  drawObjectives(c,sim);
  for(const car of sim.cars) if(visible(car)) drawCar(c,car,sim.time);
  for(const p of sim.people) if(visible(p)) drawPerson(c,p);
  if(!sim.player.car) drawPerson(c,sim.player,true);
  drawCombat(c,sim);
  sim.effects.draw(c);
  c.restore();
  drawRain(c,w,h,sim.time,rain);
  drawHud(c,sim,map,w,h);
  if(sim.mode!=='playing') drawOverlay(c,w,h,sim.mode,sim);
}

function boot() {
  const canvas=document.querySelector('#game');
  const c=canvas.getContext('2d',{alpha:false});
  const sim=createGame(bindInput(canvas));
  const shot=new URLSearchParams(location.search).get('shot');
  stage(sim,shot);
  sim.weather=atmosphere(sim);
  const map=makeMap(sim.city);
  let width=1280;
  let height=720;
  let scale=1;
  function resize() {
    canvas.width=window.innerWidth;
    canvas.height=window.innerHeight;
    scale=Math.min(canvas.width/960,canvas.height/600);
    width=canvas.width/scale;
    height=canvas.height/scale;
    sim.camera.width=width;
    sim.camera.height=height;
  }
  window.addEventListener('resize',resize);
  window.addEventListener('pagehide',()=>saveCareer(sim));
  resize();
  const rawInput=sim.input;
  Object.defineProperty(sim.input,'scaledMouse',{get:()=>({x:rawInput.mouse.x/scale,y:rawInput.mouse.y/scale})});
  let last=performance.now();
  let carry=0;
  let scheduled;
  function frame(now) {
    carry+=Math.min(.1,Math.max(0,(now-last)/1000));
    last=now;
    while(carry>=timestep) {
      stepGame(sim,timestep);
      carry-=timestep;
    }
    if(!document.hidden) {
      c.setTransform(scale,0,0,scale,0,0);
      paint(c,sim,map,width,height);
    }
    sim.audio.update(sim,sim.mode==='playing');
    scheduled=document.hidden?setTimeout(()=>frame(performance.now()),50):requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange',()=>{
    clearTimeout(scheduled);
    cancelAnimationFrame(scheduled);
    last=performance.now();
    frame(last);
  });
  frame(last);
}

if(typeof document!=='undefined') boot();
