export function createAudio() {
  let context;
  let master;
  let motor;
  let motorGain;
  let siren;
  let sirenGain;
  let noise;
  let note=0;
  let next=0;
  let mute=false;

  function start() {
    if(context) {
      context.resume().catch(()=>{});
      return;
    }
    const Audio=globalThis.AudioContext;
    if(!Audio) return;
    context=new Audio();
    master=context.createGain();
    master.gain.value=.35;
    master.connect(context.destination);
    motor=context.createOscillator();
    motor.type='sawtooth';
    motorGain=context.createGain();
    motorGain.gain.value=0;
    const filter=context.createBiquadFilter();
    filter.type='lowpass';
    filter.frequency.value=180;
    motor.connect(filter).connect(motorGain).connect(master);
    motor.start();
    siren=context.createOscillator();
    sirenGain=context.createGain();
    sirenGain.gain.value=0;
    siren.connect(sirenGain).connect(master);
    siren.start();
    noise=context.createBuffer(1,context.sampleRate*.42,context.sampleRate);
    const samples=noise.getChannelData(0);
    for(let i=0;i<samples.length;i++) samples[i]=Math.random()*2-1;
  }

  function tone(freq,seconds,level,type='sine',offset=0) {
    const when=context.currentTime+offset;
    const osc=context.createOscillator();
    const gain=context.createGain();
    osc.type=type;
    osc.frequency.value=freq;
    gain.gain.setValueAtTime(.0001,when);
    gain.gain.exponentialRampToValueAtTime(level,when+.018);
    gain.gain.exponentialRampToValueAtTime(.0001,when+seconds);
    osc.connect(gain).connect(master);
    osc.start(when);
    osc.stop(when+seconds+.02);
  }

  function hit(kind) {
    if(!context) return;
    if(kind==='tap'||kind==='success') {
      tone(kind==='tap'?395:523,.13,.15,'triangle');
      if(kind==='success') {
        tone(659,.24,.12,'triangle',.1);
        tone(784,.35,.12,'triangle',.2);
      }
      return;
    }
    const source=context.createBufferSource();
    const gain=context.createGain();
    const filter=context.createBiquadFilter();
    filter.type='lowpass';
    filter.frequency.value=kind==='shot'?1600:340;
    source.buffer=noise;
    gain.gain.setValueAtTime(kind==='boom'?.55:.27,context.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001,context.currentTime+(kind==='boom'?.39:.11));
    source.connect(filter).connect(gain).connect(master);
    source.start();
  }

  function update(sim,playing) {
    if(!context) return;
    const t=context.currentTime;
    const car=playing?sim.player.car:null;
    motor.frequency.setTargetAtTime(39+Math.abs(car?.speed??0)*.54,t,.12);
    motorGain.gain.setTargetAtTime(car?.dead||!car?0:.099,t,.1);
    let nearest=450;
    if(playing) for(const unit of sim.cars) {
      if(unit.kind==='cop'&&!unit.dead) nearest=Math.min(nearest,Math.hypot(unit.x-sim.player.x,unit.y-sim.player.y));
    }
    siren.frequency.setTargetAtTime(585+Math.sin(t*9)*182,t,.06);
    sirenGain.gain.setTargetAtTime((1-nearest/450)*.07,t,.11);
    if(playing&&t>next) {
      const scale=sim.weather.night>.4?[110,130.8,164.8,196,146.8,164.8,130.8,98]:[130.8,164.8,196,220,146.8,196,164.8,110];
      tone(scale[note%8]*(note%3===0?1:2),.55,.036,'triangle');
      if(note%4===0) tone(scale[note%8]/2,.9,.043);
      note++;
      next=t+.37;
    }
  }

  return {start,hit,update,toggle() {
    mute=!mute;
    if(master) master.gain.value=mute?0:.35;
    return mute;
  }};
}
