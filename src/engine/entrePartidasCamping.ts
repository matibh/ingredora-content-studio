import * as THREE from "three";
import { BufferTarget, CanvasSource, Output, Quality, WebMOutputFormat, canEncodeVideo } from "mediabunny";
import { type EntrePartidasSpeaker } from "./entrePartidas";
import { createDiner } from "./entrePartidasDinner";

export type CampingShot = "exterior" | "master" | "bruno" | "martina" | "tomas" | "valentina" | "ernesto" | "reaction";
export type CampingCue = { id:string; speaker:EntrePartidasSpeaker; text:string; start:number; end:number; look?:EntrePartidasSpeaker; shot:CampingShot; laugh?:boolean };
export type CampingPackage = { schemaVersion:1; engineVersion:"entre-partidas-camping-1.0.0"; id:string; title:string; createdAt:string; fps:number; width:number; height:number; durationSeconds:number; endCardStart:number; chapterNumber?:number; dialogue:CampingCue[] };
export type CampingProgress = { frame:number; totalFrames:number; percent:number };

const mat=(color:string,roughness=.78,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const box=(parent:THREE.Object3D,size:[number,number,number],material:THREE.Material,pos:[number,number,number],cast=true)=>{
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),material);mesh.position.set(...pos);mesh.castShadow=cast;mesh.receiveShadow=true;parent.add(mesh);return mesh;
};
const texture=(draw:(ctx:CanvasRenderingContext2D,w:number,h:number)=>void,w=512,h=256)=>{
  const canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;const ctx=canvas.getContext("2d");
  if(!ctx)throw new Error("No se pudo crear una textura de Entre Partidas.");
  draw(ctx,w,h);const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=8;return map;
};

function makeScene(){
  const scene=new THREE.Scene();
  scene.background=new THREE.Color("#778e91");
  scene.fog=new THREE.Fog("#778e91",34,78);
  scene.add(new THREE.HemisphereLight(0xc8e3e7,0x344333,2.0));
  const moon=new THREE.DirectionalLight(0xd4e1df,1.25);moon.position.set(-7,12,8);moon.castShadow=true;scene.add(moon);
  const warm=new THREE.DirectionalLight(0xffd3a0,1.0);warm.position.set(7,6,-8);scene.add(warm);
  const groundMat=mat("#4b6047",.98);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(90,90),groundMat);ground.rotation.x=-Math.PI/2;ground.position.y=-2.08;ground.receiveShadow=true;scene.add(ground);
  // Forest perimeter: a calm, readable low-poly backdrop, with no moving crowd or traffic.
  const trunk=mat("#5a4030",.98),leafA=mat("#334d3a",.98),leafB=mat("#486449",.98);
  for(let i=0;i<22;i++){
    const side=i%2===0?-1:1,depth=-12+(Math.floor(i/2)%11)*2.3,x=side*(7.2+(i%3)*1.15),h=4.4+(i%4)*.65;
    const stem=new THREE.Mesh(new THREE.CylinderGeometry(.22,.34,h*.42,7),trunk);stem.position.set(x,-2+h*.21,depth);stem.castShadow=true;scene.add(stem);
    for(let layer=0;layer<3;layer++){const crown=new THREE.Mesh(new THREE.ConeGeometry(1.45-layer*.20,2.35,7),layer%2?leafB:leafA);crown.position.set(x,-2+h*.42+layer*1.12,depth);crown.castShadow=true;scene.add(crown);}
  }

  // Tres carpas de camping distribuidas alrededor del claro.
  const canvas=mat("#b6a17a",.98),canvasDark=mat("#806e50",.98),tentFloor=mat("#4b5945",.98);
  const makeTent=(x:number,z:number,rotation:number,scale:number)=>{
    const tent=new THREE.Group();tent.position.set(x,-2.02,z);tent.rotation.y=rotation;tent.scale.setScalar(scale);scene.add(tent);
    const tri=(a:number[],b:number[],c:number[],material:THREE.Material)=>{
      const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute([...a,...b,...c],3));g.computeVertexNormals();
      const m=new THREE.Mesh(g,material);m.castShadow=true;m.receiveShadow=true;tent.add(m);
    };
    tri([-2,0,0],[2,0,0],[0,2.6,0],canvas);
    tri([-2,0,0],[0,2.6,0],[0,0,2.5],canvasDark);
    tri([2,0,0],[0,0,2.5],[0,2.6,0],canvas);
    tri([-2,0,0],[0,0,2.5],[2,0,0],tentFloor);
    const seam=box(tent,[.055,2.55,.055],canvasDark,[0,1.28,.025],false);
    void seam;
  };
  makeTent(-7.0,-6.0,.18,1.0);
  makeTent(7.0,-6.0,-.18,1.0);
  makeTent(0,7.0,Math.PI,1.0);

  // Cinco personajes sentados en el suelo, formando una ronda alrededor de la fogata.
  const names=["martina","tomas","bruno","valentina","ernesto"] as const;
  const placements:Array<[typeof names[number],number,number]>=[
    ["martina",-3.9,-.2],["tomas",-2.25,3.45],["bruno",0,-4.05],["valentina",2.25,3.45],["ernesto",3.9,-.2]
  ];
  const diners=placements.map(([name,x,z])=>{
    const turn=Math.atan2(-x,-z);
    return createDiner(name,x,z,turn,false,false,true);
  });
  diners.forEach(d=>scene.add(d.root));

  // El equipo de camping lleva la marca Ingredora; no hay mobiliario de comedor.
  const cooler=new THREE.Group();cooler.position.set(-5.45,-1.98,1.35);cooler.rotation.y=.32;scene.add(cooler);
  box(cooler,[1.25,.82,.82],mat("#d8d4c6",.62),[0,.41,0]);
  box(cooler,[1.30,.14,.88],mat("#315b49",.45),[0,.84,0]);
  const brandTex=texture((ctx,w,h)=>{
    ctx.fillStyle="#143b2d";ctx.fillRect(0,0,w,h);ctx.fillStyle="#f7f0dc";ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.font="900 58px Arial";ctx.fillText("INGREDORA",w/2,h/2);
  },512,128);
  const coolerLabel=new THREE.Mesh(new THREE.PlaneGeometry(1.08,.27),new THREE.MeshBasicMaterial({map:brandTex,toneMapped:false}));
  coolerLabel.position.set(0,.43,.416);cooler.add(coolerLabel);
  // A small branded pennant beside the tents reinforces Ingredora without adding clutter.
  const flag=new THREE.Group();flag.position.set(5.7,-2.02,2.8);scene.add(flag);
  const pole= new THREE.Mesh(new THREE.CylinderGeometry(.035,.045,2.65,8),mat("#6b553d",.9));pole.position.y=1.32;flag.add(pole);
  const flagTex=texture((ctx,w,h)=>{ctx.fillStyle="#153d2e";ctx.fillRect(0,0,w,h);ctx.fillStyle="#fff6df";ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="900 54px Arial";ctx.fillText("INGREDORA",w/2,h/2);},512,128);
  const pennant=new THREE.Mesh(new THREE.PlaneGeometry(1.8,.52),new THREE.MeshBasicMaterial({map:flagTex,toneMapped:false,side:THREE.DoubleSide}));
  pennant.position.set(.86,2.12,0);flag.add(pennant);

  // Fogata central: piedras, leños y llamas contenidas.
  const fireX=0,fireZ=0;
  const stone=mat("#62645c",.96),wood=mat("#59402e",.98);
  for(let i=0;i<12;i++){
    const a=i*Math.PI/6,rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.28,0),stone);
    rock.position.set(Math.cos(a)*1.02,-1.88,Math.sin(a)*1.02);rock.scale.set(1,.62,.82);rock.castShadow=true;scene.add(rock);
  }
  for(let i=0;i<3;i++){
    const log=box(scene,[1.35,.18,.20],wood,[fireX+(i-1)*.12,-1.92,fireZ+(i-1)*.12]);
    log.rotation.y=i*Math.PI/3;
  }
  const ember=new THREE.Mesh(new THREE.CylinderGeometry(.67,.72,.12,12),mat("#382c23",.8));
  ember.position.set(fireX,-1.91,fireZ);scene.add(ember);
  const flameMat=new THREE.MeshStandardMaterial({color:"#f28a36",emissive:"#d85b18",emissiveIntensity:1.1,roughness:.65});
  const flame=new THREE.Mesh(new THREE.ConeGeometry(.48,1.35,7),flameMat);flame.position.set(fireX,-1.05,fireZ);scene.add(flame);
  const flameCore=new THREE.Mesh(new THREE.ConeGeometry(.25,.88,6),new THREE.MeshStandardMaterial({color:"#ffd16c",emissive:"#ff9c27",emissiveIntensity:1.5}));
  flameCore.position.set(fireX,-1.10,fireZ);scene.add(flameCore);
  const fireLight=new THREE.PointLight(0xffa34b,4.5,15,2);fireLight.position.set(fireX,.05,fireZ);scene.add(fireLight);
  const smokeMat=new THREE.MeshStandardMaterial({color:"#c6c8c0",transparent:true,opacity:.18,roughness:1,depthWrite:false});
  const smoke:THREE.Mesh[]=[];
  for(let i=0;i<3;i++){const puff=new THREE.Mesh(new THREE.SphereGeometry(.25+i*.08,8,6),smokeMat);puff.position.set(fireX,.15+i*.38,fireZ);scene.add(puff);smoke.push(puff);}
  const update=(time:number,dialogue:CampingCue[])=>{
    const cue=dialogue.find(item=>time>=item.start&&time<=item.end);
    diners.forEach((rig,index)=>{
      const talking=rig.name===cue?.speaker,phase=index*.83,looking=cue?.look===rig.name;
      rig.head.rotation.y=THREE.MathUtils.lerp(rig.head.rotation.y,looking?0:Math.sin(time*.28+phase)*.008,.08);
      rig.head.rotation.x=talking?Math.sin(time*2.4+phase)*.018:Math.sin(time*.42+phase)*.006;
      const syllables=cue?.text.match(/[aeiouáéíóúü]/gi)?.length??2;
      const progress=cue?Math.max(0,Math.min(.999,(time-cue.start)/Math.max(.1,cue.end-cue.start))):0;
      rig.mouth.scale.set(1,talking?.035+Math.pow(Math.max(0,Math.sin(progress*Math.max(2,syllables)*Math.PI*2)),.8)*.48:.024,1);
      const gesture=talking?1:0,arm=.024;
      rig.leftArm.rotation.z=gesture?-arm-Math.sin(time*1.25+phase)*.008:-.008;
      rig.rightArm.rotation.z=gesture?arm+Math.sin(time*1.2+phase)*.008:.008;
      rig.leftArm.rotation.x=gesture?.012:0;rig.rightArm.rotation.x=gesture?-.012:0;
      rig.root.position.y=-2.08+Math.sin(time*.55+phase)*.0012;
    });
    const flicker=1+Math.sin(time*4.1)*.07+Math.sin(time*2.3)*.035;
    flame.scale.y=flicker;flameCore.scale.y=1+Math.sin(time*3.5)*.045;fireLight.intensity=4.3+Math.sin(time*3.2)*.25;
    smoke.forEach((puff,i)=>{puff.position.y=.1+i*.38+Math.sin(time*.35+i)*.04;puff.scale.setScalar(1+i*.18+Math.sin(time*.3+i)*.025);});
  };
  return {scene,cast:diners,dinner:{update}};
}

function cameraFor(shot:CampingShot,camera:THREE.PerspectiveCamera){
  const views:Record<string,{p:[number,number,number];target:[number,number,number];fov:number}>={
    exterior:{p:[0,5.6,29],target:[0,-.35,0],fov:52},
    master:{p:[0,5.15,25],target:[0,-.25,0],fov:51},
    bruno:{p:[0,2.55,4.25],target:[0,.30,-4.05],fov:47},
    martina:{p:[-1.35,2.55,1.15],target:[-3.9,.30,-.2],fov:48},
    tomas:{p:[-.40,2.65,-.10],target:[-2.25,.30,3.45],fov:48},
    valentina:{p:[.40,2.65,-.10],target:[2.25,.30,3.45],fov:48},
    ernesto:{p:[1.35,2.55,1.15],target:[3.9,.30,-.2],fov:48},
    reaction:{p:[0,4.45,16.5],target:[0,.65,0],fov:50}
  };
  const v=views[shot]??views.master;
  camera.position.set(...v.p);camera.lookAt(...v.target);camera.fov=v.fov;camera.updateProjectionMatrix();
}
function drawCaptions(ctx:CanvasRenderingContext2D,pkg:CampingPackage,time:number){
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

function drawBranding(ctx:CanvasRenderingContext2D,pkg:CampingPackage,time:number){
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
    ctx.fillStyle="#f0d18b";ctx.font="900 "+Math.round(22*s)+"px Arial";ctx.fillText("CAPÍTULO "+(pkg.chapterNumber??4),w/2,y+panelH*.82);ctx.restore();
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

export async function renderEntrePartidasCampingToWebM(pkg:CampingPackage,onProgress:(p:CampingProgress)=>void,signal?:AbortSignal):Promise<Blob>{
  if(pkg.schemaVersion!==1||pkg.engineVersion!=="entre-partidas-camping-1.0.0")throw new Error("Paquete del capítulo 7 incompatible.");
  if(pkg.width!==720||pkg.height!==1280||pkg.fps!==24)throw new Error("El capítulo requiere 720×1280 a 24 FPS.");
  if(!pkg.dialogue.length||pkg.durationSeconds<=0)throw new Error("El capítulo necesita diálogos y una duración válida.");
  if(!(await canEncodeVideo("vp9",{width:pkg.width,height:pkg.height,frameRate:pkg.fps})))throw new Error("No hay codificador VP9 disponible para el render.");
  const totalFrames=Math.round(pkg.durationSeconds*pkg.fps),renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:"high-performance"});
  renderer.setSize(pkg.width,pkg.height,false);renderer.setPixelRatio(1);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
  const world=makeScene(),camera=new THREE.PerspectiveCamera(48,pkg.width/pkg.height,.1,140);
  const canvas=document.createElement("canvas");canvas.width=pkg.width;canvas.height=pkg.height;const ctx=canvas.getContext("2d");if(!ctx)throw new Error("No se pudo crear el lienzo del capítulo.");
  const exteriorBackground=new THREE.Color("#778e91");const exteriorFog=new THREE.Fog("#778e91",34,78);const interiorBackground=new THREE.Color("#778e91");const interiorFog=new THREE.Fog("#778e91",34,78);
  const target=new BufferTarget(),output=new Output({format:new WebMOutputFormat(),target});
  const videoSource=new CanvasSource(canvas,{codec:"vp9",quality:new Quality({bitrate:8_000_000})});output.addVideoTrack(videoSource,{frameRate:pkg.fps});
  output.setMetadataTags({title:pkg.title,artist:"Ingredora — Entre Partidas",date:new Date(pkg.createdAt)});
  let started=false;
  try{
    await output.start();started=true;
    for(let frame=0;frame<totalFrames;frame++){
      if(signal?.aborted)throw new Error("Render cancelado.");
      const t=frame/pkg.fps,cue=pkg.dialogue.find(c=>t>=c.start&&t<=c.end);
      const shot:CampingShot=t<3.2?"exterior":cue?.shot??"master";
      world.scene.background=t<3.2?exteriorBackground:interiorBackground;
      world.scene.fog=t<3.2?exteriorFog:interiorFog;
      world.dinner.update(t,pkg.dialogue);
      cameraFor(shot,camera);
      if(t<3.2){
        const progress=Math.max(0,Math.min(1,t/3.2)),ease=progress*progress*(3-2*progress);
        camera.position.z-=2.7*ease;
        camera.lookAt(0,1.0,-.6);
      }
      renderer.render(world.scene,camera);ctx.drawImage(renderer.domElement,0,0,pkg.width,pkg.height);
      const vignette=ctx.createRadialGradient(360,550,280,360,640,930);vignette.addColorStop(0,"rgba(0,0,0,0)");vignette.addColorStop(1,"rgba(12,15,16,.17)");ctx.fillStyle=vignette;ctx.fillRect(0,0,pkg.width,pkg.height);
      drawCaptions(ctx,pkg,t);drawBranding(ctx,pkg,t);await videoSource.add(t,1/pkg.fps);
      if(frame%8===0||frame===totalFrames-1)onProgress({frame:frame+1,totalFrames,percent:Math.round((frame+1)/totalFrames*100)});
    }
    videoSource.close();await output.finalize();const buffer=target.buffer;if(!buffer?.byteLength)throw new Error("El render terminó sin generar el WebM.");
    return new Blob([buffer],{type:await output.getMimeType()});
  }catch(error){if(started&&output.state!=="finalized"&&output.state!=="canceled")await output.cancel().catch(()=>undefined);throw error instanceof Error?error:new Error("Falló el render del capítulo 7.");}
  finally{renderer.dispose();world.scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const m=o.material;if(Array.isArray(m))m.forEach(x=>x.dispose());else m.dispose();}});}
}
