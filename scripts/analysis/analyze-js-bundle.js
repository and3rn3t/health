#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

console.log('📦 JavaScript Bundle Size Analysis');
console.log('='.repeat(45));

// Find all JavaScript/TypeScript source files
function findSourceFiles(dir, files = []) {
  try {
    const items = readdirSync(dir);

    for (const item of items) {
      if (item.startsWith('.') || item === 'node_modules' || item === 'dist') continue;

      const fullPath = join(dir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        findSourceFiles(fullPath, files);
      } else if (['.tsx', '.ts', '.jsx', '.js'].includes(extname(item))) {
        files.push({
          path: fullPath,
          size: stat.size,
          ext: extname(item)
        });
      }
    }
  } catch (error) {
    // Skip directories we can't read
  }

  return files;
}

// Analyze import dependencies
function analyzeImports(files) {
  const dependencies = new Map();
  const componentImports = new Set();

  files.forEach(file => {
    try {
      const content = readFileSync(file.path, 'utf8');

      // Extract import statements
      const importPattern = /import\s+(?:[\w\s{},*]+\s+from\s+)?['"]([^'"]+)['"]/g;
      let match;

      while ((match = importPattern.exec(content)) !== null) {
        const importPath = match[1];

        if (importPath.startsWith('@/')) {
          componentImports.add(importPath);
        } else if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
          // External dependency
          const pkgName = importPath.split('/')[0];
          dependencies.set(pkgName, (dependencies.get(pkgName) || 0) + 1);
        }
      }
    } catch (error) {
      // Skip files we can't read
    }
  });

  return { dependencies, componentImports };
}

console.log('🔍 Scanning source files...');
const sourceFiles = findSourceFiles('src');

// Calculate total source size
const totalSourceSize = sourceFiles.reduce((sum, file) => sum + file.size, 0);
const formatSize = (bytes) => `${(bytes / 1024).toFixed(1)}KB`;

console.log(`\n📊 Source Code Analysis:`);
console.log(`• Total source files: ${sourceFiles.length}`);
console.log(`• Total source size: ${formatSize(totalSourceSize)}`);

// Group by file type
const byType = sourceFiles.reduce((acc, file) => {
  acc[file.ext] = acc[file.ext] || { count: 0, size: 0 };
  acc[file.ext].count++;
  acc[file.ext].size += file.size;
  return acc;
}, {});

console.log('\nBy file type:');
Object.entries(byType).forEach(([ext, data]) => {
  console.log(`  ${ext}: ${data.count} files, ${formatSize(data.size)}`);
});

// Find largest files
console.log('\n🔍 Largest source files:');
sourceFiles
  .sort((a, b) => b.size - a.size)
  .slice(0, 10)
  .forEach(file => {
    const relativePath = file.path.replace(process.cwd() + '\\', '');
    console.log(`  ${formatSize(file.size)} - ${relativePath}`);
  });

// Analyze dependencies
console.log('\n📦 Analyzing imports...');
const { dependencies, componentImports } = analyzeImports(sourceFiles);

console.log(`\n📚 External Dependencies (${dependencies.size} packages):`);
Array.from(dependencies.entries())
  .sort(([,a], [,b]) => b - a)
  .slice(0, 15)
  .forEach(([pkg, count]) => {
    console.log(`  ${pkg}: ${count} imports`);
  });

console.log(`\n🧩 Internal Components: ${componentImports.size} unique imports`);

// Estimate bundle sizes based on common package sizes
const packageSizes = {
  'react': 45,
  'react-dom': 130,
  '@tanstack/react-query': 45,
  'lucide-react': 800, // Large icon library
  '@phosphor-icons/react': 600,
  '@radix-ui/react-dialog': 25,
  '@radix-ui/react-dropdown-menu': 30,
  '@radix-ui/react-toast': 20,
  'recharts': 180,
  'date-fns': 70,
  'zod': 55,
  'clsx': 2,
  'class-variance-authority': 3,
  'tailwind-merge': 8
};

let estimatedDependencySize = 0;
dependencies.forEach((count, pkg) => {
  if (packageSizes[pkg]) {
    estimatedDependencySize += packageSizes[pkg];
  }
});

console.log(`\n📊 Estimated Bundle Composition:`);
console.log(`• Source code: ${formatSize(totalSourceSize)} (uncompiled)`);
console.log(`• Dependencies: ~${estimatedDependencySize}KB (estimated)`);
console.log(`• Total estimate: ~${estimatedDependencySize + Math.round(totalSourceSize/1024 * 3)}KB`);
console.log('  (3x multiplier for TypeScript compilation overhead)');

console.log(`\n🎯 JavaScript Optimization Opportunities:`);
console.log(`1. Code Splitting: Split large files like App.tsx`);
console.log(`2. Lazy Loading: Implement React.lazy() for routes`);
console.log(`3. Icon Optimization: Tree-shake unused icons`);
console.log(`4. Bundle Analysis: Use webpack-bundle-analyzer`);
console.log(`5. Dependency Audit: Remove unused packages`);

// Check if App.tsx is problematically large
const appFile = sourceFiles.find(f => f.path.includes('App.tsx'));
if (appFile && appFile.size > 100000) {
  console.log(`\n⚠️  App.tsx is very large: ${formatSize(appFile.size)}`);
  console.log('   This should be split into smaller components!');
}

console.log(`\n🚀 Next Steps for JS Optimization:`);
console.log(`1. Fix App.tsx syntax errors to enable builds`);
console.log(`2. Implement code splitting for large components`);
console.log(`3. Add lazy loading for heavy features`);
console.log(`4. Analyze actual bundle with build tools`);
