# iOS HIG Icon Migration Script
# Replaces all Phosphor icons with iOS HIG-compliant Lucide React icons

param(
    [switch]$DryRun,
    [switch]$Verbose,
    [string]$ComponentPath = "src/components"
)

# Icon mapping from Phosphor to Lucide (iOS HIG compliant)
$IconMappings = @{
    # Health & Medical
    'Heart' = 'Heart'
    'Brain' = 'Brain'
    'Shield' = 'Shield'
    'Phone' = 'Phone'
    'Warning' = 'AlertTriangle'
    'Bell' = 'Bell'
    'Activity' = 'Activity'
    'Pulse' = 'Activity'

    # Analytics & Data
    'ChartBar' = 'BarChart3'
    'TrendUp' = 'TrendingUp'
    'TrendDown' = 'TrendingDown'
    'ChartLine' = 'LineChart'
    'ChartPie' = 'PieChart'
    'Graph' = 'BarChart'

    # Navigation & Interface
    'House' = 'Home'
    'User' = 'User'
    'Users' = 'Users'
    'Gear' = 'Settings'
    'MagnifyingGlass' = 'Search'
    'Plus' = 'Plus'
    'X' = 'X'
    'Check' = 'Check'
    'Minus' = 'Minus'
    'Moon' = 'Moon'

    # System & Status
    'CloudCheck' = 'CloudCheck'
    'CloudX' = 'CloudOff'
    'WifiHigh' = 'Wifi'
    'WifiSlash' = 'WifiOff'
    'Battery' = 'Battery'
    'Lightning' = 'Zap'

    # Action & Control
    'Play' = 'Play'
    'Pause' = 'Pause'
    'Stop' = 'Square'
    'ArrowRight' = 'ArrowRight'
    'ArrowLeft' = 'ArrowLeft'
    'Download' = 'Download'
    'Upload' = 'Upload'

    # Additional common icons
    'TrendingDown' = 'TrendingDown'
    'TrendingUp' = 'TrendingUp'
    'Calendar' = 'Calendar'
    'Clock' = 'Clock'
    'MapPin' = 'MapPin'
    'Star' = 'Star'
    'Info' = 'Info'
    'AlertCircle' = 'AlertCircle'
    'CheckCircle' = 'CheckCircle'
    'XCircle' = 'XCircle'
}

Write-Host "🔄 iOS HIG Icon Migration Tool" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

# Find all TypeScript/TSX files
$files = Get-ChildItem -Path $ComponentPath -Recurse -Include "*.tsx", "*.ts" | Where-Object {
    $_.FullName -notlike "*node_modules*" -and
    $_.FullName -notlike "*dist*" -and
    $_.FullName -notlike "*.test.*" -and
    $_.FullName -notlike "*.spec.*"
}

Write-Host "📁 Found $($files.Count) TypeScript files to process" -ForegroundColor Green

$totalReplacements = 0
$processedFiles = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $fileReplacements = 0

    # Check if file contains Phosphor imports
    if ($content -match '@phosphor-icons/react') {
        Write-Host "🔍 Processing: $($file.Name)" -ForegroundColor Yellow

        # Replace the import statement
        $content = $content -replace '@phosphor-icons/react', 'lucide-react'

        # Replace individual icon imports based on mapping
        foreach ($phosphorIcon in $IconMappings.Keys) {
            $lucideIcon = $IconMappings[$phosphorIcon]

            # Only replace if the icons are different
            if ($phosphorIcon -ne $lucideIcon) {
                $pattern = "\b$phosphorIcon\b"
                if ($content -match $pattern) {
                    $content = $content -replace $pattern, $lucideIcon
                    $fileReplacements++

                    if ($Verbose) {
                        Write-Host "  ✅ Replaced '$phosphorIcon' → '$lucideIcon'" -ForegroundColor Green
                    }
                }
            }
        }

        # Write changes if not dry run
        if (-not $DryRun -and $content -ne $originalContent) {
            Set-Content $file.FullName -Value $content -NoNewline
            Write-Host "  💾 Updated $($file.Name) ($fileReplacements replacements)" -ForegroundColor Green
        } elseif ($DryRun -and $content -ne $originalContent) {
            Write-Host "  🔄 Would update $($file.Name) ($fileReplacements replacements)" -ForegroundColor Cyan
        }

        $totalReplacements += $fileReplacements
        $processedFiles++
    }
}

Write-Host ""
Write-Host "📊 Migration Summary:" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host "Files processed: $processedFiles" -ForegroundColor Green
Write-Host "Total icon replacements: $totalReplacements" -ForegroundColor Green

if ($DryRun) {
    Write-Host ""
    Write-Host "🚨 This was a dry run. No files were modified." -ForegroundColor Yellow
    Write-Host "Run without -DryRun to apply changes." -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "✅ Icon migration completed successfully!" -ForegroundColor Green
    Write-Host "🔄 Consider running tests to ensure everything works correctly." -ForegroundColor Cyan
}

# Additional recommendations
Write-Host ""
Write-Host "📋 Post-Migration Checklist:" -ForegroundColor Magenta
Write-Host "============================" -ForegroundColor Magenta
Write-Host "1. Run 'npm run lint' to check for any issues" -ForegroundColor White
Write-Host "2. Test the application in both light and dark modes" -ForegroundColor White
Write-Host "3. Verify touch targets meet 44pt minimum on mobile" -ForegroundColor White
Write-Host "4. Check accessibility with screen readers" -ForegroundColor White
Write-Host "5. Validate icon consistency across all components" -ForegroundColor White
