'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, ThemePalette } from '@/store/gameStore';
import { ArrowLeft, Palette, Plus, Trash2, CheckCircle2, ShieldCheck, X, Save, Moon, Sun, Settings2, RefreshCcw, BookOpen, Info, Sparkles, User, LogOut, Trophy, Ghost, Skull, Bell, Clock, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

export default function ThemeHubPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { 
    activeThemeId, customThemes, setActiveTheme, 
    createTheme, updateTheme, deleteTheme, setCustomThemes,
    lightMode, toggleLightMode
  } = useGameStore();

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

  const [fonts, setFonts] = useState({
    title: 'Inter',
    body: 'Inter',
    ui: 'Inter'
  });

  const [activeTab, setActiveTab] = useState<'dark' | 'light' | 'fonts' | 'essences'>('dark');
  const [previewMode, setPreviewMode] = useState<'dark' | 'light'>('dark');
  const [originalThemeState, setOriginalThemeState] = useState<any>(null);

  const visualEssences = [
    {
      id: 'toxic',
      name: '🧪 Alquimia Tóxica',
      colors: {
        dark: { primary: '#10b981', bg: '#022c22', surface: '#064e3b', border: '#065f46' },
        light: { primary: '#059669', bg: '#f0fdf4', surface: '#dcfce7', border: '#bbf7d0' }
      },
      fonts: { title: 'MedievalSharp', body: 'Geist', ui: 'Geist' }
    },
    {
      id: 'blood',
      name: '🩸 Ritual de Sangue',
      colors: {
        dark: { primary: '#e11d48', bg: '#450a0a', surface: '#7f1d1d', border: '#991b1b' },
        light: { primary: '#be123c', bg: '#fff1f2', surface: '#ffe4e6', border: '#fecdd3' }
      },
      fonts: { title: 'Creepster', body: 'Inter', ui: 'Inter' }
    },
    {
      id: 'stellar',
      name: '🌌 Magia Estelar',
      colors: {
        dark: { primary: '#6366f1', bg: '#0f172a', surface: '#1e293b', border: '#334155' },
        light: { primary: '#4f46e5', bg: '#f5f3ff', surface: '#ede9fe', border: '#ddd6fe' }
      },
      fonts: { title: 'Cinzel', body: 'Geist', ui: 'Geist' }
    },
    {
      id: 'pirate',
      name: '🏴‍☠️ Mar de Sombras',
      colors: {
        dark: { primary: '#06b6d4', bg: '#082f49', surface: '#0c4a6e', border: '#075985' },
        light: { primary: '#0891b2', bg: '#ecfeff', surface: '#cffafe', border: '#a5f3fc' }
      },
      fonts: { title: 'Pirata One', body: 'Roboto Mono', ui: 'Roboto Mono' }
    },
    {
      id: 'bronze',
      name: '🦾 Era de Bronze',
      colors: {
        dark: { primary: '#d97706', bg: '#1c1917', surface: '#292524', border: '#44403c' },
        light: { primary: '#b45309', bg: '#fffbeb', surface: '#fef3c7', border: '#fde68a' }
      },
      fonts: { title: 'Roboto Mono', body: 'Libre Baskerville', ui: 'Geist' }
    }
  ];

  const updateLivePreview = (colors: { dark: any, light: any }, currentFonts: any) => {
    const tempTheme = {
      id: 'preview-temp',
      name: 'Preview',
      colors,
      fonts: currentFonts
    };
    
    const originalActiveId = useGameStore.getState().activeThemeId;
    const originalCustomThemes = useGameStore.getState().customThemes;
    
    if (!originalThemeState) {
      setOriginalThemeState({ activeThemeId: originalActiveId, customThemes: originalCustomThemes });
    }

    useGameStore.setState({ 
      customThemes: [...originalCustomThemes.filter(t => t.id !== 'preview-temp'), tempTheme],
      activeThemeId: 'preview-temp'
    });
  };

  const applyEssence = (essence: any) => {
    const newFonts = essence.fonts;
    const newDark = essence.colors.dark;
    const newLight = essence.colors.light;
    
    setDarkPalette(newDark);
    setLightPalette(newLight);
    setFonts(newFonts);
    updateLivePreview({ dark: newDark, light: newLight }, newFonts);
    toast.success(`${essence.name} aplicado!`);
  };

  const handleCancel = () => {
    if (originalThemeState) {
      useGameStore.setState({
        activeThemeId: originalThemeState.activeThemeId,
        customThemes: originalThemeState.customThemes
      });
      setOriginalThemeState(null);
    }
    setIsCreating(false);
    setEditingThemeId(null);
    setNewThemeName('');
  };

  const handleSurpriseMe = () => {
    const randomColors = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#06b6d4'];
    const randomBgs = ['#09090b', '#020617', '#0c0a09', '#050505'];
    const randomTitleFonts = suggestedFonts.map(f => f.name);
    const randomBodyFonts = ['Inter', 'Geist', 'Libre Baskerville', 'Playfair Display'];

    const surpriseColor = randomColors[Math.floor(Math.random() * randomColors.length)];
    const surpriseBg = randomBgs[Math.floor(Math.random() * randomBgs.length)];

    const surprise = {
      primary: surpriseColor,
      bg: surpriseBg,
      fonts: {
        title: randomTitleFonts[Math.floor(Math.random() * randomTitleFonts.length)],
        body: randomBodyFonts[Math.floor(Math.random() * randomBodyFonts.length)],
        ui: 'Inter'
      }
    };

    const newDark = { 
      primary: surprise.primary, 
      bg: surprise.bg, 
      surface: surprise.bg, 
      border: surprise.primary 
    };

    const newLight = {
      primary: surprise.primary,
      bg: '#f8fafc',
      surface: '#f1f5f9',
      border: surprise.primary
    };
    
    setDarkPalette(newDark);
    setLightPalette(newLight);
    setFonts(surprise.fonts);
    updateLivePreview({ dark: newDark, light: newLight }, surprise.fonts);
    toast.info('✨ O destino forjou um novo visual!');
  };

  const suggestedFonts = [
    { name: 'Inter', type: 'Sans-Serif' },
    { name: 'Geist', type: 'Moderna (Padrão)' },
    { name: 'Libre Baskerville', type: 'Serif (Narrativa)' },
    { name: 'Cinzel', type: 'Serif (Especial)' },
    { name: 'MedievalSharp', type: 'Gótica' },
    { name: 'Roboto Mono', type: 'Monospaced' },
    { name: 'Playfair Display', type: 'Serif Elegante' },
    { name: 'Uncial Antiqua', type: 'Céltica' },
    { name: 'Pirata One', type: 'Pirata' },
    { name: 'Creepster', type: 'Terror' }
  ];

  const syncThemesToCloud = async (updatedThemes: any[], activeId?: string) => {
    setIsSyncing(true);
    try {
      await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          customThemes: updatedThemes,
          ...(activeId ? { activeThemeId: activeId } : {})
        })
      });
    } catch (e) {
      console.error("THEME_SYNC_ERR:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleActivateTheme = async (id: string, name: string) => {
    setActiveTheme(id);
    await syncThemesToCloud(customThemes, id);
    toast.success(`Tema ${name} ativado!`);
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
    },
    fonts: {
      title: 'inherit',
      body: 'inherit',
      ui: 'inherit'
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
      },
      fonts: fonts
    };

    if (editingThemeId) {
      const updated = (customThemes || []).map(t => t.id === editingThemeId ? { ...t, name: newThemeName, colors: themePayload.colors, fonts: themePayload.fonts } : t);
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
    setOriginalThemeState(null);
  };

  const startEditing = (theme: any) => {
    setEditingThemeId(theme.id);
    setNewThemeName(theme.name);
    setDarkPalette(theme.colors.dark || theme.colors);
    setLightPalette(theme.colors.light || theme.colors);
    if (theme.fonts) setFonts(theme.fonts);
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

  const PreviewCard = () => {
    const isDark = activeTab === 'dark' ? true : activeTab === 'light' ? false : previewMode === 'dark';
    const currentP = isDark ? darkPalette : lightPalette;

    // Load fonts for preview
    const previewFontsUrl = `https://fonts.googleapis.com/css2?family=${fonts.title.replace(/ /g, '+')}:wght@400;700;900&family=${fonts.body.replace(/ /g, '+')}:wght@400;700;900&family=${fonts.ui.replace(/ /g, '+')}:wght@400;700;900&display=swap`;
    
    return (
      <div 
        className="p-6 rounded-[32px] border-2 transition-all duration-500 overflow-hidden relative group"
        style={{ 
          backgroundColor: currentP.bg, 
          borderColor: currentP.border,
          color: isDark ? '#f4f4f5' : '#09090b'
        }}
      >
        <link rel="stylesheet" href={previewFontsUrl} />
        <div className="flex items-center gap-3 mb-4">
           <div className="p-2 rounded-xl shadow-lg" style={{ backgroundColor: currentP.primary, color: isDark ? '#000' : '#fff' }}>
              <Sparkles className="w-4 h-4" />
           </div>
           <h4 className="font-black uppercase tracking-tight text-sm" style={{ fontFamily: fonts.title }}>Título da Cena</h4>
        </div>
        
        <p className="text-xs leading-relaxed mb-6 italic" style={{ fontFamily: fonts.body }}>
          "O vento sopra gélido pelas ruínas, carregando sussurros de uma era esquecida..."
        </p>

        <div className="flex gap-2">
           <div 
            className="flex-1 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest text-center shadow-lg transition-transform hover:scale-105"
            style={{ backgroundColor: currentP.primary, color: isDark ? '#000' : '#fff', fontFamily: fonts.ui }}
           >
              Escolha Destino
           </div>
           <div 
            className="flex-1 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest text-center border transition-all"
            style={{ backgroundColor: currentP.surface, borderColor: currentP.border, fontFamily: fonts.ui }}
           >
              Menu Lenda
           </div>
        </div>

        {/* Dynamic Glow Simulation */}
        <div 
          className="absolute -bottom-10 -right-10 w-32 h-32 blur-3xl rounded-full opacity-20 pointer-events-none"
          style={{ backgroundColor: currentP.primary }}
        />
      </div>
    );
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
                <p className="text-portal-text-muted font-body italic">Molde a realidade da sua jornada</p>
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
              className="p-8 bg-portal-surface border-2 border-portal-primary/30 rounded-[40px] shadow-2xl space-y-8"
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
                    <Moon className="w-4 h-4" /> Modo Sombras
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('light')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      activeTab === 'light' ? 'bg-portal-surface text-white shadow-md' : 'text-portal-text-muted hover:text-white'
                    }`}
                  >
                    <Sun className="w-4 h-4" /> Modo Luz
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('fonts')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      activeTab === 'fonts' ? 'bg-portal-surface text-white shadow-md' : 'text-portal-text-muted hover:text-white'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" /> Tipografia
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('essences')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      activeTab === 'essences' ? 'bg-portal-surface text-white shadow-md' : 'text-portal-text-muted hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" /> Essências
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    {activeTab === 'essences' ? (
                       <div className="space-y-6">
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-portal-text-muted mb-2">Presests de Essência</h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                             {visualEssences.map((e) => (
                               <button
                                 key={e.id}
                                 type="button"
                                 onClick={() => applyEssence(e)}
                                 className="p-4 bg-portal-bg border border-portal-border rounded-2xl hover:border-portal-primary/50 transition-all text-left space-y-3 group"
                               >
                                  <div className="flex justify-between items-start">
                                     <span className="text-[10px] font-black uppercase tracking-tight text-portal-text">{e.name.split(' ')[1]}</span>
                                     <div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: e.colors.dark.primary }} />
                                  </div>
                                  <div className="flex gap-1">
                                     <div className="flex-1 h-1 rounded-full" style={{ backgroundColor: e.colors.dark.bg }} />
                                     <div className="flex-1 h-1 rounded-full" style={{ backgroundColor: e.colors.dark.surface }} />
                                  </div>
                               </button>
                             ))}
                             <button
                               type="button"
                               onClick={handleSurpriseMe}
                               className="p-4 bg-portal-primary/10 border-2 border-dashed border-portal-primary/30 rounded-2xl hover:border-portal-primary hover:bg-portal-primary/20 transition-all text-center flex flex-col items-center justify-center gap-2 group"
                             >
                                <RefreshCcw className="w-5 h-5 text-portal-primary group-hover:rotate-180 transition-transform duration-500" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-portal-primary">Me Surpreenda</span>
                             </button>
                          </div>
                          <div className="p-4 bg-portal-primary/5 border border-portal-primary/20 rounded-2xl flex items-center gap-4">
                              <Info className="w-6 h-6 text-portal-primary" />
                              <p className="text-[9px] font-body italic text-portal-text-muted">
                                Escolha uma essência para preencher automaticamente cores e fontes. O preview é aplicado em todo o sistema em tempo real.
                              </p>
                           </div>
                       </div>
                    ) : activeTab !== 'fonts' ? (
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
                                const newDark = activeTab === 'dark' ? { ...darkPalette, primary: val } : darkPalette;
                                const newLight = activeTab === 'light' ? { ...lightPalette, primary: val } : lightPalette;
                                activeTab === 'dark' ? setDarkPalette(newDark) : setLightPalette(newLight);
                                updateLivePreview({ dark: newDark, light: newLight }, fonts);
                              }}
                              className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-none p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-xl [&::-webkit-color-swatch]:border-none"
                            />
                            <p className="text-[9px] font-body italic text-portal-text-muted flex-1">Usada em botões principais e brilhos dinâmicos.</p>
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
                                const newDark = activeTab === 'dark' ? { ...darkPalette, bg: val } : darkPalette;
                                const newLight = activeTab === 'light' ? { ...lightPalette, bg: val } : lightPalette;
                                activeTab === 'dark' ? setDarkPalette(newDark) : setLightPalette(newLight);
                                updateLivePreview({ dark: newDark, light: newLight }, fonts);
                              }}
                              className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-none p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-xl [&::-webkit-color-swatch]:border-none"
                            />
                            <p className="text-[9px] font-body italic text-portal-text-muted flex-1">A base estrutural da página e menus.</p>
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
                                const newDark = activeTab === 'dark' ? { ...darkPalette, surface: val } : darkPalette;
                                const newLight = activeTab === 'light' ? { ...lightPalette, surface: val } : lightPalette;
                                activeTab === 'dark' ? setDarkPalette(newDark) : setLightPalette(newLight);
                                updateLivePreview({ dark: newDark, light: newLight }, fonts);
                              }}
                              className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-none p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-xl [&::-webkit-color-swatch]:border-none"
                            />
                            <p className="text-[9px] font-body italic text-portal-text-muted flex-1">Cor dos painéis e modais.</p>
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
                                const newDark = activeTab === 'dark' ? { ...darkPalette, border: val } : darkPalette;
                                const newLight = activeTab === 'light' ? { ...lightPalette, border: val } : lightPalette;
                                activeTab === 'dark' ? setDarkPalette(newDark) : setLightPalette(newLight);
                                updateLivePreview({ dark: newDark, light: newLight }, fonts);
                              }}
                              className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-none p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-xl [&::-webkit-color-swatch]:border-none"
                            />
                            <p className="text-[9px] font-body italic text-portal-text-muted flex-1">Delimitação de elementos.</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Font Selectors */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {['title', 'body', 'ui'].map((type) => (
                             <div key={type} className="p-4 bg-portal-bg border border-portal-border rounded-2xl space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-portal-text-muted">
                                  {type === 'title' ? 'Fonte de Títulos' : type === 'body' ? 'Fonte da Narrativa' : 'Fonte de Interface'}
                                </label>
                                <select 
                                  value={(fonts as any)[type]}
                                  onChange={(e) => {
                                    const newFonts = { ...fonts, [type]: e.target.value };
                                    setFonts(newFonts);
                                    updateLivePreview({ dark: darkPalette, light: lightPalette }, newFonts);
                                  }}
                                  className="w-full bg-portal-surface border border-portal-border rounded-xl p-3 text-xs font-bold outline-none focus:border-portal-primary"
                                >
                                  {suggestedFonts.map(f => (
                                    <option key={f.name} value={f.name}>{f.name} ({f.type})</option>
                                  ))}
                                </select>
                             </div>
                           ))}
                           <div className="p-4 bg-portal-primary/5 border border-portal-primary/20 rounded-2xl flex items-center gap-4">
                              <Info className="w-6 h-6 text-portal-primary" />
                              <p className="text-[9px] font-body italic text-portal-text-muted">
                                As fontes são carregadas dinamicamente via Google Fonts ao salvar o tema.
                              </p>
                           </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between ml-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-portal-text-muted">Card de Amostra</label>
                      {(activeTab === 'fonts' || activeTab === 'essences') && (
                        <div className="flex p-0.5 bg-portal-bg border border-portal-border rounded-lg">
                          <button
                            type="button"
                            onClick={() => setPreviewMode('dark')}
                            className={`p-1 rounded-md transition-all ${previewMode === 'dark' ? 'bg-portal-surface text-white shadow-sm' : 'text-portal-text-muted hover:text-white'}`}
                            title="Preview no Modo Escuro"
                          >
                            <Moon className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewMode('light')}
                            className={`p-1 rounded-md transition-all ${previewMode === 'light' ? 'bg-portal-surface text-white shadow-sm' : 'text-portal-text-muted hover:text-white'}`}
                            title="Preview no Modo Claro"
                          >
                            <Sun className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                    <PreviewCard />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-4">
                  <button 
                    type="button" 
                    onClick={handleCancel}
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
                    activeThemeId === t.id ? 'border-portal-primary shadow-[0_0_30px_var(--portal-primary-glow-weak)]' : 'border-portal-border hover:border-portal-primary/30'
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
                        onClick={() => handleActivateTheme(t.id, t.name)}
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
              className="fixed bottom-10 left-10 flex items-center gap-3 bg-portal-surface/90 border border-portal-primary/20 px-4 py-2 rounded-full backdrop-blur-md shadow-2xl z-50"
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
