import { LayoutDashboard, Activity, Settings, ShieldAlert, Cpu, Terminal, LogOut, ChevronRight, BarChart3, Sliders, Layout, List } from 'lucide-react';

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
      </div>
    </aside>
  );
};

