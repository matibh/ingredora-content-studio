import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { BufferTarget, CanvasSource, Output, Quality, WebMOutputFormat, canEncodeVideo } from "mediabunny";
import { createDiner } from "./entrePartidasDinner";

export type RoadtripShot = "exterior" | "master" | "bruno" | "valentina" | "phone" | "billboardRight" | "billboardLeft";
export type RoadtripCue = {
  id: string;
  speaker: "bruno" | "valentina";
  text: string;
  start: number;
  end: number;
  look: "bruno" | "valentina";
  shot: RoadtripShot;
  laugh?: boolean;
};
type RoadtripPackage = {
  schemaVersion: 1;
  engineVersion: "entre-partidas-roadtrip-1.0.0";
  id: string;
  title: string;
  createdAt: string;
  fps: number;
  width: number;
  height: number;
  durationSeconds: number;
  endCardStart: number;
  billboardRightAt: number;
  billboardLeftAt: number;
  dialogue: RoadtripCue[];
};
export type RoadtripProgress = { frame: number; totalFrames: number; percent: number };

const mat = (color:string,roughness=.78,metalness=0) => new THREE.MeshStandardMaterial({color,roughness,metalness});
const addBox = (parent:THREE.Object3D,size:[number,number,number],color:string,pos:[number,number,number],roughness=.8) => {
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),mat(color,roughness));
  mesh.position.set(...pos); mesh.castShadow=true; mesh.receiveShadow=true; parent.add(mesh); return mesh;
};
const addCanvasTexture = (draw:(ctx:CanvasRenderingContext2D,w:number,h:number)=>void,w=512,h=512) => {
  const canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext("2d");if(!ctx)throw new Error("No se pudo crear una textura del viaje.");
  draw(ctx,w,h);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;return texture;
};

function makeAdTexture(brand:"JORGITO"|"OREO"){
  return addCanvasTexture((ctx,w,h)=>{
    ctx.fillStyle=brand==="JORGITO"?"#f5e7ce":"#1e245c";ctx.fillRect(0,0,w,h);
    ctx.fillStyle=brand==="JORGITO"?"#9e3028":"#fff";ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.font="900 68px Arial";ctx.fillText(brand,w/2,72,w*.9);
    ctx.fillStyle=brand==="JORGITO"?"#fff8ec":"#e7d7ff";
    ctx.font="800 31px Arial";ctx.fillText(brand==="JORGITO"?"EL ALFAJOR DE SIEMPRE":"GALLETITAS",w/2,126,w*.9);
    // Diseño original simple: marca clara y producto grande, sin elementos decorativos nuevos.
    const x=w/2,y=265;
    if(brand==="JORGITO"){
      ctx.fillStyle="#d9b278";ctx.beginPath();ctx.ellipse(x,y,112,78,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#5c342a";ctx.beginPath();ctx.ellipse(x,y-10,105,68,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#e7c18b";ctx.beginPath();ctx.ellipse(x,y-18,98,58,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#743c29";ctx.beginPath();ctx.ellipse(x,y-18,55,34,0,0,Math.PI*2);ctx.fill();
    }else{
      for(const dx of [-58,0,58])for(const dy of [-22,38]){
        ctx.fillStyle="#e8c9a5";ctx.beginPath();ctx.arc(x+dx,y+dy,42,0,Math.PI*2);ctx.fill();
        ctx.fillStyle="#2a2455";ctx.beginPath();ctx.arc(x+dx,y+dy,32,0,Math.PI*2);ctx.fill();
        ctx.fillStyle="#f2dfc5";ctx.beginPath();ctx.arc(x+dx,y+dy,23,0,Math.PI*2);ctx.fill();
      }
    }
    ctx.fillStyle=brand==="JORGITO"?"#693c2b":"#fff";
    ctx.font="900 24px Arial";ctx.fillText("EN LA RUTA, SIEMPRE HAY UNO",w/2,378,w*.94);
    ctx.fillStyle=brand==="JORGITO"?"#fff8ed":"#e7d7ff";ctx.font="700 18px Arial";
    ctx.fillText("PUBLICIDAD",w/2,474);
  },512,512);
}

function makeBillboard(brand:"JORGITO"|"OREO",side:number){
  const group=new THREE.Group();
  // Recupera la estructura de la primera versión: un único poste central y un panel limpio.
  const post=addBox(group,[.16,2.7,.16],"#74664f",[0,-.1,0]);
  post.position.y=-.55;
  const board=new THREE.Mesh(new THREE.PlaneGeometry(2.8,1.85),new THREE.MeshBasicMaterial({map:makeAdTexture(brand),side:THREE.DoubleSide}));
  board.position.set(0,1.25,0);board.rotation.y=side>0?-.32:.32;group.add(board);
  group.position.set(side*8.2,0,0);
  return group;
}

function makePhone(parent:THREE.Object3D){
  const phone=new THREE.Group();
  const shell=new THREE.Mesh(new THREE.BoxGeometry(.37,.66,.055),mat("#171b1b",.36,.24));shell.position.z=0;phone.add(shell);
  const screenTexture=addCanvasTexture((ctx,w,h)=>{
    ctx.fillStyle="#f5f2e9";ctx.fillRect(0,0,w,h);
    ctx.fillStyle="#174b3a";ctx.fillRect(0,0,w,h*.19);
    ctx.fillStyle="#fff";ctx.textAlign="center";ctx.font="900 31px Arial";ctx.fillText("ingredora",w/2,h*.11);
    ctx.fillStyle="#244c3d";ctx.font="900 27px Arial";ctx.fillText("DESAFÍO DIARIO",w/2,h*.28);
    ctx.fillStyle="#8b9b74";ctx.font="700 19px Arial";ctx.fillText("¿QUÉ INGREDIENTES",w/2,h*.38);ctx.fillText("CONTIENE?",w/2,h*.43);
    ctx.fillStyle="#ead8bb";ctx.fillRect(w*.23,h*.50,w*.54,h*.21);
    ctx.fillStyle="#6a3b2c";ctx.beginPath();ctx.ellipse(w*.5,h*.60,w*.19,h*.07,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#fff";ctx.font="800 20px Arial";ctx.fillText("ALFAJOR",w/2,h*.76);
    for(let i=0;i<3;i++){ctx.fillStyle="#d9e4d6";ctx.fillRect(w*.18,h*(.82+i*.045),w*.64,h*.026);}
    ctx.fillStyle="#174b3a";ctx.fillRect(w*.18,h*.95,w*.64,h*.035);
  },384,768);
  const screen=new THREE.Mesh(new THREE.PlaneGeometry(.335,.61),new THREE.MeshBasicMaterial({map:screenTexture,side:THREE.DoubleSide,toneMapped:false}));
  screen.position.z=.031;phone.add(screen);
  phone.position.set(.46,2.38,.62);
  phone.rotation.y=Math.PI;
  parent.add(phone);
  return phone;
}

function addRoundedBox(parent:THREE.Object3D,size:[number,number,number],color:string,pos:[number,number,number],radius=.08,roughness=.82){
  const r=Math.min(radius,Math.min(...size)*.46);
  const mesh=new THREE.Mesh(new RoundedBoxGeometry(size[0],size[1],size[2],4,r),mat(color,roughness));
  mesh.position.set(...pos);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function addSoftVolume(parent:THREE.Object3D,radii:[number,number,number],material:THREE.Material,pos:[number,number,number],rotation:[number,number,number]=[0,0,0]){
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,28,20),material);
  mesh.scale.set(...radii);mesh.position.set(...pos);mesh.rotation.set(...rotation);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function addTubePath(parent:THREE.Object3D,points:[number,number,number][],color:string,radius=.012,roughness=.78){
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,28,radius,6,false),mat(color,roughness));
  mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}

function buildRoadtrip(){
  const scene=new THREE.Scene();scene.background=new THREE.Color("#a9c6d6");scene.fog=new THREE.Fog("#b9c8c2",28,82);
  scene.add(new THREE.HemisphereLight("#f7f1e4","#657460",1.8));
  const sun=new THREE.DirectionalLight("#fff0d6",2.1);sun.position.set(-7,10,5);sun.castShadow=true;sun.shadow.mapSize.set(768,768);scene.add(sun);
  const fill=new THREE.DirectionalLight("#d4e3ed",.72);fill.position.set(6,4,-5);scene.add(fill);
  const ground=addBox(scene,[100,.12,110],"#79906d",[0,-2.24,-3],.98);
  addBox(scene,[14,.12,110],"#454946",[0,-2.15,-3],.98);
  for(const side of [-1,1]){
    addBox(scene,[1.2,.035,110],"#8b8a78",[side*7.55,-2.17,-3],.98);
    addBox(scene,[.13,.025,110],"#e6dfc9",[side*6.78,-2.06,-3],.82);
  }
  const roadMarks:THREE.Mesh[]=[];
  for(let i=0;i<22;i++)roadMarks.push(addBox(scene,[.16,.025,2.3],"#f0e8d4",[0,-2.055,-52+i*5],.82));
  const roadsidePosts:THREE.Group[]=[];
  for(let i=0;i<24;i++)for(const side of [-1,1]){
    const post=new THREE.Group();addBox(post,[.10,.78,.10],"#e8e4d8",[0,0,0],.7);addBox(post,[.115,.12,.12],"#b44d3e",[0,.18,.01],.45);
    post.position.set(side*8.35,-1.72,-52+i*4.5);scene.add(post);roadsidePosts.push(post);
  }
  const hills:THREE.Group[]=[];
  for(let i=0;i<13;i++){
    const side=i%2?1:-1,hill=new THREE.Group();
    const palette=["#82936d","#899b73","#788b67","#95a078"];
    const base=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),mat(palette[i%4],.99));base.scale.set(5.2,1.5,4.25);hill.add(base);
    hill.position.set(side*(12+(i%4)*2),-2.65,-38+i*6.4);scene.add(hill);hills.push(hill);
  }
  const trees:THREE.Group[]=[];
  for(let i=0;i<18;i++){
    const tree=new THREE.Group(),side=i%2?1:-1;addBox(tree,[.22,1.2,.22],"#795a3e",[0,-.45,0]);
    const leaves=new THREE.Mesh(new THREE.ConeGeometry(.78,1.8,6),mat(i%3?"#557650":"#66845c",.98));leaves.position.y=.82;tree.add(leaves);
    tree.position.set(side*(8.7+(i%3)*.55),-1.15,-42+i*5.2);scene.add(tree);trees.push(tree);
  }

  // Pickup doble cabina reconstruida con geometría mínima: caja, cabina cerrada y cuatro ruedas.
  // QA pass: keep every shot readable at phone-screen size.
  // El frente apunta hacia z negativo. Sin jaula, toldo ni piezas decorativas innecesarias.
  const car=new THREE.Group();car.position.x=3.5;scene.add(car);
  const paint=mat("#536a73",.42,.08),dark=mat("#273136",.78),rubber=mat("#202322",.9);
  const trim=mat("#aeb8b8",.3,.55);
  const glass=new THREE.MeshPhysicalMaterial({color:"#91b4c1",transparent:true,opacity:.27,roughness:.18,metalness:.02,side:THREE.DoubleSide,depthWrite:false});
  const body=(size:[number,number,number],pos:[number,number,number],material:THREE.Material=paint,r=.07)=>{
    const mesh=new THREE.Mesh(new RoundedBoxGeometry(...size,3,r),material);mesh.position.set(...pos);mesh.castShadow=true;mesh.receiveShadow=true;car.add(mesh);return mesh;
  };
  // Chasis y carrocería inferior.
  body([3.45,.88,7.65],[0,-1.42,.25],paint,.20);
  body([3.42,.30,1.65],[0,-1.02,-2.55],paint,.10);
  body([3.18,.12,5.15],[0,-.96,.20],dark,.04);
  // Caja de carga abierta, separada de la cabina.
  body([3.05,.08,2.05],[0,-.91,3.10],dark,.025);
  for(const side of [-1,1])body([.18,.73,2.16],[side*1.57,-.53,3.10],paint,.045);
  body([3.18,.72,.15],[0,-.53,2.03],paint,.04);
  body([3.18,.72,.15],[0,-.53,4.17],paint,.04);
  // Cabina de cuatro puertas: techo recto, laterales sólidos, cuatro cristales y parabrisas.
  body([3.12,.18,4.05],[0,1.99,.00],paint,.10);
  body([3.02,.08,3.88],[0,1.87,.00],dark,.055);
  // Paneles de puerta inferiores, dejan la superficie de vidrio completamente delimitada.
  for(const side of [-1,1]){
    body([.16,.92,3.72],[side*1.57,-.48,.00],paint,.055);
    body([.12,.12,3.82],[side*1.59,.06,.00],paint,.04);
    // Marcos de ventana: pilares A/B/C y travesaños.
    for(const z of [-1.88,-.62,.64,1.82]){
      body([.14,1.80,.14],[side*1.55,1.00,z],paint,.035);
    }
    body([.14,.12,3.85],[side*1.55,1.83,0],paint,.035);
    // Dos paños de vidrio grandes por lado.
    for(const z of [-1.25,.63]){
      const pane=new THREE.Mesh(new THREE.PlaneGeometry(1.64,1.47),glass);
      pane.rotation.y=Math.PI/2;pane.position.set(side*1.565,1.00,z);car.add(pane);
    }
    // Manijas y espejo compacto.
    body([.035,.065,.22],[side*1.67,-.30,-.76],dark,.018);
    body([.04,.035,.15],[side*1.69,-.30,-.76],trim,.012);
    body([.16,.12,.28],[side*1.78,1.22,-1.55],dark,.035);
    body([.018,.075,.20],[side*1.87,1.23,-1.55],trim,.012);
    // Estribo sencillo.
    body([.18,.13,2.25],[side*1.68,-1.10,.05],dark,.035);
  }
  // Parabrisas y luneta, montados en el plano de la cabina y ligeramente inclinados.
  const windshield=new THREE.Mesh(new THREE.PlaneGeometry(2.86,1.48),glass);
  windshield.position.set(0,1.02,-1.91);windshield.rotation.x=-.10;car.add(windshield);
  const rearWindow=new THREE.Mesh(new THREE.PlaneGeometry(2.75,1.35),glass);
  rearWindow.position.set(0,1.02,1.91);rearWindow.rotation.x=.10;car.add(rearWindow);
  // Molduras visibles del parabrisas y luneta.
  body([.09,1.78,.12],[-1.49,1.02,-1.90],paint,.025);
  body([.09,1.78,.12],[1.49,1.02,-1.90],paint,.025);
  body([3.02,.12,.12],[0,1.91,-1.90],paint,.025);
  body([3.02,.12,.12],[0,.14,-1.90],paint,.025);
  body([3.02,.12,.12],[0,1.91,1.90],paint,.025);
  body([3.02,.12,.12],[0,.14,1.90],paint,.025);
  // Asientos muy simples y oscuros, visibles a través del vidrio.
  for(const x of [-.78,.78]){
    body([.72,.20,.72],[x,-.83,.08],dark,.10);
    body([.72,1.05,.22],[x,-.25,.72],dark,.10);
    body([.48,.28,.20],[x,.39,.83],dark,.08);
  }
  body([2.05,.20,.62],[0,-.86,1.45],dark,.10);
  body([2.05,.82,.22],[0,-.30,1.80],dark,.10);
  // Frente reconocible: parrilla horizontal, dos faros y paragolpes.
  body([1.35,.43,.12],[0,-.97,-3.53],dark,.035);
  for(let i=0;i<3;i++)body([1.10,.035,.025],[0,-.82-i*.105,-3.60],trim,.01);
  for(const side of [-1,1]){
    body([.56,.30,.12],[side*1.34,-.91,-3.53],trim,.045);
    body([.22,.18,.05],[side*1.58,-.94,-3.60],mat("#d6a45e",.35),.02);
    body([.22,.48,.08],[side*1.54,-.82,4.22],mat("#9b3932",.42),.025);
  }
  body([3.72,.25,.25],[0,-1.47,-3.72],dark,.06);
  body([3.72,.25,.25],[0,-1.47,4.30],dark,.06);
  // Cuatro ruedas iguales, con neumático y llanta simple.
  for(const side of [-1,1])for(const z of [-2.02,2.55]){
    const wheel=new THREE.Group();wheel.position.set(side*1.78,-1.53,z);car.add(wheel);
    const tire=new THREE.Mesh(new THREE.CylinderGeometry(.61,.61,.34,28),rubber);tire.rotation.z=Math.PI/2;wheel.add(tire);
    const rim=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.05,24),mat("#68747a",.34,.52));rim.rotation.z=Math.PI/2;rim.position.x=side*.18;wheel.add(rim);
    const hub=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.06,20),trim);hub.rotation.z=Math.PI/2;hub.position.x=side*.21;wheel.add(hub);
  }
  // Cabina despejada: sin accesorios de tablero que tapen a los personajes.
  const valentina=createDiner("valentina",-.82,.05,Math.PI,false);
  const bruno=createDiner("bruno",.82,.05,Math.PI,false);
  car.add(valentina.root,bruno.root);
  const phone=makePhone(bruno.root);phone.visible=false;
  const billboardRight=makeBillboard("JORGITO",1),billboardLeft=makeBillboard("OREO",-1);
  scene.add(billboardRight,billboardLeft);
  return {scene,car,valentina,bruno,wheel:{rotation:{z:0}},phone,billboardRight,billboardLeft,trees,hills,road:null,ground:null,roadMarks,roadsidePosts};
}
function shotCamera(shot:RoadtripShot,camera:THREE.PerspectiveCamera,time:number,billboardRight:THREE.Group,billboardLeft:THREE.Group){
  let p:[number,number,number]=[0,1.82,-2.62],target:[number,number,number]=[0,1.00,.12],fov=62;
  switch(shot){
    case "exterior": p=[13.5,5.4,-14];target=[3.5,-.62,.25];fov=44;break;
    case "master": p=[3.5,2.05,-5.35];target=[3.5,1.05,.38];fov=62;break;
    case "bruno": p=[4.55,2.02,-5.25];target=[4.30,1.02,.42];fov=63;break;
    case "valentina": p=[2.45,2.02,-5.25];target=[2.70,1.02,.42];fov=63;break;
    case "phone": p=[4.08,1.05,-1.35];target=[3.88,.47,-.63];fov=31;break;
    case "billboardRight": p=[4.32,1.48,1.18];target=[8.2,1.40,billboardRight.position.z];fov=53;break;
    case "billboardLeft": p=[-5.30,2.18,billboardLeft.position.z+3.10];target=[-8.2,1.38,billboardLeft.position.z];fov=53;break;
  }
  if(shot==="bruno"||shot==="valentina"){p[1]+=Math.sin(time*.8)*.006;target[1]+=Math.sin(time*.9)*.004;}
  camera.position.set(...p);camera.lookAt(...target);camera.fov=fov;camera.updateProjectionMatrix();
}

function drawCaptions(ctx:CanvasRenderingContext2D,pkg:RoadtripPackage,time:number){
  const cue=pkg.dialogue.find(c=>time>=c.start&&time<=c.end);if(!cue)return;
  const scale=pkg.width/720,names={bruno:"BRUNO",valentina:"VALENTINA"};
  ctx.save();ctx.textAlign="center";ctx.textBaseline="middle";
  const font=27*scale;ctx.font="800 "+font+"px Arial";
  const maxW=pkg.width*.88,words=cue.text.split(/\s+/),lines:string[]=[];let line="";
  for(const word of words){const next=line?line+" "+word:word;if(ctx.measureText(next).width>maxW&&line){lines.push(line);line=word;}else line=next;}
  if(line)lines.push(line);
  const shown=lines.length<=2?lines:[lines.slice(0,Math.ceil(lines.length/2)).join(" "),lines.slice(Math.ceil(lines.length/2)).join(" ")];
  const h=(32+shown.length*36+24)*scale,y=pkg.height-h-34*scale;
  ctx.fillStyle="rgba(17,26,23,.84)";ctx.beginPath();ctx.roundRect(pkg.width*.055,y,pkg.width*.89,h,12*scale);ctx.fill();
  ctx.fillStyle="#d7e8ad";ctx.font="900 "+(17*scale)+"px Arial";ctx.fillText(names[cue.speaker],pkg.width/2,y+20*scale);
  ctx.fillStyle="#fffaf0";ctx.font="800 "+font+"px Arial";
  shown.forEach((row,i)=>ctx.fillText(row,pkg.width/2,y+(48+i*36)*scale,maxW));
  ctx.restore();
}
function drawBranding(ctx:CanvasRenderingContext2D,pkg:RoadtripPackage,time:number){
  const w=pkg.width,h=pkg.height,s=w/720;
  if(time<2.45){
    const alpha=Math.max(0,Math.min(1,time/.32,(2.45-time)/.42));ctx.save();ctx.globalAlpha=alpha;
    ctx.fillStyle="rgba(16,40,32,.94)";ctx.beginPath();ctx.roundRect(w*.075,h*.24,w*.85,h*.31,22*s);ctx.fill();
    ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle="#d7e8ad";
    ctx.font="900 "+Math.round(19*s)+"px Arial";ctx.fillText("INGREDORA ORIGINALS",w/2,h*.31);
    ctx.fillStyle="#fffaf0";ctx.font="900 "+Math.round(52*s)+"px Arial Black,Arial";ctx.fillText("ENTRE PARTIDAS",w/2,h*.405);
    ctx.fillStyle="#f0d18b";ctx.font="900 "+Math.round(23*s)+"px Arial";ctx.fillText("CAPÍTULO 3 · LO SÉ TODO",w/2,h*.49);ctx.restore();
  }
  if(time>=pkg.endCardStart){
    const alpha=Math.min(1,(time-pkg.endCardStart)/.5);ctx.save();ctx.globalAlpha=alpha;
    const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,"#10251d");g.addColorStop(.5,"#17382c");g.addColorStop(1,"#0b1914");ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    ctx.strokeStyle="rgba(215,232,173,.65)";ctx.lineWidth=2*s;ctx.beginPath();ctx.roundRect(w*.10,h*.23,w*.80,h*.54,22*s);ctx.stroke();
    ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle="#d7e8ad";ctx.font="900 "+Math.round(22*s)+"px Arial";ctx.fillText("INGREDORA ORIGINALS",w/2,h*.32);
    ctx.fillStyle="#fffaf0";ctx.font="900 "+Math.round(58*s)+"px Arial Black,Arial";ctx.fillText("ENTRE PARTIDAS",w/2,h*.43);
    ctx.fillStyle="#f0d18b";ctx.font="900 "+Math.round(25*s)+"px Arial";ctx.fillText("Una serie de Ingredora",w/2,h*.51);
    ctx.fillStyle="#f5d792";ctx.font="900 "+Math.round(42*s)+"px Arial";ctx.fillText("ingredora.com",w/2,h*.62);
    ctx.fillStyle="#e8e2d5";ctx.font="700 "+Math.round(18*s)+"px Arial";ctx.fillText("Bruno · Valentina",w/2,h*.70);ctx.restore();
  }
}

export async function renderEntrePartidasRoadtripToWebM(pkg:RoadtripPackage,onProgress:(p:RoadtripProgress)=>void,signal?:AbortSignal):Promise<Blob>{
  if(pkg.schemaVersion!==1||pkg.engineVersion!=="entre-partidas-roadtrip-1.0.0")throw new Error("Paquete del viaje incompatible.");
  if(pkg.width!==720||pkg.height!==1280||pkg.fps<24||pkg.fps>30)throw new Error("Se requiere video vertical 720×1280 a 24–30 FPS.");
  if(!pkg.dialogue.length||pkg.durationSeconds<=0)throw new Error("El capítulo necesita diálogos y una duración válida.");
  if(!(await canEncodeVideo("vp9",{width:pkg.width,height:pkg.height,frameRate:pkg.fps})))throw new Error("No hay codificador VP9 disponible para el render.");
  const totalFrames=Math.round(pkg.durationSeconds*pkg.fps);
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:"high-performance"});
  renderer.setSize(pkg.width,pkg.height,false);renderer.setPixelRatio(1);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
  const world=buildRoadtrip(),camera=new THREE.PerspectiveCamera(62,pkg.width/pkg.height,.1,120);
  // Mantener sombras del auto y cabina; los elementos que se desplazan no deben reconstruir el shadow map en cada frame.
  const removeMovingCaster=(root:THREE.Object3D)=>root.traverse(o=>{if(o instanceof THREE.Mesh)o.castShadow=false;});
  world.trees.forEach(removeMovingCaster);world.roadsidePosts.forEach(removeMovingCaster);
  removeMovingCaster(world.billboardRight);removeMovingCaster(world.billboardLeft);
  removeMovingCaster(world.bruno.root);removeMovingCaster(world.valentina.root);
  const canvas=document.createElement("canvas");canvas.width=pkg.width;canvas.height=pkg.height;const ctx=canvas.getContext("2d");if(!ctx)throw new Error("No se pudo crear el lienzo del capítulo.");
  const target=new BufferTarget(),output=new Output({format:new WebMOutputFormat(),target});
  const videoSource=new CanvasSource(canvas,{codec:"vp9",quality:new Quality({bitrate:8_000_000})});
  output.addVideoTrack(videoSource,{frameRate:pkg.fps});output.setMetadataTags({title:pkg.title,artist:"Ingredora — Entre Partidas",date:new Date(pkg.createdAt)});
  let started=false,lastShot:RoadtripShot="exterior";
  try{
    await output.start();started=true;
    for(let frame=0;frame<totalFrames;frame++){
      if(signal?.aborted)throw new Error("Render cancelado.");
      const t=frame/pkg.fps,cue=pkg.dialogue.find(c=>t>=c.start&&t<=c.end);
      if(cue)lastShot=cue.shot;
      let shot:RoadtripShot=t<3.2?"exterior":lastShot;
      // El cartel se muestra como un vistazo desde la ventanilla y luego vuelve al plano de Bruno.
      if(cue?.id==="01-bruno-cartel-alfajor"){
        shot=t<cue.start+1.82?"billboardRight":"bruno";
        lastShot=shot;
      }
      if(cue?.id==="06-bruno-cartel-oreo"){
        shot=t<cue.start+1.78?"billboardLeft":"valentina";
        lastShot=shot;
      }
      // Roadside objects slide backwards while the car itself stays on the same mark.
      const scroll=t*8.2;
      world.trees.forEach((tree,i)=>{const base=-42+i*5.2;tree.position.z=((base+scroll+48)%92)-46;});
      world.hills.forEach((hill,i)=>{const base=-38+i*6.4;hill.position.z=((base+scroll*.22+48)%92)-46;});
      world.roadMarks.forEach((mark,i)=>{const base=-52+i*5.0;mark.position.z=((base+scroll+56)%108)-54;});
      world.roadsidePosts.forEach((post,i)=>{const base=-52+Math.floor(i/2)*4.5;post.position.z=((base+scroll+56)%108)-54;});
      // La camioneta avanza hacia z negativo: cada cartel viene desde delante (z<0),
      // se acerca en sentido contrario al avance visual y pasa una sola vez junto a la ventanilla.
      world.billboardRight.position.z=-12+(t-pkg.billboardRightAt)*8.2;
      world.billboardLeft.position.z=-12+(t-pkg.billboardLeftAt)*8.2;
      world.billboardRight.visible=t>=pkg.billboardRightAt-.65&&world.billboardRight.position.z>-30&&world.billboardRight.position.z<24;
      world.billboardLeft.visible=t>=pkg.billboardLeftAt-.65&&world.billboardLeft.position.z>-30&&world.billboardLeft.position.z<24;
      // The outside strip gives the opening shot a steady sense of travel.
      world.car.position.y=Math.sin(t*1.8)*.006;
      world.car.rotation.y=Math.sin(t*.12)*.006;
      world.wheel.rotation.z=Math.sin(t*5.5)*.015;
      // Keep the driver on the wheel and the passenger on the game. Only the speaker gets small, motivated gestures.
      world.valentina.leftArm.rotation.x=.57+Math.sin(t*.8)*.018;
      world.valentina.rightArm.rotation.x=.57+Math.sin(t*.7+.4)*.018;
      world.valentina.leftArm.rotation.z=-.04;world.valentina.rightArm.rotation.z=.04;
      world.bruno.rightArm.rotation.x=.22+Math.sin(t*1.1)*.012;
      world.bruno.rightArm.rotation.z=.12;
      world.bruno.leftArm.rotation.x=.08;
      for(const rig of [world.bruno,world.valentina]){
        const active=cue?.speaker===rig.name;
        const turn=cue?.look===rig.name?0:cue?.look?.length? (rig.name==="bruno"?-.10:.10):0;
        rig.head.rotation.y=turn;
        rig.head.rotation.x=active?Math.sin(t*3.4)*.018:Math.sin(t*.55)*.006;
        const mouthOpen=active ? 0.04+Math.pow(Math.max(0,Math.sin(((t-cue!.start)/Math.max(.1,cue!.end-cue!.start))*Math.max(2,(cue!.text.match(/[aeiouáéíóúü]/gi)||[]).length)*Math.PI*2)),.8)*.55 : 0.026;
        rig.mouth.scale.set(1,mouthOpen,1);
      }
      if(t>=3.2&&t<6.5){world.valentina.head.rotation.y=.025;}
      
      shotCamera(shot,camera,t,world.billboardRight,world.billboardLeft);
      renderer.render(world.scene,camera);ctx.drawImage(renderer.domElement,0,0,pkg.width,pkg.height);
      const vignette=ctx.createRadialGradient(360,550,280,360,640,930);vignette.addColorStop(0,"rgba(0,0,0,0)");vignette.addColorStop(1,"rgba(12,15,16,.19)");ctx.fillStyle=vignette;ctx.fillRect(0,0,pkg.width,pkg.height);
      drawCaptions(ctx,pkg,t);drawBranding(ctx,pkg,t);
      await videoSource.add(t,1/pkg.fps);
      if(frame%8===0||frame===totalFrames-1)onProgress({frame:frame+1,totalFrames,percent:Math.round((frame+1)/totalFrames*100)});
    }
    videoSource.close();await output.finalize();const buffer=target.buffer;if(!buffer?.byteLength)throw new Error("El render terminó sin generar el WebM.");return new Blob([buffer],{type:await output.getMimeType()});
  }catch(error){
    if(started&&output.state!=="finalized"&&output.state!=="canceled")await output.cancel().catch(()=>undefined);
    throw error instanceof Error?error:new Error("Falló el render del viaje.");
  }finally{
    renderer.dispose();world.scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const m=o.material;if(Array.isArray(m))m.forEach(x=>x.dispose());else m.dispose();}});
  }
}
