import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { s3Client } from '@/lib/storage';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import * as jspdf from 'jspdf';
import sharp from 'sharp';
import { NarrativeScene, JourneySettings } from '@/types';

// Helper to generate hash of history based on mode
function generateHistoryHash(history: any[], includeImages: boolean): string {
  const content = JSON.stringify(history.map(s => ({
    id: s.sceneId,
    // For text mode, we ignore image changes to keep cache longer
    imageUrl: includeImages ? s.imageUrl : undefined,
    narration: s.narration
  })));
  // Add suffix to distinguish modes in hash
  return crypto.createHash('sha256').update(content + (includeImages ? '-art' : '-text')).digest('hex');
}

// Backend version of image fetch with compression
async function fetchAndCompressImage(url: string): Promise<{ data: string, format: string } | null> {
  try {
    const bucketName = process.env.MINIO_BUCKET || 'fantasy-portal-assets';
    let bytes: Uint8Array | null = null;

    // 1. Get raw bytes
    if (url.startsWith('/api/assets/')) {
      const key = url.replace('/api/assets/', '');
      const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
      const response = await s3Client.send(command);
      if (!response.Body) return null;
      bytes = await response.Body.transformToByteArray();
    } 
    else if (url.includes('/fantasy-portal-assets/')) {
      const key = url.split('/fantasy-portal-assets/')[1];
      const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
      const response = await s3Client.send(command);
      if (!response.Body) return null;
      bytes = await response.Body.transformToByteArray();
    }
    else if (url.startsWith('http')) {
      const response = await fetch(url);
      if (!response.ok) return null;
      const arrayBuffer = await response.arrayBuffer();
      bytes = new Uint8Array(arrayBuffer);
    }

    if (!bytes) return null;

    // 2. Compress using sharp
    const compressedBuffer = await sharp(bytes)
      .resize(1280) 
      .jpeg({ quality: 75, progressive: true })
      .toBuffer();

    return { 
      data: compressedBuffer.toString('base64'), 
      format: 'JPEG' 
    };
  } catch (e) {
    console.error("Image processing failed:", e);
    return null;
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { includeImages = true } = await req.json();

    const journey = await prisma.journey.findUnique({
      where: { id },
      include: { player: true }
    });

    if (!journey) {
      return NextResponse.json({ error: 'Jornada não encontrada' }, { status: 404 });
    }

    const history = (journey.history as any[]) || [];
    
    // Strict Deduplication
    const seenIds = new Set();
    const cleanHistory = history.filter(s => {
      if (!s.sceneId || s.sceneId === 'undefined' || seenIds.has(s.sceneId)) return false;
      seenIds.add(s.sceneId);
      return true;
    });

    const currentHash = generateHistoryHash(cleanHistory, includeImages);

    // 1. Check Cache based on mode
    const cachedUrl = includeImages ? journey.lastPdfUrl : journey.lastTextPdfUrl;
    const cachedHash = includeImages ? journey.lastPdfHash : journey.lastTextPdfHash;

    if (cachedHash === currentHash && cachedUrl) {
      console.log(`PDF_CACHE_HIT [${includeImages ? 'ART' : 'TEXT'}]: ${id}`);
      return NextResponse.json({ 
        url: cachedUrl, 
        cached: true,
        message: `Recuperado do Grimório (${includeImages ? 'Livro de Arte' : 'Crônicas'})` 
      });
    }

    console.log(`PDF_CACHE_MISS: Generating new ${includeImages ? 'Art' : 'Text'} PDF for ${id}`);

    // 2. Generate New PDF
    const jsPDFConstructor: any = (jspdf as any).jsPDF || (jspdf as any).default?.jsPDF || jspdf;
    const doc = new jsPDFConstructor({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true 
    });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    const playerName = (journey.flags as any)?.playerName || journey.player?.name || 'Viajante';

    // --- Capa ---
    doc.setFillColor(15, 15, 15);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    doc.setTextColor(245, 158, 11);
    doc.setFont('times', 'bold');
    doc.setFontSize(40);
    doc.text('FANTASY PORTAL', pageWidth / 2, 80, { align: 'center' });
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(24);
    doc.text(includeImages ? 'O Livro de Arte' : 'As Crônicas de', pageWidth / 2, 100, { align: 'center' });
    doc.setFontSize(32);
    doc.text(playerName.toUpperCase(), pageWidth / 2, 115, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`Gênero: ${journey.genre}`, margin, 250);
    doc.text(`Data: ${new Date().toLocaleDateString()}`, margin, 260);

    // --- Cenas ---
    for (let i = 0; i < cleanHistory.length; i++) {
      const scene = cleanHistory[i] as NarrativeScene;
      doc.addPage();
      
      doc.setFillColor(30, 30, 30);
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(245, 158, 11);
      doc.setFontSize(18);
      doc.text(`CAPÍTULO ${i + 1}`, margin, 25);
      
      let currentY = 55;

      // Handle Images only if requested
      if (includeImages && scene.imageUrl) {
        const imageData = await fetchAndCompressImage(scene.imageUrl);
        if (imageData) {
          const imgHeight = (contentWidth * 9) / 16;
          if (currentY + imgHeight > pageHeight - margin) {
            doc.addPage();
            currentY = margin;
          }
          try {
            doc.addImage(`data:image/jpeg;base64,${imageData.data}`, 'JPEG', margin, currentY, contentWidth, imgHeight, undefined, 'FAST');
            currentY += imgHeight + 10;
          } catch (imgErr) {
            console.error("jsPDF_addImage_ERR:", imgErr);
            doc.setFontSize(10);
            doc.setTextColor(150, 150, 150);
            doc.text(`[Ilustração preservada no portal]`, margin, currentY);
            currentY += 10;
          }
        } else {
          doc.setFontSize(10);
          doc.setTextColor(150, 150, 150);
          doc.rect(margin, currentY, contentWidth, 20, 'S');
          doc.text(`[Ilustração: ${scene.visualDescription?.substring(0, 70) || 'Indescritível'}...]`, margin + 5, currentY + 12);
          currentY += 30;
        }
      } else if (includeImages && !scene.imageUrl) {
        doc.setFontSize(10);
        doc.setTextColor(180, 180, 180);
        doc.setFont('times', 'italic');
        doc.text("[A essência visual desta cena ainda não se manifestou no pergaminho...]", margin, currentY);
        currentY += 15;
      }

      doc.setTextColor(40, 40, 40);
      doc.setFont('times', 'normal');
      doc.setFontSize(12);
      const lines = doc.splitTextToSize(scene.narration, contentWidth);
      if (currentY + (lines.length * 7) > pageHeight - margin) {
          doc.addPage();
          currentY = margin + 10;
      }
      doc.text(lines, margin, currentY);
      currentY += (lines.length * 7) + 10;

      if (scene.selectedOption) {
        doc.setFont('times', 'italic');
        doc.setTextColor(245, 158, 11);
        doc.text(`Sua decisão: "${scene.selectedOption}"`, margin, currentY);
      }
    }

    // --- Footer ---
    const totalPages = doc.getNumberOfPages();
    for (let j = 2; j <= totalPages; j++) {
      doc.setPage(j);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Gerado por Fantasy Portal - Página ${j - 1} de ${totalPages - 1}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    // 3. Upload to MinIO
    const pdfBuffer = doc.output('arraybuffer');
    const bucketName = process.env.MINIO_BUCKET || 'fantasy-portal-assets';
    const modeSuffix = includeImages ? 'art' : 'text';
    const fileName = `exports/pdfs/${id}-${currentHash}-${modeSuffix}.pdf`;

    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: Buffer.from(pdfBuffer),
      ContentType: 'application/pdf',
    }));

    const pdfUrl = `/api/assets/${fileName}`;

    // 4. Update DB using Raw SQL
    const urlField = includeImages ? 'lastPdfUrl' : 'lastTextPdfUrl';
    const hashField = includeImages ? 'lastPdfHash' : 'lastTextPdfHash';
    
    try {
      await (prisma as any).$executeRawUnsafe(
        `UPDATE "Journey" SET "${urlField}" = $1, "${hashField}" = $2 WHERE id = $3`,
        pdfUrl, currentHash, id
      );
    } catch (sqlErr) {
      console.error('RAW_SQL_UPDATE_ERR:', sqlErr);
    }

    return NextResponse.json({ 
      url: pdfUrl, 
      cached: false,
      message: `Crônicas (${includeImages ? 'Arte' : 'Texto'}) forjadas e salvas no MinIO` 
    });

  } catch (error: any) {
    console.error('PDF_EXPORT_FAILURE:', error);
    return NextResponse.json({ 
      error: 'Falha ao exportar PDF',
      details: error.message 
    }, { status: 500 });
  }
}
