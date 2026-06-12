import { useState, useEffect, useCallback, useRef, createContext, useContext } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   QUOTEFLOW PRO v6.0 — MODULE 1: AUTH + SHELL + THEME
   Himalaya Terpenes Pvt. Ltd. · Premium B2B CRM
   ═══════════════════════════════════════════════════════════════════════════ */

const C = {
  navy:"#0D1B2A",navy2:"#152236",navy3:"#1E3248",slate:"#2D4A6E",
  blue:"#1A6FDB",blue2:"#1558B0",blueL:"#E8F1FB",
  teal:"#0F8A6F",tealL:"#E3F5F0",
  amber:"#D97706",amberL:"#FEF3C7",
  red:"#DC2626",redL:"#FEE2E2",
  green:"#16A34A",greenL:"#DCFCE7",
  purple:"#7C3AED",purpleL:"#EDE9FE",
  g50:"#F8FAFC",g100:"#F1F5F9",g200:"#E2E8F0",g300:"#CBD5E1",
  g400:"#94A3B8",g500:"#64748B",g600:"#475569",g700:"#334155",
  g800:"#1E293B",g900:"#0F172A",w:"#FFFFFF",
};

const USERS=[
  {id:"U001",u:"shishir",p:"htpl@2025",name:"Shishir",role:"Managing Director",ini:"SK",tier:"admin"},
  {id:"U002",u:"sales1",p:"sales@2025",name:"Sales Exec 1",role:"Sales Executive",ini:"S1",tier:"sales"},
  {id:"U003",u:"sales2",p:"sales@2025",name:"Sales Exec 2",role:"Sales Executive",ini:"S2",tier:"sales"},
  {id:"U004",u:"vpsales",p:"vp@2025",name:"VP Sales",role:"VP Sales",ini:"VP",tier:"manager"},
  {id:"U005",u:"coordinator",p:"coord@2025",name:"Sales Coordinator",role:"Sales Coordinator",ini:"SC",tier:"coordinator"},
];

const PERMS={
  admin:{dashboard:1,inquiries:1,quotations:1,newQuote:1,pipeline:1,sampling:1,customers:1,reports:1,settings:1},
  manager:{dashboard:1,inquiries:1,quotations:1,newQuote:1,pipeline:1,sampling:1,customers:1,reports:1,settings:0},
  sales:{dashboard:1,inquiries:1,quotations:1,newQuote:1,pipeline:1,sampling:1,customers:1,reports:0,settings:0},
  coordinator:{dashboard:1,inquiries:1,quotations:1,newQuote:0,pipeline:1,sampling:1,customers:1,reports:0,settings:0},
};

const AuthCtx=createContext(null);
const ToastCtx=createContext(null);

// ── SVG Icon helper ──
const I=(d,s=16)=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:s,height:s,flexShrink:0}}>{d}</svg>;
const Ic={
  clip:I(<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>),
  mail:I(<><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>),
  plus:I(<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>),
  clock:I(<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>),
  grid:I(<><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></>),
  users:I(<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>),
  chart:I(<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>),
  gear:I(<><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/></>),
  dash:I(<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>),
  sync:I(<><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></>,14),
  search:I(<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,14),
  logout:I(<><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>),
  lock:I(<><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>,20),
  user:I(<><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,20),
  eye:I(<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,16),
  eyeOff:I(<><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>,16),
  rupee:I(<><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>,16),
  trend:I(<><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>,16),
};

const NAV=[
  {t:"Overview",items:[{id:"dashboard",label:"Dashboard",ic:"dash",pm:"dashboard"},{id:"inquiries",label:"Inquiries",ic:"mail",pm:"inquiries",badge:5}]},
  {t:"Sales Pipeline",items:[{id:"quotations",label:"Quotations",ic:"clip",pm:"quotations"},{id:"new-quote",label:"New Quotation",ic:"plus",pm:"newQuote"},{id:"pipeline",label:"Pipeline",ic:"clock",pm:"pipeline"},{id:"sampling",label:"Sampling",ic:"grid",pm:"sampling",badge:3}]},
  {t:"Customers",items:[{id:"customers",label:"Customer Master",ic:"users",pm:"customers"}]},
  {t:"Reports",items:[{id:"reports",label:"Analytics",ic:"chart",pm:"reports"},{id:"settings",label:"Integrations",ic:"gear",pm:"settings"}]},
];

const PTITLES={dashboard:"Dashboard",inquiries:"Inquiries",quotations:"Quotations","new-quote":"New Quotation",pipeline:"Sales Pipeline",sampling:"Sampling Tracker",customers:"Customer Master",reports:"Analytics",settings:"Integrations"};

// ── Toast Provider ──
function ToastProv({children}){
  const[ts,sT]=useState([]);const r=useRef(0);
  const show=useCallback((m,t="default")=>{const id=++r.current;sT(p=>[...p,{id,m,t}]);setTimeout(()=>sT(p=>p.filter(x=>x.id!==id)),3200);},[]);
  return <ToastCtx.Provider value={show}>{children}
    <div style={{position:"fixed",bottom:24,right:24,zIndex:999,display:"flex",flexDirection:"column",gap:8}}>
      {ts.map(t=><div key={t.id} style={{background:t.t==="success"?C.green:t.t==="error"?C.red:C.g900,color:"#fff",padding:"10px 16px",borderRadius:8,fontSize:13,boxShadow:"0 12px 32px rgba(0,0,0,.10)",display:"flex",alignItems:"center",gap:8,maxWidth:360,animation:"toastIn .25s ease"}}>
        {t.t==="success"&&"✓"}{t.t==="error"&&"✕"} {t.m}
      </div>)}
    </div>
  </ToastCtx.Provider>;
}

// ── Shared UI ──
function Badge({type="blue",children}){
  const s={blue:{background:C.blueL,color:C.blue2},teal:{background:C.tealL,color:C.teal},amber:{background:C.amberL,color:C.amber},red:{background:C.redL,color:C.red},green:{background:C.greenL,color:C.green},purple:{background:C.purpleL,color:C.purple},gray:{background:C.g100,color:C.g600}};
  return <span style={{display:"inline-flex",alignItems:"center",padding:"3px 9px",borderRadius:20,fontSize:11,fontWeight:500,gap:4,...(s[type]||s.blue)}}>{children}</span>;
}

function TierBadge({tier}){
  const m={gold:{l:"Gold",bg:"#FEF3C7",c:"#92400E",i:"★"},silver:{l:"Silver",bg:C.g100,c:C.g700,i:"◈"},bronze:{l:"Bronze",bg:"#FEF3C7",c:"#78350F",i:"◉"},new:{l:"New Lead",bg:C.purpleL,c:C.purple,i:"✦"}};
  const v=m[tier]||m.new;
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,background:v.bg,color:v.c}}>{v.i} {v.l}</span>;
}

function StatusBadge({status}){const m={Draft:"gray",Sent:"blue",Negotiating:"amber",Won:"teal",Lost:"red",lead:"gray",quoted:"blue",sampling:"purple",negotiating:"amber",won:"teal",lost:"red"};return <Badge type={m[status]||"gray"}>{status}</Badge>;}

function StatCard({label,value,change,dir,color="blue",icon}){
  const m={blue:{a:C.blue,b:C.blueL},teal:{a:C.teal,b:C.tealL},amber:{a:C.amber,b:C.amberL},purple:{a:C.purple,b:C.purpleL}};
  const v=m[color]||m.blue;
  return <div style={{background:C.w,border:`1px solid ${C.g200}`,borderRadius:14,padding:"18px 20px",boxShadow:"0 1px 3px rgba(0,0,0,.08)",position:"relative",overflow:"hidden"}}>
    <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:v.a}}/>
    <div style={{fontSize:11,color:C.g500,fontWeight:500,textTransform:"uppercase",letterSpacing:".06em"}}>{label}</div>
    <div style={{fontSize:26,fontWeight:600,color:C.g900,margin:"6px 0 2px",fontFamily:"'Playfair Display',serif"}}>{value}</div>
    {change&&<div style={{fontSize:12,display:"flex",alignItems:"center",gap:4,color:dir==="up"?C.green:C.red}}>{dir==="up"?"↑":"↓"} {change}</div>}
    <div style={{position:"absolute",top:18,right:18,width:36,height:36,borderRadius:8,background:v.b,display:"flex",alignItems:"center",justifyContent:"center"}}>{icon}</div>
  </div>;
}

function Card({title,subtitle,hRight,footer,children,style:cs}){
  return <div style={{background:C.w,borderRadius:14,border:`1px solid ${C.g200}`,boxShadow:"0 1px 3px rgba(0,0,0,.08)",...cs}}>
    {(title||hRight)&&<div style={{padding:"18px 22px 14px",borderBottom:`1px solid ${C.g100}`,display:"flex",alignItems:"center",gap:10}}>
      <div>{title&&<div style={{fontSize:14,fontWeight:600,color:C.g900}}>{title}</div>}{subtitle&&<div style={{fontSize:12,color:C.g500,marginTop:2}}>{subtitle}</div>}</div>
      {hRight&&<div style={{marginLeft:"auto"}}>{hRight}</div>}
    </div>}
    <div style={{padding:"18px 22px"}}>{children}</div>
    {footer&&<div style={{padding:"12px 22px",borderTop:`1px solid ${C.g100}`,background:C.g50,borderRadius:"0 0 14px 14px",display:"flex",alignItems:"center",justifyContent:"flex-end",gap:8}}>{footer}</div>}
  </div>;
}

function Modal({open,onClose,title,subtitle,width=720,footer,children}){
  if(!open)return null;
  return <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",animation:"fadeIn .15s ease"}}>
    <div style={{background:C.w,borderRadius:14,boxShadow:"0 12px 32px rgba(0,0,0,.10)",width,maxWidth:"95vw",maxHeight:"90vh",display:"flex",flexDirection:"column",animation:"fadeUp .2s ease"}}>
      <div style={{padding:"18px 24px",borderBottom:`1px solid ${C.g200}`,display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
        <div><div style={{fontSize:15,fontWeight:600,color:C.g900}}>{title}</div>{subtitle&&<div style={{fontSize:12,color:C.g400,marginTop:2}}>{subtitle}</div>}</div>
        <button onClick={onClose} style={{marginLeft:"auto",width:28,height:28,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:C.g400,background:"none",border:"none",fontSize:16}}>✕</button>
      </div>
      <div style={{padding:24,overflowY:"auto",flex:1}}>{children}</div>
      {footer&&<div style={{padding:"14px 24px",borderTop:`1px solid ${C.g200}`,display:"flex",alignItems:"center",justifyContent:"flex-end",gap:8,flexShrink:0}}>{footer}</div>}
    </div>
  </div>;
}

function Drawer({open,onClose,title,subtitle,hAct,children}){
  return <>{open&&<div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.2)",zIndex:199}}/>}
    <div style={{position:"fixed",right:0,top:0,bottom:0,width:520,background:C.w,boxShadow:"-8px 0 32px rgba(0,0,0,.12)",zIndex:200,transform:open?"translateX(0)":"translateX(100%)",transition:"transform .28s cubic-bezier(.4,0,.2,1)",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"18px 24px",borderBottom:`1px solid ${C.g200}`,display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
        <div><div style={{fontSize:15,fontWeight:600,color:C.g900}}>{title}</div>{subtitle&&<div style={{fontSize:12,color:C.g400,marginTop:2}}>{subtitle}</div>}</div>
        <div style={{display:"flex",gap:6,marginLeft:"auto"}}>{hAct}
          <button onClick={onClose} style={{width:30,height:30,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:C.g400,border:`1px solid ${C.g200}`,background:"none",fontSize:14}}>✕</button>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto"}}>{children}</div>
    </div>
  </>;
}

function BtnP({children,onClick,disabled,style:s}){
  return <button onClick={onClick} disabled={disabled} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:8,fontSize:13,fontWeight:500,cursor:disabled?"not-allowed":"pointer",border:"none",background:C.blue,color:"#fff",fontFamily:"'DM Sans',sans-serif",transition:"background .18s",opacity:disabled?.6:1,...s}}
    onMouseEnter={e=>!disabled&&(e.currentTarget.style.background=C.blue2)}
    onMouseLeave={e=>!disabled&&(e.currentTarget.style.background=C.blue)}>{children}</button>;
}
function BtnS({children,onClick,style:s}){
  return <button onClick={onClick} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:8,fontSize:13,fontWeight:500,cursor:"pointer",border:`1px solid ${C.g200}`,background:C.w,color:C.g700,fontFamily:"'DM Sans',sans-serif",transition:"all .18s",...s}}
    onMouseEnter={e=>{e.currentTarget.style.background=C.g50;e.currentTarget.style.borderColor=C.g300;}}
    onMouseLeave={e=>{e.currentTarget.style.background=C.w;e.currentTarget.style.borderColor=C.g200;}}>{children}</button>;
}

// ═══════════════════════════════════════════════════════════════════════════
// LOGIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════
function LoginScreen({onLogin}){
  const[un,sU]=useState("");const[pw,sP]=useState("");const[show,sSh]=useState(false);
  const[err,sE]=useState("");const[loading,sL]=useState(false);const[shake,sSk]=useState(false);
  const toast=useContext(ToastCtx);

  const submit=e=>{e.preventDefault();sE("");
    if(!un.trim()||!pw.trim()){sE("Please enter both username and password");sSk(true);setTimeout(()=>sSk(false),500);return;}
    sL(true);
    setTimeout(()=>{
      const u=USERS.find(x=>x.u===un.trim().toLowerCase()&&x.p===pw);
      if(u){toast("Welcome back, "+u.name,"success");onLogin(u);}
      else{sE("Invalid credentials. Please try again.");sL(false);sSk(true);setTimeout(()=>sSk(false),500);}
    },600);
  };

  const inpStyle=(hasErr)=>({width:"100%",padding:"10px 12px 10px 40px",border:`1px solid ${hasErr?C.red:C.g200}`,borderRadius:8,fontSize:14,color:C.g800,fontFamily:"'DM Sans',sans-serif",outline:"none",transition:"border-color .2s,box-shadow .2s",boxSizing:"border-box"});

  return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:`linear-gradient(135deg,${C.navy} 0%,${C.navy3} 50%,${C.slate} 100%)`,fontFamily:"'DM Sans',system-ui,sans-serif"}}>
    <div style={{position:"fixed",inset:0,opacity:.03,backgroundImage:"radial-gradient(circle at 25% 25%,white 1px,transparent 1px)",backgroundSize:"60px 60px"}}/>
    <div style={{width:420,maxWidth:"92vw",position:"relative",zIndex:1,animation:"fadeUp .6s cubic-bezier(.4,0,.2,1)"}}>
      {/* Logo */}
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{width:56,height:56,background:C.blue,borderRadius:14,display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:16,boxShadow:"0 8px 32px rgba(26,111,219,.3)"}}>
          <svg viewBox="0 0 24 24" style={{width:28,height:28}} fill="none" stroke="#fff" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
        </div>
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:28,color:"#fff",letterSpacing:".01em",margin:0,fontWeight:600}}>QuoteFlow Pro</h1>
        <p style={{fontSize:11,color:"rgba(255,255,255,.4)",letterSpacing:".12em",textTransform:"uppercase",marginTop:4,fontWeight:500}}>Himalaya Terpenes Pvt. Ltd.</p>
      </div>
      {/* Card */}
      <div style={{background:C.w,borderRadius:16,padding:"36px 32px",boxShadow:"0 24px 64px rgba(0,0,0,.15)",transform:shake?"translateX(-6px)":"none",animation:shake?"shakeAnim .5s ease":"none"}}>
        <h2 style={{fontSize:18,fontWeight:600,color:C.g900,margin:"0 0 4px"}}>Welcome back</h2>
        <p style={{fontSize:13,color:C.g500,margin:"0 0 24px"}}>Sign in to your QuoteFlow Pro account</p>
        <form onSubmit={submit}>
          <div style={{marginBottom:16}}>
            <label style={{display:"block",fontSize:12,fontWeight:500,color:C.g600,marginBottom:6}}>Username</label>
            <div style={{position:"relative"}}>
              <div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:C.g400}}>{Ic.user}</div>
              <input type="text" value={un} onChange={e=>sU(e.target.value)} placeholder="Enter your username" autoComplete="username" autoFocus style={inpStyle(err)}
                onFocus={e=>{e.target.style.borderColor=C.blue;e.target.style.boxShadow="0 0 0 3px rgba(26,111,219,.1)";}}
                onBlur={e=>{e.target.style.borderColor=err?C.red:C.g200;e.target.style.boxShadow="none";}}/>
            </div>
          </div>
          <div style={{marginBottom:20}}>
            <label style={{display:"block",fontSize:12,fontWeight:500,color:C.g600,marginBottom:6}}>Password</label>
            <div style={{position:"relative"}}>
              <div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:C.g400}}>{Ic.lock}</div>
              <input type={show?"text":"password"} value={pw} onChange={e=>sP(e.target.value)} placeholder="Enter your password" autoComplete="current-password" style={{...inpStyle(err),paddingRight:40}}
                onFocus={e=>{e.target.style.borderColor=C.blue;e.target.style.boxShadow="0 0 0 3px rgba(26,111,219,.1)";}}
                onBlur={e=>{e.target.style.borderColor=err?C.red:C.g200;e.target.style.boxShadow="none";}}/>
              <button type="button" onClick={()=>sSh(!show)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:C.g400,padding:4,display:"flex"}}>
                {show?Ic.eyeOff:Ic.eye}
              </button>
            </div>
          </div>
          {err&&<div style={{background:C.redL,color:C.red,borderRadius:8,padding:"8px 12px",fontSize:13,marginBottom:16,display:"flex",alignItems:"center",gap:6,animation:"fadeIn .2s ease"}}><span style={{fontWeight:600}}>✕</span> {err}</div>}
          <button type="submit" disabled={loading} style={{width:"100%",padding:"11px 0",background:loading?C.blue2:C.blue,color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:500,cursor:loading?"wait":"pointer",fontFamily:"'DM Sans',sans-serif",transition:"background .2s",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            {loading&&<div style={{width:16,height:16,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .6s linear infinite"}}/>}
            {loading?"Signing in...":"Sign In"}
          </button>
        </form>
        {/* Credentials hint */}
        <div style={{marginTop:20,padding:"12px 14px",background:C.g50,borderRadius:8,border:`1px solid ${C.g200}`}}>
          <div style={{fontSize:11,fontWeight:600,color:C.g500,textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>Demo Credentials</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px 16px",fontSize:12}}>
            {USERS.map(u=><div key={u.id} style={{display:"contents"}}>
              <span style={{color:C.g600,fontWeight:500}}>{u.u}</span>
              <span style={{fontFamily:"'DM Mono',monospace",color:C.g400,fontSize:11}}>{u.p}</span>
            </div>)}
          </div>
        </div>
      </div>
      <div style={{textAlign:"center",marginTop:20}}><p style={{fontSize:11,color:"rgba(255,255,255,.3)"}}>QuoteFlow Pro v6.0 · Built for Himalaya Terpenes</p></div>
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════════════════════════════
function Sidebar({page,nav,user,onLogout}){
  const perms=PERMS[user.tier]||{};
  return <aside style={{width:240,minWidth:240,background:C.navy,display:"flex",flexDirection:"column",overflow:"hidden",borderRight:"1px solid rgba(255,255,255,.05)"}}>
    <div style={{padding:"20px 20px 16px",borderBottom:"1px solid rgba(255,255,255,.07)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:32,height:32,background:C.blue,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <svg viewBox="0 0 24 24" style={{width:18,height:18}} fill="none" stroke="#fff" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
        </div>
        <div><div style={{fontFamily:"'Playfair Display',serif",fontSize:17,color:"#fff",letterSpacing:".01em"}}>QuoteFlow</div><div style={{fontSize:10,color:"rgba(255,255,255,.4)",letterSpacing:".08em",textTransform:"uppercase",marginTop:1}}>Pro Edition</div></div>
      </div>
    </div>
    <div style={{flex:1,overflowY:"auto",padding:"4px 0"}}>
      {NAV.map(s=><div key={s.t}>
        <div style={{padding:"16px 12px 4px",fontSize:10,color:"rgba(255,255,255,.35)",letterSpacing:".1em",textTransform:"uppercase",fontWeight:500}}>{s.t}</div>
        {s.items.filter(i=>perms[i.pm]).map(i=>{
          const active=page===i.id;
          return <div key={i.id} onClick={()=>nav(i.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:8,margin:"2px 8px",cursor:"pointer",fontSize:13,fontWeight:400,background:active?"rgba(26,111,219,.25)":"transparent",color:active?"#fff":"rgba(255,255,255,.65)",transition:"background .18s,color .18s"}}
            onMouseEnter={e=>{if(!active){e.currentTarget.style.background="rgba(255,255,255,.07)";e.currentTarget.style.color="rgba(255,255,255,.9)";}}}
            onMouseLeave={e=>{if(!active){e.currentTarget.style.background="transparent";e.currentTarget.style.color="rgba(255,255,255,.65)";}}}>
            <span style={{opacity:active?1:.7,color:active?C.blue:"inherit"}}>{Ic[i.ic]}</span>
            {i.label}
            {i.badge&&<span style={{marginLeft:"auto",background:C.blue,color:"#fff",fontSize:10,padding:"1px 6px",borderRadius:20,fontWeight:500}}>{i.badge}</span>}
          </div>;
        })}
      </div>)}
    </div>
    <div style={{marginTop:"auto",padding:12,borderTop:"1px solid rgba(255,255,255,.07)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:8,borderRadius:8}}>
        <div style={{width:32,height:32,borderRadius:"50%",background:C.blue,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",fontWeight:600,flexShrink:0}}>{user.ini}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,color:"rgba(255,255,255,.8)",fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user.name}</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,.4)"}}>{user.role}</div>
        </div>
        <button onClick={onLogout} title="Sign out" style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,.4)",padding:4,borderRadius:4,display:"flex",transition:"color .18s"}}
          onMouseEnter={e=>e.currentTarget.style.color="rgba(255,255,255,.8)"}
          onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,.4)"}>{Ic.logout}</button>
      </div>
    </div>
  </aside>;
}

// ═══════════════════════════════════════════════════════════════════════════
// TOPBAR
// ═══════════════════════════════════════════════════════════════════════════
function Topbar({title,nav,sq,onSQ}){
  return <div style={{height:56,background:C.w,borderBottom:`1px solid ${C.g200}`,display:"flex",alignItems:"center",padding:"0 24px",gap:16,flexShrink:0}}>
    <div style={{fontSize:15,fontWeight:600,color:C.g900}}>{title}</div>
    <div style={{flex:1,maxWidth:360,marginLeft:8}}>
      <div style={{position:"relative"}}>
        <div style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:C.g400}}>{Ic.search}</div>
        <input type="text" placeholder="Search quotes, customers..." value={sq} onChange={e=>onSQ(e.target.value)} style={{width:"100%",padding:"7px 12px 7px 34px",border:`1px solid ${C.g200}`,borderRadius:8,fontSize:13,color:C.g700,background:C.g100,fontFamily:"'DM Sans',sans-serif",outline:"none",transition:"border-color .18s,background .18s",boxSizing:"border-box"}}
          onFocus={e=>{e.target.style.borderColor=C.blue;e.target.style.background="#fff";e.target.style.boxShadow="0 0 0 3px rgba(26,111,219,.1)";}}
          onBlur={e=>{e.target.style.borderColor=C.g200;e.target.style.background=C.g100;e.target.style.boxShadow="none";}}/>
      </div>
    </div>
    <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
      <BtnS onClick={()=>{}}>{Ic.sync} Sync Gmail</BtnS>
      <BtnP onClick={()=>nav("new-quote")}>{Ic.plus} New Quote</BtnP>
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
function DashboardPage({user,nav}){
  const toast=useContext(ToastCtx);
  return <div style={{animation:"fadeIn .2s ease"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
      <div>
        <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:C.g400,marginBottom:4}}>
          <span>QuoteFlow Pro</span><span style={{color:C.g300}}>›</span><span>Dashboard</span>
        </div>
        <div style={{fontSize:16,fontWeight:600,color:C.g900}}>Welcome back, {user.name}</div>
        <div style={{fontSize:13,color:C.g500,marginTop:2}}>
          Last 30 days · Updated just now ·{" "}
          <span style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:11,color:C.green,fontWeight:500}}>
            <span style={{width:7,height:7,borderRadius:"50%",background:C.green,animation:"syncPulse 2s infinite",display:"inline-block"}}/>
            Google Sheets Connected
          </span>
        </div>
      </div>
      <select style={{padding:"5px 10px",borderRadius:8,border:`1px solid ${C.g200}`,fontSize:12,color:C.g700,background:C.w,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
        <option>Last 30 days</option><option>This quarter</option><option>This year</option>
      </select>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
      <StatCard label="Total Quotes Sent" value="47" change="12% vs last month" dir="up" color="blue" icon={<span style={{color:C.blue}}>{Ic.clip}</span>}/>
      <StatCard label="Quote Value" value="₹84.6L" change="8% vs last month" dir="up" color="teal" icon={<span style={{color:C.teal}}>{Ic.rupee}</span>}/>
      <StatCard label="Win Rate" value="34%" change="2% vs last month" dir="down" color="amber" icon={<span style={{color:C.amber}}>{Ic.trend}</span>}/>
      <StatCard label="Active Customers" value="23" change="4 new this month" dir="up" color="purple" icon={<span style={{color:C.purple}}>{Ic.users}</span>}/>
    </div>

    {/* Pipeline funnel preview */}
    <div style={{display:"flex",gap:0,marginBottom:24}}>
      {[{l:"Lead",n:3,v:"₹5.3L",c:C.g500},{l:"Quoted",n:2,v:"₹8.2L",c:C.blue},{l:"Sampling",n:1,v:"₹1.5L",c:C.purple},{l:"Negotiating",n:1,v:"₹4.8L",c:C.amber},{l:"Won",n:1,v:"₹12.0L",c:C.green},{l:"Lost",n:1,v:"₹0.9L",c:C.red}].map((s,i,a)=>
        <div key={s.l} onClick={()=>nav("pipeline")} style={{flex:1,padding:"14px 16px",background:C.w,border:`1px solid ${C.g200}`,borderRight:i<a.length-1?"none":undefined,borderRadius:i===0?"10px 0 0 10px":i===a.length-1?"0 10px 10px 0":"0",position:"relative",cursor:"pointer",transition:"background .18s"}}
          onMouseEnter={e=>e.currentTarget.style.background=C.g50}
          onMouseLeave={e=>e.currentTarget.style.background=C.w}>
          {i<a.length-1&&<span style={{position:"absolute",right:-10,top:"50%",transform:"translateY(-50%)",fontSize:18,color:C.g300,zIndex:1}}>›</span>}
          <div style={{fontSize:10,color:C.g500,textTransform:"uppercase",letterSpacing:".06em",fontWeight:500}}>{s.l}</div>
          <div style={{fontSize:22,fontWeight:600,fontFamily:"'Playfair Display',serif",color:C.g900,margin:"2px 0"}}>{s.n}</div>
          <div style={{fontSize:11,color:C.g400}}>{s.v}</div>
        </div>
      )}
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      <Card title="Recent Quotations" subtitle="Last 5 quotes" hRight={<button onClick={()=>nav("quotations")} style={{background:"none",border:"none",color:C.blue,fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>View All →</button>}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr>{["Quote #","Customer","Value","Status"].map(h=><th key={h} style={{fontSize:11,fontWeight:600,color:C.g500,textTransform:"uppercase",letterSpacing:".06em",padding:"8px 12px",textAlign:"left",borderBottom:`1px solid ${C.g200}`,background:C.g50}}>{h}</th>)}</tr></thead>
          <tbody>
            {[{id:"QF-2025-047",c:"Reliance Industries",v:"₹2.85L",s:"Sent"},{id:"QF-2025-046",c:"Tata Chemicals",v:"₹1.62L",s:"Won"},{id:"QF-2025-045",c:"UPL Limited",v:"₹4.91L",s:"Negotiating"},{id:"QF-2025-044",c:"Aarti Industries",v:"₹0.88L",s:"Won"},{id:"QF-2025-043",c:"SRF Limited",v:"₹3.76L",s:"Draft"}].map(q=>
              <tr key={q.id} style={{cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background=C.g50} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <td style={{padding:"10px 12px",fontSize:13,color:C.g700,borderBottom:`1px solid ${C.g100}`,fontFamily:"'DM Mono',monospace",fontWeight:500}}>{q.id}</td>
                <td style={{padding:"10px 12px",fontSize:13,color:C.g900,borderBottom:`1px solid ${C.g100}`,fontWeight:500}}>{q.c}</td>
                <td style={{padding:"10px 12px",fontSize:13,color:C.g700,borderBottom:`1px solid ${C.g100}`,fontFamily:"'DM Mono',monospace",fontWeight:600}}>{q.v}</td>
                <td style={{padding:"10px 12px",borderBottom:`1px solid ${C.g100}`}}><StatusBadge status={q.s}/></td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
      <Card title="Unread Inquiries" subtitle="Requires action" hRight={<button onClick={()=>nav("inquiries")} style={{background:"none",border:"none",color:C.blue,fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>View All →</button>}>
        {[{c:"Global Agro",sub:"Chlorpyrifos 90% TC — 5MT",src:"indiamart",time:"2h ago"},{c:"PharmaLink Pvt Ltd",sub:"Acetone pricing Q3",src:"gmail",time:"4h ago"},{c:"Agrochem Solutions",sub:"Copper Sulphate RFQ",src:"indiamart",time:"6h ago"}].map((inq,i)=>
          <div key={i} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"12px 0",borderBottom:i<2?`1px solid ${C.g100}`:"none",cursor:"pointer"}}
            onMouseEnter={e=>e.currentTarget.style.background=C.g50}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <div style={{width:36,height:36,borderRadius:"50%",background:inq.src==="gmail"?"#FCE8E8":C.amberL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600,color:inq.src==="gmail"?"#C5221F":"#E65100",flexShrink:0}}>{inq.c.slice(0,2).toUpperCase()}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600,color:C.g900}}>{inq.c}</div>
              <div style={{fontSize:12,color:C.g500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{inq.sub}</div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontSize:11,color:C.g400}}>{inq.time}</div>
              <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 7px",borderRadius:20,fontSize:10,fontWeight:500,background:inq.src==="gmail"?"#FCE8E8":"#FFF3E0",color:inq.src==="gmail"?"#C5221F":"#E65100",marginTop:4}}>{inq.src}</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  </div>;
}

// ── Placeholder ──
function Placeholder({name}){
  return <div style={{textAlign:"center",padding:"64px 24px",animation:"fadeIn .2s ease"}}>
    <div style={{width:56,height:56,background:C.g100,borderRadius:16,display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:14}}>
      <svg viewBox="0 0 24 24" style={{width:24,height:24,stroke:C.g400,fill:"none",strokeWidth:1.5}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>
    </div>
    <div style={{fontSize:15,fontWeight:600,color:C.g700,marginBottom:6}}>{name} Module</div>
    <div style={{fontSize:13,color:C.g400,marginBottom:16}}>This module will be built in the next phase. All data will connect to Google Sheets.</div>
    <Badge type="blue">Coming in next build phase</Badge>
  </div>;
}

// ═══════════════════════════════════════════════════════════════════════════
// APP SHELL
// ═══════════════════════════════════════════════════════════════════════════
function AppShell({user,onLogout}){
  const[page,sP]=useState("dashboard");
  const[sq,sSQ]=useState("");
  const nav=useCallback(p=>sP(p),[]);

  const renderPage=()=>{
    switch(page){
      case "dashboard": return <DashboardPage user={user} nav={nav}/>;
      case "inquiries": return <Placeholder name="Inquiries"/>;
      case "quotations": return <Placeholder name="Quotations"/>;
      case "new-quote": return <Placeholder name="New Quotation"/>;
      case "pipeline": return <Placeholder name="Sales Pipeline"/>;
      case "sampling": return <Placeholder name="Sampling Tracker"/>;
      case "customers": return <Placeholder name="Customer Master"/>;
      case "reports": return <Placeholder name="Analytics"/>;
      case "settings": return <Placeholder name="Integrations"/>;
      default: return <Placeholder name="Unknown"/>;
    }
  };

  return <div style={{display:"flex",height:"100vh",overflow:"hidden"}}>
    <Sidebar page={page} nav={nav} user={user} onLogout={onLogout}/>
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <Topbar title={PTITLES[page]||"QuoteFlow Pro"} nav={nav} sq={sq} onSQ={sSQ}/>
      <div style={{flex:1,overflowY:"auto",padding:"28px 32px"}}>{renderPage()}</div>
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════════════════
export default function App(){
  const[user,sU]=useState(null);
  const login=useCallback(u=>sU(u),[]);
  const logout=useCallback(()=>sU(null),[]);

  return <AuthCtx.Provider value={{user,login,logout}}>
    <ToastProv>
      {user?<AppShell user={user} onLogout={logout}/>:<LoginScreen onLogin={login}/>}
    </ToastProv>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&family=Playfair+Display:wght@600&display=swap');
      *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
      html,body,#root{height:100%}
      body{font-family:'DM Sans',system-ui,sans-serif;font-size:14px;color:${C.g800};background:${C.g50};line-height:1.5;-webkit-font-smoothing:antialiased}
      input::placeholder,textarea::placeholder{color:${C.g400}}
      ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${C.g300};border-radius:3px}::-webkit-scrollbar-thumb:hover{background:${C.g400}}
      @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
      @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      @keyframes shakeAnim{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(2px)}}
      @keyframes spin{to{transform:rotate(360deg)}}
      @keyframes toastIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      @keyframes syncPulse{0%,100%{opacity:1}50%{opacity:.3}}
    `}</style>
  </AuthCtx.Provider>;
}
