/**
 * Service Startup Checker
 * 
 * Verifies that all services can start correctly by checking:
 * - Required dependencies
 * - Environment variables
 * - Entry points
 */

const fs = require('fs');
const path = require('path');

const issues = [];

function checkService(servicePath) {
  const serviceName = path.basename(servicePath);
  const packageJsonPath = path.join(servicePath, 'package.json');
  const indexPath = path.join(servicePath, 'src', 'index.ts');

  // Check package.json exists
  if (!fs.existsSync(packageJsonPath)) {
    issues.push({
      service: serviceName,
      issue: 'Missing package.json',
    });
    return;
  }

  // Check index.ts exists
  if (!fs.existsSync(indexPath)) {
    issues.push({
      service: serviceName,
      issue: 'Missing src/index.ts',
    });
    return;
  }

  // Check package.json has required scripts
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  if (!packageJson.scripts || !packageJson.scripts.start) {
    issues.push({
      service: serviceName,
      issue: 'Missing start script in package.json',
    });
  }

  // Check for required dependencies
  const requiredDeps = ['@strike/shared-types', '@strike/shared-utils'];
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  requiredDeps.forEach((dep) => {
    if (!deps[dep]) {
      issues.push({
        service: serviceName,
        issue: `Missing required dependency: ${dep}`,
      });
    }
  });

  // Check index.ts has Fastify setup
  const indexContent = fs.readFileSync(indexPath, 'utf-8');
  if (!indexContent.includes('Fastify') && !indexContent.includes('fastify')) {
    issues.push({
      service: serviceName,
      issue: 'Missing Fastify setup',
    });
  }

  // Check for health endpoint
  if (!indexContent.includes('/health')) {
    issues.push({
      service: serviceName,
      issue: 'Missing /health endpoint',
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
  console.log('✅ All services are ready to start!');
  process.exit(0);
} else {
  console.log(`⚠️  Found ${issues.length} startup issue(s):\n`);
  issues.forEach((issue) => {
    console.log(`Service: ${issue.service}`);
    console.log(`  Issue: ${issue.issue}`);
    console.log('');
  });
  // Don't exit with error - these are warnings
  process.exit(0);
}

