'use client';

import { motion } from 'framer-motion';
import { TacticalMap, Position } from '@/types';
import { Swords, User, Shield, Flame, BrickWall } from 'lucide-react';

interface TacticalGridProps {
  map: TacticalMap;
  onTileClick?: (pos: Position) => void;
}

export default function TacticalGrid({ map, onTileClick }: TacticalGridProps) {
  const { rows, cols } = map.gridSize;

  const getEntityAt = (x: number, y: number) => {
    return map.entities.find(e => e.position.x === x && e.position.y === y);
  };

  const getEnvAt = (x: number, y: number) => {
    return map.environment?.find(e => e.position.x === x && e.position.y === y);
  };

  return (
    <div className="w-full aspect-square max-w-lg mx-auto bg-zinc-950 border border-zinc-800 rounded-3xl p-4 shadow-2xl relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ 
             backgroundImage: 'radial-gradient(circle, #f59e0b 1px, transparent 1px)', 
             backgroundSize: '20px 20px' 
           }} 
      />

      <div 
        className="grid h-full w-full gap-2"
        style={{ 
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          gridTemplateColumns: `repeat(${cols}, 1fr)` 
        }}
      >
        {Array.from({ length: rows * cols }).map((_, i) => {
          const x = i % cols;
          const y = Math.floor(i / cols);
          const entity = getEntityAt(x, y);
          const env = getEnvAt(x, y);

          return (
            <motion.button
              key={`${x}-${y}`}
              whileHover={{ scale: 0.95, backgroundColor: 'rgba(39, 39, 42, 0.5)' }}
              onClick={() => onTileClick?.({ x, y })}
              className="relative rounded-xl border border-zinc-800/50 bg-zinc-900/30 transition-all flex items-center justify-center group"
            >
              {/* Environment Decor */}
              {env && (
                <div className="text-zinc-700">
                  {env.type === 'wall' && <BrickWall className="w-6 h-6" />}
                  {env.type === 'fire' && <Flame className="w-6 h-6 text-orange-500 animate-pulse" />}
                </div>
              )}

              {/* Entities */}
              {entity && (
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className={`relative z-10 p-2 rounded-lg shadow-xl ${
                    entity.type === 'player' ? 'bg-primary text-zinc-950' : 
                    entity.type === 'enemy' ? 'bg-red-600 text-white' : 
                    'bg-blue-600 text-white'
                  }`}
                >
                  {entity.type === 'player' ? <User className="w-6 h-6" /> : <Swords className="w-6 h-6" />}
                  
                  {/* Entity Stats Mini-HUD */}
                  {entity.hp !== undefined && (
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-12 h-1 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
                      <div 
                        className="h-full bg-green-500" 
                        style={{ width: `${(entity.hp / (entity.maxHp || 100)) * 100}%` }}
                      />
                    </div>
                  )}
                  
                  {/* Tooltip on Hover */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-[8px] font-black uppercase tracking-widest text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                    {entity.name}
                  </div>
                </motion.div>
              )}

              {/* Coordinates Indicator (Subtle) */}
              <span className="absolute bottom-1 right-1 text-[6px] text-zinc-800 font-mono">
                {x},{y}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
