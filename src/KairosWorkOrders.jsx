import { useState, useEffect, useCallback } from 'react';
import { kairosApi } from './lib/kairosApi';

const STATUS_STYLE = {
  PENDING:     { bg: 'rgba(255,229,0,0.1)',   text: '#ffe500', label: 'PENDENTE'     },
  IN_PROGRESS: { bg: 'rgba(0,229,255,0.1)',   text: '#00e5ff', label: 'EM ANDAMENTO' },
  PAUSED:      { bg: 'rgba(255,144,0,0.1)',   text: '#ff9000', label: 'PAUSADA'      },
  COMPLETED:   { bg: 'rgba(0,255,157,0.1)',   text: '#00ff9d', label: 'CONCLUÍDA'    },
};

const PRIORITY_STYLE = {
  LOW:      { text: '#888888', label: 'BAIXA'   },
  MEDIUM:   { text: '#00e5ff', label: 'MÉDIA'   },
  HIGH:     { text: '#ffe500', label: 'ALTA'    },
  CRITICAL: { text: '#ef4444', label: 'CRÍTICA' },
};

const SERVICE_TYPE_LABEL = {
  ELECTRICAL: 'Elétrica',
  MECHANICAL: 'Mecânica',
  GENERAL:    'Geral',
};

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || { bg: 'rgba(255,255,255,0.05)', text: '#888', label: status };
  return (
    <span style={{
      background: s.bg, color: s.text,
      padding: '2px 8px', borderRadius: 10,
      fontSize: 10, fontWeight: 600, fontFamily: 'monospace',
      whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const p = PRIORITY_STYLE[priority] || { text: '#888', label: priority };
  return (
    <span style={{ color: p.text, fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}>
      {p.label}
    </span>
  );
}

function KpiCard({ label, value, color }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 4, padding: '16px 20px',
      flex: '1 1 110px',
    }}>
      <div style={{
        fontSize: 10, color: '#666', fontFamily: 'monospace',
        textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: color || '#fff', fontFamily: 'monospace' }}>
        {value ?? '—'}
      </div>
    </div>
  );
}

export function KairosWorkOrders() {
  const [workOrders, setWorkOrders] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    if (!kairosApi.isConfigured()) {
      setError('Configure a variável VITE_KAIROS_API_URL para conectar ao sistema KairOS.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    Promise.all([
      kairosApi.getWorkOrders(statusFilter ? { status: statusFilter } : {}),
      kairosApi.getWorkOrderKpis(),
    ])
      .then(([orders, kpiData]) => {
        setWorkOrders(Array.isArray(orders) ? orders : []);
        setKpis(kpiData);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = workOrders.filter(wo =>
    !search ||
    wo.title?.toLowerCase().includes(search.toLowerCase()) ||
    wo.machine?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 24, overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: 10, color: '#555', fontFamily: 'monospace', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}>
          KairOS Integration
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0, fontFamily: "'Segoe UI', Arial, sans-serif" }}>
          Ordens de Serviço
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

      {/* KPI Cards */}
      {kpis && !loading && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <KpiCard label="Total" value={kpis.total} color="#fff" />
          <KpiCard label="Pendentes" value={kpis.pending} color="#ffe500" />
          <KpiCard label="Em Andamento" value={kpis.inProgress} color="#00e5ff" />
          <KpiCard label="Pausadas" value={kpis.paused} color="#ff9000" />
          <KpiCard label="Concluídas" value={kpis.completed} color="#00ff9d" />
          {kpis.avgMttr !== undefined && (
            <KpiCard
              label="MTTR Médio"
              value={kpis.avgMttr != null ? `${Number(kpis.avgMttr).toFixed(1)}h` : '—'}
              color="#00ff9d"
            />
          )}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Buscar por título ou máquina..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            background: '#111', border: '1px solid #2a2a2a', borderRadius: 4,
            color: '#fff', padding: '8px 14px', fontSize: 12, fontFamily: 'monospace',
            outline: 'none', flex: '1 1 200px', maxWidth: 320,
          }}
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{
            background: '#111', border: '1px solid #2a2a2a', borderRadius: 4,
            color: '#fff', padding: '8px 14px', fontSize: 11, fontFamily: 'monospace',
            outline: 'none', cursor: 'pointer',
          }}
        >
          <option value="">Todos os status</option>
          <option value="PENDING">Pendente</option>
          <option value="IN_PROGRESS">Em Andamento</option>
          <option value="PAUSED">Pausada</option>
          <option value="COMPLETED">Concluída</option>
        </select>
        <button
          onClick={load}
          disabled={loading}
          style={{
            background: 'rgba(0,255,157,0.08)', border: '1px solid rgba(0,255,157,0.25)',
            color: '#00ff9d', padding: '8px 16px', borderRadius: 4, fontSize: 11,
            fontFamily: 'monospace', cursor: loading ? 'default' : 'pointer',
            textTransform: 'uppercase', letterSpacing: '0.1em', opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? 'Carregando...' : 'Atualizar'}
        </button>
      </div>

      {/* Table */}
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
                  {['Título / Descrição', 'Máquina', 'Status', 'Prioridade', 'Tipo', 'Responsável', 'Abertura'].map(h => (
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
                    <td colSpan={7} style={{ padding: '32px 16px', textAlign: 'center', color: '#444', fontFamily: 'monospace', fontSize: 12 }}>
                      Nenhuma ordem de serviço encontrada.
                    </td>
                  </tr>
                ) : filtered.map((wo, i) => (
                  <tr key={wo.id} style={{
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                    transition: 'background 0.1s',
                  }}>
                    <td style={{ padding: '12px 16px', maxWidth: 220 }}>
                      <div style={{ color: '#e0e0e0', fontWeight: 600 }}>{wo.title}</div>
                      {wo.description && (
                        <div style={{ fontSize: 10, color: '#555', marginTop: 3 }}>
                          {wo.description.slice(0, 70)}{wo.description.length > 70 ? '…' : ''}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#bbb', whiteSpace: 'nowrap' }}>
                      <div>{wo.machine?.name || '—'}</div>
                      {wo.machine?.sector && (
                        <div style={{ fontSize: 10, color: '#555' }}>{wo.machine.sector}</div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <StatusBadge status={wo.status} />
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <PriorityBadge priority={wo.priority} />
                    </td>
                    <td style={{ padding: '12px 16px', color: '#777', whiteSpace: 'nowrap', fontSize: 11 }}>
                      {SERVICE_TYPE_LABEL[wo.serviceType] || wo.serviceType || '—'}
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', fontSize: 11 }}>
                      {wo.assignedTo?.name
                        ? <span style={{ color: '#bbb' }}>{wo.assignedTo.name}</span>
                        : <span style={{ color: '#444' }}>Não atribuído</span>}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#555', whiteSpace: 'nowrap', fontSize: 11 }}>
                      {wo.createdAt ? new Date(wo.createdAt).toLocaleDateString('pt-BR') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div style={{
              padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.05)',
              fontSize: 10, color: '#444', fontFamily: 'monospace',
              display: 'flex', justifyContent: 'space-between',
            }}>
              <span>{filtered.length} ordem(ns) de serviço</span>
              {search && filtered.length !== workOrders.length && (
                <span>filtrado de {workOrders.length} total</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
