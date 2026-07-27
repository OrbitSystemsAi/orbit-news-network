import { PageHeader } from "@/components/dashboard";
import { DemoBadge, Panel } from "@/components/ui";
const nodes: Array<[string, number, number, string]>=[["Apple",50,49,"#f5f8fc"],["Tim Cook",42,14,"#ff735d"],["iPhone 16",20,31,"#dbe5ee"],["Foxconn",74,24,"#8aaed0"],["China",87,49,"#ff8c55"],["Tariffs",78,72,"#e9ba7d"],["NVIDIA",50,85,"#78dc76"],["AI",25,82,"#7557e8"],["Supply Chain",14,58,"#8854dc"]];
const edges=[[0,1],[0,2],[0,3],[0,4],[0,6],[0,8],[1,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,2]];
export default function GraphPage(){return <><PageHeader mode="portal" title="Knowledge Graph" description="Explore relationships between entities"/><Panel title="Entity relationship canvas" action={<DemoBadge/>}><div style={{padding:12}}><svg viewBox="0 0 1000 560" role="img" aria-labelledby="graphTitle graphDesc" style={{width:"100%",height:"min(62vh,560px)",background:"radial-gradient(circle,#10253a,#08131e 68%)",borderRadius:8}}>
<title id="graphTitle">Demonstration knowledge graph</title><desc id="graphDesc">Apple connected to example people, products, companies, countries, policies, technologies, industries and supply-chain entities.</desc>
{edges.map(([a,b],i)=><line key={i} x1={nodes[a][1]+"%"} y1={nodes[a][2]+"%"} x2={nodes[b][1]+"%"} y2={nodes[b][2]+"%"} stroke={i%3===0?"#c1d7e8":"#31506b"} strokeDasharray={i%3===0?"0":"5 8"} strokeWidth="1.4"/>)}
{nodes.map(([label,x,y,color],i)=><g key={String(label)}><circle cx={x+"%"} cy={y+"%"} r={i===0?43:28} fill="#0b1723" stroke={color} strokeWidth="2"/><circle cx={x+"%"} cy={y+"%"} r={i===0?15:8} fill={color} opacity=".9"/><text x={x+"%"} y={`${Number(y)+9}%`} textAnchor="middle" fill="#eaf2f8" fontSize={i===0?15:12}>{label}</text></g>)}
</svg></div></Panel></>}
