<#
 .SYNOPSIS
  Poll a GitHub Pull Request until CI checks complete, then auto-merge if all hard gates succeed.

 .DESCRIPTION
  Uses the GitHub CLI (gh) to repeatedly fetch status checks for a PR. Soft-failure jobs (e.g. schema drift) are
  ignored when deciding merge readiness. Requires: gh auth login (token with repo scope) & PowerShell 7.

 .PARAMETER Pr
  Pull request number to monitor (default: 26).

 .PARAMETER MaxIterations
  Maximum polling iterations before giving up (default: 120).

 .PARAMETER DelaySeconds
  Delay between polls (default: 20 seconds).

 .PARAMETER SoftFailures
  Job names that are allowed to fail without blocking merge (default includes ws_schema_drift).

 .EXAMPLE
  pwsh ./scripts/ci/pr-poll-merge.ps1 -Pr 26

 .NOTES
  Will attempt: gh pr merge --squash --auto so GitHub performs merge once all conditions satisfy.
#>
param(
  [int]$Pr = 26,
  [int]$MaxIterations = 120,
  [int]$DelaySeconds = 20,
  [string[]]$SoftFailures = @('ws_schema_drift')
)

function Write-Log {
  param([string]$Message, [string]$Level = 'INFO')
  $ts = (Get-Date).ToString('HH:mm:ss')
  Write-Host "[$ts][$Level] $Message"
}

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Error 'GitHub CLI (gh) not found on PATH.'
  exit 2
}

Write-Log "Polling PR #$Pr (max $MaxIterations iterations, $DelaySeconds s delay)" 'START'

for ($i = 1; $i -le $MaxIterations; $i++) {
  # gh returns JSON text; ensure we parse only if the output is a string
  # Force raw JSON via --template to avoid PowerShell object formatting (@{...})
  $raw = gh pr view $Pr --json mergeStateStatus,statusCheckRollup --template "{{json .}}" 2>$null
  if (-not $raw) {
    Write-Log "Iteration ${i}: failed to fetch PR JSON (network/API). Retrying..." 'WARN'
    Start-Sleep -Seconds $DelaySeconds
    continue
  }

  try { $pr = $raw | ConvertFrom-Json } catch {
    Write-Log "Iteration ${i}: JSON parse error: $($_.Exception.Message)" 'ERROR'
    Start-Sleep -Seconds $DelaySeconds
    continue
  }

  $checks = @()
  if ($pr.statusCheckRollup) { $checks = $pr.statusCheckRollup }

  $hardFailures = @(
    $checks | Where-Object { $_.conclusion -in @('FAILURE','CANCELLED','TIMED_OUT') -and ($SoftFailures -notcontains $_.name) }
  )
  $pending = @(
    $checks | Where-Object { (-not $_.conclusion -or $_.conclusion -eq '') -and ($SoftFailures -notcontains $_.name) }
  )
  $codeQuality = @($checks | Where-Object { $_.name -eq 'code_quality' })
  $codeQualityDone = ($codeQuality.Count -gt 0 -and $codeQuality[0].conclusion -and $codeQuality[0].conclusion -ne '')

  $doneCount = (@($checks | Where-Object { $_.conclusion -and $_.conclusion -ne '' })).Count
  $total = $checks.Count
  $mergeState = $pr.mergeStateStatus

    Write-Log "Iter=$i done=$doneCount/$total mergeState=$mergeState hardFailures=$($hardFailures.Count) pendingHard=$($pending.Count)" 'POLL'

  if ($hardFailures.Count -gt 0) {
    Write-Log 'Hard failure(s) detected:' 'FAIL'
    $hardFailures | ForEach-Object { Write-Host ('  - ' + $_.name + ' => ' + $_.conclusion) }
    exit 1
  }

  if ($codeQualityDone -and $pending.Count -eq 0) {
    if ($mergeState -in @('CLEAN','UNSTABLE')) {
      Write-Log 'All hard checks complete. Requesting squash auto-merge...' 'READY'
      $mergeResult = gh pr merge $Pr --squash --auto --body 'Squash merge: CI automation enhancements' 2>&1
      if ($LASTEXITCODE -eq 0) {
        Write-Log 'Merge command accepted (GitHub will finalize if not immediate).' 'MERGE'
        Write-Output $mergeResult
        exit 0
      }
      else {
        Write-Log "Merge command failed (state=$mergeState). Output:" 'WARN'
        Write-Output $mergeResult
        # still exit 0 because checks passed; manual intervention may be required
        exit 0
      }
    }
    else {
      Write-Log "All checks complete but mergeState=$mergeState (not mergeable). Exiting." 'BLOCK'
      exit 3
    }
  }

  Start-Sleep -Seconds $DelaySeconds
}

Write-Log "Reached max iterations ($MaxIterations) without completion." 'TIMEOUT'
exit 4
