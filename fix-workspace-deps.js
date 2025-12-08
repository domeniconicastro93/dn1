/**
 * Fix workspace dependencies for npm compatibility
 * Changes "workspace:*" to "*" for npm workspaces
 */

const fs = require('fs');
const path = require('path');

function fixPackageJson(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const pkg = JSON.parse(content);
    let modified = false;

    // Fix dependencies
    if (pkg.dependencies) {
      for (const [key, value] of Object.entries(pkg.dependencies)) {
        if (value === 'workspace:*') {
          pkg.dependencies[key] = '*';
          modified = true;
        }
      }
    }

    // Fix devDependencies
    if (pkg.devDependencies) {
      for (const [key, value] of Object.entries(pkg.devDependencies)) {
        if (value === 'workspace:*') {
          pkg.devDependencies[key] = '*';
          modified = true;
        }
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
      console.log(`Fixed: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Find all package.json files
function findPackageJsonFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules, .git, .next, dist, build
      if (!['node_modules', '.git', '.next', 'dist', 'build'].includes(file)) {
        findPackageJsonFiles(filePath, fileList);
      }
    } else if (file === 'package.json') {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Main execution
const rootDir = path.resolve(__dirname);
const packageFiles = findPackageJsonFiles(rootDir);

console.log(`Found ${packageFiles.length} package.json files\n`);

let fixedCount = 0;
packageFiles.forEach((file) => {
  if (fixPackageJson(file)) {
    fixedCount++;
  }
});

console.log(`\nFixed ${fixedCount} package.json files`);
console.log('Now run: npm install');

