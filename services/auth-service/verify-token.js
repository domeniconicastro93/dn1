const jwt = require('jsonwebtoken');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhYWExZGU3OS1lYWU4LTQ0NWItOTE0OC1iZmFjNjU4MDQ1ZDIiLCJlbWFpbCI6ImRvbWVuaWNvLm5pY2FAZ21haWwuY29tIiwic3RlYW1JZDY0IjoiNzY1NjExOTgxNTUzNzE1MTEiLCJpYXQiOjE3NjQ2MTU5MzAsImV4cCI6MTc2NDYxNjgzMH0.xlgwe0QVmndIo-ndurQPWmou9JOadmcwNEZA2axR7CE';
const secret = 'dev-secret-key-123';

try {
    const decoded = jwt.verify(token, secret);
    console.log('Verification successful:', decoded);
} catch (err) {
    console.error('Verification failed:', err.message);
}
