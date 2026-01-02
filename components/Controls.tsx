import React from 'react';
import { Settings2, Zap, Skull, Wind } from 'lucide-react';
import { SimulationConfig } from '../types';

interface ControlsProps {
  config: SimulationConfig;
  onChange: (key: keyof SimulationConfig, value: number) => void;
  fps: number;
}

export const Controls: React.FC<ControlsProps> = ({ config, onChange, fps }) => {
  return (
    <div className="absolute top-4 left-4 z-10 w-80 bg-black/80 backdrop-blur-md border border-zinc-800 p-4 rounded-lg shadow-2xl text-xs font-mono">
      <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-2">
        <h1 className="text-sm font-bold text-emerald-400 tracking-wider flex items-center gap-2">
          <Settings2 size={16} /> AMAF PROTOCOL // v0.9
        </h1>
        <span className="text-zinc-500">{Math.round(fps)} FPS</span>
      </div>

      <div className="space-y-4">
        {/* Pheromone Decay */}
        <div className="space-y-1">
          <div className="flex justify-between text-zinc-400">
            <span className="flex items-center gap-2"><Wind size={12}/> Entropy (Decay)</span>
            <span>{config.pheromoneDecay.toFixed(3)}</span>
          </div>
          <input
            type="range"
            min="0.800"
            max="0.990"
            step="0.001"
            value={config.pheromoneDecay}
            onChange={(e) => onChange('pheromoneDecay', parseFloat(e.target.value))}
            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        {/* Agent Speed */}
        <div className="space-y-1">
          <div className="flex justify-between text-zinc-400">
            <span className="flex items-center gap-2"><Zap size={12}/> Velocity</span>
            <span>{config.agentSpeed.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="4.0"
            step="0.1"
            value={config.agentSpeed}
            onChange={(e) => onChange('agentSpeed', parseFloat(e.target.value))}
            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>

        {/* Adversarial Pressure */}
        <div className="space-y-1">
          <div className="flex justify-between text-zinc-400">
            <span className="flex items-center gap-2"><Skull size={12}/> Adversarial Pressure</span>
            <span>{config.adversarialPressure.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={config.adversarialPressure}
            onChange={(e) => onChange('adversarialPressure', parseFloat(e.target.value))}
            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
          />
        </div>

        {/* Population */}
        <div className="space-y-1">
          <div className="flex justify-between text-zinc-400">
            <span>Swarm Density</span>
            <span>{config.agentCount}</span>
          </div>
          <input
            type="range"
            min="100"
            max="5000"
            step="100"
            value={config.agentCount}
            onChange={(e) => onChange('agentCount', parseInt(e.target.value))}
            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
          />
        </div>
      </div>

      <div className="mt-6 text-[10px] text-zinc-600 leading-tight">
        <p>SYSTEM STATUS: ONLINE</p>
        <p>MODE: DISTRIBUTED MINIMAX</p>
        <p>OPTIMIZATION: STIGMERGIC</p>
      </div>
    </div>
  );
};
