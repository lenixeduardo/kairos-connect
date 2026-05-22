import {
  LayoutDashboard,
  Activity,
  Bell,
  Database,
  Sliders,
  Target,
  Clipboard,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const AppSidebar = ({ activeTab, onTab }) => {
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'instruments', icon: Activity, label: 'Instrumentos' },
    { id: 'configuration', icon: Sliders, label: 'Configuração' },
    { id: 'calibration', icon: Target, label: 'Calibração' },
    { id: 'templates', icon: Clipboard, label: 'Templates' },
    { id: 'datalog', icon: Database, label: 'Log de Dados' },
    { id: 'reports', icon: BarChart3, label: 'Relatórios' }
  ];

  return (
    <aside className="w-[64px] border-r border-white/5 flex flex-col items-center py-6 gap-8 bg-black shrink-0">
      <div className="w-10 h-10 bg-primary/10 border border-primary/20 flex items-center justify-center rounded-sm">
        <Activity className="w-6 h-6 text-primary shadow-[0_0_10px_rgba(0,255,157,0.5)]" />
      </div>
      
      <nav className="flex flex-col gap-6 flex-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTab(item.id)}
              className={cn(
                "p-2.5 transition-all duration-200 group relative cursor-pointer",
                isActive 
                  ? "text-primary bg-primary/5 rounded-sm border border-primary/20 shadow-[0_0_15px_rgba(0,255,157,0.1)]" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              title={item.label}
            >
              <item.icon className="w-5 h-5" />
              {isActive && (
                <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-primary shadow-[0_0_10px_rgba(0,255,157,1)]" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="flex flex-col gap-4 mt-auto">
        <button className="p-2.5 text-muted-foreground hover:text-foreground relative cursor-pointer">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </button>
      </div>
    </aside>
  );
};
