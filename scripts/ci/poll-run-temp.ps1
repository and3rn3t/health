param(
  [Parameter(Mandatory=$true)][long]$RunId,
  [int]$IntervalSeconds=15,
  [int]$MaxIterations=24
)
Write-Host "Polling run $RunId ..."
for($i=0;$i -lt $MaxIterations;$i++){
  $ts = Get-Date -Format HH:mm:ss
  try {
    $meta = gh run view $RunId --json status,conclusion 2>$null | ConvertFrom-Json
    $jobsData = gh run view $RunId --json jobs 2>$null | ConvertFrom-Json
  } catch {
    $meta = $null; $jobsData=$null
  }
  if($meta){
    $jobsSummary = ''
    if($jobsData -and $jobsData.jobs){
      $jobsSummary = ($jobsData.jobs | ForEach-Object { "{0}:{1}:{2}" -f $_.name,$_.status,$_.conclusion }) -join ';'
    }
    Write-Host "[$ts] status=$($meta.status) conclusion=$($meta.conclusion) jobs=$jobsSummary"
    if($meta.status -eq 'completed'){ break }
  } else {
    Write-Host "[$ts] (run not yet accessible)"
  }
  Start-Sleep -Seconds $IntervalSeconds
}
