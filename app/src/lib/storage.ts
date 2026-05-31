import { S3Client, PutObjectCommand, CreateBucketCommand, HeadBucketCommand } from "@aws-sdk/client-s3";

const minioEndpoint = process.env.MINIO_ENDPOINT || 'localhost';
const minioPort = process.env.MINIO_PORT || '9000';
const accessKeyId = process.env.MINIO_ACCESS_KEY || 'minioadmin';
const secretAccessKey = process.env.MINIO_SECRET_KEY || 'minioadmin';
const bucketName = process.env.MINIO_BUCKET || 'fantasy-portal-assets';
const useSSL = process.env.MINIO_USE_SSL === 'true';

// Para uso interno dentro do Docker, o endpoint deve ser o nome do container
// No entanto, para fins de desenvolvimento e flexibilidade, vamos tentar detectar ou usar localhost
// Se estiver rodando dentro do Docker, storage_minio:9000 é o ideal.
const isDocker = process.env.DATABASE_URL?.includes('db_postgres');
const endpoint = isDocker 
  ? `http://storage_minio:9000` 
  : `http://${minioEndpoint}:${minioPort}`;

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
    
    // Retorna a URL pública (ou formatada)
    const baseUrl = process.env.NEXT_PUBLIC_ASSETS_URL || `http://localhost:${minioPort}/${bucketName}`;
    return `${baseUrl}/${key}`;
  } catch (error) {
    console.error("Error uploading to MinIO:", error);
    throw error;
  }
}
