import { Storage } from '@google-cloud/storage';

const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS as string),
});

const bucket = storage.bucket(process.env.GOOGLE_CLOUD_BUCKET_NAME as string);

export async function uploadToGoogleCloud(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const blob = bucket.file(file.name);
  const blobStream = blob.createWriteStream();

  return new Promise((resolve, reject) => {
    blobStream.on('error', (err) => {
      reject(err);
    });

    blobStream.on('finish', () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
      resolve(publicUrl);
    });

    blobStream.end(buffer);
  });
}