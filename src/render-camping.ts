import { renderEntrePartidasCampingToWebM } from "./engine/entrePartidasCamping";
const status=document.querySelector<HTMLElement>("#status")!,progress=document.querySelector<HTMLProgressElement>("#progress")!;
try{
 const base="/ingredora-content-studio/";
 const response=await fetch(base+"studio/packages/entre-partidas-camping.v1.json?nocache="+Date.now(),{cache:"no-store"});
 if(!response.ok)throw new Error("No se pudo cargar el paquete del capítulo 7: "+response.status);
 const pkg=await response.json();let last=-1;
 const blob=await renderEntrePartidasCampingToWebM(pkg,p=>{progress.value=p.percent;status.textContent="Renderizando capítulo 7 · fotograma "+p.frame+" / "+p.totalFrames+" ("+p.percent+"%)";if(p.percent>=last+5){last=p.percent;console.log("PROGRESS "+p.percent+"% ("+p.frame+"/"+p.totalFrames+")");}});
 if(!blob.size)throw new Error("El renderer devolvió un video vacío.");
 const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="ingredora-entre-partidas-sin-senal.webm";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),120000);
 status.textContent="RENDER COMPLETADO";document.title="RENDER COMPLETADO";
}catch(error){status.textContent="ERROR: "+(error instanceof Error?error.stack||error.message:String(error));document.title="ERROR DE RENDER";}
