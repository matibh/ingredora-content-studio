import { chromium } from "playwright";
const browser=await chromium.launch({headless:true,args:["--no-sandbox","--disable-dev-shm-usage","--enable-webgl","--ignore-gpu-blocklist","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
try {
 const context=await browser.newContext({acceptDownloads:true});
 const page=await context.newPage();
 page.on("console",m=>{const msg=m.text();if(msg.startsWith("PROGRESS ")||m.type()==="error")console.log("[browser]",msg);});
 page.on("pageerror",e=>console.error("[pageerror]",e.message));
 page.on("response",r=>{if(r.status()>=400)console.error("[http]",r.status(),r.url());});
 page.on("requestfailed",r=>console.error("[requestfailed]",r.url(),r.failure()?.errorText));
 const downloadPromise=page.waitForEvent("download",{timeout:90*60*1000});
 await page.goto("http://127.0.0.1:4173/ingredora-content-studio/render-supermarket.html",{waitUntil:"networkidle",timeout:120000});
 await page.waitForFunction(()=>document.title==="RENDER COMPLETADO"||document.title==="ERROR DE RENDER",{timeout:90*60*1000});
 if(await page.title()==="ERROR DE RENDER") throw new Error(await page.locator("#status").innerText());
 const download=await downloadPromise;
 const path=await download.path();
 if(!path) throw new Error("El navegador no entregó el archivo renderizado.");
 await download.saveAs("/tmp/ingredora-entre-partidas-supermercado.webm");
 console.log("RENDER_FILE=/tmp/ingredora-entre-partidas-supermercado.webm");
} finally { await browser.close(); }
