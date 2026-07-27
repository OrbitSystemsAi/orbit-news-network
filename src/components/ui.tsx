import type { LucideIcon } from "lucide-react";

export function DemoBadge() {
  return <span style={{display:"inline-flex",alignItems:"center",gap:6,border:"1px solid #31506d",borderRadius:999,padding:"4px 8px",fontSize:10,color:"#9bc8e5",background:"#0b1c2b"}}><span style={{width:5,height:5,borderRadius:9,background:"#38bdf8"}}/>Demo data</span>;
}

export function Panel({ title, action, children, className = "" }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return <section className={`panel ${className}`}><header style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 15px",borderBottom:"1px solid rgba(35,56,79,.64)"}}><h2 className="display" style={{fontSize:12,fontWeight:650,margin:0}}>{title}</h2>{action}</header>{children}</section>;
}

export function MetricCard({ label, value, trend, icon: Icon }: { label: string; value: string; trend: string; icon?: LucideIcon }) {
  return <article className="panel" style={{padding:"14px 13px",minHeight:88,position:"relative"}}>
    <div style={{display:"flex",justifyContent:"space-between",gap:8,color:"#90a4b8",fontSize:10}}><span>{label}</span>{Icon && <Icon size={13}/>}</div>
    <strong className="display" style={{display:"block",fontSize:20,marginTop:7,letterSpacing:"-.03em"}}>{value}</strong>
    <span className="positive" style={{display:"block",fontSize:9,marginTop:4}}>↗ {trend}</span>
  </article>;
}

export function Sparkline({ color = "#279df7", compact = false }: { color?: string; compact?: boolean }) {
  return <svg viewBox="0 0 220 62" role="img" aria-label="Demonstration activity trend" style={{width:"100%",height:compact?52:96,overflow:"visible"}}>
    {[12,32,52].map(y=><line key={y} x1="0" y1={y} x2="220" y2={y} stroke="#21354a" strokeWidth=".7"/>)}
    <path d="M0 48 L12 42 L24 46 L36 30 L48 38 L60 27 L72 33 L84 20 L96 28 L108 44 L120 36 L132 39 L144 29 L156 22 L168 34 L180 26 L192 18 L204 29 L220 22" fill="none" stroke={color} strokeWidth="2"/>
    {[36,84,108,156,192].map((x,i)=><circle key={x} cx={x} cy={[30,20,44,22,18][i]} r="2.4" fill={color}/>)}
  </svg>;
}

export function BarList({ items }: { items: {label:string; value:number; color?:string}[] }) {
  return <div style={{padding:"13px 15px",display:"grid",gap:12}}>{items.map(item=><div key={item.label} style={{display:"grid",gridTemplateColumns:"92px 1fr 34px",alignItems:"center",gap:9,fontSize:10}}>
    <span>{item.label}</span><span style={{height:3,background:"#203349",borderRadius:8,overflow:"hidden"}}><span style={{display:"block",height:"100%",width:`${item.value}%`,background:item.color||"#3da5ff"}}/></span><span style={{textAlign:"right"}}>{item.value}%</span>
  </div>)}</div>;
}
