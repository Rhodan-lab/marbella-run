import {random,rect,disk} from './config.js';

export function createEffects() {
  const rng=random(337);
  const particles=[];
  const marks=[];
  return {
    burst(x,y,color,count=8,life=.46) {
      for(let i=0;i<count;i++) {
        const a=rng()*Math.PI*2;
        const speed=10+rng()*105;
        particles.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,color,life:life*(.32+rng()*.68),size:1+rng()*3});
      }
      if(particles.length>700) particles.splice(0,particles.length-700);
    },
    mark(x,y,a) {
      const last=marks.at(-2);
      if(last&&(last.x-x)**2+(last.y-y)**2<12) return;
      marks.push({x,y,a,life:17});
      if(marks.length>390) marks.shift();
    },
    update(dt) {
      for(let i=particles.length-1;i>=0;i--) {
        const p=particles[i];
        p.life-=dt;
        if(p.life<=0) particles.splice(i,1);
        else {
          p.x+=p.vx*dt;
          p.y+=p.vy*dt;
          p.vx*=.96;
          p.vy*=.96;
        }
      }
      for(let i=marks.length-1;i>=0;i--) {
        marks[i].life-=dt;
        if(marks[i].life<=0) marks.splice(i,1);
      }
    },
    ground(c) {
      c.save();
      for(const m of marks) {
        c.save();
        c.translate(m.x,m.y);
        c.rotate(m.a);
        c.globalAlpha=Math.min(.52,m.life*.1);
        rect(c,'#151722',-4,-1,8,2);
        c.restore();
      }
      c.restore();
    },
    draw(c) {
      c.save();
      for(const p of particles) {
        c.globalAlpha=Math.min(.85,p.life*3);
        disk(c,p.color,p.x,p.y,p.size);
      }
      c.restore();
    }
  };
}
