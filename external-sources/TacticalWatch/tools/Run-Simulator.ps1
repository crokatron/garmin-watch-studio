param([switch]$Preview,[string]$SdkPath,[string]$JavaPath,[string]$Program)
$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
if(!$SdkPath){$SdkPath=$env:CONNECTIQ_SDK}
if(!$SdkPath){$SdkPath=(Get-Content -LiteralPath (Join-Path $env:APPDATA 'Garmin\ConnectIQ\current-sdk.cfg') -Raw).Trim()}
if(!$JavaPath){$command=Get-Command java -ErrorAction SilentlyContinue;if($command){$JavaPath=$command.Source}}
if(!$JavaPath -and $env:JAVA_HOME){$JavaPath=Join-Path $env:JAVA_HOME 'bin\java.exe'}
if(!$JavaPath){$JavaPath=Get-ChildItem 'C:\Program Files\Eclipse Adoptium\*\bin\java.exe' -ErrorAction SilentlyContinue | Sort-Object FullName -Descending | Select-Object -First 1 -ExpandProperty FullName}
if(!$JavaPath){throw 'Java not found. Pass -JavaPath.'}
if(!(Get-Process simulator -ErrorAction SilentlyContinue)){
    # The simulator is an interactive review window requested with this command.
    Start-Process -FilePath (Join-Path $SdkPath 'bin\simulator.exe')
    Start-Sleep -Seconds 2
}
$name=if($Preview){'TacticalWatch-preview'}else{'TacticalWatch'}
if(!$Program){$Program=Join-Path $projectRoot "bin/$name.prg"}
$Program=(Resolve-Path -LiteralPath $Program).Path
if($Preview){Write-Host 'SIMULATED PREVIEW: fixed clock, sample health/weather/status values. Never sideload this build.'}
else{Write-Host 'LIVE DATA BUILD: the simulator supplies Garmin API data; these are not physical watch measurements.'}
Push-Location $projectRoot
try{
    & $JavaPath '-cp' (Join-Path $SdkPath 'bin\monkeybrains.jar') 'com.garmin.monkeybrains.monkeydodeux.MonkeyDoDeux' '-f' $Program '-d' 'fenix9pro47mm' '-s' (Join-Path $SdkPath 'bin\shell.exe') 2>&1 | Tee-Object -FilePath "bin/$name-simulator.log"
    if($LASTEXITCODE -ne 0){throw "Simulator exited with error $LASTEXITCODE"}
}finally{Pop-Location}
