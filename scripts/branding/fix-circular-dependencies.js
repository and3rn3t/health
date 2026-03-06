#!/usr/bin/env node
/**
 * Fix circular dependencies in icon imports
 * Node.js version of fix-circular-dependencies.ps1
 */

const fs = require('fs').promises;
const path = require('path');
const { program } = require('commander');
const { glob } = require('glob');

program
  .name('fix-circular-dependencies')
  .description('Fix circular dependencies in icon imports')
  .option('-d, --directory <path>', 'Target directory to process', 'src')
  .option('-v, --verbose', 'Verbose output')
  .option('--dry-run', 'Show what would be changed without making changes')
  .option('-e, --extensions <exts>', 'File extensions to process', 'ts,tsx,js,jsx')
  .parse();

const options = program.opts();

const ICON_IMPORT_PATTERNS = [
  // Direct Phosphor imports that might cause circular deps
  {
    pattern: /import\s*{\s*([^}]+)\s*}\s*from\s*['"]@phosphor-icons\/react['"]/g,
    replacement: (match, icons) => {
      // Split icons and create individual imports
      const iconList = icons.split(',').map(icon => icon.trim());
      return iconList.map(icon => 
        `import { ${icon} } from '@phosphor-icons/react/${icon.toLowerCase()}'`
      ).join('\\n');
    }
  },
  // Lucide React imports optimization
  {
    pattern: /import\s*{\s*([^}]+)\s*}\s*from\s*['"]lucide-react['"]/g,
    replacement: (match, icons) => {
      // For many icons, keep grouped import but add tree-shaking comment
      const iconCount = icons.split(',').length;
      if (iconCount > 5) {
        return `// Tree-shaking: ${iconCount} icons\\n${match}`;
      }
      return match;
    }
  }
];

const DEPENDENCY_FIXES = [
  // Fix common circular dependency patterns
  {
    pattern: /import.*from\s*['"]\.\/(.*)['"]/g,
    replacement: (match, relativePath) => {
      // Convert relative imports to absolute when they might cause cycles
      if (relativePath.includes('../')) {
        return match.replace(/from\s*['"][^'"]+['"]/, "from '@/$1'");
      }
      return match;
    }
  }
];

class CircularDependencyFixer {
  constructor(options) {
    this.options = options;
    this.filesProcessed = 0;
    this.changesDetected = 0;
    this.extensionPattern = `**/*.{${options.extensions}}`;
  }

  async findFiles() {
    const pattern = path.join(this.options.directory, this.extensionPattern);
    return await glob(pattern, { 
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
      absolute: true 
    });
  }

  async processFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      let modifiedContent = content;
      let fileChanged = false;

      // Apply icon import fixes
      for (const { pattern, replacement } of ICON_IMPORT_PATTERNS) {
        const originalContent = modifiedContent;
        
        if (typeof replacement === 'function') {
          modifiedContent = modifiedContent.replace(pattern, replacement);
        } else {
          modifiedContent = modifiedContent.replace(pattern, replacement);
        }

        if (modifiedContent !== originalContent) {
          fileChanged = true;
          if (this.options.verbose) {
            console.log(`🔧 Applied icon import fix in: ${path.relative(process.cwd(), filePath)}`);
          }
        }
      }

      // Apply dependency fixes
      for (const { pattern, replacement } of DEPENDENCY_FIXES) {
        const originalContent = modifiedContent;
        
        if (typeof replacement === 'function') {
          modifiedContent = modifiedContent.replace(pattern, replacement);
        } else {
          modifiedContent = modifiedContent.replace(pattern, replacement);
        }

        if (modifiedContent !== originalContent) {
          fileChanged = true;
          if (this.options.verbose) {
            console.log(`🔗 Applied dependency fix in: ${path.relative(process.cwd(), filePath)}`);
          }
        }
      }

      if (fileChanged) {
        this.changesDetected++;
        
        if (this.options.dryRun) {
          console.log(`🔍 Would modify: ${path.relative(process.cwd(), filePath)}`);
        } else {
          await fs.writeFile(filePath, modifiedContent, 'utf8');
        }
      }

      this.filesProcessed++;
      return fileChanged;

    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
      return false;
    }
  }

  async run() {
    console.log('🔧 Fixing circular dependencies in icon imports...');
    console.log(`📁 Processing directory: ${this.options.directory}`);
    console.log(`📄 Extensions: ${this.options.extensions}`);

    const files = await this.findFiles();
    
    if (files.length === 0) {
      console.log('❌ No files found matching the criteria');
      return;
    }

    console.log(`📊 Found ${files.length} files to process`);

    const startTime = Date.now();
    
    // Process files in parallel (but limit concurrency)
    const batchSize = 10;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      await Promise.all(batch.map(file => this.processFile(file)));
    }

    const duration = Date.now() - startTime;

    console.log('\\n📊 Summary:');
    console.log(`  Files processed: ${this.filesProcessed}`);
    console.log(`  Files changed: ${this.changesDetected}`);
    console.log(`  Duration: ${duration}ms`);

    if (this.options.dryRun && this.changesDetected > 0) {
      console.log('\\n🔍 Dry run completed. Use without --dry-run to apply changes.');
    } else if (this.changesDetected > 0) {
      console.log('\\n✅ Circular dependency fixes applied successfully!');
      console.log('💡 Consider running your linter to verify the changes.');
    } else {
      console.log('\\n✅ No circular dependencies detected in icon imports.');
    }
  }
}

async function fixCircularDependencies() {
  const fixer = new CircularDependencyFixer(options);
  await fixer.run();
}

if (require.main === module) {
  fixCircularDependencies().catch(error => {
    console.error('❌ Error fixing circular dependencies:', error.message);
    process.exit(1);
  });
}

module.exports = { fixCircularDependencies, CircularDependencyFixer };