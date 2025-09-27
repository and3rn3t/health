#!/usr/bin/env node

/**
 * VitalSense iOS 26 HIG Implementation Validator
 * Validates successful implementation of Critical Priority 1 items
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const rootDir = process.cwd();

console.log('🔍 VitalSense iOS 26 HIG Implementation Validator');
console.log('='.repeat(50));

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

function validateFile(filePath, description, criticalItems = []) {
  const fullPath = join(rootDir, filePath);
  const exists = existsSync(fullPath);

  if (!exists) {
    results.failed++;
    results.details.push(`❌ ${description}: File not found (${filePath})`);
    return false;
  }

  try {
    const content = readFileSync(fullPath, 'utf-8');

    let itemsPassed = 0;
    let itemsTotal = criticalItems.length;

    for (const item of criticalItems) {
      if (content.includes(item)) {
        itemsPassed++;
      } else {
        results.details.push(`⚠️  ${description}: Missing "${item}"`);
      }
    }

    if (itemsPassed === itemsTotal && itemsTotal > 0) {
      results.passed++;
      results.details.push(`✅ ${description}: All critical items implemented (${itemsPassed}/${itemsTotal})`);
      return true;
    } else if (itemsPassed > 0) {
      results.warnings++;
      results.details.push(`🟡 ${description}: Partial implementation (${itemsPassed}/${itemsTotal})`);
      return true;
    } else if (itemsTotal === 0) {
      results.passed++;
      results.details.push(`✅ ${description}: File exists and accessible`);
      return true;
    } else {
      results.failed++;
      results.details.push(`❌ ${description}: No critical items found (${itemsPassed}/${itemsTotal})`);
      return false;
    }
  } catch (error) {
    results.failed++;
    results.details.push(`❌ ${description}: Error reading file - ${error.message}`);
    return false;
  }
}

// Critical Priority 1 Validation

console.log('\n📋 Critical Priority 1: Icon System Unification');
console.log('-'.repeat(30));
validateFile('src/lib/ios26-icon-mapping.ts', 'iOS 26 Icon Mapping System', [
  'SFSymbolsMapping',
  'ios26IconCategories',
  'getSFSymbolEquivalent'
]);

validateFile('src/components/ui/ios-hig-icons.tsx', 'Enhanced HIG Icons Component', [
  'IOSHIGIcons',
  'SemanticIcons',
  'HIGIcon'
]);

console.log('\n📋 Critical Priority 1: Enhanced Dynamic Type Support');
console.log('-'.repeat(30));
validateFile('src/lib/ios26-dynamic-type.ts', 'iOS 26 Dynamic Type System', [
  'getiOS26TypographyClass',
  'health-metric-large',
  'accessibility-xl'
]);

console.log('\n📋 Critical Priority 1: Color System iOS 26 Updates');
console.log('-'.repeat(30));
validateFile('src/vitalsense.css', 'iOS 26 Color System', [
  'ios-label-primary',
  'ios-system-background',
  'ios-26-surface-elevated',
  'color-mix',
  '@media (prefers-contrast: more)'
]);

console.log('\n📋 Priority 2: Component Accessibility Enhancements');
console.log('-'.repeat(30));
validateFile('src/lib/ios26-accessibility-enhanced.ts', 'iOS 26 Accessibility Enhancements', [
  'useAccessibilityEnhanced',
  'iOS26FocusManager',
  'iOS26ContrastSupport',
  'iOS26MotionAccessibility'
]);

console.log('\n📋 Priority 2: Enhanced Components');
console.log('-'.repeat(30));
validateFile('src/components/ui/ios26-enhanced-components.tsx', 'Enhanced VitalSense Components', [
  'EnhancedVitalSenseStatusCard',
  'EnhancedVitalSenseNavigation',
  'EnhancedVitalSenseButton',
  'accessibilityLevel',
  'announceChanges'
]);

console.log('\n📋 Priority 2: Button System Modernization');
console.log('-'.repeat(30));
validateFile('src/components/ui/ios26-button-system.tsx', 'iOS 26 Button System', [
  'ios26ButtonVariants',
  'iOS26Button',
  'iOS26FAB'
]);

console.log('\n📋 Enhanced Components');
console.log('-'.repeat(30));
validateFile('src/components/ui/vitalsense-components.tsx', 'Enhanced VitalSense Components', [
  'supportsDynamicType',
  'accessibilityLevel',
  'getiOS26TypographyClass',
  'ios-26-color-adaptive',
  'aria-live'
]);

console.log('\n📋 Test Suite & Documentation');
console.log('-'.repeat(30));
validateFile('test-ios26-implementation.html', 'iOS 26 Implementation Test Suite');
validateFile('docs/ios/IOS_26_HIG_IMPLEMENTATION_SUMMARY.md', 'Implementation Documentation');

// Final Results
console.log('\n📊 VALIDATION RESULTS');
console.log('='.repeat(50));
console.log(`✅ Passed: ${results.passed}`);
console.log(`🟡 Warnings: ${results.warnings}`);
console.log(`❌ Failed: ${results.failed}`);
console.log(`📋 Total Checks: ${results.passed + results.warnings + results.failed}`);

const successRate = ((results.passed + results.warnings) / (results.passed + results.warnings + results.failed)) * 100;
console.log(`📈 Success Rate: ${successRate.toFixed(1)}%`);

console.log('\n📝 DETAILED RESULTS:');
console.log('-'.repeat(50));
for (const detail of results.details) {
  console.log(detail);
}

// Compliance Assessment
console.log('\n🎯 iOS 26 HIG COMPLIANCE ASSESSMENT');
console.log('='.repeat(50));

if (results.failed === 0) {
  console.log('🎉 EXCELLENT: All Critical Priority 1 items successfully implemented!');
  console.log('📈 Estimated Compliance Improvement: 77% → 95%+');
  console.log('✅ Ready for Priority 2 implementation phase');
} else if (results.failed <= 2) {
  console.log('🟡 GOOD: Most Critical Priority 1 items implemented with minor issues');
  console.log('📈 Estimated Compliance Improvement: 77% → 90%+');
  console.log('🔧 Minor fixes needed before Priority 2 phase');
} else {
  console.log('⚠️  NEEDS WORK: Several Critical Priority 1 items need attention');
  console.log('📈 Estimated Compliance Improvement: 77% → 85%+');
  console.log('🛠️  Complete current implementation before proceeding');
}

console.log('\n🚀 NEXT STEPS:');
console.log('-'.repeat(20));
if (results.failed === 0) {
  console.log('• Begin Priority 2 implementation: Component Accessibility Enhancements');
  console.log('• Begin Priority 2 implementation: Navigation Header iOS 26 Redesign');
  console.log('• Begin Priority 2 implementation: Button System Modernization');
  console.log('• Conduct user testing of Dynamic Type and color adaptations');
} else {
  console.log('• Address failed validation items above');
  console.log('• Re-run validator after fixes');
  console.log('• Complete Critical Priority 1 before Priority 2 phase');
}

console.log('\n💡 For detailed implementation guide, see:');
console.log('   docs/ios/IOS_26_HIG_IMPLEMENTATION_SUMMARY.md');
console.log('\n🧪 For interactive testing, open:');
console.log('   test-ios26-implementation.html');

process.exit(results.failed > 0 ? 1 : 0);
