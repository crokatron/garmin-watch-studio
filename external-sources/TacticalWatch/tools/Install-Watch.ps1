param([Parameter(Mandatory=$true)][string]$PackagePath)
$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$packageRoot=(Resolve-Path -LiteralPath $PackagePath).Path
$program=Join-Path $packageRoot 'TacticalWatch.prg'
$receipt=Get-Content -LiteralPath (Join-Path $packageRoot 'build.json') -Raw | ConvertFrom-Json
if($receipt.profile -ne 'TacticalWatch' -or $receipt.target -ne 'fenix9pro47mm'){throw 'Not a live package for this watch'}
$expected=$receipt.programHash
if((Get-FileHash -LiteralPath $program -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expected){throw 'Package hash mismatch'}
$mtpShell=New-Object -ComObject Shell.Application
function Only-One($items,$label){$all=@($items);if($all.Count -ne 1){throw "Expected one $label; found $($all.Count)"};return $all[0]}
$device=Only-One (@($mtpShell.Namespace(17).Items()) | Where-Object {$_.Name -eq 'fenix 9 Pro - 47mm'}) 'connected fenix 9 Pro - 47mm'
$storage=Only-One (@($device.GetFolder.Items()) | Where-Object {$_.Name -eq 'Internal Storage'}) 'internal storage'
$garmin=Only-One (@($storage.GetFolder.Items()) | Where-Object {$_.Name -eq 'GARMIN'}) 'GARMIN directory'
$apps=Only-One (@($garmin.GetFolder.Items()) | Where-Object {$_.Name -eq 'Apps'}) 'GARMIN/APPS directory'
$recordRoot=Join-Path $projectRoot ('.local-backup/watch-install/'+(Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $recordRoot -Force | Out-Null
function Wait-LocalFile($path){for($i=0;$i -lt 30;$i++){if((Test-Path -LiteralPath $path) -and (Get-Item -LiteralPath $path).Length -gt 0){return};Start-Sleep -Milliseconds 500};throw "Copy did not complete: $path"}
$existing=@($apps.GetFolder.Items()) | Where-Object {$_.Name -eq 'TacticalWatch.prg'}
if($existing){
 $previous=Join-Path $recordRoot 'previous';New-Item -ItemType Directory -Path $previous | Out-Null
 $mtpShell.Namespace($previous).CopyHere($existing,20)
 Wait-LocalFile (Join-Path $previous 'TacticalWatch.prg')
 if((Get-Item -LiteralPath (Join-Path $previous 'TacticalWatch.prg')).Length -ne $existing.ExtendedProperty('System.Size')){throw 'Previous program backup is incomplete'}
}
$localItem=$mtpShell.Namespace($packageRoot).ParseName('TacticalWatch.prg')
$apps.GetFolder.CopyHere($localItem,20)
$installed=$null
for($i=0;$i -lt 30;$i++){
 $installed=@($apps.GetFolder.Items()) | Where-Object {$_.Name -eq 'TacticalWatch.prg' -and $_.ExtendedProperty('System.Size') -eq (Get-Item -LiteralPath $program).Length}
 if($installed){break};Start-Sleep -Milliseconds 500
}
if(!$installed){throw 'Watch file not visible with expected size; do not claim verified installation'}
$readback=Join-Path $recordRoot 'readback';New-Item -ItemType Directory -Path $readback | Out-Null
$mtpShell.Namespace($readback).CopyHere($installed,20)
$copied=Join-Path $readback 'TacticalWatch.prg';Wait-LocalFile $copied
$actual=(Get-FileHash -LiteralPath $copied -Algorithm SHA256).Hash.ToLowerInvariant()
if($actual -ne $expected){throw 'Watch readback hash differs from packaged program'}
$record=@{device=$device.Name;destination='Internal Storage/GARMIN/Apps/TacticalWatch.prg';programHash=$actual;bytes=(Get-Item -LiteralPath $copied).Length;verifiedAt=(Get-Date -Format o);package=$packageRoot;readback=$copied}
$record | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $recordRoot 'installation.json') -Encoding utf8
$record | ConvertTo-Json
