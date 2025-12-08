/**
 * Circular Dependency Checker
 * 
 * Checks for circular dependencies in the codebase
 */

const fs = require('fs');
const path = require('path');

const visited = new Set();
const visiting = new Set();
const cycles = [];

function findCircularDeps(filePath, fileMap, currentPath = []) {
  if (visiting.has(filePath)) {
    const cycleStart = currentPath.indexOf(filePath);
    if (cycleStart !== -1) {
      cycles.push([...currentPath.slice(cycleStart), filePath]);
    }
    return;
  }

  if (visited.has(filePath)) {
    return;
  }

  visiting.add(filePath);
  currentPath.push(filePath);

  const content = fs.readFileSync(filePath, 'utf-8');
  const imports = extractImports(content, filePath);

  for (const importPath of imports) {
    const resolvedPath = resolveImport(importPath, filePath);
    if (resolvedPath && fileMap.has(resolvedPath)) {
      findCircularDeps(resolvedPath, fileMap, [...currentPath]);
    }
  }

  visiting.delete(filePath);
  visited.add(filePath);
}

function extractImports(content, filePath) {
  const imports = [];
  const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  return imports;
}

function resolveImport(importPath, fromFile) {
  // Skip node_modules and external packages
  if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
    return null;
  }

  const dir = path.dirname(fromFile);
  const resolved = path.resolve(dir, importPath);

  // Try with .ts, .tsx, .js, .jsx extensions
  const extensions = ['.ts', '.tsx', '.js', '.jsx', ''];
  for (const ext of extensions) {
    const withExt = resolved + ext;
    if (fs.existsSync(withExt)) {
      return withExt;
    }
  }

  return null;
}

function getAllSourceFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules, .next, dist, etc.
      if (!['node_modules', '.next', 'dist', 'build', '.git'].includes(file)) {
        getAllSourceFiles(filePath, fileList);
      }
    } else if (/\.(ts|tsx|js|jsx)$/.test(file) && !file.includes('.test.') && !file.includes('.spec.')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Main execution
const rootDir = path.resolve(__dirname, '..');
const sourceFiles = getAllSourceFiles(rootDir);
const fileMap = new Map(sourceFiles.map((f) => [f, true]));

console.log(`Checking ${sourceFiles.length} files for circular dependencies...\n`);

for (const file of sourceFiles) {
  if (!visited.has(file)) {
    findCircularDeps(file, fileMap);
  }
}

if (cycles.length === 0) {
  console.log('✅ No circular dependencies found!');
  process.exit(0);
} else {
  console.log(`❌ Found ${cycles.length} circular dependency cycle(s):\n`);
  cycles.forEach((cycle, index) => {
    console.log(`Cycle ${index + 1}:`);
    cycle.forEach((file, i) => {
      const relativePath = path.relative(rootDir, file);
      console.log(`  ${i + 1}. ${relativePath}`);
    });
    console.log('');
  });
  process.exit(1);
}

