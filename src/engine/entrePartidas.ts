import * as THREE from "three";

export type EntrePartidasSpeaker = "bruno" | "martina" | "tomas" | "valentina" | "ernesto";
export type EntrePartidasCue = {
  speaker: EntrePartidasSpeaker;
  text: string;
  start: number;
  end: number;
  look?: EntrePartidasSpeaker;
};
export type CharacterRig = {
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

export function makeCharacter(name: EntrePartidasCue["speaker"], x: number, z: number, relaxedBrunoArms = false): CharacterRig {
  const root=new THREE.Group();root.position.set(x,-1.975,z);
  const isBruno=name==="bruno", isMartina=name==="martina", isTomas=name==="tomas", isErnesto=name==="ernesto";
  const skin=mat(isBruno?"#c98e6e":isMartina||name==="valentina"?"#d6a080":isTomas?"#e1b18e":"#c99a79");
  const hair=mat(isBruno?"#30241f":isMartina||name==="valentina"?"#30201c":isTomas?"#4b3328":"#8b8a82");
  const hairTie=mat(isMartina||name==="valentina"?"#d8a64c":"#d5d8df");
  const shirt=mat(isBruno?"#c46a43":isMartina?"#bd7958":isTomas?"#527c78":isErnesto?"#718064":"#47788a");
  const pants=mat(isErnesto?"#4b5148":"#35414a"), shoes=mat("#222528",.56);
  const head=new THREE.Group();head.position.set(0,isBruno?1.62:2.12,0);root.add(head);

  // Minecraft-like proportions: crisp cubic head, torso and articulated block limbs.
  if(isBruno){
    box(root,[.76,.88,.48],shirt,[0,.78,0]);
    // Clean shirt hem: avoid near-coplanar overlapping orange faces that shimmer at profile angles.
    box(root,[.755,.16,.475],mat("#a95637"),[0,.29,0]);
  }else{
    // Canonical block silhouettes and the established wardrobe colors for the full cast.
    box(root,[isErnesto?.72:.60,.58,.38],shirt,[0,1.40,0]);
    box(root,[isErnesto?.62:.53,.20,.37],shirt,[0,1.08,0]);
    box(root,[isErnesto?.66:.58,.25,.38],pants,[0,.82,0]);
    if(isErnesto){
      // Ernesto's olive cardigan, pale shirt opening and grey beard remain distinctive.
      box(root,[.13,.54,.025],mat("#d3c7a9"),[0,1.42,.205],false);
      box(root,[.08,.18,.025],mat("#d3c7a9"),[0,1.12,.205],false);
    }
    // Do not overlay skin-colored shoulder plates on the torso: their coplanar
    // front/back faces caused visible z-fighting at the shirt-to-skin seam.
    box(root,[.30,.045,.025],mat(isMartina||name==="valentina"?"#e3b79a":"#a9cbd1"),[0,1.59,.205],false);
  }
  box(root,[.19,.25,.18],skin,[0,isBruno?1.28:1.78,0]);
  box(head,[.66,.72,.58],skin,[0,0,0]);

  if(isBruno){
    box(head,[.70,.22,.62],hair,[0,.27,-.015]);
    box(head,[.66,.15,.58],hair,[0,.37,-.04]);
    box(head,[.18,.20,.20],hair,[-.25,.12,.20]);
  }else{
    // Keep the entire forehead clear: no fringe, bangs or hair pieces over the face.
    // The voxel hair sits on the crown, back and outer sides only.
    box(head,[.74,.25,.61],hair,[0,.31,-.035]);
    box(head,[.70,.57,.18],hair,[0,-.035,-.285]);
    box(head,[.13,.48,.42],hair,[-.305,-.055,-.015]);
    box(head,[.13,.48,.42],hair,[.305,-.055,-.015]);
    if(isMartina||name==="valentina"){
      // Martina y Valentina comparten el mismo peinado largo; el color de remera las distingue.
      box(head,[.25,.16,.20],hair,[.12,.49,-.29]);
      box(head,[.10,.10,.11],hairTie,[.12,.48,-.405]);
      box(head,[.22,.32,.22],hair,[.15,.28,-.51]);
      box(head,[.18,.24,.18],hair,[.19,.025,-.59]);
    }else if(isTomas){
      // Tomás keeps his recognizable short brown, slightly tousled hairstyle.
      box(head,[.70,.18,.56],hair,[-.05,.40,.015]);
      box(head,[.26,.16,.25],hair,[.20,.34,.20]);
      box(head,[.15,.20,.20],hair,[-.27,.20,.20]);
      box(head,[.12,.42,.20],hair,[-.31,-.07,-.25]);
      box(head,[.12,.42,.20],hair,[.31,-.07,-.25]);
    }else if(isErnesto){
      box(head,[.72,.19,.60],hair,[0,.34,-.02]);
      box(head,[.15,.28,.18],hair,[-.30,.18,.15]);
      box(head,[.15,.28,.18],hair,[.30,.18,.15]);
    }
  }
  if(isErnesto){
    box(head,[.72,.22,.12],mat("#77786e"),[0,-.34,.30],false);
    box(head,[.56,.13,.10],mat("#88877c"),[0,-.43,.32],false);
  }

  const eyeWhite=mat("#fff8e9"),pupil=mat("#25201e"),brow=mat(isBruno?"#30241f":"#211b1a");
  for(const side of [-1,1]){
    // Eye layers sit almost flush with the cubic face, avoiding the protruding-eye profile.
    box(head,[.13,.09,.018],eyeWhite,[side*.15,.04,.298],false);
    box(head,[.045,.065,.012],pupil,[side*.15,.035,.307],false);
    box(head,[.14,.025,.014],brow,[side*.15,.15,.292],false);
  }
  // No noses on any character; keep the face clean and readable at this scale.
  const mouth=box(head,[.15,.025,.025],mat("#743f3a"),[0,-.22,.302],false);

  const arm=(side:number)=>{
    const pivot=new THREE.Group();
    const forwardBrunoPose=isBruno&&!relaxedBrunoArms;
    // Keep Bruno's original forward-reaching pose for packages; the arcade shot uses relaxed arms.
    pivot.position.set(side*(isBruno?.43:.39),isBruno?1.08:1.56,.02);root.add(pivot);
    if(forwardBrunoPose){
      box(pivot,[.27,.23,.38],shirt,[side*.06,0,.18]);
      box(pivot,[.19,.19,.46],skin,[side*.13,-.025,.56]);
      box(pivot,[.20,.16,.18],skin,[side*.14,-.04,.92]);
    }else if(isBruno){
      box(pivot,[.25,.22,.19],shirt,[side*.015,-.08,0]);
      box(pivot,[.16,.48,.15],skin,[side*.015,-.39,.015]);
      box(pivot,[.18,.15,.16],skin,[side*.015,-.69,.025]);
    }else{
      box(pivot,[.17,.18,.18],skin,[0,-.06,0]);
      box(pivot,[.14,.53,.15],skin,[0,-.39,.018]);
      box(pivot,[.15,.15,.15],skin,[0,-.72,.035]);
    }
    return pivot;
  };
  const leg=(side:number)=>{
    const pivot=new THREE.Group();pivot.position.set(side*(isBruno?.20:.22),isBruno?.36:.70,0);root.add(pivot);
    box(pivot,[.31,.58,.36],pants,[0,-.27,0]);
    box(pivot,[.32,.17,.42],shoes,[0,-.60,.07]);
    return pivot;
  };
  // Moving character meshes do not receive/cast shadow maps: this prevents shadow acne
  // and temporal shadow flicker on skin, hair and clothes during the walking close-up.
  root.traverse(object=>{
    if(object instanceof THREE.Mesh){
      object.castShadow=false;
      object.receiveShadow=false;
    }
  });
  return {root,head,mouth,leftArm:arm(-1),rightArm:arm(1),leftLeg:leg(-1),rightLeg:leg(1),name};
}
export function createEntrePartidasSet(world: THREE.Scene): EntrePartidasSet {
  world.background=new THREE.Color("#d9d5ca");world.fog=new THREE.Fog("#d9d5ca",22,48);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(48,48),mat("#b8b4a9",.92));
  floor.rotation.x=-Math.PI/2;floor.position.set(0,-1.96,-5);floor.receiveShadow=true;world.add(floor);
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
    const x=side*5.3;
    box(world,[.18,5.2,18],steel,[x,.65,-1.5]);
    for(let row=0;row<5;row++){
      const y=-1.42+row*1.02;
      box(world,[1.65,.10,18],steel,[x-side*.88,y,-1.5]);
      box(world,[1.65,.045,18],edge,[x-side*.88,y-.075,-1.5]);
      for(let depth=0;depth<2;depth++)for(let i=0;i<18;i++){
        const index=(i*3+row*5+depth*2+(side>0?1:0))%packMats.length;
        const h=.38+((i+row+depth)%4)*.07,w=.31+(i%3)*.025;
        const pack=new THREE.Mesh(new THREE.BoxGeometry(w,h,.30),packMats[index]);
        pack.position.set(x-side*(.32+depth*.52),y+.08+h/2,-8.7+i*.88);
        pack.castShadow=true;pack.receiveShadow=true;world.add(pack);
      }
      const rail=box(world,[1.68,.20,.075],edge,[x-side*.88,y-.18,7.40],false);
      rail.material=steel;
      for(let i=0;i<12;i++){
        const tag=new THREE.Mesh(new THREE.PlaneGeometry(.40,.18),priceMats[(i+row*3)%12]);
        tag.position.set(x-side*(.28+i*.11),y-.18,7.34);world.add(tag);
      }
    }
    box(world,[.22,5.7,.26],edge,[x,1,-1.5]);
    box(world,[1.65,.30,18],steel,[x-side*.88,3.42,-1.5]);
  }
  // Painted supermarket walls, tiled floor seams and category signage give the
  // aisle a finished retail-store feel instead of an empty grey studio.
  const wallPaint=mat("#e8dfcd",.94), lowerPaint=mat("#a9b8a4",.88), trimPaint=mat("#d1c8b7",.72);
  for(const side of [-1,1]){
    const wallX=side*8.15;
    // The side walls stop before the cross-aisle, leaving a visibly open junction behind the gondolas.
    box(world,[.16,5.55,18.2],wallPaint,[wallX,.72,-1.45],false);
    box(world,[.20,.82,18.05],lowerPaint,[side*8.03,-1.36,-1.45],false);
    box(world,[.23,.09,18.05],trimPaint,[side*8.00,-.91,-1.45],false);
    for(let panel=0;panel<5;panel++){
      const z=-8.8+panel*3.65;
      box(world,[.025,1.72,.055],trimPaint,[side*8.03,.63,z],false);
    }
    const wallSignMat=new THREE.MeshBasicMaterial({map:texture((ctx,w,h)=>{
      ctx.fillStyle="#f7f1e5";ctx.fillRect(0,0,w,h);
      ctx.fillStyle=side<0?"#456b58":"#496b83";ctx.fillRect(0,0,w,h*.28);
      ctx.fillStyle="#fff";ctx.font="900 28px Arial";ctx.textAlign="center";ctx.fillText(side<0?"FRESCOS":"LÁCTEOS",w/2,h*.20);
      ctx.fillStyle="#35443b";ctx.font="800 31px Arial";ctx.fillText(side<0?"FRUTAS · VERDURAS":"LECHE · QUESOS",w/2,h*.68);
    },512,160)});
    const wallSign=new THREE.Mesh(new THREE.PlaneGeometry(2.15,.68),wallSignMat);
    wallSign.position.set(side*8.045,2.45,-6.7);wallSign.rotation.y=side<0?Math.PI/2:-Math.PI/2;world.add(wallSign);
  }
  const tileLine=mat("#aaa99f",.96);
  for(let x=-7.5;x<=7.5;x+=1.5)box(world,[.012,.008,27],tileLine,[x,-1.948,-4],false);
  for(let z=-22;z<=8;z+=1.35)box(world,[16,.008,.012],tileLine,[0,-1.948,z],false);

  // A more varied assortment: tins, jars, cartons and bottles break up the
  // repeated rectangular packs while remaining firmly seated on the shelves.
  const canMaterials=["#b94c3d","#6e8790","#c59b43","#64815d","#8a6a91"].map(c=>mat(c,.28,.42));
  const bottleMaterials=["#66845b","#c3a35d","#8a4d42","#66839a"].map(c=>mat(c,.22,.12));
  for(const side of [-1,1]){
    const x=side*5.3;
    for(let row=0;row<5;row++){
      const shelfY=-1.42+row*1.02;
      for(let i=0;i<7;i++){
        const z=-8.55+i*2.35+(row%2)*.35;
        const cx=x-side*.40;
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
  box(world,[8.2,3.35,.42],fridgeBody,[0,-.20,-20.2]);
  for(let door=0;door<3;door++){
    const dx=-2.60+door*2.60;
    box(world,[2.46,2.82,.035],glass,[dx,.02,-19.96],false);
    box(world,[.035,2.72,.055],edge,[dx+1.20,.02,-19.90],false);
    for(let shelf=0;shelf<3;shelf++){
      box(world,[2.30,.045,.34],edge,[dx,-.82+shelf*.78,-19.70],false);
      for(let bottle=0;bottle<5;bottle++){
        const drink=new THREE.Mesh(new THREE.CylinderGeometry(.085,.095,.42,14),bottleMaterials[(door+bottle+shelf)%bottleMaterials.length]);
        drink.position.set(dx-.94+bottle*.45,-.60+shelf*.78,-19.74);drink.castShadow=true;world.add(drink);
        const cap=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.055,12),mat("#f0e8d8"));
        cap.position.set(drink.position.x,drink.position.y+.23,drink.position.z);world.add(cap);
      }
    }
  }
  // Crates of produce and a couple of parked trolleys in the background.
  const crateMat=mat("#9b7650",.9), fruitMats=["#c94c37","#d6a23e","#73934e","#d77c3e"].map(c=>mat(c,.42));
  for(const side of [-1,1]){
    const stand=new THREE.Group();stand.position.set(side*7.05,-1.95,-13.0);world.add(stand);
    box(stand,[1.55,.16,.95],crateMat,[0,.28,0]);
    for(let row=0;row<2;row++)for(let col=0;col<4;col++){
      const fruit=new THREE.Mesh(new THREE.SphereGeometry(.17,14,12),fruitMats[(row*4+col+(side>0?1:0))%fruitMats.length]);
      fruit.position.set(-.52+col*.34,.55+row*.12,-.22+(col%2)*.34);fruit.castShadow=true;stand.add(fruit);
    }
    for(const edgeX of [-.72,.72])box(stand,[.08,.42,.95],crateMat,[edgeX,.43,0]);
  }

  // End-of-aisle architecture, ceiling light panels and subtle warm/cool contrast.
  const ceiling=box(world,[16,.18,29],mat("#eee9dc",.9),[0,5.0,-5],false);
  ceiling.material.side=THREE.DoubleSide;
  for(let i=0;i<5;i++){
    const panel=new THREE.Mesh(new THREE.BoxGeometry(2.25,.035,4.8),new THREE.MeshBasicMaterial({color:"#fff7e5"}));
    panel.position.set(-5.5+i*2.75,4.88,-2.8);world.add(panel);
  }
  box(world,[10,.24,.45],mat("#e9e4d7"),[0,3.72,-19.0],false);
  // A few distant aisle signs create readable scale without visual clutter.
  const signMat=new THREE.MeshBasicMaterial({map:texture((ctx,w,h)=>{
    ctx.fillStyle="#314a40";ctx.fillRect(0,0,w,h);ctx.fillStyle="#f6f0df";
    ctx.font="900 46px Arial";ctx.textAlign="center";ctx.fillText("PASILLO PRINCIPAL",w/2,h*.57);
  },512,160)});
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(4.2,.85),signMat);sign.position.set(0,3.05,-16.3);world.add(sign);
  // Realistic low-poly metal trolley: tapered wire basket, reinforced chassis and swivel casters.
  const metal=mat("#aeb8b7",.24,.84),darkMetal=mat("#56615f",.34,.72),rubber=mat("#252b2d",.58,.02);
  const addRod=(parent:THREE.Object3D,a:[number,number,number],b:[number,number,number],radius:number,material:THREE.Material)=>{
    const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b),delta=vb.clone().sub(va);
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,delta.length(),6),material);
    mesh.position.copy(va.add(vb).multiplyScalar(.5));
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
    mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  };
  const makeCart=()=>{
    const trolley=new THREE.Group();
    // Undercarriage and the four protected wheel mounts.
    box(trolley,[.96,.055,.055],darkMetal,[0,.78,0]);
    for(const z of [-.34,.34])addRod(trolley,[-.45,.79,z],[.45,.79,z],.025,darkMetal);
    box(trolley,[.90,.045,.68],mat("#84918f",.46,.72),[0,.91,0]);
    // Tapered basket: lower footprint is smaller than its upper rim.
    const bottom=[[-.43,.96,-.31],[.43,.96,-.31],[-.43,.96,.31],[.43,.96,.31]] as const;
    const top=[[-.56,1.52,-.43],[.56,1.52,-.43],[-.56,1.52,.43],[.56,1.52,.43]] as const;
    for(const level of [0,1]){
      const p=level?top:bottom;
      addRod(trolley,p[0] as [number,number,number],p[1] as [number,number,number],.022,metal);
      addRod(trolley,p[2] as [number,number,number],p[3] as [number,number,number],.022,metal);
      addRod(trolley,p[0] as [number,number,number],p[2] as [number,number,number],.022,metal);
      addRod(trolley,p[1] as [number,number,number],p[3] as [number,number,number],.022,metal);
    }
    for(let i=0;i<4;i++)addRod(trolley,bottom[i] as [number,number,number],top[i] as [number,number,number],.018,metal);
    for(const y of [1.12,1.30,1.46]){
      const t=(y-.96)/.56;
      const hx=.43+(.56-.43)*t,hz=.31+(.43-.31)*t;
      addRod(trolley,[-hx,y,-hz],[hx,y,-hz],.012,metal);
      addRod(trolley,[-hx,y,hz],[hx,y,hz],.012,metal);
      addRod(trolley,[-hx,y,-hz],[-hx,y,hz],.012,metal);
      addRod(trolley,[hx,y,-hz],[hx,y,hz],.012,metal);
    }
    // Fine upright wires and a grid floor make the basket read as a shopping cart, not a box.
    for(let i=1;i<9;i++){
      const t=i/9,x=-.43+.86*t,tx=-.56+1.12*t;
      addRod(trolley,[x,.97,-.31],[tx,1.51,-.43],.009,metal);
      addRod(trolley,[x,.97,.31],[tx,1.51,.43],.009,metal);
    }
    for(let i=1;i<6;i++){
      const t=i/6,z=-.31+.62*t,tz=-.43+.86*t;
      addRod(trolley,[-.43,.97,z],[-.56,1.51,tz],.009,metal);
      addRod(trolley,[.43,.97,z],[.56,1.51,tz],.009,metal);
    }
    for(let i=1;i<7;i++){
      const x=-.39+i*.13;addRod(trolley,[x,.94,-.29],[x,.94,.29],.009,metal);
    }
    for(let i=1;i<5;i++){
      const z=-.28+i*.14;addRod(trolley,[-.40,.94,z],[.40,.94,z],.009,metal);
    }
    // Rear handle, angled stays and softly rounded dark grip.
    for(const side of [-1,1]){
      addRod(trolley,[side*.46,1.05,-.31],[side*.50,1.49,-.55],.026,darkMetal);
      const caster=box(trolley,[.11,.13,.12],darkMetal,[side*.48,.78,-.34],false);
      caster.rotation.x=-.12;
      const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.105,.105,.072,12),rubber);
      wheel.rotation.z=Math.PI/2;wheel.position.set(side*.48,.105,-.34);wheel.castShadow=true;trolley.add(wheel);
      const frontWheel=new THREE.Mesh(new THREE.CylinderGeometry(.105,.105,.072,12),rubber);
      frontWheel.rotation.z=Math.PI/2;frontWheel.position.set(side*.48,.105,.34);frontWheel.castShadow=true;trolley.add(frontWheel);
      box(trolley,[.035,.12,.035],darkMetal,[side*.48,.27,-.34]);
      box(trolley,[.035,.12,.035],darkMetal,[side*.48,.27,.34]);
      // Four structural uprights connect the caster axles to the trolley chassis.
      for(const z of [-.34,.34]){
        addRod(trolley,[side*.48,.15,z],[side*.48,.78,z],.032,darkMetal);
      }
    }
    // Continuous axles and lateral cross-braces keep all four wheels visibly attached.
    for(const z of [-.34,.34]){
      addRod(trolley,[-.48,.105,z],[.48,.105,z],.028,darkMetal);
      addRod(trolley,[-.48,.74,z],[.48,.74,z],.028,darkMetal);
    }
    addRod(trolley,[-.52,1.53,-.57],[.52,1.53,-.57],.036,metal);
    const grip=new THREE.Mesh(new THREE.CylinderGeometry(.052,.052,.88,10),mat("#303a3a",.72));
    grip.rotation.z=Math.PI/2;grip.position.set(0,1.53,-.57);trolley.add(grip);
    trolley.traverse(object=>{if(object instanceof THREE.Mesh){object.castShadow=true;object.receiveShadow=true;}});
    return trolley;
  };
  const cart=makeCart();cart.position.set(-2.75,-1.96,1.8);world.add(cart);
  const parkedCartA=cart.clone(true);parkedCartA.position.set(-6.75,-1.96,-5.7);parkedCartA.scale.setScalar(.82);parkedCartA.rotation.y=-.18;world.add(parkedCartA);
  const parkedCartB=cart.clone(true);parkedCartB.position.set(6.75,-1.96,-5.7);parkedCartB.scale.setScalar(.78);parkedCartB.rotation.y=.20;world.add(parkedCartB);
  // One upright product in each hand. Each package is its own rigged prop with a sealed top and visible front label.
  const bruno=makeCharacter("bruno",0,.20);
  const martina=makeCharacter("martina",-2.55,-4.15);
  const valentina=makeCharacter("valentina",-1.25,-4.15);
  const tomas=makeCharacter("tomas",-.85,.15);
  const ernesto=makeCharacter("ernesto",1.05,-.35);
  bruno.root.visible=false;martina.root.visible=false;valentina.root.visible=false;
  tomas.root.visible=false;ernesto.root.visible=false;
  world.add(bruno.root,martina.root,valentina.root,tomas.root,ernesto.root);
  // Tomás' story props: a clearly readable Nutella jar and a compact phone.
  const nutellaLabel=texture((ctx,w,h)=>{
    ctx.fillStyle="#f3ead7";ctx.fillRect(0,0,w,h);
    ctx.fillStyle="#3c251b";ctx.font="900 46px Arial";ctx.textAlign="center";ctx.fillText("nut",w*.36,h*.57);
    ctx.fillStyle="#d83c2e";ctx.fillText("ella",w*.68,h*.57);
    ctx.fillStyle="#6d4b2f";ctx.font="700 13px Arial";ctx.fillText("HAZELNUT SPREAD",w/2,h*.82);
  },256,160);
  const jar=new THREE.Group();
  const jarGlass=new THREE.Mesh(new THREE.CylinderGeometry(.22,.24,.62,20),mat("#51301e",.28,.02));jarGlass.position.y=.31;jar.add(jarGlass);
  const jarShoulder=new THREE.Mesh(new THREE.CylinderGeometry(.17,.22,.12,20),mat("#4a2b1b",.3));jarShoulder.position.y=.66;jar.add(jarShoulder);
  const jarLid=new THREE.Mesh(new THREE.CylinderGeometry(.205,.205,.13,20),mat("#e9e7df",.32));jarLid.position.y=.78;jar.add(jarLid);
  const jarLabel=new THREE.Mesh(new THREE.CylinderGeometry(.224,.224,.28,24,1,true),new THREE.MeshStandardMaterial({map:nutellaLabel,roughness:.6}));
  jarLabel.position.y=.34;jar.add(jarLabel);jar.scale.setScalar(.72);
  tomas.rightArm.add(jar);jar.position.set(0,-.64,.18);
  const phone=new THREE.Mesh(new THREE.BoxGeometry(.22,.36,.035),mat("#20252b",.28,.2));
  tomas.leftArm.add(phone);phone.position.set(0,-.66,.15);

  const makeHandPacket=(material:THREE.Material,width:number,height:number)=>{
    const product=new THREE.Group();
    box(product,[width,height,.115],material,[0,0,0]);
    box(product,[width*.96,.035,.124],mat("#e8dfc9",.7),[0,height*.5-.035,0]);
    box(product,[width*.92,.025,.126],mat("#76674c",.72),[0,-height*.5+.025,0]);
    box(product,[.035,height*.84,.012],mat("#ffffff",.5),[-width*.46,0,.064],false);
    return product;
  };
  const packet=makeHandPacket(packMats[0],.42,.62);
  const packet2=makeHandPacket(packMats[2],.40,.60);
  // Lift both products into Bruno's hands at chest height so they clear his lap and legs.
  bruno.rightArm.add(packet);packet.position.set(.14,-.025,1.065);packet.rotation.set(0,0,0);
  bruno.leftArm.add(packet2);packet2.position.set(-.14,-.025,1.065);packet2.rotation.set(0,0,0);
  // Cinematic commercial lighting: soft overhead, warm key, cool rim, contact shadows.
  world.add(new THREE.HemisphereLight(0xf8f3e7,0x666d68,1.45));
  const key=new THREE.SpotLight(0xffe5c6,62,30,Math.PI/4,.62,1.25);
  key.position.set(-3.8,7.5,5.5);key.target.position.set(0,.2,-1);key.castShadow=true;world.add(key,key.target);
  const fill=new THREE.DirectionalLight(0xd9e7ed,1.45);fill.position.set(5,4,2);world.add(fill);
  const rim=new THREE.DirectionalLight(0xffd5a0,1.15);rim.position.set(0,4,-8);world.add(rim);
  // Keep the full supermarket interior assembled, but begin on a sitcom-style
  // nighttime exterior establishing shot before cutting inside.
  const interior=new THREE.Group();
  [...world.children].forEach(object=>interior.add(object));
  interior.visible=false;
  world.add(interior);
  const exterior=new THREE.Group();
  world.add(exterior);
  // Dedicated low-key exterior illumination: the street remains nighttime-blue,
  // but the shopfront, house facade and roof stay readable instead of collapsing
  // into silhouettes against the sky.
  exterior.add(new THREE.HemisphereLight(0x9db5d4,0x35404a,1.65));
  const exteriorKey=new THREE.DirectionalLight(0xffd5a5,2.25);
  exteriorKey.position.set(-5.5,8.5,7.0);
  exterior.add(exteriorKey);
  const exteriorCoolFill=new THREE.DirectionalLight(0x86a8d4,0.85);
  exteriorCoolFill.position.set(7.0,4.0,-1.5);
  exterior.add(exteriorCoolFill);
  const extMat=(color:string,roughness=.86,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
  const extBox=(size:[number,number,number],position:[number,number,number],material:THREE.Material)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),material);
    mesh.position.set(...position);mesh.castShadow=true;mesh.receiveShadow=true;exterior.add(mesh);return mesh;
  };
  const extGround=new THREE.Mesh(new THREE.PlaneGeometry(48,48),extMat("#232b32",.98));
  extGround.rotation.x=-Math.PI/2;extGround.position.set(0,-1.99,-4);extGround.receiveShadow=true;exterior.add(extGround);
  const asphaltTexture=texture((ctx,w,h)=>{
    ctx.fillStyle="#252c33";ctx.fillRect(0,0,w,h);
    for(let i=0;i<1450;i++){
      const x=(i*97)%w,y=(i*193)%h;
      const shade= i%3===0 ? "rgba(164,174,178,.10)" : "rgba(8,13,17,.12)";
      ctx.fillStyle=shade;ctx.fillRect(x,y,1+(i%4),1+(i%2));
    }
    for(let i=0;i<18;i++){
      const x=(i*137)%w,y=(i*83)%h;
      ctx.strokeStyle="rgba(9,13,17,.28)";ctx.lineWidth=2+(i%3);
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+18+(i%4)*11,y+3+(i%3)*5);ctx.lineTo(x+25+(i%5)*12,y+1);ctx.stroke();
    }
  },512,512);
  asphaltTexture.wrapS=THREE.RepeatWrapping;asphaltTexture.wrapT=THREE.RepeatWrapping;asphaltTexture.repeat.set(6,2);
  const asphaltMat=new THREE.MeshStandardMaterial({map:asphaltTexture,roughness:.98,color:"#b5bdc1"});
  const asphalt=new THREE.Mesh(new THREE.PlaneGeometry(48,12),asphaltMat);
  asphalt.rotation.x=-Math.PI/2;asphalt.position.set(0,-1.975,5.3);asphalt.receiveShadow=true;exterior.add(asphalt);
  const sidewalk=extMat("#777a78",.94),curb=extMat("#b7b7ad",.85),roadLine=extMat("#d5c58f",.92);
  extBox([26,.16,2.5],[0,-1.88,-1.95],sidewalk);
  extBox([26,.24,.22],[0,-1.82,-3.16],curb);
  for(let i=-2;i<=2;i++)extBox([2.6,.012,.10],[i*4,-1.955,5.6],roadLine);

  // Supermarket facade: broad lit windows, glass entrance, fascia and a readable sign.
  const storeWall=extMat("#3d514b",.9),storeTrim=extMat("#172a27",.7),windowFrame=extMat("#b9c2ba",.38,.32);
  extBox([8.2,5.35,5.8],[-2.65,.70,-7.75],storeWall);
  extBox([8.45,.48,.90],[-2.65,3.38,-5.15],storeTrim);
  extBox([8.35,.16,.96],[-2.65,-1.91,-5.15],extMat("#263a34",.8));
  const litGlass=new THREE.MeshStandardMaterial({color:"#d7c49c",emissive:"#efb65f",emissiveIntensity:.42,roughness:.22,metalness:.08});
  extBox([5.75,2.35,.055],[-3.55,.10,-4.865],litGlass);
  extBox([.18,2.48,.12],[-3.55,.10,-4.80],windowFrame);
  extBox([.12,2.45,.12],[-6.38,.10,-4.80],windowFrame);
  extBox([.12,2.45,.12],[-.70,.10,-4.80],windowFrame);
  extBox([1.08,2.50,.18],[.32,.08,-4.79],storeTrim);
  extBox([.90,2.28,.06],[.32,.08,-4.665],new THREE.MeshStandardMaterial({color:"#9caea9",emissive:"#d39b4e",emissiveIntensity:.20,transparent:true,opacity:.88,roughness:.16}));
  extBox([.08,2.30,.10],[-.17,.08,-4.62],windowFrame);
  extBox([.08,2.30,.10],[.81,.08,-4.62],windowFrame);
  extBox([9.0,.18,.95],[-2.65,3.02,-5.05],extMat("#202e2a",.7,.18));
  const storeSignTex=texture((ctx,w,h)=>{
    const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,"#25483d");g.addColorStop(1,"#112b25");ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    ctx.strokeStyle="#e6c77a";ctx.lineWidth=10;ctx.strokeRect(12,12,w-24,h-24);
    ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle="#fff7e5";
    ctx.font="900 76px Arial Black,Arial";ctx.fillText("SUPERMERCADO",w/2,h*.54,w*.91);
  },1024,190);
  const storeSign=new THREE.Mesh(new THREE.PlaneGeometry(7.8,.68),new THREE.MeshBasicMaterial({map:storeSignTex}));
  storeSign.position.set(-2.65,3.42,-4.56);exterior.add(storeSign);
  // Warm pendant lighting is visible through the windows from the street.
  for(let i=0;i<5;i++){
    const lamp=new THREE.Mesh(new THREE.SphereGeometry(.12,10,8),new THREE.MeshBasicMaterial({color:"#ffdb91"}));
    lamp.position.set(-5.5+i*1.0,1.18,-4.72);exterior.add(lamp);
    const glow=new THREE.PointLight("#ffbf65",1.4,4.5);glow.position.copy(lamp.position);exterior.add(glow);
  }
  // Neighbouring six-storey brick apartment building: tall, flat-roofed,
  // with a readable exposed-brick facade, repeated lit windows and balconies.
  const brickTexture=texture((ctx,w,h)=>{
    ctx.fillStyle="#8f4432";ctx.fillRect(0,0,w,h);
    const brickHeight=52,brickWidth=104;
    for(let row=0;row<Math.ceil(h/brickHeight);row++){
      const offset=row%2?brickWidth*.5:0;
      for(let col=-1;col<Math.ceil(w/brickWidth)+1;col++){
        const x=col*brickWidth-offset,y=row*brickHeight;
        const shade=(row*7+col*11+29)%5;
        const colors=["#a9523b","#934531","#b35b40","#9b4a35","#87402f"];
        ctx.fillStyle=colors[shade];ctx.fillRect(x+3,y+3,brickWidth-6,brickHeight-6);
        ctx.fillStyle="rgba(255,220,185,.12)";ctx.fillRect(x+5,y+5,brickWidth-10,4);
        ctx.fillStyle="rgba(35,18,14,.12)";ctx.fillRect(x+5,y+brickHeight-7,brickWidth-10,4);
      }
    }
    // A restrained evening light gradient gives the masonry depth without
    // making the building read as a dark silhouette.
    const shade=ctx.createLinearGradient(0,0,w,h);
    shade.addColorStop(0,"rgba(255,218,176,.10)");
    shade.addColorStop(.48,"rgba(255,255,255,0)");
    shade.addColorStop(1,"rgba(21,19,25,.24)");
    ctx.fillStyle=shade;ctx.fillRect(0,0,w,h);
  },512,1024);
  const brickMaterial=new THREE.MeshStandardMaterial({map:brickTexture,roughness:.96});
  extBox([4.85,13.15,5.2],[5.35,4.66,-7.49],brickMaterial);
  const buildingTrim=extMat("#6d382c",.88),buildingConcrete=extMat("#8e8d82",.9),buildingMetal=extMat("#343b3c",.54,.25);
  // Flat roofline and parapet replace the pitched house roof.
  extBox([5.05,.34,1.02],[5.35,11.34,-5.25],buildingTrim);
  extBox([4.92,.12,.18],[5.35,11.57,-4.79],buildingConcrete);
  // Six residential floors, two windows per floor, with a few warm lit rooms.
  const windowFrameMat=extMat("#3a3632",.48,.2);
  for(let floor=0;floor<6;floor++){
    const y=-.72+floor*2.08;
    for(let column=0;column<2;column++){
      const x=column===0?4.25:6.38;
      extBox([1.02,1.38,.13],[x,y,-4.79],windowFrameMat);
      const lit=(floor*3+column*2)%4!==0;
      const glassMat=new THREE.MeshStandardMaterial({
        color:lit?"#c7baa0":"#81949a",
        emissive:lit?"#d89a52":"#30404a",
        emissiveIntensity:lit?.34:.08,
        roughness:.22,
        metalness:.08
      });
      extBox([.86,1.20,.055],[x,y,-4.70],glassMat);
      extBox([.045,1.21,.065],[x,y,-4.66],windowFrameMat);
      extBox([.88,.045,.065],[x,y,-4.66],windowFrameMat);
    }
    // Narrow continuous slab and a recessed band mark each floor.
    extBox([4.88,.075,.20],[5.35,y-1.00,-4.78],buildingConcrete);
    if(floor%2===0){
      const balconyY=y-.42;
      extBox([1.16,.065,.52],[4.25,balconyY,-4.51],buildingMetal);
      extBox([1.16,.055,.07],[4.25,balconyY+.42,-4.42],buildingMetal);
      for(const dx of [-.52,-.18,.18,.52]){
        extBox([.045,.42,.045],[4.25+dx,balconyY+.20,-4.42],buildingMetal);
      }
    }
  }
  // Ground-floor entrance, intercom and small awning.
  extBox([1.15,2.18,.15],[5.35,-.78,-4.73],buildingMetal);
  extBox([.88,1.92,.055],[5.35,-.78,-4.62],extMat("#6d5542",.7));
  extBox([1.45,.14,.68],[5.35,.42,-4.56],buildingConcrete);
  extBox([.20,.46,.08],[6.18,-1.16,-4.58],extMat("#2c2d2a",.6,.15));
  // Rooftop service room and water tank signal an actual multi-storey block.
  extBox([1.15,1.10,.88],[6.75,12.12,-5.28],extMat("#777b78",.82));
  extBox([.78,.62,.78],[4.05,12.02,-5.30],buildingMetal);
  const buildingEntranceLight=new THREE.PointLight("#ffd49b",1.6,4.8);
  buildingEntranceLight.position.set(5.35,.4,-4.15);exterior.add(buildingEntranceLight);
  extBox([.13,6.8,.13],[-9.4,1.45,-1.85],extMat("#333c40",.55,.3));
  const streetArm=extBox([1.15,.10,.10],[-8.9,4.72,-1.85],extMat("#333c40",.55,.3));streetArm.rotation.z=-.15;
  const streetGlow=new THREE.PointLight("#ffe0a1",3.2,9);streetGlow.position.set(-8.55,4.55,-1.85);exterior.add(streetGlow);
  const streetBulb=new THREE.Mesh(new THREE.SphereGeometry(.17,10,8),new THREE.MeshBasicMaterial({color:"#fff0c2"}));
  streetBulb.position.copy(streetGlow.position);exterior.add(streetBulb);
  // Complete street dressing: three-dimensional city blocks, rooftop equipment,
  // a parked compact car, a locked bicycle and a small dog waiting by the entrance.
  const roofMat=extMat("#454b49",.88),roofEdge=extMat("#777c76",.86),roofDark=extMat("#343b3a",.72,.12);
  // The supermarket is a complete building volume now, not a thin stage wall.
  extBox([8.55,.24,6.15],[-2.65,3.48,-7.75],roofMat);
  extBox([8.4,.32,.18],[-2.65,3.68,-4.92],roofEdge);
  extBox([.20,4.95,5.72],[-6.82,.72,-7.75],storeWall);
  extBox([.20,4.95,5.72],[1.52,.72,-7.75],storeWall);
  extBox([8.28,.16,.20],[-2.65,-1.91,-4.83],roofDark);
  // Rooftop parapets, ventilation housings, ducts and service walkway.
  extBox([8.52,.28,.18],[-2.65,3.70,-10.72],roofEdge);
  extBox([.18,.28,5.82],[-6.82,3.70,-7.82],roofEdge);
  extBox([.18,.28,5.82],[1.52,3.70,-7.82],roofEdge);
  for(let i=0;i<3;i++){
    extBox([1.05,.62,.82],[-5.25+i*2.3,3.96,-8.55],roofDark);
    extBox([.78,.075,.62],[-5.25+i*2.3,4.30,-8.55],roofEdge);
    for(let vent=0;vent<4;vent++)extBox([.055,.32,.60],[-5.58+i*2.3+vent*.20,3.94,-8.55],roofEdge);
  }
  const ductMat=extMat("#9a9d94",.55,.38);
  extBox([.22,.18,2.1],[-.85,3.82,-9.6],ductMat);
  extBox([.18,.85,.18],[-.85,4.20,-10.4],ductMat);

  // The apartment block has a real return wall and roof thickness; the side face
  // catches cool street light and makes its mass readable in the establishing shot.
  extBox([.22,13.05,5.12],[2.91,4.66,-7.49],buildingTrim);
  extBox([.22,13.05,5.12],[7.79,4.66,-7.49],buildingTrim);
  extBox([5.05,.24,5.45],[5.35,11.32,-7.50],buildingTrim);
  extBox([5.12,.26,.20],[5.35,11.52,-4.82],buildingConcrete);
  extBox([5.12,.26,.20],[5.35,11.52,-10.18],buildingConcrete);
  // Roof terrace parapet and a visible service stair core / water tanks.
  extBox([.16,1.0,5.1],[2.92,11.95,-7.5],buildingConcrete);
  extBox([.16,1.0,5.1],[7.78,11.95,-7.5],buildingConcrete);
  const tankMat=extMat("#7d8987",.52,.18);
  for(let i=0;i<2;i++){
    const tank=new THREE.Mesh(new THREE.CylinderGeometry(.48,.48,.95,16),tankMat);
    tank.position.set(4.25+i*1.15,12.12,-8.6);tank.castShadow=true;exterior.add(tank);
    extBox([.12,.12,.12],[4.25+i*1.15,12.64,-8.6],roofDark);
    extBox([.07,.55,.07],[4.25+i*1.15,12.85,-8.6],roofDark);
  }
  // More natural surrounding city context: a lower residential building on the
  // left and a corner apartment block on the right, both with side walls and roofs.
  const sideConcrete=extMat("#777b76",.94),sideCream=extMat("#c4b9a4",.92),sideShadow=extMat("#514e47",.82);
  extBox([5.45,7.6,5.8],[-10.45,1.80,-7.55],sideConcrete);
  extBox([5.65,.22,6.0],[-10.45,5.72,-7.55],roofEdge);
  extBox([.18,7.25,5.6],[-13.18,1.80,-7.55],sideShadow);
  for(let floor=0;floor<3;floor++){
    const wy=-.65+floor*2.15;
    for(let col=0;col<2;col++){
      const wx=-11.55+col*2.15;
      extBox([.98,1.22,.12],[wx,wy,-4.60],sideShadow);
      const pane=new THREE.MeshStandardMaterial({color:floor===1&&col===0?"#b5a17d":"#72878d",emissive:floor===1&&col===0?"#8a633c":"#1c2b33",emissiveIntensity:.13,roughness:.25});
      extBox([.82,1.05,.05],[wx,wy,-4.51],pane);
      extBox([.04,1.08,.07],[wx,wy,-4.47],buildingMetal);
      extBox([.86,.045,.07],[wx,wy,-4.47],buildingMetal);
    }
    extBox([5.35,.10,.18],[-10.45,wy-.78,-4.52],buildingConcrete);
  }
  extBox([5.7,.20,5.95],[-10.45,-1.88,-7.55],sideShadow);
  extBox([5.5,.18,5.9],[-10.45,5.55,-7.55],sideCream);
  // Right-hand corner building: plaster, concrete bands, balconies, recessed
  // windows, a ground-floor doorway and rooftop plant room.
  extBox([5.65,8.85,6.0],[10.55,2.45,-7.55],sideCream);
  extBox([5.82,.24,6.15],[10.55,6.99,-7.55],roofEdge);
  extBox([.22,8.55,5.85],[7.72,2.45,-7.55],sideShadow);
  for(let floor=0;floor<4;floor++){
    const wy=-.52+floor*1.95;
    for(let col=0;col<2;col++){
      const wx=9.45+col*2.18;
      extBox([1.02,1.28,.14],[wx,wy,-4.45],buildingMetal);
      const pane=new THREE.MeshStandardMaterial({color:(floor+col)%3===0?"#87969a":"#c7bda8",emissive:(floor+col)%3===0?"#263943":"#9a6a3d",emissiveIntensity:(floor+col)%3===0?.06:.16,roughness:.25,metalness:.06});
      extBox([.86,1.10,.05],[wx,wy,-4.35],pane);
      extBox([.045,1.12,.065],[wx,wy,-4.32],buildingMetal);
      extBox([.90,.045,.065],[wx,wy,-4.32],buildingMetal);
    }
    extBox([5.55,.10,.24],[10.55,wy-.80,-4.40],buildingConcrete);
    if(floor<3){
      for(const col of [0,1]){
        const bx=9.45+col*2.18,by=wy-.30;
        extBox([1.18,.07,.54],[bx,by,-4.10],buildingMetal);
        extBox([1.18,.055,.06],[bx,by+.38,-3.84],buildingMetal);
        for(const dx of [-.50,-.16,.16,.50])extBox([.035,.38,.035],[bx+dx,by+.18,-3.84],buildingMetal);
      }
    }
  }
  extBox([1.05,2.15,.16],[10.55,-.82,-4.37],buildingMetal);
  extBox([.78,1.92,.055],[10.55,-.82,-4.25],sideShadow);
  extBox([1.30,.12,.72],[10.55,.36,-4.18],buildingConcrete);
  extBox([5.75,.16,5.95],[10.55,-1.88,-7.55],sideShadow);
  extBox([1.5,1.1,1.1],[11.55,7.48,-8.15],roofDark);
  extBox([.95,.70,.95],[9.35,7.28,-8.8],tankMat);

  // Sidewalk construction: individual paving slabs, curb stones, a lowered
  // crossing ramp, tactile paving and storm-water grates.
  const pavingLine=extMat("#626865",.96),pavingLight=extMat("#999b94",.96);
  for(let i=-12;i<=12;i++){
    extBox([.018,.012,2.24],[i*1.0,-1.795,-1.94],pavingLine);
    if(i%3===0)extBox([.88,.012,.018],[i*1.0,-1.795,-2.86],pavingLight);
  }
  for(let i=-5;i<=5;i++)extBox([2.33,.16,.04],[i*2.35,-1.80,-3.13],curb);
  extBox([2.1,.035,.72],[1.7,-1.86,-3.38],pavingLight);
  const tactileMat=extMat("#b7a77d",.9);
  extBox([1.65,.025,.42],[1.7,-1.83,-2.97],tactileMat);
  for(let row=0;row<3;row++)for(let col=0;col<9;col++){
    const stud=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.035,8),tactileMat);
    stud.position.set(.98+col*.18,-1.80,-3.10+row*.12);exterior.add(stud);
  }
  const grateMat=extMat("#30383a",.76,.34);
  extBox([.68,.025,.22],[-7.6,-1.945,1.5],grateMat);
  for(let i=0;i<8;i++)extBox([.025,.012,.20],[-7.88+i*.08,-1.925,1.5],buildingConcrete);
  const manholeMat=extMat("#454c4c",.72,.38);
  const manhole=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.035,24),manholeMat);
  manhole.rotation.x=Math.PI/2;manhole.position.set(6.1,-1.952,6.8);exterior.add(manhole);
  const manholeRing=new THREE.Mesh(new THREE.TorusGeometry(.35,.025,6,24),roofEdge);
  manholeRing.position.set(6.1,-1.925,6.8);exterior.add(manholeRing);

  // Low-profile street markings and a proper parking bay around the car.
  const paintMat=extMat("#d8d8c7",.88);
  extBox([.09,.012,4.8],[-7.75,-1.953,2.7],paintMat);
  extBox([.09,.012,4.8],[-2.95,-1.953,2.7],paintMat);
  for(let i=0;i<8;i++)extBox([.16,.012,.08],[-7.5+i*.58,-1.953,5.8],roadLine);

  // A parked five-door compact car with independent body panels, glazing,
  // headlights, mirrors, tyres, alloy rims, door seams and a soft contact shadow.
  const car=new THREE.Group();car.position.set(-5.35,-1.975,2.65);car.rotation.y=-.025;exterior.add(car);
  const carPaint=extMat("#263d50",.30,.32),carDark=extMat("#17252e",.46,.15),carGlass=new THREE.MeshStandardMaterial({color:"#7f9ca5",roughness:.12,metalness:.25,transparent:true,opacity:.78});
  const carMetal=extMat("#aeb9b9",.24,.82),carRubber=extMat("#171b1d",.72,.02),lampMat=new THREE.MeshStandardMaterial({color:"#f7e8bd",emissive:"#f3d28d",emissiveIntensity:.48,roughness:.2});
  const carBox=(size:[number,number,number],pos:[number,number,number],material:THREE.Material)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),material);mesh.position.set(...pos);mesh.castShadow=true;mesh.receiveShadow=true;car.add(mesh);return mesh;
  };
  const carRod=(a:[number,number,number],b:[number,number,number],radius:number,material:THREE.Material)=>{
    const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,delta.length(),8),material);
    mesh.position.copy(start.add(end).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());car.add(mesh);return mesh;
  };
  carBox([3.85,.62,1.50],[0,.73,0],carPaint);
  carBox([1.12,.40,1.47],[1.33,.83,0],carPaint);
  carBox([.82,.34,1.46],[-1.48,.79,0],carPaint);
  carBox([1.90,.72,1.28],[-.12,1.27,0],carPaint);
  carBox([1.78,.58,1.19],[-.12,1.31,0],carGlass);
  // Pillars separate the windscreen and door glazing instead of one opaque cabin cube.
  for(const side of [-1,1]){
    const z=side*.675;
    for(const x of [-.98,-.12,.72])carRod([x,1.00,z],[x+.02,1.60,z*.91],.045,carDark);
    carBox([.70,.40,.025],[-.57,1.32,side*.654],carGlass);
    carBox([.69,.40,.025],[.30,1.32,side*.654],carGlass);
    carBox([.035,.075,.035],[-.88,.91,side*.77],carMetal);
    carBox([.32,.045,.025],[.08,.98,side*.758],carDark);
    carBox([.16,.045,.025],[.66,.98,side*.758],carDark);
    carBox([.15,.12,.16],[.92,1.18,side*.76],carPaint);
  }
  carBox([.10,.26,1.30],[1.93,.72,0],carDark);
  carBox([.12,.27,.42],[1.99,.77,.0],carMetal);
  carBox([.08,.22,.40],[-1.99,.78,0],lampMat);
  for(const x of [-1.20,1.18])for(const side of [-1,1]){
    const tyre=new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,.20,20),carRubber);
    tyre.rotation.x=Math.PI/2;tyre.position.set(x,.36,side*.76);tyre.castShadow=true;car.add(tyre);
    const rim=new THREE.Mesh(new THREE.CylinderGeometry(.205,.205,.214,18),carMetal);
    rim.rotation.x=Math.PI/2;rim.position.set(x,.36,side*.77);car.add(rim);
    const hub=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.22,12),carDark);
    hub.rotation.x=Math.PI/2;hub.position.set(x,.36,side*.78);car.add(hub);
    for(let spoke=0;spoke<6;spoke++){
      const angle=spoke*Math.PI/3;
      const bolt=new THREE.Mesh(new THREE.SphereGeometry(.026,6,5),roofEdge);
      bolt.position.set(x+Math.cos(angle)*.145,.36+Math.sin(angle)*.145,side*.895);car.add(bolt);
    }
  }
  carBox([.05,.20,.19],[1.95,.94,.48],lampMat);
  carBox([.05,.20,.19],[1.95,.94,-.48],lampMat);
  carBox([.08,.22,.18],[-1.96,.93,.50],extMat("#a44339",.35));
  carBox([.08,.22,.18],[-1.96,.93,-.50],extMat("#a44339",.35));
  carBox([.18,.09,.42],[1.91,.56,0],carDark);
  carBox([.18,.09,.42],[-1.92,.57,0],carDark);
  const carShadow=new THREE.Mesh(new THREE.PlaneGeometry(4.3,2.05),new THREE.MeshBasicMaterial({color:"#080d12",transparent:true,opacity:.30,depthWrite:false}));
  carShadow.rotation.x=-Math.PI/2;carShadow.position.set(-5.35,-1.962,2.65);exterior.add(carShadow);

  // A properly framed city bicycle: two spoked wheels, welded diamond frame,
  // front fork, chain ring, pedals, saddle, handlebar, fenders and kickstand.
  const bike=new THREE.Group();bike.position.set(3.55,-1.975,-3.02);bike.rotation.y=.025;exterior.add(bike);
  const bikeMetal=extMat("#aeb8b5",.30,.82),bikeDark=extMat("#293236",.52,.25),bikeRubber=extMat("#171b1d",.72,.02);
  const bikeRod=(a:[number,number,number],b:[number,number,number],radius:number,material:THREE.Material)=>{
    const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b),delta=vb.clone().sub(va);
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,delta.length(),8),material);
    mesh.position.copy(va.add(vb).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());bike.add(mesh);return mesh;
  };
  const wheelCenters=[[-.68,.48,0],[.68,.48,0]] as const;
  for(const [wx,wy,wz] of wheelCenters){
    const tire=new THREE.Mesh(new THREE.TorusGeometry(.43,.052,8,28),bikeRubber);tire.position.set(wx,wy,wz);bike.add(tire);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(.365,.018,6,28),bikeMetal);rim.position.set(wx,wy,.006);bike.add(rim);
    const hub=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.13,14),bikeMetal);hub.rotation.x=Math.PI/2;hub.position.set(wx,wy,.01);bike.add(hub);
    for(let i=0;i<10;i++){
      const a=i*Math.PI/5;
      bikeRod([wx,wy,0],[wx+Math.cos(a)*.36,wy+Math.sin(a)*.36,0],.008,bikeMetal);
    }
    const fender=new THREE.Mesh(new THREE.TorusGeometry(.47,.018,6,28,Math.PI),bikeDark);fender.position.set(wx,wy,.04);bike.add(fender);
  }
  bikeRod([-.68,.48,0],[-.10,.52,0],.027,bikeMetal);
  bikeRod([-.10,.52,0],[-.32,1.00,0],.027,bikeMetal);
  bikeRod([-.32,1.00,0],[-.68,.48,0],.027,bikeMetal);
  bikeRod([-.32,1.00,0],[.38,1.02,0],.027,bikeMetal);
  bikeRod([.38,1.02,0],[.68,.48,0],.027,bikeMetal);
  bikeRod([.68,.48,0],[-.10,.52,0],.027,bikeMetal);
  bikeRod([.38,1.02,0],[.31,1.16,0],.045,bikeDark);
  bikeRod([.18,1.16,0],[.45,1.16,0],.035,bikeMetal);
  bikeRod([-.32,1.00,0],[-.40,1.16,0],.032,bikeDark);
  bikeRod([-.63,1.17,0],[-.20,1.17,0],.042,bikeDark);
  const saddle=new THREE.Mesh(new THREE.BoxGeometry(.38,.11,.20),bikeDark);
  saddle.position.set(-.375,1.17,0);bike.add(saddle);
  bikeRod([-.10,.52,0],[-.10,.32,0],.035,bikeDark);
  bikeRod([-.26,.32,0],[.06,.32,0],.022,bikeMetal);
  bikeRod([-.10,.32,0],[-.23,.27,0],.028,bikeDark);
  bikeRod([-.10,.32,0],[.03,.27,0],.028,bikeDark);
  bikeRod([-.68,.48,.035],[.68,.48,.035],.012,bikeDark);
  bikeRod([-.32,1.00,.05],[-.32,1.20,.05],.018,bikeMetal);
  const frontLamp=new THREE.Mesh(new THREE.SphereGeometry(.08,10,8),lampMat);frontLamp.position.set(.42,1.12,.02);bike.add(frontLamp);
  const rearReflector=new THREE.Mesh(new THREE.BoxGeometry(.11,.07,.06),new THREE.MeshBasicMaterial({color:"#df493f"}));rearReflector.position.set(-.42,1.12,.04);bike.add(rearReflector);
  bikeRod([.13,.27,0],[.18,.02,0],.018,bikeDark);
  const bikeShadow=new THREE.Mesh(new THREE.PlaneGeometry(2.25,1.0),new THREE.MeshBasicMaterial({color:"#0a1013",transparent:true,opacity:.23,depthWrite:false}));
  bikeShadow.rotation.x=-Math.PI/2;bikeShadow.position.set(3.55,-1.962,-3.02);exterior.add(bikeShadow);

  // A small but articulated mixed-breed dog waits beside the supermarket door.
  // Distinct muzzle, ears, paws, collar, tail and face keep it readable as an animal.
  const dog=new THREE.Group();dog.position.set(1.75,-1.975,-3.95);dog.rotation.y=-.18;exterior.add(dog);
  const fur=extMat("#9a6946",.92),furLight=extMat("#d0a77e",.88),furDark=extMat("#54392b",.9),dogBlack=extMat("#201b19",.48);
  const dogEllipsoid=(pos:[number,number,number],scale:[number,number,number],material:THREE.Material)=>{
    const mesh=new THREE.Mesh(new THREE.SphereGeometry(.5,14,10),material);mesh.position.set(...pos);mesh.scale.set(...scale);mesh.castShadow=true;mesh.receiveShadow=true;dog.add(mesh);return mesh;
  };
  const dogRod=(a:[number,number,number],b:[number,number,number],radius:number,material:THREE.Material)=>{
    const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b),delta=vb.clone().sub(va);
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius*.82,radius,delta.length(),8),material);
    mesh.position.copy(va.add(vb).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());dog.add(mesh);return mesh;
  };
  dogEllipsoid([-.05,.64,0],[1.08,.63,.48],fur);
  dogEllipsoid([-.44,.70,0],[.43,.48,.40],furLight);
  dogEllipsoid([.36,.79,0],[.40,.51,.39],fur);
  dogEllipsoid([.43,1.03,0],[.62,.57,.53],fur);
  dogEllipsoid([.72,.91,.015],[.34,.23,.30],furLight);
  dogEllipsoid([.88,.97,.02],[.13,.10,.16],dogBlack);
  for(const side of [-1,1]){
    dogEllipsoid([.47,1.10,side*.235],[.055,.075,.028],dogBlack);
    const ear=dogEllipsoid([.25,1.22,side*.25],[.15,.29,.13],furDark);ear.rotation.z=side===-1?.22:-.18;
    dogEllipsoid([-.50,.25,side*.18],[.21,.24,.17],fur);
    dogRod([-.50,.31,side*.18],[-.52,.08,side*.18],.105,fur);
    dogEllipsoid([-.52,.075,side*.18],[.18,.095,.14],furDark);
    dogEllipsoid([.35,.27,side*.18],[.20,.24,.16],fur);
    dogRod([.35,.31,side*.18],[.39,.08,side*.18],.105,fur);
    dogEllipsoid([.39,.075,side*.18],[.18,.095,.14],furDark);
  }
  dogRod([-.54,.80,0],[-.78,1.00,0],.10,furDark);
  dogEllipsoid([-.81,1.03,0],[.15,.16,.15],furDark);
  const collar=new THREE.Mesh(new THREE.TorusGeometry(.23,.035,8,20),extMat("#8e3434",.5,.1));
  collar.rotation.y=Math.PI/2;collar.position.set(.26,.91,0);dog.add(collar);
  dogEllipsoid([.27,.70,.24],[.09,.12,.045],carMetal);
  dogEllipsoid([.95,.94,.02],[.045,.035,.045],dogBlack);
  const dogShadow=new THREE.Mesh(new THREE.PlaneGeometry(1.55,.82),new THREE.MeshBasicMaterial({color:"#090e12",transparent:true,opacity:.24,depthWrite:false}));
  dogShadow.rotation.x=-Math.PI/2;dogShadow.position.set(1.75,-1.962,-3.95);exterior.add(dogShadow);

  // Warm door-side light, a simple notice panel and metal bollards anchor the props
  // to the architecture instead of leaving them floating in an empty street.
  extBox([.12,1.10,.10],[1.12,-.95,-4.40],roofDark);
  extBox([.82,.12,.26],[1.12,-.36,-4.31],buildingConcrete);
  const bollardMat=extMat("#4b5554",.38,.48);
  for(const x of [-.65,2.9]) {
    const bollard=new THREE.Mesh(new THREE.CylinderGeometry(.075,.10,.72,10),bollardMat);
    bollard.position.set(x,-1.60,-3.48);exterior.add(bollard);
    const cap=new THREE.Mesh(new THREE.SphereGeometry(.08,8,6),carMetal);cap.position.set(x,-1.22,-3.48);exterior.add(cap);
  }

  // A deep navy night sky; all emissive shop and house windows stay warm by contrast.
  exterior.traverse(object=>{if(object instanceof THREE.Mesh){object.castShadow=false;object.receiveShadow=false;}});
  const exteriorBackground=new THREE.Color("#0a1424");
  const exteriorFog=new THREE.Fog("#0a1424",34,78);
  const interiorBackground=new THREE.Color("#d9d5ca");
  const interiorFog=new THREE.Fog("#d9d5ca",22,48);

  const update=(time:number,dialogue:EntrePartidasCue[])=>{
    const cue=dialogue.find(c=>time>=c.start&&time<=c.end);
    const speaker=cue?.speaker;
    const isTomasEpisode=dialogue.some(c=>c.speaker==="tomas"||c.speaker==="ernesto");
    if(isTomasEpisode){
      bruno.root.visible=false;martina.root.visible=false;valentina.root.visible=false;
      tomas.root.visible=time>=4.15;ernesto.root.visible=time>=53;
      tomas.root.position.set(time<29?-.85:-1.05,-1.975,.15);
      ernesto.root.position.set(1.05,-1.975,-.35);
      tomas.root.rotation.y=time<53?0:-.28;ernesto.root.rotation.y=-.12;
      tomas.leftLeg.rotation.x=0;tomas.rightLeg.rotation.x=0;
      ernesto.leftLeg.rotation.x=0;ernesto.rightLeg.rotation.x=0;
      for(const rig of [tomas,ernesto]){
        const talking=rig.name===speaker,phase=rig.name==="tomas" ? .3 : 1.9;
        rig.head.rotation.y=(cue?.look===rig.name ? -.12 : cue?.look ? .07 : 0)+Math.sin(time*.42+phase)*.006;
        rig.head.rotation.x=talking?Math.sin(time*2.7+phase)*.018:Math.sin(time*.5+phase)*.005;
        let mouthOpen=.025;
        if(talking&&cue)mouthOpen=.06+Math.pow(Math.max(0,Math.sin((time-cue.start)*8.5)),.72)*.58;
        rig.mouth.scale.set(1,mouthOpen,1);
        rig.leftArm.rotation.z=talking?-.045+Math.sin(time*1.7+phase)*.018:0;
        rig.rightArm.rotation.z=talking ? .045+Math.sin(time*1.6+phase)*.018 : 0;
      }
      if(time<4.15){interior.visible=false;exterior.visible=true;world.background=exteriorBackground;world.fog=exteriorFog;}
      else{interior.visible=true;exterior.visible=false;world.background=interiorBackground;world.fog=interiorFog;}
      cart.position.x=-2.75;
      return;
    }
    const ease=(v:number)=>{const q=Math.max(0,Math.min(1,v));return q*q*(3-2*q);};
    const approach=ease((time-8.05)/1.05);
    martina.root.visible=time>=9.0833;
    valentina.root.visible=time>=9.0833;
    martina.root.position.x=-2.65;
    valentina.root.position.x=-1.35;
    martina.root.position.z=-4.05+1.62*approach;
    valentina.root.position.z=-4.05+1.62*approach;
    // Both girls turn toward Bruno before the camera reveals them.
    martina.root.rotation.y=.78;
    valentina.root.rotation.y=.48;
    interior.visible=time>=4.15;
    exterior.visible=time<4.15;
    world.background=time<4.15?exteriorBackground:interiorBackground;
    world.fog=time<4.15?exteriorFog:interiorFog;
    bruno.root.rotation.y=0;
    bruno.leftLeg.rotation.x=-1.02;bruno.rightLeg.rotation.x=-1.16;
    bruno.leftLeg.rotation.z=-.025;bruno.rightLeg.rotation.z=.025;
    for(const rig of [bruno,martina,valentina]){
      const talking=rig.name===speaker;
      const lookAngle=cue?.look===rig.name ? -.13 : cue?.look ? .07 : 0;
      const phase=rig.name==="bruno"?0:rig.name==="martina"?1.7:3.1;
      rig.head.rotation.y=lookAngle+Math.sin(time*.48+phase)*.007;
      rig.head.rotation.x=talking?Math.sin(time*2.9+phase)*.022:Math.sin(time*.55+phase)*.006;
      rig.head.rotation.z=Math.sin(time*.62+phase)*.006;
      // Approximate mouth articulation from the syllable rhythm of the active spoken line.
      let mouthOpen=.025;
      if(talking&&cue){
        const words=cue.text.toLowerCase().match(/[a-záéíóúüñ]+/g)??[];
        const syllables=words.map(word=>Math.max(1,(word.match(/[aeiouáéíóúü]/g)??[]).length));
        const total=syllables.reduce((a,b)=>a+b,0)||1;
        const duration=Math.max(.08,cue.end-cue.start);
        const progress=Math.max(0,Math.min(.999,(time-cue.start)/duration));
        let cursor=0,local=0;
        for(const count of syllables){const span=count/total;if(progress>=cursor&&progress<cursor+span){local=(progress-cursor)/span;break;}cursor+=span;}
        const syllablePulse=Math.pow(Math.max(0,Math.sin(local*Math.PI*2)),.72);
        mouthOpen=.06+syllablePulse*.78;
      }
      rig.mouth.scale.set(1,mouthOpen,1);
      rig.mouth.position.y=-.22-mouthOpen*.004;
      // Small conversational gestures, with relaxed elbows and no exaggerated waving.
      const gesture=talking&&rig.name!=="bruno"?1:0;
      rig.leftArm.rotation.z=gesture?-.055+Math.sin(time*2.0+phase)*.025:0;
      rig.rightArm.rotation.z=gesture?.055+Math.sin(time*1.8+phase+1)*.025:0;
      rig.leftArm.rotation.x=gesture?.045+Math.sin(time*2.2+phase)*.025:0;
      rig.rightArm.rotation.x=gesture?-.045+Math.sin(time*1.9+phase+1)*.025:0;
      rig.root.rotation.z=talking?Math.sin(time*1.1+phase)*.004:0;
      rig.root.position.y=-1.975;
    }
    if(time<18){
      bruno.leftArm.rotation.set(0,.015,.018);
      bruno.rightArm.rotation.set(0,-.015,-.018);
      const studyNod=time>=1.8&&time<9.7?Math.sin(time*4.5)*.026+Math.sin(time*9.0)*.006:Math.sin(time*1.2)*.008;
      bruno.head.rotation.x=-.20+studyNod;
      packet.rotation.set(0,0,0);
      packet2.rotation.set(0,0,0);
    }
    if(time>=8.05&&time<9.10){
      const fade=1-ease((time-9.95)/.75);
      // Short, gentle synchronized steps: both women approach from the same direction.
      const travelled=1.62*approach;
      const cycle=travelled*(Math.PI*2/1.55);
      for(const rig of [martina,valentina]){
        const phase=rig.name==="martina"?0:.16;
        const stride=Math.sin(cycle+phase)*.155*fade;
        rig.leftLeg.rotation.x=stride;
        rig.rightLeg.rotation.x=-stride;
        rig.leftLeg.rotation.z=0;rig.rightLeg.rotation.z=0;
        rig.leftArm.rotation.x=-stride*.28;
        rig.rightArm.rotation.x=stride*.28;
        rig.leftArm.rotation.z=Math.sin(cycle+Math.PI+phase)*.012*fade;
        rig.rightArm.rotation.z=Math.sin(cycle+phase)*.012*fade;
        // A tiny vertical body bounce gives the walk a natural weight shift.
        rig.root.position.y=-1.975+Math.abs(Math.sin(cycle+phase))*.025*fade;
      }
    }else{
      for(const rig of [martina,valentina]){
        rig.leftLeg.rotation.x=0;rig.rightLeg.rotation.x=0;
        rig.leftLeg.rotation.z=0;rig.rightLeg.rotation.z=0;
        rig.leftArm.rotation.x=0;rig.rightArm.rotation.x=0;
        rig.leftArm.rotation.z=0;rig.rightArm.rotation.z=0;
      }
    }
    // After the girls are revealed on "aprender", hold their gaze on Bruno.
    // A second later they make a tiny, restrained hand gesture before speaking.
    if(time>=9.10&&time<10.45){
      const gesture=ease((time-9.42)/.34);
      for(const rig of [martina,valentina]){
        const phase=rig.name==="martina"?0:.7;
        rig.head.rotation.y=Math.sin(time*.42+phase)*.008;
        rig.leftArm.rotation.z=-.018-gesture*(.045+Math.sin(time*2.2+phase)*.012);
        rig.rightArm.rotation.z=.018+gesture*(.045+Math.sin(time*2.0+phase+1)*.012);
        rig.leftArm.rotation.x=.018+gesture*.025;
        rig.rightArm.rotation.x=-.018-gesture*.025;
      }
    }
    if(time>=46&&time<65)valentina.rightArm.rotation.z=.08;
    cart.position.x=-2.75;
  };
  return {
    update,
    getSpeakerPosition(speaker){
      const rig=speaker==="bruno"?bruno:speaker==="martina"?martina:speaker==="tomas"?tomas:speaker==="ernesto"?ernesto:valentina;
      return new THREE.Vector3(rig.root.position.x,speaker==="bruno"?-1.0:-.55,rig.root.position.z);
    }
  };
}


export function drawEntrePartidasBranding(ctx:CanvasRenderingContext2D,time:number,width:number,height:number,chapter=1,cast="Bruno · Martina · Valentina",endCardStart=67.20){
  const scale=width/720;
  const rounded=(x:number,y:number,w:number,h:number,r:number)=>{
    ctx.beginPath();ctx.roundRect(x,y,w,h,r);
  };
  if(time<2.05){
    const fade=Math.min(1,time/.28,(2.05-time)/.35);
    ctx.save();ctx.globalAlpha=Math.max(0,fade);
    // Top-aligned series bug: leave the nighttime storefront visible below the title.
    const panelW=width*.90,panelH=height*.155,x=(width-panelW)/2,y=height*.045;
    ctx.shadowColor="rgba(0,0,0,.38)";ctx.shadowBlur=24*scale;
    const g=ctx.createLinearGradient(x,y,x+panelW,y+panelH);
    g.addColorStop(0,"rgba(20,48,39,.96)");g.addColorStop(1,"rgba(31,67,54,.94)");
    ctx.fillStyle=g;rounded(x,y,panelW,panelH,20*scale);ctx.fill();
    ctx.shadowBlur=0;ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillStyle="#d7e8ad";ctx.font="900 "+Math.round(16*scale)+"px Arial";
    ctx.fillText("INGREDORA ORIGINALS",width/2,y+panelH*.17);
    ctx.fillStyle="#fffaf0";ctx.font="900 "+Math.round(54*scale)+"px Arial Black,Arial";
    ctx.fillText("ENTRE PARTIDAS",width/2,y+panelH*.49);
    ctx.fillStyle="#f0d18b";ctx.font="900 "+Math.round(22*scale)+"px Arial";
    ctx.fillText("CAPÍTULO "+chapter,width/2,y+panelH*.82);
    ctx.restore();
  }
  // Bruno's final "Sí, sí..." ends at 56.85s. Start the closing slate promptly.
  if(time>=endCardStart){
    const fade=Math.min(1,(time-endCardStart)/.42);
    ctx.save();ctx.globalAlpha=fade;
    const veil=ctx.createLinearGradient(0,0,0,height);
    veil.addColorStop(0,"rgba(10,25,20,.96)");veil.addColorStop(.52,"rgba(13,35,27,.98)");veil.addColorStop(1,"rgba(7,18,15,1)");
    ctx.fillStyle=veil;ctx.fillRect(0,0,width,height);
    // Restrained gold-green frame and a small animated accent make this a reusable series end card.
    ctx.strokeStyle="rgba(215,232,173,.62)";ctx.lineWidth=2*scale;
    rounded(width*.105,height*.205,width*.79,height*.59,22*scale);ctx.stroke();
    ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillStyle="#d7e8ad";ctx.font="900 "+Math.round(22*scale)+"px Arial";
    ctx.fillText("INGREDORA ORIGINALS",width/2,height*.285);
    ctx.fillStyle="#fffaf0";ctx.font="900 "+Math.round(61*scale)+"px Arial Black,Arial";
    ctx.fillText("ENTRE PARTIDAS",width/2,height*.395);
    ctx.fillStyle="#f0d18b";ctx.font="800 "+Math.round(23*scale)+"px Arial";
    ctx.fillText("Una serie de Ingredora",width/2,height*.475);
    ctx.fillStyle="#f4d58d";ctx.font="900 "+Math.round(40*scale)+"px Arial";
    ctx.fillText("ingredora.com",width/2,height*.585);
    ctx.fillStyle="#e6e0cf";ctx.font="700 "+Math.round(18*scale)+"px Arial";
    ctx.fillText("Creado y producido por Ingredora",width/2,height*.685);
    ctx.fillStyle="rgba(230,224,207,.82)";ctx.font="600 "+Math.round(16*scale)+"px Arial";
    ctx.fillText(cast,width/2,height*.735);
    ctx.restore();
  }
}

export function drawEntrePartidasCaptions(ctx:CanvasRenderingContext2D,time:number,width:number,height:number,dialogue:EntrePartidasCue[]){
  const cue=dialogue.find(item=>time>=item.start&&time<=item.end);if(!cue)return;
  const names:Record<EntrePartidasSpeaker,string>={bruno:"BRUNO",martina:"MARTINA",tomas:"TOMÁS",valentina:"VALENTINA",ernesto:"ERNESTO"};
  const scale=width/720,maxTextW=width*.90;
  ctx.save();
  // Floating subtitles, with a heavy black outline instead of a background panel.
  ctx.textAlign="center";ctx.textBaseline="middle";
  ctx.lineJoin="round";ctx.lineCap="round";
  ctx.strokeStyle="rgba(0,0,0,.98)";
  const words=cue.text.split(/\s+/).filter(Boolean);let line="",allLines:string[]=[];
  ctx.font="700 "+Math.round(29*scale)+"px Arial";
  for(const word of words){
    const candidate=line?line+" "+word:word;
    if(ctx.measureText(candidate).width>maxTextW&&line){allLines.push(line);line=word;}
    else line=candidate;
  }
  if(line)allLines.push(line);
  const pages=Math.max(1,Math.ceil(allLines.length/2));
  const duration=Math.max(.01,cue.end-cue.start);
  const page=Math.min(pages-1,Math.floor(((time-cue.start)/duration)*pages));
  const lines=allLines.slice(page*2,page*2+2);
  const lineH=38*scale,nameH=27*scale,gap=5*scale;
  const totalH=nameH+gap+lines.length*lineH;
  let y=height*.955-totalH/2;
  ctx.font="900 "+Math.round(19*scale)+"px Arial";
  ctx.lineWidth=6*scale;ctx.fillStyle="#d5e8b2";
  const speaker=names[cue.speaker];
  ctx.strokeText(speaker,width/2,y);ctx.fillText(speaker,width/2,y);
  y+=nameH+gap;
  ctx.font="900 "+Math.round(29*scale)+"px Arial";
  ctx.fillStyle="#fffaf0";ctx.lineWidth=7*scale;
  lines.forEach(value=>{ctx.strokeText(value,width/2,y);ctx.fillText(value,width/2,y);y+=lineH;});
  ctx.restore();
}
