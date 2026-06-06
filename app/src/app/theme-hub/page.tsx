'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, ThemePalette } from '@/store/gameStore';
import { ArrowLeft, Palette, Plus, Trash2, CheckCircle2, ShieldCheck, X, Save, Moon, Sun, Settings2, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

export default function ThemeHubPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { activeThemeId, customThemes, setActiveTheme, createTheme, updateTheme, deleteTheme, setCustomThemes } = useGameStore();

  const [isCreating, setIsCreating] = useState(false);
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [newThemeName, setNewThemeName] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [darkPalette, setDarkPalette] = useState<Partial<ThemePalette>>({
    primary: '#f59e0b',
    bg: '#09090b',
    surface: '#18181b',
    border: '#27272a'
  });
  
  const [lightPalette, setLightPalette] = useState<Partial<ThemePalette>>({
    primary: '#d97706',
    bg: '#f4f4f5',
    surface: '#ffffff',
    border: '#d4d4d8'
  });

  const [activeTab, setActiveTab] = useState<'dark' | 'light'>('dark');

  const syncThemesToCloud = async (updatedThemes: any[]) => {
    setIsSyncing(true);
    try {
      await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customThemes: updatedThemes })
      });
    } catch (e) {
      console.error("THEME_SYNC_ERR:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const hasBYOK = (session?.user as any)?.role === 'ADMIN' || true;

  const defaultTheme = {
    id: 'default',
    name: 'Tema Padrão',
    colors: {
      dark: {
        primary: '#f59e0b',
        bg: '#09090b',
        surface: '#18181b',
        border: '#27272a',
        surfaceHover: '#27272a',
        primaryForeground: '#09090b',
        text: '#f4f4f5',
        textMuted: '#71717a'
      },
      light: {
        primary: '#d97706',
        bg: '#f4f4f5',
        surface: '#ffffff',
        border: '#d4d4d8',
        surfaceHover: '#e4e4e7',
        primaryForeground: '#ffffff',
        text: '#09090b',
        textMuted: '#52525b'
      }
    }
  };

  const allThemes = [defaultTheme, ...(customThemes || [])];

  const handleCreateTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThemeName.trim()) {
      toast.error('O tema precisa de um nome.');
      return;
    }

    const themePayload = {
      name: newThemeName,
      colors: {
        dark: {
          primary: darkPalette.primary!,
          bg: darkPalette.bg!,
          surface: darkPalette.surface!,
          border: darkPalette.border!,
          surfaceHover: darkPalette.border!,
          primaryForeground: darkPalette.bg!,
          text: '#f4f4f5',
          textMuted: '#71717a'
        },
        light: {
          primary: lightPalette.primary!,
          bg: lightPalette.bg!,
          surface: lightPalette.surface!,
          border: lightPalette.border!,
          surfaceHover: lightPalette.border!,
          primaryForeground: lightPalette.bg!,
          text: '#09090b',
          textMuted: '#52525b'
        }
      }
    };

    if (editingThemeId) {
      const updated = (customThemes || []).map(t => t.id === editingThemeId ? { ...t, name: newThemeName, colors: themePayload.colors } : t);
      updateTheme(editingThemeId, themePayload);
      await syncThemesToCloud(updated);
      toast.success('Alterações gravadas no pergaminho!');
    } else {
      const newId = `theme-${Date.now()}`;
      const updated = [...(customThemes || []), { ...themePayload, id: newId }];
      createTheme(themePayload);
      await syncThemesToCloud(updated);
      toast.success('Novo tema forjado com sucesso!');
    }

    setIsCreating(false);
    setEditingThemeId(null);
    setNewThemeName('');
  };

  const startEditing = (theme: any) => {
    setEditingThemeId(theme.id);
    setNewThemeName(theme.name);
    setDarkPalette(theme.colors.dark || theme.colors);
    setLightPalette(theme.colors.light || theme.colors);
    setIsCreating(true);
  };

  const handleDeleteTheme = async (id: string) => {
    if (confirm('Excluir este tema para sempre?')) {
      const updated = (customThemes || []).filter(t => t.id !== id);
      deleteTheme(id);
      await syncThemesToCloud(updated);
      toast.success('Tema excluído.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-portal-bg text-portal-text p-6 md:p-12 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[url('/noise.svg')] pointer-events-none" />
      
      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4">
            <button 
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-portal-text-muted hover:text-portal-text transition-colors text-[10px] font-black uppercase tracking-widest"
            >
              <ArrowLeft className="w-4 h-4" /> Retornar ao Portal
            </button>
            <div className="flex items-center gap-4">
              <div className="p-4 bg-portal-primary/10 rounded-[24px] border border-portal-primary/20 text-portal-primary">
                <Palette className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter italic">Hub de <span className="text-portal-primary">Temas</span></h1>
                <p className="text-portal-text-muted font-serif italic">Molde a realidade da sua jornada</p>
              </div>
            </div>
          </div>
          
          {!isCreating && hasBYOK && (
            <button 
              onClick={() => {
                setEditingThemeId(null);
                setNewThemeName('');
                setDarkPalette({ primary: '#f59e0b', bg: '#09090b', surface: '#18181b', border: '#27272a' });
                setLightPalette({ primary: '#d97706', bg: '#f4f4f5', surface: '#ffffff', border: '#d4d4d8' });
                setIsCreating(true);
              }}
              className="px-6 py-4 bg-portal-surface border-2 border-portal-border hover:border-portal-primary/50 text-portal-text rounded-2xl flex items-center gap-3 font-black uppercase tracking-widest text-[10px] transition-all group shadow-xl"
            >
              <Plus className="w-4 h-4 group-hover:scale-125 transition-transform text-portal-primary" /> Forjar Novo Tema
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {isCreating ? (
            <motion.div
              key="create-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-8 bg-portal-surface border-2 border-portal-primary/30 rounded-[40px] shadow-[0_0_50px_rgba(245,158,11,0.1)] space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black uppercase tracking-tight text-white">{editingThemeId ? 'Reforjar Essência' : 'Criar Paleta Dual'}</h2>
                <button onClick={() => { setIsCreating(false); setEditingThemeId(null); }} className="p-2 hover:bg-portal-border rounded-full text-portal-text-muted">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTheme} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-portal-text-muted ml-4">Nome do Tema</label>
                  <input 
                    type="text"
                    value={newThemeName}
                    onChange={(e) => setNewThemeName(e.target.value)}
                    placeholder="Ex: Sangue de Dragão"
                    className="w-full bg-portal-bg border-2 border-portal-border rounded-2xl p-4 text-portal-text placeholder:text-portal-text-muted focus:border-portal-primary outline-none transition-all font-bold"
                    required
                  />
                </div>

                {/* Tabs for Dark/Light Mode editing */}
                <div className="flex p-1 bg-portal-bg rounded-2xl border border-portal-border">
                  <button
                    type="button"
                    onClick={() => setActiveTab('dark')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      activeTab === 'dark' ? 'bg-portal-surface text-white shadow-md' : 'text-portal-text-muted hover:text-white'
                    }`}
                  >
                    <Moon className="w-4 h-4" /> Modo Sombras (Escuro)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('light')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      activeTab === 'light' ? 'bg-portal-surface text-white shadow-md' : 'text-portal-text-muted hover:text-white'
                    }`}
                  >
                    <Sun className="w-4 h-4" /> Modo Luz (Claro)
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Primary Color */}
                  <div className="p-4 bg-portal-bg border border-portal-border rounded-2xl space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-portal-text-muted flex items-center justify-between">
                      Cor de Destaque <span className="font-mono text-[9px]">{activeTab === 'dark' ? darkPalette.primary : lightPalette.primary}</span>
                    </label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="color"
                        value={activeTab === 'dark' ? darkPalette.primary : lightPalette.primary}
                        onChange={(e) => {
                          const val = e.target.value;
                          activeTab === 'dark' ? setDarkPalette({ ...darkPalette, primary: val }) : setLightPalette({ ...lightPalette, primary: val });
                        }}
                        className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-none p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-xl [&::-webkit-color-swatch]:border-none"
                      />
                      <p className="text-[9px] font-serif italic text-portal-text-muted flex-1">Usada em botões principais, ícones ativos e brilhos.</p>
                    </div>
                  </div>

                  {/* Background Color */}
                  <div className="p-4 bg-portal-bg border border-portal-border rounded-2xl space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-portal-text-muted flex items-center justify-between">
                      Fundo Principal <span className="font-mono text-[9px]">{activeTab === 'dark' ? darkPalette.bg : lightPalette.bg}</span>
                    </label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="color"
                        value={activeTab === 'dark' ? darkPalette.bg : lightPalette.bg}
                        onChange={(e) => {
                          const val = e.target.value;
                          activeTab === 'dark' ? setDarkPalette({ ...darkPalette, bg: val }) : setLightPalette({ ...lightPalette, bg: val });
                        }}
                        className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-none p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-xl [&::-webkit-color-swatch]:border-none"
                      />
                      <p className="text-[9px] font-serif italic text-portal-text-muted flex-1">A base estrutural da página e menus principais.</p>
                    </div>
                  </div>

                  {/* Surface Color */}
                  <div className="p-4 bg-portal-bg border border-portal-border rounded-2xl space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-portal-text-muted flex items-center justify-between">
                      Superfície <span className="font-mono text-[9px]">{activeTab === 'dark' ? darkPalette.surface : lightPalette.surface}</span>
                    </label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="color"
                        value={activeTab === 'dark' ? darkPalette.surface : lightPalette.surface}
                        onChange={(e) => {
                          const val = e.target.value;
                          activeTab === 'dark' ? setDarkPalette({ ...darkPalette, surface: val }) : setLightPalette({ ...lightPalette, surface: val });
                        }}
                        className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-none p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-xl [&::-webkit-color-swatch]:border-none"
                      />
                      <p className="text-[9px] font-serif italic text-portal-text-muted flex-1">Cor dos painéis, modais e cards flutuantes.</p>
                    </div>
                  </div>

                  {/* Border Color */}
                  <div className="p-4 bg-portal-bg border border-portal-border rounded-2xl space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-portal-text-muted flex items-center justify-between">
                      Bordas <span className="font-mono text-[9px]">{activeTab === 'dark' ? darkPalette.border : lightPalette.border}</span>
                    </label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="color"
                        value={activeTab === 'dark' ? darkPalette.border : lightPalette.border}
                        onChange={(e) => {
                          const val = e.target.value;
                          activeTab === 'dark' ? setDarkPalette({ ...darkPalette, border: val }) : setLightPalette({ ...lightPalette, border: val });
                        }}
                        className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-none p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-xl [&::-webkit-color-swatch]:border-none"
                      />
                      <p className="text-[9px] font-serif italic text-portal-text-muted flex-1">Usada para delimitar elementos e separar seções.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-4">
                  <button 
                    type="button" 
                    onClick={() => { setIsCreating(false); setEditingThemeId(null); }}
                    className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-portal-text-muted hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-8 py-4 bg-portal-primary text-portal-primary-foreground rounded-2xl flex items-center gap-2 font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-xl"
                  >
                    <Save className="w-4 h-4" /> {editingThemeId ? 'Atualizar Paleta' : 'Salvar Paleta'}
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="theme-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {allThemes.map((t) => (
                <div 
                  key={t.id} 
                  className={`p-6 bg-portal-surface border-2 rounded-[32px] flex items-center justify-between transition-all ${
                    activeThemeId === t.id ? 'border-portal-primary shadow-[0_0_30px_rgba(245,158,11,0.1)]' : 'border-portal-border hover:border-portal-primary/30'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-2xl border-2 border-portal-border shadow-inner relative overflow-hidden"
                      style={{ backgroundColor: t.colors.dark?.primary || (t.colors as any).primary }}
                    >
                       <div className="absolute right-0 bottom-0 w-6 h-6 bg-white/20 backdrop-blur-md" style={{ backgroundColor: t.colors.light?.primary || (t.colors as any).primary }} />
                    </div>
                    <div>
                      <h3 className="font-black text-portal-text uppercase tracking-tight">{t.name}</h3>
                      <div className="flex gap-2 mt-1">
                        <div className="w-3 h-3 rounded-full border border-portal-border" style={{ backgroundColor: t.colors.dark?.bg || (t.colors as any).bg }} />
                        <div className="w-3 h-3 rounded-full border border-portal-border" style={{ backgroundColor: t.colors.dark?.surface || (t.colors as any).surface }} />
                        <div className="w-px h-3 bg-portal-border/50 mx-1" />
                        <div className="w-3 h-3 rounded-full border border-portal-border" style={{ backgroundColor: t.colors.light?.bg || (t.colors as any).bg }} />
                        <div className="w-3 h-3 rounded-full border border-portal-border" style={{ backgroundColor: t.colors.light?.surface || (t.colors as any).surface }} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeThemeId === t.id ? (
                      <span className="p-2 bg-portal-primary/10 text-portal-primary rounded-xl flex items-center gap-2 text-[10px] font-black uppercase">
                        <CheckCircle2 className="w-4 h-4" /> Ativo
                      </span>
                    ) : (
                      <button 
                        onClick={() => {
                          setActiveTheme(t.id);
                          toast.success(`Tema ${t.name} ativado!`);
                        }}
                        className="px-4 py-2 bg-portal-border/50 hover:bg-portal-primary text-portal-text hover:text-portal-primary-foreground rounded-xl text-[10px] font-black uppercase transition-colors"
                      >
                        Ativar
                      </button>
                    )}

                    {t.id !== 'default' && (
                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => startEditing(t)}
                          className="p-2 bg-portal-border/50 text-portal-text-muted hover:text-portal-primary hover:bg-portal-primary/10 rounded-xl transition-colors"
                          title="Editar Tema"
                          disabled={isSyncing}
                        >
                          <Settings2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteTheme(t.id)}
                          className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-colors"
                          title="Excluir Tema"
                          disabled={isSyncing}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sync Status */}
        <AnimatePresence>
          {isSyncing && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-10 left-10 flex items-center gap-3 bg-zinc-900/90 border border-portal-primary/20 px-4 py-2 rounded-full backdrop-blur-md shadow-2xl z-50"
            >
                <RefreshCcw className="w-3 h-3 text-portal-primary animate-spin" />
                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Sincronizando com a Nuvem...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info */}
        {!isCreating && (
          <div className="p-6 bg-portal-surface/50 border border-portal-border rounded-3xl flex items-start gap-4">
            <ShieldCheck className="w-6 h-6 text-portal-text-muted shrink-0" />
            <p className="text-[10px] uppercase font-bold text-portal-text-muted leading-relaxed">
              O recurso de criar novos temas requer a habilidade do 
              <span className="text-portal-primary"> Poder Ancestral (BYOK)</span>.
              A nova paleta Dual Mode permite definir cores vibrantes independentes para os modos Sol e Lua.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
