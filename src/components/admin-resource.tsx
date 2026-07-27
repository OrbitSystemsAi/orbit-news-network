"use client";

import { useState } from "react";
import { Panel } from "./ui";

const button = {background:"#123d68",border:"1px solid #256399",borderRadius:5,color:"white",padding:"8px 11px"};
const input = {background:"#08131e",border:"1px solid #29445d",borderRadius:5,color:"white",padding:9};

export function AdminResource({endpoint,label,mutable=false}:{endpoint:string;label:string;mutable?:boolean}) {
  const [data,setData] = useState<unknown>(null);
  const [payload,setPayload] = useState("{}");
  const [message,setMessage] = useState("Use the private MVP access gate to load operational data.");

  async function load() {
    const response = await fetch(endpoint);
    const json = await response.json();
    if (response.ok) {
      setData(json.data);
      setMessage(`${label} loaded from the database.`);
    } else setMessage(json.error?.message);
  }

  async function mutate(method:"POST"|"PATCH") {
    let body;
    try { body = JSON.parse(payload); } catch { setMessage("Mutation JSON is invalid."); return; }
    const response = await fetch(endpoint,{method,headers:{"content-type":"application/json"},body:JSON.stringify(body)});
    const json = await response.json();
    setMessage(response.ok?`${label} saved.`:json.error?.message);
    if(response.ok) await load();
  }

  return <div className="page-grid">
    <Panel title="Private MVP session"><div style={{padding:15}}><button onClick={load} style={button}>Load {label.toLowerCase()}</button></div><p className="muted" role="status" style={{padding:"0 15px",fontSize:10}}>{message}</p></Panel>
    {mutable&&<Panel title={`${label} operation`}><div style={{padding:15}}><p className="muted" style={{fontSize:10}}>Use a complete validated JSON object. POST creates; PATCH updates an existing ID.</p><textarea aria-label={`${label} JSON`} value={payload} onChange={event=>setPayload(event.target.value)} style={{...input,width:"100%",minHeight:130,fontFamily:"monospace"}}/><div style={{display:"flex",gap:8,marginTop:8}}><button onClick={()=>mutate("POST")} style={button}>Create</button><button onClick={()=>mutate("PATCH")} style={button}>Update</button></div></div></Panel>}
    <Panel title={label}><pre className="mono" style={{padding:15,overflowX:"auto",fontSize:10,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{data?JSON.stringify(data,null,2):"No operational records loaded."}</pre></Panel>
  </div>;
}
