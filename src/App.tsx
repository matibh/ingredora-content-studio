import { useCallback, useEffect, useRef, useState } from "react";
import { renderPackageToWebM, type RenderProgress } from "./engine/renderer";
import { getRenderedVideo, saveRenderedVideo } from "./engine/storage";
import type { ProductionPackage } from "./engine/types";

type Production = {
  id: string;
  title: string;
  description?: string;
  status: "ready" | "rendering" | "planned";
  videoUrl?: string;
  packageUrl?: string;
  posterUrl?: string;
  durationSeconds?: number;
  aspectRatio?: "9:16" | "1:1" | "16:9";
  language?: string;
  platforms?: string[];
  version?: string;
  createdAt?: string;
  caption?: string;
};

type Manifest = {
  schemaVersion: 1;
  updatedAt: string | null;
  productions: Production[];
};

const MANIFEST_URL = `${import.meta.env.BASE_URL}studio/productions.json`;
const EMPTY_MANIFEST: Manifest = { schemaVersion: 1, updatedAt: null, productions: [] };

function formatDuration(seconds?: number) {
  if (!seconds || !Number.isFinite(seconds)) return "Duración pendiente";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return mins ? `${mins}:${String(secs).padStart(2, "0")}` : `${secs} s`;
}

function formatDate(value?: string) {
  if (!value) return "Producción de Ingredora";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Producción de Ingredora";
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function App() {
  const [manifest, setManifest] = useState<Manifest>(EMPTY_MANIFEST);
  const [loading, setLoading] = useState(true);
  const [connection, setConnection] = useState<"connected" | "error">("connected");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localVideos, setLocalVideos] = useState<Record<string, string>>({});
  const [renderProgress, setRenderProgress] = useState<Record<string, RenderProgress>>({});
  const [renderErrors, setRenderErrors] = useState<Record<string, string>>({});
  const [renderStages, setRenderStages] = useState<Record<string, string>>({});
  const [retryToken, setRetryToken] = useState(0);
  const renderingIds = useRef(new Set<string>());

  const loadProductions = useCallback(async () => {
    try {
      const response = await fetch(`${MANIFEST_URL}?v=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`Manifest HTTP ${response.status}`);
      const data = await response.json() as Manifest;
      if (data.schemaVersion !== 1 || !Array.isArray(data.productions)) throw new Error("Manifest format not supported");
      setManifest(data);
      setConnection("connected");
      setActiveId((current) => {
        if (current && data.productions.some((item) => item.id === current && item.status === "ready" && item.videoUrl)) return current;
        return data.productions.find((item) => item.status === "ready" && item.videoUrl)?.id ?? null;
      });
    } catch {
      setConnection("error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProductions();
    const timer = window.setInterval(() => void loadProductions(), 60_000);
    const onFocus = () => void loadProductions();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [loadProductions]);

  useEffect(() => {
    const candidate = manifest.productions.find((item) =>
      item.packageUrl && !item.videoUrl && !localVideos[item.id] && !renderingIds.current.has(item.id)
    );
    if (!candidate) return;
    renderingIds.current.add(candidate.id);
    setRenderStages((current) => ({ ...current, [candidate.id]: "Preparando el video y el audio…" }));

    const produce = async () => {
      try {
        const stored = await getRenderedVideo(candidate.id);
        if (stored) {
          setLocalVideos((current) => ({ ...current, [candidate.id]: URL.createObjectURL(stored) }));
          return;
        }
        setRenderErrors((current) => { const next = { ...current }; delete next[candidate.id]; return next; });
        setRenderStages((current) => ({ ...current, [candidate.id]: "Cargando materiales de la producción…" }));
        const packageResponse = await fetch(import.meta.env.BASE_URL + candidate.packageUrl + "?v=1", { cache: "no-cache" });
        if (!packageResponse.ok) throw new Error("No se pudo cargar el paquete (" + packageResponse.status + ").");
        const productionPackage = await packageResponse.json() as ProductionPackage;
        setRenderStages((current) => ({ ...current, [candidate.id]: "Renderizando cada fotograma. Puede tardar unos minutos…" }));
        const blob = await renderPackageToWebM(productionPackage, (progress) => {
          setRenderProgress((current) => ({ ...current, [candidate.id]: progress }));
        });
        if (!blob.size) throw new Error("El render terminó sin generar un archivo de video.");
        setRenderStages((current) => ({ ...current, [candidate.id]: "Guardando el video para reproducirlo…" }));
        await saveRenderedVideo(candidate.id, blob);
        setLocalVideos((current) => ({ ...current, [candidate.id]: URL.createObjectURL(blob) }));
        setRenderProgress((current) => ({ ...current, [candidate.id]: { ...current[candidate.id], percent: 100 } }));
      } catch (error) {
        setRenderErrors((current) => ({
          ...current,
          [candidate.id]: error instanceof Error ? error.message : "No se pudo completar el render."
        }));
      } finally {
        renderingIds.current.delete(candidate.id);
        setRenderStages((current) => ({ ...current, [candidate.id]: "" }));
      }
    };
    void produce();
  }, [manifest.productions, localVideos, retryToken]);

  const ready = manifest.productions.filter((item) => (item.status === "ready" && item.videoUrl) || !!localVideos[item.id]);
  const active = ready.find((item) => item.id === activeId) ?? ready[0] ?? null;
  const activeVideoUrl = active ? (active.videoUrl || localVideos[active.id]) : undefined;
  const inProgress = manifest.productions.filter((item) => !ready.some((readyItem) => readyItem.id === item.id));

  return (
    <div className="studio-shell">
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="Ingredora Content Studio, inicio">
          <span className="brand-symbol">i<span>.</span></span>
          <span className="brand-copy"><strong>ingredora</strong><small>CONTENT STUDIO</small></span>
        </a>
        <div className="topbar-right">
          <span className={`connection ${connection}`}><i />{connection === "connected" ? "Biblioteca sincronizada" : "No se pudo actualizar"}</span>
          <span className="topbar-tag">STUDIO / 01</span>
        </div>
      </header>

      <main id="inicio">
        <section className="intro">
          <div className="intro-copy">
            <p className="eyebrow">INGREDORA ORIGINALS</p>
            <h1>Ideas que se<br /><em>convierten en video.</em></h1>
            <p className="intro-description">Cada producción nace, se dirige y se construye desde nuestro espacio creativo. Acá encontrás los videos terminados, listos para reproducir.</p>
          </div>
          <div className="intro-orbit" aria-hidden="true">
            <div className="orbit-ring ring-a" /><div className="orbit-ring ring-b" />
            <div className="orbit-core"><span>i</span></div><b className="orbit-star star-a">✳</b><b className="orbit-star star-b">✦</b>
          </div>
        </section>

        <section className="player-section" aria-label="Última producción">
          <div className="section-topline"><div><p className="eyebrow">THE SCREENING ROOM</p><h2>Última producción</h2></div><span className="section-index">01 — PLAY</span></div>
          {active ? (
            <div className="featured-layout">
              <div className={`video-frame ratio-${(active.aspectRatio || "16:9").replace(":", "-")}`}>
                <video key={active.id + activeVideoUrl} controls playsInline preload="metadata" poster={active.posterUrl} aria-label={`Reproducir ${active.title}`}>
                  <source src={activeVideoUrl} />
                  Tu navegador no puede reproducir este video.
                </video>
                <div className="video-corner-label">INGREDORA / ORIGINAL</div>
              </div>
              <div className="video-details">
                <div className="ready-label"><i /> VIDEO LISTO</div>
                <h3>{active.title}</h3>
                <p>{active.description || "Una nueva producción original de Ingredora."}</p>
                <div className="metadata">
                  <div><span>DURACIÓN</span><strong>{formatDuration(active.durationSeconds)}</strong></div>
                  <div><span>FORMATO</span><strong>{active.aspectRatio || "Vertical"}</strong></div>
                  <div><span>IDIOMA</span><strong>{active.language || "Español"}</strong></div>
                  <div><span>VERSIÓN</span><strong>{active.version || "Final"}</strong></div>
                </div>
                <div className="platform-tags">{(active.platforms || []).map((platform) => <span key={platform}>{platform}</span>)}</div>
                <p className="date-note">{formatDate(active.createdAt)}</p>
              </div>
            </div>
          ) : (
            <div className="empty-player">
              <div className="empty-player-art"><div className="play-outline">▷</div><span className="empty-spark spark-left">✳</span><span className="empty-spark spark-right">✦</span></div>
              <div className="empty-player-copy">
                <p className="eyebrow">{loading ? "CONECTANDO CON EL ESTUDIO" : connection === "error" ? "SIN CONEXIÓN CON LA BIBLIOTECA" : "PANTALLA PREPARADA"}</p>
                <h3>{loading ? "Buscando producciones…" : connection === "error" ? "No pudimos actualizar el contenido." : inProgress.length ? "Estamos preparando tu próximo video." : "Tu próximo video va a aparecer acá."}</h3>
                <p>{loading ? "Estamos leyendo el catálogo de producciones." : connection === "error" ? "La página volverá a intentar sincronizar automáticamente." : inProgress.length ? "El render se realiza en este dispositivo y puede tardar unos minutos. El estado y cualquier problema aparecen en la sección «En producción»." : "Todavía no hay videos publicados. Cuando una producción esté lista, va a aparecer acá automáticamente."}</p>
              </div>
            </div>
          )}
        </section>

        {ready.length > 1 && (
          <section className="archive-section">
            <div className="section-topline"><div><p className="eyebrow">THE ARCHIVE</p><h2>Más producciones</h2></div><span className="section-index">{String(ready.length).padStart(2, "0")} VIDEOS</span></div>
            <div className="archive-grid">
              {ready.filter((item) => item.id !== active?.id).map((item) => (
                <button className="archive-card" key={item.id} onClick={() => { setActiveId(item.id); window.scrollTo({ top: 0, behavior: "smooth" }); }} type="button">
                  <span className="archive-poster">{item.posterUrl ? <img src={item.posterUrl} alt="" /> : <span className="poster-mark">i.</span>}<span className="archive-play">▷</span><small>{formatDuration(item.durationSeconds)}</small></span>
                  <span className="archive-card-copy"><strong>{item.title}</strong><small>{item.aspectRatio || "Video"} · {item.language || "Español"}</small></span>
                </button>
              ))}
            </div>
          </section>
        )}

        {inProgress.length > 0 && (
          <section className="pipeline-section">
            <div className="section-topline"><div><p className="eyebrow">IN THE WORKS</p><h2>En producción</h2></div><span className="section-index">{String(inProgress.length).padStart(2, "0")} PROYECTOS</span></div>
            <div className="pipeline-list">{inProgress.map((item) => {
              const progress = renderProgress[item.id];
              const error = renderErrors[item.id];
              const stage = renderStages[item.id] || (progress ? "El video se está construyendo en este dispositivo…" : "Preparando el entorno de render…");
              return <article className={`pipeline-item ${error ? "has-error" : ""}`} key={item.id}>
                <span className="pipeline-icon">{error ? "!" : "◌"}</span>
                <div className="pipeline-copy">
                  <strong>{item.title}</strong>
                  {error ? <>
                    <small className="pipeline-error">No pudimos terminar este video. {error}</small>
                    <button className="retry-render" type="button" onClick={() => { setRenderErrors((current) => { const next = { ...current }; delete next[item.id]; return next; }); setRenderProgress((current) => { const next = { ...current }; delete next[item.id]; return next; }); setRetryToken((value) => value + 1); }}>VOLVER A INTENTAR</button>
                  </> : <>
                    <small>{stage}</small>
                    <div className="render-progress-track" role="progressbar" aria-valuenow={progress?.percent ?? 0} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${progress?.percent ?? 0}%` }} /></div>
                  </>}
                </div>
                <span className={`pipeline-status ${error ? "status-error" : ""}`}>{error ? "REQUIERE ATENCIÓN" : progress ? `${progress.percent}%` : "EN PROCESO"}</span>
              </article>;
            })}</div>
          </section>
        )}
      </main>

      <footer className="footer"><a className="footer-brand" href="#inicio">ingredora<span>.</span></a><span>CREADO CON INTENCIÓN. PRODUCIDO PARA JUGAR.</span><span>CONTENT STUDIO © 2026</span></footer>
    </div>
  );
}

export default App;
