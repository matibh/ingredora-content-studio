import * as THREE from "three";
import { BufferTarget, CanvasSource, Output, Quality, WebMOutputFormat, canEncodeVideo } from "mediabunny";
import { createDiner, type DinerRig } from "./entrePartidasDinner";

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
  dialogue: RoadtripCue[];
};
export type RoadtripProgress = { frame: number; totalFrames: number; percent: number };

const ease = (v:number) => { const x=Math.max(0,Math.min(1,v)); return x*x*(3-2*x); };
const mix = (a:number,b:number,t:number) => a+(b-a)*t;
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
    // A deliberately stylised product illustration; it does not reproduce an official pack.
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
  const post=addBox(group,[.16,2.7,.16],"#74664f",[0,-.1,0]);
  post.position.y=-.55;
  const board=new THREE.Mesh(new THREE.PlaneGeometry(2.8,1.85),new THREE.MeshBasicMaterial({map:makeAdTexture(brand),side:THREE.DoubleSide}));
  board.position.set(0,1.25,0);board.rotation.y=side>0?-Math.PI/2:Math.PI/2;group.add(board);
  const trim=addBox(group,[.10,1.98,2.92],"#e1d5bd",[0,1.25,0]);
  trim.visible=false;
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

function buildRoadtrip(){
  const scene=new THREE.Scene();scene.background=new THREE.Color("#a9c6d6");scene.fog=new THREE.Fog("#b9c8c2",28,82);
  scene.add(new THREE.HemisphereLight("#f7f1e4","#657460",1.8));
  const sun=new THREE.DirectionalLight("#fff0d6",2.25);sun.position.set(-7,10,5);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene.add(sun);
  const fill=new THREE.DirectionalLight("#d4e3ed",.72);fill.position.set(6,4,-5);scene.add(fill);
  const ground=addBox(scene,[80,.12,100],"#79906d",[0,-2.24,-3],.98);
  const road=addBox(scene,[8,.12,100],"#50514d",[0,-2.15,-3],.98);
  for(let i=0;i<18;i++)addBox(scene,[.16,.025,2.3],"#e9e1cb",[0,-2.07,-46+i*5.3],.9);
  // Low-poly rolling countryside, visible through the windows and in the opening shot.
  const hills:THREE.Mesh[]=[];
  for(let i=0;i<13;i++){
    const hill=new THREE.Mesh(new THREE.ConeGeometry(3.4+(i%3)*.6,2.6+(i%4)*.35,7),mat(i%2?"#81956e":"#91a47a",.98));
    hill.position.set((i%2?1:-1)*(8+(i%4)*2),-1.2,-38+i*6.4);hill.rotation.z=(i%2?.12:-.12);scene.add(hill);hills.push(hill);
  }
  const trees:THREE.Group[]=[];
  for(let i=0;i<18;i++){
    const tree=new THREE.Group();const side=i%2?1:-1;
    const trunk=addBox(tree,[.22,1.2,.22],"#795a3e",[0,-.45,0]);
    const leaves=new THREE.Mesh(new THREE.ConeGeometry(.78,1.8,6),mat(i%3?"#557650":"#66845c",.98));leaves.position.y=.82;tree.add(leaves);
    tree.position.set(side*(5.6+(i%3)*.55),-1.15,-42+i*5.2);scene.add(tree);trees.push(tree);
  }
  // Car exterior and cabin share one continuous model; interior coverage is cut from inside the same set.
  const car=new THREE.Group();scene.add(car);
  const paint=mat("#536d66",.38,.17),paintDark=mat("#32443f",.42,.16),rubber=mat("#202322",.86),glass=new THREE.MeshPhysicalMaterial({color:"#a8c6ca",transparent:true,opacity:.13,roughness:.18,metalness:.08,side:THREE.DoubleSide,depthWrite:false});
  addBox(car,[3.75,.76,5.65],"#536d66",[0,-1.48,0],.34);
  addBox(car,[3.55,.44,1.52],"#668078",[0,-1.12,-2.02],.32);
  addBox(car,[3.55,.42,1.22],"#536d66",[0,-1.18,2.12],.34);
  addBox(car,[2.92,.24,3.62],"#394b47",[0,-.92,.12],.48);
  // Roof, window pillars and door belt line.
  addBox(car,[3.20,.22,3.48],"#4c615b",[0,3.10,.05],.38);
  for(const x of [-1.55,1.55]){
    addBox(car,[.13,2.18,.14],"#3b4f49",[x,1.82,-1.58],.4);
    addBox(car,[.13,2.18,.14],"#3b4f49",[x,1.82,1.65],.4);
    addBox(car,[.18,.72,3.6],"#455b54",[x,-.62,.12],.45);
    const win=new THREE.Mesh(new THREE.PlaneGeometry(3.25,1.42),glass);win.rotation.y=Math.PI/2;win.position.set(x*1.005,1.84,.04);car.add(win);
  }
  // Rear side quarter windows and front windshield remain clear so exterior signs read through the glass.
  const windshield=new THREE.Mesh(new THREE.PlaneGeometry(3.0,1.42),glass);windshield.position.set(0,1.83,-2.02);windshield.rotation.x=-.10;car.add(windshield);
  // Dashboard, center console and front controls.
  addBox(car,[3.00,.48,.72],"#827f72",[0,-.10,-1.72],.58);
  addBox(car,[.92,.48,.74],"#5f625b",[0,-.55,-1.38],.52);
  addBox(car,[.74,.14,.64],"#b0a990",[0,-.28,-1.22],.5);
  addBox(car,[.72,.34,.035],"#25302e",[0,.05,-1.70],.28);
  for(let i=0;i<3;i++)addBox(car,[.12,.12,.06],i===0?"#b75d43":"#d5c7a1",[-.2+i*.2,-.25,-1.30],.35);
  // Front seats with a warm, textured low-poly upholstery.
  for(const x of [-.82,.82]){
    addBox(car,[.94,1.30,.20],"#746b5c",[x,-.02,.83],.96);
    addBox(car,[.98,.20,1.0],"#8b8170",[x,-1.12,.12],.92);
    addBox(car,[.10,1.04,.12],"#655e53",[x-.43,-.55,.83],.95);
    addBox(car,[.10,1.04,.12],"#655e53",[x+.43,-.55,.83],.95);
  }
  // Steering wheel: left-hand drive, fixed in the same place for every interior angle.
  const wheel=new THREE.Group();wheel.position.set(-.88,.38,-1.12);wheel.rotation.y=Math.PI;car.add(wheel);
  const wheelRing=new THREE.Mesh(new THREE.TorusGeometry(.40,.055,8,32),rubber);wheel.add(wheelRing);
  addBox(wheel,[.10,.62,.10],"#424743",[0,0,0],.42);
  const spokes=new THREE.Mesh(new THREE.TorusGeometry(.18,.025,6,20,Math.PI),rubber);spokes.rotation.z=Math.PI;spokes.position.y=-.07;wheel.add(spokes);
  // Interior mirror and trim.
  addBox(car,[.48,.10,.13],"#303b38",[0,2.65,-1.94],.35);
  addBox(car,[.36,.09,.045],"#8c9691",[0,2.62,-1.88],.24);
  const valentina=createDiner("valentina",-.82,.05,Math.PI,false);
  const bruno=createDiner("bruno",.82,.05,Math.PI,false);
  car.add(valentina.root,bruno.root);
  // Valentina keeps her hands near the steering wheel; Bruno's phone stays in the passenger's hands.
  const phone=makePhone(bruno.root);
  const phoneGlow=new THREE.PointLight("#e6e9d5",.45,1.6);phoneGlow.position.set(.4,2.3,.45);bruno.root.add(phoneGlow);
  // Side advertising billboards are outside the windows; they pass alongside the car.
  const billboardRight=makeBillboard("JORGITO",1);const billboardLeft=makeBillboard("OREO",-1);
  scene.add(billboardRight,billboardLeft);
  return {scene,car,valentina,bruno,wheel,phone,billboardRight,billboardLeft,trees,hills,road,ground};
}

function shotCamera(shot:RoadtripShot,camera:THREE.PerspectiveCamera,time:number,billboardRight:THREE.Group,billboardLeft:THREE.Group){
  let p:[number,number,number]=[0,1.82,-2.62],target:[number,number,number]=[0,1.00,.12],fov=62;
  switch(shot){
    case "exterior": p=[5.1,2.65,-6.0];target=[0,-.22,0];fov=48;break;
    case "master": p=[0,1.92,-2.56];target=[0,1.03,.15];fov=64;break;
    case "bruno": p=[.86,1.66,-1.88];target=[.82,1.08,-.34];fov=43;break;
    case "valentina": p=[-.86,1.66,-1.88];target=[-.82,1.08,-.34];fov=43;break;
    case "phone": p=[.58,1.05,-1.35];target=[.38,.47,-.63];fov=31;break;
    case "billboardRight": p=[1.18,1.60,-.45];target=[5.12,1.43,billboardRight.position.z];fov=51;break;
    case "billboardLeft": p=[-1.18,1.60,-.45];target=[-5.12,1.43,billboardLeft.position.z];fov=51;break;
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
  renderer.setSize(pkg.width,pkg.height,false);renderer.setPixelRatio(1);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
  const world=buildRoadtrip(),camera=new THREE.PerspectiveCamera(62,pkg.width/pkg.height,.1,120);
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
      const shot=t<3.2?"exterior":lastShot;
      // Roadside objects slide backwards while the car itself stays on the same mark.
      const scroll=t*8.2;
      world.trees.forEach((tree,i)=>{const base=-42+i*5.2;tree.position.z=((base+scroll+48)%92)-46;});
      world.hills.forEach((hill,i)=>{const base=-38+i*6.4;hill.position.z=((base+scroll*.22+48)%92)-46;});
      world.billboardRight.position.z=((scroll-76+18)%36+36)%36-18;
      world.billboardLeft.position.z=((scroll-360+18)%36+36)%36-18;
      const roadDashes=world.road.children;
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
        const mouthOpen=active?.04+Math.pow(Math.max(0,Math.sin(((t-cue!.start)/Math.max(.1,cue!.end-cue!.start))*Math.max(2,(cue!.text.match(/[aeiouáéíóúü]/gi)||[]).length)*Math.PI*2)),.8)*.55:.026;
        rig.mouth.scale.set(1,mouthOpen,1);
      }
      if(t>=3.2&&t<6.5){world.valentina.head.rotation.y=.025;}
      if(shot==="phone"){world.phone.rotation.z=Math.sin(t*1.4)*.025;}
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
