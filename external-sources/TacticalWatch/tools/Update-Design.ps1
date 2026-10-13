param(
    [string]$Design,
    [switch]$Approve,
    [string]$Time='10:08',
    [ValidateSet('day','night')][string]$Mode='day',
    [switch]$RunPreview,
    [string]$SdkPath,
    [string]$JavaPath,
    [string]$KeyPath
)
$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$baseline=Join-Path $projectRoot 'design\approved-layout.json'
if(!(Test-Path -LiteralPath (Join-Path $projectRoot 'Watch-Face-Designer.html'))){throw 'The original Watch-Face-Designer.html is missing. Ask the user for the latest file; do not recreate it.'}
if($Design){
    $Design=(Resolve-Path -LiteralPath $Design).Path
    if($Design -ne $baseline){
        if(!$Approve){throw 'To promote the supplied export, add -Approve. For an unapproved experiment use generate.cjs --input file --output scratch-directory.'}
        & node -e 'require(process.argv[1]).validate(JSON.parse(require("node:fs").readFileSync(process.argv[2],"utf8")))' (Join-Path $PSScriptRoot 'generate.cjs') $Design
        if($LASTEXITCODE -ne 0){throw 'Design validation failed; baseline unchanged.'}
        # Prove the full import can run before replacing the active baseline.
        & node (Join-Path $PSScriptRoot 'generate.cjs') --input $Design --output (Join-Path $projectRoot '.local-backup\approved-candidate') --time $Time --mode $Mode
        if($LASTEXITCODE -ne 0){throw 'Design generation failed; baseline unchanged.'}
        & node (Join-Path $PSScriptRoot 'check-aod.cjs') (Join-Path $projectRoot '.local-backup\approved-candidate')
        if($LASTEXITCODE -ne 0){throw 'AOD validation failed; baseline unchanged.'}
        $archive=Join-Path $projectRoot 'design\history'
        New-Item -ItemType Directory -Path $archive -Force | Out-Null
        $oldHash=(Get-FileHash -LiteralPath $baseline -Algorithm SHA256).Hash.ToLowerInvariant()
        $oldPath=Join-Path $archive ($oldHash+'.json')
        if(!(Test-Path -LiteralPath $oldPath)){Copy-Item -LiteralPath $baseline -Destination $oldPath}
        Copy-Item -LiteralPath $Design -Destination ($baseline+'.tmp')
        Move-Item -LiteralPath ($baseline+'.tmp') -Destination $baseline -Force
    }
}
& node (Join-Path $PSScriptRoot 'generate.cjs') --input $baseline --time $Time --mode $Mode
if($LASTEXITCODE -ne 0){throw 'Generation failed; no build attempted.'}
& node (Join-Path $PSScriptRoot 'check-aod.cjs') (Join-Path $projectRoot 'generated')
if($LASTEXITCODE -ne 0){throw 'AOD validation failed; no build attempted.'}
$buildArgs=@{}
if($SdkPath){$buildArgs.SdkPath=$SdkPath};if($JavaPath){$buildArgs.JavaPath=$JavaPath};if($KeyPath){$buildArgs.KeyPath=$KeyPath}
& (Join-Path $PSScriptRoot 'Build-Watch.ps1') @buildArgs
& (Join-Path $PSScriptRoot 'Build-Watch.ps1') @buildArgs -Preview
Write-Host 'Built live and simulated preview variants. Review generated/capabilities.json.'
Write-Host 'Compare: Run-Simulator.ps1 -Preview, File > Save Screen Capture, then node tools/compare.cjs path-to-capture.png'
if($RunPreview){$runArgs=@{};if($SdkPath){$runArgs.SdkPath=$SdkPath};if($JavaPath){$runArgs.JavaPath=$JavaPath};& (Join-Path $PSScriptRoot 'Run-Simulator.ps1') @runArgs -Preview}
