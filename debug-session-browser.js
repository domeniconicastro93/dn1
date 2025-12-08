console.log('🔍 Debugging useStrikeSession...');

// Test 1: Check if cookies are present
const cookies = document.cookie;
console.log('Cookies:', cookies);

if (cookies.includes('strike_access_token')) {
    console.log('✅ strike_access_token cookie is present');
} else {
    console.log('❌ strike_access_token cookie is MISSING');
}

// Test 2: Call session endpoint
fetch('/api/auth/session', {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
})
    .then(res => res.json())
    .then(data => {
        console.log('Session Response:', data);
        if (data.authenticated) {
            console.log('✅ Session is authenticated!');
            console.log('   User:', data.user?.email);
            console.log('\n   If header still shows "Login / Register":');
            console.log('   → The React component is not updating');
            console.log('   → Try refreshing the page (F5)');
        } else {
            console.log('❌ Session is NOT authenticated');
            console.log('   This is why "Login / Register" is showing');
        }
    })
    .catch(err => {
        console.error('❌ Error calling session endpoint:', err);
    });
