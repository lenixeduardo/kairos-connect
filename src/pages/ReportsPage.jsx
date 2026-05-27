import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Drawer, InstItem, SectionHeader } from '../components/UI.jsx';

export default function ReportsPage({ instruments, chartData, isMobile }) {
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
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_${selectedId}_${new Date().toISOString().slice(0, 10)}.csv`);
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
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {!isMobile && <div style={{ width: 200, borderRight: '1px solid rgba(255, 255, 255, 0.08)', overflowY: 'auto', flexShrink: 0 }}>{sidebar}</div>}
      {isMobile && <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Instrumento">{sidebar}</Drawer>}

      <div style={{ flex: 1, padding: isMobile ? 10 : 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isMobile && (
              <button onClick={() => setDrawerOpen(true)} style={{ background: 'rgba(0, 255, 157, 0.1)', color: '#00ff9d', border: '1px solid rgba(0, 255, 157, 0.3)', borderRadius: 3, padding: '4px 8px', fontSize: 10, cursor: 'pointer' }}>☰</button>
            )}
            <div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 600, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {isMobile ? inst?.model : inst?.name} — Relatório
            </div>
          </div>
          <button onClick={handleExportCSV} style={{ background: 'rgba(0, 255, 157, 0.1)', color: '#00ff9d', border: '1px solid rgba(0, 255, 157, 0.3)', borderRadius: 3, padding: '5px 12px', fontSize: 11, fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.15s' }}>
            Exportar CSV
          </button>
        </div>

        <div style={{ height: isMobile ? 180 : 220 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <LineChart data={chartData[selectedId] || []} margin={{ top: 5, right: 10, bottom: 5, left: isMobile ? -20 : 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#888' }} interval={isMobile ? 14 : 9} />
              <YAxis tick={{ fontSize: 9, fill: '#888' }} />
              <Tooltip contentStyle={{ background: '#0c0c0e', border: '1px solid rgba(255,255,255,0.15)', fontSize: 10, color: '#fff' }} />
              <Legend wrapperStyle={{ fontSize: 10, color: '#ccc' }} />
              <Line type="monotone" dataKey="PV" stroke="#00ff9d" strokeWidth={2} dot={false} name="PV" />
              <Line type="monotone" dataKey="SP" stroke="#00e5ff" strokeWidth={1.5} dot={false} strokeDasharray="5 3" name="SP" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ fontSize: 10, fontWeight: 600, color: '#00ff9d', textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'monospace' }}>Registros Históricos</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, minWidth: isMobile ? 320 : 'auto', fontFamily: 'monospace' }}>
            <thead>
              <tr style={{ background: 'rgba(0, 255, 157, 0.05)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                {['Timestamp', 'PV', 'SP', 'Qualidade'].map(h => (
                  <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: '#00ff9d' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(chartData[selectedId] || []).slice(-12).reverse().map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'transparent', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '6px 8px', color: '#ccc' }}>{row.time}</td>
                  <td style={{ padding: '6px 8px', fontWeight: 600, color: '#fff' }}>{row.PV}</td>
                  <td style={{ padding: '6px 8px', color: '#aaa' }}>{row.SP}</td>
                  <td style={{ padding: '6px 8px' }}><span style={{ color: '#00ff9d', fontWeight: 600 }}>GOOD</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
