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
import { createCocaColaPoolsideSet, drawCocaColaPoolsideOverlay } from "./cocaColaPoolside";

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
  // Premium supermarket gondola: powder-coated steel, perforated backing and reinforced shelves.
  const shelfMat=new THREE.MeshStandardMaterial({color:"#26332f",roughness:.42,metalness:.58});
  const edgeMat=new THREE.MeshStandardMaterial({color:"#b9bcb5",roughness:.34,metalness:.72});
  const darkMat=new THREE.MeshStandardMaterial({color:"#202a26",roughness:.62,metalness:.38});
  const backPanel=new THREE.Mesh(new THREE.BoxGeometry(14.1,5,.10),darkMat);backPanel.position.set(0,.35,-4.92);world.add(backPanel);
  const holeMat=new THREE.MeshBasicMaterial({color:"#66716a"});
  for(let r=0;r<25;r++)for(let col=0;col<67;col++){const hole=new THREE.Mesh(new THREE.CircleGeometry(.012,8),holeMat);hole.position.set(-6.85+col*.207,-2.02+r*.195,-4.855);world.add(hole);}
  const products=[
    ["#e9bd45","#9e3329","CEREALES","DESAYUNO"],["#d8e2cf","#315f48","PASTA","TRADICIONAL"],
    ["#bd4b37","#f4e5c8","SALSA","TOMATE"],["#e8d9b8","#493b2d","GALLETITAS","CLÁSICAS"],
    ["#315c4b","#f0d88c","CAFÉ","INTENSO"],["#e7a34e","#6c3526","SNACK","ORIGINAL"],
    ["#e8e7dd","#c33b2d","LECHE","ENTERA"],["#5b6c8c","#f2e8cb","ARROZ","SELECCIÓN"],
    ["#d8c5a5","#714c32","GALLETAS","VAINILLA"],["#76934e","#f4e8bf","ACEITE","GIRASOL"],
    ["#a84a36","#f6e7cf","CONSERVAS","VEGETALES"],["#d5b75f","#55412a","AVENA","INTEGRAL"]
  ];
  const packMats=products.map(([base,accent,name,sub],i)=>new THREE.MeshStandardMaterial({map:makeCanvasTexture((ctx,w,h)=>{
    ctx.fillStyle=base;ctx.fillRect(0,0,w,h);
    const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,"rgba(255,255,255,.3)");g.addColorStop(1,"rgba(0,0,0,.2)");ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    ctx.fillStyle=accent;ctx.fillRect(0,h*.12,w,h*.22);ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillStyle="#fffaf0";ctx.font="900 82px Arial";ctx.fillText(name,w/2,h*.235,w*.9);
    ctx.fillStyle=accent;ctx.font="800 43px Arial";ctx.fillText(sub,w/2,h*.53,w*.9);
    ctx.fillStyle="rgba(255,250,240,.9)";ctx.font="700 24px Arial";ctx.fillText(i%3===0?"CALIDAD":"SELECCIÓN",w/2,h*.84);
    ctx.strokeStyle="rgba(255,255,255,.55)";ctx.lineWidth=8;ctx.strokeRect(12,12,w-24,h-24);
  },256,384),roughness:.66}));
  const canMats=products.map(([base])=>new THREE.MeshStandardMaterial({color:base,roughness:.28,metalness:.42}));
  const ticketMats=Array.from({length:12},(_,i)=>new THREE.MeshBasicMaterial({map:makeCanvasTexture((ctx,w,h)=>{
    const promo=i===3||i===8;
    ctx.fillStyle=promo?"#fff0bd":"#f7f7f1";ctx.fillRect(0,0,w,h);
    ctx.fillStyle=promo?"#c7352c":"#26332f";ctx.fillRect(0,0,w,27);
    ctx.fillStyle="#fff";ctx.textAlign="left";ctx.textBaseline="middle";ctx.font="800 18px Arial";ctx.fillText(promo?"OFERTA":"PRECIO",14,14);
    ctx.fillStyle="#252923";ctx.font="900 49px Arial";ctx.fillText(["$ 1.890","$ 2.450","$ 3.190","$ 1.250","$ 4.890","$ 2.790","$ 1.690","$ 3.450","$ 2.190","$ 5.290","$ 1.990","$ 2.590"][i],14,76);
    ctx.fillStyle="#555b54";ctx.font="600 13px Arial";ctx.fillText("PRECIO POR UNIDAD",14,112);
    ctx.strokeStyle="#c8c9c1";ctx.lineWidth=3;ctx.strokeRect(2,2,w-4,h-4);
  },512,132),side:THREE.DoubleSide}));
  const shelfYs=[-1.25,-.20,.85,1.90];
  for(let row=0;row<4;row++){
    const y=shelfYs[row];
    const deck=new THREE.Mesh(new THREE.BoxGeometry(14,.105,1.34),shelfMat);deck.position.set(0,y,-4.18);deck.castShadow=true;deck.receiveShadow=true;world.add(deck);
    const beam=new THREE.Mesh(new THREE.BoxGeometry(14,.105,.10),edgeMat);beam.position.set(0,y-.005,-3.49);world.add(beam);
    const underside=new THREE.Mesh(new THREE.BoxGeometry(13.8,.035,1.22),darkMat);underside.position.set(0,y-.075,-4.16);world.add(underside);
    for(let depth=0;depth<2;depth++)for(let i=0;i<15;i++){
      const x=-6.35+i*.905+(depth?.12:0),v=(i*3+row*5+depth*7)%products.length,h=.36+((i*7+row*3+depth)%5)*.065,w=.30+(i%3)*.035;
      const can=(i+row+depth)%5===0;
      const pack=can?new THREE.Mesh(new THREE.CylinderGeometry(w*.46,w*.46,h,24),canMats[v]):new THREE.Mesh(new THREE.BoxGeometry(w,h,.27),packMats[v]);
      if(can){const rim=new THREE.Mesh(new THREE.TorusGeometry(w*.47,.018,8,24),edgeMat);rim.position.y=h/2;pack.add(rim);}
      if(!can&&(i+row)%4===0){const fold=new THREE.Mesh(new THREE.BoxGeometry(w*.72,.045,.25),packMats[v]);fold.position.y=h/2+.025;pack.add(fold);}
      pack.position.set(x,y+.105+h/2,depth===0?-3.91:-4.52);pack.castShadow=true;pack.receiveShadow=true;world.add(pack);
    }
    const rail=new THREE.Mesh(new THREE.BoxGeometry(14,.24,.075),new THREE.MeshStandardMaterial({color:"#e6e5dc",roughness:.38,metalness:.32}));rail.position.set(0,y-.16,-3.425);world.add(rail);
    for(let i=0;i<12;i++){const tag=new THREE.Mesh(new THREE.PlaneGeometry(.91,.235),ticketMats[(i+row*3)%12]);tag.position.set(-6+i*1.09,y-.16,-3.382);world.add(tag);}
    const glint=new THREE.Mesh(new THREE.BoxGeometry(13.9,.012,.012),new THREE.MeshBasicMaterial({color:"#f6e8c8"}));glint.position.set(0,y+.055,-3.48);world.add(glint);
  }
  for(const x of [-7.12,7.12]){
    const upright=new THREE.Mesh(new THREE.BoxGeometry(.18,5.55,.22),edgeMat);upright.position.set(x,.36,-4.02);upright.castShadow=true;world.add(upright);
    for(let i=0;i<39;i++){const slot=new THREE.Mesh(new THREE.BoxGeometry(.055,.045,.012),darkMat);slot.position.set(x,.36-2.55+i*.135,-3.902);world.add(slot);}
    const foot=new THREE.Mesh(new THREE.BoxGeometry(.32,.12,.62),darkMat);foot.position.set(x,-2.35,-3.98);world.add(foot);
  }
  const header=new THREE.Mesh(new THREE.BoxGeometry(14.2,.34,.18),shelfMat);header.position.set(0,3.05,-4.02);world.add(header);
  const headerLine=new THREE.Mesh(new THREE.BoxGeometry(13.8,.025,.015),new THREE.MeshBasicMaterial({color:"#d8f36a"}));headerLine.position.set(0,2.88,-3.91);world.add(headerLine);
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
    // Classic Argentine Nutella front: white band, black/red wordmark,
    // bread with cocoa-hazelnut spread, milk glass and hazelnuts.
    ctx.fillStyle="#fbfaf5";ctx.fillRect(0,0,w,h);
    const paper=ctx.createLinearGradient(0,0,0,h);
    paper.addColorStop(0,"rgba(255,255,255,.3)");paper.addColorStop(.5,"rgba(239,234,222,.04)");paper.addColorStop(1,"rgba(205,194,174,.16)");
    ctx.fillStyle=paper;ctx.fillRect(0,0,w,h);
    ctx.textAlign="left";ctx.textBaseline="alphabetic";
    ctx.font="900 224px Arial, Helvetica, sans-serif";
    ctx.fillStyle="#171717";ctx.fillText("n",104,270);
    ctx.fillStyle="#df242b";ctx.fillText("utella",238,270);
    ctx.font="700 25px Arial, Helvetica, sans-serif";ctx.fillStyle="#25211d";ctx.fillText("FERRERO",108,299);
    ctx.font="700 29px Arial, Helvetica, sans-serif";ctx.fillStyle="#29251f";ctx.fillText("®",815,186);
    // Toasted bread silhouette and glossy spread.
    ctx.save();ctx.shadowColor="rgba(65,39,20,.22)";ctx.shadowBlur=18;ctx.shadowOffsetY=8;
    ctx.fillStyle="#c88743";ctx.beginPath();ctx.moveTo(115,405);ctx.bezierCurveTo(125,350,185,331,250,348);ctx.bezierCurveTo(315,323,385,352,402,407);ctx.lineTo(390,650);ctx.quadraticCurveTo(255,696,126,645);ctx.closePath();ctx.fill();ctx.restore();
    ctx.fillStyle="#f2d39a";ctx.beginPath();ctx.moveTo(139,421);ctx.bezierCurveTo(155,374,205,361,254,375);ctx.bezierCurveTo(318,352,367,382,378,423);ctx.lineTo(366,624);ctx.quadraticCurveTo(255,665,151,620);ctx.closePath();ctx.fill();
    ctx.save();ctx.shadowColor="rgba(66,30,15,.35)";ctx.shadowBlur=12;
    ctx.fillStyle="#542817";ctx.beginPath();ctx.moveTo(151,432);ctx.bezierCurveTo(183,389,225,398,259,405);ctx.bezierCurveTo(304,380,350,407,367,446);ctx.lineTo(354,564);ctx.bezierCurveTo(286,594,205,588,158,556);ctx.closePath();ctx.fill();ctx.restore();
    ctx.strokeStyle="#8a4a27";ctx.lineWidth=8;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(170,468);ctx.bezierCurveTo(215,423,278,451,343,432);ctx.stroke();
    // Spreader knife.
    ctx.save();ctx.translate(332,400);ctx.rotate(-.55);ctx.fillStyle="#d8d9d4";ctx.beginPath();ctx.moveTo(-12,0);ctx.lineTo(2,-105);ctx.quadraticCurveTo(10,-124,19,-104);ctx.lineTo(18,0);ctx.closePath();ctx.fill();ctx.fillStyle="#7b5138";ctx.fillRect(-8,0,24,110);ctx.restore();
    // Milk glass with subtle cool reflections.
    ctx.save();ctx.fillStyle="#f4f7f2";ctx.beginPath();ctx.moveTo(510,370);ctx.lineTo(660,370);ctx.lineTo(642,645);ctx.quadraticCurveTo(584,664,528,645);ctx.closePath();ctx.fill();
    ctx.strokeStyle="#a9c1c2";ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(510,370);ctx.lineTo(660,370);ctx.lineTo(642,645);ctx.quadraticCurveTo(584,664,528,645);ctx.closePath();ctx.stroke();
    ctx.fillStyle="rgba(255,255,255,.7)";ctx.fillRect(524,391,15,220);ctx.restore();
    // Hazelnuts and green leaves.
    const nut=(x:number,y:number,r:number)=>{ctx.fillStyle="#9a5526";ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#d99a55";ctx.lineWidth=7;ctx.stroke();ctx.fillStyle="#e3b77c";ctx.beginPath();ctx.arc(x-r*.25,y-r*.25,r*.22,0,Math.PI*2);ctx.fill();};
    nut(742,574,51);nut(824,610,43);nut(695,650,34);
    ctx.fillStyle="#4d7b42";ctx.beginPath();ctx.ellipse(760,492,29,72,-.75,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#71964b";ctx.beginPath();ctx.ellipse(835,510,24,62,.65,0,Math.PI*2);ctx.fill();
    ctx.textAlign="center";ctx.fillStyle="#29251f";ctx.font="800 31px Arial, Helvetica, sans-serif";
    ctx.fillText("PASTA DULCE CON AVELLANAS Y CACAO",w/2,766);
    ctx.textAlign="right";ctx.font="700 34px Arial, Helvetica, sans-serif";ctx.fillText("PESO NETO",930,832);
    ctx.font="900 49px Arial, Helvetica, sans-serif";ctx.fillText("140 g",930,881);
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

type VoiceWordTiming = { text: string; start: number; end: number; segment?: number };

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function drawPoolsideVoiceCaption(
  ctx: CanvasRenderingContext2D,
  time: number,
  width: number,
  height: number,
  words: VoiceWordTiming[],
) {
  const activeIndex = words.findIndex((word, index) => {
    const nextWord = words[index + 1];
    const endOfWindow = nextWord?.segment === word.segment ? nextWord.start : word.end + 0.22;
    return time >= word.start && time < endOfWindow;
  });
  if (activeIndex < 0) return;

  const active = words[activeIndex];
  const phrase = words.filter((word) => word.segment === active.segment);
  const spoken = phrase.filter((word) => word.start <= time);
  if (!spoken.length) return;

  const scale = width / 720;
  const maxTextWidth = width * 0.80;
  const gap = 12 * scale;
  let fontSize = 30 * scale;
  let rows: VoiceWordTiming[][] = [];
  let rowWidths: number[] = [];

  const measureRows = () => {
    rows = [];
    rowWidths = [];
    let row: VoiceWordTiming[] = [];
    let rowWidth = 0;
    ctx.font = "900 " + Math.round(fontSize) + "px Arial, Helvetica, sans-serif";
    phrase.forEach((word) => {
      const wordWidth = ctx.measureText(word.text).width;
      const nextWidth = row.length ? rowWidth + gap + wordWidth : wordWidth;
      if (row.length && nextWidth > maxTextWidth) {
        rows.push(row);
        rowWidths.push(rowWidth);
        row = [word];
        rowWidth = wordWidth;
      } else {
        row.push(word);
        rowWidth = nextWidth;
      }
    });
    if (row.length) {
      rows.push(row);
      rowWidths.push(rowWidth);
    }
  };

  measureRows();
  while ((rows.length > 2 || rowWidths.some((value) => value > maxTextWidth)) && fontSize > 21 * scale) {
    fontSize -= 1.5 * scale;
    measureRows();
  }
  if (rows.length > 3) {
    fontSize = 21 * scale;
    measureRows();
  }

  const lineHeight = fontSize * 1.34;
  const panelWidth = width * 0.92;
  const panelHeight = Math.max(height * 0.105, rows.length * lineHeight + 48 * scale);
  const panelX = (width - panelWidth) / 2;
  const panelY = Math.max(height * 0.72, Math.min(height * 0.82, height * 0.93 - panelHeight));
  const panelBottom = Math.min(height * 0.94, panelY + panelHeight);

  ctx.save();
  ctx.globalAlpha = 0.985;
  ctx.shadowColor = "rgba(0,0,0,.24)";
  ctx.shadowBlur = 22 * scale;
  roundedRect(ctx, panelX, panelY, panelWidth, panelBottom - panelY, 22 * scale);
  const panel = ctx.createLinearGradient(panelX, panelY, panelX, panelBottom);
  panel.addColorStop(0, "rgba(5,19,29,.94)");
  panel.addColorStop(1, "rgba(8,27,38,.96)");
  ctx.fillStyle = panel;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255,240,183,.72)";
  ctx.lineWidth = Math.max(1.5, 1.6 * scale);
  ctx.stroke();

  const firstBaseline = panelY + (panelBottom - panelY) * 0.49 - ((rows.length - 1) * lineHeight) / 2;
  rows.forEach((row, rowIndex) => {
    const rowWidth = rowWidths[rowIndex];
    let x = width / 2 - rowWidth / 2;
    const y = firstBaseline + rowIndex * lineHeight;
    row.forEach((word) => {
      const wordWidth = ctx.measureText(word.text).width;
      const isSpoken = word.start <= time;
      const isCurrent = word === active;
      if (isSpoken) {
        if (isCurrent) {
          roundedRect(ctx, x - 6 * scale, y - fontSize * 0.68, wordWidth + 12 * scale, fontSize * 1.32, 8 * scale);
          ctx.fillStyle = "#e72b3b";
          ctx.fill();
        } else {
          roundedRect(ctx, x - 4 * scale, y - fontSize * 0.62, wordWidth + 8 * scale, fontSize * 1.22, 7 * scale);
          ctx.fillStyle = "rgba(255,255,255,.055)";
          ctx.fill();
        }
        ctx.font = "900 " + Math.round(fontSize) + "px Arial, Helvetica, sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillStyle = isCurrent ? "#ffffff" : "rgba(255,255,255,.88)";
        ctx.shadowColor = isCurrent ? "rgba(239,35,60,.55)" : "transparent";
        ctx.shadowBlur = isCurrent ? 10 * scale : 0;
        ctx.fillText(word.text, x, y);
        ctx.shadowBlur = 0;
      }
      x += wordWidth + gap;
    });
  });

  const progress = Math.max(0, Math.min(1, (time - phrase[0].start) / Math.max(0.05, phrase[phrase.length - 1].end - phrase[0].start)));
  const railX = panelX + panelWidth * 0.07;
  const railY = panelBottom - 12 * scale;
  const railW = panelWidth * 0.86;
  roundedRect(ctx, railX, railY, railW, 3.5 * scale, 2 * scale);
  ctx.fillStyle = "rgba(255,255,255,.22)";
  ctx.fill();
  roundedRect(ctx, railX, railY, railW * progress, 3.5 * scale, 2 * scale);
  ctx.fillStyle = "#f4c65e";
  ctx.fill();
  ctx.restore();
}
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
    {text:"INGREDORA ES EL JUEGO DE DESAFÍOS DIARIOS SOBRE INGREDIENTES",accent:"DESAFÍOS"},
    {text:"PARA SEGUIR JUGANDO",accent:"JUGANDO"},
    {text:"ENTRÁ A INGREDORA PUNTO COM",accent:"PUNTO"},
    {text:"O BUSCÁ EL LINK EN MI PERFIL. ¡TE ESPERO!",accent:"MI PERFIL"},
  ];
  let searchFrom=0;
  const cues=cueDefinitions.map((definition)=>{
    const tokens=definition.text.split(/\s+/).map(normalizeCaptionWord).filter(Boolean);
    let found=-1;
    for(let i=searchFrom;i<=voiceWords.length-tokens.length;i++){
      if(tokens.every((token,j)=>normalizeCaptionWord(voiceWords[i+j]?.text||"")===token)){found=i;break;}
    }
    // Keep the video renderable if a TTS provider changes punctuation or tokenization.
    // Prefer exact phrase matching; otherwise align this caption to the next spoken words
    // rather than aborting the entire production.
    if(found<0){
      const firstTokenIndex=voiceWords.findIndex((word,index)=>index>=searchFrom && normalizeCaptionWord(word.text)===tokens[0]);
      found=firstTokenIndex>=0 ? firstTokenIndex : searchFrom;
    }
    const matched=voiceWords.slice(found,Math.min(voiceWords.length,found+tokens.length));
    if(matched.length===0) throw new Error("No hay marcas de tiempo suficientes para los subtítulos.");
    searchFrom=found+tokens.length;
    return {...definition,a:matched[0].start,b:matched[matched.length-1].end,wordTimings:matched};
  });
  const cueIndex = cues.findIndex((item,index)=>{
    const nextStart=cues[index+1]?.a ?? Number.POSITIVE_INFINITY;
    const displayEnd=Math.min(item.b+.5,nextStart);
    return t>=item.a && t<displayEnd;
  });
  const cue = cueIndex>=0 ? cues[cueIndex] : undefined;
  const drawKineticCaption = (item: typeof cues[number]) => {
    const p=(t-item.a)/Math.max(.01,item.b-item.a);
    const nextStart=cues[cueIndex+1]?.a ?? Number.POSITIVE_INFINITY;
    const displayEnd=Math.min(item.b+.5,nextStart);
    const intro=ease(p/.17), outro=1-smooth((t-(displayEnd-.12))/.12);
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

  if (t>=26) {
    // High-conversion end card: strong hierarchy, a tangible URL button and a clear fallback.
    const p=ease((t-26)/.48);
    ctx.save();ctx.globalAlpha=p;
    const glow=ctx.createRadialGradient(width/2,height*.43,0,width/2,height*.43,width*.78);
    glow.addColorStop(0,"rgba(216,243,106,.22)");glow.addColorStop(.48,"rgba(216,243,106,.07)");glow.addColorStop(1,"rgba(216,243,106,0)");
    ctx.fillStyle=glow;ctx.fillRect(0,height*.13,width,height*.66);

    // A subtle spotlight panel separates the call-to-action from the supermarket scene.
    const panelW=width*.91,panelH=height*.49,panelX=(width-panelW)/2,panelY=height*.30;
    const panelGrad=ctx.createLinearGradient(panelX,panelY,panelX+panelW,panelY+panelH);
    panelGrad.addColorStop(0,"rgba(7,22,15,.84)");panelGrad.addColorStop(.5,"rgba(13,35,23,.94)");panelGrad.addColorStop(1,"rgba(5,18,12,.88)");
    rounded(panelX,panelY,panelW,panelH,height*.045);ctx.fillStyle=panelGrad;ctx.fill();
    ctx.strokeStyle="rgba(216,243,106,.58)";ctx.lineWidth=Math.max(2,width*.0025);ctx.stroke();

    // Small invitation label, then the URL as the unmistakable hero.
    ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.font="800 "+Math.round(width*.027)+"px Arial, Helvetica, sans-serif";
    ctx.fillStyle=accent;ctx.shadowColor="rgba(216,243,106,.35)";ctx.shadowBlur=width*.012;
    ctx.fillText("TU PRÓXIMA PARTIDA EMPIEZA ACÁ",width/2,height*.355,width*.82);

    const brandPulse=1+Math.sin((t-26)*3.4)*.014;
    ctx.save();ctx.translate(width/2,height*.445);ctx.scale(brandPulse,brandPulse);
    ctx.font="900 "+Math.round(width*.091)+"px Arial, Helvetica, sans-serif";
    ctx.fillStyle=white;ctx.shadowColor="rgba(216,243,106,.72)";ctx.shadowBlur=width*.045;
    ctx.fillText("INGREDORA.COM",0,0,width*.84);ctx.restore();

    // Bright button treatment with a moving sheen and a clear action verb.
    const buttonW=width*.72,buttonH=height*.092,buttonY=height*.515;
    const buttonPulse=1+Math.sin((t-26.25)*4.2)*.012;
    ctx.save();ctx.translate(width/2,buttonY+buttonH/2);ctx.scale(buttonPulse,buttonPulse);
    const bx=-buttonW/2,by=-buttonH/2;
    const buttonGrad=ctx.createLinearGradient(bx,by,bx+buttonW,by+buttonH);
    buttonGrad.addColorStop(0,"#e8ff91");buttonGrad.addColorStop(.48,"#d8f36a");buttonGrad.addColorStop(1,"#b9df45");
    rounded(bx,by,buttonW,buttonH,buttonH*.48);ctx.fillStyle=buttonGrad;ctx.shadowColor="rgba(216,243,106,.42)";ctx.shadowBlur=width*.025;ctx.fill();
    ctx.shadowBlur=0;ctx.strokeStyle="rgba(255,255,255,.7)";ctx.lineWidth=Math.max(1,width*.0015);ctx.stroke();
    ctx.fillStyle="#142116";ctx.font="900 "+Math.round(width*.043)+"px Arial, Helvetica, sans-serif";
    ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("ENTRÁ Y SEGUÍ JUGANDO  ›",0,0,buttonW*.91);
    ctx.restore();

    // The profile link is a helpful alternative, not competing with the main action.
    const secondaryIn=ease((t-28.15)/.4);
    ctx.globalAlpha=p*secondaryIn;
    const secondaryY=height*.665+(1-secondaryIn)*height*.018;
    ctx.font="700 "+Math.round(width*.027)+"px Arial, Helvetica, sans-serif";
    ctx.fillStyle="rgba(255,253,247,.94)";ctx.shadowColor="rgba(0,0,0,.55)";ctx.shadowBlur=width*.008;
    ctx.fillText("¿PREFERÍS ENTRAR DESPUÉS?",width/2,secondaryY,width*.82);
    ctx.font="800 "+Math.round(width*.031)+"px Arial, Helvetica, sans-serif";
    ctx.fillStyle=accent;ctx.shadowColor="rgba(216,243,106,.3)";ctx.shadowBlur=width*.01;
    ctx.fillText("TAMBIÉN TENÉS EL LINK EN MI PERFIL",width/2,height*.708,width*.9);

    // Animated underline sweep gives the final seconds a sense of momentum.
    const sweep=smooth((t-28.25)/1.1);
    ctx.globalAlpha=p*.9;ctx.fillStyle=accent;
    rounded(width*.2,height*.75,width*.6*sweep,height*.005,height*.003);ctx.fill();
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
  const soundtrack = await generateOriginalSoundtrack({ durationSeconds, sampleRate: 48_000, theme: pkg.visualPreset === "coca-cola-poolside" ? "summer-poolside" : undefined });
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
  renderer.toneMappingExposure = pkg.visualPreset === "coca-cola-poolside" ? 1.08 : 0.92;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

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
    quality: new Quality({ bitrate: pkg.fps >= 60 ? 8_000_000 : pkg.width >= 1000 ? 8_000_000 : 5_000_000 }),
  });
  const audioSource = new MediabunnyAudioBufferSource({
    codec: "opus",
    quality: new Quality({ bitrate: 128_000 }),
  });
  output.addVideoTrack(videoSource, { frameRate: fps });
  output.addAudioTrack(audioSource);
  output.setMetadataTags({ title: pkg.title, artist: "Ingredora Content Studio", date: new Date(pkg.createdAt) });

  const world = new THREE.Scene();
  if (pkg.visualPreset !== "nutella-supermarket" && pkg.visualPreset !== "coca-cola-poolside") {
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
  const poolsideSet = pkg.visualPreset === "coca-cola-poolside" ? createCocaColaPoolsideSet(world) : null;
  let nutellaVoiceWords: VoiceWordTiming[] = [];
  let poolsideVoiceWords: VoiceWordTiming[] = [];
  if (poolsideSet && pkg.wordTimingsUrl) {
    const timingResponse = await fetch(import.meta.env.BASE_URL + pkg.wordTimingsUrl);
    if (!timingResponse.ok) throw new Error("No se pudieron cargar los tiempos palabra por palabra de la voz de Coca-Cola.");
    const timingData = await timingResponse.json() as { words?: VoiceWordTiming[] };
    if (!Array.isArray(timingData.words) || timingData.words.length < 10) {
      throw new Error("El archivo de sincronización de la voz de Coca-Cola está vacío o incompleto.");
    }
    if (timingData.words.some((word) => !Number.isFinite(word.start) || !Number.isFinite(word.end) || word.end <= word.start)) {
      throw new Error("El archivo de subtítulos contiene marcas de tiempo inválidas.");
    }
    poolsideVoiceWords = timingData.words;
  }
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
    if (poolsideSet) {
      const time = frame / fps;
      poolsideSet.update(time);
      const ease = (value: number) => { const x = Math.max(0, Math.min(1, value)); return x * x * (3 - 2 * x); };
      let cameraX = 0.15;
      let cameraY = 2.25;
      let cameraZ = 10.8;
      let targetX = 0;
      let targetY = -0.05;
      let targetZ = -3.1;
      let fieldOfView = 43;

      if (time >= 2.35 && time < 7.2) {
        const macro = ease((time - 2.35) / 1.0);
        const pourZoom = ease((time - 3.0) / 3.3);
        cameraX = 0.12 + macro * 0.46;
        cameraY = 1.75 - macro * 0.72;
        cameraZ = 9.4 - macro * 2.25 - pourZoom * 0.35;
        targetX = 0.35 + macro * 0.26;
        targetY = -0.08 - macro * 0.36;
        targetZ = 0.72;
        fieldOfView = 43 - macro * 5.5 - pourZoom * 1.5;
      } else if (time >= 7.2 && time < 16) {
        const settle = ease((time - 7.2) / 0.55);
        cameraX = 0.58;
        cameraY = 1.03;
        cameraZ = 6.8 + settle * 0.18;
        targetX = 0.62;
        targetY = -0.42;
        targetZ = 0.86;
        fieldOfView = 37.5;
      } else if (time >= 16 && time < 29.35) {
        const revealPullback = ease((time - 16) / 2.2);
        cameraX = 0.58 * (1 - revealPullback);
        cameraY = 1.03 + revealPullback * 0.74;
        cameraZ = 7.0 + revealPullback * 2.2;
        targetX = 0.25 * (1 - revealPullback);
        targetY = -0.42 + revealPullback * 0.08;
        targetZ = 0.35 - revealPullback * 2.0;
        fieldOfView = 37.5 + revealPullback * 3.5;
      } else if (time >= 29.35) {
        const endMove = ease((time - 29.35) / 0.85);
        cameraX = 0;
        cameraY = 1.77 + endMove * 0.18;
        cameraZ = 9.2 + endMove * 0.55;
        targetX = 0;
        targetY = -0.12;
        targetZ = -1.7;
        fieldOfView = 41;
      }

      camera.position.set(cameraX, cameraY, cameraZ);
      camera.lookAt(targetX, targetY, targetZ);
      camera.fov = fieldOfView;
      camera.updateProjectionMatrix();
      renderer.render(world, camera);
      ctx.drawImage(renderer.domElement, 0, 0, pkg.width, pkg.height);
      drawCocaColaPoolsideOverlay(ctx, time, pkg.width, pkg.height);
      drawPoolsideVoiceCaption(ctx, time, pkg.width, pkg.height, poolsideVoiceWords);
      return;
    }
    if (nutellaSet) {
      const time = frame / fps;
       // 33-second storyboard: product reveal, memory challenge and sustained website end card.
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
