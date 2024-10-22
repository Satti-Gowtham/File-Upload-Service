import dotenv from 'dotenv';

dotenv.config();

export const config = {
  storageProvider: process.env.STORAGE_PROVIDER || 'LOCAL',
  allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'pdf,jpg,png,doc,docx,txt').split(','),
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB default
  maxFiles: parseInt(process.env.MAX_FILES || '10', 10), // 10 files default
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    bucketName: process.env.S3_BUCKET_NAME,
  },
  gcloud: {
    projectId: process.env.GCLOUD_PROJECT_ID,
    bucketName: process.env.GCLOUD_BUCKET_NAME,
  },
  azure: {
    connectionString: process.env.AZURE_CONNECTION_STRING,
    containerName: process.env.AZURE_CONTAINER_NAME,
  },
  local: {
    uploadPath: process.env.LOCAL_UPLOAD_PATH || 'uploads',
  },
};