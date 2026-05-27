import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { GaugeMeter, Thermometer, Drawer, InstItem, SectionHeader } from '../components/UI.jsx';

const CALIB_POINTS = [
  { input: 0,   output: 0.2,  expected: 0,   error: 0.2  },
  { input: 25,  output: 24.8, expected: 25,  error: -0.2 },
  { input: 50,  output: 50.1, expected: 50,  error: 0.1  },
  { input: 75,  output: 74.7, expected: 75,  error: -0.3 },
  { input: 100, output: 99.9, expected: 100, error: -0.1 },
];

export default function CalibrationPage({ instruments, params, isMobile }) {
  const [selectedId, setSelectedId] = useState(instruments[0].id);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const inst = instruments.find(i => i.id === selectedId);
  const pvParam = (params[selectedId] || []).find(p => p.key === 'PV');

  const sidebar = (
    <>
      <SectionHeader title="Instrumento" isMobile={false} />
      {instruments.map(i => (
        <InstItem key={i.id} inst={i} selected={selectedId === i.id} onClick={() => { setSelectedId(i.id); setDrawerOpen(false); }} />
      ))}
    </>
  );

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {!isMobile && <div style={{ width: 200, borderRight: '1px solid rgba(255, 255, 255, 0.08)', overflowY: 'auto', flexShrink: 0 }}>{sidebar}</div>}
      {isMobile && <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Selecionar Instrumento">{sidebar}</Drawer>}

      <div style={{ flex: 1, padding: isMobile ? 10 : 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isMobile && (
            <button onClick={() => setDrawerOpen(true)} style={{ background: 'rgba(0, 255, 157, 0.1)', color: '#00ff9d', border: '1px solid rgba(0, 255, 157, 0.3)', borderRadius: 3, padding: '4px 8px', fontSize: 10, cursor: 'pointer' }}>☰</button>
          )}
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 }}>{inst?.name} — Calibração</div>
        </div>

        {pvParam && <Thermometer value={pvParam.value} min={pvParam.min ?? -30} max={pvParam.max ?? 100} />}

        <div style={{ height: 220, background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 4, padding: '12px 10px 10px' }}>
          <div style={{ fontSize: 10, color: '#00ff9d', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5, fontFamily: 'monospace' }}>Curva de Calibração (Ideal vs Real)</div>
          <ResponsiveContainer width="100%" height="90%" minWidth={0} minHeight={0}>
            <LineChart data={CALIB_POINTS} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="input" tick={{ fontSize: 9, fill: '#888' }} />
              <YAxis tick={{ fontSize: 9, fill: '#888' }} />
              <Tooltip contentStyle={{ background: '#0c0c0e', border: '1px solid rgba(255,255,255,0.15)', fontSize: 10, color: '#fff' }} />
              <Legend wrapperStyle={{ fontSize: 9, color: '#ccc' }} />
              <Line type="monotone" dataKey="expected" stroke="#00e5ff" strokeWidth={1.5} strokeDasharray="5 3" name="Curva Ideal (1:1)" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="output" stroke="#00ff9d" strokeWidth={2} name="Curva Real Calibrada" dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
          {pvParam && (
            <div style={{ display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
              <GaugeMeter value={pvParam.value} min={pvParam.min ?? 0} max={pvParam.max ?? 100} unit={pvParam.unit ?? ''} label="PV atual" size={isMobile ? 120 : 150} />
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#aaa', marginBottom: 8, textTransform: 'uppercase', fontFamily: 'monospace' }}>Pontos de Calibração</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, minWidth: 300, fontFamily: 'monospace' }}>
                <thead>
                  <tr style={{ background: 'rgba(0, 255, 157, 0.05)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    {['Ponto', 'Entrada', 'Saída', 'Esperado', 'Erro'].map(h => (
                      <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: '#00ff9d', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CALIB_POINTS.map((p, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'transparent', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '6px 8px', color: '#888' }}>P{i + 1}</td>
                      <td style={{ padding: '6px 8px', color: '#fff' }}>{p.input}</td>
                      <td style={{ padding: '6px 8px', color: '#fff' }}>{p.output}</td>
                      <td style={{ padding: '6px 8px', color: '#ccc' }}>{p.expected}</td>
                      <td style={{ padding: '6px 8px', color: Math.abs(p.error) > 0.25 ? '#ef4444' : '#00ff9d', fontWeight: 600 }}>
                        {p.error > 0 ? '+' : ''}{p.error}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style={{ background: 'rgba(255, 229, 0, 0.05)', border: '1px solid rgba(255, 229, 0, 0.3)', borderRadius: 4, padding: '10px 12px', fontSize: 11, color: '#ffe500', fontFamily: 'monospace' }}>
          ⚠ Calibração pendente de aprovação. Verifique os pontos de erro antes de confirmar.
        </div>
      </div>
    </div>
  );
}
