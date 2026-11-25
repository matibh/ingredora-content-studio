import { useMemo, useState } from "react";

type Production = {
  id: string; title: string; description?: string; videoUrl?: string;
  finalFileName?: string; durationSeconds?: number; aspectRatio?: string;
  collection?: string; episodeNumber?: number; episodeLabel?: string;
};
type Props = { productions: Production[]; initialProductionId?: string; onBack: () => void };
const PLATFORMS = [
  { id: "youtube", name: "YouTube", mark: "▶", note: "Video, título, descripción, etiquetas y visibilidad" },
  { id: "instagram", name: "Instagram", mark: "◎", note: "Reel o video, copy y hashtags" },
  { id: "facebook", name: "Facebook", mark: "f", note: "Video, texto y audiencia" },
  { id: "x", name: "X", mark: "𝕏", note: "Video y texto breve" },
  { id: "tiktok", name: "TikTok", mark: "♪", note: "Video, descripción, hashtags y privacidad" },
] as const;
export default function PublishingScreen({ productions, initialProductionId, onBack }: Props) {
  const [videoId, setVideoId] = useState(initialProductionId || productions[0]?.id || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [category, setCategory] = useState("Entretenimiento");
  const [visibility, setVisibility] = useState("Público");
  const [audience, setAudience] = useState("No, no es contenido creado para niños");
  const [schedule, setSchedule] = useState("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [selected, setSelected] = useState<string[]>(["youtube", "instagram", "facebook", "x", "tiktok"]);
  const [platformFormat, setPlatformFormat] = useState("Automático");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const active = productions.find((item) => item.id === videoId);
  const parsedTags = useMemo(() => tags.split(",").map((tag) => tag.trim()).filter(Boolean), [tags]);
  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const readyToReview = !!active && !!title.trim() && !!description.trim() && selected.length > 0 && (schedule === "now" || !!scheduledAt);
  return <section className="publish-screen">
    <div className="publish-topline"><button type="button" className="publish-back" onClick={onBack}>← Volver a la biblioteca</button><span>INGREDORA STUDIO / DISTRIBUCIÓN</span></div>
    <header className="publish-heading"><div><p className="eyebrow">DISTRIBUCIÓN MULTIPLATAFORMA</p><h1>Subir a <em>redes.</em></h1><p>Prepará una publicación completa y adaptá sus datos para cada canal desde un solo lugar.</p></div><div className="publish-step"><strong>01</strong><span>PREPARAR PUBLICACIÓN</span></div></header>
    <div className="publish-layout">
      <div className="publish-main">
        <section className="publish-card">
          <div className="publish-card-title"><span>01</span><div><h2>Video</h2><p>Elegí el MP4 final que querés distribuir.</p></div></div>
          <label className="publish-field"><span>VIDEO DE LA BIBLIOTECA</span><select value={videoId} onChange={e=>setVideoId(e.target.value)}><option value="">Seleccionar video…</option>{productions.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
          {active ? <div className="publish-video-preview"><video src={active.videoUrl} controls playsInline preload="metadata"/><div><strong>{active.title}</strong><small>{active.finalFileName || "MP4 final"} · {active.aspectRatio || "Formato original"}{active.episodeNumber ? " · Capítulo "+active.episodeNumber : ""}</small></div></div> : <div className="publish-empty-video">No hay videos finales disponibles. Primero incorporá un MP4 a la biblioteca.</div>}
          <label className="publish-field"><span>PORTADA / MINIATURA (OPCIONAL)</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>setThumbnail(e.target.files?.[0]||null)}/>{thumbnail&&<small className="publish-hint">{thumbnail.name}</small>}</label>
        </section>
        <section className="publish-card">
          <div className="publish-card-title"><span>02</span><div><h2>Contenido de la publicación</h2><p>Completá los metadatos que acompañan al video.</p></div></div>
          <label className="publish-field"><span>TÍTULO</span><input value={title} onChange={e=>setTitle(e.target.value)} maxLength={100} placeholder="Título atractivo y claro"/><small>{title.length}/100 caracteres</small></label>
          <label className="publish-field"><span>DESCRIPCIÓN</span><textarea value={description} onChange={e=>setDescription(e.target.value)} rows={6} maxLength={5000} placeholder="Contá de qué trata el video, agregá contexto y una invitación a interactuar…"/><small>{description.length}/5000 caracteres</small></label>
          <label className="publish-field"><span>ETIQUETAS (SEPARADAS POR COMAS)</span><input value={tags} onChange={e=>setTags(e.target.value)} placeholder="ingredora, entre partidas, humor, gaming"/><small>{parsedTags.length} etiquetas</small></label>
          <label className="publish-field"><span>HASHTAGS</span><input value={hashtags} onChange={e=>setHashtags(e.target.value)} placeholder="#EntrePartidas #Ingredora #Gaming"/></label>
        </section>
        <section className="publish-card">
          <div className="publish-card-title"><span>03</span><div><h2>Elegir redes</h2><p>Podés seleccionar una, varias o todas.</p></div></div>
          <div className="publish-platforms">{PLATFORMS.map(platform=><button type="button" key={platform.id} className={selected.includes(platform.id)?"publish-platform selected":"publish-platform"} aria-pressed={selected.includes(platform.id)} onClick={()=>toggle(platform.id)}><span className="publish-platform-check">{selected.includes(platform.id)?"✓":""}</span><span className={"publish-platform-mark "+platform.id}>{platform.mark}</span><span className="publish-platform-copy"><strong>{platform.name}</strong><small>{platform.note}</small></span></button>)}</div>
        </section>
        <section className="publish-card">
          <div className="publish-card-title"><span>04</span><div><h2>Configuración de publicación</h2><p>Opciones generales y programación.</p></div></div>
          <div className="publish-fields-two">
            <label className="publish-field"><span>CATEGORÍA</span><select value={category} onChange={e=>setCategory(e.target.value)}><option>Entretenimiento</option><option>Educación</option><option>Personas y blogs</option><option>Juegos</option><option>Ciencia y tecnología</option><option>Comedia</option></select></label>
            <label className="publish-field"><span>VISIBILIDAD</span><select value={visibility} onChange={e=>setVisibility(e.target.value)}><option>Público</option><option>No listado</option><option>Privado</option></select></label>
          </div>
          <label className="publish-field"><span>¿ES CONTENIDO CREADO PARA NIÑOS?</span><select value={audience} onChange={e=>setAudience(e.target.value)}><option>No, no es contenido creado para niños</option><option>Sí, es contenido creado para niños</option></select></label>
          <label className="publish-field"><span>CUÁNDO PUBLICAR</span><select value={schedule} onChange={e=>setSchedule(e.target.value)}><option value="now">Publicar ahora (cuando conectemos las redes)</option><option value="schedule">Programar fecha y hora</option><option value="draft">Guardar como borrador</option></select></label>
          {schedule==="schedule"&&<label className="publish-field"><span>FECHA Y HORA</span><input type="datetime-local" value={scheduledAt} onChange={e=>setScheduledAt(e.target.value)}/></label>}
          <label className="publish-field"><span>FORMATO / TIPO DE PUBLICACIÓN</span><select value={platformFormat} onChange={e=>setPlatformFormat(e.target.value)}><option>Automático</option><option>Video vertical / Reel / Short</option><option>Video horizontal</option><option>Publicación cuadrada</option></select></label>
        </section>
      </div>
      <aside className="publish-sidebar">
        <div className="publish-summary"><p className="eyebrow">RESUMEN</p><h3>Tu publicación</h3><div className="publish-summary-row"><span>Video</span><strong>{active?.title || "Sin seleccionar"}</strong></div><div className="publish-summary-row"><span>Redes elegidas</span><strong>{selected.length} de 5</strong></div><div className="publish-summary-row"><span>Etiquetas</span><strong>{parsedTags.length}</strong></div><div className="publish-summary-row"><span>Programación</span><strong>{schedule==="now"?"Ahora":schedule==="draft"?"Borrador":"Programada"}</strong></div><div className="publish-selected-chips">{PLATFORMS.filter(p=>selected.includes(p.id)).map(p=><span key={p.id}>{p.name}</span>)}</div><button type="button" className="publish-review-button" disabled={!readyToReview} onClick={()=>setMessage("Revisión lista. La publicación todavía no se envía: esta pantalla es solo frontend y no tiene redes conectadas.")}>Revisar publicación <span>→</span></button>{message&&<p className="publish-feedback" role="status">{message}</p>}<small>Modo de preparación: no se inicia sesión ni se publica contenido en ninguna red.</small></div>
        <div className="publish-tip"><strong>Una sola preparación, cinco destinos.</strong><p>Más adelante conectaremos cada cuenta para adaptar límites, formatos, privacidad y programación según las reglas de cada plataforma.</p></div>
      </aside>
    </div>
  </section>;
}
