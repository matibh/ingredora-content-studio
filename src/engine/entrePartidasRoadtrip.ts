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
  group.position.set(side*5.1,0,0);
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
  const sun=new THREE.DirectionalLight("#fff0d6",2.25);sun.position.set(-7,10,5);sun.castShadow=true;sun.shadow.mapSize.set(768,768);scene.add(sun);
  const fill=new THREE.DirectionalLight("#d4e3ed",.72);fill.position.set(6,4,-5);scene.add(fill);
  const ground=addBox(scene,[100,.12,110],"#79906d",[0,-2.24,-3],.98);
  // Asphalt with gravel shoulders, crisp edge lines and animated centre dashes.
  const road=addBox(scene,[8,.12,110],"#454946",[0,-2.15,-3],.98);
  addBox(scene,[1.2,.035,110],"#8b8a78",[-4.55,-2.17,-3],.98);addBox(scene,[1.2,.035,110],"#8b8a78",[4.55,-2.17,-3],.98);
  addBox(scene,[.13,.025,110],"#e6dfc9",[-3.78,-2.06,-3],.82);addBox(scene,[.13,.025,110],"#e6dfc9",[3.78,-2.06,-3],.82);
  const roadMarks:THREE.Mesh[]=[];
  for(let i=0;i<22;i++){const mark=addBox(scene,[.16,.025,2.3],"#f0e8d4",[0,-2.055,-52+i*5.0],.82);roadMarks.push(mark);}
  // Low roadside reflector posts add scale and depth without changing the existing trees.
  const roadsidePosts:THREE.Group[]=[];
  for(let i=0;i<24;i++)for(const side of [-1,1]){
    const post=new THREE.Group();addBox(post,[.10,.78,.10],"#e8e4d8",[0,0,0],.7);
    addBox(post,[.115,.12,.12],"#b44d3e",[0,.18,.01],.45);
    post.position.set(side*5.25,-1.72,-52+i*4.5);scene.add(post);roadsidePosts.push(post);
  }
  // Campos ondulados y lomadas suaves; sin conos ni siluetas piramidales.
  const hills:THREE.Group[]=[];
  for(let i=0;i<13;i++){
    const side=i%2?1:-1,hill=new THREE.Group();
    const palette=["#82936d","#899b73","#788b67","#95a078"];
    const base=new THREE.Mesh(new THREE.SphereGeometry(1,28,18),mat(palette[i%palette.length],.99));
    base.scale.set(5.2,1.52,4.25);base.position.set(0,0,0);base.receiveShadow=true;hill.add(base);
    const riseA=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),mat(palette[(i+1)%palette.length],.99));
    riseA.scale.set(3.0,1.16,3.55);riseA.position.set(side*2.55,.18,-1.25);hill.add(riseA);
    const riseB=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),mat(palette[(i+2)%palette.length],.99));
    riseB.scale.set(3.15,1.10,3.45);riseB.position.set(-side*2.4,.12,1.55);hill.add(riseB);
    hill.position.set(side*(9+(i%4)*2),-2.65,-38+i*6.4);scene.add(hill);hills.push(hill);
  }
  const trees:THREE.Group[]=[];
  for(let i=0;i<18;i++){
    const tree=new THREE.Group();const side=i%2?1:-1;
    addBox(tree,[.22,1.2,.22],"#795a3e",[0,-.45,0]);
    const leaves=new THREE.Mesh(new THREE.ConeGeometry(.78,1.8,6),mat(i%3?"#557650":"#66845c",.98));leaves.position.y=.82;tree.add(leaves);
    tree.position.set(side*(5.6+(i%3)*.55),-1.15,-42+i*5.2);scene.add(tree);trees.push(tree);
  }
  // Auto de cuatro puertas con cabina cerrada, revestimientos curvos y materiales diferenciados.
  const car=new THREE.Group();scene.add(car);
  const rubber=mat("#202322",.86),glass=new THREE.MeshPhysicalMaterial({color:"#a8c6ca",transparent:true,opacity:.12,roughness:.16,metalness:.06,side:THREE.DoubleSide,depthWrite:false});
  const chrome=mat("#b5b8ae",.32,.62);
  const bodyColor="#536a73";
  // Carrocería larga y musculosa de pickup mediana, con proporción de doble cabina.
  addRoundedBox(car,[3.90,.82,7.78],bodyColor,[0,-1.48,.30],.24,.38);
  // Capó delantero y frente escalonado; el morro apunta hacia z negativo.
  addRoundedBox(car,[3.58,.36,1.60],bodyColor,[0,-1.08,-2.55],.15,.36);
  addRoundedBox(car,[3.15,.18,5.35],"#303b40",[0,-1.00,.28],.08,.62);
  // Caja de carga abierta detrás de la doble cabina: piso, laterales, panel frontal y portón.
  addRoundedBox(car,[3.18,.075,2.08],"#303a3e",[0,-.91,3.08],.035,.9);
  for(const side of [-1,1]){
    addRoundedBox(car,[.22,.80,2.18],bodyColor,[side*1.62,-.53,3.08],.09,.4);
    addRoundedBox(car,[.25,.075,2.20],"#343f43",[side*1.62,-.105,3.08],.035,.62);
  }
  addRoundedBox(car,[3.40,.78,.16],bodyColor,[0,-.53,2.02],.07,.4);
  addRoundedBox(car,[3.40,.78,.17],bodyColor,[0,-.53,4.13],.07,.4);
  addRoundedBox(car,[3.05,.06,1.72],"#252d30",[0,-.855,3.08],.025,.98);
  for(let i=0;i<7;i++)addRoundedBox(car,[.025,.012,1.62],"#596267",[-1.35+i*.45,-.818,3.08],.006,.92);
  for(const side of [-1,1])for(const z of [2.20,3.96]){
    addRoundedBox(car,[.12,.035,.10],"#b5b9b4",[side*1.45,-.105,z],.018,.36);
  }
  // Puertas delanteras y traseras, manijas y estribos integrados a la carrocería.
  for(const side of [-1,1]){
    addRoundedBox(car,[.12,.62,1.12],bodyColor,[side*1.94,-.50,-.70],.07,.42);
    addRoundedBox(car,[.12,.62,1.12],bodyColor,[side*1.94,-.50,.70],.07,.42);
    for(const z of [-.82,.58]){
      addRoundedBox(car,[.035,.075,.25],"#242d31",[side*2.015,-.31,z],.018,.48);
      addRoundedBox(car,[.022,.025,.17],"#a8ada7",[side*2.04,-.31,z],.012,.32);
    }
    addRoundedBox(car,[.18,.14,2.18],"#303a3d",[side*2.01,-1.31,.08],.055,.68);
  }
  // Ruedas reales de pickup: neumático, llanta, seis bulones y guardabarros.
  const addPickupWheel=(side:number,z:number)=>{
    const wheel=new THREE.Group();wheel.position.set(side*1.84,-1.53,z);car.add(wheel);
    const tire=new THREE.Mesh(new THREE.CylinderGeometry(.62,.62,.36,36),rubber);
    tire.rotation.z=Math.PI/2;wheel.add(tire);
    const rim=new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,.055,32),mat("#3b454a",.38,.58));
    rim.rotation.z=Math.PI/2;rim.position.x=side*.19;wheel.add(rim);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.30,.028,8,32),chrome);
    ring.rotation.y=side>0?Math.PI/2:-Math.PI/2;ring.position.x=side*.225;wheel.add(ring);
    const hub=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.065,24),mat("#87918f",.34,.72));
    hub.rotation.z=Math.PI/2;hub.position.x=side*.225;wheel.add(hub);
    for(let i=0;i<6;i++){
      const a=i*Math.PI/3;
      const bolt=new THREE.Mesh(new THREE.SphereGeometry(.034,10,8),mat("#d0d3cc",.28,.72));
      bolt.position.set(side*.235,Math.cos(a)*.215,Math.sin(a)*.215);wheel.add(bolt);
    }
    const archX=side*2.015;
    addTubePath(car,[[archX,-1.51,z-.69],[archX,-1.16,z-.59],[archX,-.91,z],[archX,-1.16,z+.59],[archX,-1.51,z+.69]],"#30393d",.055,.7);
  };
  for(const side of [-1,1]){addPickupWheel(side,-2.00);addPickupWheel(side,2.55);}
  // Parrilla, ópticas, paragolpes y patente delantera.
  addRoundedBox(car,[1.30,.43,.14],"#20292d",[0,-.97,-3.53],.07,.42);
  for(let i=0;i<4;i++)addRoundedBox(car,[1.08,.035,.035],"#aeb5b1",[0,-.82-i*.095,-3.61],.012,.34);
  addRoundedBox(car,[.22,.25,.045],"#a7b2b4",[0,-.97,-3.625],.025,.3);
  for(const side of [-1,1]){
    addRoundedBox(car,[.56,.30,.14],"#d8d5c5",[side*1.37,-.91,-3.53],.065,.3);
    addRoundedBox(car,[.17,.20,.045],"#d8a45a",[side*1.58,-.94,-3.61],.035,.36);
  }
  addRoundedBox(car,[3.98,.27,.30],"#343d41",[0,-1.47,-3.72],.09,.58);
  addRoundedBox(car,[.62,.12,.035],"#e8e6d8",[0,-1.39,-3.88],.018,.34);
  // Parte trasera completa: faros verticales, portón y paragolpes de pickup.
  for(const side of [-1,1]){
    addRoundedBox(car,[.24,.48,.08],"#8f302b",[side*1.57,-.83,4.235],.04,.38);
    addRoundedBox(car,[.17,.15,.035],"#d5b19a",[side*1.57,-.70,4.285],.025,.32);
  }
  addRoundedBox(car,[3.92,.26,.28],"#343d41",[0,-1.47,4.31],.08,.58);
  addRoundedBox(car,[.68,.10,.035],"#e5e3d8",[0,-1.40,4.455],.015,.34);
  // Umbrales interiores y alfombra con textura fina.
  const carpetTexture=addCanvasTexture((ctx,w,h)=>{
    ctx.fillStyle="#343a35";ctx.fillRect(0,0,w,h);
    for(let y=0;y<h;y+=4){ctx.strokeStyle=y%8===0?"rgba(255,255,255,.055)":"rgba(0,0,0,.10)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
  },128,128);
  carpetTexture.wrapS=THREE.RepeatWrapping;carpetTexture.wrapT=THREE.RepeatWrapping;carpetTexture.repeat.set(4,5);
  const carpet=new THREE.Mesh(new RoundedBoxGeometry(2.92,.055,4.05,3,.025),new THREE.MeshStandardMaterial({map:carpetTexture,roughness:1}));
  carpet.position.set(0,-1.055,.08);carpet.receiveShadow=true;car.add(carpet);
  // Techo rígido, tapizado interior, parasoles, plafón y pilares A/B/C.
  addRoundedBox(car,[3.34,.24,4.26],bodyColor,[0,3.10,.05],.12,.38);
  addRoundedBox(car,[3.10,.105,4.02],"#c8c4b8",[0,2.94,.05],.055,.92);
  addRoundedBox(car,[2.84,.055,3.68],"#d7d1c4",[0,2.865,.05],.025,.96);
  for(const x of [-.90,.90]){
    addRoundedBox(car,[.76,.105,.40],"#aaa99f",[x,2.72,-1.58],.045,.92);
    addRoundedBox(car,[.34,.07,.15],"#777b74",[x,2.66,-1.42],.035,.74);
  }
  addRoundedBox(car,[.42,.07,.22],"#414945",[0,2.79,.18],.035,.54);
  addRoundedBox(car,[.25,.045,.12],"#f2e5c6",[0,2.755,.18],.02,.36);
  for(const x of [-1.43,1.43]){
    addTubePath(car,[[x,2.69,-.36],[x,2.78,-.23],[x,2.78,.00],[x,2.69,.14]],"#575f58",.035);
    addRoundedBox(car,[.13,2.15,.15],bodyColor,[x,1.82,-1.61],.045,.42);
    addRoundedBox(car,[.13,2.08,.15],bodyColor,[x,1.80,.12],.045,.42);
    addRoundedBox(car,[.13,2.14,.15],bodyColor,[x,1.80,1.67],.045,.42);
  }
  // Ventanillas laterales, parabrisas y luneta; dejan entrar luz y permiten ver los carteles.
  for(const x of [-1.55,1.55]){
    const win=new THREE.Mesh(new THREE.PlaneGeometry(3.20,1.43),glass);win.rotation.y=Math.PI/2;win.position.set(x,1.84,.02);car.add(win);
  }
  const windshield=new THREE.Mesh(new THREE.PlaneGeometry(3.02,1.48),glass);windshield.position.set(0,1.84,-2.03);windshield.rotation.x=-.10;car.add(windshield);
  const rearGlass=new THREE.Mesh(new THREE.PlaneGeometry(2.86,1.40),glass);rearGlass.position.set(0,1.84,2.03);rearGlass.rotation.x=.10;car.add(rearGlass);
  // Marcos de ventanilla, marcos inferiores y espejos exteriores.
  for(const x of [-1.55,1.55]){
    addRoundedBox(car,[.12,.12,3.72],"#43564f",[x,1.10,.05],.045,.44);
    addRoundedBox(car,[.14,.13,.14],bodyColor,[x,3.00,1.66],.045,.42);
  }
  // Tarjetas de puerta moldeadas, inserts suaves, apoyabrazos y tiradores metálicos.
  for(const side of [-1,1]){
    addRoundedBox(car,[.15,.74,3.16],"#59635d",[side*1.42,-.43,.08],.075,.94);
    addRoundedBox(car,[.10,.28,1.40],"#73766d",[side*1.34,-.35,.22],.07,.90);
    addSoftVolume(car,[.12,.10,.70],mat("#494f49",.9),[side*1.32,-.23,.32]);
    addRoundedBox(car,[.045,.09,.43],"#303a36",[side*1.29,-.19,.18],.025,.56);
    addTubePath(car,[[side*1.28,-.17,.00],[side*1.28,-.12,.20],[side*1.28,-.17,.42]],"#c0b9a7",.018,.38);
    addRoundedBox(car,[.055,.12,.72],"#424b46",[side*1.30,-.70,.72],.035,.72);
    addRoundedBox(car,[.05,.035,.34],"#b9b4a5",[side*1.27,-.69,.70],.015,.32);
  }
  // Consola superior del tablero, con bordes redondeados y superficies acolchadas.
  addRoundedBox(car,[3.04,.34,.76],"#3c4440",[0,-.06,-1.72],.15,.82);
  addSoftVolume(car,[1.49,.15,.34],mat("#454c47",.92),[0,.12,-1.75]);
  addRoundedBox(car,[2.96,.38,.48],"#68685f",[0,-.36,-1.55],.13,.72);
  addRoundedBox(car,[.92,.22,.12],"#77766d",[.92,-.34,-1.27],.055,.84);
  addRoundedBox(car,[.88,.045,.025],"#373e39",[.92,-.34,-1.19],.014,.52);
  // Instrumental digital-analógico detrás del volante.
  const gaugeTexture=addCanvasTexture((ctx,w,h)=>{
    ctx.fillStyle="#17211e";ctx.fillRect(0,0,w,h);
    for(const x of [w*.27,w*.73]){
      ctx.strokeStyle="#d7d5c5";ctx.lineWidth=8;ctx.beginPath();ctx.arc(x,h*.58,h*.31,Math.PI,Math.PI*2);ctx.stroke();
      ctx.strokeStyle="#df7657";ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(x,h*.58);ctx.lineTo(x+h*.17,h*.30);ctx.stroke();
    }
    ctx.fillStyle="#a8c8a4";ctx.font="bold 24px Arial";ctx.textAlign="center";ctx.fillText("0   80   120",w/2,h*.91);
  },384,192);
  addRoundedBox(car,[.86,.43,.12],"#202724",[-.90,.12,-1.31],.075,.42);
  const gauges=new THREE.Mesh(new THREE.PlaneGeometry(.72,.31),new THREE.MeshBasicMaterial({map:gaugeTexture,toneMapped:false}));
  gauges.position.set(-.90,.12,-1.242);car.add(gauges);
  // Salidas de aire con marco, láminas interiores y controles circulares.
  for(const x of [-1.18,-.55,.55,1.18]){
    addRoundedBox(car,[.27,.12,.055],"#252d29",[x,-.06,-1.285],.035,.52);
    for(let j=0;j<3;j++)addRoundedBox(car,[.018,.075,.018],"#92968c",[x-.075+j*.075,-.06,-1.248],.008,.38);
  }
  addRoundedBox(car,[.25,.20,.055],"#242b27",[0,-.06,-1.277],.055,.44);
  addRoundedBox(car,[.105,.09,.025],"#bf4c40",[0,-.06,-1.243],.025,.36);
  // Pantalla multimedia, marco, diales de climatización y pequeñas botoneras.
  addRoundedBox(car,[.76,.39,.10],"#1b2420",[.16,-.34,-1.275],.07,.38);
  const infotainmentTexture=addCanvasTexture((ctx,w,h)=>{
    ctx.fillStyle="#182522";ctx.fillRect(0,0,w,h);
    ctx.fillStyle="#a7c3b5";ctx.textAlign="center";ctx.font="bold 24px Arial";ctx.fillText("FM  98.7",w/2,h*.39);
    ctx.fillStyle="#e4c98e";ctx.font="16px Arial";ctx.fillText("RUTA · 09:41",w/2,h*.72);
  },320,160);
  const infotainment=new THREE.Mesh(new THREE.PlaneGeometry(.64,.27),new THREE.MeshBasicMaterial({map:infotainmentTexture,toneMapped:false}));
  infotainment.position.set(.16,-.34,-1.217);car.add(infotainment);
  for(let i=0;i<3;i++){
    const dial=new THREE.Mesh(new THREE.CylinderGeometry(.067,.067,.045,24),mat("#c4bca9",.45,.28));
    dial.rotation.x=Math.PI/2;dial.position.set(-.22+i*.22,-.67,-1.27);car.add(dial);
    addRoundedBox(car,[.012,.045,.016],i===0?"#bd6b50":"#d8c8a5",[-.22+i*.22,-.67,-1.238],.006,.35);
  }
  // Túnel central, caja de cambios, palanca, freno de mano y posavasos.
  addRoundedBox(car,[.70,.20,1.42],"#303934",[0,-.86,-.34],.10,.78);
  addRoundedBox(car,[.55,.055,.62],"#68675e",[0,-.735,-.55],.06,.82);
  const gear=new THREE.Group();gear.position.set(.20,-.67,-.80);car.add(gear);
  const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.035,.055,.25,16),chrome);shaft.position.y=.13;gear.add(shaft);
  addSoftVolume(gear,[.11,.09,.10],mat("#242b28",.32,.2),[0,.28,0]);
  for(const x of [-.22,.22]){
    const cup=new THREE.Mesh(new THREE.CylinderGeometry(.115,.095,.045,24),mat("#151c19",.62));cup.position.set(x,-.72,-.18);car.add(cup);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(.105,.012,6,24),chrome);rim.rotation.x=Math.PI/2;rim.position.set(x,-.693,-.18);car.add(rim);
  }
  // Pedales de freno y acelerador bajo la columna de dirección.
  for(const x of [-1.03,-.70]){
    const pedal=addRoundedBox(car,[.18,.28,.065],x<-.9?"#303633":"#555d57",[x,-.83,-1.10],.035,.68);pedal.rotation.x=-.14;
    for(let k=0;k<3;k++)addRoundedBox(car,[.12,.025,.012],"#9b9d91",[x,-.78+k*.07,-1.055],.008,.46);
  }
  // Volante revestido en goma, centro acolchado y tres radios visibles.
  const wheel=new THREE.Group();wheel.position.set(-.90,.26,-1.06);wheel.rotation.y=Math.PI;car.add(wheel);
  const wheelRing=new THREE.Mesh(new THREE.TorusGeometry(.39,.052,12,44),rubber);wheel.add(wheelRing);
  addSoftVolume(wheel,[.16,.14,.075],mat("#444c47",.48,.12),[0,0,0]);
  for(const angle of [0,Math.PI*.72,Math.PI*1.28]){
    const spoke=addRoundedBox(wheel,[.07,.33,.055],"#555c57",[0,-.02,0],.025,.48);spoke.rotation.z=angle;
  }
  addRoundedBox(wheel,[.18,.055,.06],"#303833",[0,-.13,.012],.022,.56);
  // Tapizado de tela con trama discreta para los asientos.
  const fabricTexture=addCanvasTexture((ctx,w,h)=>{
    ctx.fillStyle="#817767";ctx.fillRect(0,0,w,h);
    for(let y=0;y<h;y+=3)for(let x=0;x<w;x+=3){
      ctx.fillStyle=(x+y)%2?"rgba(255,255,255,.075)":"rgba(25,20,16,.055)";ctx.fillRect(x,y,1,1);
    }
  },128,128);
  fabricTexture.wrapS=THREE.RepeatWrapping;fabricTexture.wrapT=THREE.RepeatWrapping;fabricTexture.repeat.set(2,2);
  const upholstery=new THREE.MeshStandardMaterial({color:"#8c8170",map:fabricTexture,roughness:.98});
  const upholsterySide=mat("#665e52",.98),seam="#c0b19a";
  // Dos butacas anatómicas: cojín inferior, respaldo curvo, laterales acolchados y cabezal separado.
  for(const x of [-.82,.82]){
    addSoftVolume(car,[.55,.18,.58],upholstery,[x,-1.00,.12]);
    addSoftVolume(car,[.53,.71,.20],upholstery,[x,-.18,.77],[-.10,0,0]);
    addSoftVolume(car,[.12,.54,.19],upholsterySide,[x-.43,-.20,.80],[-.10,0,-.04]);
    addSoftVolume(car,[.12,.54,.19],upholsterySide,[x+.43,-.20,.80],[-.10,0,.04]);
    addSoftVolume(car,[.35,.51,.055],upholstery,[x,-.18,.966],[-.10,0,0]);
    addSoftVolume(car,[.27,.19,.14],upholstery,[x,.58,1.04]);
    for(const dx of [-.16,.16]){
      const post=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.22,12),chrome);post.position.set(x+dx,.73,1.03);car.add(post);
    }
    addTubePath(car,[[x-.29,.24,.94],[x-.30,-.12,.98],[x-.27,-.48,.94]],seam,.006);
    addTubePath(car,[[x+.29,.24,.94],[x+.30,-.12,.98],[x+.27,-.48,.94]],seam,.006);
  }
  // Banqueta trasera real de tres plazas, respaldos individuales y tres apoyacabezas.
  addSoftVolume(car,[1.18,.19,.48],upholstery,[0,-1.02,1.48]);
  addSoftVolume(car,[1.20,.57,.19],upholstery,[0,-.43,1.88],[-.08,0,0]);
  for(const x of [-.78,0,.78]){
    addSoftVolume(car,[.36,.43,.065],upholstery,[x,-.46,2.045],[-.08,0,0]);
    addSoftVolume(car,[.24,.18,.13],upholstery,[x,.27,1.93]);
    for(const dx of [-.13,.13]){
      const post=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.17,10),chrome);post.position.set(x+dx,.43,1.93);car.add(post);
    }
  }
  // Cinturones de tres puntos, hebillas y anclajes visibles.
  for(const x of [-.78,0,.78]){
    addTubePath(car,[[x*1.30,.42,1.74],[x*1.15,.10,1.80],[x*.94,-.72,1.52]],"#343b37",.026,.92);
    addRoundedBox(car,[.09,.24,.055],"#ad4a3d",[x,-.82,1.30],.022,.54);
    addRoundedBox(car,[.035,.08,.02],"#d4c8a9",[x,-.83,1.27],.008,.36);
  }
  // Espejo interior, luz de techo y detalles de acabado.
  addRoundedBox(car,[.46,.10,.14],"#303b38",[0,2.63,-1.91],.045,.42);
  addRoundedBox(car,[.35,.085,.045],"#9ba39d",[0,2.60,-1.85],.035,.22);
  // Retrovisores exteriores con brazo corto unido a la puerta, sin piezas suspendidas.
  for(const side of [-1,1]){
    addTubePath(car,[[side*1.78,1.30,-1.38],[side*1.92,1.36,-1.40],[side*2.03,1.40,-1.40]],"#283237",.045,.62);
    addRoundedBox(car,[.18,.13,.34],"#293337",[side*2.08,1.43,-1.40],.055,.38);
    addRoundedBox(car,[.018,.085,.25],"#aeb9b8",[side*2.175,1.445,-1.40],.022,.24);
  }
  const valentina=createDiner("valentina",-.82,.05,Math.PI,false);
  const bruno=createDiner("bruno",.82,.05,Math.PI,false);
  car.add(valentina.root,bruno.root);
  // Valentina keeps her hands near the steering wheel; Bruno's phone stays in the passenger's hands.
  const phone=makePhone(bruno.root);phone.visible=false;
  // Side advertising billboards are outside the windows; they pass alongside the car.
  const billboardRight=makeBillboard("JORGITO",1);const billboardLeft=makeBillboard("OREO",-1);
  scene.add(billboardRight,billboardLeft);
  return {scene,car,valentina,bruno,wheel,phone,billboardRight,billboardLeft,trees,hills,road,ground,roadMarks,roadsidePosts};
}

function shotCamera(shot:RoadtripShot,camera:THREE.PerspectiveCamera,time:number,billboardRight:THREE.Group,billboardLeft:THREE.Group){
  let p:[number,number,number]=[0,1.82,-2.62],target:[number,number,number]=[0,1.00,.12],fov=62;
  switch(shot){
    case "exterior": p=[10,5.4,-14];target=[0,-.62,.25];fov=44;break;
    case "master": p=[0,2.12,-4.90];target=[0,1.00,.35];fov=60;break;
    case "bruno": p=[.94,2.05,-4.65];target=[.82,1.00,.12];fov=56;break;
    case "valentina": p=[-.94,2.05,-4.65];target=[-.82,1.00,.12];fov=56;break;
    case "phone": p=[.58,1.05,-1.35];target=[.38,.47,-.63];fov=31;break;
    case "billboardRight": p=[.82,1.74,1.18];target=[5.12,1.40,billboardRight.position.z];fov=53;break;
    case "billboardLeft": p=[-.82,1.74,1.18];target=[-5.12,1.40,billboardLeft.position.z];fov=53;break;
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
      if(cue?.id==="01-bruno-cartel-alfajor")shot=t<cue.start+.82?"billboardRight":"bruno";
      if(cue?.id==="06-bruno-cartel-oreo")shot=t<cue.start+.78?"billboardLeft":"bruno";
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
