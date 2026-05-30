import { useState, useRef } from 'react';
import { LayoutDashboard, Activity, Settings, ShieldAlert, Cpu, Terminal, LogOut, ChevronRight, BarChart3, Sliders, Layout, List, ClipboardList, Factory, Usb, Camera, ChevronDown } from 'lucide-react';

const SidebarItem = ({
  icon,
  label,
  active,
  alert,
  onClick
}) => (
  <div
    onClick={onClick}
    className={`group flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200 border-l-2 ${
      active
        ? 'bg-primary/5 border-primary text-primary'
        : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
    }`}
  >
    <div className={active ? 'neon-text-primary' : 'group-hover:text-gray-300'}>
      {icon}
    </div>
    <span className="text-sm font-medium tracking-wide uppercase flex-1">{label}</span>
    {alert && alert > 0 ? (
      <span className="bg-red-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-sm mono">
        {alert}
      </span>
    ) : null}
    {active && <ChevronRight className="w-4 h-4 opacity-50" />}
  </div>
);

const ESFERAS = [
  'Advogado(a) Geral',
  'Direito Trabalhista',
  'Direito Civil',
  'Direito de Família',
  'Direito Penal',
  'Direito Previdenciário',
  'Direito Tributário',
  'Direito Empresarial',
  'Direito Imobiliário',
  'Direito do Consumidor',
  'Direito Ambiental',
  'Direito Administrativo',
];

function ProfileSection() {
  const [photo, setPhoto] = useState(() => localStorage.getItem('kairos_profile_photo') || null);
  const [esfera, setEsfera] = useState(() => localStorage.getItem('kairos_profile_esfera') || '');
  const [editingEsfera, setEditingEsfera] = useState(false);
  const fileRef = useRef(null);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('A foto deve ter no máximo 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setPhoto(dataUrl);
      try { localStorage.setItem('kairos_profile_photo', dataUrl); } catch { /* quota exceeded */ }
    };
    reader.readAsDataURL(file);
  };

  const handleEsferaChange = (e) => {
    setEsfera(e.target.value);
    localStorage.setItem('kairos_profile_esfera', e.target.value);
    setEditingEsfera(false);
  };

  const userName = (() => {
    try { return JSON.parse(localStorage.getItem('kairos_user') || '{}')?.name || 'Advogado(a)'; } catch { return 'Advogado(a)'; }
  })();

  return (
    <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 10 }}>
      {/* Avatar */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: photo ? 'transparent' : 'rgba(0,255,157,0.15)',
            border: '1.5px solid rgba(0,255,157,0.4)',
            overflow: 'hidden', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          title="Alterar foto de perfil"
        >
          {photo
            ? <img src={photo} alt="Foto de perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <Camera size={16} color="#00ff9d" />
          }
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {userName}
        </div>
        {editingEsfera ? (
          <select
            autoFocus
            defaultValue={esfera}
            onChange={handleEsferaChange}
            onBlur={() => setEditingEsfera(false)}
            style={{
              background: '#0c0c0e', border: '1px solid rgba(0,255,157,0.4)',
              borderRadius: 3, color: '#00ff9d', fontSize: 10, padding: '2px 4px',
              width: '100%', marginTop: 2, cursor: 'pointer',
            }}
          >
            <option value="">Selecione a esfera...</option>
            {ESFERAS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        ) : (
          <button
            onClick={() => setEditingEsfera(true)}
            style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              fontSize: 10, color: esfera ? '#00ff9d' : '#4a5050',
              fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 3,
              marginTop: 2,
            }}
            title="Clique para alterar sua esfera"
          >
            {esfera || 'Definir esfera…'}
            <ChevronDown size={10} />
          </button>
        )}
      </div>
    </div>
  );
}

export const AppSidebar = ({
  activeTab = 'dashboard',
  onTab,
  alarmCount = 0,
  onLogout
}) => {
  let activeLabel = 'Dashboard';
  if (activeTab === 'analytics') activeLabel = 'Analytics';
  if (activeTab === 'alarms') activeLabel = 'Alarms';
  if (activeTab === 'datalog') activeLabel = 'Logs';
  if (activeTab === 'configuration') activeLabel = 'Config';
  if (activeTab === 'instruments') activeLabel = 'Instruments';
  if (activeTab === 'calibration') activeLabel = 'Calibration';
  if (activeTab === 'templates') activeLabel = 'Templates';
  if (activeTab === 'reports') activeLabel = 'Reports';
  if (activeTab === 'workorders') activeLabel = 'Ordens de Serviço';
  if (activeTab === 'machines') activeLabel = 'Máquinas';
  if (activeTab === 'portus') activeLabel = 'Portus';

  return (
    <aside className="w-64 h-screen bg-surface border-r border-white/5 flex flex-col glass-panel sticky top-0 shrink-0">
      {/* Brand */}
      <div className="p-6 flex items-center gap-3 border-b border-white/5">
        <div className="w-8 h-8 bg-primary/20 border border-primary flex items-center justify-center rounded-sm">
          <Cpu className="text-primary w-5 h-5" />
        </div>
        <div>
          <h1 className="text-white font-bold tracking-tighter text-lg leading-none">KAIROS</h1>
          <span className="text-[10px] text-primary/70 tracking-[0.2em] mono uppercase">Connect v2.4</span>
        </div>
      </div>

      <ProfileSection />

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="px-4 mb-2 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
          Main Console
        </div>
        <SidebarItem
          icon={<LayoutDashboard size={20} />}
          label="Dashboard"
          active={activeLabel === 'Dashboard'}
          onClick={() => onTab?.('dashboard')}
        />
        <SidebarItem
          icon={<Activity size={20} />}
          label="Analytics"
          active={activeLabel === 'Analytics'}
          onClick={() => onTab?.('analytics')}
        />
        <SidebarItem
          icon={<ShieldAlert size={20} />}
          label="Alarms"
          active={activeLabel === 'Alarms'}
          alert={alarmCount}
          onClick={() => onTab?.('alarms')}
        />
        <SidebarItem
          icon={<Terminal size={20} />}
          label="Logs"
          active={activeLabel === 'Logs'}
          onClick={() => onTab?.('datalog')}
        />
        <SidebarItem
          icon={<BarChart3 size={20} />}
          label="Reports"
          active={activeLabel === 'Reports'}
          onClick={() => onTab?.('reports')}
        />

        <div className="mt-8 px-4 mb-2 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
          System
        </div>
        <SidebarItem
          icon={<List size={20} />}
          label="Instruments"
          active={activeLabel === 'Instruments'}
          onClick={() => onTab?.('instruments')}
        />
        <SidebarItem
          icon={<Usb size={20} />}
          label="Portus"
          active={activeLabel === 'Portus'}
          onClick={() => onTab?.('portus')}
        />
        <SidebarItem
          icon={<Settings size={20} />}
          label="Config"
          active={activeLabel === 'Config'}
          onClick={() => onTab?.('configuration')}
        />
        <SidebarItem
          icon={<Sliders size={20} />}
          label="Calibration"
          active={activeLabel === 'Calibration'}
          onClick={() => onTab?.('calibration')}
        />
        <SidebarItem
          icon={<Layout size={20} />}
          label="Templates"
          active={activeLabel === 'Templates'}
          onClick={() => onTab?.('templates')}
        />

        <div className="mt-8 px-4 mb-2 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
          KairOS
        </div>
        <SidebarItem
          icon={<ClipboardList size={20} />}
          label="Ordens de Serviço"
          active={activeLabel === 'Ordens de Serviço'}
          onClick={() => onTab?.('workorders')}
        />
        <SidebarItem
          icon={<Factory size={20} />}
          label="Máquinas"
          active={activeLabel === 'Máquinas'}
          onClick={() => onTab?.('machines')}
        />
      </nav>

      {/* Status Footer */}
      <div className="p-4 border-t border-white/5 bg-black/40">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_#00ff9d]" />
          </div>
          <span className="text-[10px] text-gray-400 mono">NODE-ALPHA: CONNECTED</span>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-white transition-colors cursor-pointer"
        >
          <LogOut size={14} />
          <span>EXIT SESSION</span>
        </button>

        <p style={{ fontSize: 9, color: '#2a2a2a', textAlign: 'center', marginTop: 8, fontFamily: 'monospace', letterSpacing: '0.1em' }}>
          © EduDev 2026
        </p>
      </div>
    </aside>
  );
};
