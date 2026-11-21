export const grid = 260;
export const west = 300;
export const east = west + 10 * grid;
export const south = 12 * grid;
export const road = 86;
export const districts = ['Mirador Beach', 'Caleta Market', 'Glass Mile', 'Crown Heights', 'Salt Docks', 'Cinder Flats'];
export const palette = ['#e5987e','#eebc86','#e8d3a6','#91beb1','#aab7cf','#cf9ba9'];
export const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
export const clamp = (n,lo,hi) => Math.min(hi,Math.max(lo,n));
export const mix = (a,b,t) => a+(b-a)*t;
export const turn = (a,b) => Math.atan2(Math.sin(b-a),Math.cos(b-a));
export function random(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525,state)+1013904223) >>> 0;
    return state / 4294967296;
  };
}
export function districtAt(x,y) {
  return districts[Math.min(2, Math.max(0,Math.floor(y/(south/3))))*2 + Number(x > west+5*grid)];
}
export function rect(ctx,color,x,y,w,h) {
  ctx.fillStyle=color;
  ctx.fillRect(x,y,w,h);
}
export function polygon(ctx,color,points) {
  ctx.fillStyle=color;
  ctx.beginPath();
  points.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
  ctx.closePath();
  ctx.fill();
}
export function disk(ctx,color,x,y,r) {
  ctx.fillStyle=color;
  ctx.beginPath();
  ctx.arc(x,y,r,0,Math.PI*2);
  ctx.fill();
}
