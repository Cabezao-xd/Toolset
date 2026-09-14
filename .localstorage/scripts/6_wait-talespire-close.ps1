<#
.SYNOPSIS
  Espera a que TaleSpire cierre, hace auto-commit de la campaña a git y avisa a los demas workers.

.DESCRIPTION
  Responsabilidad:
    - Esperar a que aparezca el proceso TaleSpire.
    - Mantenerse vivo mientras el proceso exista.
    - Al cerrar: hacer commit + push de .localstorage/ a git.
    - Crear un archivo senal cuando TaleSpire cierre.
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$StopSignalFile,

    [string]$ProcessName = 'TaleSpire',

    [int]$StartupTimeoutSeconds = 90,

    [switch]$NoPauseOnError
)

$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$CommonLoggingScript = Join-Path $ScriptDir '0_common-logging.ps1'
. $CommonLoggingScript
Initialize-Logging -ScriptPath $PSCommandPath

function Wait-BeforeExitOnError {
    if (-not $NoPauseOnError) {
        Write-Host ''
        Write-Log 'Presiona una tecla para cerrar esta ventana...'
        [void][System.Console]::ReadKey($true)
    }
}

function Set-StopSignal {
    $dir = Split-Path -Parent $StopSignalFile

    if (-not (Test-Path $dir)) {
        [void](New-Item -ItemType Directory -Force -Path $dir)
    }

    Set-Content -Path $StopSignalFile -Value (Get-Date -Format o) -Force
}

# --- AUTO-COMMIT ---
function Invoke-ToolsetAutoCommit {
    $toolsetRoot = "C:\Users\martin\AppData\LocalLow\BouncyRock Entertainment\TaleSpire\Symbiotes\Toolset"

    if (-not (Test-Path $toolsetRoot)) {
        Write-Log "[auto-commit] No se encontro el Toolset en $toolsetRoot. Saltando."
        return
    }

    Push-Location $toolsetRoot
    try {
        # Comprobar que estamos en un repo git
        git rev-parse --is-inside-work-tree 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Log '[auto-commit] No es un repositorio git. Saltando.'
            return
        }

        # Anadir .localstorage al stage
        git add .localstorage/ 2>&1 | Out-Null

        # Ver si hay algo para commitear
        $status = git status --porcelain
        if (-not $status) {
            Write-Log '[auto-commit] Sin cambios en .localstorage/. Nada que subir.'
            return
        }

        # Commit
        $msg = "auto: cierre de sesion $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
        git commit -m $msg 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Log '[auto-commit] git commit fallo.'
            return
        }

        # Push
        git push 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Log '[auto-commit] git push fallo (revisa credenciales o conexion).'
            return
        }

        Write-Log "[auto-commit] Backup subido: $msg"
    }
    catch {
        Write-Log ("[auto-commit] ERROR: {0}" -f $_.Exception.Message)
    }
    finally {
        Pop-Location
    }
}
# --- FIN AUTO-COMMIT ---

try {
    Write-Log 'Esperando proceso TaleSpire...'

    $appeared = $false

    for ($i = 0; $i -lt $StartupTimeoutSeconds; $i++) {
        if (Get-Process -Name $ProcessName -ErrorAction SilentlyContinue) {
            $appeared = $true
            break
        }

        Start-Sleep -Seconds 1
    }

    if (-not $appeared) {
        Write-Log 'TaleSpire no aparecio dentro del tiempo esperado. Enviando senal de stop.'
        Set-StopSignal
        exit 2
    }

    Write-Log 'TaleSpire detectado. Esperando cierre...'

    while (Get-Process -Name $ProcessName -ErrorAction SilentlyContinue) {
        Start-Sleep -Seconds 2
    }

    Write-Log 'TaleSpire cerrado.'

    # --- AUTO-COMMIT ---
    # Antes de avisar al resto de workers, subimos el estado a git.
    Write-Log 'Ejecutando auto-commit...'
    Invoke-ToolsetAutoCommit
    # --- FIN AUTO-COMMIT ---

    Write-Log 'Enviando senal de stop.'
    Set-StopSignal
    exit 0
}
catch {
    Write-Log ("ERROR esperando cierre de TaleSpire: {0}" -f $_.Exception.Message)
    try { Set-StopSignal } catch {}
    Wait-BeforeExitOnError
    exit 1
}