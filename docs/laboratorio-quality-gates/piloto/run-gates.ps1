# Piloto local de Quality Gates para codigo agentico.
# Proxy ejecutable de los gates de secretos y de conformidad.
# No sustituye compilacion, pruebas, cobertura ni SAST del pipeline real.

param(
    [ValidateSet("ambos", "naive", "calibrado")]
    [string]$Modo = "ambos"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$casosDir = Join-Path $root "casos"

function Read-Utf8File {
    param([string]$Path)
    $bytes = [System.IO.File]::ReadAllBytes($Path)
    if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
        return [System.Text.Encoding]::UTF8.GetString($bytes, 3, $bytes.Length - 3)
    }
    return [System.Text.Encoding]::UTF8.GetString($bytes)
}

function Read-CaseText {
    param([string]$Dir)
    $files = Get-ChildItem -Path $Dir -Recurse -File |
        Where-Object { $_.Name -ne "manifest.json" }
    $chunks = @()
    foreach ($file in $files) {
        $chunks += (Read-Utf8File -Path $file.FullName)
    }
    return ($chunks -join "`n")
}

function Test-GateSecret {
    param([string]$Text, [bool]$Calibrado)
    $pattern = 'AKIA[0-9A-Z]{16}|sk_live_[0-9A-Za-z]+|password\s*[:=]\s*\S+'
    foreach ($line in ($Text -split "`r?`n")) {
        if ($Calibrado -and $line -match 'ejemplo-de-gate') { continue }
        if ($line -match $pattern) { return $false }
    }
    return $true
}

function Test-GateTraza {
    param([string]$Text)
    return [bool]($Text -match 'HU-\d{3}')
}

function Test-GateImpacto {
    param([string]$Text)
    $tieneAuth = $Text -match 'Autenticaci'
    $tienePii = $Text -match 'Datos Personales'
    $tieneMig = $Text -match 'Migraciones'
    return ($tieneAuth -and $tienePii -and $tieneMig)
}

function Test-GateRollback {
    param([string]$Text)
    $hayMigracion = $Text -match 'Migraciones[^\n]{0,80}\?:\s*S'
    if (-not $hayMigracion) { return $true }
    return [bool]($Text -match 'DROP TABLE')
}

function Test-GateSoloLectura {
    param([string]$Text)
    $exigeLectura = $Text -match 'solo lectura'
    if (-not $exigeLectura) { return $true }
    $escribe = $Text -match '@PostMapping|@PutMapping|@DeleteMapping|@PatchMapping'
    return -not $escribe
}

function Test-GateFiltro {
    param([string]$Text)
    $exige = $Text -match 'sin distinguir'
    if (-not $exige) { return $true }
    return [bool]($Text -match 'toLowerCase|equalsIgnoreCase')
}

function Invoke-Caso {
    param($Manifest, [string]$Text, [bool]$Calibrado)

    $gates = [ordered]@{
        "G-SECRET"       = (Test-GateSecret -Text $Text -Calibrado $Calibrado)
        "G-TRAZA"        = (Test-GateTraza -Text $Text)
        "G-IMPACTO"      = (Test-GateImpacto -Text $Text)
        "G-ROLLBACK"     = (Test-GateRollback -Text $Text)
        "G-SOLO-LECTURA" = (Test-GateSoloLectura -Text $Text)
        "G-FILTRO"       = (Test-GateFiltro -Text $Text)
    }

    $fallidos = @($gates.Keys | Where-Object { -not $gates[$_] })
    $defecto = $Manifest.defecto
    $mapa = @{
        "secreto"      = "G-SECRET"
        "sin-hu"       = "G-TRAZA"
        "sin-rollback" = "G-ROLLBACK"
        "escritura"    = "G-SOLO-LECTURA"
        "filtro"       = "G-FILTRO"
    }

    $detenido = $false
    $falsoPositivo = $false
    $esperado = $null

    if ([string]::IsNullOrEmpty($defecto)) {
        $falsoPositivo = $fallidos.Count -gt 0
    }
    elseif ($defecto -eq "documentacion") {
        $esperado = "G-SECRET"
        if ($Calibrado) {
            $falsoPositivo = $fallidos.Count -gt 0
        }
        else {
            $falsoPositivo = $fallidos -contains "G-SECRET"
        }
    }
    else {
        $esperado = $mapa[$defecto]
        $detenido = $fallidos -contains $esperado
    }

    [pscustomobject]@{
        Id             = $Manifest.id
        Nombre         = $Manifest.nombre
        Defecto        = $(if ($defecto) { $defecto } else { "ninguno" })
        Esperado       = $(if ($esperado) { $esperado } else { "-" })
        Fallidos       = $(if ($fallidos.Count) { $fallidos -join ", " } else { "-" })
        Detenido       = $detenido
        FalsoPositivo  = $falsoPositivo
        Modo           = $(if ($Calibrado) { "calibrado" } else { "naive" })
    }
}

function Invoke-Modo {
    param([bool]$Calibrado)
    $filas = @()
    $dirs = Get-ChildItem -Path $casosDir -Directory | Sort-Object Name
    foreach ($dir in $dirs) {
        $manifestPath = Join-Path $dir.FullName "manifest.json"
        $manifest = Get-Content -Path $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
        $text = Read-CaseText -Dir $dir.FullName
        $filas += Invoke-Caso -Manifest $manifest -Text $text -Calibrado $Calibrado
    }
    return $filas
}

$modos = @()
if ($Modo -eq "ambos" -or $Modo -eq "naive") { $modos += $false }
if ($Modo -eq "ambos" -or $Modo -eq "calibrado") { $modos += $true }

$todos = @()
$sw = [System.Diagnostics.Stopwatch]::StartNew()
foreach ($calibrado in $modos) {
    $etiqueta = $(if ($calibrado) { "CALIBRADO" } else { "NAIVE" })
    Write-Host ""
    Write-Host "=== Modo $etiqueta ==="
    $filas = Invoke-Modo -Calibrado $calibrado
    $todos += $filas
    $filas | Format-Table -Property Id, Defecto, Esperado, Fallidos, Detenido, FalsoPositivo -AutoSize | Out-Host

    $conDefecto = @($filas | Where-Object { $_.Defecto -ne "ninguno" -and $_.Defecto -ne "documentacion" })
    $detenidos = @($conDefecto | Where-Object { $_.Detenido })
    $fp = @($filas | Where-Object { $_.FalsoPositivo })
    $limpios = @($filas | Where-Object { $_.Defecto -eq "ninguno" -or $_.Defecto -eq "documentacion" })

    Write-Host ("Defectos sembrados detenidos: {0}/{1}" -f $detenidos.Count, $conDefecto.Count)
    Write-Host ("Falsos positivos: {0}/{1} casos sin defecto real" -f $fp.Count, $limpios.Count)
}
$sw.Stop()
Write-Host ""
Write-Host ("Tiempo del piloto local: {0} ms" -f $sw.ElapsedMilliseconds)

$out = Join-Path $root "ultima-corrida.json"
$todos | ConvertTo-Json -Depth 4 | Set-Content -Path $out -Encoding UTF8
Write-Host ("Evidencia: {0}" -f $out)
