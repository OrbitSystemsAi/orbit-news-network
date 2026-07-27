export default async function AccessPage({ searchParams }: { searchParams: Promise<{ returnTo?: string; error?: string }> }) {
  const query = await searchParams;
  const returnTo = query.returnTo?.startsWith("/") && !query.returnTo.startsWith("//") ? query.returnTo : "/portal";
  return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#050b11",color:"#eef6ff",padding:24}}>
    <form method="post" action="/api/internal/session" style={{width:"min(420px,100%)",padding:28,border:"1px solid #29445d",borderRadius:10,background:"#09131d"}}>
      <p style={{fontSize:11,letterSpacing:1.5,color:"#70b7ff"}}>ORBIT NEWS NETWORK</p>
      <h1 style={{fontSize:24}}>Private MVP access</h1>
      <p style={{color:"#93a8bb",lineHeight:1.6}}>Administrative and subscriber surfaces require temporary operator access.</p>
      <label style={{display:"grid",gap:7,fontSize:12}}>Administrative access key
        <input name="accessKey" type="password" required autoComplete="current-password" style={{padding:11,background:"#050b11",border:"1px solid #35516a",borderRadius:6,color:"white"}} />
      </label>
      <input type="hidden" name="returnTo" value={returnTo} />
      {query.error && <p role="alert" style={{color:"#ff9c9c",fontSize:12}}>Access was not accepted.</p>}
      <button type="submit" style={{marginTop:18,padding:"10px 14px",background:"#176cc0",color:"white",border:0,borderRadius:6}}>Continue</button>
    </form>
  </main>;
}
