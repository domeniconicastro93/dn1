import path from 'node:path';
import { readSteamLibrary } from './steam-reader';
import { fetchSteamMetadata } from './steam-web-api';
import type {
  SteamInstalledGameDTO,
  SteamLibraryResponseDTO,
  SteamLibrarySyncResponseDTO,
  SteamLibraryRawEntry,
} from './types';
import {
  STEAM_VM_ID,
  STEAM_VM_NAME,
  STEAM_VM_STATUS,
  STEAM_REGION,
} from './env';
import { findSteamExecutableMapping } from '@strike/shared-types';

export class SteamLibraryCache {
  private rawEntries: SteamLibraryRawEntry[] = [];
  private games: SteamInstalledGameDTO[] = [];
  private lastSyncedAt = new Date(0).toISOString();
  private metadata = new Map<string, SteamInstalledGameDTO['metadata']>();
  private syncing = false;

  async sync(): Promise<SteamLibrarySyncResponseDTO> {
    if (this.syncing) {
      return {
        success: true,
        scanned: this.rawEntries.length,
        processed: this.games.length,
        lastSyncedAt: this.lastSyncedAt,
      };
    }

    this.syncing = true;
    try {
      const entries = await readSteamLibrary();
      this.rawEntries = entries;

      const games: SteamInstalledGameDTO[] = [];
      for (const entry of entries) {
        const mapping = entry.appId ? findSteamExecutableMapping(entry.appId) : undefined;
        const metadata =
          this.metadata.get(entry.appId) ||
          (await fetchSteamMetadata(entry.appId).catch(() => undefined));

        if (metadata) {
          this.metadata.set(entry.appId, metadata);
        }

        games.push({
          appId: entry.appId,
          title: entry.name || mapping?.title || `App ${entry.appId}`,
          installDir: entry.installDir || '',
          installPath:
            entry.installPath ||
            (entry.installDir
              ? path.join(path.dirname(path.dirname(entry.manifestPath)), 'common', entry.installDir)
              : ''),
          sizeOnDisk: entry.sizeOnDisk,
          lastUpdated: entry.lastUpdated,
          status: 'installed',
          executablePath: mapping?.executablePath,
          sunshineAppId: mapping?.sunshineAppId,
          metadata,
        });
      }

      this.games = games;
      this.lastSyncedAt = new Date().toISOString();

      return {
        success: true,
        scanned: entries.length,
        processed: games.length,
        lastSyncedAt: this.lastSyncedAt,
      };
    } finally {
      this.syncing = false;
    }
  }

  async getInstalledGames(): Promise<SteamLibraryResponseDTO> {
    if (!this.games.length) {
      await this.sync();
    }

    return {
      vmId: STEAM_VM_ID,
      vmName: STEAM_VM_NAME,
      region: STEAM_REGION,
      status: STEAM_VM_STATUS,
      lastSyncedAt: this.lastSyncedAt,
      games: this.games,
    };
  }

  getRawEntries(): SteamLibraryRawEntry[] {
    return this.rawEntries;
  }
}

