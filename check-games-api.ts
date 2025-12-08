import fetch from 'node-fetch';

async function main() {
    try {
        const res = await fetch('http://localhost:3000/api/game/v1');
        if (!res.ok) {
            console.error('Failed to fetch:', res.status, res.statusText);
            return;
        }
        const data = await res.json();
        console.log('Games from API:');
        data.data.games.forEach((g: any) => {
            console.log(`- ${g.title}: ${g.steamAppId}`);
        });
    } catch (e) {
        console.error(e);
    }
}

main();
