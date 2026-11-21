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
  getSpeakerPosition(speaker: EntrePartidasCue["speaker"]): THREE.Vector3;
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
  const root=new THREE.Group();root.position.set(x,-1.975,z);
  const skin=mat(name==="bruno"?"#c98e6e":name==="martina"?"#d6a080":"#e0ad8b");
  const hair=mat(name==="bruno"?"#30241f":name==="martina"?"#30201c":"#211b1a");
  const shirt=mat(name==="bruno"?"#c46a43":name==="martina"?"#b5a06c":"#416c80");
  const pants=mat(name==="bruno"?"#34404c":name==="martina"?"#4b4948":"#343b43");
  const shoes=mat("#222528",.56);
  // Individual silhouettes and wardrobe, not three recolours of one model.
  if(name==="bruno"){
    // Bruno is sitting cross-legged/legs-forward on the floor, absorbed in the labels.
    box(root,[.76,.88,.43],shirt,[0,.98,0]);
    box(root,[.68,.34,.39],mat("#a95637"),[0,1.40,0]);
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
  const head=new THREE.Group();head.position.set(0,name==="bruno"?1.82:2.12,0);root.add(head);
  box(head,[.68,.68,.60],skin,[0,0,0]);
  // Hair profiles distinguish the cast even in a medium shot.
  // Keep side locks behind the facial plane. The old coplanar boxes intersected
  // the face and produced visible z-fighting/flicker around the girls' cheeks.
  if(name==="bruno"){
    box(head,[.72,.18,.52],hair,[0,.32,-.055]);
    box(head,[.22,.18,.48],hair,[-.24,.22,-.07]);
    box(head,[.18,.11,.48],hair,[.16,.35,-.07]);
  } else if(name==="martina"){
    box(head,[.72,.16,.52],hair,[0,.33,-.055]);
    box(head,[.15,.64,.42],hair,[-.30,-.08,-.075]);
    box(head,[.15,.58,.42],hair,[.30,-.10,-.075]);
    // Fringe is deliberately in front of the forehead, with a clean depth gap.
    box(head,[.38,.12,.12],hair,[-.08,.22,.365]);
  } else {
    box(head,[.72,.17,.52],hair,[0,.33,-.055]);
    box(head,[.17,.66,.42],hair,[-.29,-.09,-.075]);
    box(head,[.17,.66,.42],hair,[.29,-.09,-.075]);
    box(head,[.42,.13,.12],hair,[.05,.23,.365]);
  }
  const eyeWhite=mat("#fff8e9"), pupil=mat("#25201e"), brow=mat(name==="bruno"?"#30241f":"#211b1a");
  for(const side of [-1,1]){
    box(head,[.13,.10,.025],eyeWhite,[side*.16,.045,.337],false);
    box(head,[.052,.075,.02],pupil,[side*.16,.035,.36],false);
    box(head,[.15,.04,.025],brow,[side*.16,.16,.34],false);
  }
  box(head,[.07,.08,.06],skin,[0,-.055,.37],false);
  const mouth=box(head,[.17,.055,.025],mat("#743f3a"),[0,-.20,.355],false);
  const arm=(side:number)=>{
    const pivot=new THREE.Group();pivot.position.set(side*.42,name==="bruno"?1.20:1.58,0);root.add(pivot);
    box(pivot,[.22,.46,.23],shirt,[0,-.15,0]);
    box(pivot,[.18,.42,.19],skin,[0,-.56,.015]);
    box(pivot,[.18,.16,.19],skin,[0,-.78,.025]);return pivot;
  };
  const leg=(side:number)=>{
    const pivot=new THREE.Group();pivot.position.set(side*.20,name==="bruno"?.58:.70,0);root.add(pivot);
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
  const steel=mat("#59645f",.55,.25),edge=mat("#c1c4bd",.34,.62);
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
  // Painted supermarket walls, tiled floor seams and category signage give the
  // aisle a finished retail-store feel instead of an empty grey studio.
  const wallPaint=mat("#e8dfcd",.94), lowerPaint=mat("#a9b8a4",.88), trimPaint=mat("#d1c8b7",.72);
  for(const side of [-1,1]){
    const wallX=side*5.88;
    box(world,[.16,5.55,23.5],wallPaint,[wallX,.72,-5.1],false);
    box(world,[.20,.82,23.35],lowerPaint,[side*5.77,-1.36,-5.1],false);
    box(world,[.23,.09,23.35],trimPaint,[side*5.74,-.91,-5.1],false);
    for(let panel=0;panel<5;panel++){
      const z=-14.3+panel*4.55;
      box(world,[.025,1.72,.055],trimPaint,[side*5.77,.63,z],false);
    }
    const wallSignMat=new THREE.MeshBasicMaterial({map:texture((ctx,w,h)=>{
      ctx.fillStyle="#f7f1e5";ctx.fillRect(0,0,w,h);
      ctx.fillStyle=side<0?"#456b58":"#496b83";ctx.fillRect(0,0,w,h*.28);
      ctx.fillStyle="#fff";ctx.font="900 28px Arial";ctx.textAlign="center";ctx.fillText(side<0?"FRESCOS":"LÁCTEOS",w/2,h*.20);
      ctx.fillStyle="#35443b";ctx.font="800 31px Arial";ctx.fillText(side<0?"FRUTAS · VERDURAS":"LECHE · QUESOS",w/2,h*.68);
    },512,160)});
    const wallSign=new THREE.Mesh(new THREE.PlaneGeometry(2.15,.68),wallSignMat);
    wallSign.position.set(side*5.775,2.45,-12.8);wallSign.rotation.y=side<0?Math.PI/2:-Math.PI/2;world.add(wallSign);
  }
  const tileLine=mat("#aaa99f",.96);
  for(let x=-5.2;x<=5.2;x+=1.3)box(world,[.012,.008,23],tileLine,[x,-1.948,-5],false);
  for(let z=-16;z<=6;z+=1.35)box(world,[11,.008,.012],tileLine,[0,-1.948,z],false);

  // A more varied assortment: tins, jars, cartons and bottles break up the
  // repeated rectangular packs while remaining firmly seated on the shelves.
  const canMaterials=["#b94c3d","#6e8790","#c59b43","#64815d","#8a6a91"].map(c=>mat(c,.28,.42));
  const bottleMaterials=["#66845b","#c3a35d","#8a4d42","#66839a"].map(c=>mat(c,.22,.12));
  for(const side of [-1,1]){
    const x=side*4.1;
    for(let row=0;row<5;row++){
      const shelfY=-1.42+row*1.02;
      for(let i=0;i<7;i++){
        const z=-13.25+i*2.75+(row%2)*.35;
        const cx=x-side*.30;
        if(i%2===0){
          const can=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,.34,18),canMaterials[(i+row+(side>0?1:0))%canMaterials.length]);
          can.position.set(cx,shelfY+.08+.17,z);can.castShadow=true;world.add(can);
          const rim=new THREE.Mesh(new THREE.CylinderGeometry(.132,.132,.025,18),edge);
          rim.position.set(cx,shelfY+.08+.34,z);world.add(rim);
        }else{
          const bottle=new THREE.Group();
          const body=new THREE.Mesh(new THREE.CylinderGeometry(.13,.15,.38,16),bottleMaterials[(i+row)%bottleMaterials.length]);
          body.position.y=.19;bottle.add(body);
          const neck=new THREE.Mesh(new THREE.CylinderGeometry(.055,.075,.14,14),bottleMaterials[(i+row)%bottleMaterials.length]);
          neck.position.y=.45;bottle.add(neck);
          const cap=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,.07,14),mat("#e9e2d2",.4));
          cap.position.y=.555;bottle.add(cap);
          const labelBand=new THREE.Mesh(new THREE.CylinderGeometry(.132,.15,.15,16),mat(i%3===0?"#f4e7c8":"#d8d9c7",.72));
          labelBand.position.y=.18;bottle.add(labelBand);
          bottle.position.set(cx,shelfY+.08,z);bottle.traverse(o=>{if(o instanceof THREE.Mesh)o.castShadow=true;});world.add(bottle);
        }
      }
    }
  }

  // Cold-drink refrigerators and a stocked end-cap in the back of the aisle.
  const fridgeBody=mat("#59676a",.38,.38), glass=new THREE.MeshStandardMaterial({color:"#b9d1d1",transparent:true,opacity:.25,roughness:.12,metalness:.2});
  box(world,[4.8,3.35,.42],fridgeBody,[0,-.20,-16.15]);
  for(let door=0;door<3;door++){
    const dx=-1.55+door*1.55;
    box(world,[1.42,2.82,.035],glass,[dx,.02,-15.91],false);
    box(world,[.035,2.72,.055],edge,[dx+.66,.02,-15.86],false);
    for(let shelf=0;shelf<3;shelf++){
      box(world,[1.32,.045,.34],edge,[dx,-.82+shelf*.78,-15.62],false);
      for(let bottle=0;bottle<5;bottle++){
        const drink=new THREE.Mesh(new THREE.CylinderGeometry(.085,.095,.42,14),bottleMaterials[(door+bottle+shelf)%bottleMaterials.length]);
        drink.position.set(dx-.52+bottle*.26,-.60+shelf*.78,-15.66);drink.castShadow=true;world.add(drink);
        const cap=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.055,12),mat("#f0e8d8"));
        cap.position.set(drink.position.x,drink.position.y+.23,drink.position.z);world.add(cap);
      }
    }
  }
  // Crates of produce and a couple of parked trolleys in the background.
  const crateMat=mat("#9b7650",.9), fruitMats=["#c94c37","#d6a23e","#73934e","#d77c3e"].map(c=>mat(c,.42));
  for(const side of [-1,1]){
    const stand=new THREE.Group();stand.position.set(side*2.75,-1.95,-10.5);world.add(stand);
    box(stand,[1.55,.16,.95],crateMat,[0,.28,0]);
    for(let row=0;row<2;row++)for(let col=0;col<4;col++){
      const fruit=new THREE.Mesh(new THREE.SphereGeometry(.17,14,12),fruitMats[(row*4+col+(side>0?1:0))%fruitMats.length]);
      fruit.position.set(-.52+col*.34,.55+row*.12,-.22+(col%2)*.34);fruit.castShadow=true;stand.add(fruit);
    }
    for(const edgeX of [-.72,.72])box(stand,[.08,.42,.95],crateMat,[edgeX,.43,0]);
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
  const cart=new THREE.Group();cart.position.set(1.25,-1.995,.65);world.add(cart);
  const metal=mat("#aab2b1",.26,.78);
  box(cart,[1.05,.08,.78],metal,[0,.88,0]);
  for(const x of [-.48,.48])for(const z of [-.34,.34]){
    box(cart,[.035,.62,.035],metal,[x,1.19,z]);
    const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.085,.085,.065,20),mat("#303638",.55));
    wheel.rotation.z=Math.PI/2;wheel.position.set(x,.12,z);cart.add(wheel);
  }
  for(let y=.96;y<1.48;y+=.13)box(cart,[.98,.022,.72],metal,[0,y,0]);
  for(let z=-.30;z<=.30;z+=.15)box(cart,[.98,.018,.018],metal,[0,1.20,z]);
  box(cart,[1.08,.06,.07],mat("#303a3a"),[0,1.55,-.40]);
  const parkedCartA=cart.clone(true);parkedCartA.position.set(-2.55,-1.995,-7.7);parkedCartA.scale.setScalar(.78);parkedCartA.rotation.y=-.22;world.add(parkedCartA);
  const parkedCartB=cart.clone(true);parkedCartB.position.set(2.45,-1.995,-8.9);parkedCartB.scale.setScalar(.72);parkedCartB.rotation.y=.28;world.add(parkedCartB);
  // Two packets Bruno is comparing; the trolley remains visibly empty for the final joke.
  const packetMat=new THREE.MeshStandardMaterial({map:packMats[0].map,roughness:.68});
  const packet=new THREE.Group();packet.position.set(-.50,1.92,.46);packet.rotation.y=-.10;world.add(packet);
  box(packet,[.42,.60,.10],packetMat,[0,0,0]);
  const packet2=new THREE.Group();packet2.position.set(.34,1.80,.43);packet2.rotation.y=.12;world.add(packet2);
  box(packet2,[.38,.53,.10],packMats[2],[0,0,0]);
  const bruno=makeCharacter("bruno",0,.20);
  // Martina and Valentina enter through the clear central aisle, never through shelving.
  const martina=makeCharacter("martina",-.95,-12.8);
  const valentina=makeCharacter("valentina",.95,-12.8);
  world.add(bruno.root,martina.root,valentina.root);
  // The packets are parented to Bruno’s hands so they follow his body instead of hovering in world space.
  world.remove(packet); bruno.rightArm.add(packet); packet.position.set(.12,-.76,.30);
  world.remove(packet2); bruno.leftArm.add(packet2); packet2.position.set(-.12,-.76,.30);
  // Cinematic commercial lighting: soft overhead, warm key, cool rim, contact shadows.
  world.add(new THREE.HemisphereLight(0xf8f3e7,0x666d68,1.45));
  const key=new THREE.SpotLight(0xffe5c6,62,30,Math.PI/4,.62,1.25);
  key.position.set(-3.8,7.5,5.5);key.target.position.set(0,.2,-1);key.castShadow=true;world.add(key,key.target);
  const fill=new THREE.DirectionalLight(0xd9e7ed,1.45);fill.position.set(5,4,2);world.add(fill);
  const rim=new THREE.DirectionalLight(0xffd5a0,1.15);rim.position.set(0,4,-8);world.add(rim);
  const update=(time:number,dialogue:EntrePartidasCue[])=>{
    const cue=dialogue.find(c=>time>=c.start&&time<=c.end);
    const speaker=cue?.speaker;
    const walkT=Math.max(0,Math.min(1,(time-6)/7));
    const ease=(v:number)=>v*v*(3-2*v);
    martina.root.position.x=-1.15;
    valentina.root.position.x=1.15;
    martina.root.position.z=-12.8+9.6*ease(walkT);
    valentina.root.position.z=-12.8+9.6*ease(walkT);
    martina.root.rotation.y=.32*ease(walkT);
    valentina.root.rotation.y=-.32*ease(walkT);
    bruno.root.rotation.y=0;
    for(const rig of [bruno,martina,valentina]){
      const talking=rig.name===speaker;
      const lookAngle=cue?.look===rig.name?-.16:cue?.look?.length? .10:0;
      const phase=rig.name==="bruno"?0:rig.name==="martina"?1.7:3.1;
      rig.head.rotation.y=lookAngle+Math.sin(time*.7+phase)*.018;
      rig.head.rotation.x=talking?Math.sin(time*5.5+phase)*.035:Math.sin(time*.9+phase)*.012;
      rig.head.rotation.z=Math.sin(time*1.15+phase)*.012;
      const mouthOpen=talking?.10+Math.pow(Math.abs(Math.sin(time*19+phase)),1.35)*1.25:.08;
      rig.mouth.scale.set(talking?.92+.08*Math.sin(time*9+phase):1,mouthOpen,1);
      rig.mouth.position.y=-.20-(talking?mouthOpen*.006:0);
      rig.leftArm.rotation.z=talking?-.12+Math.sin(time*2.4+phase)*.075:Math.sin(time*.8+phase)*.025;
      rig.rightArm.rotation.z=talking?.14+Math.sin(time*2.1+phase+1)*.085:Math.sin(time*.9+phase)*.025;
      rig.leftArm.rotation.x=(talking?.035:0)+Math.sin(time*1.1+phase)*.018;
      rig.rightArm.rotation.x=(talking?-.025:0)+Math.sin(time*1.0+phase+1)*.018;
      rig.root.rotation.z=(talking?Math.sin(time*2.2+phase)*.012:Math.sin(time*.7+phase)*.006);
      rig.root.position.y=-1.975+Math.sin(time*.9+phase)*.008;
    }
    if(time<10){
      bruno.head.rotation.x=-.18; bruno.rightArm.rotation.z=-.34;
      packet.rotation.z=Math.sin(time*1.5)*.018;
      bruno.leftArm.rotation.z=.18+Math.sin(time*1.1)*.035;
      bruno.rightArm.rotation.z=-.34+Math.sin(time*1.3)*.025;
    }
    if(time>=6&&time<13){
      const stride=Math.sin((time-6)*5.4)*.18*(1-ease((time-12.5)/.5));
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
  return {
    update,
    getSpeakerPosition(speaker){
      const rig=speaker==="bruno"?bruno:speaker==="martina"?martina:valentina;
      return new THREE.Vector3(rig.root.position.x,.28,rig.root.position.z);
    }
  };
}


export function drawEntrePartidasBranding(ctx:CanvasRenderingContext2D,time:number,width:number,height:number){
  const scale=width/720;
  const rounded=(x:number,y:number,w:number,h:number,r:number)=>{
    ctx.beginPath();ctx.roundRect(x,y,w,h,r);
  };
  if(time<2.05){
    const fade=Math.min(1,time/.28,(2.05-time)/.35);
    ctx.save();ctx.globalAlpha=Math.max(0,fade);
    const panelW=width*.78,panelH=height*.115,x=(width-panelW)/2,y=height*.105;
    ctx.shadowColor="rgba(0,0,0,.34)";ctx.shadowBlur=28*scale;
    const g=ctx.createLinearGradient(x,y,x+panelW,y+panelH);
    g.addColorStop(0,"rgba(20,48,39,.94)");g.addColorStop(1,"rgba(31,67,54,.92)");
    ctx.fillStyle=g;rounded(x,y,panelW,panelH,22*scale);ctx.fill();
    ctx.shadowBlur=0;ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillStyle="#d7e8ad";ctx.font="900 "+Math.round(20*scale)+"px Arial";
    ctx.fillText("INGREDORA ORIGINAL",width/2,y+panelH*.25);
    ctx.fillStyle="#fffaf0";ctx.font="900 "+Math.round(48*scale)+"px Arial Black,Arial";
    ctx.fillText("ENTRE PARTIDAS",width/2,y+panelH*.61);
    ctx.fillStyle="#f0d18b";ctx.font="700 "+Math.round(17*scale)+"px Arial";
    ctx.fillText("UNA SERIE SOBRE EL DESAFÍO",width/2,y+panelH*.88);
    ctx.restore();
  }
  if(time>=62){
    const fade=Math.min(1,(time-62)/.45);
    ctx.save();ctx.globalAlpha=fade;
    const veil=ctx.createLinearGradient(0,0,0,height);
    veil.addColorStop(0,"rgba(12,24,20,.45)");veil.addColorStop(.35,"rgba(12,24,20,.80)");veil.addColorStop(1,"rgba(12,24,20,.96)");
    ctx.fillStyle=veil;ctx.fillRect(0,0,width,height);
    ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillStyle="#d7e8ad";ctx.font="900 "+Math.round(25*scale)+"px Arial";
    ctx.fillText("INGREDORA PRESENTA",width/2,height*.34);
    ctx.fillStyle="#fffaf0";ctx.font="900 "+Math.round(58*scale)+"px Arial Black,Arial";
    ctx.fillText("ENTRE PARTIDAS",width/2,height*.405);
    ctx.fillStyle="#e6e0cf";ctx.font="700 "+Math.round(25*scale)+"px Arial";
    ctx.fillText("Más capítulos en",width/2,height*.53);
    ctx.fillStyle="#f4d58d";ctx.font="900 "+Math.round(43*scale)+"px Arial";
    ctx.fillText("ingredora.com",width/2,height*.585);
    ctx.fillStyle="#fffaf0";ctx.font="800 "+Math.round(23*scale)+"px Arial";
    ctx.fillText("Jugá el desafío semanal",width/2,height*.69);
    ctx.fillStyle="#d7e8ad";ctx.font="700 "+Math.round(21*scale)+"px Arial";
    ctx.fillText("y competí por un lugar en el ranking",width/2,height*.735);
    ctx.restore();
  }
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
  const words=cue.text.split(" ").filter(Boolean);let line="",lines:string[]=[];
  for(const word of words){const candidate=line?line+" "+word:word;if(ctx.measureText(candidate).width>boxW-48*scale&&line){lines.push(line);line=word;}else line=candidate;}
  if(line)lines.push(line);const lineH=34*scale;
  lines.slice(0,2).forEach((value,i)=>ctx.fillText(value,x+24*scale,y+boxH*.65+i*lineH));
  ctx.restore();
}
