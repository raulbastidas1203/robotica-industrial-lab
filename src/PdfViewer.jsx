import React,{useEffect,useState} from 'react';
export default function PdfViewer({file,assetUrl}){
  const [page,setPage]=useState(0),[zoom,setZoom]=useState(1);
  useEffect(()=>{setPage(0);setZoom(1);},[file.id]);
  const current=Math.min(page,file.pages.length-1);
  return <><div className="pdf-page-controls"><button disabled={current===0} onClick={()=>setPage(current-1)}>Anterior</button><span>Página {current+1} de {file.pages.length}</span><button disabled={current===file.pages.length-1} onClick={()=>setPage(current+1)}>Siguiente</button><div className="pdf-zoom"><button aria-label="Reducir zoom del documento" disabled={zoom<=1} onClick={()=>setZoom(Math.max(1,zoom-.25))}>−</button><span>{Math.round(zoom*100)}%</span><button aria-label="Aumentar zoom del documento" disabled={zoom>=2} onClick={()=>setZoom(Math.min(2,zoom+.25))}>+</button></div></div><div className="pdf-document"><img key={file.pages[current]} style={{width:`${zoom*100}%`}} src={assetUrl(file.pages[current])} alt={`Página ${current+1} del documento ${file.name}`} /></div></>;
}
