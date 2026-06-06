'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { activeThemeId, customThemes, lightMode } = useGameStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  const activeTheme = (customThemes || []).find((t) => t.id === activeThemeId);
  const palette = activeTheme ? (lightMode ? (activeTheme.colors.light || activeTheme.colors) : (activeTheme.colors.dark || activeTheme.colors)) : null;

  return (
    <>
      {activeTheme && palette && (
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              --portal-bg: ${palette.bg} !important;
              --portal-surface: ${palette.surface} !important;
              --portal-surface-hover: ${palette.surfaceHover} !important;
              --portal-border: ${palette.border} !important;
              --portal-primary: ${palette.primary} !important;
              --portal-primary-foreground: ${palette.primaryForeground} !important;
              --portal-text: ${palette.text} !important;
              --portal-text-muted: ${palette.textMuted} !important;
            }
          `
        }} />
      )}
      {children}
    </>
  );
}
