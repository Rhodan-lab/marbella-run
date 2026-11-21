import {clamp,rect,disk,polygon,random} from './config.js';

const rng=random(403);
const streaks=Array.from({length:145},()=>[rng(),rng(),4+rng()*15]);

export function atmosphere(sim) {
  const hour=sim.shot?.hour??((16+sim.time/40)%24);
  const night=clamp((Math.abs(hour-12)-6)/3,0,1);
  const rain=sim.shot?0:Math.max(0,Math.sin(sim.time*.005-2)-.82)*5;
  return {hour,night,rain};
}

export function drawTint(c,v,weather) {
  const {night,hour}=weather;
  if(night) rect(c,'rgba(16,19,60,'+(night*.63)+')',v.left-3,v.top-3,v.right-v.left+6,v.bottom-v.top+6);
  else if(hour>15) {
    const sun=c.createLinearGradient(v.left,v.top,v.right,v.bottom);
    sun.addColorStop(0,'#ffd28816');
    sun.addColorStop(1,'#d95e6e23');
    rect(c,sun,v.left,v.top,v.right-v.left,v.bottom-v.top);
  }
}

export function drawLights(c,cars,v,night,time) {
  if(night<.2) return;
  for(const car of cars) {
    if(car.dead||car.x<v.left-110||car.x>v.right+110||car.y<v.top-110||car.y>v.bottom+110) continue;
    c.save();
    c.translate(car.x,car.y);
    c.rotate(car.a);
    if(car.lights) {
      for(const y of [-6,6]) {
        const beam=c.createLinearGradient(14,y,114,y);
        beam.addColorStop(0,'#fff2bca0');
        beam.addColorStop(.32,'#ffed9f48');
        beam.addColorStop(1,'#fff0ac00');
        polygon(c,beam,[[16,y-2],[112,y-22],[112,y+22],[16,y+2]]);
      }
    }
    if(car.kind==='cop') {
      const light=c.createRadialGradient(0,0,2,0,0,39);
      light.addColorStop(0,Math.floor(time*9)%2?'#64ceff90':'#ff405b90');
      light.addColorStop(1,'#00000000');
      disk(c,light,0,0,39);
    }
    c.restore();
  }
}

export function drawRain(c,width,height,time,rain) {
  if(!rain) return;
  c.strokeStyle='rgba(202,221,239,'+(rain*.48)+')';
  c.lineWidth=1;
  c.beginPath();
  for(const [a,b,len] of streaks) {
    const x=(a*width+time*79)%width;
    const y=(b*height+time*410)%height;
    c.moveTo(x,y);
    c.lineTo(x+len*.4,y+len);
  }
  c.stroke();
}
