/**
 * Apollo Pairing Test Script
 * 
 * Run this to pair Strike with Apollo
 * 
 * Usage:
 *   pnpm tsx test-apollo-pairing.ts
 */

import { createApolloPairingClient } from './src/apollo/apollo-pairing';
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function main() {
    console.log('');
    console.log('🔐 APOLLO PAIRING TEST');
    console.log('======================');
    console.log('');

    const pairingClient = createApolloPairingClient();

    // Step 1: Test connection
    console.log('📡 Testing connection to Apollo...');
    const connected = await pairingClient.testConnection();

    if (!connected) {
        console.error('❌ Cannot connect to Apollo. Check:');
        console.error('   - Apollo is running on VM');
        console.error('   - Azure NSG allows port 47990');
        console.error('   - IP is correct: 20.31.130.73');
        process.exit(1);
    }

    console.log('✅ Connection successful!');
    console.log('');

    // Step 2: Request pairing
    console.log('🔑 Requesting pairing...');
    const pairingRequest = await pairingClient.requestPairing();

    if (!pairingRequest.success && pairingRequest.pinRequired) {
        console.log('');
        console.log('⚠️  PIN REQUIRED!');
        console.log('');
        console.log('📋 INSTRUCTIONS:');
        console.log('   1. On the VM, check the Apollo logs or monitor-pin.ps1');
        console.log('   2. Find the 4-digit PIN');
        console.log('   3. Enter it below');
        console.log('');

        const pin = await question('Enter 4-digit PIN: ');

        console.log('');
        console.log('🔐 Completing pairing with PIN...');
        const pairingComplete = await pairingClient.completePairing(pin.trim());

        if (pairingComplete.success) {
            console.log('');
            console.log('✅ PAIRING SUCCESSFUL!');
            console.log('');
            console.log('🎉 Strike is now paired with Apollo!');
            console.log('   You can now launch games and stream.');
            console.log('');
        } else {
            console.error('');
            console.error('❌ PAIRING FAILED:', pairingComplete.error);
            console.error('');
            process.exit(1);
        }
    } else if (pairingRequest.success) {
        console.log('');
        console.log('✅ Already paired or pairing not required!');
        console.log('');
    } else {
        console.error('');
        console.error('❌ PAIRING REQUEST FAILED:', pairingRequest.error);
        console.error('');
        process.exit(1);
    }

    rl.close();
}

main().catch((error) => {
    console.error('');
    console.error('❌ FATAL ERROR:', error.message);
    console.error('');
    process.exit(1);
});
