import { useState, useEffect, useRef, useCallback } from 'react';
import { Usb, Play, Square, Settings, Zap, Clock, AlertTriangle, CheckCircle, Circle, RefreshCw, Trash2, X } from 'lucide-react';

const BAUD_RATES = [1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200];

const DEFAULT_SLOT = {
  name: '',
  baudRate: 9600,
  dataBits: 8,
  stopBits: 1,
  parity: 'none',
  parseRegex: '',
  status: 'idle', // idle | connecting | open | receiving | error | disconnected
  lastRaw: '',
  lastParsed: '',
  lastTs: null,
};

const STATUS_COLORS = {
  idle:         { color: '#6b7280', label: 'Idle' },
  connecting:   { color: '#f59e0b', label: 'Conectando...' },
  open:         { color: '#3b82f6', label: 'Conectado' },
  receiving:    { color: '#00ff9d', label: 'Recebendo' },
  error:        { color: '#ef4444', label: 'Erro' },
  disconnected: { color: '#6b7280', label: 'Desconectado' },
};

function applyRegex(raw, regexStr) {
  if (!regexStr) return raw;
  try {
    const rx = new RegExp(regexStr);
    const match = raw.match(rx);
    if (!match) return raw;
    // Return first capture group if present, else full match
    return match[1] !== undefined ? match[1] : match[0];
  } catch {
    return raw;
  }
}

function StatusDot({ status }) {
  const cfg = STATUS_COLORS[status] || STATUS_COLORS.idle;
  const pulse = status === 'receiving' || status === 'connecting';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{
        display: 'inline-block', width: 8, height: 8,
        borderRadius: '50%', background: cfg.color,
        boxShadow: pulse ? `0 0 8px ${cfg.color}` : 'none',
        animation: pulse ? 'pulse 1.5s ease-in-out infinite' : 'none',
      }} />
      <span style={{ color: cfg.color, fontSize: 11, fontFamily: 'monospace' }}>{cfg.label}</span>
    </span>
  );
}

function SlotConfig({ slot, onClose, onChange }) {
  const [local, setLocal] = useState({ ...slot });
  const update = (k, v) => setLocal(prev => ({ ...prev, [k]: v }));
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <div style={{
        background: '#111114', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 8, padding: 24, width: 360, maxWidth: '90vw',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ color: '#00ff9d', fontWeight: 700, fontSize: 14, letterSpacing: 2 }}>CONFIGURAR SLOT</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}><X size={16} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ color: '#9ca3af', fontSize: 12 }}>Nome do Equipamento
            <input value={local.name} onChange={e => update('name', e.target.value)}
              style={{ display: 'block', width: '100%', marginTop: 4, background: '#0c0c0e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, color: '#fff', padding: '6px 10px', fontSize: 13 }} />
          </label>
          <label style={{ color: '#9ca3af', fontSize: 12 }}>Baud Rate
            <select value={local.baudRate} onChange={e => update('baudRate', Number(e.target.value))}
              style={{ display: 'block', width: '100%', marginTop: 4, background: '#0c0c0e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, color: '#fff', padding: '6px 10px', fontSize: 13 }}>
              {BAUD_RATES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <label style={{ color: '#9ca3af', fontSize: 12 }}>Data Bits
              <select value={local.dataBits} onChange={e => update('dataBits', Number(e.target.value))}
                style={{ display: 'block', width: '100%', marginTop: 4, background: '#0c0c0e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, color: '#fff', padding: '6px 8px', fontSize: 12 }}>
                {[5,6,7,8].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>
            <label style={{ color: '#9ca3af', fontSize: 12 }}>Stop Bits
              <select value={local.stopBits} onChange={e => update('stopBits', Number(e.target.value))}
                style={{ display: 'block', width: '100%', marginTop: 4, background: '#0c0c0e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, color: '#fff', padding: '6px 8px', fontSize: 12 }}>
                {[1,2].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>
            <label style={{ color: '#9ca3af', fontSize: 12 }}>Paridade
              <select value={local.parity} onChange={e => update('parity', e.target.value)}
                style={{ display: 'block', width: '100%', marginTop: 4, background: '#0c0c0e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, color: '#fff', padding: '6px 8px', fontSize: 12 }}>
                <option value="none">None</option>
                <option value="even">Even</option>
                <option value="odd">Odd</option>
              </select>
            </label>
          </div>
          <label style={{ color: '#9ca3af', fontSize: 12 }}>Regex de Parse (opcional)
            <input value={local.parseRegex} onChange={e => update('parseRegex', e.target.value)}
              placeholder="ex: ([\\d.]+)"
              style={{ display: 'block', width: '100%', marginTop: 4, background: '#0c0c0e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, color: '#00ff9d', padding: '6px 10px', fontSize: 13, fontFamily: 'monospace' }} />
          </label>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af', padding: '7px 16px', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
          <button onClick={() => { onChange(local); onClose(); }}
            style={{ background: '#00ff9d22', border: '1px solid #00ff9d', color: '#00ff9d', padding: '7px 16px', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Salvar</button>
        </div>
      </div>
    </div>
  );
}

export function Portus() {
  const [slots, setSlots] = useState(() =>
    Array.from({ length: 6 }, (_, i) => ({
      ...DEFAULT_SLOT,
      name: `Equipamento ${i + 1}`,
      id: i,
    }))
  );
  const [capturing, setCapturing] = useState(false);
  const [timeoutSecs, setTimeoutSecs] = useState(30);
  const [remaining, setRemaining] = useState(0);
  const [readings, setReadings] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [configOpen, setConfigOpen] = useState(null);

  // Refs for ports/readers (indexed by slot id) to avoid stale closures
  const portRefs = useRef({});
  const readerRefs = useRef({});
  const timerRef = useRef(null);

  const updateSlot = useCallback((idx, patch) => {
    setSlots(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s));
  }, []);

  const connectSlot = useCallback(async (idx) => {
    if (!('serial' in navigator)) {
      updateSlot(idx, { status: 'error', lastRaw: 'Web Serial API não suportada neste browser.' });
      return;
    }
    updateSlot(idx, { status: 'connecting' });
    try {
      const port = await navigator.serial.requestPort();
      portRefs.current[idx] = port;
      const slot = slots[idx];
      await port.open({
        baudRate: slot.baudRate,
        dataBits: slot.dataBits,
        stopBits: slot.stopBits,
        parity: slot.parity,
      });
      updateSlot(idx, { status: 'open' });
      // Start reading loop
      const reader = port.readable.getReader();
      readerRefs.current[idx] = reader;
      const decoder = new TextDecoder();
      let buffer = '';
      const read = async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split(/\r?\n/);
            buffer = lines.pop() ?? '';
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;
              const currentSlot = slots[idx];
              const parsed = applyRegex(trimmed, currentSlot.parseRegex);
              const ts = new Date().toISOString();
              updateSlot(idx, { status: 'receiving', lastRaw: trimmed, lastParsed: parsed, lastTs: ts });
              setReadings(prev => [
                { slotId: idx, slotName: currentSlot.name, raw: trimmed, parsed, ts },
                ...prev,
              ].slice(0, 100));
            }
          }
        } catch (err) {
          if (err.name !== 'AbortError') {
            updateSlot(idx, { status: 'error', lastRaw: err.message });
          }
        } finally {
          updateSlot(idx, { status: 'disconnected' });
        }
      };
      read();
    } catch (err) {
      if (err.name === 'NotFoundError' || err.name === 'AbortError') {
        updateSlot(idx, { status: 'idle' });
      } else {
        updateSlot(idx, { status: 'error', lastRaw: err.message });
      }
    }
  }, [slots, updateSlot]);

  const disconnectSlot = useCallback(async (idx) => {
    try {
      const reader = readerRefs.current[idx];
      if (reader) {
        await reader.cancel();
        readerRefs.current[idx] = null;
      }
      const port = portRefs.current[idx];
      if (port) {
        await port.close();
        portRefs.current[idx] = null;
      }
    } catch (e) {
      // ignore close errors
    }
    updateSlot(idx, { status: 'disconnected' });
  }, [updateSlot]);

  const startCapture = useCallback(() => {
    setCapturing(true);
    setRemaining(timeoutSecs);
    setReadings([]);
    timerRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setCapturing(false);
          setSessions(s => [{ id: Date.now(), ts: new Date().toISOString(), count: 0 }, ...s]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [timeoutSecs]);

  const cancelCapture = useCallback(() => {
    clearInterval(timerRef.current);
    setCapturing(false);
    setRemaining(0);
    setSessions(prev => [
      { id: Date.now(), ts: new Date().toISOString(), count: readings.length },
      ...prev,
    ]);
  }, [readings.length]);

  // Update session reading count when readings change while capturing
  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const panel = {
    background: '#111114',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
    padding: 16,
  };

  const isConnected = (s) => s.status === 'open' || s.status === 'receiving';

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto', color: '#e5e7eb' }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Usb size={28} style={{ color: '#00ff9d' }} />
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: 3, color: '#00ff9d', textTransform: 'uppercase' }}>PORTUS</h2>
          <span style={{ fontSize: 11, color: '#6b7280', fontFamily: 'monospace', letterSpacing: 2 }}>USB SERIAL PORT INTEGRATION</span>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 11, color: '#4b5563', fontFamily: 'monospace' }}>
          {'serial' in navigator ? '✓ Web Serial API disponível' : '✗ Web Serial API não suportada'}
        </div>
      </div>

      {/* Capture Session Panel */}
      <div style={{ ...panel, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <Zap size={18} style={{ color: '#00ff9d' }} />
        <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: 2, color: '#00ff9d' }}>SESSÃO DE CAPTURA</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>Duração (s):</span>
          <input
            type="number" min={5} max={3600} value={timeoutSecs}
            onChange={e => setTimeoutSecs(Number(e.target.value))}
            disabled={capturing}
            style={{ width: 70, background: '#0c0c0e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, color: '#fff', padding: '4px 8px', fontSize: 13, fontFamily: 'monospace' }}
          />
        </div>
        {!capturing ? (
          <button onClick={startCapture} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#00ff9d22', border: '1px solid #00ff9d', color: '#00ff9d',
            padding: '7px 18px', borderRadius: 4, cursor: 'pointer', fontWeight: 700, fontSize: 13,
          }}>
            <Play size={14} /> Iniciar Captura
          </button>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f59e0b', fontFamily: 'monospace', fontSize: 14, fontWeight: 700 }}>
              <Clock size={14} /> {remaining}s
            </div>
            <button onClick={cancelCapture} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#ef444422', border: '1px solid #ef4444', color: '#ef4444',
              padding: '7px 18px', borderRadius: 4, cursor: 'pointer', fontWeight: 700, fontSize: 13,
            }}>
              <Square size={14} /> Cancelar
            </button>
          </>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#4b5563', fontFamily: 'monospace' }}>
          {readings.length} leituras na sessão atual
        </span>
      </div>

      {/* Slots Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, marginBottom: 24 }}>
        {slots.map((slot, idx) => (
          <div key={idx} style={{
            ...panel,
            borderColor: isConnected(slot) ? 'rgba(0,255,157,0.2)' : 'rgba(255,255,255,0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#4b5563', background: '#0c0c0e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 3, padding: '2px 7px' }}>SLOT {idx + 1}</span>
              <span style={{ fontWeight: 700, fontSize: 13, color: '#e5e7eb', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{slot.name}</span>
              <button onClick={() => setConfigOpen(idx)} title="Configurar" style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 2 }}>
                <Settings size={14} />
              </button>
            </div>

            <div style={{ marginBottom: 10 }}>
              <StatusDot status={slot.status} />
            </div>

            {slot.lastRaw && (
              <div style={{ marginBottom: 10, background: '#0c0c0e', borderRadius: 4, padding: '8px 10px' }}>
                <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 4, letterSpacing: 1 }}>ÚLTIMA LEITURA</div>
                <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#9ca3af', marginBottom: 2 }}>RAW: {slot.lastRaw}</div>
                {slot.lastParsed !== slot.lastRaw && (
                  <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#00ff9d', fontWeight: 700 }}>→ {slot.lastParsed}</div>
                )}
                {slot.lastTs && (
                  <div style={{ fontSize: 10, color: '#374151', marginTop: 4, fontFamily: 'monospace' }}>{slot.lastTs}</div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              {!isConnected(slot) ? (
                <button onClick={() => connectSlot(idx)} disabled={slot.status === 'connecting'} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  background: '#00ff9d15', border: '1px solid #00ff9d44', color: '#00ff9d',
                  padding: '6px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                  opacity: slot.status === 'connecting' ? 0.5 : 1,
                }}>
                  <Usb size={13} /> Conectar
                </button>
              ) : (
                <button onClick={() => disconnectSlot(idx)} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  background: '#ef444415', border: '1px solid #ef444444', color: '#ef4444',
                  padding: '6px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                }}>
                  <X size={13} /> Desconectar
                </button>
              )}
            </div>

            <div style={{ marginTop: 8, fontSize: 10, color: '#374151', fontFamily: 'monospace' }}>
              {slot.baudRate}bps · {slot.dataBits}D · {slot.stopBits}S · {slot.parity}
              {slot.parseRegex && <span style={{ color: '#6b7280' }}> · regex: {slot.parseRegex}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Readings Table */}
      <div style={{ ...panel, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <CheckCircle size={16} style={{ color: '#00ff9d' }} />
          <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: 2, color: '#00ff9d' }}>LEITURAS DA SESSÃO</span>
          {readings.length > 0 && (
            <button onClick={() => setReadings([])} title="Limpar" style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
              <Trash2 size={14} />
            </button>
          )}
        </div>
        {readings.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#374151', fontSize: 13, padding: '24px 0', fontFamily: 'monospace' }}>
            Nenhuma leitura ainda. Conecte um slot e inicie a captura.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'monospace' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  {['Slot', 'Equipamento', 'Valor Raw', 'Valor Parsed', 'Timestamp'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: '#4b5563', fontWeight: 700, letterSpacing: 1, fontSize: 10, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {readings.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td style={{ padding: '5px 10px', color: '#6b7280' }}>#{r.slotId + 1}</td>
                    <td style={{ padding: '5px 10px', color: '#9ca3af' }}>{r.slotName}</td>
                    <td style={{ padding: '5px 10px', color: '#6b7280' }}>{r.raw}</td>
                    <td style={{ padding: '5px 10px', color: '#00ff9d', fontWeight: 700 }}>{r.parsed}</td>
                    <td style={{ padding: '5px 10px', color: '#374151', fontSize: 10 }}>{r.ts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Session History */}
      <div style={{ ...panel }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <RefreshCw size={16} style={{ color: '#6b7280' }} />
          <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: 2, color: '#9ca3af' }}>HISTÓRICO DE SESSÕES</span>
        </div>
        {sessions.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#374151', fontSize: 13, padding: '16px 0', fontFamily: 'monospace' }}>Nenhuma sessão registrada ainda.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sessions.map((s, i) => (
              <div key={s.id} style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '7px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 4, fontFamily: 'monospace', fontSize: 12 }}>
                <span style={{ color: '#4b5563' }}>#{sessions.length - i}</span>
                <span style={{ color: '#6b7280' }}>{s.ts}</span>
                <span style={{ color: '#00ff9d', fontWeight: 700, marginLeft: 'auto' }}>{s.count} leituras</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Config Modal */}
      {configOpen !== null && (
        <SlotConfig
          slot={slots[configOpen]}
          onClose={() => setConfigOpen(null)}
          onChange={(updated) => {
            setSlots(prev => prev.map((s, i) => i === configOpen ? { ...s, ...updated } : s));
          }}
        />
      )}
    </div>
  );
}
