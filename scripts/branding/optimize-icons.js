#!/usr/bin/env node
/**
 * Optimize icon imports for better bundle size
 * Node.js version of optimize-icons.ps1
 */

const fs = require('fs').promises;
const path = require('path');
const { program } = require('commander');
const { glob } = require('glob');

program
  .name('optimize-icons')
  .description('Optimize icon imports for better bundle size')
  .option('-d, --directory <path>', 'Target directory to process', 'src')
  .option('-v, --verbose', 'Verbose output')
  .option('--dry-run', 'Show what would be changed without making changes')
  .option('-e, --extensions <exts>', 'File extensions to process', 'ts,tsx,js,jsx')
  .option('--threshold <number>', 'Minimum bundle size improvement threshold (KB)', '5')
  .parse();

const options = program.opts();

const ICON_OPTIMIZATIONS = [
  {
    name: 'Phosphor to Lucide Migration',
    pattern: /import\s*{\s*([^}]+)\s*}\s*from\s*['"]@phosphor-icons\/react['"]/g,
    replacement: (match, icons) => {
      // Map common Phosphor icons to Lucide equivalents
      const phosphorToLucide = {
        'Heart': 'Heart',
        'Plus': 'Plus',
        'X': 'X',
        'Check': 'Check',
        'ArrowRight': 'ArrowRight',
        'ArrowLeft': 'ArrowLeft',
        'Settings': 'Settings',
        'User': 'User',
        'Bell': 'Bell',
        'Search': 'Search',
        'Home': 'Home',
        'Calendar': 'Calendar',
        'Clock': 'Clock',
        'Activity': 'Activity',
        'TrendingUp': 'TrendingUp',
        'Shield': 'Shield',
        'AlertTriangle': 'AlertTriangle',
        'Info': 'Info'
      };

      const iconList = icons.split(',').map(icon => icon.trim());
      const mappedIcons = iconList.map(icon => phosphorToLucide[icon] || icon);
      
      return `import { ${mappedIcons.join(', ')} } from 'lucide-react'`;
    },
    estimatedSavings: 15 // KB
  },
  
  {
    name: 'Tree-shaking Optimization',
    pattern: /import\s*{\s*([^}]+)\s*}\s*from\s*['"]lucide-react['"]/g,
    replacement: (match, icons) => {
      const iconList = icons.split(',').map(icon => icon.trim());
      
      // For many icons, use individual imports for better tree-shaking
      if (iconList.length > 3) {
        return iconList.map(icon => 
          `import { ${icon} } from 'lucide-react/dist/esm/icons/${icon.toLowerCase()}'`
        ).join('\\n');
      }
      
      return match;
    },
    estimatedSavings: 8 // KB
  },

  {
    name: 'Dynamic Icon Loading',
    pattern: /const\s+(\w+)\s*=\s*<(\w+Icon)[^>]*\/>/g,
    replacement: (match, varName, iconName) => {
      // Convert static icon usage to dynamic loading for rarely used icons
      return `const ${varName} = lazy(() => import('lucide-react').then(m => ({ default: m.${iconName} })))`;
    },
    estimatedSavings: 3 // KB
  }
];

class IconOptimizer {
  constructor(options) {
    this.options = options;
    this.filesProcessed = 0;
    this.optimizationsApplied = 0;
    this.estimatedSavings = 0;
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
      let fileOptimizations = [];

      for (const optimization of ICON_OPTIMIZATIONS) {
        const originalContent = modifiedContent;
        let matchCount = 0;
        
        if (typeof optimization.replacement === 'function') {
          modifiedContent = modifiedContent.replace(optimization.pattern, (...args) => {
            matchCount++;
            return optimization.replacement(...args);
          });
        } else {
          const matches = modifiedContent.match(optimization.pattern);
          matchCount = matches ? matches.length : 0;
          modifiedContent = modifiedContent.replace(optimization.pattern, optimization.replacement);
        }

        if (modifiedContent !== originalContent && matchCount > 0) {
          fileChanged = true;
          fileOptimizations.push({
            name: optimization.name,
            matches: matchCount,
            savings: optimization.estimatedSavings
          });
          
          this.estimatedSavings += optimization.estimatedSavings * matchCount;
          
          if (this.options.verbose) {
            console.log(`🎯 Applied ${optimization.name} (${matchCount} matches) in: ${path.relative(process.cwd(), filePath)}`);
          }
        }
      }

      if (fileChanged) {
        this.optimizationsApplied++;
        
        // Add import for React.lazy if dynamic loading was used
        if (modifiedContent.includes('lazy(') && !modifiedContent.includes('import React') && !modifiedContent.includes('import { lazy }')) {
          modifiedContent = `import { lazy } from 'react';\\n${modifiedContent}`;
        }
        
        if (this.options.dryRun) {
          console.log(`🔍 Would optimize: ${path.relative(process.cwd(), filePath)}`);
          fileOptimizations.forEach(opt => {
            console.log(`   • ${opt.name}: ${opt.matches} matches (~${opt.savings * opt.matches}KB savings)`);
          });
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
    console.log('🎯 Optimizing icon imports for better bundle size...');
    console.log(`📁 Processing directory: ${this.options.directory}`);
    console.log(`📄 Extensions: ${this.options.extensions}`);
    console.log(`🎯 Minimum improvement threshold: ${this.options.threshold}KB`);

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

    console.log('\\n📊 Optimization Summary:');
    console.log(`  Files processed: ${this.filesProcessed}`);
    console.log(`  Files optimized: ${this.optimizationsApplied}`);
    console.log(`  Estimated savings: ~${this.estimatedSavings}KB`);
    console.log(`  Duration: ${duration}ms`);

    if (this.estimatedSavings < parseFloat(this.options.threshold)) {
      console.log(`⚠️  Estimated savings (${this.estimatedSavings}KB) below threshold (${this.options.threshold}KB)`);
    }

    if (this.options.dryRun && this.optimizationsApplied > 0) {
      console.log('\\n🔍 Dry run completed. Use without --dry-run to apply optimizations.');
    } else if (this.optimizationsApplied > 0) {
      console.log('\\n✅ Icon optimizations applied successfully!');
      console.log('💡 Recommended next steps:');
      console.log('   1. Run: npm run build');
      console.log('   2. Check bundle size: npm run analyze:bundle');
      console.log('   3. Test app functionality');
    } else {
      console.log('\\n✅ No icon optimizations needed - icons are already optimized!');
    }
  }
}

async function optimizeIcons() {
  const optimizer = new IconOptimizer(options);
  await optimizer.run();
}

if (require.main === module) {
  optimizeIcons().catch(error => {
    console.error('❌ Error optimizing icons:', error.message);
    process.exit(1);
  });
}

module.exports = { optimizeIcons, IconOptimizer };