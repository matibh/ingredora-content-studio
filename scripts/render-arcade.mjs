import { chromium } from "playwright";
const browser=await chromium.launch({headless:true,args:["--no-sandbox","--disable-dev-shm-usage","--enable-webgl","--ignore-gpu-blocklist","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--disable-features=VizDisplayCompositor"]});
try{
 const context=await browser.newContext({acceptDownloads:true}),page=await context.newPage();
 page.on("console",m=>{if(m.text().startsWith("PROGRESS ")||m.type()==="error")console.log("[browser]",m.text());});
 page.on("pageerror",e=>console.error("[pageerror]",e.stack||e.message));
 page.on("response",r=>{if(r.status()>=400)console.error("[http]",r.status(),r.url());});
 page.on("requestfailed",r=>console.error("[requestfailed]",r.url(),r.failure()?.errorText));
 const downloadPromise=page.waitForEvent("download",{timeout:90*60*1000}).then(download=>({download})).catch(error=>({error}));
 await page.goto("http://127.0.0.1:4173/ingredora-content-studio/render-arcade.html",{waitUntil:"networkidle",timeout:120000});
 await page.waitForFunction(()=>document.title==="RENDER COMPLETADO"||document.title==="ERROR DE RENDER",undefined,{timeout:90*60*1000});
 if(await page.title()==="ERROR DE RENDER")throw new Error(await page.locator("#status").innerText());
 const result=await downloadPromise;if(result.error)throw new Error("No se recibió el WebM: "+result.error.message);
 const path=await result.download.path();if(!path)throw new Error("El navegador no entregó el archivo.");
 await result.download.saveAs("/tmp/ingredora-entre-partidas-de-ingredora-a-chef.webm");console.log("RENDER_FILE=/tmp/ingredora-entre-partidas-de-ingredora-a-chef.webm");
}finally{if(browser.isConnected())await browser.close();}
