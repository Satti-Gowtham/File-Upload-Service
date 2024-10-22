import { Request, Response } from 'express';
import { Readable } from 'stream';
import { saveFile } from '../services/storageService';
import { fileFilter } from '../middleware/upload';
import { scanFile } from '../services/virusScanner';
import { config } from '../config';

export const handleUpload = async (req: Request, res: Response) => {
  if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
    return res.status(400).json({ error: 'No files uploaded or invalid file type' });
  }

  // Initialize an array to hold uploaded files
  let uploadedFiles: Express.Multer.File[] = [];

  // Handle different shapes of req.files
  if (Array.isArray(req.files)) {
    uploadedFiles = req.files;
  } else if (typeof req.files === 'object') {
    // req.files is an object mapping field names to arrays of File objects
    Object.values(req.files).forEach((fileArray) => {
      uploadedFiles.push(...fileArray);
    });
  }

  try {
    const results = await Promise.all(uploadedFiles.map(async (file) => {
      // Check file type
      let isValidFile = true;
      fileFilter(req, file, (err: Error | null, acceptFile: boolean) => {
        if (err || !acceptFile) {
          isValidFile = false;
        }
      });

      if (!isValidFile) {
        return { 
          originalname: file.originalname, 
          error: 'Invalid file type' 
        };
      }

      // Create a Readable stream from the file buffer
      const fileStream = new Readable();
      fileStream.push(file.buffer);
      fileStream.push(null);

      const savedFile = await saveFile(fileStream, file.originalname, file.mimetype);

      // Scan the file for viruses if using local storage
      if (config.storageProvider === 'LOCAL') {
        const scanResult = await scanFile(savedFile.path);
        if (!scanResult.isClean) {
          return { 
            originalname: file.originalname, 
            error: 'File is infected with a virus' 
          };
        }
      }

      return {
        originalname: file.originalname,
        filename: savedFile.filename,
        path: savedFile.path,
      };
    }));

    res.status(200).json({
      message: 'Files processed',
      results: results,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process files' });
  }
};