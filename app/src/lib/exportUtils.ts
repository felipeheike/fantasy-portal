import { NarrativeScene, JourneySettings } from '@/types';

const genreEmojis: Record<string, string> = {
  'fantasy': '🧙‍♂️',
  'cyberpunk': '🌆',
  'sci-fi': '🚀',
  'post-apocalyptic': '☢️',
  'gothic-horror': '🧛',
  'pirates': '🏴‍☠️',
  'western': '🤠',
  'medieval-epic': '⚔️',
  'steampunk': '⚙️',
  'real-world': '🏙️',
};

export const exportJourneyToMarkdown = (
  history: NarrativeScene[],
  settings: JourneySettings | null,
  playerName: string,
  currentScene?: NarrativeScene | null
) => {
  // Defensive fallbacks to prevent empty file
  const genre = settings?.genre || 'fantasy';
  const name = playerName || settings?.playerName || 'Viajante';
  const emoji = genreEmojis[genre] || '📜';
  const genreName = genre.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  // Construct full history including current scene if not redundant
  const fullHistory = [...(history || [])];
  if (currentScene && (!fullHistory.length || fullHistory[fullHistory.length - 1].sceneId !== currentScene.sceneId)) {
    fullHistory.push(currentScene);
  }

  // Header always present
  let markdown = `# ${emoji} ${genreName}: A Lenda de ${name}\n\n`;
  markdown += `> *"O destino é escrito por aqueles que ousam atravessar o portal."*\n\n---\n\n`;

  if (fullHistory.length === 0) {
    markdown += `*A jornada ainda está sendo escrita nas estrelas...*\n`;
    return markdown;
  }

  fullHistory.forEach((scene, index) => {
    const isLast = index === fullHistory.length - 1;
    const isGameOver = scene.isGameOver;
    
    // Dynamic Chapter Titles
    if (isGameOver && index === fullHistory.length - 1) {
       markdown += `## ☠️ Capítulo ${index + 1} — O Desfecho Final\n\n`;
    } else if (index >= fullHistory.length - 3 && fullHistory[fullHistory.length - 1].isGameOver) {
       markdown += `## ⚔️ Capítulo ${index + 1}\n\n`;
    } else {
       markdown += `## 📖 Capítulo ${index + 1}\n\n`;
    }

    markdown += `${scene.narration || '*Sem narração disponível.*'}\n\n`;

    if (scene.selectedOption) {
      markdown += `### 🎯 Escolha\n**${scene.selectedOption}**\n\n`;
    }

    if (scene.visualDescription) {
      markdown += `🎨 **Cena Ilustrada**\n> ${scene.visualDescription}\n\n`;
    }

    if (!isLast) {
      markdown += `---\n\n`;
    }
  });

  if (fullHistory.length > 0 && fullHistory[fullHistory.length - 1].isGameOver) {
    markdown += `---\n\n# 🏴 Epílogo — O Legado\n\nA lenda de ${name} agora ecoa através do tempo. O destino foi selado.\n\n---\n\n## 🏆 Fim da Jornada\n\n> *"O destino foi implacável, mas suas cinzas agora sopram através dos portais da história."*\n`;
  }

  return markdown;
};

export const downloadMarkdown = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
