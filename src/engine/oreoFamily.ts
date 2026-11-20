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
    const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,"#1678cf");g.addColorStop(.48,"#0754a8");g.addColorStop(1,"#073878");
    ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    for(let i=0;i<34;i++){ctx.fillStyle="rgba(255,255,255,.045)";ctx.beginPath();ctx.ellipse(w*.5,h*.52,i*21+120,i*9+40,-.2,0,Math.PI*2);ctx.fill();}
    ctx.save();ctx.translate(w/2,h*.39);ctx.rotate(-.045);
    ctx.fillStyle="#fff";ctx.shadowColor="rgba(0,0,0,.28)";ctx.shadowBlur=28;ctx.font="italic 900 208px Georgia,serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("OREO",0,0,850);
    ctx.shadowBlur=0;ctx.strokeStyle="#123d83";ctx.lineWidth=8;ctx.strokeText("OREO",0,0,850);
    ctx.restore();
    ctx.textAlign="center";ctx.fillStyle="#fff";ctx.font="800 58px Arial";ctx.fillText("GALLETITAS RELLENAS",w/2,h*.57);
    ctx.font="700 43px Arial";ctx.fillText("SABOR ORIGINAL",w/2,h*.65);
    ctx.fillStyle="#f5eee0";ctx.beginPath();ctx.arc(w*.5,h*.82,118,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#30201b";ctx.beginPath();ctx.arc(w*.5,h*.82,102,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(w*.5,h*.82,58,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#fff";ctx.font="700 35px Arial";ctx.fillText("118 g",w/2,h*.96);
    ctx.strokeStyle="rgba(255,255,255,.7)";ctx.lineWidth=14;ctx.strokeRect(14,14,w-28,h-28);
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
  world.background=new THREE.Color("#e8d8c0");world.fog=new THREE.Fog("#e8d8c0",13,27);
  const wallMat=new THREE.MeshStandardMaterial({color:"#e8ddca",roughness:1});
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
  // Oreo packet, resting upright at a slight angle with a torn/open top.
  const packet=new THREE.Group();packet.position.set(-.83,-.62,.42);packet.rotation.z=-.08;packet.rotation.x=-.05;world.add(packet);
  const packBody=new THREE.Mesh(new THREE.BoxGeometry(1.12,1.72,.12),new THREE.MeshStandardMaterial({map:makePackFront(),roughness:.55,metalness:.04}));packBody.castShadow=true;packBody.receiveShadow=true;packet.add(packBody);
  const side=new THREE.Mesh(new THREE.BoxGeometry(1.12,1.72,.035),new THREE.MeshStandardMaterial({color:"#07509d",roughness:.55}));side.position.z=-.078;packet.add(side);
  const foil=new THREE.MeshStandardMaterial({color:"#8ab7d8",roughness:.28,metalness:.35});
  const opening=new THREE.Mesh(new THREE.BoxGeometry(1.02,.045,.18),foil);opening.position.set(0,.87,.02);packet.add(opening);
  const flap=new THREE.Group();flap.position.set(0,.82,.04);packet.add(flap);
  const flapMesh=new THREE.Mesh(new THREE.BoxGeometry(1.08,.38,.06),new THREE.MeshStandardMaterial({color:"#1269bb",roughness:.52}));flapMesh.position.set(0,.18,0);flap.add(flapMesh);
  const cookie=makeCookie();cookie.position.set(-.05,-.52,.48);cookie.scale.setScalar(.83);world.add(cookie);
  // Glass of chocolate milk: translucent rim, cocoa-colored drink, soft highlights.
  const glass=new THREE.Group();glass.position.set(1.05,-1.42,.38);world.add(glass);
  const glassMat=new THREE.MeshPhysicalMaterial({color:"#eaf4f4",roughness:.08,metalness:0,transparent:true,opacity:.24,transmission:.55,thickness:.12,clearcoat:1,side:THREE.DoubleSide,depthWrite:false});
  const glassBody=new THREE.Mesh(new THREE.CylinderGeometry(.34,.29,.98,64,1,true),glassMat);glassBody.position.y=.49;glassBody.castShadow=true;glass.add(glassBody);
  const chocMat=new THREE.MeshStandardMaterial({color:"#68402a",roughness:.22,metalness:0});
  const drink=new THREE.Mesh(new THREE.CylinderGeometry(.285,.265,.73,64),chocMat);drink.position.y=.43;drink.castShadow=true;glass.add(drink);
  const meniscus=new THREE.Mesh(new THREE.CircleGeometry(.285,64),new THREE.MeshStandardMaterial({color:"#7b4d33",roughness:.2}));meniscus.rotation.x=-Math.PI/2;meniscus.position.y=.80;glass.add(meniscus);
  const rimGlass=new THREE.Mesh(new THREE.TorusGeometry(.32,.025,12,64),new THREE.MeshPhysicalMaterial({color:"#f5ffff",roughness:.1,transparent:true,opacity:.65,metalness:.05}));rimGlass.rotation.x=Math.PI/2;rimGlass.position.y=.99;glass.add(rimGlass);
  const straw=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.9,16),new THREE.MeshStandardMaterial({color:"#f0d8c2",roughness:.45}));straw.position.set(.10,.85,.02);straw.rotation.z=-.12;glass.add(straw);
  // A small folded napkin and a second cookie hint at a real shared family snack.
  const napkin=new THREE.Mesh(new THREE.BoxGeometry(.85,.025,.7),new THREE.MeshStandardMaterial({color:"#eee5d7",roughness:1}));napkin.position.set(.08,-1.30,.85);napkin.rotation.y=.12;world.add(napkin);
  const spare=makeCookie();spare.scale.setScalar(.52);spare.position.set(.10,-1.26,.86);spare.rotation.set(.04,.25,0);world.add(spare);
  const key=new THREE.DirectionalLight("#ffe2bc",2.3);key.position.set(-3.5,6,5);key.castShadow=true;world.add(key);
  const fill=new THREE.DirectionalLight("#fff4df",1.0);fill.position.set(4,3,2);world.add(fill);
  const windowLight=new THREE.PointLight("#ffe5bd",35,16,2);windowLight.position.set(-2.2,3.1,-1.8);world.add(windowLight);
  world.add(new THREE.AmbientLight("#fff1dc",.48));
  const update=(time:number)=>{
    const ease=(v:number)=>{const x=Math.max(0,Math.min(1,v));return x*x*(3-2*x);};
    const open=ease((time-3.55)/.62);
    flap.rotation.x=-open*1.05;
    flap.rotation.z=-open*.08;
    const emerge=ease((time-4.0)/2.35);
    cookie.position.set(-.88+emerge*.98,-1.08+emerge*.015,.48+emerge*.58);
    cookie.rotation.set(.08+emerge*.10,.2+emerge*.18, -.12+emerge*.12);
    const settle=ease((time-6.35)/.45);
    cookie.position.y+=settle*.012;
    const pulse=time>9&&time<17?1+Math.sin(time*3)*.012:1;
    cookie.scale.setScalar(.83*pulse);
  };
  return {cookie,flap,update};
}

export function drawOreoFamilyOverlay(ctx:CanvasRenderingContext2D,time:number,width:number,height:number){
  const ease=(v:number)=>{const x=Math.max(0,Math.min(1,v));return 1-Math.pow(1-x,3);};
  const smooth=(v:number)=>{const x=Math.max(0,Math.min(1,v));return x*x*(3-2*x);};
  const round=(x:number,y:number,w:number,h:number,r:number)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,r);};
  const white="#fffdf8",blue="#1678d0",lime="#d8f36a";
  // Brand remains visible in a compact top-safe signature.
  const brandY=height*.038,brandW=width*.64,brandH=height*.055,brandX=(width-brandW)/2;
  ctx.save();ctx.globalAlpha=ease(time/.3);
  round(brandX,brandY,brandW,brandH,brandH*.5);ctx.fillStyle="rgba(5,28,54,.9)";ctx.fill();
  ctx.strokeStyle="rgba(255,255,255,.55)";ctx.lineWidth=2;ctx.stroke();
  ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="900 "+Math.round(width*.042)+"px Arial";ctx.fillStyle=white;ctx.fillText("INGREDORA.COM",width/2,brandY+brandH*.52);
  ctx.restore();
  const panel=(y:number,h:number,alpha:number)=>{
    ctx.save();ctx.globalAlpha=alpha;round(width*.055,y,width*.89,h,h*.16);ctx.fillStyle="rgba(4,20,37,.88)";ctx.fill();ctx.strokeStyle="rgba(255,255,255,.4)";ctx.lineWidth=2;ctx.stroke();
  };
  if(time<3.05){
    const p=ease(time/.35);panel(height*.55,height*.23,p);
    ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle=white;ctx.font="900 "+Math.round(width*.064)+"px Arial";
    ctx.fillText("¿CUÁNTO SABÉS DE",width/2,height*.605,width*.82);ctx.fillText("LO QUE COMÉS?",width/2,height*.685,width*.82);
    ctx.fillStyle=lime;ctx.font="900 "+Math.round(width*.066)+"px Arial";ctx.fillText("¡JUGÁ EN INGREDORA!",width/2,height*.755,width*.84);
    ctx.restore();return;
  }
  if(time<6.1){
    const p=ease((time-3.05)/.35);panel(height*.70,height*.12,p);
    ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle=white;ctx.font="900 "+Math.round(width*.062)+"px Arial";ctx.fillText("HOY: OREO ORIGINAL",width/2,height*.76,width*.82);
    ctx.restore();return;
  }
  if(time<11){
    const p=ease((time-6.1)/.25);panel(height*.70,height*.13,p);
    ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle=white;ctx.font="900 "+Math.round(width*.054)+"px Arial";ctx.fillText(time<9?"MIRÁ BIEN ESTA GALLETITA":"¿QUÉ INGREDIENTES TIENE?",width/2,height*.755,width*.82);
    ctx.restore();return;
  }
  if(time<17){
    const remain=Math.max(0,6-Math.floor(time-11));
    const p=ease((time-11)/.2);panel(height*.67,height*.18,p);
    ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle=lime;ctx.font="900 "+Math.round(width*.13)+"px Arial";ctx.fillText(String(remain),width/2,height*.735);
    ctx.fillStyle=white;ctx.font="800 "+Math.round(width*.037)+"px Arial";ctx.fillText("TENÉS 6 SEGUNDOS",width/2,height*.81);
    ctx.restore();return;
  }
  if(time<22){
    const items=["AZÚCAR Y HARINA DE TRIGO ENRIQUECIDA","ACEITE VEGETAL Y CACAO EN POLVO","JARABE DE MAÍZ DE ALTA FRUCTOSA","ALMIDÓN Y SAL","LEUDANTES: BICARBONATOS","LECITINA DE SOJA Y VAINILLINA"];
    const idx=Math.min(5,Math.floor((time-17)*1.2));
    panel(height*.70,height*.205,ease((time-17)/.25));
    ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle=lime;ctx.font="800 "+Math.round(width*.026)+"px Arial";ctx.fillText("INGREDIENTES · "+(idx+1)+"/6,width/2,height*.735);
    ctx.fillStyle=white;ctx.font="900 "+Math.round(width*.043)+"px Arial";ctx.fillText(items[idx],width/2,height*.80,width*.80);
    ctx.fillStyle="rgba(255,255,255,.55)";round(width*.13,height*.875,width*.74,height*.006,height*.003);ctx.fill();ctx.fillStyle=lime;round(width*.13,height*.875,width*.74*((time-17)/5),height*.006,height*.003);ctx.fill();
    ctx.restore();return;
  }
  // Final conversion panel, with clear action and URL.
  const p=ease((time-22)/.35);ctx.save();ctx.globalAlpha=p;
  const shade=ctx.createLinearGradient(0,height*.38,0,height*.93);shade.addColorStop(0,"rgba(3,18,35,0)");shade.addColorStop(.35,"rgba(3,18,35,.72)");shade.addColorStop(1,"rgba(3,18,35,.94)");ctx.fillStyle=shade;ctx.fillRect(0,height*.38,width,height*.62);
  round(width*.07,height*.57,width*.86,height*.25,height*.035);ctx.fillStyle="rgba(4,25,48,.94)";ctx.fill();ctx.strokeStyle="rgba(255,255,255,.45)";ctx.lineWidth=2;ctx.stroke();
  ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle=white;ctx.font="800 "+Math.round(width*.036)+"px Arial";ctx.fillText("¿CUÁNTOS ACERTASTE?",width/2,height*.625,width*.8);
  ctx.fillStyle=lime;ctx.font="900 "+Math.round(width*.083)+"px Arial";ctx.fillText("INGREDORA.COM",width/2,height*.70,width*.83);
  ctx.fillStyle=white;ctx.font="800 "+Math.round(width*.04)+"px Arial";ctx.fillText("¡ENTRÁ Y JUGÁ!",width/2,height*.765,width*.8);
  ctx.restore();
}
