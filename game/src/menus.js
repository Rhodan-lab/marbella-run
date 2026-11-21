import {rect,disk,polygon,random} from './config.js';
import {panel,text} from './hud.js';

const rng=random(702);
const skyline=Array.from({length:40},()=>[28+rng()*56,33+rng()*145,rng()]);

export function drawTitle(c,w,h,sim) {
  const sky=c.createLinearGradient(0,0,0,h);
  sky.addColorStop(0,'#18263f');
  sky.addColorStop(.52,'#84617c');
  sky.addColorStop(.73,'#e99681');
  sky.addColorStop(1,'#eabf8b');
  rect(c,sky,0,0,w,h);
  const sx=w*.73;
  const sy=h*.45;
  const sr=h*.22;
  disk(c,'#fdd39b',sx,sy,sr);
  for(let i=0;i<8;i++) {
    const offset=sr*.21+i*sr*.1;
    const half=Math.sqrt(sr*sr-offset*offset);
    rect(c,'#db927e',sx-half,sy+offset,half*2,2+i*.6);
  }
  let x=-20;
  for(const [width,height,tone] of skyline) {
    const y=h*.79-height;
    rect(c,tone>.5?'#373953':'#494058',x,y,width-2,height);
    if(tone>.74) rect(c,'#494058',x+width*.66,y-21,2,21);
    for(let yy=y+13;yy<h*.78;yy+=13) {
      for(let xx=x+7;xx<x+width-6;xx+=10) {
        if(Math.floor(yy*xx)%5<2) rect(c,'#eebd9170',xx,yy,3,3);
      }
    }
    x+=width;
  }
  rect(c,'#212b44',0,h*.79,w,h*.21);
  for(let i=0;i<11;i++) {
    const y=h*.81+i*h*.014;
    const width=55+i*16;
    rect(c,'#dd9e7947',sx-width/2+Math.sin(i*2)*30,y,width,2);
  }
  polygon(c,'#151e35',[[0,h],[0,h*.85],[w*.36,h*.82],[w*.67,h],[w,h]]);
  const tx=Math.max(35,w*.085);
  const size=Math.min(w*.105,h*.19);
  text(c,'M A K E F U N   /   O R I G I N A L',tx,h*.222,12,'#f4b29e',850);
  text(c,'Marbella',tx-2,h*.405,size,'#fff0d1',900);
  text(c,'RUN.',tx,h*.55,size*.7,'#ffb19b',900);
  text(c,'A coastal getaway',tx+4,h*.612,21,'#fff0d4',650);
  panel(c,tx,h*.675,244,58);
  text(c,'ENTER   /   '+(sim.missions.index?'CONTINUE':'START ENGINE'),tx+14,h*.675+35,14,'#ffe1aa',900);
  text(c,'WASD   MOVE / DRIVE       E   VEHICLE       F   JOBS',tx,h-27,11,'#f8c4ae',800);
  text(c,'MIRADOR  /  16:00',w-169,h-27,11,'#f8c4ae');
}

export function drawOverlay(c,w,h,mode,sim) {
  rect(c,'#111528b6',0,0,w,h);
  const x=w/2-232;
  const y=h/2-138;
  panel(c,x,y,464,276);
  const headline={paused:'PAUSED',busted:'BUSTED',wasted:'WASTED'}[mode];
  text(c,headline,x+24,y+66,49,mode==='paused'?'#fff0cf':'#ff9b91',900);
  if(mode==='paused') {
    const rows=['WASD / arrows    Walk, steer and drive','Shift / Space    Sprint / handbrake','E / F    Enter or exit vehicle / start job','Mouse / 1–4    Aim, attack and select weapon'];
    rows.forEach((row,i)=>text(c,row,x+26,y+110+i*24,14,'#e6cfc7',650));
    text(c,'ESC  RESUME     M  SOUND '+(sim.muted?'OFF':'ON')+'     Q  TITLE',x+26,y+244,13,'#ffbd9d',850);
  } else {
    text(c,mode==='busted'?'Dispatch has impounded your vehicle.':'The clinic patched you up.',x+26,y+119,16);
    text(c,'Career progress saved. Recovery fee: $100.',x+26,y+154,14,'#e6cfc7');
    text(c,'ENTER  /  RETURN TO MIRADOR',x+26,y+232,14,'#ffbd9d',850);
  }
}
