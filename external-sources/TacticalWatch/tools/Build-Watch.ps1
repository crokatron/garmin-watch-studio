param(
    [switch]$Preview,
    [string]$SdkPath,
    [string]$KeyPath,
    [string]$JavaPath
)
$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
if(!$SdkPath){$SdkPath=$env:CONNECTIQ_SDK}
if(!$SdkPath){$SdkPath=(Get-Content -LiteralPath (Join-Path $env:APPDATA 'Garmin\ConnectIQ\current-sdk.cfg') -Raw).Trim()}
if(!$JavaPath){$javaCommand=Get-Command java -ErrorAction SilentlyContinue;if($javaCommand){$JavaPath=$javaCommand.Source}}
if(!$JavaPath -and $env:JAVA_HOME){$JavaPath=Join-Path $env:JAVA_HOME 'bin\java.exe'}
if(!$JavaPath){$JavaPath=Get-ChildItem -Path 'C:\Program Files\Eclipse Adoptium\*\bin\java.exe' -ErrorAction SilentlyContinue | Sort-Object FullName -Descending | Select-Object -First 1 -ExpandProperty FullName}
if(!$JavaPath){throw 'Java not found. Set JAVA_HOME or pass -JavaPath.'}
if(!$KeyPath){$KeyPath=$env:GARMIN_DEVELOPER_KEY}
if(!$KeyPath){$KeyPath=Join-Path $projectRoot 'developer_key'}
if(!(Test-Path -LiteralPath $KeyPath)){throw 'Pass -KeyPath or set GARMIN_DEVELOPER_KEY to your existing signing key.'}
$designHash=(Get-FileHash -LiteralPath (Join-Path $projectRoot 'design\approved-layout.json') -Algorithm SHA256).Hash.ToLowerInvariant()
$generation=Get-Content -LiteralPath (Join-Path $projectRoot 'generated\manifest.json') -Raw | ConvertFrom-Json
if($generation.designHash -ne $designHash){throw 'Generated layout is not the approved baseline. Regenerate, or explicitly approve the supplied export with Update-Design.ps1 -Approve.'}
$editorHash=(Get-FileHash -LiteralPath (Join-Path $projectRoot 'Watch-Face-Designer.html') -Algorithm SHA256).Hash.ToLowerInvariant()
if($generation.editorHash -ne $editorHash){throw 'Editor has changed since generation. Run Update-Design.ps1.'}
foreach($entry in $generation.files.PSObject.Properties){
    $candidate=[IO.Path]::GetFullPath((Join-Path (Join-Path $projectRoot 'generated') $entry.Name))
    if(!$candidate.StartsWith((Join-Path $projectRoot 'generated')+[IO.Path]::DirectorySeparatorChar)){throw 'Invalid generated path'}
    if(!(Test-Path -LiteralPath $candidate) -or (Get-FileHash -LiteralPath $candidate -Algorithm SHA256).Hash.ToLowerInvariant() -ne $entry.Value){throw "Generated artifact changed or missing: $($entry.Name). Regenerate it."}
}
$name=if($Preview){'TacticalWatch-preview'}else{'TacticalWatch'}
$jungle=if($Preview){'preview.jungle'}else{'monkey.jungle'}
New-Item -ItemType Directory -Path (Join-Path $projectRoot 'bin') -Force | Out-Null
Push-Location $projectRoot
try {
    & $JavaPath '-Xms256m' '-Dfile.encoding=UTF-8' '-cp' (Join-Path $SdkPath 'bin\monkeybrains.jar') 'com.garmin.monkeybrains.Monkeybrains' '-f' $jungle '-d' 'fenix9pro47mm' '-y' $KeyPath '-o' "bin/$name.prg" '-l' '0' '-w' 2>&1 | Tee-Object -FilePath "bin/$name-build.log"
    if($LASTEXITCODE -ne 0){throw "Garmin build failed ($LASTEXITCODE). See bin/$name-build.log."}
    & node (Join-Path $PSScriptRoot 'build-receipt.cjs') $name
    if($LASTEXITCODE -ne 0){throw 'Could not record build provenance.'}
} finally {Pop-Location}
