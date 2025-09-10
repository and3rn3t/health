# 🔧 Fix Circular Dependencies - Revert Icon Optimization
# Revert @/lib/optimized-icons back to lucide-react to fix build issues
# This allows code splitting to work while still getting tree-shaking benefits

Write-Host "🔧 Fixing Circular Dependencies in Icon Imports" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow

# Get all TypeScript/JSX files (excluding node_modules)
$files = Get-ChildItem -Path "src" -Recurse -Include "*.tsx", "*.ts" |
    Where-Object { $_.FullName -notlike "*node_modules*" }

Write-Host "📊 Analysis:" -ForegroundColor Cyan
Write-Host "• Files to process: $($files.Count)" -ForegroundColor White
Write-Host "• Target: Revert '@/lib/optimized-icons' back to 'lucide-react'" -ForegroundColor White
Write-Host "• Reason: Fix circular dependency blocking build" -ForegroundColor White

$totalReverts = 0
$processedFiles = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }

    $originalContent = $content

    # Revert the optimized-icons imports back to lucide-react
    # FROM: import { ... } from '@/lib/optimized-icons';
    # TO:   import { ... } from 'lucide-react';
    $pattern = "from\s+'@/lib/optimized-icons'"
    $replacement = "from 'lucide-react'"
    $content = $content -replace $pattern, $replacement

    # Count changes in this file
    if ($originalContent -ne $content) {
        $importMatches = [regex]::Matches($originalContent, "from\s+'@/lib/optimized-icons'")
        $fileChanges = $importMatches.Count
        $totalReverts += $fileChanges
        $processedFiles++

        # Write the reverted content back
        Set-Content $file.FullName $content -NoNewline

        Write-Host "✅ $($file.Name): $fileChanges reverts" -ForegroundColor Green
    }
}

Write-Host "`n📈 Circular Dependency Fix Results:" -ForegroundColor Yellow
Write-Host "• Files reverted: $processedFiles" -ForegroundColor White
Write-Host "• Total import reverts: $totalReverts" -ForegroundColor White
Write-Host "• Status: Circular dependencies resolved" -ForegroundColor Green

if ($totalReverts -gt 0) {
    Write-Host "`n🎯 Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Remove the problematic optimized-icons.ts file" -ForegroundColor White
    Write-Host "2. Test build with code-split version" -ForegroundColor White
    Write-Host "3. Measure actual bundle size reduction" -ForegroundColor White
    Write-Host "4. Rely on Vite's tree-shaking for icon optimization" -ForegroundColor White

    Write-Host "`n✅ Ready to test Phase 1B code splitting!" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  No optimized-icons imports found to revert" -ForegroundColor Yellow
}

Write-Host "`n🔍 Verification:" -ForegroundColor Yellow
Write-Host "Use this command to confirm all imports are reverted:"
Write-Host "Get-ChildItem -Path 'src' -Recurse -Include '*.tsx', '*.ts' | Select-String -Pattern \"from '@/lib/optimized-icons'\"" -ForegroundColor Cyan
