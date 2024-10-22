import NodeClam from 'clamscan';
import { config } from '../config';

let clamav: NodeClam;

const initializeClamAV = async () => {
  if (!clamav) {
    clamav = await new NodeClam().init({
      clamdscan: {
        socket: '/var/run/clamav/clamd.ctl',
        host: 'localhost',
        port: 3310,
      },
    });
  }
};

export const scanFile = async (filePath: string): Promise<{ isClean: boolean; viruses: string[] }> => {
  if (config.storageProvider !== 'LOCAL') {
    return { isClean: true, viruses: [] };
  }

  try {
    await initializeClamAV();
    const { isInfected, viruses } = await clamav.scanFile(filePath);
    return {
      isClean: !isInfected,
      viruses: viruses || [],
    };
  } catch (error) {
    console.error('Virus scan failed:', error);
    return { isClean: false, viruses: ['Scan failed'] };
  }
};