import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { config } from '../config';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: `File size limit exceeded (max ${config.maxFileSize / (1024 * 1024)} MB)` });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: `Too many files (max ${config.maxFiles})` });
    }
  }
  res.status(500).json({ error: err.message });
};