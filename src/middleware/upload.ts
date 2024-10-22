import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { config } from '../config';

export const fileFilter = (req: Request, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void) => {
  const fileExtension = path.extname(file.originalname).slice(1).toLowerCase();
  if (config.allowedFileTypes.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Allowed types: ${config.allowedFileTypes.join(', ')}`), false);
  }
};

export const generateUniqueFilename = (originalname: string): string => {
  return `${uuidv4()}${path.extname(originalname)}`;
};