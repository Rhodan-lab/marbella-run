import {mix,clamp} from './config.js';

export function makeCamera() {
  return {
    x:300,y:520,width:1280,height:720,zoom:1.4,
    update(p,dt) {
      const speed=Math.abs(p.car?.speed??0);
      this.x=mix(this.x,p.x+(p.car?.vx??0)*.28,1-Math.exp(-dt*6));
      this.y=mix(this.y,p.y+(p.car?.vy??0)*.28,1-Math.exp(-dt*6));
      this.zoom=mix(this.zoom,p.car?1.45-clamp(speed/550,0,.36):1.8,1-Math.exp(-dt*3));
    },
    world(x,y) {
      return {x:this.x+(x-this.width/2)/this.zoom,y:this.y+(y-this.height/2)/this.zoom};
    },
    frame() {
      const a=this.world(0,0);
      const b=this.world(this.width,this.height);
      return {left:a.x,top:a.y,right:b.x,bottom:b.y};
    },
    apply(c) {
      c.translate(Math.round(this.width/2-this.x*this.zoom),Math.round(this.height/2-this.y*this.zoom));
      c.scale(this.zoom,this.zoom);
    }
  };
}
