/**
 * API Contract Validator
 * 
 * Validates that all services follow the standard API contract:
 * - Base path: /api/<service-name>/v1
 * - Standard response envelope
 * - Error codes
 * - Rate limiting
 */

const fs = require('fs');
const path = require('path');

const issues = [];

function checkService(servicePath) {
  const indexPath = path.join(servicePath, 'src', 'index.ts');
  if (!fs.existsSync(indexPath)) {
    return;
  }

  const content = fs.readFileSync(indexPath, 'utf-8');
  const serviceName = path.basename(servicePath);

  // Check base path
  const basePathPattern = new RegExp(`/api/${serviceName}/v1`, 'g');
  if (!basePathPattern.test(content)) {
    issues.push({
      service: serviceName,
      issue: 'Missing or incorrect base path pattern',
      expected: `/api/${serviceName}/v1`,
    });
  }

  // Check for standard response envelope
  if (!content.includes('successResponse') && !content.includes('errorResponse')) {
    issues.push({
      service: serviceName,
      issue: 'Missing standard response envelope functions',
    });
  }

  // Check for health endpoint
  if (!content.includes('/health')) {
    issues.push({
      service: serviceName,
      issue: 'Missing /health endpoint',
    });
  }

  // Check for error codes
  if (!content.includes('ErrorCodes')) {
    issues.push({
      service: serviceName,
      issue: 'Missing ErrorCodes usage',
    });
  }

  // Check for rate limiting
  if (!content.includes('rateLimiter') && !content.includes('rateLimit')) {
    issues.push({
      service: serviceName,
      issue: 'Missing rate limiting',
    });
  }
}

// Check all services
const servicesDir = path.resolve(__dirname, '..', 'services');
const services = fs.readdirSync(servicesDir, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => path.join(servicesDir, dirent.name));

services.forEach(checkService);

if (issues.length === 0) {
  console.log('✅ All API contracts validated successfully!');
  process.exit(0);
} else {
  console.log(`❌ Found ${issues.length} API contract issue(s):\n`);
  issues.forEach((issue) => {
    console.log(`Service: ${issue.service}`);
    console.log(`  Issue: ${issue.issue}`);
    if (issue.expected) {
      console.log(`  Expected: ${issue.expected}`);
    }
    console.log('');
  });
  process.exit(1);
}

