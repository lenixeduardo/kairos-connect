import { Usb, Database, Clock, FileText, Layers, Cpu } from 'lucide-react';

const features = [
  {
    icon: <Usb className="w-5 h-5 text-primary" />,
    title: 'Captura Serial',
    description: 'Leituras automáticas via porta COM de até 6 equipamentos simultaneamente.',
  },
  {
    icon: <Layers className="w-5 h-5 text-primary" />,
    title: 'Gestão de Lotes',
    description: 'Até 6 lotes abertos ao mesmo tempo, com múltiplas sessões de captura por lote.',
  },
  {
    icon: <Database className="w-5 h-5 text-primary" />,
    title: 'Banco Local SQLite',
    description: 'Dados armazenados localmente com rastreabilidade completa por operador e lote.',
  },
  {
    icon: <FileText className="w-5 h-5 text-primary" />,
    title: 'Exportação CSV',
    description: 'Histórico de leituras exportável com filtros por sessão, equipamento e data.',
  },
  {
    icon: <Clock className="w-5 h-5 text-primary" />,
    title: 'Sessões Temporizadas',
    description: 'Janela de captura configurável, com contador regressivo e cancelamento manual.',
  },
  {
    icon: <Cpu className="w-5 h-5 text-primary" />,
    title: 'Regex por Equipamento',
    description: 'Parser configurável por slot para normalizar formatos distintos de cada instrumento.',
  },
];

export const PortusPage = () => {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tighter text-white uppercase neon-text-primary mb-1">
          PORTUS
        </h1>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
          Serial Reader / Kairos Ecosystem — Desktop App
        </p>
      </header>

      <div className="glass-panel p-6 flex items-start gap-5">
        <div className="w-12 h-12 bg-primary/10 border border-primary/30 flex items-center justify-center rounded-sm shrink-0">
          <Usb className="text-primary w-6 h-6" />
        </div>
        <div>
          <h2 className="text-white font-bold text-sm uppercase tracking-widest mb-2">
            Captura Serial para Laboratório Industrial
          </h2>
          <p className="text-gray-400 text-xs leading-relaxed max-w-2xl">
            PORTUS é o aplicativo desktop do ecossistema Kairos. Ele conecta equipamentos de bancada —
            balanças, pHmetros, viscosímetros, espectrofotômetros — via porta serial (COM) e vincula cada
            leitura a produtos e lotes de produção rastreáveis. Roda localmente no Windows, sem dependência
            de rede ou servidor externo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feat) => (
          <div key={feat.title} className="glass-panel p-5 flex flex-col gap-3 hover:bg-primary/5 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 border border-primary/20 flex items-center justify-center rounded-sm shrink-0">
                {feat.icon}
              </div>
              <h3 className="text-white text-xs font-bold uppercase tracking-widest">{feat.title}</h3>
            </div>
            <p className="text-gray-500 text-[11px] leading-relaxed">{feat.description}</p>
          </div>
        ))}
      </div>

      <div className="glass-panel p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-primary/40 rounded-full" />
          <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">
            Aplicativo Desktop — Windows · Electron + React + SQLite
          </span>
        </div>
        <span className="text-[10px] text-gray-600 font-mono uppercase tracking-widest">
          Kairos Ecosystem v1
        </span>
      </div>
    </div>
  );
};
