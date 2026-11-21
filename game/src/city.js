import {grid,west,east,south,road,palette,random,rect,polygon,disk} from './config.js';

export function buildCity(seed=917) {
  const rng=random(seed);
  const buildings=[];
  const lots=[];
  const cells=new Map();
  const signs=['MIRADOR HOTEL','CASA LUNA','MOTEL AZUL','RADIO SOL','SAL MARINA','NORTHLINE','CALLE CAFÉ','ORBIT CLUB','SALT UNION','CORAL MARKET','SUNDOWN','VELVET PALMS'];
  for(let row=0;row<12;row++) {
    for(let col=0;col<10;col++) {
      const x=west+col*grid;
      const y=row*grid;
      const lot={x,y,row,col,park:(row+col*5)%19===8,dock:col===0&&row>=8,impound:row===10&&col===2};
      lots.push(lot);
      const members=[];
      cells.set(row*10+col,members);
      if(lot.park||lot.dock||lot.impound) continue;
      for(const [ox,oy,w,h] of [[66,65,65,127],[144,65,50,55],[144,132,50,62]]) {
        const id=buildings.length;
        const b={x:x+ox,y:y+oy,w,h,z:22+rng()*34,color:palette[Math.floor(rng()*palette.length)], style:id%4,sign:signs[(row+col*3+id)%signs.length],id};
        members.push(b);
        buildings.push(b);
      }
    }
  }
  return {buildings,lots,cells};
}

export function solid(city,x,y,r=0) {
  if(x<122 || x>east+42 || y< -40 || y>south+42) return true;
  const row=Math.floor(y/grid);
  const col=Math.floor((x-west)/grid);
  if(col<0||col>=10) return false;
  return city.cells.get(row*10+col)?.some(b=>x+r>b.x&&x-r<b.x+b.w&&y+r>b.y&&y-r<b.y+b.h) ?? false;
}

export function green(col,row,axis,time) {
  return ((Math.floor((time+row*1.1+col*1.7)/7))&1)===axis;
}

function palm(ctx,x,y,scale=1) {
  ctx.save();
  ctx.translate(x,y);
  ctx.scale(scale,scale);
  ctx.fillStyle='#22312d45';
  ctx.beginPath();
  ctx.ellipse(10,9,14,5,.3,0,Math.PI*2);
  ctx.fill();
  polygon(ctx,'#886452',[[-2,1],[2,1],[7,-18],[4,-21]]);
  for(let i=0;i<7;i++) {
    ctx.save();
    ctx.translate(5,-19);
    ctx.rotate(i*.9);
    polygon(ctx,i%2?'#347967':'#4a9a70',[[0,0],[5,-4],[14,-2],[19,4],[9,1],[5,3]]);
    ctx.restore();
  }
  disk(ctx,'#a8ba72',5,-19,2);
  ctx.restore();
}

function visible(view,x,y,w,h) {
  return x+w>view.left&&x<view.right&&y+h>view.top&&y<view.bottom;
}

function waterfront(c,v,time) {
  rect(c,'#157e91',v.left,v.top,257-v.left,v.bottom-v.top);
  rect(c,'#248fa0',55,v.top,85,v.bottom-v.top);
  rect(c,'#50b5aa',96,v.top,43,v.bottom-v.top);
  polygon(c,'#e8bc82',[[128,v.top],[254,v.top],[254,v.bottom],[128,v.bottom]]);
  for(let y=Math.floor(v.top/20)*20;y<v.bottom;y+=20) {
    const offset=Math.sin(y*.026+time*1.7)*7;
    rect(c,'#ddfbdd',124+offset,y,3,12);
    rect(c,'#a2e0c47a',81+offset,y+4,12,2);
    rect(c,'#f4cf98',151,y+3,14,1);
  }
  rect(c,'#ae7763',229,v.top,26,v.bottom-v.top);
  rect(c,'#efbba0',232,v.top,20,v.bottom-v.top);
  for(let y=Math.floor(v.top/72)*72;y<v.bottom;y+=72) {
    if(y<grid*8) {
      const x=167+Math.sin(y)*15;
      disk(c,'#98785f50',x+6,y+5,13);
      for(let i=0;i<8;i++) {
        const a=i*Math.PI/4;
        polygon(c,i%2?'#fff1c4':y%3?'#ea6463':'#4d9da5',[[x,y],[x+12*Math.cos(a),y+12*Math.sin(a)],[x+12*Math.cos(a+.785),y+12*Math.sin(a+.785)]]);
      }
      rect(c,'#fff0ba',x+19,y+2,5,15);
    }
    palm(c,244,y+14,.8);
  }
  for(const y of [2240,2760]) {
    rect(c,'#573f40',50,y,181,47);
    rect(c,'#ab8170',53,y+3,180,39);
    for(let x=57;x<230;x+=7) rect(c,'#785650',x,y+4,1,37);
    rect(c,'#ebba8a',54,y+5,179,3);
  }
}

export function drawGround(c,city,v,time,night) {
  rect(c,'#3e4853',v.left,v.top,v.right-v.left,v.bottom-v.top);
  if(v.left<west) waterfront(c,v,time);
  for(let col=0;col<=10;col++) {
    const x=west+col*grid;
    if(!visible(v,x-45,v.top,90,v.bottom-v.top)) continue;
    rect(c,'#59616a',x-43,v.top,2,v.bottom-v.top);
    rect(c,'#59616a',x+41,v.top,2,v.bottom-v.top);
    for(let row=0;row<12;row++) {
      const y=row*grid;
      for(let k=57;k<213;k+=24) {
        rect(c,'#cfad68',x-2,y+k,1,12);
        rect(c,'#cfad68',x+1,y+k,1,12);
        for(const offset of [-23,23]) rect(c,'#aeb3ab65',x+offset,y+k,1,9);
      }
    }
  }
  for(let row=0;row<=12;row++) {
    const y=row*grid;
    if(y<v.top-50||y>v.bottom+50) continue;
    for(let col=0;col<10;col++) {
      const x=west+col*grid;
      if(!visible(v,x-45,y-45,grid+45,90)) continue;
      for(let k=57;k<213;k+=24) {
        rect(c,'#cfad68',x+k,y-2,12,1);
        rect(c,'#cfad68',x+k,y+1,12,1);
        for(const offset of [-23,23]) rect(c,'#aeb3ab65',x+k,y+offset,9,1);
      }
      for(let p=-34;p<=34;p+=8) {
        for(const s of [-1,1]) {
          rect(c,'#d4d2c494',x+p,y+s*36-3,4,8);
          rect(c,'#d4d2c494',x+s*36-3,y+p,8,4);
        }
      }
      rect(c,'#ffffff0d',x-31,y-31,62,62);
    }
  }
  for(const lot of city.lots) {
    const {x,y,row,col}=lot;
    if(!visible(v,x,y,grid,grid)) continue;
    rect(c,'#28323b',x+42,y+42,178,178);
    rect(c,'#e6bba0',x+44,y+44,172,172);
    rect(c,lot.park?'#73977d':lot.dock||lot.impound?'#727779':'#b98b79',x+60,y+60,140,140);
    for(let k=48;k<215;k+=8) {
      rect(c,'#99766c55',x+k,y+45,1,14);
      rect(c,'#99766c55',x+k,y+201,1,14);
      rect(c,'#99766c55',x+45,y+k,14,1);
    }
    for(const offset of [72,178]) {
      palm(c,x+offset,y+207,.8);
      palm(c,x+52,y+offset,.83);
    }
    if(lot.park) {
      rect(c,'#e6c2a6',x+63,y+119,134,22);
      rect(c,'#e6c2a6',x+118,y+61,22,138);
      disk(c,'#e8d5ab',x+129,y+130,32);
      disk(c,'#569caa',x+129,y+130,25);
      disk(c,'#9dd9d4',x+129,y+130,9);
    }
    if(lot.dock) {
      for(let i=0;i<8;i++) {
        const a=x+71+(i%2)*63;
        const b=y+70+Math.floor(i/2)*32;
        rect(c,'#303b42',a+4,b+5,50,21);
        rect(c,palette[(i+row)%6],a,b,50,21);
        for(let j=3;j<49;j+=5) rect(c,'#3b38434d',a+j,b+2,1,17);
      }
    }
    if(lot.impound) {
      for(let k=0;k<5;k++) rect(c,'#f1d28e',x+73+k*28,y+75,1,37);
      c.fillStyle='#fcdea7';
      c.font='bold 14px sans-serif';
      c.fillText('IMPOUND',x+89,y+165);
    }
    for(const [lx,ly,axis] of [[x+50,y+50,0],[x+210,y+50,1]]) {
      if(night>.3) {
        const lamp=c.createRadialGradient(lx,ly,1,lx,ly,39);
        lamp.addColorStop(0,'#ffd59190');
        lamp.addColorStop(1,'#ffd59100');
        disk(c,lamp,lx,ly,39);
      }
      rect(c,'#2d303e',lx,ly-18,2,19);
      rect(c,'#fff2c6',lx-4,ly-19,9,3);
      rect(c,'#292b39',lx+4,ly-11,5,10);
      disk(c,green(col,row,axis,time)?'#75ffb5':'#ff7868',lx+6,ly-6,2);
    }
  }
}

export function drawArchitecture(c,city,v,night) {
  for(const b of city.buildings) {
    const {x,y,w,h,z,id}=b;
    if(!visible(v,x-30,y-70,w+110,h+100)) continue;
    const dx=-z*.43;
    const dy=-z*.66;
    polygon(c,'#2929354d',[[x,y+h],[x+w,y],[x+w+z*1.3,y+z*.47],[x+w+z*1.3,y+h+z*.47],[x+z,y+h+z*.47]]);
    rect(c,'#584a57',x,y+h+2,w,4);
    polygon(c,'#956862',[[x+dx,y+h+dy],[x+w+dx,y+h+dy],[x+w,y+h],[x,y+h]]);
    polygon(c,'#69545f',[[x+w+dx,y+dy],[x+w,y],[x+w,y+h],[x+w+dx,y+h+dy]]);
    for(let offset=7;offset<w-8;offset+=13) {
      for(let floor=0;floor<Math.floor(z/13);floor++) {
        const wx=x+dx+offset+floor*4.5;
        const wy=y+h+dy+5+floor*8;
        rect(c,'#553f50',wx,wy,8,5);
        rect(c,night>.3&&(id+offset+floor)%4?'#ffd68e':'#7a9caa',wx+1,wy,6,3);
      }
    }
    rect(c,'#594a51',x+dx-2,y+dy-2,w+4,h+4);
    rect(c,b.color,x+dx,y+dy,w,h);
    c.strokeStyle='#fff5d19b';
    c.lineWidth=2;
    c.strokeRect(x+dx+3,y+dy+3,w-6,h-6);
    c.strokeStyle='#302d3844';
    c.strokeRect(x+dx+7,y+dy+7,w-14,h-14);
    if(b.style===0) {
      rect(c,'#a57169',x+dx+12,y+dy+13,w-24,h-26);
      for(let k=17;k<h-15;k+=5) rect(c,'#c48976',x+dx+13,y+dy+k,w-26,1);
    } else if(b.style===1) {
      rect(c,'#727c83',x+dx+11,y+dy+12,w-22,h-24);
      rect(c,'#7fe0d2',x+dx+14,y+dy+15,w-28,h-30);
      for(let k=23;k<h-15;k+=8) rect(c,'#b9f5e999',x+dx+16,y+dy+k,w-32,1);
    } else {
      rect(c,'#534a58',x+dx+13,y+dy+15,18,16);
      rect(c,'#c8cdc2',x+dx+11,y+dy+12,18,16);
      for(let k=0;k<4;k++) rect(c,'#626b77',x+dx+14,y+dy+15+k*3,11,1);
      if(b.style===3) {
        disk(c,'#776571',x+dx+w-15,y+dy+h-15,8);
        disk(c,'#dfcab8',x+dx+w-17,y+dy+h-17,7);
      }
    }
    if(id%3===0) {
      rect(c,night>.3?'#be527e':'#5d515e',x-2,y+h-5,w+4,9);
      c.font='bold 5.5px sans-serif';
      c.textAlign='center';
      c.fillStyle='#fff1c9';
      c.fillText(b.sign,x+w/2,y+h+1,w-5);
      c.textAlign='left';
      for(let k=0;k<w;k+=7) rect(c,k%2?'#ec9b82':'#f6dbad',x+k,y+h+5,6,4);
    }
  }
}
