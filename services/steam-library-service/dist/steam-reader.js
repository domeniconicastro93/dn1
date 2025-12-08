"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readSteamLibrary = readSteamLibrary;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const env_1 = require("./env");
const utils_1 = require("./utils");
async function parseLibraryFolders() {
    try {
        const content = await promises_1.default.readFile(env_1.STEAM_LIBRARY_FOLDERS_PATH, 'utf-8');
        const folderMatches = [...content.matchAll(/"(\d+)"\s*\{([^}]*)\}/g)];
        const folders = [];
        for (const match of folderMatches) {
            const block = match[2];
            const folderPath = (0, utils_1.extractKeyValue)(block, 'path');
            if (folderPath) {
                folders.push({
                    path: folderPath.replace(/\\\\/g, '\\'),
                });
            }
        }
        if (!folders.length) {
            const defaultDir = node_path_1.default.dirname(node_path_1.default.dirname(env_1.STEAM_LIBRARY_FOLDERS_PATH));
            folders.push({ path: defaultDir });
        }
        return folders;
    }
    catch {
        return [];
    }
}
async function parseManifest(manifestPath) {
    try {
        const content = await promises_1.default.readFile(manifestPath, 'utf-8');
        const appId = (0, utils_1.extractKeyValue)(content, 'appid');
        if (!appId) {
            return null;
        }
        const name = (0, utils_1.extractKeyValue)(content, 'name');
        const installdir = (0, utils_1.extractKeyValue)(content, 'installdir');
        const lastUpdated = (0, utils_1.extractKeyValue)(content, 'LastUpdated');
        const sizeOnDisk = (0, utils_1.extractKeyValue)(content, 'SizeOnDisk');
        return {
            appId,
            manifestPath,
            name,
            installDir: installdir,
            lastUpdated,
            sizeOnDisk: sizeOnDisk ? Number(sizeOnDisk) : undefined,
        };
    }
    catch {
        return null;
    }
}
async function readSteamLibrary() {
    const folders = await parseLibraryFolders();
    const entries = [];
    for (const folder of folders) {
        const steamappsDir = node_path_1.default.join(folder.path, 'steamapps');
        try {
            const files = await promises_1.default.readdir(steamappsDir);
            for (const file of files) {
                if (!file.startsWith('appmanifest') || !file.endsWith('.acf'))
                    continue;
                const manifestPath = node_path_1.default.join(steamappsDir, file);
                const entry = await parseManifest(manifestPath);
                if (entry) {
                    entry.installPath = entry.installDir
                        ? node_path_1.default.join(steamappsDir, 'common', entry.installDir)
                        : undefined;
                    entries.push(entry);
                }
            }
        }
        catch {
            // Ignore folders we cannot read
        }
    }
    return entries;
}
