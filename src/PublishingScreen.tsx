import { useEffect, useMemo, useState } from "react";

type Production = {
  id: string; title: string; description?: string; videoUrl?: string;
  finalFileName?: string; durationSeconds?: number; aspectRatio?: string;
  collection?: string; episodeNumber?: number; episodeLabel?: string;
};
type VideoAsset = { id: string; name: string; title: string; videoUrl: string; txtUrl: string };
type CopyData = { title: string; description: string; hashtags: string; tags: string; pinnedComment: string; altText: string };
type Props = { productions: Production[]; initialProductionId?: string };
const REPO = "https://api.github.com/repos/matibh/ingredora-content-studio/contents/Contenido%20a%20subir?ref=main";
const RAW = "https://raw.githubusercontent.com/matibh/ingredora-content-studio/main/Contenido%20a%20subir/";
const PLATFORMS = [
  { id: "youtube", name: "YouTube", mark: "▶", note: "Título, descripción, tags y comentario" },
  { id: "instagram", name: "Instagram", mark: "◎", note: "Caption, hashtags, portada y ALT" },
  { id: "facebook", name: "Facebook", mark: "f", note: "Título, copy y texto alternativo" },
  { id: "x", name: "X", mark: "𝕏", note: "Post, hashtags y texto ALT" },
  { id: "tiktok", name: "TikTok", mark: "♪", note: "Caption, hashtags y portada" },
] as const;
const emptyCopy = (): CopyData => ({ title: "", description: "", hashtags: "", tags: "", pinnedComment: "", altText: "" });
const clean = (value: string) => value.replace(/^["«]|["»]$/g, "").trim();
function section(text: string, heading: RegExp, next: RegExp) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex(line => heading.test(line.trim()));
  if (start < 0) return "";
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) if (next.test(lines[i].trim())) { end = i; break; }
  return lines.slice(start + 1, end).join("\n").trim().replace(/^[-=]{3,}\s*$/gm, "").trim();
}
function labelValue(block: string, label: string) {
  const lines = block.split(/\r?\n/);
  const index = lines.findIndex(line => new RegExp("^\\s*" + label + "\\s*$", "i").test(line.trim()));
  if (index < 0) return "";
  const result: string[] = [];
  for (let i = index + 1; i < lines.length; i++) {
    if (/^[A-ZÁÉÍÓÚÜÑ0-9][A-ZÁÉÍÓÚÜÑ0-9 /()—–_-]{2,}$/.test(lines[i].trim()) || /^[-=]{3,}$/.test(lines[i].trim())) break;
    if (lines[i].trim()) result.push(lines[i].trim());
    else if (result.length) break;
  }
  return result.join("\n").trim();
}
function parseMetadata(text: string): Record<string, CopyData> {
  const out: Record<string, CopyData> = Object.fromEntries(PLATFORMS.map(p => [p.id, emptyCopy()]));
  const universalTitle = section(text, /^TÍTULO PRINCIPAL$/im, /^(ALTERNATIVAS? DE TÍTULO|DESCRIPCIÓN|CONCEPTO|$)/im);
  const universalDescription = section(text, /^DESCRIPCIÓN\s*[-—].*$/im, /^(ETIQUETAS|HASHTAGS|COMENTARIO|TEXTO PARA PORTADA|CTA|NOTAS|CRÉDITO|CONTROL|FIN)/im);
  const universalTags = section(text, /^(ETIQUETAS \/ TAGS|ETIQUETAS|TAGS)\b.*$/im, /^(HASHTAGS|COMENTARIO|TEXTO PARA PORTADA|CTA|NOTAS|CONTROL|FIN)/im);
  const universalHash = section(text, /^HASHTAGS PRINCIPALES$/im, /^(COMENTARIO|TEXTO PARA PORTADA|CTA|NOTAS|CRÉDITO|CONTROL|FIN)/im);
  const platformBlocks: Record<string, RegExp[]> = {
    youtube: [/^\s*3\. YOUTUBE SHORTS\s*$/im, /^\s*YOUTUBE SHORTS\s*$/im, /^\s*YOUTUBE\s*$/im],
    instagram: [/^\s*4\. INSTAGRAM REELS\s*$/im, /^\s*INSTAGRAM REELS\s*$/im, /^\s*INSTAGRAM\s*$/im],
    tiktok: [/^\s*5\. TIKTOK\s*$/im, /^\s*TIKTOK\s*$/im],
    facebook: [/^\s*6\. FACEBOOK REELS\s*$/im, /^\s*FACEBOOK REELS\s*$/im, /^\s*FACEBOOK\s*$/im],
    x: [/^\s*7\. X\s*$/im, /^\s*X \(ANTES TWITTER\)\s*$/im, /^\s*X\s*$/im]
  };
  const allHeadings = /^(?:\d+\.\s*)?(?:YOUTUBE SHORTS|YOUTUBE|INSTAGRAM REELS|INSTAGRAM|TIKTOK|FACEBOOK REELS|FACEBOOK|X(?: \(ANTES TWITTER\))?|COPY UNIVERSAL|\d+\.\s+COPY|\d+\.\s+PUBLICACIÓN|\d+\.\s+CHECKLIST|\d+\.\s+MARCAS|\d+\.\s+ESTADO|FIN\b).*$/im;
  for (const p of PLATFORMS) {
    const heading = platformBlocks[p.id].find(re => re.test(text));
    let block = "";
    if (heading) block = section(text, heading, allHeadings);
    const title = labelValue(block, p.id === "youtube" ? "TÍTULO PRINCIPAL" : p.id === "facebook" ? "TÍTULO" : p.id === "instagram" ? "TÍTULO" : "TÍTULO");
    const desc = labelValue(block, p.id === "youtube" ? "DESCRIPCIÓN" : p.id === "instagram" || p.id === "tiktok" ? "CAPTION PRINCIPAL" : p.id === "facebook" ? "COPY" : "POST PRINCIPAL")
      || section(text, new RegExp("^DESCRIPCIÓN\\\\s*[-—]\\\\s*" + (p.id === "youtube" ? "YOUTUBE SHORTS" : p.id === "instagram" ? "INSTAGRAM REELS" : p.id === "facebook" ? "FACEBOOK REELS" : p.id.toUpperCase()) + "$", "im"), /^(?:DESCRIPCIÓN|ETIQUETAS|HASHTAGS|COMENTARIO|TEXTO PARA PORTADA|CTA|NOTAS|CRÉDITO|CONTROL|FIN)/im);
    const tags = labelValue(block, "ETIQUETAS / TAGS") || labelValue(block, "ETIQUETAS / TAGS DE YOUTUBE") || labelValue(block, "ETIQUETAS");
    const hash = labelValue(block, "HASHTAGS");
    const pinned = labelValue(block, "COMENTARIO PARA FIJAR") || labelValue(block, "COMENTARIO FIJADO");
    const alt = labelValue(block, "TEXTO ALTERNATIVO") || labelValue(block, "TEXTO ALT") || labelValue(block, "DESCRIPCIÓN ACCESIBLE");
    out[p.id] = {
      title: clean(title || (p.id === "youtube" ? universalTitle : "")),
      description: clean(desc || (p.id === "youtube" ? universalDescription : universalDescription)),
      hashtags: clean(hash || universalHash),
      tags: clean(tags || (p.id === "youtube" ? universalTags : "")),
      pinnedComment: clean(pinned),
      altText: clean(alt)
    };
  }
  // TXT breves sin bloques separados: usar los campos universales en todas las redes.
  for (const p of PLATFORMS) {
    if (!out[p.id].description) out[p.id].description = clean(universalDescription);
    if (!out[p.id].hashtags) out[p.id].hashtags = clean(universalHash);
    if (!out[p.id].title) out[p.id].title = clean(universalTitle);
  }
  return out;
}
function niceTitle(filename: string) {
  return filename.replace(/\.mp4$/i, "").replace(/[-_]+/g, " ").replace(/\b\d+\b/g, n => "#" + n).replace(/\b\w/g, c => c.toUpperCase());
}
export default function PublishingScreen({ productions, initialProductionId }: Props) {
  const [assets, setAssets] = useState<VideoAsset[]>([]);
  const [videoId, setVideoId] = useState("");
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [metadataError, setMetadataError] = useState("");
  const [copies, setCopies] = useState<Record<string, CopyData>>({});
  const [activePlatform, setActivePlatform] = useState<string>("youtube");
  const [category, setCategory] = useState("Entretenimiento");
  const [visibility, setVisibility] = useState("Público");
  const [audience, setAudience] = useState("No, no es contenido creado para niños");
  const [schedule, setSchedule] = useState("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [selected, setSelected] = useState<string[]>(["youtube", "instagram", "facebook", "x", "tiktok"]);
  const [platformFormat, setPlatformFormat] = useState("Automático");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const active = assets.find(item => item.id === videoId);
  const currentCopy = copies[activePlatform] || emptyCopy();
  const parsedTags = useMemo(() => currentCopy.tags.split(/[,\n]/).map(tag => tag.trim()).filter(Boolean), [currentCopy.tags]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingAssets(true);
        const response = await fetch(REPO, { headers: { Accept: "application/vnd.github+json" } });
        if (!response.ok) throw new Error("No se pudo leer la carpeta Contenido a subir.");
        const entries = await response.json() as Array<{ name: string; type: string }>;
        const videos = entries.filter(entry => entry.type === "file" && /\.mp4$/i.test(entry.name)).map(entry => {
          const base = entry.name.replace(/\.mp4$/i, "");
          return { id: base, name: entry.name, title: niceTitle(entry.name), videoUrl: RAW + encodeURIComponent(entry.name), txtUrl: RAW + encodeURIComponent(base + ".txt") };
        });
        if (!cancelled) {
          setAssets(videos);
          const preferred = videos.find(v => v.id === initialProductionId || v.name === productions.find(p => p.id === initialProductionId)?.finalFileName) || videos[0];
          if (preferred) setVideoId(preferred.id);
        }
      } catch (error) {
        if (!cancelled) setMetadataError(error instanceof Error ? error.message : "Error al cargar los MP4.");
      } finally { if (!cancelled) setLoadingAssets(false); }
    })();
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    if (!active) { setCopies({}); return; }
    let cancelled = false;
    (async () => {
      try {
        setLoadingMetadata(true); setMetadataError(""); setMessage("");
        const response = await fetch(active.txtUrl);
        if (!response.ok) throw new Error("No encontramos el TXT asociado: " + active.name.replace(/\.mp4$/i, ".txt"));
        const text = await response.text();
        const parsed = parseMetadata(text);
        if (!cancelled) setCopies(parsed);
      } catch (error) {
        if (!cancelled) { setCopies({}); setMetadataError(error instanceof Error ? error.message : "No se pudieron leer los metadatos."); }
      } finally { if (!cancelled) setLoadingMetadata(false); }
    })();
    return () => { cancelled = true; };
  }, [videoId, assets]);
  const updateCopy = (field: keyof CopyData, value: string) => setCopies(current => ({ ...current, [activePlatform]: { ...(current[activePlatform] || emptyCopy()), [field]: value } }));
  const toggle = (id: string) => setSelected(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const readyToReview = !!active && !loadingMetadata && !!currentCopy.description.trim() && selected.length > 0 && (schedule === "now" || schedule === "draft" || !!scheduledAt);
  return <section className="publish-screen">
    <div className="publish-topline"><span>INGREDORA STUDIO / DISTRIBUCIÓN</span><span>PUBLICACIÓN MULTIPLATAFORMA</span></div>
    <header className="publish-heading"><div><p className="eyebrow">DISTRIBUCIÓN MULTIPLATAFORMA</p><h1>Subir a <em>redes.</em></h1><p>Elegí un MP4 y cargamos automáticamente los textos de su TXT asociado.</p></div><div className="publish-step"><strong>01</strong><span>PREPARAR PUBLICACIÓN</span></div></header>
    <div className="publish-layout">
      <div className="publish-main">
        <section className="publish-card">
          <div className="publish-card-title"><span>01</span><div><h2>Video final</h2><p>Se muestran exclusivamente los MP4 de «Contenido a subir».</p></div></div>
          <label className="publish-field"><span>SELECCIONAR MP4</span><select value={videoId} onChange={e=>{setVideoId(e.target.value);setThumbnail(null);}} disabled={loadingAssets}><option value="">{loadingAssets ? "Buscando MP4…" : "Seleccionar video…"}</option>{assets.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          {active ? <div className="publish-video-preview"><video src={active.videoUrl} controls playsInline preload="metadata"/><div><strong>{active.name}</strong><small>MP4 final · TXT asociado: {active.name.replace(/\.mp4$/i, ".txt")}</small></div></div> : <div className="publish-empty-video">{loadingAssets ? "Leyendo la carpeta de videos…" : "No hay MP4 disponibles en Contenido a subir."}</div>}
          {loadingMetadata && <p className="publish-feedback">Leyendo el TXT y completando los campos…</p>}
          {metadataError && <p className="publish-feedback" role="alert">{metadataError}</p>}
          <label className="publish-field"><span>PORTADA / MINIATURA (OPCIONAL)</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>setThumbnail(e.target.files?.[0]||null)}/>{thumbnail&&<small className="publish-hint">{thumbnail.name}</small>}</label>
        </section>
        <section className="publish-card">
          <div className="publish-card-title"><span>02</span><div><h2>Contenido de la publicación</h2><p>Los campos cambian según la red y se rellenan desde el TXT. Podés corregirlos antes de publicar.</p></div></div>
          <div className="publish-platforms">{PLATFORMS.map(platform=><button type="button" key={platform.id} className={activePlatform===platform.id?"publish-platform selected":"publish-platform"} aria-pressed={activePlatform===platform.id} onClick={()=>setActivePlatform(platform.id)}><span className="publish-platform-mark">{platform.mark}</span><span className="publish-platform-copy"><strong>{platform.name}</strong><small>{platform.note}</small></span></button>)}</div>
          <label className="publish-field"><span>TÍTULO</span><input value={currentCopy.title} onChange={e=>updateCopy("title",e.target.value)} maxLength={activePlatform==="x"?280:100} placeholder="Se completa desde el TXT"/><small>{currentCopy.title.length}/{activePlatform==="x"?280:100} caracteres</small></label>
          <label className="publish-field"><span>{activePlatform==="youtube"?"DESCRIPCIÓN":activePlatform==="x"?"TEXTO DEL POST":"COPY / DESCRIPCIÓN"}</span><textarea value={currentCopy.description} onChange={e=>updateCopy("description",e.target.value)} rows={7} maxLength={activePlatform==="x"?280:5000} placeholder="Se completa desde el TXT…"/><small>{currentCopy.description.length}/{activePlatform==="x"?280:5000} caracteres</small></label>
          {activePlatform==="youtube"&&<label className="publish-field"><span>ETIQUETAS DE YOUTUBE (TAGS)</span><textarea value={currentCopy.tags} onChange={e=>updateCopy("tags",e.target.value)} rows={3} placeholder="Se completa desde el TXT…"/><small>{parsedTags.length} etiquetas</small></label>}
          <label className="publish-field"><span>HASHTAGS</span><textarea value={currentCopy.hashtags} onChange={e=>updateCopy("hashtags",e.target.value)} rows={2} placeholder="Se completa desde el TXT…"/></label>
          <label className="publish-field"><span>COMENTARIO PARA FIJAR</span><textarea value={currentCopy.pinnedComment} onChange={e=>updateCopy("pinnedComment",e.target.value)} rows={2} placeholder="Si el TXT incluye uno, aparece aquí…"/></label>
          <label className="publish-field"><span>TEXTO ALTERNATIVO / ACCESIBILIDAD</span><textarea value={currentCopy.altText} onChange={e=>updateCopy("altText",e.target.value)} rows={3} placeholder="Si el TXT incluye uno, aparece aquí…"/></label>
        </section>
        <section className="publish-card">
          <div className="publish-card-title"><span>03</span><div><h2>Elegir redes</h2><p>Podés seleccionar una, varias o todas.</p></div></div>
          <div className="publish-platforms">{PLATFORMS.map(platform=><label key={platform.id} className={selected.includes(platform.id)?"publish-platform selected":"publish-platform"}><input className="publish-platform-checkbox" type="checkbox" checked={selected.includes(platform.id)} onChange={()=>toggle(platform.id)} aria-label={"Seleccionar "+platform.name}/><span className="publish-platform-check" aria-hidden="true">{selected.includes(platform.id)?"✓":""}</span><span className="publish-platform-mark">{platform.mark}</span><span className="publish-platform-copy"><strong>{platform.name}</strong><small>{platform.note}</small></span></label>)}</div>
        </section>
        <section className="publish-card">
          <div className="publish-card-title"><span>04</span><div><h2>Configuración de publicación</h2><p>Los valores específicos se leen del TXT cuando están indicados; lo demás queda editable.</p></div></div>
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
        <div className="publish-summary"><p className="eyebrow">RESUMEN</p><h3>Tu publicación</h3><div className="publish-summary-row"><span>Video</span><strong>{active?.name || "Sin seleccionar"}</strong></div><div className="publish-summary-row"><span>Redes elegidas</span><strong>{selected.length} de 5</strong></div><div className="publish-summary-row"><span>Etiquetas</span><strong>{parsedTags.length}</strong></div><div className="publish-summary-row"><span>Programación</span><strong>{schedule==="now"?"Ahora":schedule==="draft"?"Borrador":"Programada"}</strong></div><div className="publish-selected-chips">{PLATFORMS.filter(p=>selected.includes(p.id)).map(p=><span key={p.id}>{p.name}</span>)}</div><button type="button" className="publish-review-button" disabled={!readyToReview} onClick={()=>setMessage("Metadatos listos para revisar. La publicación todavía no se envía: las redes aún no están conectadas.")}>Revisar publicación <span>→</span></button>{message&&<p className="publish-feedback" role="status">{message}</p>}<small>Modo de preparación: no se inicia sesión ni se publica contenido en ninguna red.</small></div>
        <div className="publish-tip"><strong>Un TXT, cinco destinos.</strong><p>El archivo asociado aporta los copies y metadatos de cada plataforma. Revisá el contenido antes de distribuirlo.</p></div>
      </aside>
    </div>
  </section>;
}
