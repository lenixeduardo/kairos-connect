import React from 'react';

export const ParameterGrid = () => {
  const params = [
    { label: "SP (Setpoint)", value: "180.0 °C" },
    { label: "PV (Process Value)", value: "174.2 °C" },
    { label: "OUT (Output)", value: "62.0 %" },
    { label: "P (Proportional)", value: "10.0 %" },
    { label: "I (Integral)", value: "120 s" },
    { label: "D (Derivative)", value: "15 s" }
  ];

  return (
    <div className="glass-panel p-6 border-white/5 space-y-4 text-left">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <span className="text-[10px] mono text-gray-500">PARÂMETROS CT-100</span>
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {params.map((param, index) => (
          <div key={index} className="flex flex-col">
            <span className="text-[8px] mono text-gray-500 uppercase tracking-widest">{param.label}</span>
            <span className="text-xs font-bold text-white mono">{param.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
