"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SteamLibraryCache = void 0;
const node_path_1 = __importDefault(require("node:path"));
const steam_reader_1 = require("./steam-reader");
const steam_web_api_1 = require("./steam-web-api");
const env_1 = require("./env");
const shared_types_1 = require("@strike/shared-types");
class SteamLibraryCache {
    rawEntries = [];
    games = [];
    lastSyncedAt = new Date(0).toISOString();
    metadata = new Map();
    syncing = false;
    async sync() {
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
            const entries = await (0, steam_reader_1.readSteamLibrary)();
            this.rawEntries = entries;
            const games = [];
            for (const entry of entries) {
                const mapping = entry.appId ? (0, shared_types_1.findSteamExecutableMapping)(entry.appId) : undefined;
                const metadata = this.metadata.get(entry.appId) ||
                    (await (0, steam_web_api_1.fetchSteamMetadata)(entry.appId).catch(() => undefined));
                if (metadata) {
                    this.metadata.set(entry.appId, metadata);
                }
                games.push({
                    appId: entry.appId,
                    title: entry.name || mapping?.title || `App ${entry.appId}`,
                    installDir: entry.installDir || '',
                    installPath: entry.installPath ||
                        (entry.installDir
                            ? node_path_1.default.join(node_path_1.default.dirname(node_path_1.default.dirname(entry.manifestPath)), 'common', entry.installDir)
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
        }
        finally {
            this.syncing = false;
        }
    }
    async getInstalledGames() {
        if (!this.games.length) {
            await this.sync();
        }
        return {
            vmId: env_1.STEAM_VM_ID,
            vmName: env_1.STEAM_VM_NAME,
            region: env_1.STEAM_REGION,
            status: env_1.STEAM_VM_STATUS,
            lastSyncedAt: this.lastSyncedAt,
            games: this.games,
        };
    }
    getRawEntries() {
        return this.rawEntries;
    }
}
exports.SteamLibraryCache = SteamLibraryCache;
