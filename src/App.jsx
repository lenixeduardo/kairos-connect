import { useState, useEffect, useRef } from "react";
import { KairosLogin } from "./KairosLogin";
import { HeroLanding } from "./HeroLanding";
import { clearKairosAuth } from "./lib/kairosApi";
import { useIsMobile, StatusDot, Badge, Drawer, InstItem, SectionHeader, Toolbar, BottomNav, StatusBar, NAV_TABS, STATUS_COLOR, EVENT_COLOR } from "./components/UI.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import CalibrationPage from "./pages/CalibrationPage.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";
import { AnalyticsExplorer } from "./AnalyticsExplorer.jsx";
import { KairosWorkOrders } from "./KairosWorkOrders.jsx";
import { KairosMachines } from "./KairosMachines.jsx";
import { Portus } from "./Portus.jsx";

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
// ─── PAGES ───────────────────────────────────────────────────────────────────

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


// ─── APP ─────────────────────────────────────────────────────────────────────
export default function KairOSConnect() {
  const isMobile = useIsMobile();
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        sessionStorage.getItem("kairos_authenticated") === "true" ||
        !!localStorage.getItem("kairos_access_token")
      );
    }
    return false;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("kairos_user");
      try { return raw ? JSON.parse(raw) : null; } catch { return null; }
    }
    return null;
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

  // Listen for JWT expiry from kairosApi refresh failure
  useEffect(() => {
    const handleAuthExpired = () => {
      setIsAuthenticated(false);
      setCurrentUser(null);
      setCurrentScreen("login");
      setActiveTab("dashboard");
    };
    window.addEventListener("kairos_auth_expired", handleAuthExpired);
    return () => window.removeEventListener("kairos_auth_expired", handleAuthExpired);
  }, []);

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
    workorders:    <KairosWorkOrders />,
    machines:      <KairosMachines />,
    portus:        <Portus />,
  };

  if (currentScreen === "hero") {
    return <HeroLanding onEnter={() => setCurrentScreen("login")} />;
  }

  if (currentScreen === "login" || !isAuthenticated) {
    return (
      <KairosLogin
        onLogin={(user) => {
          setIsAuthenticated(true);
          if (user) {
            setCurrentUser(user);
          } else {
            // Demo mode (no backend): keep legacy sessionStorage flag
            if (typeof window !== "undefined") {
              sessionStorage.setItem("kairos_authenticated", "true");
            }
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
          setCurrentUser(null);
          clearKairosAuth();
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
              setCurrentUser(null);
              clearKairosAuth();
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


