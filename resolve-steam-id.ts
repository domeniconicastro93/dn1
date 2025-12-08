import fetch from 'node-fetch';

const KEY = 'A7C258F4F68B663938D97D943F1F82D7';
const VANITY_URL = 'domeniconicastro2';

async function resolve() {
    const url = `http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${KEY}&vanityurl=${VANITY_URL}`;
    const res = await fetch(url);
    const data = await res.json();
    console.log('Result:', data);
}

resolve();
