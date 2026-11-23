import * as THREE from "three";
import { BufferTarget, CanvasSource, Output, Quality, WebMOutputFormat, canEncodeVideo } from "mediabunny";
import { makeCharacter, type CharacterRig, type EntrePartidasSpeaker } from "./entrePartidas";

export type ArcadeShot = "exterior" | "master" | "bruno" | "martina" | "tomas" | "valentina" | "ernesto" | "arcade" | "reaction";
export type ArcadeCue = { id:string; speaker:EntrePartidasSpeaker; text:string; start:number; end:number; look?:EntrePartidasSpeaker; shot:ArcadeShot; laugh?:boolean };
export type ArcadePackage = { schemaVersion:1; engineVersion:"entre-partidas-arcade-1.0.0"; id:string; title:string; createdAt:string; fps:number; width:number; height:number; durationSeconds:number; endCardStart:number; dialogue:ArcadeCue[] };
export type ArcadeProgress = { frame:number; totalFrames:number; percent:number };

const mat=(color:string,roughness=.78,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const box=(parent:THREE.Object3D,size:[number,number,number],material:THREE.Material,pos:[number,number,number],cast=true)=>{
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),material);mesh.position.set(...pos);mesh.castShadow=cast;mesh.receiveShadow=true;parent.add(mesh);return mesh;
};
const sphere=(parent:THREE.Object3D,size:[number,number,number],material:THREE.Material,pos:[number,number,number],segments=14)=>{
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(.5,segments,10),material);mesh.position.set(...pos);mesh.scale.set(...size);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
};
const texture=(draw:(ctx:CanvasRenderingContext2D,w:number,h:number)=>void,w=512,h=256)=>{
  const canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;const ctx=canvas.getContext("2d");
  if(!ctx)throw new Error("No se pudo crear una textura de Entre Partidas.");
  draw(ctx,w,h);const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=8;return map;
};

function createFacade(world:THREE.Scene){
  // Mismas medidas, materiales, seis niveles, tres ventanas por nivel y placa 284
  // que la fachada maestra utilizada en el capítulo 2.
  const bx=35,frontZ=-4.2;
  const facade=mat("#c9bca8",.94),facadeLight=mat("#e1d4c0",.92),concrete=mat("#8d887e",.86),frame=mat("#554f49",.62);
  const windowGlass=new THREE.MeshStandardMaterial({color:"#263b4b",roughness:.22,metalness:.18,emissive:"#182a35",emissiveIntensity:.18});
  box(world,[13.2,19,.95],facade,[bx,7.45,-4.72],false);
  box(world,[13.45,.42,1.08],concrete,[bx,17.15,-4.72],false);
  box(world,[13.35,.22,1.02],facadeLight,[bx,-2.05,-4.72],false);
  box(world,[.34,18.2,1.04],facadeLight,[bx-6.35,7.45,-4.72],false);
  box(world,[.34,18.2,1.04],facadeLight,[bx+6.35,7.45,-4.72],false);
  for(let floor=0;floor<6;floor++){
    const y=-.35+floor*2.82;
    for(let column=0;column<3;column++){
      const x=bx+(column-1)*3.85;
      box(world,[1.82,1.62,.075],frame,[x,y,frontZ],false);
      box(world,[1.64,1.44,.035],windowGlass,[x,y,frontZ+.045],false);
      box(world,[.055,1.48,.055],facadeLight,[x,y,frontZ+.08],false);
      box(world,[1.70,.055,.055],facadeLight,[x,y+.72,frontZ+.08],false);
      box(world,[1.70,.055,.055],facadeLight,[x,y-.72,frontZ+.08],false);
      box(world,[.045,1.42,.045],frame,[x,y,frontZ+.085],false);
      // Thin concrete window sills match the exact flat facade seen in chapter 2.
      box(world,[1.95,.10,.20],concrete,[x,y-.88,frontZ-.06],false);
    }
    box(world,[12.8,.10,.18],facadeLight,[bx,y-1.28,frontZ+.04],false);
    box(world,[12.8,.035,.035],mat("#bd9858",.34,.64),[bx,y+1.02,frontZ+.02],false);
  }
  box(world,[2.15,2.55,.12],frame,[bx,-.72,frontZ-.02],false);
  box(world,[1.82,2.26,.05],mat("#243640",.32,.2),[bx,-.78,frontZ+.06],false);
  box(world,[.09,2.25,.08],mat("#bd9858",.34,.64),[bx-.91,-.78,frontZ+.11],false);
  box(world,[.09,2.25,.08],mat("#bd9858",.34,.64),[bx+.91,-.78,frontZ+.11],false);
  box(world,[2.8,.18,1.05],mat("#49382a",.5),[bx,-2.12,frontZ-.35],false);
  box(world,[1.45,.42,.08],facadeLight,[bx,1.12,frontZ-.04],false);
  const number=texture((ctx,w,h)=>{ctx.fillStyle="#344b40";ctx.fillRect(0,0,w,h);ctx.fillStyle="#f7e9cc";ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="900 92px Arial";ctx.fillText("284",w/2,h/2);},256,128);
  const plate=new THREE.Mesh(new THREE.PlaneGeometry(1.35,.34),new THREE.MeshBasicMaterial({map:number}));plate.position.set(bx,1.12,frontZ+.012);world.add(plate);
  box(world,[34,.12,40],mat("#414344",.99),[bx,-2.24,-7],false);
  box(world,[18,.18,3.2],mat("#aaa69d",.96),[bx,-2.13,2.2],false);
  for(let i=0;i<6;i++)box(world,[1.5,.025,.09],mat("#d0c8b5",.9),[bx-4.5+i*1.8,-2.035,3.05],false);
  for(const [x,y] of [[bx-3.85,2.47],[bx+3.85,5.29],[bx,11.0],[bx-3.85,13.82]] as Array<[number,number]>)
    sphere(world,[.16,.18,.06],new THREE.MeshStandardMaterial({color:"#ffd48b",emissive:"#ffbb65",emissiveIntensity:1.4}),[x,y,frontZ-.02],10);
}

function createApartment(world:THREE.Scene){
  const floor=mat("#b9b2a4",.9),wall=mat("#d9cdbb",.94),trim=mat("#8a7965",.7),wood=mat("#75583e",.66);
  box(world,[12,.14,14],floor,[0,-2.12,1.4],false);
  box(world,[12,6,.20],wall,[0,.92,-3.2],false);
  box(world,[.20,6,14],wall,[-5.9,.92,1.4],false);
  box(world,[.20,6,14],wall,[5.9,.92,1.4],false);
  // Door opening is 1.05 m wide; arcade is 1.42 m wide and remains wedged diagonally.
  box(world,[2.35,.16,.30],wall,[-1.78,2.10,-3.2],false);
  box(world,[2.35,.16,.30],wall,[1.78,2.10,-3.2],false);
  box(world,[1.21,1.76,.20],wall,[0,1.14,-3.2],false);
  for(const x of [-.62,.62])box(world,[.12,2.2,.18],trim,[x,-.96,-3.12],false);
  box(world,[1.36,.12,.20],trim,[0,.20,-3.12],false);
  box(world,[.08,2.28,.08],wood,[-.52,-.95,-3.02],false);
  box(world,[.08,2.28,.08],wood,[.52,-.95,-3.02],false);
  box(world,[1.12,.08,.08],wood,[0,.18,-3.02],false);
  // Side wall details, framed pictures, coat hooks and a console make this read as the same lived-in home.
  box(world,[2.2,1.05,.10],wood,[-4.4,1.05,-1.4],false);
  box(world,[1.95,.82,.035],mat("#c6b28f",.9),[-4.4,1.05,-1.33],false);
  box(world,[.18,.9,.16],wood,[4.65,-1.45,1.1],false);
  box(world,[1.8,.12,.55],wood,[4.65,-.95,1.1],false);
  for(let i=0;i<3;i++)box(world,[.16,.38,.14],mat("#55745d"),[4.2+i*.38,-.69,1.1],false);
  // The unmistakable olive armchair that Ernesto refuses to move.
  const chair=mat("#69765b",.96);
  box(world,[1.15,.72,.95],chair,[3.6,-1.25,3.05],false);
  box(world,[1.15,1.05,.24],chair,[3.6,-.65,3.48],false);
  box(world,[.18,.72,.92],chair,[3.05,-1.18,3.05],false);
  box(world,[.18,.72,.92],chair,[4.15,-1.18,3.05],false);
  for(const x of [3.15,4.05])box(world,[.13,.35,.13],wood,[x,-1.78,2.72],false);
  // A small plant and rug soften the room without distracting from the doorway gag.
  box(world,[2.6,.025,2.2],mat("#9d8065",.98),[-1.1,-2.02,2.3],false);
  box(world,[.42,.42,.42],mat("#a66c4f",.9),[-4.4,-1.75,2.6],false);
  for(let i=0;i<5;i++)sphere(world,[.18,.58,.18],mat("#557b55",.95),[-4.4+Math.cos(i*1.25)*.23,-1.2,2.6+Math.sin(i*1.25)*.2],9);
}

function createArcade(world:THREE.Scene){
  const cabinet=new THREE.Group();cabinet.position.set(0,-2.12,-2.85);cabinet.rotation.y=.34;world.add(cabinet);
  const black=mat("#171b1c",.38,.18),side=mat("#253c35",.42,.12),metal=mat("#9ca49b",.32,.72),red=mat("#d94b38",.34,.2);
  box(cabinet,[1.42,2.08,.88],side,[0,1.04,0]);
  box(cabinet,[1.32,1.90,.08],black,[0,1.03,.47]);
  // Bright marquee: large, readable INGREDORA branding.
  const marqueeTex=texture((ctx,w,h)=>{ctx.fillStyle="#102d24";ctx.fillRect(0,0,w,h);ctx.strokeStyle="#e4c46f";ctx.lineWidth=10;ctx.strokeRect(10,10,w-20,h-20);ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle="#fff6d9";ctx.font="900 78px Arial Black,Arial";ctx.fillText("INGREDORA",w/2,h/2);},768,180);
  const marquee=new THREE.Mesh(new THREE.PlaneGeometry(1.28,.30),new THREE.MeshBasicMaterial({map:marqueeTex,side:THREE.DoubleSide,toneMapped:false}));marquee.position.set(0,2.00,.525);cabinet.add(marquee);
  const screenCanvas=document.createElement("canvas");screenCanvas.width=512;screenCanvas.height=512;const sctx=screenCanvas.getContext("2d");if(!sctx)throw new Error("No se pudo crear la pantalla arcade.");
  const screenTexture=new THREE.CanvasTexture(screenCanvas);screenTexture.colorSpace=THREE.SRGBColorSpace;
  const screen=new THREE.Mesh(new THREE.PlaneGeometry(1.05,.93),new THREE.MeshBasicMaterial({map:screenTexture,toneMapped:false}));screen.position.set(0,1.34,.53);cabinet.add(screen);
  const bezel=box(cabinet,[1.16,1.04,.06],metal,[0,1.34,.485]);bezel.position.z=.49;
  // Overlay screen stays in front of the bezel.
  screen.position.z=.531;
  box(cabinet,[1.12,.20,.12],black,[0,.72,.52]);
  box(cabinet,[1.12,.26,.48],side,[0,.55,.38]);
  const stick=new THREE.Group();stick.position.set(-.30,.70,.48);cabinet.add(stick);
  const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.035,.045,.30,12),metal);shaft.position.y=.12;stick.add(shaft);
  sphere(stick,[.17,.17,.17],red,[0,.30,0],12);
  for(const [x,color] of [[.16,"#d94b38"],[.39,"#e4c46f"]] as Array<[number,string]>){
    sphere(cabinet,[.13,.09,.13],mat(color,.28,.25),[x,.69,.58],14);
  }
  // Coin slot and speaker grille.
  box(cabinet,[.34,.08,.035],metal,[0,.27,.49]);
  for(let i=0;i<5;i++)box(cabinet,[.42,.018,.018],metal,[-.21+i*.105,.91,.54],false);
  const glow=new THREE.PointLight(0x9be5b4,4,4,2);glow.position.set(0,2.25,.5);cabinet.add(glow);
  return {cabinet,screenCanvas,sctx,screenTexture};
}

function drawArcadeScreen(ctx:CanvasRenderingContext2D,time:number){
  ctx.fillStyle="#070f12";ctx.fillRect(0,0,512,512);
  ctx.fillStyle="#0e382c";ctx.fillRect(16,18,480,476);
  ctx.strokeStyle="#e6c86e";ctx.lineWidth=7;ctx.strokeRect(23,25,466,462);
  ctx.textAlign="center";ctx.textBaseline="middle";
  ctx.fillStyle="#fff4d5";ctx.font="900 42px monospace";ctx.fillText("INGREDORA",256,112);
  ctx.fillStyle="#f6d34f";ctx.font="900 54px monospace";ctx.fillText("INSERT COIN",256,252);
  ctx.fillStyle="#c7e6c8";ctx.font="700 20px monospace";ctx.fillText("1 PLAYER   HIGH SCORE 000000",256,355);
  ctx.fillStyle="#f5e6bf";ctx.font="700 16px monospace";ctx.fillText("PRESS START",256,418);
  if(Math.floor(time*2)%2===0){ctx.fillStyle="#f6d34f";ctx.fillRect(124,450,264,5);}
}

function makeScene(){
  const scene=new THREE.Scene();scene.background=new THREE.Color("#b8cbd2");scene.fog=new THREE.Fog("#c8c8bb",38,95);
  scene.add(new THREE.HemisphereLight("#fff4df","#646d60",1.9));
  const sun=new THREE.DirectionalLight("#fff0d7",2.45);sun.position.set(-7,10,8);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene.add(sun);
  const fill=new THREE.DirectionalLight("#d7e5eb",.78);fill.position.set(7,5,-7);scene.add(fill);
  createFacade(scene);createApartment(scene);
  const cast:CharacterRig[]=[
    makeCharacter("bruno",-1.30,-2.95),makeCharacter("valentina",2.50,.70),
    makeCharacter("martina",-2.15,.15),makeCharacter("tomas",1.25,-.70),makeCharacter("ernesto",2.55,.15)
  ];
  cast.forEach(r=>{scene.add(r.root);r.root.position.y=r.name==="bruno"?-1.795:-2.135;r.root.rotation.y=0;r.leftArm.rotation.x=0;r.rightArm.rotation.x=0;});
  const arcade=createArcade(scene);
  return {scene,cast,arcade};
}

function cameraFor(shot:ArcadeShot,camera:THREE.PerspectiveCamera){
  let p:[number,number,number]=[0,2.2,9.0],target:[number,number,number]=[0,-.2,-2.4],fov=64;
  switch(shot){
    case "exterior":p=[35,7.5,23.6];target=[35,7.5,-4.4];fov=50;break;
    case "master":p=[0,2.25,9.0];target=[0,-.2,-2.4];fov=68;break;
    case "bruno":p=[-1.15,1.20,-.25];target=[-1.30,.05,-2.95];fov=55;break;
    case "martina":p=[-3.80,1.25,2.7];target=[-2.15,-.30,.15];fov=48;break;
    case "tomas":p=[2.9,1.25,2.35];target=[1.25,-.35,-.70];fov=44;break;
    case "valentina":p=[3.60,1.30,2.85];target=[2.50,-.30,.70];fov=50;break;
    case "ernesto":p=[4.25,1.25,3.2];target=[2.55,-.35,.15];fov=43;break;
    case "arcade":p=[.15,1.3,1.4];target=[0,-.55,-2.85];fov=38;break;
    case "reaction":p=[0,1.6,3.4];target=[0,-.15,-1.3];fov=54;break;
  }
  camera.position.set(...p);camera.lookAt(...target);camera.fov=fov;camera.updateProjectionMatrix();
}

function drawCaptions(ctx:CanvasRenderingContext2D,pkg:ArcadePackage,time:number){
  const cue=pkg.dialogue.find(c=>time>=c.start&&time<=c.end);if(!cue)return;
  const names:Record<EntrePartidasSpeaker,string>={bruno:"BRUNO",martina:"MARTINA",tomas:"TOMÁS",valentina:"VALENTINA",ernesto:"ERNESTO"};
  const s=pkg.width/720,maxW=pkg.width*.88;ctx.save();ctx.textAlign="center";ctx.textBaseline="middle";ctx.lineJoin="round";
  const font=27*s;ctx.font="800 "+font+"px Arial";const words=cue.text.split(/\s+/),lines:string[]=[];let line="";
  for(const word of words){const next=line?line+" "+word:word;if(ctx.measureText(next).width>maxW&&line){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);
  const shown=lines.length<=2?lines:[lines.slice(0,Math.ceil(lines.length/2)).join(" "),lines.slice(Math.ceil(lines.length/2)).join(" ")];
  const h=(30+shown.length*36+22)*s,y=pkg.height-h-30*s;
  ctx.fillStyle="rgba(13,29,23,.88)";ctx.beginPath();ctx.roundRect(pkg.width*.055,y,pkg.width*.89,h,12*s);ctx.fill();
  ctx.fillStyle="#d7e8ad";ctx.font="900 "+(17*s)+"px Arial";ctx.fillText(names[cue.speaker],pkg.width/2,y+18*s);
  ctx.fillStyle="#fffaf0";ctx.font="800 "+font+"px Arial";shown.forEach((row,i)=>ctx.fillText(row,pkg.width/2,y+(46+i*36)*s,maxW));
  ctx.restore();
}

function drawBranding(ctx:CanvasRenderingContext2D,pkg:ArcadePackage,time:number){
  const w=pkg.width,h=pkg.height,s=w/720;
  if(time<2.25){
    const alpha=Math.max(0,Math.min(1,time/.28,(2.25-time)/.36));ctx.save();ctx.globalAlpha=alpha;
    const panelW=w*.90,panelH=h*.155,x=(w-panelW)/2,y=h*.045;
    ctx.shadowColor="rgba(0,0,0,.38)";ctx.shadowBlur=24*s;
    const g=ctx.createLinearGradient(x,y,x+panelW,y+panelH);g.addColorStop(0,"rgba(20,48,39,.96)");g.addColorStop(1,"rgba(31,67,54,.94)");
    ctx.fillStyle=g;ctx.beginPath();ctx.roundRect(x,y,panelW,panelH,20*s);ctx.fill();ctx.shadowBlur=0;
    ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillStyle="#d7e8ad";ctx.font="900 "+Math.round(16*s)+"px Arial";ctx.fillText("INGREDORA ORIGINALS",w/2,y+panelH*.17);
    ctx.fillStyle="#fffaf0";ctx.font="900 "+Math.round(54*s)+"px Arial Black,Arial";ctx.fillText("ENTRE PARTIDAS",w/2,y+panelH*.49);
    ctx.fillStyle="#f0d18b";ctx.font="900 "+Math.round(22*s)+"px Arial";ctx.fillText("CAPÍTULO 4",w/2,y+panelH*.82);ctx.restore();
  }
  if(time>=pkg.endCardStart){
    const alpha=Math.min(1,(time-pkg.endCardStart)/.5);ctx.save();ctx.globalAlpha=alpha;
    const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,"#10251d");g.addColorStop(.5,"#17382c");g.addColorStop(1,"#0b1914");ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    ctx.strokeStyle="rgba(215,232,173,.65)";ctx.lineWidth=2*s;ctx.beginPath();ctx.roundRect(w*.10,h*.23,w*.80,h*.54,22*s);ctx.stroke();
    ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle="#d7e8ad";ctx.font="900 "+Math.round(22*s)+"px Arial";ctx.fillText("INGREDORA ORIGINALS",w/2,h*.32);
    ctx.fillStyle="#fffaf0";ctx.font="900 "+Math.round(58*s)+"px Arial Black,Arial";ctx.fillText("ENTRE PARTIDAS",w/2,h*.43);
    ctx.fillStyle="#f0d18b";ctx.font="900 "+Math.round(25*s)+"px Arial";ctx.fillText("Una serie de Ingredora",w/2,h*.51);
    ctx.fillStyle="#f5d792";ctx.font="900 "+Math.round(42*s)+"px Arial";ctx.fillText("ingredora.com",w/2,h*.62);
    ctx.fillStyle="#e8e2d5";ctx.font="700 "+Math.round(18*s)+"px Arial";ctx.fillText("Bruno · Martina · Tomás · Valentina · Ernesto",w/2,h*.70);ctx.restore();
  }
}

export async function renderEntrePartidasArcadeToWebM(pkg:ArcadePackage,onProgress:(p:ArcadeProgress)=>void,signal?:AbortSignal):Promise<Blob>{
  if(pkg.schemaVersion!==1||pkg.engineVersion!=="entre-partidas-arcade-1.0.0")throw new Error("Paquete del capítulo 4 incompatible.");
  if(pkg.width!==720||pkg.height!==1280||pkg.fps!==24)throw new Error("El capítulo requiere 720×1280 a 24 FPS.");
  if(!pkg.dialogue.length||pkg.durationSeconds<=0)throw new Error("El capítulo necesita diálogos y una duración válida.");
  if(!(await canEncodeVideo("vp9",{width:pkg.width,height:pkg.height,frameRate:pkg.fps})))throw new Error("No hay codificador VP9 disponible para el render.");
  const totalFrames=Math.round(pkg.durationSeconds*pkg.fps),renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:"high-performance"});
  renderer.setSize(pkg.width,pkg.height,false);renderer.setPixelRatio(1);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
  const world=makeScene(),camera=new THREE.PerspectiveCamera(48,pkg.width/pkg.height,.1,140);
  const canvas=document.createElement("canvas");canvas.width=pkg.width;canvas.height=pkg.height;const ctx=canvas.getContext("2d");if(!ctx)throw new Error("No se pudo crear el lienzo del capítulo.");
  const exteriorBackground=world.scene.background;const exteriorFog=world.scene.fog;const interiorBackground=new THREE.Color("#d9cdbb");const interiorFog=new THREE.Fog("#d9cdbb",28,88);
  const target=new BufferTarget(),output=new Output({format:new WebMOutputFormat(),target});
  const videoSource=new CanvasSource(canvas,{codec:"vp9",quality:new Quality({bitrate:8_000_000})});output.addVideoTrack(videoSource,{frameRate:pkg.fps});
  output.setMetadataTags({title:pkg.title,artist:"Ingredora — Entre Partidas",date:new Date(pkg.createdAt)});
  let started=false;
  try{
    await output.start();started=true;
    for(let frame=0;frame<totalFrames;frame++){
      if(signal?.aborted)throw new Error("Render cancelado.");
      const t=frame/pkg.fps,cue=pkg.dialogue.find(c=>t>=c.start&&t<=c.end);
      const shot:ArcadeShot=t<3.2?"exterior":cue?.shot??"master";
      world.scene.background=t<3.2?exteriorBackground:interiorBackground;
      world.scene.fog=t<3.2?exteriorFog:interiorFog;
      world.arcade.cabinet.position.set(0,-2.12,-2.85);
      world.arcade.cabinet.rotation.y=.34;
      drawArcadeScreen(world.arcade.sctx,t);world.arcade.screenTexture.needsUpdate=true;
      const speakerRig=cue?world.cast.find(r=>r.name===cue.speaker):undefined;
      world.cast.forEach((rig,index)=>{
        const active=cue?.speaker===rig.name,phase=index*.83;
        const dx=(speakerRig?.root.position.x??rig.root.position.x)-rig.root.position.x;
        const targetYaw=active?Math.sin(t*1.05+phase)*.025:cue?.look===rig.name?Math.sign(dx)*.14:Math.sin(t*.35+phase)*.012;
        rig.head.rotation.y=THREE.MathUtils.lerp(rig.head.rotation.y,targetYaw,.09);
        rig.head.rotation.x=active?Math.sin(t*2.2+phase)*.035:Math.sin(t*.55+phase)*.008;
        const vowels=(cue?.text.match(/[aeiouáéíóúü]/gi)||[]).length;
        const progress=cue?Math.max(0,Math.min(.999,(t-cue.start)/Math.max(.1,cue.end-cue.start))):0;
        const mouthOpen=active ? .04+Math.pow(Math.max(0,Math.sin(progress*Math.max(2,vowels)*Math.PI*2)),.8)*.55 : .025;
        rig.mouth.scale.set(1,mouthOpen,1);
        const idle=Math.sin(t*.72+phase)*.018;
        const gesture=Math.sin(t*2.0+phase)*.055;
        rig.leftArm.rotation.z=active?-.045-gesture:-.018-idle;
        rig.rightArm.rotation.z=active?.045+gesture*.8:.018+idle;
        if(rig.name==="bruno"){
          rig.leftArm.rotation.x=active?Math.sin(t*1.7)*.045:0;
          rig.rightArm.rotation.x=active?-Math.sin(t*1.7)*.045:0;
        }
        rig.root.position.y=rig.name==="bruno"?-1.795:-2.135;
      });
      cameraFor(shot,camera);renderer.render(world.scene,camera);ctx.drawImage(renderer.domElement,0,0,pkg.width,pkg.height);
      const vignette=ctx.createRadialGradient(360,550,280,360,640,930);vignette.addColorStop(0,"rgba(0,0,0,0)");vignette.addColorStop(1,"rgba(12,15,16,.17)");ctx.fillStyle=vignette;ctx.fillRect(0,0,pkg.width,pkg.height);
      drawCaptions(ctx,pkg,t);drawBranding(ctx,pkg,t);await videoSource.add(t,1/pkg.fps);
      if(frame%8===0||frame===totalFrames-1)onProgress({frame:frame+1,totalFrames,percent:Math.round((frame+1)/totalFrames*100)});
    }
    videoSource.close();await output.finalize();const buffer=target.buffer;if(!buffer?.byteLength)throw new Error("El render terminó sin generar el WebM.");
    return new Blob([buffer],{type:await output.getMimeType()});
  }catch(error){if(started&&output.state!=="finalized"&&output.state!=="canceled")await output.cancel().catch(()=>undefined);throw error instanceof Error?error:new Error("Falló el render del capítulo 4.");}
  finally{renderer.dispose();world.scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const m=o.material;if(Array.isArray(m))m.forEach(x=>x.dispose());else m.dispose();}});}
}
