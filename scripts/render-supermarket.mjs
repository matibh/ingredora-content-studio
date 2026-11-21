import { chromium } from "playwright";
const browser=await chromium.launch({headless:true,args:["--no-sandbox","--disable-dev-shm-usage","--enable-webgl","--ignore-gpu-blocklist","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
try {
 const context=await browser.newContext({acceptDownloads:true});
 const page=await context.newPage();
 page.on("console",m=>console.log("[browser]",m.type(),m.text()));
 page.on("pageerror",e=>console.error("[pageerror]",e.message));
 await page.goto("http://127.0.0.1:4173/render-supermarket.html",{waitUntil:"networkidle",timeout:120000});
 const downloadPromise=page.waitForEvent("download",{timeout:60*60*1000});
 const download=await downloadPromise;
 const path=await download.path();
 if(!path) throw new Error("El navegador no entregó el archivo renderizado.");
 await download.saveAs("/tmp/ingredora-entre-partidas-supermercado.webm");
 await page.waitForFunction(()=>document.title==="RENDER COMPLETADO",{timeout:30000}).catch(()=>{});
 console.log("RENDER_FILE=/tmp/ingredora-entre-partidas-supermercado.webm");
} finally { await browser.close(); }