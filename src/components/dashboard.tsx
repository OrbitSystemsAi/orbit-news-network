import { Activity, Clock3, Database, Gauge, Layers3, RadioTower } from "lucide-react";
import { BarList, DemoBadge, MetricCard, Panel, Sparkline } from "./ui";

const metricsAdmin = [
  ["Stories Processed","32,984","18.2%",Database],["New Stories","18,021","22.4%",RadioTower],["Duplicates Removed","12,447","16.7%",Layers3],
  ["Verified","99.1%","0.6%",Gauge],["Avg Processing Time","1.8 sec","0.3 sec",Clock3],["Projects Served","18.2M","24.1%",Activity],
] as const;
const metricsPortal = [
  ["Stories Delivered","18,242","12.4%",Database],["API Requests","1.8M","8.7%",RadioTower],["Avg Response Time","312ms","15ms",Clock3],
  ["Cache Hit Rate","94%","3%",Gauge],["Relevance Score","96%","4%",Layers3],["API Confidence","98%","2%",Activity],
] as const;

export function PageHeader({ mode, title="Overview", description="Real-time intelligence at a glance" }: {mode:"admin"|"portal";title?:string;description?:string}) {
  return <header className="page-header" style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:18,marginBottom:21}}>
    <div><h1 className="display" style={{fontSize:23,letterSpacing:"-.035em",margin:"0 0 5px"}}>{mode==="portal"&&title==="Overview"?"Good Morning, Acme Corporation 👋":title}</h1><p className="muted" style={{fontSize:10,margin:0}}>{description}</p></div>
    <div style={{display:"flex",alignItems:"center",gap:8}}><DemoBadge/><select aria-label="Time range" style={{background:"#0c1824",border:"1px solid #23384f",color:"#dce8f2",padding:"7px 10px",borderRadius:6,fontSize:9}}><option>Last 24 Hours</option></select></div>
  </header>;
}

function Pipeline() {
 const stages=[["Sources","327","Live Feeds","#9fb5c8"],["Ingestion Queue","4,823","In Queue","#55da82"],["API Processing","18,021","Processing","#38bdf8"],["Knowledge Graph","18,021","Entities Linked","#37cdf5"],["Forecast Engine","3,214","Signals Generated","#ff735d"],["API Distribution","18.2M","Requests Served","#a879ff"]];
 return <Panel title="Processing Pipeline" action={<span style={{fontSize:9,color:"#36b7ff"}}>View Pipeline →</span>}><div style={{display:"grid",gridTemplateColumns:"repeat(6,minmax(105px,1fr))",gap:10,padding:14,overflowX:"auto"}}>
   {stages.map(([name,value,sub,color],i)=><div key={name} style={{position:"relative",padding:"14px 8px 10px",minWidth:105,textAlign:"center",background:"#0d1b29",border:"1px solid #20364c",borderRadius:7}}>
    {i<5&&<span style={{position:"absolute",right:-15,top:"50%",color:i===1?"#57d98d":"#7ea4c0",zIndex:3}}>→</span>}
    <div style={{width:34,height:34,margin:"0 auto 7px",borderRadius:8,border:`1px solid ${color}`,display:"grid",placeItems:"center",color}}>◈</div>
    <div style={{fontSize:10,color}}>{name}</div><strong className="display" style={{display:"block",fontSize:18,marginTop:5}}>{value}</strong><div className="muted" style={{fontSize:8}}>{sub}</div>
   </div>)}
 </div></Panel>;
}

export function OverviewDashboard({ mode }: {mode:"admin"|"portal"}) {
 const metrics=mode==="admin"?metricsAdmin:metricsPortal;
 return <div className="page-grid"><PageHeader mode={mode}/>
  <div className="metrics">{metrics.map(([a,b,c,d])=><MetricCard key={a} label={a} value={b} trend={c} icon={d}/>)}</div>
  {mode==="admin"?<Pipeline/>:<div className="two-col"><Panel title="API Requests"><div style={{padding:"12px 15px"}}><Sparkline/></div></Panel><Panel title="Top Topics Delivered"><BarList items={[{label:"Technology",value:86},{label:"Finance",value:72},{label:"Markets",value:58},{label:"Economy",value:44},{label:"Politics",value:29},{label:"Other",value:22}]}/></Panel></div>}
  <div className="three-col">
   <Panel title={mode==="admin"?"Recent Processing Events":"Recent Activity"}><ActivityList/></Panel>
   <Panel title={mode==="admin"?"Top Topics":"System Status"}>{mode==="admin"?<BarList items={[{label:"Technology",value:86},{label:"Markets",value:72},{label:"Politics",value:54},{label:"Economy",value:47},{label:"Health",value:38}]}/>:<StatusList/>}</Panel>
   <Panel title={mode==="admin"?"Source Health":"Project Context"}>{mode==="admin"?<SourceList/>:<ProjectContext/>}</Panel>
  </div>
  {mode==="admin"&&<div className="chart-grid">{["System Health","API Requests (24h)","Average Latency"].map((title,i)=><Panel key={title} title={title}><div style={{padding:"10px 14px"}}><Sparkline compact color={i===0?"#00c853":"#279df7"}/></div></Panel>)}</div>}
 </div>;
}

function ActivityList(){return <div style={{padding:"12px 15px",display:"grid",gap:11}}>{["Feed Signals Rate Cut Possible in June","Apple Expands AI Partnership","Tensions Escalate in Taiwan Strait","API request to /v1/stories","Webhook delivered: Market Update"].map((x,i)=><div key={x} style={{display:"grid",gridTemplateColumns:"44px 1fr auto",gap:7,fontSize:9}}><span className={i<2?"positive":"warning"}>{i*5+2}m ago</span><span>{x}</span><span className="positive">200 OK</span></div>)}</div>}
function SourceList(){return <div style={{padding:"12px 15px",display:"grid",gap:11}}>{["Reuters","AP News","Bloomberg","NASA","SEC Filings","Twitter/X"].map((x,i)=><div key={x} style={{display:"grid",gridTemplateColumns:"1fr auto 62px",gap:9,alignItems:"center",fontSize:9}}><span>{x}</span><span className={i===5?"warning":"positive"}>{i===5?"Degraded":"Healthy"}</span><span style={{height:4,background:"#20354a",borderRadius:8}}><span style={{display:"block",height:"100%",width:i===5?"85%":"98%",background:i===5?"#ffc107":"#48dc72"}}/></span></div>)}</div>}
function StatusList(){return <div style={{padding:"12px 15px",display:"grid",gap:15}}>{["News Ingestion","AI Processing","API Service","Webhook Service","All Systems"].map(x=><div key={x} style={{display:"flex",justifyContent:"space-between",fontSize:9}}><span className="muted">{x}</span><span className="positive">Operational</span></div>)}</div>}
function ProjectContext(){return <div style={{padding:15}}><div className="eyebrow">Active project</div><strong className="display" style={{fontSize:18,display:"block",marginTop:8}}>Career Pivot</strong><p className="muted" style={{fontSize:10,lineHeight:1.6}}>Production environment · project-scoped access · server-to-server integration.</p></div>}
