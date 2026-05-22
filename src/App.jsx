import { useState, useEffect, useRef } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { KairosLogin } from "./KairosLogin";
import { HeroLanding } from "./HeroLanding";
import { AnalyticsExplorer } from "./AnalyticsExplorer";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const INSTRUMENTS = [
  { id: "inst-001", name: "Controlador Forno 01", model: "CT-100", serial: "CT100-2024-001", type: "Controlador", status: "online",  address: 1 },
  { id: "inst-002", name: "Transmissor Temp 02",  model: "TT-200", serial: "TT200-2024-002", type: "Transmissor", status: "online",  address: 2 },
  { id: "inst-003", name: "Indicador Pressão 03", model: "IP-300", serial: "IP300-2024-003", type: "Indicador",   status: "warning", address: 3 },
  { id: "inst-004", name: "Registrador Fluxo 04", model: "RF-400", serial: "RF400-2024-004", type: "Registrador", status: "offline", address: 4 },
];

const PARAMS = {
  "inst-001": [
    { key: "SP",   label: "Setpoint",          value: 180, unit: "°C", min: 0,    max: 400,  readOnly: false, category: "process" },
    { key: "PV",   label: "Variável de Proc.",  value: 174, unit: "°C", min: 0,    max: 400,  readOnly: true,  category: "process" },
    { key: "OUT",  label: "Saída de Controle",  value: 62,  unit: "%",  min: 0,    max: 100,  readOnly: true,  category: "process" },
    { key: "P",    label: "Banda Proporcional", value: 10,  unit: "%",  min: 1,    max: 999,  readOnly: false, category: "config"  },
    { key: "I",    label: "Tempo Integral",     value: 120, unit: "s",  min: 0,    max: 3600, readOnly: false, category: "config"  },
    { key: "D",    label: "Tempo Derivativo",   value: 15,  unit: "s",  min: 0,    max: 999,  readOnly: false, category: "config"  },
    { key: "ALHI", label: "Alarme Alto",        value: 200, unit: "°C", min: 0,    max: 400,  readOnly: false, category: "alarm"   },
    { key: "ALLO", label: "Alarme Baixo",       value: 50,  unit: "°C", min: 0,    max: 400,  readOnly: false, category: "alarm"   },
  ],
  "inst-002": [
    { key: "PV",   label: "Temperatura", value: 23,  unit: "°C", min: -30, max: 100, readOnly: true,  category: "process"     },
    { key: "SPAN", label: "Span",        value: 100, unit: "°C", min: 1,   max: 200, readOnly: false, category: "calibration" },
    { key: "ZERO", label: "Zero",        value: -30, unit: "°C", min: -50, max: 0,   readOnly: false, category: "calibration" },
  ],
  "inst-003": [
    { key: "PV",   label: "Pressão",    value: 4.2, unit: "bar", min: 0, max: 10, readOnly: true,  category: "process" },
    { key: "ALHI", label: "Alarme Alto",value: 8,   unit: "bar", min: 0, max: 10, readOnly: false, category: "alarm"   },
  ],
  "inst-004": [
    { key: "PV", label: "Fluxo", value: 0, unit: "m³/h", min: 0, max: 500, readOnly: true, category: "process" },
  ],
};

const CALIB_POINTS = [
  { input: 0,   output: 0.2,  expected: 0,   error: 0.2  },
  { input: 25,  output: 24.8, expected: 25,  error: -0.2 },
  { input: 50,  output: 50.1, expected: 50,  error: 0.1  },
  { input: 75,  output: 74.7, expected: 75,  error: -0.3 },
  { input: 100, output: 99.9, expected: 100, error: -0.1 },
];

const TEMPLATES = [
  { id: "t1", name: "Controlador PID Padrão", type: "Controlador", params: 8, updatedAt: "12/05/2025", isDefault: true  },
  { id: "t2", name: "Transmissor 4-20mA",     type: "Transmissor", params: 5, updatedAt: "03/04/2025", isDefault: false },
  { id: "t3", name: "Indicador Modbus RTU",   type: "Indicador",   params: 6, updatedAt: "22/03/2025", isDefault: false },
];

const EVENTS_INIT = [
  { id: 1, ts: "08:14:22", level: "info",    msg: "Instrumento inst-001 conectado com sucesso." },
  { id: 2, ts: "08:14:25", level: "info",    msg: "Leitura de parâmetros concluída — CT-100." },
  { id: 3, ts: "08:15:01", level: "warning", msg: "Alarme Alto ativo — Indicador Pressão 03 (4.2 bar)." },
  { id: 4, ts: "08:16:44", level: "error",   msg: "Instrumento inst-004 sem resposta (timeout)." },
  { id: 5, ts: "08:17:10", level: "info",    msg: "Registrador de dados iniciado." },
];

function generateHistory(baseValue, points = 60, noise = 5) {
  const now = Date.now();
  return Array.from({ length: points }, (_, i) => ({
    time: new Date(now - (points - i) * 5000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    PV: +(baseValue + (Math.random() - 0.5) * noise * 2).toFixed(1),
    SP: baseValue,
  }));
}

// ─── TOKENS ──────────────────────────────────────────────────────────────────
const STATUS_COLOR = {
  online:  { bg: "rgba(0, 255, 157, 0.1)", text: "#00ff9d", dot: "#00ff9d" },
  offline: { bg: "rgba(255, 255, 255, 0.05)", text: "#888888", dot: "#888888" },
  warning: { bg: "rgba(255, 229, 0, 0.1)", text: "#ffe500", dot: "#ffe500" },
  error:   { bg: "rgba(239, 68, 68, 0.1)", text: "#ef4444", dot: "#ef4444" },
};
const EVENT_COLOR = {
  info:    { border: "rgba(0, 229, 255, 0.3)", bg: "rgba(0, 229, 255, 0.05)", text: "#00e5ff" },
  warning: { border: "rgba(255, 229, 0, 0.3)", bg: "rgba(255, 229, 0, 0.05)", text: "#ffe500" },
  error:   { border: "rgba(239, 68, 68, 0.3)", bg: "rgba(239, 68, 68, 0.05)", text: "#ef4444" },
};

// ─── HOOKS ───────────────────────────────────────────────────────────────────
function useIsMobile() {
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
}

// ─── ATOMS ───────────────────────────────────────────────────────────────────
function StatusDot({ status }) {
  const c = STATUS_COLOR[status];
  return (
    <span style={{
      display: "inline-block", width: 8, height: 8, borderRadius: "50%",
      background: c.dot, marginRight: 5, flexShrink: 0,
      boxShadow: status === "online" ? `0 0 0 2px ${c.dot}33` : "none",
    }} />
  );
}

function Badge({ status }) {
  const c = STATUS_COLOR[status];
  return (
    <span style={{ background: c.bg, color: c.text, padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600 }}>
      {status.toUpperCase()}
    </span>
  );
}

// ─── GAUGE ───────────────────────────────────────────────────────────────────
function GaugeMeter({ value, min, max, unit, label, size = 120 }) {
  const pct = Math.min(Math.max((value - min) / (max - min), 0), 1);
  const angle = -150 + pct * 300;
  const cx = size / 2, cy = size / 2, r = size * 0.38;
  const toXY = (deg, rad) => ({
    x: cx + rad * Math.cos((deg - 90) * Math.PI / 180),
    y: cy + rad * Math.sin((deg - 90) * Math.PI / 180),
  });
  const arcPath = (s, e, rad) => {
    const a = toXY(s, rad), b = toXY(e, rad);
    return `M ${a.x} ${a.y} A ${rad} ${rad} 0 ${e - s > 180 ? 1 : 0} 1 ${b.x} ${b.y}`;
  };
  const tip = toXY(angle, r * 0.82);
  const b1  = toXY(angle + 90, 4);
  const b2  = toXY(angle - 90, 4);
  const ticks = Array.from({ length: 11 }, (_, i) => ({
    outer: toXY(-150 + i * 30, r),
    inner: toXY(-150 + i * 30, r * 0.82),
    major: i % 5 === 0,
  }));
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <svg width={size} height={size} style={{ overflow: "visible" }}>
        <circle cx={cx} cy={cy} r={r + 6} fill="#1a1a1a" />
        <circle cx={cx} cy={cy} r={r + 4} fill="#2a2a2a" />
        <path d={arcPath(-150, 150, r)} stroke="#333" strokeWidth={6} fill="none" />
        <path d={arcPath(-150, -150 + pct * 300, r)} stroke="#00ff9d" strokeWidth={6} fill="none" strokeLinecap="round" />
        {ticks.map((t, i) => (
          <line key={i} x1={t.outer.x} y1={t.outer.y} x2={t.inner.x} y2={t.inner.y} stroke="#888" strokeWidth={t.major ? 2 : 1} />
        ))}
        <polygon points={`${tip.x},${tip.y} ${b1.x},${b1.y} ${b2.x},${b2.y}`} fill="#00ff9d" />
        <circle cx={cx} cy={cy} r={5} fill="#ccc" />
        <text x={cx} y={cy + r * 0.45} textAnchor="middle" fontSize={size * 0.14} fontWeight="bold" fill="#fff">{value}</text>
        <text x={cx} y={cy + r * 0.62} textAnchor="middle" fontSize={size * 0.10} fill="#888">{unit}</text>
      </svg>
      <span style={{ fontSize: 11, color: "#888", fontFamily: "monospace" }}>{label}</span>
    </div>
  );
}

// ─── THERMOMETER ─────────────────────────────────────────────────────────────
function Thermometer({ value, min, max }) {
  const pct = Math.min(Math.max((value - min) / (max - min), 0), 1);
  return (
    <div style={{ padding: "12px 16px", background: "rgba(255, 255, 255, 0.02)", borderRadius: 4, border: "1px solid rgba(255, 255, 255, 0.08)" }}>
      <div style={{ fontSize: 10, color: "#888", marginBottom: 4, display: "flex", justifyContent: "space-between", fontFamily: "monospace" }}>
        <span>{min}°</span><span>{max}°</span>
      </div>
      <div style={{ position: "relative", height: 24, background: "linear-gradient(to right,#1565c0,#00e5ff,#00ff9d,#ffe500,#ef4444)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: 0, bottom: 0, left: `${pct * 100}%`,
          width: 4, background: "#fff", borderRadius: 2,
          boxShadow: "0 0 6px rgba(0,0,0,0.5)", transform: "translateX(-50%)",
        }} />
      </div>
      <div style={{ marginTop: 6, textAlign: "center", fontWeight: "bold", fontSize: 14, color: "#00ff9d", fontFamily: "monospace" }}>{value} °C</div>
    </div>
  );
}

// ─── DRAWER (mobile sidebar) ─────────────────────────────────────────────────
function Drawer({ open, onClose, title, children }) {
  return (
    <>
      {open && (
        <div onClick={onClose} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 40,
          backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)"
        }} />
      )}
      <div style={{
        position: "fixed", top: 0, left: 0, bottom: 0, width: 260,
        background: "#0c0c0e", borderRight: "1px solid rgba(255, 255, 255, 0.08)", zIndex: 50,
        boxShadow: "4px 0 24px rgba(0,0,0,.5)",
        transform: open ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.25s ease", display: "flex", flexDirection: "column",
      }}>
        <div style={{ background: "rgba(255, 255, 255, 0.02)", color: "#fff", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: 1, color: "#00ff9d" }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#888", fontSize: 18, cursor: "pointer", lineHeight: 1 }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", background: "#0c0c0e" }}>{children}</div>
      </div>
    </>
  );
}

// ─── INSTRUMENT LIST ITEM ────────────────────────────────────────────────────
function InstItem({ inst, selected, onClick }) {
  return (
    <div onClick={onClick} style={{
      padding: "10px 12px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.05)",
      background: selected ? "rgba(0, 255, 157, 0.05)" : "transparent",
      borderLeft: selected ? "3px solid #00ff9d" : "3px solid transparent",
      transition: "all 0.15s",
    }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 2 }}>
        <StatusDot status={inst.status} />
        <span style={{ fontSize: 12, fontWeight: 600, color: selected ? "#00ff9d" : "#ffffff" }}>{inst.name}</span>
      </div>
      <div style={{ fontSize: 10, color: selected ? "rgba(0, 255, 157, 0.6)" : "#888", paddingLeft: 13 }}>{inst.model} · {inst.type}</div>
    </div>
  );
}

// ─── SECTION HEADER ──────────────────────────────────────────────────────────
function SectionHeader({ title, onMenuClick, isMobile }) {
  return (
    <div style={{ padding: "8px 12px", fontSize: 11, color: "#888", fontWeight: 600, textTransform: "uppercase", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span>{title}</span>
      {isMobile && onMenuClick && (
        <button onClick={onMenuClick} style={{ background: "rgba(0, 255, 157, 0.1)", color: "#00ff9d", border: "1px solid rgba(0, 255, 157, 0.3)", borderRadius: 3, padding: "3px 8px", fontSize: 10, cursor: "pointer", fontWeight: "bold" }}>
          ☰ Trocar
        </button>
      )}
    </div>
  );
}

// ─── TOOLBAR ─────────────────────────────────────────────────────────────────
function Toolbar({ recording, onToggleRecord, isMobile, onMenuOpen }) {
  return (
    <div style={{ background: "#0c0c0e", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", alignItems: "stretch", height: 44, userSelect: "none", flexShrink: 0 }}>
      {isMobile && (
        <button onClick={onMenuOpen} style={{ background: "none", border: "none", borderRight: "1px solid rgba(255, 255, 255, 0.08)", padding: "0 14px", cursor: "pointer", fontSize: 18, color: "#00ff9d" }}>
          ☰
        </button>
      )}
      <div style={{ color: "#fff", padding: "0 14px", display: "flex", alignItems: "center", fontWeight: "bold", fontSize: isMobile ? 11 : 13, letterSpacing: 1.5 }}>
        KairOS <span style={{ color: "#00ff9d", marginLeft: 4 }}>CONNECT</span>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", alignItems: "center", padding: "0 12px" }}>
        <button onClick={onToggleRecord} style={{
          background: recording ? "rgba(239, 68, 68, 0.15)" : "rgba(255, 255, 255, 0.05)",
          color: recording ? "#ef4444" : "#ccc",
          border: `1px solid ${recording ? "#ef4444" : "rgba(255, 255, 255, 0.15)"}`,
          borderRadius: 3, padding: "4px 12px",
          fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
          boxShadow: recording ? "0 0 8px rgba(239, 68, 68, 0.2)" : "none"
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: recording ? "#ef4444" : "#888", display: "inline-block" }} />
          {recording ? "GRAVANDO" : "INICIAR REC"}
        </button>
      </div>
    </div>
  );
}

// ─── BOTTOM NAV (mobile) ─────────────────────────────────────────────────────
const NAV_TABS = [
  { id: "dashboard",     icon: "⊞", label: "Dashboard"  },
  { id: "instruments",   icon: "⚙", label: "Instrum."   },
  { id: "configuration", icon: "✎", label: "Config."    },
  { id: "calibration",   icon: "◎", label: "Calibração" },
  { id: "templates",     icon: "☰", label: "Templates"  },
  { id: "datalog",       icon: "▶", label: "Registro"   },
  { id: "reports",       icon: "📊", label: "Relatórios" },
];

function BottomNav({ activeTab, onTab }) {
  const scrollRef = useRef(null);
  return (
    <div ref={scrollRef} style={{
      display: "flex", overflowX: "auto", background: "#0c0c0e",
      borderTop: "1px solid rgba(255, 255, 255, 0.08)", flexShrink: 0,
      scrollbarWidth: "none", WebkitOverflowScrolling: "touch",
    }}>
      {NAV_TABS.map(t => {
        const isActive = activeTab === t.id;
        return (
          <button key={t.id} onClick={() => onTab(t.id)} style={{
            flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center",
            gap: 2, padding: "8px 14px", border: "none", cursor: "pointer",
            background: isActive ? "rgba(0, 255, 157, 0.05)" : "transparent",
            borderTop: isActive ? "2px solid #00ff9d" : "2px solid transparent",
            color: isActive ? "#00ff9d" : "#888",
            fontSize: 9, fontWeight: isActive ? 700 : 400,
            minWidth: 70, transition: "all 0.15s",
            textTransform: "uppercase",
            letterSpacing: 0.5
          }}>
            <span style={{ fontSize: 14 }}>{t.icon}</span>
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── STATUS BAR ──────────────────────────────────────────────────────────────
function StatusBar({ instruments }) {
  const online  = instruments.filter(i => i.status === "online").length;
  const warning = instruments.filter(i => i.status === "warning").length;
  const offline = instruments.filter(i => i.status === "offline").length;
  const now = new Date().toLocaleString("pt-BR");
  return (
    <div style={{ background: "#060608", color: "#888", borderTop: "1px solid rgba(255, 255, 255, 0.05)", height: 22, display: "flex", alignItems: "center", padding: "0 12px", fontSize: 9, gap: 12, justifyContent: "space-between", flexShrink: 0, fontFamily: "monospace" }}>
      <div style={{ display: "flex", gap: 12 }}>
        <span>SYS STATUS: <span style={{ color: "#00ff9d", fontWeight: "bold" }}>OPERACIONAL</span></span>
        <span style={{ color: "#00ff9d" }}>● {online} ON</span>
        <span style={{ color: "#ffe500" }}>▲ {warning} WARN</span>
        <span style={{ color: "#ef4444" }}>✖ {offline} OFF</span>
      </div>
      <span>{now}</span>
    </div>
  );
}

// ─── PAGES ───────────────────────────────────────────────────────────────────
function Dashboard({ instruments, params, chartData, selectedId, onSelect, isMobile, simulationMode, onSimulationModeChange }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const inst   = instruments.find(i => i.id === selectedId) || instruments[0];
  const instParams = params[inst.id] || [];
  const pvParam = instParams.find(p => p.key === "PV");

  const instList = (
    <>
      <SectionHeader title="Instrumentos" isMobile={isMobile} onMenuClick={() => setDrawerOpen(true)} />
      {instruments.map(i => (
        <InstItem key={i.id} inst={i} selected={selectedId === i.id} onClick={() => { onSelect(i.id); setDrawerOpen(false); }} />
      ))}
    </>
  );

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {!isMobile && (
        <div style={{ width: 210, borderRight: "1px solid rgba(255, 255, 255, 0.08)", overflowY: "auto", flexShrink: 0 }}>
          {instList}
        </div>
      )}

      {isMobile && (
        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Instrumentos">
          {instList}
        </Drawer>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        {isMobile && (
          <div style={{ padding: "6px 10px", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setDrawerOpen(true)} style={{ background: "rgba(0, 255, 157, 0.1)", color: "#00ff9d", border: "1px solid rgba(0, 255, 157, 0.3)", borderRadius: 3, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>☰</button>
            <div style={{ display: "flex", alignItems: "center", overflow: "hidden" }}>
              <StatusDot status={inst.status} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{inst.name}</span>
            </div>
            {pvParam && (
              <span style={{ marginLeft: "auto", fontWeight: 700, color: "#00ff9d", fontSize: 14, whiteSpace: "nowrap" }}>{pvParam.value} {pvParam.unit}</span>
            )}
          </div>
        )}

        <div style={{ flex: 1, padding: isMobile ? "8px 8px 0" : "12px 16px 0", display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8, flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: 13, color: "#fff", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {inst.name} — Monitoramento
              </div>
              <div style={{ fontSize: 9, color: "#888", fontFamily: "monospace" }}>
                ID: {inst.id} · PROTOCOLO: MODBUS RTU · STATUS: <span style={{ color: STATUS_COLOR[inst.status].text }}>{inst.status.toUpperCase()}</span>
              </div>
            </div>
            
            {/* Controlador de Simulação */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255, 255, 255, 0.02)", padding: "4px 8px", borderRadius: 4, border: "1px solid rgba(255, 255, 255, 0.06)" }}>
              <span style={{ fontSize: 9, color: "#888", textTransform: "uppercase", fontFamily: "monospace", marginRight: 4 }}>Simulação:</span>
              {["normal", "noisy", "alarm", "offline"].map(mode => {
                const isActive = simulationMode === mode;
                let modeColor = "#888";
                let modeLabel = mode.toUpperCase();
                if (mode === "normal") { modeColor = "#00ff9d"; modeLabel = "NORMAL"; }
                if (mode === "noisy") { modeColor = "#00e5ff"; modeLabel = "RUIDOSO"; }
                if (mode === "alarm") { modeColor = "#ef4444"; modeLabel = "FALHA"; }
                if (mode === "offline") { modeColor = "#ffb300"; modeLabel = "OFFLINE"; }
                
                return (
                  <button
                    key={mode}
                    onClick={() => onSimulationModeChange(mode)}
                    style={{
                      background: isActive ? `${modeColor}1a` : "transparent",
                      border: `1px solid ${isActive ? modeColor : "rgba(255,255,255,0.1)"}`,
                      borderRadius: 3,
                      color: isActive ? modeColor : "#888",
                      fontSize: 9,
                      fontWeight: isActive ? 700 : 400,
                      padding: "3px 6px",
                      cursor: "pointer",
                      fontFamily: "monospace",
                      transition: "all 0.15s",
                      boxShadow: isActive ? `0 0 6px ${modeColor}22` : "none"
                    }}
                  >
                    {modeLabel}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <LineChart data={chartData[inst.id] || []} margin={{ top: 5, right: 10, bottom: 5, left: isMobile ? -20 : 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#888" }} interval={isMobile ? 14 : 9} />
                <YAxis tick={{ fontSize: 9, fill: "#888" }} />
                <Tooltip contentStyle={{ background: "#0c0c0e", border: "1px solid rgba(255,255,255,0.15)", fontSize: 10, color: "#fff" }} />
                <Legend wrapperStyle={{ fontSize: 10, color: "#ccc" }} />
                <Line type="monotone" dataKey="PV" stroke="#00ff9d" strokeWidth={2.5} dot={false} name="PV" />
                <Line type="monotone" dataKey="SP" stroke="#00e5ff" strokeWidth={1.5} dot={false} strokeDasharray="5 3" name="SP" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {isMobile && (
          <div style={{ padding: "8px 10px", borderTop: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", gap: 8, overflowX: "auto" }}>
            {instParams.slice(0, 6).map(p => (
              <div key={p.key} style={{ flexShrink: 0, textAlign: "center", minWidth: 56, background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.06)", borderRadius: 4, padding: "4px 8px" }}>
                <div style={{ fontSize: 8, color: "#888", fontFamily: "monospace" }}>{p.key}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#00ff9d", fontFamily: "monospace" }}>{p.value}</div>
                <div style={{ fontSize: 8, color: "#666", fontFamily: "monospace" }}>{p.unit}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!isMobile && (
        <div style={{ width: 190, borderLeft: "1px solid rgba(255, 255, 255, 0.08)", padding: 12, overflowY: "auto", flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: "#00ff9d", fontWeight: 600, textTransform: "uppercase", marginBottom: 12, letterSpacing: 0.5 }}>Medidores</div>
          {pvParam && (
            <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
              <GaugeMeter value={pvParam.value} min={pvParam.min ?? 0} max={pvParam.max ?? 100} unit={pvParam.unit ?? ""} label="PV" size={130} />
            </div>
          )}
          <div style={{ fontSize: 10, color: "#00ff9d", fontWeight: 600, textTransform: "uppercase", marginBottom: 8, letterSpacing: 0.5 }}>Parâmetros</div>
          {instParams.slice(0, 5).map(p => (
            <div key={p.key} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 11 }}>
              <span style={{ color: "#888", fontFamily: "monospace" }}>{p.key}</span>
              <span style={{ fontWeight: 600, color: "#fff", fontFamily: "monospace" }}>{p.value} {p.unit}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InstrumentsPage({ instruments, params, isMobile }) {
  if (isMobile) {
    return (
      <div style={{ padding: 12, overflowY: "auto", height: "100%" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#00ff9d", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Instrumentos Conectados</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {instruments.map(inst => {
            const pv = (params[inst.id] || []).find(p => p.key === "PV");
            return (
              <div key={inst.id} style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 4, padding: 12, borderLeft: `4px solid ${STATUS_COLOR[inst.status].dot}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#fff" }}>{inst.name}</div>
                    <div style={{ fontSize: 10, color: "#888", marginTop: 2, fontFamily: "monospace" }}>{inst.model} · {inst.serial}</div>
                  </div>
                  <Badge status={inst.status} />
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 10, fontFamily: "monospace" }}>
                  <div style={{ fontSize: 10 }}><span style={{ color: "#666" }}>Tipo: </span><span style={{ color: "#fff" }}>{inst.type}</span></div>
                  <div style={{ fontSize: 10 }}><span style={{ color: "#666" }}>End.: </span><span style={{ color: "#fff" }}>{inst.address}</span></div>
                  <div style={{ fontSize: 10 }}><span style={{ color: "#666" }}>FW: </span><span style={{ color: "#fff" }}>2.4.1</span></div>
                  {pv && <div style={{ fontSize: 10, fontWeight: 700, color: "#00ff9d" }}>{pv.value} {pv.unit}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return (
    <div style={{ padding: 16, overflowY: "auto", height: "100%" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#00ff9d", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Instrumentos Conectados</div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, minWidth: 700, fontFamily: "monospace" }}>
          <thead>
            <tr style={{ background: "rgba(0, 255, 157, 0.05)", color: "#00ff9d", borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
              {["ID", "Nome", "Modelo", "Nº Série", "Tipo", "Protocolo", "End.", "FW", "Status"].map(h => (
                <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {instruments.map((inst, idx) => {
              const pv = (params[inst.id] || []).find(p => p.key === "PV");
              return (
                <tr key={inst.id} style={{ background: idx % 2 === 0 ? "rgba(255, 255, 255, 0.01)" : "transparent", borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  <td style={{ padding: "8px 10px", color: "#666" }}>{inst.address.toString().padStart(3, "0")}</td>
                  <td style={{ padding: "8px 10px", fontWeight: 600, color: "#fff" }}>{inst.name}</td>
                  <td style={{ padding: "8px 10px", color: "#ccc" }}>{inst.model}</td>
                  <td style={{ padding: "8px 10px", color: "#aaa" }}>{inst.serial}</td>
                  <td style={{ padding: "8px 10px", color: "#ccc" }}>{inst.type}</td>
                  <td style={{ padding: "8px 10px", color: "#888" }}>Simulado</td>
                  <td style={{ padding: "8px 10px", textAlign: "center", color: "#fff" }}>{inst.address}</td>
                  <td style={{ padding: "8px 10px", color: "#888" }}>2.4.1</td>
                  <td style={{ padding: "8px 10px" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <Badge status={inst.status} />
                      {pv && <span style={{ color: "#00ff9d", fontWeight: "bold" }}>({pv.value} {pv.unit})</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ConfigurationPage({ instruments, params, onChangeParams, isMobile }) {
  const [selectedId, setSelectedId]         = useState(instruments[0].id);
  const [localParams, setLocalParams]       = useState(() => JSON.parse(JSON.stringify(params)));
  const [saved, setSaved]                   = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [drawerOpen, setDrawerOpen]         = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLocalParams(prev => {
        const next = { ...prev };
        Object.keys(params).forEach(instId => {
          if (!next[instId]) {
            next[instId] = JSON.parse(JSON.stringify(params[instId]));
            return;
          }
          next[instId] = next[instId].map(p => {
            if (p.readOnly) {
              const parentP = params[instId]?.find(x => x.key === p.key);
              return { ...p, value: parentP ? parentP.value : p.value };
            }
            return p;
          });
        });
        return next;
      });
    }, 0);
    return () => clearTimeout(timer);
  }, [params]);

  const inst       = instruments.find(i => i.id === selectedId);
  const instParams = localParams[selectedId] || [];
  const categories = ["all", ...new Set(instParams.map(p => p.category))];

  useEffect(() => { setActiveCategory("all"); }, [selectedId]);

  const filtered   = activeCategory === "all" ? instParams : instParams.filter(p => p.category === activeCategory);
  const catLabel   = { all: "Todos", process: "Processo", config: "Config.", calibration: "Calibração", alarm: "Alarmes" };

  const handleChange = (key, val) => {
    setLocalParams(prev => ({
      ...prev,
      [selectedId]: prev[selectedId].map(p => p.key === key ? { ...p, value: Number(val) } : p)
    }));
  };

  const handleSave = () => {
    onChangeParams(localParams);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sidebar = (
    <>
      <SectionHeader title="Instrumento" isMobile={false} />
      {instruments.map(i => (
        <InstItem key={i.id} inst={i} selected={selectedId === i.id} onClick={() => { setSelectedId(i.id); setDrawerOpen(false); }} />
      ))}
    </>
  );

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {!isMobile && <div style={{ width: 200, borderRight: "1px solid rgba(255, 255, 255, 0.08)", overflowY: "auto", flexShrink: 0 }}>{sidebar}</div>}
      {isMobile && <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Selecionar Instrumento">{sidebar}</Drawer>}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "8px 12px", background: "rgba(255, 255, 255, 0.02)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {isMobile && (
            <button onClick={() => setDrawerOpen(true)} style={{ background: "rgba(0, 255, 157, 0.1)", color: "#00ff9d", border: "1px solid rgba(0, 255, 157, 0.3)", borderRadius: 3, padding: "4px 8px", fontSize: 10, cursor: "pointer" }}>☰</button>
          )}
          <span style={{ fontSize: isMobile ? 11 : 12, fontWeight: 600, color: "#fff", flex: 1, minWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {isMobile ? inst?.model : inst?.name} — Parâmetros
          </span>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {categories.map(c => (
              <button key={c} onClick={() => setActiveCategory(c)} style={{
                border: activeCategory === c ? "1px solid #00ff9d" : "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: 3, padding: "3px 8px", fontSize: 10,
                background: activeCategory === c ? "rgba(0, 255, 157, 0.1)" : "transparent",
                color: activeCategory === c ? "#00ff9d" : "#888", cursor: "pointer",
                fontFamily: "monospace", transition: "all 0.15s"
              }}>{catLabel[c] || c}</button>
            ))}
          </div>
          <button onClick={handleSave} style={{
            background: saved ? "rgba(76, 175, 80, 0.15)" : "rgba(0, 255, 157, 0.1)",
            color: saved ? "#4caf50" : "#00ff9d",
            border: `1px solid ${saved ? "#4caf50" : "rgba(0, 255, 157, 0.3)"}`,
            borderRadius: 3, padding: "4px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer",
            transition: "all 0.15s"
          }}>
            {saved ? "✓ SALVO" : "SALVAR"}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? 8 : 16 }}>
          {isMobile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filtered.map(p => (
                <div key={p.key} style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 6, padding: "10px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 13, color: "#fff" }}>{p.key}</span>
                      <span style={{ fontSize: 10, color: "#888", marginLeft: 8 }}>{p.label}</span>
                    </div>
                    <span style={{ fontSize: 10, background: "rgba(255, 255, 255, 0.05)", color: "#aaa", padding: "1px 5px", borderRadius: 3, fontFamily: "monospace" }}>{p.category.toUpperCase()}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                    <div style={{ fontSize: 11, color: "#666", fontFamily: "monospace" }}>{p.min ?? "—"} ~ {p.max ?? "—"} {p.unit}</div>
                    {p.readOnly ? (
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#00ff9d", fontFamily: "monospace" }}>{p.value} {p.unit}</span>
                    ) : (
                      <input type="number" value={p.value} min={p.min} max={p.max}
                        id={`param-${p.key}`}
                        name={p.key}
                        aria-label={p.label || p.key}
                        onChange={e => handleChange(p.key, e.target.value)}
                        style={{ width: 80, padding: "4px 8px", background: "#111", border: "1px solid rgba(0, 255, 157, 0.3)", borderRadius: 4, fontSize: 13, fontWeight: 700, textAlign: "right", color: "#00ff9d", fontFamily: "monospace" }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "rgba(0, 255, 157, 0.05)", borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
                  {["Parâmetro", "Descrição", "Valor", "Min", "Max", "Unid.", "Categ.", "Editar"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, color: "#00ff9d", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.key} style={{ background: i % 2 === 0 ? "rgba(255, 255, 255, 0.01)" : "transparent", borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                    <td style={{ padding: "8px 10px", fontFamily: "monospace", fontWeight: 700, color: "#fff" }}>{p.key}</td>
                    <td style={{ padding: "8px 10px", color: "#ccc" }}>{p.label}</td>
                    <td style={{ padding: "8px 10px", fontWeight: 700, color: "#00ff9d", fontFamily: "monospace" }}>{p.value}</td>
                    <td style={{ padding: "8px 10px", color: "#666", fontFamily: "monospace" }}>{p.min ?? "—"}</td>
                    <td style={{ padding: "8px 10px", color: "#666", fontFamily: "monospace" }}>{p.max ?? "—"}</td>
                    <td style={{ padding: "8px 10px", color: "#ccc" }}>{p.unit ?? "—"}</td>
                    <td style={{ padding: "8px 10px" }}><span style={{ background: "rgba(255,255,255,0.05)", color: "#aaa", padding: "1px 6px", borderRadius: 3, fontSize: 10, fontFamily: "monospace" }}>{p.category}</span></td>
                    <td style={{ padding: "8px 10px" }}>
                      {!p.readOnly ? (
                        <input type="number" value={p.value} min={p.min} max={p.max}
                          id={`param-table-${p.key}`}
                          name={p.key}
                          aria-label={p.label || p.key}
                          onChange={e => handleChange(p.key, e.target.value)}
                          style={{ width: 70, padding: "3px 6px", background: "#111", border: "1px solid rgba(0, 255, 157, 0.3)", borderRadius: 3, fontSize: 11, color: "#00ff9d", fontFamily: "monospace", textAlign: "right" }}
                        />
                      ) : <span style={{ fontSize: 10, color: "#555", fontFamily: "monospace" }}>read-only</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function CalibrationPage({ instruments, params, isMobile }) {
  const [selectedId, setSelectedId] = useState(instruments[0].id);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const inst    = instruments.find(i => i.id === selectedId);
  const pvParam = (params[selectedId] || []).find(p => p.key === "PV");

  const sidebar = (
    <>
      <SectionHeader title="Instrumento" isMobile={false} />
      {instruments.map(i => (
        <InstItem key={i.id} inst={i} selected={selectedId === i.id} onClick={() => { setSelectedId(i.id); setDrawerOpen(false); }} />
      ))}
    </>
  );

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {!isMobile && <div style={{ width: 200, borderRight: "1px solid rgba(255, 255, 255, 0.08)", overflowY: "auto", flexShrink: 0 }}>{sidebar}</div>}
      {isMobile && <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Selecionar Instrumento">{sidebar}</Drawer>}

      <div style={{ flex: 1, padding: isMobile ? 10 : 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isMobile && (
            <button onClick={() => setDrawerOpen(true)} style={{ background: "rgba(0, 255, 157, 0.1)", color: "#00ff9d", border: "1px solid rgba(0, 255, 157, 0.3)", borderRadius: 3, padding: "4px 8px", fontSize: 10, cursor: "pointer" }}>☰</button>
          )}
          <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", textTransform: "uppercase", letterSpacing: 0.5 }}>{inst?.name} — Calibração</div>
        </div>

        {pvParam && <Thermometer value={pvParam.value} min={pvParam.min ?? -30} max={pvParam.max ?? 100} />}

        {/* Recharts Calibration Curve (Ideal vs Real) */}
        <div style={{ height: 220, background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 4, padding: "12px 10px 10px" }}>
          <div style={{ fontSize: 10, color: "#00ff9d", fontWeight: 600, textTransform: "uppercase", marginBottom: 6, letterSpacing: 0.5, fontFamily: "monospace" }}>Curva de Calibração (Ideal vs Real)</div>
          <ResponsiveContainer width="100%" height="90%" minWidth={0} minHeight={0}>
            <LineChart data={CALIB_POINTS} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="input" tick={{ fontSize: 9, fill: "#888" }} />
              <YAxis tick={{ fontSize: 9, fill: "#888" }} />
              <Tooltip contentStyle={{ background: "#0c0c0e", border: "1px solid rgba(255,255,255,0.15)", fontSize: 10, color: "#fff" }} />
              <Legend wrapperStyle={{ fontSize: 9, color: "#ccc" }} />
              <Line type="monotone" dataKey="expected" stroke="#00e5ff" strokeWidth={1.5} strokeDasharray="5 3" name="Curva Ideal (1:1)" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="output" stroke="#00ff9d" strokeWidth={2} name="Curva Real Calibrada" dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 16 }}>
          {pvParam && (
            <div style={{ display: "flex", justifyContent: "center", flexShrink: 0 }}>
              <GaugeMeter value={pvParam.value} min={pvParam.min ?? 0} max={pvParam.max ?? 100} unit={pvParam.unit ?? ""} label="PV atual" size={isMobile ? 120 : 150} />
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#aaa", marginBottom: 8, textTransform: "uppercase", fontFamily: "monospace" }}>Pontos de Calibração</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, minWidth: 300, fontFamily: "monospace" }}>
                <thead>
                  <tr style={{ background: "rgba(0, 255, 157, 0.05)", borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
                    {["Ponto", "Entrada", "Saída", "Esperado", "Erro"].map(h => (
                      <th key={h} style={{ padding: "6px 8px", textAlign: "left", color: "#00ff9d", fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CALIB_POINTS.map((p, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? "rgba(255, 255, 255, 0.01)" : "transparent", borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                      <td style={{ padding: "6px 8px", color: "#888" }}>P{i + 1}</td>
                      <td style={{ padding: "6px 8px", color: "#fff" }}>{p.input}</td>
                      <td style={{ padding: "6px 8px", color: "#fff" }}>{p.output}</td>
                      <td style={{ padding: "6px 8px", color: "#ccc" }}>{p.expected}</td>
                      <td style={{ padding: "6px 8px", color: Math.abs(p.error) > 0.25 ? "#ef4444" : "#00ff9d", fontWeight: 600 }}>
                        {p.error > 0 ? "+" : ""}{p.error}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style={{ background: "rgba(255, 229, 0, 0.05)", border: "1px solid rgba(255, 229, 0, 0.3)", borderRadius: 4, padding: "10px 12px", fontSize: 11, color: "#ffe500", fontFamily: "monospace" }}>
          ⚠ Calibração pendente de aprovação. Verifique os pontos de erro antes de confirmar.
        </div>
      </div>
    </div>
  );
}

function TemplatesPage({ params, isMobile }) {
  const [templates] = useState(TEMPLATES);
  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const list = (
    <>
      <div style={{ padding: "8px 12px", fontSize: 11, color: "#aaa", fontWeight: 600, textTransform: "uppercase", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "monospace" }}>
        <span>Templates</span>
        <span style={{ background: "rgba(0, 255, 157, 0.1)", color: "#00ff9d", border: "1px solid rgba(0, 255, 157, 0.3)", padding: "1px 6px", borderRadius: 3, fontSize: 10 }}>{templates.length}</span>
      </div>
      {templates.map(t => (
        <div key={t.id} onClick={() => { setSelected(t); setDrawerOpen(false); }} style={{
          padding: "10px 12px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.05)",
          background: selected?.id === t.id ? "rgba(0, 255, 157, 0.05)" : "transparent",
          borderLeft: selected?.id === t.id ? "3px solid #00ff9d" : "3px solid transparent",
          transition: "all 0.15s"
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: selected?.id === t.id ? "#00ff9d" : "#fff", marginBottom: 2 }}>{t.name}</div>
          <div style={{ fontSize: 10, color: "#888" }}>{t.type} · {t.params} parâmetros</div>
          <div style={{ fontSize: 10, color: "#666", marginTop: 2, fontFamily: "monospace" }}>Atualizado: {t.updatedAt}</div>
          {t.isDefault && <span style={{ fontSize: 8, background: "rgba(0, 255, 157, 0.1)", color: "#00ff9d", border: "1px solid rgba(0, 255, 157, 0.2)", padding: "1px 5px", borderRadius: 3, marginTop: 4, display: "inline-block", fontWeight: 700, fontFamily: "monospace" }}>PADRÃO</span>}
        </div>
      ))}
    </>
  );

  const instParams = params ? (params["inst-001"] || []) : (PARAMS["inst-001"] || []);

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {!isMobile && <div style={{ width: 250, borderRight: "1px solid rgba(255, 255, 255, 0.08)", overflowY: "auto", flexShrink: 0 }}>{list}</div>}
      {isMobile && <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Templates">{list}</Drawer>}

      <div style={{ flex: 1, padding: isMobile ? 12 : 24, overflowY: "auto" }}>
        {isMobile && (
          <div style={{ marginBottom: 12 }}>
            <button onClick={() => setDrawerOpen(true)} style={{ background: "rgba(0, 255, 157, 0.1)", color: "#00ff9d", border: "1px solid rgba(0, 255, 157, 0.3)", borderRadius: 3, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontWeight: "bold" }}>
              ☰ Selecionar Template
            </button>
          </div>
        )}
        {selected ? (
          <>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{selected.name}</div>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 16 }}>Tipo: {selected.type} · {selected.params} parâmetros · {selected.updatedAt}</div>
            <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 4, padding: 12 }}>
              <div style={{ fontSize: 10, color: "#00ff9d", fontWeight: 600, marginBottom: 8, letterSpacing: 0.5, fontFamily: "monospace" }}>PARÂMETROS DO TEMPLATE</div>
              {instParams.slice(0, selected.params).map((p, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", fontSize: 11, flexWrap: "wrap", gap: 4, fontFamily: "monospace" }}>
                  <span style={{ fontWeight: 700, color: "#fff" }}>{p.key}</span>
                  <span style={{ color: "#aaa" }}>{p.label}</span>
                  <span style={{ color: "#666" }}>{p.min ?? "—"} ~ {p.max ?? "—"} {p.unit}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button style={{ background: "rgba(0, 255, 157, 0.1)", color: "#00ff9d", border: "1px solid rgba(0, 255, 157, 0.3)", borderRadius: 3, padding: "6px 14px", fontSize: 11, cursor: "pointer", fontWeight: 700 }}>APLICAR</button>
              <button style={{ background: "rgba(255,255,255,0.05)", color: "#ccc", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 3, padding: "6px 14px", fontSize: 11, cursor: "pointer" }}>EDITAR</button>
              <button style={{ background: "rgba(255,255,255,0.05)", color: "#ccc", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 3, padding: "6px 14px", fontSize: 11, cursor: "pointer" }}>DUPLICAR</button>
            </div>
          </>
        ) : (
          <div style={{ color: "#444", fontSize: 13, paddingTop: 40, textAlign: "center", textTransform: "uppercase", letterSpacing: 1, fontFamily: "monospace" }}>Selecione um template na lista</div>
        )}
      </div>
    </div>
  );
}

function AlarmsPage({ instruments, params, events, isMobile }) {
  const alarmEvents = events.filter(e => e.level === "warning" || e.level === "error");
  return <DataLogPage instruments={instruments} params={params} events={alarmEvents} isMobile={isMobile} />;
}

function DataLogPage({ instruments, params, events, isMobile }) {
  return (
    <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", height: "100%", overflow: "hidden" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: isMobile ? 0 : "auto" }}>
        <div style={{ padding: "8px 12px", background: "rgba(255, 255, 255, 0.02)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", fontSize: 12, fontWeight: 600, color: "#fff", textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "monospace" }}>
          Log de Eventos
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {events.map(ev => {
            const c = EVENT_COLOR[ev.level];
            return (
              <div key={ev.id} style={{
                display: "flex", alignItems: "flex-start", padding: "8px 12px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.05)", borderLeft: `3px solid ${c.text}`, background: c.bg,
              }}>
                <span style={{ fontFamily: "monospace", fontSize: 10, color: "#666", minWidth: isMobile ? 54 : 64, paddingTop: 1 }}>{ev.ts}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: c.text, minWidth: 60, paddingTop: 1, fontFamily: "monospace" }}>[{ev.level.toUpperCase()}]</span>
                <span style={{ fontSize: 11, color: "#ccc", fontFamily: "monospace" }}>{ev.msg}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{
        width: isMobile ? "100%" : 260,
        borderLeft: isMobile ? "none" : "1px solid rgba(255, 255, 255, 0.08)",
        borderTop: isMobile ? "1px solid rgba(255, 255, 255, 0.08)" : "none",
        padding: 10, overflowY: "auto", flexShrink: 0,
        maxHeight: isMobile ? 160 : "none",
        background: "#08080a"
      }}>
        <div style={{ fontSize: 10, color: "#00ff9d", fontWeight: 600, textTransform: "uppercase", marginBottom: 8, letterSpacing: 0.5, fontFamily: "monospace" }}>Resumo da Planta</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {instruments.map(i => {
            const pv = (params[i.id] || []).find(p => p.key === "PV");
            return (
              <div key={i.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", background: "rgba(255, 255, 255, 0.02)", borderRadius: 4, border: "1px solid rgba(255, 255, 255, 0.06)", flex: isMobile ? "1 1 140px" : "none", width: isMobile ? "auto" : "100%" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <StatusDot status={i.status} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#fff" }}>{isMobile ? i.model : i.name}</span>
                </div>
                {pv && <span style={{ fontSize: 12, fontWeight: 700, color: STATUS_COLOR[i.status].text, fontFamily: "monospace" }}>{pv.value} {pv.unit}</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ReportsPage({ instruments, chartData, isMobile }) {
  const [selectedId, setSelectedId] = useState(instruments[0].id);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const inst = instruments.find(i => i.id === selectedId);

  const handleExportCSV = () => {
    const data = chartData[selectedId] || [];
    const headers = ['Timestamp', 'PV', 'SP', 'Qualidade'];
    const rows = data.map(row => [
      row.time,
      row.PV,
      row.SP,
      'GOOD'
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_${selectedId}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sidebar = (
    <>
      <SectionHeader title="Instrumento" isMobile={false} />
      {instruments.map(i => (
        <InstItem key={i.id} inst={i} selected={selectedId === i.id} onClick={() => { setSelectedId(i.id); setDrawerOpen(false); }} />
      ))}
    </>
  );

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {!isMobile && <div style={{ width: 200, borderRight: "1px solid rgba(255, 255, 255, 0.08)", overflowY: "auto", flexShrink: 0 }}>{sidebar}</div>}
      {isMobile && <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Instrumento">{sidebar}</Drawer>}

      <div style={{ flex: 1, padding: isMobile ? 10 : 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {isMobile && (
              <button onClick={() => setDrawerOpen(true)} style={{ background: "rgba(0, 255, 157, 0.1)", color: "#00ff9d", border: "1px solid rgba(0, 255, 157, 0.3)", borderRadius: 3, padding: "4px 8px", fontSize: 10, cursor: "pointer" }}>☰</button>
            )}
            <div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 600, color: "#fff", textTransform: "uppercase", letterSpacing: 0.5 }}>
              {isMobile ? inst?.model : inst?.name} — Relatório
            </div>
          </div>
          <button onClick={handleExportCSV} style={{ background: "rgba(0, 255, 157, 0.1)", color: "#00ff9d", border: "1px solid rgba(0, 255, 157, 0.3)", borderRadius: 3, padding: "5px 12px", fontSize: 11, fontWeight: "bold", cursor: "pointer", transition: "all 0.15s" }}>
            Exportar CSV
          </button>
        </div>

        <div style={{ height: isMobile ? 180 : 220 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <LineChart data={chartData[selectedId] || []} margin={{ top: 5, right: 10, bottom: 5, left: isMobile ? -20 : 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#888" }} interval={isMobile ? 14 : 9} />
              <YAxis tick={{ fontSize: 9, fill: "#888" }} />
              <Tooltip contentStyle={{ background: "#0c0c0e", border: "1px solid rgba(255,255,255,0.15)", fontSize: 10, color: "#fff" }} />
              <Legend wrapperStyle={{ fontSize: 10, color: "#ccc" }} />
              <Line type="monotone" dataKey="PV" stroke="#00ff9d" strokeWidth={2} dot={false} name="PV" />
              <Line type="monotone" dataKey="SP" stroke="#00e5ff" strokeWidth={1.5} dot={false} strokeDasharray="5 3" name="SP" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ fontSize: 10, fontWeight: 600, color: "#00ff9d", textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "monospace" }}>Registros Históricos</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, minWidth: isMobile ? 320 : "auto", fontFamily: "monospace" }}>
            <thead>
              <tr style={{ background: "rgba(0, 255, 157, 0.05)", borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
                {["Timestamp", "PV", "SP", "Qualidade"].map(h => (
                  <th key={h} style={{ padding: "6px 8px", textAlign: "left", fontWeight: 600, color: "#00ff9d" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(chartData[selectedId] || []).slice(-12).reverse().map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "rgba(255, 255, 255, 0.01)" : "transparent", borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  <td style={{ padding: "6px 8px", color: "#ccc" }}>{row.time}</td>
                  <td style={{ padding: "6px 8px", fontWeight: 600, color: "#fff" }}>{row.PV}</td>
                  <td style={{ padding: "6px 8px", color: "#aaa" }}>{row.SP}</td>
                  <td style={{ padding: "6px 8px" }}><span style={{ color: "#00ff9d", fontWeight: 600 }}>GOOD</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function KairOSConnect() {
  const isMobile = useIsMobile();
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("kairos_authenticated") === "true";
    }
    return false;
  });
  const [currentScreen, setCurrentScreen] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("kairos_screen") || "hero";
    }
    return "hero";
  });
  const [activeTab, setActiveTab]   = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("kairos_active_tab") || "dashboard";
    }
    return "dashboard";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("kairos_screen", currentScreen);
    }
  }, [currentScreen]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("kairos_active_tab", activeTab);
    }
  }, [activeTab]);

  // Route Guard to prevent URL/state injection bypass when not authenticated
  useEffect(() => {
    if (currentScreen !== "hero" && currentScreen !== "login" && !isAuthenticated) {
      const timer = setTimeout(() => {
        setCurrentScreen("login");
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [currentScreen, isAuthenticated]);

  const [selectedId, setSelectedId] = useState(INSTRUMENTS[0].id);
  const [recording, setRecording]   = useState(false);
  const [events, setEvents]         = useState(EVENTS_INIT);
  const [menuOpen, setMenuOpen]     = useState(false);

  // Stateful parameters and instruments
  const [instruments, setInstruments] = useState(INSTRUMENTS);
  const [params, setParams]           = useState(PARAMS);
  const [simulationMode, setSimulationMode] = useState("normal");

  const [chartData, setChartData]   = useState(() => {
    const init = {};
    INSTRUMENTS.forEach(inst => {
      const pv = (PARAMS[inst.id] || []).find(p => p.key === "PV");
      init[inst.id] = generateHistory(pv?.value ?? 50, 60, 4);
    });
    return init;
  });

  // Refs for loop synchronization
  const paramsRef = useRef(params);
  const instrumentsRef = useRef(instruments);
  const chartDataRef = useRef(chartData);
  const eventsRef = useRef(events);

  useEffect(() => { paramsRef.current = params; }, [params]);
  useEffect(() => { instrumentsRef.current = instruments; }, [instruments]);
  useEffect(() => { chartDataRef.current = chartData; }, [chartData]);
  useEffect(() => { eventsRef.current = events; }, [events]);

  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => {
      const currentParams = paramsRef.current;
      const currentInsts = instrumentsRef.current;
      const currentChartData = chartDataRef.current;
      const currentEvents = eventsRef.current;

      const nextParams = { ...currentParams };
      const nextInsts = currentInsts.map(inst => {
        const instParams = currentParams[inst.id] || [];
        const pvParam = instParams.find(p => p.key === "PV");
        const spParam = instParams.find(p => p.key === "SP");
        const alhiParam = instParams.find(p => p.key === "ALHI");
        const alloParam = instParams.find(p => p.key === "ALLO");
        
        const currentPV = pvParam ? pvParam.value : 50;
        const spValue = spParam ? spParam.value : 50;
        const minLimit = pvParam && pvParam.min !== undefined ? pvParam.min : 0;
        const maxLimit = pvParam && pvParam.max !== undefined ? pvParam.max : 100;
        
        let newVal = currentPV;
        let status;
        
        if (simulationMode === "offline") {
          newVal = 0;
          status = "offline";
        } else if (simulationMode === "alarm") {
          const target = alhiParam ? alhiParam.value + 10 : maxLimit * 0.95;
          newVal = +(currentPV + (target - currentPV) * 0.25 + Math.random() * 2).toFixed(1);
          if (newVal > maxLimit) newVal = maxLimit;
          status = "error";
        } else if (simulationMode === "noisy") {
          newVal = +(spValue + (Math.random() - 0.5) * 15).toFixed(1);
          if (newVal < minLimit) newVal = minLimit;
          if (newVal > maxLimit) newVal = maxLimit;
          
          if (alhiParam && newVal >= alhiParam.value) {
            status = "error";
          } else if (alloParam && newVal <= alloParam.value) {
            status = "warning";
          } else {
            status = "online";
          }
        } else {
          // "normal"
          newVal = +(currentPV + (spValue - currentPV) * 0.15 + (Math.random() - 0.5) * 1.5).toFixed(1);
          if (newVal < minLimit) newVal = minLimit;
          if (newVal > maxLimit) newVal = maxLimit;
          
          if (alhiParam && newVal >= alhiParam.value) {
            status = "error";
          } else if (alloParam && newVal <= alloParam.value) {
            status = "warning";
          } else {
            status = "online";
          }
        }
        
        nextParams[inst.id] = instParams.map(p => {
          if (p.key === "PV") {
            return { ...p, value: newVal };
          }
          if (p.key === "OUT") {
            const diff = spValue - newVal;
            const outVal = Math.min(Math.max(Math.round(50 + diff * 2.5), 0), 100);
            return { ...p, value: outVal };
          }
          return p;
        });
        
        return { ...inst, status, newVal };
      });

      // Update chartData
      const nextChartData = { ...currentChartData };
      nextInsts.forEach(inst => {
        const instParams = nextParams[inst.id] || [];
        const spParam = instParams.find(p => p.key === "SP");
        const spValue = spParam ? spParam.value : 50;
        
        const list = currentChartData[inst.id] || [];
        nextChartData[inst.id] = [...list.slice(1), {
          time: new Date().toLocaleTimeString("pt-BR"),
          PV: inst.newVal,
          SP: spValue
        }];
      });

      const finalInsts = nextInsts.map(inst => {
        const rest = { ...inst };
        delete rest.newVal;
        return rest;
      });

      // Log status changes
      const newEvents = [...currentEvents];
      finalInsts.forEach(inst => {
        const prevInst = currentInsts.find(i => i.id === inst.id);
        if (prevInst && prevInst.status !== inst.status) {
          let level;
          let msg;
          if (inst.status === "offline") {
            level = "error";
            msg = `Instrumento ${inst.name} perdeu comunicação (offline).`;
          } else if (inst.status === "error") {
            level = "error";
            const pvVal = (nextParams[inst.id] || []).find(p => p.key === "PV")?.value;
            const alhi = (nextParams[inst.id] || []).find(p => p.key === "ALHI")?.value;
            msg = `Alarme Alto Ativo — ${inst.name} (${pvVal} ${inst.id === "inst-003" ? "bar" : "°C"} >= limite ${alhi}).`;
          } else if (inst.status === "warning") {
            level = "warning";
            const pvVal = (nextParams[inst.id] || []).find(p => p.key === "PV")?.value;
            const allo = (nextParams[inst.id] || []).find(p => p.key === "ALLO")?.value;
            msg = `Alarme Baixo Ativo — ${inst.name} (${pvVal} ${inst.id === "inst-003" ? "bar" : "°C"} <= limite ${allo}).`;
          } else {
            level = "info";
            msg = `Instrumento ${inst.name} normalizado e operando online.`;
          }
          newEvents.push({
            id: newEvents.length + 1,
            ts: new Date().toLocaleTimeString("pt-BR"),
            level,
            msg
          });
        }
      });

      if (Math.random() < 0.2) {
        const randomInst = finalInsts[Math.floor(Math.random() * finalInsts.length)];
        newEvents.push({
          id: newEvents.length + 1,
          ts: new Date().toLocaleTimeString("pt-BR"),
          level: "info",
          msg: `Telemetria registrada — ${randomInst.name}`,
        });
      }

      setParams(nextParams);
      setInstruments(finalInsts);
      setChartData(nextChartData);
      setEvents(newEvents);
    }, 3000);
    return () => clearInterval(id);
  }, [recording]);

  const MobileMenu = () => (
    <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="KairOS CONNECT">
      {NAV_TABS.map(t => (
        <button key={t.id} onClick={() => { setActiveTab(t.id); setMenuOpen(false); }} style={{
          display: "flex", alignItems: "center", gap: 12, width: "100%",
          padding: "13px 16px", border: "none", borderBottom: "1px solid #f0f0f0",
          background: activeTab === t.id ? "#fff5f5" : "#fff",
          borderLeft: activeTab === t.id ? `4px solid ${RED}` : "4px solid transparent",
          color: activeTab === t.id ? RED : "#333", fontSize: 13, fontWeight: activeTab === t.id ? 700 : 400,
          cursor: "pointer", textAlign: "left",
        }}>
          <span style={{ fontSize: 18 }}>{t.icon}</span>
          {t.label}
        </button>
      ))}
    </Drawer>
  );

  const sharedProps = { isMobile };
  const pages = {
    dashboard:     <Dashboard {...sharedProps} instruments={instruments} params={params} chartData={chartData} selectedId={selectedId} onSelect={setSelectedId} simulationMode={simulationMode} onSimulationModeChange={setSimulationMode} />,
    analytics:     null,
    alarms:        <AlarmsPage {...sharedProps} instruments={instruments} params={params} events={events} />,
    instruments:   <InstrumentsPage {...sharedProps} instruments={instruments} params={params} />,
    configuration: <ConfigurationPage {...sharedProps} instruments={instruments} params={params} onChangeParams={setParams} />,
    calibration:   <CalibrationPage {...sharedProps} instruments={instruments} params={params} />,
    templates:     <TemplatesPage {...sharedProps} params={params} />,
    datalog:       <DataLogPage {...sharedProps} instruments={instruments} params={params} events={events} />,
    reports:       <ReportsPage {...sharedProps} instruments={instruments} params={params} chartData={chartData} />,
  };

  if (currentScreen === "hero") {
    return <HeroLanding onEnter={() => setCurrentScreen("login")} />;
  }

  if (currentScreen === "login" || !isAuthenticated) {
    return (
      <KairosLogin
        onLogin={() => {
          setIsAuthenticated(true);
          if (typeof window !== "undefined") {
            sessionStorage.setItem("kairos_authenticated", "true");
          }
          setCurrentScreen("dashboard");
        }}
      />
    );
  }

  if (!isMobile) {
    const alarmCount = events.filter(e => e.level === "warning" || e.level === "error").length;
    return (
      <AnalyticsExplorer
        activeTab={activeTab}
        onTab={setActiveTab}
        alarmCount={alarmCount}
        onLogout={() => {
          setIsAuthenticated(false);
          if (typeof window !== "undefined") {
            sessionStorage.removeItem("kairos_authenticated");
          }
          setCurrentScreen("login");
          setActiveTab("dashboard");
        }}
      >
        {pages[activeTab]}
      </AnalyticsExplorer>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "'Segoe UI', Arial, sans-serif", background: "#0c0c0e", overflow: "hidden" }}>
      <Toolbar recording={recording} onToggleRecord={() => setRecording(r => !r)} isMobile={isMobile} onMenuOpen={() => setMenuOpen(true)} />

      {isMobile && (
        <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="KairOS CONNECT">
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ flex: 1 }}>
              {NAV_TABS.map(t => (
                <button key={t.id} onClick={() => { setActiveTab(t.id); setMenuOpen(false); }} style={{
                  display: "flex", alignItems: "center", gap: 12, width: "100%",
                  padding: "13px 16px", border: "none", borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                  background: activeTab === t.id ? "rgba(0, 255, 157, 0.05)" : "transparent",
                  borderLeft: activeTab === t.id ? "4px solid #00ff9d" : "4px solid transparent",
                  color: activeTab === t.id ? "#00ff9d" : "#ccc", fontSize: 13, fontWeight: activeTab === t.id ? 700 : 400,
                  cursor: "pointer", textAlign: "left",
                }}>
                  <span style={{ fontSize: 18 }}>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
            <button onClick={() => {
              setIsAuthenticated(false);
              if (typeof window !== "undefined") {
                sessionStorage.removeItem("kairos_authenticated");
              }
              setCurrentScreen("login");
              setActiveTab("dashboard");
              setMenuOpen(false);
            }} style={{
              display: "flex", alignItems: "center", gap: 12, width: "100%",
              padding: "13px 16px", border: "none", borderTop: "1px solid rgba(255, 255, 255, 0.05)",
              background: "transparent",
              color: "#ef4444", fontSize: 13, fontWeight: 700,
              cursor: "pointer", textAlign: "left", marginTop: "auto"
            }}>
              <span style={{ fontSize: 18 }}>⎋</span>
              EXIT SESSION
            </button>
          </div>
        </Drawer>
      )}

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <main className="flex-1" style={{ flex: 1, overflow: "hidden", background: "#0c0c0e", display: "flex", flexDirection: "column" }}>
          {pages[activeTab]}
        </main>
      </div>

      <StatusBar instruments={instruments} />
      {isMobile && <BottomNav activeTab={activeTab} onTab={setActiveTab} />}
    </div>
  );
}
