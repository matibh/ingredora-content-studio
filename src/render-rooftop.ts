import { renderEntrePartidasRooftopToWebM } from "./engine/entrePartidasRooftop";
const status = document.querySelector<HTMLElement>("#status")!;
const progress = document.querySelector<HTMLProgressElement>("#progress")!;
try {
  const base = "/ingredora-content-studio/";
  const response = await fetch(base + "studio/packages/entre-partidas-rooftop.v1.json?nocache=" + Date.now(), { cache: "no-store" });
  if (!response.ok) throw new Error("No se pudo cargar el paquete de la terraza: " + response.status);
  const pkg = await response.json();
  let last = -1;
  const blob = await renderEntrePartidasRooftopToWebM(pkg, p => {
    progress.value = p.percent;
    status.textContent = "Renderizando capítulo 8 · fotograma " + p.frame + " / " + p.totalFrames + " (" + p.percent + "%)";
    if (p.percent >= last + 5) { last = p.percent; console.log("PROGRESS " + p.percent + "% (" + p.frame + "/" + p.totalFrames + ")"); }
  });
  if (!blob.size) throw new Error("El renderer devolvió un video vacío.");
  const url = URL.createObjectURL(blob), anchor = document.createElement("a");
  anchor.href = url; anchor.download = "ingredora-entre-partidas-la-alumna.webm";
  document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 120000);
  status.textContent = "RENDER COMPLETADO"; document.title = "RENDER COMPLETADO";
} catch (error) {
  status.textContent = "ERROR: " + (error instanceof Error ? error.stack || error.message : String(error));
  document.title = "ERROR DE RENDER";
}
