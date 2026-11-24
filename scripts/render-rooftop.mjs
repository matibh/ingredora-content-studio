import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage", "--enable-webgl", "--ignore-gpu-blocklist", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--disable-features=VizDisplayCompositor"] });
try {
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();
  page.on("console", message => { if (message.text().startsWith("PROGRESS ") || message.type() === "error") console.log("[browser]", message.text()); });
  page.on("pageerror", error => console.error("[pageerror]", error.stack || error.message));
  page.on("response", response => { if (response.status() >= 400) console.error("[http]", response.status(), response.url()); });
  page.on("requestfailed", request => console.error("[requestfailed]", request.url(), request.failure()?.errorText));
  const downloadPromise = page.waitForEvent("download", { timeout: 90 * 60 * 1000 }).then(download => ({ download })).catch(error => ({ error }));
  await page.goto("http://127.0.0.1:4173/ingredora-content-studio/render-rooftop.html", { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForFunction(() => document.title === "RENDER COMPLETADO" || document.title === "ERROR DE RENDER", undefined, { timeout: 90 * 60 * 1000 });
  if (await page.title() === "ERROR DE RENDER") throw new Error(await page.locator("#status").innerText());
  const result = await downloadPromise;
  if (result.error) throw new Error("No se recibió el WebM: " + result.error.message);
  const path = await result.download.path();
  if (!path) throw new Error("El navegador no entregó el archivo.");
  await result.download.saveAs("/tmp/ingredora-entre-partidas-la-alumna.webm");
  console.log("RENDER_FILE=/tmp/ingredora-entre-partidas-la-alumna.webm");
} finally {
  if (browser.isConnected()) await browser.close();
}
