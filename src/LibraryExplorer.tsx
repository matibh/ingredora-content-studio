import { useEffect, useMemo, useRef, useState } from "react";

type Production={id:string;title:string;status:string;videoUrl?:string;durationSeconds?:number;collection?:string;finalFileName?:string;createdAt?:string};
type StoredFile={id:string;name:string;path:string;folder:string;url:string;size:number;mimeType:string;uploadedAt:string};
type Folder={id:string;name:string;path:string;createdAt:string};
type Manifest={productions:Production[];folders?:Folder[];files?:StoredFile[]};
const ENDPOINT="https://xblqghhhchffuqkmzgta.supabase.co/functions/v1/manage-content-library";
const KEY="sb_publishable__TDF6zsAZEvsWgSkAntJgw_qxYYuUop";
const roots=["Publicidad","Series originales","Material compartido"];
function humanSize(bytes:number){if(bytes<1024)return bytes+" B";if(bytes<1048576)return (bytes/1024).toFixed(0)+" KB";return (bytes/1048576).toFixed(1)+" MB";}
function fileIcon(name:string,mime=""){const ext=name.split(".").pop()?.toLowerCase();if(mime.startsWith("video/")||["mp4","webm","mov","mkv"].includes(ext||""))return "▶";if(mime.startsWith("image/")||["png","jpg","jpeg","webp","gif","svg"].includes(ext||""))return "▧";if(["pdf","doc","docx","txt","md"].includes(ext||""))return "▤";if(["mp3","wav","ogg","m4a"].includes(ext||""))return "♫";return "▧";}
export default function LibraryExplorer({onPublish}:{onPublish:()=>void}){
 const [manifest,setManifest]=useState<Manifest>({productions:[],folders:[],files:[]});
 const [path,setPath]=useState("");
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [folderName,setFolderName]=useState("");
 const [showFolder,setShowFolder]=useState(false);
 const [file,setFile]=useState<File|null>(null);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [approval,setApproval]=useState("");
 const input=useRef<HTMLInputElement>(null);
 const refresh=async()=>{try{const r=await fetch("https://raw.githubusercontent.com/matibh/ingredora-content-studio/main/public/studio/productions.json?v="+Date.now(),{cache:"no-store"});if(!r.ok)throw new Error("No se pudo leer la biblioteca.");setManifest(await r.json());setError("");}catch(e){setError(e instanceof Error?e.message:"Error al sincronizar.");}finally{setLoading(false);}};
 useEffect(()=>{void refresh();},[]);
 const folders=manifest.folders||[],files=manifest.files||[],productions=manifest.productions||[];
 const currentFolders=useMemo(()=>folders.filter(f=>{const parent=f.path.includes("/")?f.path.slice(0,f.path.lastIndexOf("/")):"";return parent===path;}),[folders,path]);
 const currentFiles=useMemo(()=>{
  const custom=files.filter(f=>(f.folder||"")===path).map(f=>({id:f.id,name:f.name,url:f.url,size:f.size,kind:"file" as const,mime:f.mimeType,detail:humanSize(f.size),date:f.uploadedAt}));
  const vids=productions.filter(p=>p.status==="ready"&&p.videoUrl&&((p.collection==="series"?"Series originales":"Publicidad")===path)).map(p=>({id:p.id,name:p.finalFileName||p.title+".mp4",url:p.videoUrl!,size:0,kind:"video" as const,mime:"video/mp4",detail:"Video final · "+(p.durationSeconds?Math.round(p.durationSeconds)+" s":"Duración sin datos"),date:p.createdAt}));
  return [...vids,...custom];
 },[files,productions,path]);
 const crumbs=path?path.split("/").map((part,i)=>({name:part,path:path.split("/").slice(0,i+1).join("/")})):[];
 const post=async(form:FormData)=>{const r=await fetch(ENDPOINT,{method:"POST",headers:{apikey:KEY,"x-studio-approval-key":approval},body:form});const data=await r.json();if(!r.ok||!data.ok)throw new Error(data.error||"No se pudo completar la operación.");return data;};
 const createFolder=async()=>{if(!folderName.trim()||busy)return;setBusy(true);setMessage("");try{const form=new FormData();form.append("action","create-folder");form.append("name",folderName.trim());form.append("parent",path);await post(form);setFolderName("");setShowFolder(false);setMessage("Carpeta creada.");await refresh();}catch(e){setMessage(e instanceof Error?e.message:"No se pudo crear la carpeta.");}finally{setBusy(false);}};
 const uploadFile=async()=>{if(!file||busy)return;setBusy(true);setMessage("");try{const form=new FormData();form.append("action","upload-file");form.append("file",file);form.append("folder",path);await post(form);setFile(null);if(input.current)input.current.value="";setMessage("Archivo incorporado a la biblioteca.");await refresh();}catch(e){setMessage(e instanceof Error?e.message:"No se pudo subir el archivo.");}finally{setBusy(false);}};
 return <section className="library-explorer" aria-label="Explorador de archivos de Ingredora">
  <div className="library-titlebar"><div><p className="eyebrow">INGREDORA CONTENT STUDIO</p><h2>Biblioteca</h2><span>Todos tus videos, renders y materiales en un solo lugar.</span></div><div className="library-count"><strong>{productions.filter(p=>p.status==="ready"&&p.videoUrl).length+files.length}</strong><small>ARCHIVOS</small></div></div>
  <div className="explorer-toolbar">
   <div className="explorer-nav"><button type="button" onClick={()=>setPath("")} aria-label="Inicio">⌂</button><span>›</span>{crumbs.map(c=><span className="crumb" key={c.path}><button type="button" onClick={()=>setPath(c.path)}>{c.name}</button>›</span>)}<strong>{path.split("/").pop()||"Este equipo"}</strong></div>
   <div className="explorer-actions"><button type="button" onClick={()=>setShowFolder(v=>!v)}>＋ Nueva carpeta</button><button type="button" onClick={()=>input.current?.click()}>↑ Subir archivo</button><button className="explorer-publish-button" type="button" onClick={onPublish}>↗ Subir a redes</button></div>
  </div>
  <input ref={input} className="explorer-hidden-input" type="file" onChange={e=>setFile(e.target.files?.[0]||null)}/>
  {(showFolder||file)&&<div className="explorer-create-panel">
   {showFolder&&<div className="explorer-new-folder"><input value={folderName} onChange={e=>setFolderName(e.target.value)} placeholder="Nombre de la carpeta nueva" maxLength={70}/><button type="button" disabled={!folderName.trim()||busy||!approval.trim()} onClick={createFolder}>Crear carpeta</button><button className="explorer-cancel" type="button" onClick={()=>setShowFolder(false)}>Cancelar</button></div>}
   {file&&<div className="explorer-file-upload"><span>▤ {file.name} · {humanSize(file.size)}</span><button type="button" disabled={busy||!approval.trim()} onClick={uploadFile}>{busy?"Subiendo…":"Confirmar subida"}</button><button className="explorer-cancel" type="button" onClick={()=>{setFile(null);if(input.current)input.current.value="";}}>Quitar</button></div>}
   <label className="explorer-auth">AUTORIZACIÓN PARA MODIFICAR LA BIBLIOTECA<input type="password" value={approval} onChange={e=>setApproval(e.target.value)} placeholder="Contraseña de aprobación"/></label>
   <small>Archivos de hasta 40 MB. Las carpetas y archivos se guardan en el repositorio central.</small>
  </div>}
  {message&&<p className="explorer-message" role="status">{message}</p>}{error&&<p className="explorer-message error">{error}</p>}
  <div className="explorer-body"><aside className="explorer-sidebar"><strong>ACCESO RÁPIDO</strong><button className={!path?"selected":""} type="button" onClick={()=>setPath("")}>▣ Este equipo</button>{roots.map(r=><button key={r} className={path===r?"selected":""} type="button" onClick={()=>setPath(r)}>▰ {r}</button>)}<div className="explorer-sidebar-divider"/><strong>CARPETAS</strong>{folders.filter(f=>!f.path.includes("/")).map(f=><button key={f.path} className={path===f.path?"selected":""} type="button" onClick={()=>setPath(f.path)}>▰ {f.name}</button>)}</aside>
   <div className="explorer-content"><div className="explorer-column-head"><span>Nombre</span><span>Tipo</span><span>Fecha / tamaño</span></div>
    {loading?<div className="explorer-empty">Cargando biblioteca…</div>:<>
     {path===""&&roots.map(root=><button className="explorer-row folder-row" key={root} type="button" onDoubleClick={()=>setPath(root)} onClick={()=>setPath(root)}><span className="explorer-name"><i className="folder-icon">▰</i>{root}</span><span>Carpeta del sistema</span><span>—</span></button>)}
     {currentFolders.map(f=><button className="explorer-row folder-row" key={f.path} type="button" onClick={()=>setPath(f.path)}><span className="explorer-name"><i className="folder-icon">▰</i>{f.name}</span><span>Carpeta</span><span>{new Date(f.createdAt).toLocaleDateString("es-AR")}</span></button>)}
     {currentFiles.map(f=><div className="explorer-row" key={f.id}><span className="explorer-name"><i className="file-icon">{fileIcon(f.name,f.mime)}</i><a href={f.url} target="_blank" rel="noreferrer">{f.name}</a></span><span>{f.kind==="video"?"Video MP4":f.mime||"Archivo"}</span><span>{f.detail}</span></div>)}
     {!currentFolders.length&&!currentFiles.length&&path!==""&&<div className="explorer-empty">Esta carpeta está vacía. Podés crear subcarpetas o subir archivos.</div>}
    </>}
   </div>
  </div>
  <div className="explorer-footer"><span>▣ {currentFolders.length} carpetas · {currentFiles.length} archivos</span><span>Biblioteca sincronizada con Ingredora Studio</span></div>
 </section>;
}
