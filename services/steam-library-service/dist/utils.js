"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractKeyValue = extractKeyValue;
exports.safeJson = safeJson;
function extractKeyValue(content, key) {
    const regex = new RegExp(`"${key}"\\s*"([^"]*)"`, 'i');
    const match = content.match(regex);
    return match ? match[1] : undefined;
}
function safeJson(value, fallback) {
    if (!value)
        return fallback;
    const num = Number(value);
    return (Number.isFinite(num) ? num : fallback);
}
