import { chromium } from "playwright";

const browser = await chromium.launch({
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--enable-webgl",
    "--ignore-gpu-blocklist",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--disable-features=VizDisplayCompositor",
  ],
});

browser.on("disconnected", () => console.error("[browser] Chromium disconnected"));
try {
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();
  page.on("console", (message) => {
    const value = message.text();
    if (value.startsWith("PROGRESS ") || message.type() === "error") console.log("[browser]", value);
  });
  page.on("pageerror", (error) => console.error("[pageerror]", error.stack || error.message));
  page.on("crash", () => console.error("[page] Chromium renderer process crashed"));
  page.on("close", () => console.error("[page] Page closed"));
  page.on("response", (response) => {
    if (response.status() >= 400) console.error("[http]", response.status(), response.url());
  });
  page.on("requestfailed", (request) =>
    console.error("[requestfailed]", request.url(), request.failure()?.errorText),
  );

  // Attach a rejection handler immediately: a browser crash must not mask the
  // actual page/render error as an unrelated unhandled download-event rejection.
  const downloadPromise = page.waitForEvent("download", { timeout: 90 * 60 * 1000 })
    .then((download) => ({ download }))
    .catch((error) => ({ error }));

  await page.goto(
    "http://127.0.0.1:4173/ingredora-content-studio/render-supermarket.html",
    { waitUntil: "networkidle", timeout: 120000 },
  );

  try {
    await page.waitForFunction(
      () => document.title === "RENDER COMPLETADO" || document.title === "ERROR DE RENDER",
      undefined,
      { timeout: 90 * 60 * 1000 },
    );
  } catch (error) {
    const details = await page.locator("#status").innerText().catch(() => "La pestaña dejó de estar disponible.");
    throw new Error("El render no llegó a un estado final: " + details + " | " + (error instanceof Error ? error.message : String(error)));
  }

  if (await page.title() === "ERROR DE RENDER") {
    throw new Error(await page.locator("#status").innerText());
  }

  const result = await downloadPromise;
  if (result.error) throw new Error("No se recibió el WebM: " + result.error.message);
  const path = await result.download.path();
  if (!path) throw new Error("El navegador no entregó el archivo renderizado.");
  await result.download.saveAs("/tmp/ingredora-entre-partidas-supermercado.webm");
  console.log("RENDER_FILE=/tmp/ingredora-entre-partidas-supermercado.webm");
} finally {
  if (browser.isConnected()) await browser.close();
}
