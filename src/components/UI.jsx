import { useState, useEffect } from 'react';

// ─── TOKENS ──────────────────────────────────────────────────────────────────
export const STATUS_COLOR = {
  online:  { bg: 'rgba(0, 255, 157, 0.1)', text: '#00ff9d', dot: '#00ff9d' },
  offline: { bg: 'rgba(255, 255, 255, 0.05)', text: '#888888', dot: '#888888' },
  warning: { bg: 'rgba(255, 229, 0, 0.1)', text: '#ffe500', dot: '#ffe500' },
  error:   { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', dot: '#ef4444' },
};

export const EVENT_COLOR = {
  info:    { border: 'rgba(0, 229, 255, 0.3)', bg: 'rgba(0, 229, 255, 0.05)', text: '#00e5ff' },
  warning: { border: 'rgba(255, 229, 0, 0.3)', bg: 'rgba(255, 229, 0, 0.05)', text: '#ffe500' },
  error:   { border: 'rgba(239, 68, 68, 0.3)', bg: 'rgba(239, 68, 68, 0.05)', text: '#ef4444' },
};

// ─── HOOKS ───────────────────────────────────────────────────────────────────
export function useIsMobile() {
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return mobile;
}

// ─── ATOMS ───────────────────────────────────────────────────────────────────
export function StatusDot({ status }) {
  const c = STATUS_COLOR[status];
  return (
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      background: c.dot, marginRight: 5, flexShrink: 0,
      boxShadow: status === 'online' ? `0 0 0 2px ${c.dot}33` : 'none',
    }} />
  );
}

export function Badge({ status }) {
  const c = STATUS_COLOR[status];
  return (
    <span style={{ background: c.bg, color: c.text, padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600 }}>
      {status.toUpperCase()}
    </span>
  );
}

// ─── GAUGE ───────────────────────────────────────────────────────────────────
export function GaugeMeter({ value, min, max, unit, label, size = 120 }) {
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <svg width={size} height={size} style={{ overflow: 'visible' }}>
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
      <span style={{ fontSize: 11, color: '#888', fontFamily: 'monospace' }}>{label}</span>
    </div>
  );
}

// ─── THERMOMETER ─────────────────────────────────────────────────────────────
export function Thermometer({ value, min, max }) {
  const pct = Math.min(Math.max((value - min) / (max - min), 0), 1);
  return (
    <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 4, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
      <div style={{ fontSize: 10, color: '#888', marginBottom: 4, display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace' }}>
        <span>{min}°</span><span>{max}°</span>
      </div>
      <div style={{ position: 'relative', height: 24, background: 'linear-gradient(to right,#1565c0,#00e5ff,#00ff9d,#ffe500,#ef4444)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: 0, bottom: 0, left: `${pct * 100}%`,
          width: 4, background: '#fff', borderRadius: 2,
          boxShadow: '0 0 6px rgba(0,0,0,0.5)', transform: 'translateX(-50%)',
        }} />
      </div>
      <div style={{ marginTop: 6, textAlign: 'center', fontWeight: 'bold', fontSize: 14, color: '#00ff9d', fontFamily: 'monospace' }}>{value} °C</div>
    </div>
  );
}

// ─── DRAWER (mobile sidebar) ─────────────────────────────────────────────────
export function Drawer({ open, onClose, title, children }) {
  return (
    <>
      {open && (
        <div onClick={onClose} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40,
          backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)'
        }} />
      )}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: 260,
        background: '#0c0c0e', borderRight: '1px solid rgba(255, 255, 255, 0.08)', zIndex: 50,
        boxShadow: '4px 0 24px rgba(0,0,0,.5)',
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s ease', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, color: '#00ff9d' }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', background: '#0c0c0e' }}>{children}</div>
      </div>
    </>
  );
}

// ─── INSTRUMENT LIST ITEM ────────────────────────────────────────────────────
export function InstItem({ inst, selected, onClick }) {
  return (
    <div onClick={onClick} style={{
      padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)',
      background: selected ? 'rgba(0, 255, 157, 0.05)' : 'transparent',
      borderLeft: selected ? '3px solid #00ff9d' : '3px solid transparent',
      transition: 'all 0.15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
        <StatusDot status={inst.status} />
        <span style={{ fontSize: 12, fontWeight: 600, color: selected ? '#00ff9d' : '#ffffff' }}>{inst.name}</span>
      </div>
      <div style={{ fontSize: 10, color: selected ? 'rgba(0, 255, 157, 0.6)' : '#888', paddingLeft: 13 }}>{inst.model} · {inst.type}</div>
    </div>
  );
}

// ─── SECTION HEADER ──────────────────────────────────────────────────────────
export function SectionHeader({ title, onMenuClick, isMobile }) {
  return (
    <div style={{ padding: '8px 12px', fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span>{title}</span>
      {isMobile && onMenuClick && (
        <button onClick={onMenuClick} style={{ background: 'rgba(0, 255, 157, 0.1)', color: '#00ff9d', border: '1px solid rgba(0, 255, 157, 0.3)', borderRadius: 3, padding: '3px 8px', fontSize: 10, cursor: 'pointer', fontWeight: 'bold' }}>
          ☰ Trocar
        </button>
      )}
    </div>
  );
}

// ─── TOOLBAR ─────────────────────────────────────────────────────────────────
export function Toolbar({ recording, onToggleRecord, isMobile, onMenuOpen }) {
  return (
    <div style={{ background: '#0c0c0e', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'stretch', height: 44, userSelect: 'none', flexShrink: 0 }}>
      {isMobile && (
        <button onClick={onMenuOpen} style={{ background: 'none', border: 'none', borderRight: '1px solid rgba(255, 255, 255, 0.08)', padding: '0 14px', cursor: 'pointer', fontSize: 18, color: '#00ff9d' }}>
          ☰
        </button>
      )}
      <div style={{ color: '#fff', padding: '0 14px', display: 'flex', alignItems: 'center', fontWeight: 'bold', fontSize: isMobile ? 11 : 13, letterSpacing: 1.5 }}>
        KairOS <span style={{ color: '#00ff9d', marginLeft: 4 }}>CONNECT</span>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px' }}>
        <button onClick={onToggleRecord} style={{
          background: recording ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.05)',
          color: recording ? '#ef4444' : '#ccc',
          border: `1px solid ${recording ? '#ef4444' : 'rgba(255, 255, 255, 0.15)'}`,
          borderRadius: 3, padding: '4px 12px',
          fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
          boxShadow: recording ? '0 0 8px rgba(239, 68, 68, 0.2)' : 'none'
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: recording ? '#ef4444' : '#888', display: 'inline-block' }} />
          {recording ? 'GRAVANDO' : 'INICIAR REC'}
        </button>
      </div>
    </div>
  );
}

// ─── BOTTOM NAV (mobile) ─────────────────────────────────────────────────────
export const NAV_TABS = [
  { id: 'dashboard',     icon: '⊞', label: 'Dashboard'  },
  { id: 'instruments',   icon: '⚙', label: 'Instrum.'   },
  { id: 'configuration', icon: '✎', label: 'Config.'    },
  { id: 'calibration',   icon: '◎', label: 'Calibração' },
  { id: 'templates',     icon: '☰', label: 'Templates'  },
  { id: 'datalog',       icon: '▶', label: 'Registro'   },
  { id: 'reports',       icon: '📊', label: 'Relatórios' },
  { id: 'workorders',    icon: '📋', label: 'OS'         },
  { id: 'machines',      icon: '🏭', label: 'Máquinas'   },
  { id: 'portus',        icon: '🔌', label: 'Portus'     },
];

export function BottomNav({ activeTab, onTab }) {
  return (
    <div style={{
      display: 'flex', overflowX: 'auto', background: '#0c0c0e',
      borderTop: '1px solid rgba(255, 255, 255, 0.08)', flexShrink: 0,
      scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      {NAV_TABS.map(t => {
        const isActive = activeTab === t.id;
        return (
          <button key={t.id} onClick={() => onTab(t.id)} style={{
            flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 2, padding: '8px 14px', border: 'none', cursor: 'pointer',
            background: isActive ? 'rgba(0, 255, 157, 0.05)' : 'transparent',
            borderTop: isActive ? '2px solid #00ff9d' : '2px solid transparent',
            color: isActive ? '#00ff9d' : '#888',
            fontSize: 9, fontWeight: isActive ? 700 : 400,
            minWidth: 70, transition: 'all 0.15s',
            textTransform: 'uppercase',
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
export function StatusBar({ instruments }) {
  const online  = instruments.filter(i => i.status === 'online').length;
  const warning = instruments.filter(i => i.status === 'warning').length;
  const offline = instruments.filter(i => i.status === 'offline').length;
  const now = new Date().toLocaleString('pt-BR');
  return (
    <div style={{ background: '#060608', color: '#888', borderTop: '1px solid rgba(255, 255, 255, 0.05)', minHeight: 22, display: 'flex', alignItems: 'center', padding: '2px 10px', fontSize: 9, gap: 8, justifyContent: 'space-between', flexShrink: 0, fontFamily: 'monospace', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ whiteSpace: 'nowrap' }}>STATUS: <span style={{ color: '#00ff9d', fontWeight: 'bold' }}>OPER.</span></span>
        <span style={{ color: '#00ff9d', whiteSpace: 'nowrap' }}>● {online} ON</span>
        <span style={{ color: '#ffe500', whiteSpace: 'nowrap' }}>▲ {warning} WARN</span>
        <span style={{ color: '#ef4444', whiteSpace: 'nowrap' }}>✖ {offline} OFF</span>
      </div>
      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '45%' }}>{now}</span>
    </div>
  );
}
