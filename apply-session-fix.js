const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'services', 'auth-service', 'src', 'index.ts');

console.log('Reading file:', filePath);
let content = fs.readFileSync(filePath, 'utf8');

// Find and replace the catch block
const oldCatch = `    } catch (error) {
      app.log.error({ err: error }, 'Session error');
      return reply.status(500).send(errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to get session'));
    }`;

const newCatch = `    } catch (error: any) {
      app.log.error({ err: error, stack: error?.stack, message: error?.message }, '[SESSION] Unexpected error');
      // Return 200 with authenticated:false instead of 500 for better UX
      return reply.status(200).send(successResponse({ authenticated: false, user: null }));
    }`;

if (content.includes('Session error')) {
    content = content.replace(
        /} catch \(error\) \{[\s\S]*?app\.log\.error\(\{ err: error \}, 'Session error'\);[\s\S]*?return reply\.status\(500\)\.send\(errorResponse\(ErrorCodes\.INTERNAL_ERROR, 'Failed to get session'\)\);[\s\S]*?\}/,
        `} catch (error: any) {
      app.log.error({ err: error, stack: error?.stack, message: error?.message }, '[SESSION] Unexpected error');
      // Return 200 with authenticated:false instead of 500 for better UX
      return reply.status(200).send(successResponse({ authenticated: false, user: null }));
    }`
    );

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ File updated successfully!');
    console.log('\nNow restart auth-service:');
    console.log('  pnpm --filter @strike/auth-service run dev');
} else {
    console.log('❌ Could not find the target code to replace');
    console.log('Please apply the fix manually as described in PHASE1_FIX_SUMMARY.md');
}
