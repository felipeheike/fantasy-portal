'use client';

import { useEffect, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { ACCESSIBILITY_PRESETS } from '@/lib/themePresets';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { activeThemeId, customThemes, lightMode, theme, reduceMotion, fontScale, useSystemTheme } = useGameStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      // Compatibility with both 'theme' and 'lightMode' states
      const isLight = lightMode || theme === 'light';
      if (isLight) {
        document.documentElement.classList.add('light-mode');
      } else {
        document.documentElement.classList.remove('light-mode');
      }
    }
  }, [lightMode, theme, mounted]);

  useEffect(() => {
    if (!mounted || !useSystemTheme) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const applySystemTheme = () => {
      const isDark = mediaQuery.matches;
      useGameStore.setState({ lightMode: !isDark, theme: isDark ? 'dark' : 'light' });
    };
    applySystemTheme();
    mediaQuery.addEventListener('change', applySystemTheme);
    return () => mediaQuery.removeEventListener('change', applySystemTheme);
  }, [mounted, useSystemTheme]);

  const activeTheme = [...ACCESSIBILITY_PRESETS, ...(customThemes || [])].find((t) => t.id === activeThemeId);
  const isDefault = !activeTheme || activeThemeId === 'default';
  const palette = activeTheme ? (lightMode ? (activeTheme.colors.light || activeTheme.colors) : (activeTheme.colors.dark || activeTheme.colors)) : null;
  const fonts = activeTheme?.fonts;

  // Geist is local (next/font), no need to fetch it from Google.
  const fontFamilies = fonts
    ? Array.from(new Set([fonts.title, fonts.body, fonts.ui].filter((f): f is string => !!f && f !== 'inherit' && f !== 'Geist')))
    : [];
  const fontFamiliesKey = fontFamilies.join('|');

  // O <link> do Google Fonts sozinho não garante que o navegador baixe a fonte a tempo —
  // sem uso explícito, ela pode ficar só declarada no CSS e nunca ser buscada, deixando o
  // texto no fallback (Geist) indefinidamente mesmo com a folha de estilo já carregada.
  useEffect(() => {
    if (!mounted || fontFamilies.length === 0) return;
    fontFamilies.forEach((family) => {
      ['400', '700', '900'].forEach((weight) => {
        document.fonts.load(`${weight} 16px "${family}"`).catch(() => {});
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, fontFamiliesKey]);

  if (!mounted) {
    return <>{children}</>;
  }

  // 'user' respeita o prefers-reduced-motion do SO por padrão; 'always' força quando o
  // jogador liga o toggle no Theme Hub, independente do SO.
  const motionPreference = reduceMotion ? 'always' : 'user';

  const googleFontsUrl = fontFamilies.length > 0
    ? `https://fonts.googleapis.com/css2?${fontFamilies.map(f => `family=${f.replace(/ /g, '+')}:wght@400;700;900`).join('&')}&display=swap`
    : null;

  return (
    <MotionConfig reducedMotion={motionPreference}>
      {googleFontsUrl && <link rel="stylesheet" href={googleFontsUrl} />}
      {fontScale !== 1 && (
        <style dangerouslySetInnerHTML={{ __html: `html { font-size: ${fontScale * 100}% !important; }` }} />
      )}
      {!isDefault && activeTheme && (
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              ${palette ? `
                --portal-bg: ${palette.bg} !important;
                --portal-surface: ${palette.surface} !important;
                --portal-surface-hover: ${palette.surfaceHover} !important;
                --portal-border: ${palette.border} !important;
                --portal-primary: ${palette.primary} !important;
                --portal-primary-foreground: ${palette.primaryForeground} !important;
                --portal-text: ${palette.text} !important;
                --portal-text-muted: ${palette.textMuted} !important;
              ` : ''}
              --font-title: "${fonts?.title || 'Geist'}", var(--font-geist-sans), sans-serif !important;
              --font-body: "${fonts?.body || 'ui-serif'}", var(--font-geist-sans), serif !important;
              --font-ui: "${fonts?.ui || 'Geist'}", var(--font-geist-sans), sans-serif !important;
              --font-mono: "${fonts?.ui === 'Geist' ? 'var(--font-geist-mono)' : 'ui-monospace'}", monospace !important;
            }
          `
        }} />
      )}
      {children}
    </MotionConfig>
  );
}
