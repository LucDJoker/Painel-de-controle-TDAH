# APK build script (Windows)
# Usage: powershell -ExecutionPolicy Bypass -File build-apk.ps1 [-Release]

param(
    [switch]$Release = $false
)

function Write-Success { param($msg) Write-Host $msg -ForegroundColor Green }
function Write-Error-Custom { param($msg) Write-Host $msg -ForegroundColor Red }
function Write-Warning-Custom { param($msg) Write-Host $msg -ForegroundColor Yellow }

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Compilador APK - Painel Controle" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$PROJECT_DIR = Get-Location
$ANDROID_DIR = Join-Path $PROJECT_DIR "android"

if (-not (Test-Path $ANDROID_DIR)) {
    Write-Error-Custom "Erro: execute o script na raiz do projeto"
    exit 1
}

Write-Host "Verificando Java..." -ForegroundColor Cyan
try {
    $javaVersion = java -version 2>&1 | Select-Object -First 1
    Write-Success "Java OK: $javaVersion"
}
catch {
    Write-Error-Custom "Java nao encontrado. Configure JAVA_HOME e instale o JDK."
    exit 1
}

Write-Host "Verificando Android SDK..." -ForegroundColor Cyan
$ANDROID_SDK = if ($env:ANDROID_SDK_ROOT) { $env:ANDROID_SDK_ROOT } elseif ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { $null }
if (-not $ANDROID_SDK) {
    Write-Error-Custom "Android SDK nao configurado (defina ANDROID_SDK_ROOT ou ANDROID_HOME)."
    exit 1
}
Write-Success "Android SDK: $ANDROID_SDK"

Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Warning-Custom "Preparando build web (Next build)..."
& bun run apk:prepare
if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Falha ao gerar out com Next build"
    exit 1
}

Write-Warning-Custom "Sincronizando com Capacitor..."
& bun x @capacitor/cli sync android
if ($LASTEXITCODE -ne 0) {
    Write-Warning-Custom "Sync retornou erro; continuando mesmo assim"
}

$buildType = if ($Release) { "Release" } else { "Debug" }
$buildTask = if ($Release) { "assembleRelease" } else { "assembleDebug" }
Write-Warning-Custom "Compilando APK $buildType..."

Push-Location $ANDROID_DIR
try {
    if ($PSVersionTable.Platform -eq "Win32NT" -or $PSVersionTable.OS -like "*Windows*") {
        & .\gradlew.bat $buildTask
    }
    else {
        & ./gradlew $buildTask
    }

    if ($LASTEXITCODE -eq 0) {
        $apkPath = if ($Release) { Join-Path $ANDROID_DIR "app\build\outputs\apk\release\app-release-unsigned.apk" } else { Join-Path $ANDROID_DIR "app\build\outputs\apk\debug\app-debug.apk" }
        if (Test-Path $apkPath) {
            $size = (Get-Item $apkPath).Length / 1MB
            Write-Success "APK gerado: $apkPath"
            Write-Success ("Tamanho: {0:F2} MB" -f $size)
            Write-Host "Para instalar: adb install -r \"$apkPath\""
        }
        else {
            Write-Error-Custom "APK nao encontrado no caminho esperado"stom "APK nao encontrado no caminho esperado"
            exit 1
        }       
    }
} }
else {
    Write-Error-Custom "Compilacao Gradle falhou"        Write-Error-Custom "Compilacao Gradle falhou"
    Write-Host "Dicas:""
        Write-Host "  - Execute ./gradlew clean"
        Write-Host "  - Verifique Java e Android SDK"
        Write-Host "  - Tente novamente"        Write-Host "  - Tente novamente"
        exit 1
    }
}
finally {finally {
    Pop-Location
}

Write-Host ""
