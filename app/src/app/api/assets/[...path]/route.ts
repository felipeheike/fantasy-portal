import { NextResponse } from 'next/server';
import { s3Client } from '@/lib/storage';
import { GetObjectCommand } from '@aws-sdk/client-s3';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const key = path.join('/');
    const bucketName = process.env.MINIO_BUCKET || 'fantasy-portal-assets';
    const range = req.headers.get('range');

    if (range) {
      // Support for byte-range requests (Seeking/Scrubbing)
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
        Range: range,
      });

      const response = await s3Client.send(command);

      return new NextResponse(response.Body as any, {
        status: 206, // Partial Content
        headers: {
          'Content-Type': response.ContentType || 'audio/mpeg',
          'Content-Range': response.ContentRange || '',
          'Accept-Ranges': 'bytes',
          'Content-Length': response.ContentLength?.toString() || '',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      return new Response('Asset not found', { status: 404 });
    }

    return new NextResponse(response.Body as any, {
      headers: {
        'Content-Type': response.ContentType || 'audio/mpeg',
        'Content-Length': response.ContentLength?.toString() || '',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    if (error.name === 'NoSuchKey') {
      return new Response('Asset not found', { status: 404 });
    }
    console.error('!!! ASSET PROXY ERROR !!!', error);
    return new Response('Error fetching asset', { status: 500 });
  }
}
