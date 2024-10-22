import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { generateUniqueFilename } from '../middleware/upload';
import { config } from '../config';
import AWS from 'aws-sdk';
import { Storage } from '@google-cloud/storage';
import { BlobServiceClient } from '@azure/storage-blob';

interface StorageProvider {
  saveFile: (fileStream: Readable, originalname: string, mimetype: string) => Promise<{ filename: string; path: string }>;
}

class LocalStorageProvider implements StorageProvider {
  async saveFile(fileStream: Readable, originalname: string): Promise<{ filename: string; path: string }> {
    const uploadDir = path.join(__dirname, '..', '..', config.local.uploadPath);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = generateUniqueFilename(originalname);
    const filePath = path.join(uploadDir, filename);

    const writeStream = fs.createWriteStream(filePath);
    await new Promise((resolve, reject) => {
      fileStream.pipe(writeStream)
        .on('finish', resolve)
        .on('error', reject);
    });

    return {
      filename,
      path: filePath,
    };
  }
}

class S3StorageProvider implements StorageProvider {
  private s3: AWS.S3;

  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
      region: config.aws.region,
    });
  }

  async saveFile(fileStream: Readable, originalname: string, mimetype: string): Promise<{ filename: string; path: string }> {
    const filename = generateUniqueFilename(originalname);

    const params = {
      Bucket: config.aws.bucketName!,
      Key: filename,
      Body: fileStream,
      ContentType: mimetype,
    };

    await this.s3.upload(params).promise();

    return {
      filename,
      path: `https://${config.aws.bucketName}.s3.amazonaws.com/${filename}`,
    };
  }
}

class GCloudStorageProvider implements StorageProvider {
  private storage: Storage;

  constructor() {
    this.storage = new Storage({
      projectId: config.gcloud.projectId,
    });
  }

  async saveFile(fileStream: Readable, originalname: string, mimetype: string): Promise<{ filename: string; path: string }> {
    const filename = generateUniqueFilename(originalname);
    const bucket = this.storage.bucket(config.gcloud.bucketName!);
    const file = bucket.file(filename);

    await new Promise((resolve, reject) => {
      fileStream
        .pipe(file.createWriteStream({
          metadata: {
            contentType: mimetype,
          },
        }))
        .on('finish', resolve)
        .on('error', reject);
    });

    return {
      filename,
      path: `https://storage.googleapis.com/${config.gcloud.bucketName}/${filename}`,
    };
  }
}

class AzureStorageProvider implements StorageProvider {
  private blobServiceClient: BlobServiceClient;

  constructor() {
    this.blobServiceClient = BlobServiceClient.fromConnectionString(config.azure.connectionString!);
  }

  async saveFile(fileStream: Readable, originalname: string, mimetype: string): Promise<{ filename: string; path: string }> {
    const filename = generateUniqueFilename(originalname);
    const containerClient = this.blobServiceClient.getContainerClient(config.azure.containerName!);
    const blockBlobClient = containerClient.getBlockBlobClient(filename);

    await blockBlobClient.uploadStream(fileStream, undefined, undefined, {
      blobHTTPHeaders: { blobContentType: mimetype }
    });

    return {
      filename,
      path: blockBlobClient.url,
    };
  }
}

const getStorageProvider = (): StorageProvider => {
  switch (config.storageProvider) {
    case 'S3':
      return new S3StorageProvider();
    case 'GCLOUD':
      return new GCloudStorageProvider();
    case 'AZURE':
      return new AzureStorageProvider();
    case 'LOCAL':
    default:
      return new LocalStorageProvider();
  }
};

const storageProvider: StorageProvider = getStorageProvider();

export const saveFile = (fileStream: Readable, originalname: string, mimetype: string) => storageProvider.saveFile(fileStream, originalname, mimetype);