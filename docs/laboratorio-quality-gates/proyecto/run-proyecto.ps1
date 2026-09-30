# Quality gates sobre el front y el backend reales.
# La repeticion de defectos usa copias en memoria: no modifica el codigo.

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = (Resolve-Path (Join-Path $here "..\..\..")).Path
$gates = Join-Path $here "gates.mjs"
$replay = Join-Path $here "replay-defectos.mjs"
$out = Join-Path $here "ultima-corrida.json"

$stages = @()
$failed = $false

function Invoke-Stage {
    param([string]$Name, [scriptblock]$Action)
    Write-Host ""
    Write-Host "=== $Name ==="
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $code = 0
    try {
        & $Action
        if ($null -ne $LASTEXITCODE) { $code = $LASTEXITCODE }
    }
    catch {
        $code = 1
        Write-Host $_.Exception.Message
    }
    $sw.Stop()
    $ok = $code -eq 0
    Write-Host ("Resultado: {0} ({1} ms)" -f $(if ($ok) { "verde" } else { "rojo" }), $sw.ElapsedMilliseconds)
    $script:stages += [pscustomobject]@{
        Nombre = $Name
        Ok     = $ok
        Ms     = $sw.ElapsedMilliseconds
    }
    if (-not $ok) { $script:failed = $true }
}

$total = [System.Diagnostics.Stopwatch]::StartNew()

Invoke-Stage "Secretos y conformidad (codigo y propuestas)" {
    node $gates
}

Invoke-Stage "Backend: compilacion, pruebas y cobertura" {
    Push-Location (Join-Path $root "backend")
    try { mvn -B verify } finally { Pop-Location }
}

Invoke-Stage "Frontend: pruebas con cobertura" {
    Push-Location (Join-Path $root "frontend")
    try { npm run test:coverage } finally { Pop-Location }
}

Invoke-Stage "Frontend: build" {
    Push-Location (Join-Path $root "frontend")
    try { npm run build } finally { Pop-Location }
}

Invoke-Stage "Repeticion de defectos del piloto" {
    node $replay
}

$gitleaks = Get-Command gitleaks -ErrorAction SilentlyContinue
if ($gitleaks) {
    Invoke-Stage "Gitleaks" {
        gitleaks detect --source $root --config (Join-Path $here ".gitleaks.toml") --no-banner --redact
    }
}
else {
    Write-Host ""
    Write-Host "Gitleaks no esta en PATH. El bloqueo de secretos lo hace el escaner calibrado (ejemplo-de-gate)."
}

$total.Stop()

$report = [pscustomobject]@{
    Fecha   = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    Ok      = -not $failed
    TotalMs = $total.ElapsedMilliseconds
    Etapas  = $stages
}
$report | ConvertTo-Json -Depth 4 | Set-Content -Path $out -Encoding UTF8

Write-Host ""
Write-Host ("Tiempo del pipeline local: {0} ms" -f $total.ElapsedMilliseconds)
Write-Host ("Evidencia: {0}" -f $out)
if ($failed) { exit 1 }
