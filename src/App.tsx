import { useState, type FormEvent } from "react";

type SectionId =
  | "home"
  | "campaigns"
  | "products"
  | "product-studio"
  | "characters"
  | "scenes"
  | "editor"
  | "library"
  | "distribution"
  | "analytics";

type Project = {
  id: number;
  name: string;
  format: string;
  updated: string;
};

const navigation: { label: string; items: { id: SectionId; label: string; icon: string }[] }[] = [
  {
    label: "WORKSPACE",
    items: [
      { id: "home", label: "Inicio", icon: "⌂" },
      { id: "campaigns", label: "Campañas", icon: "▤" },
      { id: "products", label: "Product Library", icon: "◈" },
    ],
  },
  {
    label: "PRODUCCIÓN",
    items: [
      { id: "product-studio", label: "Product Studio", icon: "⬡" },
      { id: "characters", label: "Personajes", icon: "♙" },
      { id: "scenes", label: "Scene Engine", icon: "▧" },
      { id: "editor", label: "Editor y render", icon: "▷" },
    ],
  },
  {
    label: "PUBLICACIÓN",
    items: [
      { id: "library", label: "Entregables", icon: "▣" },
      { id: "distribution", label: "Redes sociales", icon: "↗" },
      { id: "analytics", label: "Analítica", icon: "⌁" },
    ],
  },
];

const sectionCopy: Record<SectionId, { eyebrow: string; title: string; description: string }> = {
  home: {
    eyebrow: "TU ESPACIO CREATIVO",
    title: "Todo empieza con una buena idea.",
    description: "Planificá, producí y organizá el contenido de Ingredora desde un solo lugar.",
  },
  campaigns: {
    eyebrow: "WORKSPACE",
    title: "Campañas",
    description: "Organizá cada producción desde el brief hasta el video final.",
  },
  products: {
    eyebrow: "CATÁLOGO",
    title: "Product Library",
    description: "Productos, marcas, referencias visuales y permisos en un catálogo reutilizable.",
  },
  "product-studio": {
    eyebrow: "CREACIÓN 3D",
    title: "Product Studio",
    description: "Construí y personalizá packaging 3D para tus producciones.",
  },
  characters: {
    eyebrow: "ELENCO",
    title: "Personajes",
    description: "Personajes estilizados, expresiones y acciones reutilizables.",
  },
  scenes: {
    eyebrow: "DIRECCIÓN AUDIOVISUAL",
    title: "Scene Engine",
    description: "Escenarios, cámaras, iluminación y movimiento narrativo.",
  },
  editor: {
    eyebrow: "POSTPRODUCCIÓN",
    title: "Editor y render",
    description: "Componé escenas, ajustá el timeline y prepará tus entregables.",
  },
  library: {
    eyebrow: "ARCHIVO",
    title: "Entregables",
    description: "Tus previews y videos finales, organizados por campaña y versión.",
  },
  distribution: {
    eyebrow: "DISTRIBUCIÓN",
    title: "Redes sociales",
    description: "Prepará copies y adaptaciones para cada canal. La publicación siempre requiere tu aprobación.",
  },
  analytics: {
    eyebrow: "RESULTADOS",
    title: "Analítica",
    description: "Medí el recorrido desde el contenido hasta las partidas reales de Ingredora.",
  },
};

function BrandMark() {
  return (
    <div className="brand-lockup">
      <div className="brand-mark"><span>i</span><i /></div>
      <div className="brand-name">
        <strong>ingredora</strong>
        <span>CONTENT STUDIO</span>
      </div>
    </div>
  );
}

function App() {
  const [activeSection, setActiveSection] = useState<SectionId>("home");
  const [projects, setProjects] = useState<Project[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectFormat, setProjectFormat] = useState("Video vertical · 9:16");

  const copy = sectionCopy[activeSection];

  function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = projectName.trim();
    if (!name) return;
    setProjects((current) => [
      { id: Date.now(), name, format: projectFormat, updated: "Ahora" },
      ...current,
    ]);
    setProjectName("");
    setProjectFormat("Video vertical · 9:16");
    setModalOpen(false);
    setActiveSection("campaigns");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <BrandMark />
        <div className="workspace-switcher">
          <div className="workspace-avatar">I</div>
          <div className="workspace-info"><strong>Ingredora</strong><span>Workspace principal</span></div>
          <span className="switch-chevron">⌄</span>
        </div>

        <nav className="side-nav" aria-label="Navegación principal">
          {navigation.map((group) => (
            <div className="nav-group" key={group.label}>
              <p className="nav-heading">{group.label}</p>
              {group.items.map((item) => (
                <button
                  className={`nav-link ${activeSection === item.id ? "active" : ""}`}
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  type="button"
                >
                  <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.id === "editor" && <span className="nav-soon">BETA</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="storage-card">
            <div className="storage-top"><span className="storage-dot" /> <span>Modo de trabajo</span></div>
            <strong>Presupuesto cero</strong>
            <p>Sin servicios pagos ni procesos externos automáticos.</p>
          </div>
          <button className="profile-button" type="button">
            <div className="profile-avatar">M</div>
            <div><strong>Mi espacio</strong><span>Administrador</span></div>
            <span className="profile-more">•••</span>
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs"><span>Ingredora</span><b>/</b><strong>{copy.title}</strong></div>
          <div className="topbar-actions">
            <span className="system-status"><i /> Sistema en preparación</span>
            <button className="help-button" type="button" aria-label="Ayuda">?</button>
            <div className="top-avatar">M</div>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div>
              <p className="eyebrow">{copy.eyebrow}</p>
              <h1>{copy.title}</h1>
              <p className="page-description">{copy.description}</p>
            </div>
            <button className="primary-button" onClick={() => setModalOpen(true)} type="button">
              <span>＋</span> Nueva producción
            </button>
          </section>

          {activeSection === "home" ? (
            <>
              <section className="hero-panel">
                <div className="hero-copy">
                  <div className="hero-pill"><span /> CREATIVE WORKSPACE</div>
                  <h2>De la idea<br />a la <em>pantalla.</em></h2>
                  <p>Un estudio audiovisual para transformar productos reales en historias que dan ganas de jugar.</p>
                  <button className="hero-button" onClick={() => setModalOpen(true)} type="button">Crear primera producción <span>↗</span></button>
                  <div className="hero-footnote"><span>01</span> IMAGINAR <i /> <span>02</span> PRODUCIR <i /> <span>03</span> COMPARTIR</div>
                </div>
                <div className="hero-art" aria-hidden="true">
                  <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
                  <div className="art-spark spark-one">✳</div><div className="art-spark spark-two">✦</div>
                  <div className="product-shadow" />
                  <div className="product-pack">
                    <div className="pack-top" />
                    <div className="pack-label">
                      <span className="pack-small">INGREDIENT SPOTLIGHT</span>
                      <strong>REAL<br />FOOD.</strong>
                      <span className="pack-line" />
                      <span className="pack-caption">REAL STORIES</span>
                    </div>
                    <div className="pack-side" />
                  </div>
                  <div className="art-caption"><span>3D PRODUCT STUDIO</span><b>01 / 06</b></div>
                </div>
              </section>

              <section className="section-heading">
                <div><p className="eyebrow">OVERVIEW</p><h2>Tu estudio, de un vistazo</h2></div>
                <span className="muted-note">Los datos aparecerán cuando empieces a producir.</span>
              </section>

              <section className="stats-grid">
                <article className="stat-card"><div className="stat-icon lavender">▤</div><span>Campañas</span><strong>{projects.length.toString().padStart(2, "0")}</strong><small>Producciones creadas en esta sesión</small></article>
                <article className="stat-card"><div className="stat-icon mint">◈</div><span>Productos</span><strong>—</strong><small>Catálogo todavía vacío</small></article>
                <article className="stat-card"><div className="stat-icon peach">▷</div><span>Videos finales</span><strong>—</strong><small>Sin renders todavía</small></article>
                <article className="stat-card"><div className="stat-icon sky">↗</div><span>Publicaciones</span><strong>—</strong><small>Distribución aún no conectada</small></article>
              </section>

              <section className="bottom-grid">
                <div className="content-card recent-card">
                  <div className="card-heading"><div><p className="eyebrow">EN PROGRESO</p><h3>Producciones recientes</h3></div><button type="button" className="text-button" onClick={() => setActiveSection("campaigns")}>Ver todas <span>→</span></button></div>
                  {projects.length === 0 ? (
                    <div className="empty-state"><div className="empty-illustration"><span>✳</span><i>＋</i></div><strong>Tu próxima historia empieza acá</strong><p>Creá una producción para organizar el brief, las escenas y los recursos de tu campaña.</p><button type="button" className="secondary-button" onClick={() => setModalOpen(true)}>Crear producción</button></div>
                  ) : (
                    <div className="project-list">{projects.slice(0, 3).map((project) => <button className="project-row" key={project.id} onClick={() => setActiveSection("campaigns")} type="button"><span className="project-thumb">✳</span><span className="project-details"><strong>{project.name}</strong><small>{project.format} · {project.updated}</small></span><span className="project-status">Borrador</span><span className="row-arrow">→</span></button>)}</div>
                  )}
                </div>
                <div className="content-card workflow-card">
                  <p className="eyebrow">FLUJO DE TRABAJO</p><h3>Un proceso, muchas posibilidades.</h3>
                  <div className="workflow-list">
                    <div><span className="workflow-number">01</span><span className="workflow-icon">✎</span><p><strong>Idea y brief</strong><small>Definí qué historia queremos contar.</small></p></div>
                    <div><span className="workflow-number">02</span><span className="workflow-icon">◇</span><p><strong>Escenas y recursos</strong><small>Productos, personajes y dirección 3D.</small></p></div>
                    <div><span className="workflow-number">03</span><span className="workflow-icon">▷</span><p><strong>Render y entrega</strong><small>Previsualizá, aprobá y guardá.</small></p></div>
                  </div>
                </div>
              </section>
            </>
          ) : activeSection === "campaigns" ? (
            <section className="content-card campaigns-view">
              <div className="card-heading"><div><p className="eyebrow">WORKSPACE</p><h3>Tus producciones</h3></div><button className="secondary-button" onClick={() => setModalOpen(true)} type="button">＋ Nueva producción</button></div>
              {projects.length === 0 ? <div className="empty-state"><div className="empty-illustration"><span>✳</span><i>＋</i></div><strong>Todavía no hay producciones</strong><p>Creá la primera para empezar a organizar el contenido de Ingredora.</p><button className="primary-button" onClick={() => setModalOpen(true)} type="button">Crear primera producción</button></div> : <div className="project-list">{projects.map((project) => <div className="project-row" key={project.id}><span className="project-thumb">✳</span><span className="project-details"><strong>{project.name}</strong><small>{project.format} · {project.updated}</small></span><span className="project-status">Borrador</span></div>)}</div>}
            </section>
          ) : (
            <section className="module-placeholder">
              <div className="placeholder-icon">{navigation.flatMap((group) => group.items).find((item) => item.id === activeSection)?.icon}</div>
              <p className="eyebrow">MÓDULO PREPARADO</p>
              <h2>Estamos construyendo este espacio.</h2>
              <p>La sección ya forma parte de la estructura de Ingredora Content Studio. Su funcionalidad se incorporará por etapas, manteniendo el flujo de trabajo y el presupuesto cero.</p>
              <button className="secondary-button" onClick={() => setActiveSection("home")} type="button">Volver al inicio</button>
            </section>
          )}
          <footer className="page-footer"><span>INGREDORA CONTENT STUDIO</span><span>CREAR CON INTENCIÓN · PRODUCIR CON LIBERTAD</span><span>v0.1.0</span></footer>
        </div>
      </main>

      {modalOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}>
          <form className="create-modal" onSubmit={createProject}>
            <button className="modal-close" type="button" onClick={() => setModalOpen(false)} aria-label="Cerrar">×</button>
            <p className="eyebrow">NUEVA PRODUCCIÓN</p>
            <h2>Empecemos por la idea.</h2>
            <p className="modal-description">Creá un espacio para organizar tu próxima pieza de contenido.</p>
            <label htmlFor="project-name">Nombre de la producción</label>
            <input id="project-name" autoFocus maxLength={80} onChange={(event) => setProjectName(event.target.value)} placeholder="Ej. Yerba mate — Ingredient spotlight" required value={projectName} />
            <label htmlFor="project-format">Formato inicial</label>
            <select id="project-format" onChange={(event) => setProjectFormat(event.target.value)} value={projectFormat}>
              <option>Video vertical · 9:16</option>
              <option>Video cuadrado · 1:1</option>
              <option>Video horizontal · 16:9</option>
            </select>
            <div className="modal-note">Se guardará como borrador local en esta sesión. La persistencia se incorporará más adelante.</div>
            <div className="modal-actions"><button className="secondary-button" onClick={() => setModalOpen(false)} type="button">Cancelar</button><button className="primary-button" type="submit">Crear producción <span>→</span></button></div>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;
