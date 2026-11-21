import * as THREE from "three";
import { BufferTarget, CanvasSource, Output, Quality, WebMOutputFormat, canEncodeVideo } from "mediabunny";

export type Series3DProgress = { frame:number; totalFrames:number; percent:number };
type Cue = { speaker:"bruno"|"martina"|"valentina"; text:string; start:number; end:number; look:"bruno"|"martina"|"valentina"; };
type Package = { schemaVersion:1; engineVersion:"three-series-1.0.0"; id:string; title:string; createdAt:string; fps:number; width:number; height:number; durationSeconds:number; dialogue:Cue[] };

const ease=(v:number)=>{const x=Math.max(0,Math.min(1,v));return x*x*(3-2*x);};
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const box=(w:number,h:number,d:number)=>new THREE.BoxGeometry(w,h,d);

type Rig={root:THREE.Group; head:THREE.Group; torso:THREE.Mesh; leftArm:THREE.Group; rightArm:THREE.Group; leftLeg:THREE.Group; rightLeg:THREE.Group; name:string;};
function material(color:string,roughness=.82){return new THREE.MeshStandardMaterial({color,roughness});}
function block(parent:THREE.Object3D,size:[number,number,number],color:string,pos:[number,number,number],mat?:THREE.Material){
 const m=new THREE.Mesh(box(...size),mat||material(color));m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
function makeRig(id:"bruno"|"martina"|"valentina",x:number,z:number):Rig{
 const root=new THREE.Group();root.position.set(x,0,z);
 const skin=id==="bruno"?"#D69A76":id==="martina"?"#C98F70":"#E0AA8A";
 const shirt=id==="bruno"?"#C56B45":id==="martina"?"#B9A16C":"#426F83";
 const hair=id==="bruno"?"#3B2923":id==="martina"?"#38271F":"#241D1B";
 const torso=block(root,[.72,.92,.38],shirt,[0,1.18,0]);
 block(root,[.22,.18,.2],skin,[0,1.72,0]);
 const head=new THREE.Group();head.position.set(0,1.99,0);root.add(head);
 block(head,[.62,.64,.58],skin,[0,0,0]);
 // Hair silhouettes are intentionally distinct, not recolored copies.
 if(id==="bruno"){
  block(head,[.66,.18,.62],hair,[0,.31,-.015]);block(head,[.18,.17,.62],hair,[-.23,.21,.015]);block(head,[.16,.1,.58],hair,[.13,.34,.0]);
 }else if(id==="martina"){
  block(head,[.67,.16,.63],hair,[0,.32,-.015]);block(head,[.13,.58,.58],hair,[-.29,-.06,-.01]);block(head,[.13,.48,.58],hair,[.29,-.1,-.01]);block(head,[.3,.12,.61],hair,[.1,.22,.02]);
 }else{
  block(head,[.68,.18,.64],hair,[0,.32,-.01]);block(head,[.16,.56,.62],hair,[-.27,-.06,-.01]);block(head,[.16,.56,.62],hair,[.27,-.06,-.01]);block(head,[.22,.1,.63],hair,[-.15,.22,.02]);
 }
 // Front face, eyes, brows, nose and mouth.
 for(const ex of [-.15,.15]){
  block(head,[.075,.075,.025],"#F8F4EC",[ex,.035,.303]);
  block(head,[.035,.05,.018],"#282321",[ex,.025,.322]);
  block(head,[.12,.035,.03],hair,[ex,.14,.30]);
 }
 block(head,[.055,.075,.055],skin,[0,-.045,.31]);
 block(head,[.13,.035,.025],"#713F3A",[0,-.19,.305]);
 const arm=(side:number)=>{const pivot=new THREE.Group();pivot.position.set(side*.43,1.52,0);root.add(pivot);block(pivot,[.2,.54,.22],skin,[0,-.25,0]);block(pivot,[.2,.18,.22],shirt,[0,.12,0]);block(pivot,[.2,.18,.2],skin,[0,-.57,0]);return pivot;};
 const leg=(side:number)=>{const pivot=new THREE.Group();pivot.position.set(side*.2,.75,0);root.add(pivot);block(pivot,[.25,.58,.27],id==="bruno"?"#343C4A":id==="martina"?"#4C4B4A":"#303B42",[0,-.27,0]);block(pivot,[.3,.16,.42],"#292A2B",[0,-.58,.07]);return pivot;};
 return {root,head,torso,leftArm:arm(-1),rightArm:arm(1),leftLeg:leg(-1),rightLeg:leg(1),name:id};
}
function buildWorld(){
 const scene=new THREE.Scene();scene.background=new THREE.Color("#d9d9d4");scene.fog=new THREE.Fog("#d9d9d4",15,34);
 const floor= new THREE.Mesh(new THREE.PlaneGeometry(28,30),material("#c6c7c1",.3));floor.rotation.x=-Math.PI/2;floor.position.set(0,-.015,-2);floor.receiveShadow=true;scene.add(floor);
 // Realistic supermarket aisle: two deep gondola runs, shelf lips and varied generic packages.
 const shelfMat=material("#777b78"),edgeMat=material("#b7b8b2"),backMat=material("#e6e4dc");
 for(const side of [-1,1]){
  const x=side*3.0;
  block(scene,[.18,3.2,15],"#777b78",[x,1.6,-2],shelfMat);
  for(let level=0;level<5;level++){
   const y=.35+level*.58;
   block(scene,[1.05,.075,14],"#c6c7c1",[x-side*.52,y,-2],edgeMat);
   for(let i=0;i<13;i++){
    const colors=["#b45d42","#d2b65f","#63836f","#7c8ca5","#b78b63","#e0ddd2","#a96f82"];
    const width=.18+(i%3)*.035,height=.24+(i%4)*.055;
    const p=block(scene,[width,height,.23],colors[(i+level*2+(side>0?1:0))%colors.length],[x-side*(.36+(i%2)*.18),y+.12+height/2,-8+i*.94]);
    p.rotation.y=(i%3-1)*.08;
    block(p,[width*.68,.035,.012],"#eee9dc",[0,.02,.12]);
   }
  }
  block(scene,[.08,3.3,15],"#b4b6b1",[x-side*.95,1.65,-2],backMat);
  // Shelf header strips and understated category signage.
  block(scene,[.12,.42,14],"#e6e1d4",[x-side*.54,3.22,-2],backMat);
 }
 // Aisle endcaps and distant store cues.
 block(scene,[7,.2,.5],"#e4e1d8",[0,3.65,-9]);
 for(let i=0;i<6;i++){const lamp=new THREE.Mesh(new THREE.BoxGeometry(1.8,.06,.22),new THREE.MeshBasicMaterial({color:"#fff9e8"}));lamp.position.set(-4+i*1.6,5.3,-3);scene.add(lamp);}
 // Shopping cart, placed beside Bruno, with wire basket geometry.
 const cart=new THREE.Group();cart.position.set(.95,0,.7);scene.add(cart);
 block(cart,[.95,.08,.72],"#aeb4b4",[0,.9,0],new THREE.MeshStandardMaterial({color:"#9da5a5",metalness:.72,roughness:.35}));
 for(const xx of [-.45,.45])for(const zz of [-.32,.32]){block(cart,[.035,.62,.035],"#9ca5a5",[xx,1.18,zz]);}
 for(let y=.94;y<1.52;y+=.13)block(cart,[.92,.025,.68],"#9ca5a5",[0,y,0]);
 block(cart,[1.02,.055,.06],"#50585a",[0,1.56,-.38]);
 for(const xx of [-.36,.36]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.055,16),material("#303538"));wheel.rotation.z=Math.PI/2;wheel.position.set(xx,.12,.28);cart.add(wheel);}
 // Bruno's products, one held close to his face and another in the free hand.
 const packet=new THREE.Group();packet.position.set(-.42,2.04,.38);packet.rotation.y=-.12;scene.add(packet);
 block(packet,[.42,.58,.1],"#D7B86B",[0,0,0]);block(packet,[.34,.12,.015],"#F4EBD6",[0,.08,.06]);block(packet,[.24,.035,.018],"#8E563C",[0,-.11,.06]);
 const packet2= new THREE.Group();packet2.position.set(.38,1.88,.42);packet2.rotation.y=.15;scene.add(packet2);
 block(packet2,[.38,.52,.09],"#76917B",[0,0,0]);block(packet2,[.3,.1,.015],"#EAE5D7",[0,.07,.055]);
 // Overhead practicals and cinematic fill.
 const ambient=new THREE.HemisphereLight("#f7f5eb","#8d8f8c",1.8);scene.add(ambient);
 const key=new THREE.DirectionalLight("#fff1d7",2.1);key.position.set(-4,8,5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-9;key.shadow.camera.right=9;key.shadow.camera.top=9;key.shadow.camera.bottom=-5;scene.add(key);
 const fill=new THREE.DirectionalLight("#dce8f2",.8);fill.position.set(5,4,1);scene.add(fill);
 const ceiling=new THREE.PointLight("#fff7e8",65,18,2);ceiling.position.set(0,5,-1);scene.add(ceiling);
 const bruno=makeRig("bruno",-.55,.25),martina=makeRig("martina",-2.0,-.15),valentina=makeRig("valentina",2.0,-.15);
 scene.add(bruno.root,martina.root,valentina.root);
 return {scene,bruno,martina,valentina,cart,packet,packet2};
}
function cameraBeat(t:number,camera:THREE.PerspectiveCamera){
 let p:[number,number,number]=[0,2.65,10.2],target:[number,number,number]=[0,1.55,-.2],fov=39;
 // 0-5 establishing wide with a slow lateral reveal of the aisle.
 if(t<5){const q=ease(t/5);p=[mix(-.7,-.15,q),mix(3.2,2.8,q),mix(12.2,10.8,q)];target=[0,1.45,-.7];fov=42;}
 // 5-10 label macro / over Bruno's shoulder.
 else if(t<10){const q=ease((t-5)/.7);p=[mix(-.15,-1.05,q),mix(2.8,2.35,q),mix(10.8,6.1,q)];target=[-.45,2.05,.2];fov=mix(42,31,q);}
 // 10-17 medium two-shot, women enter frame.
 else if(t<17){const q=ease((t-10)/1.1);p=[mix(-1.05,0,q),2.75,mix(6.1,9.4,q)];target=[0,1.45,-.1];fov=mix(31,43,q);}
 // 17-26 Bruno medium close-up, camera just off his eyeline.
 else if(t<26){const q=ease((t-17)/.8);p=[mix(0,-1.7,q),2.55,mix(9.4,6.4,q)];target=[-.55,1.85,.2];fov=mix(43,34,q);}
 // 26-34 Martina / Valentina over-shoulder reverse angle.
 else if(t<34){const q=ease((t-26)/.7);p=[mix(-1.7,2.6,q),2.45,mix(6.4,6.8,q)];target=[.0,1.65,.05];fov=mix(34,36,q);}
 // 34-46 alternating close coverage around the three-shot axis.
 else if(t<46){const phase=Math.floor((t-34)/3)%3;p=phase===0?[-1.8,2.25,6.2]:phase===1?[2.55,2.3,6.3]:[-.25,2.65,8.5];target=phase===0?[-1.9,1.75,0]:phase===1?[1.95,1.75,0]:[0,1.45,-.1];fov=phase===2?42:34;}
 // 46-55 Valentina punchline, hold for reaction.
 else if(t<55){p=[2.55,2.35,5.9];target=[2.0,1.8,0];fov=32;}
 // 55-65 reaction, empty cart and pull back to wide.
 else{const q=ease((t-55)/2);p=[mix(2.55,.2,q),mix(2.35,3.1,q),mix(5.9,11.2,q)];target=[0,1.3,-.2];fov=mix(32,45,q);}
 camera.position.set(...p);camera.lookAt(...target);camera.fov=fov;camera.updateProjectionMatrix();
}
function drawCaptions(ctx:CanvasRenderingContext2D,pkg:Package,t:number){
 const cue=pkg.dialogue.find(c=>t>=c.start&&t<=c.end);if(!cue)return;
 const names={bruno:"BRUNO",martina:"MARTINA",valentina:"VALENTINA"};
 ctx.save();ctx.fillStyle="rgba(18,20,21,.78)";ctx.fillRect(42,1052,636,176);
 ctx.fillStyle="#b5d58b";ctx.font="700 22px Arial";ctx.fillText(names[cue.speaker],68,1090);
 ctx.fillStyle="#fffdf5";ctx.font="600 28px Arial";ctx.textAlign="left";
 const words=cue.text.split(" ");let line="",y=1134;
 for(const word of words){const test=line?line+" "+word:word;if(ctx.measureText(test).width>570){ctx.fillText(line,68,y);line=word;y+=36;}else line=test;}
 if(line)ctx.fillText(line,68,y);ctx.restore();
}
export async function renderSitcom3DToWebM(pkg:Package,onProgress:(p:Series3DProgress)=>void,signal?:AbortSignal):Promise<Blob>{
 if(pkg.schemaVersion!==1||pkg.engineVersion!=="three-series-1.0.0")throw new Error("Paquete 3D de serie no compatible.");
 if(pkg.width!==720||pkg.height!==1280||pkg.fps<24||pkg.fps>30)throw new Error("Perfil 3D no compatible: se requiere 720×1280 y 24–30 FPS.");
 if(!pkg.dialogue.length||pkg.durationSeconds<=0)throw new Error("La escena necesita diálogos y duración válida.");
 if(!(await canEncodeVideo("vp9",{width:pkg.width,height:pkg.height,frameRate:pkg.fps})))throw new Error("Este navegador no dispone de codificador VP9 para el render 3D.");
 const totalFrames=Math.round(pkg.durationSeconds*pkg.fps);
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:"high-performance"});
 renderer.setSize(pkg.width,pkg.height,false);renderer.setPixelRatio(1);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
 const {scene,bruno,martina,valentina,cart,packet,packet2}=buildWorld();
 const camera=new THREE.PerspectiveCamera(39,pkg.width/pkg.height,.1,80);
 const canvas=document.createElement("canvas");canvas.width=pkg.width;canvas.height=pkg.height;const ctx=canvas.getContext("2d");if(!ctx)throw new Error("No se pudo crear el lienzo de composición.");
 const target=new BufferTarget();const output=new Output({format:new WebMOutputFormat(),target});
 const videoSource=new CanvasSource(canvas,{codec:"vp9",quality:new Quality({bitrate:8_000_000})});
 output.addVideoTrack(videoSource,{frameRate:pkg.fps});output.setMetadataTags({title:pkg.title,artist:"Ingredora — Entre Partidas",date:new Date(pkg.createdAt)});
 let started=false;
 try{
  await output.start();started=true;
  for(let frame=0;frame<totalFrames;frame++){
   if(signal?.aborted)throw new Error("Render 3D cancelado.");
   const t=frame/pkg.fps;cameraBeat(t,camera);
   // Performance is deliberately restrained: planted feet, head turns and motivated hand gestures.
   const active=pkg.dialogue.find(c=>t>=c.start&&t<=c.end);
   const speaker=active?.speaker;
   const look=active?.look;
   for(const rig of [bruno,martina,valentina]){
    rig.head.rotation.y=look===rig.name?-.12:look?0.1:0;
    rig.head.rotation.x=speaker===rig.name?Math.sin(t*5)*.018:0;
    rig.leftArm.rotation.z=rig.name===speaker?-.12+Math.sin(t*4)*.06:0;
    rig.rightArm.rotation.z=rig.name===speaker?.14:0;
    rig.torso.rotation.z=rig.name===speaker?Math.sin(t*2.8)*.012:0;
   }
   if(t<10){bruno.head.rotation.x=-.11; bruno.rightArm.rotation.z=-.38;packet.rotation.z=Math.sin(t*1.7)*.025;}
   if(t>=10&&t<17){martina.root.position.x=mix(-2,-1.85,ease((t-10)/4));valentina.root.position.x=mix(2,1.8,ease((t-10)/4));}
   if(t>=17&&t<46){bruno.head.rotation.x=0;}
   if(t>=46&&t<55){valentina.head.rotation.y=-.12;valentina.rightArm.rotation.z=.26;}
   if(t>=55){cart.position.x=.95;}
   renderer.render(scene,camera);
   ctx.drawImage(renderer.domElement,0,0,pkg.width,pkg.height);
   // Soft filmic vignette, restrained lower-third captions, no intrusive UI.
   const vignette=ctx.createRadialGradient(360,560,280,360,640,900);vignette.addColorStop(0,"rgba(0,0,0,0)");vignette.addColorStop(1,"rgba(12,15,16,.22)");ctx.fillStyle=vignette;ctx.fillRect(0,0,pkg.width,pkg.height);
   drawCaptions(ctx,pkg,t);
   await videoSource.add(t,1/pkg.fps);
   onProgress({frame:frame+1,totalFrames,percent:Math.round((frame+1)/totalFrames*100)});
  }
  videoSource.close();await output.finalize();const buffer=target.buffer;if(!buffer?.byteLength)throw new Error("El render 3D terminó sin video.");return new Blob([buffer],{type:await output.getMimeType()});
 }catch(error){if(started&&output.state!=="finalized"&&output.state!=="canceled")await output.cancel().catch(()=>undefined);throw error instanceof Error?error:new Error("Falló el render 3D.");}
 finally{renderer.dispose();scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const m=o.material;if(Array.isArray(m))m.forEach(x=>x.dispose());else m.dispose();}});}
}
