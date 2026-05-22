import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

export const MonitoringChart = ({ title, type, data, height = 300 }) => {
  const isTemp = type === 'temperature';

  return (
    <div className="glass-panel p-6 border-white/5 space-y-4 text-left">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <h3 className="text-xs font-bold text-white tracking-widest uppercase">{title}</h3>
        <span className="text-[8px] mono text-primary/60 uppercase tracking-widest">TELEMETRIA REGISTRADA</span>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }} 
              stroke="rgba(255, 255, 255, 0.1)"
            />
            <YAxis 
              tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}
              stroke="rgba(255, 255, 255, 0.1)"
              domain={isTemp ? [150, 190] : [0, 100]}
            />
            <Tooltip 
              contentStyle={{ 
                background: 'rgba(0, 0, 0, 0.85)', 
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '4px',
                fontSize: 10,
                color: '#fff',
                fontFamily: 'monospace'
              }} 
            />
            <Legend 
              wrapperStyle={{ fontSize: 9, fontFamily: 'monospace', paddingTop: 10 }}
              verticalAlign="bottom"
              height={36}
            />
            {isTemp ? (
              <>
                <Line type="monotone" dataKey="pv" stroke="#00ff9d" strokeWidth={2} dot={false} name="PV (Temp. Processo)" />
                <Line type="monotone" dataKey="sp" stroke="#ef4444" strokeWidth={1.5} dot={false} strokeDasharray="5 3" name="SP (Setpoint)" />
              </>
            ) : (
              <Line type="monotone" dataKey="out" stroke="#00e5ff" strokeWidth={2} dot={false} name="OUT (Saída %)" />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
