
import { motion } from 'framer-motion';
import { Fingerprint, Sparkles, Play, Activity, Cpu, Database, Layers } from 'lucide-react';
import { ParameterGrid } from './ParameterGrid';
import { cn } from '@/lib/utils';

/**
 * FloatingParameterChip component for background decoration
 */
const FloatingParameterChip = ({
  label,
  value,
  className,
  delay = 0
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{
      opacity: [0.1, 0.3, 0.1],
      y: [0, -15, 0],
      x: [0, 5, 0]
    }}
    transition={{
      duration: 6,
      repeat: Infinity,
      delay,
      ease: "easeInOut"
    }}
    className={cn("hidden sm:flex absolute pointer-events-none flex-col items-start px-3 py-1.5 glass-panel border-primary/20", className)}
  >
    <span className="text-[8px] mono text-primary/60 uppercase tracking-widest">{label}</span>
    <span className="text-xs font-bold mono text-primary">{value}</span>
  </motion.div>
);

/**
 * Navigation Component
 */
const TopNav = () => {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-6 py-4 flex items-center justify-between border-b border-white/5 bg-black/50 backdrop-blur-md">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-primary shadow-[0_0_8px_rgba(0,255,157,0.8)]" />
          <span className="text-sm font-black tracking-tighter uppercase font-heading">
            KairOS <span className="text-primary/80">CONNECT</span>
          </span>
        </div>
      </div>
    </nav>
  );
};

/**
 * Main Hero Landing Screen
 */
export const HeroLanding = ({ onEnter }) => {
  const floatingChips = [
    { label: "SP", value: "180.0°C", className: "top-[20%] left-[10%]", delay: 0 },
    { label: "PV", value: "174.2°C", className: "top-[60%] left-[5%]", delay: 1 },
    { label: "OUT", value: "62%", className: "top-[15%] right-[12%]", delay: 2 },
    { label: "P", value: "10.0%", className: "bottom-[25%] right-[8%]", delay: 1.5 },
    { label: "I", value: "120s", className: "bottom-[15%] left-[20%]", delay: 0.5 }
  ];

  return (
    <div className="relative min-h-screen bg-black text-white selection:bg-primary selection:text-black overflow-hidden font-body">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        <div className="industrial-grid absolute inset-0 opacity-20" />
        <div className="scanline" />
        
        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
      </div>

      <TopNav />

      {/* Decorative Chips */}
      {floatingChips.map(chip => (
        <FloatingParameterChip
          key={chip.label}
          label={chip.label}
          value={chip.value}
          className={chip.className}
          delay={chip.delay}
        />
      ))}

      <main className="relative z-10 pt-20 pb-16 md:pt-32 md:pb-20 px-5 md:px-6 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-screen text-center">
        {/* Main Heading Group */}
        <div className="relative group max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black font-heading leading-[1.05] tracking-tighter mb-6 md:mb-8 flex flex-col items-center">
              <span className="text-gray-500/80">O futuro do</span>
              <span className="flex items-center gap-3 md:gap-5">
                <motion.span
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Fingerprint className="w-10 h-10 md:w-16 md:h-16 text-primary" strokeWidth={1.5} />
                </motion.span>
                <span className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">controle</span>
              </span>
              <span className="text-gray-500/80">industrial é</span>
              <span className="flex items-center gap-3 md:gap-5">
                <span className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">precisão</span>
                <span className="text-gray-500/80">+</span>
                <span className="relative inline-flex items-center text-white">
                  dados
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 90, 0],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute -right-8 md:-right-12 top-0"
                  >
                    <Sparkles className="w-8 h-8 md:w-12 md:h-12 text-accent" strokeWidth={1} />
                  </motion.div>
                </span>
              </span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-sm md:text-base text-gray-500 max-w-2xl mx-auto mb-12 font-medium leading-relaxed"
          >
            Monitore PV/SP, ajuste parâmetros PID e visualize instrumentos críticos em tempo real 
            com uma interface feita para operação industrial moderna.
          </motion.p>
        </div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <button
            onClick={onEnter}
            className="relative px-10 py-5 bg-transparent border border-primary/50 rounded-full flex items-center gap-4 hover:border-primary transition-all duration-300 group overflow-hidden cursor-pointer"
          >
            <div className="absolute inset-0 bg-primary/5 -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
            <span className="relative text-xs md:text-sm font-black uppercase tracking-[0.2em] text-primary group-hover:text-white transition-colors duration-300">
              Entrar na Sala de Controle
            </span>
            <div className="relative w-6 h-6 rounded-full bg-primary flex items-center justify-center text-black">
              <Play size={10} fill="currentColor" />
            </div>
          </button>
        </motion.div>

        {/* Secondary Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="mt-10 md:mt-16 flex items-center gap-4 md:gap-8 text-[10px] mono text-gray-600 uppercase tracking-widest flex-wrap justify-center"
        >
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
            <span>CT-100</span>
          </div>
          <span className="text-gray-800">·</span>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">174.2°C PV</span>
          </div>
          <span className="text-gray-800">·</span>
          <div className="flex items-center gap-2">
            <Activity size={10} className="text-primary" />
            <span>Sistema Operacional</span>
          </div>
        </motion.div>

        {/* Floating Components Preview */}
        <div className="absolute bottom-[-10%] right-[-5%] w-[320px] opacity-20 rotate-[-5deg] group-hover:opacity-30 transition-opacity duration-700 hidden xl:block pointer-events-none">
          <ParameterGrid />
        </div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[320px] opacity-20 rotate-[5deg] group-hover:opacity-30 transition-opacity duration-700 hidden xl:block pointer-events-none">
          <div className="glass-panel p-6 border-white/5 space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-[10px] mono text-gray-500">NETWORK STATUS</span>
              <div className="w-2 h-2 bg-primary rounded-full" />
            </div>
            {[
              { icon: Cpu, label: "Core Temp", val: "42°C" },
              { icon: Database, label: "IO Throughput", val: "1.2GB/s" },
              { icon: Layers, label: "Stack Sync", val: "0.01ms" }
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <item.icon size={12} className="text-gray-600" />
                  <span className="text-[10px] mono text-gray-400">{item.label}</span>
                </div>
                <span className="text-[10px] mono font-bold text-white">{item.val}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Decorative Border Indicators */}
      <div className="fixed bottom-6 left-6 flex flex-col gap-1 opacity-40">
        <div className="w-8 h-[1px] bg-primary" />
        <div className="w-4 h-[1px] bg-primary" />
      </div>
      <div className="fixed bottom-6 right-6 flex flex-col items-end gap-1 opacity-40">
        <div className="w-8 h-[1px] bg-primary" />
        <div className="w-4 h-[1px] bg-primary" />
      </div>
    </div>
  );
};
