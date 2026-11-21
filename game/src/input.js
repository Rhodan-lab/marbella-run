export function bindInput(canvas) {
  const keys=new Set();
  const taps=new Set();
  const mouse={x:0,y:0,down:false};
  window.addEventListener('keydown',event=>{
    if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(event.code)) event.preventDefault();
    if(!keys.has(event.code)) taps.add(event.code);
    keys.add(event.code);
  });
  window.addEventListener('keyup',event=>keys.delete(event.code));
  window.addEventListener('blur',()=>{
    keys.clear();
    taps.clear();
    mouse.down=false;
  });
  canvas.addEventListener('pointermove',event=>{
    const bounds=canvas.getBoundingClientRect();
    mouse.x=(event.clientX-bounds.left)*canvas.width/bounds.width;
    mouse.y=(event.clientY-bounds.top)*canvas.height/bounds.height;
  });
  canvas.addEventListener('pointerdown',event=>{
    if(event.button===0) {
      mouse.down=true;
      taps.add('Mouse');
    }
  });
  window.addEventListener('pointerup',()=>mouse.down=false);
  return {mouse,keys,has:(...names)=>names.some(n=>keys.has(n)),tap:name=>taps.delete(name),clear:()=>taps.clear()};
}
