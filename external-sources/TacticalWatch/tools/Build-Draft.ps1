param([string]$Design='design/readability-draft.json')
$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$sdkPath=(Get-Content -LiteralPath (Join-Path $env:APPDATA 'Garmin\ConnectIQ\current-sdk.cfg') -Raw).Trim()
$javaPath=(Get-ChildItem 'C:\Program Files\Eclipse Adoptium\*\bin\java.exe' | Sort-Object FullName -Descending | Select-Object -First 1).FullName
$keyPath=if($env:GARMIN_DEVELOPER_KEY){$env:GARMIN_DEVELOPER_KEY}else{Join-Path $projectRoot 'developer_key'}
$draftRoot=Join-Path $projectRoot '.test-output\readability'
Push-Location $projectRoot
try {
    & node tools/generate.cjs --input $Design --output $draftRoot
    if($LASTEXITCODE -ne 0){throw 'Draft generation failed'}
    $projectUnix=$projectRoot.Replace('\','/');$draftUnix=$draftRoot.Replace('\','/')
    foreach($variant in @('live','preview')){
        $profilePath=if($variant -eq 'preview'){"$draftUnix/preview"}else{"$projectUnix/profiles/live"}
        $manifestPath=if($variant -eq 'preview'){"$draftUnix/preview/manifest.xml"}else{"$projectUnix/manifest.xml"}
        $jungle="project.manifest = $manifestPath`nbase.sourcePath = $projectUnix/source;$draftUnix/source;$profilePath`nbase.resourcePath = $projectUnix/resources;$draftUnix/resources`n"
        Set-Content -LiteralPath (Join-Path $draftRoot "$variant.jungle") -Value $jungle -Encoding utf8
        & $javaPath '-Xms256m' '-Dfile.encoding=UTF-8' '-cp' (Join-Path $sdkPath 'bin\monkeybrains.jar') 'com.garmin.monkeybrains.Monkeybrains' '-f' (Join-Path $draftRoot "$variant.jungle") '-d' 'fenix9pro47mm' '-y' $keyPath '-o' (Join-Path $draftRoot "$variant.prg") '-l' '0' '-w' 2>&1 | Tee-Object -FilePath (Join-Path $draftRoot "$variant-build.log")
        if($LASTEXITCODE -ne 0){throw "Draft $variant build failed"}
    }
    Write-Host 'DRAFT ONLY: approved baseline and installed watch have not been changed.'
} finally {Pop-Location}
