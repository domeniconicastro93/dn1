"use strict";
/**
 * Game Service - Complete Implementation with Database
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const shared_utils_1 = require("@strike/shared-utils");
const shared_db_1 = require("@strike/shared-db");
const app = (0, fastify_1.default)({
    logger: true,
});
// Register plugins
app.register(cors_1.default, {
    origin: true,
    credentials: true,
});
// Health check
app.get('/health', async () => {
    return (0, shared_utils_1.successResponse)({ status: 'ok', service: 'game-service' });
});
// Rate limiting middleware
const rateLimitMiddleware = async (request, reply) => {
    const clientId = request.ip || 'unknown';
    const result = shared_utils_1.rateLimiter.check(`game:${clientId}`, shared_utils_1.RateLimitConfigs.PUBLIC_GET);
    if (!result.allowed) {
        reply.status(429).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.RATE_LIMIT_EXCEEDED, 'Too many requests. Please try again later.'));
        return;
    }
    reply.header('X-RateLimit-Remaining', result.remaining.toString());
    reply.header('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
};
// GET /api/game/v1 - List games
app.get('/api/game/v1', {
    preHandler: [rateLimitMiddleware],
}, async (request, reply) => {
    try {
        // Validate query params
        const validationResult = shared_utils_1.gameListQuerySchema.safeParse(request.query);
        if (!validationResult.success) {
            return reply.status(400).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.VALIDATION_ERROR, 'Invalid query parameters', validationResult.error.errors));
        }
        const { page, pageSize, genre, search } = validationResult.data;
        // Build where clause
        const where = {};
        if (genre) {
            where.genre = { has: genre };
        }
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        // Get total count
        const total = await shared_db_1.prisma.game.count({ where });
        // Get games
        const games = await shared_db_1.prisma.game.findMany({
            where,
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: { createdAt: 'desc' },
        });
        const gameDTOs = games.map((game) => ({
            id: game.id,
            slug: game.slug,
            title: game.title,
            description: game.description,
            thumbnailUrl: game.thumbnailUrl,
            coverImageUrl: game.coverImageUrl || undefined,
            genre: game.genre,
            rating: game.rating || undefined,
            releaseDate: game.releaseDate?.toISOString(),
            developer: game.developer || undefined,
            publisher: game.publisher || undefined,
            targetResolution: game.targetResolution,
            targetFPS: game.targetFps,
            bitrateRange: game.bitrateRange,
            encoderPreset: game.encoderPreset || undefined,
            maxConcurrentSessionsPerVM: game.maxConcurrentSessionsPerVm || undefined,
            createdAt: game.createdAt.toISOString(),
            updatedAt: game.updatedAt.toISOString(),
        }));
        const response = {
            games: gameDTOs,
            total,
            page,
            pageSize,
        };
        return reply.status(200).send((0, shared_utils_1.successResponse)(response));
    }
    catch (error) {
        app.log.error({ err: error }, 'Error fetching games');
        return reply.status(500).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.INTERNAL_ERROR, 'Failed to fetch games'));
    }
});
// GET /api/game/v1/:slug - Get game by slug
app.get('/api/game/v1/:slug', {
    preHandler: [rateLimitMiddleware],
}, async (request, reply) => {
    try {
        // Validate params
        const validationResult = shared_utils_1.gameSlugParamSchema.safeParse(request.params);
        if (!validationResult.success) {
            return reply.status(400).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.VALIDATION_ERROR, 'Invalid slug format', validationResult.error.errors));
        }
        const { slug } = validationResult.data;
        const game = await shared_db_1.prisma.game.findUnique({
            where: { slug },
        });
        if (!game) {
            return reply.status(404).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.NOT_FOUND, 'Game not found'));
        }
        const gameDTO = {
            id: game.id,
            slug: game.slug,
            title: game.title,
            description: game.description,
            thumbnailUrl: game.thumbnailUrl,
            coverImageUrl: game.coverImageUrl || undefined,
            genre: game.genre,
            rating: game.rating || undefined,
            releaseDate: game.releaseDate?.toISOString(),
            developer: game.developer || undefined,
            publisher: game.publisher || undefined,
            targetResolution: game.targetResolution,
            targetFPS: game.targetFps,
            bitrateRange: game.bitrateRange,
            encoderPreset: game.encoderPreset || undefined,
            maxConcurrentSessionsPerVM: game.maxConcurrentSessionsPerVm || undefined,
            createdAt: game.createdAt.toISOString(),
            updatedAt: game.updatedAt.toISOString(),
        };
        return reply.status(200).send((0, shared_utils_1.successResponse)(gameDTO));
    }
    catch (error) {
        app.log.error({ err: error }, 'Error fetching game');
        return reply.status(500).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.INTERNAL_ERROR, 'Failed to fetch game'));
    }
});
// Error handler
app.setErrorHandler((error, request, reply) => {
    app.log.error(error);
    reply.status(500).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.INTERNAL_ERROR, 'Internal server error'));
});
const PORT = parseInt(process.env.PORT || '3003', 10);
const HOST = process.env.HOST || '0.0.0.0';
app.listen({ port: PORT, host: HOST }, (err) => {
    if (err) {
        app.log.error(err);
        process.exit(1);
    }
    app.log.info(`Game service listening on ${HOST}:${PORT}`);
});
