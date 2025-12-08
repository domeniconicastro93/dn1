
const { spawn } = require('child_process');
const path = require('path');

const services = [
    { name: 'auth-service', path: 'services/auth-service', port: 3001 },
    { name: 'user-service', path: 'services/user-service', port: 3002 },
    { name: 'game-service', path: 'services/game-service', port: 3003 },
    { name: 'steam-library-service', path: 'services/steam-library-service', port: 3022 },
    { name: 'orchestrator-service', path: 'services/orchestrator-service', port: 3012 },
    { name: 'gateway-service', path: 'services/gateway-service', port: 3000 },
    { name: 'web', path: 'apps/web', port: 3005, command: 'npm', args: ['run', 'dev'] }
];

function startService(service) {
    const cwd = path.join(__dirname, '..', service.path);
    const command = service.command || 'npm';
    const args = service.args || ['run', 'dev'];

    console.log(`Starting ${service.name} in ${cwd}...`);

    const child = spawn(command, args, {
        cwd,
        shell: true,
        stdio: 'pipe',
        env: { ...process.env, PORT: service.port }
    });

    child.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
            if (line.trim()) console.log(`[${service.name}] ${line.trim()}`);
        });
    });

    child.stderr.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
            if (line.trim()) console.error(`[${service.name}] ${line.trim()}`);
        });
    });

    child.on('close', (code) => {
        console.log(`[${service.name}] exited with code ${code}`);
    });

    return child;
}

const processes = services.map(startService);

process.on('SIGINT', () => {
    console.log('Stopping all services...');
    processes.forEach(p => p.kill());
    process.exit();
});
