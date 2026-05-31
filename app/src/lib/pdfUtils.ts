import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { NarrativeScene, JourneySettings } from '@/types';

export async function generateJourneyPDF(
  history: NarrativeScene[], 
  settings: JourneySettings | null,
  playerName: string
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  // --- Capa ---
  doc.setFillColor(15, 15, 15); // Dark background
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  doc.setTextColor(245, 158, 11); // Primary color
  doc.setFont('times', 'bold');
  doc.setFontSize(40);
  doc.text('FANTASY PORTAL', pageWidth / 2, 80, { align: 'center' });
  
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(24);
  doc.text('As Crônicas de', pageWidth / 2, 100, { align: 'center' });
  doc.setFontSize(32);
  doc.text(playerName.toUpperCase(), pageWidth / 2, 115, { align: 'center' });

  doc.setFontSize(14);
  doc.text(`Gênero: ${settings?.genre || 'Fantasia'}`, margin, 250);
  doc.text(`Data: ${new Date().toLocaleDateString()}`, margin, 260);

  // --- Conteúdo das Cenas ---
  for (let i = 0; i < history.length; i++) {
    const scene = history[i];
    doc.addPage();
    
    // Header do Capítulo
    doc.setFillColor(30, 30, 30);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(245, 158, 11);
    doc.setFontSize(18);
    doc.text(`CAPÍTULO ${i + 1}`, margin, 25);
    
    let currentY = 55;

    // Imagem da Cena (se houver)
    if (scene.imageUrl) {
      try {
        // Nota: jsPDF as vezes tem problemas com URLs externas ou proxies. 
        // Em um ambiente real, poderíamos precisar converter para base64 primeiro.
        // Vamos tentar adicionar a imagem se possível.
        // doc.addImage(scene.imageUrl, 'PNG', margin, currentY, contentWidth, 80);
        // currentY += 90;
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`[Ilustração: ${scene.visualDescription.substring(0, 80)}...]`, margin, currentY);
        currentY += 10;
      } catch (e) {
        console.warn("Could not add image to PDF", e);
      }
    }

    // Narração
    doc.setTextColor(40, 40, 40);
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    
    const lines = doc.splitTextToSize(scene.narration, contentWidth);
    
    // Verifica se precisa de nova página para o texto
    if (currentY + (lines.length * 7) > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
    }
    
    doc.text(lines, margin, currentY);
    currentY += (lines.length * 7) + 10;

    // Escolha do Jogador
    if (scene.selectedOption) {
      doc.setFont('times', 'italic');
      doc.setTextColor(245, 158, 11);
      doc.text(`Sua decisão: "${scene.selectedOption}"`, margin, currentY);
    }
  }

  // --- Rodapé em todas as páginas exceto capa ---
  const totalPages = doc.getNumberOfPages();
  for (let j = 2; j <= totalPages; j++) {
    doc.setPage(j);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Gerado por Fantasy Portal - Página ${j - 1} de ${totalPages - 1}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  doc.save(`jornada-${playerName.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}
