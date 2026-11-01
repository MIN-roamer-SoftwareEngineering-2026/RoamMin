$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$taskRuntime = Join-Path $taskRoot '.local'
New-Item -ItemType Directory -Force -Path $taskRuntime | Out-Null

if (-not (Test-Path (Join-Path $taskRoot 'frontend/node_modules/vite'))) {
    throw 'Frontend dependencies are missing. Run npm install in frontend first.'
}
Get-Command npm.cmd, mvn.cmd -ErrorAction Stop | Out-Null

# Use a full JDK, not the Java 8 JRE commonly present on Windows PATH.
$taskJdkCandidates = @($env:JAVA_HOME, 'D:\apps\Android Studio\jbr')
$taskJdkCandidates += @(Get-ChildItem 'C:\Program Files\Java', 'C:\Program Files\Eclipse Adoptium' -Directory -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName)
$taskJdk = $null
foreach ($taskCandidate in $taskJdkCandidates) {
    if (-not $taskCandidate) { continue }
    $taskCompiler = Join-Path $taskCandidate 'bin/javac.exe'
    if (-not (Test-Path -LiteralPath $taskCompiler)) { continue }
    $taskVersion = (& $taskCompiler -version 2>&1 | Out-String)
    if ($taskVersion -match 'javac (\d+)' -and [int]$Matches[1] -ge 17) {
        $taskJdk = $taskCandidate
        break
    }
}
if (-not $taskJdk) { throw 'JDK 17+ was not found. Set JAVA_HOME to a full JDK and retry.' }
$env:JAVA_HOME = $taskJdk
$env:PATH = "$taskJdk\bin;$env:PATH"

# Keep the local signing key stable across restarts; never print it or commit it.
if (-not $env:JWT_SECRET) {
    $taskSecretPath = Join-Path $taskRuntime 'jwt-secret.txt'
    if (-not (Test-Path -LiteralPath $taskSecretPath)) {
        $taskBytes = New-Object byte[] 32
        $taskRng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
        try { $taskRng.GetBytes($taskBytes) } finally { $taskRng.Dispose() }
        [System.IO.File]::WriteAllText($taskSecretPath, [Convert]::ToBase64String($taskBytes))
    }
    $env:JWT_SECRET = [System.IO.File]::ReadAllText($taskSecretPath).Trim()
}

$taskListeners = [System.Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners()
if (8080 -notin $taskListeners.Port) {
    # Old copied build output may have inherited the read-only file attribute.
    $taskBuild = Join-Path $taskRoot 'backend/target'
    if (Test-Path -LiteralPath $taskBuild) {
        Get-ChildItem -LiteralPath $taskBuild -File -Recurse | ForEach-Object { $_.IsReadOnly = $false }
    }
    $taskBackend = Start-Process -FilePath $env:ComSpec -ArgumentList '/d', '/c', 'mvn spring-boot:run' -WorkingDirectory (Join-Path $taskRoot 'backend') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $taskRuntime 'backend.log') -RedirectStandardError (Join-Path $taskRuntime 'backend-error.log') -PassThru
    Write-Host "Backend starting (process $($taskBackend.Id))."
} else { Write-Host 'Port 8080 is already listening; keeping the existing service.' }
if (5173 -notin $taskListeners.Port) {
    $taskFrontend = Start-Process -FilePath $env:ComSpec -ArgumentList '/d', '/c', 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort' -WorkingDirectory (Join-Path $taskRoot 'frontend') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $taskRuntime 'frontend.log') -RedirectStandardError (Join-Path $taskRuntime 'frontend-error.log') -PassThru
    Write-Host "Frontend starting (process $($taskFrontend.Id))."
} else { Write-Host 'Port 5173 is already listening; keeping the existing service.' }
Write-Host ''
Write-Host 'Open: http://127.0.0.1:5173/login'
Write-Host 'Services keep running after this window closes. Allow the backend a few seconds to start.'
Write-Host "Logs: $taskRuntime"
