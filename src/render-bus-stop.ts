import { renderEntrePartidasBusStopToWebM } from "./engine/entrePartidasBusStop";
const status = document.querySelector<HTMLElement>("#status")!;
const progress = document.querySelector<HTMLProgressElement>("#progress")!;
try {
  const response = await fetch("/ingredora-content-studio/studio/packages/entre-partidas-bus-stop.v1.json?nocache=" + Date.now(), { cache: "no-store" });
  if (!response.ok) throw new Error("No se pudo cargar el paquete del capítulo 9: " + response.status);
  const pkg = await response.json();
  let last = -1;
  const blob = await renderEntrePartidasBusStopToWebM(pkg, p => {
    progress.value = p.percent;
    status.textContent = "Renderizando La parada · fotograma " + p.frame + " / " + p.totalFrames + " (" + p.percent + "%)";
    if (p.percent >= last + 5) { last = p.percent; console.log("PROGRESS " + p.percent + "% (" + p.frame + "/" + p.totalFrames + ")"); }
  });
  if (!blob.size) throw new Error("El renderer devolvió un video vacío.");
  const url = URL.createObjectURL(blob), a = document.createElement("a");
  a.href = url; a.download = "ingredora-entre-partidas-la-parada.webm"; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 120000);
  status.textContent = "RENDER COMPLETADO"; document.title = "RENDER COMPLETADO";
} catch (error) {
  status.textContent = "ERROR: " + (error instanceof Error ? error.stack || error.message : String(error));
  document.title = "ERROR DE RENDER";
}
