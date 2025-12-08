/**
 * Sunshine Application Mapper
 * 
 * Maps Steam games to Sunshine applications by matching executable paths.
 * 
 * Matching strategies:
 * 1. Exact path match
 * 2. Basename match (filename only)
 * 3. Fuzzy name match (game title)
 */

import type { SteamInstalledGameDTO } from '@strike/shared-types';
import type { SunshineApplication } from './sunshine-client';
import path from 'node:path';

export interface ApplicationMapping {
  steamAppId: string;
  sunshineAppId: string; // Sunshine app index as string
  title: string;
  executablePath: string;
  matchType: 'exact' | 'basename' | 'fuzzy' | 'manual';
  confidence: number; // 0-1, higher is better
}

export interface MappingResult {
  mappings: ApplicationMapping[];
  unmappedSteamGames: SteamInstalledGameDTO[];
  unmappedSunshineApps: SunshineApplication[];
}

/**
 * Normalize a file path for comparison
 */
function normalizePath(filePath: string): string {
  if (!filePath) return '';
  // Normalize separators and case (Windows is case-insensitive)
  return filePath
    .replace(/\\/g, '/')
    .toLowerCase()
    .trim();
}

/**
 * Extract basename from a path
 */
function getBasename(filePath: string): string {
  if (!filePath) return '';
  return path.basename(normalizePath(filePath));
}

/**
 * Calculate similarity between two strings (simple Levenshtein-like)
 */
function stringSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  // Simple character overlap
  const chars1 = new Set(s1);
  const chars2 = new Set(s2);
  const intersection = new Set([...chars1].filter((c) => chars2.has(c)));
  const union = new Set([...chars1, ...chars2]);
  
  return intersection.size / union.size;
}

/**
 * Match Steam games to Sunshine applications
 */
export async function mapSteamToSunshine(
  steamGames: SteamInstalledGameDTO[],
  sunshineApps: SunshineApplication[]
): Promise<MappingResult> {
  const mappings: ApplicationMapping[] = [];
  const matchedSteamIds = new Set<string>();
  const matchedSunshineIndices = new Set<number>();

  // Strategy 1: Exact path match
  for (const game of steamGames) {
    if (!game.executablePath) continue;
    
    const normalizedGamePath = normalizePath(game.executablePath);
    
    for (const app of sunshineApps) {
      if (matchedSunshineIndices.has(app.index)) continue;
      
      const normalizedAppExe = normalizePath(app.exe || '');
      if (normalizedGamePath === normalizedAppExe) {
        mappings.push({
          steamAppId: game.appId,
          sunshineAppId: app.index.toString(),
          title: game.title || app.name || 'Unknown',
          executablePath: game.executablePath,
          matchType: 'exact',
          confidence: 1.0,
        });
        matchedSteamIds.add(game.appId);
        matchedSunshineIndices.add(app.index);
        break;
      }
    }
  }

  // Strategy 2: Basename match
  for (const game of steamGames) {
    if (matchedSteamIds.has(game.appId) || !game.executablePath) continue;
    
    const gameBasename = getBasename(game.executablePath);
    if (!gameBasename) continue;
    
    for (const app of sunshineApps) {
      if (matchedSunshineIndices.has(app.index)) continue;
      
      const appBasename = getBasename(app.exe || '');
      if (appBasename && gameBasename === appBasename) {
        mappings.push({
          steamAppId: game.appId,
          sunshineAppId: app.index.toString(),
          title: game.title || app.name || 'Unknown',
          executablePath: game.executablePath,
          matchType: 'basename',
          confidence: 0.8,
        });
        matchedSteamIds.add(game.appId);
        matchedSunshineIndices.add(app.index);
        break;
      }
    }
  }

  // Strategy 3: Fuzzy name match (for games without exact path matches)
  for (const game of steamGames) {
    if (matchedSteamIds.has(game.appId) || !game.title) continue;
    
    let bestMatch: { app: SunshineApplication; similarity: number } | null = null;
    
    for (const app of sunshineApps) {
      if (matchedSunshineIndices.has(app.index)) continue;
      
      const similarity = stringSimilarity(game.title, app.name || '');
      if (similarity > 0.6 && (!bestMatch || similarity > bestMatch.similarity)) {
        bestMatch = { app, similarity };
      }
    }
    
    if (bestMatch && bestMatch.similarity > 0.6) {
      mappings.push({
        steamAppId: game.appId,
        sunshineAppId: bestMatch.app.index.toString(),
        title: game.title,
        executablePath: game.executablePath || bestMatch.app.exe || '',
        matchType: 'fuzzy',
        confidence: bestMatch.similarity,
      });
      matchedSteamIds.add(game.appId);
      matchedSunshineIndices.add(bestMatch.app.index);
    }
  }

  // Find unmapped games and apps
  const unmappedSteamGames = steamGames.filter((game) => !matchedSteamIds.has(game.appId));
  const unmappedSunshineApps = sunshineApps.filter(
    (app) => !matchedSunshineIndices.has(app.index)
  );

  return {
    mappings,
    unmappedSteamGames,
    unmappedSunshineApps,
  };
}

/**
 * Get Steam game executable path from install path
 */
export function getSteamExecutablePath(game: SteamInstalledGameDTO): string | undefined {
  if (game.executablePath) {
    return game.executablePath;
  }
  
  // Try to construct from install path
  if (game.installPath) {
    // Common Steam executable patterns
    const possibleExecutables = [
      path.join(game.installPath, game.title + '.exe'),
      path.join(game.installPath, 'bin', game.title + '.exe'),
      path.join(game.installPath, 'Binaries', 'Win64', game.title + '.exe'),
      path.join(game.installPath, game.title, 'Binaries', 'Win64', game.title + '.exe'),
    ];
    
    // Return first that might exist (we can't check filesystem here)
    return possibleExecutables[0];
  }
  
  return undefined;
}

