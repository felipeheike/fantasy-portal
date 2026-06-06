import { NarrativeScene, JourneySettings } from '@/types';
import { toast } from 'sonner';

/**
 * Persistently exports a journey by calling the backend API.
 * The backend handles hashing, server-side generation, and MinIO caching.
 */
export async function generateJourneyPDF(
  history: NarrativeScene[], 
  settings: JourneySettings | null,
  playerName: string,
  journeyId?: string | null,
  includeImages: boolean = true
) {
  if (!journeyId) {
    toast.error("Identificador da jornada não encontrado. Não é possível exportar persistentemente.");
    return;
  }

  const toastId = toast.loading("Sincronizando Crônicas...", {
    description: includeImages 
      ? "O mestre está consultando o grimório e forjando seu livro de arte."
      : "O mestre está transcrevendo suas crônicas."
  });

  try {
    const response = await fetch(`/api/journey/${journeyId}/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ includeImages })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Falha na forja do PDF");
    }

    // Trigger Download
    const link = document.createElement('a');
    link.href = data.url;
    link.download = `jornada-${playerName.toLowerCase().replace(/\s+/g, '-')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(data.cached ? "Recuperado do Grimório" : "PDF Forjado com Sucesso", {
      id: toastId,
      description: data.message
    });

  } catch (error: any) {
    console.error("PDF_EXPORT_UI_ERR:", error);
    toast.error("Erro na Manifestação", {
      id: toastId,
      description: "As sombras impediram a conclusão do seu livro de arte. Tente novamente em instantes."
    });
  }
}
