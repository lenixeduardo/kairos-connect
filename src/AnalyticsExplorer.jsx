import * as React from 'react';
import { Download, Calendar, Filter, ChevronDown, Search, History as HistoryIcon } from 'lucide-react';
import { AppSidebar } from './AppSidebar';
import { MonitoringChart } from './MonitoringChart';
import { cn } from '@/lib/utils';

const srOnlyStyle = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: '0'
};


// Mock Data for Charts
const chartData = Array.from({
  length: 30
}, (_, i) => {
  const time = new Date(Date.now() - (30 - i) * 60000);
  return {
    time: time.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    }),
    pv: 170 + Math.sin(i / 2) * 5 + Math.random() * 2,
    sp: 175,
    out: 45 + Math.cos(i / 3) * 15 + Math.random() * 5
  };
});

// Mock Data for Event Log
const eventLogs = [{
  timestamp: '2024-05-20 14:32:01',
  type: 'Alarme Alto Temp',
  instrument: 'TIC-101',
  description: 'Temperatura ultrapassou 180°C'
}, {
  timestamp: '2024-05-20 14:15:12',
  type: 'Mudança de Setpoint',
  instrument: 'TIC-101',
  description: 'Setpoint alterado de 170 para 175'
}, {
  timestamp: '2024-05-20 13:58:45',
  type: 'Instrumento Offline',
  instrument: 'FIT-202',
  description: 'Falha na comunicação serial'
}, {
  timestamp: '2024-05-20 13:42:30',
  type: 'Operação Manual',
  instrument: 'OUT-101',
  description: 'Saída forçada para 50%'
}, {
  timestamp: '2024-05-20 13:20:11',
  type: 'Alarme Baixo Fluxo',
  instrument: 'FIT-202',
  description: 'Vazão abaixo de 2.0 m3/h'
}, {
  timestamp: '2024-05-20 13:05:00',
  type: 'System Startup',
  instrument: 'PLC-MOD-1',
  description: 'Reinicialização completa do sistema'
}];

export const AnalyticsExplorer = ({ activeTab, onTab, alarmCount, onLogout, children }) => {
  const [dateFrom, setDateFrom] = React.useState('2024-05-20');
  const [dateTo, setDateTo] = React.useState('2024-05-20');
  const [filterText, setFilterText] = React.useState('');
  const [selectedInstrument, setSelectedInstrument] = React.useState('ALL');

  const filteredLogs = eventLogs.filter(log => {
    const logDate = log.timestamp.split(' ')[0];
    const isWithinDateRange = (!dateFrom || logDate >= dateFrom) && (!dateTo || logDate <= dateTo);
    const matchesInstrument = selectedInstrument === 'ALL' || log.instrument === selectedInstrument;
    const searchLower = filterText.toLowerCase();
    const matchesSearch = 
      log.type.toLowerCase().includes(searchLower) ||
      log.instrument.toLowerCase().includes(searchLower) ||
      log.description.toLowerCase().includes(searchLower);
    return isWithinDateRange && matchesInstrument && matchesSearch;
  });

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Tipo', 'Instrumento', 'Descrição'];
    const rows = filteredLogs.map(log => [
      log.timestamp,
      log.type,
      log.instrument,
      log.description
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `event_logs_${dateFrom}_to_${dateTo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-black flex font-body selection:bg-primary/30 selection:text-white">
      {/* Sidebar Overlay for Scanlines */}
      <div className="fixed inset-0 pointer-events-none z-[60]">
        <div className="scanline" style={{
          opacity: 0.02
        }} />
      </div>

      <AppSidebar activeTab={activeTab} onTab={onTab} alarmCount={alarmCount} onLogout={onLogout} />

      <main className="flex-1 p-8 space-y-8 overflow-y-auto min-w-0">
        {activeTab === 'analytics' ? (
          <>
            {/* Header Section */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tighter text-white uppercase neon-text-primary mb-1">
                  Explorador de Analíticos
                </h1>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
                  Process Analysis Console / Mode: Historical Review
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 bg-white/5 p-4 rounded-sm border border-white/5 backdrop-blur-sm">
                <div className="flex flex-col gap-1">
                  <label htmlFor="analytics-date-from" className="text-[9px] uppercase tracking-widest text-muted-foreground font-mono px-1">De</label>
                  <div className="relative group">
                    <input
                      id="analytics-date-from"
                      name="dateFrom"
                      type="date"
                      value={dateFrom}
                      onChange={e => setDateFrom(e.target.value)}
                      className="bg-black border border-primary/30 text-white text-xs px-3 py-2 rounded-sm focus:outline-none focus:border-primary transition-colors group-hover:border-primary/60 font-mono cursor-pointer"
                    />
                    <Calendar className="absolute right-2 top-2.5 w-3 h-3 text-primary/40 pointer-events-none" />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="analytics-date-to" className="text-[9px] uppercase tracking-widest text-muted-foreground font-mono px-1">Até</label>
                  <div className="relative group">
                    <input
                      id="analytics-date-to"
                      name="dateTo"
                      type="date"
                      value={dateTo}
                      onChange={e => setDateTo(e.target.value)}
                      className="bg-black border border-primary/30 text-white text-xs px-3 py-2 rounded-sm focus:outline-none focus:border-primary transition-colors group-hover:border-primary/60 font-mono cursor-pointer"
                    />
                    <Calendar className="absolute right-2 top-2.5 w-3 h-3 text-primary/40 pointer-events-none" />
                  </div>
                </div>

                <button
                  onClick={handleExportCSV}
                  className="mt-auto flex items-center gap-2 h-[34px] px-4 bg-transparent border border-white/20 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-white/5 hover:border-white/40 transition-all rounded-sm active:scale-95 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar CSV</span>
                </button>
              </div>
            </header>

            {/* Charts Grid */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MonitoringChart title="Temperatura PV/SP — Histórico" type="temperature" data={chartData} height={320} />
              <MonitoringChart title="Saída do Controlador (OUT %)" type="output" data={chartData} height={320} />
            </section>

            {/* Event Log Table */}
            <section className="glass-panel p-6 overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <HistoryIcon className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-bold text-white tracking-widest uppercase">Log de Eventos</h2>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative flex items-center bg-white/5 px-3 py-1.5 rounded-sm border border-white/5 gap-2">
                    <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                    <select
                      id="analytics-instrument-filter"
                      name="instrumentFilter"
                      aria-label="Filtrar por Instrumento"
                      value={selectedInstrument}
                      onChange={e => setSelectedInstrument(e.target.value)}
                      className="bg-transparent border-none text-[10px] text-white uppercase tracking-widest font-mono focus:outline-none cursor-pointer appearance-none pr-6 font-bold"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="ALL" className="bg-[#121212] text-white">TODOS INSTS</option>
                      <option value="TIC-101" className="bg-[#121212] text-white">TIC-101</option>
                      <option value="FIT-202" className="bg-[#121212] text-white">FIT-202</option>
                      <option value="OUT-101" className="bg-[#121212] text-white">OUT-101</option>
                      <option value="PLC-MOD-1" className="bg-[#121212] text-white">PLC-MOD-1</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-2.5 w-3 h-3 text-muted-foreground pointer-events-none" />
                  </div>

                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-sm border border-white/5">
                    <label htmlFor="analytics-search-filter" style={srOnlyStyle}>Filtrar Eventos</label>
                    <Search className="w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      id="analytics-search-filter"
                      name="searchFilter"
                      type="text"
                      placeholder="FILTRAR EVENTOS..."
                      value={filterText}
                      onChange={e => setFilterText(e.target.value)}
                      className="bg-transparent border-none text-[10px] text-white uppercase tracking-widest font-mono focus:outline-none w-32 placeholder:text-muted-foreground/60"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-mono">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="pb-3 text-[10px] uppercase tracking-widest text-muted-foreground font-bold px-4">Timestamp</th>
                      <th className="pb-3 text-[10px] uppercase tracking-widest text-muted-foreground font-bold px-4">Tipo</th>
                      <th className="pb-3 text-[10px] uppercase tracking-widest text-muted-foreground font-bold px-4">Instrumento</th>
                      <th className="pb-3 text-[10px] uppercase tracking-widest text-muted-foreground font-bold px-4">Descrição</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log, index) => (
                      <tr key={index} className={cn("group hover:bg-primary/5 transition-colors border-b border-white/5", index % 2 === 0 ? "bg-white/[0.01]" : "bg-transparent")}>
                        <td className="py-4 px-4 text-[11px] text-primary/80 group-hover:text-primary transition-colors">
                          {log.timestamp}
                        </td>
                        <td className="py-4 px-4 text-[11px]">
                          <span className={cn(
                            "px-2 py-0.5 rounded-sm text-[9px] uppercase font-bold",
                            log.type.includes('Alarme')
                              ? "bg-destructive/20 text-destructive border border-destructive/30"
                              : log.type.includes('Mudança')
                                ? "bg-accent/20 text-accent border border-accent/30"
                                : "bg-white/10 text-white/70 border border-white/10"
                          )}>
                            {log.type}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-[11px] text-white/90">
                          {log.instrument}
                        </td>
                        <td className="py-4 px-4 text-[11px] text-muted-foreground group-hover:text-white/70 transition-colors">
                          {log.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex justify-between items-center text-[9px] text-muted-foreground uppercase tracking-widest font-mono">
                <span>Mostrando {filteredLogs.length} de 1,248 registros</span>
                <div className="flex gap-2">
                  <button className="px-2 py-1 hover:text-primary transition-colors cursor-pointer border border-transparent hover:border-primary/20">Anterior</button>
                  <button className="px-2 py-1 hover:text-primary transition-colors cursor-pointer border border-transparent hover:border-primary/20">Próximo</button>
                </div>
              </div>
            </section>
          </>
        ) : (
          <div className="text-white">
            {children}
          </div>
        )}
      </main>
    </div>
  );
};
