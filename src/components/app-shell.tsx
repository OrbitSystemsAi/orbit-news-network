"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Activity, AlertTriangle, BarChart3, BookOpen, Boxes, Braces, CircleUserRound, FileKey, FolderKanban, GitBranch, Home, Menu, Network, Newspaper, Rss, Settings, ShieldCheck, Users, X } from "lucide-react";
import { Brand } from "./brand";
import { SignOutButton } from "./sign-out-button";

const adminItems = [
  ["Overview","/admin",Home],["Sources","/admin/sources",Rss],["Stories","/admin/stories",Newspaper],["Publications","/admin/publications",BookOpen],["Distribution","/admin/distribution",Network],["Moderation","/admin/moderation",ShieldCheck],["Topics","/admin/topics",Boxes],
  ["Entities","/admin/entities",CircleUserRound],["Relationships","/admin/relationships",GitBranch],["Alerts","/admin/alerts",AlertTriangle],
  ["Customers","/admin/customers",Users],["API Management","/admin/api-management",Braces],["System Health","/admin/system-health",Activity],["Settings","/admin/settings",Settings],
] as const;
const portalItems = [
  ["Overview","/portal",Home],["Projects","/portal/projects",FolderKanban],["Publications","/portal/publications",BookOpen],["Content","/portal/content",Newspaper],["Distribution","/portal/distribution",Network],["Feeds","/portal/feeds",Rss],["API Keys","/portal/api-keys",FileKey],
  ["Integrations","/portal/integrations",Network],["Analytics","/portal/analytics",BarChart3],["Knowledge Graph","/portal/knowledge-graph",GitBranch],
  ["Alerts","/portal/alerts",AlertTriangle],["Documentation","/developers",BookOpen],["Settings","/portal/settings",Settings],
] as const;

export function AppShell({ mode, children, identity }: { mode: "admin" | "portal"; children: React.ReactNode; identity?: { name?: string | null; email?: string | null } | null }) {
  const [open,setOpen]=useState(false);
  const pathname=usePathname();
  const items=mode==="admin"?adminItems:portalItems;
  return <div className="app-shell" style={{minHeight:"100vh",display:"grid",gridTemplateColumns:"var(--sidebar, 220px) minmax(0,1fr)"}}>
    <button className="mobile-only" onClick={()=>setOpen(true)} aria-label="Open navigation" style={{position:"fixed",zIndex:30,left:16,top:16,width:42,height:42,alignItems:"center",justifyContent:"center",background:"#102033",color:"white",border:"1px solid #23384f",borderRadius:9}}><Menu size={20}/></button>
    {open&&<button onClick={()=>setOpen(false)} aria-label="Close navigation overlay" style={{position:"fixed",inset:0,zIndex:38,border:0,background:"rgba(0,0,0,.65)"}}/>}
    <aside className={`app-sidebar ${open?"open":""}`} style={{position:"fixed",zIndex:40,inset:"0 auto 0 0",width:220,display:"flex",flexDirection:"column",padding:"24px 13px 14px",background:"linear-gradient(180deg,#08131e,#0a1621)",borderRight:"1px solid #1d3043",transform:open?"translateX(0)":undefined}}>
      <button className="mobile-only" onClick={()=>setOpen(false)} aria-label="Close navigation" style={{position:"absolute",right:12,top:12,border:0,background:"transparent",color:"#90a4b8"}}><X/></button>
      <div style={{padding:"0 11px 24px"}}><Brand/></div>
      <nav aria-label={`${mode} navigation`} style={{display:"grid",gap:4}}>
        {items.map(([label,href,Icon])=>{const active=pathname===href; return <Link key={href} href={href} onClick={()=>setOpen(false)} style={{display:"flex",alignItems:"center",gap:11,padding:"9px 11px",borderRadius:6,fontSize:11,color:active?"#fff":"#c0ccd7",background:active?"linear-gradient(90deg,#123c6a,#0c2742)":"transparent"}}><Icon size={15} strokeWidth={1.7}/>{label}</Link>})}
      </nav>
      <div style={{marginTop:"auto",border:"1px solid #1e3347",borderRadius:8,padding:10,display:"flex",alignItems:"center",gap:9}}>
        <div style={{width:28,height:28,borderRadius:30,display:"grid",placeItems:"center",background:"#8db9ff",color:"#071018",fontSize:10,fontWeight:800}}>{mode==="admin"?"AS":"AC"}</div>
        <div style={{minWidth:0,flex:1}}><div style={{fontSize:10,overflow:"hidden",textOverflow:"ellipsis"}}>{identity?.name || "ONN Administrator"}</div><div className="muted" style={{fontSize:8,overflow:"hidden",textOverflow:"ellipsis"}}>{identity?.email || "Migration session"}</div></div>
        {identity ? <SignOutButton/> : null}
      </div>
    </aside>
    <main className="app-main" style={{gridColumn:"2"}}>{children}</main>
  </div>;
}
