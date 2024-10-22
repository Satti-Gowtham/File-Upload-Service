import express from 'express';
import { uploadRouter } from './routes/uploadRouter';
import { errorHandler } from './middleware/errorHandler';
import { config } from './config';

const app = express();
const port = process.env.PORT || 3000;

app.use('/upload', uploadRouter);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`File Upload Service listening at http://localhost:${port}`);
  console.log(`Using storage provider: ${config.storageProvider}`);
  console.log(`Allowed file types: ${config.allowedFileTypes.join(', ')}`);
  console.log(`Max file size: ${config.maxFileSize / (1024 * 1024)} MB`);
});