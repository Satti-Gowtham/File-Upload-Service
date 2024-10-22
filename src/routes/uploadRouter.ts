import express from 'express';
import multer from 'multer';
import { handleUpload } from '../controllers/uploadController';
import { config } from '../config';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxFileSize,
  },
});

router.post('/', upload.array('files', 10), handleUpload);

export { router as uploadRouter };