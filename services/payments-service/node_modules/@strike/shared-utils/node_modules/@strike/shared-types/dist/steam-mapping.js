"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STEAM_SUNSHINE_MAPPING = void 0;
exports.findSteamExecutableMapping = findSteamExecutableMapping;
exports.STEAM_SUNSHINE_MAPPING = [
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
function findSteamExecutableMapping(appId) {
    return exports.STEAM_SUNSHINE_MAPPING.find((entry) => entry.appId === appId);
}
