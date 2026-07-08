import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

// ── Autenticação via backend ──────────────────────────────────────────────────
function getToken() { return sessionStorage.getItem("inv_token"); }
function setToken(t) { sessionStorage.setItem("inv_token", t); }
function clearToken() { sessionStorage.removeItem("inv_token"); }

// Wrapper de fetch autenticado — desloga automaticamente se token expirar
async function apiFetch(url, opts = {}, onUnauth) {
  const res = await fetch(url, {
    ...opts,
    headers: { ...(opts.headers||{}), Authorization: `Bearer ${getToken()}` }
  });
  if (res.status === 401) { clearToken(); onUnauth?.(); }
  return res;
}

function LoginScreen({ onLogin }) {
  const [user, setUser]       = useState("");
  const [pass, setPass]       = useState("");
  const [erro, setErro]       = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleLogin() {
    if (!user || !pass) { setErro("Preencha usuário e senha."); return; }
    setLoading(true); setErro("");
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user.trim(), password: pass }),
      });
      if (res.ok) {
        const { token } = await res.json();
        setToken(token);
        onLogin();
      } else {
        const d = await res.json();
        setErro(d.error || "Credenciais inválidas.");
      }
    } catch(e) {
      setErro("Erro de conexão. Tente novamente.");
    }
    setLoading(false);
  }

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#0f2a5c 0%,#1a3a7c 30%,#1e4d8c 55%,#2563a8 75%,#4b99c9 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}}>
      <div style={{width:"100%",maxWidth:380}}>
        <div style={{textAlign:"center",marginBottom:"2rem"}}>
          <div style={{width:56,height:56,borderRadius:"50%",background:"rgba(96,165,250,0.2)",border:"1px solid rgba(96,165,250,0.3)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 1rem"}}>
            <i className="ti ti-chart-candle" style={{fontSize:26,color:"#93c5fd"}}/>
          </div>
          <h1 style={{fontSize:20,fontWeight:600,color:"#fff",margin:"0 0 4px"}}>Investimentos Familiares</h1>
          <p style={{fontSize:13,color:"rgba(255,255,255,0.45)",margin:0}}>Acesso restrito</p>
        </div>
        <div style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.13)",borderRadius:20,padding:"2rem",backdropFilter:"blur(12px)"}}>
          <div style={{marginBottom:16}}>
            <label style={{fontSize:12,color:"rgba(255,255,255,0.6)",display:"block",marginBottom:6}}>Usuário</label>
            <div style={{position:"relative"}}>
              <i className="ti ti-user" style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:15,color:"rgba(255,255,255,0.35)"}}/>
              <input value={user} onChange={e=>{setUser(e.target.value);setErro("");}} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="Digite seu usuário" autoComplete="username"
                style={{width:"100%",padding:"9px 10px 9px 34px",borderRadius:10,border:`1px solid ${erro?"rgba(248,113,113,0.5)":"rgba(255,255,255,0.2)"}`,background:"rgba(255,255,255,0.08)",color:"#e2e8f0",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
            </div>
          </div>
          <div style={{marginBottom:20}}>
            <label style={{fontSize:12,color:"rgba(255,255,255,0.6)",display:"block",marginBottom:6}}>Senha</label>
            <div style={{position:"relative"}}>
              <i className="ti ti-lock" style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:15,color:"rgba(255,255,255,0.35)"}}/>
              <input type={showPass?"text":"password"} value={pass} onChange={e=>{setPass(e.target.value);setErro("");}} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="Digite sua senha" autoComplete="current-password"
                style={{width:"100%",padding:"9px 36px 9px 34px",borderRadius:10,border:`1px solid ${erro?"rgba(248,113,113,0.5)":"rgba(255,255,255,0.2)"}`,background:"rgba(255,255,255,0.08)",color:"#e2e8f0",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
              <button onClick={()=>setShowPass(p=>!p)} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"rgba(255,255,255,0.4)",cursor:"pointer",padding:4}}>
                <i className={`ti ${showPass?"ti-eye-off":"ti-eye"}`} style={{fontSize:15}}/>
              </button>
            </div>
          </div>
          {erro&&<div style={{display:"flex",alignItems:"center",gap:6,marginBottom:14,padding:"8px 12px",borderRadius:8,background:"rgba(248,113,113,0.15)",border:"1px solid rgba(248,113,113,0.3)"}}>
            <i className="ti ti-alert-circle" style={{fontSize:14,color:"#fca5a5"}}/><span style={{fontSize:12,color:"#fca5a5"}}>{erro}</span>
          </div>}
          <button onClick={handleLogin} disabled={loading}
            style={{width:"100%",padding:"11px",fontSize:14,fontWeight:500,borderRadius:10,border:"none",background:loading?"rgba(96,165,250,0.2)":"rgba(96,165,250,0.4)",color:loading?"rgba(255,255,255,0.5)":"#fff",cursor:loading?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            {loading?<><i className="ti ti-loader spin" style={{fontSize:15}}/>Verificando...</>:<><i className="ti ti-login" style={{fontSize:15}}/>Entrar</>}
          </button>
        </div>
        <p style={{textAlign:"center",fontSize:11,color:"rgba(255,255,255,0.25)",marginTop:"1.5rem"}}>
          <i className="ti ti-lock" style={{fontSize:11,marginRight:4}}/>Autenticação via servidor · Sessão expira em 8h
        </p>
      </div>
      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

const API = "https://investimentos-backend.onrender.com";
const CLASSES = ["Ações B3","FIIs B3","Ações EUA","Real Estate EUA","Renda Fixa EUA","Bitcoin","Tesouro Direto","CDB/LCI/LCA"];
const INVESTORS = ["Todos","Vitor","Larissa"];
const COLORS = {"Ações B3":"#60a5fa","FIIs B3":"#34d399","Ações EUA":"#a78bfa","Real Estate EUA":"#fb923c","Renda Fixa EUA":"#fbbf24","Bitcoin":"#f97316","Tesouro Direto":"#f472b6","CDB/LCI/LCA":"#4ade80"};
const CLASS_GOALS = {
  "Vitor":{"Ações B3":30,"FIIs B3":10,"Ações EUA":25,"Real Estate EUA":10,"Bitcoin":15,"Tesouro Direto":5,"CDB/LCI/LCA":5},
  "Larissa":{"Ações B3":15,"FIIs B3":25,"Ações EUA":20,"Real Estate EUA":20,"Renda Fixa EUA":5,"Tesouro Direto":10,"CDB/LCI/LCA":5}
};
const GOALS_TOTAL = {Vitor:200000,Larissa:150000};
const STORAGE_KEY = "inv_app_v4";

function loadState(){try{const s=localStorage.getItem(STORAGE_KEY);if(s)return JSON.parse(s);}catch(e){}return null;}
function saveState(s){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(s));}catch(e){}}

const fmt = (v,d=2) => isNaN(v)?"—":v.toLocaleString("pt-BR",{minimumFractionDigits:d,maximumFractionDigits:d});
const fmtBRL = v => "R$ "+fmt(v);
const fmtUSD = v => "US$ "+fmt(v);
const fmtPct = v => (v>=0?"+":"")+fmt(v,2)+"%";

// Calcula valor presente de um lote de renda fixa
function calcValorLote(lote, indicadores, fatoresAcum) {
  if (!lote.data_compra || !lote.indexador) return lote.valor_inicial;
  const valorInicial = lote.valor_inicial;
  const dias = Math.max(1, Math.floor((new Date()-new Date(lote.data_compra))/(1000*60*60*24)));
  const anos = dias/365;
  const taxaContratada = (lote.taxa||0)/100;
  const fatAcum = fatoresAcum?.[lote.id];

  switch(lote.indexador){
    case "pre":
      return valorInicial * Math.pow(1+taxaContratada, anos);
    case "cdi": {
      if (fatAcum?.cdi) {
        return lote.modo_cdi==="percentual"
          ? valorInicial * Math.pow(fatAcum.cdi, lote.taxa/100)
          : valorInicial * fatAcum.cdi * Math.pow(1+taxaContratada, anos);
      }
      const cdi = (indicadores?.cdi_anual||10.65)/100;
      const taxa = lote.modo_cdi==="percentual" ? cdi*lote.taxa/100 : cdi+taxaContratada;
      return valorInicial * Math.pow(1+taxa, anos);
    }
    case "ipca": {
      if (fatAcum?.ipca) return valorInicial * fatAcum.ipca * Math.pow(1+taxaContratada, anos);
      const ipcaA = Math.pow(1+(indicadores?.ipca_mensal||0.4)/100,12)-1;
      return valorInicial * Math.pow(1+ipcaA+taxaContratada, anos);
    }
    case "selic": {
      if (fatAcum?.cdi) return valorInicial * fatAcum.cdi * Math.pow(1+taxaContratada, anos);
      return valorInicial * Math.pow(1+(indicadores?.selic||11)/100+taxaContratada, anos);
    }
    default: return valorInicial;
  }
}

const isRendaFixa = a => ["Tesouro Direto","CDB/LCI/LCA"].includes(a.classe);

// Para ativos normais (não RF com lotes): calcula valor presente
function calcValorRF(ativo, indicadores, fatoresAcum) {
  if (!ativo.data_compra || !ativo.indexador) return ativo.preco_medio;
  // Se tem lotes, soma valor presente de cada lote
  if (ativo.lotes && ativo.lotes.length > 0) {
    return ativo.lotes.reduce((s,l) => s + calcValorLote(l, indicadores, fatoresAcum), 0) / ativo.qtd;
  }
  // Sem lotes: cálculo simples (legado)
  const valorInicial = ativo.preco_medio;
  const dias = Math.max(1, Math.floor((new Date()-new Date(ativo.data_compra))/(1000*60*60*24)));
  const anos = dias/365;
  const taxaContratada = (ativo.taxa||0)/100;
  const fatAcum = fatoresAcum?.[ativo.id];
  switch(ativo.indexador){
    case "pre": return valorInicial * Math.pow(1+taxaContratada, anos);
    case "cdi": {
      if (fatAcum?.cdi) return ativo.modo_cdi==="percentual" ? valorInicial*Math.pow(fatAcum.cdi,ativo.taxa/100) : valorInicial*fatAcum.cdi*Math.pow(1+taxaContratada,anos);
      const cdi=(indicadores?.cdi_anual||10.65)/100;
      return valorInicial*Math.pow(1+(ativo.modo_cdi==="percentual"?cdi*ativo.taxa/100:cdi+taxaContratada),anos);
    }
    case "ipca": {
      if (fatAcum?.ipca) return valorInicial*fatAcum.ipca*Math.pow(1+taxaContratada,anos);
      return valorInicial*Math.pow(1+Math.pow(1+(indicadores?.ipca_mensal||0.4)/100,12)-1+taxaContratada,anos);
    }
    case "selic": {
      if (fatAcum?.cdi) return valorInicial*fatAcum.cdi*Math.pow(1+taxaContratada,anos);
      return valorInicial*Math.pow(1+(indicadores?.selic||11)/100+taxaContratada,anos);
    }
    default: return valorInicial;
  }
}

// Chave do mês corrente no formato "MM/YYYY"
const mesAtualKey = () => { const d=new Date(); return `${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`; };
// Label "Jan/26" a partir de "01/2026"
const keyToLabel = (key) => {
  const [m,y]=key.split("/");
  const ms=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  return `${ms[parseInt(m)-1]}/${String(y).slice(2)}`;
};
// Ordena chaves "MM/YYYY" cronologicamente
const sortKeys = (a,b) => {
  const [ma,ya]=a.split("/"),[mb,yb]=b.split("/");
  return ya===yb?parseInt(ma)-parseInt(mb):parseInt(ya)-parseInt(yb);
};
// Gera lista de chaves dos últimos N meses até o mês atual
const ultimosMeses = (n) => {
  const arr=[];const d=new Date();
  for(let i=n-1;i>=0;i--){
    const x=new Date(d.getFullYear(),d.getMonth()-i,1);
    arr.push(`${String(x.getMonth()+1).padStart(2,"0")}/${x.getFullYear()}`);
  }
  return arr;
};

function toVal(a,r=5.25,ind=null,fatAcum=null){
  if(isRendaFixa(a)&&a.indexador){
    // Se tem lotes, soma valor presente de cada lote individualmente
    if(a.lotes&&a.lotes.length>0){
      return a.lotes.reduce((s,l)=>s+calcValorLote(l,ind,fatAcum),0);
    }
    return calcValorRF(a,ind,fatAcum)*a.qtd;
  }
  return a.qtd*a.preco_atual*(a.moeda==="USD"?r:1);
}
function toCusto(a,r=5.25){return a.qtd*a.preco_medio*(a.moeda==="USD"?r:1);}
function toRent(a,r=5.25,ind=null,fatAcum=null){const v=toVal(a,r,ind,fatAcum),c=toCusto(a,r);return c>0?(v-c)/c*100:0;}

function StatusBadge({status,msg}){
  const cfg={ok:{bg:"rgba(52,211,153,0.2)",color:"#6ee7b7",icon:"ti-circle-check"},loading:{bg:"rgba(96,165,250,0.2)",color:"#93c5fd",icon:"ti-loader"},error:{bg:"rgba(248,113,113,0.2)",color:"#fca5a5",icon:"ti-alert-circle"},warn:{bg:"rgba(251,191,36,0.2)",color:"#fde68a",icon:"ti-alert-triangle"}};
  const c=cfg[status]||cfg.warn;
  return <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:20,background:c.bg,color:c.color,fontSize:11,fontWeight:500}}><i className={`ti ${c.icon}${status==="loading"?" spin":""}`} style={{fontSize:12}}/>{msg}</span>;
}

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  // Verifica se o token salvo ainda é válido ao recarregar a página
  useEffect(() => {
    const token = getToken();
    if (!token) { setChecking(false); return; }
    fetch(`${API}/api/auth/verify`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (r.ok) setAuthed(true); else clearToken(); })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  if (checking) return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#0f2a5c,#4b99c9)",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center"}}>
        <i className="ti ti-loader spin" style={{fontSize:32,color:"#93c5fd"}}/>
        <p style={{color:"rgba(255,255,255,0.5)",marginTop:12,fontSize:13}}>Verificando sessão...</p>
      </div>
      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;
  return <AppInner onLogout={() => { clearToken(); setAuthed(false); }} />;
}

function AppInner({ onLogout }){
  const saved=loadState();
  const [assets,setAssets]=useState(saved?.assets||[]);
  const [provs,setProvs]=useState(saved?.provs||[]);
  const [operacoes,setOperacoes]=useState(saved?.operacoes||[]);
  const [snapshots,setSnapshots]=useState(saved?.snapshots||{});
  // Ativos zerados: { ticker+investidor → { ticker, nome, classe, investidor, lucroRealizado } }
  const [ativosZerados,setAtivosZerados]=useState(saved?.ativosZerados||{});
  const [carteiraFiltro,setCarteiraFiltro]=useState("ativos"); // "ativos" | "zerados"
  const [goalsTotal,setGoalsTotal]=useState(saved?.goalsTotal||{Vitor:200000,Larissa:150000});
  const [goalsClass,setGoalsClass]=useState(saved?.goalsClass||CLASS_GOALS);
  const [editandoMeta,setEditandoMeta]=useState(null);
  const [expandedRows,setExpandedRows]=useState({});
  const [expandedClasses,setExpandedClasses]=useState({});
  const [migracaoDisponivel,setMigracaoDisponivel]=useState(false);
  const [migrando,setMigrando]=useState(false);
  const [migracaoMsg,setMigracaoMsg]=useState(""); // { [ativo_id]: { ipca, cdi } } // "Vitor" | "Larissa" | null
  const [tab,setTab]=useState("dashboard");
  const [investor,setInvestor]=useState("Todos");
  const [usdBrl,setUsdBrl]=useState(5.25);
  const [indicadores,setIndicadores]=useState(null);
  const [apiStatus,setApiStatus]=useState({cotacoes:"idle",cambio:"idle",indicadores:"idle"});
  const [lastUpdate,setLastUpdate]=useState(null);
  const [subTab,setSubTab]=useState("op");
  const [form,setForm]=useState({tipo:"compra",ticker:"",nome:"",classe:"Ações B3",investidor:"Vitor",qtd:"",preco:"",data:new Date().toISOString().split("T")[0],moeda:"BRL",indexador:"pre",taxa:"",modo_cdi:"percentual",vencimento:"",ptax:""});
  const [pForm,setPForm]=useState({ticker:"",tipo:"Dividendo",valor:"",data:new Date().toISOString().split("T")[0],investidor:"Vitor",moeda:"BRL"});
  const [saving,setSaving]=useState(false);
  const [apiLog,setApiLog]=useState([]);
  const [opFiltro,setOpFiltro]=useState({investidor:"Todos",tipo:"Todos",ticker:""});
  const [editOp,setEditOp]=useState(null); // operação sendo editada
  const [confirmDelete,setConfirmDelete]=useState(null); // id da operação a excluir
  const [editProv,setEditProv]=useState(null); // provento sendo editado
  const [confirmDeleteProv,setConfirmDeleteProv]=useState(null); // id do provento a excluir
  // ── Estados da persistência no MongoDB ──
  const [fatoresAcum,setFatoresAcum]=useState(saved?.fatoresAcum||{}); // { [ativo_id]: { cdi?, ipca? } }
  const [carregando,setCarregando]=useState(true);                     // carga inicial do backend em andamento
  const [salvandoBackend,setSalvandoBackend]=useState(false);          // indicador "Salvando na nuvem"

  const dashChartRef=useRef(null);const dashChartInst=useRef(null);
  const chartRef=useRef(null);const chartInst=useRef(null);
  const pieRef=useRef(null);const pieInst=useRef(null);
  const lucroChartRef=useRef(null);const lucroChartInst=useRef(null);
  const assetsRef=useRef(assets);
  useEffect(()=>{assetsRef.current=assets;},[assets]);
  const provsRef=useRef(provs);
  useEffect(()=>{provsRef.current=provs;},[provs]);

  // Refs de controle da sincronização com o backend
  const primeiraCarga=useRef(true);  // trava o auto-save até a carga inicial terminar
  const saveTimeout=useRef(null);    // debounce do salvamento no backend

  // ── Persistência no MongoDB (via backend Express) ──────────────────────────
  // GET  /api/dados  → retorna o documento salvo (portfolio_familiar) ou defaults
  // PUT  /api/dados  → grava (upsert) o documento completo
  async function carregarDadosBackend(){
    const r=await apiFetch(`${API}/api/dados`,{},onLogout);
    if(!r.ok) return null;
    const d=await r.json();
    return (d&&typeof d==="object")?d:null;
  }
  async function salvarDadosBackend(dados){
    try{
      const r=await apiFetch(`${API}/api/dados`,{
        method:"PUT",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(dados),
      },onLogout);
      return r.ok;
    }catch(e){ return false; }
  }

  // ── Salvar estado ───────────────────────────────────────────────────────────
  // ── Carrega dados do backend ao iniciar ──
  useEffect(()=>{
    let finalizado=false;
    // Proteção: se o backend demorar mais de 20s (Render acordando), libera o app mesmo assim
    const timeoutSeguranca=setTimeout(()=>{
      if(!finalizado){
        console.warn("Carga inicial excedeu o tempo — liberando app");
        setCarregando(false);
        primeiraCarga.current=false;
      }
    },20000);

    (async()=>{
      try{
        const dados=await carregarDadosBackend();
        if(dados){
          setAssets(Array.isArray(dados.assets)?dados.assets:[]);
          setProvs(Array.isArray(dados.provs)?dados.provs:[]);
          setOperacoes(Array.isArray(dados.operacoes)?dados.operacoes:[]);
          setSnapshots(dados.snapshots&&typeof dados.snapshots==="object"?dados.snapshots:{});
          setAtivosZerados(dados.ativosZerados&&typeof dados.ativosZerados==="object"?dados.ativosZerados:{});
          if(dados.goalsTotal) setGoalsTotal(dados.goalsTotal);
          if(dados.goalsClass) setGoalsClass(dados.goalsClass);
          setFatoresAcum(dados.fatoresAcum&&typeof dados.fatoresAcum==="object"?dados.fatoresAcum:{});
        }
      }catch(e){
        console.error("Erro na carga inicial:",e);
      }

      finalizado=true;
      clearTimeout(timeoutSeguranca);
      setCarregando(false);
      primeiraCarga.current=false;

      // Verifica dados locais para migração
      try{
        const local=JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}");
        const temDadosLocais=(local.assets&&local.assets.length>0)||(local.operacoes&&local.operacoes.length>0);
        const dadosBackend=await carregarDadosBackend().catch(()=>null);
        const backendVazio=!dadosBackend||!dadosBackend.assets||dadosBackend.assets.length===0;
        if(temDadosLocais&&backendVazio) setMigracaoDisponivel(true);
      }catch(e){}
    })();

    return ()=>clearTimeout(timeoutSeguranca);
  },[]);

  // ── Migração: envia dados do localStorage para o MongoDB ──
  async function migrarDadosLocais(){
    setMigrando(true);setMigracaoMsg("");
    try{
      const local=JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}");
      const dadosMigrar={
        assets:local.assets||[],
        provs:local.provs||[],
        operacoes:local.operacoes||[],
        snapshots:local.snapshots||{},
        ativosZerados:local.ativosZerados||{},
        goalsTotal:local.goalsTotal||{Vitor:200000,Larissa:150000},
        goalsClass:local.goalsClass||CLASS_GOALS,
        fatoresAcum:local.fatoresAcum||{},
      };
      const ok=await salvarDadosBackend(dadosMigrar);
      if(ok){
        // Aplica no estado atual
        setAssets(dadosMigrar.assets);
        setProvs(dadosMigrar.provs);
        setOperacoes(dadosMigrar.operacoes);
        setSnapshots(dadosMigrar.snapshots);
        setAtivosZerados(dadosMigrar.ativosZerados);
        setGoalsTotal(dadosMigrar.goalsTotal);
        setGoalsClass(dadosMigrar.goalsClass);
        setFatoresAcum(dadosMigrar.fatoresAcum);
        setMigracaoMsg(`✓ ${dadosMigrar.assets.length} ativos e ${dadosMigrar.operacoes.length} operações migrados com sucesso!`);
        setTimeout(()=>{setMigracaoDisponivel(false);setMigracaoMsg("");},4000);
      }else{
        setMigracaoMsg("Erro ao migrar. Tente novamente.");
      }
    }catch(e){setMigracaoMsg("Erro ao ler dados locais.");}
    setMigrando(false);
  }

  // ── Salva no backend com debounce sempre que dados mudam ──
  useEffect(()=>{
    if(primeiraCarga.current||carregando) return;
    if(saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current=setTimeout(async()=>{
      setSalvandoBackend(true);
      await salvarDadosBackend({assets,provs,operacoes,snapshots,ativosZerados,goalsTotal,goalsClass,fatoresAcum});
      setSalvandoBackend(false);
    },1500);
    return ()=>{ if(saveTimeout.current) clearTimeout(saveTimeout.current); };
  },[assets,provs,operacoes,snapshots,ativosZerados,goalsTotal,goalsClass,fatoresAcum,carregando]);

  // ── Snapshot mensal dinâmico: atualiza o mês vigente sempre que ativos ou câmbio mudam ──
  // Snapshots de meses anteriores ficam imutáveis (criados quando o mês fecha ou via carga histórica)
  useEffect(()=>{
    const mes=mesAtualKey();
    const vitor=assets.filter(a=>a.investidor==="Vitor").reduce((s,a)=>s+toVal(a,usdBrl,indicadores,fatoresAcum),0);
    const larissa=assets.filter(a=>a.investidor==="Larissa").reduce((s,a)=>s+toVal(a,usdBrl,indicadores,fatoresAcum),0);
    setSnapshots(prev=>{
      const cur=prev[mes];
      if(cur&&Math.abs(cur.vitor-vitor)<0.01&&Math.abs(cur.larissa-larissa)<0.01)return prev;
      return {...prev,[mes]:{vitor,larissa,atualizado:new Date().toISOString()}};
    });
  },[assets,usdBrl,indicadores,fatoresAcum]);

  // ── Busca fatores acumulados separadamente, usando o estado atual dos ativos ──
  const buscarFatoresRF = useCallback(async (ativosRF) => {
    if (!ativosRF || ativosRF.length === 0) return;
    const novos = {};
    // Coleta todos os lotes de todos os ativos RF
    const todosLotes = [];
    ativosRF.forEach(a => {
      if (a.lotes && a.lotes.length > 0) {
        a.lotes.forEach(l => { if(l.indexador!=="pre") todosLotes.push(l); });
      } else if (a.indexador && a.indexador !== "pre") {
        todosLotes.push({id:a.id, indexador:a.indexador, data_compra:a.data_compra, taxa:a.taxa, modo_cdi:a.modo_cdi});
      }
    });
    await Promise.all(todosLotes.map(async l => {
      try {
        const rota = l.indexador==="ipca"
          ? `${API}/api/ipca-acumulado?inicio=${l.data_compra}`
          : `${API}/api/cdi-acumulado?inicio=${l.data_compra}`;
        const r = await apiFetch(rota, {});
        if (!r||!r.ok) return;
        const d = await r.json();
        if (!d||!d.fator) return;
        novos[l.id] = l.indexador==="ipca" ? {ipca:d.fator} : {cdi:d.fator};
      } catch(e) {}
    }));
    if (Object.keys(novos).length > 0) setFatoresAcum(prev=>({...prev,...novos}));
  }, []);

  // ── Dispara busca de fatores toda vez que os ativos de RF mudam ──
  useEffect(() => {
    const rfAtivos = assets.filter(a => isRendaFixa(a) && a.indexador && a.data_compra && a.indexador !== "pre");
    if (rfAtivos.length > 0) buscarFatoresRF(rfAtivos);
  }, [assets]);
  useEffect(()=>{
    const mesAtual=mesAtualKey();
    const keys=Object.keys(snapshots);
    // Garante que todos os snapshots de meses passados tenham flag "fechado"
    const naoFechados=keys.filter(k=>k!==mesAtual&&!snapshots[k].fechado);
    if(naoFechados.length>0){
      setSnapshots(prev=>{
        const novo={...prev};
        naoFechados.forEach(k=>{novo[k]={...novo[k],fechado:true,fechadoEm:new Date().toISOString()};});
        return novo;
      });
    }
  },[snapshots]);

  // ── Histórico para gráficos: gera lista a partir dos snapshots reais ──
  const histData=useMemo(()=>{
    const keys=Object.keys(snapshots).sort(sortKeys);
    if(keys.length===0)return [];
    // Garante que aparecem os últimos 12 meses (preenche com 0 os meses sem dados, se houver)
    const ultimos=ultimosMeses(12);
    const mapa={};
    keys.forEach(k=>{mapa[k]=snapshots[k];});
    return ultimos.map(k=>({
      key:k,
      mes:keyToLabel(k),
      vitor:mapa[k]?.vitor||0,
      larissa:mapa[k]?.larissa||0,
      fechado:mapa[k]?.fechado||false,
    })).filter(h=>h.vitor>0||h.larissa>0);
  },[snapshots]);

  // ── Lucro mensal (delta de patrimônio) ──
  const lucroMensal=useMemo(()=>{
    if(histData.length<2)return [];
    // Soma aportes (compras) e retiradas (vendas) por mês para descontar do delta
    const fluxoMensal={};
    operacoes.forEach(op=>{
      const d=new Date(op.data);
      const k=`${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
      if(!fluxoMensal[k])fluxoMensal[k]={Vitor:0,Larissa:0};
      const sig=op.tipo==="compra"?1:-1;
      fluxoMensal[k][op.investidor]=(fluxoMensal[k][op.investidor]||0)+sig*op.total;
    });
    return histData.map((h,i)=>{
      if(i===0)return {mes:h.mes,key:h.key,vitor:0,larissa:0,total:0};
      const prev=histData[i-1];
      const f=fluxoMensal[h.key]||{Vitor:0,Larissa:0};
      // Lucro = ΔPatrimônio - aportes_líquidos
      const lv=(h.vitor-prev.vitor)-f.Vitor;
      const ll=(h.larissa-prev.larissa)-f.Larissa;
      return {mes:h.mes,key:h.key,vitor:lv,larissa:ll,total:lv+ll};
    });
  },[histData,operacoes]);

  const log=(msg,type="info")=>setApiLog(p=>[{msg,type,ts:new Date().toLocaleTimeString("pt-BR")},...p].slice(0,15));

  const atualizarTudo=useCallback(async()=>{
    const cur=assetsRef.current;
    const authFail = () => onLogout();
    setApiStatus({cotacoes:"loading",cambio:"loading",indicadores:"loading"});
    log("Iniciando atualização...");
    try{const r=await apiFetch(`${API}/api/cambio`,{},authFail);const d=await r.json();if(d.usd_brl){setUsdBrl(d.usd_brl);log(`Câmbio: R$ ${d.usd_brl.toFixed(4)} (${d.fonte})`,"ok");}else{log("Câmbio: sem dado, mantendo último valor","warn");}setApiStatus(s=>({...s,cambio:"ok"}));}catch(e){log("Câmbio: erro","error");setApiStatus(s=>({...s,cambio:"error"}));}
    try{const r=await apiFetch(`${API}/api/indicadores`,{},authFail);const d=await r.json();setIndicadores(d);log(`CDI ${d.cdi_anual}% · Selic ${d.selic}% · IPCA ${d.ipca_mensal}%/mês`,"ok");setApiStatus(s=>({...s,indicadores:"ok"}));}catch(e){log("Indicadores: erro","error");setApiStatus(s=>({...s,indicadores:"error"}));}

    // ── Busca fatores IPCA/CDI acumulados para cada ativo de renda fixa ──
    const rfAtivos = cur.filter(a => isRendaFixa(a) && a.indexador && a.data_compra);
    if (rfAtivos.length > 0) {
      const novos = {};
      await Promise.all(rfAtivos.map(async a => {
        try {
          const rota = (a.indexador === "ipca")
            ? `${API}/api/ipca-acumulado?inicio=${a.data_compra}`
            : `${API}/api/cdi-acumulado?inicio=${a.data_compra}`;          const r = await apiFetch(rota, {}, authFail);
          if (!r.ok) return;
          const d = await r.json();
          if (!d.fator) return;
          novos[a.id] = a.indexador === "ipca"
            ? { ipca: d.fator }
            : { cdi:  d.fator };
        } catch(e) { /* ignora erros individuais */ }
      }));
      setFatoresAcum(prev => ({ ...prev, ...novos }));
      log(`Renda Fixa: fatores históricos atualizados para ${Object.keys(novos).length} ativo(s)`, "ok");
    }
    // B3
    const b3 = cur.filter(a=>["Ações B3","FIIs B3"].includes(a.classe));
    if(b3.length>0){
      try{
        const tickers=[...new Set(b3.map(a=>a.ticker))].join(",");
        const r=await apiFetch(`${API}/api/cotacoes/b3?tickers=${tickers}`,{},authFail);
        const d=await r.json();
        if(d.cotacoes){
          setAssets(prev=>prev.map(a=>{
            const q=d.cotacoes.find(c=>c.ticker.toUpperCase()===a.ticker.toUpperCase());
            if(q) console.log(`✓ Atualizando ${a.ticker}: ${a.preco_atual} → ${q.preco}`);
            return q?{...a,preco_atual:q.preco,variacao_dia:q.variacao_dia}:a;
          }));
          log(`B3: ${d.cotacoes.length} ativo(s) atualizado(s)`,"ok");
          if(d.nao_encontrados?.length>0)
            log(`B3: tickers não encontrados na BRAPI: ${d.nao_encontrados.join(", ")}`, "warn");
        }
      }catch(e){log("B3: erro","error");}
    }

    // Proventos B3 (conecta rota já existente no backend: /api/proventos/:ticker)
    if(b3.length>0){
      try{
        const tickersUnicos=[...new Set(b3.map(a=>a.ticker))];
        const novosProventos=[];
        await Promise.all(tickersUnicos.map(async ticker=>{
          try{
            const r=await apiFetch(`${API}/api/proventos/${ticker}`,{},authFail);
            const d=await r.json();
            if(!d.proventos)return;
            d.proventos.forEach(p=>{
              if(!p.data_pagamento||!p.valor)return;
              // Para cada investidor que possui esse ticker, lança o provento (se ainda não importado)
              b3.filter(a=>a.ticker===ticker).forEach(a=>{
                const jaExiste=provsRef.current.some(ex=>ex.origem==="brapi"&&ex.ticker===ticker&&ex.investidor===a.investidor&&ex.data===p.data_pagamento);
                if(jaExiste)return;
                const valorTotal=parseFloat(p.valor)*a.qtd;
                if(!valorTotal)return;
                const isJCP=(p.tipo||"").toUpperCase().includes("JRS")||(p.tipo||"").toUpperCase().includes("JCP");
                novosProventos.push({id:Date.now()+Math.random(),ticker,investidor:a.investidor,tipo:isJCP?"JCP":"Dividendo",valor:valorTotal,moeda:"BRL",data:p.data_pagamento,origem:"brapi"});
              });
            });
          }catch(e){/* ignora erro individual de ticker */}
        }));
        if(novosProventos.length>0){
          setProvs(p=>[...novosProventos,...p]);
          setAssets(prev=>prev.map(a=>{
            const add=novosProventos.filter(np=>np.ticker===a.ticker&&np.investidor===a.investidor).reduce((s,np)=>s+np.valor,0);
            return add>0?{...a,proventos:(a.proventos||0)+add}:a;
          }));
          log(`Proventos BRAPI: ${novosProventos.length} novo(s) lançamento(s) importado(s)`,"ok");
        }
      }catch(e){log("Proventos BRAPI: erro","error");}
    }

    // EUA
    const eua = cur.filter(a=>["Ações EUA","Real Estate EUA","Renda Fixa EUA"].includes(a.classe));
    if(eua.length>0){
      try{
        const tickers=[...new Set(eua.map(a=>a.ticker))].join(",");
        const r=await apiFetch(`${API}/api/cotacoes/eua?tickers=${tickers}`,{},authFail);
        const d=await r.json();
        if(d.cotacoes){
          setAssets(prev=>prev.map(a=>{
            const q=d.cotacoes.find(c=>c.ticker===a.ticker);
            return q?{...a,preco_atual:q.preco_usd,variacao_dia:q.variacao_dia}:a;
          }));
          log(`EUA: ${d.cotacoes.length} ativo(s) atualizado(s)`,"ok");
          if(d.nao_encontrados?.length>0)
            log(`EUA: tickers não encontrados: ${d.nao_encontrados.join(", ")}`, "warn");
        }
      }catch(e){log("EUA: erro","error");}
    }
    try{const r=await apiFetch(`${API}/api/cotacoes/crypto`,{},authFail);const d=await r.json();if(d.bitcoin){setAssets(p=>p.map(a=>a.ticker==="BTC"?{...a,preco_atual:d.bitcoin.preco_brl,variacao_dia:d.bitcoin.variacao_24h}:a));log(`Bitcoin: R$ ${d.bitcoin.preco_brl.toLocaleString("pt-BR")}`,"ok");}}catch(e){log("Bitcoin: erro","error");}
    setApiStatus(s=>({...s,cotacoes:"ok"}));
    const now=new Date().toLocaleString("pt-BR");setLastUpdate(now);log(`Concluído — ${now}`,"ok");
  },[]);

  useEffect(()=>{atualizarTudo();},[]);

  const filtA=useMemo(()=>investor==="Todos"?assets:assets.filter(a=>a.investidor===investor),[assets,investor]);
  const filtP=useMemo(()=>investor==="Todos"?provs:provs.filter(p=>p.investidor===investor),[provs,investor]);
  const totalPatrim=filtA.reduce((s,a)=>s+toVal(a,usdBrl,indicadores,fatoresAcum),0);
  const totalCusto=filtA.reduce((s,a)=>s+toCusto(a,usdBrl),0);
  const totalRent=totalCusto>0?(totalPatrim-totalCusto)/totalCusto*100:0;
  const totalProv=filtP.reduce((s,p)=>s+(p.moeda==="USD"?p.valor*usdBrl:p.valor),0);
  const byClass=useMemo(()=>{const m={};filtA.forEach(a=>{if(!m[a.classe])m[a.classe]=0;m[a.classe]+=toVal(a,usdBrl,indicadores,fatoresAcum);});return Object.entries(m).sort((x,y)=>y[1]-x[1]);},[filtA,usdBrl,indicadores,fatoresAcum]);

  // ── Reconstrói a carteira a partir da lista de operações (usado após edição/exclusão) ──
  function reconstruirCarteira(ops, ativosAtuais) {
    // Preserva preco_atual, variacao_dia, proventos e dados de RF dos ativos existentes
    const cache = {};
    ativosAtuais.forEach(a => { cache[`${a.ticker}_${a.investidor}`] = a; });

    // Ordena por data crescente para processar na ordem cronológica
    const ordenadas = [...ops].sort((a,b)=>a.data.localeCompare(b.data));
    const posicoes = {}; // { "TICKER_INV": { qtd, preco_medio, lucroRealizado, ... } }
    const zerados = {};

    ordenadas.forEach(op => {
      const k = `${op.ticker}_${op.investidor}`;
      const prev = posicoes[k] || {
        ticker: op.ticker, nome: op.nome || op.ticker, classe: op.classe, investidor: op.investidor,
        qtd: 0, preco_medio: 0, ptax_medio: op.moeda==="USD"?(op.ptax||usdBrl):null, moeda: op.moeda,
        lucroRealizado: 0, lucroAtivoRealizado: 0, lucroCambioRealizado: 0, proventos: cache[k]?.proventos||0,
        data_compra: op.data,
        // Preserva SEMPRE a cotação atual do cache — nunca sobrescreve com preco da operação
        preco_atual: cache[k]?.preco_atual ?? op.preco,
        variacao_dia: cache[k]?.variacao_dia,
        indexador: cache[k]?.indexador, taxa: cache[k]?.taxa, modo_cdi: cache[k]?.modo_cdi,
        vencimento: cache[k]?.vencimento, lotes: cache[k]?.lotes,
        id: cache[k]?.id || Date.now()+Math.random(),
      };
      if (op.tipo === "compra") {
        const novaQtd = prev.qtd + op.qtd;
        const novoMed = novaQtd>0 ? (prev.qtd*prev.preco_medio + op.qtd*op.preco)/novaQtd : op.preco;
        const ptaxOp = op.moeda==="USD" ? (op.ptax||usdBrl) : null;
        const novoPtaxMedio = op.moeda==="USD" ? (novaQtd>0 ? (prev.qtd*(prev.ptax_medio||usdBrl) + op.qtd*ptaxOp)/novaQtd : ptaxOp) : prev.ptax_medio;
        posicoes[k] = {...prev, qtd:novaQtd, preco_medio:novoMed, ptax_medio:novoPtaxMedio};
      } else {
        const isUSD = op.moeda==="USD";
        const ptaxCompra = isUSD ? (prev.ptax_medio||usdBrl) : 1;
        const ptaxVenda = isUSD ? (op.ptax||usdBrl) : 1;
        const lucroAtivo = (op.preco - prev.preco_medio) * op.qtd * ptaxCompra;
        const lucroCambio = isUSD ? op.preco * op.qtd * (ptaxVenda - ptaxCompra) : 0;
        const lucro = lucroAtivo + lucroCambio;
        const novaQtd = prev.qtd - op.qtd;
        if (novaQtd <= 0.0001) {
          // posição zerada
          zerados[k] = {
            ticker:prev.ticker, nome:prev.nome, classe:prev.classe, investidor:prev.investidor,
            preco_medio: prev.preco_medio, ptax_medio: prev.ptax_medio,
            lucroRealizado: (zerados[k]?.lucroRealizado || 0) + prev.lucroRealizado + lucro,
            lucroAtivoRealizado: (zerados[k]?.lucroAtivoRealizado || 0) + (prev.lucroAtivoRealizado||0) + lucroAtivo,
            lucroCambioRealizado: (zerados[k]?.lucroCambioRealizado || 0) + (prev.lucroCambioRealizado||0) + lucroCambio,
            vendas: [...(zerados[k]?.vendas || []), {data:op.data, qtd:op.qtd, preco:op.preco, ptax:isUSD?ptaxVenda:null, lucro, lucroAtivo, lucroCambio}],
          };
          delete posicoes[k];
        } else {
          posicoes[k] = {...prev, qtd:novaQtd, lucroRealizado:prev.lucroRealizado + lucro, lucroAtivoRealizado:(prev.lucroAtivoRealizado||0)+lucroAtivo, lucroCambioRealizado:(prev.lucroCambioRealizado||0)+lucroCambio};
        }
      }
    });

    return { ativos: Object.values(posicoes), zerados };
  }

  function aplicarReconstrucao(novasOps) {
    setOperacoes(novasOps);
    const {ativos, zerados} = reconstruirCarteira(novasOps, assetsRef.current);
    setAssets(ativos);
    setAtivosZerados(zerados);
    // Força atualização de cotações após reconstrução para garantir preco_atual correto
    setTimeout(() => atualizarTudo(), 300);
  }

  function excluirOperacao(id) {
    const novasOps = operacoes.filter(o => o.id !== id);
    aplicarReconstrucao(novasOps);
    setConfirmDelete(null);
  }

  function salvarEdicao(opEditada) {
    const ptaxEdit = opEditada.moeda==="USD" ? (parseFloat(opEditada.ptax)||usdBrl) : null;
    const novasOps = operacoes.map(o => o.id === opEditada.id ? {
      ...opEditada,
      qtd: parseFloat(opEditada.qtd),
      preco: parseFloat(opEditada.preco),
      total: parseFloat(opEditada.qtd) * parseFloat(opEditada.preco) * (ptaxEdit||1),
      ptax: ptaxEdit,
    } : o);
    aplicarReconstrucao(novasOps);
    setEditOp(null);
  }

  // ── Operações filtradas ─────────────────────────────────────────────────────
  const filtOps=useMemo(()=>{
    return operacoes.filter(op=>{
      if(opFiltro.investidor!=="Todos"&&op.investidor!==opFiltro.investidor)return false;
      if(opFiltro.tipo!=="Todos"&&op.tipo!==opFiltro.tipo)return false;
      if(opFiltro.ticker&&!op.ticker.toUpperCase().includes(opFiltro.ticker.toUpperCase()))return false;
      return true;
    }).sort((a,b)=>b.data.localeCompare(a.data));
  },[operacoes,opFiltro]);

  function handleOp(){
    if(!form.ticker||!form.qtd||!form.preco)return;
    setSaving(true);
    setTimeout(()=>{
      const ticker=form.ticker.toUpperCase();
      let isNew=false;
      const ptaxOp=form.moeda==="USD"?(parseFloat(form.ptax)||usdBrl):null;
      const novaOp={id:Date.now(),tipo:form.tipo,ticker,nome:form.nome||ticker,classe:form.classe,investidor:form.investidor,qtd:parseFloat(form.qtd),preco:parseFloat(form.preco),total:parseFloat(form.qtd)*parseFloat(form.preco)*(ptaxOp||1),moeda:form.moeda,data:form.data,ptax:ptaxOp};
      setOperacoes(p=>[novaOp,...p]);

      if(form.tipo==="compra"){
        const ex=assetsRef.current.find(a=>a.ticker===ticker&&a.investidor===form.investidor);
        const isRF=["Tesouro Direto","CDB/LCI/LCA"].includes(form.classe);
        if(ex){
          if(isRF){
            // RF: adiciona novo lote independente (taxa e data próprias)
            const novoLote={
              id: Date.now()+2,
              valor_inicial: parseFloat(form.preco)*parseFloat(form.qtd),
              qtd: parseFloat(form.qtd),
              preco_unitario: parseFloat(form.preco),
              data_compra: form.data,
              indexador: form.indexador,
              taxa: parseFloat(form.taxa)||0,
              modo_cdi: form.modo_cdi,
              vencimento: form.vencimento||null,
            };
            const novosLotes=[...(ex.lotes||[
              // Se ainda não tinha lotes, converte o ativo existente em lote
              {id:ex.id,valor_inicial:ex.preco_medio*ex.qtd,qtd:ex.qtd,preco_unitario:ex.preco_medio,data_compra:ex.data_compra,indexador:ex.indexador,taxa:ex.taxa,modo_cdi:ex.modo_cdi,vencimento:ex.vencimento}
            ]),novoLote];
            const novaQtd=novosLotes.reduce((s,l)=>s+l.qtd,0);
            const novoValorTotal=novosLotes.reduce((s,l)=>s+l.valor_inicial,0);
            setAssets(p=>p.map(a=>a.id===ex.id?{...a,qtd:novaQtd,preco_medio:novoValorTotal/novaQtd,lotes:novosLotes}:a));
          } else {
            // Ações/outros: preço médio ponderado normal (e PTAX médio ponderado, se USD)
            const nq=ex.qtd+parseFloat(form.qtd);
            const nm=(ex.qtd*ex.preco_medio+parseFloat(form.qtd)*parseFloat(form.preco))/nq;
            const nPtax=form.moeda==="USD"?((ex.qtd*(ex.ptax_medio||usdBrl)+parseFloat(form.qtd)*ptaxOp)/nq):ex.ptax_medio;
            setAssets(p=>p.map(a=>a.id===ex.id?{...a,qtd:nq,preco_medio:nm,ptax_medio:nPtax}:a));
          }
        } else {
          isNew=true;
          const novoAtivo={id:Date.now()+1,ticker,nome:form.nome||ticker,classe:form.classe,investidor:form.investidor,qtd:parseFloat(form.qtd),preco_medio:parseFloat(form.preco),preco_atual:parseFloat(form.preco),moeda:form.moeda,proventos:0,lucroRealizado:0,lucroAtivoRealizado:0,lucroCambioRealizado:0,ptax_medio:form.moeda==="USD"?ptaxOp:null,data_compra:form.data};
          if(isRF){
            novoAtivo.indexador=form.indexador;
            novoAtivo.taxa=parseFloat(form.taxa)||0;
            novoAtivo.modo_cdi=form.modo_cdi;
            novoAtivo.vencimento=form.vencimento||null;
            // Cria o primeiro lote
            novoAtivo.lotes=[{id:Date.now()+2,valor_inicial:parseFloat(form.preco)*parseFloat(form.qtd),qtd:parseFloat(form.qtd),preco_unitario:parseFloat(form.preco),data_compra:form.data,indexador:form.indexador,taxa:parseFloat(form.taxa)||0,modo_cdi:form.modo_cdi,vencimento:form.vencimento||null}];
          }
          setAssets(p=>[...p,novoAtivo]);
        }
      } else {
        // venda: calcula lucro realizado, decompondo entre efeito ativo (preço) e efeito câmbio (PTAX)
        setAssets(p=>p.map(a=>{
          if(a.ticker===ticker&&a.investidor===form.investidor){
            const qtdVendida=parseFloat(form.qtd);
            const precoVenda=parseFloat(form.preco);
            const isUSD=a.moeda==="USD";
            const ptaxCompra=isUSD?(a.ptax_medio||usdBrl):1;
            const ptaxVenda=isUSD?ptaxOp:1;
            // Efeito ativo: variação do preço em USD, valorizada ao câmbio de compra
            const lucroAtivo=(precoVenda-a.preco_medio)*qtdVendida*ptaxCompra;
            // Efeito câmbio: variação do PTAX, aplicada sobre o valor de venda em USD
            const lucroCambio=isUSD?precoVenda*qtdVendida*(ptaxVenda-ptaxCompra):0;
            const lucro=lucroAtivo+lucroCambio;
            const lucroAcum=(a.lucroRealizado||0)+lucro;
            const lucroAtivoAcum=(a.lucroAtivoRealizado||0)+lucroAtivo;
            const lucroCambioAcum=(a.lucroCambioRealizado||0)+lucroCambio;
            const nq=a.qtd-qtdVendida;
            if(nq<=0){
              // ativo zerado: guarda no histórico de zerados
              setAtivosZerados(prev=>{
                const key=`${ticker}_${form.investidor}`;
                const prev2=prev[key]||{ticker,nome:a.nome,classe:a.classe,investidor:form.investidor,lucroRealizado:0,lucroAtivoRealizado:0,lucroCambioRealizado:0,vendas:[]};
                return {...prev,[key]:{...prev2,lucroRealizado:(prev2.lucroRealizado||0)+lucroAcum,lucroAtivoRealizado:(prev2.lucroAtivoRealizado||0)+lucroAtivoAcum,lucroCambioRealizado:(prev2.lucroCambioRealizado||0)+lucroCambioAcum,preco_medio:a.preco_medio,ptax_medio:a.ptax_medio,vendas:[...(prev2.vendas||[]),{data:form.data,qtd:qtdVendida,preco:precoVenda,ptax:ptaxOp,lucro,lucroAtivo,lucroCambio}]}};
              });
              return null;
            }
            return {...a,qtd:nq,lucroRealizado:lucroAcum,lucroAtivoRealizado:lucroAtivoAcum,lucroCambioRealizado:lucroCambioAcum};
          }
          return a;
        }).filter(Boolean));
      }
      setSaving(false);
      setForm(f=>({...f,ticker:"",nome:"",qtd:"",preco:""}));
      if(isNew)setTimeout(()=>atualizarTudo(),150);
    },400);
  }

  // Ajusta o campo "proventos" de um ativo específico (delta pode ser positivo ou negativo)
  function ajustarProventoAtivo(ticker,investidor,deltaBRL){
    if(!deltaBRL)return;
    setAssets(prev=>prev.map(a=>a.ticker===ticker&&a.investidor===investidor?{...a,proventos:(a.proventos||0)+deltaBRL}:a));
  }

  function salvarEdicaoProv(provEditado){
    const antigo=provs.find(p=>p.id===provEditado.id);
    if(!antigo)return;
    const valorNovo=parseFloat(provEditado.valor);
    const ticker=provEditado.ticker.toUpperCase();
    const valorAntigoBRL=antigo.moeda==="USD"?antigo.valor*usdBrl:antigo.valor;
    const valorNovoBRL=provEditado.moeda==="USD"?valorNovo*usdBrl:valorNovo;
    // Reverte o valor antigo do ativo/investidor original
    ajustarProventoAtivo(antigo.ticker,antigo.investidor,-valorAntigoBRL);
    // Aplica o valor novo no ativo/investidor (pode ter mudado)
    ajustarProventoAtivo(ticker,provEditado.investidor,valorNovoBRL);
    setProvs(p=>p.map(pr=>pr.id===provEditado.id?{...provEditado,ticker,valor:valorNovo}:pr));
    setEditProv(null);
  }

  function excluirProvento(id){
    const p=provs.find(pr=>pr.id===id);
    if(p){
      const valorBRL=p.moeda==="USD"?p.valor*usdBrl:p.valor;
      ajustarProventoAtivo(p.ticker,p.investidor,-valorBRL);
    }
    setProvs(prev=>prev.filter(pr=>pr.id!==id));
    setConfirmDeleteProv(null);
  }

  function handleProv(){
    if(!pForm.ticker||!pForm.valor)return;
    setSaving(true);
    setTimeout(()=>{
      const ticker=pForm.ticker.toUpperCase();
      const valorProvento=parseFloat(pForm.valor);
      const valorBRL=pForm.moeda==="USD"?valorProvento*usdBrl:valorProvento;
      setProvs(p=>[{id:Date.now(),...pForm,ticker,valor:valorProvento,origem:"manual"},...p]);
      // Reflete o provento no campo "proventos" do ativo correspondente (aba Carteira)
      setAssets(prev=>{
        const existe=prev.some(a=>a.ticker===ticker&&a.investidor===pForm.investidor);
        if(!existe){
          log(`Provento registrado, mas nenhum ativo ${ticker} (${pForm.investidor}) encontrado na carteira — não refletido na aba Carteira.`,"warn");
          return prev;
        }
        return prev.map(a=>a.ticker===ticker&&a.investidor===pForm.investidor?{...a,proventos:(a.proventos||0)+valorBRL}:a);
      });
      setPForm(f=>({...f,ticker:"",valor:""}));
      setSaving(false);
    },400);
  }

  // ── Charts ──────────────────────────────────────────────────────────────────
  const cOpts=(yFmt)=>({responsive:true,maintainAspectRatio:false,interaction:{mode:"index",intersect:false},plugins:{legend:{display:false},tooltip:{backgroundColor:"rgba(5,15,40,0.95)",titleColor:"rgba(255,255,255,0.6)",bodyColor:"#fff",borderColor:"rgba(255,255,255,0.1)",borderWidth:1,callbacks:{label:c=>` ${c.dataset.label}: ${yFmt(c.parsed.y)}`}}},scales:{y:{ticks:{callback:v=>"R$"+Math.round(v/1000)+"k",color:"rgba(255,255,255,0.4)",font:{size:10}},grid:{color:"rgba(255,255,255,0.05)"},border:{color:"transparent"}},x:{ticks:{color:"rgba(255,255,255,0.4)",font:{size:10}},grid:{display:false},border:{color:"transparent"}}}});

  useEffect(()=>{
    if(tab!=="dashboard")return;
    const t=setTimeout(()=>{
      const ctx=dashChartRef.current;if(!ctx)return;
      if(dashChartInst.current)dashChartInst.current.destroy();
      const sets=investor==="Vitor"
        ?[{label:"Vitor",data:histData.map(h=>h.vitor),borderColor:"#60a5fa",backgroundColor:"rgba(96,165,250,0.12)"}]
        :investor==="Larissa"
        ?[{label:"Larissa",data:histData.map(h=>h.larissa),borderColor:"#f472b6",backgroundColor:"rgba(244,114,182,0.1)",borderDash:[5,3]}]
        :[
          {label:"Vitor",data:histData.map(h=>h.vitor),borderColor:"#60a5fa",backgroundColor:"rgba(96,165,250,0.08)"},
          {label:"Larissa",data:histData.map(h=>h.larissa),borderColor:"#f472b6",backgroundColor:"rgba(244,114,182,0.06)",borderDash:[5,3]},
          {label:"Família",data:histData.map(h=>h.vitor+h.larissa),borderColor:"#86efac",backgroundColor:"rgba(134,239,172,0.05)",borderDash:[2,2]},
        ];
      dashChartInst.current=new Chart(ctx,{type:"line",data:{labels:histData.map(h=>h.mes),datasets:sets.map(d=>({...d,tension:0.4,fill:true,pointRadius:3,pointHoverRadius:5,borderWidth:2}))},options:cOpts(fmtBRL)});
    },200);
    return()=>clearTimeout(t);
  },[tab,investor,histData]);

  useEffect(()=>{
    if(tab!=="performance")return;
    const t=setTimeout(()=>{
      if(chartRef.current){
        if(chartInst.current)chartInst.current.destroy();
        chartInst.current=new Chart(chartRef.current,{type:"line",data:{labels:histData.map(h=>h.mes),datasets:[{label:"Vitor",data:histData.map(h=>h.vitor),borderColor:"#60a5fa",backgroundColor:"rgba(96,165,250,0.1)",tension:0.4,fill:true,pointRadius:3,borderWidth:2},{label:"Larissa",data:histData.map(h=>h.larissa),borderColor:"#f472b6",backgroundColor:"rgba(244,114,182,0.08)",tension:0.4,fill:true,pointRadius:3,borderDash:[5,3],borderWidth:2}]},options:cOpts(fmtBRL)});
      }
      if(pieRef.current&&byClass.length>0){
        if(pieInst.current)pieInst.current.destroy();
        pieInst.current=new Chart(pieRef.current,{type:"doughnut",data:{labels:byClass.map(([c])=>c),datasets:[{data:byClass.map(([,v])=>v),backgroundColor:byClass.map(([c])=>COLORS[c]||"#888"),borderWidth:2,borderColor:"rgba(15,30,60,0.5)"}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{backgroundColor:"rgba(5,15,40,0.95)",bodyColor:"#fff",borderColor:"rgba(255,255,255,0.1)",borderWidth:1,callbacks:{label:c=>`${c.label}: ${fmtBRL(c.parsed)}`}}},cutout:"68%"}});
      }
      if(lucroChartRef.current&&lucroMensal.length>0){
        if(lucroChartInst.current)lucroChartInst.current.destroy();
        const dadosLucro=investor==="Vitor"?lucroMensal.map(l=>l.vitor):investor==="Larissa"?lucroMensal.map(l=>l.larissa):lucroMensal.map(l=>l.total);
        lucroChartInst.current=new Chart(lucroChartRef.current,{
          type:"bar",
          data:{labels:lucroMensal.map(l=>l.mes),datasets:[{label:"Lucro / Prejuízo",data:dadosLucro,backgroundColor:dadosLucro.map(v=>v>=0?"rgba(52,211,153,0.6)":"rgba(248,113,113,0.6)"),borderColor:dadosLucro.map(v=>v>=0?"#34d399":"#f87171"),borderWidth:1,borderRadius:6}]},
          options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{backgroundColor:"rgba(5,15,40,0.95)",bodyColor:"#fff",borderColor:"rgba(255,255,255,0.1)",borderWidth:1,callbacks:{label:c=>` ${fmtBRL(c.parsed.y)}`}}},scales:{y:{ticks:{callback:v=>"R$"+(v/1000).toFixed(1)+"k",color:"rgba(255,255,255,0.4)",font:{size:10}},grid:{color:"rgba(255,255,255,0.05)"},border:{color:"transparent"}},x:{ticks:{color:"rgba(255,255,255,0.4)",font:{size:10}},grid:{display:false},border:{color:"transparent"}}}}
        });
      }
    },200);
    return()=>clearTimeout(t);
  },[tab,byClass,histData,lucroMensal,investor]);

  // ── Estilos ─────────────────────────────────────────────────────────────────
  const glass={background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.13)",borderRadius:16,padding:"1rem 1.25rem",backdropFilter:"blur(8px)"};
  const card={...glass,padding:"0.875rem 1rem"};
  const badge=inv=>({fontSize:11,padding:"2px 8px",borderRadius:6,background:inv==="Vitor"?"rgba(96,165,250,0.25)":"rgba(244,114,182,0.25)",color:inv==="Vitor"?"#93c5fd":"#f9a8d4",fontWeight:500});
  const tipoBadge=tipo=>({fontSize:11,padding:"2px 8px",borderRadius:6,fontWeight:500,background:tipo==="compra"?"rgba(52,211,153,0.2)":"rgba(248,113,113,0.2)",color:tipo==="compra"?"#6ee7b7":"#fca5a5"});

  const tabs=[
    {id:"dashboard",icon:"ti-layout-dashboard",label:"Dashboard"},
    {id:"carteira",icon:"ti-briefcase",label:"Carteira"},
    {id:"lancamentos",icon:"ti-forms",label:"Lançamentos"},
    {id:"operacoes",icon:"ti-history",label:"Operações"},
    {id:"proventos",icon:"ti-cash",label:"Proventos"},
    {id:"performance",icon:"ti-trending-up",label:"Performance"},
    {id:"metas",icon:"ti-target",label:"Metas"},
    {id:"apilog",icon:"ti-terminal",label:"API"},
  ];

  if(carregando) return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#0f2a5c,#4b99c9)",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center"}}>
        <i className="ti ti-loader spin" style={{fontSize:32,color:"#93c5fd"}}/>
        <p style={{color:"rgba(255,255,255,0.6)",marginTop:12,fontSize:13}}>Carregando seus investimentos...</p>
      </div>
      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return(
    <div style={{minHeight:"100vh",paddingBottom:"2rem"}}>
      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{padding:"1.25rem 1.25rem 0",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:"50%",background:"rgba(96,165,250,0.25)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <i className="ti ti-chart-candle" style={{fontSize:18,color:"#93c5fd"}}/>
          </div>
          <div>
            <p style={{fontWeight:500,fontSize:17,margin:0,color:"#fff"}}>Investimentos Familiares</p>
            <div style={{display:"flex",gap:8,alignItems:"center",marginTop:2,flexWrap:"wrap"}}>
              <span style={{fontSize:11,color:"rgba(255,255,255,0.5)"}}>USD/BRL {fmt(usdBrl,4)}</span>
              {indicadores&&<span style={{fontSize:11,color:"rgba(255,255,255,0.5)"}}>· CDI {indicadores.cdi_anual}% · Selic {indicadores.selic}%</span>}
              {lastUpdate&&<span style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>· {lastUpdate}</span>}
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <button onClick={atualizarTudo} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",fontSize:12,borderRadius:20,border:"1px solid rgba(255,255,255,0.2)",background:"rgba(96,165,250,0.2)",color:"#93c5fd",fontWeight:500}}>
            <i className={`ti ti-refresh${apiStatus.cotacoes==="loading"?" spin":""}`} style={{fontSize:13}}/>{apiStatus.cotacoes==="loading"?"Atualizando...":"Atualizar"}
          </button>
          {INVESTORS.map(inv=>(
            <button key={inv} onClick={()=>setInvestor(inv)} style={{padding:"5px 14px",fontSize:12,borderRadius:20,border:"1px solid rgba(255,255,255,0.2)",background:investor===inv?"rgba(96,165,250,0.35)":"rgba(255,255,255,0.08)",color:investor===inv?"#fff":"rgba(255,255,255,0.65)",fontWeight:investor===inv?500:400}}>
              {inv}
            </button>
          ))}
          <span title={salvandoBackend?"Salvando na nuvem...":"Dados sincronizados"} style={{display:"inline-flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:20,background:salvandoBackend?"rgba(251,191,36,0.15)":"rgba(52,211,153,0.15)",color:salvandoBackend?"#fde68a":"#6ee7b7",fontSize:11,fontWeight:500}}>
            <i className={`ti ${salvandoBackend?"ti-cloud-upload spin":"ti-cloud-check"}`} style={{fontSize:13}}/>
            {salvandoBackend?"Salvando":"Sincronizado"}
          </span>
          <button onClick={()=>onLogout()} title="Sair" style={{padding:"5px 10px",fontSize:12,borderRadius:20,border:"1px solid rgba(248,113,113,0.3)",background:"rgba(248,113,113,0.1)",color:"#fca5a5",cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
            <i className="ti ti-logout" style={{fontSize:13}}/>Sair
          </button>
        </div>
      </div>

      {/* Nav */}
      <div style={{display:"flex",gap:2,padding:"1rem 1.25rem 0",overflowX:"auto"}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 12px",fontSize:12,borderRadius:"10px 10px 0 0",border:"1px solid rgba(255,255,255,0.12)",borderBottom:"none",background:tab===t.id?"rgba(255,255,255,0.12)":"rgba(255,255,255,0.04)",color:tab===t.id?"#fff":"rgba(255,255,255,0.55)",whiteSpace:"nowrap",fontWeight:tab===t.id?500:400}}>
            <i className={`ti ${t.icon}`} style={{fontSize:13}}/>{t.label}
          </button>
        ))}
      </div>
      <div style={{margin:"0 1.25rem",borderTop:"1px solid rgba(255,255,255,0.12)"}}></div>

      {/* Banner de migração de dados locais */}
      {migracaoDisponivel&&(
        <div style={{margin:"1rem 1.25rem 0",padding:"1rem 1.25rem",borderRadius:12,background:"rgba(251,191,36,0.1)",border:"1px solid rgba(251,191,36,0.3)",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <i className="ti ti-database-import" style={{fontSize:22,color:"#fde68a"}}/>
            <div>
              <p style={{fontWeight:500,fontSize:13,margin:0,color:"#fff"}}>Dados locais encontrados neste navegador</p>
              <p style={{fontSize:11,color:"rgba(255,255,255,0.6)",margin:"2px 0 0"}}>
                {migracaoMsg||"Migre-os para a nuvem para acessar de qualquer dispositivo e compartilhar com outras pessoas."}
              </p>
            </div>
          </div>
          {!migracaoMsg&&(
            <button onClick={migrarDadosLocais} disabled={migrando} style={{padding:"8px 16px",fontSize:13,fontWeight:500,borderRadius:8,border:"none",background:migrando?"rgba(251,191,36,0.2)":"rgba(251,191,36,0.35)",color:"#fff",cursor:migrando?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:6,whiteSpace:"nowrap"}}>
              <i className={`ti ${migrando?"ti-loader spin":"ti-cloud-upload"}`} style={{fontSize:14}}/>
              {migrando?"Migrando...":"Migrar para a nuvem"}
            </button>
          )}
        </div>
      )}

      <div style={{padding:"1rem 1.25rem"}}>

        {/* ── DASHBOARD ── */}
        {tab==="dashboard"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:"1rem"}}>
              {[
                {label:"Patrimônio Total",val:fmtBRL(totalPatrim),sub:"em R$"},
                {label:"Rentabilidade",val:fmtPct(totalRent),sub:"sobre custo",pos:totalRent>=0},
                {label:"Ganho / Perda",val:fmtBRL(totalPatrim-totalCusto),sub:"R$ absoluto",pos:(totalPatrim-totalCusto)>=0},
                {label:"Proventos",val:fmtBRL(totalProv),sub:"total recebido"},
              ].map(c=>(
                <div key={c.label} style={card}>
                  <p style={{fontSize:11,color:"rgba(255,255,255,0.55)",margin:"0 0 4px"}}>{c.label}</p>
                  <p style={{fontSize:20,fontWeight:500,margin:0,color:c.pos===false?"#fca5a5":c.pos===true?"#86efac":"#fff"}}>{c.val}</p>
                  <p style={{fontSize:10,color:"rgba(255,255,255,0.4)",margin:"2px 0 0"}}>{c.sub}</p>
                </div>
              ))}
            </div>

            <div style={{...glass,marginBottom:"1rem"}}>
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
              <div style={{position:"relative",height:200}}><canvas ref={dashChartRef}/></div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:12}}>
              <div style={glass}>
                <p style={{fontWeight:500,fontSize:13,margin:"0 0 12px",color:"rgba(255,255,255,0.8)"}}>Alocação por classe</p>
                {byClass.length===0&&<p style={{fontSize:12,color:"rgba(255,255,255,0.4)",margin:0}}>Nenhum ativo cadastrado ainda.</p>}
                {byClass.map(([cl,val])=>(
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
                {["Vitor","Larissa"].map(inv=>{
                  const ats=assets.filter(a=>a.investidor===inv);
                  const pat=ats.reduce((s,a)=>s+toVal(a,usdBrl,indicadores,fatoresAcum),0);
                  const cus=ats.reduce((s,a)=>s+toCusto(a,usdBrl),0);
                  const ren=cus>0?(pat-cus)/cus*100:0;
                  const prv=provs.filter(p=>p.investidor===inv).reduce((s,p)=>s+(p.moeda==="USD"?p.valor*usdBrl:p.valor),0);
                  const tot=assets.reduce((s,a)=>s+toVal(a,usdBrl,indicadores,fatoresAcum),0);
                  return(
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
        {tab==="carteira"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.75rem",flexWrap:"wrap",gap:8}}>
              <div style={{display:"flex",gap:6}}>
                {[["ativos","Em carteira"],["zerados","Posições zeradas"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setCarteiraFiltro(v)} style={{padding:"5px 12px",fontSize:12,borderRadius:8,border:"1px solid rgba(255,255,255,0.2)",background:carteiraFiltro===v?"rgba(96,165,250,0.3)":"rgba(255,255,255,0.07)",color:carteiraFiltro===v?"#fff":"rgba(255,255,255,0.6)",fontWeight:carteiraFiltro===v?500:400}}>{l}</button>
                ))}
              </div>
              {carteiraFiltro==="ativos"&&<StatusBadge status={apiStatus.cotacoes==="loading"?"loading":apiStatus.cotacoes==="ok"?"ok":"warn"} msg={apiStatus.cotacoes==="loading"?"Atualizando...":apiStatus.cotacoes==="ok"?"Dados ao vivo":"Dados locais"}/>}
            </div>

            {/* Ativos em carteira */}
            {carteiraFiltro==="ativos"&&(
              filtA.length===0
                ?<div style={{...glass,textAlign:"center",padding:"2rem"}}><i className="ti ti-inbox" style={{fontSize:32,color:"rgba(255,255,255,0.3)"}}/><p style={{color:"rgba(255,255,255,0.4)",margin:"8px 0 0",fontSize:13}}>Nenhum ativo. Use a aba Lançamentos para adicionar.</p></div>
                :(()=>{
                  // Agrupa ativos por classe
                  const porClasse={};
                  filtA.forEach(a=>{
                    if(!porClasse[a.classe]) porClasse[a.classe]=[];
                    porClasse[a.classe].push(a);
                  });
                  // Ordena classes pela ordem de CLASSES
                  const classesOrdenadas=CLASSES.filter(c=>porClasse[c]);
                  const COLS=["Ticker","Investidor","Classe","Qtd","P. Médio","Vl. Aplicado","Cotação","Var. Dia","Vl. Atual","Rent.","Lucro Aberto","Lucro Real.","Proventos"];
                  return(
                    <div style={{overflowX:"auto",borderRadius:12,border:"1px solid rgba(255,255,255,0.1)"}}>
                      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                        <thead>
                          <tr style={{background:"rgba(255,255,255,0.06)"}}>
                            {COLS.map(h=><th key={h} style={{padding:"8px 10px",textAlign:"left",color:"rgba(255,255,255,0.5)",fontWeight:500,whiteSpace:"nowrap"}}>{h}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {classesOrdenadas.map(classe=>{
                            const ativos=porClasse[classe];
                            const expandido=expandedClasses[classe]!==false; // expandido por padrão
                            const totalAplicado=ativos.reduce((s,a)=>s+toCusto(a,usdBrl),0);
                            const totalAtual=ativos.reduce((s,a)=>s+toVal(a,usdBrl,indicadores,fatoresAcum),0);
                            const totalRentClasse=totalAplicado>0?(totalAtual-totalAplicado)/totalAplicado*100:0;
                            const totalLucro=ativos.reduce((s,a)=>s+(a.lucroRealizado||0),0);
                            const totalProv=ativos.reduce((s,a)=>s+(a.proventos||0),0);
                            return(
                              <>
                              {/* Linha de subtotal da classe */}
                              <tr key={`class-${classe}`}
                                onClick={()=>setExpandedClasses(p=>({...p,[classe]:!expandido}))}
                                style={{background:"rgba(96,165,250,0.08)",borderTop:"1px solid rgba(255,255,255,0.1)",cursor:"pointer",userSelect:"none"}}>
                                <td colSpan={2} style={{padding:"8px 10px",fontWeight:500,color:"#fff",whiteSpace:"nowrap"}}>
                                  <i className={`ti ti-chevron-${expandido?"down":"right"}`} style={{fontSize:11,marginRight:6,color:"rgba(255,255,255,0.5)"}}/>
                                  <span style={{display:"inline-block",width:10,height:10,borderRadius:2,background:COLORS[classe]||"#888",marginRight:6,verticalAlign:"middle"}}></span>
                                  {classe}
                                  <span style={{fontSize:10,color:"rgba(255,255,255,0.4)",marginLeft:6}}>{ativos.length} ativo{ativos.length!==1?"s":""}</span>
                                </td>
                                <td style={{padding:"8px 10px"}}></td>
                                <td style={{padding:"8px 10px",color:"rgba(255,255,255,0.5)",fontSize:11}}>—</td>
                                <td style={{padding:"8px 10px",color:"rgba(255,255,255,0.5)",fontSize:11}}>—</td>
                                <td style={{padding:"8px 10px",fontWeight:500,color:"rgba(255,255,255,0.85)"}}>{fmtBRL(totalAplicado)}</td>
                                <td style={{padding:"8px 10px",color:"rgba(255,255,255,0.5)",fontSize:11}}>—</td>
                                <td style={{padding:"8px 10px",color:"rgba(255,255,255,0.5)",fontSize:11}}>—</td>
                                <td style={{padding:"8px 10px",fontWeight:500,color:"#fff"}}>{fmtBRL(totalAtual)}</td>
                                <td style={{padding:"8px 10px",fontWeight:500,color:totalRentClasse>=0?"#86efac":"#fca5a5"}}>{fmtPct(totalRentClasse)}</td>
                                <td style={{padding:"8px 10px",fontWeight:500,color:(totalAtual-totalAplicado)>=0?"#86efac":"#fca5a5"}}>{fmtBRL(totalAtual-totalAplicado)}</td>
                                <td style={{padding:"8px 10px",fontWeight:500,color:totalLucro>=0?"#86efac":"#fca5a5"}}>{totalLucro!==0?fmtBRL(totalLucro):"—"}</td>
                                <td style={{padding:"8px 10px",color:"rgba(255,255,255,0.6)"}}>{fmtBRL(totalProv)}</td>
                              </tr>

                              {/* Ativos da classe (expandível) */}
                              {expandido&&ativos.map((a,i)=>{
                                const rent=toRent(a,usdBrl,indicadores,fatoresAcum);
                                const valorTotal=toVal(a,usdBrl,indicadores,fatoresAcum);
                                const valorAplicado=toCusto(a,usdBrl);
                                const valorAtual=a.preco_atual;
                                const lucro=a.lucroRealizado||0;
                                const isRF=isRendaFixa(a)&&a.indexador;
                                const temLotes=isRF&&a.lotes&&a.lotes.length>1;
                                const expandidoLote=expandedRows[a.id];
                                return(
                                  <>
                                  <tr key={a.id}
                                    style={{borderTop:"1px solid rgba(255,255,255,0.04)",background:i%2===0?"rgba(255,255,255,0.015)":"transparent",cursor:temLotes?"pointer":"default"}}
                                    onClick={temLotes?()=>setExpandedRows(p=>({...p,[a.id]:!p[a.id]})):undefined}>
                                    <td style={{padding:"8px 10px 8px 24px",fontWeight:500,color:"#fff"}}>
                                      {temLotes&&<i className={`ti ti-chevron-${expandidoLote?"down":"right"}`} style={{fontSize:10,marginRight:4,color:"rgba(255,255,255,0.4)"}}/>}
                                      {a.ticker}
                                      {isRF&&<span style={{fontSize:9,color:"#fde68a",marginLeft:5,padding:"1px 5px",borderRadius:4,background:"rgba(251,191,36,0.15)"}}>{temLotes?`${a.lotes.length} lotes`:"RF"}</span>}
                                    </td>
                                    <td style={{padding:"8px 10px"}}><span style={badge(a.investidor)}>{a.investidor}</span></td>
                                    <td style={{padding:"8px 10px",color:"rgba(255,255,255,0.45)",fontSize:11}}>
                                      {isRF&&!temLotes&&(a.indexador==="cdi"?(a.modo_cdi==="percentual"?`${a.taxa}% CDI`:`CDI+${a.taxa}%`):a.indexador==="pre"?`Pré ${a.taxa}%`:`${a.indexador.toUpperCase()}+${a.taxa}%`)}
                                    </td>
                                    <td style={{padding:"8px 10px",color:"rgba(255,255,255,0.8)"}}>{fmt(a.qtd,a.qtd<1?6:2)}</td>
                                    <td style={{padding:"8px 10px",color:"rgba(255,255,255,0.6)"}}>
                                      {isRF&&temLotes?"—":a.moeda==="USD"?fmtUSD(a.preco_medio):fmtBRL(a.preco_medio)}
                                      {a.moeda==="USD"&&a.ptax_medio&&<div style={{fontSize:10,color:"rgba(255,255,255,0.35)",marginTop:1}}>PTAX méd: {fmt(a.ptax_medio,4)}</div>}
                                    </td>
                                    <td style={{padding:"8px 10px",color:"rgba(255,255,255,0.75)",fontWeight:500}}>{fmtBRL(valorAplicado)}</td>
                                    <td style={{padding:"8px 10px",color:"#fff",fontWeight:500}}>{isRF&&temLotes?"—":a.moeda==="USD"?fmtUSD(valorAtual):fmtBRL(valorAtual)}</td>
                                    <td style={{padding:"8px 10px",color:a.variacao_dia>=0?"#86efac":"#fca5a5",fontSize:11}}>{a.variacao_dia!=null&&!isRF?fmtPct(a.variacao_dia):"—"}</td>
                                    <td style={{padding:"8px 10px",fontWeight:500,color:"#fff"}}>{fmtBRL(valorTotal)}</td>
                                    <td style={{padding:"8px 10px",color:rent>=0?"#86efac":"#fca5a5",fontWeight:500}}>{fmtPct(rent)}</td>
                                    <td style={{padding:"8px 10px",fontWeight:500,color:(valorTotal-valorAplicado)>=0?"#86efac":"#fca5a5"}}>{fmtBRL(valorTotal-valorAplicado)}</td>
                                    <td style={{padding:"8px 10px",fontWeight:500,color:lucro>=0?"#86efac":"#fca5a5"}}>{lucro!==0?fmtBRL(lucro):"—"}</td>
                                    <td style={{padding:"8px 10px",color:"rgba(255,255,255,0.6)"}}>{fmtBRL(a.proventos)}</td>
                                  </tr>
                                  {/* Lotes expandidos */}
                                  {temLotes&&expandidoLote&&a.lotes.map((l,li)=>{
                                    const vLote=calcValorLote(l,indicadores,fatoresAcum);
                                    const rentLote=l.valor_inicial>0?(vLote-l.valor_inicial)/l.valor_inicial*100:0;
                                    const labelTaxa=l.indexador==="cdi"?(l.modo_cdi==="percentual"?`${l.taxa}% CDI`:`CDI+${l.taxa}%`):l.indexador==="pre"?`Pré ${l.taxa}%`:`${l.indexador?.toUpperCase()}+${l.taxa}%`;
                                    return(
                                      <tr key={l.id} style={{borderTop:"1px solid rgba(255,255,255,0.03)",background:"rgba(251,191,36,0.04)"}}>
                                        <td style={{padding:"5px 10px 5px 36px",color:"rgba(255,255,255,0.45)",fontSize:11}}>
                                          <i className="ti ti-corner-down-right" style={{fontSize:10,marginRight:4,color:"rgba(255,255,255,0.2)"}}/>Lote {li+1}
                                        </td>
                                        <td colSpan={2} style={{padding:"5px 10px",color:"#fde68a",fontSize:11}}>{labelTaxa} · {l.data_compra}</td>
                                        <td style={{padding:"5px 10px",color:"rgba(255,255,255,0.55)",fontSize:11}}>{fmt(l.qtd,l.qtd<1?6:2)}</td>
                                        <td style={{padding:"5px 10px",color:"rgba(255,255,255,0.45)",fontSize:11}}>{fmtBRL(l.preco_unitario)}</td>
                                        <td style={{padding:"5px 10px",color:"rgba(255,255,255,0.65)",fontSize:11,fontWeight:500}}>{fmtBRL(l.valor_inicial)}</td>
                                        <td style={{padding:"5px 10px",color:"rgba(255,255,255,0.45)",fontSize:11}}>{fmtBRL(vLote/l.qtd)}</td>
                                        <td style={{padding:"5px 10px",fontSize:11,color:"rgba(255,255,255,0.25)"}}>—</td>
                                        <td style={{padding:"5px 10px",fontWeight:500,color:"rgba(255,255,255,0.8)",fontSize:11}}>{fmtBRL(vLote)}</td>
                                        <td style={{padding:"5px 10px",color:rentLote>=0?"#86efac":"#fca5a5",fontWeight:500,fontSize:11}}>{fmtPct(rentLote)}</td>
                                        <td style={{padding:"5px 10px",color:(vLote-l.valor_inicial)>=0?"#86efac":"#fca5a5",fontWeight:500,fontSize:11}}>{fmtBRL(vLote-l.valor_inicial)}</td>
                                        <td colSpan={2} style={{padding:"5px 10px",color:"rgba(255,255,255,0.3)",fontSize:11}}>{l.vencimento?`Venc: ${l.vencimento}`:"—"}</td>
                                      </tr>
                                    );
                                  })}
                                  </>
                                );
                              })}
                              </>
                            );
                          })}
                          {/* Linha de total geral */}
                          <tr style={{borderTop:"2px solid rgba(255,255,255,0.15)",background:"rgba(255,255,255,0.05)"}}>
                            <td colSpan={3} style={{padding:"9px 10px",fontWeight:500,color:"rgba(255,255,255,0.7)",fontSize:12}}>TOTAL GERAL</td>
                            <td style={{padding:"9px 10px",color:"rgba(255,255,255,0.4)"}}>—</td>
                            <td style={{padding:"9px 10px",color:"rgba(255,255,255,0.4)"}}>—</td>
                            <td style={{padding:"9px 10px",fontWeight:500,color:"#fff"}}>{fmtBRL(filtA.reduce((s,a)=>s+toCusto(a,usdBrl),0))}</td>
                            <td style={{padding:"9px 10px",color:"rgba(255,255,255,0.4)"}}>—</td>
                            <td style={{padding:"9px 10px",color:"rgba(255,255,255,0.4)"}}>—</td>
                            <td style={{padding:"9px 10px",fontWeight:500,color:"#fff"}}>{fmtBRL(totalPatrim)}</td>
                            <td style={{padding:"9px 10px",fontWeight:500,color:totalRent>=0?"#86efac":"#fca5a5"}}>{fmtPct(totalRent)}</td>
                            <td style={{padding:"9px 10px",fontWeight:500,color:(filtA.reduce((s,a)=>s+(a.lucroRealizado||0),0))>=0?"#86efac":"#fca5a5"}}>{fmtBRL(filtA.reduce((s,a)=>s+(a.lucroRealizado||0),0))}</td>
                            <td style={{padding:"9px 10px",color:"rgba(255,255,255,0.6)"}}>{fmtBRL(filtA.reduce((s,a)=>s+(a.proventos||0),0))}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  );
                })()
            )}

            {/* Posições zeradas */}
            {carteiraFiltro==="zerados"&&(()=>{
              const zerados=Object.values(ativosZerados).filter(z=>investor==="Todos"||z.investidor===investor);
              return zerados.length===0
                ?<div style={{...glass,textAlign:"center",padding:"2rem"}}><i className="ti ti-check" style={{fontSize:32,color:"rgba(255,255,255,0.3)"}}/><p style={{color:"rgba(255,255,255,0.4)",margin:"8px 0 0",fontSize:13}}>Nenhuma posição zerada ainda.</p></div>
                :<div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:"1rem"}}>
                    {[
                      {l:"Lucro total realizado",v:fmtBRL(zerados.reduce((s,z)=>s+z.lucroRealizado,0)),pos:zerados.reduce((s,z)=>s+z.lucroRealizado,0)>=0},
                      {l:"— do ativo (USD)",v:fmtBRL(zerados.reduce((s,z)=>s+(z.lucroAtivoRealizado||0),0)),pos:zerados.reduce((s,z)=>s+(z.lucroAtivoRealizado||0),0)>=0},
                      {l:"— do câmbio (PTAX)",v:fmtBRL(zerados.reduce((s,z)=>s+(z.lucroCambioRealizado||0),0)),pos:zerados.reduce((s,z)=>s+(z.lucroCambioRealizado||0),0)>=0},
                      {l:"Posições encerradas",v:zerados.length},
                    ].map(x=>(
                      <div key={x.l} style={card}>
                        <p style={{fontSize:11,color:"rgba(255,255,255,0.5)",margin:"0 0 4px"}}>{x.l}</p>
                        <p style={{fontSize:18,fontWeight:500,margin:0,color:x.pos===false?"#fca5a5":x.pos===true?"#86efac":"#fff"}}>{x.v}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{overflowX:"auto",borderRadius:12,border:"1px solid rgba(255,255,255,0.1)"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                      <thead><tr style={{background:"rgba(255,255,255,0.06)"}}>{["Ticker","Investidor","Classe","P. Médio","Última Venda","Qtd Vendida","Lucro (Ativo)","Lucro (Câmbio)","Lucro Realizado"].map(h=>(<th key={h} style={{padding:"8px 10px",textAlign:"left",color:"rgba(255,255,255,0.5)",fontWeight:500,whiteSpace:"nowrap"}}>{h}</th>))}</tr></thead>
                      <tbody>
                        {zerados.map((z,i)=>{
                          const ult=z.vendas?.[z.vendas.length-1];
                          const isUSD=z.ptax_medio!=null;
                          return(
                            <tr key={i} style={{borderTop:"1px solid rgba(255,255,255,0.06)",background:i%2===0?"rgba(255,255,255,0.02)":"transparent"}}>
                              <td style={{padding:"8px 10px",fontWeight:500,color:"#fff"}}>{z.ticker}</td>
                              <td style={{padding:"8px 10px"}}><span style={badge(z.investidor)}>{z.investidor}</span></td>
                              <td style={{padding:"8px 10px",color:"rgba(255,255,255,0.55)",fontSize:11}}>{z.classe}</td>
                              <td style={{padding:"8px 10px",color:"rgba(255,255,255,0.7)"}}>{z.preco_medio?fmtBRL(z.preco_medio):"—"}</td>
                              <td style={{padding:"8px 10px",color:"rgba(255,255,255,0.7)"}}>{ult?`${fmtBRL(ult.preco)} em ${ult.data}`:"—"}</td>
                              <td style={{padding:"8px 10px",color:"rgba(255,255,255,0.8)"}}>{ult?fmt(ult.qtd,ult.qtd<1?6:2):"—"}</td>
                              <td style={{padding:"8px 10px",color:(z.lucroAtivoRealizado||0)>=0?"#86efac":"#fca5a5"}}>{isUSD?fmtBRL(z.lucroAtivoRealizado||0):"—"}</td>
                              <td style={{padding:"8px 10px",color:(z.lucroCambioRealizado||0)>=0?"#86efac":"#fca5a5"}}>{isUSD?fmtBRL(z.lucroCambioRealizado||0):"—"}</td>
                              <td style={{padding:"8px 10px",fontWeight:500,color:z.lucroRealizado>=0?"#86efac":"#fca5a5"}}>{fmtBRL(z.lucroRealizado)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>;
            })()}
          </div>
        )}

        {/* ── LANÇAMENTOS ── */}
        {tab==="lancamentos"&&(
          <div>
            <div style={{display:"flex",gap:6,marginBottom:"1rem"}}>
              {[["op","Compra / Venda"],["prov","Registrar Provento"]].map(([s,l])=>(
                <button key={s} onClick={()=>setSubTab(s)} style={{padding:"6px 14px",fontSize:12,borderRadius:8,border:"1px solid rgba(255,255,255,0.2)",background:subTab===s?"rgba(96,165,250,0.3)":"rgba(255,255,255,0.07)",color:subTab===s?"#fff":"rgba(255,255,255,0.6)",fontWeight:subTab===s?500:400}}>{l}</button>
              ))}
            </div>
            {subTab==="op"&&(
              <div style={{...glass,maxWidth:520}}>
                <p style={{fontWeight:500,fontSize:14,margin:"0 0 1rem",color:"#fff"}}>Registrar operação</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  {[
                    {l:"Tipo",e:<select value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))}><option value="compra">Compra</option><option value="venda">Venda</option></select>},
                    {l:"Investidor",e:<select value={form.investidor} onChange={e=>setForm(f=>({...f,investidor:e.target.value}))}><option>Vitor</option><option>Larissa</option></select>},
                    {l:"Ticker",e:<input value={form.ticker} onChange={e=>setForm(f=>({...f,ticker:e.target.value.toUpperCase()}))} placeholder="ex: PETR4"/>},
                    {l:"Nome",e:<input value={form.nome} onChange={e=>setForm(f=>({...f,nome:e.target.value}))} placeholder="ex: Petrobras"/>},
                    {l:"Classe",e:<select value={form.classe} onChange={e=>setForm(f=>({...f,classe:e.target.value}))}>{CLASSES.map(c=><option key={c}>{c}</option>)}</select>},
                    {l:"Moeda",e:<select value={form.moeda} onChange={e=>setForm(f=>({...f,moeda:e.target.value}))}><option value="BRL">BRL (R$)</option><option value="USD">USD (US$)</option></select>},
                    {l:"Quantidade",e:<input type="number" value={form.qtd} onChange={e=>setForm(f=>({...f,qtd:e.target.value}))} placeholder="0"/>},
                    {l:"Preço unit.",e:<input type="number" value={form.preco} onChange={e=>setForm(f=>({...f,preco:e.target.value}))} placeholder="0,00"/>},
                    {l:"Data",e:<input type="date" value={form.data} onChange={e=>setForm(f=>({...f,data:e.target.value}))}/>},
                    ...(form.moeda==="USD"?[{l:form.tipo==="compra"?"PTAX (compra)":"PTAX (venda)",e:<input type="number" step="0.0001" value={form.ptax} onChange={e=>setForm(f=>({...f,ptax:e.target.value}))} placeholder={`ex: ${fmt(usdBrl,4)}`}/>}]:[]),
                    {l:"Total est.",e:<div style={{padding:"7px 10px",borderRadius:8,background:"rgba(255,255,255,0.06)",color:form.qtd&&form.preco?"#86efac":"rgba(255,255,255,0.3)",fontWeight:500,fontSize:13}}>{form.qtd&&form.preco?fmtBRL(parseFloat(form.qtd)*parseFloat(form.preco)*(form.moeda==="USD"?(parseFloat(form.ptax)||usdBrl):1)):"—"}</div>},
                  ].map(({l,e})=>(<div key={l}><label style={{fontSize:12,color:"rgba(255,255,255,0.6)",display:"block",marginBottom:4}}>{l}</label>{e}</div>))}
                </div>
                {form.moeda==="USD"&&(
                  <p style={{fontSize:11,color:"rgba(255,255,255,0.4)",margin:"10px 0 0",lineHeight:1.4}}>
                    <i className="ti ti-info-circle" style={{fontSize:11,marginRight:3}}/>Informe o PTAX (câmbio) do dia da operação. Se deixado em branco, será usado o câmbio atual (R$ {fmt(usdBrl,4)}) — o que pode distorcer a decomposição entre ganho do ativo e ganho cambial.
                  </p>
                )}

                {/* Campos específicos para Renda Fixa */}
                {["Tesouro Direto","CDB/LCI/LCA"].includes(form.classe)&&form.tipo==="compra"&&(
                  <div style={{marginTop:16,padding:"12px",borderRadius:10,background:"rgba(251,191,36,0.08)",border:"1px solid rgba(251,191,36,0.2)"}}>
                    <p style={{fontSize:12,fontWeight:500,margin:"0 0 10px",color:"#fde68a"}}>
                      <i className="ti ti-info-circle" style={{fontSize:12,marginRight:5}}/>Renda Fixa — Indexador e Taxa
                    </p>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                      <div>
                        <label style={{fontSize:12,color:"rgba(255,255,255,0.6)",display:"block",marginBottom:4}}>Indexador</label>
                        <select value={form.indexador} onChange={e=>setForm(f=>({...f,indexador:e.target.value}))}>
                          <option value="pre">Pré-fixado</option>
                          <option value="cdi">CDI</option>
                          <option value="ipca">IPCA</option>
                          <option value="selic">Selic</option>
                        </select>
                      </div>
                      {form.indexador==="cdi"&&(
                        <div>
                          <label style={{fontSize:12,color:"rgba(255,255,255,0.6)",display:"block",marginBottom:4}}>Modo CDI</label>
                          <select value={form.modo_cdi} onChange={e=>setForm(f=>({...f,modo_cdi:e.target.value}))}>
                            <option value="percentual">% do CDI</option>
                            <option value="spread">CDI + spread</option>
                          </select>
                        </div>
                      )}
                      <div>
                        <label style={{fontSize:12,color:"rgba(255,255,255,0.6)",display:"block",marginBottom:4}}>
                          {form.indexador==="pre"?"Taxa (% a.a.)":
                            form.indexador==="cdi"?(form.modo_cdi==="percentual"?"% do CDI":"Spread (% a.a.)"):
                            `${form.indexador.toUpperCase()} + (% a.a.)`}
                        </label>
                        <input type="number" step="0.01" value={form.taxa} onChange={e=>setForm(f=>({...f,taxa:e.target.value}))} placeholder={form.indexador==="cdi"&&form.modo_cdi==="percentual"?"110":"5.50"}/>
                      </div>
                      <div>
                        <label style={{fontSize:12,color:"rgba(255,255,255,0.6)",display:"block",marginBottom:4}}>Vencimento (opcional)</label>
                        <input type="date" value={form.vencimento} onChange={e=>setForm(f=>({...f,vencimento:e.target.value}))}/>
                      </div>
                    </div>
                    <p style={{fontSize:10,color:"rgba(255,255,255,0.45)",margin:"10px 0 0",lineHeight:1.4}}>
                      <i className="ti ti-calculator" style={{fontSize:10,marginRight:3}}/>O valor atual será calculado a partir da data de compra usando os indicadores reais do Banco Central.
                    </p>
                  </div>
                )}

                <button onClick={handleOp} style={{marginTop:"1rem",width:"100%",padding:"9px",fontSize:13,fontWeight:500,borderRadius:8,border:"none",background:"rgba(96,165,250,0.4)",color:"#fff"}}>
                  {saving?"Salvando...":"Registrar operação"}
                </button>
              </div>
            )}
            {subTab==="prov"&&(
              <div style={{...glass,maxWidth:520}}>
                <p style={{fontWeight:500,fontSize:14,margin:"0 0 1rem",color:"#fff"}}>Registrar provento</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  {[
                    {l:"Investidor",e:<select value={pForm.investidor} onChange={e=>setPForm(f=>({...f,investidor:e.target.value}))}><option>Vitor</option><option>Larissa</option></select>},
                    {l:"Ticker",e:<input value={pForm.ticker} onChange={e=>setPForm(f=>({...f,ticker:e.target.value.toUpperCase()}))} placeholder="ex: MXRF11"/>},
                    {l:"Tipo",e:<select value={pForm.tipo} onChange={e=>setPForm(f=>({...f,tipo:e.target.value}))}><option>Dividendo</option><option>JCP</option><option>Rendimento</option></select>},
                    {l:"Valor",e:<input type="number" value={pForm.valor} onChange={e=>setPForm(f=>({...f,valor:e.target.value}))} placeholder="0,00"/>},
                    {l:"Moeda",e:<select value={pForm.moeda} onChange={e=>setPForm(f=>({...f,moeda:e.target.value}))}><option value="BRL">BRL (R$)</option><option value="USD">USD (US$)</option></select>},
                    {l:"Data",e:<input type="date" value={pForm.data} onChange={e=>setPForm(f=>({...f,data:e.target.value}))}/>},
                  ].map(({l,e})=>(<div key={l}><label style={{fontSize:12,color:"rgba(255,255,255,0.6)",display:"block",marginBottom:4}}>{l}</label>{e}</div>))}
                </div>
                <button onClick={handleProv} style={{marginTop:"1rem",width:"100%",padding:"9px",fontSize:13,fontWeight:500,borderRadius:8,border:"none",background:"rgba(52,211,153,0.35)",color:"#fff"}}>
                  {saving?"Salvando...":"Registrar provento"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── OPERAÇÕES ── */}
        {tab==="operacoes"&&(
          <div>
            <div style={{display:"flex",gap:8,marginBottom:"1rem",flexWrap:"wrap",alignItems:"center"}}>
              <p style={{fontWeight:500,margin:0,color:"#fff"}}>{filtOps.length} operaç{filtOps.length!==1?"ões":"ão"}</p>
              <div style={{display:"flex",gap:6,marginLeft:"auto",flexWrap:"wrap"}}>
                <input value={opFiltro.ticker} onChange={e=>setOpFiltro(f=>({...f,ticker:e.target.value}))} placeholder="Filtrar ticker..." style={{padding:"5px 10px",borderRadius:8,border:"1px solid rgba(255,255,255,0.2)",background:"rgba(255,255,255,0.08)",color:"#e2e8f0",fontSize:12,width:130,outline:"none"}}/>
                {["Todos","Vitor","Larissa"].map(inv=>(
                  <button key={inv} onClick={()=>setOpFiltro(f=>({...f,investidor:inv}))} style={{padding:"5px 10px",fontSize:11,borderRadius:8,border:"1px solid rgba(255,255,255,0.15)",background:opFiltro.investidor===inv?"rgba(96,165,250,0.3)":"rgba(255,255,255,0.06)",color:opFiltro.investidor===inv?"#fff":"rgba(255,255,255,0.6)",fontWeight:opFiltro.investidor===inv?500:400}}>{inv}</button>
                ))}
                {["Todos","compra","venda"].map(t=>(
                  <button key={t} onClick={()=>setOpFiltro(f=>({...f,tipo:t}))} style={{padding:"5px 10px",fontSize:11,borderRadius:8,border:"1px solid rgba(255,255,255,0.15)",background:opFiltro.tipo===t?"rgba(96,165,250,0.3)":"rgba(255,255,255,0.06)",color:opFiltro.tipo===t?"#fff":"rgba(255,255,255,0.6)",fontWeight:opFiltro.tipo===t?500:400,textTransform:"capitalize"}}>{t}</button>
                ))}
              </div>
            </div>

            {/* Totais rápidos */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:"1rem"}}>
              {[
                {l:"Total compras",v:fmtBRL(filtOps.filter(o=>o.tipo==="compra").reduce((s,o)=>s+o.total,0)),c:"#86efac"},
                {l:"Total vendas", v:fmtBRL(filtOps.filter(o=>o.tipo==="venda").reduce((s,o)=>s+o.total,0)),c:"#fca5a5"},
                {l:"Nº operações", v:filtOps.length,c:"#fff"},
                {l:"Ativos distintos",v:new Set(filtOps.map(o=>o.ticker)).size,c:"#fff"},
              ].map(x=>(
                <div key={x.l} style={card}>
                  <p style={{fontSize:11,color:"rgba(255,255,255,0.5)",margin:"0 0 4px"}}>{x.l}</p>
                  <p style={{fontSize:18,fontWeight:500,margin:0,color:x.c}}>{x.v}</p>
                </div>
              ))}
            </div>

            {filtOps.length===0
              ?<div style={{...glass,textAlign:"center",padding:"2rem"}}><i className="ti ti-history" style={{fontSize:32,color:"rgba(255,255,255,0.3)"}}/><p style={{color:"rgba(255,255,255,0.4)",margin:"8px 0 0",fontSize:13}}>Nenhuma operação registrada ainda.</p></div>
              :<div style={{overflowX:"auto",borderRadius:12,border:"1px solid rgba(255,255,255,0.1)"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead><tr style={{background:"rgba(255,255,255,0.06)"}}>{["Data","Tipo","Ticker","Investidor","Classe","Qtd","Preço","Total (R$)","Ações"].map(h=>(<th key={h} style={{padding:"8px 10px",textAlign:"left",color:"rgba(255,255,255,0.5)",fontWeight:500,whiteSpace:"nowrap"}}>{h}</th>))}</tr></thead>
                  <tbody>
                    {filtOps.map((op,i)=>(
                      <tr key={op.id} style={{borderTop:"1px solid rgba(255,255,255,0.06)",background:i%2===0?"rgba(255,255,255,0.02)":"transparent"}}>
                        <td style={{padding:"8px 10px",color:"rgba(255,255,255,0.55)"}}>{op.data}</td>
                        <td style={{padding:"8px 10px"}}><span style={tipoBadge(op.tipo)}>{op.tipo}</span></td>
                        <td style={{padding:"8px 10px",fontWeight:500,color:"#fff"}}>{op.ticker}</td>
                        <td style={{padding:"8px 10px"}}><span style={badge(op.investidor)}>{op.investidor}</span></td>
                        <td style={{padding:"8px 10px",color:"rgba(255,255,255,0.55)",fontSize:11}}>{op.classe}</td>
                        <td style={{padding:"8px 10px",color:"rgba(255,255,255,0.8)"}}>{fmt(op.qtd,op.qtd<1?6:2)}</td>
                        <td style={{padding:"8px 10px",color:"rgba(255,255,255,0.7)"}}>{op.moeda==="USD"?fmtUSD(op.preco):fmtBRL(op.preco)}</td>
                        <td style={{padding:"8px 10px",fontWeight:500,color:op.tipo==="compra"?"#86efac":"#fca5a5"}}>{fmtBRL(op.total)}</td>
                        <td style={{padding:"8px 10px",whiteSpace:"nowrap"}}>
                          <button onClick={()=>setEditOp({...op})} title="Editar" style={{padding:"3px 7px",fontSize:11,borderRadius:6,border:"1px solid rgba(96,165,250,0.3)",background:"rgba(96,165,250,0.15)",color:"#93c5fd",cursor:"pointer",marginRight:4}}>
                            <i className="ti ti-pencil" style={{fontSize:11}}/>
                          </button>
                          <button onClick={()=>setConfirmDelete(op.id)} title="Excluir" style={{padding:"3px 7px",fontSize:11,borderRadius:6,border:"1px solid rgba(248,113,113,0.3)",background:"rgba(248,113,113,0.15)",color:"#fca5a5",cursor:"pointer"}}>
                            <i className="ti ti-trash" style={{fontSize:11}}/>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            }

            {/* Modal de edição */}
            {editOp&&(
              <div onClick={()=>setEditOp(null)} style={{position:"fixed",inset:0,background:"rgba(0,10,30,0.7)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:"1rem"}}>
                <div onClick={e=>e.stopPropagation()} style={{background:"linear-gradient(160deg,#1a3a7c,#2563a8)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:16,padding:"1.5rem",width:"100%",maxWidth:480}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                    <p style={{fontWeight:500,fontSize:15,margin:0,color:"#fff"}}>
                      <i className="ti ti-pencil" style={{fontSize:14,marginRight:6,color:"#93c5fd"}}/>Editar operação
                    </p>
                    <button onClick={()=>setEditOp(null)} style={{background:"none",border:"none",color:"rgba(255,255,255,0.5)",cursor:"pointer",padding:4}}>
                      <i className="ti ti-x" style={{fontSize:18}}/>
                    </button>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    {[
                      {l:"Tipo",e:<select value={editOp.tipo} onChange={e=>setEditOp({...editOp,tipo:e.target.value})}><option value="compra">Compra</option><option value="venda">Venda</option></select>},
                      {l:"Investidor",e:<select value={editOp.investidor} onChange={e=>setEditOp({...editOp,investidor:e.target.value})}><option>Vitor</option><option>Larissa</option></select>},
                      {l:"Ticker",e:<input value={editOp.ticker} onChange={e=>setEditOp({...editOp,ticker:e.target.value.toUpperCase()})}/>},
                      {l:"Classe",e:<select value={editOp.classe} onChange={e=>setEditOp({...editOp,classe:e.target.value})}>{CLASSES.map(c=><option key={c}>{c}</option>)}</select>},
                      {l:"Quantidade",e:<input type="number" value={editOp.qtd} onChange={e=>setEditOp({...editOp,qtd:e.target.value})}/>},
                      {l:"Preço unit.",e:<input type="number" value={editOp.preco} onChange={e=>setEditOp({...editOp,preco:e.target.value})}/>},
                      {l:"Data",e:<input type="date" value={editOp.data} onChange={e=>setEditOp({...editOp,data:e.target.value})}/>},
                      {l:"Moeda",e:<select value={editOp.moeda} onChange={e=>setEditOp({...editOp,moeda:e.target.value})}><option value="BRL">BRL (R$)</option><option value="USD">USD (US$)</option></select>},
                      ...(editOp.moeda==="USD"?[{l:editOp.tipo==="compra"?"PTAX (compra)":"PTAX (venda)",e:<input type="number" step="0.0001" value={editOp.ptax||""} onChange={e=>setEditOp({...editOp,ptax:e.target.value})}/>}]:[]),
                    ].map(({l,e})=>(<div key={l}><label style={{fontSize:12,color:"rgba(255,255,255,0.6)",display:"block",marginBottom:4}}>{l}</label>{e}</div>))}
                  </div>
                  <div style={{display:"flex",gap:8,marginTop:18}}>
                    <button onClick={()=>setEditOp(null)} style={{flex:1,padding:"9px",fontSize:13,fontWeight:500,borderRadius:8,border:"1px solid rgba(255,255,255,0.2)",background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.7)",cursor:"pointer"}}>Cancelar</button>
                    <button onClick={()=>salvarEdicao(editOp)} style={{flex:1,padding:"9px",fontSize:13,fontWeight:500,borderRadius:8,border:"none",background:"rgba(96,165,250,0.5)",color:"#fff",cursor:"pointer"}}>
                      <i className="ti ti-check" style={{fontSize:13,marginRight:4}}/>Salvar
                    </button>
                  </div>
                  <p style={{fontSize:11,color:"rgba(255,255,255,0.4)",margin:"12px 0 0",textAlign:"center"}}>
                    <i className="ti ti-info-circle" style={{fontSize:11,marginRight:3}}/>A carteira será recalculada automaticamente
                  </p>
                </div>
              </div>
            )}

            {/* Modal de confirmação de exclusão */}
            {confirmDelete!==null&&(()=>{
              const op=operacoes.find(o=>o.id===confirmDelete);
              if(!op)return null;
              return(
                <div onClick={()=>setConfirmDelete(null)} style={{position:"fixed",inset:0,background:"rgba(0,10,30,0.7)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:"1rem"}}>
                  <div onClick={e=>e.stopPropagation()} style={{background:"linear-gradient(160deg,#1a3a7c,#2563a8)",border:"1px solid rgba(248,113,113,0.3)",borderRadius:16,padding:"1.5rem",width:"100%",maxWidth:380,textAlign:"center"}}>
                    <div style={{width:48,height:48,borderRadius:"50%",background:"rgba(248,113,113,0.2)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}>
                      <i className="ti ti-trash" style={{fontSize:22,color:"#fca5a5"}}/>
                    </div>
                    <p style={{fontWeight:500,fontSize:15,margin:"0 0 8px",color:"#fff"}}>Excluir operação?</p>
                    <p style={{fontSize:12,color:"rgba(255,255,255,0.6)",margin:"0 0 4px"}}>
                      <span style={tipoBadge(op.tipo)}>{op.tipo}</span> · <strong>{op.ticker}</strong> · {fmt(op.qtd,op.qtd<1?6:2)} unid. a {op.moeda==="USD"?fmtUSD(op.preco):fmtBRL(op.preco)}
                    </p>
                    <p style={{fontSize:11,color:"rgba(255,255,255,0.4)",margin:"0 0 16px"}}>{op.data} · {op.investidor}</p>
                    <p style={{fontSize:11,color:"#fde68a",margin:"0 0 16px",padding:"8px",borderRadius:6,background:"rgba(251,191,36,0.1)",border:"1px solid rgba(251,191,36,0.2)"}}>
                      <i className="ti ti-alert-triangle" style={{fontSize:11,marginRight:4}}/>A carteira será recalculada e o lucro realizado pode mudar.
                    </p>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={()=>setConfirmDelete(null)} style={{flex:1,padding:"9px",fontSize:13,fontWeight:500,borderRadius:8,border:"1px solid rgba(255,255,255,0.2)",background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.7)",cursor:"pointer"}}>Cancelar</button>
                      <button onClick={()=>excluirOperacao(confirmDelete)} style={{flex:1,padding:"9px",fontSize:13,fontWeight:500,borderRadius:8,border:"none",background:"rgba(248,113,113,0.5)",color:"#fff",cursor:"pointer"}}>
                        <i className="ti ti-trash" style={{fontSize:13,marginRight:4}}/>Excluir
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── PROVENTOS ── */}
        {tab==="proventos"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:"1rem"}}>
              {["Dividendo","JCP","Rendimento"].map(tipo=>{
                const total=filtP.filter(p=>p.tipo===tipo).reduce((s,p)=>s+(p.moeda==="USD"?p.valor*usdBrl:p.valor),0);
                return(<div key={tipo} style={card}><p style={{fontSize:11,color:"rgba(255,255,255,0.55)",margin:"0 0 4px"}}>{tipo}</p><p style={{fontSize:18,fontWeight:500,margin:0,color:"#fff"}}>{fmtBRL(total)}</p></div>);
              })}
              <div style={card}><p style={{fontSize:11,color:"rgba(255,255,255,0.55)",margin:"0 0 4px"}}>Total</p><p style={{fontSize:18,fontWeight:500,margin:0,color:"#86efac"}}>{fmtBRL(totalProv)}</p></div>
            </div>
            {filtP.length===0
              ?<div style={{...glass,textAlign:"center",padding:"2rem"}}><i className="ti ti-cash" style={{fontSize:32,color:"rgba(255,255,255,0.3)"}}/><p style={{color:"rgba(255,255,255,0.4)",margin:"8px 0 0",fontSize:13}}>Nenhum provento registrado ainda.</p></div>
              :<div style={{overflowX:"auto",borderRadius:12,border:"1px solid rgba(255,255,255,0.1)"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead><tr style={{background:"rgba(255,255,255,0.06)"}}>{["Data","Ticker","Investidor","Tipo","Origem","Valor","Em R$","Ações"].map(h=>(<th key={h} style={{padding:"8px 10px",textAlign:"left",color:"rgba(255,255,255,0.5)",fontWeight:500}}>{h}</th>))}</tr></thead>
                  <tbody>
                    {filtP.sort((a,b)=>b.data.localeCompare(a.data)).map((p,i)=>(
                      <tr key={p.id} style={{borderTop:"1px solid rgba(255,255,255,0.06)",background:i%2===0?"rgba(255,255,255,0.02)":"transparent"}}>
                        <td style={{padding:"8px 10px",color:"rgba(255,255,255,0.55)"}}>{p.data}</td>
                        <td style={{padding:"8px 10px",fontWeight:500,color:"#fff"}}>{p.ticker}</td>
                        <td style={{padding:"8px 10px"}}><span style={badge(p.investidor)}>{p.investidor}</span></td>
                        <td style={{padding:"8px 10px",color:"rgba(255,255,255,0.75)"}}>{p.tipo}</td>
                        <td style={{padding:"8px 10px",fontSize:10,color:p.origem==="brapi"?"#93c5fd":"rgba(255,255,255,0.4)"}}>{p.origem==="brapi"?"BRAPI":"Manual"}</td>
                        <td style={{padding:"8px 10px",color:"rgba(255,255,255,0.7)"}}>{p.moeda==="USD"?fmtUSD(p.valor):fmtBRL(p.valor)}</td>
                        <td style={{padding:"8px 10px",color:"#86efac",fontWeight:500}}>{fmtBRL(p.moeda==="USD"?p.valor*usdBrl:p.valor)}</td>
                        <td style={{padding:"8px 10px",whiteSpace:"nowrap"}}>
                          <button onClick={()=>setEditProv({...p})} title="Editar" style={{padding:"3px 7px",fontSize:11,borderRadius:6,border:"1px solid rgba(96,165,250,0.3)",background:"rgba(96,165,250,0.15)",color:"#93c5fd",cursor:"pointer",marginRight:4}}>
                            <i className="ti ti-edit" style={{fontSize:11}}/>
                          </button>
                          <button onClick={()=>setConfirmDeleteProv(p.id)} title="Excluir" style={{padding:"3px 7px",fontSize:11,borderRadius:6,border:"1px solid rgba(248,113,113,0.3)",background:"rgba(248,113,113,0.15)",color:"#fca5a5",cursor:"pointer"}}>
                            <i className="ti ti-trash" style={{fontSize:11}}/>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            }

            {/* Modal de edição de provento */}
            {editProv&&(
              <div onClick={()=>setEditProv(null)} style={{position:"fixed",inset:0,background:"rgba(0,10,30,0.7)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:"1rem"}}>
                <div onClick={e=>e.stopPropagation()} style={{...glass,width:"100%",maxWidth:460}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                    <p style={{fontWeight:500,fontSize:14,margin:0,color:"#fff"}}>Editar provento</p>
                    <button onClick={()=>setEditProv(null)} style={{background:"none",border:"none",color:"rgba(255,255,255,0.5)",cursor:"pointer",padding:4}}>
                      <i className="ti ti-x" style={{fontSize:18}}/>
                    </button>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    {[
                      {l:"Investidor",e:<select value={editProv.investidor} onChange={e=>setEditProv({...editProv,investidor:e.target.value})}><option>Vitor</option><option>Larissa</option></select>},
                      {l:"Ticker",e:<input value={editProv.ticker} onChange={e=>setEditProv({...editProv,ticker:e.target.value.toUpperCase()})}/>},
                      {l:"Tipo",e:<select value={editProv.tipo} onChange={e=>setEditProv({...editProv,tipo:e.target.value})}><option>Dividendo</option><option>JCP</option><option>Rendimento</option></select>},
                      {l:"Valor",e:<input type="number" value={editProv.valor} onChange={e=>setEditProv({...editProv,valor:e.target.value})}/>},
                      {l:"Moeda",e:<select value={editProv.moeda} onChange={e=>setEditProv({...editProv,moeda:e.target.value})}><option value="BRL">BRL (R$)</option><option value="USD">USD (US$)</option></select>},
                      {l:"Data",e:<input type="date" value={editProv.data} onChange={e=>setEditProv({...editProv,data:e.target.value})}/>},
                    ].map(({l,e})=>(<div key={l}><label style={{fontSize:12,color:"rgba(255,255,255,0.6)",display:"block",marginBottom:4}}>{l}</label>{e}</div>))}
                  </div>
                  <div style={{display:"flex",gap:8,marginTop:18}}>
                    <button onClick={()=>setEditProv(null)} style={{flex:1,padding:"9px",fontSize:13,fontWeight:500,borderRadius:8,border:"1px solid rgba(255,255,255,0.2)",background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.7)",cursor:"pointer"}}>Cancelar</button>
                    <button onClick={()=>salvarEdicaoProv(editProv)} style={{flex:1,padding:"9px",fontSize:13,fontWeight:500,borderRadius:8,border:"none",background:"rgba(96,165,250,0.5)",color:"#fff",cursor:"pointer"}}>
                      <i className="ti ti-check" style={{fontSize:13,marginRight:4}}/>Salvar
                    </button>
                  </div>
                  <p style={{fontSize:11,color:"rgba(255,255,255,0.4)",margin:"12px 0 0",textAlign:"center"}}>
                    <i className="ti ti-info-circle" style={{fontSize:11,marginRight:3}}/>O total de proventos na aba Carteira será ajustado automaticamente.
                  </p>
                </div>
              </div>
            )}

            {/* Modal de confirmação de exclusão de provento */}
            {confirmDeleteProv!==null&&(()=>{
              const p=provs.find(pr=>pr.id===confirmDeleteProv);
              if(!p)return null;
              return(
                <div onClick={()=>setConfirmDeleteProv(null)} style={{position:"fixed",inset:0,background:"rgba(0,10,30,0.7)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:"1rem"}}>
                  <div onClick={e=>e.stopPropagation()} style={{background:"linear-gradient(160deg,#1a3a7c,#2563a8)",border:"1px solid rgba(248,113,113,0.3)",borderRadius:16,padding:"1.5rem",width:"100%",maxWidth:380,textAlign:"center"}}>
                    <div style={{width:48,height:48,borderRadius:"50%",background:"rgba(248,113,113,0.2)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}>
                      <i className="ti ti-trash" style={{fontSize:22,color:"#fca5a5"}}/>
                    </div>
                    <p style={{fontWeight:500,fontSize:15,margin:"0 0 8px",color:"#fff"}}>Excluir provento?</p>
                    <p style={{fontSize:12,color:"rgba(255,255,255,0.6)",margin:"0 0 4px"}}>
                      <strong>{p.ticker}</strong> · {p.tipo} · {p.moeda==="USD"?fmtUSD(p.valor):fmtBRL(p.valor)}
                    </p>
                    <p style={{fontSize:11,color:"rgba(255,255,255,0.4)",margin:"0 0 16px"}}>{p.data} · {p.investidor}</p>
                    <p style={{fontSize:11,color:"#fde68a",margin:"0 0 16px",padding:"8px",borderRadius:6,background:"rgba(251,191,36,0.1)",border:"1px solid rgba(251,191,36,0.2)"}}>
                      <i className="ti ti-alert-triangle" style={{fontSize:11,marginRight:4}}/>O valor será descontado do total de proventos do ativo na aba Carteira.
                    </p>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={()=>setConfirmDeleteProv(null)} style={{flex:1,padding:"9px",fontSize:13,fontWeight:500,borderRadius:8,border:"1px solid rgba(255,255,255,0.2)",background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.7)",cursor:"pointer"}}>Cancelar</button>
                      <button onClick={()=>excluirProvento(confirmDeleteProv)} style={{flex:1,padding:"9px",fontSize:13,fontWeight:500,borderRadius:8,border:"none",background:"rgba(248,113,113,0.5)",color:"#fff",cursor:"pointer"}}>
                        <i className="ti ti-trash" style={{fontSize:13,marginRight:4}}/>Excluir
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── PERFORMANCE ── */}
        {tab==="performance"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:12,marginBottom:"1rem"}}>
              <div style={glass}>
                <p style={{fontWeight:500,fontSize:13,margin:"0 0 10px",color:"rgba(255,255,255,0.8)"}}>Evolução patrimonial</p>
                <div style={{display:"flex",gap:16,marginBottom:10}}>
                  {[["Vitor","#60a5fa"],["Larissa","#f472b6"]].map(([n,c])=>(<span key={n} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"rgba(255,255,255,0.6)"}}><span style={{width:16,height:2,background:c,display:"inline-block",borderRadius:1}}></span>{n}</span>))}
                </div>
                <div style={{position:"relative",height:200}}><canvas ref={chartRef}/></div>
              </div>
              <div style={glass}>
                <p style={{fontWeight:500,fontSize:13,margin:"0 0 8px",color:"rgba(255,255,255,0.8)"}}>Alocação atual</p>
                <div style={{position:"relative",height:180}}><canvas ref={pieRef}/></div>
                <div style={{display:"flex",flexWrap:"wrap",gap:"6px 12px",marginTop:8}}>
                  {byClass.map(([cl,v])=>(<span key={cl} style={{fontSize:10,color:"rgba(255,255,255,0.6)",display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:2,background:COLORS[cl]||"#888",display:"inline-block"}}></span>{cl} {fmt(totalPatrim>0?v/totalPatrim*100:0,0)}%</span>))}
                </div>
              </div>
            </div>
            <p style={{fontWeight:500,fontSize:13,margin:"0 0 0.75rem",color:"rgba(255,255,255,0.8)"}}>Rentabilidade por classe</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:10,marginBottom:"1.25rem"}}>
              {byClass.map(([cl,val])=>{
                const cus=filtA.filter(a=>a.classe===cl).reduce((s,a)=>s+toCusto(a,usdBrl),0);
                const rent=cus>0?(val-cus)/cus*100:0;
                return(<div key={cl} style={{...glass,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><div style={{width:10,height:10,borderRadius:2,background:COLORS[cl]||"#888"}}></div><span style={{fontSize:12,fontWeight:500,color:"#fff"}}>{cl}</span></div><p style={{fontSize:11,color:"rgba(255,255,255,0.5)",margin:0}}>{fmtBRL(val)}</p></div><p style={{fontSize:16,fontWeight:500,margin:0,color:rent>=0?"#86efac":"#fca5a5"}}>{fmtPct(rent)}</p></div>);
              })}
            </div>

            {/* Lucro / Prejuízo mensal */}
            <div style={glass}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,flexWrap:"wrap",gap:8}}>
                <p style={{fontWeight:500,fontSize:13,margin:0,color:"rgba(255,255,255,0.8)"}}>Lucro / Prejuízo mensal</p>
                <p style={{fontSize:11,color:"rgba(255,255,255,0.4)",margin:0}}>
                  {investor==="Todos"?"Família consolidado":investor} · valoração - aportes líquidos
                </p>
              </div>
              {lucroMensal.length<2
                ?<p style={{fontSize:12,color:"rgba(255,255,255,0.4)",textAlign:"center",padding:"1rem"}}>Histórico ainda insuficiente — necessário ao menos 2 meses de dados.</p>
                :<>
                  <div style={{position:"relative",height:200}}><canvas ref={lucroChartRef}/></div>
                  {(()=>{
                    const acum=lucroMensal.reduce((s,l)=>s+(investor==="Vitor"?l.vitor:investor==="Larissa"?l.larissa:l.total),0);
                    const positivos=lucroMensal.filter(l=>(investor==="Vitor"?l.vitor:investor==="Larissa"?l.larissa:l.total)>0).length;
                    const negativos=lucroMensal.filter(l=>(investor==="Vitor"?l.vitor:investor==="Larissa"?l.larissa:l.total)<0).length;
                    return(
                      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginTop:12}}>
                        <div style={{background:"rgba(255,255,255,0.06)",borderRadius:8,padding:"8px 10px"}}><p style={{fontSize:10,color:"rgba(255,255,255,0.5)",margin:0}}>Acumulado</p><p style={{fontSize:15,fontWeight:500,margin:"2px 0 0",color:acum>=0?"#86efac":"#fca5a5"}}>{fmtBRL(acum)}</p></div>
                        <div style={{background:"rgba(255,255,255,0.06)",borderRadius:8,padding:"8px 10px"}}><p style={{fontSize:10,color:"rgba(255,255,255,0.5)",margin:0}}>Meses positivos</p><p style={{fontSize:15,fontWeight:500,margin:"2px 0 0",color:"#86efac"}}>{positivos}</p></div>
                        <div style={{background:"rgba(255,255,255,0.06)",borderRadius:8,padding:"8px 10px"}}><p style={{fontSize:10,color:"rgba(255,255,255,0.5)",margin:0}}>Meses negativos</p><p style={{fontSize:15,fontWeight:500,margin:"2px 0 0",color:"#fca5a5"}}>{negativos}</p></div>
                      </div>
                    );
                  })()}
                </>
              }
            </div>
          </div>
        )}

        {/* ── METAS ── */}
        {tab==="metas"&&(
          <div>
            <p style={{fontWeight:500,fontSize:13,margin:"0 0 1rem",color:"rgba(255,255,255,0.8)"}}>Metas de patrimônio e alocação</p>
            {["Vitor","Larissa"].map(inv=>{
              if(investor!=="Todos"&&investor!==inv)return null;
              const ats=assets.filter(a=>a.investidor===inv);
              const pat=ats.reduce((s,a)=>s+toVal(a,usdBrl,indicadores,fatoresAcum),0);
              const meta=goalsTotal[inv];
              const pct=Math.min(pat/meta*100,100);
              const goals=goalsClass[inv];
              const byC={};ats.forEach(a=>{if(!byC[a.classe])byC[a.classe]=0;byC[a.classe]+=toVal(a,usdBrl,indicadores,fatoresAcum);});
              const editando=editandoMeta===inv;
              return(
                <div key={inv} style={{...glass,marginBottom:12}}>
                  {/* Cabeçalho */}
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:32,height:32,borderRadius:"50%",background:inv==="Vitor"?"rgba(96,165,250,0.3)":"rgba(244,114,182,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:500,color:inv==="Vitor"?"#93c5fd":"#f9a8d4"}}>{inv[0]}</div>
                      <span style={{fontWeight:500,color:"#fff",fontSize:15}}>{inv}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{textAlign:"right"}}>
                        <p style={{fontSize:12,color:"rgba(255,255,255,0.5)",margin:0}}>Meta patrimonial</p>
                        {editando
                          ?<input type="number" defaultValue={meta} id={`meta-pat-${inv}`}
                              style={{marginTop:2,padding:"3px 8px",borderRadius:6,border:"1px solid rgba(255,255,255,0.25)",background:"rgba(255,255,255,0.1)",color:"#fff",fontSize:13,width:130,outline:"none"}}/>
                          :<p style={{fontSize:14,fontWeight:500,margin:"2px 0 0",color:"#fff"}}>{fmtBRL(meta)}</p>
                        }
                      </div>
                      <button onClick={()=>{
                        if(editando){
                          const novoVal=parseFloat(document.getElementById(`meta-pat-${inv}`)?.value||meta);
                          if(!isNaN(novoVal)&&novoVal>0) setGoalsTotal(p=>({...p,[inv]:novoVal}));
                          setEditandoMeta(null);
                        } else setEditandoMeta(inv);
                      }} style={{padding:"5px 10px",fontSize:11,borderRadius:8,border:"1px solid rgba(255,255,255,0.2)",background:editando?"rgba(134,239,172,0.2)":"rgba(255,255,255,0.08)",color:editando?"#86efac":"rgba(255,255,255,0.65)",cursor:"pointer"}}>
                        <i className={`ti ${editando?"ti-check":"ti-pencil"}`} style={{fontSize:12,marginRight:3}}/>{editando?"Salvar":"Editar metas"}
                      </button>
                    </div>
                  </div>

                  {/* Barra de progresso */}
                  <div style={{marginBottom:6}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:11,color:"rgba(255,255,255,0.5)"}}>Patrimônio atual: {fmtBRL(pat)}</span>
                      <span style={{fontSize:11,color:"rgba(255,255,255,0.5)"}}>{fmt(pct,0)}% da meta</span>
                    </div>
                    <div style={{height:8,background:"rgba(255,255,255,0.1)",borderRadius:4,marginBottom:16}}>
                      <div style={{height:8,borderRadius:4,background:inv==="Vitor"?"#60a5fa":"#f472b6",width:pct+"%",transition:"width .5s"}}></div>
                    </div>
                  </div>

                  {/* Alocação por classe */}
                  <p style={{fontSize:11,color:"rgba(255,255,255,0.5)",margin:"0 0 10px"}}>Alocação atual vs. meta {editando&&<span style={{color:"#fbbf24"}}>— editando metas (%)</span>}</p>
                  {CLASSES.map(cl=>{
                    const goalPct=goals[cl]||0;
                    const atual=pat>0?((byC[cl]||0)/pat*100):0;
                    const diff=atual-goalPct;
                    const totalMeta=Object.values(goals).reduce((s,v)=>s+v,0);
                    return(
                      <div key={cl} style={{marginBottom:editando?12:8}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:2,alignItems:"center"}}>
                          <span style={{fontSize:11,color:"rgba(255,255,255,0.6)",display:"flex",alignItems:"center",gap:5}}>
                            <span style={{width:7,height:7,borderRadius:1,background:COLORS[cl]||"#888",display:"inline-block"}}></span>{cl}
                          </span>
                          {editando
                            ?<div style={{display:"flex",alignItems:"center",gap:6}}>
                              <span style={{fontSize:11,color:"rgba(255,255,255,0.45)"}}>{fmt(atual,0)}% atual</span>
                              <input type="number" min={0} max={100} defaultValue={goalPct} id={`meta-${inv}-${cl}`}
                                style={{width:60,padding:"2px 6px",borderRadius:6,border:"1px solid rgba(255,255,255,0.25)",background:"rgba(255,255,255,0.1)",color:"#fbbf24",fontSize:12,outline:"none",textAlign:"right"}}
                                onChange={e=>{
                                  const novo=parseFloat(e.target.value)||0;
                                  setGoalsClass(p=>({...p,[inv]:{...p[inv],[cl]:novo}}));
                                }}/>
                              <span style={{fontSize:11,color:"rgba(255,255,255,0.45)"}}>%</span>
                            </div>
                            :<span style={{fontSize:11,color:Math.abs(diff)<3?"#86efac":diff>0?"#fbbf24":"#fca5a5"}}>
                              {fmt(atual,0)}% <span style={{color:"rgba(255,255,255,0.35)"}}>/ meta {goalPct}%</span>
                            </span>
                          }
                        </div>
                        <div style={{height:4,background:"rgba(255,255,255,0.08)",borderRadius:2,position:"relative"}}>
                          <div style={{height:4,borderRadius:2,background:COLORS[cl]||"#888",width:Math.min(atual,100)+"%",opacity:0.85}}></div>
                          {goalPct>0&&<div style={{position:"absolute",top:-1,left:Math.min(goalPct,100)+"%",width:2,height:6,background:"rgba(255,255,255,0.5)",borderRadius:1}}></div>}
                        </div>
                      </div>
                    );
                  })}
                  {editando&&(()=>{
                    const total=Object.values(goalsClass[inv]).reduce((s,v)=>s+v,0);
                    return <p style={{fontSize:11,marginTop:8,color:Math.abs(total-100)<0.1?"#86efac":"#fbbf24",textAlign:"right"}}>Total das metas: {fmt(total,0)}% {Math.abs(total-100)<0.1?"✓":"(ideal: 100%)"}</p>;
                  })()}
                </div>
              );
            })}
          </div>
        )}

        {/* ── API LOG ── */}
        {tab==="apilog"&&(
          <div>
            <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:"1rem",flexWrap:"wrap"}}>
              <p style={{fontWeight:500,margin:0,color:"#fff"}}>Status das integrações</p>
              <button onClick={atualizarTudo} style={{padding:"5px 12px",fontSize:12,borderRadius:8,border:"1px solid rgba(255,255,255,0.2)",background:"rgba(96,165,250,0.2)",color:"#93c5fd"}}>
                <i className="ti ti-refresh" style={{fontSize:12,marginRight:4}}/>Atualizar agora
              </button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10,marginBottom:"1rem"}}>
              {[{label:"Cotações B3/EUA",k:"cotacoes"},{label:"Câmbio USD/BRL",k:"cambio"},{label:"Indicadores BCB",k:"indicadores"}].map(({label,k})=>(
                <div key={k} style={card}>
                  <p style={{fontSize:11,color:"rgba(255,255,255,0.5)",margin:"0 0 6px"}}>{label}</p>
                  <StatusBadge status={apiStatus[k]==="ok"?"ok":apiStatus[k]==="loading"?"loading":apiStatus[k]==="error"?"error":"warn"} msg={apiStatus[k]==="ok"?"Online":apiStatus[k]==="loading"?"Buscando...":apiStatus[k]==="error"?"Erro":"Aguardando"}/>
                </div>
              ))}
              <div style={card}><p style={{fontSize:11,color:"rgba(255,255,255,0.5)",margin:"0 0 6px"}}>Backend</p><StatusBadge status="ok" msg="Online · Render"/></div>
            </div>
            {indicadores&&(
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
              {apiLog.length===0&&<p style={{fontSize:12,color:"rgba(255,255,255,0.4)",margin:0}}>Nenhum evento ainda.</p>}
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
