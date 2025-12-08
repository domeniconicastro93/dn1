async function main() {
    try {
        const res = await fetch('http://localhost:3000/api/game/v1');
        if (!res.ok) {
            console.error('Failed to fetch:', res.status, res.statusText);
            return;
        }
        const data = await res.json();
        console.log('Games from API:');
        if (data.data && data.data.games) {
            data.data.games.forEach((g) => {
                console.log(`- ${g.title}: ${g.steamAppId}`);
            });
        } else {
            console.log('No games found in response data');
        }
    } catch (e) {
        console.error(e);
    }
}

main();
