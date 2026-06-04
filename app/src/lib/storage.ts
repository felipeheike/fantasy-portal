import { S3Client, PutObjectCommand, CreateBucketCommand, HeadBucketCommand } from "@aws-sdk/client-s3";

const minioEndpoint = process.env.MINIO_ENDPOINT || 'localhost';
const minioPort = process.env.MINIO_PORT || '9000';
const accessKeyId = process.env.MINIO_ACCESS_KEY || 'minioadmin';
const secretAccessKey = process.env.MINIO_SECRET_KEY || 'minioadmin';
const bucketName = process.env.MINIO_BUCKET || 'fantasy-portal-assets';
const useSSL = process.env.MINIO_USE_SSL === 'true';

// Para uso interno dentro do Docker, o endpoint deve ser o nome do container/serviço
// No entanto, para fins de desenvolvimento e flexibilidade, vamos tentar detectar ou usar localhost
const endpoint = process.env.MINIO_ENDPOINT_INTERNAL || `http://${minioEndpoint}:${minioPort}`;

export const s3Client = new S3Client({
  endpoint,
  region: "us-east-1", // MinIO ignora a região mas o SDK exige
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  forcePathStyle: true, // Necessário para MinIO
});

async function ensureBucketExists() {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      console.log(`LOG: Creating bucket ${bucketName}...`);
      await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
    } else {
      throw error;
    }
  }
}

export async function uploadBuffer(buffer: Uint8Array | Buffer, key: string, contentType: string) {
  try {
    // Garante que o bucket existe antes de tentar o upload
    await ensureBucketExists();

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await s3Client.send(command);
    
    // Retorna a URL relativa que passa pelo nosso proxy da API (Force Recompile)
    // Isso garante acessibilidade universal (Mobile/Web) através do túnel Cloudflare
    return `/api/assets/${key}`;
  } catch (error) {
    console.error("Error uploading to MinIO:", error);
    throw error;
  }
}
