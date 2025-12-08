import type { SteamExecutableMapping } from './steam-library';

export const STEAM_SUNSHINE_MAPPING: SteamExecutableMapping[] = [
  {
    appId: '379720',
    title: 'DOOM Eternal',
    executablePath: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\DOOMEternal\\DOOMEternalx64vk.exe',
    sunshineAppId: 'steam_doom_eternal',
  },
  {
    appId: '239140',
    title: 'Dying Light',
    executablePath: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Dying Light\\DyingLightGame.exe',
    sunshineAppId: 'steam_dying_light',
  },
  {
    appId: '570',
    title: 'Dota 2',
    executablePath: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\dota 2 beta\\game\\bin\\win64\\dota2.exe',
  },
];

export function findSteamExecutableMapping(appId: string): SteamExecutableMapping | undefined {
  return STEAM_SUNSHINE_MAPPING.find((entry) => entry.appId === appId);
}

