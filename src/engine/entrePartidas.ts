import * as THREE from "three";

export type EntrePartidasCue = {
  speaker: "bruno" | "martina" | "valentina";
  text: string;
  start: number;
  end: number;
  look?: "bruno" | "martina" | "valentina";
};
type CharacterRig = {
  root: THREE.Group; head: THREE.Group; mouth: THREE.Mesh;
  leftArm: THREE.Group; rightArm: THREE.Group;
  leftLeg: THREE.Group; rightLeg: THREE.Group;
  name: EntrePartidasCue["speaker"];
};
export type EntrePartidasSet = {
  update(time: number, dialogue: EntrePartidasCue[]): void;
};

const mat = (color: string, roughness = .78, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });
const box = (parent: THREE.Object3D, size: [number,number,number], material: THREE.Material,
  position: [number,number,number], cast = true) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position); mesh.castShadow = cast; mesh.receiveShadow = true;
  parent.add(mesh); return mesh;
};
const texture = (draw: (ctx: CanvasRenderingContext2D,w:number,h:number)=>void,w=256,h=384) => {
  const canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext("2d");if(!ctx)throw new Error("No se pudo crear la textura del supermercado.");
  draw(ctx,w,h);const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=8;return map;
};

function makeCharacter(name: EntrePartidasCue["speaker"], x: number, z: number): CharacterRig {
  const root=new THREE.Group();root.position.set(x,-1.93,z);
  const skin=mat(name==="bruno"?"#c98e6e":name==="martina"?"#d6a080":"#e0ad8b");
  const hair=mat(name==="bruno"?"#30241f":name==="martina"?"#30201c":"#211b1a");
  const shirt=mat(name==="bruno"?"#c46a43":name==="martina"?"#b5a06c":"#416c80");
  const pants=mat(name==="bruno"?"#34404c":name==="martina"?"#4b4948":"#343b43");
  const shoes=mat("#222528",.56);
  // Individual silhouettes and wardrobe, not three recolours of one model.
  if(name==="bruno"){
    box(root,[.76,.88,.43],shirt,[0,1.25,0]);
    box(root,[.68,.34,.39],mat("#a95637"),[0,1.72,0]);
  } else if(name==="martina"){
    box(root,[.70,.86,.40],shirt,[0,1.26,0]);
    box(root,[.82,.38,.44],mat("#8d805c"),[0,.86,0]);
    box(root,[.18,.60,.12],mat("#d8c99c"),[0,1.27,.22]);
  } else {
    box(root,[.72,.88,.42],shirt,[0,1.26,0]);
    box(root,[.78,.20,.44],mat("#294b5c"),[0,1.62,0]);
    box(root,[.12,.68,.10],mat("#d9e1df"),[0,1.25,.23]);
  }
  box(root,[.22,.20,.22],skin,[0,1.77,0],false);
  const head=new THREE.Group();head.position.set(0,2.12,0);root.add(head);
  box(head,[.68,.68,.60],skin,[0,0,0]);
  // Hair profiles distinguish the cast even in a medium shot.
  if(name==="bruno"){
    box(head,[.72,.19,.64],hair,[0,.31,-.015]);
    box(head,[.22,.18,.64],hair,[-.24,.22,.01]);
    box(head,[.18,.11,.58],hair,[.16,.35,.02]);
  } else if(name==="martina"){
    box(head,[.72,.16,.65],hair,[0,.33,-.02]);
    box(head,[.15,.64,.60],hair,[-.30,-.08,-.01]);
    box(head,[.15,.58,.60],hair,[.30,-.10,-.01]);
    box(head,[.38,.12,.62],hair,[-.08,.22,.02]);
  } else {
    box(head,[.72,.17,.65],hair,[0,.33,-.02]);
    box(head,[.17,.66,.62],hair,[-.29,-.09,-.01]);
    box(head,[.17,.66,.62],hair,[.29,-.09,-.01]);
    box(head,[.42,.13,.64],hair,[.05,.23,.02]);
  }
  const eyeWhite=mat("#fff8e9"), pupil=mat("#25201e"), brow=mat(name==="bruno"?"#30241f":"#211b1a");
  for(const side of [-1,1]){
    box(head,[.13,.10,.025],eyeWhite,[side*.16,.045,.309],false);
    box(head,[.052,.075,.02],pupil,[side*.16,.035,.33],false);
    box(head,[.15,.04,.025],brow,[side*.16,.16,.31],false);
  }
  box(head,[.07,.08,.06],skin,[0,-.055,.33],false);
  const mouth=box(head,[.17,.055,.025],mat("#743f3a"),[0,-.20,.314],false);
  const arm=(side:number)=>{
    const pivot=new THREE.Group();pivot.position.set(side*.42,1.58,0);root.add(pivot);
    box(pivot,[.22,.46,.23],shirt,[0,-.15,0]);
    box(pivot,[.18,.42,.19],skin,[0,-.56,.015]);
    box(pivot,[.18,.16,.19],skin,[0,-.78,.025]);return pivot;
  };
  const leg=(side:number)=>{
    const pivot=new THREE.Group();pivot.position.set(side*.20,.70,0);root.add(pivot);
    box(pivot,[.25,.58,.28],pants,[0,-.27,0]);
    box(pivot,[.30,.17,.42],shoes,[0,-.60,.07]);return pivot;
  };
  return {root,head,mouth,leftArm:arm(-1),rightArm:arm(1),leftLeg:leg(-1),rightLeg:leg(1),name};
}

export function createEntrePartidasSet(world: THREE.Scene): EntrePartidasSet {
  world.background=new THREE.Color("#d9d5ca");world.fog=new THREE.Fog("#d9d5ca",22,48);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(32,38),mat("#b8b4a9",.92));
  floor.rotation.x=-Math.PI/2;floor.position.set(0,-1.96,-4);floor.receiveShadow=true;world.add(floor);
  // Supermarket aisle: long, repeated gondolas with detailed packaging, price rails and depth.
  const steel=mat("#34413e",.42,.48),edge=mat("#c1c4bd",.34,.62),dark=mat("#26312e",.62,.2);
  const palette=[
    ["#d5b34d","#573b22","GALLETITAS"],["#66866d","#f5e8c9","PASTA"],["#bd4e3c","#fff0d5","SALSA"],
    ["#54718a","#f7e7c5","LECHE"],["#c98c4e","#4c3021","CEREAL"],["#8a6b8d","#fff1dc","SNACK"],
    ["#e3d8bd","#334b3c","AVENA"],["#6c7d50","#fff0d4","ARROZ"]
  ];
  const packMats=palette.map(([base,accent,label],i)=>new THREE.MeshStandardMaterial({map:texture((ctx,w,h)=>{
    ctx.fillStyle=base;ctx.fillRect(0,0,w,h);
    const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,"rgba(255,255,255,.30)");g.addColorStop(1,"rgba(0,0,0,.18)");ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    ctx.fillStyle=accent;ctx.fillRect(0,h*.12,w,h*.23);ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillStyle="#fffaf0";ctx.font="900 35px Arial";ctx.fillText(label,w/2,h*.235,w*.9);
    ctx.fillStyle=accent;ctx.font="700 18px Arial";ctx.fillText(["CLÁSICAS","SELECCIÓN","TRADICIONAL"][i%3],w/2,h*.56,w*.9);
    ctx.fillStyle="rgba(255,255,255,.86)";ctx.font="600 12px Arial";ctx.fillText("CONT. NETO",w/2,h*.87);
    ctx.strokeStyle="rgba(255,255,255,.5)";ctx.lineWidth=5;ctx.strokeRect(7,7,w-14,h-14);
  }),roughness:.62}));
  const priceMats=Array.from({length:12},(_,i)=>new THREE.MeshBasicMaterial({map:texture((ctx,w,h)=>{
    ctx.fillStyle=i%4===0?"#fff0bd":"#f7f6ed";ctx.fillRect(0,0,w,h);
    ctx.fillStyle=i%4===0?"#c7352c":"#33423b";ctx.fillRect(0,0,w,22);
    ctx.fillStyle="#fff";ctx.font="800 15px Arial";ctx.fillText(i%4===0?"OFERTA":"PRECIO",10,16);
    ctx.fillStyle="#252923";ctx.font="900 38px Arial";ctx.fillText(["$ 1.890","$ 2.450","$ 3.190","$ 1.250"][i%4],10,70);
  },256,84),side:THREE.DoubleSide}));
  for(const side of [-1,1]){
    const x=side*4.1;
    box(world,[.18,5.2,22],steel,[x,.65,-5]);
    for(let row=0;row<5;row++){
      const y=-1.42+row*1.02;
      box(world,[1.55,.10,21],steel,[x-side*.78,y,-5]);
      box(world,[1.55,.045,21],edge,[x-side*.78,y-.075,-5]);
      for(let depth=0;depth<2;depth++)for(let i=0;i<20;i++){
        const index=(i*3+row*5+depth*2+(side>0?1:0))%packMats.length;
        const h=.38+((i+row+depth)%4)*.07,w=.31+(i%3)*.025;
        const pack=new THREE.Mesh(new THREE.BoxGeometry(w,h,.30),packMats[index]);
        pack.position.set(x-side*(.28+depth*.48),y+.08+h/2,-14+i*.95);
        pack.castShadow=true;pack.receiveShadow=true;world.add(pack);
      }
      const rail=box(world,[1.6,.20,.075],edge,[x-side*.78,y-.18,5.42],false);
      rail.material=steel;
      for(let i=0;i<12;i++){
        const tag=new THREE.Mesh(new THREE.PlaneGeometry(.40,.18),priceMats[(i+row*3)%12]);
        tag.position.set(x-side*(.25+i*.105),y-.18,5.36);world.add(tag);
      }
    }
    box(world,[.22,5.7,.26],edge,[x,1,-5]);
    box(world,[1.55,.30,21],steel,[x-side*.78,3.42,-5]);
  }
  // End-of-aisle architecture, ceiling light panels and subtle warm/cool contrast.
  const ceiling=box(world,[9,.18,24],mat("#eee9dc",.9),[0,5.0,-5],false);
  ceiling.material.side=THREE.DoubleSide;
  for(let i=0;i<5;i++){
    const panel=new THREE.Mesh(new THREE.BoxGeometry(1.35,.035,4.8),new THREE.MeshBasicMaterial({color:"#fff7e5"}));
    panel.position.set(-3.2+i*1.6,4.88,-5.4);world.add(panel);
  }
  box(world,[8,.24,.45],mat("#e9e4d7"),[0,3.72,-15],false);
  // A few distant aisle signs create readable scale without visual clutter.
  const signMat=new THREE.MeshBasicMaterial({map:texture((ctx,w,h)=>{
    ctx.fillStyle="#314a40";ctx.fillRect(0,0,w,h);ctx.fillStyle="#f6f0df";
    ctx.font="900 52px Arial";ctx.textAlign="center";ctx.fillText("ALMACÉN",w/2,h*.57);
  },512,160)});
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(2.8,.85),signMat);sign.position.set(0,3.05,-12.2);world.add(sign);
  // A trolley with a recognisable metal basket and four grounded wheels.
  const cart=new THREE.Group();cart.position.set(1.25,-1.93,.65);world.add(cart);
  const metal=mat("#aab2b1",.26,.78);
  box(cart,[1.05,.08,.78],metal,[0,.88,0]);
  for(const x of [-.48,.48])for(const z of [-.34,.34]){
    box(cart,[.035,.62,.035],metal,[x,1.19,z]);
    const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.085,.085,.065,20),mat("#303638",.55));
    wheel.rotation.z=Math.PI/2;wheel.position.set(x,.12,z);cart.add(wheel);
  }
  for(let y=.96;y<1.48;y+=.13)box(cart,[.98,.022,.72],metal,[0,y,0]);
  box(cart,[1.08,.06,.07],mat("#303a3a"),[0,1.55,-.40]);
  // Two packets Bruno is comparing; the trolley remains visibly empty for the final joke.
  const packetMat=new THREE.MeshStandardMaterial({map:packMats[0].map,roughness:.68});
  const packet=new THREE.Group();packet.position.set(-.50,1.92,.46);packet.rotation.y=-.10;world.add(packet);
  box(packet,[.42,.60,.10],packetMat,[0,0,0]);
  const packet2=new THREE.Group();packet2.position.set(.34,1.80,.43);packet2.rotation.y=.12;world.add(packet2);
  box(packet2,[.38,.53,.10],packMats[2],[0,0,0]);
  const bruno=makeCharacter("bruno",-.55,.20);
  const martina=makeCharacter("martina",-5.25,-.10);
  const valentina=makeCharacter("valentina",5.25,-.10);
  world.add(bruno.root,martina.root,valentina.root);
  // Cinematic commercial lighting: soft overhead, warm key, cool rim, contact shadows.
  world.add(new THREE.HemisphereLight(0xf8f3e7,0x666d68,1.45));
  const key=new THREE.SpotLight(0xffe5c6,62,30,Math.PI/4,.62,1.25);
  key.position.set(-3.8,7.5,5.5);key.target.position.set(0,.2,-1);key.castShadow=true;world.add(key,key.target);
  const fill=new THREE.DirectionalLight(0xd9e7ed,1.45);fill.position.set(5,4,2);world.add(fill);
  const rim=new THREE.DirectionalLight(0xffd5a0,1.15);rim.position.set(0,4,-8);world.add(rim);
  const update=(time:number,dialogue:EntrePartidasCue[])=>{
    const cue=dialogue.find(c=>time>=c.start&&time<=c.end);
    const speaker=cue?.speaker;
    const walkT=Math.max(0,Math.min(1,(time-10)/5));
    const ease=(v:number)=>v*v*(3-2*v);
    martina.root.position.x=-5.25+3.05*ease(walkT);
    valentina.root.position.x=5.25-3.05*ease(walkT);
    for(const rig of [bruno,martina,valentina]){
      const talking=rig.name===speaker;
      const target=cue?.look===rig.name?-.16:cue?.look?.length? .10:0;
      rig.head.rotation.y=target+Math.sin(time*.7+(rig.name==="bruno"?0:rig.name==="martina"?1:2))*.018;
      rig.head.rotation.x=talking?Math.sin(time*7)*.025:Math.sin(time*.9)*.008;
      rig.mouth.scale.y=talking?.65+Math.abs(Math.sin(time*10))*.75:.12;
      rig.leftArm.rotation.z=talking?-.10+Math.sin(time*3.4)*.055:Math.sin(time*.8)*.018;
      rig.rightArm.rotation.z=talking?.12+Math.sin(time*3.1)*.045:Math.sin(time*.9)*.016;
      rig.root.position.y=-1.93+Math.sin(time*.9+(rig.name==="bruno"?0:1.7))*.006;
    }
    if(time<10){
      bruno.head.rotation.x=-.12; bruno.rightArm.rotation.z=-.38;
      packet.rotation.z=Math.sin(time*1.5)*.018;
    }
    if(time>=10&&time<15){
      const stride=Math.sin((time-10)*5.4)*.18*(1-ease((time-14.5)/.5));
      for(const rig of [martina,valentina]){
        rig.leftLeg.rotation.x=stride;rig.rightLeg.rotation.x=-stride;
        rig.leftArm.rotation.x=-stride*.55;rig.rightArm.rotation.x=stride*.55;
      }
    } else {
      for(const rig of [martina,valentina]){
        rig.leftLeg.rotation.x=0;rig.rightLeg.rotation.x=0;
        rig.leftArm.rotation.x=0;rig.rightArm.rotation.x=0;
      }
    }
    if(time>=46&&time<55){valentina.rightArm.rotation.z=.24;}
    cart.position.x=1.25;
  };
  return {update};
}

export function drawEntrePartidasCaptions(ctx:CanvasRenderingContext2D,time:number,width:number,height:number,dialogue:EntrePartidasCue[]){
  const cue=dialogue.find(item=>time>=item.start&&time<=item.end);if(!cue)return;
  const names={bruno:"BRUNO",martina:"MARTINA",valentina:"VALENTINA"};
  const scale=width/720,boxW=width*.88,boxH=height*.105,x=(width-boxW)/2,y=height*.835;
  ctx.save();ctx.globalAlpha=.94;
  ctx.fillStyle="rgba(18,25,24,.86)";ctx.beginPath();ctx.roundRect(x,y,boxW,boxH,16*scale);ctx.fill();
  ctx.fillStyle="#d5e8b2";ctx.font=`900 ${Math.round(22*scale)}px Arial`;ctx.textAlign="left";ctx.textBaseline="middle";
  ctx.fillText(names[cue.speaker],x+24*scale,y+boxH*.30);
  ctx.fillStyle="#fffaf0";ctx.font=`700 ${Math.round(29*scale)}px Arial`;
  const words=cue.text.split(/\\s+/);let line="",lines:string[]=[];
  for(const word of words){const candidate=line?line+" "+word:word;if(ctx.measureText(candidate).width>boxW-48*scale&&line){lines.push(line);line=word;}else line=candidate;}
  if(line)lines.push(line);const lineH=34*scale;
  lines.slice(0,2).forEach((value,i)=>ctx.fillText(value,x+24*scale,y+boxH*.65+i*lineH));
  ctx.restore();
}
