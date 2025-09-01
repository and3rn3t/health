#!/usr/bin/env pwsh
# Automated DNS Subdomain Configuration for andernet.dev Health Platform
# Uses Cloudflare API to create all necessary DNS records

param(
    [Parameter(Mandatory=$true)]
    [string]$CloudflareApiToken,

    [Parameter(Mandatory=$false)]
    [string]$ZoneId = "",

    [switch]$DryRun,
    [switch]$CleanUp,
    [string]$Phase = "1"
)

# Health platform subdomain configuration
$subdomains = @{
    "1" = @(
        @{ name = "health"; target = "health-app.workers.dev"; priority = "critical" }
    )
    "2" = @(
        @{ name = "api.health"; target = "health-api.workers.dev"; priority = "high" }
        @{ name = "ws.health"; target = "health-ws.workers.dev"; priority = "high" }
    )
    "3" = @(
        @{ name = "emergency.health"; target = "health-emergency.workers.dev"; priority = "critical" }
        @{ name = "files.health"; target = "health-files.workers.dev"; priority = "medium" }
        @{ name = "caregiver.health"; target = "health-caregiver.workers.dev"; priority = "high" }
    )
}

# Cloudflare API configuration
$baseUrl = "https://api.cloudflare.com/client/v4"
$headers = @{
    "Authorization" = "Bearer $CloudflareApiToken"
    "Content-Type" = "application/json"
}

Write-Host "🌐 Cloudflare DNS Configuration for Health Platform" -ForegroundColor Cyan
Write-Host "Domain: andernet.dev | Phase: $Phase" -ForegroundColor Yellow

# Get Zone ID if not provided
if (-not $ZoneId) {
    Write-Host "🔍 Finding Zone ID for andernet.dev..." -ForegroundColor Blue

    try {
        $zonesResponse = Invoke-RestMethod -Uri "$baseUrl/zones?name=andernet.dev" -Headers $headers
        if ($zonesResponse.success -and $zonesResponse.result.Count -gt 0) {
            $ZoneId = $zonesResponse.result[0].id
            Write-Host "✅ Found Zone ID: $ZoneId" -ForegroundColor Green
        } else {
            Write-Host "❌ Could not find zone for andernet.dev" -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "❌ Error fetching zone information: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Function to create DNS record
function New-DNSRecord {
    param(
        [string]$Name,
        [string]$Target,
        [string]$Priority,
        [bool]$DryRun
    )

    $recordData = @{
        type = "CNAME"
        name = "$Name.andernet.dev"
        content = $Target
        ttl = 300  # 5 minutes for development, increase for production
    } | ConvertTo-Json

    if ($DryRun) {
        Write-Host "  [DRY RUN] Would create: $Name.andernet.dev → $Target" -ForegroundColor Yellow
        return $true
    }

    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/zones/$ZoneId/dns_records" -Method POST -Headers $headers -Body $recordData
        if ($response.success) {
            Write-Host "  ✅ Created: $Name.andernet.dev → $Target" -ForegroundColor Green
            return $true
        } else {
            Write-Host "  ❌ Failed: $Name.andernet.dev - $($response.errors[0].message)" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "  ❌ Error creating $Name.andernet.dev: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to delete DNS records (cleanup)
function Remove-DNSRecords {
    param([bool]$DryRun)

    Write-Host "🧹 Cleaning up health platform DNS records..." -ForegroundColor Yellow

    try {
        $existingRecords = Invoke-RestMethod -Uri "$baseUrl/zones/$ZoneId/dns_records?type=CNAME" -Headers $headers

        foreach ($record in $existingRecords.result) {
            if ($record.name -match "health\.andernet\.dev$") {
                if ($DryRun) {
                    Write-Host "  [DRY RUN] Would delete: $($record.name)" -ForegroundColor Yellow
                } else {
                    $deleteResponse = Invoke-RestMethod -Uri "$baseUrl/zones/$ZoneId/dns_records/$($record.id)" -Method DELETE -Headers $headers
                    if ($deleteResponse.success) {
                        Write-Host "  🗑️  Deleted: $($record.name)" -ForegroundColor Green
                    }
                }
            }
        }
    } catch {
        Write-Host "❌ Error during cleanup: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Main execution
if ($CleanUp) {
    Remove-DNSRecords -DryRun $DryRun
    exit 0
}

# Create DNS records for selected phase
$recordsToCreate = $subdomains[$Phase]
if (-not $recordsToCreate) {
    Write-Host "❌ Invalid phase: $Phase. Valid phases: 1, 2, 3" -ForegroundColor Red
    exit 1
}

Write-Host "📝 Creating Phase $Phase DNS records..." -ForegroundColor Blue

$successCount = 0
$totalCount = $recordsToCreate.Count

foreach ($subdomain in $recordsToCreate) {
    $result = New-DNSRecord -Name $subdomain.name -Target $subdomain.target -Priority $subdomain.priority -DryRun $DryRun
    if ($result) { $successCount++ }
}

# Summary
Write-Host "`n📊 Summary:" -ForegroundColor Cyan
Write-Host "  Phase: $Phase" -ForegroundColor White
Write-Host "  Records processed: $successCount/$totalCount" -ForegroundColor White
if ($DryRun) {
    Write-Host "  Mode: DRY RUN (no changes made)" -ForegroundColor Yellow
} else {
    Write-Host "  Mode: LIVE (DNS records created)" -ForegroundColor Green
}

# Next steps
if ($successCount -eq $totalCount -and -not $DryRun) {
    Write-Host "`n🚀 Next Steps:" -ForegroundColor Green
    Write-Host "  1. Deploy workers: wrangler deploy --env production" -ForegroundColor White
    Write-Host "  2. Test endpoints: curl https://health.andernet.dev/health" -ForegroundColor White
    Write-Host "  3. Configure SSL (auto-enabled for .dev domains)" -ForegroundColor White

    if ($Phase -eq "1") {
        Write-Host "  4. Ready for Phase 2: .\scripts\dns-setup.ps1 -Phase 2" -ForegroundColor White
    }
}

exit 0
