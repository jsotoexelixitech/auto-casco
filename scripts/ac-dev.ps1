# Levanta frontend + backend en PowerShell 7 (red local)
# Uso: pwsh ./scripts/ac-dev.ps1

$env:AC_PROJECT_ROOT = (Resolve-Path "$PSScriptRoot\..").Path
$profilePath = "$HOME\Documents\PowerShell\Microsoft.PowerShell_profile.ps1"
if (Test-Path $profilePath) { . $profilePath }
$script:AcRoot = $env:AC_PROJECT_ROOT
Start-AcDev
