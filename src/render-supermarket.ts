import { renderPackageToWebM } from "./engine/renderer";
const status = document.querySelector<HTMLElement>("#status")!;
const progress = document.querySelector<HTMLProgressElement>("#progress")!;
try {
  const response = await fetch("/ingredora-content-studio/studio/packages/entre-partidas-supermarket.v1.json", { cache: "no-store" });
  if (!response.ok) throw new Error("No se pudo cargar el guion: " + response.status);
  const pkg = await response.json();
  let lastLogged = -1;
  const blob = await renderPackageToWebM(pkg, (p) => {
    progress.value = p.percent;
    status.textContent = "Renderizando fotograma " + p.frame + " / " + p.totalFrames + " (" + p.percent + "%)";
    if (p.percent >= lastLogged + 5) {
      lastLogged = p.percent;
      console.log("PROGRESS " + p.percent + "% (" + p.frame + "/" + p.totalFrames + ")");
    }
  });
  status.textContent = "Render terminado. Preparando descarga…";
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "ingredora-entre-partidas-supermercado.webm";
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 120000);
  status.textContent = "RENDER COMPLETADO";
  document.title = "RENDER COMPLETADO";
} catch (error) {
  status.textContent = "ERROR: " + (error instanceof Error ? error.stack || error.message : String(error));
  document.title = "ERROR DE RENDER";
}
