import * as THREE from "three";
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
    if(brand==="JORGITO"){
      const bg=ctx.createLinearGradient(0,0,w,h);bg.addColorStop(0,"#fff7e8");bg.addColorStop(.55,"#f0dfc3");bg.addColorStop(1,"#d8bd91");ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
      ctx.fillStyle="#b72e35";ctx.beginPath();ctx.roundRect(18,16,w-36,118,20);ctx.fill();
      ctx.fillStyle="#fff9ee";ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="900 88px Arial Black,Arial";ctx.fillText("JORGITO",w/2,76,w*.91);
      ctx.fillStyle="#7c2d2a";ctx.font="900 29px Arial";ctx.fillText("ALFAJOR TRADICIONAL",w/2,171);
      ctx.save();ctx.shadowColor="rgba(48,24,15,.34)";ctx.shadowBlur=22;ctx.shadowOffsetY=12;
      const pack=ctx.createLinearGradient(0,205,0,354);pack.addColorStop(0,"#e5d5b8");pack.addColorStop(.23,"#fff5df");pack.addColorStop(.67,"#dfc59d");pack.addColorStop(1,"#ae8960");
      ctx.fillStyle=pack;ctx.beginPath();ctx.moveTo(95,235);ctx.lineTo(145,212);ctx.lineTo(675,220);ctx.lineTo(714,250);ctx.lineTo(680,340);ctx.lineTo(145,350);ctx.lineTo(95,320);ctx.closePath();ctx.fill();ctx.restore();
      ctx.fillStyle="#b52e34";ctx.beginPath();ctx.moveTo(163,221);ctx.lineTo(649,226);ctx.lineTo(655,331);ctx.lineTo(158,337);ctx.closePath();ctx.fill();
      ctx.fillStyle="#f6e8ce";ctx.textAlign="center";ctx.font="900 65px Arial Black,Arial";ctx.fillText("JORGITO",w/2,278);ctx.font="800 24px Arial";ctx.fillText("ALFAJOR DE CHOCOLATE",w/2,315);
      ctx.strokeStyle="rgba(255,255,255,.72)";ctx.lineWidth=5;for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(111+i*9,230-i*2);ctx.lineTo(121+i*9,333+i*2);ctx.stroke();}
      const cx=535,cy=410;ctx.save();ctx.shadowColor="rgba(53,29,17,.25)";ctx.shadowBlur=12;ctx.shadowOffsetY=8;
      const alfajor=ctx.createLinearGradient(0,cy-55,0,cy+55);alfajor.addColorStop(0,"#e4bd7d");alfajor.addColorStop(1,"#9c6335");
      ctx.fillStyle=alfajor;ctx.beginPath();ctx.ellipse(cx,cy,114,49,-.08,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#4a241c";ctx.beginPath();ctx.ellipse(cx,cy-12,112,42,-.08,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#d4a15c";ctx.beginPath();ctx.ellipse(cx,cy-17,98,33,-.08,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#6b3825";ctx.beginPath();ctx.ellipse(cx,cy-18,63,22,-.08,0,Math.PI*2);ctx.fill();ctx.restore();
      ctx.fillStyle="#74312c";ctx.textAlign="left";ctx.font="900 28px Arial";ctx.fillText("DULCE DE LECHE",34,414);ctx.fillStyle="#613d2a";ctx.font="700 22px Arial";ctx.fillText("EL SABOR DE SIEMPRE",34,449);
      ctx.fillStyle="#a32b31";ctx.fillRect(0,477,w,35);ctx.fillStyle="#fff8e9";ctx.textAlign="center";ctx.font="800 18px Arial";ctx.fillText("UN CLÁSICO ARGENTINO",w/2,494);
    }else{
      const bg=ctx.createLinearGradient(0,0,w,h);bg.addColorStop(0,"#111c4b");bg.addColorStop(.52,"#233b82");bg.addColorStop(1,"#101638");ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
      ctx.strokeStyle="rgba(255,255,255,.14)";ctx.lineWidth=3;for(let r=0;r<5;r++){ctx.beginPath();ctx.arc(w*.5,h*.43,105+r*42,0,Math.PI*2);ctx.stroke();}
      ctx.save();ctx.shadowColor="#000";ctx.shadowBlur=16;ctx.shadowOffsetY=5;ctx.textAlign="center";ctx.textBaseline="middle";ctx.lineJoin="round";ctx.font="900 120px Arial Black,Arial";ctx.lineWidth=13;ctx.strokeStyle="#4774be";ctx.strokeText("OREO",w/2,105);ctx.fillStyle="#fff";ctx.fillText("OREO",w/2,105);ctx.restore();
      ctx.fillStyle="#eaf0ff";ctx.font="800 27px Arial";ctx.textAlign="center";ctx.fillText("GALLETITAS DE CHOCOLATE",w/2,166);
      const cookie=(cx:number,cy:number,r:number,angle:number)=>{
        ctx.save();ctx.translate(cx,cy);ctx.rotate(angle);const shell=ctx.createRadialGradient(-r*.25,-r*.28,r*.12,0,0,r);shell.addColorStop(0,"#5d473a");shell.addColorStop(.58,"#30241f");shell.addColorStop(1,"#130f12");
        ctx.fillStyle=shell;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#a18a71";ctx.lineWidth=Math.max(2,r*.055);ctx.beginPath();ctx.arc(0,0,r*.86,0,Math.PI*2);ctx.stroke();
        ctx.strokeStyle="#8c775f";ctx.lineWidth=Math.max(1.5,r*.025);for(let i=0;i<16;i++){const q=i*Math.PI/8;ctx.beginPath();ctx.arc(Math.cos(q)*r*.72,Math.sin(q)*r*.72,r*.075,0,Math.PI*2);ctx.stroke();}
        ctx.fillStyle="#e7d6b7";ctx.font="900 "+Math.round(r*.23)+"px Arial";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("OREO",0,0,r*1.1);ctx.restore();
      };
      ctx.save();ctx.shadowColor="rgba(0,0,0,.46)";ctx.shadowBlur=20;ctx.shadowOffsetY=12;ctx.fillStyle="#f4e9d8";ctx.beginPath();ctx.ellipse(300,347,135,37,-.08,0,Math.PI*2);ctx.fill();
      cookie(254,300,83,-.15);cookie(354,350,78,.22);cookie(480,295,91,.12);ctx.restore();
      ctx.fillStyle="#fff";ctx.font="900 31px Arial";ctx.fillText("CREMA ORIGINAL",w/2,455);ctx.fillStyle="#b8d1ff";ctx.font="700 21px Arial";ctx.fillText("EL CLÁSICO QUE NOS UNE",w/2,490);
    }
  },896,512);
}

function makeBillboard(brand:"JORGITO"|"OREO",side:number){
  const group=new THREE.Group(),turn=side>0?-Math.PI/2:Math.PI/2;
  const edge=brand==="JORGITO"?"#7c292d":"#17234d";
  const backing=addBox(group,[3.72,2.25,.18],edge,[0,1.40,0],.62);backing.rotation.y=turn;
  const face=new THREE.Mesh(new THREE.PlaneGeometry(3.48,1.98),new THREE.MeshStandardMaterial({map:makeAdTexture(brand),roughness:.68,metalness:.02,side:THREE.DoubleSide}));
  face.position.set(0,1.40,side>0?.105:-.105);face.rotation.y=turn;face.castShadow=true;group.add(face);
  // Dos postes rectos en el mismo plano del cartel, uno a cada lado. Sin diagonales ni cruces.
  for(const x of [-1.54,1.54]){
    addBox(group,[.19,4.55,.19],"#454a49",[x,.04,0],.55);
    addBox(group,[.44,.12,.44],"#555b57",[x,-2.18,0],.72);
    addBox(group,[.24,.12,.24],"#747a75",[x,2.34,0],.58);
  }
  const rail=addBox(group,[3.36,.13,.16],"#454a49",[0,.22,0],.55);rail.rotation.y=turn;
  const crown=addBox(group,[3.82,.13,.19],"#454a49",[0,2.56,0],.42);crown.rotation.y=turn;
  group.position.set(side*5.25,0,0);return group;
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
  // Low-poly rolling countryside, visible through the windows and in the opening shot.
  const hills:THREE.Mesh[]=[];
  for(let i=0;i<13;i++){
    const hill=new THREE.Mesh(new THREE.ConeGeometry(3.4+(i%3)*.6,2.6+(i%4)*.35,7),mat(i%2?"#81956e":"#91a47a",.98));
    hill.position.set((i%2?1:-1)*(8+(i%4)*2),-1.2,-38+i*6.4);hill.rotation.z=(i%2?.12:-.12);scene.add(hill);hills.push(hill);
  }
  const trees:THREE.Group[]=[];
  for(let i=0;i<18;i++){
    const tree=new THREE.Group();const side=i%2?1:-1;
    addBox(tree,[.22,1.2,.22],"#795a3e",[0,-.45,0]);
    const leaves=new THREE.Mesh(new THREE.ConeGeometry(.78,1.8,6),mat(i%3?"#557650":"#66845c",.98));leaves.position.y=.82;tree.add(leaves);
    tree.position.set(side*(5.6+(i%3)*.55),-1.15,-42+i*5.2);scene.add(tree);trees.push(tree);
  }
  // Car exterior and cabin share one continuous model; interior coverage is cut from inside the same set.
  const car=new THREE.Group();scene.add(car);
  const rubber=mat("#202322",.86),glass=new THREE.MeshPhysicalMaterial({color:"#a8c6ca",transparent:true,opacity:.13,roughness:.18,metalness:.08,side:THREE.DoubleSide,depthWrite:false});
  addBox(car,[3.75,.76,5.65],"#536d66",[0,-1.48,0],.34);
  addBox(car,[3.55,.44,1.52],"#668078",[0,-1.12,-2.02],.32);
  addBox(car,[3.55,.42,1.22],"#536d66",[0,-1.18,2.12],.34);
  addBox(car,[2.92,.24,3.62],"#394b47",[0,-.92,.12],.48);
  // Roof, window pillars and door belt line.
  addBox(car,[3.34,.24,4.26],"#40564f",[0,3.10,.05],.34);
  // Techo cerrado con revestimiento interior, viseras, plafón y agarraderas.
  addBox(car,[3.10,.10,4.02],"#c5c1b5",[0,2.94,.05],.88);
  addBox(car,[2.88,.06,3.72],"#d7d1c4",[0,2.875,.05],.92);
  for(const x of [-.86,.86])addBox(car,[.72,.10,.36],"#77786f",[x,2.72,-1.60],.72);
  addBox(car,[.36,.055,.24],"#414945",[0,2.81,.20],.48);
  addBox(car,[.23,.045,.13],"#f4e7c6",[0,2.775,.20],.3);
  for(const x of [-1.42,1.42])for(const z of [-.35,1.48])addBox(car,[.34,.07,.10],"#525c56",[x,2.72,z],.62);
  for(const x of [-1.55,1.55]){
    addBox(car,[.13,2.18,.14],"#3b4f49",[x,1.82,-1.58],.4);
    addBox(car,[.13,2.18,.14],"#3b4f49",[x,1.82,1.65],.4);
    addBox(car,[.18,.72,3.6],"#455b54",[x,-.62,.12],.45);
    const win=new THREE.Mesh(new THREE.PlaneGeometry(3.25,1.42),glass);win.rotation.y=Math.PI/2;win.position.set(x*1.005,1.84,.04);car.add(win);
  }
  // Rear side quarter windows and front windshield remain clear so exterior signs read through the glass.
  const windshield=new THREE.Mesh(new THREE.PlaneGeometry(3.0,1.42),glass);windshield.position.set(0,1.83,-2.02);windshield.rotation.x=-.10;car.add(windshield);
  // Rear windshield/luneta: the cabin is a complete closed-roof car, not a convertible.
  const rearGlass=new THREE.Mesh(new THREE.PlaneGeometry(2.82,1.34),glass);rearGlass.position.set(0,1.83,2.02);rearGlass.rotation.x=.10;car.add(rearGlass);
  for(const x of [-1.55,1.55]) addBox(car,[.13,.18,.14],"#3b4f49",[x,3.02,1.65],.4);
  // Layered dashboard: soft-touch upper pad, lower fascia, stitched trim and a proper instrument binnacle.
  addBox(car,[3.04,.22,.78],"#393f3c",[0,.10,-1.72],.92);
  addBox(car,[3.00,.48,.72],"#77766d",[0,-.10,-1.72],.68);
  addBox(car,[2.92,.055,.76],"#b0a38d",[0,-.31,-1.69],.72);
  addBox(car,[.98,.50,.76],"#4d5551",[0,-.56,-1.38],.58);
  addBox(car,[.78,.17,.68],"#262d2a",[0,-.30,-1.24],.48);
  // Instrument cluster glass and illuminated gauges behind the steering wheel.
  const gaugeTexture=addCanvasTexture((ctx,w,h)=>{
    ctx.fillStyle="#182321";ctx.fillRect(0,0,w,h);
    for(const x of [w*.27,w*.73]){ctx.strokeStyle="#d6d8c7";ctx.lineWidth=9;ctx.beginPath();ctx.arc(x,h*.55,h*.31,Math.PI,Math.PI*2);ctx.stroke();ctx.strokeStyle="#df7657";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(x,h*.55);ctx.lineTo(x+h*.18,h*.30);ctx.stroke();}
    ctx.fillStyle="#a7c7a2";ctx.font="bold 28px Arial";ctx.textAlign="center";ctx.fillText("0  80  120",w/2,h*.91);
  },512,256);
  const gauges=new THREE.Mesh(new THREE.PlaneGeometry(.82,.36),new THREE.MeshBasicMaterial({map:gaugeTexture,toneMapped:false}));gauges.position.set(-.88,.12,-1.315);car.add(gauges);
  // Air vents, hazard button, climate dials and infotainment screen.
  for(const x of [-1.18,-.54,.54,1.18]){
    addBox(car,[.28,.11,.035],"#202725",[x,-.045,-1.315],.48);
    addBox(car,[.025,.075,.018],"#9a9e94",[x,-.045,-1.292],.42);
  }
  addBox(car,[.34,.22,.035],"#18201e",[0,-.02,-1.302],.35);
  addBox(car,[.12,.10,.018],"#bd4f43",[0,-.02,-1.276],.4);
  addBox(car,[.70,.31,.035],"#182320",[0,-.48,-1.305],.28);
  addBox(car,[.62,.22,.012],"#78958b",[0,-.47,-1.282],.32);
  for(let i=0;i<3;i++){
    const dial=new THREE.Mesh(new THREE.CylinderGeometry(.065,.065,.035,12),mat("#c2b9a5",.5,.18));dial.rotation.x=Math.PI/2;dial.position.set(-.22+i*.22,-.70,-1.29);car.add(dial);
    addBox(car,[.08,.035,.018],i===0?"#b75d43":"#d5c7a1",[-.22+i*.22,-.70,-1.265],.4);
  }
  // Gear selector, cup holders and a textured centre tunnel.
  addBox(car,[.54,.16,1.15],"#343c38",[0,-.83,-.34],.74);
  const gear=new THREE.Group();gear.position.set(.20,-.65,-.82);car.add(gear);
  const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.035,.05,.28,8),mat("#8a8d86",.35,.55));shaft.position.y=.13;gear.add(shaft);
  const knob=new THREE.Mesh(new THREE.SphereGeometry(.105,12,8),mat("#262b29",.32,.18));knob.position.y=.30;gear.add(knob);
  for(const x of [-.22,.22]){const cup=new THREE.Mesh(new THREE.CylinderGeometry(.105,.09,.025,12),mat("#171d1b",.55));cup.position.set(x,-.73,-.18);car.add(cup);}
  // Door cards, recessed handles and small metallic inner releases.
  for(const side of [-1,1]){
    addBox(car,[.13,.62,2.75],"#59635d",[side*1.48,-.55,.05],.86);
    addBox(car,[.035,.12,.42],"#303a36",[side*1.405,-.38,.18],.45);
    addBox(car,[.04,.045,.20],"#b9b4a5",[side*1.38,-.37,.18],.32);
    addBox(car,[.035,.07,.55],"#424b46",[side*1.405,-.72,.70],.6);
  }
  // Butacas delanteras acolchadas, con panel central, laterales y apoyacabezas.
  for(const x of [-.82,.82]){
    addBox(car,[.94,1.30,.20],"#746b5c",[x,-.02,.83],.96);
    addBox(car,[.98,.20,1.0],"#8b8170",[x,-1.12,.12],.92);
    addBox(car,[.10,1.04,.12],"#655e53",[x-.43,-.55,.83],.95);
    addBox(car,[.10,1.04,.12],"#655e53",[x+.43,-.55,.83],.95);
    addBox(car,[.62,1.05,.035],"#8b8170",[x,-.02,.945],.98);
    addBox(car,[.34,.12,.20],"#6b6255",[x,.73,.84],.9);
  }
  // Asiento trasero completo de tres plazas, respaldo, apoyacabezas y cinturones.
  addBox(car,[2.34,.30,.88],"#746b5c",[0,-1.18,1.50],.96);
  addBox(car,[2.36,1.12,.25],"#817767",[0,-.47,1.84],.95);
  for(const x of [-.72,0,.72])addBox(car,[.72,.93,.045],"#958a78",[x,-.49,1.975],.96);
  for(const x of [-.76,0,.76])addBox(car,[.34,.64,.22],"#665e52",[x,.42,1.76],.86);
  for(const x of [-.72,0,.72]){
    const buckle=addBox(car,[.09,.30,.08],"#b83e36",[x,-.98,1.34],.5);buckle.rotation.z=x<0?-.08:.08;
  }
  for(const side of [-1,1]){
    const belt=addBox(car,[.045,1.08,.035],"#343c3a",[side*1.05,-.30,1.62],.9);belt.rotation.z=side*.16;
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
  const phone=makePhone(bruno.root);phone.visible=false;
  // Side advertising billboards are outside the windows; they pass alongside the car.
  const billboardRight=makeBillboard("JORGITO",1);const billboardLeft=makeBillboard("OREO",-1);
  scene.add(billboardRight,billboardLeft);
  return {scene,car,valentina,bruno,wheel,phone,billboardRight,billboardLeft,trees,hills,road,ground,roadMarks,roadsidePosts};
}

function shotCamera(shot:RoadtripShot,camera:THREE.PerspectiveCamera,time:number,billboardRight:THREE.Group,billboardLeft:THREE.Group){
  let p:[number,number,number]=[0,1.82,-2.62],target:[number,number,number]=[0,1.00,.12],fov=62;
  switch(shot){
    case "exterior": p=[5.1,2.65,-6.0];target=[0,-.22,0];fov=48;break;
    case "master": p=[0,1.92,-2.56];target=[0,1.03,.15];fov=64;break;
    case "bruno": p=[1.05,1.72,-2.35];target=[.82,1.08,-.30];fov=53;break;
    case "valentina": p=[-1.05,1.72,-2.35];target=[-.82,1.08,-.30];fov=53;break;
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
      world.roadMarks.forEach((mark,i)=>{const base=-52+i*5.0;mark.position.z=((base+scroll+56)%108)-54;});
      world.roadsidePosts.forEach((post,i)=>{const base=-52+Math.floor(i/2)*4.5;post.position.z=((base+scroll+56)%108)-54;});
      // Each roadside ad has one continuous far-to-near approach and a single pass; no cyclic reset.
      // It never wraps around or pops back into view after passing the car.
      world.billboardRight.position.z=18-(t-pkg.billboardRightAt)*8.2;
      world.billboardLeft.position.z=18-(t-pkg.billboardLeftAt)*8.2;
      world.billboardRight.visible=world.billboardRight.position.z>-30&&world.billboardRight.position.z<24;
      world.billboardLeft.visible=world.billboardLeft.position.z>-30&&world.billboardLeft.position.z<24;
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
