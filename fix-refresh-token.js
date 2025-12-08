const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'services', 'auth-service', 'src', 'index.ts');

console.log('Reading file:', filePath);
let content = fs.readFileSync(filePath, 'utf8');

// Find and replace - add deleteMany before create in login endpoint
const searchPattern = /const refreshTokenExpiresAt = new Date\(\);\s+refreshTokenExpiresAt\.setDate\(refreshTokenExpiresAt\.getDate\(\) \+ 7\);\s+await prisma\.refreshToken\.create\(/g;

const replacement = `const refreshTokenExpiresAt = new Date();
      refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7);

      // Delete old refresh tokens for this user to avoid unique constraint errors
      await prisma.refreshToken.deleteMany({
        where: { userId: user.id },
      });

      await prisma.refreshToken.create(`;

const matches = content.match(searchPattern);
console.log('Found', matches ? matches.length : 0, 'matches');

if (matches && matches.length > 0) {
    content = content.replace(searchPattern, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ File updated successfully!');
    console.log('\nNow restart auth-service:');
    console.log('  pnpm --filter @strike/auth-service run dev');
} else {
    console.log('❌ Could not find the target code to replace');
    console.log('Manually add this code before prisma.refreshToken.create in login endpoint:');
    console.log('');
    console.log('  // Delete old refresh tokens for this user');
    console.log('  await prisma.refreshToken.deleteMany({');
    console.log('    where: { userId: user.id },');
    console.log('  });');
}
