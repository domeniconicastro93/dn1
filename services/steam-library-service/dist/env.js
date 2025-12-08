"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.STEAM_API_KEY = exports.SERVICE_HOST = exports.SERVICE_PORT = exports.STEAM_WEB_LANGUAGE = exports.STEAM_VM_STATUS = exports.STEAM_VM_NAME = exports.STEAM_VM_ID = exports.STEAM_REGION = exports.STEAM_LIBRARY_FOLDERS_PATH = void 0;
const node_path_1 = __importDefault(require("node:path"));
function resolveDefaultLibraryFolders() {
    if (process.platform === 'win32') {
        return node_path_1.default.join(process.env.STEAM_HOME || 'C:\\Program Files (x86)\\Steam', 'steamapps', 'libraryfolders.vdf');
    }
    if (process.platform === 'darwin') {
        return node_path_1.default.join(process.env.HOME || '', 'Library', 'Application Support', 'Steam', 'steamapps', 'libraryfolders.vdf');
    }
    // linux
    return node_path_1.default.join(process.env.HOME || '', '.steam', 'steam', 'steamapps', 'libraryfolders.vdf');
}
exports.STEAM_LIBRARY_FOLDERS_PATH = process.env.STEAM_LIBRARY_FOLDERS_PATH || resolveDefaultLibraryFolders();
exports.STEAM_REGION = process.env.STEAM_VM_REGION || 'us-east-1';
exports.STEAM_VM_ID = process.env.STEAM_VM_ID || 'steam-vm-default';
exports.STEAM_VM_NAME = process.env.STEAM_VM_NAME || 'Steam Library VM';
exports.STEAM_VM_STATUS = process.env.STEAM_VM_STATUS || 'online';
exports.STEAM_WEB_LANGUAGE = process.env.STEAM_WEB_LANGUAGE || 'en';
exports.SERVICE_PORT = parseInt(process.env.PORT || '3022', 10);
exports.SERVICE_HOST = process.env.HOST || '0.0.0.0';
exports.STEAM_API_KEY = process.env.STEAM_API_KEY;
