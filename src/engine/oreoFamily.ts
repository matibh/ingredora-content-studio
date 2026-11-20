import * as THREE from "three";

export type OreoFamilySet = {
  cookie: THREE.Group;
  flap: THREE.Group;
  update: (time: number) => void;
};

function texture(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, w=1024, h=1024) {
  const canvas=document.createElement("canvas"); canvas.width=w; canvas.height=h;
  const ctx=canvas.getContext("2d"); if(!ctx) throw new Error("No se pudo preparar la escena de la merienda.");
  draw(ctx,w,h);
  const map=new THREE.CanvasTexture(canvas); map.colorSpace=THREE.SRGBColorSpace; map.anisotropy=8; return map;
}

function makePackFront() {
  return texture((ctx,w,h)=>{
    const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,"#2389df");g.addColorStop(.42,"#0861b5");g.addColorStop(1,"#043a83");
    ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    // Soft printed-film highlights and subtle crinkles.
    for(let i=0;i<42;i++){ctx.strokeStyle=i%2?"rgba(255,255,255,.055)":"rgba(0,25,70,.08)";ctx.lineWidth=2+i%4;ctx.beginPath();const y=i*h/42;ctx.moveTo(0,y);ctx.bezierCurveTo(w*.25,y-16,w*.7,y+18,w,y-8);ctx.stroke();}
    const sheen=ctx.createLinearGradient(0,0,w,0);sheen.addColorStop(0,"rgba(255,255,255,.18)");sheen.addColorStop(.18,"rgba(255,255,255,0)");sheen.addColorStop(.78,"rgba(255,255,255,0)");sheen.addColorStop(1,"rgba(255,255,255,.12)");ctx.fillStyle=sheen;ctx.fillRect(0,0,w,h);
    ctx.save();ctx.translate(w/2,h*.34);ctx.rotate(-.035);
    ctx.shadowColor="rgba(0,0,0,.3)";ctx.shadowBlur=24;ctx.fillStyle="#fff";ctx.font="italic 900 220px Georgia,serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("OREO",0,0,850);
    ctx.shadowBlur=0;ctx.strokeStyle="#0a4387";ctx.lineWidth=9;ctx.strokeText("OREO",0,0,850);ctx.restore();
    ctx.textAlign="center";ctx.fillStyle="#fff";ctx.font="800 54px Arial";ctx.fillText("GALLETITAS RELLENAS",w/2,h*.52);
    ctx.font="700 42px Arial";ctx.fillText("SABOR ORIGINAL",w/2,h*.60);
    ctx.save();ctx.translate(w*.5,h*.79);ctx.rotate(-.13);ctx.fillStyle="#24140f";ctx.beginPath();ctx.arc(0,0,105,0,Math.PI*2);ctx.fill();ctx.fillStyle="#f5eee0";ctx.beginPath();ctx.arc(0,0,57,0,Math.PI*2);ctx.fill();ctx.restore();
    ctx.fillStyle="#fff";ctx.font="700 35px Arial";ctx.fillText("118 g",w/2,h*.95);
  },768,1200);
}

function makeCookieStamp() {
  return texture((ctx,w,h)=>{
    ctx.clearRect(0,0,w,h);ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillStyle="#30201b";ctx.font="900 210px Georgia,serif";ctx.fillText("OREO",w/2,h*.48);
    ctx.strokeStyle="#76503a";ctx.lineWidth=14;ctx.beginPath();ctx.arc(w/2,h/2,w*.39,0,Math.PI*2);ctx.stroke();
    for(let i=0;i<24;i++){const a=i/24*Math.PI*2;ctx.beginPath();ctx.arc(w/2+Math.cos(a)*w*.34,h/2+Math.sin(a)*h*.34,13,0,Math.PI*2);ctx.fillStyle="#76503a";ctx.fill();}
  },1024,1024);
}

function makeCookie() {
  const cookie=new THREE.Group();
  const biscuitMat=new THREE.MeshStandardMaterial({color:"#241713",roughness:.88});
  const creamMat=new THREE.MeshStandardMaterial({color:"#f4eee0",roughness:.72});
  const lower=new THREE.Mesh(new THREE.CylinderGeometry(.43,.43,.105,72),biscuitMat);lower.position.y=0;lower.castShadow=true;cookie.add(lower);
  const cream=new THREE.Mesh(new THREE.CylinderGeometry(.375,.375,.105,72),creamMat);cream.position.y=.095;cream.castShadow=true;cookie.add(cream);
  const upper=new THREE.Mesh(new THREE.CylinderGeometry(.43,.43,.105,72),biscuitMat);upper.position.y=.19;upper.castShadow=true;cookie.add(upper);
  const stamp=new THREE.Mesh(new THREE.CircleGeometry(.37,72),new THREE.MeshBasicMaterial({map:makeCookieStamp(),transparent:true,side:THREE.DoubleSide}));
  stamp.rotation.x=-Math.PI/2;stamp.position.y=.246;cookie.add(stamp);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.405,.018,8,72),new THREE.MeshStandardMaterial({color:"#6c4530",roughness:.9}));rim.rotation.x=Math.PI/2;rim.position.y=.246;cookie.add(rim);
  return cookie;
}

export function createOreoFamilySet(world: THREE.Scene): OreoFamilySet {
  world.background=new THREE.Color("#d9c9b4");world.fog=new THREE.Fog("#d9c9b4",15,30);
  const wallMat=new THREE.MeshStandardMaterial({color:"#ded2bf",roughness:1});
  const wall=new THREE.Mesh(new THREE.PlaneGeometry(13,9),wallMat);wall.position.set(0,2.25,-4.3);world.add(wall);
  const wallBand=new THREE.Mesh(new THREE.BoxGeometry(13,.14,.12),new THREE.MeshStandardMaterial({color:"#b7a58c",roughness:.85}));wallBand.position.set(0,-.52,-4.2);world.add(wallBand);
  // Warm kitchen window, soft afternoon light and simple family-home details.
  const windowFrame=new THREE.Mesh(new THREE.BoxGeometry(2.7,2.35,.12),new THREE.MeshStandardMaterial({color:"#fff7e8",roughness:.7}));windowFrame.position.set(-2.2,2.25,-4.05);world.add(windowFrame);
  const windowGlass=new THREE.Mesh(new THREE.PlaneGeometry(2.48,2.12),new THREE.MeshBasicMaterial({color:"#a9c9c9"}));windowGlass.position.set(-2.2,2.25,-3.97);world.add(windowGlass);
  const outside=new THREE.Mesh(new THREE.PlaneGeometry(2.48,2.12),new THREE.MeshBasicMaterial({color:"#c9d6b2"}));outside.position.set(-2.2,2.25,-4.0);world.add(outside);
  for(const x of [-3.47,-.93]){const bar=new THREE.Mesh(new THREE.BoxGeometry(.10,2.45,.14),new THREE.MeshStandardMaterial({color:"#fff7e8"}));bar.position.set(x,2.25,-3.88);world.add(bar);}
  const cross=new THREE.Mesh(new THREE.BoxGeometry(2.6,.09,.14),new THREE.MeshStandardMaterial({color:"#fff7e8"}));cross.position.set(-2.2,2.25,-3.86);world.add(cross);
  const curtainMat=new THREE.MeshStandardMaterial({color:"#c58d6a",roughness:1,side:THREE.DoubleSide});
  for(const x of [-3.78,-.62]){const curtain=new THREE.Mesh(new THREE.PlaneGeometry(.55,2.85),curtainMat);curtain.position.set(x,2.15,-3.78);world.add(curtain);}
  const frame=new THREE.Mesh(new THREE.BoxGeometry(.9,.62,.08),new THREE.MeshStandardMaterial({color:"#8c684e",roughness:.8}));frame.position.set(2.35,2.6,-4.0);world.add(frame);
  const photo=new THREE.Mesh(new THREE.PlaneGeometry(.78,.5),new THREE.MeshBasicMaterial({color:"#d9c7a8"}));photo.position.set(2.35,2.6,-3.94);world.add(photo);
  // Table with rounded-looking thick wood top and visible legs.
  const wood= new THREE.MeshStandardMaterial({color:"#a8754d",roughness:.78});
  const top=new THREE.Mesh(new THREE.BoxGeometry(7.6,.22,4.6),wood);top.position.set(0,-1.55,-.05);top.receiveShadow=true;top.castShadow=true;world.add(top);
  const grain=texture((ctx,w,h)=>{ctx.fillStyle="#a8754d";ctx.fillRect(0,0,w,h);for(let i=0;i<150;i++){ctx.strokeStyle=i%2?"rgba(65,35,18,.09)":"rgba(255,220,170,.10)";ctx.lineWidth=2+(i%4);ctx.beginPath();const y=(i*47)%h;ctx.moveTo(0,y);ctx.bezierCurveTo(w*.3,y-20,w*.7,y+18,w,y-8);ctx.stroke();}},1024,512);
  const topSurface=new THREE.Mesh(new THREE.PlaneGeometry(7.55,4.55),new THREE.MeshStandardMaterial({map:grain,roughness:.8}));topSurface.rotation.x=-Math.PI/2;topSurface.position.set(0,-1.425,-.05);world.add(topSurface);
  for(const x of [-3.35,3.35])for(const z of [-1.9,1.8]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.16,1.5,.16),wood);leg.position.set(x,-2.3,z);world.add(leg);}
  // Cozy lived-in kitchen: lower cabinetry, counter, a small plant and everyday details.
  const cabinetMat=new THREE.MeshStandardMaterial({color:"#b58a66",roughness:.82});
  const cabinetTop=new THREE.Mesh(new THREE.BoxGeometry(8.2,.16,.62),new THREE.MeshStandardMaterial({color:"#d4c5ae",roughness:.68}));cabinetTop.position.set(0,-.40,-3.55);world.add(cabinetTop);
  for(let i=0;i<5;i++){const x=-3.25+i*1.62;const door=new THREE.Mesh(new THREE.BoxGeometry(1.52,1.18,.12),cabinetMat);door.position.set(x,-1.20,-3.78);world.add(door);const inset=new THREE.Mesh(new THREE.BoxGeometry(1.36,1.02,.025),new THREE.MeshStandardMaterial({color:"#c69b76",roughness:.9}));inset.position.set(x,-1.20,-3.70);world.add(inset);const knob=new THREE.Mesh(new THREE.SphereGeometry(.045,16,12),new THREE.MeshStandardMaterial({color:"#b9a27d",metalness:.65,roughness:.3}));knob.position.set(x+.55,-1.2,-3.62);world.add(knob);}
  const shelf=new THREE.Mesh(new THREE.BoxGeometry(2.1,.10,.38),wood);shelf.position.set(2.25,1.15,-3.75);world.add(shelf);
  for(let i=0;i<3;i++){const jar=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,.38,24),new THREE.MeshPhysicalMaterial({color:"#e7dfcc",roughness:.28,transparent:true,opacity:.8}));jar.position.set(1.65+i*.55,1.40,-3.75);world.add(jar);}
  const plantPot=new THREE.Mesh(new THREE.CylinderGeometry(.16,.12,.28,24),new THREE.MeshStandardMaterial({color:"#b96e51",roughness:.9}));plantPot.position.set(3.0,.10,-3.45);world.add(plantPot);
  for(let i=0;i<5;i++){const leaf=new THREE.Mesh(new THREE.SphereGeometry(.12,12,10),new THREE.MeshStandardMaterial({color:"#66835b",roughness:1}));leaf.scale.set(.65,1.8,.45);leaf.position.set(3+Math.sin(i*1.25)*.15,.34+i%2*.08,-3.45+Math.cos(i*1.25)*.08);world.add(leaf);}
  // A ceramic plate is empty at the start. The cookie only appears after leaving the packet.
  const plate=new THREE.Group();plate.position.set(.62,-1.405,.82);world.add(plate);
  const plateMat=new THREE.MeshStandardMaterial({color:"#f3eee3",roughness:.28,metalness:.02});
  const plateBase=new THREE.Mesh(new THREE.CylinderGeometry(.78,.73,.075,96),plateMat);plateBase.position.y=0;plateBase.castShadow=true;plateBase.receiveShadow=true;plate.add(plateBase);
  const plateRim=new THREE.Mesh(new THREE.TorusGeometry(.68,.055,16,96),new THREE.MeshStandardMaterial({color:"#e4ded1",roughness:.3}));plateRim.rotation.x=Math.PI/2;plateRim.position.y=.055;plate.add(plateRim);
  const plateWell=new THREE.Mesh(new THREE.CircleGeometry(.61,96),new THREE.MeshStandardMaterial({color:"#f8f5ed",roughness:.36}));plateWell.rotation.x=-Math.PI/2;plateWell.position.y=.039;plate.add(plateWell);
  // Flexible-looking pillow pack: rounded body, gussets, sealed crimp and a visibly open mouth.
  const packet=new THREE.Group();packet.position.set(-1.28,-.73,.32);packet.rotation.z=-.10;packet.rotation.x=-.06;world.add(packet);
  const filmMat=new THREE.MeshStandardMaterial({map:makePackFront(),roughness:.39,metalness:.10});
  const packBody=new THREE.Mesh(new THREE.BoxGeometry(1.18,1.72,.19,8,12,2),filmMat);packBody.castShadow=true;packBody.receiveShadow=true;packet.add(packBody);
  const edgeMat=new THREE.MeshStandardMaterial({color:"#07509d",roughness:.42,metalness:.16});
  for(const sideX of [-.59,.59]){const gusset=new THREE.Mesh(new THREE.BoxGeometry(.075,1.62,.25),edgeMat);gusset.position.set(sideX,0,-.005);packet.add(gusset);}
  const bottomSeal=new THREE.Mesh(new THREE.BoxGeometry(1.22,.10,.22),edgeMat);bottomSeal.position.y=-.86;packet.add(bottomSeal);
  const backFoil=new THREE.Mesh(new THREE.BoxGeometry(1.12,.16,.24),new THREE.MeshStandardMaterial({color:"#a9c5d4",roughness:.28,metalness:.42}));backFoil.position.set(0,.82,-.015);packet.add(backFoil);
  const inner=new THREE.Mesh(new THREE.BoxGeometry(.98,.16,.20),new THREE.MeshStandardMaterial({color:"#172b39",roughness:.55,side:THREE.DoubleSide}));inner.position.set(0,.78,.015);packet.add(inner);
  const flap=new THREE.Group();flap.position.set(0,.78,.10);packet.add(flap);
  const flapMesh=new THREE.Mesh(new THREE.BoxGeometry(1.16,.30,.055),filmMat);flapMesh.position.set(0,.17,0);flap.add(flapMesh);
  const crimp=new THREE.Mesh(new THREE.BoxGeometry(1.20,.12,.24),edgeMat);crimp.position.set(0,.93,0);packet.add(crimp);
  const cookie=makeCookie();cookie.scale.setScalar(.58);world.add(cookie);
  // Glass of chocolate milk: translucent rim, cocoa-colored drink, soft highlights.
  const glass=new THREE.Group();glass.position.set(1.85,-1.42,.48);world.add(glass);
  const glassMat=new THREE.MeshPhysicalMaterial({color:"#eaf4f4",roughness:.08,metalness:0,transparent:true,opacity:.24,transmission:.55,thickness:.12,clearcoat:1,side:THREE.DoubleSide,depthWrite:false});
  const glassBody=new THREE.Mesh(new THREE.CylinderGeometry(.34,.29,.98,64,1,true),glassMat);glassBody.position.y=.49;glassBody.castShadow=true;glass.add(glassBody);
  const chocMat=new THREE.MeshStandardMaterial({color:"#68402a",roughness:.22,metalness:0});
  const drink=new THREE.Mesh(new THREE.CylinderGeometry(.285,.265,.73,64),chocMat);drink.position.y=.43;drink.castShadow=true;glass.add(drink);
  const meniscus=new THREE.Mesh(new THREE.CircleGeometry(.285,64),new THREE.MeshStandardMaterial({color:"#7b4d33",roughness:.2}));meniscus.rotation.x=-Math.PI/2;meniscus.position.y=.80;glass.add(meniscus);
  const rimGlass=new THREE.Mesh(new THREE.TorusGeometry(.32,.025,12,64),new THREE.MeshPhysicalMaterial({color:"#f5ffff",roughness:.1,transparent:true,opacity:.65,metalness:.05}));rimGlass.rotation.x=Math.PI/2;rimGlass.position.y=.99;glass.add(rimGlass);
  const straw=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.9,16),new THREE.MeshStandardMaterial({color:"#f0d8c2",roughness:.45}));straw.position.set(.10,.85,.02);straw.rotation.z=-.12;glass.add(straw);
  // A small folded napkin and a second cookie hint at a real shared family snack.
  const napkin=new THREE.Mesh(new THREE.BoxGeometry(.72,.018,.52),new THREE.MeshStandardMaterial({color:"#e8dfd0",roughness:1}));napkin.position.set(-.15,-1.405,1.55);napkin.rotation.y=.10;world.add(napkin);
  const key=new THREE.DirectionalLight("#ffe2bc",2.3);key.position.set(-3.5,6,5);key.castShadow=true;world.add(key);
  const fill=new THREE.DirectionalLight("#fff4df",1.0);fill.position.set(4,3,2);world.add(fill);
  const windowLight=new THREE.PointLight("#ffe5bd",35,16,2);windowLight.position.set(-2.2,3.1,-1.8);world.add(windowLight);
  world.add(new THREE.AmbientLight("#fff1dc",.48));
  const update=(time:number)=>{
    const clamp=(v:number)=>Math.max(0,Math.min(1,v));
    const smooth=(v:number)=>{const x=clamp(v);return x*x*(3-2*x);};
    const open=smooth((time-3.55)/.72);
    flap.rotation.x=-open*1.28;flap.rotation.z=-open*.12;
    // Cookie begins fully inside the package, rises through the open mouth,
    // clears the lip, travels in a gravity-driven arc, then lands and settles on the plate.
    const t=clamp((time-4.15)/2.25);
    const start=new THREE.Vector3(-1.28,-.34,.54);
    const mouth=new THREE.Vector3(-1.27,-.05,.62);
    const landing=new THREE.Vector3(.55,-1.32,.80);
    const lift=smooth(t);
    const x=THREE.MathUtils.lerp(mouth.x,landing.x,lift);
    const z=THREE.MathUtils.lerp(mouth.z,landing.z,lift);
    const arc=Math.sin(Math.PI*lift)*.66;
    const y=THREE.MathUtils.lerp(mouth.y,landing.y,lift)+arc;
    const inside=1-smooth((time-4.02)/.25);
    cookie.visible=time>=4.0;
    cookie.position.set(THREE.MathUtils.lerp(x,start.x,inside),THREE.MathUtils.lerp(y,start.y,inside),THREE.MathUtils.lerp(z,start.z,inside));
    const flight=smooth((time-4.15)/2.25);
    const spin=(1-flight)*.42;
    cookie.rotation.set(.12+flight*.03, .18+flight*.30, -.10+Math.sin(flight*Math.PI)*.12+spin);
    const land=smooth((time-6.18)/.42);
    const bounce=time>6.18?Math.sin((time-6.18)*17)*Math.exp(-(time-6.18)*5)*.055:0;
    cookie.position.y=THREE.MathUtils.lerp(cookie.position.y, -1.32+Math.max(0,bounce),land);
    cookie.rotation.z+=time>6.18?Math.sin((time-6.18)*12)*Math.exp(-(time-6.18)*4)*.08:0;
    const scale=.58;
    cookie.scale.setScalar(scale);
  };
  return {cookie,flap,update};
}

export function drawOreoFamilyOverlay(ctx:CanvasRenderingContext2D,time:number,width:number,height:number){
  const ease=(v:number)=>{const x=Math.max(0,Math.min(1,v));return 1-Math.pow(1-x,3);};
  const white="#fffdf8",lime="#d8f36a",scale=width/720;
  const rounded=(x:number,y:number,w:number,h:number,r:number)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,r);};
  const panel=(x:number,y:number,w:number,h:number,alpha=1)=>{
    ctx.save();ctx.globalAlpha=alpha;ctx.shadowColor="rgba(0,0,0,.28)";ctx.shadowBlur=18*scale;
    rounded(x,y,w,h,22*scale);ctx.fillStyle="rgba(8,24,38,.94)";ctx.fill();ctx.shadowBlur=0;
    ctx.strokeStyle="rgba(255,255,255,.34)";ctx.lineWidth=1.5*scale;ctx.stroke();
  };
  const fit=(text:string,maxWidth:number,base:number,min:number)=>{
    let size=base;ctx.font="900 "+Math.round(size)+"px Arial,Helvetica,sans-serif";
    while(ctx.measureText(text).width>maxWidth&&size>min){size-=1;ctx.font="900 "+Math.round(size)+"px Arial,Helvetica,sans-serif";}
    return size;
  };
  const brandW=width*.56,brandH=height*.052,brandX=(width-brandW)/2,brandY=height*.035;
  ctx.save();ctx.globalAlpha=ease(time/.28);rounded(brandX,brandY,brandW,brandH,brandH*.5);ctx.fillStyle="rgba(5,23,38,.93)";ctx.fill();ctx.strokeStyle="rgba(216,243,106,.75)";ctx.lineWidth=2*scale;ctx.stroke();ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle=white;ctx.font="900 "+Math.round(width*.039)+"px Arial";ctx.fillText("INGREDORA.COM",width/2,brandY+brandH/2,brandW*.88);ctx.restore();

  if(time<3.05){
    const x=width*.07,y=height*.565,w=width*.86,h=height*.225;panel(x,y,w,h,ease(time/.28));
    ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle=white;
    const fs=fit("¿CUÁNTO SABÉS DE LO QUE COMÉS?",w*.88,width*.058,width*.043);ctx.font="900 "+Math.round(fs)+"px Arial";
    ctx.fillText("¿CUÁNTO SABÉS DE",width/2,y+h*.32,w*.88);
    ctx.fillText("LO QUE COMÉS?",width/2,y+h*.56,w*.88);
    ctx.fillStyle=lime;ctx.font="900 "+Math.round(width*.046)+"px Arial";ctx.fillText("PONÉ A PRUEBA LO QUE SABÉS",width/2,y+h*.81,w*.88);
    ctx.restore();return;
  }
  if(time<6.1){
    const x=width*.08,y=height*.70,w=width*.84,h=height*.12;panel(x,y,w,h,ease((time-3.05)/.25));
    ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle=white;ctx.font="900 "+Math.round(width*.052)+"px Arial";ctx.fillText("HOY: OREO ORIGINAL",width/2,y+h*.5,w*.88);ctx.restore();return;
  }
  if(time<11){
    const x=width*.07,y=height*.70,w=width*.86,h=height*.13;panel(x,y,w,h,ease((time-6.1)/.2));
    ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle=white;const line=time<9?"MIRÁ BIEN ESTA GALLETITA":"¿QUÉ INGREDIENTES TIENE?";ctx.font="900 "+Math.round(width*.047)+"px Arial";ctx.fillText(line,width/2,y+h*.5,w*.88);ctx.restore();return;
  }
  if(time<17){
    const x=width*.18,y=height*.665,w=width*.64,h=height*.19;panel(x,y,w,h,ease((time-11)/.18));
    const remain=Math.max(1,6-Math.floor(time-11));ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle=lime;ctx.font="900 "+Math.round(width*.13)+"px Arial";ctx.fillText(String(remain),width/2,y+h*.49);
    ctx.fillStyle=white;ctx.font="800 "+Math.round(width*.033)+"px Arial";ctx.fillText("SEGUNDOS PARA RESPONDER",width/2,y+h*.83,w*.9);ctx.restore();return;
  }
  if(time<22){
    const x=width*.045,y=height*.665,w=width*.91,h=height*.265;panel(x,y,w,h,ease((time-17)/.2));
    ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle=lime;ctx.font="900 "+Math.round(width*.033)+"px Arial";ctx.fillText("¿QUÉ TIENE OREO ORIGINAL?",width/2,y+h*.105,w*.9);
    const items=["AZÚCAR","HARINA DE TRIGO ENRIQUECIDA","ACEITE VEGETAL Y CACAO","JARABE DE MAÍZ Y ALMIDÓN","SAL Y BICARBONATOS","LECITINA DE SOJA Y VAINILLINA"];
    const cellW=w*.46,cellH=h*.205,gap=w*.025,startY=y+h*.25;
    items.forEach((item,i)=>{
      const col=i%2,row=Math.floor(i/2),cx=x+col*(cellW+gap),cy=startY+row*(cellH+h*.035);
      rounded(cx,cy,cellW,cellH,9*scale);ctx.fillStyle="rgba(255,255,255,.09)";ctx.fill();
      ctx.textAlign="left";ctx.textBaseline="middle";ctx.fillStyle=lime;ctx.font="900 "+Math.round(width*.023)+"px Arial";ctx.fillText(String(i+1).padStart(2,"0"),cx+cellW*.045,cy+cellH*.5);
      const tx=cx+cellW*.16,tw=cellW*.80;let fs=width*.025;ctx.font="800 "+Math.round(fs)+"px Arial";
      while(ctx.measureText(item).width>tw&&fs>width*.018){fs-=.5;ctx.font="800 "+Math.round(fs)+"px Arial";}
      ctx.fillStyle=white;ctx.fillText(item,tx,cy+cellH*.5,tw);
    });
    ctx.restore();return;
  }
  const x=width*.07,y=height*.57,w=width*.86,h=height*.25;panel(x,y,w,h,ease((time-22)/.25));
  ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle=white;ctx.font="800 "+Math.round(width*.035)+"px Arial";ctx.fillText("¿CUÁNTOS ACERTASTE?",width/2,y+h*.24,w*.88);
  ctx.fillStyle=lime;ctx.font="900 "+Math.round(width*.075)+"px Arial";ctx.fillText("INGREDORA.COM",width/2,y+h*.55,w*.9);
  ctx.fillStyle=white;ctx.font="800 "+Math.round(width*.039)+"px Arial";ctx.fillText("¡ENTRÁ Y JUGÁ!",width/2,y+h*.82,w*.88);ctx.restore();
}
