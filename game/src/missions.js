import {distance,disk,rect,polygon} from './config.js';
import {saveCareer} from './save.js';

const MISSIONS_REV='Clearer timeout guidance for the first two missions';

export const cast=[
  {name:'INES VEGA',role:'THE FIXER',skin:'#c58c76',hair:'#353049',coat:'#ea7b86'},
  {name:'TOMAS REY',role:'THE MECHANIC',skin:'#b77d5c',hair:'#4b3841',coat:'#78c9bb'},
  {name:'LUCIA MAR',role:'THE REPORTER',skin:'#e0a889',hair:'#563647',coat:'#eabf7b'}
];

const point=(x,y,label,mode='reach')=>({x,y,label,mode});
const job=(name,who,line,time,pay,unlock,steps)=>({name,who,line,time,pay,unlock,steps});

export const story=[
  job('01 / A Favor at Sunset',0,'The pink cabrio is mine. Borrow it before someone else does.',95,450,1,[
    point(315,573,'Take the pink cabrio','car'),
    point(560,520,'Bring the cabrio to Caleta'),
    point(820,780,'Park at the market drop')]),
  job('02 / Salt in the Frame',2,'The union ledger is on the pier. I need proof, not a headline.',120,650,1,[
    point(300,2250,'Reach Salt Docks'),
    point(195,2260,'Collect the ledger on foot','foot'),
    point(560,1820,'Deliver the ledger')]),
  job('03 / No Courtesy Calls',1,'My courier missed their last stop. Find the van and move it.',110,850,2,[
    point(1080,1040,'Pick up a car','car'),
    point(1340,1300,'Reach the courier'),
    point(820,1300,'Make the second drop')]),
  job('04 / The Long Light',0,'Follow the boulevard. If you see blue lights, keep moving.',95,950,2,[
    point(560,780,'Pass the boulevard marker','heat'),
    point(560,1300,'Reach the canal overpass'),
    point(1080,1560,'Reach the hideout')]),
  job('05 / Glass Receipts',2,'Two envelopes. The one near the tower names the buyer.',110,1100,2,[
    point(1600,1040,'Find the tower envelope','foot'),
    point(1860,1040,'Collect the buyer records','foot'),
    point(2120,1300,'Meet Lucia')]),
  job('06 / Keys to the Yard',1,'They impounded the wrong car. We can make use of it.',115,1250,3,[
    point(820,2600,'Get to the impound'),
    point(820,2632,'Find a getaway car','car'),
    point(1340,2600,'Clear the yard','heat'),
    point(1600,2340,'Deliver the car')]),
  job('07 / Public Record',2,'Bring the tape to the relay. I will get it on air.',100,1500,3,[
    point(2120,2080,'Collect the tape on foot','foot'),
    point(2120,1560,'Reach the broadcast relay','heat'),
    point(1860,780,'Get to the safe address')]),
  job('08 / The Marbella Run',0,'One last drive. After tonight they can keep the city.',140,3000,3,[
    point(820,780,'Take a getaway car','car'),
    point(820,1040,'Trigger the decoy','heat'),
    point(300,1040,'Reach the beach road'),
    point(300,520,'Cross the coastal finish')])
];

export const sideJobs=[
  job('Boardwalk Circuit',1,'Beat the clock through five waterfront checkpoints.',55,500,0,[
    point(300,780,'Enter the circuit in a car','car'),
    point(300,1040,'Coastal gate'),
    point(560,1040,'Market turn'),
    point(560,520,'North straight'),
    point(300,520,'Boardwalk finish')]),
  job('Dockside Rampage',0,'Make noise down at the docks. Then get to the breakwater.',76,780,0,[
    point(300,2340,'Enter the docks','heat'),
    point(560,2340,'Cross the loading road','heat'),
    point(560,2600,'Pass the south yard'),
    point(195,2760,'Reach the pier')])
];

const contacts=[{x:300,y:520},{x:300,y:780},{x:300,y:2340}];

export function makeMissionState(saved) {
  return {index:Math.min(story.length,saved.index),best:saved.best,active:null,step:0,left:0,banner:null,dialog:null};
}

export function objective(sim) {
  const m=sim.missions;
  if(m.active) return m.active.steps[m.step];
  if(m.banner?.failed) return null;
  return m.index<story.length?{...contacts[0],label:'Meet Ines / press F'}:null;
}

export function beginMission(sim,job,side=false) {
  const m=sim.missions;
  Object.assign(m,{active:job,side,step:0,left:job.time,banner:null,dialog:{who:job.who,line:job.line,left:5}});
  sim.audio.hit('tap');
}

export function failMission(sim) {
  const m=sim.missions;
  if(!m.active) return;
  const title=m.active===story[0]?'TIME UP / Drive through both drops':
    m.active===story[1]?'TIME UP / Collect ledger on foot, then deliver':'JOB FAILED';
  m.banner={title,failed:true,job:m.active,side:m.side,left:0};
  m.active=null;
}

function completeMission(sim) {
  const m=sim.missions;
  const job=m.active;
  sim.player.money+=job.pay;
  sim.player.unlock=Math.max(sim.player.unlock,job.unlock);
  if(!m.side) m.index++;
  else m.best=Math.max(m.best,Math.round(m.left));
  m.banner={title:'JOB COMPLETE',detail:'+$'+job.pay.toLocaleString('en-US'),left:6};
  m.active=null;
  saveCareer(sim);
  sim.audio.hit('success');
}

export function updateMissions(sim,dt) {
  const m=sim.missions;
  if(m.dialog) {
    m.dialog.left-=dt;
    if(m.dialog.left<=0) m.dialog=null;
  }
  if(m.banner&&!m.banner.failed) {
    m.banner.left-=dt;
    if(m.banner.left<0) m.banner=null;
  }
  if(!m.active) {
    if(!sim.input.tap('KeyF')) return;
    if(m.banner?.failed) {
      const retry=m.banner;
      beginMission(sim,retry.job,retry.side);
    } else if(m.index<story.length&&distance(sim.player,contacts[0])<66) beginMission(sim,story[m.index]);
    else for(let i=0;i<2;i++) {
      if(distance(sim.player,contacts[i+1])<64) beginMission(sim,sideJobs[i],true);
    }
    return;
  }
  m.left-=dt;
  if(m.left<=0) {
    failMission(sim);
    return;
  }
  const target=objective(sim);
  const p=sim.player;
  if(distance(p,target)>40) return;
  if(target.mode==='car'&&!p.car||target.mode==='foot'&&p.car) return;
  if(target.mode==='heat') sim.raise(58);
  sim.effects.burst(target.x,target.y,'#ffe39d',18);
  if(++m.step===m.active.steps.length) completeMission(sim);
  else sim.audio.hit('tap');
}

export function drawObjectives(c,sim) {
  const target=objective(sim);
  const markers=sim.missions.active?[target]:[target,...contacts.slice(1)];
  for(const m of markers) {
    if(!m) continue;
    const phase=sim.time*3;
    const radius=18+Math.sin(phase)*3;
    disk(c,'#ffe98d22',m.x,m.y,radius+5);
    c.strokeStyle='#ffe792';
    c.lineWidth=2;
    c.beginPath();
    c.ellipse(m.x,m.y,radius,radius*.7,0,0,Math.PI*2);
    c.stroke();
    const beam=c.createLinearGradient(m.x,m.y-64,m.x,m.y);
    beam.addColorStop(0,'#ffe99a00');
    beam.addColorStop(1,'#ffe99a70');
    polygon(c,beam,[[m.x-9,m.y],[m.x-15,m.y-64],[m.x+15,m.y-64],[m.x+9,m.y]]);
    polygon(c,'#fff3bb',[[m.x,m.y-34],[m.x-7,m.y-43],[m.x,m.y-52],[m.x+7,m.y-43]]);
  }
}

export function drawPortrait(c,person,x,y) {
  rect(c,'#36324b',x,y,52,55);
  disk(c,'#75596b',x+25,y+25,20);
  disk(c,person.coat,x+26,y+59,22);
  disk(c,person.hair,x+25,y+23,14);
  disk(c,person.skin,x+27,y+27,10);
  polygon(c,person.hair,[[x+13,y+24],[x+18,y+13],[x+32,y+14],[x+39,y+22],[x+29,y+19]]);
  rect(c,'#403247',x+24,y+25,9,2);
  rect(c,'#8e5d5e',x+27,y+31,5,1);
}
