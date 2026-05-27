import { useState, useEffect, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { StatusDot, Badge, GaugeMeter, Drawer, InstItem, SectionHeader, useIsMobile } from '../components/UI.jsx';
import { STATUS_COLOR } from '../components/UI.jsx';

function generateHistory(baseValue, points = 60, noise = 5) {
  const now = Date.now();
  return Array.from({ length: points }, (_, i) => ({
    time: new Date(now - (points - i) * 5000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    PV: +(baseValue + (Math.random() - 0.5) * noise * 2).toFixed(1),
    SP: baseValue,
  }));
}

export default function Dashboard({ instruments, params, chartData, selectedId, onSelect, isMobile, simulationMode, onSimulationModeChange }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const inst = instruments.find(i => i.id === selectedId) || instruments[0];
  const instParams = params[inst.id] || [];
  const pvParam = instParams.find(p => p.key === 'PV');

  const instList = (
    <>
      <SectionHeader title="Instrumentos" isMobile={isMobile} onMenuClick={() => setDrawerOpen(true)} />
      {instruments.map(i => (
        <InstItem key={i.id} inst={i} selected={selectedId === i.id} onClick={() => { onSelect(i.id); setDrawerOpen(false); }} />
      ))}
    </>
  );

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {!isMobile && (
        <div style={{ width: 210, borderRight: '1px solid rgba(255, 255, 255, 0.08)', overflowY: 'auto', flexShrink: 0 }}>
          {instList}
        </div>
      )}

      {isMobile && (
        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Instrumentos">
          {instList}
        </Drawer>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {isMobile && (
          <div style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setDrawerOpen(true)} style={{ background: 'rgba(0, 255, 157, 0.1)', color: '#00ff9d', border: '1px solid rgba(0, 255, 157, 0.3)', borderRadius: 3, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>☰</button>
            <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
              <StatusDot status={inst.status} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inst.name}</span>
            </div>
            {pvParam && (
              <span style={{ marginLeft: 'auto', fontWeight: 700, color: '#00ff9d', fontSize: 14, whiteSpace: 'nowrap' }}>{pvParam.value} {pvParam.unit}</span>
            )}
          </div>
        )}

        <div style={{ flex: 1, padding: isMobile ? '8px 8px 0' : '12px 16px 0', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8, flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: 13, color: '#fff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {inst.name} — Monitoramento
              </div>
              <div style={{ fontSize: 9, color: '#888', fontFamily: 'monospace' }}>
                ID: {inst.id} · PROTOCOLO: MODBUS RTU · STATUS: <span style={{ color: STATUS_COLOR[inst.status].text }}>{inst.status.toUpperCase()}</span>
              </div>
            </div>

            {/* Simulation Controller */}
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 4 : 6, background: 'rgba(255, 255, 255, 0.02)', padding: '4px 8px', borderRadius: 4, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <span style={{ fontSize: 9, color: '#888', textTransform: 'uppercase', fontFamily: 'monospace' }}>Simulação:</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {['normal', 'noisy', 'alarm', 'offline'].map(mode => {
                  const isActive = simulationMode === mode;
                  let modeColor = '#888';
                  let modeLabel = mode.toUpperCase();
                  if (mode === 'normal') { modeColor = '#00ff9d'; modeLabel = 'NORMAL'; }
                  if (mode === 'noisy') { modeColor = '#00e5ff'; modeLabel = 'RUIDOSO'; }
                  if (mode === 'alarm') { modeColor = '#ef4444'; modeLabel = 'FALHA'; }
                  if (mode === 'offline') { modeColor = '#ffb300'; modeLabel = 'OFFLINE'; }

                  return (
                    <button
                      key={mode}
                      onClick={() => onSimulationModeChange(mode)}
                      style={{
                        background: isActive ? `${modeColor}1a` : 'transparent',
                        border: `1px solid ${isActive ? modeColor : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: 3,
                        color: isActive ? modeColor : '#888',
                        fontSize: 9,
                        fontWeight: isActive ? 700 : 400,
                        padding: '3px 6px',
                        cursor: 'pointer',
                        fontFamily: 'monospace',
                        transition: 'all 0.15s',
                        boxShadow: isActive ? `0 0 6px ${modeColor}22` : 'none'
                      }}
                    >
                      {modeLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <LineChart data={chartData[inst.id] || []} margin={{ top: 5, right: 10, bottom: 5, left: isMobile ? -20 : 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#888' }} interval={isMobile ? 14 : 9} />
                <YAxis tick={{ fontSize: 9, fill: '#888' }} />
                <Tooltip contentStyle={{ background: '#0c0c0e', border: '1px solid rgba(255,255,255,0.15)', fontSize: 10, color: '#fff' }} />
                <Legend wrapperStyle={{ fontSize: 10, color: '#ccc' }} />
                <Line type="monotone" dataKey="PV" stroke="#00ff9d" strokeWidth={2.5} dot={false} name="PV" />
                <Line type="monotone" dataKey="SP" stroke="#00e5ff" strokeWidth={1.5} dot={false} strokeDasharray="5 3" name="SP" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {isMobile && (
          <div style={{ padding: '8px 10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', gap: 8, overflowX: 'auto' }}>
            {instParams.slice(0, 6).map(p => (
              <div key={p.key} style={{ flexShrink: 0, textAlign: 'center', minWidth: 56, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 4, padding: '4px 8px' }}>
                <div style={{ fontSize: 8, color: '#888', fontFamily: 'monospace' }}>{p.key}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#00ff9d', fontFamily: 'monospace' }}>{p.value}</div>
                <div style={{ fontSize: 8, color: '#666', fontFamily: 'monospace' }}>{p.unit}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!isMobile && (
        <div style={{ width: 190, borderLeft: '1px solid rgba(255, 255, 255, 0.08)', padding: 12, overflowY: 'auto', flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: '#00ff9d', fontWeight: 600, textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.5 }}>Medidores</div>
          {pvParam && (
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
              <GaugeMeter value={pvParam.value} min={pvParam.min ?? 0} max={pvParam.max ?? 100} unit={pvParam.unit ?? ''} label="PV" size={130} />
            </div>
          )}
          <div style={{ fontSize: 10, color: '#00ff9d', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>Parâmetros</div>
          {instParams.slice(0, 5).map(p => (
            <div key={p.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 11 }}>
              <span style={{ color: '#888', fontFamily: 'monospace' }}>{p.key}</span>
              <span style={{ fontWeight: 600, color: '#fff', fontFamily: 'monospace' }}>{p.value} {p.unit}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
