import React, { useState } from 'react';
import { SimulationCanvas } from './components/SimulationCanvas';
import { Controls } from './components/Controls';
import { DEFAULT_CONFIG } from './constants';
import { SimulationConfig } from './types';

function App() {
  const [config, setConfig] = useState<SimulationConfig>(DEFAULT_CONFIG);
  const [fps, setFps] = useState(0);

  const handleConfigChange = (key: keyof SimulationConfig, value: number) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="w-screen h-screen relative bg-neutral-950 overflow-hidden text-white font-sans selection:bg-emerald-500/30">
      
      {/* Simulation Layer */}
      <div className="absolute inset-0 z-0">
        <SimulationCanvas config={config} onFpsUpdate={setFps} />
      </div>

      {/* UI Overlay */}
      <Controls config={config} onChange={handleConfigChange} fps={fps} />

      {/* Decorative Overlays */}
      <div className="absolute bottom-6 right-6 pointer-events-none opacity-50 text-right">
         <h2 className="text-4xl font-black text-white/10 tracking-tighter">ZERO-DAY</h2>
         <p className="text-[10px] text-emerald-500/50 font-mono mt-1">
           HEURISTIC EXPLOIT // RUNTIME: {Math.floor(performance.now() / 1000)}s
         </p>
      </div>
      
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
    </div>
  );
}

export default App;
