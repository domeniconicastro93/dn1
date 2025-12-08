import fs from 'node:fs/promises';
import path from 'node:path';
import { STEAM_LIBRARY_FOLDERS_PATH } from './env';
import type { SteamLibraryRawEntry } from './types';
import { extractKeyValue } from './utils';

interface SteamLibraryFolder {
  path: string;
}

async function parseLibraryFolders(): Promise<SteamLibraryFolder[]> {
  try {
    const content = await fs.readFile(STEAM_LIBRARY_FOLDERS_PATH, 'utf-8');
    const folderMatches = [...content.matchAll(/"(\d+)"\s*\{([^}]*)\}/g)];
    const folders: SteamLibraryFolder[] = [];

    for (const match of folderMatches) {
      const block = match[2];
      const folderPath = extractKeyValue(block, 'path');
      if (folderPath) {
        folders.push({
          path: folderPath.replace(/\\\\/g, '\\'),
        });
      }
    }

    if (!folders.length) {
      const defaultDir = path.dirname(path.dirname(STEAM_LIBRARY_FOLDERS_PATH));
      folders.push({ path: defaultDir });
    }

    return folders;
  } catch {
    return [];
  }
}

async function parseManifest(manifestPath: string): Promise<SteamLibraryRawEntry | null> {
  try {
    const content = await fs.readFile(manifestPath, 'utf-8');
    const appId = extractKeyValue(content, 'appid');
    if (!appId) {
      return null;
    }
    const name = extractKeyValue(content, 'name');
    const installdir = extractKeyValue(content, 'installdir');
    const lastUpdated = extractKeyValue(content, 'LastUpdated');
    const sizeOnDisk = extractKeyValue(content, 'SizeOnDisk');

    return {
      appId,
      manifestPath,
      name,
      installDir: installdir,
      lastUpdated,
      sizeOnDisk: sizeOnDisk ? Number(sizeOnDisk) : undefined,
    };
  } catch {
    return null;
  }
}

export async function readSteamLibrary(): Promise<SteamLibraryRawEntry[]> {
  const folders = await parseLibraryFolders();
  const entries: SteamLibraryRawEntry[] = [];

  for (const folder of folders) {
    const steamappsDir = path.join(folder.path, 'steamapps');
    try {
      const files = await fs.readdir(steamappsDir);
      for (const file of files) {
        if (!file.startsWith('appmanifest') || !file.endsWith('.acf')) continue;
        const manifestPath = path.join(steamappsDir, file);
        const entry = await parseManifest(manifestPath);
        if (entry) {
          entry.installPath = entry.installDir
            ? path.join(steamappsDir, 'common', entry.installDir)
            : undefined;
          entries.push(entry);
        }
      }
    } catch {
      // Ignore folders we cannot read
    }
  }

  return entries;
}

