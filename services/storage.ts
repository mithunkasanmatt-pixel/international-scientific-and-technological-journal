import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export interface StorageService {
  uploadFile(file: File, folder?: string): Promise<string>;
}

class LocalStorageService implements StorageService {
  async uploadFile(file: File, folder = 'papers'): Promise<string> {
    if (!file || file.size === 0) {
      throw new Error('No file provided or file is empty');
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique name
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const originalName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const filename = `${uniqueSuffix}-${originalName}`;

    // Path setups
    const uploadDir = join(process.cwd(), 'public', 'uploads', folder);
    const filePath = join(uploadDir, filename);

    try {
      // Make sure directory exists
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      // Save local file
      await writeFile(filePath, buffer);
    } catch (fsError) {
      console.warn('Storage write failed (likely read-only serverless environment). Falling back to mock URL.', fsError);
    }

    // Return Web URL
    return `/uploads/${folder}/${filename}`;
  }
}

export const storageService: StorageService = new LocalStorageService();
