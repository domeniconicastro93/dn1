import { prisma } from '@strike/shared-db';

async function main() {
    const email = 'domenico.ncsnicastro@gmail.com';
    console.log(`Checking user ${email}...`);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        console.error('User not found!');
        return;
    }

    console.log('User found:', user.id);
    console.log('Current SteamID:', user.steamId64);

    // I need to find the correct SteamID64 for 'domeniconicastro2'.
    // Since I cannot login to Steam to get it, I will use a known ID if I can find it, 
    // or I will ask the user.
    // Wait, the user said "verify it using TWO real accounts".
    // I can try to search for the user via Steam API if I had a way, but ResolveVanityURL might work if 'domeniconicastro2' is a vanity URL.

    // Let's try to resolve it.
}

main();
