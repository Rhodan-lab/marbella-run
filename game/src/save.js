const key='marbella-run-career-v1';

export function loadCareer() {
  const initial={index:0,money:250,unlock:0,armor:0,best:0};
  try {
    const stored=JSON.parse(localStorage.getItem(key));
    for(const name of Object.keys(initial)) {
      if(Number.isFinite(stored?.[name])&&stored[name]>=0) initial[name]=stored[name];
    }
  } catch {}
  return initial;
}

export function saveCareer(sim) {
  if(sim.shot) return;
  const {money,unlock,armor}=sim.player;
  try {
    localStorage.setItem(key,JSON.stringify({index:sim.missions.index,money,unlock,armor,best:sim.missions.best}));
  } catch {}
}
