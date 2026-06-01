'use client';

import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';

export default function ScreenEffects() {
  const { status } = useGameStore();
  const [showDamageFlash, setShowDamageFlash] = useState(false);
  const [showStaminaVignette, setShowStaminaVignette] = useState(false);
  const [showKarmaPlus, setShowKarmaPlus] = useState(false);
  const [showKarmaMinus, setShowKarmaMinus] = useState(false);
  
  const prevHpRef = useRef(status.hp);
  const prevSpRef = useRef(status.sp);
  const prevMoralRef = useRef(status.moral);

  useEffect(() => {
    // Detect Damage (HP Drop)
    if (status.hp < prevHpRef.current) {
      setShowDamageFlash(true);
      const timer = setTimeout(() => setShowDamageFlash(false), 400);
      prevHpRef.current = status.hp;
      return () => clearTimeout(timer);
    }
    prevHpRef.current = status.hp;
  }, [status.hp]);

  useEffect(() => {
    // Detect Stamina Usage (SP Drop)
    if (status.sp < prevSpRef.current) {
      setShowStaminaVignette(true);
      const timer = setTimeout(() => setShowStaminaVignette(false), 800);
      prevSpRef.current = status.sp;
      return () => clearTimeout(timer);
    }
    prevSpRef.current = status.sp;
  }, [status.sp]);

  useEffect(() => {
    // Detect Karma Gain (Moral Increase)
    if (status.moral > prevMoralRef.current) {
      setShowKarmaPlus(true);
      const timer = setTimeout(() => setShowKarmaPlus(false), 1500);
      prevMoralRef.current = status.moral;
      return () => clearTimeout(timer);
    }
    // Detect Karma Loss (Moral Decrease)
    if (status.moral < prevMoralRef.current) {
      setShowKarmaMinus(true);
      const timer = setTimeout(() => setShowKarmaMinus(false), 1500);
      prevMoralRef.current = status.moral;
      return () => clearTimeout(timer);
    }
    prevMoralRef.current = status.moral;
  }, [status.moral]);

  const isHpCritical = status.hp > 0 && (status.hp / status.maxHp) <= 0.25;

  return (
    <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
      <AnimatePresence>
        {/* Damage Flash - Impacto imediato */}
        {showDamageFlash && (
          <motion.div
            key="damage-flash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-red-600 mix-blend-overlay"
          />
        )}

        {/* Damage Vignette - Borda de sangue no impacto */}
        {showDamageFlash && (
          <motion.div
            key="damage-vignette"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 shadow-[inset_0_0_150px_rgba(220,38,38,0.8)]"
          />
        )}

        {/* Critical Health - Pulsação constante quando quase morrendo */}
        {isHpCritical && (
          <motion.div
            key="critical-pulse"
            animate={{ 
              opacity: [0.2, 0.5, 0.2],
              boxShadow: [
                'inset 0 0 100px rgba(220,38,38,0.3)',
                'inset 0 0 150px rgba(220,38,38,0.5)',
                'inset 0 0 100px rgba(220,38,38,0.3)'
              ]
            }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute inset-0 pointer-events-none"
          />
        )}

        {/* Stamina Effort Vignette - Fôlego gasto (Azul/Ciano) */}
        {showStaminaVignette && (
          <motion.div
            key="stamina-vignette"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 shadow-[inset_0_0_100px_rgba(6,182,212,0.4)]"
          />
        )}

        {/* Positive Karma Gain - Dourado etéreo */}
        {showKarmaPlus && (
          <motion.div
            key="karma-plus"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0] }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-b from-amber-400/20 via-white/5 to-transparent mix-blend-screen"
          />
        )}

        {/* Negative Karma Loss - Roxo Sombrio */}
        {showKarmaMinus && (
          <motion.div
            key="karma-minus"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 shadow-[inset_0_0_200px_rgba(88,28,135,0.7)] mix-blend-multiply"
          />
        )}
      </AnimatePresence>

      {/* Screen Shake suave no dano */}
      {showDamageFlash && (
        <motion.div
          animate={{ x: [-5, 5, -5, 5, 0], y: [-2, 2, -2, 2, 0] }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0"
        />
      )}
    </div>
  );
}
