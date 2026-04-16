import { useState, useEffect } from "react"
import axios from "axios"

const API = "https://shieldpay-prototype-production.up.railway.app"

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --ink: #0d0d0d; --paper: #f5f2eb; --cream: #ede9df;
    --green: #1a4a2e; --green-light: #2d6b45; --green-muted: #e8f0eb;
    --amber: #d4822a; --amber-light: #fdf3e7;
    --red: #c0392b; --red-light: #fdf0ef;
    --blue: #1a3a5c; --blue-light: #e8f0f8;
    --border: rgba(13,13,13,0.12);
  }
  html, body, #root { height:100%; font-family:'DM Sans',sans-serif; background:var(--paper); color:var(--ink); overflow-x:hidden; }
  h1,h2,h3,h4 { font-family:'Syne',sans-serif; }
  .belt-wrapper { position:fixed; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; background:var(--paper); z-index:0; overflow:hidden; }
  .belt-track { width:100%; overflow:hidden; position:relative; }
  .belt-rail { height:8px; background:var(--ink); }
  .belt-surface { padding:10px 0; background:repeating-linear-gradient(90deg,#2a2a2a 0,#2a2a2a 40px,#1a1a1a 40px,#1a1a1a 80px); position:relative; }
  .belt-surface::before,.belt-surface::after { content:''; position:absolute; top:0; bottom:0; width:70px; z-index:2; }
  .belt-surface::before { left:0; background:linear-gradient(to right,var(--paper),transparent); }
  .belt-surface::after  { right:0; background:linear-gradient(to left,var(--paper),transparent); }
  .belt-inner { display:flex; gap:16px; width:max-content; animation:beltScroll 16s linear infinite; }
  .belt-inner.rev { animation:beltRev 20s linear infinite; }
  @keyframes beltScroll { from{transform:translateX(0)} to{transform:translateX(-50%)} }
  @keyframes beltRev    { from{transform:translateX(-50%)} to{transform:translateX(0)} }
  .belt-item { font-size:26px; width:52px; height:52px; display:flex; align-items:center; justify-content:center; background:white; border:2px solid rgba(255,255,255,0.25); border-radius:8px; flex-shrink:0; box-shadow:0 3px 10px rgba(0,0,0,0.35); }
  .basket-lift { position:fixed; inset:0; z-index:20; display:flex; align-items:center; justify-content:center; }
  .basket-container { animation:basketRise 0.7s cubic-bezier(0.34,1.56,0.64,1) forwards; }
  @keyframes basketRise { from{transform:translateY(110px) scale(0.85);opacity:0} to{transform:translateY(0) scale(1);opacity:1} }
  .basket-outer { width:min(400px,90vw); }
  .basket-handle-wrap { display:flex; justify-content:center; }
  .basket-handle { width:76px; height:34px; border:4px solid var(--ink); border-bottom:none; border-radius:40px 40px 0 0; }
  .basket-card { background:white; border:3px solid var(--ink); border-radius:0 0 18px 18px; border-top:none; overflow:hidden; box-shadow:5px 5px 0 var(--ink); }
  .basket-stripe { height:10px; background:repeating-linear-gradient(90deg,var(--ink) 0,var(--ink) 10px,white 10px,white 20px); }
  .receipt-overlay { position:fixed; inset:0; z-index:300; background:rgba(13,13,13,0.75); display:flex; flex-direction:column; align-items:center; justify-content:flex-end; }
  .vespa-lane { position:absolute; top:0; left:0; right:0; height:55%; display:flex; align-items:center; overflow:hidden; pointer-events:none; }
  .vespa-anim { animation:vespaSwoosh 1.5s cubic-bezier(0.25,0.46,0.45,0.94) forwards; }
  @keyframes vespaSwoosh { 0%{transform:translateX(-200px)} 55%{transform:translateX(calc(45vw - 100px))} 80%{transform:translateX(calc(45vw - 95px))} 100%{transform:translateX(110vw)} }
  .receipt-paper { width:min(370px,90vw); background:white; border-radius:16px 16px 0 0; padding:26px 22px 36px; animation:paperUp 0.5s cubic-bezier(0.34,1.1,0.64,1) forwards; transform:translateY(100%); max-height:82vh; overflow-y:auto; }
  @keyframes paperUp { to{transform:translateY(0)} }
  .receipt-hdr { text-align:center; border-bottom:2px dashed var(--border); padding-bottom:18px; margin-bottom:16px; }
  .receipt-logo { font-family:'Syne',sans-serif; font-size:20px; font-weight:800; }
  .receipt-subtitle { font-size:11px; color:rgba(13,13,13,0.38); text-transform:uppercase; letter-spacing:0.1em; margin-top:3px; }
  .receipt-amt { font-family:'Syne',sans-serif; font-size:50px; font-weight:800; letter-spacing:-2px; text-align:center; margin:14px 0 6px; }
  .receipt-pill { display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:600; padding:4px 12px; border-radius:20px; background:var(--green-muted); color:var(--green); }
  .rrow { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px dashed var(--border); font-size:12px; }
  .rrow:last-child { border-bottom:none; }
  .rkey { color:rgba(13,13,13,0.45); }
  .rval { font-family:'DM Mono',monospace; font-size:11px; font-weight:500; text-align:right; max-width:58%; }
  .receipt-foot { text-align:center; margin-top:18px; border-top:2px dashed var(--border); padding-top:14px; }
  .receipt-bc { font-family:'DM Mono',monospace; font-size:9px; color:rgba(13,13,13,0.25); letter-spacing:0.3em; }
  .receipt-close { width:100%; margin-top:16px; padding:13px; background:var(--ink); color:white; border:none; border-radius:11px; font-family:'Syne',sans-serif; font-size:14px; font-weight:700; cursor:pointer; }
  .rline { animation:rprint 0.12s ease forwards; opacity:0; }
  @keyframes rprint { to{opacity:1} }
  .app-shell { min-height:100vh; background:var(--paper); max-width:480px; margin:0 auto; }
  .nav { display:flex; align-items:center; justify-content:space-between; padding:17px 20px; border-bottom:1.5px solid var(--border); background:white; position:sticky; top:0; z-index:100; }
  .nav-logo { font-family:'Syne',sans-serif; font-size:19px; font-weight:800; letter-spacing:-0.5px; }
  .nav-badge { font-size:10px; font-weight:600; padding:4px 10px; border-radius:20px; border:1.5px solid; text-transform:uppercase; letter-spacing:0.05em; }
  .role-rider     { background:#fff3cd; color:#7a5000; border-color:#d4822a !important; }
  .role-picker    { background:#d4edda; color:#1a4a2e; border-color:#1a4a2e !important; }
  .role-packer    { background:#cce5ff; color:#1a3a5c; border-color:#1a3a5c !important; }
  .role-inventory { background:#f8d7da; color:#721c24; border-color:#c0392b !important; }
  .card { background:white; border:1.5px solid var(--border); border-radius:16px; padding:20px; margin:0 16px 12px; }
  .hero-stat { padding:22px; margin:16px 16px 0; background:var(--ink); border-radius:18px; color:white; }
  .hero-stat .lbl { font-size:11px; opacity:0.45; text-transform:uppercase; letter-spacing:0.08em; }
  .hero-stat .amt { font-family:'Syne',sans-serif; font-size:42px; font-weight:800; letter-spacing:-2px; line-height:1; margin:5px 0 3px; }
  .slabel { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.08em; color:rgba(13,13,13,0.38); padding:16px 20px 8px; }
  .field { margin-bottom:13px; }
  .field label { display:block; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.06em; color:rgba(13,13,13,0.45); margin-bottom:5px; }
  .field input,.field select,.field textarea { width:100%; padding:11px 13px; border:1.5px solid var(--border); border-radius:10px; font-family:'DM Sans',sans-serif; font-size:15px; background:white; color:var(--ink); appearance:none; transition:border-color 0.15s; }
  .field input:focus,.field select:focus,.field textarea:focus { outline:none; border-color:var(--ink); }
  .field textarea { resize:vertical; min-height:88px; }
  .btn { width:100%; padding:13px; border:2px solid var(--ink); border-radius:12px; font-family:'Syne',sans-serif; font-size:14px; font-weight:700; cursor:pointer; transition:all 0.15s; }
  .btn-primary { background:var(--ink); color:white; }
  .btn-primary:hover { background:#222; }
  .btn-primary:active { transform:scale(0.98); }
  .btn-primary:disabled { opacity:0.32; cursor:not-allowed; }
  .btn-outline { background:transparent; color:var(--ink); }
  .btn-outline:hover { background:var(--cream); }
  .btn-green { background:var(--green); color:white; border-color:var(--green); }
  .btn-amber { background:var(--amber); color:white; border-color:var(--amber); }
  .btn-red { background:var(--red); color:white; border-color:var(--red); }
  .role-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px; }
  .role-opt { border:2px solid var(--border); border-radius:12px; padding:15px 10px; cursor:pointer; text-align:center; transition:all 0.15s; background:white; }
  .role-opt:hover { border-color:var(--ink); }
  .role-opt.sel { border-color:var(--ink); background:var(--ink); color:white; }
  .role-opt .remoji { font-size:25px; margin-bottom:5px; }
  .role-opt .rname  { font-family:'Syne',sans-serif; font-size:12px; font-weight:700; }
  .role-opt .rsub   { font-size:10px; opacity:0.5; margin-top:2px; }
  .tier-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:14px; }
  .tier-opt { border:2px solid var(--border); border-radius:12px; padding:12px 6px; cursor:pointer; text-align:center; transition:all 0.15s; background:white; }
  .tier-opt.sel { border-color:var(--green); background:var(--green); color:white; }
  .tier-opt .tname { font-family:'Syne',sans-serif; font-size:12px; font-weight:700; text-transform:capitalize; }
  .tier-opt .tprice { font-size:10px; opacity:0.55; margin-top:3px; }
  .tier-opt .tcov   { font-size:10px; margin-top:3px; }
  .tabs { display:flex; background:var(--cream); border-radius:12px; padding:4px; margin:0 16px 13px; }
  .tab { flex:1; padding:8px; border:none; border-radius:9px; font-family:'Syne',sans-serif; font-size:11px; font-weight:700; cursor:pointer; transition:all 0.15s; background:transparent; color:rgba(13,13,13,0.4); text-transform:uppercase; letter-spacing:0.05em; }
  .tab.active { background:white; color:var(--ink); box-shadow:0 2px 8px rgba(13,13,13,0.1); }
  .bottom-nav { position:fixed; bottom:0; left:50%; transform:translateX(-50%); width:100%; max-width:480px; background:white; border-top:1.5px solid var(--border); display:flex; padding:10px 0 18px; z-index:100; }
  .bnav-item { flex:1; display:flex; flex-direction:column; align-items:center; gap:3px; border:none; background:none; cursor:pointer; padding:6px; color:rgba(13,13,13,0.32); font-family:'DM Sans',sans-serif; font-size:10px; font-weight:500; transition:color 0.15s; }
  .bnav-item.active { color:var(--ink); }
  .bnav-item .ni { font-size:19px; }
  .policy-active { display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:600; padding:4px 11px; border-radius:20px; background:var(--green-muted); color:var(--green); }
  .policy-active::before { content:''; width:6px; height:6px; background:var(--green); border-radius:50%; animation:blink 1.5s ease-in-out infinite; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
  .cov-item { display:flex; align-items:flex-start; gap:9px; padding:8px 0; border-bottom:1px solid var(--border); font-size:13px; }
  .cov-item:last-child { border-bottom:none; }
  .cov-y { color:var(--green); font-size:14px; flex-shrink:0; }
  .cov-n { color:#ccc; font-size:14px; flex-shrink:0; }
  .brow { display:flex; justify-content:space-between; align-items:center; padding:9px 0; border-bottom:1px solid var(--border); font-size:13px; }
  .brow:last-child { border-bottom:none; }
  .blbl { color:rgba(13,13,13,0.5); }
  .bval { font-weight:600; font-family:'Syne',sans-serif; }
  .claim-live { border:2px solid var(--amber); border-radius:14px; padding:18px; margin:0 16px 12px; background:var(--amber-light); }
  .claim-live.paid    { border-color:var(--green); background:var(--green-muted); }
  .claim-live.blocked { border-color:var(--red);   background:var(--red-light); }
  .ptk { height:4px; background:var(--cream); border-radius:2px; overflow:hidden; margin:5px 0; }
  .pfill { height:100%; background:var(--green); border-radius:2px; transition:width 0.7s ease; }
  .claim-row { display:flex; align-items:center; gap:11px; padding:11px 0; border-bottom:1px solid var(--border); }
  .claim-row:last-child { border-bottom:none; }
  .fs-bar { background:var(--ink); color:white; border-radius:14px; padding:18px; margin:0 16px 12px; }
  .sdot { width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:9px; font-weight:600; }
  .dfull { background:var(--green-light); }
  .dempty { background:rgba(255,255,255,0.1); }
  .err { background:var(--red-light); color:var(--red); border:1.5px solid var(--red); border-radius:10px; padding:11px 13px; font-size:13px; margin-bottom:11px; }
  .formula-btn { display:inline-flex; align-items:center; gap:4px; font-size:11px; color:var(--blue); font-weight:600; cursor:pointer; border:1.5px solid var(--blue); border-radius:20px; padding:3px 10px; background:var(--blue-light); }
  .formula-box { background:var(--cream); border-radius:10px; padding:13px; font-family:'DM Mono',monospace; font-size:11px; color:var(--ink); line-height:1.9; margin-top:10px; border:1.5px solid var(--border); animation:fadeIn 0.2s ease; }
  @keyframes fadeIn { from{opacity:0;transform:translateY(-5px)} to{opacity:1;transform:translateY(0)} }
  .flex-between { display:flex; justify-content:space-between; align-items:center; }
  .pb-nav { padding-bottom:88px; }
  .stat-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:0 16px 12px; }
  .stat-box { background:white; border:1.5px solid var(--border); border-radius:14px; padding:16px; }
  .stat-box .s-lbl { font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:0.06em; color:rgba(13,13,13,0.38); margin-bottom:5px; }
  .stat-box .s-val { font-family:'Syne',sans-serif; font-size:22px; font-weight:800; letter-spacing:-0.5px; }
  .stat-box .s-sub { font-size:11px; color:rgba(13,13,13,0.4); margin-top:3px; }
  .risk-pill { display:inline-flex; padding:3px 9px; border-radius:20px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; }
  .risk-high { background:#fdf0ef; color:var(--red); }
  .risk-medium { background:var(--amber-light); color:var(--amber); }
  .risk-low { background:var(--green-muted); color:var(--green); }
  .fraud-flag { background:var(--red-light); border:1.5px solid var(--red); border-radius:12px; padding:14px; margin-bottom:10px; }
  .confidence-bar { height:8px; border-radius:4px; background:var(--cream); overflow:hidden; margin:6px 0; }
  .confidence-fill { height:100%; border-radius:4px; transition:width 0.8s ease; }
  .admin-header { background:var(--ink); color:white; padding:20px; margin-bottom:0; }
  .weather-widget { background:linear-gradient(135deg,#1a3a5c,#2563eb); color:white; border-radius:16px; padding:18px; margin:0 16px 12px; }
`

const PLATFORMS = ["zepto","blinkit","instamart","bigbasket"]
const SHIFTS    = ["morning","afternoon","night"]
const TIERS     = ["basic","standard","premium"]
const ZONES     = ["bengaluru-koramangala","bengaluru-indiranagar","delhi-connaught","delhi-rohini","chennai-adyar","chennai-anna-nagar","mumbai-andheri","mumbai-bandra"]
const ROLES = [
  {id:"rider",    emoji:"🛵", name:"Delivery Partner", sub:"Outdoor · Full exposure"},
  {id:"picker",   emoji:"📦", name:"Picker",           sub:"Indoor · Shelves"},
  {id:"packer",   emoji:"🎁", name:"Packer",           sub:"Indoor · Staging"},
  {id:"inventory",emoji:"❄️",  name:"Inventory Assoc.",sub:"Cold chain · Mixed"},
]
const TIER_INFO = {
  basic:   {min:"₹29",cov:"50%",triggers:"Weather + AQI"},
  standard:{min:"₹59",cov:"70%",triggers:"+ Civil disruptions"},
  premium: {min:"₹99",cov:"100%",triggers:"All triggers"},
}
const ROLE_COV = {
  rider:    ["Heavy rainfall","Dense fog","Extreme heat","Poor AQI","Road closure","Bandh / curfew","Power outage","Platform outage","State disaster alert"],
  picker:   ["Bandh / curfew","Power outage","Platform outage","Network outage","State disaster alert"],
  packer:   ["Bandh / curfew","Power outage","Platform outage","Network outage","State disaster alert"],
  inventory:["Power outage — 90% coefficient","Cold chain disruption","Bandh / curfew","Platform outage","State disaster alert"],
}
const TNAMES = {rain:"Heavy rainfall",aqi:"Poor AQI",bandh:"Bandh / curfew",power:"Power outage",platform_outage:"Platform outage"}
const TICONS = {rain:"🌧",aqi:"😮‍💨",bandh:"🚫",power:"⚡",platform_outage:"📵"}
const BELT   = ["🥕","🥦","🧅","🍎","🛒","🥛","🧃","🍌","🛍️","🥚","🧄","🍅","🛒","🥩","🫙","🧁","🥕","🥦","🧅","🍎","🛒","🥛","🧃","🍌","🛍️","🥚","🧄","🍅","🛒","🥩","🫙","🧁"]

function Vespa() {
  return (
    <svg width="200" height="110" viewBox="0 0 200 110" fill="none">
      <line x1="0" y1="62" x2="32" y2="62" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" opacity="0.5"/>
      <line x1="0" y1="71" x2="24" y2="71" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" opacity="0.35"/>
      <line x1="0" y1="79" x2="18" y2="79" stroke="#2563eb" strokeWidth="1" strokeLinecap="round" opacity="0.22"/>
      <circle cx="44" cy="84" r="22" fill="#1a1a1a"/><circle cx="44" cy="84" r="14" fill="#2a2a2a"/><circle cx="44" cy="84" r="5" fill="#555"/>
      <circle cx="162" cy="84" r="20" fill="#1a1a1a"/><circle cx="162" cy="84" r="13" fill="#2a2a2a"/><circle cx="162" cy="84" r="4" fill="#555"/>
      <path d="M58 62 Q68 34 100 32 Q130 30 150 46 L158 62 Q140 68 118 70 L62 70 Z" fill="#2563eb"/>
      <path d="M62 70 L118 70 L116 80 L66 80 Z" fill="#1d4ed8"/>
      <path d="M78 32 Q93 22 114 24 L116 33 Q98 31 82 38 Z" fill="#111"/>
      <path d="M128 33 Q144 30 152 44 L147 50 Q136 40 124 43 Z" fill="#93c5fd" opacity="0.75"/>
      <rect x="150" y="38" width="5" height="18" rx="2.5" fill="#111"/>
      <rect x="144" y="38" width="16" height="4" rx="2" fill="#111"/>
      <path d="M152 62 Q162 60 168 68 L164 73 Q157 68 150 68 Z" fill="#2563eb"/>
      <path d="M50 62 Q57 58 65 60 L65 68 Q57 66 50 70 Z" fill="#2563eb"/>
      <text x="80" y="56" fontSize="8" fill="white" fontWeight="700" fontFamily="sans-serif" opacity="0.9">ShieldPay</text>
      <ellipse cx="100" cy="20" rx="11" ry="13" fill="#f97316"/>
      <circle cx="100" cy="7" r="9" fill="#fbbf24"/>
      <path d="M92 5 Q100 -5 108 5 Q110 12 100 13 Q90 12 92 5Z" fill="#111"/>
      <rect x="93" y="10" width="14" height="4" rx="2" fill="#374151" opacity="0.6"/>
      <path d="M106 18 Q128 24 146 40" stroke="#f97316" strokeWidth="5.5" strokeLinecap="round"/>
    </svg>
  )
}

function Receipt({ result, myPayout, triggerType, zone, onClose }) {
  const [phase, setPhase] = useState("vespa")
  const [lines, setLines] = useState(0)
  const txId   = "SP" + Date.now().toString().slice(-8).toUpperCase()
  const upiRef = "UPI" + Math.random().toString(36).slice(2,10).toUpperCase()
  const rows = [
    {k:"Transaction ID", v:txId},
    {k:"UPI Reference",  v:upiRef},
    {k:"Worker ID",      v:"#"+(myPayout?.worker_id||"—")},
    {k:"Zone",           v:zone},
    {k:"Trigger",        v:TNAMES[triggerType]||triggerType},
    {k:"Order drop",     v:((result?.order_drop_pct||0)*100).toFixed(0)+"% confirmed"},
    {k:"Severity",       v:result?.severity||"—"},
    {k:"Timestamp",      v:new Date().toLocaleString("en-IN",{hour12:true,hour:"2-digit",minute:"2-digit",day:"numeric",month:"short"})},
    {k:"Status",         v:myPayout?.status==="processed"?"PAID":"UNDER REVIEW"},
  ]
  useEffect(()=>{ const t=setTimeout(()=>setPhase("receipt"),1600); return()=>clearTimeout(t) },[])
  useEffect(()=>{
    if(phase!=="receipt") return
    let i=0
    const iv=setInterval(()=>{ i++; setLines(i); if(i>=rows.length+4) clearInterval(iv) },110)
    return()=>clearInterval(iv)
  },[phase])
  return (
    <div className="receipt-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      {phase==="vespa"&&<div className="vespa-lane"><div className="vespa-anim"><Vespa/></div></div>}
      {phase==="receipt"&&(
        <div className="receipt-paper">
          {lines>0&&<div className="receipt-hdr rline"><div className="receipt-logo">ShieldPay</div><div className="receipt-subtitle">Parametric Payout Receipt</div></div>}
          {lines>1&&(
            <div className="rline" style={{textAlign:"center",marginBottom:14}}>
              <div style={{fontSize:12,color:"rgba(13,13,13,0.38)",marginBottom:3}}>{myPayout?.status==="processed"?"Amount transferred to UPI":"Amount held for review"}</div>
              <div className="receipt-amt" style={{color:myPayout?.status==="processed"?"var(--green)":"var(--amber)"}}>{"₹"+(myPayout?.amount?.toFixed(0)||"0")}</div>
              <span className="receipt-pill">{myPayout?.status==="processed"?"Paid":"Under review"}</span>
            </div>
          )}
          {rows.map((r,i)=>lines>i+2&&<div className="rrow rline" key={r.k}><span className="rkey">{r.k}</span><span className="rval">{r.v}</span></div>)}
          {lines>rows.length+2&&(
            <div className="receipt-foot rline">
              <div style={{fontSize:11,color:"rgba(13,13,13,0.3)",marginBottom:6}}>No claim filed. No form. Automatic.</div>
              <div className="receipt-bc">{txId} · SHIELDPAY · 2026</div>
              <button className="receipt-close" onClick={onClose}>Done ✓</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Belt({ rev }) {
  const items = [...BELT,...BELT]
  return (
    <div className="belt-track">
      <div className="belt-rail"/>
      <div className="belt-surface">
        <div className={"belt-inner"+(rev?" rev":"")}>
          {items.map((it,i)=><div className="belt-item" key={i}>{it}</div>)}
        </div>
      </div>
      <div className="belt-rail"/>
    </div>
  )
}

function Landing({ onEnter, onAdmin }) {
  const [mode, setMode]   = useState(null) // null | "worker" | "admin"
  const [wmode, setWmode] = useState("register")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)

  const go = async () => {
    if(phone.length<10) return
    setLoading(true)
    await new Promise(r=>setTimeout(r,500))
    setLoading(false)
    onEnter(phone, wmode)
  }

  return (
    <div style={{position:"relative",minHeight:"100vh",overflow:"hidden"}}>
      <div className="belt-wrapper">
        <div style={{position:"absolute",top:"18%",width:"100%"}}><Belt/></div>
        <div style={{position:"absolute",bottom:"18%",width:"100%"}}><Belt rev/></div>

        {!mode && (
          <div style={{textAlign:"center",zIndex:1,padding:"0 24px",width:"100%",maxWidth:400}}>
            <div style={{fontFamily:"Syne",fontSize:54,fontWeight:800,letterSpacing:"-2px",color:"var(--ink)",lineHeight:0.95,marginBottom:8}}>Shield<br/>Pay</div>
            <div style={{fontSize:14,color:"rgba(13,13,13,0.45)",marginBottom:36}}>Income protection for q-commerce workers</div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <button className="btn btn-primary" onClick={()=>setMode("worker")} style={{fontSize:16,padding:"16px"}}>
                🛵 Worker login
              </button>
              <button onClick={()=>onAdmin()} style={{width:"100%",padding:"16px",border:"2px solid var(--ink)",borderRadius:12,fontFamily:"Syne",fontSize:16,fontWeight:700,cursor:"pointer",background:"white",color:"var(--ink)",transition:"all 0.15s"}}>
                📊 Insurer / Admin portal
              </button>
            </div>
            <div style={{marginTop:16,fontSize:11,color:"rgba(13,13,13,0.3)"}}>Guidewire DevTrails 2026 · CosmoCoders</div>
          </div>
        )}
      </div>

      {mode==="worker" && (
        <div className="basket-lift">
          <div className="basket-container">
            <div className="basket-outer">
              <div className="basket-handle-wrap"><div className="basket-handle"/></div>
              <div className="basket-card">
                <div className="basket-stripe"/>
                <div style={{padding:"22px 26px 26px"}}>
                  <div style={{fontFamily:"Syne",fontSize:24,fontWeight:800,marginBottom:2}}>ShieldPay</div>
                  <div style={{fontSize:13,color:"rgba(13,13,13,0.4)",marginBottom:20}}>Parametric income protection</div>
                  <div className="tabs" style={{margin:"0 0 16px"}}>
                    <button className={"tab"+(wmode==="register"?" active":"")} onClick={()=>setWmode("register")}>Register</button>
                    <button className={"tab"+(wmode==="login"?" active":"")} onClick={()=>setWmode("login")}>Sign in</button>
                  </div>
                  <div className="field">
                    <label>Phone number</label>
                    <input type="tel" placeholder="+91 98765 43210" value={phone} onChange={e=>setPhone(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()}/>
                  </div>
                  <button className="btn btn-primary" onClick={go} disabled={phone.length<10||loading}>
                    {loading?"Verifying...":wmode==="login"?"Sign in →":"Create account →"}
                  </button>
                  <button onClick={()=>setMode(null)} style={{width:"100%",marginTop:10,background:"none",border:"none",fontSize:12,color:"rgba(13,13,13,0.4)",cursor:"pointer"}}>← Back</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── ADMIN DASHBOARD ──────────────────────────────────────────────────────────

function AdminLogin({ onLogin }) {
  const [pass, setPass] = useState("")
  const [err, setErr]   = useState("")
  const attempt = () => {
    if(pass==="shieldpay2026") onLogin()
    else setErr("Invalid credentials")
  }
  return (
    <div className="app-shell" style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}>
      <div style={{width:"100%",padding:"0 24px"}}>
        <div style={{fontFamily:"Syne",fontSize:28,fontWeight:800,marginBottom:4}}>Insurer Portal</div>
        <div style={{fontSize:13,color:"rgba(13,13,13,0.45)",marginBottom:28}}>ShieldPay · Admin Access</div>
        <div className="field"><label>Access code</label>
          <input type="password" placeholder="Enter access code" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&attempt()}/>
        </div>
        {err&&<div className="err">{err}</div>}
        <button className="btn btn-primary" onClick={attempt}>Access dashboard →</button>
        <div style={{textAlign:"center",marginTop:12,fontSize:11,color:"rgba(13,13,13,0.3)"}}>Demo code: shieldpay2026</div>
      </div>
    </div>
  )
}

function AdminDashboard({ onExit }) {
  const [tab, setTab]         = useState("overview")
  const [overview, setOverview] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [flags, setFlags]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [stormZone, setStormZone] = useState("chennai-adyar")
  const [stormResult, setStormResult] = useState(null)
  const [stormLoading, setStormLoading] = useState(false)

  useEffect(()=>{
    Promise.all([
      axios.get(API+"/admin/overview").catch(()=>null),
      axios.get(API+"/admin/predictive").catch(()=>null),
      axios.get(API+"/admin/fraud-flags").catch(()=>null),
    ]).then(([o,f,fl])=>{
      setOverview(o?.data)
      setForecast(f?.data)
      setFlags(fl?.data)
      setLoading(false)
    })
  },[])

  const fireStorm = async () => {
    setStormLoading(true); setStormResult(null)
    try {
      const r = await axios.post(API+"/weather/simulate-rainstorm",{zone:stormZone,severity:"full"})
      setStormResult(r.data)
    } catch(e){ setStormResult({error:e.response?.data?.detail||"Storm trigger failed"}) }
    setStormLoading(false)
  }

  if(loading) return (
    <div className="app-shell" style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:32,marginBottom:12}}>⚡</div>
        <div style={{fontFamily:"Syne",fontSize:16,fontWeight:700}}>Loading insurer dashboard...</div>
      </div>
    </div>
  )

  return (
    <div className="app-shell" style={{paddingBottom:88}}>
      <div className="nav">
        <div className="nav-logo">Admin</div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div style={{fontSize:10,padding:"3px 8px",background:"var(--red-light)",color:"var(--red)",borderRadius:20,fontWeight:700}}>INSURER VIEW</div>
          <button onClick={onExit} style={{fontSize:11,background:"none",border:"1px solid var(--border)",borderRadius:8,padding:"4px 10px",cursor:"pointer"}}>Exit</button>
        </div>
      </div>

      <div className="tabs" style={{marginTop:12}}>
        {["overview","forecast","fraud","rainstorm"].map(t=>(
          <button key={t} className={"tab"+(tab===t?" active":"")} onClick={()=>setTab(t)} style={{fontSize:9}}>
            {t==="overview"?"📊 Overview":t==="forecast"?"🔮 Forecast":t==="fraud"?"🚨 Fraud":"🌧 Demo"}
          </button>
        ))}
      </div>

      {tab==="overview"&&overview&&(
        <>
          <div className="stat-grid">
            {[
              {l:"Total Workers",v:overview.total_workers,s:"enrolled"},
              {l:"Active",v:overview.active_workers,s:"with coverage"},
              {l:"Loss Ratio",v:overview.loss_ratio_pct+"%",s:"claims / premium"},
              {l:"Fraud Hold Rate",v:overview.fraud_hold_rate_pct+"%",s:"payouts held"},
            ].map(s=>(
              <div className="stat-box" key={s.l}>
                <div className="s-lbl">{s.l}</div>
                <div className="s-val">{s.v}</div>
                <div className="s-sub">{s.s}</div>
              </div>
            ))}
          </div>
          <div className="slabel">Financial overview</div>
          <div className="card">
            {[
              ["Premium collected","₹"+overview.total_premium_collected?.toFixed(0)],
              ["Total disbursed","₹"+overview.total_disbursed?.toFixed(0)],
              ["Held for review",overview.held_payouts+" payouts"],
              ["Triggers fired",overview.total_triggers],
            ].map(([k,v])=>(
              <div className="brow" key={k}><span className="blbl">{k}</span><span className="bval">{v}</span></div>
            ))}
          </div>
          <div className="slabel">Zone breakdown</div>
          {Object.entries(overview.zone_breakdown||{}).map(([zone,data])=>(
            <div className="card" key={zone} style={{margin:"0 16px 8px"}}>
              <div style={{fontFamily:"Syne",fontSize:13,fontWeight:700,marginBottom:8}}>{zone}</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {[["Workers",data.workers],["Premium","₹"+data.premium?.toFixed(0)],["Disbursed","₹"+data.disbursed?.toFixed(0)],["Loss ratio",data.loss_ratio_pct+"%"]].map(([k,v])=>(
                  <div key={k} style={{flex:1,minWidth:70,background:"var(--cream)",borderRadius:8,padding:"8px 10px"}}>
                    <div style={{fontSize:9,color:"rgba(13,13,13,0.4)",textTransform:"uppercase",letterSpacing:"0.05em"}}>{k}</div>
                    <div style={{fontFamily:"Syne",fontSize:15,fontWeight:700,marginTop:2}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {tab==="forecast"&&forecast&&(
        <>
          <div className="card" style={{margin:"0 16px 12px",background:"var(--blue-light)",border:"1.5px solid var(--blue)"}}>
            <div style={{fontSize:13,color:"var(--blue)",lineHeight:1.6}}><strong>Next-week risk forecast.</strong> Adjusted probability uses recent 30-day trigger history to update base rates. Plan your reserve pool accordingly.</div>
          </div>
          {Object.entries(forecast.forecasts||{}).map(([city,data])=>(
            <div key={city}>
              <div className="slabel">{city.charAt(0).toUpperCase()+city.slice(1)} · {data.workers} workers</div>
              <div className="card">
                <div className="brow">
                  <span className="blbl">Highest risk trigger</span>
                  <span className="bval">{data.highest_risk}</span>
                </div>
                <div className="brow">
                  <span className="blbl">Avg daily baseline</span>
                  <span className="bval">₹{data.avg_daily_baseline}</span>
                </div>
                {Object.entries(data.trigger_forecasts||{}).map(([ttype,tf])=>(
                  <div key={ttype} style={{padding:"10px 0",borderBottom:"1px solid var(--border)"}}>
                    <div className="flex-between" style={{marginBottom:5}}>
                      <span style={{fontSize:13,textTransform:"capitalize"}}>{ttype.replace("_"," ")}</span>
                      <span className={"risk-pill risk-"+tf.risk_level}>{tf.risk_level}</span>
                    </div>
                    <div className="confidence-bar">
                      <div className="confidence-fill" style={{width:(tf.adjusted_probability*100)+"%",background:tf.risk_level==="high"?"var(--red)":tf.risk_level==="medium"?"var(--amber)":"var(--green)"}}/>
                    </div>
                    <div className="flex-between" style={{marginTop:4}}>
                      <span style={{fontSize:11,color:"rgba(13,13,13,0.4)"}}>P={tf.adjusted_probability} · {tf.recent_triggers_30d} recent</span>
                      <span style={{fontSize:11,fontWeight:600}}>₹{tf.expected_payout_pool} reserve</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {tab==="fraud"&&(
        <>
          <div className="stat-grid">
            <div className="stat-box">
              <div className="s-lbl">Flagged payouts</div>
              <div className="s-val" style={{color:"var(--red)"}}>{flags?.total_flagged||0}</div>
              <div className="s-sub">held for review</div>
            </div>
            <div className="stat-box">
              <div className="s-lbl">Hold rate</div>
              <div className="s-val">{overview?.fraud_hold_rate_pct||0}%</div>
              <div className="s-sub">of all payouts</div>
            </div>
          </div>
          <div className="slabel">Fraud architecture</div>
          <div className="card">
            {[
              {icon:"📍",title:"GPS zone verification",desc:"Worker GPS cross-checked against registered 2km zone. >5km deviation = 40pt penalty."},
              {icon:"🌦",title:"Weather claim validation",desc:"Claimed trigger cross-referenced with OpenWeatherMap live data for zone at event time."},
              {icon:"📈",title:"Claim velocity check",desc:"8+ payouts in 30 days flags syndicate pattern. Genuine workers miss triggers."},
              {icon:"🎯",title:"Confidence score tiering",desc:"0–100 score determines auto-approve / soft-hold / micro-verify / human review."},
            ].map(f=>(
              <div key={f.title} style={{padding:"10px 0",borderBottom:"1px solid var(--border)"}}>
                <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                  <div style={{fontSize:20}}>{f.icon}</div>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,marginBottom:3}}>{f.title}</div>
                    <div style={{fontSize:12,color:"rgba(13,13,13,0.5)",lineHeight:1.5}}>{f.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="slabel">Flagged payouts</div>
          {flags?.flags?.length===0&&(
            <div className="card" style={{textAlign:"center",color:"var(--green)"}}>
              <div style={{fontSize:28,marginBottom:8}}>✓</div>
              <div style={{fontWeight:600}}>No fraud flags currently active</div>
            </div>
          )}
          {flags?.flags?.map(f=>(
            <div className="fraud-flag" key={f.payout_id} style={{margin:"0 16px 8px"}}>
              <div className="flex-between" style={{marginBottom:6}}>
                <span style={{fontFamily:"Syne",fontSize:13,fontWeight:700,color:"var(--red)"}}>Payout #{f.payout_id}</span>
                <span style={{fontSize:11,color:"var(--red)"}}>Worker #{f.worker_id}</span>
              </div>
              <div style={{fontSize:12,color:"rgba(13,13,13,0.5)",marginBottom:6}}>{f.zone}</div>
              <div className="confidence-bar">
                <div className="confidence-fill" style={{width:(f.fraud_score*10)+"%",background:"var(--red)"}}/>
              </div>
              <div className="flex-between" style={{marginTop:4}}>
                <span style={{fontSize:11,color:"var(--red)"}}>Fraud score: {f.fraud_score}</span>
                <span style={{fontSize:11}}>₹{f.amount}</span>
              </div>
            </div>
          ))}
        </>
      )}

      {tab==="rainstorm"&&(
        <>
          <div className="card" style={{margin:"0 16px 12px",background:"var(--blue-light)",border:"1.5px solid var(--blue)"}}>
            <div style={{fontSize:13,color:"var(--blue)",lineHeight:1.6}}><strong>Live demo trigger.</strong> Simulate a full rainstorm hitting a zone. The parametric engine auto-detects, verifies the two signals, and fires payouts to all active workers instantly.</div>
          </div>
          <div className="card">
            <div style={{fontFamily:"Syne",fontSize:14,fontWeight:700,marginBottom:13}}>🌧 Simulate rainstorm</div>
            <div className="field">
              <label>Target zone</label>
              <select value={stormZone} onChange={e=>setStormZone(e.target.value)}>
                {ZONES.map(z=><option key={z} value={z}>{z}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" onClick={fireStorm} disabled={stormLoading}>
              {stormLoading?"🌧 Storm incoming...":"⚡ Trigger rainstorm → auto-payout"}
            </button>
          </div>
          {stormResult&&!stormResult.error&&(
            <>
              <div className="card" style={{margin:"0 16px 12px",background:"var(--green-muted)",border:"1.5px solid var(--green)"}}>
                <div style={{fontFamily:"Syne",fontSize:16,fontWeight:800,color:"var(--green)",marginBottom:10}}>✓ Parametric trigger fired</div>
                {[
                  ["Zone",stormResult.zone],
                  ["Rainfall",stormResult.weather_data?.rainfall_mm+"mm/hr"],
                  ["Order drop",(stormResult.order_drop_pct*100).toFixed(0)+"% confirmed"],
                  ["Workers paid",stormResult.workers_found],
                  ["Total disbursed","₹"+stormResult.total_disbursed],
                ].map(([k,v])=>(
                  <div className="brow" key={k}><span className="blbl">{k}</span><span className="bval" style={{color:"var(--green)"}}>{v}</span></div>
                ))}
              </div>
              <div className="slabel">Individual payouts</div>
              {stormResult.payouts?.map((p,i)=>(
                <div className="card" key={i} style={{margin:"0 16px 8px"}}>
                  <div className="flex-between">
                    <div>
                      <div style={{fontSize:13,fontWeight:600}}>Worker #{p.worker_id} · {p.role}</div>
                      <div style={{fontSize:11,color:"rgba(13,13,13,0.4)",marginTop:2}}>{p.platform} · {p.upi_ref}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontFamily:"Syne",fontSize:18,fontWeight:800,color:"var(--green)"}}>₹{p.amount}</div>
                      <div style={{fontSize:10,color:"var(--green)"}}>✓ Paid</div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
          {stormResult?.error&&(
            <div className="err" style={{margin:"0 16px"}}>{stormResult.error}</div>
          )}
        </>
      )}

      <div className="bottom-nav">
        {[{id:"overview",icon:"📊",label:"Overview"},{id:"forecast",icon:"🔮",label:"Forecast"},{id:"fraud",icon:"🚨",label:"Fraud"},{id:"rainstorm",icon:"🌧",label:"Demo"}].map(n=>(
          <button key={n.id} className={"bnav-item"+(tab===n.id?" active":"")} onClick={()=>setTab(n.id)}>
            <span className="ni">{n.icon}</span>{n.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── WORKER SCREENS ────────────────────────────────────────────────────────────

function Onboard({ phone, onDone }) {
  const [step, setStep]   = useState(0)
  const [role, setRole]   = useState("")
  const [form, setForm]   = useState({platform:"",platform_id:"",zone:"",shift:"",experience_weeks:12,income_correction:""})
  const [tier, setTier]   = useState("standard")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [worker, setWorker] = useState(null)
  const [pdata, setPdata] = useState(null)
  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  const ri = ROLES.find(r=>r.id===role)

  const doOnboard = async () => {
    setLoading(true); setError("")
    try {
      const r = await axios.post(API+"/onboard",{phone,platform:form.platform,platform_id:form.platform_id,role,zone:form.zone,shift:form.shift,experience_weeks:parseInt(form.experience_weeks)||12,income_correction:form.income_correction?parseFloat(form.income_correction):undefined})
      setWorker(r.data); setStep(3)
    } catch(e){ setError(e.response?.data?.detail||"Registration failed — try a different phone or platform ID.") }
    setLoading(false)
  }

  const doPremium = async () => {
    setLoading(true)
    try {
      const r = await axios.post(API+"/premium/calculate",{worker_id:worker.worker_id,tier})
      setPdata(r.data); setStep(4)
    } catch(e){ setError("Premium calculation failed.") }
    setLoading(false)
  }

  const StepNav = ({s}) => <div className="nav"><div className="nav-logo">ShieldPay</div><div style={{fontSize:11,color:"rgba(13,13,13,0.38)"}}>Step {s} of 4</div></div>

  if(step===0) return (
    <div className="app-shell">
      <StepNav s={1}/>
      <div style={{padding:"26px 16px 0"}}>
        <div style={{fontFamily:"Syne",fontSize:23,fontWeight:800,marginBottom:5}}>What's your role?</div>
        <div style={{fontSize:14,color:"rgba(13,13,13,0.45)",marginBottom:20}}>Your coverage is personalised to how you work</div>
        <div className="role-grid">
          {ROLES.map(r=>(
            <div key={r.id} className={"role-opt"+(role===r.id?" sel":"")} onClick={()=>setRole(r.id)}>
              <div className="remoji">{r.emoji}</div>
              <div className="rname">{r.name}</div>
              <div className="rsub">{r.sub}</div>
            </div>
          ))}
        </div>
        {role&&(
          <div className="card" style={{margin:"0 0 14px",background:"var(--green-muted)",border:"1.5px solid var(--green)"}}>
            <div style={{fontSize:13,fontWeight:600,color:"var(--green)",marginBottom:5}}>{ri?.emoji} Covered for {ri?.name}</div>
            {ROLE_COV[role]?.map(c=><div key={c} style={{fontSize:12,color:"var(--green)",padding:"2px 0"}}>{"✓ "+c}</div>)}
          </div>
        )}
        <button className="btn btn-primary" disabled={!role} onClick={()=>setStep(1)}>Continue →</button>
      </div>
    </div>
  )

  if(step===1) return (
    <div className="app-shell">
      <StepNav s={2}/>
      <div style={{padding:"26px 16px 0"}}>
        <div style={{fontFamily:"Syne",fontSize:23,fontWeight:800,marginBottom:5}}>Your platform</div>
        <div style={{fontSize:14,color:"rgba(13,13,13,0.45)",marginBottom:20}}>We verify your worker ID to prevent fraud</div>
        <div className="field"><label>Platform</label>
          <select value={form.platform} onChange={e=>set("platform",e.target.value)}>
            <option value="">Select platform</option>
            {PLATFORMS.map(p=><option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
          </select>
        </div>
        <div className="field"><label>Worker ID</label><input placeholder="e.g. ZPT-884921" value={form.platform_id} onChange={e=>set("platform_id",e.target.value)}/></div>
        <div className="field"><label>Dark store zone</label>
          <select value={form.zone} onChange={e=>set("zone",e.target.value)}>
            <option value="">Select zone</option>
            {ZONES.map(z=><option key={z} value={z}>{z}</option>)}
          </select>
        </div>
        <div className="field"><label>Shift</label>
          <select value={form.shift} onChange={e=>set("shift",e.target.value)}>
            <option value="">Select shift</option>
            {SHIFTS.map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)+" shift"}</option>)}
          </select>
        </div>
        <div className="field"><label>Weeks of experience</label><input type="number" value={form.experience_weeks} onChange={e=>set("experience_weeks",e.target.value)}/></div>
        <div style={{display:"flex",gap:8,marginTop:8}}>
          <button className="btn btn-outline" onClick={()=>setStep(0)} style={{width:"auto",padding:"13px 18px"}}>← Back</button>
          <button className="btn btn-primary" disabled={!form.platform||!form.platform_id||!form.zone||!form.shift} onClick={()=>setStep(2)}>Continue →</button>
        </div>
      </div>
    </div>
  )

  if(step===2) return (
    <div className="app-shell">
      <StepNav s={3}/>
      <div style={{padding:"26px 16px 0"}}>
        <div style={{fontFamily:"Syne",fontSize:23,fontWeight:800,marginBottom:5}}>Income baseline</div>
        <div style={{fontSize:14,color:"rgba(13,13,13,0.45)",marginBottom:20}}>Our AI estimates your income from workers like you</div>
        <div className="card" style={{background:"var(--blue-light)",border:"1.5px solid var(--blue)",margin:"0 0 14px"}}>
          <div style={{fontSize:12,color:"var(--blue)",fontWeight:600,marginBottom:3}}>AI model estimate</div>
          <div style={{fontSize:13,color:"var(--blue)"}}>{"Based on "+form.platform+" "+role+"s in "+form.zone+" on "+form.shift+" shift. Corrections above the 95th percentile are soft-capped until week 4 data confirms."}</div>
        </div>
        <div className="field"><label>Your estimated daily income (optional)</label><input type="number" placeholder="₹ per day — leave blank to use AI estimate" value={form.income_correction} onChange={e=>set("income_correction",e.target.value)}/></div>
        {error&&<div className="err">{error}</div>}
        <div style={{display:"flex",gap:8,marginTop:8}}>
          <button className="btn btn-outline" onClick={()=>setStep(1)} style={{width:"auto",padding:"13px 18px"}}>← Back</button>
          <button className="btn btn-primary" disabled={loading} onClick={doOnboard}>{loading?"Setting up...":"Create my account →"}</button>
        </div>
      </div>
    </div>
  )

  if(step===3&&worker) return (
    <div className="app-shell">
      <StepNav s={4}/>
      <div style={{padding:"26px 16px 0"}}>
        <div style={{fontFamily:"Syne",fontSize:23,fontWeight:800,marginBottom:14}}>Choose your cover</div>
        <div className="hero-stat" style={{margin:"0 0 18px"}}>
          <div className="lbl">Your AI income baseline</div>
          <div className="amt">{"₹"+worker.daily_baseline.toFixed(0)}<span style={{fontSize:18,fontWeight:400}}>/day</span></div>
          {worker.flagged&&<div style={{fontSize:11,background:"rgba(212,130,42,0.2)",color:"#ffd080",padding:"5px 9px",borderRadius:7,marginTop:8}}>⚠ Income flagged — capped at cohort median until week 4</div>}
        </div>
        <div className="tier-grid">
          {TIERS.map(t=>(
            <div key={t} className={"tier-opt"+(tier===t?" sel":"")} onClick={()=>setTier(t)}>
              <div className="tname">{t}</div>
              <div className="tprice">{TIER_INFO[t].min+"/wk"}</div>
              <div className="tcov">{TIER_INFO[t].cov+" income"}</div>
            </div>
          ))}
        </div>
        <div className="card" style={{margin:"0 0 14px"}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:3}}>{"Included — "+tier}</div>
          <div style={{fontSize:12,color:"rgba(13,13,13,0.5)"}}>{TIER_INFO[tier].triggers}</div>
        </div>
        {error&&<div className="err">{error}</div>}
        <button className="btn btn-primary" disabled={loading} onClick={doPremium}>{loading?"Calculating...":"Calculate my premium →"}</button>
      </div>
    </div>
  )

  if(step===4&&pdata) return (
    <div className="app-shell" style={{paddingBottom:36}}>
      <div className="nav"><div className="nav-logo">ShieldPay</div><div style={{fontSize:11,color:"rgba(13,13,13,0.38)"}}>Almost there</div></div>
      <div style={{padding:"26px 16px 0"}}>
        <div style={{fontFamily:"Syne",fontSize:23,fontWeight:800,marginBottom:14}}>Your weekly premium</div>
        <div className="hero-stat" style={{margin:"0 0 14px"}}>
          <div className="lbl">Charged every Monday — after your payout lands</div>
          <div className="amt">{"₹"+pdata.weekly_premium.toFixed(0)}<span style={{fontSize:16,fontWeight:400}}>/week</span></div>
        </div>
        <div className="slabel" style={{padding:"0 0 6px"}}>Trigger risk breakdown</div>
        <div className="card" style={{margin:"0 0 14px"}}>
          {Object.entries(pdata.breakdown).map(([k,v])=>(
            <div className="brow" key={k}>
              <span className="blbl" style={{textTransform:"capitalize"}}>{k.replace("_"," ")}</span>
              <span className="bval">{"₹"+v.toFixed(2)+"/day"}</span>
            </div>
          ))}
        </div>
        <div className="card" style={{margin:"0 0 18px",background:"var(--green-muted)",border:"1.5px solid var(--green)"}}>
          <div style={{fontSize:13,color:"var(--green)"}}><strong>Earn first, then pay.</strong> Deducted every Monday after your weekly platform payout has settled.</div>
        </div>
        <button className="btn btn-green" onClick={()=>onDone({worker,pdata,role,phone,tier,zone:form.zone})}>Activate coverage →</button>
      </div>
    </div>
  )
  return null
}

function Home({ session }) {
  const { worker, pdata, role, zone, tier } = session
  const ri = ROLES.find(r=>r.id===role)
  const [earnings, setEarnings] = useState(null)
  const [weather, setWeather]   = useState(null)

  useEffect(()=>{
    if(worker?.worker_id) {
      axios.get(API+"/payout/history/"+worker.worker_id).then(r=>setEarnings(r.data)).catch(()=>{})
    }
    if(zone) {
      axios.get(API+"/weather/check/"+zone).then(r=>setWeather(r.data)).catch(()=>{})
    }
  },[])

  return (
    <div className="pb-nav">
      <div className="nav">
        <div className="nav-logo">ShieldPay</div>
        <div className={"nav-badge role-"+role}>{ri?.emoji+" "+ri?.name}</div>
      </div>

      {weather&&(
        <div className="weather-widget">
          <div style={{fontSize:10,opacity:0.6,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Live zone weather · {zone}</div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontFamily:"Syne",fontSize:28,fontWeight:800}}>{weather.temp_c?.toFixed(0)}°C</div>
              <div style={{fontSize:12,opacity:0.7,marginTop:2}}>{weather.description}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:13,fontWeight:600}}>{weather.rainfall_mm>0?weather.rainfall_mm+"mm rain":"No rain"}</div>
              <div style={{fontSize:11,opacity:0.6,marginTop:2}}>{weather.source}</div>
              {weather.trigger_fired&&<div style={{marginTop:6,background:"rgba(255,255,255,0.2)",borderRadius:8,padding:"4px 8px",fontSize:11,fontWeight:700}}>⚡ Trigger threshold crossed</div>}
            </div>
          </div>
        </div>
      )}

      <div className="hero-stat" style={{margin:"12px 16px 0"}}>
        <div className="flex-between">
          <div className="lbl">Coverage status</div>
          <div className="policy-active">Active</div>
        </div>
        <div className="amt">{"₹"+(pdata?.weekly_premium?.toFixed(0))}<span style={{fontSize:16,fontWeight:400,opacity:0.55}}>/week</span></div>
        <div style={{fontSize:12,opacity:0.5,marginTop:3}}>{zone+" · "+tier+" tier"}</div>
      </div>

      <div className="stat-grid" style={{marginTop:12}}>
        <div className="stat-box">
          <div className="s-lbl">Earnings protected</div>
          <div className="s-val" style={{color:"var(--green)"}}>{"₹"+(earnings?.earnings_protected?.toFixed(0)||"0")}</div>
          <div className="s-sub">{earnings?.total_payouts||0} payouts received</div>
        </div>
        <div className="stat-box">
          <div className="s-lbl">Weekly coverage</div>
          <div className="s-val">{TIER_INFO[tier]?.cov}</div>
          <div className="s-sub">of lost income</div>
        </div>
      </div>

      <div className="slabel">Your protection</div>
      <div className="card">
        <div style={{fontSize:13,fontWeight:600,marginBottom:9}}>Covered triggers</div>
        {ROLE_COV[role]?.map(c=><div className="cov-item" key={c}><span className="cov-y">✓</span><span style={{fontSize:13}}>{c}</span></div>)}
      </div>

      <div className="slabel">ShieldCredit score</div>
      <div className="fs-bar">
        <div className="flex-between">
          <div><div style={{fontSize:10,opacity:0.45}}>Financial identity building</div><div style={{fontFamily:"Syne",fontSize:19,fontWeight:800,marginTop:2}}>Week 1 of 13</div></div>
          <div style={{textAlign:"right"}}><div style={{fontSize:10,opacity:0.45}}>Next milestone</div><div style={{fontSize:12,fontWeight:600,marginTop:2}}>15% off premium</div></div>
        </div>
        <div style={{display:"flex",gap:5,marginTop:11,flexWrap:"wrap"}}>
          {Array.from({length:13}).map((_,i)=><div key={i} className={"sdot "+(i===0?"dfull":"dempty")}>{i===0?"✓":""}</div>)}
        </div>
        <div style={{fontSize:10,opacity:0.35,marginTop:8}}>13 clean weeks = 15% discount · 3 quarters = ShieldCredit credit line</div>
      </div>
    </div>
  )
}

function Policy({ session }) {
  const { worker, pdata, role, tier } = session
  const ri = ROLES.find(r=>r.id===role)
  return (
    <div className="pb-nav">
      <div className="nav"><div className="nav-logo">My Policy</div><div className={"nav-badge role-"+role}>{ri?.name}</div></div>
      <div className="slabel">Policy details</div>
      <div className="card">
        {[["Policy holder","Worker #"+(worker?.worker_id||"—")],["Role",(ri?.emoji+" "+ri?.name)],["Tier",tier],["Coverage ratio",(TIER_INFO[tier]?.cov+" of lost income")],["Daily baseline",("₹"+worker?.daily_baseline?.toFixed(0)+"/day")],["Weekly premium",("₹"+pdata?.weekly_premium?.toFixed(0)+"/week")],["Deduction day","Every Monday"],["Status","Active ✓"]].map(([k,v])=>(
          <div className="brow" key={k}><span className="blbl">{k}</span><span className="bval" style={{textTransform:"capitalize"}}>{v}</span></div>
        ))}
      </div>
      <div className="slabel">{"What's covered"}</div>
      <div className="card">
        {ROLE_COV[role]?.map(c=><div className="cov-item" key={c}><span className="cov-y">✓</span><span style={{fontSize:13}}>{c}</span></div>)}
      </div>
      <div className="slabel">{"What's excluded"}</div>
      <div className="card">
        {["Health or medical expenses","Vehicle repairs or accidents","Life insurance","Personal income loss"].map(e=>(
          <div className="cov-item" key={e}><span className="cov-n">✕</span><span style={{fontSize:13,color:"rgba(13,13,13,0.4)"}}>{e}</span></div>
        ))}
      </div>
      <div className="slabel">Two-signal rule</div>
      <div className="card" style={{background:"var(--blue-light)",border:"1.5px solid var(--blue)"}}>
        <div style={{fontSize:13,color:"var(--blue)",lineHeight:1.6}}>Payout fires only when <strong>two independent signals</strong> confirm your loss: an external trigger (IMD/CPCB/NDMA) AND a verified order volume drop above 40% in your 2km zone.</div>
      </div>
    </div>
  )
}

function Claims({ session }) {
  const { worker, zone } = session
  const [tab, setTab]     = useState("live")
  const [ttype, setTtype] = useState("rain")
  const [sev, setSev]     = useState("partial")
  const [state, setState] = useState("idle")
  const [result, setResult] = useState(null)
  const [err, setErr]     = useState("")
  const [showRec, setShowRec] = useState(false)
  const [fraudResult, setFraudResult] = useState(null)
  const [hist, setHist]   = useState([
    {icon:"🌧",title:"Heavy rain trigger",date:"Mar 18, 2026",amt:"₹312"},
    {icon:"🏭",title:"Bandh — city shutdown",date:"Mar 10, 2026",amt:"₹580"},
  ])
  const [mtype, setMtype]   = useState("")
  const [mreason, setMreason] = useState("")
  const [mloss, setMloss]   = useState("")
  const [mdone, setMdone]   = useState(false)
  const [mload, setMload]   = useState(false)
  const myP    = result?.payouts?.find(p=>p.worker_id===worker?.worker_id)
  const stages = ["monitoring","confirmed","calculating","paid"]
  const si     = stages.indexOf(state)
  const stateMsg = {monitoring:"Checking trigger signals...",confirmed:"Trigger confirmed — verifying order drop...",calculating:"Two-signal confirmed — calculating payout...",paid:"Payout processed",blocked:"No payout — conditions not met"}

  const fire = async () => {
    setState("monitoring"); setErr(""); setResult(null); setShowRec(false); setFraudResult(null)
    await new Promise(r=>setTimeout(r,1100)); setState("confirmed")
    await new Promise(r=>setTimeout(r,900));  setState("calculating")
    try {
      // Run fraud check first
      if(worker?.worker_id) {
        const fc = await axios.post(API+"/fraud/check",{
          worker_id: worker.worker_id,
          trigger_type: ttype,
          claimed_zone: zone,
          gps_lat: 13.0012 + (Math.random()-0.5)*0.01,
          gps_lng: 80.2565 + (Math.random()-0.5)*0.01,
          gps_accuracy_m: Math.random()*30+5,
          claim_amount: worker.daily_baseline * 0.5
        }).catch(()=>null)
        if(fc?.data) setFraudResult(fc.data)
      }
      const res = await axios.post(API+"/trigger/simulate",{zone,trigger_type:ttype,severity:sev})
      setResult(res.data)
      await new Promise(r=>setTimeout(r,600)); setState("paid")
      const mp = res.data.payouts?.find(p=>p.worker_id===worker?.worker_id)
      if(mp?.status==="processed") setHist(h=>[{icon:TICONS[ttype]||"⚠",title:TNAMES[ttype],date:new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}),amt:"₹"+mp.amount.toFixed(0)},...h])
      setTimeout(()=>setShowRec(true),500)
    } catch(e) {
      setErr(e.response?.data?.detail||"Trigger check failed — order volume drop below 40% threshold.")
      setState("blocked")
    }
  }

  const submitManual = async () => {
    if(!mtype||!mreason) return
    setMload(true); await new Promise(r=>setTimeout(r,900)); setMload(false); setMdone(true)
  }

  const confidenceColor = (s) => s>=75?"var(--green)":s>=50?"var(--amber)":"var(--red)"

  return (
    <div className="pb-nav">
      {showRec&&result&&<Receipt result={result} myPayout={myP} triggerType={ttype} zone={zone} onClose={()=>{setShowRec(false);setState("idle");setResult(null);setErr("");}}/>}
      <div className="nav"><div className="nav-logo">Claims</div><div className="policy-active">Parametric</div></div>
      <div className="tabs">
        <button className={"tab"+(tab==="live"?" active":"")} onClick={()=>setTab("live")}>Live trigger</button>
        <button className={"tab"+(tab==="history"?" active":"")} onClick={()=>setTab("history")}>History</button>
        <button className={"tab"+(tab==="manual"?" active":"")} onClick={()=>setTab("manual")}>Manual</button>
      </div>

      {tab==="live"&&(
        <>
          <div className="card" style={{margin:"0 16px 12px",background:"var(--green-muted)",border:"1.5px solid var(--green)"}}>
            <div style={{fontSize:13,color:"var(--green)",lineHeight:1.6}}><strong>Zero-touch claims.</strong> When a trigger fires and both signals confirm, your payout processes automatically. No form. No call. No waiting.</div>
          </div>
          <div className="card">
            <div style={{fontFamily:"Syne",fontSize:14,fontWeight:700,marginBottom:13}}>Simulate disruption trigger</div>
            <div className="field" style={{marginBottom:9}}>
              <label>Trigger type</label>
              <select value={ttype} onChange={e=>setTtype(e.target.value)} disabled={si>0&&si<4&&state!=="blocked"}>
                <option value="rain">🌧 Heavy rainfall</option>
                <option value="aqi">😮‍💨 Poor AQI</option>
                <option value="bandh">🚫 Bandh / curfew</option>
                <option value="power">⚡ Power outage</option>
                <option value="platform_outage">📵 Platform outage</option>
              </select>
            </div>
            <div className="field" style={{marginBottom:13}}>
              <label>Severity</label>
              <select value={sev} onChange={e=>setSev(e.target.value)} disabled={si>0&&si<4&&state!=="blocked"}>
                <option value="partial">Partial disruption (50% payout)</option>
                <option value="full">Full disruption (100% payout)</option>
              </select>
            </div>
            <button className="btn btn-primary" onClick={()=>{setState("idle");setTimeout(fire,50)}} disabled={state==="monitoring"||state==="confirmed"||state==="calculating"}>
              {state==="monitoring"||state==="confirmed"||state==="calculating"?"Processing...":"Fire trigger →"}
            </button>
          </div>

          {fraudResult&&(
            <div className="card" style={{margin:"0 16px 12px",border:"1.5px solid "+confidenceColor(fraudResult.confidence_score),background:fraudResult.confidence_score>=75?"var(--green-muted)":fraudResult.confidence_score>=50?"var(--amber-light)":"var(--red-light)"}}>
              <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8,color:confidenceColor(fraudResult.confidence_score)}}>Fraud check · AI confidence score</div>
              <div className="flex-between" style={{marginBottom:6}}>
                <span style={{fontFamily:"Syne",fontSize:28,fontWeight:800,color:confidenceColor(fraudResult.confidence_score)}}>{fraudResult.confidence_score}<span style={{fontSize:14}}>/100</span></span>
                <span style={{fontSize:12,fontWeight:600,color:confidenceColor(fraudResult.confidence_score),textTransform:"capitalize"}}>{fraudResult.decision?.replace("_"," ")}</span>
              </div>
              <div className="confidence-bar">
                <div className="confidence-fill" style={{width:fraudResult.confidence_score+"%",background:confidenceColor(fraudResult.confidence_score)}}/>
              </div>
              <div style={{fontSize:12,marginTop:8,color:"rgba(13,13,13,0.6)"}}>{fraudResult.message}</div>
              {fraudResult.fraud_flags?.length>0&&(
                <div style={{marginTop:8}}>
                  {fraudResult.fraud_flags.map(f=><div key={f} style={{fontSize:11,color:"var(--red)",padding:"2px 0"}}>⚠ {f}</div>)}
                </div>
              )}
            </div>
          )}

          {state!=="idle"&&(
            <div className={"claim-live"+(state==="paid"?" paid":"")+(state==="blocked"?" blocked":"")} style={{borderColor:state==="blocked"?"var(--red)":undefined,background:state==="blocked"?"var(--red-light)":undefined}}>
              <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:7,color:state==="blocked"?"var(--red)":state==="paid"?"var(--green)":"var(--amber)"}}>{stateMsg[state]}</div>
              <div style={{display:"flex",gap:5,marginBottom:12}}>
                {stages.map((s,i)=><div key={s} style={{flex:1,height:4,borderRadius:2,background:si>=i?(state==="blocked"?"var(--red)":"var(--green)"):"rgba(13,13,13,0.1)",transition:"background 0.3s"}}/>)}
              </div>
              {state==="paid"&&myP&&(
                <div>
                  <div style={{fontSize:11,opacity:0.55,marginBottom:2}}>{myP.status==="processed"?"Transferred to your UPI":"Held for review"}</div>
                  <div style={{fontFamily:"Syne",fontSize:34,fontWeight:800,color:myP.status==="processed"?"var(--green)":"var(--amber)"}}>{"₹"+myP.amount.toFixed(0)}</div>
                  <div style={{fontSize:12,marginTop:5,opacity:0.5}}>{"Order drop: "+((result?.order_drop_pct||0)*100).toFixed(0)+"% confirmed · "+zone}</div>
                  {!showRec&&<button className="btn btn-outline" style={{marginTop:10,fontSize:12,padding:"9px"}} onClick={()=>setShowRec(true)}>View receipt →</button>}
                </div>
              )}
              {state==="blocked"&&<div style={{fontSize:13,color:"var(--red)"}}>{err}</div>}
            </div>
          )}
        </>
      )}

      {tab==="history"&&(
        <div className="card">
          {hist.map((c,i)=>(
            <div className="claim-row" key={i}>
              <div style={{fontSize:20}}>{c.icon}</div>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500}}>{c.title}</div><div style={{fontSize:11,color:"rgba(13,13,13,0.38)",marginTop:2}}>{c.date}</div></div>
              <div style={{textAlign:"right"}}><div style={{fontFamily:"Syne",fontSize:15,fontWeight:700,color:"var(--green)"}}>{c.amt}</div><div style={{fontSize:10,color:"var(--green)"}}>Paid</div></div>
            </div>
          ))}
        </div>
      )}

      {tab==="manual"&&(
        <>
          <div className="card" style={{margin:"0 16px 12px",background:"var(--amber-light)",border:"1.5px solid var(--amber)"}}>
            <div style={{fontSize:13,color:"var(--amber)",lineHeight:1.6}}><strong>Manual claim fallback.</strong> If our system missed a real disruption — GPS was offline, or order drop narrowly missed 40% — raise it here. A reviewer will assess within 24 hours.</div>
          </div>
          {!mdone?(
            <div className="card">
              <div style={{fontFamily:"Syne",fontSize:14,fontWeight:700,marginBottom:13}}>Raise a manual claim</div>
              <div className="field"><label>Disruption type</label>
                <select value={mtype} onChange={e=>setMtype(e.target.value)}>
                  <option value="">Select type</option>
                  <option value="rain">Heavy rainfall</option>
                  <option value="aqi">Poor AQI</option>
                  <option value="bandh">Bandh / civil disruption</option>
                  <option value="power">Power outage</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="field"><label>What happened?</label><textarea placeholder="e.g. Heavy rain flooded the road outside our store. I could not complete any orders between 3pm and 7pm..." value={mreason} onChange={e=>setMreason(e.target.value)}/></div>
              <div className="field"><label>Estimated income lost (₹)</label><input type="number" placeholder="₹ estimated loss" value={mloss} onChange={e=>setMloss(e.target.value)}/></div>
              <button className="btn btn-amber" disabled={!mtype||!mreason||mload} onClick={submitManual}>{mload?"Submitting...":"Submit for review →"}</button>
            </div>
          ):(
            <div className="card" style={{background:"var(--green-muted)",border:"1.5px solid var(--green)"}}>
              <div style={{textAlign:"center",padding:"18px 0"}}>
                <div style={{fontSize:38,marginBottom:10}}>✓</div>
                <div style={{fontFamily:"Syne",fontSize:17,fontWeight:800,color:"var(--green)"}}>Claim submitted</div>
                <div style={{fontSize:13,color:"var(--green)",marginTop:7,opacity:0.8}}>{"Reference: MC-"+Date.now().toString().slice(-6)}<br/>Reviewer will assess within 24 hours.</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Premium({ session }) {
  const { pdata, role, tier } = session
  const ri = ROLES.find(r=>r.id===role)
  const [fopen, setFopen] = useState(false)
  return (
    <div className="pb-nav">
      <div className="nav"><div className="nav-logo">My Premium</div><div style={{fontSize:11,color:"rgba(13,13,13,0.38)"}}>AI-calculated</div></div>
      <div className="hero-stat" style={{margin:"16px 16px 0"}}>
        <div className="lbl">This week's premium</div>
        <div className="amt">{"₹"+(pdata?.weekly_premium?.toFixed(0))}</div>
        <div style={{fontSize:12,opacity:0.5,marginTop:3}}>{"Deducted Monday · "+tier+" tier · "+ri?.name}</div>
      </div>
      <div className="slabel">How your premium is calculated</div>
      <div className="card">
        <div className="flex-between" style={{marginBottom:10}}>
          <div style={{fontSize:13,fontWeight:600}}>Plain English</div>
          <button className="formula-btn" onClick={()=>setFopen(f=>!f)}>{"ⓘ "+(fopen?"Hide":"Show")+" formula"}</button>
        </div>
        <div style={{fontSize:13,color:"rgba(13,13,13,0.6)",lineHeight:1.7}}>Our AI looks at how often disruptions happen in your zone, how much they cut your earnings based on your role, and how much your tier covers. It adds those up across all trigger types to find your expected weekly loss — then scales up to cover running costs.</div>
        {fopen&&(
          <div className="formula-box">
            {"E[L] = Σ P(trigger_i) × baseline_daily"}<br/>
            {"       × coeff_i × role_mult_i × coverage"}<br/><br/>
            {"Premium = max(₹29, min(E[L] ÷ 0.35, 2% weekly income))"}<br/><br/>
            <span style={{opacity:0.5,fontSize:10}}>
              {"• P(trigger) = historical probability this week"}<br/>
              {"• coeff = order drop % for trigger + role"}<br/>
              {"• 0.35 = claims pool fraction of every rupee"}<br/>
              {"• ₹29 = affordability floor · 2% = cap"}
            </span>
          </div>
        )}
      </div>
      <div className="slabel">Trigger risk breakdown</div>
      <div className="card">
        {pdata&&Object.entries(pdata.breakdown).map(([k,v])=>(
          <div key={k} style={{marginBottom:11}}>
            <div className="flex-between" style={{marginBottom:3}}>
              <span style={{fontSize:13,textTransform:"capitalize"}}>{k.replace("_"," ")}</span>
              <span style={{fontFamily:"Syne",fontSize:13,fontWeight:700}}>{"₹"+v.toFixed(2)+"/day"}</span>
            </div>
            <div className="ptk"><div className="pfill" style={{width:(Math.min(100,(v/8)*100))+"%"}}/></div>
          </div>
        ))}
      </div>
      <div className="slabel">Where your premium goes</div>
      <div className="card">
        {[{l:"Claims pool — paid to workers",p:35,c:"var(--green)"},{l:"Operations & tech",p:25,c:"var(--blue)"},{l:"Risk reserve (liquid MFs @ 6.5%)",p:20,c:"var(--amber)"},{l:"Profit margin",p:20,c:"rgba(13,13,13,0.22)"}].map(item=>(
          <div key={item.l} style={{marginBottom:11}}>
            <div className="flex-between" style={{marginBottom:3}}>
              <span style={{fontSize:12}}>{item.l}</span>
              <span style={{fontSize:12,fontWeight:600}}>{item.p+"%"}</span>
            </div>
            <div className="ptk"><div style={{height:"100%",width:item.p+"%",background:item.c,borderRadius:2}}/></div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── ROOT ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState("landing")
  const [phone, setPhone]   = useState("")
  const [session, setSession] = useState(null)
  const [tab, setTab]       = useState("home")
  return (
    <>
      <style>{css}</style>
      {screen==="landing"&&<Landing onEnter={(ph)=>{setPhone(ph);setScreen("onboard")}} onAdmin={()=>setScreen("adminlogin")}/>}
      {screen==="adminlogin"&&<AdminLogin onLogin={()=>setScreen("admin")}/>}
      {screen==="admin"&&<AdminDashboard onExit={()=>setScreen("landing")}/>}
      {screen==="onboard"&&<Onboard phone={phone} onDone={s=>{setSession(s);setScreen("app");setTab("home")}}/>}
      {screen==="app"&&session&&(
        <div className="app-shell">
          {tab==="home"   &&<Home    session={session}/>}
          {tab==="policy" &&<Policy  session={session}/>}
          {tab==="claims" &&<Claims  session={session}/>}
          {tab==="premium"&&<Premium session={session}/>}
          <div className="bottom-nav">
            {[{id:"home",icon:"🏠",label:"Home"},{id:"policy",icon:"📋",label:"Policy"},{id:"claims",icon:"⚡",label:"Claims"},{id:"premium",icon:"📊",label:"Premium"}].map(n=>(
              <button key={n.id} className={"bnav-item"+(tab===n.id?" active":"")} onClick={()=>setTab(n.id)}>
                <span className="ni">{n.icon}</span>{n.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}