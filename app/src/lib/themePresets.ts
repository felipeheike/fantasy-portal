import { CustomTheme } from '@/store/gameStore';

// Temas embutidos no código (não no banco) — ativáveis direto na lista principal do
// Theme Hub, como o "Tema Padrão", sem precisar passar pelo formulário de criação.
// Paletas completas (8 tokens): diferente das essências cosméticas, aqui a precisão de
// contraste importa, então nada fica pra herdar do tema padrão.
export const ACCESSIBILITY_PRESETS: (CustomTheme & { description: string })[] = [
  {
    id: 'a11y-high-contrast',
    name: '⬛ Alto Contraste',
    description: 'Fundo e texto extremos, bordas visíveis — para baixa visão.',
    colors: {
      dark: {
        bg: '#000000', surface: '#0a0a0a', surfaceHover: '#1f1f1f', border: '#ffffff',
        primary: '#fbbf24', primaryForeground: '#000000', text: '#ffffff', textMuted: '#e4e4e7'
      },
      light: {
        bg: '#ffffff', surface: '#f4f4f5', surfaceHover: '#e4e4e7', border: '#000000',
        primary: '#92400e', primaryForeground: '#ffffff', text: '#000000', textMuted: '#3f3f46'
      }
    },
    fonts: { title: 'Inter', body: 'Inter', ui: 'Inter' }
  },
  {
    id: 'a11y-easy-reading',
    name: '🔤 Leitura Fácil',
    description: 'Fonte Atkinson Hyperlegible — feita para dislexia e baixa acuidade visual.',
    colors: {
      dark: {
        bg: '#09090b', surface: '#18181b', surfaceHover: '#27272a', border: '#27272a',
        primary: '#f59e0b', primaryForeground: '#09090b', text: '#f4f4f5', textMuted: '#a1a1aa'
      },
      light: {
        bg: '#f4f4f5', surface: '#ffffff', surfaceHover: '#e4e4e7', border: '#d4d4d8',
        primary: '#d97706', primaryForeground: '#ffffff', text: '#09090b', textMuted: '#52525b'
      }
    },
    fonts: { title: 'Atkinson Hyperlegible', body: 'Atkinson Hyperlegible', ui: 'Atkinson Hyperlegible' }
  },
  {
    id: 'a11y-colorblind-safe',
    name: '🔵 Contraste Seguro',
    description: 'Destaque azul (paleta Okabe-Ito) em vez de âmbar/vermelho — mais distinguível para daltonismo.',
    colors: {
      dark: {
        bg: '#09090b', surface: '#18181b', surfaceHover: '#27272a', border: '#27272a',
        primary: '#0072b2', primaryForeground: '#ffffff', text: '#f4f4f5', textMuted: '#a1a1aa'
      },
      light: {
        bg: '#f4f4f5', surface: '#ffffff', surfaceHover: '#e4e4e7', border: '#d4d4d8',
        primary: '#0058a3', primaryForeground: '#ffffff', text: '#09090b', textMuted: '#52525b'
      }
    },
    fonts: { title: 'Inter', body: 'Inter', ui: 'Inter' }
  }
];

export function isBuiltInThemeId(id: string): boolean {
  return id === 'default' || ACCESSIBILITY_PRESETS.some((p) => p.id === id);
}
