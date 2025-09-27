#!/usr/bin/env node
/**
 * Convert Phosphor icons to Lucide icons with mapping
 * Node.js version of convert-phosphor-to-lucide.ps1
 */

const fs = require('fs').promises;
const path = require('path');
const { program } = require('commander');
const { glob } = require('glob');

program
  .name('convert-phosphor-to-lucide')
  .description('Convert Phosphor icons to Lucide icons with proper mapping')
  .option('-d, --directory <path>', 'Target directory to process', 'src')
  .option('-v, --verbose', 'Verbose output')
  .option('--dry-run', 'Show what would be changed without making changes')
  .option('-e, --extensions <exts>', 'File extensions to process', 'ts,tsx,js,jsx')
  .option('--generate-report', 'Generate conversion report')
  .parse();

const options = program.opts();

// Comprehensive Phosphor to Lucide icon mapping
const PHOSPHOR_TO_LUCIDE_MAP = {
  // Basic actions
  'Plus': 'Plus',
  'X': 'X',
  'Check': 'Check',
  'Minus': 'Minus',
  'Trash': 'Trash2',
  'Edit': 'Edit',
  'Copy': 'Copy',
  'Download': 'Download',
  'Upload': 'Upload',
  
  // Navigation
  'ArrowRight': 'ArrowRight',
  'ArrowLeft': 'ArrowLeft',
  'ArrowUp': 'ArrowUp',
  'ArrowDown': 'ArrowDown',
  'CaretRight': 'ChevronRight',
  'CaretLeft': 'ChevronLeft',
  'CaretUp': 'ChevronUp',
  'CaretDown': 'ChevronDown',
  
  // Interface
  'House': 'Home',
  'Gear': 'Settings',
  'MagnifyingGlass': 'Search',
  'Bell': 'Bell',
  'User': 'User',
  'Users': 'Users',
  'Eye': 'Eye',
  'EyeSlash': 'EyeOff',
  'Heart': 'Heart',
  'Star': 'Star',
  'BookmarkSimple': 'Bookmark',
  'Share': 'Share',
  'DotsThree': 'MoreHorizontal',
  'DotsThreeVertical': 'MoreVertical',
  
  // Health & Medical
  'Activity': 'Activity',
  'PulseIcon': 'Activity', // Custom mapping for pulse
  'Heartbeat': 'Activity',
  'FirstAid': 'Cross',
  'Pill': 'Pill',
  'Thermometer': 'Thermometer',
  'Shield': 'Shield',
  'Warning': 'AlertTriangle',
  'Info': 'Info',
  'Question': 'HelpCircle',
  
  // Time & Calendar
  'Clock': 'Clock',
  'Calendar': 'Calendar',
  'CalendarBlank': 'CalendarDays',
  'Timer': 'Timer',
  
  // Charts & Analytics
  'ChartLine': 'LineChart',
  'ChartBar': 'BarChart',
  'TrendUp': 'TrendingUp',
  'TrendDown': 'TrendingDown',
  'ChartPie': 'PieChart',
  
  // Files & Documents
  'File': 'File',
  'FileText': 'FileText',
  'Folder': 'Folder',
  'FolderOpen': 'FolderOpen',
  'Note': 'StickyNote',
  
  // Communication
  'ChatCircle': 'MessageCircle',
  'Envelope': 'Mail',
  'Phone': 'Phone',
  'VideoCamera': 'Video',
  
  // Technology
  'DeviceMobile': 'Smartphone',
  'Desktop': 'Monitor',
  'Wifi': 'Wifi',
  'Battery': 'Battery',
  'Bluetooth': 'Bluetooth',
  
  // Status & Indicators
  'CheckCircle': 'CheckCircle',
  'XCircle': 'XCircle',
  'WarningCircle': 'AlertCircle',
  'InfoIcon': 'Info',
  'Spinner': 'Loader',
  
  // VitalSense specific health icons
  'HeartRate': 'Activity',
  'BloodPressure': 'Activity',
  'Temperature': 'Thermometer',
  'Weight': 'Scale',
  'Steps': 'Footprints',
  'Sleep': 'Moon',
  'Nutrition': 'Apple'
};

// Icons that don't have direct equivalents and need custom handling
const CUSTOM_REPLACEMENTS = {
  'Pulse': {
    lucideIcon: 'Activity',
    note: 'Phosphor Pulse → Lucide Activity (pulse line pattern)'
  },
  'Heartbeat': {
    lucideIcon: 'Activity', 
    note: 'Phosphor Heartbeat → Lucide Activity (ECG pattern)'
  },
  'MedicalCross': {
    lucideIcon: 'Plus',
    note: 'Phosphor MedicalCross → Lucide Plus (medical context)'
  }
};

class PhosphorToLucideConverter {
  constructor(options) {
    this.options = options;
    this.filesProcessed = 0;
    this.conversionsApplied = 0;
    this.conversionReport = [];
    this.unmappedIcons = new Set();
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
      const fileConversions = [];

      // Convert import statements
      const importPattern = /import\s*{\s*([^}]+)\s*}\s*from\s*['"]@phosphor-icons\/react['"]/g;
      const importMatches = [...content.matchAll(importPattern)];

      for (const match of importMatches) {
        const [fullMatch, iconsString] = match;
        const phosphorIcons = iconsString.split(',').map(icon => icon.trim());
        const convertedIcons = [];
        const unconvertedIcons = [];

        for (const phosphorIcon of phosphorIcons) {
          const lucideIcon = PHOSPHOR_TO_LUCIDE_MAP[phosphorIcon];
          
          if (lucideIcon) {
            convertedIcons.push(lucideIcon);
            fileConversions.push({
              from: phosphorIcon,
              to: lucideIcon,
              type: 'direct_mapping'
            });
          } else if (CUSTOM_REPLACEMENTS[phosphorIcon]) {
            const custom = CUSTOM_REPLACEMENTS[phosphorIcon];
            convertedIcons.push(custom.lucideIcon);
            fileConversions.push({
              from: phosphorIcon,
              to: custom.lucideIcon,
              type: 'custom_replacement',
              note: custom.note
            });
          } else {
            unconvertedIcons.push(phosphorIcon);
            this.unmappedIcons.add(phosphorIcon);
          }
        }

        if (convertedIcons.length > 0) {
          let replacement = '';
          
          if (convertedIcons.length > 0) {
            replacement = `import { ${convertedIcons.join(', ')} } from 'lucide-react'`;
          }
          
          if (unconvertedIcons.length > 0) {
            const phosphorImport = `import { ${unconvertedIcons.join(', ')} } from '@phosphor-icons/react'`;
            replacement = replacement ? `${replacement}\\n${phosphorImport}` : phosphorImport;
          }

          modifiedContent = modifiedContent.replace(fullMatch, replacement);
          fileChanged = true;
        }
      }

      // Convert icon usage in JSX (handle renamed icons)
      for (const conversion of fileConversions) {
        if (conversion.from !== conversion.to) {
          const jsxPattern = new RegExp(`<${conversion.from}([^>]*)/>`, 'g');
          const jsxMatches = modifiedContent.match(jsxPattern);
          
          if (jsxMatches) {
            modifiedContent = modifiedContent.replace(jsxPattern, `<${conversion.to}$1/>`);
            conversion.jsxUpdated = jsxMatches.length;
          }
        }
      }

      if (fileChanged) {
        this.conversionsApplied++;
        
        if (this.options.verbose) {
          console.log(`🔄 Converted icons in: ${path.relative(process.cwd(), filePath)}`);
          fileConversions.forEach(conv => {
            const jsxNote = conv.jsxUpdated ? ` (${conv.jsxUpdated} JSX updated)` : '';
            console.log(`   • ${conv.from} → ${conv.to}${jsxNote}`);
          });
        }

        if (this.options.generateReport) {
          this.conversionReport.push({
            file: path.relative(process.cwd(), filePath),
            conversions: fileConversions
          });
        }
        
        if (this.options.dryRun) {
          console.log(`🔍 Would convert: ${path.relative(process.cwd(), filePath)}`);
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

  async generateReport() {
    if (!this.options.generateReport || this.conversionReport.length === 0) {
      return;
    }

    const reportPath = path.join(process.cwd(), 'phosphor-to-lucide-conversion-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        filesProcessed: this.filesProcessed,
        filesConverted: this.conversionsApplied,
        totalConversions: this.conversionReport.reduce((sum, file) => sum + file.conversions.length, 0),
        unmappedIcons: Array.from(this.unmappedIcons)
      },
      conversions: this.conversionReport
    };

    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Conversion report saved to: ${reportPath}`);
  }

  async run() {
    console.log('🔄 Converting Phosphor icons to Lucide icons...');
    console.log(`📁 Processing directory: ${this.options.directory}`);
    console.log(`📄 Extensions: ${this.options.extensions}`);

    const files = await this.findFiles();
    
    if (files.length === 0) {
      console.log('❌ No files found matching the criteria');
      return;
    }

    console.log(`📊 Found ${files.length} files to process`);
    console.log(`🗺️  Mapping ${Object.keys(PHOSPHOR_TO_LUCIDE_MAP).length} icons`);

    const startTime = Date.now();
    
    // Process files in parallel (but limit concurrency)
    const batchSize = 10;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      await Promise.all(batch.map(file => this.processFile(file)));
    }

    const duration = Date.now() - startTime;

    console.log('\\n📊 Conversion Summary:');
    console.log(`  Files processed: ${this.filesProcessed}`);
    console.log(`  Files converted: ${this.conversionsApplied}`);
    console.log(`  Duration: ${duration}ms`);

    if (this.unmappedIcons.size > 0) {
      console.log(`\\n⚠️  Unmapped icons found (${this.unmappedIcons.size}):`);
      Array.from(this.unmappedIcons).forEach(icon => {
        console.log(`   • ${icon}`);
      });
      console.log('\\n💡 These icons need manual review and mapping.');
    }

    await this.generateReport();

    if (this.options.dryRun && this.conversionsApplied > 0) {
      console.log('\\n🔍 Dry run completed. Use without --dry-run to apply conversions.');
    } else if (this.conversionsApplied > 0) {
      console.log('\\n✅ Phosphor to Lucide conversion completed successfully!');
      console.log('💡 Recommended next steps:');
      console.log('   1. Update package.json to remove @phosphor-icons/react');
      console.log('   2. Run: npm install lucide-react');
      console.log('   3. Test all converted icons');
      console.log('   4. Update bundle analysis');
    } else {
      console.log('\\n✅ No Phosphor icons found - conversion not needed!');
    }
  }
}

async function convertPhosphorToLucide() {
  const converter = new PhosphorToLucideConverter(options);
  await converter.run();
}

if (require.main === module) {
  convertPhosphorToLucide().catch(error => {
    console.error('❌ Error converting Phosphor to Lucide:', error.message);
    process.exit(1);
  });
}

module.exports = { convertPhosphorToLucide, PhosphorToLucideConverter, PHOSPHOR_TO_LUCIDE_MAP };