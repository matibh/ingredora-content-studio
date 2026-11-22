import * as THREE from "three";

export type DinnerSpeaker = "bruno" | "martina" | "tomas" | "valentina" | "ernesto";
export type DinnerCue = { id?: string; speaker: DinnerSpeaker; text: string; start: number; end: number; look?: DinnerSpeaker };
type DinerRig = { name: DinnerSpeaker; root: THREE.Group; head: THREE.Group; mouth: THREE.Mesh; leftArm: THREE.Group; rightArm: THREE.Group; x: number; z: number };
export type EntrePartidasDinnerSet = { update(time: number, dialogue: DinnerCue[]): void; getSpeakerPosition(speaker: DinnerSpeaker): THREE.Vector3 };

const mat=(color:string,roughness=.78,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const box=(parent:THREE.Object3D,size:[number,number,number],material:THREE.Material,pos:[number,number,number],cast=true)=>{
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),material);mesh.position.set(...pos);mesh.castShadow=cast;mesh.receiveShadow=true;parent.add(mesh);return mesh;
};
const sphere=(parent:THREE.Object3D,scale:[number,number,number],material:THREE.Material,pos:[number,number,number],segments=14)=>{
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(.5,segments,10),material);mesh.position.set(...pos);mesh.scale.set(...scale);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
};
const rod=(parent:THREE.Object3D,a:[number,number,number],b:[number,number,number],radius:number,material:THREE.Material)=>{
  const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b),delta=vb.clone().sub(va);
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,delta.length(),8),material);
  mesh.position.copy(va.add(vb).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
  mesh.castShadow=true;parent.add(mesh);return mesh;
};
const texture=(draw:(ctx:CanvasRenderingContext2D,w:number,h:number)=>void,w=512,h=220)=>{
  const canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext("2d");if(!ctx)throw new Error("No se pudo crear la textura del departamento.");
  draw(ctx,w,h);const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=8;return map;
};

function createDiner(name:DinnerSpeaker,x:number,z:number,turn:number):DinerRig{
  const root=new THREE.Group();root.position.set(x,-1.92,z);root.rotation.y=turn;
  const skinColors:Record<DinnerSpeaker,string>={bruno:"#c98e6e",martina:"#d6a080",tomas:"#e1b18e",valentina:"#dfaa8b",ernesto:"#c99a79"};
  const hairColors:Record<DinnerSpeaker,string>={bruno:"#30241f",martina:"#30201c",tomas:"#4b3328",valentina:"#211b1a",ernesto:"#8b8a82"};
  const shirtColors:Record<DinnerSpeaker,string>={bruno:"#c46a43",martina:"#bd7958",tomas:"#527c78",valentina:"#47788a",ernesto:"#718064"};
  const skin=mat(skinColors[name]),hair=mat(hairColors[name],.92),shirt=mat(shirtColors[name],.88);
  const pants=mat(name==="ernesto"?"#4b5148":"#35414a"),shoes=mat("#23282a",.58),dark=mat("#25201e",.7),ivory=mat("#fff8e9",.42);
  // Chairs, with warm timber and different fabric shades.
  const chairWood=mat("#6e5038",.58),chairFabric=mat(name==="bruno"||name==="valentina"?"#526b69":"#7d6550",.95);
  box(root,[.96,1.58,.16],chairWood,[0,1.40,-.72]);box(root,[.82,1.35,.08],chairFabric,[0,1.43,-.615]);
  box(root,[1.02,.16,.96],chairWood,[0,.78,-.12]);
  for(const side of [-1,1]){box(root,[.10,.90,.10],chairWood,[side*.41,.32,-.43]);box(root,[.10,.90,.10],chairWood,[side*.41,.32,.25]);}
  // Seated chest, waist and thighs.
  if(name==="bruno"){box(root,[1.04,1.34,.58],shirt,[0,2.08,-.04]);box(root,[.22,.16,.035],mat("#a95637"),[0,1.42,.262],false);}
  else if(name==="ernesto"){box(root,[1.08,1.28,.62],shirt,[0,2.05,-.04]);box(root,[.05,.80,.035],mat("#d3c7a9"),[0,2.10,.284],false);box(root,[.10,.38,.04],mat("#d3c7a9"),[0,1.80,.29],false);}
  else{box(root,[.94,1.28,.54],shirt,[0,2.05,-.04]);if(name==="martina")box(root,[.14,.80,.035],mat("#e5c3a7"),[0,2.12,.278],false);else if(name==="valentina")box(root,[.09,.64,.035],mat("#d6d7d0"),[0,2.10,.278],false);else{box(root,[.08,.92,.035],mat("#d9d3c4"),[0,2.08,.278],false);box(root,[.44,.10,.04],mat("#d9d3c4"),[0,2.48,.30],false);}}
  box(root,[.64,.42,.54],pants,[0,1.32,.16]);
  for(const side of [-1,1]){const thigh=box(root,[.38,.42,.88],pants,[side*.25,.93,.53]);thigh.rotation.x=-.09;box(root,[.38,.18,.75],shoes,[side*.25,.73,1.02]);}
  // Individually recognizable cubic heads and hairstyles.
  const head=new THREE.Group();head.position.set(0,3.02,.02);root.add(head);box(head,[.78,.84,.70],skin,[0,0,0]);
  if(name==="bruno"){box(head,[.82,.23,.74],hair,[0,.33,-.015]);box(head,[.73,.14,.64],hair,[-.04,.47,.005]);box(head,[.19,.18,.22],hair,[-.29,.20,.25]);}
  else if(name==="martina"){box(head,[.84,.24,.72],hair,[0,.34,-.03]);box(head,[.75,.58,.18],hair,[0,-.04,-.34]);box(head,[.15,.56,.43],hair,[-.34,-.04,-.02]);box(head,[.15,.56,.43],hair,[.34,-.04,-.02]);box(head,[.23,.16,.20],hair,[.15,.52,-.34]);box(head,[.10,.11,.12],mat("#d8a64c"),[.15,.51,-.45]);box(head,[.22,.38,.20],hair,[.19,.29,-.55]);}
  else if(name==="tomas"){box(head,[.85,.24,.70],hair,[0,.35,-.02]);box(head,[.69,.20,.36],hair,[-.10,.49,.10]);box(head,[.24,.18,.30],hair,[.22,.40,.18]);box(head,[.15,.25,.18],hair,[-.27,.30,.20]);box(head,[.12,.43,.18],hair,[-.34,-.08,-.28]);box(head,[.12,.43,.18],hair,[.34,-.08,-.28]);}
  else if(name==="valentina"){box(head,[.83,.25,.72],hair,[0,.35,-.03]);box(head,[.72,.62,.19],hair,[0,-.05,-.35]);box(head,[.16,.76,.27],hair,[-.36,-.20,-.04]);box(head,[.16,.76,.27],hair,[.36,-.20,-.04]);box(head,[.12,.54,.22],hair,[-.34,-.50,-.08]);box(head,[.12,.54,.22],hair,[.34,-.50,-.08]);sphere(head,[.09,.12,.07],mat("#d7ad55",.34,.7),[.42,-.13,.36],10);}
  else{box(head,[.82,.22,.70],hair,[0,.35,-.03]);box(head,[.74,.18,.60],hair,[0,.47,-.05]);box(head,[.14,.36,.28],hair,[-.34,.20,.13]);box(head,[.14,.36,.28],hair,[.34,.20,.13]);}
  for(const side of [-1,1]){box(head,[.14,.095,.018],ivory,[side*.18,.035,.355],false);box(head,[.048,.068,.012],dark,[side*.18+.006,.035,.367],false);box(head,[.15,.026,.014],hair,[side*.18,.16,.348],false);}
  if(name==="ernesto"){
    const glasses=mat("#6a665d",.32,.55);
    for(const side of [-1,1]){const rim=new THREE.Mesh(new THREE.TorusGeometry(.105,.012,6,16),glasses);rim.position.set(side*.18,.03,.365);head.add(rim);}
    box(head,[.15,.035,.025],glasses,[0,.03,.365],false);box(head,[.72,.23,.12],mat("#77786e"),[0,-.34,.325],false);box(head,[.56,.13,.10],mat("#88877c"),[0,-.43,.34],false);
  }
  const mouth=box(head,[.16,.026,.02],mat("#713b37"),[0,-.25,.36],false);
  const makeArm=(side:number)=>{
    const pivot=new THREE.Group();pivot.position.set(side*.52,2.54,.02);root.add(pivot);
    const sleeve=box(pivot,[.31,.60,.35],shirt,[side*.04,-.05,.12]);sleeve.rotation.z=side*-.10;
    box(pivot,[.21,.42,.22],skin,[side*.08,-.43,.32]);box(pivot,[.20,.15,.20],skin,[side*.08,-.66,.42]);
    return pivot;
  };
  const leftArm=makeArm(-1),rightArm=makeArm(1);
  root.traverse(object=>{if(object instanceof THREE.Mesh){object.castShadow=false;object.receiveShadow=false;}});
  return{name,root,head,mouth,leftArm,rightArm,x,z};
}

function createCokeBottle(world:THREE.Scene,x:number,y:number,z:number){
  const cola=mat("#24130c",.12,.08),glass=new THREE.MeshStandardMaterial({color:"#28180f",roughness:.18,metalness:.1,transparent:true,opacity:.94}),red=mat("#c51d2a",.34,.1);
  const bottle=new THREE.Group();bottle.position.set(x,y,z);world.add(bottle);
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.38,.34,1.16,20),cola);body.position.y=.73;bottle.add(body);
  const shoulder=new THREE.Mesh(new THREE.CylinderGeometry(.19,.38,.35,20),glass);shoulder.position.y=1.46;bottle.add(shoulder);
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(.16,.19,.43,16),glass);neck.position.y=1.82;bottle.add(neck);
  const cap=new THREE.Mesh(new THREE.CylinderGeometry(.17,.17,.055,16),red);cap.position.y=2.065;bottle.add(cap);
  const labelMap=texture((ctx,w,h)=>{
    const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,"#a90919");g.addColorStop(.55,"#e22232");g.addColorStop(1,"#8e0616");ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    ctx.fillStyle="#fff";ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="italic 900 78px Brush Script MT, Georgia, cursive";ctx.fillText("Coca-Cola",w/2,h*.48,w*.92);
    ctx.font="700 18px Arial";ctx.fillText("SABOR ORIGINAL",w/2,h*.83);
  },768,220);
  const label=new THREE.Mesh(new THREE.CylinderGeometry(.386,.386,.46,32,1,true),new THREE.MeshStandardMaterial({map:labelMap,roughness:.46}));
  label.position.y=.76;bottle.add(label);bottle.traverse(o=>{if(o instanceof THREE.Mesh)o.castShadow=true;});return bottle;
}

function createDinnerRoom(world:THREE.Scene){
  const plaster=mat("#d9cdb9",.97),warm=mat("#eee3d1",.96),sage=mat("#a7b19a",.9),wood=mat("#76543a",.52),darkWood=mat("#3e3027",.56),brass=mat("#bd9858",.34,.64);
  const glass=new THREE.MeshStandardMaterial({color:"#b9d4d0",roughness:.18,metalness:.1,transparent:true,opacity:.34,side:THREE.DoubleSide});
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(32,32),mat("#b9ad9a",.88));floor.rotation.x=-Math.PI/2;floor.position.set(0,-2,-2);world.add(floor);
  for(let x=-8;x<=8;x+=1.25)box(world,[.018,.008,20],mat("#a79b89",.96),[x,-1.993,-2],false);
  for(let z=-12;z<=8;z+=1.25)box(world,[18,.008,.018],mat("#a79b89",.96),[0,-1.992,z],false);
  box(world,[18,8.2,.28],plaster,[0,2,-8.2],false);box(world,[18,1.05,.3],sage,[0,-1.15,-8],false);box(world,[18,.11,.34],brass,[0,-.57,-7.82],false);
  // Through the apartment window, the supermarket sign is immediately outside.
  box(world,[5.7,3.5,.12],darkWood,[3.9,2.5,-7.99],false);box(world,[5.38,3.18,.07],glass,[3.9,2.5,-7.88],false);
  box(world,[.12,3.2,.13],darkWood,[2.05,2.5,-7.8],false);box(world,[.12,3.2,.13],darkWood,[5.75,2.5,-7.8],false);
  box(world,[5.45,.11,.14],darkWood,[3.9,.92,-7.79],false);box(world,[5.45,.11,.14],darkWood,[3.9,4.08,-7.79],false);box(world,[.08,3.1,.13],darkWood,[3.9,2.5,-7.75],false);
  box(world,[7,4.4,.35],mat("#62736c",.92),[3.9,1.9,-12.8],false);box(world,[5.6,.92,.16],mat("#284d3b",.45),[3.9,3.65,-12.55],false);
  const signMap=texture((ctx,w,h)=>{ctx.fillStyle="#254e3b";ctx.fillRect(0,0,w,h);ctx.fillStyle="#f8f0d7";ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="900 52px Arial";ctx.fillText("SUPERMERCADO",w/2,h*.52,w*.94);},768,180);
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(5.35,.72),new THREE.MeshBasicMaterial({map:signMap}));sign.position.set(3.9,3.65,-12.44);world.add(sign);
  box(world,[2.2,2,.1],mat("#293c35",.36),[2.9,1.38,-12.48],false);box(world,[2.2,2,.1],mat("#263a36",.36),[5.1,1.38,-12.48],false);
  for(let i=0;i<6;i++)box(world,[.18,.6+(i%2)*.16,.2],mat(["#c8a04b","#6a8e72","#c85b48"][i%3]),[2.2+i*.58,.25,-12.34],false);
  // Integrated kitchen, cabinets, fridge and the apartment sofa.
  box(world,[5.2,2.9,.35],warm,[-6.15,1.5,-7.9],false);box(world,[5.4,.58,1],wood,[-6,-.55,-5.65],false);box(world,[5.5,.12,1.08],mat("#d7d4c9",.28),[-6,-.18,-5.65],false);
  for(let i=0;i<4;i++){box(world,[1.18,.72,.3],wood,[-7.9+i*1.34,1.55,-7.38],false);box(world,[.04,.35,.035],brass,[-7.9+i*1.34+.42,1.55,-7.2],false);box(world,[.04,.35,.035],brass,[-7.9+i*1.34-.42,1.55,-7.2],false);box(world,[1.18,.72,.3],mat("#8a6949",.74),[-7.9+i*1.34,-.97,-7.35],false);}
  box(world,[1.1,2.85,1],mat("#d4d7d2",.38,.22),[-8,-.48,-4.65],false);box(world,[.95,.08,.04],mat("#596360",.42,.56),[-8,.36,-4.12],false);
  for(let i=0;i<6;i++)box(world,[.14,.32+(i%3)*.08,.18],mat(["#d4a346","#66856e","#b84e43"][i%3]),[-7.95+i*.33,-.88,-5],false);
  box(world,[4.4,.7,1],mat("#65786e",.97),[-5.8,-.95,1.1],false);box(world,[4.35,.85,.3],mat("#72877b",.97),[-5.8,-.35,.55],false);
  for(const x of [-7.45,-4.15])box(world,[.26,.48,.4],mat("#53665c"),[x,-.44,1],false);
  box(world,[1.8,1.25,.12],darkWood,[-5.65,2.7,-7.94],false);
  const pictureMap=texture((ctx,w,h)=>{ctx.fillStyle="#e7deca";ctx.fillRect(0,0,w,h);ctx.fillStyle="#638071";ctx.beginPath();ctx.arc(w*.5,h*.53,h*.28,0,Math.PI*2);ctx.fill();ctx.fillStyle="#d4a45a";ctx.beginPath();ctx.arc(w*.5,h*.53,h*.17,0,Math.PI*2);ctx.fill();});
  const picture=new THREE.Mesh(new THREE.PlaneGeometry(1.64,1.08),new THREE.MeshBasicMaterial({map:pictureMap}));picture.position.set(-5.65,2.7,-7.85);world.add(picture);
  const pot=new THREE.Mesh(new THREE.CylinderGeometry(.32,.27,.55,12),mat("#a65e45"));pot.position.set(7.45,-1.7,-4.7);world.add(pot);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;const leaf=sphere(world,[.28,.62,.18],mat("#587d55",.95),[7.45+Math.cos(a)*.32,-1.02,-4.7+Math.sin(a)*.32],9);leaf.rotation.z=Math.cos(a)*.42;leaf.rotation.x=Math.sin(a)*.32;}
  // Pendant lights.
  for(const x of [-2.3,2.3]){
    rod(world,[x,5.7,-.2],[x,4.7,-.2],.026,mat("#bd9858",.34,.64));
    const shade=new THREE.Mesh(new THREE.CylinderGeometry(.64,.34,.4,16,1,true),mat("#d4ad70",.38,.22));shade.position.set(x,4.55,-.2);world.add(shade);
    sphere(world,[.24,.18,.24],new THREE.MeshStandardMaterial({color:"#fff1cf",emissive:"#ffe4a8",emissiveIntensity:2.1}),[x,4.31,-.2],12);
    const light=new THREE.PointLight(0xffd8a5,22,12,1.8);light.position.set(x,4.25,-.2);world.add(light);
  }
  box(world,[3.1,.62,.72],wood,[1,-1.3,-6],false);box(world,[3.2,.09,.78],darkWood,[1,-.95,-6],false);
  const bowl=new THREE.Mesh(new THREE.CylinderGeometry(.32,.22,.18,18,1,true),mat("#d5c6a8",.32));bowl.position.set(.15,-.78,-5.86);world.add(bowl);
  for(let i=0;i<3;i++)box(world,[.35,.018,.34],mat("#f0e9db",.98),[1.15+i*.3,-.85,-5.8],false);
}

function createTableSetting(world:THREE.Scene,diners:DinerRig[]){
  const tabletop=mat("#876342",.38),edge=mat("#5e3e2a",.48),ceramic=mat("#f1eee4",.27),food=mat("#d6a24d",.58),fries=mat("#e4bb65",.52),fork=mat("#b7b9b3",.22,.82);
  box(world,[10.3,.23,4.15],tabletop,[0,.25,.82]);box(world,[10.34,.1,4.2],edge,[0,.09,.82]);
  for(const x of [-4.25,4.25])for(const z of [-.65,2.3])box(world,[.2,2,.2],edge,[x,-.94,z]);
  diners.forEach((diner,index)=>{
    const x=diner.x,z=-.18+(index%2)*.12;
    const plate=new THREE.Mesh(new THREE.CylinderGeometry(.64,.64,.07,32),ceramic);plate.position.set(x,.42,z);plate.castShadow=true;plate.receiveShadow=true;world.add(plate);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(.54,.018,6,32),mat("#c5b89e",.34,.1));rim.rotation.x=Math.PI/2;rim.position.set(x,.465,z);world.add(rim);
    const schnitzel=sphere(world,[.8,.13,.46],food,[x-.05,.53,z-.03],16);schnitzel.rotation.y=-.1+index*.035;
    for(let fry=0;fry<7;fry++){const angle=fry*.62;const piece=box(world,[.1,.1,.38],fries,[x+.29+Math.cos(angle)*.18,.57,z+.08+Math.sin(angle)*.18]);piece.rotation.y=angle;piece.rotation.z=-.05+(fry%3)*.035;}
    sphere(world,[.24,.12,.18],mat("#79905f",.95),[x-.43,.55,z+.16],10);
    rod(world,[x-.78,.49,z-.15],[x-.78,.49,z+.43],.025,fork);for(let tine=0;tine<4;tine++)rod(world,[x-.87+tine*.06,.49,z-.12],[x-.87+tine*.06,.49,z+.02],.009,fork);
    rod(world,[x+.76,.49,z-.15],[x+.76,.49,z+.43],.022,fork);
    box(world,[.42,.028,.34],mat("#d2c2a8",.94),[x-.98,.46,z+.3],false);
    const tumblerGlass=new THREE.MeshStandardMaterial({color:"#d8e2df",transparent:true,opacity:.28,roughness:.1,metalness:.08});
    const tumbler=new THREE.Mesh(new THREE.CylinderGeometry(.2,.17,.66,20,1,true),tumblerGlass);tumbler.position.set(x+.56,.78,z-.6);world.add(tumbler);
    const drink=new THREE.Mesh(new THREE.CylinderGeometry(.169,.165,.28,18),mat("#3a1b0d",.08,.04));drink.position.set(x+.56,.59,z-.6);world.add(drink);
    const straw=rod(world,[x+.64,.91,z-.6],[x+.73,1.22,z-.6],.018,mat("#ece2d0",.42));straw.castShadow=false;
  });
  const basket=new THREE.Mesh(new THREE.CylinderGeometry(.45,.4,.28,18,1,true),mat("#98734e",.96));basket.position.set(-1.25,.52,1.15);world.add(basket);
  for(let i=0;i<5;i++){const bread=sphere(world,[.36,.18,.23],mat("#c89a56",.72),[-1.55+i*.14,.69+(i%2)*.02,1.1+Math.sin(i)*.12],10);bread.rotation.y=i*.2;}
  const bottle=createCokeBottle(world,.05,.4,1.23);bottle.rotation.y=-.07;
  const spareCap=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,.045,18),mat("#d3222d",.25,.15));spareCap.position.set(1.05,.43,1.35);world.add(spareCap);
  return bottle;
}

export function createEntrePartidasDinnerSet(world:THREE.Scene):EntrePartidasDinnerSet{
  world.background=new THREE.Color("#d9cdbb");world.fog=new THREE.Fog("#d9cdbb",25,48);
  world.add(new THREE.HemisphereLight(0xfff0d8,0x39483c,1.75));
  const key=new THREE.DirectionalLight(0xffe3bd,2.7);key.position.set(-5.8,8.8,7.6);world.add(key);
  const rim=new THREE.DirectionalLight(0xd8e8ff,1.1);rim.position.set(5,4.8,-6.6);world.add(rim);
  const fill=new THREE.PointLight(0xffd09a,18,20,1.8);fill.position.set(0,4.5,2.2);world.add(fill);
  createDinnerRoom(world);
  const placements:Array<[DinnerSpeaker,number,number,number]>=[
    ["martina",-3.82,-1.48,.12],["bruno",-1.92,-1.64,.05],["tomas",0,-1.78,0],["valentina",1.92,-1.64,-.05],["ernesto",3.82,-1.48,-.12],
  ];
  const diners=placements.map(([name,x,z,turn])=>createDiner(name,x,z,turn));diners.forEach(d=>world.add(d.root));
  const bottle=createTableSetting(world,diners);
  const update=(time:number,dialogue:DinnerCue[])=>{
    const cue=dialogue.find(item=>time>=item.start&&time<=item.end),speaker=cue?.speaker;
    const ease=(v:number)=>{const q=Math.max(0,Math.min(1,v));return q*q*(3-2*q);};
    diners.forEach((diner,index)=>{
      const talking=diner.name===speaker,phase=index*.93;
      const targetX=cue?.look===diner.name?0:cue?.look?Math.sign(diners.find(d=>d.name===cue.look)!.x-diner.x)*.1:0;
      diner.head.rotation.y=THREE.MathUtils.lerp(diner.head.rotation.y,targetX,.1);
      diner.head.rotation.x=talking?Math.sin(time*3.1+phase)*.022:Math.sin(time*.52+phase)*.007;
      diner.head.rotation.z=Math.sin(time*.44+phase)*.005;
      let mouthOpen=.026;
      if(talking&&cue){const syllables=cue.text.toLowerCase().match(/[aeiouáéíóúü]/g)?.length??1;const cycles=Math.max(2,syllables);const progress=Math.max(0,Math.min(.999,(time-cue.start)/Math.max(.08,cue.end-cue.start)));mouthOpen=.04+Math.pow(Math.max(0,Math.sin(progress*cycles*Math.PI*2)),.8)*.74;}
      diner.mouth.scale.set(1,mouthOpen,1);diner.mouth.position.y=-.25-mouthOpen*.006;
      const gesture=talking?1:0;
      diner.leftArm.rotation.z=gesture?-.09-Math.sin(time*2.1+phase)*.08:-.025;
      diner.rightArm.rotation.z=gesture?.08+Math.sin(time*1.9+phase+.8)*.075:.025;
      diner.leftArm.rotation.x=gesture?.04+Math.sin(time*2.3+phase)*.04:0;
      diner.rightArm.rotation.x=gesture?-.04+Math.sin(time*2+phase+1)*.04:0;
      diner.root.position.y=-1.92+Math.sin(time*.72+phase)*.004;
    });
    const labelBeat=ease((time-3)/.35)*(1-ease((time-7.8)/.45));bottle.rotation.z=-.018+labelBeat*.02;bottle.rotation.y=-.07+labelBeat*.05;
  };
  return{update,getSpeakerPosition(speaker){const d=diners.find(item=>item.name===speaker);return d?new THREE.Vector3(d.x,.95,d.z):new THREE.Vector3(0,0,0);}};
}

export function drawEntrePartidasDinnerCaptions(ctx:CanvasRenderingContext2D,time:number,width:number,height:number,dialogue:DinnerCue[]){
  const cue=dialogue.find(item=>time>=item.start&&time<=item.end);if(!cue)return;
  const names:Record<DinnerSpeaker,string>={bruno:"BRUNO",martina:"MARTINA",tomas:"TOMÁS",valentina:"VALENTINA",ernesto:"ERNESTO"};
  const scale=width/720,maxWidth=width*.9;ctx.save();ctx.textAlign="center";ctx.textBaseline="middle";ctx.lineJoin="round";ctx.strokeStyle="rgba(0,0,0,.98)";
  const words=cue.text.split(/\s+/).filter(Boolean);let line="";const all:string[]=[];ctx.font="800 "+Math.round(29*scale)+"px Arial";
  for(const word of words){const candidate=line?line+" "+word:word;if(ctx.measureText(candidate).width>maxWidth&&line){all.push(line);line=word;}else line=candidate;}
  if(line)all.push(line);
  const pages=Math.max(1,Math.ceil(all.length/2)),page=Math.min(pages-1,Math.floor(((time-cue.start)/Math.max(.01,cue.end-cue.start))*pages)),lines=all.slice(page*2,page*2+2);
  const lineH=38*scale,nameH=26*scale;let y=height*.955-(nameH+lines.length*lineH+5*scale)/2;
  ctx.font="900 "+Math.round(18*scale)+"px Arial";ctx.fillStyle="#d5e8b2";ctx.lineWidth=6*scale;ctx.strokeText(names[cue.speaker],width/2,y);ctx.fillText(names[cue.speaker],width/2,y);
  y+=nameH+5*scale;ctx.font="900 "+Math.round(29*scale)+"px Arial";ctx.fillStyle="#fffaf0";ctx.lineWidth=7*scale;
  lines.forEach(value=>{ctx.strokeText(value,width/2,y);ctx.fillText(value,width/2,y);y+=lineH;});ctx.restore();
}

export function drawEntrePartidasDinnerBranding(ctx:CanvasRenderingContext2D,time:number,width:number,height:number,endCardStart:number){
  const scale=width/720,rounded=(x:number,y:number,w:number,h:number,r:number)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,r);};
  if(time<2.25){
    const fade=Math.min(1,time/.28,(2.25-time)/.36);ctx.save();ctx.globalAlpha=Math.max(0,fade);
    const panelW=width*.9,panelH=height*.155,x=(width-panelW)/2,y=height*.045;
    ctx.shadowColor="rgba(0,0,0,.38)";ctx.shadowBlur=24*scale;
    const g=ctx.createLinearGradient(x,y,x+panelW,y+panelH);g.addColorStop(0,"rgba(20,48,39,.96)");g.addColorStop(1,"rgba(31,67,54,.94)");
    ctx.fillStyle=g;rounded(x,y,panelW,panelH,20*scale);ctx.fill();ctx.shadowBlur=0;ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillStyle="#d7e8ad";ctx.font="900 "+Math.round(16*scale)+"px Arial";ctx.fillText("INGREDORA ORIGINALS",width/2,y+panelH*.17);
    ctx.fillStyle="#fffaf0";ctx.font="900 "+Math.round(54*scale)+"px Arial Black,Arial";ctx.fillText("ENTRE PARTIDAS",width/2,y+panelH*.49);
    ctx.fillStyle="#f0d18b";ctx.font="900 "+Math.round(22*scale)+"px Arial";ctx.fillText("CAPÍTULO 2",width/2,y+panelH*.82);ctx.restore();
  }
  if(time>=endCardStart){
    const fade=Math.min(1,(time-endCardStart)/.42);ctx.save();ctx.globalAlpha=fade;
    const veil=ctx.createLinearGradient(0,0,0,height);veil.addColorStop(0,"rgba(10,25,20,.96)");veil.addColorStop(.52,"rgba(13,35,27,.98)");veil.addColorStop(1,"rgba(7,18,15,1)");
    ctx.fillStyle=veil;ctx.fillRect(0,0,width,height);ctx.strokeStyle="rgba(215,232,173,.62)";ctx.lineWidth=2*scale;
    rounded(width*.105,height*.205,width*.79,height*.59,22*scale);ctx.stroke();ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillStyle="#d7e8ad";ctx.font="900 "+Math.round(22*scale)+"px Arial";ctx.fillText("INGREDORA ORIGINALS",width/2,height*.285);
    ctx.fillStyle="#fffaf0";ctx.font="900 "+Math.round(61*scale)+"px Arial Black,Arial";ctx.fillText("ENTRE PARTIDAS",width/2,height*.395);
    ctx.fillStyle="#f0d18b";ctx.font="800 "+Math.round(23*scale)+"px Arial";ctx.fillText("Una serie de Ingredora",width/2,height*.475);
    ctx.fillStyle="#f4d58d";ctx.font="900 "+Math.round(40*scale)+"px Arial";ctx.fillText("ingredora.com",width/2,height*.585);
    ctx.fillStyle="#e6e0cf";ctx.font="700 "+Math.round(18*scale)+"px Arial";ctx.fillText("Creado y producido por Ingredora",width/2,height*.685);
    ctx.fillStyle="rgba(230,224,207,.82)";ctx.font="600 "+Math.round(16*scale)+"px Arial";ctx.fillText("Bruno · Martina · Tomás · Valentina · Ernesto",width/2,height*.735);ctx.restore();
  }
}
