import 'dotenv/config';
import { verifyAccessToken } from '@strike/shared-utils';

console.log('JWT_SECRET from env:', process.env.JWT_SECRET);

try {
    // Try to verify a token signed with 'dev-secret-key-123'
    // I need to generate one first, but I can't import generateAccessToken easily if I want to test the *internal* secret of shared-utils.
    // Actually, I can import generateAccessToken too.
    const { generateAccessToken } = require('@strike/shared-utils');
    const token = generateAccessToken({ userId: 'test', email: 'test@test.com' });
    console.log('Generated token:', token);

    const decoded = verifyAccessToken(token);
    console.log('Verified:', decoded);
} catch (e) {
    console.error('Error:', e);
}
