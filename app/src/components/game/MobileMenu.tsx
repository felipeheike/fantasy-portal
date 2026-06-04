'use client';

import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Package, 
  Sparkles, 
  Settings2, 
  Bell, 
  LogOut, 
  Sun, 
  Moon, 
  Terminal, 
  Zap, 
  ShieldCheck,
  User,
  History,
  LayoutDashboard,
  HelpCircle,
  FileDown,
  FileText
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleInventory: () => void;
  onToggleSkills: () => void;
  onToggleInfluence: () => void;
  onToggleNotifications: () => void;
  onToggleSettings: () => void;
  onToggleInquiry: () => void;
  onDownloadPDF: () => void;
  onDownloadMD: () => void;
  onLogout: () => void;
}

export default function MobileMenu({
  isOpen,
  onClose,
  onToggleInventory,
  onToggleSkills,
  onToggleInfluence,
  onToggleNotifications,
  onToggleSettings,
  onToggleInquiry,
  onDownloadPDF,
  onDownloadMD,
  onLogout
}: MobileMenuProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { 
    theme, toggleTheme, forcedNextAction, setForcedNextAction,
    forcedEndingType, setForcedEndingType, inventory, notificationHistory, status
  } = useGameStore();

  const isAdmin = (session?.user as any)?.role === 'ADMIN';
  const unreadCount = notificationHistory.filter(n => !n.read).length;

  const menuItems = [
    { label: 'Inventário', icon: Package, count: inventory.length, color: 'text-emerald-500', action: onToggleInventory },
    { label: 'Habilidades', icon: Sparkles, color: 'text-amber-500', action: onToggleSkills },
    { label: 'Reputação', icon: History, color: 'text-blue-500', action: onToggleInfluence },
    { label: 'Notificações', icon: Bell, count: unreadCount, color: 'text-primary', action: onToggleNotifications },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] lg:hidden"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-[85%] max-w-sm bg-zinc-950 border-l border-zinc-800 shadow-2xl z-[210] flex flex-col lg:hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Menu da Jornada</p>
                  <p className="text-sm font-bold text-white truncate max-w-[150px]">{session?.user?.name || 'Viajante'}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              
              {/* ORACLE: Sussurros do Mestre */}
              <button 
                onClick={() => { onToggleInquiry(); onClose(); }}
                className="w-full p-5 bg-primary text-zinc-950 rounded-[24px] flex items-center justify-between group active:scale-95 transition-all shadow-[0_0_30px_rgba(245,158,11,0.2)] border-2 border-zinc-950"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-zinc-950/20 rounded-xl">
                    <HelpCircle className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <span className="block text-sm font-black uppercase tracking-widest">Sussurros do Mestre</span>
                    <span className="block text-[8px] font-bold uppercase opacity-60">Consultar o Oráculo do Destino</span>
                  </div>
                </div>
                <div className="bg-zinc-950 text-primary px-3 py-1.5 rounded-full text-xs font-black shadow-lg border border-primary/30">
                  {status.insightPoints}
                </div>
              </button>

              {/* Theme Toggle Button */}
              <button 
                onClick={toggleTheme}
                className="w-full p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between group active:scale-95 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-zinc-950 rounded-xl border border-zinc-800 text-primary">
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </div>
                  <span className="text-sm font-black uppercase tracking-widest text-zinc-200">
                    Modo {theme === 'dark' ? 'Luz' : 'Sombras'}
                  </span>
                </div>
                <div className="text-[8px] font-black uppercase text-zinc-600 bg-zinc-950 px-2 py-1 rounded-md border border-zinc-800">Switch</div>
              </button>

              {/* Main Actions Grid */}
              <div className="grid grid-cols-2 gap-3">
                {menuItems.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => { item.action(); onClose(); }}
                    className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex flex-col items-center gap-3 active:scale-95 transition-all relative overflow-hidden"
                  >
                    <item.icon className={`w-6 h-6 ${item.color}`} />
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">{item.label}</span>
                    {item.count !== undefined && item.count > 0 && (
                      <span className="absolute top-2 right-2 w-5 h-5 bg-primary text-zinc-950 text-[9px] font-black rounded-full flex items-center justify-center border-2 border-zinc-950">
                        {item.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* CRÔNICAS: Export Section */}
              <div className="space-y-4 pt-4 border-t border-zinc-800/50">
                 <div className="flex items-center gap-2 px-2">
                    <History className="w-3.5 h-3.5 text-zinc-500" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Crônicas da Jornada</h3>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => { onDownloadPDF(); onClose(); }}
                      className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all"
                    >
                      <FileText className="w-4 h-4 text-amber-500" /> PDF Arte
                    </button>
                    <button 
                      onClick={() => { onDownloadMD(); onClose(); }}
                      className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all"
                    >
                      <FileDown className="w-4 h-4 text-cyan-500" /> Dados .MD
                    </button>
                 </div>
              </div>

              {/* Settings Toggle (Moved here to make space in grid) */}
              <button 
                onClick={() => { onToggleSettings(); onClose(); }}
                className="w-full p-4 bg-zinc-900/30 border border-zinc-800 rounded-2xl flex items-center gap-4 active:scale-95 transition-all"
              >
                <Settings2 className="w-5 h-5 text-zinc-600" />
                <span className="text-xs font-black uppercase tracking-widest text-zinc-500">Configurações Detalhadas</span>
              </button>

              {/* Admin Tools Section */}
              {isAdmin && (
                <div className="space-y-4 pt-4 border-t border-zinc-800/50">
                  <div className="flex items-center gap-2 px-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Console do Mestre</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Master's Chamber Button */}
                    <button 
                      onClick={() => router.push('/admin/dashboard')}
                      className="w-full p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center gap-4 group active:scale-95 transition-all"
                    >
                      <div className="p-2 bg-orange-500/20 rounded-xl text-orange-500">
                        <LayoutDashboard className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <span className="block text-sm font-black uppercase tracking-widest text-orange-200">Câmara do Mestre</span>
                        <span className="block text-[8px] font-bold text-orange-500/60 uppercase">Painel de Controle Central</span>
                      </div>
                    </button>

                    {/* Force Action */}
                    <div className="space-y-1.5 px-2">
                      <label className="text-[8px] font-bold uppercase text-zinc-500 ml-1">Forçar Interação</label>
                      <div className="flex items-center gap-3 bg-zinc-900 border border-orange-500/20 p-3 rounded-xl">
                        <Terminal className="w-4 h-4 text-orange-500 shrink-0" />
                        <select 
                          value={forcedNextAction || ''}
                          onChange={(e) => setForcedNextAction(e.target.value || null)}
                          className="w-full bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-zinc-300 focus:text-orange-500"
                        >
                          <option value="">🎲 Aleatório</option>
                          <option value="puzzle">🧩 Desafio</option>
                          <option value="combined">⚔️ Combate</option>
                          <option value="binary">🌓 Escolha</option>
                          <option value="interpretative">✍️ Texto</option>
                        </select>
                      </div>
                    </div>

                    {/* Force Ending */}
                    <div className="space-y-1.5 px-2">
                      <label className="text-[8px] font-bold uppercase text-zinc-500 ml-1">Forçar Desfecho</label>
                      <div className="flex items-center gap-3 bg-zinc-900 border border-cyan-500/20 p-3 rounded-xl">
                        <Zap className="w-4 h-4 text-cyan-500 shrink-0" />
                        <select 
                          value={forcedEndingType || ''}
                          onChange={(e) => setForcedEndingType(e.target.value || null)}
                          className="w-full bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-zinc-300 focus:text-cyan-500"
                        >
                          <option value="">🌿 Continuar</option>
                          <option value="glory">🏆 Glória</option>
                          <option value="death">💀 Morte</option>
                          <option value="permadeath">🌑 Fim</option>
                          <option value="defeat">🚩 Derrota</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-zinc-800 bg-zinc-900/30">
              <button 
                onClick={() => { onLogout(); onClose(); }}
                className="w-full p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center gap-3 text-red-500 font-black uppercase tracking-[0.2em] text-xs hover:bg-red-500/20 transition-all active:scale-95"
              >
                <LogOut className="w-4 h-4" /> Sair da Jornada
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
