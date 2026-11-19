import * as THREE from "three";
import {
  AudioBufferSource as MediabunnyAudioBufferSource,
  BufferTarget,
  canEncodeAudio,
  canEncodeVideo,
  CanvasSource,
  Output,
  Quality,
  WebMOutputFormat,
} from "mediabunny";
import { generateOriginalSoundtrack } from "./audio";
import type { ProductionPackage, ProductionScene, SceneObject } from "./types";

export type RenderProgress = { frame: number; totalFrames: number; percent: number };

function geometryFor(shape: SceneObject["shape"]): THREE.BufferGeometry {
  switch (shape) {
    case "sphere": return new THREE.SphereGeometry(0.5, 32, 24);
    case "cylinder": return new THREE.CylinderGeometry(0.5, 0.5, 1, 48);
    case "torus": return new THREE.TorusGeometry(0.5, 0.16, 16, 48);
    case "cone": return new THREE.ConeGeometry(0.5, 1, 48);
    default: return new THREE.BoxGeometry(1, 1, 1);
  }
}

function createObject(item: SceneObject): THREE.Mesh {
  const material = new THREE.MeshStandardMaterial({ color: item.color, roughness: 0.48, metalness: 0.04 });
  const mesh = new THREE.Mesh(geometryFor(item.shape), material);
  mesh.name = item.id;
  mesh.position.set(...item.position);
  mesh.scale.set(...item.scale);
  if (item.rotation) mesh.rotation.set(...item.rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function drawOverlay(ctx: CanvasRenderingContext2D, scene: ProductionScene, width: number, height: number) {
  const accent = scene.accentColor || "#d8f36a";
  const gradient = ctx.createLinearGradient(0, height * 0.55, 0, height);
  gradient.addColorStop(0, "rgba(9,25,18,0)");
  gradient.addColorStop(1, "rgba(9,25,18,0.78)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (scene.headline) {
    const headlineSize = Math.round(width * 0.085);
    ctx.font = `800 ${headlineSize}px Arial, Helvetica, sans-serif`;
    ctx.lineWidth = Math.max(2, width * 0.004);
    ctx.strokeStyle = "rgba(8,20,14,.35)";
    ctx.fillStyle = "#ffffff";
    const words = scene.headline.split(" ");
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const candidate = line ? line + " " + word : word;
      if (ctx.measureText(candidate).width > width * 0.84 && line) { lines.push(line); line = word; }
      else line = candidate;
    }
    if (line) lines.push(line);
    const lineHeight = headlineSize * 1.08;
    const startY = height * 0.76 - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((text, index) => {
      const y = startY + index * lineHeight;
      ctx.strokeText(text, width / 2, y, width * 0.9);
      ctx.fillText(text, width / 2, y, width * 0.9);
    });
  }
  if (scene.subline) {
    ctx.font = `600 ${Math.round(width * 0.032)}px Arial, Helvetica, sans-serif`;
    ctx.fillStyle = accent;
    ctx.fillText(scene.subline.toUpperCase(), width / 2, height * 0.91, width * 0.86);
  }
  ctx.fillStyle = "rgba(255,255,255,.68)";
  ctx.font = `700 ${Math.round(width * 0.018)}px Arial, Helvetica, sans-serif`;
  ctx.fillText("INGREDORA", width / 2, height * 0.055);
}

function makeCanvasTexture(draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void, width = 1024, height = 768) {
  const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("No se pudo crear la etiqueta del producto.");
  draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8; return texture;
}

function createNutellaSet(world: THREE.Scene) {
  world.background = new THREE.Color("#e9dfcc"); world.fog = new THREE.Fog("#e9dfcc", 27, 52);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(24, 26), new THREE.MeshStandardMaterial({ color: "#c8b99d", roughness: 0.88 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, -2.25, -2); world.add(floor);
  // Painted supermarket back wall: warm greige, subtle plaster variation, no empty white void.
  const wallTexture = makeCanvasTexture((ctx,w,h) => {
    ctx.fillStyle = "#96978f"; ctx.fillRect(0,0,w,h);
    for (let i=0;i<4200;i++) {
      const x=(i*1973)%w, y=(i*3251)%h;
      const alpha=.018+((i*13)%10)/1000;
      ctx.fillStyle = i%2 ? `rgba(255,245,225,${alpha})` : `rgba(35,39,35,${alpha})`;
      ctx.fillRect(x,y,2+(i%5),2+(i%4));
    }
    const wash=ctx.createLinearGradient(0,0,w,h);
    wash.addColorStop(0,"rgba(255,239,210,.10)"); wash.addColorStop(.55,"rgba(255,255,255,0)"); wash.addColorStop(1,"rgba(37,43,39,.13)");
    ctx.fillStyle=wash;ctx.fillRect(0,0,w,h);
  },1024,768);
  wallTexture.wrapS=THREE.RepeatWrapping; wallTexture.wrapT=THREE.RepeatWrapping;
  wallTexture.repeat.set(2,1);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(18, 12), new THREE.MeshStandardMaterial({ map:wallTexture, color:"#aaa99f", roughness:1 }));
  wall.position.set(0, 2.5, -5.5); world.add(wall);
  const wallTrim = new THREE.Mesh(new THREE.BoxGeometry(18,.16,.12),new THREE.MeshStandardMaterial({color:"#777b73",roughness:.82}));
  wallTrim.position.set(0,-1.65,-5.38);world.add(wallTrim);
  const wallTopTrim = new THREE.Mesh(new THREE.BoxGeometry(18,.10,.10),new THREE.MeshStandardMaterial({color:"#b6b4a9",roughness:.8}));
  wallTopTrim.position.set(0,4.8,-5.4);world.add(wallTopTrim);
  const shelfMat = new THREE.MeshStandardMaterial({ color: "#303a35", roughness: 0.58, metalness: 0.32 });
  const edgeMat = new THREE.MeshStandardMaterial({ color: "#d9d1c2", roughness: 0.45, metalness: 0.55 });
  const colors = ["#f2d36b","#d83c2f","#e8a928","#3e8b62","#f1eee4","#3776a8","#d87932","#8eaa59","#8b4f9d","#e8a5b5"];
  for (let row=0; row<4; row++) {
    const y=-1.25+row*1.05;
    const shelf=new THREE.Mesh(new THREE.BoxGeometry(14,.12,1.15),shelfMat); shelf.position.set(0,y,-4.15); world.add(shelf);
    const lip=new THREE.Mesh(new THREE.BoxGeometry(14,.13,.09),edgeMat); lip.position.set(0,y-.01,-3.55); world.add(lip);
    for(let i=0;i<20;i++){
      const x=-6.4+i*.67, h=.46+((i*7+row*3)%5)*.085, w=.34+(i%3)*.045;
      const box=new THREE.Mesh(new THREE.BoxGeometry(w,h,.48),new THREE.MeshStandardMaterial({color:colors[(i+row*2)%colors.length],roughness:.72}));
      box.position.set(x,y+.12+h/2,-4.25+(i%2)*.04); world.add(box);
    }
    const strip=new THREE.Mesh(new THREE.BoxGeometry(14,.18,.08),new THREE.MeshStandardMaterial({color:"#c8c2b5",roughness:.8}));
    strip.position.set(0,y-.08,-3.49); world.add(strip);
    for(let i=0;i<7;i++){
      const tag=new THREE.Mesh(new THREE.BoxGeometry(.7,.09,.025),new THREE.MeshBasicMaterial({color:i===2?"#c83b2b":"#343a35"}));
      tag.position.set(-6+i*1.8,y-.08,-3.43); world.add(tag);
    }
  }
  for(const x of [-7.15,7.15]){const upright=new THREE.Mesh(new THREE.BoxGeometry(.16,5.4,.18),edgeMat);upright.position.set(x,.4,-4.05);world.add(upright);}
  const light=new THREE.Mesh(new THREE.BoxGeometry(5.2,.08,.45),new THREE.MeshBasicMaterial({color:"#fff4d8"}));light.position.set(-1.1,4.1,-1.5);world.add(light);

  const jar=new THREE.Group(); jar.position.set(0,-.35,.15); world.add(jar);
  const spread=new THREE.MeshPhysicalMaterial({color:"#4b2114",roughness:.28,clearcoat:.65,clearcoatRoughness:.2});
  const profile=[new THREE.Vector2(.58,-1.35),new THREE.Vector2(.72,-1.27),new THREE.Vector2(.82,-1.02),new THREE.Vector2(.86,-.35),new THREE.Vector2(.82,.55),new THREE.Vector2(.72,.94),new THREE.Vector2(.67,1.02),new THREE.Vector2(.67,1.22),new THREE.Vector2(.58,1.28),new THREE.Vector2(.56,1.18),new THREE.Vector2(.56,.95),new THREE.Vector2(0,.95)];
  const body=new THREE.Mesh(new THREE.LatheGeometry(profile,96),spread);body.castShadow=true;body.receiveShadow=true;jar.add(body);
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(.58,.62,.24,64),new THREE.MeshPhysicalMaterial({color:"#5b2919",roughness:.3,clearcoat:.5}));neck.position.y=1.12;jar.add(neck);
  const capMat=new THREE.MeshStandardMaterial({color:"#e52b22",roughness:.38});
  const cap=new THREE.Mesh(new THREE.CylinderGeometry(.69,.69,.32,96),capMat);cap.position.y=1.34;cap.castShadow=true;jar.add(cap);
  for(let i=0;i<48;i++){const a=i/48*Math.PI*2,ridge=new THREE.Mesh(new THREE.BoxGeometry(.035,.22,.035),capMat);ridge.position.set(Math.sin(a)*.685,1.34,Math.cos(a)*.685);ridge.rotation.y=a;jar.add(ridge);}
  const frontTex=makeCanvasTexture((ctx,w,h)=>{
    ctx.fillStyle="#f8f6ee";ctx.fillRect(0,0,w,h);
    // Nutella's recognizable wordmark: black initial, red remaining letters.
    ctx.textAlign="left";ctx.textBaseline="alphabetic";ctx.font="900 178px Arial, Helvetica, sans-serif";
    ctx.fillStyle="#171717";ctx.fillText("n",105,285);ctx.fillStyle="#d32622";ctx.fillText("utella",238,285);
    ctx.fillStyle="#6d371e";ctx.beginPath();ctx.ellipse(510,575,300,142,-.08,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#8a4b28";ctx.beginPath();ctx.ellipse(500,540,255,95,-.08,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#f3d8a2";ctx.font="800 44px Arial";ctx.textAlign="center";ctx.fillText("HAZELNUT SPREAD",w/2,790);
    ctx.fillStyle="#574334";ctx.font="700 31px Arial";ctx.fillText("WITH COCOA",w/2,840);
  },1024,900);
  const backTex=makeCanvasTexture((ctx,w,h)=>{
    ctx.fillStyle="#f7f4e9";ctx.fillRect(0,0,w,h);
    ctx.fillStyle="#d52b25";ctx.fillRect(0,0,w,42);
    ctx.fillStyle="#26221e";ctx.textAlign="left";ctx.font="900 70px Arial";ctx.fillText("NUTELLA",66,135);
    ctx.font="800 48px Arial";ctx.fillText("INGREDIENTES",66,218);
    ctx.fillStyle="#51483d";ctx.font="700 39px Arial";
    ["Azúcar","Aceite vegetal","Avellanas","Leche descremada en polvo","Cacao en polvo desgrasado","Emulsificante (lecitinas)","Saborizante"].forEach((line,i)=>ctx.fillText(line,74,315+i*76));
    ctx.fillStyle="#6b6255";ctx.font="30px Arial";ctx.fillText("Información del producto · Argentina",66,855);
  },1024,900);
  // Curved label shells sit just outside the jar instead of cutting through its surface.
  const labelRadius = .925;
  const labelArc = 1.62;
  const labelGeometry = () => new THREE.CylinderGeometry(labelRadius,labelRadius,1.25,64,1,true,-labelArc/2,labelArc);
  const front=new THREE.Mesh(labelGeometry(),new THREE.MeshStandardMaterial({map:frontTex,roughness:.58,side:THREE.DoubleSide}));
  front.position.set(0,.02,0); jar.add(front);
  const back=new THREE.Mesh(labelGeometry(),new THREE.MeshStandardMaterial({map:backTex,roughness:.62,side:THREE.DoubleSide}));
  back.position.set(0,.02,0); back.rotation.y=Math.PI; jar.add(back);
  const key=new THREE.DirectionalLight("#ffe2b8",2.05);key.position.set(-3.5,5.5,6);world.add(key);
  const fill=new THREE.DirectionalLight("#fff0d8",.72);fill.position.set(4,1.8,4);world.add(fill);
  const rim=new THREE.PointLight("#ff9d4d",11,18);rim.position.set(-2.8,.6,-.3);world.add(rim);
  const aisleLight=new THREE.PointLight("#f5d7a8",7,20);aisleLight.position.set(1.5,3.8,1.2);world.add(aisleLight);
  world.add(new THREE.HemisphereLight("#e8dfcf","#493326",.72));
  return {jar,frontLabel:front,backLabel:back};
}

type VoiceWordTiming = { text: string; start: number; end: number };
function normalizeCaptionWord(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, ""); }
function drawNutellaOverlay(ctx: CanvasRenderingContext2D, frame: number, fps: number, width: number, height: number, voiceWords: VoiceWordTiming[]) {
  const t = frame / fps;
  const accent = "#d8f36a";
  const white = "#fffdf7";
  const ease = (v: number) => { const x = Math.max(0, Math.min(1, v)); return 1 - Math.pow(1 - x, 3); };
  const smooth = (v: number) => { const x = Math.max(0, Math.min(1, v)); return x*x*(3-2*x); };
  const pop = (v: number) => { const x = Math.max(0, Math.min(1, v)); return 1 + Math.sin(x*Math.PI)*.055; };
  const rounded = (x:number,y:number,w:number,h:number,r:number) => {
    ctx.beginPath(); ctx.roundRect(x,y,w,h,r);
  };
  // A permanent, unmistakable brand signature. It remains in the same safe area
  // throughout the spot, including the final call-to-action.
  const brandIn = ease(t/.42);
  const brandY = -height*.075*(1-brandIn);
  ctx.save();
  ctx.globalAlpha=brandIn;
  ctx.translate(0,brandY);
  const brandW=width*.56, brandH=height*.066, brandX=(width-brandW)/2, brandY0=height*.045;
  const brandGrad=ctx.createLinearGradient(brandX,brandY0,brandX+brandW,brandY0+brandH);
  brandGrad.addColorStop(0,"rgba(7,19,14,.94)"); brandGrad.addColorStop(1,"rgba(20,39,27,.92)");
  rounded(brandX,brandY0,brandW,brandH,brandH*.48); ctx.fillStyle=brandGrad; ctx.fill();
  ctx.strokeStyle="rgba(216,243,106,.72)"; ctx.lineWidth=Math.max(1,width*.002); ctx.stroke();
  ctx.fillStyle=accent; ctx.beginPath(); ctx.arc(brandX+brandH*.62,brandY0+brandH/2,brandH*.13,0,Math.PI*2); ctx.fill();
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.font="900 "+Math.round(width*.039)+"px Arial, Helvetica, sans-serif";
  ctx.fillStyle=white; ctx.shadowColor="rgba(216,243,106,.35)"; ctx.shadowBlur=width*.012;
  ctx.fillText("INGREDORA.COM",width/2+brandH*.12,brandY0+brandH/2,width*.47);
  ctx.restore();

  // Subtle lower vignette keeps every caption legible without hiding the product.
  const lower=ctx.createLinearGradient(0,height*.57,0,height);
  lower.addColorStop(0,"rgba(5,14,10,0)"); lower.addColorStop(.34,"rgba(5,14,10,.46)"); lower.addColorStop(1,"rgba(5,14,10,.86)");
  ctx.fillStyle=lower; ctx.fillRect(0,height*.57,width,height*.43);

  const cueDefinitions = [
    {text:"¡LO RECONOCÉS ENSEGUIDA!",accent:"RECONOCÉS"},
    {text:"PERO… ¿SABÉS QUÉ TIENE REALMENTE?",accent:"REALMENTE"},
    {text:"VAMOS A MIRAR EL DORSO DEL FRASCO",accent:"DORSO"},
    {text:"LA ETIQUETA TIENE TODA LA INFORMACIÓN",accent:"INFORMACIÓN"},
    {text:"SIETE INGREDIENTES",accent:"SIETE"},
    {text:"LEÉLOS, MEMORIZALOS Y CONTAME",accent:"MEMORIZALOS"},
    {text:"¿CUÁNTOS RECORDÁS?",accent:"CUÁNTOS"},
    {text:"PARA SEGUIR JUGANDO",accent:"JUGANDO"},
    {text:"ENTRÁ A INGREDORA.COM",accent:"INGREDORA.COM"},
    {text:"O BUSCÁ EL LINK EN MI PERFIL. ¡TE ESPERO!",accent:"MI PERFIL"},
  ];
  let searchFrom=0;
  const cues=cueDefinitions.map((definition)=>{
    const tokens=definition.text.split(/\\s+/).map(normalizeCaptionWord).filter(Boolean);
    let found=-1;
    for(let i=searchFrom;i<=voiceWords.length-tokens.length;i++){
      if(tokens.every((token,j)=>normalizeCaptionWord(voiceWords[i+j]?.text||"")===token)){found=i;break;}
    }
    if(found<0) throw new Error("No se pudieron sincronizar los subtítulos con la locución: "+definition.text);
    const matched=voiceWords.slice(found,found+tokens.length);
    searchFrom=found+tokens.length;
    return {...definition,a:matched[0].start,b:matched[matched.length-1].end,wordTimings:matched};
  });
  const cue = cues.find((item)=>t>=item.a && t<=item.b+0.18);
  const drawKineticCaption = (item: typeof cues[number]) => {
    const p=(t-item.a)/Math.max(.01,item.b-item.a);
    const intro=ease(p/.17), outro=1-smooth((p-.86)/.14);
    const alpha=intro*outro;
    const lift=(1-intro)*height*.045;
    const words=item.text.split(" ");
    const fontSize=width*(item.text.length>31?.047:item.text.length>22?.054:.066);
    ctx.save(); ctx.globalAlpha=alpha;
    const panelW=width*.91, panelH=height*.145, panelX=(width-panelW)/2, panelY=(t>=8.25 && t<15 ? height*.66 : height*.755)+lift;
    const panel=ctx.createLinearGradient(panelX,panelY,panelX+panelW,panelY+panelH);
    panel.addColorStop(0,"rgba(5,17,12,.91)"); panel.addColorStop(.5,"rgba(11,29,20,.94)"); panel.addColorStop(1,"rgba(5,17,12,.91)");
    rounded(panelX,panelY,panelW,panelH,panelH*.18); ctx.fillStyle=panel; ctx.fill();
    ctx.strokeStyle="rgba(216,243,106,.52)"; ctx.lineWidth=Math.max(1,width*.0018); ctx.stroke();
    // A short animated accent rail signals each new spoken phrase.
    ctx.fillStyle=accent; rounded(panelX+panelW*.07,panelY+panelH*.17,panelW*.12*ease(p/.2),height*.006,height*.003); ctx.fill();
    ctx.font="900 "+Math.round(fontSize)+"px Arial, Helvetica, sans-serif";
    ctx.textAlign="center"; ctx.textBaseline="middle";
    const maxLine=panelW*.84, lineHeight=fontSize*1.18;
    const lines:string[][]=[]; let line:string[]=[]; let lineWidth=0;
    for(const word of words){
      const w=ctx.measureText(word+" ").width;
      if(line.length && lineWidth+w>maxLine){lines.push(line);line=[];lineWidth=0;}
      line.push(word);lineWidth+=w;
    }
    if(line.length)lines.push(line);
    let wordIndex=0;
    lines.forEach((row,rowIndex)=>{
      const widths=row.map(word=>ctx.measureText(word).width);
      const rowW=widths.reduce((sum,value)=>sum+value,0)+fontSize*.24*(row.length-1);
      let x=width/2-rowW/2;
      const y=panelY+panelH*.59+(rowIndex-(lines.length-1)/2)*lineHeight;
      row.forEach((word,i)=>{
        const timing=item.wordTimings[wordIndex];
        const reveal=ease((t-timing.start)/.12);
        const isAccent=word.replace(/[¡!¿?,…]/g,"")===item.accent.replace(/[¡!¿?,…]/g,"");
        const wordW=widths[i];
        const center=x+wordW/2;
        ctx.save(); ctx.globalAlpha*=reveal;
        const currentWord=t>=timing.start && t<=timing.end;
        if(isAccent || currentWord){
          ctx.fillStyle=isAccent?"rgba(216,243,106,.16)":"rgba(255,255,255,.10)";
          rounded(x-fontSize*.10,y-lineHeight*.39,wordW+fontSize*.20,lineHeight*.78,fontSize*.15);ctx.fill();
        }
        ctx.fillStyle=isAccent?accent:white;
        ctx.shadowColor=isAccent?"rgba(216,243,106,.55)":"rgba(0,0,0,.35)";
        ctx.shadowBlur=isAccent?width*.018:width*.006;
        const scale=pop(Math.max(0,Math.min(1,(t-timing.start)/.16)));
        ctx.translate(center,y);ctx.scale(scale,scale);ctx.fillText(word,0,0);ctx.restore();
        x+=wordW+fontSize*.24;wordIndex++;
      });
    });
    // Progress indicator follows the narration phrase, not an unrelated timer.
    ctx.fillStyle="rgba(255,255,255,.18)"; rounded(panelX+panelW*.07,panelY+panelH*.88,panelW*.86,height*.004,height*.002);ctx.fill();
    ctx.fillStyle=accent; rounded(panelX+panelW*.07,panelY+panelH*.88,panelW*.86*smooth(p),height*.004,height*.002);ctx.fill();
    ctx.restore();
  };

  const phase = t < cues[3].a ? 0 : t < cues[7].a ? 3 : 5;
  if (phase === 3) {
    // Ingredients are presented as a clean editorial checklist, separate from subtitles.
    const cardY=height*.835, cardH=height*.132, cardX=width*.055, cardW=width*.89;
    const cardIn=ease((t-8.05)/.35);
    ctx.save();ctx.globalAlpha=cardIn;
    rounded(cardX,cardY,cardW,cardH,cardH*.12);ctx.fillStyle="rgba(5,14,11,.91)";ctx.fill();
    ctx.strokeStyle="rgba(216,243,106,.42)";ctx.lineWidth=Math.max(1,width*.0015);ctx.stroke();
    ctx.textAlign="left";ctx.textBaseline="middle";
    ctx.font="900 "+Math.round(width*.021)+"px Arial, Helvetica, sans-serif";
    const ingredients=["AZÚCAR","ACEITE VEGETAL","AVELLANAS","LECHE DESCREMADA EN POLVO","CACAO EN POLVO DESGRASADO","EMULSIFICANTE (LECITINAS)","SABORIZANTE"];
    ingredients.forEach((item,i)=>{
      const col=i<4?0:1,row=i<4?i:i-4;
      const x=cardX+cardW*(col===0?.055:.535), y=cardY+cardH*(.19+row*.205);
      const itemIn=ease((t-(8.15+i*.12))/.22);
      ctx.globalAlpha=cardIn*itemIn;
      ctx.fillStyle=accent;ctx.beginPath();ctx.arc(x,y,width*.004,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=white;ctx.fillText(item,x+width*.016,y,cardW*.43);
    });
    ctx.restore();
  }

  if (cue) drawKineticCaption(cue);

  if (t>=19) {
    // The closing slate gives the URL first priority and animates the invitation beneath it.
    const p=smooth((t-19)/.55);
    ctx.save();ctx.globalAlpha=p;
    const glow=ctx.createRadialGradient(width/2,height*.39,0,width/2,height*.39,width*.72);
    glow.addColorStop(0,"rgba(216,243,106,.14)");glow.addColorStop(1,"rgba(216,243,106,0)");
    ctx.fillStyle=glow;ctx.fillRect(0,height*.12,width,height*.58);
    const brandPulse=1+Math.sin((t-19)*3.2)*.018;
    ctx.translate(width/2,height*.37);ctx.scale(brandPulse,brandPulse);
    ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.font="900 "+Math.round(width*.095)+"px Arial, Helvetica, sans-serif";
    ctx.shadowColor="rgba(216,243,106,.48)";ctx.shadowBlur=width*.04;
    ctx.fillStyle=white;ctx.fillText("INGREDORA.COM",0,0,width*.9);
    ctx.restore();
    const ctaAlpha=ease((t-20.15)/.35);
    ctx.save();ctx.globalAlpha=ctaAlpha;
    const ctaY=height*.56+(1-ctaAlpha)*height*.035;
    ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.font="900 "+Math.round(width*.046)+"px Arial, Helvetica, sans-serif";
    ctx.fillStyle=accent;ctx.shadowColor="rgba(216,243,106,.35)";ctx.shadowBlur=width*.018;
    ctx.fillText("ENTRÁ Y SEGUÍ JUGANDO",width/2,ctaY,width*.88);
    ctx.font="700 "+Math.round(width*.029)+"px Arial, Helvetica, sans-serif";
    ctx.fillStyle=white;ctx.shadowBlur=0;
    ctx.fillText("También encontrás el link en mi perfil",width/2,height*.635,width*.88);
    ctx.restore();
  }
}
function sceneAtFrame(pkg: ProductionPackage, frame: number): ProductionScene {
  return [...pkg.scenes].reverse().find((scene) => frame >= scene.startFrame) ?? pkg.scenes[0];
}

function validatePackage(pkg: ProductionPackage) {
  if (pkg.schemaVersion !== 1 || pkg.engineVersion !== "1.0.0") throw new Error("Versión del paquete o motor no compatible.");
  if (!pkg.id || !pkg.title || !pkg.scenes.length) throw new Error("El paquete necesita ID, título y al menos una escena.");
  if (!Number.isInteger(pkg.fps) || pkg.fps < 24 || pkg.fps > 60) throw new Error("FPS fuera del rango permitido (24–60).");
  if (pkg.width < 320 || pkg.height < 320 || pkg.width * pkg.height > 2_500_000) throw new Error("Resolución no permitida para el render inicial.");
  const ids = new Set<string>();
  const orderedScenes = [...pkg.scenes].sort((a, b) => a.startFrame - b.startFrame);
  if (orderedScenes[0].startFrame !== 0) throw new Error("La primera escena debe comenzar en el frame 0.");
  let expectedStart = 0;
  for (const scene of orderedScenes) {
    if (!scene.id || ids.has(scene.id) || scene.startFrame !== expectedStart || scene.durationFrames < 1) throw new Error("La línea de tiempo tiene escenas duplicadas, superpuestas o con espacios vacíos.");
    ids.add(scene.id);
    expectedStart = scene.startFrame + scene.durationFrames;
    if (!/^#[0-9a-f]{6}$/i.test(scene.background) || (scene.accentColor && !/^#[0-9a-f]{6}$/i.test(scene.accentColor))) throw new Error("Color de escena inválido.");
    const objectIds = new Set<string>();
    for (const item of scene.objects) {
      if (!item.id || objectIds.has(item.id) || !["box", "sphere", "cylinder", "torus", "cone"].includes(item.shape)) throw new Error("Objeto de escena no reconocido o con ID duplicado.");
      objectIds.add(item.id);
      if (![...item.position, ...item.scale, ...(item.rotation || [])].every(Number.isFinite) || item.scale.some((value) => value === 0)) throw new Error("Transformación de objeto inválida.");
      if (!/^#[0-9a-f]{6}$/i.test(item.color)) throw new Error("Color de objeto inválido.");
    }
  }
}

async function selectEncoders(width: number, height: number, fps: number) {
  for (const codec of ["vp9", "vp8"] as const) {
    if (await canEncodeVideo(codec, { width, height, frameRate: fps })) {
      if (await canEncodeAudio("opus", { numberOfChannels: 2, sampleRate: 48_000 })) return codec;
      throw new Error("El navegador no puede codificar audio Opus. No se generará un video silencioso.");
    }
  }
  throw new Error("El navegador no dispone de un codificador WebM compatible (VP9/VP8).");
}

export async function renderPackageToWebM(
  pkg: ProductionPackage,
  onProgress: (progress: RenderProgress) => void,
  signal?: AbortSignal,
): Promise<Blob> {
  validatePackage(pkg);
  const totalFrames = Math.max(...pkg.scenes.map((scene) => scene.startFrame + scene.durationFrames));
  const fps = pkg.fps;
  const durationSeconds = totalFrames / fps;
  const videoCodec = await selectEncoders(pkg.width, pkg.height, fps);
  if (signal?.aborted) throw new Error("Render cancelado.");

  // Original music is synthesized offline. Narration, when configured, is fetched as a
  // pre-generated asset so provider credentials never enter the public browser bundle.
  const soundtrack = await generateOriginalSoundtrack({ durationSeconds, sampleRate: 48_000 });
  let mixedSoundtrack = soundtrack;
  if (pkg.voiceoverUrl) {
    const voiceResponse = await fetch(import.meta.env.BASE_URL + pkg.voiceoverUrl);
    if (!voiceResponse.ok) throw new Error("No se pudo cargar la narración (" + voiceResponse.status + ").");
    const voiceBytes = await voiceResponse.arrayBuffer();
    const decodeContext = new AudioContext({ sampleRate: 48_000 });
    let voice: AudioBuffer;
    try { voice = await decodeContext.decodeAudioData(voiceBytes); }
    finally { await decodeContext.close(); }
    if (!voice.duration || voice.length < 1) throw new Error("La narración se descargó, pero no contiene audio reproducible.");
    // Measure the decoded narration before mixing. This catches a valid-looking but silent MP3.
    let voicePeak = 0;
    let voiceEnergy = 0;
    let voiceSamples = 0;
    for (let channel = 0; channel < voice.numberOfChannels; channel += 1) {
      const samples = voice.getChannelData(channel);
      for (let i = 0; i < samples.length; i += 1) {
        const magnitude = Math.abs(samples[i]);
        if (magnitude > voicePeak) voicePeak = magnitude;
        voiceEnergy += samples[i] * samples[i];
        voiceSamples += 1;
      }
    }
    const voiceRms = Math.sqrt(voiceEnergy / Math.max(1, voiceSamples));
    if (voicePeak < 0.0005 || voiceRms < 0.00005) {
      throw new Error("El MP3 de narración llegó, pero está prácticamente en silencio (pico " + voicePeak.toFixed(6) + ").");
    }
    const mixDuration = durationSeconds;
    const frameCount = Math.ceil(mixDuration * 48_000);
    const offline = new OfflineAudioContext(2, frameCount, 48_000);
    const musicSource = offline.createBufferSource();
    musicSource.buffer = soundtrack;
    const musicGain = offline.createGain();
    musicGain.gain.value = 0.055;
    musicSource.connect(musicGain).connect(offline.destination);
    musicSource.start(0);
    const voiceSource = offline.createBufferSource();
    voiceSource.buffer = voice;
    const voiceGain = offline.createGain();
    // Normalize quiet source files and keep the spoken track clearly above the music.
    voiceGain.gain.value = Math.min(4, Math.max(1.8, 0.82 / voicePeak));
    voiceSource.connect(voiceGain).connect(offline.destination);
    voiceSource.start(pkg.voiceoverOffsetSeconds || 0);
    mixedSoundtrack = await offline.startRendering();
    let mixedPeak = 0;
    for (let channel = 0; channel < mixedSoundtrack.numberOfChannels; channel += 1) {
      const samples = mixedSoundtrack.getChannelData(channel);
      for (let i = 0; i < samples.length; i += 1) mixedPeak = Math.max(mixedPeak, Math.abs(samples[i]));
    }
    if (mixedPeak < 0.0005) throw new Error("La mezcla final quedó en silencio; se canceló el video para no publicar otro render sin voz.");
  }
  if (signal?.aborted) throw new Error("Render cancelado.");

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(1);
  renderer.setSize(pkg.width, pkg.height, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = pkg.width;
  outputCanvas.height = pkg.height;
  const ctx = outputCanvas.getContext("2d", { alpha: false });
  if (!ctx) {
    renderer.dispose();
    throw new Error("No se pudo preparar el lienzo de composición.");
  }

  const target = new BufferTarget();
  const output = new Output({ format: new WebMOutputFormat(), target });
  const videoSource = new CanvasSource(outputCanvas, {
    codec: videoCodec,
    quality: new Quality({ bitrate: pkg.width >= 1000 ? 8_000_000 : 5_000_000 }),
  });
  const audioSource = new MediabunnyAudioBufferSource({
    codec: "opus",
    quality: new Quality({ bitrate: 128_000 }),
  });
  output.addVideoTrack(videoSource, { frameRate: fps });
  output.addAudioTrack(audioSource);
  output.setMetadataTags({ title: pkg.title, artist: "Ingredora Content Studio", date: new Date(pkg.createdAt) });

  const world = new THREE.Scene();
  if (pkg.visualPreset !== "nutella-supermarket") {
    world.add(new THREE.HemisphereLight(0xffffff, 0x273b2c, 2.0));
    const key = new THREE.DirectionalLight(0xffffff, 3.0);
    key.position.set(-3, 5, 6);
    key.castShadow = true;
    world.add(key);
    const rim = new THREE.DirectionalLight(0x9fcb83, 1.8);
    rim.position.set(4, 2, -4);
    world.add(rim);
  }

  const camera = new THREE.PerspectiveCamera(34, pkg.width / pkg.height, 0.1, 100);
  const nutellaSet = pkg.visualPreset === "nutella-supermarket" ? createNutellaSet(world) : null;
  let nutellaVoiceWords: VoiceWordTiming[] = [];
  if (nutellaSet) {
    const timingResponse = await fetch(import.meta.env.BASE_URL + "studio/audio/nutella-v9-word-timings.json");
    if (!timingResponse.ok) throw new Error("No se pudieron cargar los tiempos reales de la locución (" + timingResponse.status + ").");
    const timingData = await timingResponse.json() as { words?: VoiceWordTiming[] };
    if (!Array.isArray(timingData.words) || timingData.words.length < 10) throw new Error("El archivo de sincronización de voz está vacío o incompleto.");
    nutellaVoiceWords = timingData.words;
  }
  const sceneObjects = new Map<string, THREE.Mesh>();
  const materialObjects = new Map<string, SceneObject>();
  let lastSceneId = "";

  const drawFrame = (frame: number) => {
    if (nutellaSet) {
      const time = frame / fps;
       // 26-second storyboard: product reveal, memory challenge and sustained website end card.
      const smooth = (v: number) => { const x = Math.max(0, Math.min(1, v)); return x*x*(3-2*x); };
      const turn = time < 4.5 ? 0 : time < 6.5 ? smooth((time-4.5)/2)*Math.PI : time < 12.5 ? Math.PI : Math.PI + smooth((time-12.5)/2)*Math.PI;
      nutellaSet.jar.rotation.y = turn;
      nutellaSet.jar.position.y = -.35 + Math.sin(time * 1.7) * .045;
      // A brief label-only push toward camera: jar and camera remain locked.
      const labelIn = smooth((time-7.0)/.38);
      const labelOut = 1-smooth((time-8.25)/.42);
      const labelZoom = 1 + .26*Math.min(labelIn,labelOut);
      nutellaSet.backLabel.scale.set(labelZoom,labelZoom,labelZoom);
      nutellaSet.backLabel.position.z = -.13*Math.min(labelIn,labelOut);
      const distance = time < 2.5 ? 10.8 - smooth(time/2.5)*1.6 : time < 4.5 ? 9.2 - smooth((time-2.5)/2)*1.1 : time < 12.5 ? 8.1 : 8.1 + smooth((time-12.5)/2.5)*.7;
      camera.position.set(.12 + Math.sin(time*.22)*.08,.48,distance); camera.lookAt(0,-.12,0); camera.fov=34; camera.updateProjectionMatrix();
      renderer.render(world,camera); ctx.drawImage(renderer.domElement,0,0,pkg.width,pkg.height);
      drawNutellaOverlay(ctx,frame,fps,pkg.width,pkg.height,nutellaVoiceWords); return;
    }
    const current = sceneAtFrame(pkg, frame);
    if (current.id !== lastSceneId) {
      for (const object of sceneObjects.values()) {
        world.remove(object);
        object.geometry.dispose();
        (object.material as THREE.Material).dispose();
      }
      sceneObjects.clear();
      materialObjects.clear();
      current.objects.forEach((item) => {
        const mesh = createObject(item);
        sceneObjects.set(item.id, mesh);
        materialObjects.set(item.id, item);
        world.add(mesh);
      });
      lastSceneId = current.id;
    }

    world.background = new THREE.Color(current.background);
    const cameraPosition = current.camera?.position || [0, 0.4, 7];
    const cameraTarget = current.camera?.target || [0, 0, 0];
    camera.position.set(cameraPosition[0], cameraPosition[1], cameraPosition[2]);
    camera.lookAt(cameraTarget[0], cameraTarget[1], cameraTarget[2]);
    camera.fov = current.camera?.fov || 34;
    camera.updateProjectionMatrix();

    const localFrame = frame - current.startFrame;
    const time = localFrame / fps;
    for (const [id, mesh] of sceneObjects) {
      const item = materialObjects.get(id)!;
      const animation = item.animation;
      mesh.position.set(...item.position);
      mesh.rotation.set(...(item.rotation || [0, 0, 0]));
      mesh.scale.set(...item.scale);
      if (animation?.type === "float-rotate") {
        mesh.position.y += Math.sin(time * (animation.speed || 1.4) + (animation.phase || 0)) * (animation.amount || 0.18);
        mesh.rotation.y += time * (animation.speed || 1.4);
      } else if (animation?.type === "rotate") {
        mesh.rotation.y += time * (animation.speed || 1.2);
      } else if (animation?.type === "pulse") {
        const pulse = 1 + Math.sin(time * (animation.speed || 2)) * (animation.amount || 0.08);
        mesh.scale.multiplyScalar(pulse);
      }
    }

    renderer.render(world, camera);
    ctx.drawImage(renderer.domElement, 0, 0, pkg.width, pkg.height);
    drawOverlay(ctx, current, pkg.width, pkg.height);
  };

  let outputStarted = false;
  try {
    await output.start();
    outputStarted = true;
    await audioSource.add(mixedSoundtrack);
    audioSource.close();

    for (let frame = 0; frame < totalFrames; frame += 1) {
      if (signal?.aborted) throw new Error("Render cancelado.");
      drawFrame(frame);
      await videoSource.add(frame / fps, 1 / fps);
      onProgress({ frame: frame + 1, totalFrames, percent: Math.min(100, Math.round(((frame + 1) / totalFrames) * 100)) });
    }

    videoSource.close();
    await output.finalize();
    const buffer = target.buffer;
    if (!buffer || buffer.byteLength === 0) throw new Error("El render terminó sin generar un archivo audiovisual.");
    return new Blob([buffer], { type: await output.getMimeType() });
  } catch (error) {
    if (outputStarted && output.state !== "finalized" && output.state !== "canceled") {
      await output.cancel().catch(() => undefined);
    }
    throw error instanceof Error ? error : new Error("Error inesperado durante el render audiovisual.");
  } finally {
    for (const object of sceneObjects.values()) {
      object.geometry.dispose();
      (object.material as THREE.Material).dispose();
    }
    renderer.dispose();
  }
}
