import { useEffect, useState, type FormEvent } from "react";

type Status = "Borrador" | "En preparación" | "En revisión" | "Aprobada";
type Scene = {
  id: number; title: string; seconds: number; purpose: string; visual: string;
  camera: string; screenText: string; voiceover: string; audio: string; transition: string;
};
type Campaign = {
  id: number; name: string; format: string; updated: string; objective: string;
  product: string; audience: string; language: string; platform: string;
  duration: string; concept: string; callToAction: string; status: Status;
  scenes?: Scene[];
};
type SectionId = "home" | "campaigns" | "products" | "product-studio" | "characters" | "scenes" | "editor" | "library" | "distribution" | "analytics";
const STORAGE_KEY = "ingredora-content-studio:campaigns:v1";

function readCampaigns(): Campaign[] {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (!value) return [];
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as Campaign[] : [];
  } catch { return []; }
}

const groups: { label: string; items: { id: SectionId; label: string; icon: string }[] }[] = [
  { label: "WORKSPACE", items: [{id:"home",label:"Inicio",icon:"⌂"},{id:"campaigns",label:"Campañas",icon:"▤"},{id:"products",label:"Product Library",icon:"◈"}] },
  { label: "PRODUCCIÓN", items: [{id:"product-studio",label:"Product Studio",icon:"⬡"},{id:"characters",label:"Personajes",icon:"♙"},{id:"scenes",label:"Scene Engine",icon:"▧"},{id:"editor",label:"Editor y render",icon:"▷"}] },
  { label: "PUBLICACIÓN", items: [{id:"library",label:"Entregables",icon:"▣"},{id:"distribution",label:"Redes sociales",icon:"↗"},{id:"analytics",label:"Analítica",icon:"⌁"}] },
];
const copy: Record<SectionId,{eyebrow:string;title:string;description:string}> = {
  home:{eyebrow:"TU ESPACIO CREATIVO",title:"Todo empieza con una buena idea.",description:"Planificá, producí y organizá el contenido de Ingredora desde un solo lugar."},
  campaigns:{eyebrow:"WORKSPACE",title:"Campañas",description:"Organizá cada producción desde el brief hasta el video final."},
  products:{eyebrow:"CATÁLOGO",title:"Product Library",description:"Productos, marcas, referencias visuales y permisos en un catálogo reutilizable."},
  "product-studio":{eyebrow:"CREACIÓN 3D",title:"Product Studio",description:"Construí y personalizá packaging 3D para tus producciones."},
  characters:{eyebrow:"ELENCO",title:"Personajes",description:"Personajes estilizados, expresiones y acciones reutilizables."},
  scenes:{eyebrow:"DIRECCIÓN AUDIOVISUAL",title:"Scene Engine",description:"Escenarios, cámaras, iluminación y movimiento narrativo."},
  editor:{eyebrow:"POSTPRODUCCIÓN",title:"Editor y render",description:"Componé escenas, ajustá el timeline y prepará tus entregables."},
  library:{eyebrow:"ARCHIVO",title:"Entregables",description:"Tus previews y videos finales, organizados por campaña y versión."},
  distribution:{eyebrow:"DISTRIBUCIÓN",title:"Redes sociales",description:"Prepará copies y adaptaciones para cada canal. La publicación siempre requiere tu aprobación."},
  analytics:{eyebrow:"RESULTADOS",title:"Analítica",description:"Medí el recorrido desde el contenido hasta las partidas reales de Ingredora."},
};

function App() {
  const [section,setSection] = useState<SectionId>("home");
  const [campaigns,setCampaigns] = useState<Campaign[]>(readCampaigns);
  const [selectedId,setSelectedId] = useState<number|null>(null);
  const [modal,setModal] = useState(false);
  const [name,setName] = useState("");
  const [format,setFormat] = useState("Video vertical · 9:16");
  const [objective,setObjective] = useState("Atraer jugadores nuevos");
  const [language,setLanguage] = useState("Español");
  const [platform,setPlatform] = useState("TikTok");
  const selected = campaigns.find((item)=>item.id===selectedId) ?? null;

  useEffect(()=>{ try { localStorage.setItem(STORAGE_KEY,JSON.stringify(campaigns)); } catch { /* Local storage unavailable or full. */ } },[campaigns]);

  function createCampaign(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean = name.trim();
    if (!clean) return;
    const id = Date.now();
    const item:Campaign = {id,name:clean,format,updated:new Date().toLocaleDateString("es-AR"),objective,product:"",audience:"Personas interesadas en juegos de cultura gastronómica",language,platform,duration:"15–30 segundos",concept:"",callToAction:"Jugá gratis en Ingredora",status:"Borrador"};
    setCampaigns((items)=>[item,...items]);
    setName(""); setFormat("Video vertical · 9:16"); setObjective("Atraer jugadores nuevos"); setLanguage("Español"); setPlatform("TikTok");
    setModal(false); setSelectedId(id); setSection("campaigns");
  }

  function patch(id:number,changes:Partial<Campaign>) {
    setCampaigns((items)=>items.map((item)=>item.id===id?{...item,...changes,updated:"Editada"}:item));
  }

  function addScene(campaign:Campaign) {
    const next:Scene={id:Date.now(),title:"Nueva escena",seconds:5,purpose:"",visual:"",camera:"Plano medio",screenText:"",voiceover:"",audio:"",transition:"Corte"};
    patch(campaign.id,{scenes:[...(campaign.scenes??[]),next]});
  }
  function patchScene(campaign:Campaign,sceneId:number,changes:Partial<Scene>) {
    patch(campaign.id,{scenes:(campaign.scenes??[]).map((scene)=>scene.id===sceneId?{...scene,...changes}:scene)});
  }
  function removeScene(campaign:Campaign,sceneId:number) {
    patch(campaign.id,{scenes:(campaign.scenes??[]).filter((scene)=>scene.id!==sceneId)});
  }
  function moveScene(campaign:Campaign,index:number,direction:-1|1) {
    const scenes=[...(campaign.scenes??[])],target=index+direction;
    if(target<0||target>=scenes.length)return;
    [scenes[index],scenes[target]]=[scenes[target],scenes[index]];
    patch(campaign.id,{scenes});
  }

  const page = copy[section];
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand-lockup"><div className="brand-mark"><span>i</span><i/></div><div className="brand-name"><strong>ingredora</strong><span>CONTENT STUDIO</span></div></div>
      <div className="workspace-switcher"><div className="workspace-avatar">I</div><div className="workspace-info"><strong>Ingredora</strong><span>Workspace principal</span></div><span className="switch-chevron">⌄</span></div>
      <nav className="side-nav" aria-label="Navegación principal">{groups.map((group)=><div className="nav-group" key={group.label}><p className="nav-heading">{group.label}</p>{group.items.map((item)=><button className={"nav-link "+(section===item.id?"active":"")} key={item.id} onClick={()=>{setSection(item.id);setSelectedId(null);}} type="button"><span className="nav-icon">{item.icon}</span><span>{item.label}</span>{item.id==="editor"&&<span className="nav-soon">BETA</span>}</button>)}</div>)}</nav>
      <div className="sidebar-bottom"><div className="storage-card"><div className="storage-top"><span className="storage-dot"/> <span>Modo de trabajo</span></div><strong>Presupuesto cero</strong><p>Sin servicios pagos ni procesos externos automáticos.</p></div><div className="profile-button"><div className="profile-avatar">M</div><div><strong>Mi espacio</strong><span>Administrador</span></div></div></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div className="breadcrumbs"><span>Ingredora</span><b>/</b><strong>{selected&&section==="campaigns"?selected.name:page.title}</strong></div><div className="topbar-actions"><span className="system-status"><i/> Sistema en preparación</span><span className="top-avatar">M</span></div></header>
      <div className="page-content">
        <section className="welcome-row"><div><p className="eyebrow">{page.eyebrow}</p><h1>{selected&&section==="campaigns"?selected.name:page.title}</h1><p className="page-description">{selected&&section==="campaigns"?"Ficha de producción · Brief creativo editable":page.description}</p></div><button className="primary-button" onClick={()=>setModal(true)} type="button"><span>＋</span> Nueva producción</button></section>
        {section==="home"&&<>
          <section className="hero-panel"><div className="hero-copy"><div className="hero-pill"><span/> CREATIVE WORKSPACE</div><h2>De la idea<br/>a la <em>pantalla.</em></h2><p>Un estudio audiovisual para transformar productos reales en historias que dan ganas de jugar.</p><button className="hero-button" onClick={()=>setModal(true)} type="button">Crear primera producción <span>↗</span></button><div className="hero-footnote"><span>01</span> IMAGINAR <i/><span>02</span> PRODUCIR <i/><span>03</span> COMPARTIR</div></div><div className="hero-art" aria-hidden="true"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="art-spark spark-one">✳</div><div className="art-spark spark-two">✦</div><div className="product-shadow"/><div className="product-pack"><div className="pack-top"/><div className="pack-label"><span className="pack-small">INGREDIENT SPOTLIGHT</span><strong>REAL<br/>FOOD.</strong><span className="pack-line"/><span className="pack-caption">REAL STORIES</span></div><div className="pack-side"/></div><div className="art-caption"><span>3D PRODUCT STUDIO</span><b>01 / 06</b></div></div></section>
          <section className="section-heading"><div><p className="eyebrow">OVERVIEW</p><h2>Tu estudio, de un vistazo</h2></div><span className="muted-note">Datos de tus producciones guardadas en este navegador.</span></section>
          <section className="stats-grid"><article className="stat-card"><div className="stat-icon lavender">▤</div><span>Campañas</span><strong>{campaigns.length.toString().padStart(2,"0")}</strong><small>Producciones guardadas localmente</small></article><article className="stat-card"><div className="stat-icon mint">◈</div><span>Productos</span><strong>—</strong><small>Catálogo todavía vacío</small></article><article className="stat-card"><div className="stat-icon peach">▷</div><span>Videos finales</span><strong>—</strong><small>Sin renders todavía</small></article><article className="stat-card"><div className="stat-icon sky">↗</div><span>Publicaciones</span><strong>—</strong><small>Distribución aún no conectada</small></article></section>
          <section className="bottom-grid"><div className="content-card"><div className="card-heading"><div><p className="eyebrow">EN PROGRESO</p><h3>Producciones recientes</h3></div><button className="text-button" onClick={()=>setSection("campaigns")} type="button">Ver todas →</button></div>{campaigns.length===0?<div className="empty-state"><div className="empty-illustration"><span>✳</span><i>＋</i></div><strong>Tu próxima historia empieza acá</strong><p>Creá una producción para organizar el brief, las escenas y los recursos.</p><button className="secondary-button" onClick={()=>setModal(true)} type="button">Crear producción</button></div>:<div className="project-list">{campaigns.slice(0,3).map((item)=><button className="project-row" key={item.id} onClick={()=>{setSelectedId(item.id);setSection("campaigns");}} type="button"><span className="project-thumb">✳</span><span className="project-details"><strong>{item.name}</strong><small>{item.format} · {item.platform}</small></span><span className="project-status">{item.status}</span><span className="row-arrow">→</span></button>)}</div>}</div>
          <div className="content-card workflow-card"><p className="eyebrow">FLUJO DE TRABAJO</p><h3>Un proceso, muchas posibilidades.</h3><div className="workflow-list"><div><span className="workflow-number">01</span><span className="workflow-icon">✎</span><p><strong>Idea y brief</strong><small>Definí qué historia queremos contar.</small></p></div><div><span className="workflow-number">02</span><span className="workflow-icon">◇</span><p><strong>Escenas y recursos</strong><small>Productos, personajes y dirección 3D.</small></p></div><div><span className="workflow-number">03</span><span className="workflow-icon">▷</span><p><strong>Render y entrega</strong><small>Previsualizá, aprobá y guardá.</small></p></div></div></div></section>
        </>}
        {section==="campaigns"&&!selected&&<section className="content-card campaigns-view"><div className="card-heading"><div><p className="eyebrow">WORKSPACE</p><h3>Tus producciones</h3></div><button className="secondary-button" onClick={()=>setModal(true)} type="button">＋ Nueva producción</button></div>{campaigns.length===0?<div className="empty-state"><div className="empty-illustration"><span>✳</span><i>＋</i></div><strong>Todavía no hay producciones</strong><p>Creá la primera para empezar a organizar el contenido de Ingredora.</p><button className="primary-button" onClick={()=>setModal(true)} type="button">Crear primera producción</button></div>:<div className="project-list">{campaigns.map((item)=><button className="project-row" key={item.id} onClick={()=>setSelectedId(item.id)} type="button"><span className="project-thumb">✳</span><span className="project-details"><strong>{item.name}</strong><small>{item.format} · {item.platform} · {item.updated}</small></span><span className="project-status">{item.status}</span><span className="row-arrow">→</span></button>)}</div>}</section>}
        {section==="campaigns"&&selected&&<section className="campaign-detail"><div className="detail-toolbar"><button className="back-button" onClick={()=>setSelectedId(null)} type="button">← Todas las producciones</button><span className="project-status">{selected.status}</span></div><div className="detail-grid"><section className="content-card brief-card"><div className="card-heading"><div><p className="eyebrow">01 / ESTRATEGIA</p><h3>Brief creativo</h3></div><span className="autosave-label"><i/> Guardado automáticamente</span></div><div className="brief-fields">
          <label>Nombre de la producción<input value={selected.name} onChange={(e)=>patch(selected.id,{name:e.target.value})}/></label>
          <label>Objetivo<select value={selected.objective} onChange={(e)=>patch(selected.id,{objective:e.target.value})}><option>Atraer jugadores nuevos</option><option>Generar partidas</option><option>Fomentar recurrencia</option><option>Presentar un producto</option><option>Crear comunidad</option><option>Explicar cómo jugar</option></select></label>
          <label>Producto o marca<input value={selected.product} placeholder="Ej. Yerba mate (referencia por verificar)" onChange={(e)=>patch(selected.id,{product:e.target.value})}/></label>
          <label>Audiencia<input value={selected.audience} onChange={(e)=>patch(selected.id,{audience:e.target.value})}/></label>
          <div className="brief-two-col"><label>Idioma<select value={selected.language} onChange={(e)=>patch(selected.id,{language:e.target.value})}><option>Español</option><option>Inglés</option><option>Español + inglés</option></select></label><label>Plataforma<select value={selected.platform} onChange={(e)=>patch(selected.id,{platform:e.target.value})}><option>TikTok</option><option>Instagram Reels</option><option>YouTube Shorts</option><option>Multiplataforma</option></select></label></div>
          <div className="brief-two-col"><label>Formato<select value={selected.format} onChange={(e)=>patch(selected.id,{format:e.target.value})}><option>Video vertical · 9:16</option><option>Video cuadrado · 1:1</option><option>Video horizontal · 16:9</option></select></label><label>Duración objetivo<select value={selected.duration} onChange={(e)=>patch(selected.id,{duration:e.target.value})}><option>Hasta 15 segundos</option><option>15–30 segundos</option><option>30–45 segundos</option><option>45–60 segundos</option></select></label></div>
          <label>Concepto / idea central<textarea rows={5} value={selected.concept} placeholder="¿Qué sucede en el video? ¿Cuál es el hook? ¿Qué queremos que haga la audiencia?" onChange={(e)=>patch(selected.id,{concept:e.target.value})}/></label>
          <label>Call to action<input value={selected.callToAction} onChange={(e)=>patch(selected.id,{callToAction:e.target.value})}/></label>
          <label>Estado<select value={selected.status} onChange={(e)=>patch(selected.id,{status:e.target.value as Status})}><option>Borrador</option><option>En preparación</option><option>En revisión</option><option>Aprobada</option></select></label>
        </div></section><section className="content-card storyboard-card"><div className="card-heading"><div><p className="eyebrow">02 / NARRATIVA</p><h3>Guion y storyboard</h3><p className="storyboard-intro">Diseñá cada momento antes de pasar a la producción audiovisual.</p></div><button className="primary-button" type="button" onClick={()=>addScene(selected)}>＋ Agregar escena</button></div><div className="storyboard-summary"><div><strong>{(selected.scenes??[]).length.toString().padStart(2,"0")}</strong><span>Escenas</span></div><div><strong>{(selected.scenes??[]).reduce((sum,scene)=>sum+Math.max(0,Number(scene.seconds)||0),0)}s</strong><span>Duración total</span></div><div><strong>{selected.duration}</strong><span>Objetivo de campaña</span></div></div>{(selected.scenes??[]).length===0?<div className="storyboard-empty"><span>✳</span><strong>La historia todavía no tiene escenas.</strong><p>Agregá la primera escena y empezá por el hook: ¿qué ve la audiencia en los primeros segundos?</p><button className="secondary-button" type="button" onClick={()=>addScene(selected)}>Crear primera escena</button></div>:<div className="scene-list">{(selected.scenes??[]).map((scene,index)=><article className="scene-card" key={scene.id}><div className="scene-card-top"><div className="scene-index">ESCENA {String(index+1).padStart(2,"0")}</div><div className="scene-controls"><span>{scene.seconds}s</span><button type="button" aria-label="Mover escena arriba" disabled={index===0} onClick={()=>moveScene(selected,index,-1)}>↑</button><button type="button" aria-label="Mover escena abajo" disabled={index===(selected.scenes??[]).length-1} onClick={()=>moveScene(selected,index,1)}>↓</button><button type="button" aria-label="Eliminar escena" onClick={()=>removeScene(selected,scene.id)}>×</button></div></div><div className="scene-fields"><label>Título<input value={scene.title} maxLength={80} onChange={(e)=>patchScene(selected,scene.id,{title:e.target.value})}/></label><label>Duración (segundos)<input type="number" min="1" max="120" value={scene.seconds} onChange={(e)=>patchScene(selected,scene.id,{seconds:Math.max(1,Math.min(120,Number(e.target.value)||1))})}/></label><label>Objetivo narrativo<input value={scene.purpose} placeholder="Ej. Generar curiosidad" onChange={(e)=>patchScene(selected,scene.id,{purpose:e.target.value})}/></label><label>Acción / descripción visual<textarea rows={3} value={scene.visual} placeholder="Qué aparece, qué sucede y cómo interactúa el producto..." onChange={(e)=>patchScene(selected,scene.id,{visual:e.target.value})}/></label><label>Cámara<select value={scene.camera} onChange={(e)=>patchScene(selected,scene.id,{camera:e.target.value})}><option>Plano medio</option><option>Plano general</option><option>Primer plano</option><option>Macro de producto</option><option>Travelling / seguimiento</option><option>Órbita 3D</option><option>Picado</option><option>Contrapicado</option><option>Cámara fija</option></select></label><label>Texto en pantalla<input value={scene.screenText} placeholder="Titular o subtítulo" onChange={(e)=>patchScene(selected,scene.id,{screenText:e.target.value})}/></label><label>Locución / voz<textarea rows={2} value={scene.voiceover} placeholder="Texto hablado (opcional)" onChange={(e)=>patchScene(selected,scene.id,{voiceover:e.target.value})}/></label><label>Audio / SFX<input value={scene.audio} placeholder="Música, ambiente o efecto" onChange={(e)=>patchScene(selected,scene.id,{audio:e.target.value})}/></label><label>Transición<select value={scene.transition} onChange={(e)=>patchScene(selected,scene.id,{transition:e.target.value})}><option>Corte</option><option>Fundido</option><option>Desplazamiento</option><option>Zoom</option><option>Match cut</option></select></label></div></article>)}</div>}<p className="storyboard-footnote">Storyboard editable guardado en este navegador. Todavía no genera video ni sincroniza datos con la nube.</p></section><aside className="content-card production-next"><p className="eyebrow">02 / PRÓXIMOS PASOS</p><h3>Construí la historia.</h3><p>El brief define la intención y el storyboard organiza la narrativa escena por escena. El próximo paso será conectar estas escenas con el motor visual.</p><div className="next-step-list"><div><span>01</span><p><strong>Brief creativo</strong><small>Disponible ahora</small></p><b>✓</b></div><div><span>02</span><p><strong>Guion y storyboard</strong><small>Disponible ahora</small></p><b>✓</b></div><div><span>03</span><p><strong>Producción audiovisual</strong><small>Product Studio + Scene Engine</small></p><b>—</b></div><div><span>04</span><p><strong>Render y distribución</strong><small>Editor + Quality Gate</small></p><b>—</b></div></div><div className="detail-note">Los cambios se guardan automáticamente en este navegador. Todavía no existe sincronización en la nube.</div></aside></div></section>}
        {section!=="home"&&section!=="campaigns"&&<section className="module-placeholder"><div className="placeholder-icon">{groups.flatMap((g)=>g.items).find((item)=>item.id===section)?.icon}</div><p className="eyebrow">MÓDULO PREPARADO</p><h2>Estamos construyendo este espacio.</h2><p>La sección ya forma parte de la estructura de Ingredora Content Studio. Su funcionalidad se incorporará por etapas, manteniendo el flujo de trabajo y el presupuesto cero.</p><button className="secondary-button" onClick={()=>setSection("home")} type="button">Volver al inicio</button></section>}
        <footer className="page-footer"><span>INGREDORA CONTENT STUDIO</span><span>CREAR CON INTENCIÓN · PRODUCIR CON LIBERTAD</span><span>v0.2.0</span></footer>
      </div>
    </main>
    {modal&&<div className="modal-backdrop" role="presentation" onMouseDown={(e)=>{if(e.target===e.currentTarget)setModal(false);}}><form className="create-modal" onSubmit={createCampaign}><button className="modal-close" type="button" onClick={()=>setModal(false)} aria-label="Cerrar">×</button><p className="eyebrow">NUEVA PRODUCCIÓN</p><h2>Empecemos por la idea.</h2><p className="modal-description">Creá un espacio para organizar tu próxima pieza de contenido.</p><label htmlFor="campaign-name">Nombre de la producción</label><input id="campaign-name" autoFocus maxLength={80} onChange={(e)=>setName(e.target.value)} placeholder="Ej. Yerba mate — Ingredient spotlight" required value={name}/><label>Formato inicial<select value={format} onChange={(e)=>setFormat(e.target.value)}><option>Video vertical · 9:16</option><option>Video cuadrado · 1:1</option><option>Video horizontal · 16:9</option></select></label><label>Objetivo principal<select value={objective} onChange={(e)=>setObjective(e.target.value)}><option>Atraer jugadores nuevos</option><option>Generar partidas</option><option>Fomentar recurrencia</option><option>Presentar un producto</option><option>Crear comunidad</option><option>Explicar cómo jugar</option></select></label><div className="brief-two-col"><label>Idioma<select value={language} onChange={(e)=>setLanguage(e.target.value)}><option>Español</option><option>Inglés</option><option>Español + inglés</option></select></label><label>Plataforma<select value={platform} onChange={(e)=>setPlatform(e.target.value)}><option>TikTok</option><option>Instagram Reels</option><option>YouTube Shorts</option><option>Multiplataforma</option></select></label></div><div className="modal-note">Borrador guardado en este navegador. No se sincroniza con la nube.</div><div className="modal-actions"><button className="secondary-button" onClick={()=>setModal(false)} type="button">Cancelar</button><button className="primary-button" type="submit">Crear producción →</button></div></form></div>}
  </div>;
}
export default App;
