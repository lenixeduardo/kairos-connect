import { useState, useEffect } from 'react';
import { kairosApi } from './lib/kairosApi';

function ActiveOSDot({ count }) {
  const hasActive = count > 0;
  const color = hasActive ? '#ffe500' : '#00ff9d';
  return (
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      background: color, marginRight: 8, flexShrink: 0,
      boxShadow: `0 0 0 2px ${color}33`,
    }} />
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 4, padding: '14px 18px',
      flex: '1 1 110px',
    }}>
      <div style={{
        fontSize: 10, color: '#666', fontFamily: 'monospace',
        textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: color || '#fff', fontFamily: 'monospace' }}>
        {value ?? '—'}
      </div>
    </div>
  );
}

export function KairosMachines() {
  const [machines, setMachines] = useState([]);
  const [maintenanceDue, setMaintenanceDue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!kairosApi.isConfigured()) {
      setError('Configure a variável VITE_KAIROS_API_URL para conectar ao sistema KairOS.');
      setLoading(false);
      return;
    }

    Promise.all([
      kairosApi.getMachines(),
      kairosApi.getMachinesMaintenanceDue().catch(() => []),
    ])
      .then(([m, due]) => {
        setMachines(Array.isArray(m) ? m : []);
        setMaintenanceDue(Array.isArray(due) ? due : []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const dueMachineIds = new Set(maintenanceDue.map(m => m.id));

  const filtered = machines.filter(m =>
    !search ||
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.sector?.toLowerCase().includes(search.toLowerCase()) ||
    m.model?.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = maintenanceDue.length;

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 24, overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: 10, color: '#555', fontFamily: 'monospace', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}>
          KairOS Integration
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0, fontFamily: "'Segoe UI', Arial, sans-serif" }}>
          Máquinas
        </h1>
      </div>

      {/* Error state */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 4, padding: '14px 18px', color: '#ef4444', fontFamily: 'monospace', fontSize: 12,
        }}>
          {error}
        </div>
      )}

      {/* Stats */}
      {!loading && !error && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <StatCard label="Total" value={machines.length} color="#fff" />
          <StatCard label="Manutenção Vencida" value={maintenanceDue.length} color={maintenanceDue.length > 0 ? '#ff9000' : '#00ff9d'} />
        </div>
      )}

      {/* Maintenance alert */}
      {maintenanceDue.length > 0 && !loading && (
        <div style={{
          background: 'rgba(255,144,0,0.06)', border: '1px solid rgba(255,144,0,0.3)',
          borderRadius: 4, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ color: '#ff9000', fontSize: 16 }}>⚠</span>
          <span style={{ color: '#ff9000', fontSize: 12, fontFamily: 'monospace' }}>
            {maintenanceDue.length} máquina(s) com manutenção preventiva vencida
          </span>
        </div>
      )}

      {/* Search */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Buscar por nome, setor ou modelo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            background: '#111', border: '1px solid #2a2a2a', borderRadius: 4,
            color: '#fff', padding: '8px 14px', fontSize: 12, fontFamily: 'monospace',
            outline: 'none', flex: '1 1 200px', maxWidth: 360,
          }}
        />
        {!loading && (
          <span style={{ fontSize: 11, color: '#444', fontFamily: 'monospace' }}>
            {filtered.length} máquina(s)
          </span>
        )}
      </div>

      {/* Table */}
      {loading && (
        <div style={{ color: '#00ff9d', fontFamily: 'monospace', fontSize: 12, padding: '32px 0' }}>
          Carregando máquinas...
        </div>
      )}

      {!loading && !error && (
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 4, overflow: 'hidden',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'monospace' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  {['Máquina', 'Setor', 'Modelo', 'Código', 'Prox. Manutenção', 'Fábrica'].map(h => (
                    <th key={h} style={{
                      padding: '10px 16px', textAlign: 'left', fontSize: 10,
                      color: '#555', fontWeight: 600, textTransform: 'uppercase',
                      letterSpacing: '0.15em', whiteSpace: 'nowrap',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '32px 16px', textAlign: 'center', color: '#444', fontFamily: 'monospace', fontSize: 12 }}>
                      Nenhuma máquina encontrada.
                    </td>
                  </tr>
                ) : filtered.map((m, i) => {
                  const isDue = dueMachineIds.has(m.id);
                  return (
                    <tr key={m.id} style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      background: isDue
                        ? 'rgba(255,144,0,0.03)'
                        : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                    }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <ActiveOSDot count={isDue ? 1 : 0} />
                          <div>
                            <span style={{ color: '#e0e0e0', fontWeight: 600 }}>{m.name}</span>
                            {isDue && (
                              <span style={{
                                marginLeft: 8, fontSize: 9, color: '#ff9000',
                                fontWeight: 700, letterSpacing: '0.1em',
                              }}>
                                MANUTENÇÃO VENCIDA
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#bbb', whiteSpace: 'nowrap' }}>
                        {m.sector || '—'}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#888', whiteSpace: 'nowrap' }}>
                        {m.model || '—'}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#555', fontSize: 11, whiteSpace: 'nowrap' }}>
                        {m.code || '—'}
                      </td>
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', fontSize: 11 }}>
                        <span style={{ color: isDue ? '#ff9000' : '#666' }}>
                          {m.nextPreventiveMaintenance
                            ? new Date(m.nextPreventiveMaintenance).toLocaleDateString('pt-BR')
                            : '—'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#777', whiteSpace: 'nowrap', fontSize: 11 }}>
                        {m.factory || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div style={{
              padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.05)',
              fontSize: 10, color: '#444', fontFamily: 'monospace',
            }}>
              {filtered.length} máquina(s){search && filtered.length !== machines.length ? ` · filtrado de ${machines.length} total` : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
