module.exports = {
    apps: [
        {
            name: 'strike-auth',
            cwd: './services/auth-service',
            script: 'pnpm',
            args: 'run dev',
            env: {
                NODE_ENV: 'development',
                PORT: 3001
            }
        },
        {
            name: 'strike-game',
            cwd: './services/game-service',
            script: 'pnpm',
            args: 'run dev',
            env: {
                NODE_ENV: 'development',
                PORT: 3003
            }
        },
        {
            name: 'strike-steam',
            cwd: './services/steam-library-service',
            script: 'pnpm',
            args: 'run dev',
            env: {
                NODE_ENV: 'development',
                PORT: 3022
            }
        },
        {
            name: 'strike-orchestrator',
            cwd: './services/orchestrator-service',
            script: 'pnpm',
            args: 'run dev',
            env: {
                NODE_ENV: 'development',
                PORT: 3012
            }
        },
        {
            name: 'strike-webrtc',
            cwd: './services/webrtc-streaming-service',
            script: 'pnpm',
            args: 'run dev',
            env: {
                NODE_ENV: 'development',
                PORT: 3015
            }
        },
        {
            name: 'strike-gateway',
            cwd: './services/gateway-service',
            script: 'pnpm',
            args: 'run dev',
            env: {
                NODE_ENV: 'development',
                PORT: 3000
            }
        },
        {
            name: 'strike-web',
            cwd: './apps/web',
            script: 'pnpm',
            args: 'run dev',
            env: {
                NODE_ENV: 'development',
                PORT: 3005
            }
        }
    ]
}
