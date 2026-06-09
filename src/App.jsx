import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

const API = "https://investimentos-backend.onrender.com";

const CLASSES = ["Ações B3","FIIs B3","Ações EUA","Real Estate EUA","Renda Fixa EUA","Bitcoin","Tesouro Direto","CDB/LCI/LCA"];
const INVESTORS = ["Todos","Vitor","Larissa"];
const COLORS = {
  "Ações B3":"#60a5fa","FIIs B3":"#34d399","Ações EUA":"#a78bfa","Real Estate EUA":"#fb923c",
  "Renda Fixa EUA":"#fbbf24","Bitcoin":"#f97316","Tesouro Direto":"#f472b6","CDB/LCI/LCA":"#4ade80"
};
const CLASS_GOALS = {
  "Vitor":{"Ações B3":30,"FIIs B3":10,"Ações EUA":25,"Real Estate EUA":10,"Bitcoin":15,"Tesouro Direto":5,"CDB/LCI/LCA":5},
  "Larissa":{"Ações B3":15,"FIIs B3":25,"Ações EUA":20,"Real Estate EUA":20,"Renda Fixa EUA":5,"Tesouro Direto":10,"CDB/LCI/LCA":5}
};
const GOALS_TOTAL = { Vitor: 200000, Larissa: 150000 };
const STORAGE_KEY = "inv_app_v3";

const HIST = [
  {mes:"Jul/25",vitor:78000,larissa:58000},{mes:"Ago/25",vitor:80500,larissa:60000},
  {mes:"Set/25",vitor:82000,larissa:61500},{mes:"Out/25",vitor:85000,larissa:63000},
  {mes:"Nov/25",vitor:87500,larissa:65000},{mes:"Dez/25",vitor:91000,larissa:68000},
  {mes:"Jan/26",vitor:95000,larissa:73000},{mes:"Fev/26",vitor:97500,larissa:74500},
  {mes:"Mar/26",vitor:99000,larissa:76000},{mes:"Abr/26",vitor:101500,larissa:77000},
  {mes:"Mai/26",vitor:103000,larissa:79000},{mes:"Jun/26",vitor:105800,larissa:81100},
];

const MOCK_ASSETS = [
  {id:1,ticker:"PETR4",nome:"Petrobras",classe:"Ações B3",investidor:"Vitor",qtd:200,preco_medio:32.50,preco_atual:36.80,moeda:"BRL",proventos:320},
  {id:2,ticker:"MXRF11",nome:"Maxi Renda",classe:"FIIs B3",investidor:"Larissa",qtd:150,preco_medio:10.20,preco_atual:10.55,moeda:"BRL",proventos:180},
  {id:3,ticker:"ITUB4",nome:"Itaú Unibanco",classe:"Ações B3",investidor:"Vitor",qtd:300,preco_medio:25.10,preco_atual:28.40,moeda:"BRL",proventos:210},
  {id:4,ticker:"HGLG11",nome:"CSHG Logística",classe:"FIIs B3",investidor:"Larissa",qtd:80,preco_medio:158.00,preco_atual:162.50,moeda:"BRL",proventos:640},
  {id:5,ticker:"AAPL",nome:"Apple Inc.",classe:"Ações EUA",investidor:"Vitor",qtd:10,preco_medio:170.00,preco_atual:189.50,moeda:"USD",proventos:22},
  {id:6,ticker:"O",nome:"Realty Income",classe:"Real Estate EUA",investidor:"Larissa",qtd:50,preco_medio:52.00,preco_atual:55.20,moeda:"USD",proventos:148},
  {id:7,ticker:"BTC",nome:"Bitcoin",classe:"Bitcoin",investidor:"Vitor",qtd:0.25,preco_medio:280000,preco_atual:340000,moeda:"BRL",proventos:0},
  {id:8,ticker:"TESOURO IPCA+",nome:"Tesouro IPCA+ 2035",classe:"Tesouro Direto",investidor:"Larissa",qtd:1,preco_medio:5000,preco_atual:5420,moeda:"BRL",proventos:210},
  {id:9,ticker:"CDB XYZ",nome:"CDB 120% CDI",classe:"CDB/LCI/LCA",investidor:"Vitor",qtd:1,preco_medio:10000,preco_atual:10650,moeda:"BRL",proventos:650},
];
const MOCK_PROVS = [
  {id:1,ticker:"PETR4",tipo:"JCP",valor:180,data:"2026-05-15",investidor:"Vitor",moeda:"BRL"},
  {id:2,ticker:"PETR4",tipo:"Dividendo",valor:140,data:"2026-04-10",investidor:"Vitor",moeda:"BRL"},
  {id:3,ticker:"MXRF11",tipo:"Rendimento",valor:90,data:"2026-05-20",investidor:"Larissa",moeda:"BRL"},
  {id:4,ticker:"MXRF11",tipo:"Rendimento",valor:90,data:"2026-04-20",investidor:"Larissa",moeda:"BRL"},
  {id:5,ticker:"HGLG11",tipo:"Rendimento",valor:320,data:"2026-05-20",investidor:"Larissa",moeda:"BRL"},
  {id:6,ticker:"HGLG11",tipo:"Rendimento",valor:320,data:"2026-04-20",investidor:"Larissa",moeda:"BRL"},
  {id:7,ticker:"AAPL",tipo:"Dividendo",valor:11,data:"2026-05-15",investidor:"Vitor",moeda:"USD"},
  {id:8,ticker:"O",tipo:"Dividendo",valor:74,data:"2026-05-01",investidor:"Larissa",moeda:"USD"},
  {id:9,ticker:"O",tipo:"Dividendo",valor:74,data:"2026-04-01",investidor:"Larissa",moeda:"USD"},
  {id:10,ticker:"CDB XYZ",tipo:"Rendimento",valor:325,data:"2026-05-31",investidor:"Vitor",moeda:"BRL"},
  {id:11,ticker:"TESOURO IPCA+",tipo:"Rendimento",valor:210,data:"2026-05-31",investidor:"Larissa",moeda:"BRL"},
];

const fmt = (v, d=2) => isNaN(v) ? "—" : v.toLocaleString("pt-BR", {minimumFractionDigits:d, maximumFractionDigits:d});
const fmtBRL = v => "R$ " + fmt(v);
const fmtUSD = v => "US$ " + fmt(v);
const fmtPct = v => (v >= 0 ? "+" : "") + fmt(v, 2) + "%";

function loadState() { try { const s = localStorage.getItem(STORAGE_KEY); if (s) return JSON.parse(s); } catch(e){} return null; }
function saveState(s) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch(e){} }
function toVal(a, r=5.25) { return a.qtd * a.preco_atual * (a.moeda === "USD" ? r : 1); }
function toCusto(a, r=5.25) { return a.qtd * a.preco_medio * (a.moeda === "USD" ? r : 1); }
function toRent(a, r=5.25) { const v=toVal(a,r), c=toCusto(a,r); return c>0?(v-c)/c*100:0; }

function StatusBadge({ status, msg }) {
  const cfg = {
    ok:      { bg:"rgba(52,211,153,0.2)",  color:"#6ee7b7", icon:"ti-circle-check" },
    loading: { bg:"rgba(96,165,250,0.2)",  color:"#93c5fd", icon:"ti-loader" },
    error:   { bg:"rgba(248,113,113,0.2)", color:"#fca5a5", icon:"ti-alert-circle" },
    warn:    { bg:"rgba(251,191,36,0.2)",  color:"#fde68a", icon:"ti-alert-triangle" },
  };
  const c = cfg[status] || cfg.warn;
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:20,background:c.bg,color:c.color,fontSize:11,fontWeight:500}}>
      <i className={`ti ${c.icon}${status==="loading"?" spin":""}`} style={{fontSize:12}} />
      {msg}
    </span>
  );
}

export default function App() {
  const saved = loadState();
  const [assets, setAssets] = useState(saved?.assets || MOCK_ASSETS);
  const [provs, setProvs] = useState(saved?.provs || MOCK_PROVS);
  const [tab, setTab] = useState("dashboard");
  const [investor, setInvestor] = useState("Todos");
  const [usdBrl, setUsdBrl] = useState(saved?.usdBrl || 5.25);
  const [indicadores, setIndicadores] = useState(saved?.indicadores || null);
  const [apiStatus, setApiStatus] = useState({ cotacoes:"idle", cambio:"idle", indicadores:"idle" });
  const [lastUpdate, setLastUpdate] = useState(saved?.lastUpdate || null);
  const [subTab, setSubTab] = useState("op");
  const [form, setForm] = useState({tipo:"compra",ticker:"",nome:"",classe:"Ações B3",investidor:"Vitor",qtd:"",preco:"",data:new Date().toISOString().split("T")[0],moeda:"BRL"});
  const [pForm, setPForm] = useState({ticker:"",tipo:"Dividendo",valor:"",data:new Date().toISOString().split("T")[0],investidor:"Vitor",moeda:"BRL"});
  const [saving, setSaving] = useState(false);
  const [apiLog, setApiLog] = useState([]);

  const dashChartRef = useRef(null); const dashChartInst = useRef(null);
  const chartRef = useRef(null);     const chartInst = useRef(null);
  const pieRef = useRef(null);       const pieInst = useRef(null);

  useEffect(() => { saveState({assets, provs, usdBrl, indicadores, lastUpdate}); }, [assets, provs, usdBrl, indicadores, lastUpdate]);

  const log = (msg, type="info") => setApiLog(p => [{msg, type, ts: new Date().toLocaleTimeString("pt-BR")}, ...p].slice(0, 15));

  const atualizarTudo = useCallback(async () => {
    setApiStatus({ cotacoes:"loading", cambio:"loading", indicadores:"loading" });
    log("Iniciando atualização...");

    // Câmbio
    try {
      const r = await fetch(`${API}/api/cambio`);
      const d = await r.json();
      if (d.usd_brl) { setUsdBrl(d.usd_brl); log(`Câmbio USD/BRL: R$ ${d.usd_brl.toFixed(4)}`, "ok"); }
      setApiStatus(s => ({...s, cambio:"ok"}));
    } catch(e) { log("Câmbio: erro", "error"); setApiStatus(s => ({...s, cambio:"error"})); }

    // Indicadores
    try {
      const r = await fetch(`${API}/api/indicadores`);
      const d = await r.json();
      setIndicadores(d);
      log(`CDI ${d.cdi_anual}% · Selic ${d.selic}% · IPCA ${d.ipca_mensal}%/mês`, "ok");
      setApiStatus(s => ({...s, indicadores:"ok"}));
    } catch(e) { log("Indicadores: erro", "error"); setApiStatus(s => ({...s, indicadores:"error"})); }

    // B3
    const b3 = assets.filter(a => ["Ações B3","FIIs B3"].includes(a.classe));
    if (b3.length > 0) {
      try {
        const tickers = b3.map(a => a.ticker).join(",");
        const r = await fetch(`${API}/api/cotacoes/b3?tickers=${tickers}`);
        const d = await r.json();
        if (d.cotacoes) {
          setAssets(prev => prev.map(a => { const q = d.cotacoes.find(c => c.ticker===a.ticker); return q ? {...a, preco_atual:q.preco, variacao_dia:q.variacao_dia} : a; }));
          log(`B3: ${d.cotacoes.length} ativo(s) atualizado(s)`, "ok");
        }
      } catch(e) { log("B3: erro ao buscar cotações", "error"); }
    }

    // EUA
    const eua = assets.filter(a => ["Ações EUA","Real Estate EUA","Renda Fixa EUA"].includes(a.classe));
    if (eua.length > 0) {
      try {
        const tickers = eua.map(a => a.ticker).join(",");
        const r = await fetch(`${API}/api/cotacoes/eua?tickers=${tickers}`);
        const d = await r.json();
        if (d.cotacoes) {
          setAssets(prev => prev.map(a => { const q = d.cotacoes.find(c => c.ticker===a.ticker); return q ? {...a, preco_atual:q.preco_usd, variacao_dia:q.variacao_dia} : a; }));
          log(`EUA: ${d.cotacoes.length} ativo(s) atualizado(s)`, "ok");
        }
      } catch(e) { log("EUA: erro ao buscar cotações", "error"); }
    }

    // Bitcoin
    try {
      const r = await fetch(`${API}/api/cotacoes/crypto`);
      const d = await r.json();
      if (d.bitcoin) {
        setAssets(prev => prev.map(a => a.ticker==="BTC" ? {...a, preco_atual:d.bitcoin.preco_brl, variacao_dia:d.bitcoin.variacao_24h} : a));
        log(`Bitcoin: R$ ${d.bitcoin.preco_brl.toLocaleString("pt-BR")}`, "ok");
      }
    } catch(e) { log("Bitcoin: erro", "error"); }

    setApiStatus(s => ({...s, cotacoes:"ok"}));
    const now = new Date().toLocaleString("pt-BR");
    setLastUpdate(now);
    log(`Concluído — ${now}`, "ok");
  }, [assets]);

  useEffect(() => { atualizarTudo(); }, []);

  const filtA = useMemo(() => investor==="Todos" ? assets : assets.filter(a => a.investidor===investor), [assets, investor]);
  const filtP = useMemo(() => investor==="Todos" ? provs  : provs.filter(p => p.investidor===investor),  [provs,  investor]);
  const totalPatrim = filtA.reduce((s,a) => s+toVal(a,usdBrl), 0);
  const totalCusto  = filtA.reduce((s,a) => s+toCusto(a,usdBrl), 0);
  const totalRent   = totalCusto>0 ? (totalPatrim-totalCusto)/totalCusto*100 : 0;
  const totalProv   = filtP.reduce((s,p) => s+(p.moeda==="USD"?p.valor*usdBrl:p.valor), 0);
  const byClass = useMemo(() => {
    const m = {};
    filtA.forEach(a => { if(!m[a.classe]) m[a.classe]=0; m[a.classe]+=toVal(a,usdBrl); });
    return Object.entries(m).sort((x,y) => y[1]-x[1]);
  }, [filtA, usdBrl]);

  function handleOp() {
    if (!form.ticker || !form.qtd || !form.preco) return;
    setSaving(true);
    setTimeout(() => {
      if (form.tipo === "compra") {
        const ex = assets.find(a => a.ticker===form.ticker && a.investidor===form.investidor);
        if (ex) { const nq=ex.qtd+parseFloat(form.qtd); const nm=(ex.qtd*ex.preco_medio+parseFloat(form.qtd)*parseFloat(form.preco))/nq; setAssets(p=>p.map(a=>a.id===ex.id?{...a,qtd:nq,preco_medio:nm}:a)); }
        else { setAssets(p=>[...p,{id:Date.now(),ticker:form.ticker.toUpperCase(),nome:form.nome||form.ticker.toUpperCase(),classe:form.classe,investidor:form.investidor,qtd:parseFloat(form.qtd),preco_medio:parseFloat(form.preco),preco_atual:parseFloat(form.preco),moeda:form.moeda,proventos:0}]); }
      } else {
        setAssets(p=>p.map(a=>{if(a.ticker===form.ticker&&a.investidor===form.investidor){const nq=a.qtd-parseFloat(form.qtd);return nq<=0?null:{...a,qtd:nq};}return a;}).filter(Boolean));
      }
      setSaving(false);
      setForm(f => ({...f, ticker:"", nome:"", qtd:"", preco:""}));
    }, 500);
  }

  function handleProv() {
    if (!pForm.ticker || !pForm.valor) return;
    setSaving(true);
    setTimeout(() => { setProvs(p=>[{id:Date.now(),...pForm,valor:parseFloat(pForm.valor)},...p]); setPForm(f=>({...f,ticker:"",valor:""})); setSaving(false); }, 500);
  }

  // ── Charts ────────────────────────────────────────────────────────────────
  const chartOptions = (yFmt) => ({
    responsive: true, maintainAspectRatio: false,
    interaction: { mode:"index", intersect:false },
    plugins: { legend:{display:false}, tooltip:{ backgroundColor:"rgba(5,15,40,0.95)", titleColor:"rgba(255,255,255,0.6)", bodyColor:"#fff", borderColor:"rgba(255,255,255,0.1)", borderWidth:1, callbacks:{ label: c => ` ${c.dataset.label}: ${yFmt(c.parsed.y)}` } } },
    scales: {
      y: { ticks:{ callback: v => "R$"+Math.round(v/1000)+"k", color:"rgba(255,255,255,0.4)", font:{size:10} }, grid:{ color:"rgba(255,255,255,0.05)" }, border:{color:"transparent"} },
      x: { ticks:{ color:"rgba(255,255,255,0.4)", font:{size:10} }, grid:{display:false}, border:{color:"transparent"} }
    }
  });

  useEffect(() => {
    if (tab !== "dashboard") return;
    const t = setTimeout(() => {
      const ctx = dashChartRef.current; if (!ctx) return;
      if (dashChartInst.current) dashChartInst.current.destroy();
      const sets = investor==="Vitor"
        ? [{label:"Vitor",data:HIST.map(h=>h.vitor),borderColor:"#60a5fa",backgroundColor:"rgba(96,165,250,0.12)"}]
        : investor==="Larissa"
        ? [{label:"Larissa",data:HIST.map(h=>h.larissa),borderColor:"#f472b6",backgroundColor:"rgba(244,114,182,0.1)",borderDash:[5,3]}]
        : [
            {label:"Vitor",data:HIST.map(h=>h.vitor),borderColor:"#60a5fa",backgroundColor:"rgba(96,165,250,0.08)"},
            {label:"Larissa",data:HIST.map(h=>h.larissa),borderColor:"#f472b6",backgroundColor:"rgba(244,114,182,0.06)",borderDash:[5,3]},
            {label:"Família",data:HIST.map(h=>h.vitor+h.larissa),borderColor:"#86efac",backgroundColor:"rgba(134,239,172,0.05)",borderDash:[2,2]},
          ];
      dashChartInst.current = new Chart(ctx, { type:"line", data:{ labels:HIST.map(h=>h.mes), datasets:sets.map(d=>({...d,tension:0.4,fill:true,pointRadius:3,pointHoverRadius:5,borderWidth:2})) }, options:chartOptions(fmtBRL) });
    }, 200);
    return () => clearTimeout(t);
  }, [tab, investor]);

  useEffect(() => {
    if (tab !== "performance") return;
    const t = setTimeout(() => {
      if (chartRef.current) {
        if (chartInst.current) chartInst.current.destroy();
        chartInst.current = new Chart(chartRef.current, { type:"line", data:{ labels:HIST.map(h=>h.mes), datasets:[
          {label:"Vitor",data:HIST.map(h=>h.vitor),borderColor:"#60a5fa",backgroundColor:"rgba(96,165,250,0.1)",tension:0.4,fill:true,pointRadius:3,borderWidth:2},
          {label:"Larissa",data:HIST.map(h=>h.larissa),borderColor:"#f472b6",backgroundColor:"rgba(244,114,182,0.08)",tension:0.4,fill:true,pointRadius:3,borderDash:[5,3],borderWidth:2},
        ]}, options:chartOptions(fmtBRL) });
      }
      if (pieRef.current && byClass.length>0) {
        if (pieInst.current) pieInst.current.destroy();
        pieInst.current = new Chart(pieRef.current, { type:"doughnut", data:{ labels:byClass.map(([c])=>c), datasets:[{ data:byClass.map(([,v])=>v), backgroundColor:byClass.map(([c])=>COLORS[c]||"#888"), borderWidth:2, borderColor:"rgba(15,30,60,0.5)" }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:false}, tooltip:{ backgroundColor:"rgba(5,15,40,0.95)", bodyColor:"#fff", borderColor:"rgba(255,255,255,0.1)", borderWidth:1, callbacks:{label:c=>`${c.label}: ${fmtBRL(c.parsed)}`} } }, cutout:"68%" } });
      }
    }, 200);
    return () => clearTimeout(t);
  }, [tab, byClass]);

  // ── Styles ────────────────────────────────────────────────────────────────
  const glass = { background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.13)", borderRadius:16, padding:"1rem 1.25rem", backdropFilter:"blur(8px)" };
  const card  = { ...glass, padding:"0.875rem 1rem" };
  const badge = inv => ({ fontSize:11, padding:"2px 8px", borderRadius:6, background:inv==="Vitor"?"rgba(96,165,250,0.25)":"rgba(244,114,182,0.25)", color:inv==="Vitor"?"#93c5fd":"#f9a8d4", fontWeight:500 });

  const tabs = [
    {id:"dashboard", icon:"ti-layout-dashboard", label:"Dashboard"},
    {id:"carteira",  icon:"ti-briefcase",         label:"Carteira"},
    {id:"lancamentos",icon:"ti-forms",            label:"Lançamentos"},
    {id:"proventos", icon:"ti-cash",              label:"Proventos"},
    {id:"performance",icon:"ti-trending-up",      label:"Performance"},
    {id:"metas",     icon:"ti-target",            label:"Metas"},
    {id:"apilog",    icon:"ti-terminal",          label:"API"},
  ];

  return (
    <div style={{minHeight:"100vh", paddingBottom:"2rem"}}>
      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{padding:"1.25rem 1.25rem 0", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10}}>
        <div style={{display:"flex", alignItems:"center", gap:10}}>
          <div style={{width:36,height:36,borderRadius:"50%",background:"rgba(96,165,250,0.25)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <i className="ti ti-chart-candle" style={{fontSize:18,color:"#93c5fd"}} />
          </div>
          <div>
            <p style={{fontWeight:500,fontSize:17,margin:0,color:"#fff"}}>Investimentos Familiares</p>
            <div style={{display:"flex",gap:8,alignItems:"center",marginTop:2,flexWrap:"wrap"}}>
              <span style={{fontSize:11,color:"rgba(255,255,255,0.5)"}}>USD/BRL {fmt(usdBrl,4)}</span>
              {indicadores && <span style={{fontSize:11,color:"rgba(255,255,255,0.5)"}}>· CDI {indicadores.cdi_anual}% · Selic {indicadores.selic}%</span>}
              {lastUpdate && <span style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>· {lastUpdate}</span>}
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <button onClick={atualizarTudo} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",fontSize:12,borderRadius:20,border:"1px solid rgba(255,255,255,0.2)",background:"rgba(96,165,250,0.2)",color:"#93c5fd",fontWeight:500}}>
            <i className={`ti ti-refresh${apiStatus.cotacoes==="loading"?" spin":""}`} style={{fontSize:13}} />
            {apiStatus.cotacoes==="loading" ? "Atualizando..." : "Atualizar"}
          </button>
          {INVESTORS.map(inv => (
            <button key={inv} onClick={()=>setInvestor(inv)} style={{padding:"5px 14px",fontSize:12,borderRadius:20,border:"1px solid rgba(255,255,255,0.2)",background:investor===inv?"rgba(96,165,250,0.35)":"rgba(255,255,255,0.08)",color:investor===inv?"#fff":"rgba(255,255,255,0.65)",fontWeight:investor===inv?500:400}}>
              {inv}
            </button>
          ))}
        </div>
      </div>

      {/* Nav */}
      <div style={{display:"flex",gap:2,padding:"1rem 1.25rem 0",overflowX:"auto"}}>
        {tabs.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 12px",fontSize:12,borderRadius:"10px 10px 0 0",border:"1px solid rgba(255,255,255,0.12)",borderBottom:"none",background:tab===t.id?"rgba(255,255,255,0.12)":"rgba(255,255,255,0.04)",color:tab===t.id?"#fff":"rgba(255,255,255,0.55)",whiteSpace:"nowrap",fontWeight:tab===t.id?500:400}}>
            <i className={`ti ${t.icon}`} style={{fontSize:13}} />{t.label}
          </button>
        ))}
      </div>
      <div style={{margin:"0 1.25rem",borderTop:"1px solid rgba(255,255,255,0.12)"}}></div>

      <div style={{padding:"1rem 1.25rem"}}>

        {/* ── DASHBOARD ── */}
        {tab==="dashboard" && (
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:"1rem"}}>
              {[
                {label:"Patrimônio Total", val:fmtBRL(totalPatrim), sub:"em R$"},
                {label:"Rentabilidade",    val:fmtPct(totalRent),   sub:"sobre custo", pos:totalRent>=0},
                {label:"Ganho / Perda",    val:fmtBRL(totalPatrim-totalCusto), sub:"R$ absoluto", pos:(totalPatrim-totalCusto)>=0},
                {label:"Proventos",        val:fmtBRL(totalProv),   sub:"total recebido"},
              ].map(c => (
                <div key={c.label} style={card}>
                  <p style={{fontSize:11,color:"rgba(255,255,255,0.55)",margin:"0 0 4px"}}>{c.label}</p>
                  <p style={{fontSize:20,fontWeight:500,margin:0,color:c.pos===false?"#fca5a5":c.pos===true?"#86efac":"#fff"}}>{c.val}</p>
                  <p style={{fontSize:10,color:"rgba(255,255,255,0.4)",margin:"2px 0 0"}}>{c.sub}</p>
                </div>
              ))}
            </div>

            <div style={{...glass, marginBottom:"1rem"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,flexWrap:"wrap",gap:8}}>
                <p style={{fontWeight:500,fontSize:13,margin:0,color:"rgba(255,255,255,0.8)"}}>Evolução patrimonial mensal</p>
                <div style={{display:"flex",gap:12}}>
                  {(investor==="Todos"?[["Vitor","#60a5fa"],["Larissa","#f472b6"],["Família","#86efac"]]:investor==="Vitor"?[["Vitor","#60a5fa"]]:[["Larissa","#f472b6"]]).map(([n,c])=>(
                    <span key={n} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"rgba(255,255,255,0.6)"}}>
                      <span style={{width:16,height:2,background:c,display:"inline-block",borderRadius:1}}></span>{n}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{position:"relative",height:200}}><canvas ref={dashChartRef} /></div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:12}}>
              <div style={glass}>
                <p style={{fontWeight:500,fontSize:13,margin:"0 0 12px",color:"rgba(255,255,255,0.8)"}}>Alocação por classe</p>
                {byClass.map(([cl,val]) => (
                  <div key={cl} style={{marginBottom:9}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                      <span style={{fontSize:11,color:"rgba(255,255,255,0.6)",display:"flex",alignItems:"center",gap:5}}>
                        <span style={{width:7,height:7,borderRadius:2,background:COLORS[cl]||"#888",display:"inline-block"}}></span>{cl}
                      </span>
                      <span style={{fontSize:11,fontWeight:500,color:"#fff"}}>{fmt(totalPatrim>0?val/totalPatrim*100:0,1)}%</span>
                    </div>
                    <div style={{height:5,background:"rgba(255,255,255,0.1)",borderRadius:3}}>
                      <div style={{height:5,borderRadius:3,background:COLORS[cl]||"#888",width:(totalPatrim>0?val/totalPatrim*100:0)+"%",transition:"width .4s"}}></div>
                    </div>
                    <p style={{fontSize:10,color:"rgba(255,255,255,0.4)",margin:"1px 0 0",textAlign:"right"}}>{fmtBRL(val)}</p>
                  </div>
                ))}
              </div>

              <div style={glass}>
                <p style={{fontWeight:500,fontSize:13,margin:"0 0 12px",color:"rgba(255,255,255,0.8)"}}>Por investidor</p>
                {["Vitor","Larissa"].map(inv => {
                  const ats = assets.filter(a=>a.investidor===inv);
                  const pat = ats.reduce((s,a)=>s+toVal(a,usdBrl),0);
                  const cus = ats.reduce((s,a)=>s+toCusto(a,usdBrl),0);
                  const ren = cus>0?(pat-cus)/cus*100:0;
                  const prv = provs.filter(p=>p.investidor===inv).reduce((s,p)=>s+(p.moeda==="USD"?p.valor*usdBrl:p.valor),0);
                  const tot = assets.reduce((s,a)=>s+toVal(a,usdBrl),0);
                  return (
                    <div key={inv} style={{marginBottom:14,paddingBottom:14,borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <div style={{width:32,height:32,borderRadius:"50%",background:inv==="Vitor"?"rgba(96,165,250,0.3)":"rgba(244,114,182,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:500,color:inv==="Vitor"?"#93c5fd":"#f9a8d4"}}>{inv[0]}</div>
                          <span style={{fontWeight:500,fontSize:14,color:"#fff"}}>{inv}</span>
                        </div>
                        <span style={{fontSize:13,color:ren>=0?"#86efac":"#fca5a5",fontWeight:500}}>{fmtPct(ren)}</span>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                        {[{l:"Patrimônio",v:fmtBRL(pat)},{l:"Participação",v:fmt(tot>0?pat/tot*100:0,1)+"%"},{l:"Proventos",v:fmtBRL(prv)}].map(x=>(
                          <div key={x.l} style={{background:"rgba(255,255,255,0.07)",borderRadius:8,padding:"6px 8px"}}>
                            <p style={{fontSize:10,color:"rgba(255,255,255,0.5)",margin:0}}>{x.l}</p>
                            <p style={{fontSize:12,fontWeight:500,margin:"2px 0 0",color:"#fff"}}>{x.v}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── CARTEIRA ── */}
        {tab==="carteira" && (
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.75rem",flexWrap:"wrap",gap:8}}>
              <p style={{fontWeight:500,margin:0,color:"#fff"}}>{filtA.length} ativo{filtA.length!==1?"s":""}</p>
              <StatusBadge status={apiStatus.cotacoes==="loading"?"loading":apiStatus.cotacoes==="ok"?"ok":"warn"} msg={apiStatus.cotacoes==="loading"?"Atualizando...":apiStatus.cotacoes==="ok"?"Dados ao vivo":"Dados locais"} />
            </div>
            <div style={{overflowX:"auto",borderRadius:12,border:"1px solid rgba(255,255,255,0.1)"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead>
                  <tr style={{background:"rgba(255,255,255,0.06)"}}>
                    {["Ticker","Investidor","Classe","Qtd","P. Médio","Cotação","Var. Dia","Valor","Rent.","Proventos"].map(h=>(
                      <th key={h} style={{padding:"8px 10px",textAlign:"left",color:"rgba(255,255,255,0.5)",fontWeight:500,whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtA.map((a,i) => {
                    const rent = toRent(a,usdBrl);
                    return (
                      <tr key={a.id} style={{borderTop:"1px solid rgba(255,255,255,0.06)",background:i%2===0?"rgba(255,255,255,0.02)":"transparent"}}>
                        <td style={{padding:"8px 10px",fontWeight:500,color:"#fff"}}>{a.ticker}</td>
                        <td style={{padding:"8px 10px"}}><span style={badge(a.investidor)}>{a.investidor}</span></td>
                        <td style={{padding:"8px 10px",color:"rgba(255,255,255,0.55)",fontSize:11}}>{a.classe}</td>
                        <td style={{padding:"8px 10px",color:"rgba(255,255,255,0.8)"}}>{fmt(a.qtd,a.qtd<1?6:2)}</td>
                        <td style={{padding:"8px 10px",color:"rgba(255,255,255,0.7)"}}>{a.moeda==="USD"?fmtUSD(a.preco_medio):fmtBRL(a.preco_medio)}</td>
                        <td style={{padding:"8px 10px",color:"#fff",fontWeight:500}}>{a.moeda==="USD"?fmtUSD(a.preco_atual):fmtBRL(a.preco_atual)}</td>
                        <td style={{padding:"8px 10px",color:a.variacao_dia>=0?"#86efac":"#fca5a5",fontSize:11}}>{a.variacao_dia!=null?fmtPct(a.variacao_dia):"—"}</td>
                        <td style={{padding:"8px 10px",fontWeight:500,color:"#fff"}}>{fmtBRL(toVal(a,usdBrl))}</td>
                        <td style={{padding:"8px 10px",color:rent>=0?"#86efac":"#fca5a5",fontWeight:500}}>{fmtPct(rent)}</td>
                        <td style={{padding:"8px 10px",color:"rgba(255,255,255,0.6)"}}>{fmtBRL(a.proventos)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── LANÇAMENTOS ── */}
        {tab==="lancamentos" && (
          <div>
            <div style={{display:"flex",gap:6,marginBottom:"1rem"}}>
              {[["op","Compra / Venda"],["prov","Registrar Provento"]].map(([s,l])=>(
                <button key={s} onClick={()=>setSubTab(s)} style={{padding:"6px 14px",fontSize:12,borderRadius:8,border:"1px solid rgba(255,255,255,0.2)",background:subTab===s?"rgba(96,165,250,0.3)":"rgba(255,255,255,0.07)",color:subTab===s?"#fff":"rgba(255,255,255,0.6)",fontWeight:subTab===s?500:400}}>{l}</button>
              ))}
            </div>
            {subTab==="op" && (
              <div style={{...glass,maxWidth:520}}>
                <p style={{fontWeight:500,fontSize:14,margin:"0 0 1rem",color:"#fff"}}>Registrar operação</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  {[
                    {l:"Tipo",        e:<select value={form.tipo}       onChange={e=>setForm(f=>({...f,tipo:e.target.value}))}><option value="compra">Compra</option><option value="venda">Venda</option></select>},
                    {l:"Investidor",  e:<select value={form.investidor} onChange={e=>setForm(f=>({...f,investidor:e.target.value}))}><option>Vitor</option><option>Larissa</option></select>},
                    {l:"Ticker",      e:<input  value={form.ticker}     onChange={e=>setForm(f=>({...f,ticker:e.target.value.toUpperCase()}))} placeholder="ex: PETR4" />},
                    {l:"Nome",        e:<input  value={form.nome}       onChange={e=>setForm(f=>({...f,nome:e.target.value}))} placeholder="ex: Petrobras" />},
                    {l:"Classe",      e:<select value={form.classe}     onChange={e=>setForm(f=>({...f,classe:e.target.value}))}>{CLASSES.map(c=><option key={c}>{c}</option>)}</select>},
                    {l:"Moeda",       e:<select value={form.moeda}      onChange={e=>setForm(f=>({...f,moeda:e.target.value}))}><option value="BRL">BRL (R$)</option><option value="USD">USD (US$)</option></select>},
                    {l:"Quantidade",  e:<input type="number" value={form.qtd}   onChange={e=>setForm(f=>({...f,qtd:e.target.value}))} placeholder="0" />},
                    {l:"Preço unit.", e:<input type="number" value={form.preco} onChange={e=>setForm(f=>({...f,preco:e.target.value}))} placeholder="0,00" />},
                    {l:"Data",        e:<input type="date"   value={form.data}  onChange={e=>setForm(f=>({...f,data:e.target.value}))} />},
                    {l:"Total est.",  e:<div style={{padding:"7px 10px",borderRadius:8,background:"rgba(255,255,255,0.06)",color:form.qtd&&form.preco?"#86efac":"rgba(255,255,255,0.3)",fontWeight:500,fontSize:13}}>{form.qtd&&form.preco?fmtBRL(parseFloat(form.qtd)*parseFloat(form.preco)*(form.moeda==="USD"?usdBrl:1)):"—"}</div>},
                  ].map(({l,e})=>(<div key={l}><label style={{fontSize:12,color:"rgba(255,255,255,0.6)",display:"block",marginBottom:4}}>{l}</label>{e}</div>))}
                </div>
                <button onClick={handleOp} style={{marginTop:"1rem",width:"100%",padding:"9px",fontSize:13,fontWeight:500,borderRadius:8,border:"none",background:"rgba(96,165,250,0.4)",color:"#fff"}}>
                  {saving?"Salvando...":"Registrar operação"}
                </button>
              </div>
            )}
            {subTab==="prov" && (
              <div style={{...glass,maxWidth:520}}>
                <p style={{fontWeight:500,fontSize:14,margin:"0 0 1rem",color:"#fff"}}>Registrar provento</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  {[
                    {l:"Investidor", e:<select value={pForm.investidor} onChange={e=>setPForm(f=>({...f,investidor:e.target.value}))}><option>Vitor</option><option>Larissa</option></select>},
                    {l:"Ticker",     e:<input  value={pForm.ticker}     onChange={e=>setPForm(f=>({...f,ticker:e.target.value.toUpperCase()}))} placeholder="ex: MXRF11" />},
                    {l:"Tipo",       e:<select value={pForm.tipo}       onChange={e=>setPForm(f=>({...f,tipo:e.target.value}))}><option>Dividendo</option><option>JCP</option><option>Rendimento</option></select>},
                    {l:"Valor",      e:<input type="number" value={pForm.valor} onChange={e=>setPForm(f=>({...f,valor:e.target.value}))} placeholder="0,00" />},
                    {l:"Moeda",      e:<select value={pForm.moeda}  onChange={e=>setPForm(f=>({...f,moeda:e.target.value}))}><option value="BRL">BRL (R$)</option><option value="USD">USD (US$)</option></select>},
                    {l:"Data",       e:<input type="date" value={pForm.data} onChange={e=>setPForm(f=>({...f,data:e.target.value}))} />},
                  ].map(({l,e})=>(<div key={l}><label style={{fontSize:12,color:"rgba(255,255,255,0.6)",display:"block",marginBottom:4}}>{l}</label>{e}</div>))}
                </div>
                <button onClick={handleProv} style={{marginTop:"1rem",width:"100%",padding:"9px",fontSize:13,fontWeight:500,borderRadius:8,border:"none",background:"rgba(52,211,153,0.35)",color:"#fff"}}>
                  {saving?"Salvando...":"Registrar provento"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── PROVENTOS ── */}
        {tab==="proventos" && (
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:"1rem"}}>
              {["Dividendo","JCP","Rendimento"].map(tipo => {
                const total = filtP.filter(p=>p.tipo===tipo).reduce((s,p)=>s+(p.moeda==="USD"?p.valor*usdBrl:p.valor),0);
                return (<div key={tipo} style={card}><p style={{fontSize:11,color:"rgba(255,255,255,0.55)",margin:"0 0 4px"}}>{tipo}</p><p style={{fontSize:18,fontWeight:500,margin:0,color:"#fff"}}>{fmtBRL(total)}</p></div>);
              })}
              <div style={card}><p style={{fontSize:11,color:"rgba(255,255,255,0.55)",margin:"0 0 4px"}}>Total</p><p style={{fontSize:18,fontWeight:500,margin:0,color:"#86efac"}}>{fmtBRL(totalProv)}</p></div>
            </div>
            <div style={{overflowX:"auto",borderRadius:12,border:"1px solid rgba(255,255,255,0.1)"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead><tr style={{background:"rgba(255,255,255,0.06)"}}>{["Data","Ticker","Investidor","Tipo","Valor","Em R$"].map(h=>(<th key={h} style={{padding:"8px 10px",textAlign:"left",color:"rgba(255,255,255,0.5)",fontWeight:500}}>{h}</th>))}</tr></thead>
                <tbody>
                  {filtP.sort((a,b)=>b.data.localeCompare(a.data)).map((p,i)=>(
                    <tr key={p.id} style={{borderTop:"1px solid rgba(255,255,255,0.06)",background:i%2===0?"rgba(255,255,255,0.02)":"transparent"}}>
                      <td style={{padding:"8px 10px",color:"rgba(255,255,255,0.55)"}}>{p.data}</td>
                      <td style={{padding:"8px 10px",fontWeight:500,color:"#fff"}}>{p.ticker}</td>
                      <td style={{padding:"8px 10px"}}><span style={badge(p.investidor)}>{p.investidor}</span></td>
                      <td style={{padding:"8px 10px",color:"rgba(255,255,255,0.75)"}}>{p.tipo}</td>
                      <td style={{padding:"8px 10px",color:"rgba(255,255,255,0.7)"}}>{p.moeda==="USD"?fmtUSD(p.valor):fmtBRL(p.valor)}</td>
                      <td style={{padding:"8px 10px",color:"#86efac",fontWeight:500}}>{fmtBRL(p.moeda==="USD"?p.valor*usdBrl:p.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── PERFORMANCE ── */}
        {tab==="performance" && (
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:12,marginBottom:"1rem"}}>
              <div style={glass}>
                <p style={{fontWeight:500,fontSize:13,margin:"0 0 10px",color:"rgba(255,255,255,0.8)"}}>Evolução patrimonial</p>
                <div style={{display:"flex",gap:16,marginBottom:10}}>
                  {[["Vitor","#60a5fa"],["Larissa","#f472b6"]].map(([n,c])=>(<span key={n} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"rgba(255,255,255,0.6)"}}><span style={{width:16,height:2,background:c,display:"inline-block",borderRadius:1}}></span>{n}</span>))}
                </div>
                <div style={{position:"relative",height:200}}><canvas ref={chartRef} /></div>
              </div>
              <div style={glass}>
                <p style={{fontWeight:500,fontSize:13,margin:"0 0 8px",color:"rgba(255,255,255,0.8)"}}>Alocação atual</p>
                <div style={{position:"relative",height:180}}><canvas ref={pieRef} /></div>
                <div style={{display:"flex",flexWrap:"wrap",gap:"6px 12px",marginTop:8}}>
                  {byClass.map(([cl,v])=>(<span key={cl} style={{fontSize:10,color:"rgba(255,255,255,0.6)",display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:2,background:COLORS[cl]||"#888",display:"inline-block"}}></span>{cl} {fmt(totalPatrim>0?v/totalPatrim*100:0,0)}%</span>))}
                </div>
              </div>
            </div>
            <p style={{fontWeight:500,fontSize:13,margin:"0 0 0.75rem",color:"rgba(255,255,255,0.8)"}}>Rentabilidade por classe</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:10}}>
              {byClass.map(([cl,val]) => {
                const cus = filtA.filter(a=>a.classe===cl).reduce((s,a)=>s+toCusto(a,usdBrl),0);
                const rent = cus>0?(val-cus)/cus*100:0;
                return (<div key={cl} style={{...glass,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><div style={{width:10,height:10,borderRadius:2,background:COLORS[cl]||"#888"}}></div><span style={{fontSize:12,fontWeight:500,color:"#fff"}}>{cl}</span></div><p style={{fontSize:11,color:"rgba(255,255,255,0.5)",margin:0}}>{fmtBRL(val)}</p></div><p style={{fontSize:16,fontWeight:500,margin:0,color:rent>=0?"#86efac":"#fca5a5"}}>{fmtPct(rent)}</p></div>);
              })}
            </div>
          </div>
        )}

        {/* ── METAS ── */}
        {tab==="metas" && (
          <div>
            <p style={{fontWeight:500,fontSize:13,margin:"0 0 1rem",color:"rgba(255,255,255,0.8)"}}>Metas de patrimônio e alocação</p>
            {["Vitor","Larissa"].map(inv => {
              if (investor!=="Todos" && investor!==inv) return null;
              const ats = assets.filter(a=>a.investidor===inv);
              const pat = ats.reduce((s,a)=>s+toVal(a,usdBrl),0);
              const meta = GOALS_TOTAL[inv];
              const pct = Math.min(pat/meta*100,100);
              const goals = CLASS_GOALS[inv];
              const byC = {}; ats.forEach(a=>{if(!byC[a.classe])byC[a.classe]=0;byC[a.classe]+=toVal(a,usdBrl);});
              return (
                <div key={inv} style={{...glass,marginBottom:12}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:32,height:32,borderRadius:"50%",background:inv==="Vitor"?"rgba(96,165,250,0.3)":"rgba(244,114,182,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:500,color:inv==="Vitor"?"#93c5fd":"#f9a8d4"}}>{inv[0]}</div>
                      <span style={{fontWeight:500,color:"#fff",fontSize:15}}>{inv}</span>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <p style={{fontSize:12,color:"rgba(255,255,255,0.5)",margin:0}}>Meta: {fmtBRL(meta)}</p>
                      <p style={{fontSize:14,fontWeight:500,margin:"2px 0 0",color:"#fff"}}>{fmtBRL(pat)} <span style={{fontSize:11,color:"rgba(255,255,255,0.5)"}}>({fmt(pct,0)}%)</span></p>
                    </div>
                  </div>
                  <div style={{height:8,background:"rgba(255,255,255,0.1)",borderRadius:4,marginBottom:16}}>
                    <div style={{height:8,borderRadius:4,background:inv==="Vitor"?"#60a5fa":"#f472b6",width:pct+"%",transition:"width .5s"}}></div>
                  </div>
                  <p style={{fontSize:11,color:"rgba(255,255,255,0.5)",margin:"0 0 8px"}}>Alocação atual vs. meta</p>
                  {Object.entries(goals).map(([cl,goalPct]) => {
                    const atual = pat>0?((byC[cl]||0)/pat*100):0;
                    const diff = atual-goalPct;
                    return (
                      <div key={cl} style={{marginBottom:8}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                          <span style={{fontSize:11,color:"rgba(255,255,255,0.6)",display:"flex",alignItems:"center",gap:5}}><span style={{width:7,height:7,borderRadius:1,background:COLORS[cl]||"#888",display:"inline-block"}}></span>{cl}</span>
                          <span style={{fontSize:11,color:Math.abs(diff)<3?"#86efac":diff>0?"#fbbf24":"#fca5a5"}}>{fmt(atual,0)}% <span style={{color:"rgba(255,255,255,0.35)"}}>/ meta {goalPct}%</span></span>
                        </div>
                        <div style={{height:4,background:"rgba(255,255,255,0.08)",borderRadius:2,position:"relative"}}>
                          <div style={{height:4,borderRadius:2,background:COLORS[cl]||"#888",width:Math.min(atual,100)+"%",opacity:0.85}}></div>
                          <div style={{position:"absolute",top:-1,left:Math.min(goalPct,100)+"%",width:2,height:6,background:"rgba(255,255,255,0.5)",borderRadius:1}}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* ── API LOG ── */}
        {tab==="apilog" && (
          <div>
            <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:"1rem",flexWrap:"wrap"}}>
              <p style={{fontWeight:500,margin:0,color:"#fff"}}>Status das integrações</p>
              <button onClick={atualizarTudo} style={{padding:"5px 12px",fontSize:12,borderRadius:8,border:"1px solid rgba(255,255,255,0.2)",background:"rgba(96,165,250,0.2)",color:"#93c5fd"}}>
                <i className="ti ti-refresh" style={{fontSize:12,marginRight:4}} />Atualizar agora
              </button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10,marginBottom:"1rem"}}>
              {[{label:"Cotações B3/EUA",k:"cotacoes"},{label:"Câmbio USD/BRL",k:"cambio"},{label:"Indicadores BCB",k:"indicadores"}].map(({label,k})=>(
                <div key={k} style={card}>
                  <p style={{fontSize:11,color:"rgba(255,255,255,0.5)",margin:"0 0 6px"}}>{label}</p>
                  <StatusBadge status={apiStatus[k]==="ok"?"ok":apiStatus[k]==="loading"?"loading":apiStatus[k]==="error"?"error":"warn"} msg={apiStatus[k]==="ok"?"Online":apiStatus[k]==="loading"?"Buscando...":apiStatus[k]==="error"?"Erro":"Aguardando"} />
                </div>
              ))}
              <div style={card}><p style={{fontSize:11,color:"rgba(255,255,255,0.5)",margin:"0 0 6px"}}>Backend</p><StatusBadge status="ok" msg="Online · Render" /></div>
            </div>
            {indicadores && (
              <div style={{...glass,marginBottom:"1rem"}}>
                <p style={{fontWeight:500,fontSize:13,margin:"0 0 10px",color:"rgba(255,255,255,0.8)"}}>Indicadores econômicos</p>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10}}>
                  {[{l:"CDI anual",v:indicadores.cdi_anual+"%"},{l:"Selic",v:indicadores.selic+"%"},{l:"IPCA mensal",v:indicadores.ipca_mensal+"%"},{l:"USD/BRL",v:"R$ "+fmt(usdBrl,4)}].map(x=>(
                    <div key={x.l} style={{background:"rgba(255,255,255,0.06)",borderRadius:8,padding:"8px 10px"}}>
                      <p style={{fontSize:11,color:"rgba(255,255,255,0.5)",margin:0}}>{x.l}</p>
                      <p style={{fontSize:16,fontWeight:500,margin:"3px 0 0",color:"#86efac"}}>{x.v}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={glass}>
              <p style={{fontWeight:500,fontSize:13,margin:"0 0 10px",color:"rgba(255,255,255,0.8)"}}>Log de eventos</p>
              {apiLog.length===0 && <p style={{fontSize:12,color:"rgba(255,255,255,0.4)",margin:0}}>Nenhum evento ainda.</p>}
              {apiLog.map((l,i)=>(
                <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"5px 0",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                  <span style={{fontSize:10,color:"rgba(255,255,255,0.35)",whiteSpace:"nowrap",minWidth:60}}>{l.ts}</span>
                  <span style={{fontSize:12,color:l.type==="ok"?"#86efac":l.type==="error"?"#fca5a5":"rgba(255,255,255,0.7)"}}>{l.msg}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
