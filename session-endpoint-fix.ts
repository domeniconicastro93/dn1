// GET /api/auth/v1/session
app.get(
    '/api/auth/v1/session',
    {
        preHandler: [rateLimitMiddleware],
    },
    async (request: any, reply) => {
        try {
            app.log.info('[SESSION] Endpoint called');

            // Extract token - wrap in try-catch for safety
            let token = null;
            try {
                token = extractTokenFromHeaderOrCookie(
                    request.headers.authorization,
                    request.headers.cookie,
                    'strike_access_token'
                );
                app.log.info('[SESSION] Token extracted:', { hasToken: !!token });
            } catch (extractError) {
                app.log.error('[SESSION] Token extraction failed:', extractError);
                return reply.status(200).send(successResponse({ authenticated: false, user: null }));
            }

            if (!token) {
                app.log.info('[SESSION] No token found, returning unauthenticated');
                return reply.status(200).send(successResponse({ authenticated: false, user: null }));
            }

            // Verify token
            let payload;
            try {
                payload = verifyAccessToken(token);
                app.log.info('[SESSION] Token verified:', { userId: payload?.userId });
            } catch (verifyError) {
                app.log.info('[SESSION] Token verification failed, returning unauthenticated');
                return reply.status(200).send(successResponse({ authenticated: false, user: null }));
            }

            if (!payload) {
                app.log.info('[SESSION] No payload, returning unauthenticated');
                return reply.status(200).send(successResponse({ authenticated: false, user: null }));
            }

            // Fetch fresh user data from DB - wrap in try-catch
            try {
                app.log.info('[SESSION] Fetching user from DB:', { userId: payload.userId });
                const dbUser = await prisma.user.findUnique({
                    where: { id: payload.userId },
                    select: {
                        id: true,
                        email: true,
                        displayName: true,
                        avatarUrl: true,
                        steamId64: true,
                    }
                });

                if (!dbUser) {
                    app.log.info('[SESSION] User not found in DB, returning unauthenticated');
                    return reply.status(200).send(successResponse({ authenticated: false, user: null }));
                }

                app.log.info('[SESSION] User found, returning authenticated');
                return reply.status(200).send(successResponse({ authenticated: true, user: dbUser }));
            } catch (dbError) {
                app.log.error('[SESSION] Database error:', dbError);
                // If DB fails but token is valid, return unauthenticated instead of 500
                return reply.status(200).send(successResponse({ authenticated: false, user: null }));
            }
        } catch (error: any) {
            app.log.error({ err: error, stack: error?.stack, message: error?.message }, '[SESSION] Unexpected error in session endpoint');
            // Return unauthenticated instead of 500 for better UX
            return reply.status(200).send(successResponse({ authenticated: false, user: null }));
        }
    }
);
